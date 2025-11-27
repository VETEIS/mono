"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Transaction, Note, AppData, MonthlyArchive } from "@/types";

interface StoreState {
  transactions: Transaction[];
  notes: Note[];
  budget: number;
  monthlyArchives: MonthlyArchive[];
  lastArchiveCheck: string | null; // ISO string of last check date
  addTransaction: (tx: Omit<Transaction, "id">) => void;
  updateTransaction: (id: string, data: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addNote: (note: Omit<Note, "id">) => void;
  updateNote: (id: string, data: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  setBudget: (amount: number) => void;
  archivePreviousMonth: () => void;
  checkAndArchive: () => void;
  importData: (data: AppData) => void;
  exportData: () => AppData;
  resetAll: () => void;
}

// Hydration-safe store
export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      transactions: [],
      notes: [],
      budget: 0,
      monthlyArchives: [],
      lastArchiveCheck: null,

      addTransaction: (tx) => {
        const newTx: Transaction = {
          ...tx,
          id: crypto.randomUUID(),
        };
        set((state) => ({
          transactions: [...state.transactions, newTx],
        }));
      },

      updateTransaction: (id, data) => {
        set((state) => ({
          transactions: state.transactions.map((tx) =>
            tx.id === id ? { ...tx, ...data } : tx
          ),
        }));
      },

      deleteTransaction: (id) => {
        set((state) => ({
          transactions: state.transactions.filter((tx) => tx.id !== id),
        }));
      },

      addNote: (note) => {
        const newNote: Note = {
          ...note,
          id: crypto.randomUUID(),
        };
        set((state) => ({
          notes: [...state.notes, newNote],
        }));
      },

      updateNote: (id, data) => {
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id ? { ...n, ...data } : n
          ),
        }));
      },

      deleteNote: (id) => {
        set((state) => ({
          notes: state.notes.filter((n) => n.id !== id),
        }));
      },

      setBudget: (amount) => {
        set({ budget: amount });
      },

      archivePreviousMonth: () => {
        const state = get();
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const month = lastMonth.getMonth();
        const year = lastMonth.getFullYear();

        // Check if already archived
        const alreadyArchived = state.monthlyArchives.some(
          (arch) => arch.month === month && arch.year === year
        );
        if (alreadyArchived) return;

        // Get wallet transactions from previous month
        const previousMonthTransactions = state.transactions.filter((tx) => {
          if (!tx.wallet) return false;
          const txDate = new Date(tx.date);
          return (
            txDate.getMonth() === month && txDate.getFullYear() === year
          );
        });

        // Calculate totals
        const totalIncome = previousMonthTransactions
          .filter((tx) => tx.type === "receive")
          .reduce((sum, tx) => sum + tx.amount, 0);
        const totalExpenses = previousMonthTransactions
          .filter((tx) => tx.type === "pay")
          .reduce((sum, tx) => sum + tx.amount, 0);
        const balance = totalIncome - totalExpenses;

        const archive: MonthlyArchive = {
          month,
          year,
          transactions: previousMonthTransactions,
          budget: state.budget,
          totalIncome,
          totalExpenses,
          balance,
          archivedAt: new Date().toISOString(),
        };

        set((state) => ({
          monthlyArchives: [...state.monthlyArchives, archive],
          lastArchiveCheck: new Date().toISOString(),
        }));
      },

      checkAndArchive: () => {
        const state = get();
        const now = new Date();
        const today = now.getDate();

        // Check if it's the first day of the month
        if (today === 1) {
          const lastCheck = state.lastArchiveCheck
            ? new Date(state.lastArchiveCheck)
            : null;

          // Only archive if we haven't checked today yet
          if (
            !lastCheck ||
            lastCheck.getDate() !== 1 ||
            lastCheck.getMonth() !== now.getMonth() ||
            lastCheck.getFullYear() !== now.getFullYear()
          ) {
            get().archivePreviousMonth();
          }
        }
      },

      importData: (data) => {
        set({
          transactions: data.transactions || [],
          notes: data.notes || [],
          budget: data.budget || 0,
          monthlyArchives: data.monthlyArchives || [],
        });
      },

      exportData: () => {
        const state = get();
        return {
          transactions: state.transactions,
          notes: state.notes,
          budget: state.budget,
          monthlyArchives: state.monthlyArchives,
        };
      },

      resetAll: () => {
        set({
          transactions: [],
          notes: [],
          budget: 0,
          monthlyArchives: [],
          lastArchiveCheck: null,
        });
      },
    }),
    {
      name: "money_manager_data_v1",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

