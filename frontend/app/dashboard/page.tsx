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
  type ContributionEntry,
  type SummaryMetric,
} from "./components";
import { useCirclesData } from "./useCirclesData";

const summarySkeleton: SummaryMetric[] = [
  { label: "Total value rotating", value: "…", delta: "" },
  { label: "Reputation score", value: "82", caption: "Aggregated Self attestations" },
  { label: "On-time streak", value: "11 cycles", caption: "Past 90 days" },
];

export default function DashboardPage() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const onCeloMainnet = typeof chainId === "number" && chainId === celo.id;
  const { circles, aggregate, activities, contributions, isLoading, isError, refetch } = useCirclesData();

  const summaryMetrics: SummaryMetric[] = [
    {
      label: "Total value rotating",
      value: `${aggregate.headlineValue.toLocaleString()} cUSD`,
      delta: aggregate.totalCircles ? `${aggregate.totalCircles} circles live` : undefined,
    },
    summarySkeleton[1],
    summarySkeleton[2],
  ];

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

  const showContent = !isLoading && !isError && circles.length > 0;

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

        {isLoading && (
          <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-10 text-center text-slate-300">
            <p className="text-lg font-medium">Fetching your circles…</p>
            <p className="mt-2 text-sm text-slate-500">Were reading data from the deployed factory.</p>
          </div>
        )}

        {isError && (
          <div className="rounded-3xl border border-rose-400/40 bg-rose-500/10 p-6 text-sm text-rose-100">
            <p className="font-semibold">Unable to load circles</p>
            <p className="mt-1 text-rose-200/80">Please ensure the factory address env var is set, then try again.</p>
            <button className="mt-3 rounded-full border border-rose-200/40 px-4 py-1 text-xs font-semibold" onClick={() => refetch()}>
              Retry
            </button>
          </div>
        )}

        {showContent && <CircleBoard circles={circles} />}

        {!isLoading && !isError && circles.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-10 text-center text-slate-300">
            <p className="text-lg font-medium">No circles found yet</p>
            <p className="mt-2 text-sm text-slate-500">Use the create flow to spin up your first savings circle.</p>
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-[0.6fr_0.4fr]">
          <ContributionTable rows={contributions as ContributionEntry[]} />
          <ActivityTimeline items={activities as ActivityItem[]} />
        </section>
      </div>
    </main>
  );
}
