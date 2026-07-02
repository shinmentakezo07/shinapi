import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { Pool } from "pg";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

const isSQLite = process.env.DB_TYPE === "sqlite";

// In SQLite (lite) mode the backend owns all data; the frontend Drizzle
// Postgres connection is not needed. Export null so consumers can
// guard their queries with `if (db) …` without crashing at import time.
export const db = (() => {
  if (isSQLite) return null;

  const DATABASE_URL =
    process.env.DATABASE_URL ||
    "postgresql://placeholder:placeholder@localhost:5432/placeholder";

  if (!process.env.DATABASE_URL && process.env.NODE_ENV !== "production") {
    console.warn("⚠️  DATABASE_URL is not defined. Using placeholder for build.");
  }

  const isNeon = DATABASE_URL.includes("neon.tech");

  return isNeon
    ? drizzleNeon(neon(DATABASE_URL, { fetchOptions: { cache: "no-store" } }), {
        schema,
      })
    : drizzlePg(new Pool({ connectionString: DATABASE_URL }), { schema });
})();
