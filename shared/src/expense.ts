import { z } from "zod";

export const CATEGORIES = ["food", "travel", "bills", "other"] as const;
export const categorySchema = z.enum(CATEGORIES);
export type Category = z.infer<typeof categorySchema>;

// Server can't know the client's timezone, so "future" means "not yet today anywhere on earth" (UTC+14).
const latestToday = () => new Date(Date.now() + 14 * 3_600_000).toISOString().slice(0, 10);

export const createExpenseSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(100, "Title must be at most 100 characters"),
  amount: z
    .number({ error: "Amount is required" })
    .positive("Amount must be greater than 0")
    .max(9_999_999_999.99, "Amount is too large") // fits Decimal(12, 2)
    .refine((n) => Math.abs(n * 100 - Math.round(n * 100)) < 1e-6, "Amount can have at most 2 decimal places"),
  category: categorySchema,
  date: z.iso
    .date("Date must be YYYY-MM-DD")
    .refine((d) => d <= latestToday(), "Date cannot be in the future")
    .optional(),
});
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

export const listExpensesQuerySchema = z
  .object({
    category: categorySchema.optional(),
    from: z.iso.date("from must be YYYY-MM-DD").optional(),
    to: z.iso.date("to must be YYYY-MM-DD").optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
  })
  .refine((q) => !q.from || !q.to || q.from <= q.to, { message: "from must be on or before to", path: ["from"] });
export type ListExpensesQuery = z.infer<typeof listExpensesQuerySchema>;

export const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "month must be YYYY-MM");

// API response contract (amounts are numbers, dates are YYYY-MM-DD strings).
export type Expense = {
  id: string;
  title: string;
  amount: number;
  category: Category;
  date: string;
  createdAt: string;
};
export type ExpenseListResponse = { items: Expense[]; total_count: number; total_amount: number };
export type ExpenseSummaryResponse = { month: string; by_category: Record<Category, number>; total: number };
export type ApiError = { error: string };
