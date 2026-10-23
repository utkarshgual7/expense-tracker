"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getSummary } from "@/services/expenses.service";
import { CATEGORY_COLOR, money } from "@/lib/categories";
import { useToday } from "@/lib/today";
import { CATEGORIES } from "@expense/shared";

export default function MonthlySummary() {
  const today = useToday();
  const [picked, setPicked] = useState<string>();
  const month = picked ?? today.slice(0, 7);
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["expenses", "summary", month],
    queryFn: () => getSummary(month),
    enabled: !!month,
  });

  // Bars are scaled to the largest category so the smallest is still visible.
  const peak = data ? Math.max(...CATEGORIES.map((c) => data.by_category[c]), 0) : 0;

  return (
    <section aria-labelledby="summary-heading">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-rule pb-2.5">
        <h2 id="summary-heading" className="text-[1.0625rem] font-semibold tracking-[-0.01em]">
          Where it went
        </h2>
        <label htmlFor="summary-month" className="sr-only">
          Month
        </label>
        <input
          id="summary-month"
          type="month"
          value={month}
          onChange={(e) => setPicked(e.target.value)}
          className="min-h-[34px] rounded-[5px] border border-rule bg-panel px-2.5 py-1 text-[0.8125rem] font-medium tabular-nums text-ink transition-colors hover:border-ink-faint"
        />
      </div>

      <div aria-live="polite" aria-atomic="true" className="mt-5">
        {!month ? (
          <SummarySkeleton />
        ) : isPending ? (
          <>
            <p className="sr-only">Loading the monthly summary.</p>
            <SummarySkeleton />
          </>
        ) : isError ? (
          <div
            role="alert"
            className="rounded-[6px] border border-danger bg-danger-wash px-4 py-4 text-center"
          >
            <p className="text-[0.9375rem] font-semibold text-danger">Couldn’t load the summary</p>
            <p className="mt-1 text-[0.875rem] text-ink-soft">{error.message}</p>
          </div>
        ) : (
          <>
            <p className="flex items-baseline justify-between gap-3">
              <span className="text-[0.8125rem] text-ink-soft">Total this month</span>
              <span className="text-[1.5rem] font-semibold leading-none tracking-[-0.02em] tabular-nums">
                {money(data.total)}
              </span>
            </p>

            {data.total === 0 ? (
              <p className="mt-4 border-t border-rule pt-4 text-[0.875rem] leading-relaxed text-ink-soft">
                No expenses recorded for this month yet.
              </p>
            ) : (
              <dl className="mt-5 space-y-3.5">
                {CATEGORIES.map((c) => {
                  const value = data.by_category[c];
                  const share = data.total > 0 ? Math.round((value / data.total) * 100) : 0;
                  return (
                    <div key={c}>
                      <div className="flex items-baseline justify-between gap-3">
                        <dt className="flex items-center gap-1.5 text-[0.875rem] font-medium">
                          <span
                            aria-hidden="true"
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ background: CATEGORY_COLOR[c] }}
                          />
                          <span className="capitalize">{c}</span>
                        </dt>
                        <dd className="text-[0.875rem] font-semibold tabular-nums">
                          {money(value)}
                          <span className="ml-2 font-normal text-ink-faint">{share}%</span>
                        </dd>
                      </div>
                      {/* Decorative: the figure and percentage above carry the same data. */}
                      <div
                        aria-hidden="true"
                        className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-rule"
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: peak > 0 ? `${Math.max((value / peak) * 100, value > 0 ? 2 : 0)}%` : "0%",
                            background: CATEGORY_COLOR[c],
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </dl>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function SummarySkeleton() {
  return (
    <div aria-hidden="true">
      <div className="flex items-baseline justify-between">
        <div className="h-3.5 w-24 rounded bg-rule" />
        <div className="h-6 w-28 rounded bg-rule" />
      </div>
      <div className="mt-5 space-y-3.5">
        {[72, 50, 88, 34].map((w, i) => (
          <div key={i}>
            <div className="flex items-baseline justify-between">
              <div className="h-3.5 w-16 rounded bg-rule" />
              <div className="h-3.5 w-20 rounded bg-rule" />
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-rule">
              <div className="h-full rounded-full bg-rule" style={{ width: `${w}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
