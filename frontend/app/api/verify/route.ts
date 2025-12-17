import { NextResponse } from "next/server";
import { SelfBackendVerifier, AllIds, DefaultConfigStore } from "@selfxyz/core";

// Country codes are 3-letter ISO strings; we alias to string for typing here.
type Country3LetterCode = string;

// Reuse a single verifier instance
// Note: mockPassport: true = testnet/staging, false = mainnet
// For Celo mainnet, set NEXT_PUBLIC_SELF_MOCK_PASSPORT=false
const selfBackendVerifier = new SelfBackendVerifier(
  process.env.NEXT_PUBLIC_SELF_SCOPE || "savings-circle",
  // This should be YOUR API endpoint URL (must be publicly accessible)
  // For local dev, use ngrok: https://your-ngrok-url.ngrok.io/api/verify
  // For production, use your deployed URL: https://yourdomain.com/api/verify
  process.env.NEXT_PUBLIC_SELF_ENDPOINT || "https://playground.self.xyz/api/verify",
  process.env.NEXT_PUBLIC_SELF_MOCK_PASSPORT !== "false", // true = testnet, false = mainnet
  AllIds,
  new DefaultConfigStore({
    minimumAge: parseInt(process.env.NEXT_PUBLIC_SELF_MIN_AGE || "18"),
    excludedCountries: (
      process.env.NEXT_PUBLIC_SELF_EXCLUDED_COUNTRIES
        ? process.env.NEXT_PUBLIC_SELF_EXCLUDED_COUNTRIES.split(",") as Country3LetterCode[]
        : ["IRN", "PRK", "RUS", "SYR"] as Country3LetterCode[]
    ),
    ofac: process.env.NEXT_PUBLIC_SELF_OFAC !== "false",
  }),
  "hex" // userIdentifierType - must match frontend userIdType
);

export async function POST(req: Request) {
  try {
    // Extract data from the request
    const { attestationId, proof, publicSignals, userContextData } = await req.json();

    // Verify all required fields are present
    if (!proof || !publicSignals || !attestationId || !userContextData) {
      return NextResponse.json(
        {
          status: "error",
          result: false,
          reason: "Proof, publicSignals, attestationId and userContextData are required",
        },
        { status: 200 } // Self requires 200 status even for errors
      );
    }

    // Verify the proof
    const result = await selfBackendVerifier.verify(
      attestationId, // Document type (1 = passport, 2 = EU ID card, 3 = Aadhaar)
      proof, // The zero-knowledge proof
      publicSignals, // Public signals array
      userContextData // User context data (hex string)
    );

    // Check if verification was successful
    const { isValid, isMinimumAgeValid, isOfacValid } = result.isValidDetails;
    
    if (isValid && isMinimumAgeValid) {
      // Verification successful - process the result
      return NextResponse.json({
        status: "success",
        result: true,
        credentialSubject: result.discloseOutput,
        attestationId,
        userData: result.userData,
      });
    } else {
      // Verification failed - provide specific reason
      let reason = "Verification failed";
      if (!isMinimumAgeValid) {
        reason = "Minimum age verification failed";
      } else if (!isOfacValid) {
        reason = "OFAC sanctions check failed";
      }
      
      return NextResponse.json(
        {
          status: "error",
          result: false,
          reason,
          error_code: "VERIFICATION_FAILED",
          details: result.isValidDetails,
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      {
        status: "error",
        result: false,
        reason: error instanceof Error ? error.message : "Unknown error",
        error_code: "UNKNOWN_ERROR",
      },
      { status: 200 } // Self requires 200 status even for errors
    );
  }
}

