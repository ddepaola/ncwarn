import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { getEnv } from "../env";

type Sql = ReturnType<typeof postgres>;
type Db = ReturnType<typeof drizzle<typeof schema>>;

declare global {
  var __ncrrSql: Sql | undefined;
  var __ncrrDb: Db | undefined;
}

/**
 * Lazily-initialised database handles. Nothing connects (or reads env) at
 * import time, so `next build` can collect route metadata without a database
 * and a bad DATABASE_URL fails loudly on first use rather than at module load.
 */
function ensureSql(): Sql {
  if (!globalThis.__ncrrSql) {
    const env = getEnv();
    globalThis.__ncrrSql = postgres(env.DATABASE_URL, {
      max: env.NODE_ENV === "production" ? 10 : 5,
      idle_timeout: 30,
      connect_timeout: 10,
      prepare: false,
      onnotice: () => {},
    });
  }
  return globalThis.__ncrrSql;
}

function ensureDb(): Db {
  if (!globalThis.__ncrrDb) globalThis.__ncrrDb = drizzle(ensureSql(), { schema });
  return globalThis.__ncrrDb;
}

/** Raw postgres.js tagged-template client (lazy). */
export const sqlClient: Sql = new Proxy(function () {} as unknown as Sql, {
  apply(_t, thisArg, args) { return Reflect.apply(ensureSql() as unknown as (...a: unknown[]) => unknown, thisArg, args); },
  get(_t, prop) { const real = ensureSql() as unknown as Record<PropertyKey, unknown>; const v = real[prop as string]; return typeof v === "function" ? (v as (...a: unknown[]) => unknown).bind(real) : v; },
});

/** Drizzle client (lazy). */
export const db: Db = new Proxy({} as Db, {
  get(_t, prop) { const real = ensureDb() as unknown as Record<PropertyKey, unknown>; const v = real[prop as string]; return typeof v === "function" ? (v as (...a: unknown[]) => unknown).bind(real) : v; },
});

export type { Db };
export { schema };
