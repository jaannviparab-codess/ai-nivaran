import {
  Bot,
  Copy,
  Eye,
  Gauge,
  Lightbulb,
  Mic,
  MessageSquareText,
  ScanSearch,
  ShieldAlert,
  Sparkles,
  Users2,
} from "lucide-react";
import { SectionHeading } from "@/components/common/SectionHeading";
import { RevealOnScroll } from "@/components/common/RevealOnScroll";

const CAPABILITIES = [
  { icon: ScanSearch, title: "Image Classification", description: "Identifies the problem type directly from the submitted photo." },
  { icon: Eye, title: "Image Understanding", description: "Reads visual context — scale, surroundings, and potential hazards." },
  { icon: Gauge, title: "Severity Estimation", description: "Estimates how serious an issue is on a calibrated severity scale." },
  { icon: Copy, title: "Duplicate Detection", description: "Groups similar reports in the same area into a single tracked issue." },
  { icon: ShieldAlert, title: "Spam / Fake Detection", description: "Flags suspicious or low-quality submissions for review." },
  { icon: Sparkles, title: "Priority Scoring", description: "Combines multiple signals into a transparent 0–100 priority score." },
  { icon: MessageSquareText, title: "NLP Report Classification", description: "Understands free-text descriptions in Marathi, Hindi, or English." },
  { icon: Mic, title: "Voice Transcription", description: "Converts spoken reports into accurate, structured text." },
  { icon: Bot, title: "AI Assistant", description: "Guides citizens through reporting, tracking, and understanding scores." },
  { icon: Lightbulb, title: "Root-Cause Suggestions", description: "Suggests a likely cause — always labeled as an AI hypothesis." },
  { icon: Users2, title: "Community Priority Analysis", description: "Surfaces what an area's residents most want fixed next." },
];

export function AICapabilities() {
  return (
    <section className="bg-gradient-to-b from-white to-primary-50/40 py-20 sm:py-28">
      <div className="container">
        <SectionHeading
          eyebrow="Under the Hood"
          title="A full AI service layer, purpose-built for civic reports"
          description="Every capability below is a modular AI service — each can run on a real provider or in demo mode without any API key."
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((cap, index) => (
            <RevealOnScroll key={cap.title} delay={Math.min(index * 0.06, 0.4)}>
              <div className="group relative h-full overflow-hidden rounded-2xl border border-border bg-white p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-glow">
                <span className="absolute right-3.5 top-3.5 flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-500" />
                  </span>
                  AI Active
                </span>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary-50 to-secondary-50 text-primary-600 transition-all duration-300 group-hover:scale-110 group-hover:from-primary-600 group-hover:to-secondary-600 group-hover:text-white">
                  <cap.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-foreground">{cap.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{cap.description}</p>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
