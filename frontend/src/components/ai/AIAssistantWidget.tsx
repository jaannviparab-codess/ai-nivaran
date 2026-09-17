"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bot, FlaskConical, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { DEMO_MODE } from "@/lib/constants";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { AIChatWindow } from "./AIChatWindow";

const GREETING_DISMISSED_KEY = "nvr-assistant-greeting-dismissed";
const HIDDEN_ROUTES = ["/assistant", "/login", "/register", "/forgot-password"];

export function AIAssistantWidget() {
  const [open, setOpen] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(GREETING_DISMISSED_KEY)) return;
    const timer = setTimeout(() => setShowGreeting(true), 3500);
    return () => clearTimeout(timer);
  }, []);

  function dismissGreeting() {
    setShowGreeting(false);
    window.localStorage.setItem(GREETING_DISMISSED_KEY, "1");
  }

  function handleToggle() {
    setOpen((v) => !v);
    if (showGreeting) dismissGreeting();
  }

  if (HIDDEN_ROUTES.includes(pathname)) return null;

  return (
    <div className="fixed bottom-5 right-4 z-[90] sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="glass absolute bottom-16 right-0 mb-2 w-[92vw] max-w-sm overflow-hidden rounded-2xl shadow-card"
            role="dialog"
            aria-label="Nivaran AI assistant"
          >
            <div className="flex items-center justify-between bg-gradient-to-r from-primary-600 to-secondary-600 px-4 py-3 text-white">
              <div className="flex items-center gap-2">
                <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <Bot className="h-4 w-4" />
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-primary-600 bg-success-400" />
                </span>
                <div>
                  <p className="text-sm font-semibold leading-none">Nivaran AI Assistant</p>
                  <p className="mt-1 text-[11px] leading-none text-white/75">Usually replies instantly</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {DEMO_MODE && (
                  <span className="hidden items-center gap-1 rounded-full bg-white/15 px-2 py-1 text-[10px] font-medium sm:flex">
                    <FlaskConical className="h-3 w-3" /> Demo
                  </span>
                )}
                <button onClick={() => setOpen(false)} aria-label="Close assistant" className="rounded-md p-1 hover:bg-white/20">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="bg-white">
              <AIChatWindow variant="floating" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showGreeting && !open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="glass absolute bottom-[4.5rem] right-0 mb-1 w-64 rounded-2xl rounded-br-sm p-3.5 shadow-card"
          >
            <button
              onClick={dismissGreeting}
              aria-label="Dismiss greeting"
              className="absolute right-2 top-2 rounded-full p-0.5 text-muted-foreground hover:bg-muted"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <p className="pr-4 text-sm text-foreground">
              👋 <span className="font-devanagari">नमस्कार!</span> Need help reporting a problem or checking a
              tracking ID?
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={handleToggle}
        whileTap={{ scale: 0.94 }}
        aria-label={open ? "Close AI assistant" : "Open AI assistant"}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary-600 to-secondary-600 text-white shadow-glow"
      >
        {!open && !reducedMotion && <span className="absolute inset-0 rounded-full border-2 border-primary-400 animate-pulse-ring" />}
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="h-6 w-6" />
            </motion.span>
          ) : (
            <motion.span key="bot" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <Bot className="h-6 w-6" />
            </motion.span>
          )}
        </AnimatePresence>
        {!open && <span className="absolute right-0.5 top-0.5 h-3 w-3 rounded-full border-2 border-white bg-success-400" />}
      </motion.button>
    </div>
  );
}
