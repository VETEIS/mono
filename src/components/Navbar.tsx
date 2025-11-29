"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleDollarSign, Receipt, CreditCard, Settings, Users } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { 
      href: "/", 
      icon: CircleDollarSign, 
      label: "budget",
      isActive: pathname === "/" || pathname.startsWith("/budget")
    },
    { 
      href: "/debts", 
      icon: CreditCard, 
      label: "debts",
      isActive: pathname === "/debts" || pathname.startsWith("/transactions") || pathname.startsWith("/notes")
    },
    { 
      href: "/groups", 
      icon: Users, 
      label: "groups",
      isActive: pathname === "/groups" || pathname.startsWith("/groups/")
    },
    { 
      href: "/settings", 
      icon: Settings, 
      label: "settings",
      isActive: pathname === "/settings"
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#1C1C1E]/95 backdrop-blur-xl border-t border-[#3A3A3C] z-20 safe-area-bottom pointer-events-auto">
      <div className="flex items-center px-2 py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center gap-1.5 px-2 py-2 rounded-2xl transition-all active:scale-95 ${
                item.isActive
                  ? "text-[#FCD34D]"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              <Icon className={`w-6 h-6 transition-colors ${item.isActive ? "text-[#FCD34D]" : ""}`} />
              <span className={`text-xs font-medium transition-colors ${item.isActive ? "text-[#FCD34D]" : ""}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

