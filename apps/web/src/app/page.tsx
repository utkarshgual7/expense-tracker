import ExpenseForm from "@/components/ExpenseForm";
import ExpenseList from "@/components/ExpenseList";
import MonthlySummary from "@/components/MonthlySummary";

export default function Home() {
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-semibold">Expense Tracker</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <ExpenseForm />
        <MonthlySummary />
      </div>
      <ExpenseList />
    </main>
  );
}
