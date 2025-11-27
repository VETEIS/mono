"use client";

import { useState, useMemo, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { formatCurrency, formatDate } from "@/utils/format";
import Card from "@/components/Card";
import Header from "@/components/Header";
import Link from "next/link";
import { Edit2, ArrowRight, Archive } from "lucide-react";
import Modal from "@/components/Modal";

export default function WalletPage() {
  const budget = useStore((state) => state.budget);
  const setBudget = useStore((state) => state.setBudget);
  const transactions = useStore((state) => state.transactions);
  const monthlyArchives = useStore((state) => state.monthlyArchives);
  const checkAndArchive = useStore((state) => state.checkAndArchive);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState(budget.toString());

  // Check and archive on mount
  useEffect(() => {
    checkAndArchive();
  }, [checkAndArchive]);

  // Get current month's wallet transactions
  const currentMonthTransactions = useMemo(() => {
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

  // Calculate spent amount (receive adds to budget, pay subtracts)
  const spent = useMemo(() => {
    return currentMonthTransactions.reduce((sum, tx) => {
      if (tx.type === "receive") {
        return sum - tx.amount; // Income adds to available budget
      } else {
        return sum + tx.amount; // Expenses subtract from budget
      }
    }, 0);
  }, [currentMonthTransactions]);

  const remaining = budget - spent;
  const percentageUsed = budget > 0 ? (spent / budget) * 100 : 0;

  const handleSaveBudget = () => {
    const amount = parseFloat(budgetInput) || 0;
    setBudget(amount);
    setIsEditingBudget(false);
  };

  const recentWalletTransactions = currentMonthTransactions.slice(0, 5);

  // Get current month name
  const currentMonthName = useMemo(() => {
    const now = new Date();
    return now.toLocaleString("en-US", { month: "long", year: "numeric" });
  }, []);

  return (
    <div className="min-h-screen pb-20">
      <Header
        title="wallet"
        action={
          <Link
            href="/wallet/archives"
            className="p-2.5 hover:bg-[#2C2C2E] rounded-xl transition-colors active:scale-95"
          >
            <Archive className="w-6 h-6 text-[#FCD34D]" />
          </Link>
        }
      />

      <main className="p-5 space-y-6">
        {/* Budget Card */}
        {isEditingBudget ? (
          <Card className="border-[#FCD34D]/30 bg-gradient-to-br from-[#2C2C2E] to-[#1C1C1E]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-50">{currentMonthName}</h2>
            </div>
            <div className="space-y-3">
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                className="w-full px-4 py-3 bg-[#1C1C1E] border border-[#3A3A3C] rounded-2xl text-gray-100 text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-[#FCD34D] focus:border-[#FCD34D] transition-all"
                placeholder="0.00"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsEditingBudget(false);
                    setBudgetInput(budget.toString());
                  }}
                  className="flex-1 px-4 py-2 bg-[#2C2C2E] hover:bg-[#3A3A3C] text-gray-300 rounded-xl transition-all font-semibold"
                >
                  cancel
                </button>
                <button
                  onClick={handleSaveBudget}
                  className="flex-1 px-4 py-2 bg-[#FCD34D] hover:bg-[#FBBF24] text-[#1C1C1E] rounded-xl transition-all font-bold"
                >
                  save
                </button>
              </div>
            </div>
          </Card>
        ) : (
          <Link href="/wallet/new">
            <Card
              hover
              className="border-[#FCD34D]/30 bg-gradient-to-br from-[#2C2C2E] to-[#1C1C1E]"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-50">{currentMonthName}</h2>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setBudgetInput(budget.toString());
                    setIsEditingBudget(true);
                  }}
                  className="p-2 hover:bg-[#3A3A3C] rounded-xl transition-colors"
                >
                  <Edit2 className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <p className="text-3xl font-bold text-[#FCD34D] mb-4">
                {formatCurrency(budget)}
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">spent</span>
                  <span className="text-gray-300 font-semibold">
                    {formatCurrency(spent)}
                  </span>
                </div>
                <div className="w-full bg-[#1C1C1E] rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      percentageUsed > 100
                        ? "bg-red-500"
                        : percentageUsed > 80
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                    style={{ width: `${Math.min(percentageUsed, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">remaining</span>
                  <span
                    className={`font-semibold ${
                      remaining >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {formatCurrency(remaining)}
                  </span>
                </div>
              </div>
            </Card>
          </Link>
        )}

        {/* Recent Wallet Transactions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-50">
              recent expenses
            </h2>
            <Link
              href="/wallet/transactions"
              className="text-sm text-[#FCD34D] hover:text-[#FBBF24] flex items-center gap-1.5 font-medium transition-colors"
            >
              view all
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <Card className="h-[400px] overflow-y-auto">
            {recentWalletTransactions.length === 0 ? (
              <div className="text-gray-400 text-center py-8">
                <p>no expenses yet.</p>
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
              <div className="space-y-3">
                {recentWalletTransactions.map((tx) => (
                  <Link key={tx.id} href={`/wallet/transactions/${tx.id}`}>
                    <div className="flex items-center justify-between pb-3 border-b border-[#3A3A3C] last:border-b-0 hover:opacity-80 transition-opacity">
                      <div className="flex-1">
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
                        <p className="text-gray-50 font-semibold mb-1">
                          {tx.label}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDate(tx.date)}
                        </p>
                      </div>
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
