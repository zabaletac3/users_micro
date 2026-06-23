import * as fs from 'fs';
import * as path from 'path';

import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

import constants from '../../constants';

export enum emailType {
  REGISTER_SUCCESS = 'register_success',
  CODE_VERIFICATION = 'code_verification',
  ADDED_FRIEND = 'added_friend',
  ACCOUNT_ACTIVATION_REQUEST = 'account_activation_request',
}

interface Params {
  [key: string]: string;
}

@Injectable()
export class ResendProvider {
  private readonly logger = new Logger(ResendProvider.name);
  private readonly resend = new Resend(constants.RESEND_API_KEY);

  constructor() {}

  async sendTemplateEmail(payload: {
    email: string;
    type: emailType;
    param: Params;
    subject: string;
  }) {
    try {
      const templates = {
        template: this.getTemplate(payload?.type),
      };

      const html = this.insertParamsIntoHTML(templates['template'], payload?.param);

      return await this.resend.emails.send({
        from: `pangea-notifications <${constants.RESEND_FROM_EMAIL}>`,
        to: [payload.email],
        subject: payload?.subject,
        html,
        headers: {
          'X-Entity-Ref-ID': '1234567891',
        },
      });
    } catch (e) {
      throw new HttpException(e, HttpStatus.BAD_REQUEST);
    }
  }

  async sendGenericEmail(payload: {
    email: string;
    html: string;
    subject: string;
    attachments?: Array<{
      filename: string;
      content: Buffer;
    }>;
  }) {
    try {
      const response = await this.resend.emails.send({
        from: `pangea-notifications <${constants.RESEND_FROM_EMAIL}>`,
        to: [payload.email],
        subject: payload?.subject,
        html: payload?.html,
        attachments: payload?.attachments,
      });

      this.logger.log('Generic email was sended', response);
    } catch (e) {
      this.logger.error(e.message);
    }
  }

  private insertParamsIntoHTML(htmlTemplate: string, params: Params): string {
    let html = htmlTemplate;

    // Reemplazar los parámetros en el HTML
    for (const [key, value] of Object.entries(params)) {
      const regex = new RegExp(`{{${key}}}`, 'g');

      html = html.replace(regex, value);
    }

    return html;
  }

  private getTemplate(type: emailType): string {
    let templatePath: string;

    switch (type) {
      case emailType.CODE_VERIFICATION:
        templatePath = path.join(__dirname, '..', 'templates', 'verification-code-otp.html');
        break;
      case emailType.ACCOUNT_ACTIVATION_REQUEST:
        templatePath = path.join(__dirname, '..', 'templates', 'account-activation.html');
        break;
      default:
        templatePath = path.join(__dirname, '..', 'templates', 'not-found.html');
        break;
    }

    return fs.readFileSync(templatePath, 'utf8');
  }
}
