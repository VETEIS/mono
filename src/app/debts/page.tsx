"use client";

import { useStore } from "@/store/useStore";
import { formatCurrency, formatDate } from "@/utils/format";
import Card from "@/components/Card";
import Header from "@/components/Header";
import Link from "next/link";
import { ArrowRight, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { useMemo } from "react";

export default function DebtsPage() {
  const transactions = useStore((state) => state.transactions);

  const { totalReceive, totalPay, balance } = useMemo(() => {
    // Exclude wallet transactions - debts page is separate from wallet
    const nonWalletTransactions = transactions.filter((tx) => !tx.wallet);
    const receive = nonWalletTransactions
      .filter((tx) => tx.type === "receive")
      .reduce((sum, tx) => sum + tx.amount, 0);
    const pay = nonWalletTransactions
      .filter((tx) => tx.type === "pay")
      .reduce((sum, tx) => sum + tx.amount, 0);
    return {
      totalReceive: receive,
      totalPay: pay,
      balance: receive - pay,
    };
  }, [transactions]);

  const recentTransactions = useMemo(() => {
    // Exclude wallet transactions - debts page is separate from wallet
    return [...transactions]
      .filter((tx) => !tx.wallet)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);

  return (
    <div className="min-h-screen pb-20">
      <Header
        title="debts"
        showNotesButton={true}
      />

      <main className="p-5 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4">
          <Link href="/transactions/new?type=receive">
            <Card hover>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">total to receive</p>
                  <p className="text-3xl font-bold text-green-400">
                    {formatCurrency(totalReceive)}
                  </p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-2xl">
                  <TrendingUp className="w-7 h-7 text-green-400" />
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/transactions/new?type=pay">
            <Card hover>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">total to pay</p>
                  <p className="text-3xl font-bold text-red-400">
                    {formatCurrency(totalPay)}
                  </p>
                </div>
                <div className="p-3 bg-red-500/10 rounded-2xl">
                  <TrendingDown className="w-7 h-7 text-red-400" />
                </div>
              </div>
            </Card>
          </Link>

          <Card className="border-[#FCD34D]/30 bg-gradient-to-br from-[#2C2C2E] to-[#1C1C1E]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">balance</p>
                <p
                  className={`text-3xl font-bold ${
                    balance >= 0 ? "text-[#FCD34D]" : "text-red-400"
                  }`}
                >
                  {formatCurrency(balance)}
                </p>
              </div>
              <div className={`p-3 rounded-2xl ${balance >= 0 ? "bg-[#FCD34D]/10" : "bg-red-500/10"}`}>
                <DollarSign className={`w-7 h-7 ${balance >= 0 ? "text-[#FCD34D]" : "text-red-400"}`} />
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Transactions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-50">
              recent transactions
            </h2>
            <Link
              href="/transactions"
              className="text-sm text-[#FCD34D] hover:text-[#FBBF24] flex items-center gap-1.5 font-medium transition-colors"
            >
              view all
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <Card>
            {recentTransactions.length === 0 ? (
              <div className="text-gray-400 text-center py-8">
                <p>no transactions yet.</p>
                <p className="mt-2">
                  <Link href="/transactions/new" className="text-[#FCD34D] hover:text-[#FBBF24] hover:underline font-medium">
                    add your first transaction
                  </Link>
                </p>
              </div>
            ) : (
              <div className="space-y-0 overflow-hidden">
                {recentTransactions.map((tx, index) => (
                  <Link key={tx.id} href={`/transactions/${tx.id}`}>
                    <div className={`grid grid-cols-[55px_1fr_45px_90px] items-center gap-2 sm:gap-3 py-2.5 px-1 hover:bg-[#2C2C2E]/50 transition-colors ${index < recentTransactions.length - 1 ? 'border-b border-[#3A3A3C]/30' : ''}`}>
                      <div className="min-w-0">
                        <span
                          className={`text-[10px] font-semibold px-1 py-0.5 rounded-lg whitespace-nowrap inline-block ${
                            tx.type === "receive"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {tx.type === "receive" ? "receive" : "pay"}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-gray-50 font-medium text-xs sm:text-sm truncate">
                          {tx.label}
                        </p>
                      </div>
                      <div className="w-[45px] text-right">
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
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}

