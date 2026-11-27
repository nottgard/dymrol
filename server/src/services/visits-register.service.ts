import { createHmac, randomBytes } from 'node:crypto';
import { AppDataSource } from '../data-source.js';
import { SaltKey } from '../entities/SaltKey.js';
import { Visit } from '../entities/Visit.js';

// Zona horaria con la que se decide "el día actual" (debe coincidir con la del cronjob de las 00:00).
const TIMEZONE = process.env.VISITS_TIMEZONE || 'Europe/Madrid';

export interface PageStats {
  page: string;
  total: number;
  unique: number;
}

export interface VisitStats {
  date: string;
  page: string | null;
  total: number;
  unique: number;
  pages: PageStats[];
}

export class VisitsRegisterService {
  /** Día actual 'YYYY-MM-DD' en la zona horaria configurada. */
  static today(): string {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  }

  /**
   * Devuelve el salt de hoy. Si no existe o ha caducado, lo (re)crea antes de usarlo.
   * El salt caducado se sustituye. Si dos peticiones concurrentes coinciden solo se crea una.
   */
  static async getTodaySalt(): Promise<string> {
    const repo = AppDataSource.getRepository(SaltKey);
    const today = this.today();

    const current = await repo.findOneBy({ id: 1 });
    if (current && current.saltDate === today) return current.salt;

    await AppDataSource.query(
      `INSERT INTO salt_key (id, salt, salt_date) VALUES (1, $1, $2)
       ON CONFLICT (id) DO UPDATE SET salt = EXCLUDED.salt, salt_date = EXCLUDED.salt_date
       WHERE salt_key.salt_date <> EXCLUDED.salt_date`,
      [randomBytes(32).toString('hex'), today],
    );

    const fresh = await repo.findOneByOrFail({ id: 1 });
    return fresh.salt;
  }

  /** Hash irreversible del visitante: HMAC-SHA256(salt del día, ip + user-agent). */
  static hashVisitor(salt: string, ip: string, userAgent: string): string {
    return createHmac('sha256', salt).update(`${ip}\n${userAgent}`).digest('hex');
  }

  /** Registra una visita a `page`. No guarda IP ni user-agent, solo el hash. */
  static async register(page: string, ip: string, userAgent: string): Promise<void> {
    const salt = await this.getTodaySalt();
    await AppDataSource.getRepository(Visit).insert({
      visitorHash: this.hashVisitor(salt, ip, userAgent),
      visitDate: this.today(),
      page,
    });
  }

  /** Visitas totales y únicas de un día: globales (o de `page` si se indica) y desglosadas por página. */
  static async getStats(date: string, page?: string): Promise<VisitStats> {
    const [global] = (await AppDataSource.query(
      `SELECT COUNT(*) AS total, COUNT(DISTINCT visitor_hash) AS unique
       FROM visits WHERE visit_date = $1 AND ($2::text IS NULL OR page = $2)`,
      [date, page ?? null],
    )) as { total: string; unique: string }[];

    const rows = (await AppDataSource.query(
      `SELECT page, COUNT(*) AS total, COUNT(DISTINCT visitor_hash) AS unique
       FROM visits WHERE visit_date = $1 AND ($2::text IS NULL OR page = $2)
       GROUP BY page ORDER BY total DESC, page`,
      [date, page ?? null],
    )) as { page: string; total: string; unique: string }[];

    return {
      date,
      page: page ?? null,
      total: Number(global?.total ?? 0),
      unique: Number(global?.unique ?? 0),
      pages: rows.map((r) => ({ page: r.page, total: Number(r.total), unique: Number(r.unique) })),
    };
  }
}
