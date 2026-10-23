"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { deleteExpense, listExpenses } from "@/lib/api";
import { CATEGORIES } from "@expense/shared";

const LIMIT = 10;
const button =
  "rounded-md border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50";

export default function ExpenseList() {
  const qc = useQueryClient();
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const { data, isPending, isError, error, isPlaceholderData } = useQuery({
    queryKey: ["expenses", "list", { category, page, limit: LIMIT }],
    queryFn: () => listExpenses({ category, page, limit: LIMIT }),
    placeholderData: keepPreviousData,
  });
  const del = useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses"] }),
  });

  const totalPages = Math.max(1, Math.ceil((data?.total_count ?? 0) / LIMIT));
  // A delete can leave the current page past the end; step back.
  if (data && !isPlaceholderData && page > totalPages) setPage(totalPages);

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-medium">Expenses</h2>
        <div className="flex items-center gap-2">
          <label htmlFor="filter-category" className="text-sm text-zinc-600">Category</label>
          <select
            id="filter-category"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="rounded-md border border-zinc-300 px-2 py-1 text-sm capitalize"
          >
            <option value="">All</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {del.isError && (
        <div role="alert" className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Delete failed: {del.error.message}
        </div>
      )}

      {isPending ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : isError ? (
        <p role="alert" className="text-sm text-red-600">{error.message}</p>
      ) : (
        <>
          <p className="mb-2 text-sm text-zinc-600">
            {data.total_count} {data.total_count === 1 ? "expense" : "expenses"} · Total{" "}
            <span className="font-semibold text-zinc-900 tabular-nums">{data.total_amount.toFixed(2)}</span>
          </p>
          {data.items.length === 0 ? (
            <p className="py-6 text-center text-sm text-zinc-500">No expenses yet.</p>
          ) : (
            <ul className={`divide-y divide-zinc-100 ${isPlaceholderData ? "opacity-60" : ""}`}>
              {data.items.map((e) => (
                <li key={e.id} className="flex items-center gap-3 py-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{e.title}</p>
                    <p className="text-xs text-zinc-500">
                      <span className="capitalize">{e.category}</span> · {e.date}
                    </p>
                  </div>
                  <span className="tabular-nums">{e.amount.toFixed(2)}</span>
                  <button
                    type="button"
                    disabled={del.isPending && del.variables === e.id}
                    onClick={() => window.confirm(`Delete "${e.title}"?`) && del.mutate(e.id)}
                    aria-label={`Delete ${e.title}`}
                    className="rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {del.isPending && del.variables === e.id ? "Deleting…" : "Delete"}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex items-center justify-between">
            <button type="button" className={button} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <span className="text-sm text-zinc-600">Page {page} of {totalPages}</span>
            <button
              type="button"
              className={button}
              disabled={page >= totalPages || isPlaceholderData}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </section>
  );
}
