import { cookies } from 'next/headers';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';
import { getSupabaseAdmin } from './supabase';
import type { AdminUser, SessionUser } from './types';

const COOKIE_NAME = 'qrfm_session';
const SESSION_DAYS = 7;

function sessionSecret(): Uint8Array {
  const secret =
    process.env.SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY || // fallback so the app still works if SESSION_SECRET is unset
    'insecure-dev-secret-change-me';
  return new TextEncoder().encode(secret);
}

// ---------------------------------------------------------------------------
// Password hashing (scrypt — no native dependencies, Docker-friendly)
// ---------------------------------------------------------------------------
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const derived = scryptSync(password, salt, 64);
    const stored = Buffer.from(hash, 'hex');
    if (derived.length !== stored.length) return false;
    return timingSafeEqual(derived, stored);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Session token (httpOnly cookie, signed JWT)
// ---------------------------------------------------------------------------
export async function createSession(user: SessionUser): Promise<void> {
  const token = await new SignJWT({
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(sessionSecret());

  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, sessionSecret());
    return {
      id: String(payload.sub),
      email: String(payload.email ?? ''),
      name: String(payload.name ?? ''),
      role: (payload.role as SessionUser['role']) ?? 'admin',
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// User lookup helpers
// ---------------------------------------------------------------------------
export async function countAdminUsers(): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { count } = await supabase
    .from('admin_users')
    .select('id', { count: 'exact', head: true });
  return count ?? 0;
}

export async function findUserByEmail(email: string): Promise<AdminUser | null> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('admin_users')
    .select('*')
    .ilike('email', email)
    .maybeSingle();
  return (data as AdminUser) ?? null;
}

export async function authenticate(email: string, password: string): Promise<SessionUser | null> {
  const user = await findUserByEmail(email.trim());
  if (!user || !user.active || user.provider !== 'local') return null;
  if (!user.password_hash || !user.password_salt) return null;
  if (!verifyPassword(password, user.password_hash, user.password_salt)) return null;

  const supabase = getSupabaseAdmin();
  await supabase.from('admin_users').update({ last_login: new Date().toISOString() }).eq('id', user.id);

  return { id: user.id, email: user.email, name: user.name, role: user.role };
}
