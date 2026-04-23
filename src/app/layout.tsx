import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "数秘術鑑定書ジェネレーター（MVP）",
  description: "顧客情報から数秘と守護石を算出し、鑑定書PDFを生成します。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="min-h-screen antialiased">
        <header className="border-b border-stone-200 bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4">
            {/* フルページ遷移: 一部環境で next/link のクライアント遷移が `/` で失敗するため */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              className="text-lg font-semibold text-stone-800 no-underline hover:text-stone-900"
            >
              Life Journey
            </a>
            <nav className="shrink-0 whitespace-nowrap text-sm text-stone-600">
              <Link href="/order" className="hover:text-stone-900">
                はじめての方へ
              </Link>
              <span className="mx-2 text-stone-300">|</span>
              <Link href="/orders" className="hover:text-stone-900">
                マイページ
              </Link>
              <span className="mx-2 text-stone-300">|</span>
              <Link href="/verify" className="hover:text-stone-900">
                数秘検証
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
