"use client";

import { AppKitProvider, createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { WagmiProvider } from "wagmi";
import { celo } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

// WalletConnect project ID must be provided via env
const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID;
if (!projectId) {
  throw new Error("NEXT_PUBLIC_WC_PROJECT_ID is required for WalletConnect");
}

// Create AppKit metadata
const metadata = {
  name: "Savings Circle",
  description: "Trust-first group savings for every community on Celo",
  url: typeof window !== "undefined" ? window.location.origin : "",
  icons: [],
};

// Convert wagmi chain to AppKit network format
const celoNetwork = {
  id: celo.id,
  name: celo.name,
  nativeCurrency: celo.nativeCurrency,
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_CELO_RPC_URL || "https://alfajores-forno.celo-testnet.org"],
    },
  },
  blockExplorers: celo.blockExplorers,
};

// Create wagmi adapter
const wagmiAdapter = new WagmiAdapter({
  networks: [celoNetwork],
  projectId,
  ssr: true,
});

// Get wagmi config from adapter
const wagmiConfig = wagmiAdapter.wagmiConfig;

// Initialize AppKit
createAppKit({
  adapters: [wagmiAdapter],
  networks: [celoNetwork],
  projectId,
  metadata,
  features: {
    analytics: true,
    email: false,
    socials: ["google", "x", "github", "apple", "discord"],
    emailShowWallets: true,
  },
});

export default function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  const [queryClient] = useState(() => new QueryClient());
  
  return (
    <AppKitProvider>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </WagmiProvider>
    </AppKitProvider>
  );
}
