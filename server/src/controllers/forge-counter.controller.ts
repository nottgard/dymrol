import type { Request, Response } from 'express';
import { AppDataSource } from '../data-source.js';
import { ForgeCounter } from '../entities/ForgeCounter.js';

const MAX_AMOUNT_PER_REQUEST = 100_000;

// Devuelve el total global de golpes. smashes viaja como string (bigint) para no perder precisión.
export async function getForgeCounter(_req: Request, res: Response): Promise<void> {
  const counter = await AppDataSource.getRepository(ForgeCounter).findOneByOrFail({ id: 1 });
  res.json({ smashes: counter.smashes });
}

// Suma `amount` al total. La suma se hace dentro de la propia sentencia SQL evitando conflictos.
export async function addForgeCounter(req: Request, res: Response): Promise<void> {
  const amount: unknown = req.body?.amount;
  if (!Number.isSafeInteger(amount) || (amount as number) < 1 || (amount as number) > MAX_AMOUNT_PER_REQUEST) {
    res.status(400).json({ error: `amount debe ser un entero entre 1 y ${MAX_AMOUNT_PER_REQUEST}` });
    return;
  }

  const result = await AppDataSource.createQueryBuilder()
    .update(ForgeCounter)
    .set({ smashes: () => 'smashes + :amount' })
    .setParameter('amount', amount)
    .where('id = 1')
    .returning('smashes')
    .execute();

  const row = (result.raw as { smashes: string }[])[0];
  res.json({ smashes: row?.smashes });
}
