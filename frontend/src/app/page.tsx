import ExpenseForm from "@/components/ExpenseForm";
import ExpenseList from "@/components/ExpenseList";
import MonthlySummary from "@/components/MonthlySummary";

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-5 pb-20 pt-10 sm:px-8 sm:pt-14">
      <header className="border-b border-rule pb-5">
        <h1 className="text-[2rem] font-semibold leading-none tracking-[-0.025em] sm:text-[2.5rem]">
          Expenses
        </h1>
        <p className="mt-3 max-w-[52ch] text-[0.9375rem] leading-relaxed text-ink-soft">
          Every entry, what it cost, and where the month went.
        </p>
      </header>

      <main className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12">
        {/* The ledger is the page; the form and summary are the margin. */}
        <div className="min-w-0 lg:order-2 lg:space-y-10">
          <ExpenseForm />
          <div className="mt-10 lg:mt-0">
            <MonthlySummary />
          </div>
        </div>
        <div className="min-w-0 lg:order-1">
          <ExpenseList />
        </div>
      </main>
    </div>
  );
}
