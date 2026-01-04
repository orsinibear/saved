"use client";
import { motion } from "framer-motion";
import { Award, Lock, Zap, Users, TrendingUp, Shield } from "lucide-react";
import { SectionHeading } from "./ui";

const features = [
  {
    icon: Lock,
    title: "Self-ID Gated",
    description: "Only verified members can join circles. Creators vouch for members using Self Protocol attestations.",
  },
  {
    icon: Zap,
    title: "Smart Payouts",
    description: "Automated, transparent payout rotation on-chain. No intermediaries, full auditability.",
  },
  {
    icon: Users,
    title: "Community Trust",
    description: "Build reputation across circles. Your history becomes your credential for future groups.",
  },
  {
    icon: TrendingUp,
    title: "Low Fees",
    description: "Built on Celo for near-zero transaction costs. More money stays in the circle.",
  },
  {
    icon: Award,
    title: "Reputation Scores",
    description: "Earn verifiable reputation badges as you complete cycles. Portable across the ecosystem.",
  },
  {
    icon: Shield,
    title: "Transparent History",
    description: "Every contribution and payout is recorded on-chain. Full transparency, zero disputes.",
  },
];

export function FeaturesSection() {
  return (
    <motion.section
      id="features"
      className="space-y-8 sm:space-y-10 lg:space-y-12 py-12 sm:py-16 lg:py-20"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
    >
      <SectionHeading
        eyebrow="Capabilities"
        title="Everything you need for trusted group savings"
        description="Built for communities that value transparency, security, and shared prosperity."
      />
      
      <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(({ icon: Icon, title, description }, index) => (
          <motion.div
            key={title}
            className="group rounded-xl sm:rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-5 sm:p-6 transition hover:border-cyan-400/30 hover:bg-white/10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ 
              delay: index * 0.05,
              duration: 0.4,
              ease: "easeOut"
            }}
          >
            <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-cyan-400/20 to-emerald-400/20 transition group-hover:from-cyan-400/30 group-hover:to-emerald-400/30">
              <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-300" />
            </div>
            <h3 className="mt-3 sm:mt-4 text-base sm:text-lg font-semibold text-white">
              {title}
            </h3>
            <p className="mt-1.5 sm:mt-2 text-sm text-slate-400 leading-relaxed">
              {description}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
