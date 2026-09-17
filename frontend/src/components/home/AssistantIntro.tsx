"use client";

import { motion } from "framer-motion";
import { Bot, Sparkles, User } from "lucide-react";
import { RevealOnScroll } from "@/components/common/RevealOnScroll";
import { Button } from "@/components/ui/Button";

export function AssistantIntro() {
  return (
    <section className="py-20 sm:py-28">
      <div className="container grid items-center gap-12 lg:grid-cols-2">
        <RevealOnScroll direction="right">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-1.5 text-xs font-semibold text-primary-700">
            <Sparkles className="h-3.5 w-3.5" /> Always-on Guidance
          </span>
          <h2 className="mt-5 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Meet your AI assistant for civic reporting
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Not sure how to report something, or what a priority score means? The Nivaran AI assistant is available
            on every page — it can guide you through reporting, help you find an existing issue, and explain exactly
            how AI decisions were made.
          </p>
          <Button href="/assistant" size="lg" className="mt-6">
            Chat with the Assistant
          </Button>
        </RevealOnScroll>

        <RevealOnScroll direction="left" delay={0.1}>
          <div className="glass mx-auto max-w-md space-y-3 rounded-2xl p-5 shadow-card">
            {[
              { role: "assistant", text: "नमस्कार! How can I help you today?" },
              { role: "user", text: "How do I check my report's status?" },
              { role: "assistant", text: "Just open 'Track Issue' and enter your tracking ID, e.g. NVR-2026-1042." },
            ].map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.25, duration: 0.4 }}
                className={`flex items-end gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${msg.role === "user" ? "bg-slate-200" : "bg-gradient-to-br from-primary-600 to-secondary-600"}`}>
                  {msg.role === "user" ? <User className="h-3.5 w-3.5 text-slate-600" /> : <Bot className="h-3.5 w-3.5 text-white" />}
                </div>
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                    msg.role === "user" ? "rounded-br-sm bg-primary-600 text-white" : "rounded-bl-sm bg-white text-foreground shadow-sm"
                  }`}
                >
                  {msg.text}
                </div>
              </motion.div>
            ))}
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
