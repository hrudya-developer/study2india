import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { sql?: ReturnType<typeof postgres> };

function client() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
  if (!globalForDb.sql) globalForDb.sql = postgres(url, { max: 10 });
  return globalForDb.sql;
}

export const db = drizzle(client(), { schema });
export { schema };
