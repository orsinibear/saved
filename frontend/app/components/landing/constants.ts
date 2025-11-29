import type { LucideIcon } from "lucide-react";

import { Clock8, ShieldCheck, Wallet2 } from "lucide-react";

export const stats = [
  { label: "Trust attestations", value: "1,240+", detail: "via Self Protocol" },
  { label: "Average payout", value: "2,150 cUSD", detail: "per completed circle" },
  { label: "Completion rate", value: "95%", detail: "last 90 days" },
] as const;

export type HowItWorksStep = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export const howItWorks: HowItWorksStep[] = [
  {
    title: "Verify",
    description: "Creators vouch for members with Self attestations to unlock trusted entry.",
    icon: ShieldCheck,
  },
  {
    title: "Contribute",
    description: "Members set a cadence, lock in cUSD contributions, and see live status cues.",
    icon: Wallet2,
  },
  {
    title: "Rotate payouts",
    description: "Trigger payouts on-chain with transparent history and automated reputation.",
    icon: Clock8,
  },
];

export type CirclePreview = {
  name: string;
  members: number;
  contribution: string;
  status: string;
  progress: number;
  nextPayout: string;
  badge: string;
};

export const circles: CirclePreview[] = [
  {
    name: "Market Queens",
    members: 8,
    contribution: "75 cUSD / wk",
    status: "Contribution window",
    progress: 72,
    nextPayout: "Ama • Cycle 4",
    badge: "Verified",
  },
  {
    name: "Diaspora Connect",
    members: 12,
    contribution: "120 cUSD / mo",
    status: "Payout queued",
    progress: 100,
    nextPayout: "Kweku • Cycle 8",
    badge: "Global",
  },
  {
    name: "Campus Builders",
    members: 6,
    contribution: "40 cUSD / wk",
    status: "Grace period",
    progress: 54,
    nextPayout: "Ada • Cycle 3",
    badge: "New",
  },
];
