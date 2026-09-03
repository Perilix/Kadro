import { Injectable, Logger } from '@nestjs/common';
import type { Types } from 'mongoose';
import type { NotificationKind } from '@kadro/shared';
import { UsersService } from '../users/users.service';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface ExpoPushTicket {
  status: 'ok' | 'error';
  details?: { error?: string };
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(private readonly users: UsersService) {}

  async sendToUser(
    userId: Types.ObjectId,
    kind: NotificationKind,
    i18nKey: string,
    params: Record<string, string | number>,
    data: Record<string, string>,
  ): Promise<void> {
    const user = await this.users.findById(userId);
    if (!user || !user.notificationPrefs.push || user.pushTokens.length === 0) return;
    const { title, body } = pushCopy(kind, i18nKey, params);
    const messages = user.pushTokens.map((t) => ({
      to: t.expoToken,
      title,
      body,
      data,
      sound: 'default' as const,
      channelId: 'default',
    }));
    for (let i = 0; i < messages.length; i += 100) {
      const batch = messages.slice(i, i + 100);
      try {
        const res = await fetch(EXPO_PUSH_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(batch),
        });
        if (!res.ok) {
          this.logger.warn(`expo push http ${res.status}`);
          continue;
        }
        const payload = (await res.json()) as { data?: ExpoPushTicket[] };
        await Promise.all(
          (payload.data ?? []).map((ticket, j) => {
            const target = batch[j];
            return target && ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered'
              ? this.users.removePushToken(userId, target.to)
              : Promise.resolve();
          }),
        );
      } catch (err) {
        this.logger.warn(`expo push failed: ${String(err)}`);
      }
    }
  }
}

function pushCopy(
  kind: NotificationKind,
  i18nKey: string,
  params: Record<string, string | number>,
): { title: string; body: string } {
  const from = params['from'] != null ? String(params['from']) : '';
  switch (i18nKey) {
    case 'notification.new_message':
      return {
        title: 'Nouveau message',
        body: from ? `${from} vous a écrit` : 'Vous avez reçu un message',
      };
    case 'notification.session_feedback':
      return {
        title: 'Compte-rendu reçu',
        body: `${from} a envoyé son compte-rendu${params['rpe'] != null ? ` — RPE ${params['rpe']}/10` : ''}`,
      };
    default: {
      const titles: Record<NotificationKind, string> = {
        form: 'Alerte de forme',
        session: 'Séance',
        message: 'Message',
        team: 'Équipe',
        billing: 'Abonnement',
      };
      return { title: titles[kind], body: from };
    }
  }
}
