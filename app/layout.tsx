import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Asset Log",
  description: "대체투자(RWA·STO·PE 등)를 기록하는 개인 투자 아카이브",
};

const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('al-theme');
    if (stored === 'light' || stored === 'dark') {
      document.documentElement.setAttribute('data-theme', stored);
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
      </head>
      <body className="bg-al-navy text-al-silver min-h-screen flex flex-col">
        <Providers>
          <Nav />
          <main className="flex-1 max-w-2xl w-full mx-auto px-6 py-9">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
