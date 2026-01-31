"use client";

import React, { useState, useEffect } from "react";
import { getUniversalLink } from "@selfxyz/core";
import {
  SelfQRcodeWrapper,
  SelfAppBuilder,
  type SelfApp,
} from "@selfxyz/qrcode";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import { X } from "lucide-react";

interface SelfVerificationProps {
  onSuccess: (result: any) => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
}

export function SelfVerification({ onSuccess, onError, onClose }: SelfVerificationProps) {
  const { address } = useAccount();
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null);
  const [universalLink, setUniversalLink] = useState("");

  // IMPORTANT: Use API endpoint for QR code/proof generation
  // The contract address is only used for onchain submission AFTER proof is generated
  // For mainnet: https://self.xyz/api/verify (may require special setup)
  // For testnet/staging: https://playground.self.xyz/api/verify (recommended for testing)
  // For local dev with ngrok: use staging_https endpointType
  const apiEndpoint = process.env.NEXT_PUBLIC_SELF_ENDPOINT || "https://playground.self.xyz/api/verify";
  // Only use "https" for actual mainnet self.xyz endpoint
  const isMainnet = apiEndpoint.includes("self.xyz") && 
                    !apiEndpoint.includes("playground") && 
                    !apiEndpoint.includes("ngrok");

  useEffect(() => {
    if (!address) return;

    try {
      const userId = address || ethers.ZeroAddress;
      
      // Force staging_https for backend verification (avoids onchain root checks)
      const endpointType = "staging_https";
      
      console.log("[Self] Configuring verification:", {
        endpoint: apiEndpoint,
        endpointType,
        scope: process.env.NEXT_PUBLIC_SELF_SCOPE || "savings-circle",
        isMainnet,
      });

      const app = new SelfAppBuilder({
        version: 2,
        appName: process.env.NEXT_PUBLIC_SELF_APP_NAME || "Savings Circle",
        scope: process.env.NEXT_PUBLIC_SELF_SCOPE || "savings-circle",
        // Always use API endpoint for proof generation (backend verification)
        endpoint: apiEndpoint,
        logoBase64: "https://i.postimg.cc/mrmVf9hm/self.png",
        userId: userId,
        // This ensures Self uses backend verification instead of onchain
        endpointType: endpointType,
        userIdType: "hex",
        userDefinedData: `Savings Circle Verification - ${address}`,
        disclosures: {
          // Minimum age requirement for participation
          minimumAge: parseInt(process.env.NEXT_PUBLIC_SELF_MIN_AGE || "18"),
          // Request nationality for compliance
          nationality: true,
          // Optional: request gender for analytics
          gender: false,
          // Exclude OFAC sanctioned countries
          excludedCountries: (process.env.NEXT_PUBLIC_SELF_EXCLUDED_COUNTRIES
            ? process.env.NEXT_PUBLIC_SELF_EXCLUDED_COUNTRIES.split(",")
            : ["IRN", "PRK", "RUS", "SYR"]) as any,
          ofac: process.env.NEXT_PUBLIC_SELF_OFAC !== "false",
        },
      }).build();

      setSelfApp(app);
      setUniversalLink(getUniversalLink(app));
    } catch (error) {
      console.error("Failed to initialize Self app:", error);
      onError?.(error instanceof Error ? error : new Error("Failed to initialize Self"));
    }
  }, [address, onError]);

  const handleSuccess = async (result: any) => {
    console.log("Self verification received:", result);
    
    // For onchain verification, we pass the proof data to the frontend
    // The frontend will then submit it to the Self VerificationHub contract
    // and our SavingsCircle contract will record the verification
    onSuccess({
      ...result,
      // Include proof data for onchain verification
      proof: result.proof,
      publicSignals: result.publicSignals,
      userContextData: result.userContextData,
      attestationId: result.attestationId,
      verified: true, // Mark as verified (will be confirmed onchain)
    });
  };

  const handleError = (error: any) => {
    console.error("Self verification error:", error);
    
    // Provide more helpful error messages
    let errorMessage = "Verification failed";
    if (error?.reason) {
      // Check if it's an HTML error page
      if (typeof error.reason === "string" && error.reason.includes("<!DOCTYPE html>")) {
        errorMessage = "Self API endpoint returned an error. Please check your endpoint configuration.";
      } else if (error.reason) {
        errorMessage = error.reason;
      }
    } else if (error?.error_code) {
      errorMessage = `Verification failed: ${error.error_code}`;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    onError?.(new Error(errorMessage));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        <div className="mb-6 text-center">
          <h2 className="text-2xl font-semibold text-white">Verify Your Identity</h2>
          <p className="mt-2 text-sm text-slate-300">
            Scan this QR code with the Self app to verify your identity and join savings circles
          </p>
          {(apiEndpoint.includes("playground") || apiEndpoint.includes("ngrok")) && (
            <p className="mt-2 text-xs text-amber-300">
              Using testnet/staging endpoint - use mock passports for testing
            </p>
          )}
        </div>

        {selfApp ? (
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-2xl border border-white/10 bg-white p-4">
              <SelfQRcodeWrapper
                selfApp={selfApp}
                onSuccess={handleSuccess}
                onError={handleError}
              />
            </div>
            <p className="text-xs text-slate-400">
              Don't have the Self app?{" "}
              <a
                href="https://self.xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 underline"
              >
                Download it here
              </a>
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
              <p className="mt-4 text-sm text-slate-300">Initializing verification...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

