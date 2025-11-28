import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// Deploys SavingsCircleFactory with a configurable cUSD address (defaults to Alfajores cUSD)
export default buildModule("Factory", (m) => {
  const cUSD = m.getParameter(
    "cUSD",
    process.env.CUSD_ADDRESS ?? "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"
  );

  const factory = m.contract("SavingsCircleFactory", [cUSD]);

  return { factory };
});
