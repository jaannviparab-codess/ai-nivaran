"use client";

import { motion } from "framer-motion";
import { Camera, ImagePlus, X } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/I18nProvider";

const MAX_SIZE_MB = 8;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function UploadZone({
  value,
  onChange,
  error,
}: {
  value: string | null;
  onChange: (dataUrl: string | null, error?: string) => void;
  error?: string | null;
}) {
  const [dragging, setDragging] = useState(false);
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  function handleFile(file?: File | null) {
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      onChange(null, t("report.upload.invalidType"));
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      onChange(null, t("report.upload.tooLarge", { size: MAX_SIZE_MB }));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  }

  if (value) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-border">
        <img src={value} alt={t("report.upload.uploadedAlt")} className="h-64 w-full object-cover" />
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label={t("report.upload.remove")}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/70 text-white hover:bg-slate-900"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <motion.div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        animate={{ borderColor: dragging ? "#4f46e5" : "#e2e8f0", scale: dragging ? 1.01 : 1 }}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed bg-muted/40 px-6 py-12 text-center"
        )}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
          <ImagePlus className="h-7 w-7" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{t("report.upload.dropPrompt")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("report.upload.fileHint", { size: MAX_SIZE_MB })}</p>
        </div>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            <ImagePlus className="h-4 w-4" /> {t("report.upload.uploadPhoto")}
          </button>
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            <Camera className="h-4 w-4" /> {t("report.upload.useCamera")}
          </button>
        </div>
      </motion.div>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0])}
        aria-label={t("report.upload.uploadAria")}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0])}
        aria-label={t("report.upload.cameraAria")}
      />
      {error && <p className="mt-2 text-sm text-critical-600">{error}</p>}
    </div>
  );
}
