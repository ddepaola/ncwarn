import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { getEnv } from "../env";

declare global {
  var __ncrrSql: ReturnType<typeof postgres> | undefined;
}

function createClient() {
  const env = getEnv();
  return postgres(env.DATABASE_URL, {
    max: env.NODE_ENV === "production" ? 10 : 5,
    idle_timeout: 30,
    connect_timeout: 10,
    prepare: false,
  });
}

/** Shared postgres.js client (cached across HMR reloads in dev). */
export const sqlClient = globalThis.__ncrrSql ?? createClient();
if (process.env.NODE_ENV !== "production") globalThis.__ncrrSql = sqlClient;

export const db = drizzle(sqlClient, { schema });
export type Db = typeof db;
export { schema };
