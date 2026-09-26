"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AlertCircle, UserPlus } from "lucide-react";
import { useState } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/lib/auth-context";
import { useDocumentTitle } from "@/lib/hooks/useDocumentTitle";
import { PasswordStrength, passwordMeetsRequirements } from "@/components/auth/PasswordStrength";
import { useTranslation } from "@/i18n/I18nProvider";
import type { TranslationKey } from "@/i18n/translate";

// Messages are translation keys; they're translated when rendered so they follow the current UI language.
const schema = z
  .object({
    displayName: z.string().min(2, "validation.nameRequired"),
    email: z.string().min(1, "validation.emailRequired").email("validation.emailInvalid"),
    phone: z.string().optional().or(z.literal("")),
    password: z
      .string()
      .min(8, "validation.passwordMin")
      .refine((v) => /[A-Z]/.test(v), "validation.passwordUppercase")
      .refine((v) => /[0-9]/.test(v), "validation.passwordNumber"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "validation.passwordsDontMatch",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const { t } = useTranslation();
  useDocumentTitle(t("auth.register.docTitle"));
  const router = useRouter();
  const { show } = useToast();
  const { register: createAccount } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register: registerField,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const passwordValue = watch("password") || "";

  async function onSubmit(values: FormValues) {
    setFormError(null);
    try {
      await createAccount({
        displayName: values.displayName,
        email: values.email,
        password: values.password,
        phone: values.phone || undefined,
      });
      show({ kind: "success", title: t("auth.register.success"), description: t("auth.register.successDescription") });
      router.push("/login");
    } catch (err) {
      // A server-provided message is shown as-is; otherwise use the translated fallback.
      setFormError(err instanceof Error && err.message ? err.message : t("auth.register.failed"));
    }
  }

  return (
    <AuthLayout title={t("auth.register.title")} subtitle={t("auth.register.subtitle")}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {formError && (
          <div role="alert" className="flex items-start gap-2 rounded-xl bg-critical-50 p-3 text-sm text-critical-600">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {formError}
          </div>
        )}

        <div>
          <label htmlFor="displayName" className="mb-1 block text-sm font-medium text-slate-700">
            {t("auth.register.fullName")}
          </label>
          <input
            id="displayName"
            autoComplete="name"
            aria-invalid={!!errors.displayName}
            {...registerField("displayName")}
            className="h-11 w-full rounded-xl border border-border px-3 text-sm outline-none transition-shadow focus-visible:shadow-glow focus-visible:ring-2 focus-visible:ring-primary-500"
          />
          {errors.displayName && <p className="mt-1 text-xs text-critical-600">{t(errors.displayName.message as TranslationKey)}</p>}
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
            {t("auth.email")}
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            {...registerField("email")}
            className="h-11 w-full rounded-xl border border-border px-3 text-sm outline-none transition-shadow focus-visible:shadow-glow focus-visible:ring-2 focus-visible:ring-primary-500"
          />
          {errors.email && <p className="mt-1 text-xs text-critical-600">{t(errors.email.message as TranslationKey)}</p>}
        </div>

        <div>
          <label htmlFor="phone" className="mb-1 block text-sm font-medium text-slate-700">
            {t("auth.register.phone")} <span className="font-normal text-muted-foreground">{t("common.optional")}</span>
          </label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            {...registerField("phone")}
            className="h-11 w-full rounded-xl border border-border px-3 text-sm outline-none transition-shadow focus-visible:shadow-glow focus-visible:ring-2 focus-visible:ring-primary-500"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
            {t("auth.password")}
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            {...registerField("password")}
            className="h-11 w-full rounded-xl border border-border px-3 text-sm outline-none transition-shadow focus-visible:shadow-glow focus-visible:ring-2 focus-visible:ring-primary-500"
          />
          <PasswordStrength password={passwordValue} />
          {errors.password && <p className="mt-1 text-xs text-critical-600">{t(errors.password.message as TranslationKey)}</p>}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-slate-700">
            {t("auth.register.confirmPassword")}
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            {...registerField("confirmPassword")}
            className="h-11 w-full rounded-xl border border-border px-3 text-sm outline-none transition-shadow focus-visible:shadow-glow focus-visible:ring-2 focus-visible:ring-primary-500"
          />
          {errors.confirmPassword && <p className="mt-1 text-xs text-critical-600">{t(errors.confirmPassword.message as TranslationKey)}</p>}
        </div>

        <Button
          type="submit"
          className="w-full"
          loading={isSubmitting}
          disabled={!passwordMeetsRequirements(passwordValue)}
          rightIcon={<UserPlus className="h-4 w-4" />}
        >
          {isSubmitting ? t("auth.register.submitting") : t("auth.register.submit")}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("auth.register.haveAccount")}{" "}
        <Link href="/login" className="font-medium text-primary-700 hover:underline">
          {t("auth.register.login")}
        </Link>
      </p>
    </AuthLayout>
  );
}
