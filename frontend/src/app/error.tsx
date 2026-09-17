"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/ErrorState";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Unhandled application error:", error);
  }, [error]);

  return (
    <div className="container flex min-h-[60vh] items-center justify-center py-16">
      <ErrorState
        title="Something went wrong"
        description="An unexpected error occurred while loading this page. You can try again below."
        onRetry={reset}
        className="max-w-md"
      />
    </div>
  );
}
