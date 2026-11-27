import type { Request, Response } from 'express';
import { currentUser } from '../middlewares/auth.middleware.js';
import { AuthService, SESSION_COOKIE, SESSION_MAX_AGE_S } from '../services/auth.service.js';

const cookieBase = () =>
  `${SESSION_COOKIE}=VALUE; Path=/; HttpOnly; SameSite=Strict${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;

export function login(req: Request, res: Response): void {
  const { username, password } = req.body ?? {};
  if (typeof username !== 'string' || typeof password !== 'string' || !AuthService.verifyCredentials(username, password)) {
    res.status(401).json({ error: 'Credenciales incorrectas' });
    return;
  }
  res.setHeader('Set-Cookie', `${cookieBase().replace('VALUE', AuthService.createToken(username))}; Max-Age=${SESSION_MAX_AGE_S}`);
  res.json({ user: username });
}

export function logout(_req: Request, res: Response): void {
  res.setHeader('Set-Cookie', `${cookieBase().replace('VALUE', '')}; Max-Age=0`);
  res.status(204).end();
}

export function me(req: Request, res: Response): void {
  const user = currentUser(req);
  if (!user) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }
  res.json({ user });
}
