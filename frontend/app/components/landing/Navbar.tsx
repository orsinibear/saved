"use client";

import { AppKitButton } from "@reown/appkit/react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import Link from "next/link";
import { useAccount, useChainId } from "wagmi";
import { celo } from "wagmi/chains";

export function Navbar() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const onSupportedChain = typeof chainId === "number" && chainId === celo.id;

  return (
    <motion.nav
      className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-md"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-emerald-400">
            <Zap className="h-5 w-5 text-slate-950" />
          </div>
          <span className="text-lg font-bold text-white">Ajo</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm text-slate-300 transition hover:text-white">
            Features
          </a>
          <a href="#how-it-works" className="text-sm text-slate-300 transition hover:text-white">
            How it works
          </a>
          <a href="#faq" className="text-sm text-slate-300 transition hover:text-white">
            FAQ
          </a>
          {isConnected && onSupportedChain && (
            <Link href="/dashboard" className="text-sm text-cyan-300 transition hover:text-cyan-200 font-semibold">
              Dashboard
            </Link>
          )}
        </div>

        <AppKitButton />
      </div>
    </motion.nav>
  );
}
