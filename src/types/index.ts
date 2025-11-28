export type TransactionType = "receive" | "pay";

export interface Transaction {
  id: string;
  type: TransactionType;
  label: string;
  amount: number;
  category?: string;
  date: string; // ISO string - transaction date (when it was recorded)
  expectedDate?: string; // ISO string - when they expect to receive money (for receive type)
  dueDate?: string; // ISO string - when they should pay the debt (for pay type)
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
  groups?: Group[]; // expense groups
}

// Group expense tracking types
export interface GroupSettings {
  roundingPrecision?: number; // e.g., 2 decimals
}

export interface GroupMember {
  id: string;
  name: string;
  avatarColor?: string;
  contact?: string;
  createdAt: string; // ISO string
}

export interface Expense {
  id: string;
  groupId: string;
  description?: string;
  amount: number;
  paidBy: Record<string, number>; // { memberId: amountPaid } supports multi-payer
  splitBetween: Record<string, number>; // { memberId: share } - sum must equal amount
  date: string; // ISO string
  notes?: string;
  tags?: string[];
  createdBy: string; // memberId who created
  editedAt?: string; // ISO string
}

export interface Settlement {
  id: string;
  groupId: string;
  from: string; // memberId payer
  to: string; // memberId receiver
  amount: number;
  date: string; // ISO string
  notes?: string;
  createdBy: string;
}

export interface Group {
  id: string;
  name: string;
  currency?: string; // default app currency
  createdAt: string; // ISO string
  members: GroupMember[];
  expenses: Expense[];
  settlements: Settlement[];
  notes?: string;
  settings?: GroupSettings;
}

