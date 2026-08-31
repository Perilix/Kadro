import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import type { Alert as AlertDto, AlertKind, AlertSeverity, AlertsQuery, Page } from '@kadro/shared';
import { decodeCursor, encodeCursor } from '../common/cursor';
import { Alert, AlertDocument, AlertRefs } from './alert.schema';

export interface OpenAlertInput {
  teamId: Types.ObjectId;
  athleteId: Types.ObjectId;
  kind: AlertKind;
  severity: AlertSeverity;
  i18nKey: string;
  params: Record<string, string | number>;
  suggestedAction: string | null;
  refs?: AlertRefs;
}

@Injectable()
export class AlertsService {
  constructor(@InjectModel(Alert.name) private readonly model: Model<Alert>) {}

  async open(input: OpenAlertInput): Promise<void> {
    await this.model
      .updateOne(
        { athleteId: input.athleteId, kind: input.kind, status: 'open' },
        {
          $set: {
            severity: input.severity,
            i18nKey: input.i18nKey,
            params: input.params,
            suggestedAction: input.suggestedAction,
            refs: input.refs ?? {},
          },
          $setOnInsert: { teamId: input.teamId, status: 'open' },
        },
        { upsert: true },
      )
      .exec();
  }

  async list(teamId: Types.ObjectId, query: AlertsQuery): Promise<Page<AlertDto>> {
    const filter: FilterQuery<Alert> = { teamId, status: query.status };
    if (query.athleteId) filter.athleteId = new Types.ObjectId(query.athleteId);
    const offset = decodeCursor(query.cursor);
    const docs = await this.model
      .find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(offset)
      .limit(query.limit + 1)
      .exec();
    const hasMore = docs.length > query.limit;
    return {
      items: docs.slice(0, query.limit).map(toAlertDto),
      nextCursor: hasMore ? encodeCursor(offset + query.limit) : null,
    };
  }

  async close(
    teamId: Types.ObjectId,
    id: Types.ObjectId,
    status: 'resolved' | 'dismissed',
    resolvedById: Types.ObjectId,
  ): Promise<AlertDto> {
    const doc = await this.model
      .findOneAndUpdate(
        { _id: id, teamId, status: 'open' },
        { $set: { status, resolvedAt: new Date(), resolvedById } },
        { new: true },
      )
      .exec();
    if (!doc) throw new NotFoundException({ code: 'alert.not_found' });
    return toAlertDto(doc);
  }

  countOpen(teamId: Types.ObjectId): Promise<number> {
    return this.model.countDocuments({ teamId, status: 'open' }).exec();
  }
}

function toAlertDto(doc: AlertDocument): AlertDto {
  return {
    id: doc._id.toString(),
    athleteId: doc.athleteId.toString(),
    kind: doc.kind,
    severity: doc.severity,
    i18nKey: doc.i18nKey,
    params: doc.params,
    suggestedAction: (doc.suggestedAction as AlertDto['suggestedAction']) ?? null,
    refs: {
      plannedSessionId: doc.refs.plannedSessionId?.toString(),
      checkinId: doc.refs.checkinId?.toString(),
    },
    status: doc.status,
    createdAt: (doc as unknown as { createdAt: Date }).createdAt.toISOString(),
    resolvedAt: doc.resolvedAt?.toISOString() ?? null,
    resolvedById: doc.resolvedById?.toString() ?? null,
  };
}
