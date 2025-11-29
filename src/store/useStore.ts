"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Transaction, Note, AppData, MonthlyArchive, Group, GroupMember, Expense, Settlement } from "@/types";

interface StoreState {
  transactions: Transaction[];
  notes: Note[];
  budget: number;
  monthlyArchives: MonthlyArchive[];
  lastArchiveCheck: string | null; // ISO string of last check date
  groups: Group[];
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
  // Groups
  addGroup: (group: Omit<Group, "id">) => void;
  updateGroup: (id: string, data: Partial<Group>) => void;
  deleteGroup: (id: string) => void;
  addExpense: (groupId: string, expense: Omit<Expense, "id" | "groupId">) => void;
  updateExpense: (groupId: string, expenseId: string, data: Partial<Expense>) => void;
  deleteExpense: (groupId: string, expenseId: string) => void;
  addSettlement: (groupId: string, settlement: Omit<Settlement, "id" | "groupId">) => void;
  updateSettlement: (groupId: string, settlementId: string, data: Partial<Settlement>) => void;
  deleteSettlement: (groupId: string, settlementId: string) => void;
  addGroupMember: (groupId: string, member: Omit<GroupMember, "id" | "createdAt">) => void;
  updateGroupMember: (groupId: string, memberId: string, data: Partial<GroupMember>) => void;
  removeGroupMember: (groupId: string, memberId: string) => void;
  exportGroup: (groupId: string) => string;
  importGroup: (groupJson: string) => void;
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
      groups: [],

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

        // Get budget transactions from previous month
        const previousMonthTransactions = state.transactions.filter((tx) => {
          if (!tx.budget) return false;
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
          groups: data.groups || [],
        });
      },

      exportData: () => {
        const state = get();
        return {
          transactions: state.transactions,
          notes: state.notes,
          budget: state.budget,
          monthlyArchives: state.monthlyArchives,
          groups: state.groups,
        };
      },

      resetAll: () => {
        set({
          transactions: [],
          notes: [],
          budget: 0,
          monthlyArchives: [],
          lastArchiveCheck: null,
          groups: [],
        });
      },

      // Groups actions
      addGroup: (groupData) => {
        const newGroup: Group = {
          ...groupData,
          id: crypto.randomUUID(),
        };
        set((state) => ({
          groups: [...state.groups, newGroup],
        }));
      },

      updateGroup: (id, data) => {
        set((state) => ({
          groups: state.groups.map((g) => (g.id === id ? { ...g, ...data } : g)),
        }));
      },

      deleteGroup: (id) => {
        set((state) => ({
          groups: state.groups.filter((g) => g.id !== id),
        }));
      },

      addExpense: (groupId, expenseData) => {
        const newExpense: Expense = {
          ...expenseData,
          groupId: groupId, // Always use the groupId parameter to ensure consistency
          id: crypto.randomUUID(),
        };
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === groupId
              ? { ...g, expenses: [...g.expenses, newExpense] }
              : g
          ),
        }));
      },

      updateExpense: (groupId, expenseId, data) => {
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === groupId
              ? {
                  ...g,
                  expenses: g.expenses.map((e) =>
                    e.id === expenseId
                      ? { ...e, ...data, editedAt: new Date().toISOString() }
                      : e
                  ),
                }
              : g
          ),
        }));
      },

      deleteExpense: (groupId, expenseId) => {
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === groupId
              ? { ...g, expenses: g.expenses.filter((e) => e.id !== expenseId) }
              : g
          ),
        }));
      },

      addSettlement: (groupId, settlementData) => {
        const newSettlement: Settlement = {
          ...settlementData,
          groupId: groupId, // Always use the groupId parameter to ensure consistency
          id: crypto.randomUUID(),
        };
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === groupId
              ? { ...g, settlements: [...g.settlements, newSettlement] }
              : g
          ),
        }));
      },

      updateSettlement: (groupId, settlementId, data) => {
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === groupId
              ? {
                  ...g,
                  settlements: g.settlements.map((s) =>
                    s.id === settlementId ? { ...s, ...data } : s
                  ),
                }
              : g
          ),
        }));
      },

      deleteSettlement: (groupId, settlementId) => {
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === groupId
              ? {
                  ...g,
                  settlements: g.settlements.filter((s) => s.id !== settlementId),
                }
              : g
          ),
        }));
      },

      addGroupMember: (groupId, memberData) => {
        const newMember: GroupMember = {
          ...memberData,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === groupId
              ? { ...g, members: [...g.members, newMember] }
              : g
          ),
        }));
      },

      updateGroupMember: (groupId, memberId, data) => {
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === groupId
              ? {
                  ...g,
                  members: g.members.map((m) =>
                    m.id === memberId ? { ...m, ...data } : m
                  ),
                }
              : g
          ),
        }));
      },

      removeGroupMember: (groupId, memberId) => {
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === groupId
              ? { ...g, members: g.members.filter((m) => m.id !== memberId) }
              : g
          ),
        }));
      },

      exportGroup: (groupId) => {
        const state = get();
        const group = state.groups.find((g) => g.id === groupId);
        if (!group) return "";
        return JSON.stringify(group, null, 2);
      },

      importGroup: (groupJson) => {
        try {
          const group: Group = JSON.parse(groupJson);
          // Ensure all IDs are regenerated to avoid conflicts
          group.id = crypto.randomUUID();
          group.members = group.members.map((m) => ({
            ...m,
            id: crypto.randomUUID(),
            createdAt: m.createdAt || new Date().toISOString(),
          }));
          group.expenses = group.expenses.map((e) => ({
            ...e,
            id: crypto.randomUUID(),
            groupId: group.id,
          }));
          group.settlements = group.settlements.map((s) => ({
            ...s,
            id: crypto.randomUUID(),
            groupId: group.id,
          }));
          set((state) => ({
            groups: [...state.groups, group],
          }));
        } catch (error) {
          console.error("Failed to import group:", error);
        }
      },
    }),
    {
      name: "money_manager_data_v2",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

