import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

/** Applies ./drizzle SQL migrations (idempotent; tracked in drizzle.__drizzle_migrations). */
async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");
  const client = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
  const db = drizzle(client);
  await migrate(db, { migrationsFolder: "./drizzle" });
  await client.end();
  console.log(JSON.stringify({ level: "info", msg: "migrations applied" }));
}
main().catch((err) => { console.error(JSON.stringify({ level: "error", msg: "migration failed", err: String(err?.message ?? err) })); process.exit(1); });
