import type {
  ApiError as ApiErrorBody,
  CreateExpenseInput,
  Expense,
  ExpenseListResponse,
  ExpenseSummaryResponse,
} from "@expense/shared";

// The API is a separate service; its base URL is baked in at build time.
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const TIMEOUT_MS = 10_000;
const MAX_RETRIES = 2;
const BACKOFF_MS = 300; // 300ms, then 600ms

/** status is 0 for a network failure or timeout, so callers can branch on 404 / 400 / offline. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * `retry` is opt-in per call, not a blanket policy: a request that reaches the
 * server may have been applied even if we never see the response, so only calls
 * that are safe to repeat pass retry: true. 4xx is never retried — the request
 * itself is wrong, so sending it again just fails again.
 */
async function request<T>(path: string, init: RequestInit = {}, retry = false): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(`${API}${path}`, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const err = new ApiError(
          (body as Partial<ApiErrorBody>).error ?? `Request failed (${res.status})`,
          res.status,
        );
        if (retry && res.status >= 500 && attempt < MAX_RETRIES) {
          await sleep(BACKOFF_MS * 2 ** attempt);
          continue;
        }
        throw err;
      }
      return (await res.json()) as T;
    } catch (e) {
      if (e instanceof ApiError) throw e;
      // fetch rejects for network failure; AbortSignal.timeout rejects with TimeoutError.
      const timedOut = e instanceof DOMException && e.name === "TimeoutError";
      if (retry && attempt < MAX_RETRIES) {
        await sleep(BACKOFF_MS * 2 ** attempt);
        continue;
      }
      throw new ApiError(
        timedOut
          ? `The server took longer than ${TIMEOUT_MS / 1000} seconds to respond. Try again.`
          : "Can't reach the server. Check your connection and try again.",
        0,
      );
    }
  }
}

export const listExpenses = (q: { category?: string; page: number; limit: number }) =>
  // Safe to retry: a read changes nothing.
  request<ExpenseListResponse>(
    `/api/expenses?${new URLSearchParams(Object.entries(q).flatMap(([k, v]) => (v ? [[k, String(v)]] : [])))}`,
    {},
    true,
  );

export const getSummary = (month: string) =>
  // Safe to retry: a read changes nothing.
  request<ExpenseSummaryResponse>(`/api/expenses/summary?month=${encodeURIComponent(month)}`, {}, true);

export const createExpense = (input: CreateExpenseInput) =>
  // NOT retried. POST isn't idempotent and carries no idempotency key, so a
  // timeout or 5xx after the row was written would silently create a duplicate
  // expense. Better to surface the error and let the person decide.
  request<Expense>("/api/expenses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

export const deleteExpense = (id: string) =>
  // NOT retried. DELETE is idempotent in effect, but this API answers 404 for an
  // already-deleted id — so a retry after a lost response would report "Expense
  // not found" for a delete that actually succeeded. Confusing, not safer.
  request<{ ok: true }>(`/api/expenses/${encodeURIComponent(id)}`, { method: "DELETE" });
