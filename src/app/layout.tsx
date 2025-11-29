import type { Metadata } from "next";
import { Ubuntu } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const ubuntu = Ubuntu({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-ubuntu",
});

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
      <body className={`${ubuntu.variable} font-sans bg-[#1C1C1E] text-gray-100 min-h-screen pb-20 overflow-x-hidden`}>
        <div className="min-w-0 max-w-full overflow-x-hidden box-border">
          {children}
        </div>
        <Navbar />
      </body>
    </html>
  );
}

