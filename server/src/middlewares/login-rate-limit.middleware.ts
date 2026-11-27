import type { NextFunction, Request, Response } from 'express';

// Limitador sencillo en memoria: máx. 5 intentos fallidos por IP cada 15 min.
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 5;
const fails = new Map<string, { count: number; resetAt: number }>();

export function loginRateLimit(req: Request, res: Response, next: NextFunction): void {
  const key = req.ip ?? '';
  const now = Date.now();
  const entry = fails.get(key);
  if (entry && entry.resetAt > now && entry.count >= MAX_FAILS) {
    res.status(429).json({ error: 'Demasiados intentos. Prueba de nuevo más tarde.' });
    return;
  }
  res.on('finish', () => {
    if (res.statusCode !== 401) {
      if (res.statusCode < 400) fails.delete(key);
      return;
    }
    const cur = fails.get(key);
    if (cur && cur.resetAt > Date.now()) cur.count++;
    else fails.set(key, { count: 1, resetAt: Date.now() + WINDOW_MS });
  });
  next();
}
