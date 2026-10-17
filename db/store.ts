import { Pool } from 'pg';

const globalForDatabase = globalThis as typeof globalThis & { fichasPool?: Pool };

const DEFAULT_POOL_SIZE = 10;
const MAX_POOL_SIZE = 20;

/**
 * Pool size from DATABASE_POOL_MAX. Serverless hosts start many instances,
 * so a small value (1-3) keeps the total under the database connection limit.
 */
export function poolSize(raw: string | undefined): number {
  const parsed = Number.parseInt(raw ?? '', 10);
  if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_POOL_SIZE;
  return Math.min(parsed, MAX_POOL_SIZE);
}

export function database(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is required');

  if (!globalForDatabase.fichasPool) {
    globalForDatabase.fichasPool = new Pool({
      connectionString,
      max: poolSize(process.env.DATABASE_POOL_MAX),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
      application_name: 'fichas',
    });
  }

  return globalForDatabase.fichasPool;
}
