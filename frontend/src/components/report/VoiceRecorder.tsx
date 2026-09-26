"use client";

import { motion } from "framer-motion";
import { Mic, MicOff, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SUPPORTED_LANGUAGES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/I18nProvider";

type Status = "idle" | "listening" | "unsupported" | "error";

export function VoiceRecorder({ onTranscript }: { onTranscript: (text: string) => void }) {
  const [status, setStatus] = useState<Status>("idle");
  const { t, locale } = useTranslation();
  // Speech language defaults to the UI language; citizens can still switch it independently.
  const [language, setLanguage] = useState<(typeof SUPPORTED_LANGUAGES)[number]["code"]>(locale);
  const [liveTranscript, setLiveTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) {
      setStatus("unsupported");
      return;
    }
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  function start() {
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) {
      setStatus("unsupported");
      return;
    }
    const recognition = new Ctor();
    const langMeta = SUPPORTED_LANGUAGES.find((l) => l.code === language)!;
    recognition.lang = langMeta.speechCode;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      setLiveTranscript(text);
    };
    recognition.onerror = () => setStatus("error");
    recognition.onend = () => {
      setStatus((s) => (s === "listening" ? "idle" : s));
      setLiveTranscript((text) => {
        if (text.trim()) onTranscript(text.trim());
        return text;
      });
    };

    recognitionRef.current = recognition;
    setLiveTranscript("");
    setStatus("listening");
    recognition.start();
  }

  function stop() {
    recognitionRef.current?.stop();
  }

  if (status === "unsupported") {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        <MicOff className="h-4 w-4 shrink-0" />
        {t("report.voice.unsupported")}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">{t("report.voice.title")}</p>
        <div role="group" aria-label={t("report.voice.languageGroup")} className="flex gap-1 rounded-lg bg-white p-1 ring-1 ring-border">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => setLanguage(lang.code)}
              aria-pressed={language === lang.code}
              lang={lang.code}
              disabled={status === "listening"}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                language === lang.code ? "bg-primary-600 text-white" : "text-slate-500 hover:bg-muted"
              )}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={status === "listening" ? stop : start}
          aria-label={status === "listening" ? t("report.voice.stop") : t("report.voice.start")}
          className={cn(
            "relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white transition-colors",
            status === "listening" ? "bg-critical-600" : "bg-gradient-to-br from-primary-600 to-secondary-600"
          )}
        >
          {status === "listening" && <span className="absolute inset-0 animate-pulse-ring rounded-full border-2 border-critical-400" />}
          {status === "listening" ? <Square className="h-5 w-5" /> : <Mic className="h-6 w-6" />}
        </button>

        <div className="flex-1">
          {status === "listening" ? (
            <div className="flex h-10 items-center gap-1" role="status" aria-live="polite">
              {Array.from({ length: 18 }).map((_, i) => (
                <motion.span
                  key={i}
                  className="w-1 rounded-full bg-primary-500"
                  animate={{ height: [6, 24, 10, 30, 6] }}
                  transition={{ duration: 0.9 + (i % 4) * 0.15, repeat: Infinity, ease: "easeInOut", delay: i * 0.04 }}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("report.voice.hint", { language: SUPPORTED_LANGUAGES.find((l) => l.code === language)?.label ?? "" })}</p>
          )}
        </div>
      </div>

      {liveTranscript && (
        <div className="mt-3 rounded-xl bg-white p-3 text-sm text-slate-700 shadow-sm">
          <span className="mr-1 text-xs font-semibold uppercase text-primary-600">{t("report.voice.transcript")}</span>
          {liveTranscript}
        </div>
      )}
      {status === "error" && <p className="mt-2 text-xs text-critical-600">{t("report.voice.micError")}</p>}
    </div>
  );
}
