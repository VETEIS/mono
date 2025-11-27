"use client";

import { useRouter, useParams } from "next/navigation";
import { useStore } from "@/store/useStore";
import Header from "@/components/Header";
import TransactionForm from "@/components/TransactionForm";
import Card from "@/components/Card";
import { useEffect, useState } from "react";
import type { Transaction } from "@/types";

export default function EditWalletTransactionPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const transactions = useStore((state) => state.transactions);
  const updateTransaction = useStore((state) => state.updateTransaction);
  const [transaction, setTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    const tx = transactions.find((t) => t.id === id && t.wallet);
    if (tx) {
      setTransaction(tx);
    } else {
      router.push("/wallet/transactions");
    }
  }, [id, transactions, router]);

  const handleSubmit = (data: Omit<Transaction, "id">) => {
    updateTransaction(id, {
      ...data,
      wallet: true, // Ensure it stays a wallet transaction
    });
    router.push("/wallet/transactions");
  };

  if (!transaction) {
    return (
      <div className="min-h-screen pb-20">
        <Header title="edit transaction" backHref="/wallet/transactions" />
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
      <Header title="edit transaction" backHref="/wallet/transactions" />
      <main className="p-5">
        <Card>
          <TransactionForm initialData={transaction} onSubmit={handleSubmit} isWallet={true} />
        </Card>
      </main>
    </div>
  );
}

