"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getSummary } from "@/lib/api";
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

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-lg font-medium">Monthly summary</h2>
        <label htmlFor="summary-month" className="sr-only">Month</label>
        <input
          id="summary-month"
          type="month"
          value={month}
          onChange={(e) => setPicked(e.target.value)}
          className="rounded-md border border-zinc-300 px-2 py-1 text-sm"
        />
      </div>
      {!month ? (
        <p className="text-sm text-zinc-500">Pick a month.</p>
      ) : isPending ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : isError ? (
        <p role="alert" className="text-sm text-red-600">{error.message}</p>
      ) : (
        <dl className="divide-y divide-zinc-100 text-sm">
          {CATEGORIES.map((c) => (
            <div key={c} className="flex justify-between py-2">
              <dt className="capitalize text-zinc-600">{c}</dt>
              <dd className="tabular-nums">{data.by_category[c].toFixed(2)}</dd>
            </div>
          ))}
          <div className="flex justify-between py-2 font-semibold">
            <dt>Total</dt>
            <dd className="tabular-nums">{data.total.toFixed(2)}</dd>
          </div>
        </dl>
      )}
    </section>
  );
}
