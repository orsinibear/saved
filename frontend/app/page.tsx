"use client";

import { useAccount, useChainId } from "wagmi";
import { celo } from "wagmi/chains";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Navbar } from "./components/landing/Navbar";
import { HeroSection } from "./components/landing/HeroSection";
import { StatsRow } from "./components/landing/StatsRow";
import { HowItWorksSection } from "./components/landing/HowItWorksSection";
import { FeaturesSection } from "./components/landing/FeaturesSection";
import { FAQSection } from "./components/landing/FAQSection";
import { Footer } from "./components/landing/Footer";

export default function Home() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const router = useRouter();
  const onSupportedChain = typeof chainId === "number" && chainId === celo.id;

  // Redirect to dashboard if wallet is connected and on supported chain
  useEffect(() => {
    if (isConnected && onSupportedChain) {
      router.push("/dashboard");
    }
  }, [isConnected, onSupportedChain, router]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <BackgroundGlow />
      <Navbar />
      <main className="relative z-10 mx-auto flex max-w-7xl flex-col gap-20 px-6 py-16 lg:px-10">
        <HeroSection isConnected={isConnected} onSupportedChain={onSupportedChain} />
        <StatsRow />
        <FeaturesSection />
        <HowItWorksSection />
        <FAQSection />
      </main>
      <Footer />
    </div>
  );
}

function BackgroundGlow() {
  return (
    <>
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.15),_transparent_55%)]" />
      <div className="pointer-events-none fixed inset-y-0 left-1/2 w-[40rem] -translate-x-1/2 bg-[radial-gradient(circle,_rgba(16,185,129,0.2),_transparent_60%)] blur-3xl" />
    </>
  );
}
