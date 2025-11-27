"use client";

import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import Header from "@/components/Header";
import TransactionForm from "@/components/TransactionForm";
import Card from "@/components/Card";

export default function NewTransactionPage() {
  const router = useRouter();
  const addTransaction = useStore((state) => state.addTransaction);

  const handleSubmit = (data: Parameters<typeof addTransaction>[0]) => {
    addTransaction(data);
    router.push("/transactions");
  };

  return (
    <div className="min-h-screen pb-20">
      <Header title="new transaction" backHref="/transactions" />
      <main className="p-5">
        <Card>
          <TransactionForm onSubmit={handleSubmit} />
        </Card>
      </main>
    </div>
  );
}

