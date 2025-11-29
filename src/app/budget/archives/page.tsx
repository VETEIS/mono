"use client";

import { useMemo } from "react";
import { useStore } from "@/store/useStore";
import { formatCurrency } from "@/utils/format";
import Card from "@/components/Card";
import Header from "@/components/Header";
import { Download } from "lucide-react";
import { exportMonthlyArchiveToExcel } from "@/utils/excel";

export default function BudgetArchivesPage() {
  const monthlyArchives = useStore((state) => state.monthlyArchives);

  const handleExportArchive = (archive: typeof monthlyArchives[0]) => {
    exportMonthlyArchiveToExcel(archive);
  };

  // Sort archives by year and month (newest first)
  const sortedArchives = useMemo(() => {
    return [...monthlyArchives].sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
  }, [monthlyArchives]);

  const getMonthName = (month: number, year: number) => {
    return new Date(year, month, 1).toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen pb-20">
      <Header title="archived months" backHref="/budget/transactions" />

      <main className="p-5 space-y-3">
        {sortedArchives.length === 0 ? (
          <Card>
            <div className="text-gray-400 text-center py-10">
              <p>no archived months found.</p>
            </div>
          </Card>
        ) : (
          sortedArchives.map((archive) => (
            <Card key={`${archive.year}-${archive.month}`} hover>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-gray-50 font-semibold mb-1">
                    {getMonthName(archive.month, archive.year)}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>
                      {archive.transactions.length} transaction
                      {archive.transactions.length !== 1 ? "s" : ""}
                    </span>
                    <span>•</span>
                    <span>budget: {formatCurrency(archive.budget)}</span>
                    <span>•</span>
                    <span className="text-green-400">
                      income: {formatCurrency(archive.totalIncome)}
                    </span>
                    <span>•</span>
                    <span className="text-red-400">
                      expenses: {formatCurrency(archive.totalExpenses)}
                    </span>
                    <span>•</span>
                    <span
                      className={
                        archive.balance >= 0
                          ? "text-green-400"
                          : "text-red-400"
                      }
                    >
                      balance: {formatCurrency(archive.balance)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleExportArchive(archive)}
                  className="ml-4 p-3 bg-[#FCD34D]/10 hover:bg-[#FCD34D]/20 rounded-xl transition-colors active:scale-95"
                >
                  <Download className="w-5 h-5 text-[#FCD34D]" />
                </button>
              </div>
            </Card>
          ))
        )}
      </main>
    </div>
  );
}

