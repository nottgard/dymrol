import type { NextFunction, Request, Response } from 'express';
import { AuthService, SESSION_COOKIE } from '../services/auth.service.js';

export function readCookie(req: Request, name: string): string | undefined {
  for (const part of (req.get('cookie') ?? '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return undefined;
}

export function currentUser(req: Request): string | null {
  return AuthService.verifyToken(readCookie(req, SESSION_COOKIE));
}

/** Protege una ruta: 401 si no hay sesión válida. */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!currentUser(req)) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }
  next();
}
