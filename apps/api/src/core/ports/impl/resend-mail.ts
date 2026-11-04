import { Injectable, Logger } from '@nestjs/common';
import type { MailMessage, MailPort } from '@webcat/contracts';
import { AppConfigService } from '../../config/config.service';

interface ResendResponse {
  id?: string;
}

/**
 * Mail produksi: Resend HTTP API.
 *
 * Tidak memakai SDK agar bundle function tetap kecil; cukup satu POST.
 */
@Injectable()
export class ResendMail implements MailPort {
  private readonly logger = new Logger(ResendMail.name);

  constructor(private readonly config: AppConfigService) {}

  async send(message: MailMessage): Promise<void> {
    const apiKey = this.config.value.RESEND_API_KEY;

    if (!apiKey) {
      throw new Error('MAIL=resend membutuhkan RESEND_API_KEY');
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.config.value.MAIL_FROM,
        to: [message.to],
        subject: message.subject,
        html: message.html,
        ...(message.text ? { text: message.text } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      this.logger.error('Resend menolak email', {
        status: response.status,
        detail: detail.slice(0, 300),
      });
      throw new Error(`Pengiriman email gagal (status ${response.status})`);
    }

    const result = (await response.json().catch(() => ({}))) as ResendResponse;
    this.logger.log(`Email terkirim via Resend (${result.id ?? 'tanpa id'}) ke ${message.to}`);
  }
}
