"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Clock4, Users } from "lucide-react";
import clsx from "clsx";

export type SummaryMetric = {
  label: string;
  value: string;
  delta?: string;
  caption?: string;
};

export type CircleSnapshot = {
  id: string;
  name: string;
  contribution: string;
  members: number;
  phase: "Contribution" | "Payout" | "Grace";
  progress: number;
  nextPayout: string;
};

export type ActivityItem = {
  title: string;
  subtitle: string;
  timestamp: string;
  accent: string;
};

export type ContributionEntry = {
  member: string;
  circle: string;
  cycle: string;
  status: "On time" | "Pending" | "Missed";
  amount: string;
};

export function SummaryGrid({ metrics }: { metrics: SummaryMetric[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {metrics.map((metric) => (
        <motion.div
          key={metric.label}
          className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">{metric.label}</p>
          <div className="mt-3 flex items-center gap-2 text-3xl font-semibold">
            <span>{metric.value}</span>
            {metric.delta && (
              <span className="text-sm text-emerald-300">{metric.delta}</span>
            )}
          </div>
          {metric.caption && <p className="mt-2 text-sm text-slate-300">{metric.caption}</p>}
        </motion.div>
      ))}
    </div>
  );
}

export function CircleBoard({ circles }: { circles: CircleSnapshot[] }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Circles</p>
          <h2 className="text-2xl font-semibold">Your active groups</h2>
        </div>
        <div className="text-sm text-slate-400">{circles.length} live</div>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {circles.map((circle) => (
          <div key={circle.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-base font-semibold text-white">{circle.name}</p>
                <p className="text-sm text-slate-400">
                  {circle.members} members • {circle.contribution}
                </p>
              </div>
              <span
                className={clsx(
                  "rounded-full px-3 py-1 text-xs font-medium",
                  circle.phase === "Payout"
                    ? "bg-emerald-400/20 text-emerald-200"
                    : circle.phase === "Grace"
                      ? "bg-amber-400/20 text-amber-200"
                      : "bg-cyan-400/20 text-cyan-200"
                )}
              >
                {circle.phase}
              </span>
            </div>
            <div className="mt-4 h-2 rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-lime-300"
                style={{ width: `${circle.progress}%` }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-sm text-slate-300">
              <span>Next payout</span>
              <span className="text-white">{circle.nextPayout}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ActivityTimeline({ items }: { items: ActivityItem[] }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Clock4 className="h-4 w-4" />
        Live activity
      </div>
      <ol className="mt-5 space-y-4">
        {items.map((item) => (
          <li key={item.title} className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.accent }} />
            <div className="flex flex-col text-sm">
              <p className="text-white">{item.title}</p>
              <p className="text-slate-400">{item.subtitle}</p>
              <p className="text-xs text-slate-500">{item.timestamp}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function ContributionTable({ rows }: { rows: ContributionEntry[] }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-6">
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Users className="h-4 w-4" />
        Contribution health
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="py-2">Member</th>
              <th className="py-2">Circle</th>
              <th className="py-2">Cycle</th>
              <th className="py-2">Amount</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 text-slate-200">
            {rows.map((row) => (
              <tr key={`${row.member}-${row.circle}-${row.cycle}`}>
                <td className="py-3">{row.member}</td>
                <td className="py-3">{row.circle}</td>
                <td className="py-3">{row.cycle}</td>
                <td className="py-3">{row.amount}</td>
                <td className="py-3">
                  <span
                    className={clsx(
                      "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs",
                      row.status === "On time"
                        ? "bg-emerald-400/20 text-emerald-200"
                        : row.status === "Pending"
                          ? "bg-amber-400/20 text-amber-200"
                          : "bg-rose-400/20 text-rose-200"
                    )}
                  >
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ActionButton({ label }: { label: string }) {
  return (
    <button className="group inline-flex items-center gap-2 rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
      {label}
      <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
    </button>
  );
}
