import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import { network } from "hardhat";
import { padHex } from "viem";

describe("SavingsCircle", async () => {
  const { viem } = await network.connect();
  const [creator, memberA, memberB] = await viem.getWalletClients();

  const contribution = 100n * 10n ** 18n;
  const cycleLength = 7n * 24n * 60n * 60n;
  const maxMembers = 2n;
  const payoutOrder = [1n, 2n];

  let mockToken: Awaited<ReturnType<typeof viem.deployContract>>;
  let circle: Awaited<ReturnType<typeof viem.deployContract>>;

  beforeEach(async () => {
    mockToken = await viem.deployContract("MockERC20", ["Mock cUSD", "mcUSD"], {
      account: creator.account,
    });

    await mockToken.write.mint([memberA.account.address, contribution * 4n], {
      account: creator.account,
    });
    await mockToken.write.mint([memberB.account.address, contribution * 4n], {
      account: creator.account,
    });

    circle = await viem.deployContract(
      "SavingsCircle",
      [mockToken.address, creator.account.address, contribution, cycleLength, maxMembers, payoutOrder],
      { account: creator.account },
    );
  });

  it("allows membership request + attestation flow", async () => {
    const selfIdRef = padHex("0xabc", { size: 32 });

    await circle.write.joinCircle([selfIdRef], { account: memberA.account });

    const [, exists, approved] = (await circle.read.membershipRequests([memberA.account.address])) as unknown as [
      string,
      boolean,
      boolean,
    ];
    assert.equal(exists, true);
    assert.equal(approved, false);

    const attestationRef = padHex("0x123", { size: 32 });
    await circle.write.attestMembership([memberA.account.address, attestationRef], {
      account: creator.account,
    });

    assert.equal(await circle.read.membersCount(), 1n);
    const storedMember = await circle.read.members([0n]);
    assert.equal(storedMember.toLowerCase(), memberA.account.address.toLowerCase());
    const attestation = await circle.read.membershipAttestations([memberA.account.address]);
    assert.equal(attestation, attestationRef);
  });

  it("handles contribution, skip-missed, payout, and reputation", async () => {
    const selfIdA = padHex("0xaaa", { size: 32 });
    const selfIdB = padHex("0xbbb", { size: 32 });

    await circle.write.joinCircle([selfIdA], { account: memberA.account });
    await circle.write.joinCircle([selfIdB], { account: memberB.account });
    await circle.write.attestMembership([memberA.account.address, padHex("0x11", { size: 32 })], {
      account: creator.account,
    });
    await circle.write.attestMembership([memberB.account.address, padHex("0x22", { size: 32 })], {
      account: creator.account,
    });

    await mockToken.write.approve([circle.address, contribution], { account: memberA.account });
    await circle.write.contribute([], { account: memberA.account });

    await circle.write.skipMissedContribution([memberB.account.address], { account: creator.account });
    await mockToken.write.mint([circle.address, contribution], { account: creator.account });

    const balanceBefore = await mockToken.read.balanceOf([memberA.account.address]);
    await circle.write.triggerPayout([], { account: memberA.account });
    const balanceAfter = await mockToken.read.balanceOf([memberA.account.address]);
    assert.equal(balanceAfter - balanceBefore, contribution * maxMembers);

    const repA = await circle.read.reputation([memberA.account.address]);
    const repB = await circle.read.reputation([memberB.account.address]);
    assert.equal(repA, 4n);
    assert.equal(repB, 0n);
  });
});
