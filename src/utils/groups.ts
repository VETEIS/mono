import type { Group, Expense, Settlement } from "@/types";

export type Net = { memberId: string; net: number };

/**
 * Compute net balances for each member in a group
 * 
 * Logic:
 * - For each expense, adds what a member paid (credit) and subtracts what they owe (debit)
 * - This automatically handles debt reduction: if someone owes money but pays for a new expense,
 *   their debt is reduced by how much more they paid than their share
 * - Processes all expenses sequentially, so balances reflect cumulative totals
 * 
 * Example:
 * - Alice owes ₱100 (from previous expense)
 * - Alice pays ₱150 for new expense, split equally (₱75 each)
 * - Alice's net change: +₱150 (paid) - ₱75 (owes) = +₱75
 * - Alice's new balance: -₱100 + ₱75 = -₱25 (debt reduced)
 */
export function computeNets(group: Group, precision = 2): Net[] {
  const netsMap: Record<string, number> = {};
  
  // Initialize all members with 0
  group.members.forEach((member) => {
    netsMap[member.id] = 0;
  });

  // Process expenses
  for (const expense of group.expenses) {
    // Add contributions from payers (credit - they paid money)
    Object.entries(expense.paidBy).forEach(([memberId, amount]) => {
      if (netsMap[memberId] !== undefined) {
        netsMap[memberId] += amount;
      }
    });

    // Subtract shares from split (debit - they owe this amount)
    Object.entries(expense.splitBetween).forEach(([memberId, share]) => {
      if (netsMap[memberId] !== undefined) {
        netsMap[memberId] -= share;
      }
    });
  }

  // Process settlements (explicit payments)
  for (const settlement of group.settlements) {
    if (netsMap[settlement.from] !== undefined) {
      netsMap[settlement.from] -= settlement.amount;
    }
    if (netsMap[settlement.to] !== undefined) {
      netsMap[settlement.to] += settlement.amount;
    }
  }

  // Round to avoid floating residue
  const roundFactor = Math.pow(10, precision);
  return Object.entries(netsMap).map(([memberId, net]) => ({
    memberId,
    net: Math.round(net * roundFactor) / roundFactor,
  }));
}

/**
 * Suggest minimal transfers to settle all debts
 */
export function suggestSettlements(
  group: Group,
  precision = 2
): { from: string; to: string; amount: number }[] {
  const nets = computeNets(group, precision);
  const creditors = nets.filter((n) => n.net > 0).sort((a, b) => b.net - a.net);
  const debtors = nets.filter((n) => n.net < 0).sort((a, b) => a.net - b.net);

  const suggestions: { from: string; to: string; amount: number }[] = [];
  const roundFactor = Math.pow(10, precision);
  const epsilon = 1e-9;

  let i = 0,
    j = 0;
  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];
    const amount = Math.min(creditor.net, -debtor.net);
    const rounded = Math.round(amount * roundFactor) / roundFactor;

    if (rounded > epsilon) {
      suggestions.push({
        from: debtor.memberId,
        to: creditor.memberId,
        amount: rounded,
      });
      creditor.net =
        Math.round((creditor.net - rounded) * roundFactor) / roundFactor;
      debtor.net =
        Math.round((debtor.net + rounded) * roundFactor) / roundFactor;
    }

    if (Math.abs(creditor.net) < epsilon) i++;
    if (Math.abs(debtor.net) < epsilon) j++;
  }

  return suggestions;
}

/**
 * Generate avatar color for a member based on their name
 */
export function generateAvatarColor(name: string): string {
  const colors = [
    "#F87171", // red
    "#FBBF24", // yellow
    "#34D399", // green
    "#60A5FA", // blue
    "#A78BFA", // purple
    "#FB7185", // pink
    "#4ADE80", // emerald
    "#38BDF8", // sky
    "#F472B6", // fuchsia
    "#818CF8", // indigo
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

