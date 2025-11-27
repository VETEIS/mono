"use client";

import { useState, useMemo, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { formatCurrency, formatDate } from "@/utils/format";
import Card from "@/components/Card";
import Header from "@/components/Header";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import Modal from "@/components/Modal";

export default function WalletTransactionsPage() {
  const transactions = useStore((state) => state.transactions);
  const deleteTransaction = useStore((state) => state.deleteTransaction);
  const checkAndArchive = useStore((state) => state.checkAndArchive);
  const [deleteModal, setDeleteModal] = useState<string | null>(null);

  // Check and archive on mount
  useEffect(() => {
    checkAndArchive();
  }, [checkAndArchive]);

  // Get current month's wallet transactions
  const walletTransactions = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return transactions
      .filter((tx) => {
        if (!tx.wallet) return false;
        const txDate = new Date(tx.date);
        return (
          txDate.getMonth() === currentMonth &&
          txDate.getFullYear() === currentYear
        );
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions]);

  const handleDelete = (id: string) => {
    deleteTransaction(id);
    setDeleteModal(null);
  };

  return (
    <div className="min-h-screen pb-20">
      <Header title="records" backHref="/" />

      <main className="p-5">
        <Card>
          {walletTransactions.length === 0 ? (
            <div className="text-gray-400 text-center py-10">
              <p>no records found.</p>
              <p className="mt-2">
                <Link
                  href="/wallet/new"
                  className="text-[#FCD34D] hover:text-[#FBBF24] hover:underline font-medium"
                >
                  add your first expense
                </Link>
              </p>
            </div>
          ) : (
            <div className="space-y-0 overflow-hidden">
              {walletTransactions.map((tx, index) => (
                <Link
                  key={tx.id}
                  href={`/wallet/transactions/${tx.id}`}
                  className={`relative grid grid-cols-[35px_1fr_28px_40px_90px_40px] items-center gap-1 sm:gap-2 py-2.5 px-1 hover:bg-[#2C2C2E]/50 transition-colors ${index < walletTransactions.length - 1 ? 'border-b border-[#3A3A3C]/30' : ''}`}
                >
                  <div className="w-[35px]">
                    <span
                      className={`text-[10px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-lg whitespace-nowrap inline-block ${
                        tx.type === "receive"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {tx.type === "receive" ? "in" : "out"}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-gray-50 font-medium text-xs sm:text-sm truncate">
                      {tx.label}
                    </p>
                  </div>
                  <div className="w-[28px]">
                    <span className="text-[10px] text-gray-500 font-medium truncate block">
                      {tx.category || "-"}
                    </span>
                  </div>
                  <div className="w-[40px] text-right">
                    <p className="text-[10px] sm:text-xs text-gray-500 whitespace-nowrap">
                      {formatDate(tx.date)}
                    </p>
                  </div>
                  <div className="w-[90px] text-right">
                    <p
                      className={`text-sm sm:text-base font-bold whitespace-nowrap ${
                        tx.type === "receive"
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {tx.type === "receive" ? "+" : "-"}
                      {formatCurrency(tx.amount)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDeleteModal(tx.id);
                    }}
                    className="relative z-10 p-1.5 hover:bg-red-500/10 rounded-lg transition-colors active:scale-95 justify-self-end"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </Link>
              ))}
            </div>
          )}
        </Card>
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

