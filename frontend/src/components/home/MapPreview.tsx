"use client";

import { ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { SectionHeading } from "@/components/common/SectionHeading";
import { RevealOnScroll } from "@/components/common/RevealOnScroll";
import { Button } from "@/components/ui/Button";
import { MapLegend } from "@/components/map/MapLegend";
import { IssueMapLoader } from "@/components/map/IssueMapLoader";
import { getIssueMapData } from "@/lib/api";
import type { IssueListItem } from "@/lib/types";

export function MapPreview() {
  const [issues, setIssues] = useState<IssueListItem[]>([]);

  useEffect(() => {
    getIssueMapData().then(setIssues);
  }, []);

  return (
    <section className="py-20 sm:py-28">
      <div className="container">
        <SectionHeading
          eyebrow="Live Transparency"
          title="Every reported issue, on one public map"
          description="No black boxes. Anyone can see what's been reported, its status, and how it's being prioritized — in real time."
        />

        <RevealOnScroll delay={0.15} className="relative mt-12 overflow-hidden rounded-3xl border border-border shadow-card">
          <div className="h-[420px] w-full sm:h-[480px]">
            <IssueMapLoader issues={issues} zoom={12} scrollWheelZoom={false} />
          </div>
          <div className="glass pointer-events-none absolute left-4 top-4 flex flex-wrap gap-3 rounded-xl px-3 py-2 sm:gap-4">
            <MapLegend className="flex flex-wrap gap-3 sm:gap-4" />
          </div>
          <div className="absolute bottom-4 right-4">
            <Button href="/map" size="sm" variant="glass" rightIcon={<ArrowUpRight className="h-4 w-4" />}>
              Open Full Map
            </Button>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
