"use client";

import { useState, FormEvent } from "react";
import type { Transaction, TransactionType } from "@/types";
import { formatDateInput } from "@/utils/format";
import { ChevronDown } from "lucide-react";
import DateInput from "./DateInput";

interface TransactionFormProps {
  initialData?: Transaction;
  initialType?: TransactionType; // Override type for new transactions
  onSubmit: (data: Omit<Transaction, "id">) => void;
  onCancel?: () => void;
  isBudget?: boolean; // If true, use "in"/"out" and auto-set date
}

export default function TransactionForm({
  initialData,
  initialType,
  onSubmit,
  onCancel,
  isBudget = false,
}: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>(
    initialType || initialData?.type || (isBudget ? "pay" : "receive")
  );
  const [label, setLabel] = useState(initialData?.label || "");
  const [amount, setAmount] = useState(
    initialData?.amount?.toString() || ""
  );
  const [category, setCategory] = useState(initialData?.category || "");
  const [date, setDate] = useState(
    initialData?.date ? formatDateInput(initialData.date) : formatDateInput(new Date().toISOString())
  );
  const [expectedDate, setExpectedDate] = useState(
    initialData?.expectedDate ? formatDateInput(initialData.expectedDate) : ""
  );
  const [dueDate, setDueDate] = useState(
    initialData?.dueDate ? formatDateInput(initialData.dueDate) : ""
  );
  const [notes, setNotes] = useState(initialData?.notes || "");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !amount) return;

    onSubmit({
      type,
      label: label.trim(),
      amount: parseFloat(amount),
      category: category.trim() || undefined,
      date: initialData?.date || new Date().toISOString(),
      expectedDate: expectedDate ? new Date(expectedDate).toISOString() : undefined,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 min-w-0 max-w-full">
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-2.5">
          type
        </label>
        {initialType && !isBudget ? (
          <div className="w-full pl-4 pr-4 py-3.5 bg-[#1C1C1E]/50 border border-[#3A3A3C]/50 rounded-2xl text-gray-500 cursor-not-allowed">
            {type === "receive" ? "receive" : "pay"}
          </div>
        ) : (
          <div className="relative">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as TransactionType)}
              className="w-full pl-4 pr-12 py-3.5 bg-[#1C1C1E] border border-[#3A3A3C] rounded-2xl text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FCD34D] focus:border-[#FCD34D] transition-all appearance-none"
            >
              {isBudget ? (
                <>
                  <option value="receive" className="bg-[#2C2C2E]">in</option>
                  <option value="pay" className="bg-[#2C2C2E]">out</option>
                </>
              ) : (
                <>
                  <option value="receive" className="bg-[#2C2C2E]">receive</option>
                  <option value="pay" className="bg-[#2C2C2E]">pay</option>
                </>
              )}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-2.5">
          label <span className="text-[#FCD34D]">*</span>
        </label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          required
          className="w-full px-4 py-3.5 bg-[#1C1C1E] border border-[#3A3A3C] rounded-2xl text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FCD34D] focus:border-[#FCD34D] transition-all"
          placeholder="transaction label"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-2.5">
          amount <span className="text-[#FCD34D]">*</span>
        </label>
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          className="w-full px-4 py-3.5 bg-[#1C1C1E] border border-[#3A3A3C] rounded-2xl text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FCD34D] focus:border-[#FCD34D] transition-all"
          placeholder="0.00"
        />
      </div>

      {isBudget && (
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2.5">
            category
          </label>
          <div className="relative">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full pl-4 pr-12 py-3.5 bg-[#1C1C1E] border border-[#3A3A3C] rounded-2xl text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FCD34D] focus:border-[#FCD34D] transition-all appearance-none"
            >
              <option value="" className="bg-[#2C2C2E]">select category</option>
              <option value="food" className="bg-[#2C2C2E]">food</option>
              <option value="misc" className="bg-[#2C2C2E]">miscellaneous</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      )}

      {!isBudget && type === "receive" && (
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2.5">
            when
          </label>
          <DateInput
            value={expectedDate}
            onChange={(value) => setExpectedDate(value)}
            placeholder="select date"
          />
        </div>
      )}

      {!isBudget && type === "pay" && (
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2.5">
            due
          </label>
          <DateInput
            value={dueDate}
            onChange={(value) => setDueDate(value)}
            placeholder="select date"
          />
        </div>
      )}


      <div className="flex gap-3 pt-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-5 py-3.5 bg-[#2C2C2E] hover:bg-[#3A3A3C] text-gray-300 rounded-2xl transition-all font-semibold active:scale-95"
          >
            cancel
          </button>
        )}
        <button
          type="submit"
          className="flex-1 px-5 py-3.5 bg-[#FCD34D] hover:bg-[#FBBF24] text-[#1C1C1E] rounded-2xl transition-all font-bold active:scale-95 shadow-lg shadow-[#FCD34D]/20"
        >
          {initialData ? "update" : "add"} transaction
        </button>
      </div>
    </form>
  );
}

