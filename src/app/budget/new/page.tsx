"use client";

import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import Header from "@/components/Header";
import TransactionForm from "@/components/TransactionForm";
import Card from "@/components/Card";
import { useMemo, useState, useEffect } from "react";
import { formatCurrency } from "@/utils/format";

export default function NewBudgetTransactionPage() {
  const router = useRouter();
  const addTransaction = useStore((state) => state.addTransaction);
  const budget = useStore((state) => state.budget);
  const transactions = useStore((state) => state.transactions);
  const [error, setError] = useState<string | null>(null);

  // Calculate remaining budget
  const remaining = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentMonthTransactions = transactions.filter((tx) => {
      if (!tx.budget) return false;
      const txDate = new Date(tx.date);
      return (
        txDate.getMonth() === currentMonth &&
        txDate.getFullYear() === currentYear
      );
    });

    const spent = currentMonthTransactions.reduce((sum, tx) => {
      if (tx.type === "receive") {
        return sum - tx.amount;
      } else {
        return sum + tx.amount;
      }
    }, 0);

    return budget - spent;
  }, [budget, transactions]);

  const handleSubmit = (data: Parameters<typeof addTransaction>[0]) => {
    // Only prevent "pay" (expense) transactions when there's no budget remaining
    // Allow "receive" (income) transactions to add money back to budget
    if (data.type === "pay") {
      if (remaining <= 0) {
        setError(`no budget remaining. available: ${formatCurrency(remaining)}`);
        return;
      }
      
      // Check if the expense amount exceeds remaining
      if (data.amount > remaining) {
        setError(`expense exceeds remaining budget. available: ${formatCurrency(remaining)}`);
        return;
      }
    }

    setError(null);
    addTransaction({
      ...data,
      budget: true, // Mark as budget transaction
    });
    router.push("/");
  };

  return (
    <div className="min-h-screen pb-20">
      <Header title="add expense" backHref="/" />
      <main className="p-5">
        <Card>
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="text-sm text-red-400 font-medium">{error}</p>
            </div>
          )}
          {remaining <= 0 && (
            <div className="mb-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-xl">
              <p className="text-sm text-orange-400 font-medium">
                no budget remaining. increase your budget.
              </p>
            </div>
          )}
          <TransactionForm onSubmit={handleSubmit} isBudget={true} />
        </Card>
      </main>
    </div>
  );
}

