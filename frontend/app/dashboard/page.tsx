"use client";

import Link from "next/link";
import { useAccount, useChainId } from "wagmi";
import { celo } from "wagmi/chains";

import {
  ActionButton,
  ActivityTimeline,
  CircleBoard,
  ContributionTable,
  SummaryGrid,
  type ActivityItem,
  type CircleSnapshot,
  type ContributionEntry,
  type SummaryMetric,
} from "./components";

const summaryMetrics: SummaryMetric[] = [
  { label: "Total value rotating", value: "18,450 cUSD", delta: "+12% vs last cycle" },
  { label: "Reputation score", value: "82", caption: "Aggregated Self attestations" },
  { label: "On-time streak", value: "11 cycles", caption: "Past 90 days" },
];

const mockCircles: CircleSnapshot[] = [
  {
    id: "1",
    name: "Market Queens",
    contribution: "75 cUSD / wk",
    members: 8,
    phase: "Contribution",
    progress: 72,
    nextPayout: "Ama • Thu",
  },
  {
    id: "2",
    name: "Diaspora Connect",
    contribution: "120 cUSD / mo",
    members: 12,
    phase: "Payout",
    progress: 100,
    nextPayout: "Kweku • Today",
  },
  {
    id: "3",
    name: "Campus Builders",
    contribution: "40 cUSD / wk",
    members: 6,
    phase: "Grace",
    progress: 54,
    nextPayout: "Ada • Mon",
  },
];

const activityFeed: ActivityItem[] = [
  { title: "Ama contributed 75 cUSD", subtitle: "Market Queens • Cycle 4", timestamp: "2m ago", accent: "#22d3ee" },
  { title: "Missed payment flagged", subtitle: "Campus Builders • Ada", timestamp: "14m ago", accent: "#facc15" },
  { title: "Payout triggered", subtitle: "Diaspora Connect • Kweku", timestamp: "1h ago", accent: "#34d399" },
];

const contributionRows: ContributionEntry[] = [
  { member: "Ama", circle: "Market Queens", cycle: "4", amount: "75 cUSD", status: "On time" },
  { member: "Ada", circle: "Campus Builders", cycle: "3", amount: "40 cUSD", status: "Pending" },
  { member: "Gbenga", circle: "Diaspora Connect", cycle: "8", amount: "120 cUSD", status: "On time" },
  { member: "Ngozi", circle: "Market Queens", cycle: "4", amount: "75 cUSD", status: "Missed" },
];

export default function DashboardPage() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const onCeloMainnet = typeof chainId === "number" && chainId === celo.id;

  if (!isConnected || !onCeloMainnet) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-center text-white">
        <div className="space-y-4">
          <p className="text-2xl font-semibold">Connect on Celo mainnet to view your dashboard</p>
          <p className="text-sm text-slate-300">Use the landing page connect button, then return here.</p>
          <Link href="/" className="text-cyan-300 underline">
            Go back to landing page
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white lg:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Command center</p>
            <h1 className="mt-2 text-4xl font-semibold">Your savings circles</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <ActionButton label="Create circle" />
            <ActionButton label="Invite member" />
          </div>
        </header>

        <SummaryGrid metrics={summaryMetrics} />

        <CircleBoard circles={mockCircles} />

        <section className="grid gap-6 lg:grid-cols-[0.6fr_0.4fr]">
          <ContributionTable rows={contributionRows} />
          <ActivityTimeline items={activityFeed} />
        </section>
      </div>
    </main>
  );
}
