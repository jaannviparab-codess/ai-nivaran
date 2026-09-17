"use client";

import Link from "next/link";
import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "glass";
type Size = "sm" | "md" | "lg" | "icon";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-glow hover:brightness-110 active:brightness-95",
  secondary: "bg-primary-50 text-primary-700 hover:bg-primary-100",
  outline: "border border-border bg-white text-foreground hover:bg-muted",
  ghost: "text-foreground hover:bg-muted",
  danger: "bg-critical-600 text-white hover:bg-critical-700",
  glass: "glass text-foreground hover:bg-white/80",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-13 px-7 text-base gap-2.5",
  icon: "h-10 w-10",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  href?: string;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", href, loading, disabled, leftIcon, rightIcon, children, ...props },
    ref
  ) => {
    const classes = cn(
      "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 whitespace-nowrap",
      "hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] active:duration-75",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50 disabled:hover:translate-y-0",
      variantClasses[variant],
      sizeClasses[size],
      className
    );

    if (href) {
      return (
        <Link href={href} className={classes} aria-disabled={disabled}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : leftIcon}
          {children}
          {!loading && rightIcon}
        </Link>
      );
    }

    return (
      <button ref={ref} className={classes} disabled={disabled || loading} {...props}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : leftIcon}
        {children}
        {!loading && rightIcon}
      </button>
    );
  }
);
Button.displayName = "Button";
