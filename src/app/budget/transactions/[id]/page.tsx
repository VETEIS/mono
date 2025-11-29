"use client";

import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useStore } from "@/store/useStore";
import Header from "@/components/Header";
import TransactionForm from "@/components/TransactionForm";
import Card from "@/components/Card";
import { useEffect, useState } from "react";
import type { Transaction } from "@/types";

export default function EditBudgetTransactionPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const transactions = useStore((state) => state.transactions);
  const updateTransaction = useStore((state) => state.updateTransaction);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  
  const fromMain = searchParams.get("from") === "main";
  const backHref = fromMain ? "/" : "/budget/transactions";

  useEffect(() => {
    const tx = transactions.find((t) => t.id === id && t.budget);
    if (tx) {
      setTransaction(tx);
    } else {
      router.push(backHref);
    }
  }, [id, transactions, router, backHref]);

  const handleSubmit = (data: Omit<Transaction, "id">) => {
    updateTransaction(id, {
      ...data,
      budget: true, // Ensure it stays a budget transaction
    });
    router.push(backHref);
  };

  if (!transaction) {
    return (
      <div className="min-h-screen pb-20">
        <Header title="edit transaction" backHref={backHref} />
        <main className="p-5">
          <Card>
            <p className="text-gray-400 text-center py-8">loading...</p>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <Header title="edit transaction" backHref={backHref} />
      <main className="p-5">
        <Card>
          <TransactionForm initialData={transaction} onSubmit={handleSubmit} isBudget={true} />
        </Card>
      </main>
    </div>
  );
}

