"use client";

import { useEffect } from "react";
import { APP_NAME } from "@/lib/constants";

export function useDocumentTitle(title: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = `${title} — ${APP_NAME}`;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
