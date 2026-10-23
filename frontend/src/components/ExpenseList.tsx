"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { deleteExpense, listExpenses } from "@/services/expenses.service";
import { CATEGORY_COLOR, money, shortDate } from "@/lib/categories";
import { CATEGORIES, type Category } from "@expense/shared";

const LIMIT = 10;
const pageButton =
  "inline-flex min-h-[40px] items-center gap-1.5 rounded-[5px] border border-rule bg-panel px-3 text-[0.875rem] font-medium text-ink transition-colors hover:border-ink-faint disabled:cursor-not-allowed disabled:border-rule disabled:text-ink-faint disabled:opacity-60";

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
    <section id="ledger" aria-labelledby="ledger-heading" className="scroll-mt-6">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-rule pb-2.5">
        <h2 id="ledger-heading" className="text-[1.0625rem] font-semibold tracking-[-0.01em]">
          The ledger
        </h2>
        <div className="flex items-center gap-2">
          <label htmlFor="filter-category" className="text-[0.8125rem] text-ink-soft">
            Showing
          </label>
          <div className="relative">
            <select
              id="filter-category"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="min-h-[34px] appearance-none rounded-[5px] border border-rule bg-panel py-1 pl-2.5 pr-8 text-[0.8125rem] font-medium capitalize text-ink transition-colors hover:border-ink-faint"
            >
              <option value="">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <svg
              aria-hidden="true"
              viewBox="0 0 12 12"
              className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 fill-none stroke-current stroke-[1.75] text-ink-faint"
            >
              <path d="M2.5 4.5 6 8l3.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>

      {del.isError && (
        <div
          role="alert"
          className="mt-4 rounded-[5px] border border-danger bg-danger-wash px-3 py-2.5 text-[0.875rem] font-medium text-danger"
        >
          Couldn’t delete that expense. {del.error.message}
        </div>
      )}

      {/* Count and total update after every mutation; announce them politely. */}
      <div aria-live="polite" aria-atomic="true">
        {isPending ? (
          <>
            <p className="sr-only">Loading expenses.</p>
            <ListSkeleton />
          </>
        ) : isError ? (
          <div
            role="alert"
            className="mt-6 rounded-[6px] border border-danger bg-danger-wash px-4 py-5 text-center"
          >
            <p className="text-[0.9375rem] font-semibold text-danger">Couldn’t load the ledger</p>
            <p className="mx-auto mt-1 max-w-[40ch] text-[0.875rem] text-ink-soft">{error.message}</p>
          </div>
        ) : (
          <>
            <p className="mt-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-[0.875rem] text-ink-soft">
              <span>
                {data.total_count} {data.total_count === 1 ? "entry" : "entries"}
                {category && <span className="capitalize"> in {category}</span>}
              </span>
              <span>
                <span className="mr-1.5">Total</span>
                <span className="text-[1.0625rem] font-semibold tabular-nums text-ink">
                  {money(data.total_amount)}
                </span>
              </span>
            </p>

            {data.items.length === 0 ? (
              <Empty filtered={!!category} onClear={() => setCategory("")} />
            ) : (
              <ul
                className={`mt-2 border-t border-rule transition-opacity ${
                  isPlaceholderData ? "opacity-50" : ""
                }`}
              >
                {data.items.map((e) => {
                  const deleting = del.isPending && del.variables === e.id;
                  return (
                    <li
                      key={e.id}
                      className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 border-b border-rule py-3 sm:gap-x-4"
                    >
                      <span
                        aria-hidden="true"
                        className="h-7 w-[3px] rounded-full"
                        style={{ background: CATEGORY_COLOR[e.category as Category] }}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-[0.9375rem] font-medium leading-snug">{e.title}</p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-[0.75rem] text-ink-faint">
                          <span className="capitalize" style={{ color: CATEGORY_COLOR[e.category as Category] }}>
                            {e.category}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums">{shortDate(e.date)}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span className="text-[0.9375rem] font-semibold tabular-nums">
                          {money(e.amount)}
                        </span>
                        <button
                          type="button"
                          disabled={deleting}
                          onClick={() => window.confirm(`Delete "${e.title}"?`) && del.mutate(e.id)}
                          aria-label={`Delete ${e.title}`}
                          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[5px] text-ink-faint transition-colors hover:bg-danger-wash hover:text-danger disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deleting ? (
                            <span className="text-[0.6875rem] font-semibold text-danger">…</span>
                          ) : (
                            <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4 fill-current">
                              <path d="M6.5 1h3a.5.5 0 0 1 .5.5V2h3.25a.75.75 0 0 1 0 1.5h-.4l-.67 9.3A2.25 2.25 0 0 1 9.94 15H6.06a2.25 2.25 0 0 1-2.24-2.2l-.67-9.3h-.4a.75.75 0 0 1 0-1.5H6V1.5A.5.5 0 0 1 6.5 1Zm-1.84 2.5.66 9.19a.75.75 0 0 0 .74.81h3.88a.75.75 0 0 0 .74-.81l.66-9.19H4.66ZM7 5.5v6H6v-6h1Zm3 0v6H9v-6h1Z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            <nav aria-label="Ledger pages" className="mt-5 flex items-center justify-between gap-3">
              <button
                type="button"
                className={pageButton}
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <svg aria-hidden="true" viewBox="0 0 12 12" className="h-3 w-3 fill-none stroke-current stroke-[1.75]">
                  <path d="M7.5 2.5 4 6l3.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Previous
              </button>
              <span className="text-[0.8125rem] tabular-nums text-ink-soft">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                className={pageButton}
                disabled={page >= totalPages || isPlaceholderData}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <svg aria-hidden="true" viewBox="0 0 12 12" className="h-3 w-3 fill-none stroke-current stroke-[1.75]">
                  <path d="M4.5 2.5 8 6l-3.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </nav>
          </>
        )}
      </div>
    </section>
  );
}

function ListSkeleton() {
  // Skeleton rows match the real row height so nothing shifts on load.
  return (
    <div className="mt-4" aria-hidden="true">
      <div className="mb-2 flex justify-between">
        <div className="h-4 w-20 rounded bg-rule" />
        <div className="h-4 w-28 rounded bg-rule" />
      </div>
      <ul className="border-t border-rule">
        {Array.from({ length: 6 }, (_, i) => (
          <li key={i} className="flex items-center gap-3 border-b border-rule py-3 sm:gap-4">
            <span className="h-7 w-[3px] rounded-full bg-rule" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="h-[15px] rounded bg-rule" style={{ width: `${55 + ((i * 13) % 35)}%` }} />
              <div className="h-3 w-24 rounded bg-rule" />
            </div>
            <div className="h-[15px] w-16 rounded bg-rule" />
          </li>
        ))}
      </ul>
    </div>
  );
}

function Empty({ filtered, onClear }: { filtered: boolean; onClear: () => void }) {
  return (
    <div className="mt-2 border-y border-rule px-4 py-14 text-center">
      <svg
        aria-hidden="true"
        viewBox="0 0 48 48"
        className="mx-auto h-9 w-9 fill-none stroke-current stroke-[1.5] text-ink-faint"
      >
        <path d="M10 8h28v32H10z" strokeLinejoin="round" />
        <path d="M16 18h16M16 25h16M16 32h9" strokeLinecap="round" />
      </svg>
      <p className="mt-4 text-[0.9375rem] font-semibold">
        {filtered ? "Nothing in this category" : "The ledger is empty"}
      </p>
      <p className="mx-auto mt-1 max-w-[34ch] text-[0.875rem] leading-relaxed text-ink-soft">
        {filtered
          ? "Try another category, or show everything."
          : "Add your first expense and it will appear here."}
      </p>
      {filtered && (
        <button
          type="button"
          onClick={onClear}
          className="mt-4 min-h-[40px] rounded-[5px] border border-rule bg-panel px-3.5 text-[0.875rem] font-medium text-accent transition-colors hover:border-accent"
        >
          Show all categories
        </button>
      )}
    </div>
  );
}
