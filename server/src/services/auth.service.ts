import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 h
export const SESSION_COOKIE = 'dym_session';
export const SESSION_MAX_AGE_S = SESSION_TTL_MS / 1000;

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error('SESSION_SECRET debe tener al menos 32 caracteres');
  return s;
}

const sign = (payload: string) => createHmac('sha256', secret()).update(payload).digest('base64url');

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export class AuthService {
  /** Genera "salt:hash" (scrypt) para guardar en ADMIN_PASSWORD_HASH. */
  static hashPassword(password: string): string {
    const salt = randomBytes(16).toString('hex');
    return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
  }

  /** Comprueba usuario y contraseña contra ADMIN_USER / ADMIN_PASSWORD_HASH (tiempo constante). */
  static verifyCredentials(user: string, password: string): boolean {
    const expectedUser = process.env.ADMIN_USER ?? '';
    const [salt, hash] = (process.env.ADMIN_PASSWORD_HASH ?? '').split(':');
    if (!expectedUser || !salt || !hash) return false;

    // Se calcula siempre el hash para no revelar por tiempo si el usuario existe.
    const candidate = scryptSync(password, salt, 64).toString('hex');
    const passOk = safeEqual(candidate, hash);
    const userOk = safeEqual(user, expectedUser);
    return passOk && userOk;
  }

  /** Token firmado "usuario.expiración.firma" (sin estado en servidor). */
  static createToken(user: string): string {
    const payload = `${Buffer.from(user).toString('base64url')}.${Date.now() + SESSION_TTL_MS}`;
    return `${payload}.${sign(payload)}`;
  }

  /** Devuelve el usuario si el token es válido y no ha caducado. */
  static verifyToken(token: string | undefined): string | null {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [user, exp, sig] = parts as [string, string, string];
    if (!safeEqual(sig, sign(`${user}.${exp}`))) return null;
    if (!(Number(exp) > Date.now())) return null;
    return Buffer.from(user, 'base64url').toString();
  }
}
