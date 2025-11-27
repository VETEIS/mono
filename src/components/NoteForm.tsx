"use client";

import { useState, FormEvent } from "react";
import type { Note } from "@/types";

interface NoteFormProps {
  initialData?: Note;
  onSubmit: (data: Omit<Note, "id">) => void;
  onCancel?: () => void;
}

export default function NoteForm({
  initialData,
  onSubmit,
  onCancel,
}: NoteFormProps) {
  const [text, setText] = useState(initialData?.text || "");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    onSubmit({
      text: text.trim(),
      date: new Date().toISOString(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-2.5">
          note <span className="text-[#FCD34D]">*</span>
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
          rows={12}
          className="w-full px-4 py-3.5 bg-[#1C1C1E] border border-[#3A3A3C] rounded-2xl text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FCD34D] focus:border-[#FCD34D] resize-none transition-all"
          placeholder="write your note here..."
        />
      </div>

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
          {initialData ? "update" : "add"} note
        </button>
      </div>
    </form>
  );
}

