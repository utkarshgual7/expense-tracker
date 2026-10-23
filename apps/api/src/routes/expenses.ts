import { Hono } from "hono";
import { z } from "zod";
import {
  createExpenseSchema,
  listExpensesQuerySchema,
  monthSchema,
} from "@expense/shared";
import { NotFoundError } from "../lib/http.ts";
import {
  createExpense,
  deleteExpense,
  listExpenses,
  monthlySummary,
} from "../services/expense.service.ts";

export const expenses = new Hono();

expenses.get("/", async (c) => {
  // Blank params (?category=) mean "no filter", not an invalid value.
  const raw = Object.fromEntries(Object.entries(c.req.query()).filter(([, v]) => v !== ""));
  return c.json(await listExpenses(listExpensesQuerySchema.parse(raw)));
});

expenses.post("/", async (c) => {
  const input = createExpenseSchema.parse(await c.req.json());
  return c.json(await createExpense(input), 201);
});

// Declared before /:id so "summary" isn't read as an id.
expenses.get("/summary", async (c) => {
  return c.json(await monthlySummary(monthSchema.parse(c.req.query("month") ?? "")));
});

expenses.delete("/:id", async (c) => {
  const id = c.req.param("id");
  // A malformed id can't exist in the table — not found, rather than letting Postgres reject the cast.
  if (!z.uuid().safeParse(id).success || !(await deleteExpense(id))) {
    throw new NotFoundError("Expense not found");
  }
  return c.json({ ok: true });
});
