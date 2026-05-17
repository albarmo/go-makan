import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type DbClient = ReturnType<typeof drizzle<typeof schema>>;

let _db: DbClient | null = null;
let _sql: ReturnType<typeof postgres> | null = null;

export function getDb(): DbClient {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Add it to .env");

  _sql = postgres(url, {
    prepare: false,
    max: 1,
    idle_timeout: 20,
    connect_timeout: 15,
  });
  _db = drizzle(_sql, { schema });
  return _db;
}

// Proxy: access db.select() etc. lazily so module import doesn't fail
export const db = new Proxy({} as DbClient, {
  get(_target, prop) {
    return getDb()[prop as keyof DbClient];
  },
});
