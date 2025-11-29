"use client";

import { useRef, useState, useEffect } from "react";
import { Calendar } from "lucide-react";

interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function DateInput({ value, onChange, placeholder = "select date" }: DateInputProps) {
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const [displayValue, setDisplayValue] = useState("");

  useEffect(() => {
    if (value) {
      // Show date in MM/DD format for compact display
      const date = new Date(value);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const year = date.getFullYear();
      setDisplayValue(`${month}/${day}/${year}`);
    } else {
      setDisplayValue("");
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="relative">
      {/* Visual button layer */}
      <div className="w-full px-4 py-3.5 bg-[#1C1C1E] border border-[#3A3A3C] rounded-2xl text-left flex items-center justify-between pointer-events-none">
        <span className={displayValue ? "text-gray-100" : "text-gray-500"}>
          {displayValue || placeholder}
        </span>
        <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0" />
      </div>
      {/* Clickable date input overlay */}
      <input
        ref={hiddenInputRef}
        type="date"
        value={value}
        onChange={handleChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        style={{ fontSize: '16px' }} // Prevents zoom on iOS
      />
    </div>
  );
}

