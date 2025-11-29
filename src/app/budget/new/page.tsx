"use client";

import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import Header from "@/components/Header";
import TransactionForm from "@/components/TransactionForm";
import Card from "@/components/Card";

export default function NewBudgetTransactionPage() {
  const router = useRouter();
  const addTransaction = useStore((state) => state.addTransaction);

  const handleSubmit = (data: Parameters<typeof addTransaction>[0]) => {
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
          <TransactionForm onSubmit={handleSubmit} isBudget={true} />
        </Card>
      </main>
    </div>
  );
}

