export type TransactionType = "receive" | "pay";

export interface Transaction {
  id: string;
  type: TransactionType;
  label: string;
  amount: number;
  category?: string;
  date: string; // ISO string
  notes?: string;
  wallet?: boolean; // true if this is a wallet transaction
}

export interface Note {
  id: string;
  text: string;
  date: string; // ISO string
}

export interface MonthlyArchive {
  month: number; // 0-11
  year: number;
  transactions: Transaction[];
  budget: number;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  archivedAt: string; // ISO string
}

export interface AppData {
  transactions: Transaction[];
  notes: Note[];
  budget?: number; // monthly budget amount
  monthlyArchives?: MonthlyArchive[]; // archived months
}

