import { Pool, types } from "pg";

// A DATE has no timezone, but node-postgres parses it into a local-midnight Date,
// which shifts the day when serialized back via toISOString(). Keep DATE as the
// "YYYY-MM-DD" text Postgres sent.
types.setTypeParser(types.builtins.DATE, (v) => v);

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required");

// One pool per process. Supabase's transaction pooler (port 6543) already multiplexes
// server-side, so a small client pool is right — a large one just queues at the pooler.
export const pool = new Pool({
  connectionString,
  max: Number(process.env.DB_POOL_MAX ?? 5),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  // Supabase requires TLS; its certificate chain isn't in Node's default store.
  ssl: connectionString.includes("localhost") ? false : { rejectUnauthorized: false },
});

/** numeric comes back as a string so precision survives the wire; parse at the edge. */
export type ExpenseRow = {
  id: string;
  title: string;
  amount: string;
  category: "food" | "travel" | "bills" | "other";
  date: string; // YYYY-MM-DD, parsed as text (see setTypeParser above)
  created_at: Date;
};
