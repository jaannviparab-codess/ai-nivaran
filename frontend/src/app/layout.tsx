import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { DemoModeBanner } from "@/components/layout/DemoModeBanner";
import { AIAssistantWidget } from "@/components/ai/AIAssistantWidget";
import { APP_NAME } from "@/lib/constants";
import { SkipLink } from "@/components/layout/SkipLink";
import { getServerLocale } from "@/i18n/server";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-devanagari",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${APP_NAME} — समस्या नोंदवा, निवारणाचा मागोवा घ्या`,
  description:
    "Nivaran AI is an AI-powered civic platform for reporting public infrastructure problems — potholes, garbage, streetlights and more — with AI detection, priority scoring, and full resolution tracking.",
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Resolved per request (cookie → Accept-Language) so the first server render
  // is already in the user's language and <html lang> drives the Devanagari font rules.
  const locale = getServerLocale();

  return (
    <html lang={locale} className={`${plusJakarta.variable} ${notoDevanagari.variable}`}>
      <body className="flex min-h-screen flex-col bg-background text-foreground antialiased">
        <Providers initialLocale={locale}>
          <SkipLink />
          <DemoModeBanner />
          <Navbar />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <Footer />
          <AIAssistantWidget />
        </Providers>
      </body>
    </html>
  );
}
