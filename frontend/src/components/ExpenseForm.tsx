"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { createExpense } from "@/services/expenses.service";
import { CATEGORY_COLOR } from "@/lib/categories";
import { useToday } from "@/lib/today";
import { CATEGORIES, createExpenseSchema } from "@expense/shared";

const field =
  "w-full rounded-[5px] border border-rule bg-panel px-3 py-2.5 text-[0.9375rem] text-ink transition-colors placeholder:text-ink-faint hover:border-ink-faint aria-[invalid=true]:border-danger";
const labelCls = "mb-1.5 block text-[0.8125rem] font-medium text-ink-soft";
const errorText = "mt-1.5 flex items-start gap-1.5 text-[0.8125rem] font-medium text-danger";

function WarningIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="mt-px h-4 w-4 shrink-0 fill-current">
      <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Zm.75 3.25v4.5h-1.5v-4.5h1.5Zm0 5.75v1.5h-1.5v-1.5h1.5Z" />
    </svg>
  );
}

export default function ExpenseForm() {
  const today = useToday();
  return (
    <section aria-labelledby="add-expense-heading">
      <h2
        id="add-expense-heading"
        className="border-b border-rule pb-2.5 text-[1.0625rem] font-semibold tracking-[-0.01em]"
      >
        Add an expense
      </h2>
      <div className="mt-5">
        {/* Mount after hydration so the default date is the user's local today. */}
        {today ? <Form today={today} /> : <FormSkeleton />}
      </div>
    </section>
  );
}

function FormSkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="space-y-1.5">
          <div className="h-3 w-16 rounded bg-rule" />
          <div className="h-[42px] rounded-[5px] border border-rule bg-panel" />
        </div>
      ))}
      <div className="h-[42px] rounded-[5px] bg-rule" />
    </div>
  );
}

function Form({ today }: { today: string }) {
  const qc = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createExpenseSchema),
    defaultValues: { title: "", category: "food", date: today },
  });
  const mutation = useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      reset();
      return qc.invalidateQueries({ queryKey: ["expenses"] });
    },
  });

  return (
    <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate className="space-y-4">
      {mutation.isError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-[5px] border border-danger bg-danger-wash px-3 py-2.5 text-[0.875rem] font-medium text-danger"
        >
          <WarningIcon />
          <span>{mutation.error.message}</span>
        </div>
      )}

      <div>
        <label htmlFor="title" className={labelCls}>
          Title
        </label>
        <input
          id="title"
          className={field}
          placeholder="Lunch at the station"
          autoComplete="off"
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? "title-error" : undefined}
          {...register("title")}
        />
        {errors.title && (
          <p id="title-error" className={errorText}>
            <WarningIcon />
            {errors.title.message}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="amount" className={labelCls}>
            Amount
          </label>
          <input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            placeholder="0.00"
            className={`${field} text-right tabular-nums`}
            aria-invalid={!!errors.amount}
            aria-describedby={errors.amount ? "amount-error" : undefined}
            {...register("amount", { valueAsNumber: true })}
          />
          {errors.amount && (
            <p id="amount-error" className={errorText}>
              <WarningIcon />
              {errors.amount.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="date" className={labelCls}>
            Date
          </label>
          <input
            id="date"
            type="date"
            max={today}
            className={`${field} tabular-nums`}
            aria-invalid={!!errors.date}
            aria-describedby={errors.date ? "date-error" : undefined}
            {...register("date", { setValueAs: (v) => v || undefined })}
          />
          {errors.date && (
            <p id="date-error" className={errorText}>
              <WarningIcon />
              {errors.date.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="category" className={labelCls}>
          Category
        </label>
        <div className="relative">
          <select
            id="category"
            className={`${field} appearance-none pr-10 capitalize`}
            aria-invalid={!!errors.category}
            aria-describedby={errors.category ? "category-error" : undefined}
            {...register("category")}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <svg
            aria-hidden="true"
            viewBox="0 0 12 12"
            className="pointer-events-none absolute right-3.5 top-1/2 h-3 w-3 -translate-y-1/2 fill-none stroke-current stroke-[1.75] text-ink-faint"
          >
            <path d="M2.5 4.5 6 8l3.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        {errors.category && (
          <p id="category-error" className={errorText}>
            <WarningIcon />
            {errors.category.message}
          </p>
        )}
        {/* The category colours used throughout the page, legended once. */}
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
          {CATEGORIES.map((c) => (
            <li key={c} className="flex items-center gap-1.5 text-[0.75rem] text-ink-faint">
              <span
                aria-hidden="true"
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: CATEGORY_COLOR[c] }}
              />
              <span className="capitalize">{c}</span>
            </li>
          ))}
        </ul>
      </div>

      <button
        type="submit"
        disabled={mutation.isPending}
        className="min-h-[44px] w-full rounded-[5px] bg-accent px-4 py-2.5 text-[0.9375rem] font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-55 dark:text-[#15151a]"
      >
        {mutation.isPending ? "Saving…" : "Add expense"}
      </button>
    </form>
  );
}
