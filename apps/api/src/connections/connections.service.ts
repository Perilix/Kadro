import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  NotImplementedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Model, Types } from 'mongoose';
import type { Connection as ConnectionDto, Provider, TeamConnections } from '@kadro/shared';
import { ActivitiesService } from '../activities/activities.service';
import { Athlete } from '../athletes/athlete.schema';
import { decryptToken, encryptToken } from '../common/token-crypto';
import { UsersService } from '../users/users.service';
import { DeviceConnection, DeviceConnectionDocument } from './device-connection.schema';
import { PolarService } from './polar.service';
import { StravaService } from './strava.service';
import type { MappedActivity } from './strava.service';
import { WebhookEvent } from './webhook-event.schema';

interface OauthState {
  athleteId: string;
  provider: Provider;
  type: 'oauth_state';
  platform: 'mobile' | 'web';
}

@Injectable()
export class ConnectionsService {
  private readonly logger = new Logger(ConnectionsService.name);

  constructor(
    @InjectModel(DeviceConnection.name) private readonly model: Model<DeviceConnection>,
    @InjectModel(WebhookEvent.name) private readonly events: Model<WebhookEvent>,
    @InjectModel(Athlete.name) private readonly athletes: Model<Athlete>,
    private readonly strava: StravaService,
    private readonly polar: PolarService,
    private readonly activities: ActivitiesService,
    private readonly users: UsersService,
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
  ) {}

  async listMine(athleteId: Types.ObjectId): Promise<ConnectionDto[]> {
    const docs = await this.model.find({ athleteId, status: { $ne: 'revoked' } }).exec();
    return docs.map(toConnectionDto);
  }

