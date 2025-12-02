# Self-Enabled On-Chain Savings Circle (Ajo/Esusu)

A decentralized savings circle platform built on Celo using cUSD, integrated with Self Protocol for identity, attestations, and social recovery. This README captures the execution plan, detailed TODOs, milestones, and delivery criteria for the MVP and near-term roadmap.

## Vision & Goals
- Enable trusted Ajo/Esusu savings circles with verifiable identity and transparent, automated payouts.
- Build portable, on-chain financial reputation for users based on contribution history.
- Deliver a mobile-friendly product targeting African markets with low fees and great UX.

## MVP Scope (Phase 1)
- SelfID link/creation (via Self Protocol JS SDK).
- Create savings circles via `SavingsCircleFactory` with parameters:
  - `contributionAmount` (cUSD), `membersLimit`, `payoutOrder`, `cycleFrequency`.
- Join flow requires Self membership attestation by the creator.
- Contributions in cUSD (manual trigger); contract tracks paid/unpaid per cycle.
- Payout rotation each cycle; callable by anyone with a small incentive.
- Reputation score on-chain: +1 on-time, -1 missed, +3 cycle completion; emit events.
- Frontend: connect wallet, link SelfID, create/join circle, contribute, view schedule/history/reputation.

## Success Metrics (MVP)
- ≥90% users link SelfID.
- ≥1 live circle with ≥6 members completing ≥1 full cycle.
- ≤5% missed contributions.
- ≥95% payout success when due.

## High-Level Architecture
- Frontend: Next.js + Tailwind + RainbowKit/WalletConnect + Wagmi/viem (or Celo ContractKit) + Self Protocol JS SDK.
- Smart Contracts: Solidity (0.8+), Hardhat, OpenZeppelin.
- Network: Celo Alfajores (testnet) → Celo Mainnet after pilot.
- Tokens: cUSD (IERC20).
- Optional Automation: Anyone can call `triggerPayout()`; add relayer/keeper later.

## Milestones & Timeline (Aggressive)
- M0 (Day 0–1): Repo scaffold, CI, environment wiring.
- M1 (Day 2–5): Contracts v1 (Factory, Circle) + unit tests + Alfajores deploy.
- M2 (Day 6–9): Frontend core flows (connect, SelfID link, create/join, contribute, payout trigger, status views).
- M3 (Day 10–12): Reputation events/ledger and UI.
- M4 (Day 13–14): QA, polish, pilot onboarding, docs.
- v1.1+: Relayer-based nudges/automation, invitations, PWA optimizations, social recovery.

## Detailed TODOs

### Repo, Tooling, CI/CD
- [ ] Initialize monorepo structure:
  - `apps/web` (Next.js)
  - `packages/contracts` (Hardhat)
  - `packages/shared` (types, config) [optional]
- [ ] Configure ESLint/Prettier/Turbo (or Nx) and GitHub Actions:
  - Lint, type-check, unit tests on PR
  - Preview web deploys (Vercel/Netlify)
- [ ] Add environment management (`.env.local`, `.env.example`).

-### Contracts (packages/contracts)
- [x] Dependencies: `hardhat`, `@openzeppelin/contracts`, `dotenv`, `viem`, `typescript`.
- [x] Interfaces:
  - [x] `IERC20` for cUSD
- [x] SavingsCircleFactory.sol
  - [x] `createCircle(params)` deploys new `SavingsCircle`
  - [x] Emit `CircleCreated(circle, creator, params)`
  - [x] Registry mapping for discoverability
- [x] SavingsCircle.sol
  - State:
    - [x] `address[] members`, `mapping(address => uint256) memberIndex`
    - [x] `mapping(uint256 => mapping(address => bool)) paid`
    - [x] `uint256 contributionAmount`, `uint256 cycleLength`, `uint256 currentCycle`, `uint256 currentDueIndex`
    - [x] `address cUSD`, `address creator`
    - [x] `uint256[] payoutOrder`
    - [x] `mapping(address => int256) reputation`
  - Functions:
    - [x] `constructor(params)`
    - [x] `joinCircle(selfIdRef)` with membership gating
    - [x] `attestMembership(address account, bytes32 attestationRef)` (creator-only) [MVP: event log + off-chain Self attestation]
    - [x] `contribute()` pulls cUSD (after user approve), marks `paid`
    - [x] `triggerPayout()` checks due member and transfers pooled cUSD; incentive to caller
    - [x] `skipMissedContribution(member)` marks missed contribution (owner-only)
    - [x] `updateReputation(member, delta)` internal hooks
    - [x] `getStatus()` view for UI
  - Events:
    - [x] `Joined(member)`, `Contributed(member, cycle, amount)`, `Payout(to, cycle, amount)`, `Missed(member, cycle)`, `ReputationUpdated(member, delta, score)`
