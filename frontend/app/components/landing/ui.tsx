"use client";

import clsx from "clsx";
import { ArrowRight, ShieldCheck, Sparkles, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { CirclePreview } from "./constants";

export function PrimaryButton({ label }: { label: string }) {
  return (
    <button className="group inline-flex items-center gap-2 rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
      {label}
      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
    </button>
  );
}

export function SecondaryHint({ text }: { text: string }) {
  return <span className="text-xs text-slate-400">{text}</span>;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm text-slate-300">{description}</p>
    </div>
  );
}

export function GradientStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 rounded-2xl border border-white/10 bg-slate-900/60 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}

export function ChainStatus({
  isConnected,
  onSupportedChain,
}: {
  isConnected: boolean;
  onSupportedChain: boolean;
}) {
  if (!isConnected) {
    return <StatusPill icon={Users} label="Wallet not connected" tone="muted" />;
  }
  if (!onSupportedChain) {
    return <StatusPill icon={ShieldCheck} label="Switch to Celo or Alfajores" tone="warning" />;
  }
  return <StatusPill icon={Sparkles} label="Ready on Celo" tone="success" />;
}

export function StatusPill({
  icon: Icon,
  label,
  tone = "success",
}: {
  icon: LucideIcon;
  label: string;
  tone?: "success" | "warning" | "muted";
}) {
  const tones: Record<typeof tone, string> = {
    success: "text-emerald-200 border-emerald-500/30",
    warning: "text-amber-200 border-amber-400/30",
    muted: "text-slate-300 border-white/10",
  } as const;
  return (
    <span className={clsx("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs", tones[tone])}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

export function CircleCard({ circle, minimal = false }: { circle: CirclePreview; minimal?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 shadow-[0_15px_60px_rgba(8,47,73,0.4)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-lg font-semibold text-white">{circle.name}</p>
          <p className="text-sm text-slate-400">
            {circle.members} members • {circle.contribution}
          </p>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-cyan-200">
          {circle.badge}
        </span>
      </div>
      <p className="mt-3 text-sm text-slate-300">{circle.status}</p>
      <div className="mt-3 h-2 rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-lime-300"
          style={{ width: `${circle.progress}%` }}
        />
      </div>
      {!minimal && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-300">
          <p>
            Next payout <span className="text-white">{circle.nextPayout}</span>
          </p>
          <button className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-wide text-cyan-200">
            Manage <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
