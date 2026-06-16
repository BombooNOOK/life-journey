import type { Metadata } from "next";

import { FirebaseAuthProvider } from "@/components/auth/FirebaseAuthProvider";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ReadingFontSizeProvider } from "@/components/reading/ReadingFontSizeContext";
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
      <body className="flex min-h-screen flex-col antialiased">
        <FirebaseAuthProvider>
          <ReadingFontSizeProvider>
            <SiteHeader />
            <main className="lj-read-surface mx-auto w-full max-w-3xl flex-1 px-4 py-8">
              {children}
            </main>
            <SiteFooter />
          </ReadingFontSizeProvider>
        </FirebaseAuthProvider>
      </body>
    </html>
  );
}
