"use client";

import { useCountUp } from "@/lib/hooks/useCountUp";

export function AnimatedCounter({
  value,
  suffix = "",
  prefix = "",
  decimals = 0,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
}) {
  const { ref, value: animated } = useCountUp(value);
  const display = decimals > 0 ? (animated / Math.pow(10, decimals)).toFixed(decimals) : animated.toLocaleString("en-IN");

  return (
    <span ref={ref as React.RefObject<HTMLSpanElement>}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}
