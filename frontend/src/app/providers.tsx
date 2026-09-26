"use client";

import { ToastProvider } from "@/components/ui/Toast";
import { AuthProvider } from "@/lib/auth-context";
import { I18nProvider } from "@/i18n/I18nProvider";
import type { Locale } from "@/i18n/config";

export function Providers({ initialLocale, children }: { initialLocale: Locale; children: React.ReactNode }) {
  return (
    <I18nProvider initialLocale={initialLocale}>
      <AuthProvider>
        <ToastProvider>{children}</ToastProvider>
      </AuthProvider>
    </I18nProvider>
  );
}