- [x] Security & Constraints:
  - [x] Reentrancy guards, caps (max members), safe math by default (0.8+), onlyCreator modifiers, pause if needed
- [ ] Tests:
  - [ ] Factory creation
  - [ ] Joining rules and gating
  - [ ] Contribution flows (happy path + missed)
  - [ ] Payout correctness across cycles
  - [ ] Reputation updates & events
- [x] Deploy scripts:
  - [x] Deploy Factory → record address/ABI to `apps/web`
  - [x] Configure Alfajores RPC, broadcaster key via env

### Self Protocol Integration
- [ ] JS SDK in web: create/link SelfID, fetch identity metadata
- [ ] Membership Attestation (MVP):
  - [ ] Creator verifies members and records attestation off-chain via Self, store reference in contract event or mapping if available
  - [ ] UI blocks join until attestation confirmed
- [ ] Reputation Attestation (optional for MVP):
  - [ ] On cycle completion, write reputation attestation via Self and display on profile
- [ ] Social Recovery (Phase 2):
  - [ ] Initiate recovery request, member approvals via Self attestations, wallet update after threshold

### Frontend (apps/web)
- [x] Stack & Setup:
  - [x] Next.js, Tailwind, RainbowKit/WalletConnect, Wagmi/viem (Celo chain config)
  - [x] Env: RPC URL, contract addresses, cUSD address, Self endpoints
- [ ] Core Pages/Flows:
  - [x] Onboarding: connect wallet, link/create SelfID (mock hook)
  - [x] Dashboard: my circles, actions, reputation summary (wired to mainnet data)
  - [ ] Create Circle: params form, deploy via Factory
  - [ ] Circle Detail: members, schedule, contribution status, trigger payout, history
  - [ ] Profile: SelfID info, reputation, attestations
- [ ] Components:
  - [x] Circle cards, summary grid, contribution table, activity timeline
  - [ ] PayoutSchedule, ReputationBadge, AttestationStatus
- [ ] Web3 Hooks:
  - [x] `useCirclesData()` loads factory + circle status/events
  - [ ] `useContracts()` (factory, circle), `useCircleStatus()`, `useContribute()`, `useTriggerPayout()`
- [x] State & Data:
  - [x] Store contract addresses/ABIs via env + viem parse
  - [x] Index events (client or lightweight backendless approach)
- [ ] UX:
  - [x] Clear due status, countdown to next cycle, one-click contribute, confirmations, error toasts (dashboard polish)
  - [ ] Mobile-first layout, PWA meta (v1.1)

### Analytics, Telemetry, and Logs
- [ ] Basic event tracking (page views, create/join, contribute, payout trigger)
- [ ] Contract event listeners for UI state

### DevOps & Deployments
- [ ] Web: Vercel/Netlify preview per PR + production on main
- [ ] Contracts: script per network, artifact sync to web `generated/` (ABIs + addresses)
- [ ] Versioning and changelog

### Documentation
- [ ] How to run locally (web + contracts)
- [ ] Env variables and keys
- [ ] Contribution guide
- [ ] Pilot playbook (how to create a circle and onboard members)

## Environments
- Network: Celo Alfajores (MVP), then Mainnet
- Tokens: cUSD (Alfajores address)
- Required secrets:
  - `ALFAJORES_RPC_URL`, `PRIVATE_KEY_DEPLOYER`
  - `NEXT_PUBLIC_FACTORY_ADDRESS` (after deploy)
  - `NEXT_PUBLIC_CUSD_ADDRESS`
  - Self Protocol endpoints/keys

## Definition of Done (DoD)
- Contracts deployed to Alfajores with tests >80% coverage on core flows.
- Web app deployed (preview + prod), usable on mobile.
- Create/join/contribute/payout working end-to-end.
- SelfID linking in-app; membership gating based on Self attestation.
- Reputation scoring visible; events emitted on-chain.
- Docs for setup, pilot onboarding, and troubleshooting.

## Risks & Mitigations
- Missed contributions → grace period + reputation penalty; reminder UI; later relayer nudges.
- Smart contract risk → OZ patterns, tests, audits for mainnet.
- UX complexity → simple WhatsApp-like flows, progressive disclosure.
- Attestation latency/availability → cache and optimistic UI with retries.

## Roadmap (Post-MVP)
- v1.1: Relayer nudges/automation, invitations, PWA enhancements.
- v1.2: Full Self-based social recovery and threshold approvals.
- v1.3: Reputation badges, exportable proofs, basic leaderboard.
- v1.4: Circle discovery, public/private circles, multi-token support.

---

# Quickstart (to be filled during scaffold)
- Install deps, run `contracts` tests, start web, set envs. This section will be completed after repo scaffold.
