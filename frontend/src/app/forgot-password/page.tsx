"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ArrowLeft, CheckCircle2, Send } from "lucide-react";
import { useState } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/Button";
import { useDocumentTitle } from "@/lib/hooks/useDocumentTitle";

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  useDocumentTitle("Reset Password");
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit() {
    await new Promise((resolve) => setTimeout(resolve, 600));
    setSent(true);
  }

  return (
    <AuthLayout title="Reset your password" subtitle="Enter your email and we'll send reset instructions.">
      {sent ? (
        <div className="rounded-2xl border border-success-100 bg-success-50 p-5 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-success-600" />
          <p className="mt-3 text-sm font-medium text-foreground">If an account exists for that email, reset instructions are on the way.</p>
          <p className="mt-1 text-xs text-muted-foreground">Demo Mode — no real email is sent in this build.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={!!errors.email}
              {...register("email")}
              className="h-11 w-full rounded-xl border border-border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            />
            {errors.email && <p className="mt-1 text-xs text-critical-600">{errors.email.message}</p>}
          </div>
          <Button type="submit" className="w-full" loading={isSubmitting} rightIcon={<Send className="h-4 w-4" />}>
            Send reset instructions
          </Button>
        </form>
      )}

      <Link href="/login" className="mt-6 flex items-center justify-center gap-1.5 text-sm font-medium text-primary-700 hover:underline">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to login
      </Link>
    </AuthLayout>
  );
}
