import {
  CATEGORIES,
  type Category,
  type CreateExpenseInput,
  type Expense,
  type ExpenseListResponse,
  type ExpenseSummaryResponse,
  type ListExpensesQuery,
} from "@expense/shared";
import { pool, type ExpenseRow } from "../lib/db.ts";

const round2 = (n: number) => Math.round(n * 100) / 100;

const serialize = (r: ExpenseRow): Expense => ({
  id: r.id,
  title: r.title,
  amount: Number(r.amount),
  category: r.category,
  date: r.date,
  createdAt: r.created_at.toISOString(),
});

export async function createExpense(input: CreateExpenseInput): Promise<Expense> {
  const { rows } = await pool.query<ExpenseRow>(
    `insert into expenses (title, amount, category, date)
     values ($1, $2, $3, coalesce($4::date, current_date))
     returning *`,
    [input.title, input.amount, input.category, input.date ?? null],
  );
  return serialize(rows[0]);
}

export async function listExpenses({
  category,
  from,
  to,
  page,
  limit,
}: ListExpensesQuery): Promise<ExpenseListResponse> {
  // One WHERE clause, one parameter list, used by both queries below so the page
  // and the totals can never drift apart. Nulls mean "no filter".
  const where = `where ($1::category is null or category = $1)
                   and ($2::date is null or date >= $2)
                   and ($3::date is null or date <= $3)`;
  const filters = [category ?? null, from ?? null, to ?? null];

  // Page rows and totals run concurrently. The totals are aggregated in Postgres over
  // the whole filtered set — never derived from the rows on this page.
  const [page_, totals] = await Promise.all([
    pool.query<ExpenseRow>(
      `select * from expenses ${where}
       order by date desc, created_at desc
       limit $4 offset $5`,
      [...filters, limit, (page - 1) * limit],
    ),
    pool.query<{ total_count: string; total_amount: string }>(
      `select count(*) as total_count, coalesce(sum(amount), 0) as total_amount
       from expenses ${where}`,
      filters,
    ),
  ]);

  return {
    items: page_.rows.map(serialize),
    total_count: Number(totals.rows[0].total_count),
    total_amount: round2(Number(totals.rows[0].total_amount)),
  };
}

/** Returns false when no expense has that id. */
export async function deleteExpense(id: string): Promise<boolean> {
  const { rowCount } = await pool.query("delete from expenses where id = $1", [id]);
  return (rowCount ?? 0) > 0;
}

export async function monthlySummary(month: string): Promise<ExpenseSummaryResponse> {
  const { rows } = await pool.query<{ category: Category; total: string }>(
    `select category, sum(amount) as total
     from expenses
     where date >= $1::date and date < ($1::date + interval '1 month')
     group by category`,
    [`${month}-01`],
  );

  const by_category = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<Category, number>;
  for (const r of rows) by_category[r.category] = round2(Number(r.total));

  return { month, by_category, total: round2(Object.values(by_category).reduce((a, b) => a + b, 0)) };
}
