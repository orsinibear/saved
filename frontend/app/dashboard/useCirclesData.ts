"use client";

import { useQuery } from "@tanstack/react-query";
import { formatUnits, parseAbi, parseAbiItem } from "viem";
import { type PublicClient } from "viem";
import { useAccount, useConfig, usePublicClient } from "wagmi";
import { readContract } from "wagmi/actions";

import type { ActivityItem, CircleSnapshot, ContributionEntry } from "./components";

type DashboardQueryPayload = {
  circles: CircleSnapshot[];
  aggregate: {
    totalCircles: number;
    headlineValue: number;
  };
  activities: ActivityItem[];
  contributions: ContributionEntry[];
};

const factoryAddress = process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}` | undefined;

if (!factoryAddress) {
  throw new Error("NEXT_PUBLIC_FACTORY_ADDRESS is required to load dashboard data");
}

const lookbackBlocks = BigInt(process.env.NEXT_PUBLIC_ACTIVITY_LOOKBACK_BLOCKS ?? "20000");

type ActivityWithMeta = ActivityItem & { blockNumber?: bigint };
type ContributionWithMeta = ContributionEntry & { blockNumber?: bigint };

const factoryAbi = parseAbi([
  "function totalCircles() view returns (uint256)",
  "function allCircles(uint256) view returns (address circle)",
]);
const circleAbi = parseAbi([
  "function getStatus() view returns (uint256 currentCycle, uint256 currentDueIndex, uint256 contributionAmount, uint256 totalMembers)",
  "function maxMembers() view returns (uint256)",
  "function members(uint256) view returns (address)",
  "function payoutOrder(uint256) view returns (uint256)",
]);

const circleCreatedEvent = parseAbiItem(
  "event CircleCreated(address indexed circle, address indexed creator, address cUSD, uint256 contributionAmount, uint256 cycleLength, uint256 maxMembers)"
);
const contributedEvent = parseAbiItem(
  "event Contributed(address indexed member, uint256 indexed cycle, uint256 amount)"
);
const payoutEvent = parseAbiItem("event Payout(address indexed to, uint256 indexed cycle, uint256 amount)");

function formatAddress(address?: string) {
  if (!address) return "TBD";
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function formatContribution(amount: bigint) {
  const asString = formatUnits(amount, 18);
  const [whole, fraction = "0"] = asString.split(".");
  const trimmedFraction = fraction.replace(/0+$/, "");
  return trimmedFraction ? `${whole}.${trimmedFraction.slice(0, 2)}` : whole;
}

function blockLabel(blockNumber?: bigint) {
  if (!blockNumber || blockNumber === 0n) return "Pending";
  return `Block #${blockNumber.toString()}`;
}

async function loadCircleSnapshot(
  config: ReturnType<typeof useConfig>,
  circleAddress: `0x${string}`,
  index: number
) {
  const [status, maxMembers] = await Promise.all([
    readContract(config, {
      address: circleAddress,
      abi: circleAbi,
      functionName: "getStatus",
    }),
    readContract(config, {
      address: circleAddress,
      abi: circleAbi,
      functionName: "maxMembers",
    }),
  ]);

  const [currentCycle, currentDueIndex, contributionAmount, totalMembers] = status as [
    bigint,
    bigint,
    bigint,
    bigint,
  ];

  let nextRecipient: string | undefined;
  if (totalMembers > 0n) {
    const dueSlot = await readContract(config, {
      address: circleAddress,
      abi: circleAbi,
      functionName: "payoutOrder",
      args: [currentDueIndex],
    }).catch(() => 0n);

    if (dueSlot > 0n) {
      nextRecipient = await readContract(config, {
        address: circleAddress,
        abi: circleAbi,
        functionName: "members",
        args: [dueSlot - 1n],
      }).catch(() => undefined);
    }
  }

  const maxMembersNum = Number(maxMembers);
  const totalMembersNum = Number(totalMembers);
  const contributionLabel = `${formatContribution(contributionAmount)} cUSD / cycle`;
  const progress = maxMembersNum === 0 ? 0 : Math.min(100, Math.round((totalMembersNum / maxMembersNum) * 100));
  const phase = totalMembersNum < maxMembersNum ? "Contribution" : "Payout";

  return {
    id: `${index}-${circleAddress}`,
    name: `Circle ${index + 1}`,
    contribution: contributionLabel,
    members: totalMembersNum,
    phase,
    progress,
    nextPayout: formatAddress(nextRecipient ?? circleAddress),
  } satisfies CircleSnapshot;
}

