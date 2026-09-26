import type { LucideIcon } from "lucide-react";
import { RevealOnScroll } from "@/components/common/RevealOnScroll";
import { AnimatedCounter } from "@/components/common/AnimatedCounter";
import { cn } from "@/lib/utils";

export function StatisticsCard({
  icon: Icon,
  label,
  value,
  suffix,
  decimals,
  accent = "primary",
  delay = 0,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  suffix?: string;
  decimals?: number;
  accent?: "primary" | "success" | "warning" | "critical";
  delay?: number;
}) {
  const accentClasses: Record<string, string> = {
    primary: "from-primary-50 to-cyan-50 text-primary-600",
    success: "from-success-50 to-emerald-50 text-success-600",
    warning: "from-warning-50 to-orange-50 text-warning-600",
    critical: "from-critical-50 to-rose-50 text-critical-600",
  };

  return (
    <RevealOnScroll delay={delay}>
      <div className="group rounded-2xl border border-border bg-white p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-glow">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br transition-transform duration-300 group-hover:scale-110",
            accentClasses[accent]
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <p className="mt-4 text-3xl font-bold tracking-tight text-foreground">
          <AnimatedCounter value={value} suffix={suffix} decimals={decimals} />
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{label}</p>
      </div>
    </RevealOnScroll>
  );
}
