'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createHash, randomBytes } from 'node:crypto';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getSettings } from '@/lib/settings';
import { hashPassword, findUserByEmail } from '@/lib/auth';
import { sendMail, smtpConfigured } from '@/lib/mailer';
import type { AdminUser } from '@/lib/types';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

async function requestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get('host');
  const proto = h.get('x-forwarded-proto') ?? 'https';
  return host ? `${proto}://${host}` : '';
}

export async function forgotPasswordAction(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();

  // Always behave identically regardless of whether the account exists,
  // to avoid leaking which e-mail addresses are registered.
  if (email) {
    try {
      const user = await findUserByEmail(email);
      const settings = await getSettings();
      if (user && user.active && user.provider === 'local' && smtpConfigured(settings)) {
        const token = randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
        const supabase = getSupabaseAdmin();
        await supabase
          .from('admin_users')
          .update({ reset_token_hash: hashToken(token), reset_expires: expires })
          .eq('id', user.id);

        const origin = await requestOrigin();
        const link = `${origin}/admin/reset?token=${token}`;
        await sendMail(
          {
            to: user.email,
            subject: `${settings.app_name}: Passwort zurücksetzen`,
            text:
              `Hallo ${user.name || ''},\n\n` +
              `Sie haben das Zurücksetzen Ihres Passworts angefordert. Öffnen Sie den folgenden Link, ` +
              `um ein neues Passwort zu vergeben (gültig für 1 Stunde):\n\n${link}\n\n` +
              `Falls Sie das nicht angefordert haben, ignorieren Sie diese E-Mail.`,
            html:
              `<p>Hallo ${user.name || ''},</p>` +
              `<p>Sie haben das Zurücksetzen Ihres Passworts angefordert. Klicken Sie auf den folgenden Link, ` +
              `um ein neues Passwort zu vergeben (gültig für 1&nbsp;Stunde):</p>` +
              `<p><a href="${link}">${link}</a></p>` +
              `<p>Falls Sie das nicht angefordert haben, ignorieren Sie diese E-Mail.</p>`,
          },
          settings,
        );
      }
    } catch {
      // swallow — never reveal internal state
    }
  }

  redirect('/admin/forgot?sent=1');
}

export async function resetPasswordAction(formData: FormData) {
  const token = String(formData.get('token') ?? '');
  const password = String(formData.get('password') ?? '');
  const password2 = String(formData.get('password2') ?? '');

  if (!token) redirect('/admin/login');
  if (password.length < 8) redirect(`/admin/reset?token=${token}&error=weak`);
  if (password !== password2) redirect(`/admin/reset?token=${token}&error=mismatch`);

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('admin_users')
    .select('*')
    .eq('reset_token_hash', hashToken(token))
    .maybeSingle();
  const user = data as AdminUser | null;

  if (!user || !user.reset_expires || new Date(user.reset_expires).getTime() < Date.now()) {
    redirect('/admin/reset?error=expired');
  }

  const { hash, salt } = hashPassword(password);
  await supabase
    .from('admin_users')
    .update({ password_hash: hash, password_salt: salt, reset_token_hash: null, reset_expires: null })
    .eq('id', user!.id);

  redirect('/admin/login?reset=1');
}
