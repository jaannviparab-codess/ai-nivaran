import type { Metadata } from "next";
import { AssistantPageContent } from "@/components/ai/AssistantPageContent";

export const metadata: Metadata = {
  title: "AI Assistant — Nivaran AI",
};

// Server shell keeps the static metadata; the translated UI lives in a client component.
export default function AssistantPage() {
  return <AssistantPageContent />;
}
