import path from 'node:path';
import type { NextFunction, Request, Response } from 'express';
import { resolveTrackedPage } from '../config/tracked-pages.js';
import { VisitsRegisterService } from '../services/visits-register.service.js';

// Una "carga de la web" es una navegación del navegador (documento HTML), no una petición
// de API, de un asset (js/css/img…) ni un prefetch.
function isPageLoad(req: Request): boolean {
  if (req.method !== 'GET') return false;
  if (req.path === '/api' || req.path.startsWith('/api/')) return false;
  if (path.extname(req.path) !== '') return false;

  const dest = req.get('sec-fetch-dest');
  if (dest !== undefined && dest !== 'document') return false;

  const purpose = `${req.get('sec-purpose') ?? ''}${req.get('purpose') ?? ''}`;
  if (/prefetch|prerender/i.test(purpose)) return false;

  return req.accepts(['html', 'json', '*/*']) === 'html' && req.get('accept')?.includes('text/html') === true;
}

/**
 * Registra una visita por cada carga de página. Se ejecuta en segundo plano: nunca retrasa
 * ni rompe la respuesta. La IP y el user-agent solo se usan para calcular el hash con el salt
 * del día; no se guardan ni se escriben en logs.
 */
export function trackVisit(req: Request, _res: Response, next: NextFunction): void {
  // Solo el path (nunca query ni hash, pueden llevar tokens) y solo si es una página conocida.
  const page = isPageLoad(req) ? resolveTrackedPage(req.path) : null;
  if (page) {
    VisitsRegisterService.register(page, req.ip ?? '', req.get('user-agent') ?? '').catch((err: unknown) =>
      console.error('No se pudo registrar la visita:', err instanceof Error ? err.message : 'error'),
    );
  }
  next();
}
