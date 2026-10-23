import { prisma } from "../lib/prisma.ts";
import type { Expense as ExpenseRow } from "../generated/prisma/client.ts";
import {
  CATEGORIES,
  type Category,
  type CreateExpenseInput,
  type Expense,
  type ExpenseListResponse,
  type ExpenseSummaryResponse,
  type ListExpensesQuery,
} from "@expense/shared";

// Dates are stored as Postgres DATE; JS sees them as UTC midnight.
const toDate = (ymd: string) => new Date(`${ymd}T00:00:00Z`);
const toYmd = (d: Date) => d.toISOString().slice(0, 10);
const round2 = (n: number) => Math.round(n * 100) / 100;

const serialize = (e: ExpenseRow): Expense => ({
  id: e.id,
  title: e.title,
  amount: e.amount.toNumber(),
  category: e.category,
  date: toYmd(e.date),
  createdAt: e.createdAt.toISOString(),
});

export async function createExpense(input: CreateExpenseInput): Promise<Expense> {
  const row = await prisma.expense.create({
    data: { ...input, date: input.date ? toDate(input.date) : undefined },
  });
  return serialize(row);
}

export async function listExpenses({ category, from, to, page, limit }: ListExpensesQuery): Promise<ExpenseListResponse> {
  const where = {
    category,
    date: from || to ? { gte: from ? toDate(from) : undefined, lte: to ? toDate(to) : undefined } : undefined,
  };
  // Totals come from the DB over the whole filtered set, never from the page.
  const [rows, agg] = await Promise.all([
    prisma.expense.findMany({
      where,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.expense.aggregate({ where, _count: true, _sum: { amount: true } }),
  ]);
  return {
    items: rows.map(serialize),
    total_count: agg._count,
    total_amount: agg._sum.amount?.toNumber() ?? 0,
  };
}

/** Returns false when no expense has that id. */
export async function deleteExpense(id: string): Promise<boolean> {
  const { count } = await prisma.expense.deleteMany({ where: { id } });
  return count > 0;
}

export async function monthlySummary(month: string): Promise<ExpenseSummaryResponse> {
  const [y, m] = month.split("-").map(Number);
  const groups = await prisma.expense.groupBy({
    by: ["category"],
    where: { date: { gte: new Date(Date.UTC(y, m - 1, 1)), lt: new Date(Date.UTC(y, m, 1)) } },
    _sum: { amount: true },
  });
  const by_category = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<Category, number>;
  for (const g of groups) by_category[g.category] = g._sum.amount?.toNumber() ?? 0;
  return { month, by_category, total: round2(Object.values(by_category).reduce((a, b) => a + b, 0)) };
}
