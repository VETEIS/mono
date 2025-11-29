"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/store/useStore";
import Header from "@/components/Header";
import TransactionForm from "@/components/TransactionForm";
import Card from "@/components/Card";
import { Suspense } from "react";
import type { TransactionType } from "@/types";

function NewTransactionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addTransaction = useStore((state) => state.addTransaction);
  
  const typeParam = searchParams.get("type");
  const initialType: TransactionType | undefined = 
    typeParam === "receive" || typeParam === "pay" ? typeParam : undefined;

  const handleSubmit = (data: Parameters<typeof addTransaction>[0]) => {
    addTransaction(data);
    router.push("/debts");
  };

  return (
    <div className="min-h-screen pb-20">
      <Header title="new transaction" backHref="/debts" />
      <main className="p-5 min-w-0 max-w-full overflow-x-hidden">
        <Card className="min-w-0 max-w-full">
          <TransactionForm onSubmit={handleSubmit} initialType={initialType} />
        </Card>
      </main>
    </div>
  );
}

export default function NewTransactionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pb-20">
        <Header title="new transaction" backHref="/debts" />
        <main className="p-5">
          <Card>
            <p className="text-gray-400 text-center py-8">loading...</p>
          </Card>
        </main>
      </div>
    }>
      <NewTransactionContent />
    </Suspense>
  );
}

