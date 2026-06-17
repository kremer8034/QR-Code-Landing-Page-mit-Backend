import nodemailer from 'nodemailer';
import { getSettings } from './settings';
import type { Settings } from './types';

export function smtpConfigured(settings: Settings): boolean {
  return Boolean(settings.smtp_host && settings.smtp_from);
}

interface MailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Sends an e-mail via the SMTP account configured in the backoffice settings.
 * Returns true on success. Never throws to the caller.
 */
export async function sendMail(mail: MailInput, settingsArg?: Settings): Promise<boolean> {
  const settings = settingsArg ?? (await getSettings());
  if (!smtpConfigured(settings)) return false;

  try {
    const transporter = nodemailer.createTransport({
      host: settings.smtp_host!,
      port: settings.smtp_port || 587,
      secure: settings.smtp_secure, // true => port 465; false => STARTTLS (587)
      auth: settings.smtp_user
        ? { user: settings.smtp_user, pass: settings.smtp_password ?? '' }
        : undefined,
    });

    await transporter.sendMail({
      from: settings.smtp_from!,
      to: mail.to,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    });
    return true;
  } catch (err) {
    console.error('sendMail failed:', err);
    return false;
  }
}
