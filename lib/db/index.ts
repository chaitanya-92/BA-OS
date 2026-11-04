import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

const globalForDb = globalThis as unknown as {
  sqlClient?: ReturnType<typeof postgres>;
};

export function getDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured. Add it to .env.local.");
  }

  const client = globalForDb.sqlClient ?? postgres(connectionString, {
    max: process.env.NODE_ENV === "production" ? 10 : 1,
    prepare: false,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  if (!globalForDb.sqlClient) globalForDb.sqlClient = client;
  return drizzle(client);
}
