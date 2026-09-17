"use client";

import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

const RULES = [
  { label: "At least 8 characters", test: (v: string) => v.length >= 8 },
  { label: "One uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
  { label: "One number", test: (v: string) => /[0-9]/.test(v) },
];

export function passwordMeetsRequirements(value: string): boolean {
  return RULES.every((rule) => rule.test(value));
}

export function PasswordStrength({ password }: { password: string }) {
  const passedCount = RULES.filter((rule) => rule.test(password)).length;
  const strength = password.length === 0 ? 0 : passedCount;

  const strengthMeta = [
    { label: "", color: "bg-border" },
    { label: "Weak", color: "bg-critical-500" },
    { label: "Fair", color: "bg-warning-500" },
    { label: "Strong", color: "bg-success-500" },
  ][strength];

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1.5">
        {RULES.map((_, i) => (
          <span
            key={i}
            className={cn("h-1.5 flex-1 rounded-full transition-colors duration-300", i < strength ? strengthMeta.color : "bg-border")}
          />
        ))}
      </div>
      {password.length > 0 && strengthMeta.label && (
        <p className="text-xs font-medium text-muted-foreground">Password strength: {strengthMeta.label}</p>
      )}
      <ul className="space-y-1">
        {RULES.map((rule) => {
          const passed = rule.test(password);
          return (
            <li key={rule.label} className={cn("flex items-center gap-1.5 text-xs", passed ? "text-success-600" : "text-muted-foreground")}>
              {passed ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5 text-border" />}
              {rule.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
