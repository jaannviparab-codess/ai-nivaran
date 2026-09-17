"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, MapPin, Sparkles, Wrench, Trash2, Lightbulb, Droplets } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { AnimatedCounter } from "@/components/common/AnimatedCounter";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

const NODES = [
  { id: "pothole", top: 12, left: 14, icon: Wrench, label: "Pothole detected", severity: "critical" as const, delay: 0 },
  { id: "garbage", top: 20, left: 78, icon: Trash2, label: "Garbage pile", severity: "medium" as const, delay: 0.6 },
  { id: "light", top: 72, left: 10, icon: Lightbulb, label: "Streetlight down", severity: "low" as const, delay: 1.1 },
  { id: "water", top: 78, left: 74, icon: Droplets, label: "Water leakage", severity: "high" as const, delay: 1.6 },
];

const SEVERITY_DOT: Record<string, string> = {
  low: "bg-primary-500",
  medium: "bg-warning-500",
  high: "bg-warning-600",
  critical: "bg-critical-600",
};

const SEVERITY_RING: Record<string, string> = {
  low: "hover:shadow-[0_4px_20px_-4px_rgba(59,130,246,0.45)]",
  medium: "hover:shadow-[0_4px_20px_-4px_rgba(245,158,11,0.45)]",
  high: "hover:shadow-[0_4px_20px_-4px_rgba(234,88,12,0.45)]",
  critical: "hover:shadow-[0_4px_20px_-4px_rgba(220,38,38,0.5)]",
};

const SCAN_PHRASES = [
  "Detecting issue category…",
  "Estimating severity…",
  "Checking for duplicates…",
  "Calculating priority score…",
];

const PING_DOTS = [
  { top: 30, left: 45, severity: "critical" },
  { top: 55, left: 30, severity: "high" },
  { top: 45, left: 62, severity: "medium" },
  { top: 62, left: 55, severity: "low" },
  { top: 22, left: 60, severity: "critical" },
];

const PARTICLES = [
  { top: 15, left: 35, size: 3, delay: 0, duration: 7 },
  { top: 38, left: 82, size: 2, delay: 1.2, duration: 8 },
  { top: 66, left: 20, size: 2.5, delay: 0.6, duration: 6.5 },
  { top: 82, left: 60, size: 2, delay: 2, duration: 9 },
  { top: 8, left: 60, size: 2, delay: 1.6, duration: 7.5 },
  { top: 50, left: 8, size: 2.5, delay: 0.3, duration: 8.5 },
];

