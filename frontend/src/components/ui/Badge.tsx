import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type BadgeVariant = "default" | "primary" | "success" | "warning" | "critical" | "outline";

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary-50 text-primary-700 ring-1 ring-inset ring-primary-100",
  success: "bg-success-50 text-success-700 ring-1 ring-inset ring-success-100",
  warning: "bg-warning-50 text-warning-600 ring-1 ring-inset ring-warning-100",
  critical: "bg-critical-50 text-critical-600 ring-1 ring-inset ring-critical-100",
  outline: "border border-border text-foreground",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
