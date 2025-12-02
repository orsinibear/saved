import { network } from "hardhat";
import { getAddress } from "viem";

const MAINNET_CUSD = "0x765DE816845861e75A25fCA122bb6898B8B1282a";
const DEFAULT_ALFAJORES_CUSD = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";

const cusdAddress = process.env.CUSD_ADDRESS ?? (process.env.CELO_MAINNET_RPC_URL ? MAINNET_CUSD : DEFAULT_ALFAJORES_CUSD);

if (!cusdAddress) {
  throw new Error("CUSD_ADDRESS must be set when deploying the factory");
}

const checksummedCusd = getAddress(cusdAddress);

console.log("\n🚀 Deploying SavingsCircleFactory");
console.log("Using cUSD address:", checksummedCusd);

const { viem } = await network.connect();
const [deployer] = await viem.getWalletClients();

console.log("Deployer:", deployer.account.address);

const factory = await viem.deployContract("SavingsCircleFactory", [checksummedCusd]);

console.log("Factory deployed to:", factory.address);

console.log("\nNext steps:");
console.log("1. Add", factory.address, "to NEXT_PUBLIC_FACTORY_ADDRESS in the frontend env.");
console.log("2. (Optional) Call createCircle via Hardhat console to seed initial circles.\n");
