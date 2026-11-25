import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { ForgeCounter } from './entities/ForgeCounter.js';

// El esquema lo gestionan las migraciones (node-pg-migrate), no TypeORM:
// synchronize debe quedarse en false.
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [ForgeCounter],
  synchronize: false,
});
