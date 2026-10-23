import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";

export class NotFoundError extends Error {}

/** Single error funnel: Zod → 400, NotFoundError → 404, anything else → 500 (logged, not leaked). */
export function onError(err: Error, c: Context) {
  if (err instanceof ZodError) {
    const issue = err.issues[0];
    const path = issue.path.join(".");
    return c.json({ error: path ? `${path}: ${issue.message}` : issue.message }, 400);
  }
  if (err instanceof NotFoundError) return c.json({ error: err.message }, 404);
  if (err instanceof SyntaxError) return c.json({ error: "Invalid JSON body" }, 400);
  if (err instanceof HTTPException) {
    const status = err.status;
    return c.json({ error: status === 400 ? "Invalid JSON body" : err.message }, status);
  }
  console.error(err);
  return c.json({ error: "Internal server error" }, 500);
}
