import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type {
  Conversation as ConversationDto,
  Message as MessageDto,
  MessageCreate,
  MessagesQuery,
  Page,
} from '@kadro/shared';
import { Athlete } from '../athletes/athlete.schema';
import type { JwtPayload } from '../auth/jwt-payload';
import { decodeCursor, encodeCursor } from '../common/cursor';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { UsersService } from '../users/users.service';
import { Conversation, ConversationDocument } from './conversation.schema';
import { Message, MessageDocument } from './message.schema';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Conversation.name) private readonly conversations: Model<Conversation>,
    @InjectModel(Message.name) private readonly messages: Model<Message>,
    @InjectModel(Athlete.name) private readonly athletes: Model<Athlete>,
    private readonly users: UsersService,
    private readonly realtime: RealtimeGateway,
    private readonly notifications: NotificationsService,
  ) {}

  async listConversations(user: JwtPayload): Promise<ConversationDto[]> {
    if (user.role === 'coach') return this.listForCoach(new Types.ObjectId(user.teamId));
    return this.listForAthlete(new Types.ObjectId(user.athleteId));
  }

  private async listForCoach(teamId: Types.ObjectId): Promise<ConversationDto[]> {
    const roster = await this.athletes.find({ teamId, status: 'active' }).exec();
    await Promise.all(
      roster.map((a) =>
        this.conversations
          .updateOne(
            { teamId, athleteId: a._id, coachId: a.coachId },
            { $setOnInsert: { lastMessageAt: null, lastMessagePreview: '', unreadByCoach: 0, unreadByAthlete: 0 } },
            { upsert: true },
          )
          .exec(),
      ),
    );
    const docs = await this.conversations
      .find({ teamId, athleteId: { $in: roster.map((a) => a._id) } })
      .sort({ lastMessageAt: -1 })
      .exec();
    const nameByAthlete = new Map(
      await Promise.all(
        roster.map(async (a) => {
          const u = await this.users.findById(a.userId);
          return [a._id.toString(), u ? `${u.firstName} ${u.lastName}` : ''] as const;
        }),
      ),
    );
    return docs.map((doc) =>
      toConversationDto(doc, nameByAthlete.get(doc.athleteId.toString()) ?? '', 'coach'),
    );
  }

  private async listForAthlete(athleteId: Types.ObjectId): Promise<ConversationDto[]> {
    const athlete = await this.athletes.findById(athleteId).exec();
    if (!athlete) throw new NotFoundException({ code: 'athlete.not_found' });
    const doc = await this.conversations
      .findOneAndUpdate(
        { teamId: athlete.teamId, athleteId, coachId: athlete.coachId },
        { $setOnInsert: { lastMessageAt: null, lastMessagePreview: '', unreadByCoach: 0, unreadByAthlete: 0 } },
        { upsert: true, new: true },
      )
      .exec();
    const coach = await this.users.findById(athlete.coachId);
    return [toConversationDto(doc, coach ? `${coach.firstName} ${coach.lastName}` : '', 'athlete')];
  }

  async listMessages(
    user: JwtPayload,
    conversationId: Types.ObjectId,
    query: MessagesQuery,
  ): Promise<Page<MessageDto>> {
    await this.requireAccess(user, conversationId);
    const offset = decodeCursor(query.cursor);
    const docs = await this.messages
      .find({ conversationId })
      .sort({ sentAt: -1, _id: -1 })
      .skip(offset)
      .limit(query.limit + 1)
      .exec();
    const hasMore = docs.length > query.limit;
    return {
      items: docs.slice(0, query.limit).map(toMessageDto),
      nextCursor: hasMore ? encodeCursor(offset + query.limit) : null,
    };
  }

  async send(user: JwtPayload, conversationId: Types.ObjectId, dto: MessageCreate): Promise<MessageDto> {
    const conversation = await this.requireAccess(user, conversationId);
    const senderId = new Types.ObjectId(user.sub);
    const message = await this.messages.create({
      conversationId,
      senderId,
      type: dto.type,
      text: dto.text,
      ref: dto.ref
        ? {
            plannedSessionId: toObjectIdOrUndefined(dto.ref.plannedSessionId),
            completedSessionId: toObjectIdOrUndefined(dto.ref.completedSessionId),
            templateId: toObjectIdOrUndefined(dto.ref.templateId),
          }
        : null,
      sentAt: new Date(),
    });

    const unreadField = user.role === 'coach' ? 'unreadByAthlete' : 'unreadByCoach';
    await this.conversations
      .updateOne(
        { _id: conversationId },
        {
          $set: { lastMessageAt: message.sentAt, lastMessagePreview: preview(message) },
          $inc: { [unreadField]: 1 },
        },
      )
      .exec();

    const recipientId = await this.recipientUserId(user, conversation);
    const messageDto = toMessageDto(message);
    this.realtime.emitToUser(recipientId.toString(), 'message.new', messageDto);
    this.realtime.emitToUser(user.sub, 'message.new', messageDto);

    const sender = await this.users.findById(senderId);
    await this.notifications.notify(
      recipientId,
      'message',
      'notification.new_message',
      { from: sender ? `${sender.firstName} ${sender.lastName}` : '' },
      { conversationId, athleteId: conversation.athleteId },
    );
    return messageDto;
  }

  async markRead(user: JwtPayload, conversationId: Types.ObjectId): Promise<void> {
    const conversation = await this.requireAccess(user, conversationId);
    const me = new Types.ObjectId(user.sub);
    await this.messages
      .updateMany(
        { conversationId, senderId: { $ne: me }, readAt: null },
        { $set: { readAt: new Date() } },
      )
      .exec();
    const unreadField = user.role === 'coach' ? 'unreadByCoach' : 'unreadByAthlete';
    await this.conversations.updateOne({ _id: conversationId }, { $set: { [unreadField]: 0 } }).exec();
    const other = await this.recipientUserId(user, conversation);
    this.realtime.emitToUser(other.toString(), 'message.read', {
      conversationId: conversationId.toString(),
      by: user.sub,
    });
  }

  private async requireAccess(
    user: JwtPayload,
    conversationId: Types.ObjectId,
  ): Promise<ConversationDocument> {
    const doc = await this.conversations.findById(conversationId).exec();
    if (!doc) throw new NotFoundException({ code: 'conversation.not_found' });
    if (user.role === 'coach') {
      if (doc.teamId.toString() !== user.teamId) {
        throw new ForbiddenException({ code: 'conversation.forbidden' });
      }
    } else if (doc.athleteId.toString() !== user.athleteId) {
      throw new ForbiddenException({ code: 'conversation.forbidden' });
    }
    return doc;
  }

  private async recipientUserId(
    sender: JwtPayload,
    conversation: ConversationDocument,
  ): Promise<Types.ObjectId> {
    if (sender.role === 'coach') {
      const athlete = await this.athletes.findById(conversation.athleteId).exec();
      if (!athlete) throw new NotFoundException({ code: 'athlete.not_found' });
      return athlete.userId;
    }
    return conversation.coachId;
  }
}

