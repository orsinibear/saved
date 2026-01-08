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
    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.label}
          className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5 backdrop-blur"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ delay: index * 0.05 }}
        >
          <p className="text-xs uppercase tracking-[0.15em] sm:tracking-[0.2em] text-cyan-200">
            {metric.label}
          </p>
          <div className="mt-2 sm:mt-3 flex items-center gap-2 text-2xl sm:text-3xl font-semibold">
            <span className="truncate">{metric.value}</span>
            {metric.delta && (
              <span className="text-xs sm:text-sm text-emerald-300 flex-shrink-0">
                {metric.delta}
              </span>
            )}
          </div>
          {metric.caption && (
            <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-300 line-clamp-2">
              {metric.caption}
            </p>
          )}
        </motion.div>
      ))}
    </div>
  );
}

export function CircleBoard({ circles }: { circles: CircleSnapshot[] }) {
  return (
    <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-slate-900/40 p-4 sm:p-5 lg:p-6">
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] text-cyan-200">
            Circles
          </p>
          <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold mt-0.5 sm:mt-1">
            Your active groups
          </h2>
        </div>
        <div className="text-xs sm:text-sm text-slate-400 flex-shrink-0">
          {circles.length} live
        </div>
      </div>

      {circles.length === 0 ? (
        <div className="mt-6 text-center py-8 sm:py-12">
          <div className="text-4xl sm:text-5xl mb-3">🔄</div>
          <p className="text-sm sm:text-base text-slate-300">No active circles yet</p>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Create your first circle to get started
          </p>
        </div>
      ) : (
        <div className="mt-4 sm:mt-5 lg:mt-6 grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {circles.map((circle) => (
            <div
              key={circle.id}
              className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4 hover:border-cyan-400/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base font-semibold text-white truncate">
                    {circle.name}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                    {circle.members} members • {circle.contribution}
                  </p>
                </div>
                <span
                  className={clsx(
                    "rounded-full px-2 sm:px-3 py-1 text-xs font-medium flex-shrink-0",
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
              <div className="mt-3 sm:mt-4 h-2 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-lime-300 transition-all duration-500"
                  style={{ width: `${circle.progress}%` }}
                />
              </div>
              <div className="mt-2 sm:mt-3 flex items-center justify-between text-xs sm:text-sm text-slate-300">
                <span>Next payout</span>
                <span className="text-white font-medium">{circle.nextPayout}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ActivityTimeline({ items }: { items: ActivityItem[] }) {
  return (
    <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-5 lg:p-6">
      <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400">
        <Clock4 className="h-4 w-4 flex-shrink-0" />
        <span>Live activity</span>
      </div>

      {items.length === 0 ? (
        <div className="mt-5 text-center py-6 sm:py-8">
          <p className="text-sm text-slate-400">No recent activity</p>
        </div>
      ) : (
        <ol className="mt-4 sm:mt-5 space-y-3 sm:space-y-4">
          {items.map((item, index) => (
            <li key={`${item.title}-${index}`} className="flex items-start gap-3">
              <span
                className="h-2 w-2 rounded-full flex-shrink-0 mt-1.5"
                style={{ backgroundColor: item.accent }}
              />
              <div className="flex-1 min-w-0 text-xs sm:text-sm">
                <p className="text-white font-medium">{item.title}</p>
                <p className="text-slate-400 mt-0.5 line-clamp-2">{item.subtitle}</p>
                <p className="text-xs text-slate-500 mt-1">{item.timestamp}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function ContributionTable({ rows }: { rows: ContributionEntry[] }) {
  return (
    <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-slate-900/40 p-4 sm:p-5 lg:p-6">
      <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400 mb-4 sm:mb-5">
        <Users className="h-4 w-4 flex-shrink-0" />
        <span>Contribution health</span>
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-8 sm:py-12">
          <p className="text-sm text-slate-400">No contribution data yet</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto -mx-4 sm:-mx-5 lg:-mx-6 px-4 sm:px-5 lg:px-6">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="py-2 pr-4">Member</th>
                  <th className="py-2 pr-4">Circle</th>
                  <th className="py-2 pr-4">Cycle</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-slate-200">
                {rows.map((row, index) => (
                  <tr key={`${row.member}-${row.circle}-${row.cycle}-${index}`}>
                    <td className="py-3 pr-4 font-mono text-xs">{row.member}</td>
                    <td className="py-3 pr-4">{row.circle}</td>
                    <td className="py-3 pr-4">{row.cycle}</td>
                    <td className="py-3 pr-4 font-semibold">{row.amount}</td>
                    <td className="py-3">
                      <span
                        className={clsx(
                          "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium",
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

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {rows.map((row, index) => (
              <div
                key={`${row.member}-${row.circle}-${row.cycle}-${index}`}
                className="rounded-xl border border-white/10 bg-white/5 p-3"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-400">Member</p>
                    <p className="text-sm font-mono text-white truncate">{row.member}</p>
                  </div>
                  <span
                    className={clsx(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium flex-shrink-0",
                      row.status === "On time"
                        ? "bg-emerald-400/20 text-emerald-200"
                        : row.status === "Pending"
                          ? "bg-amber-400/20 text-amber-200"
                          : "bg-rose-400/20 text-rose-200"
                    )}
                  >
                    {row.status}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-slate-400">Circle</p>
                    <p className="text-white mt-0.5 truncate">{row.circle}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Cycle</p>
                    <p className="text-white mt-0.5">{row.cycle}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Amount</p>
                    <p className="text-white font-semibold mt-0.5">{row.amount}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

type ActionButtonProps = {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
};

export function ActionButton({ label, onClick, disabled }: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group inline-flex items-center gap-2 rounded-full bg-cyan-400 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
    >
      <span className="truncate">{label}</span>
      <ArrowUpRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 flex-shrink-0" />
    </button>
  );
}