export function Hero() {
  const reducedMotion = useReducedMotion();
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    if (reducedMotion) return;
    const id = setInterval(() => setPhraseIndex((i) => (i + 1) % SCAN_PHRASES.length), 2200);
    return () => clearInterval(id);
  }, [reducedMotion]);

  return (
    <section className="relative overflow-hidden bg-white">
      <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black_40%,transparent_100%)]" />
      <div className="container relative grid gap-12 py-16 lg:grid-cols-2 lg:items-center lg:py-24">
        {/* Left: copy */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-100 bg-primary-50 px-4 py-1.5 text-xs font-semibold text-primary-700"
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Civic Reporting Platform
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-foreground"
          >
            <span className="flex flex-wrap items-baseline gap-x-3">
              <span className="heading-devanagari text-gradient text-3xl leading-snug sm:text-4xl sm:leading-snug lg:text-5xl lg:leading-snug">निवारण</span>
              <span className="text-gradient font-sans text-xl font-bold tracking-wide sm:text-2xl lg:text-3xl">
                AI
              </span>
            </span>
            <span className="mt-3 block text-2xl font-semibold leading-snug text-slate-700 sm:text-3xl">
              Report a problem. Track the resolution.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 max-w-xl text-lg text-muted-foreground"
          >
            Snap a photo of a pothole, garbage pile, or broken streetlight. Our AI detects the issue, estimates
            severity, checks for duplicates, and gives it a transparent priority score — while you track every step
            to resolution.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <Button href="/report" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Report a Problem
            </Button>
            <Button href="/map" size="lg" variant="outline" leftIcon={<MapPin className="h-4 w-4" />}>
              Explore Public Issues
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-10 flex flex-wrap gap-x-8 gap-y-4 border-t border-border pt-6"
          >
            <div>
              <p className="text-2xl font-bold text-foreground">
                <AnimatedCounter value={1284} suffix="+" />
              </p>
              <p className="text-sm text-muted-foreground">Reports submitted</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-success-600">
                <AnimatedCounter value={918} suffix="+" />
              </p>
              <p className="text-sm text-muted-foreground">Issues resolved</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                <AnimatedCounter value={64} suffix="/100" />
              </p>
              <p className="text-sm text-muted-foreground">Avg. priority score</p>
            </div>
          </motion.div>
        </div>

        {/* Right: animated AI visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative mx-auto aspect-square w-full max-w-lg"
        >
          <div className="glass relative h-full w-full overflow-hidden rounded-[2rem] shadow-card">
            <div className="absolute inset-0 bg-grid opacity-70" />
            <div className="absolute inset-0 bg-gradient-to-br from-primary-50/40 via-transparent to-cyan-50/40" />

            {/* scanning sweep */}
            {!reducedMotion && (
              <div className="pointer-events-none absolute inset-x-0 top-0 h-full overflow-hidden">
                <div className="absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-cyan-300/30 to-transparent animate-scan-line" />
              </div>
            )}

            {/* connection lines */}
            <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full">
              {NODES.map((node) => (
                <line
                  key={node.id}
                  x1={node.left * 4}
                  y1={node.top * 4}
                  x2={200}
                  y2={200}
                  stroke="url(#lineGradient)"
                  strokeWidth={1.5}
                  strokeDasharray="4 5"
                  className={reducedMotion ? "" : "animate-dash"}
                  opacity={0.5}
                />
              ))}
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>

            {/* central AI orb */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              {!reducedMotion && (
                <>
                  <span className="absolute inset-0 -m-16 rounded-full border border-dashed border-cyan-300/40 animate-radar" />
                  <span className="absolute inset-0 -m-16 rounded-full border border-dashed border-primary-300/40 animate-radar [animation-delay:1.1s]" />
                </>
              )}
              <div className={cn("absolute inset-0 -m-10 rounded-full border border-primary-200/60", !reducedMotion && "animate-spin-slow-reverse")}>
                <span className="absolute -bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-primary-300" />
              </div>
              <div className={cn("absolute inset-0 -m-6 rounded-full border border-primary-300/50", !reducedMotion && "animate-orb-spin")}>
                <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-cyan-400" />
              </div>
              <motion.div
                animate={reducedMotion ? undefined : { scale: [1, 1.08, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary-600 to-secondary-500 shadow-glow"
              >
                <motion.span
                  animate={reducedMotion ? undefined : { rotate: 360 }}
                  transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="h-9 w-9 text-white" />
                </motion.span>
              </motion.div>
              <span className="absolute inset-0 -z-10 animate-pulse-ring rounded-full border-2 border-primary-400" />
            </div>

            {/* live AI readout */}
            <div className="absolute left-1/2 top-[62%] w-56 -translate-x-1/2 text-center">
              <AnimatePresence mode="wait">
                <motion.p
                  key={reducedMotion ? "static" : phraseIndex}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-full glass px-3 py-1.5 text-[11px] font-medium text-primary-700"
                >
                  {reducedMotion ? "AI analyzing public reports…" : SCAN_PHRASES[phraseIndex]}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* floating issue mini-cards */}
            {NODES.map((node) => (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={
                  reducedMotion
                    ? { opacity: 1, scale: 1 }
                    : { opacity: 1, scale: 1, y: [0, -10, 0] }
                }
                transition={
                  reducedMotion
                    ? { duration: 0.4, delay: node.delay }
                    : { opacity: { duration: 0.4, delay: node.delay }, scale: { duration: 0.4, delay: node.delay }, y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: node.delay } }
                }
                style={{ top: `${node.top}%`, left: `${node.left}%` }}
                className={cn(
                  "absolute flex items-center gap-1.5 rounded-xl border border-white/80 bg-white/95 px-2.5 py-1.5 shadow-soft transition-shadow duration-300",
                  SEVERITY_RING[node.severity]
                )}
              >
                <node.icon className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-[11px] font-medium text-slate-700">{node.label}</span>
                <span className={cn("h-1.5 w-1.5 rounded-full", SEVERITY_DOT[node.severity])} />
              </motion.div>
            ))}

            {/* ambient ping markers */}
            {PING_DOTS.map((dot, i) => (
              <span
                key={i}
                style={{ top: `${dot.top}%`, left: `${dot.left}%` }}
                className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2"
              >
                <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-60", SEVERITY_DOT[dot.severity], !reducedMotion && "animate-ping")} />
                <span className={cn("relative inline-flex h-2 w-2 rounded-full", SEVERITY_DOT[dot.severity])} />
              </span>
            ))}

            {/* ambient drifting particles — purely decorative depth, cheap transform-only animation */}
            {!reducedMotion &&
              PARTICLES.map((p, i) => (
                <span
                  key={i}
                  style={{
                    top: `${p.top}%`,
                    left: `${p.left}%`,
                    width: p.size,
                    height: p.size,
                    animationDelay: `${p.delay}s`,
                    animationDuration: `${p.duration}s`,
                  }}
                  className="absolute rounded-full bg-primary-300/50 animate-float-slow"
                />
              ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
