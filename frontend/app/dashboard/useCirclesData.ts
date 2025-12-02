"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatUnits, parseAbi } from "viem";
import { useAccount, useConfig } from "wagmi";
import { readContract } from "wagmi/actions";

import type { CircleSnapshot } from "./components";

const factoryAddress = process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}` | undefined;

if (!factoryAddress) {
  throw new Error("NEXT_PUBLIC_FACTORY_ADDRESS is required to load dashboard data");
}

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

  const query = useQuery({
    queryKey: ["circles", factoryAddress],
    enabled: Boolean(config) && isConnected,
    staleTime: 30_000,
    queryFn: async () => {
      const totalCircles = await readContract(config, {
        address: factoryAddress,
        abi: factoryAbi,
        functionName: "totalCircles",
      });

      const totalAsNumber = Number(totalCircles);
      if (totalAsNumber === 0) {
        return [] as CircleSnapshot[];
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

      return snapshots;
    },
  });

  const aggregate = useMemo(() => {
    const totalValue =
      query.data?.reduce((sum, circle) => {
        const numericMatch = Number(circle.contribution.split(" ")[0]) || 0;
        return sum + numericMatch;
      }, 0) ?? 0;

    return {
      totalCircles: query.data?.length ?? 0,
      headlineValue: totalValue,
    };
  }, [query.data]);

  return {
    circles: query.data ?? [],
    aggregate,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
