import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { WorkflowAnimation } from "@/components/home/WorkflowAnimation";
import { AICapabilities } from "@/components/home/AICapabilities";
import { MapPreview } from "@/components/home/MapPreview";
import { StatsSection } from "@/components/home/StatsSection";
import { BeforeAfterShowcase } from "@/components/home/BeforeAfterShowcase";
import { CommunitySection } from "@/components/home/CommunitySection";
import { AssistantIntro } from "@/components/home/AssistantIntro";
import { CTASection } from "@/components/home/CTASection";

export default function HomePage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <WorkflowAnimation />
      <AICapabilities />
      <MapPreview />
      <StatsSection />
      <BeforeAfterShowcase />
      <CommunitySection />
      <AssistantIntro />
      <CTASection />
    </>
  );
}
