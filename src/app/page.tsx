"use client";

import { useState, useMemo, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { formatCurrency, formatDate } from "@/utils/format";
import Card from "@/components/Card";
import Header from "@/components/Header";
import Link from "next/link";
import { Edit2, ArrowRight, Archive } from "lucide-react";
import Modal from "@/components/Modal";

export default function BudgetPage() {
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

  // Get current month's budget transactions
  const currentMonthTransactions = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return transactions
      .filter((tx) => {
        if (!tx.budget) return false;
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
  
  // Get color based on percentage used
  const getProgressColor = (percentage: number): string => {
    if (percentage <= 50) return "bg-green-500";
    if (percentage <= 80) return "bg-orange-500";
    return "bg-red-500";
  };
  
  const getRemainingColor = (percentage: number): string => {
    if (percentage <= 50) return "text-green-400";
    if (percentage <= 80) return "text-orange-400";
    return "text-red-400";
  };
  
  const progressColor = getProgressColor(percentageUsed);
  const remainingColor = getRemainingColor(percentageUsed);

  const handleSaveBudget = () => {
    const amount = parseFloat(budgetInput) || 0;
    setBudget(amount);
    setIsEditingBudget(false);
  };

  const recentBudgetTransactions = currentMonthTransactions.slice(0, 5);

  // Get current month and year separately
  const currentMonth = useMemo(() => {
    const now = new Date();
    return now.toLocaleString("en-US", { month: "long" }).toLowerCase();
  }, []);
  
  const currentYear = useMemo(() => {
    const now = new Date();
    return now.getFullYear().toString();
  }, []);
  
  const canAddExpense = remaining > 0;

  return (
    <div className="min-h-screen pb-20">
      <Header
        title="budget"
        action={
          <Link
            href="/budget/archives"
            className="p-2.5 hover:bg-[#2C2C2E] rounded-xl transition-colors active:scale-95"
          >
            <Archive className="w-6 h-6 text-[#FCD34D]" />
          </Link>
        }
      />

      <main className="p-5 space-y-6">
        {/* Budget Card */}
        {isEditingBudget ? (
          <Card className="border-[#FCD34D]/30 bg-gradient-to-br from-[#2C2C2E] to-[#1C1C1E] min-h-[200px]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-50">{currentMonth}</h2>
                <span className="text-lg font-bold text-gray-400">{currentYear}</span>
              </div>
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
          <Link 
            href={canAddExpense ? "/budget/new" : "#"} 
            onClick={(e) => {
              if (!canAddExpense) {
                e.preventDefault();
              }
            }}
          >
            <Card
              hover={canAddExpense}
              className={`border-[#FCD34D]/30 bg-gradient-to-br from-[#2C2C2E] to-[#1C1C1E] min-h-[200px] ${!canAddExpense ? "opacity-60" : ""}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-50">{currentMonth}</h2>
                  <span className="text-lg font-bold text-gray-400">{currentYear}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setBudgetInput(budget.toString());
                    setIsEditingBudget(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FCD34D]/10 hover:bg-[#FCD34D]/20 border border-[#FCD34D]/30 rounded-lg transition-all active:scale-95"
                >
                  <span className="text-xs font-semibold text-[#FCD34D]">
                    {budget > 0 ? `budget: ${formatCurrency(budget)}` : "set budget"}
                  </span>
                  <Edit2 className="w-3.5 h-3.5 text-[#FCD34D]" />
                </button>
              </div>
              
              <p className={`text-3xl font-bold mb-4 ${remainingColor}`}>
                {formatCurrency(remaining)}
                <span className="text-lg font-normal text-gray-500 ml-2">remaining</span>
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
                    className={`h-full transition-all ${progressColor}`}
                    style={{ width: `${Math.min(percentageUsed, 100)}%` }}
                  />
                </div>
              </div>
              
              {canAddExpense && (
                <div className="mt-4 pt-3 border-t border-[#3A3A3C]/30">
                  <p className="text-xs text-gray-500 text-center">
                    tap to add expense
                  </p>
                </div>
              )}
            </Card>
          </Link>
        )}

        {/* Recent Records */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-50">
              recent records
            </h2>
            <Link
              href="/budget/transactions"
              className="text-sm text-[#FCD34D] hover:text-[#FBBF24] flex items-center gap-1.5 font-medium transition-colors"
            >
              view all
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <Card>
            {recentBudgetTransactions.length === 0 ? (
              <div className="text-gray-400 text-center py-8">
                <p>no expenses yet.</p>
                <p className="mt-2">
                  <Link
                    href="/budget/new"
                    className="text-[#FCD34D] hover:text-[#FBBF24] hover:underline font-medium"
                  >
                    add your first expense
                  </Link>
                </p>
              </div>
            ) : (
              <div className="space-y-0 overflow-hidden">
                {recentBudgetTransactions.map((tx, index) => (
                  <Link key={tx.id} href={`/budget/transactions/${tx.id}?from=main`}>
                    <div className={`grid grid-cols-[35px_1fr_28px_35px_90px] items-center gap-1 sm:gap-2 py-2.5 px-1 hover:bg-[#2C2C2E]/50 transition-colors ${index < recentBudgetTransactions.length - 1 ? 'border-b border-[#3A3A3C]/30' : ''}`}>
                      <div className="w-[35px] flex items-center">
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
                      <div className="min-w-0 pr-2">
                        <p className="text-gray-50 font-medium text-xs sm:text-sm truncate">
                          {tx.label}
                        </p>
                      </div>
                      <div className="w-[28px]">
                        <span className="text-[10px] text-gray-500 font-medium truncate block">
                          {tx.category || "-"}
                        </span>
                      </div>
                      <div className="w-[35px] text-right">
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
