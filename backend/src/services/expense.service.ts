import {
  CATEGORIES,
  type Category,
  type CreateExpenseInput,
  type Expense,
  type ExpenseListResponse,
  type ExpenseSummaryResponse,
  type ListExpensesQuery,
} from "@expense/shared";
import { supabase, type ExpenseRow } from "../lib/supabase.ts";

const TABLE = "expenses";
const round2 = (n: number) => Math.round(n * 100) / 100;

const serialize = (r: ExpenseRow): Expense => ({
  id: r.id,
  title: r.title,
  amount: Number(r.amount),
  category: r.category,
  date: r.date,
  createdAt: new Date(r.created_at).toISOString(),
});

export async function createExpense(input: CreateExpenseInput): Promise<Expense> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ title: input.title, amount: input.amount, category: input.category, date: input.date })
    .select()
    .single<ExpenseRow>();
  if (error) throw new Error(error.message);
  return serialize(data);
}

export async function listExpenses({
  category,
  from,
  to,
  page,
  limit,
}: ListExpensesQuery): Promise<ExpenseListResponse> {
  let rows = supabase
    .from(TABLE)
    .select("*")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);
  if (category) rows = rows.eq("category", category);
  if (from) rows = rows.gte("date", from);
  if (to) rows = rows.lte("date", to);

  // The page and the totals are separate queries, run concurrently. Totals come from a
  // SQL function so count and sum cover the whole filtered set and are computed in
  // Postgres — never from the rows on this page, and never summed in JS.
  const [pageRes, totalsRes] = await Promise.all([
    rows,
    supabase
      .rpc("expenses_totals", {
        p_category: category ?? null,
        p_from: from ?? null,
        p_to: to ?? null,
      })
      .single<{ total_count: number; total_amount: string }>(),
  ]);

  if (pageRes.error) throw new Error(pageRes.error.message);
  if (totalsRes.error) throw new Error(totalsRes.error.message);

  return {
    items: (pageRes.data as ExpenseRow[]).map(serialize),
    total_count: Number(totalsRes.data.total_count),
    total_amount: round2(Number(totalsRes.data.total_amount)),
  };
}

/** Returns false when no expense has that id. */
export async function deleteExpense(id: string): Promise<boolean> {
  const { data, error } = await supabase.from(TABLE).delete().eq("id", id).select("id");
  if (error) throw new Error(error.message);
  return (data?.length ?? 0) > 0;
}

export async function monthlySummary(month: string): Promise<ExpenseSummaryResponse> {
  const { data, error } = await supabase.rpc("expenses_monthly_summary", { p_month: `${month}-01` });
  if (error) throw new Error(error.message);

  const by_category = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<Category, number>;
  for (const row of (data ?? []) as { category: Category; total: string }[]) {
    by_category[row.category] = round2(Number(row.total));
  }

  return { month, by_category, total: round2(Object.values(by_category).reduce((a, b) => a + b, 0)) };
}
