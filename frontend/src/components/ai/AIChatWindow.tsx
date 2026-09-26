"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Bot, Send, Sparkles, User } from "lucide-react";
import Link from "next/link";
import { sendAssistantMessage } from "@/lib/api";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/I18nProvider";
import { translate, type TranslationKey } from "@/i18n/translate";

const QUICK_PROMPTS: TranslationKey[] = ["assistant.quick1", "assistant.quick2", "assistant.quick3"];

// The welcome bubble is UI copy (not an AI response), so it's rebuilt from the
// dictionary on every render and follows language switches. Replies returned by
// the assistant API are dynamic content and are displayed exactly as received.
function buildWelcome(t: (key: TranslationKey) => string): ChatMessage {
  return {
    id: "welcome",
    role: "assistant",
    content: t("assistant.welcome"),
    createdAt: new Date().toISOString(),
    suggestedActions: [
      { label: t("assistant.actionReport"), href: "/report" },
      { label: t("assistant.actionTrack"), href: "/track" },
      { label: t("assistant.actionPriority"), href: "/analytics" },
    ],
  };
}

export function AIChatWindow({ variant = "floating" }: { variant?: "floating" | "page" }) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  /**
   * @param text      what the citizen sees in their bubble
   * @param apiText   what is sent to the assistant — quick prompts send their canonical English
   *                  wording because the current demo/rule-based assistant matches English keywords.
   */
  async function handleSend(text: string, apiText?: string) {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", content: trimmed, createdAt: new Date().toISOString() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setThinking(true);
    const reply = await sendAssistantMessage(apiText ?? trimmed);
    setThinking(false);
    setMessages((m) => [...m, reply]);
  }

  return (
    <div className={cn("flex flex-col", variant === "floating" ? "h-[520px]" : "h-[640px]")}>
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
        {[buildWelcome(t), ...messages].map((msg) => (
          <div key={msg.id} className={cn("flex gap-2.5", msg.role === "user" && "flex-row-reverse")}>
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                msg.role === "user" ? "bg-slate-200 text-slate-600" : "bg-gradient-to-br from-primary-600 to-secondary-600 text-white"
              )}
            >
              {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>
            <div className={cn("max-w-[80%] space-y-2", msg.role === "user" && "items-end")}>
              <div
                className={cn(
                  "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "rounded-tr-sm bg-primary-600 text-white"
                    : "rounded-tl-sm bg-muted text-foreground"
                )}
              >
                {msg.content}
              </div>
              {msg.suggestedActions && (
                <div className="flex flex-wrap gap-1.5">
                  {msg.suggestedActions.map((action) => (
                    <Link
                      key={action.href}
                      href={action.href}
                      className="rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 hover:bg-primary-100"
                    >
                      {action.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {thinking && (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-600 to-secondary-600 text-white">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-slate-400"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {messages.length === 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 pb-2">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSend(t(prompt), translate("en", prompt))}
              className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs text-slate-600 hover:border-primary-300 hover:text-primary-700"
            >
              <Sparkles className="h-3 w-3" /> {t(prompt)}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        className="flex items-center gap-2 border-t border-border p-3"
      >
        <label htmlFor="assistant-input" className="sr-only">
          {t("assistant.inputLabel")}
        </label>
        <input
          id="assistant-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("assistant.placeholder")}
          className="h-11 flex-1 rounded-xl border border-border bg-white px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        />
        <button
          type="submit"
          disabled={thinking || !input.trim()}
          aria-label={t("assistant.send")}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-primary-600 to-secondary-600 text-white disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
