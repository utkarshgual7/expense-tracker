"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { createExpense } from "@/lib/api";
import { useToday } from "@/lib/today";
import { CATEGORIES, createExpenseSchema } from "@expense/shared";

const input =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none aria-[invalid=true]:border-red-500";
const errorText = "mt-1 text-xs text-red-600";

export default function ExpenseForm() {
  const today = useToday();
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-medium">Add expense</h2>
      {/* Mount after hydration so the default date is the user's local today. */}
      {today && <Form today={today} />}
    </section>
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
    <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate className="space-y-3">
      {mutation.isError && (
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {mutation.error.message}
        </div>
      )}
      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-medium">Title</label>
        <input
          id="title"
          className={input}
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? "title-error" : undefined}
          {...register("title")}
        />
        {errors.title && <p id="title-error" className={errorText}>{errors.title.message}</p>}
      </div>
      <div>
        <label htmlFor="amount" className="mb-1 block text-sm font-medium">Amount</label>
        <input
          id="amount"
          type="number"
          step="0.01"
          min="0"
          inputMode="decimal"
          className={input}
          aria-invalid={!!errors.amount}
          aria-describedby={errors.amount ? "amount-error" : undefined}
          {...register("amount", { valueAsNumber: true })}
        />
        {errors.amount && <p id="amount-error" className={errorText}>{errors.amount.message}</p>}
      </div>
      <div>
        <label htmlFor="category" className="mb-1 block text-sm font-medium">Category</label>
        <select
          id="category"
          className={`${input} capitalize`}
          aria-invalid={!!errors.category}
          aria-describedby={errors.category ? "category-error" : undefined}
          {...register("category")}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {errors.category && <p id="category-error" className={errorText}>{errors.category.message}</p>}
      </div>
      <div>
        <label htmlFor="date" className="mb-1 block text-sm font-medium">Date</label>
        <input
          id="date"
          type="date"
          max={today}
          className={input}
          aria-invalid={!!errors.date}
          aria-describedby={errors.date ? "date-error" : undefined}
          {...register("date", { setValueAs: (v) => v || undefined })}
        />
        {errors.date && <p id="date-error" className={errorText}>{errors.date.message}</p>}
      </div>
      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
      >
        {mutation.isPending ? "Saving…" : "Add expense"}
      </button>
    </form>
  );
}
