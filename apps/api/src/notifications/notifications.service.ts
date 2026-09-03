import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import type {
  Notification as NotificationDto,
  NotificationKind,
  NotificationsQuery,
  Page,
} from '@kadro/shared';
import { decodeCursor, encodeCursor } from '../common/cursor';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { Notification, NotificationDocument, NotificationRefs } from './notification.schema';
import { PushService } from './push.service';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private readonly model: Model<Notification>,
    private readonly realtime: RealtimeGateway,
    private readonly push: PushService,
  ) {}

  async notify(
    userId: Types.ObjectId,
    kind: NotificationKind,
    i18nKey: string,
    params: Record<string, string | number>,
    refs: NotificationRefs = {},
  ): Promise<void> {
    const doc = await this.model.create({ userId, kind, i18nKey, params, refs });
    const dto = toNotificationDto(doc);
    this.realtime.emitToUser(userId.toString(), 'notification.new', dto);
    const data: Record<string, string> = { kind };
    for (const [key, value] of Object.entries(dto.refs)) {
      if (value) data[key] = value;
    }
    void this.push.sendToUser(userId, kind, i18nKey, params, data);
  }

  async list(userId: Types.ObjectId, query: NotificationsQuery): Promise<Page<NotificationDto>> {
    const filter: FilterQuery<Notification> = { userId };
    if (query.kind) filter.kind = query.kind;
    const offset = decodeCursor(query.cursor);
    const docs = await this.model
      .find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(offset)
      .limit(query.limit + 1)
      .exec();
    const hasMore = docs.length > query.limit;
    return {
      items: docs.slice(0, query.limit).map(toNotificationDto),
      nextCursor: hasMore ? encodeCursor(offset + query.limit) : null,
    };
  }

  async markRead(userId: Types.ObjectId, ids?: string[]): Promise<void> {
    const filter: FilterQuery<Notification> = { userId, readAt: null };
    if (ids?.length) filter._id = { $in: ids.map((id) => new Types.ObjectId(id)) };
    await this.model.updateMany(filter, { $set: { readAt: new Date() } }).exec();
  }
}

function toNotificationDto(doc: NotificationDocument): NotificationDto {
  return {
    id: doc._id.toString(),
    kind: doc.kind,
    i18nKey: doc.i18nKey,
    params: doc.params,
    refs: {
      athleteId: doc.refs.athleteId?.toString(),
      completedSessionId: doc.refs.completedSessionId?.toString(),
      conversationId: doc.refs.conversationId?.toString(),
      alertId: doc.refs.alertId?.toString(),
    },
    readAt: doc.readAt?.toISOString() ?? null,
    createdAt: (doc as unknown as { createdAt: Date }).createdAt.toISOString(),
  };
}
