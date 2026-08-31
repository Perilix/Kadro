import * as argon2 from 'argon2';
import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { Types } from 'mongoose';
import type { AuthSession, Login, Me, RegisterCoach, User as UserDto } from '@kadro/shared';
import { isDuplicateKeyError, TeamsService } from '../teams/teams.service';
import { UsersService } from '../users/users.service';
import { AthletesService } from '../athletes/athletes.service';
import type { UserDocument } from '../users/user.schema';
import type { JwtPayload } from './jwt-payload';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly teams: TeamsService,
    private readonly athletes: AthletesService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async registerCoach(dto: RegisterCoach): Promise<AuthSession> {
    let user: UserDocument;
    try {
      user = await this.users.create({
        email: dto.email,
        passwordHash: await argon2.hash(dto.password),
        role: 'coach',
        firstName: dto.firstName,
        lastName: dto.lastName,
        locale: dto.locale,
        timezone: dto.timezone,
      });
    } catch (err) {
      if (isDuplicateKeyError(err)) throw new ConflictException({ code: 'auth.email_taken' });
      throw err;
    }
    const team = await this.teams.createForCoach(user._id, dto.teamName ?? `Équipe de ${dto.firstName}`);
    return this.buildSession(user, { teamId: team._id.toString() });
  }

  async login(dto: Login): Promise<AuthSession> {
    const user = await this.users.findByEmail(dto.email);
    if (!user || !(await argon2.verify(user.passwordHash, dto.password))) {
      throw new UnauthorizedException({ code: 'auth.invalid_credentials' });
    }
    await this.users.touchLogin(user._id);
    return this.buildSession(user, await this.contextClaims(user));
  }

  async refresh(refreshToken: string): Promise<AuthSession> {
    let payload: JwtPayload;
    try {
      payload = this.jwt.verify<JwtPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException({ code: 'auth.invalid_token' });
    }
    if (payload.type !== 'refresh') throw new UnauthorizedException({ code: 'auth.invalid_token' });

    const user = await this.users.findById(payload.sub);
    if (!user?.refreshTokenHash || !(await argon2.verify(user.refreshTokenHash, refreshToken))) {
      throw new UnauthorizedException({ code: 'auth.invalid_token' });
    }
    return this.buildSession(user, await this.contextClaims(user)); // rotation
  }

  async logout(userId: string): Promise<void> {
    await this.users.setRefreshTokenHash(new Types.ObjectId(userId), null);
  }

  async me(payload: JwtPayload): Promise<Me> {
    const user = await this.users.findById(payload.sub);
    if (!user) throw new UnauthorizedException({ code: 'auth.invalid_token' });

    const me: Me = { user: toUserDto(user), team: null, athlete: null };
    if (user.role === 'coach') {
      const team = await this.teams.findByCoachId(user._id);
      if (team) {
        me.team = {
          id: team._id.toString(),
          name: team.name,
          inviteCode: team.inviteCode,
          plan: team.subscription.plan,
          athleteLimit: team.subscription.athleteLimit,
          athleteCount: await this.athletes.countActive(team._id),
          trialEndsAt: team.subscription.trialEndsAt?.toISOString() ?? null,
        };
      }
    } else {
      const athlete = await this.athletes.findByUserId(user._id);
      if (athlete) {
        const coach = await this.users.findById(athlete.coachId);
        me.athlete = {
          id: athlete._id.toString(),
          teamId: athlete.teamId.toString(),
          coachName: coach ? `${coach.firstName} ${coach.lastName}` : '',
        };
      }
    }
    return me;
  }

  /** Signe access + refresh (rotation), stocke le hash du refresh. Utilisé aussi par InviteService. */
  async buildSession(user: UserDocument, extra: Omit<Partial<JwtPayload>, 'sub' | 'role' | 'type'>): Promise<AuthSession> {
    const base = { sub: user._id.toString(), role: user.role, ...extra };
    const ttl = (key: string, fallback: string): JwtSignOptions['expiresIn'] =>
      (this.config.get<string>(key) ?? fallback) as JwtSignOptions['expiresIn'];
    const accessToken = this.jwt.sign(
      { ...base, type: 'access' },
      {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: ttl('JWT_ACCESS_TTL', '15m'),
      },
    );
    const refreshToken = this.jwt.sign(
      { ...base, type: 'refresh' },
      {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: ttl('JWT_REFRESH_TTL', '30d'),
      },
    );
    await this.users.setRefreshTokenHash(user._id, await argon2.hash(refreshToken));
    return { user: toUserDto(user), accessToken, refreshToken };
  }

  private async contextClaims(user: UserDocument): Promise<Omit<Partial<JwtPayload>, 'sub' | 'role' | 'type'>> {
    if (user.role === 'coach') {
      const team = await this.teams.findByCoachId(user._id);
      return team ? { teamId: team._id.toString() } : {};
    }
    const athlete = await this.athletes.findByUserId(user._id);
    return athlete ? { teamId: athlete.teamId.toString(), athleteId: athlete._id.toString() } : {};
  }
}

export function toUserDto(user: UserDocument): UserDto {
  return {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    locale: user.locale,
    timezone: user.timezone,
  };
}
