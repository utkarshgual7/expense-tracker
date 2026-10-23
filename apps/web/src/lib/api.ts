import type {
  ApiError,
  CreateExpenseInput,
  Expense,
  ExpenseListResponse,
  ExpenseSummaryResponse,
} from "@expense/shared";

// The API is a separate service; its base URL is baked in at build time.
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, init);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as Partial<ApiError>).error ?? `Request failed (${res.status})`);
  return body as T;
}

export const listExpenses = (q: { category?: string; page: number; limit: number }) =>
  request<ExpenseListResponse>(
    `/api/expenses?${new URLSearchParams(Object.entries(q).flatMap(([k, v]) => (v ? [[k, String(v)]] : [])))}`,
  );

export const createExpense = (input: CreateExpenseInput) =>
  request<Expense>("/api/expenses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

export const deleteExpense = (id: string) =>
  request<{ ok: true }>(`/api/expenses/${encodeURIComponent(id)}`, { method: "DELETE" });

export const getSummary = (month: string) =>
  request<ExpenseSummaryResponse>(`/api/expenses/summary?month=${encodeURIComponent(month)}`);
