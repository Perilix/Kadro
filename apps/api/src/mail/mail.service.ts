import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface InvitationMail {
  to: string;
  athleteName: string | null;
  coachName: string;
  teamName: string;
  code: string;
  joinUrl: string;
  reminder: boolean;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {}

  get isConfigured(): boolean {
    return Boolean(this.config.get('RESEND_API_KEY'));
  }

  async sendInvitation(mail: InvitationMail): Promise<void> {
    const subject = mail.reminder
      ? `Rappel — ${mail.coachName} vous attend sur Kadro`
      : `${mail.coachName} vous invite à rejoindre ${mail.teamName} sur Kadro`;
    await this.send(mail.to, subject, invitationHtml(mail));
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    const key = this.config.get<string>('RESEND_API_KEY');
    if (!key) {
      this.logger.log(`e-mail non envoyé (RESEND_API_KEY absent) : ${subject} → ${to}`);
      return;
    }
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: this.config.get<string>('MAIL_FROM') ?? 'Kadro <onboarding@resend.dev>',
          to: [to],
          subject,
          html,
        }),
      });
      if (!res.ok) {
        this.logger.warn(`envoi e-mail refusé (${res.status}) : ${await res.text().catch(() => '')}`);
      }
    } catch (err) {
      this.logger.warn(`envoi e-mail échoué : ${String(err)}`);
    }
  }
}

function invitationHtml(mail: InvitationMail): string {
  const hello = mail.athleteName ? `Bonjour ${mail.athleteName},` : 'Bonjour,';
  return `<!doctype html>
<html lang="fr">
<body style="margin:0;padding:32px 16px;background:#F6F6F3;font-family:Helvetica,Arial,sans-serif;color:#101820;">
  <div style="max-width:440px;margin:0 auto;background:#FFFFFF;border:1px solid #E8E8E3;border-radius:14px;padding:32px;">
    <div style="font-size:18px;font-weight:700;margin-bottom:20px;">Kadro</div>
    <p style="margin:0 0 12px;line-height:1.5;">${hello}</p>
    <p style="margin:0 0 20px;line-height:1.5;">
      <strong>${mail.coachName}</strong> vous invite à rejoindre l'équipe
      <strong>${mail.teamName}</strong> sur Kadro : vos séances personnalisées, votre check-in du
      matin et vos échanges avec votre coach, au même endroit. C'est gratuit pour vous.
    </p>
    <div style="background:#ECEAFD;border-radius:10px;padding:14px;text-align:center;margin-bottom:20px;">
      <div style="font-size:12px;color:#4338CA;margin-bottom:4px;">Votre code d'équipe</div>
      <div style="font-size:22px;font-weight:700;letter-spacing:2px;color:#4338CA;">${mail.code}</div>
    </div>
    <p style="text-align:center;margin:0 0 24px;">
      <a href="${mail.joinUrl}" style="display:inline-block;background:#101820;color:#FFFFFF;text-decoration:none;border-radius:10px;padding:12px 24px;font-weight:600;">Rejoindre l'équipe</a>
    </p>
    <p style="margin:0;font-size:12px;color:#8C949D;line-height:1.5;">
      Le bouton ne fonctionne pas ? Téléchargez l'app Kadro et entrez le code ${mail.code} à l'inscription.
    </p>
  </div>
</body>
</html>`;
}
