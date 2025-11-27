"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet, Receipt, CreditCard, Settings } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", icon: Wallet, label: "wallet" },
    { href: "/debts", icon: CreditCard, label: "debts" },
    { href: "/transactions", icon: Receipt, label: "transactions" },
    { href: "/settings", icon: Settings, label: "settings" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#1C1C1E]/95 backdrop-blur-xl border-t border-[#3A3A3C] z-20 safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1.5 px-5 py-2 rounded-2xl transition-all active:scale-95 ${
                isActive
                  ? "text-[#FCD34D] bg-[#2C2C2E]"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? "scale-110" : ""} transition-transform`} />
              <span className={`text-xs font-medium ${isActive ? "text-[#FCD34D]" : ""}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

