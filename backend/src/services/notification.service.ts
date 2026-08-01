import axios from 'axios';
import * as nodemailer from 'nodemailer';
import { notificationLogger, errorLogger } from '../utils/logger';

export interface ProviderResult {
  status: 'sent' | 'failed';
  deliveryResult: string | null;
  errorMessage: string | null;
}

export interface NotificationProvider {
  send(to: string, message: string, settings: Record<string, string>): Promise<ProviderResult>;
}

// 1. WhatsApp Provider (Twilio REST API)
class WhatsAppProvider implements NotificationProvider {
  async send(to: string, message: string, settings: Record<string, string>): Promise<ProviderResult> {
    const accountSid = settings['twilio_account_sid'] || process.env.TWILIO_ACCOUNT_SID;
    const authToken = settings['twilio_auth_token'] || process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = settings['twilio_whatsapp_number'] || process.env.TWILIO_WHATSAPP_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      return {
        status: 'failed',
        deliveryResult: null,
        errorMessage: 'Missing Twilio WhatsApp credentials in settings or environment variables.',
      };
    }

    try {
      // Ensure phone numbers match WhatsApp prefix format
      const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
      const formattedFrom = fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`;

      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

      const params = new URLSearchParams();
      params.append('To', formattedTo);
      params.append('From', formattedFrom);
      params.append('Body', message);

      const response = await axios.post(url, params.toString(), {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return {
        status: 'sent',
        deliveryResult: `Message SID: ${response.data.sid}. Status: ${response.data.status}`,
        errorMessage: null,
      };
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Unknown Twilio error';
      errorLogger.error('Twilio WhatsApp dispatch failed', err);
      return {
        status: 'failed',
        deliveryResult: null,
        errorMessage: errMsg,
      };
    }
  }
}

// 2. SMS Provider (Twilio SMS REST API)
class SMSProvider implements NotificationProvider {
  async send(to: string, message: string, settings: Record<string, string>): Promise<ProviderResult> {
    const accountSid = settings['twilio_account_sid'] || process.env.TWILIO_ACCOUNT_SID;
    const authToken = settings['twilio_auth_token'] || process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = settings['twilio_phone_number'] || process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      return {
        status: 'failed',
        deliveryResult: null,
        errorMessage: 'Missing Twilio SMS credentials in settings or environment variables.',
      };
    }

    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

      const params = new URLSearchParams();
      params.append('To', to);
      params.append('From', fromNumber);
      params.append('Body', message);

      const response = await axios.post(url, params.toString(), {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return {
        status: 'sent',
        deliveryResult: `SMS Message SID: ${response.data.sid}. Status: ${response.data.status}`,
        errorMessage: null,
      };
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Unknown Twilio SMS error';
      errorLogger.error('Twilio SMS dispatch failed', err);
      return {
        status: 'failed',
        deliveryResult: null,
        errorMessage: errMsg,
      };
    }
  }
}

// 3. Email Provider (NodeMailer SMTP transport)
class EmailProvider implements NotificationProvider {
  async send(to: string, message: string, settings: Record<string, string>): Promise<ProviderResult> {
    const host = settings['smtp_host'] || process.env.SMTP_HOST;
    const port = Number(settings['smtp_port'] || process.env.SMTP_PORT || 587);
    const user = settings['smtp_user'] || process.env.SMTP_USER;
    const pass = settings['smtp_password'] || process.env.SMTP_PASSWORD;
    const from = settings['company_email'] || process.env.SMTP_FROM || 'no-reply@shieldinsurance.com';

    if (!host || !user || !pass) {
      return {
        status: 'failed',
        deliveryResult: null,
        errorMessage: 'Missing SMTP credentials in settings or environment variables.',
      };
    }

    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // SSL for port 465
        auth: { user, pass },
      });

      const info = await transporter.sendMail({
        from: `"Shield Insurance" <${from}>`,
        to,
        subject: 'Insurance Policy Expiry Reminder',
        text: message,
        html: `<div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #0ea0ec;">Policy Renewal Notice</h2>
          <p style="white-space: pre-line; line-height: 1.6;">${message}</p>
        </div>`,
      });

      return {
        status: 'sent',
        deliveryResult: `Email Message ID: ${info.messageId}`,
        errorMessage: null,
      };
    } catch (err: any) {
      errorLogger.error('SMTP Email dispatch failed', err);
      return {
        status: 'failed',
        deliveryResult: null,
        errorMessage: err.message || 'SMTP delivery exception',
      };
    }
  }
}

// 4. Mock Provider (Development only)
class MockProvider implements NotificationProvider {
  async send(to: string, message: string, _settings: Record<string, string>): Promise<ProviderResult> {
    notificationLogger.info(`[MOCK DISPATCH] Send request simulated to "${to}":\n"${message}"`);
    return {
      status: 'sent',
      deliveryResult: 'Mock message successfully logged to local logs folder.',
      errorMessage: null,
    };
  }
}

// Dynamic Factory Provider selector
export const getNotificationProvider = (
  channel: string,
  settings: Record<string, string>
): NotificationProvider => {
  // Check override env variable or db configuration key
  const activeProvider = process.env.NOTIFICATION_PROVIDER || settings['notification_provider'] || 'mock';

  if (activeProvider.toLowerCase() === 'mock') {
    return new MockProvider();
  }

  // Otherwise route matching channel requirements
  const targetChannel = channel.toLowerCase();
  if (targetChannel === 'whatsapp') {
    return new WhatsAppProvider();
  }
  if (targetChannel === 'sms') {
    return new SMSProvider();
  }
  if (targetChannel === 'email') {
    return new EmailProvider();
  }

  // Fallback
  return new MockProvider();
};
