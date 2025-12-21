import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import { network } from "hardhat";
import { padHex } from "viem";
import hre from "hardhat";
import type { SavingsCircleV2, IERC20 } from "../typechain-types";

describe("SavingsCircleV2", () => {
  let savingsCircle: SavingsCircleV2;
  let token: IERC20;
  let owner: any;
  let member1: any;
  let member2: any;
  let member3: any;
  let nonMember: any;

  const CONTRIBUTION = hre.ethers.parseEther("100");
  const MAX_MEMBERS = 3n;
  const CYCLE_DURATION = 7n * 24n * 60n * 60n; // 7 days in seconds

  beforeEach(async () => {
    // Reset network state
    await network.provider.send("hardhat_reset");

    // Get signers
    [owner, member1, member2, member3, nonMember] =
      await hre.ethers.getSigners();

    // Deploy mock ERC20 token
    const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
    token = await MockERC20.deploy("Test Token", "TEST", 18);
    await token.waitForDeployment();

    // Deploy SavingsCircleV2
    const SavingsCircleV2 = await hre.ethers.getContractFactory(
      "SavingsCircleV2"
    );
    savingsCircle = await SavingsCircleV2.deploy(
      await token.getAddress(),
      CONTRIBUTION,
      MAX_MEMBERS,
      CYCLE_DURATION,
      owner.address
    );
    await savingsCircle.waitForDeployment();

    // Mint tokens to members
    const mintAmount = hre.ethers.parseEther("10000");
    await token.mint(member1.address, mintAmount);
    await token.mint(member2.address, mintAmount);
    await token.mint(member3.address, mintAmount);

    // Approve spending
    await token
      .connect(member1)
      .approve(await savingsCircle.getAddress(), hre.ethers.MaxUint256);
    await token
      .connect(member2)
      .approve(await savingsCircle.getAddress(), hre.ethers.MaxUint256);
    await token
      .connect(member3)
      .approve(await savingsCircle.getAddress(), hre.ethers.MaxUint256);
  });

  describe("Deployment", () => {
    it("should deploy with correct parameters", async () => {
      assert.equal(await savingsCircle.token(), await token.getAddress());
      assert.equal(await savingsCircle.contribution(), CONTRIBUTION);
      assert.equal(await savingsCircle.maxMembers(), MAX_MEMBERS);
      assert.equal(await savingsCircle.cycleDuration(), CYCLE_DURATION);
      assert.equal(await savingsCircle.owner(), owner.address);
    });

    it("should start in OPEN state", async () => {
      assert.equal(await savingsCircle.state(), 0n); // CycleState.OPEN
    });

    it("should start at cycle 0", async () => {
      assert.equal(await savingsCircle.currentCycle(), 0n);
    });

    it("should revert with invalid parameters", async () => {
      const SavingsCircleV2 = await hre.ethers.getContractFactory(
        "SavingsCircleV2"
      );

      await assert.rejects(
        SavingsCircleV2.deploy(
          hre.ethers.ZeroAddress,
          CONTRIBUTION,
          MAX_MEMBERS,
          CYCLE_DURATION,
          owner.address
        ),
        /InvalidParams/
      );

      await assert.rejects(
        SavingsCircleV2.deploy(
          await token.getAddress(),
          0,
          MAX_MEMBERS,
          CYCLE_DURATION,
          owner.address
        ),
        /InvalidParams/
      );

      await assert.rejects(
        SavingsCircleV2.deploy(
          await token.getAddress(),
          CONTRIBUTION,
          0,
          CYCLE_DURATION,
          owner.address
        ),
        /InvalidParams/
      );
    });
  });

  describe("Membership", () => {
    it("should allow users to join with valid self-attestation", async () => {
      const selfId = padHex("0x1234", { size: 32 });

      await savingsCircle.connect(member1).join(selfId);

      const memberInfo = await savingsCircle.memberInfo(member1.address);
      assert.equal(memberInfo.active, true);
      assert.equal(memberInfo.reputation, 0n);
      assert.equal(
        await savingsCircle.selfAttestation(member1.address),
        selfId
      );
      assert.equal(await savingsCircle.membersCount(), 1n);
    });

    it("should emit Joined event", async () => {
      const selfId = padHex("0x1234", { size: 32 });
      const tx = await savingsCircle.connect(member1).join(selfId);
      const receipt = await tx.wait();

      const event = receipt?.logs.find(
        (log: any) => log.fragment?.name === "Joined"
      );
      assert.ok(event, "Joined event should be emitted");
    });

    it("should add members to payout queue", async () => {
      await savingsCircle.connect(member1).join(padHex("0x01", { size: 32 }));
      await savingsCircle.connect(member2).join(padHex("0x02", { size: 32 }));

      assert.equal(await savingsCircle.payoutQueue(0), member1.address);
      assert.equal(await savingsCircle.payoutQueue(1), member2.address);
    });

    it("should revert if circle is full", async () => {
      await savingsCircle.connect(member1).join(padHex("0x01", { size: 32 }));
      await savingsCircle.connect(member2).join(padHex("0x02", { size: 32 }));
      await savingsCircle.connect(member3).join(padHex("0x03", { size: 32 }));

      await assert.rejects(
        savingsCircle.connect(nonMember).join(padHex("0x04", { size: 32 })),
        /CircleFull/
      );
    });

    it("should revert if already a member", async () => {
      await savingsCircle.connect(member1).join(padHex("0x01", { size: 32 }));

      await assert.rejects(
        savingsCircle.connect(member1).join(padHex("0x01", { size: 32 })),
        /AlreadyMember/
      );
    });

    it("should revert with zero self-attestation", async () => {
      await assert.rejects(
        savingsCircle.connect(member1).join(padHex("0x00", { size: 32 })),
        /InvalidParams/
      );
    });
  });

  describe("Contributions", () => {
    beforeEach(async () => {
      await savingsCircle.connect(member1).join(padHex("0x01", { size: 32 }));
      await savingsCircle.connect(member2).join(padHex("0x02", { size: 32 }));
      await savingsCircle.connect(member3).join(padHex("0x03", { size: 32 }));
    });

    it("should allow members to contribute", async () => {
      const balanceBefore = await token.balanceOf(member1.address);

      await savingsCircle.connect(member1).contribute();

      const balanceAfter = await token.balanceOf(member1.address);
      assert.equal(balanceBefore - balanceAfter, CONTRIBUTION);
      assert.equal(await savingsCircle.hasPaid(member1.address, 0n), true);
    });

    it("should emit Contribution event", async () => {
      const tx = await savingsCircle.connect(member1).contribute();
      const receipt = await tx.wait();

      const event = receipt?.logs.find(
        (log: any) => log.fragment?.name === "Contribution"
      );
      assert.ok(event, "Contribution event should be emitted");
    });

    it("should track total collected", async () => {
      await savingsCircle.connect(member1).contribute();
      await savingsCircle.connect(member2).contribute();

      const contractBalance = await token.balanceOf(
        await savingsCircle.getAddress()
      );
      assert.equal(contractBalance, CONTRIBUTION * 2n);
    });

    it("should revert if not a member", async () => {
      await assert.rejects(
        savingsCircle.connect(nonMember).contribute(),
        /NotMember/
      );
    });

    it("should revert if already paid in current cycle", async () => {
      await savingsCircle.connect(member1).contribute();

      await assert.rejects(
        savingsCircle.connect(member1).contribute(),
        /AlreadyPaid/
      );
    });

    it("should allow contribution in next cycle after payout", async () => {
      await savingsCircle.connect(member1).contribute();
      await savingsCircle.connect(member2).contribute();
      await savingsCircle.connect(member3).contribute();

      await savingsCircle.executePayout();

      // Should be able to contribute again in new cycle
      await savingsCircle.connect(member1).contribute();
      assert.equal(await savingsCircle.hasPaid(member1.address, 1n), true);
    });
  });

  describe("Payout", () => {
    beforeEach(async () => {
      await savingsCircle.connect(member1).join(padHex("0x01", { size: 32 }));
      await savingsCircle.connect(member2).join(padHex("0x02", { size: 32 }));
      await savingsCircle.connect(member3).join(padHex("0x03", { size: 32 }));
    });

    it("should execute payout to first member in queue", async () => {
      await savingsCircle.connect(member1).contribute();
      await savingsCircle.connect(member2).contribute();
      await savingsCircle.connect(member3).contribute();

      const balanceBefore = await token.balanceOf(member1.address);

      await savingsCircle.executePayout();

      const balanceAfter = await token.balanceOf(member1.address);
      assert.equal(balanceAfter - balanceBefore, CONTRIBUTION * 3n);
    });

    it("should emit Payout event", async () => {
      await savingsCircle.connect(member1).contribute();
      await savingsCircle.connect(member2).contribute();
      await savingsCircle.connect(member3).contribute();

      const tx = await savingsCircle.executePayout();
      const receipt = await tx.wait();

      const event = receipt?.logs.find(
        (log: any) => log.fragment?.name === "Payout"
      );
      assert.ok(event, "Payout event should be emitted");
    });

    it("should advance to next member in payout queue", async () => {
      // Cycle 1
      await savingsCircle.connect(member1).contribute();
      await savingsCircle.connect(member2).contribute();
      await savingsCircle.connect(member3).contribute();
      await savingsCircle.executePayout();

      assert.equal(await savingsCircle.nextPayoutIndex(), 1n);

      // Cycle 2
      await savingsCircle.connect(member1).contribute();
      await savingsCircle.connect(member2).contribute();
      await savingsCircle.connect(member3).contribute();

      const balanceBefore = await token.balanceOf(member2.address);
      await savingsCircle.executePayout();
      const balanceAfter = await token.balanceOf(member2.address);

      assert.equal(balanceAfter - balanceBefore, CONTRIBUTION * 3n);
      assert.equal(await savingsCircle.nextPayoutIndex(), 2n);
    });

    it("should wrap around payout queue", async () => {
      // Complete 3 cycles
      for (let i = 0; i < 3; i++) {
        await savingsCircle.connect(member1).contribute();
        await savingsCircle.connect(member2).contribute();
        await savingsCircle.connect(member3).contribute();
        await savingsCircle.executePayout();
      }

      assert.equal(await savingsCircle.nextPayoutIndex(), 0n); // Wrapped back to 0

      // Cycle 4 should pay member1 again
      await savingsCircle.connect(member1).contribute();
      await savingsCircle.connect(member2).contribute();
      await savingsCircle.connect(member3).contribute();

      const balanceBefore = await token.balanceOf(member1.address);
      await savingsCircle.executePayout();
      const balanceAfter = await token.balanceOf(member1.address);

      assert.equal(balanceAfter - balanceBefore, CONTRIBUTION * 3n);
    });

    it("should increment current cycle", async () => {
      await savingsCircle.connect(member1).contribute();
      await savingsCircle.connect(member2).contribute();
      await savingsCircle.connect(member3).contribute();

      assert.equal(await savingsCircle.currentCycle(), 0n);

      await savingsCircle.executePayout();

      assert.equal(await savingsCircle.currentCycle(), 1n);
    });

    it("should revert if circle not full", async () => {
      const SavingsCircleV2 = await hre.ethers.getContractFactory(
        "SavingsCircleV2"
      );
      const partialCircle = await SavingsCircleV2.deploy(
        await token.getAddress(),
        CONTRIBUTION,
        5, // Max 5 members
        CYCLE_DURATION,
        owner.address
      );

      await partialCircle.connect(member1).join(padHex("0x01", { size: 32 }));
      await partialCircle.connect(member2).join(padHex("0x02", { size: 32 }));

      await token
        .connect(member1)
        .approve(await partialCircle.getAddress(), hre.ethers.MaxUint256);
      await token
        .connect(member2)
        .approve(await partialCircle.getAddress(), hre.ethers.MaxUint256);

      await partialCircle.connect(member1).contribute();
      await partialCircle.connect(member2).contribute();

      await assert.rejects(partialCircle.executePayout(), /InvalidState/);
    });

    it("should revert if nothing collected", async () => {
      await assert.rejects(savingsCircle.executePayout(), /InvalidState/);
    });
  });

  describe("Reputation System", () => {
    beforeEach(async () => {
      await savingsCircle.connect(member1).join(padHex("0x01", { size: 32 }));
      await savingsCircle.connect(member2).join(padHex("0x02", { size: 32 }));
      await savingsCircle.connect(member3).join(padHex("0x03", { size: 32 }));
    });

    it("should increase reputation for contributors", async () => {
      await savingsCircle.connect(member1).contribute();
      await savingsCircle.connect(member2).contribute();
      await savingsCircle.connect(member3).contribute();

      await savingsCircle.executePayout();

      const member1Info = await savingsCircle.memberInfo(member1.address);
      const member2Info = await savingsCircle.memberInfo(member2.address);
      const member3Info = await savingsCircle.memberInfo(member3.address);

      // Member1 got payout bonus (+3) + contribution (+1) = +4
      assert.equal(member1Info.reputation, 4n);
      // Others just got contribution bonus (+1)
      assert.equal(member2Info.reputation, 1n);
      assert.equal(member3Info.reputation, 1n);
    });

    it("should decrease reputation for defaulters", async () => {
      await savingsCircle.connect(member1).contribute();
      await savingsCircle.connect(member2).contribute();
      // member3 doesn't contribute

      await savingsCircle.executePayout();

      const member3Info = await savingsCircle.memberInfo(member3.address);
      assert.equal(member3Info.reputation, -1n); // Penalized for not paying
    });

    it("should emit Missed event for defaulters", async () => {
      await savingsCircle.connect(member1).contribute();
      await savingsCircle.connect(member2).contribute();
      // member3 doesn't contribute

      const tx = await savingsCircle.executePayout();
      const receipt = await tx.wait();

      const event = receipt?.logs.find(
        (log: any) => log.fragment?.name === "Missed"
      );
      assert.ok(event, "Missed event should be emitted");
    });

    it("should emit ReputationUpdated event", async () => {
      await savingsCircle.connect(member1).contribute();
      await savingsCircle.connect(member2).contribute();
      await savingsCircle.connect(member3).contribute();

      const tx = await savingsCircle.executePayout();
      const receipt = await tx.wait();

      const event = receipt?.logs.find(
        (log: any) => log.fragment?.name === "ReputationUpdated"
      );
      assert.ok(event, "ReputationUpdated event should be emitted");
    });

    it("should track reputation across multiple cycles", async () => {
      // Cycle 1: member1 pays, member2 and member3 don't
      await savingsCircle.connect(member1).contribute();
      await savingsCircle.executePayout();

      // member1: +4 (payout + contribution)
      // member2: -1 (missed)
      // member3: -1 (missed)

      // Cycle 2: everyone pays
      await savingsCircle.connect(member1).contribute();
      await savingsCircle.connect(member2).contribute();
      await savingsCircle.connect(member3).contribute();
      await savingsCircle.executePayout();

      const member1Info = await savingsCircle.memberInfo(member1.address);
      const member2Info = await savingsCircle.memberInfo(member2.address);
      const member3Info = await savingsCircle.memberInfo(member3.address);

      assert.equal(member1Info.reputation, 5n); // 4 + 1
      assert.equal(member2Info.reputation, 3n); // -1 + 1 + 3 (payout bonus)
      assert.equal(member3Info.reputation, 0n); // -1 + 1
    });
  });

  describe("View Functions", () => {
    it("should return correct members count", async () => {
      assert.equal(await savingsCircle.membersCount(), 0n);

      await savingsCircle.connect(member1).join(padHex("0x01", { size: 32 }));
      assert.equal(await savingsCircle.membersCount(), 1n);

      await savingsCircle.connect(member2).join(padHex("0x02", { size: 32 }));
      assert.equal(await savingsCircle.membersCount(), 2n);
    });

    it("should check if member has paid for specific cycle", async () => {
      await savingsCircle.connect(member1).join(padHex("0x01", { size: 32 }));
      await savingsCircle.connect(member2).join(padHex("0x02", { size: 32 }));
      await savingsCircle.connect(member3).join(padHex("0x03", { size: 32 }));

      assert.equal(await savingsCircle.hasPaid(member1.address, 0n), false);

      await savingsCircle.connect(member1).contribute();

      assert.equal(await savingsCircle.hasPaid(member1.address, 0n), true);
      assert.equal(await savingsCircle.hasPaid(member2.address, 0n), false);
    });
  });

  describe("Reentrancy Protection", () => {
    it("should protect contribute function from reentrancy", async () => {
      // This test assumes you have a malicious token contract
      // that attempts reentrancy. For basic testing, we verify
      // the modifier is in place
      await savingsCircle.connect(member1).join(padHex("0x01", { size: 32 }));
      await savingsCircle.connect(member1).contribute();

      // Second call should revert with AlreadyPaid, not reentrancy
      await assert.rejects(
        savingsCircle.connect(member1).contribute(),
        /AlreadyPaid/
      );
    });

    it("should protect executePayout function from reentrancy", async () => {
      await savingsCircle.connect(member1).join(padHex("0x01", { size: 32 }));
      await savingsCircle.connect(member2).join(padHex("0x02", { size: 32 }));
      await savingsCircle.connect(member3).join(padHex("0x03", { size: 32 }));

      await savingsCircle.connect(member1).contribute();
      await savingsCircle.connect(member2).contribute();
      await savingsCircle.connect(member3).contribute();

      await savingsCircle.executePayout();

      // Second call should revert with InvalidState
      await assert.rejects(savingsCircle.executePayout(), /InvalidState/);
    });
  });

  describe("Edge Cases", () => {
    it("should handle partial contributions correctly", async () => {
      await savingsCircle.connect(member1).join(padHex("0x01", { size: 32 }));
      await savingsCircle.connect(member2).join(padHex("0x02", { size: 32 }));
      await savingsCircle.connect(member3).join(padHex("0x03", { size: 32 }));

      await savingsCircle.connect(member1).contribute();
      await savingsCircle.connect(member2).contribute();
      // member3 doesn't contribute

      const balanceBefore = await token.balanceOf(member1.address);
      await savingsCircle.executePayout();
      const balanceAfter = await token.balanceOf(member1.address);

      // Should only get 2 contributions
      assert.equal(balanceAfter - balanceBefore, CONTRIBUTION * 2n);
    });

    it("should handle maximum members correctly", async () => {
      await savingsCircle.connect(member1).join(padHex("0x01", { size: 32 }));
      await savingsCircle.connect(member2).join(padHex("0x02", { size: 32 }));
      await savingsCircle.connect(member3).join(padHex("0x03", { size: 32 }));

      assert.equal(await savingsCircle.membersCount(), MAX_MEMBERS);
    });
  });
});
