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
      <Header title="wallet transactions" backHref="/" />

      <main className="p-5 space-y-3">
        {walletTransactions.length === 0 ? (
              <Card>
                <div className="text-gray-400 text-center py-10">
                  <p>no wallet transactions found.</p>
                  <p className="mt-2">
                    <Link
                      href="/wallet/new"
                      className="text-[#FCD34D] hover:text-[#FBBF24] hover:underline font-medium"
                    >
                      add your first expense
                    </Link>
                  </p>
                </div>
              </Card>
            ) : (
              walletTransactions.map((tx) => (
            <Card key={tx.id} hover>
              <div className="flex items-center justify-between">
                <Link
                  href={`/wallet/transactions/${tx.id}`}
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
                      {tx.type === "receive" ? "income" : "expense"}
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
              ))
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

