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
          <header className="border-b border-stone-200 bg-white/80 backdrop-blur">
            <div className="mx-auto flex max-w-3xl flex-col items-start gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              {/* フルページ遷移: 一部環境で next/link のクライアント遷移が `/` で失敗するため */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a
                href="/"
                className="text-lg font-semibold text-stone-800 no-underline hover:text-stone-900"
              >
                Life Journey Diary
              </a>
              <nav className="flex min-w-0 w-full flex-wrap items-center justify-start gap-y-1 text-xs text-stone-600 sm:w-auto sm:justify-end sm:text-sm">
                <Link href="/order" className="hover:text-stone-900">
                  はじめての方
                </Link>
                <AuthNav />
                <span className="mx-2 text-stone-300">|</span>
                <Link href="/orders" className="hover:text-stone-900">
                  マイページ
                </Link>
                <span className="mx-2 text-stone-300">|</span>
                <Link href="/journal" className="hover:text-stone-900">
                  今日の記録
                </Link>
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
        </FirebaseAuthProvider>
      </body>
    </html>
  );
}
