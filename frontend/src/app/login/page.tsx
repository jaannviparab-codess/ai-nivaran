"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AlertCircle, Eye, EyeOff, LogIn } from "lucide-react";
import { Suspense, useState } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/lib/auth-context";
import { useDocumentTitle } from "@/lib/hooks/useDocumentTitle";
import { DEMO_MODE } from "@/lib/constants";
import { useTranslation } from "@/i18n/I18nProvider";
import type { TranslationKey } from "@/i18n/translate";

// Messages are translation keys; they're translated when rendered so they follow the current UI language.
const schema = z.object({
  email: z.string().min(1, "validation.emailRequired").email("validation.emailInvalid"),
  password: z.string().min(1, "validation.passwordRequired"),
  rememberMe: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { show } = useToast();
  const { login } = useAuth();
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { rememberMe: true } });

  async function onSubmit(values: FormValues) {
    setFormError(null);
    try {
      const user = await login(values.email, values.password, values.rememberMe);
      show({ kind: "success", title: t("auth.login.welcomeBack", { name: user.displayName }) });
      const redirectTo = searchParams.get("redirect");
      router.push(redirectTo && redirectTo.startsWith("/") ? redirectTo : "/");
    } catch (err) {
      // A server-provided message is shown as-is; otherwise use the translated fallback.
      setFormError(err instanceof Error && err.message ? err.message : t("auth.login.invalidCredentials"));
    }
  }

  return (
    <AuthLayout title={t("auth.login.title")} subtitle={t("auth.login.subtitle")}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {formError && (
          <div role="alert" className="flex items-start gap-2 rounded-xl bg-critical-50 p-3 text-sm text-critical-600">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {formError}
          </div>
        )}

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
            {t("auth.email")}
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            {...register("email")}
            className="h-11 w-full rounded-xl border border-border px-3 text-sm outline-none transition-shadow focus-visible:shadow-glow focus-visible:ring-2 focus-visible:ring-primary-500"
          />
          {errors.email && <p className="mt-1 text-xs text-critical-600">{t(errors.email.message as TranslationKey)}</p>}
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              {t("auth.password")}
            </label>
            <Link href="/forgot-password" className="text-xs font-medium text-primary-700 hover:underline">
              {t("auth.login.forgotPassword")}
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              {...register("password")}
              className="h-11 w-full rounded-xl border border-border px-3 pr-10 text-sm outline-none transition-shadow focus-visible:shadow-glow focus-visible:ring-2 focus-visible:ring-primary-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-critical-600">{t(errors.password.message as TranslationKey)}</p>}
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" {...register("rememberMe")} className="h-4 w-4 rounded border-border text-primary-600 focus-visible:ring-2 focus-visible:ring-primary-500" />
          {t("auth.login.rememberMe")}
        </label>

        <Button type="submit" className="w-full" loading={isSubmitting} rightIcon={<LogIn className="h-4 w-4" />}>
          {isSubmitting ? t("auth.login.submitting") : t("auth.login.submit")}
        </Button>

        {DEMO_MODE && (
          <p className="text-center text-xs text-muted-foreground">
            {t("auth.login.demoHint")}
          </p>
        )}
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("auth.login.noAccount")}{" "}
        <Link href="/register" className="font-medium text-primary-700 hover:underline">
          {t("auth.login.createAccount")}
        </Link>
      </p>
    </AuthLayout>
  );
}

export default function LoginPage() {
  const { t } = useTranslation();
  useDocumentTitle(t("auth.login.docTitle"));
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
