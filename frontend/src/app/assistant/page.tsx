import type { Metadata } from "next";
import { Bot, Copy, Gauge, Mic } from "lucide-react";
import { AIChatWindow } from "@/components/ai/AIChatWindow";
import { Card, CardContent } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "AI Assistant — Nivaran AI",
};

const HIGHLIGHTS = [
  { icon: Bot, title: "Guided reporting", description: "Ask how to report an issue, what photo works best, or which category to pick." },
  { icon: Gauge, title: "Explains priority scores", description: "Understand exactly why an issue got the score it did." },
  { icon: Copy, title: "Duplicate detection help", description: "Learn how grouped reports and confirmations work." },
  { icon: Mic, title: "Multilingual", description: "Ask questions in Marathi, Hindi, or English." },
];

export default function AssistantPage() {
  return (
    <div className="container max-w-5xl py-10 sm:py-14">
      <div className="mb-8 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-1.5 text-xs font-semibold text-primary-700">
          <Bot className="h-3.5 w-3.5" /> Nivaran AI Assistant
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">How can I help?</h1>
        <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
          Ask about reporting a problem, tracking an existing issue, or how AI priority scores are calculated.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="overflow-hidden">
          <AIChatWindow variant="page" />
        </Card>

        <div className="space-y-4">
          {HIGHLIGHTS.map((item) => (
            <Card key={item.title}>
              <CardContent className="flex items-start gap-3 pt-6">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                  <item.icon className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
