"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useStore } from "@/store/useStore";
import { formatCurrency, formatDate } from "@/utils/format";
import Card from "@/components/Card";
import Header from "@/components/Header";
import Link from "next/link";
import { Plus, Filter, Edit, Trash2 } from "lucide-react";
import type { TransactionType } from "@/types";
import { useRouter, useSearchParams } from "next/navigation";
import Modal from "@/components/Modal";

function TransactionsContent() {
  const transactions = useStore((state) => state.transactions);
  const deleteTransaction = useStore((state) => state.deleteTransaction);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [deleteModal, setDeleteModal] = useState<string | null>(null);
  
  // Get filter from URL or default to "all"
  const urlFilter = searchParams.get("filter");
  const [filter, setFilter] = useState<TransactionType | "all">(
    (urlFilter === "receive" || urlFilter === "pay" ? urlFilter : "all") as TransactionType | "all"
  );

  // Update filter when URL changes
  useEffect(() => {
    const urlFilter = searchParams.get("filter");
    if (urlFilter === "receive" || urlFilter === "pay") {
      setFilter(urlFilter);
    } else {
      setFilter("all");
    }
  }, [searchParams]);

  const updateFilter = (newFilter: TransactionType | "all") => {
    setFilter(newFilter);
    if (newFilter === "all") {
      router.push("/transactions");
    } else {
      router.push(`/transactions?filter=${newFilter}`);
    }
  };

  const filteredTransactions = useMemo(() => {
    if (filter === "all") return transactions;
    return transactions.filter((tx) => tx.type === filter);
  }, [transactions, filter]);

  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [filteredTransactions]);

  const handleDelete = (id: string) => {
    deleteTransaction(id);
    setDeleteModal(null);
  };

  return (
    <div className="min-h-screen pb-20">
      <Header
        title="transactions"
        action={
          <Link
            href="/transactions/new"
            className="p-2.5 hover:bg-[#2C2C2E] rounded-xl transition-colors active:scale-95"
          >
            <Plus className="w-6 h-6 text-[#FCD34D]" />
          </Link>
        }
      />

      <main className="p-5 space-y-5">
        {/* Filter */}
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-gray-400" />
          <div className="flex gap-2 flex-1">
            {(["all", "receive", "pay"] as const).map((type) => (
              <button
                key={type}
                onClick={() => updateFilter(type)}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
                  filter === type
                    ? "bg-[#FCD34D] text-[#1C1C1E] shadow-lg shadow-[#FCD34D]/20"
                    : "bg-[#2C2C2E] text-gray-300 hover:bg-[#3A3A3C]"
                }`}
              >
                {type === "all"
                  ? "all"
                  : type === "receive"
                  ? "receive"
                  : "pay"}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions List */}
        {sortedTransactions.length === 0 ? (
          <Card>
            <div className="text-gray-400 text-center py-10">
              <p>no transactions found.</p>
              <p className="mt-2">
                <Link href="/transactions/new" className="text-[#FCD34D] hover:text-[#FBBF24] hover:underline font-medium">
                  add your first transaction
                </Link>
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {sortedTransactions.map((tx) => (
              <Card key={tx.id} hover>
                <div className="flex items-center justify-between">
                  <Link
                    href={`/transactions/${tx.id}`}
                    className="flex-1"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-xl ${
                          tx.type === "receive"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {tx.type === "receive" ? "receive" : "pay"}
                      </span>
                      {tx.category && (
                        <span className="text-xs text-gray-500 font-medium">
                          {tx.category}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-50 font-semibold mb-1">{tx.label}</p>
                    <p className="text-xs text-gray-400">{formatDate(tx.date)}</p>
                    {tx.notes && (
                      <p className="text-xs text-gray-500 mt-1.5 line-clamp-1">
                        {tx.notes}
                      </p>
                    )}
                  </Link>
                  <div className="flex items-center gap-3 ml-4">
                    <p
                      className={`text-xl font-bold ${
                        tx.type === "receive"
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {tx.type === "receive" ? "+" : "-"}
                      {formatCurrency(tx.amount)}
                    </p>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setDeleteModal(tx.id);
                      }}
                      className="p-2 hover:bg-red-500/10 rounded-xl transition-colors active:scale-95"
                    >
                      <Trash2 className="w-5 h-5 text-red-400" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal !== null}
        onClose={() => setDeleteModal(null)}
        title="delete transaction"
      >
        <p className="text-gray-300 mb-5">
          are you sure you want to delete this transaction? this action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setDeleteModal(null)}
            className="flex-1 px-5 py-3 bg-[#2C2C2E] hover:bg-[#3A3A3C] text-gray-300 rounded-2xl transition-all font-semibold active:scale-95"
          >
            cancel
          </button>
          <button
            onClick={() => deleteModal && handleDelete(deleteModal)}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            delete
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pb-20">
        <Header title="transactions" />
        <main className="p-5">
          <Card>
            <p className="text-gray-400 text-center py-8">loading...</p>
          </Card>
        </main>
      </div>
    }>
      <TransactionsContent />
    </Suspense>
  );
}

