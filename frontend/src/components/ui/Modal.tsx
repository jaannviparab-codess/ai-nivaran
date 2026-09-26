"use client";

import { X } from "lucide-react";
import { Dialog } from "./Dialog";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/I18nProvider";

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: keyof typeof sizeClasses;
}

export function Modal({ open, onClose, title, description, children, footer, size = "md" }: ModalProps) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onClose={onClose} labelledBy="modal-title" className={sizeClasses[size]}>
      <div className="flex items-start justify-between gap-4 border-b border-border p-6">
        <div>
          <h2 id="modal-title" className="text-lg font-semibold tracking-tight">
            {title}
          </h2>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        <button
          onClick={onClose}
          aria-label={t("common.closeDialog")}
          className={cn(
            "shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          )}
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="p-6">{children}</div>
      {footer && <div className="flex justify-end gap-3 border-t border-border p-6">{footer}</div>}
    </Dialog>
  );
}
