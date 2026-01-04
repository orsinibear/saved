// ExperienceSection.tsx
"use client";
import { motion } from "framer-motion";
import { fadeUp } from "./animations";
import { SelfIdPanel } from "./SelfIdPanel";
import { DashboardPreview } from "./DashboardPreview";

export function ExperienceSection({
  isConnected,
  onSupportedChain,
}: {
  isConnected: boolean;
  onSupportedChain: boolean;
}) {
  return (
    <motion.section 
      className="grid gap-4 sm:gap-6 lg:gap-8 grid-cols-1 lg:grid-cols-[0.8fr_1.2fr]" 
      {...fadeUp}
    >
      <SelfIdPanel isConnected={isConnected} onSupportedChain={onSupportedChain} />
      <DashboardPreview />
    </motion.section>
  );
}
