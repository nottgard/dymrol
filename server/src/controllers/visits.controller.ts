import type { Request, Response } from 'express';
import { resolveTrackedPage } from '../config/tracked-pages.js';
import { VisitsRegisterService } from '../services/visits-register.service.js';

const MAX_PAGE_LENGTH = 255;

function isValidPage(page: unknown): page is string {
  return typeof page === 'string' && page.startsWith('/') && page.length <= MAX_PAGE_LENGTH;
}

function isValidDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  return new Date(`${date}T00:00:00Z`).toISOString().startsWith(date);
}

// Registra una visita. Body: { page: "/ruta" }. La IP y el user-agent se anonimizan en el servicio.
export async function registerVisit(req: Request, res: Response): Promise<void> {
  const raw: unknown = req.body?.page;
  const page = isValidPage(raw) ? resolveTrackedPage(raw) : null;
  if (!page) {
    res.status(400).json({ error: 'page debe ser una página existente de la web (p. ej. "/")' });
    return;
  }

  await VisitsRegisterService.register(page, req.ip ?? '', req.get('user-agent') ?? '');
  res.status(204).end();
}

// Estadísticas de un día. Query: ?date=YYYY-MM-DD (por defecto hoy) &page=/ruta (opcional).
export async function getVisitStats(req: Request, res: Response): Promise<void> {
  const date = typeof req.query.date === 'string' ? req.query.date : VisitsRegisterService.today();
  if (!isValidDate(date)) {
    res.status(400).json({ error: 'date debe tener formato YYYY-MM-DD' });
    return;
  }

  const page = req.query.page;
  if (page !== undefined && !isValidPage(page)) {
    res.status(400).json({ error: 'page debe ser una ruta que empiece por "/"' });
    return;
  }

  res.json(await VisitsRegisterService.getStats(date, page));
}
