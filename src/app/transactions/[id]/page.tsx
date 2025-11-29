"use client";

import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useStore } from "@/store/useStore";
import Header from "@/components/Header";
import TransactionForm from "@/components/TransactionForm";
import Card from "@/components/Card";
import { useEffect, useState, Suspense } from "react";
import type { Transaction } from "@/types";

function EditTransactionContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const from = searchParams.get("from");
  const transactions = useStore((state) => state.transactions);
  const updateTransaction = useStore((state) => state.updateTransaction);
  const [transaction, setTransaction] = useState<Transaction | null>(null);

  // Determine back href based on query parameter
  const backHref = from === "debts" ? "/debts" : "/transactions";

  useEffect(() => {
    const tx = transactions.find((t) => t.id === id);
    if (tx) {
      setTransaction(tx);
    } else {
      router.push(backHref);
    }
  }, [id, transactions, router, backHref]);

  const handleSubmit = (data: Omit<Transaction, "id">) => {
    updateTransaction(id, data);
    router.push(backHref);
  };

  if (!transaction) {
    return (
      <div className="min-h-screen pt-16 pb-20">
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
    <div className="min-h-screen pt-16 pb-20">
      <Header title="edit transaction" backHref={backHref} />
      <main className="p-5">
        <Card>
          <TransactionForm
            initialData={transaction}
            onSubmit={handleSubmit}
          />
        </Card>
      </main>
    </div>
  );
}

export default function EditTransactionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen pt-16 pb-20">
          <Header title="edit transaction" backHref="/transactions" />
          <main className="p-5">
            <Card>
              <p className="text-gray-400 text-center py-8">loading...</p>
            </Card>
          </main>
        </div>
      }
    >
      <EditTransactionContent />
    </Suspense>
  );
}

