import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import type { SQL } from "drizzle-orm";
import * as schema from "./schema";

type Db = MySql2Database<typeof schema>;
const globalForDb = globalThis as unknown as { pool?: mysql.Pool; db?: Db };

export function getPool() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Add it to .env locally, or to the Node.js environment variables in hPanel.");
  if (!globalForDb.pool) {
    globalForDb.pool = mysql.createPool({ uri: url, connectionLimit: 8, charset: "utf8mb4", dateStrings: true, decimalNumbers: false });
  }
  return globalForDb.pool;
}

/** Lazily connects, so pages can build without a database and connect at request time. */
export function getDb(): Db {
  if (!globalForDb.db) globalForDb.db = drizzle(getPool(), { schema, mode: "default" });
  return globalForDb.db;
}

export const db = new Proxy({} as Db, {
  get(_t, prop) {
    return Reflect.get(getDb(), prop);
  },
});

/** Run a raw SQL query and return its rows. */
export async function rows<T>(query: SQL): Promise<T[]> {
  const [result] = (await getDb().execute(query)) as unknown as [T[], unknown];
  return result;
}

export { schema };
