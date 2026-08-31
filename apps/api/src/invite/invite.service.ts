import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import * as argon2 from 'argon2';
import { Model, Types } from 'mongoose';
import type {
  AuthSession,
  Invitation as InvitationDto,
  InvitationCreate,
  InviteCodeInfo,
  InvitePreview,
  Join,
} from '@kadro/shared';
import { AuthService } from '../auth/auth.service';
import { AthletesService } from '../athletes/athletes.service';
import { MailService } from '../mail/mail.service';
import { isDuplicateKeyError, TeamsService } from '../teams/teams.service';
import { UsersService } from '../users/users.service';
import type { TeamDocument } from '../teams/team.schema';
import { Invitation, InvitationDocument } from './invitation.schema';

@Injectable()
export class InviteService {
  constructor(
    @InjectModel(Invitation.name) private readonly invitations: Model<Invitation>,
    private readonly teams: TeamsService,
    private readonly users: UsersService,
    private readonly athletes: AthletesService,
    private readonly auth: AuthService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}

  /** Public — la carte « Marc · Coach · 18 athlètes » quand le code est reconnu. */
  async preview(code: string): Promise<InvitePreview> {
    const team = await this.findTeamByCode(code);
    const owner = await this.users.findById(team.ownerId);
    return {
      coachName: owner ? `${owner.firstName} ${owner.lastName}` : team.name,
      teamName: team.name,
      athleteCount: await this.athletes.countActive(team._id),
      sports: ['run', 'trail', 'strength'],
    };
  }

  /** Public — crée le compte athlète + son dossier, marque l'invitation e-mail si elle existe. */
  async join(dto: Join): Promise<AuthSession> {
    const team = await this.findTeamByCode(dto.code);

    const activeCount = await this.athletes.countActive(team._id);
    if (activeCount >= team.subscription.athleteLimit) {
      throw new ForbiddenException({ code: 'billing.athlete_limit_reached' });
    }

    let user;
    try {
      user = await this.users.create({
        email: dto.account.email,
        passwordHash: await argon2.hash(dto.account.password),
        role: 'athlete',
        firstName: dto.account.firstName,
        lastName: dto.account.lastName,
        locale: dto.account.locale,
        timezone: dto.account.timezone,
      });
    } catch (err) {
      if (isDuplicateKeyError(err)) throw new ConflictException({ code: 'auth.email_taken' });
      throw err;
    }

    const athlete = await this.athletes.createFromJoin({
      userId: user._id,
      teamId: team._id,
      coachId: team.ownerId,
      profile: dto.profile,
      goal: dto.goal ?? null,
    });

    await this.invitations
      .updateOne(
        { teamId: team._id, email: user.email, status: 'pending' },
        { $set: { status: 'accepted', acceptedByAthleteId: athlete._id, acceptedAt: new Date() } },
      )
      .exec();

    return this.auth.buildSession(user, {
      teamId: team._id.toString(),
      athleteId: athlete._id.toString(),
    });
  }

  codeInfo(team: TeamDocument): InviteCodeInfo {
    const base = this.config.getOrThrow<string>('JOIN_URL_BASE');
    return { code: team.inviteCode, joinUrl: `${base}/${team.inviteCode}` };
  }

  async listInvitations(teamId: Types.ObjectId): Promise<InvitationDto[]> {
    const docs = await this.invitations.find({ teamId, status: { $ne: 'revoked' } }).sort({ sentAt: -1 }).exec();
    return docs.map(toInvitationDto);
  }

  async createInvitation(teamId: Types.ObjectId, dto: InvitationCreate): Promise<InvitationDto> {
    try {
      const doc = await this.invitations.create({ teamId, email: dto.email, name: dto.name ?? null });
      await this.sendInvitationMail(teamId, doc.email, doc.name, false);
      return toInvitationDto(doc);
    } catch (err) {
      if (isDuplicateKeyError(err)) throw new ConflictException({ code: 'invite.already_sent' });
      throw err;
    }
  }

  async remind(teamId: Types.ObjectId, invitationId: string): Promise<InvitationDto> {
    const doc = await this.invitations
      .findOneAndUpdate(
        { _id: new Types.ObjectId(invitationId), teamId, status: 'pending' },
        { $set: { remindedAt: new Date() } },
        { new: true },
      )
      .exec();
    if (!doc) throw new NotFoundException({ code: 'invite.not_found' });
    await this.sendInvitationMail(teamId, doc.email, doc.name, true);
    return toInvitationDto(doc);
  }

  private async sendInvitationMail(
    teamId: Types.ObjectId,
    email: string,
    name: string | null,
    reminder: boolean,
  ): Promise<void> {
    const team = await this.teams.findById(teamId);
    if (!team) return;
    const owner = await this.users.findById(team.ownerId);
    await this.mail.sendInvitation({
      to: email,
      athleteName: name,
      coachName: owner ? `${owner.firstName} ${owner.lastName}` : team.name,
      teamName: team.name,
      code: team.inviteCode,
      joinUrl: this.codeInfo(team).joinUrl,
      reminder,
    });
  }

  async revoke(teamId: Types.ObjectId, invitationId: string): Promise<void> {
    const result = await this.invitations
      .updateOne({ _id: new Types.ObjectId(invitationId), teamId }, { $set: { status: 'revoked' } })
      .exec();
    if (result.matchedCount === 0) throw new NotFoundException({ code: 'invite.not_found' });
  }

  async findTeamByCode(code: string): Promise<TeamDocument> {
    const team = await this.teams.findByInviteCode(code);
    if (!team) throw new NotFoundException({ code: 'invite.code_unknown' });
    return team;
  }
}

function toInvitationDto(doc: InvitationDocument): InvitationDto {
  return {
    id: doc._id.toString(),
    email: doc.email,
    name: doc.name,
    status: doc.status,
    sentAt: doc.sentAt.toISOString(),
    remindedAt: doc.remindedAt?.toISOString() ?? null,
  };
}
