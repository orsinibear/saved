"use client";
import { motion } from "framer-motion";
import { circles } from "./constants";
import { SectionHeading, CircleCard } from "./ui";

export function DashboardPreview() {
  return (
    <div className="space-y-4 sm:space-y-6 rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-6 lg:p-8">
      <SectionHeading
        eyebrow="Operations"
        title="Savings command center"
        description="Monitor contribution streaks, payout queues, and on-chain reputation in real time."
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {circles.map((circle, index) => (
          <motion.div
            key={circle.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ 
              delay: index * 0.05,
              duration: 0.4,
              ease: "easeOut"
            }}
            className="h-full"
          >
            <CircleCard circle={circle} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