  authorize(athleteId: Types.ObjectId, provider: string, platform: 'mobile' | 'web'): { url: string } {
    if (provider !== 'strava' && provider !== 'polar') {
      throw new NotImplementedException({ code: 'connection.provider_not_supported' });
    }
    const state = this.jwt.sign(
      { athleteId: athleteId.toString(), provider: provider as Provider, type: 'oauth_state', platform } satisfies OauthState,
      { secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'), expiresIn: '10m' },
    );
    return {
      url: provider === 'strava' ? this.strava.authorizeUrl(state) : this.polar.authorizeUrl(state),
    };
  }

  async handleCallback(provider: string, code: string | undefined, state: string | undefined): Promise<string> {
    let redirect = this.config.getOrThrow<string>('MOBILE_REDIRECT_URL');
    if ((provider !== 'strava' && provider !== 'polar') || !code || !state) {
      return `${redirect}?status=error`;
    }
    let payload: OauthState;
    try {
      payload = this.jwt.verify<OauthState>(state, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
      if (payload.type !== 'oauth_state') throw new Error('invalid');
    } catch {
      return `${redirect}?status=invalid_state`;
    }
    if (payload.platform === 'web') {
      redirect = `${this.config.getOrThrow<string>('WEB_APP_URL')}/moi/profil`;
    }
    const athlete = await this.athletes.findById(payload.athleteId).exec();
    if (!athlete) return `${redirect}?status=error`;

    let connection: DeviceConnectionDocument;
    if (provider === 'strava') {
      const tokens = await this.strava.exchangeCode(code);
      connection = await this.upsertConnection(athlete._id, athlete.teamId, 'strava', {
        ...tokens,
        capabilities: { pushWorkout: false, pullActivities: true, pullSleep: false, pullHrv: false, pullWeight: false },
      });
    } else {
      const tokens = await this.polar.exchangeCode(code);
      await this.polar.registerUser(tokens.accessToken, athlete._id.toString()).catch(() => undefined);
      connection = await this.upsertConnection(athlete._id, athlete.teamId, 'polar', {
        accessToken: tokens.accessToken,
        refreshToken: null,
        expiresAt: tokens.expiresAt,
        externalUserId: tokens.externalUserId,
        scopes: ['accesslink.read_all'],
        capabilities: { pushWorkout: false, pullActivities: true, pullSleep: true, pullHrv: true, pullWeight: false },
      });
    }
    await this.syncConnection(connection).catch((err) =>
      this.logger.warn(`sync initiale ${provider} échouée : ${String(err)}`),
    );
    return `${redirect}?status=connected&provider=${provider}`;
  }

  async disconnect(athleteId: Types.ObjectId, provider: string): Promise<void> {
    const doc = await this.model.findOne({ athleteId, provider, status: { $ne: 'revoked' } }).exec();
    if (!doc) throw new NotFoundException({ code: 'connection.not_found' });
    if (provider === 'strava') {
      await this.strava.deauthorize(this.decrypt(doc.accessTokenEnc)).catch(() => undefined);
    } else if (provider === 'polar') {
      await this.polar
        .deauthorize(this.decrypt(doc.accessTokenEnc), doc.externalUserId)
        .catch(() => undefined);
    }
    doc.status = 'revoked';
    doc.isPrimaryPush = false;
    await doc.save();
  }

  async requestSync(athleteId: Types.ObjectId, provider: string): Promise<void> {
    const doc = await this.model.findOne({ athleteId, provider, status: 'connected' }).exec();
    if (!doc) throw new NotFoundException({ code: 'connection.not_found' });
    await this.syncConnection(doc);
  }

  async teamOverview(teamId: Types.ObjectId): Promise<TeamConnections> {
    const [connections, athleteCount] = await Promise.all([
      this.model.find({ teamId, status: { $ne: 'revoked' } }).exec(),
      this.athletes.countDocuments({ teamId, status: 'active' }).exec(),
    ]);
    const byProvider = new Map<Provider, { count: number; error: boolean }>();
    for (const c of connections) {
      const entry = byProvider.get(c.provider) ?? { count: 0, error: false };
      entry.count += 1;
      if (c.status === 'error') entry.error = true;
      byProvider.set(c.provider, entry);
    }
    const issues: TeamConnections['issues'] = [];
    for (const c of connections.filter((x) => x.status === 'error' && x.lastError)) {
      const athlete = await this.athletes.findById(c.athleteId).exec();
      const user = athlete ? await this.users.findById(athlete.userId) : null;
      issues.push({
        athleteId: c.athleteId.toString(),
        athleteName: user ? `${user.firstName} ${user.lastName}` : '',
        provider: c.provider,
        i18nKey: c.lastError?.i18nKey ?? 'connection.error',
        at: (c.lastError?.at ?? new Date()).toISOString(),
      });
    }
    return {
      kpis: {
        athletesConnected: new Set(
          connections.filter((c) => c.status === 'connected').map((c) => c.athleteId.toString()),
        ).size,
        athletesTotal: athleteCount,
        issues: issues.length,
      },
      providers: [...byProvider.entries()].map(([provider, entry]) => ({
        provider,
        athleteCount: entry.count,
        status: entry.error ? 'error' : 'ok',
      })),
      issues,
    };
  }

  async handleStravaWebhook(body: {
    object_type?: string;
    object_id?: number;
    aspect_type?: string;
    owner_id?: number;
    event_time?: number;
  }): Promise<void> {
    if (body.object_type !== 'activity' || body.aspect_type !== 'create') return;
    const eventId = `${body.object_id}:${body.aspect_type}:${body.event_time}`;
    try {
      await this.events.create({ provider: 'strava', externalEventId: eventId, receivedAt: new Date() });
    } catch {
      return;
    }
    try {
      const connection = await this.model
        .findOne({ provider: 'strava', externalUserId: String(body.owner_id), status: 'connected' })
        .exec();
      if (!connection) throw new Error('connection inconnue');
      const token = await this.freshAccessToken(connection);
      const activity = await this.strava.fetchActivity(token, String(body.object_id));
      await this.importActivity(connection, this.strava.mapActivity(activity));
      await this.events
        .updateOne(
          { provider: 'strava', externalEventId: eventId },
          { $set: { status: 'processed', processedAt: new Date() } },
        )
        .exec();
    } catch (err) {
      await this.events
        .updateOne(
          { provider: 'strava', externalEventId: eventId },
          { $set: { status: 'failed', error: String(err).slice(0, 300) } },
        )
        .exec();
    }
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async refreshExpiringTokens(): Promise<void> {
    const soon = new Date(Date.now() + 3600 * 1000);
    const expiring = await this.model
      .find({ status: 'connected', refreshTokenEnc: { $ne: null }, tokenExpiresAt: { $lt: soon } })
      .exec();
    for (const connection of expiring) {
      await this.freshAccessToken(connection).catch(() => undefined);
    }
  }

  private async syncConnection(connection: DeviceConnectionDocument): Promise<void> {
    const token = await this.freshAccessToken(connection);
    let mapped: MappedActivity[];
    if (connection.provider === 'strava') {
      const after = Math.floor(
        (connection.lastSyncAt?.getTime() ?? Date.now() - 30 * 24 * 3600 * 1000) / 1000,
      );
      mapped = (await this.strava.fetchActivities(token, after)).map((a) => this.strava.mapActivity(a));
    } else {
      mapped = (await this.polar.fetchExercises(token)).map((e) => this.polar.mapExercise(e));
    }
    for (const activity of mapped) {
      await this.importActivity(connection, activity);
    }
    connection.lastSyncAt = new Date();
    connection.lastError = null;
    await connection.save();
  }

  async handlePolarWebhook(body: {
    event?: string;
    user_id?: number;
    entity_id?: string;
    timestamp?: string;
    url?: string;
  }): Promise<void> {
    if (body.event !== 'EXERCISE' || !body.entity_id) return;
    const eventId = `${body.entity_id}:${body.timestamp ?? ''}`;
    try {
      await this.events.create({ provider: 'polar', externalEventId: eventId, receivedAt: new Date() });
    } catch {
      return;
    }
    try {
      const connection = await this.model
        .findOne({ provider: 'polar', externalUserId: String(body.user_id), status: 'connected' })
        .exec();
      if (!connection) throw new Error('connection inconnue');
      const token = await this.freshAccessToken(connection);
      const exercise = body.url
        ? await this.polar.fetchExerciseByUrl(token, body.url)
        : (await this.polar.fetchExercises(token)).find((e) => e.id === body.entity_id);
      if (!exercise) throw new Error('exercice introuvable');
      await this.importActivity(connection, this.polar.mapExercise(exercise));
      await this.events
        .updateOne(
          { provider: 'polar', externalEventId: eventId },
          { $set: { status: 'processed', processedAt: new Date() } },
        )
        .exec();
    } catch (err) {
      await this.events
        .updateOne(
          { provider: 'polar', externalEventId: eventId },
          { $set: { status: 'failed', error: String(err).slice(0, 300) } },
        )
        .exec();
    }
  }

  private async importActivity(connection: DeviceConnectionDocument, mapped: MappedActivity): Promise<void> {
    await this.activities.importExternal({
      teamId: connection.teamId,
      athleteId: connection.athleteId,
      source: connection.provider as 'strava' | 'polar',
      ...mapped,
    });
  }

  private async freshAccessToken(connection: DeviceConnectionDocument): Promise<string> {
    const expiresSoon =
      connection.tokenExpiresAt != null && connection.tokenExpiresAt.getTime() < Date.now() + 5 * 60 * 1000;
    if (!expiresSoon) return this.decrypt(connection.accessTokenEnc);
    if (!connection.refreshTokenEnc) return this.decrypt(connection.accessTokenEnc);
    try {
      const tokens = await this.strava.refresh(this.decrypt(connection.refreshTokenEnc));
      connection.accessTokenEnc = this.encrypt(tokens.accessToken);
      connection.refreshTokenEnc = this.encrypt(tokens.refreshToken);
      connection.tokenExpiresAt = tokens.expiresAt;
      await connection.save();
      return tokens.accessToken;
    } catch (err) {
      connection.status = 'error';
      connection.lastError = { at: new Date(), i18nKey: 'connection.token_refresh_failed' };
      await connection.save();
      throw err;
    }
  }

  private async upsertConnection(
    athleteId: Types.ObjectId,
    teamId: Types.ObjectId,
    provider: Provider,
    data: {
      accessToken: string;
      refreshToken: string | null;
      expiresAt: Date | null;
      externalUserId: string;
      scopes: string[];
      capabilities: DeviceConnection['capabilities'];
    },
  ): Promise<DeviceConnectionDocument> {
    return this.model
      .findOneAndUpdate(
        { athleteId, provider },
        {
          $set: {
            teamId,
            status: 'connected',
            externalUserId: data.externalUserId,
            accessTokenEnc: this.encrypt(data.accessToken),
            refreshTokenEnc: data.refreshToken ? this.encrypt(data.refreshToken) : null,
            tokenExpiresAt: data.expiresAt,
            scopes: data.scopes,
            capabilities: data.capabilities,
            lastError: null,
          },
        },
        { upsert: true, new: true },
      )
      .exec();
  }

  private encrypt(value: string): string {
    return encryptToken(value, this.encKey());
  }

  private decrypt(value: string): string {
    return decryptToken(value, this.encKey());
  }

  private encKey(): string {
    const key = this.config.get<string>('TOKENS_ENC_KEY');
    if (!key) throw new BadRequestException({ code: 'connection.encryption_key_missing' });
    return key;
  }
}

function toConnectionDto(doc: DeviceConnectionDocument): ConnectionDto {
  return {
    provider: doc.provider,
    status: doc.status,
    deviceName: doc.deviceName,
    isPrimaryPush: doc.isPrimaryPush,
    capabilities: doc.capabilities,
    lastSyncAt: doc.lastSyncAt?.toISOString() ?? null,
    lastError: doc.lastError
      ? { at: doc.lastError.at.toISOString(), i18nKey: doc.lastError.i18nKey }
      : null,
    connectedAt: (doc as unknown as { connectedAt: Date }).connectedAt.toISOString(),
  };
}
