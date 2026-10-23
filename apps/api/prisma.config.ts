import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// CLI (migrations) uses the direct connection; the app uses the pooled DATABASE_URL (src/lib/prisma.ts).
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: env("DIRECT_URL") },
});
