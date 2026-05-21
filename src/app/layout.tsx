import type { Metadata } from "next";
import Link from "next/link";

import { AuthNav } from "@/components/auth/AuthNav";
import { FirebaseAuthProvider } from "@/components/auth/FirebaseAuthProvider";
import {
  APP_DESCRIPTION,
  APP_DISPLAY_NAME,
  APP_DISPLAY_SHORT_NAME,
} from "@/lib/branding/appDisplayName";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase:
    process.env.NEXT_PUBLIC_APP_URL != null && process.env.NEXT_PUBLIC_APP_URL !== ""
      ? new URL(process.env.NEXT_PUBLIC_APP_URL)
      : process.env.VERCEL_URL != null && process.env.VERCEL_URL !== ""
        ? new URL(`https://${process.env.VERCEL_URL}`)
        : undefined,
  title: {
    default: APP_DISPLAY_NAME,
    template: `%s | ${APP_DISPLAY_NAME}`,
  },
  applicationName: APP_DISPLAY_NAME,
  description: APP_DESCRIPTION,
  appleWebApp: {
    capable: true,
    title: APP_DISPLAY_NAME,
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icons/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" }],
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: APP_DISPLAY_NAME,
    description: APP_DESCRIPTION,
    siteName: APP_DISPLAY_SHORT_NAME,
    locale: "ja_JP",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="min-h-screen antialiased">
        <FirebaseAuthProvider>
          <header className="overflow-visible border-b border-stone-200 bg-white/80 backdrop-blur">
            {/*
              外側 flex-wrap: 幅が足りればロゴ＋メニュー1行、足りなければ自然に折り返し。
              max-sm のみロゴを1行目・メニューを2行目以降（ログアウトは最後の行）。
            */}
            <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-x-3 gap-y-2 overflow-visible px-4 py-3 sm:py-4">
              {/* フルページ遷移: 一部環境で next/link のクライアント遷移が `/` で失敗するため */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a
                href="/"
                className="shrink-0 basis-full text-base font-semibold text-stone-800 no-underline hover:text-stone-900 sm:basis-auto sm:text-lg"
              >
                Life Journey Diary
              </a>
              <nav
                className="flex min-w-0 basis-full flex-wrap items-center justify-end gap-x-1.5 gap-y-1.5 overflow-visible text-xs text-stone-600 sm:basis-auto sm:flex-1 sm:gap-x-2 sm:text-sm"
                aria-label="メインメニュー"
              >
                <Link href="/order" className="shrink-0 whitespace-nowrap hover:text-stone-900">
                  はじめての方
                </Link>
                <span className="shrink-0 select-none text-stone-300" aria-hidden>
                  |
                </span>
                <Link href="/orders" className="shrink-0 whitespace-nowrap hover:text-stone-900">
                  マイページ
                </Link>
                <span className="shrink-0 select-none text-stone-300" aria-hidden>
                  |
                </span>
                <Link href="/guide" className="shrink-0 whitespace-nowrap hover:text-stone-900">
                  使い方
                </Link>
                <span className="shrink-0 select-none text-stone-300" aria-hidden>
                  |
                </span>
                <Link href="/journal" className="shrink-0 whitespace-nowrap hover:text-stone-900">
                  今日の記録
                </Link>
                {/* 極狭幅のみログアウトを独立行へ。sm 以上はメニューと同じ flex-wrap 内 */}
                <div className="flex w-full shrink-0 basis-full items-center justify-end overflow-visible max-sm:pt-0.5 sm:w-auto sm:basis-auto">
                  <AuthNav />
                </div>
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
        </FirebaseAuthProvider>
      </body>
    </html>
  );
}
