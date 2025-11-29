"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { motion } from "framer-motion";
import { Sparkles, Zap } from "lucide-react";

import { circles } from "./constants";
import { fadeUp } from "./animations";
import { ChainStatus, CircleCard, PrimaryButton } from "./ui";

export function HeroSection({
  isConnected,
  onSupportedChain,
}: {
  isConnected: boolean;
  onSupportedChain: boolean;
}) {
  return (
    <motion.header className="flex flex-col gap-10" {...fadeUp}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-cyan-300">Self-enabled circles</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight text-slate-50 sm:text-5xl">
            Trust-first group savings for every community on Celo
          </h1>
        </div>
        <ConnectButton />
      </div>

      <div className="grid gap-8 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col gap-6">
          <p className="text-lg text-slate-200">
            Create verifiable Ajo/Esusu circles, rotate payouts on-chain, and grow shareable
            reputation—all in one elegant flow built for low fees and high trust.
          </p>
          <ul className="grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
            {["SelfID gated membership", "cUSD smart contracts", "Transparent payouts", "Mobile-perfect UX"].map(
              (item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-2"
                >
                  <Sparkles className="h-4 w-4 text-cyan-300" />
                  {item}
                </li>
              )
            )}
          </ul>
          <div className="flex flex-wrap items-center gap-4">
            <PrimaryButton label={isConnected ? "Create a circle" : "Connect to begin"} />
            <ChainStatus isConnected={isConnected} onSupportedChain={onSupportedChain} />
          </div>
        </div>

        <motion.div
          className="rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-500/10 via-emerald-500/10 to-transparent p-6"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 6, repeat: Infinity }}
        >
          <p className="text-sm uppercase tracking-wider text-cyan-200">Live circle signal</p>
          <div className="mt-4 flex flex-col gap-4">
            {circles.slice(0, 2).map((circle) => (
              <CircleCard key={circle.name} circle={circle} minimal />
            ))}
            <motion.div
              className="rounded-xl border border-white/10 p-4"
              initial={{ opacity: 0.7 }}
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <p className="text-sm text-slate-300">Reputation boost in progress…</p>
              <div className="mt-2 flex items-center gap-2 text-cyan-200">
                <Zap className="h-4 w-4" />
                +3 score after cycle completion
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.header>
  );
}
