import { Injectable } from '@nestjs/common';
import type { MailMessage, MailPort } from '@webcat/contracts';
import { LoggerService } from '../../logger/logger.service';

/**
 * Mail dev: menulis isi email ke log agar OTP/undangan bisa diambil
 * saat pengembangan tanpa layanan eksternal.
 */
@Injectable()
export class ConsoleMail implements MailPort {
  constructor(private readonly logger: LoggerService) {}

  async send(message: MailMessage): Promise<void> {
    this.logger.info('Email (console mode)', {
      to: message.to,
      subject: message.subject,
      preview: message.text ?? message.html.replace(/<[^>]+>/g, ' ').slice(0, 300),
    });
  }
}