export function useCirclesData() {
  const config = useConfig();
  const { isConnected } = useAccount();
  const publicClient = usePublicClient();

  const query = useQuery({
    queryKey: ["circles", factoryAddress],
    enabled: Boolean(config) && isConnected,
    staleTime: 30_000,
    queryFn: async (): Promise<DashboardQueryPayload> => {
      const totalCircles = await readContract(config, {
        address: factoryAddress,
        abi: factoryAbi,
        functionName: "totalCircles",
      });

      const totalAsNumber = Number(totalCircles);
      if (totalAsNumber === 0) {
        return {
          circles: [],
          aggregate: { totalCircles: 0, headlineValue: 0 },
          activities: [],
          contributions: [],
        };
      }

      const circleAddresses = await Promise.all(
        Array.from({ length: totalAsNumber }, (_, i) =>
          readContract(config, {
            address: factoryAddress,
            abi: factoryAbi,
            functionName: "allCircles",
            args: [BigInt(i)],
          })
        )
      );

      const snapshots = await Promise.all(
        circleAddresses.map((address, idx) => loadCircleSnapshot(config, address as `0x${string}`, idx))
      );

      const aggregate = {
        totalCircles: snapshots.length,
        headlineValue: snapshots.reduce((sum, circle) => {
          const numericMatch = Number(circle.contribution.split(" ")[0]) || 0;
          return sum + numericMatch;
        }, 0),
      };

      if (!publicClient) {
        return { circles: snapshots, aggregate, activities: [], contributions: [] };
      }

      const toBlock = await publicClient.getBlockNumber();
      const fromBlock = toBlock > lookbackBlocks ? toBlock - lookbackBlocks : 0n;

      const factoryActivities = await fetchFactoryActivities(publicClient, fromBlock, toBlock);

      const circleData = await Promise.all(
        snapshots.map((snapshot, idx) =>
          fetchCircleEvents(publicClient, circleAddresses[idx] as `0x${string}`, snapshot.name, fromBlock, toBlock)
        )
      );

      const flatActivities = factoryActivities
        .concat(circleData.flatMap((c) => c.activities))
        .sort((a, b) => Number((b.blockNumber ?? 0n) - (a.blockNumber ?? 0n)))
        .slice(0, 6)
        .map(({ blockNumber, ...rest }) => ({
          ...rest,
          timestamp: blockLabel(blockNumber) || rest.timestamp,
        }));

      const flatContributions = circleData
        .flatMap((c) => c.contributions)
        .sort((a, b) => Number((b.blockNumber ?? 0n) - (a.blockNumber ?? 0n)))
        .slice(0, 6)
        .map(({ blockNumber, ...rest }) => ({
          ...rest,
          cycle: rest.cycle,
        }));

      return {
        circles: snapshots,
        aggregate,
        activities: flatActivities,
        contributions: flatContributions,
      };
    },
  });

  return {
    circles: query.data?.circles ?? [],
    aggregate: query.data?.aggregate ?? { totalCircles: 0, headlineValue: 0 },
    activities: query.data?.activities ?? [],
    contributions: query.data?.contributions ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

async function fetchFactoryActivities(client: PublicClient, fromBlock: bigint, toBlock: bigint): Promise<ActivityWithMeta[]> {
  const logs = await client.getLogs({
    address: factoryAddress,
    event: circleCreatedEvent,
    fromBlock,
    toBlock,
  });

  return logs.map((log) => ({
    title: "Circle created",
    subtitle: `${formatAddress(log.args.creator)} • ${formatContribution(log.args.contributionAmount)} cUSD`,
    timestamp: blockLabel(log.blockNumber),
    accent: "#22d3ee",
    blockNumber: log.blockNumber,
  }));
}

async function fetchCircleEvents(
  client: PublicClient,
  circleAddress: `0x${string}`,
  circleName: string,
  fromBlock: bigint,
  toBlock: bigint
): Promise<{ activities: ActivityWithMeta[]; contributions: ContributionWithMeta[] }> {
  const [contributionLogs, payoutLogs] = await Promise.all([
    client.getLogs({ address: circleAddress, event: contributedEvent, fromBlock, toBlock }),
    client.getLogs({ address: circleAddress, event: payoutEvent, fromBlock, toBlock }),
  ]);

  const contributions = contributionLogs.map((log) => ({
    member: formatAddress(log.args.member),
    circle: circleName,
    cycle: log.args.cycle.toString(),
    amount: `${formatContribution(log.args.amount)} cUSD`,
    status: "On time" as const,
    blockNumber: log.blockNumber,
  }));

  const activities = payoutLogs.map((log) => ({
    title: "Payout triggered",
    subtitle: `${circleName} • Cycle ${log.args.cycle.toString()}`,
    timestamp: blockLabel(log.blockNumber),
    accent: "#34d399",
    blockNumber: log.blockNumber,
  }));

  return { activities, contributions };
}
