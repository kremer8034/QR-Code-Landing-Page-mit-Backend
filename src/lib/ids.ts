import { randomBytes } from 'node:crypto';

// Unambiguous alphabet (no 0/O/1/I/L) for short, human-safe public ids.
const ALPHABET = '23456789abcdefghjkmnpqrstuvwxyz';

export function shortId(length = 8): string {
  const bytes = randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}
