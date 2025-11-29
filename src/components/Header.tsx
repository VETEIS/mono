"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, StickyNote } from "lucide-react";
import { useStore } from "@/store/useStore";

interface HeaderProps {
  title: string;
  backHref?: string;
  action?: React.ReactNode;
  leftAction?: React.ReactNode;
  titleRight?: boolean;
  showNotesButton?: boolean;
}

export default function Header({ title, backHref, action, leftAction, titleRight, showNotesButton = false }: HeaderProps) {
  const pathname = usePathname();
  const isDebtsPage = pathname === "/debts";
  const notes = useStore((state) => state.notes);
  const notesCount = notes.length;

  return (
    <header className="fixed top-0 left-0 right-0 z-10 bg-[#1C1C1E]/95 backdrop-blur-xl border-b border-[#3A3A3C] h-16 pt-[5px]">
      <div className="flex items-center justify-between px-5 h-full">
        <div className="flex items-center gap-3">
          {backHref && (
            <Link
              href={backHref}
              className="p-2 hover:bg-[#2C2C2E] rounded-xl transition-colors active:scale-95"
            >
              <ArrowLeft className="w-5 h-5 text-gray-300" />
            </Link>
          )}
          {leftAction && <div>{leftAction}</div>}
          {!titleRight && <h1 className="text-2xl font-bold text-gray-50 leading-none">{title}</h1>}
        </div>
        <div className="flex items-center gap-3">
          {titleRight && <h1 className="text-2xl font-bold text-gray-50 leading-none">{title}</h1>}
          {showNotesButton && isDebtsPage && (
            <Link
              href="/notes"
              className="relative p-2.5 hover:bg-[#2C2C2E] rounded-xl transition-colors active:scale-95"
            >
              <StickyNote className="w-6 h-6 text-[#FCD34D]" />
              {notesCount > 0 && (
                <span className="absolute top-0 right-0 bg-[#FCD34D] text-[#1C1C1E] text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {notesCount > 99 ? "99+" : notesCount}
                </span>
              )}
            </Link>
          )}
          {action && <div className="flex items-center">{action}</div>}
        </div>
      </div>
    </header>
  );
}

