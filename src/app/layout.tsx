import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "MONO",
  description: "never lose track of your money again",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#1C1C1E] text-gray-100 min-h-screen pb-20">
        {children}
        <Navbar />
      </body>
    </html>
  );
}

