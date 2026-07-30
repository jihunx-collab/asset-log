import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Asset Log",
  description: "대체투자(RWA·STO·PE 등)를 기록하는 개인 투자 아카이브",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-al-navy text-al-silver min-h-screen flex flex-col">
        <Nav />
        <main className="flex-1 max-w-2xl w-full mx-auto px-6 py-9">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
