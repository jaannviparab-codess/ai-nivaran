"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const STEPS = [
  "Uploading image",
  "Scanning photo",
  "Detecting issue category",
  "Understanding location",
  "Checking for duplicates",
  "Calculating priority score",
];

const STEP_DURATION_MS = 430;

export function ScanningAnimation() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActiveStep((s) => Math.min(s + 1, STEPS.length));
    }, STEP_DURATION_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50 to-cyan-50 p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary-600 to-secondary-600 text-white">
          <Sparkles className="h-5 w-5" />
          <span className="absolute inset-0 animate-pulse-ring rounded-full border-2 border-primary-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Nivaran AI is analyzing your report</p>
          <p className="text-xs text-muted-foreground">This usually takes just a few seconds</p>
        </div>
      </div>

      <ul className="space-y-2.5">
        {STEPS.map((step, index) => {
          const state = index < activeStep ? "done" : index === activeStep ? "active" : "pending";
          return (
            <li key={step} className="flex items-center gap-3">
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-white transition-colors",
                  state === "done" && "border-success-600 bg-success-600",
                  state === "active" && "border-primary-600 bg-primary-600",
                  state === "pending" && "border-border bg-white"
                )}
              >
                <AnimatePresence mode="wait">
                  {state === "done" && (
                    <motion.span key="done" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                      <Check className="h-3.5 w-3.5" />
                    </motion.span>
                  )}
                  {state === "active" && (
                    <motion.span key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
              <span className={cn("text-sm", state === "pending" ? "text-muted-foreground" : "text-foreground font-medium")}>
                {step}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
