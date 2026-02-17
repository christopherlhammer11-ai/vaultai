// 🔨🔐 HammerLock AI — Root Layout
// Privacy-first intelligence. No cloud accounts. No data leakage.
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { VaultProvider } from "@/lib/vault-store";
import { SubscriptionProvider } from "@/lib/subscription-store";
import { I18nProvider } from "@/lib/i18n";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-brand", display: "swap" });

export const metadata: Metadata = {
  title: "HammerLock AI — Your AI. Your Data. Your Rules.",
  description: "Local-first AI with encrypted memory built for operators",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "HammerLock AI",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#00ff88",
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Electron detection — must run before first paint to enable drag regions */}
        <script dangerouslySetInnerHTML={{
          __html: `
            try {
              if (navigator.userAgent.includes('Electron') || window.electron) {
                document.documentElement.classList.add('is-electron');
              }
            } catch(e) {}
          `,
        }} />
      </head>
      <body className={`${inter.variable} ${jetbrains.variable} ${spaceGrotesk.variable}`}>
        {/* Electron drag bar — invisible fixed strip at top for window dragging */}
        <div className="electron-drag-bar" />
        <I18nProvider>
          <SubscriptionProvider>
            <VaultProvider>{children}</VaultProvider>
          </SubscriptionProvider>
        </I18nProvider>
        <Script
          id="electron-detect-body"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if (navigator.userAgent.includes('Electron') || window.electron) {
                document.body.classList.add('electron-app');
              }
            `,
          }}
        />
        <Script
          id="sw-register"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js').catch(() => {});
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
