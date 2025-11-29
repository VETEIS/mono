import type { MonthlyArchive } from "@/types";
import { formatCurrency, formatDate } from "./format";

export function exportMonthlyArchiveToExcel(archive: MonthlyArchive) {
  // Create workbook data
  const monthName = new Date(archive.year, archive.month, 1).toLocaleString(
    "en-US",
    { month: "long", year: "numeric" }
  );

  // Headers
  const headers = [
    "Date",
    "Type",
    "Label",
    "Category",
    "Amount (PHP)",
    "Notes",
  ];

  // Transaction rows
  const rows = archive.transactions
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((tx) => [
      formatDate(tx.date),
      tx.type === "receive" ? "Income" : "Expense",
      tx.label,
      tx.category || "-",
      tx.type === "receive" ? tx.amount : -tx.amount,
      tx.notes || "-",
    ]);

  // Summary section
  const summaryRows = [
    [],
    ["SUMMARY"],
    ["Budget (PHP)", archive.budget],
    ["Total Income (PHP)", archive.totalIncome],
    ["Total Expenses (PHP)", archive.totalExpenses],
    ["Balance (PHP)", archive.balance],
    [],
    ["Archived At", formatDate(archive.archivedAt)],
  ];

  // Combine all data
  const csvData = [
    [`MONTHLY BUDGET REPORT - ${monthName.toUpperCase()}`],
    [],
    headers,
    ...rows,
    ...summaryRows,
  ];

  // Convert to CSV (Excel-compatible)
  const csvContent = csvData
    .map((row) =>
      row
        .map((cell) => {
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          const cellStr = String(cell ?? "");
          if (cellStr.includes(",") || cellStr.includes('"') || cellStr.includes("\n")) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        })
        .join(",")
    )
    .join("\n");

  // Add BOM for UTF-8 to ensure Excel opens it correctly
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `budget-${archive.year}-${String(archive.month + 1).padStart(2, "0")}.csv`
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

