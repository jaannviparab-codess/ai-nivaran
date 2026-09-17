"use client";

import { FlaskConical, X } from "lucide-react";
import { useState } from "react";
import { DEMO_MODE } from "@/lib/constants";

export function DemoModeBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (!DEMO_MODE || dismissed) return null;

  return (
    <div className="relative flex items-center justify-center gap-2 bg-slate-900 px-4 py-2 text-center text-xs font-medium text-white sm:text-sm">
      <FlaskConical className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
      <p>
        Demo Mode — showing simulated reports and AI results for demonstration only. No real complaints are sent to
        any authority.
      </p>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss demo mode notice"
        className="absolute right-3 rounded-md p-1 hover:bg-white/10"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
