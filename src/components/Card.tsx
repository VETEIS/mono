import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export default function Card({ children, className = "", hover = false }: CardProps) {
  return (
    <div
      className={`rounded-2xl bg-[#2C2C2E] p-5 shadow-lg border border-[#3A3A3C] transition-all ${
        hover ? "hover:bg-[#3A3A3C] hover:border-[#4A4A4C] cursor-pointer" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