function toConversationDto(
  doc: ConversationDocument,
  name: string,
  viewer: 'coach' | 'athlete',
): ConversationDto {
  return {
    id: doc._id.toString(),
    athleteId: doc.athleteId.toString(),
    name,
    lastMessageAt: doc.lastMessageAt?.toISOString() ?? null,
    lastMessagePreview: doc.lastMessagePreview,
    unread: viewer === 'coach' ? doc.unreadByCoach : doc.unreadByAthlete,
  };
}

function toMessageDto(doc: MessageDocument): MessageDto {
  return {
    id: doc._id.toString(),
    conversationId: doc.conversationId.toString(),
    senderId: doc.senderId.toString(),
    type: doc.type,
    text: doc.text,
    ref: doc.ref
      ? {
          plannedSessionId: doc.ref.plannedSessionId?.toString(),
          completedSessionId: doc.ref.completedSessionId?.toString(),
          templateId: doc.ref.templateId?.toString(),
        }
      : null,
    sentAt: doc.sentAt.toISOString(),
    readAt: doc.readAt?.toISOString() ?? null,
  };
}

function preview(message: MessageDocument): string {
  return (message.text ?? `[${message.type}]`).slice(0, 120);
}

function toObjectIdOrUndefined(id: string | undefined): Types.ObjectId | undefined {
  return id ? new Types.ObjectId(id) : undefined;
}
