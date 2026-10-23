import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { onError } from "./lib/http.ts";
import { expenses } from "./routes/expenses.ts";

const app = new Hono();

// Browser calls come from the separately deployed web app, so its origin must be allowed explicitly.
const origins = (process.env.CORS_ORIGINS ?? "http://localhost:3000").split(",").map((o) => o.trim());
app.use("/api/*", cors({ origin: origins, allowMethods: ["GET", "POST", "DELETE", "OPTIONS"] }));

app.onError(onError);
app.get("/health", (c) => c.json({ ok: true }));
app.route("/api/expenses", expenses);

const port = Number(process.env.PORT ?? 4000);
serve({ fetch: app.fetch, port });
console.log(`API listening on :${port}`);
