"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider, createConfig, http } from "wagmi";
import { celo, celoAlfajores } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { injected, walletConnect } from "@wagmi/connectors";

// If you want WalletConnect/Coinbase later, add them back and install their SDKs.

// Explicit connector list without Base smart account
const config = createConfig({
  chains: [celoAlfajores, celo],
  connectors: [
    injected({ shimDisconnect: true }),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || "demo",
      showQrModal: true,
    }),
  ],
  transports: {
    [celoAlfajores.id]: http(),
    [celo.id]: http(),
  },
});

const queryClient = new QueryClient();

export default function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
