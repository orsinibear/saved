// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {
    ReentrancyGuard
} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title SavingsCircleV2
/// @notice Modular, cycle-based Ajo/Esusu contract with identity gating
contract SavingsCircleV2 is Ownable, ReentrancyGuard {
    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/
    error NotMember();
    error AlreadyMember();
    error CircleFull();
    error InvalidState();
    error AlreadyPaid();
    error PaymentMissing();
    error InvalidParams();
    error NothingToPayout();

    /*//////////////////////////////////////////////////////////////
                                TYPES
    //////////////////////////////////////////////////////////////*/
    enum CycleState {
        OPEN,
        PAYOUT
    }

    struct Member {
        bool active;
        int256 reputation;
    }

    struct Cycle {
        uint256 paidCount;
        uint256 totalCollected;
        mapping(address => bool) paid;
    }

    /*//////////////////////////////////////////////////////////////
                              IMMUTABLES
    //////////////////////////////////////////////////////////////*/
    IERC20 public immutable token;
    uint256 public immutable contribution;
    uint256 public immutable maxMembers;
    uint256 public immutable cycleDuration;

    /*//////////////////////////////////////////////////////////////
                               STORAGE
    //////////////////////////////////////////////////////////////*/
    CycleState public state;
    uint256 public currentCycle;
    uint256 public nextPayoutIndex;

    address[] public members;
    mapping(address => Member) public memberInfo;
    mapping(uint256 => Cycle) private cycles;

    // payout order is fixed once members join
    address[] public payoutQueue;

    // identity
    mapping(address => bytes32) public selfAttestation;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/
    event Joined(address indexed member);
    event Contribution(address indexed member, uint256 cycle);
    event Payout(address indexed recipient, uint256 cycle, uint256 amount);
    event Missed(address indexed member, uint256 cycle);
    event ReputationUpdated(address indexed member, int256 newScore);

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/
    constructor(
        address _token,
        uint256 _contribution,
        uint256 _maxMembers,
        uint256 _cycleDuration,
        address _owner
    ) Ownable(_owner) {
        if (_token == address(0) || _contribution == 0 || _maxMembers == 0) {
            revert InvalidParams();
        }

        token = IERC20(_token);
        contribution = _contribution;
        maxMembers = _maxMembers;
        cycleDuration = _cycleDuration;

        state = CycleState.OPEN;
    }

    /*//////////////////////////////////////////////////////////////
                        MEMBERSHIP / IDENTITY
    //////////////////////////////////////////////////////////////*/
    function join(bytes32 selfId) external {
        if (members.length >= maxMembers) revert CircleFull();
        if (memberInfo[msg.sender].active) revert AlreadyMember();
        if (selfId == bytes32(0)) revert InvalidParams();

        memberInfo[msg.sender] = Member({active: true, reputation: 0});
        selfAttestation[msg.sender] = selfId;

        members.push(msg.sender);
        payoutQueue.push(msg.sender);

        emit Joined(msg.sender);
    }

    /*//////////////////////////////////////////////////////////////
                           CONTRIBUTIONS
    //////////////////////////////////////////////////////////////*/
    function contribute() external nonReentrant {
        if (!memberInfo[msg.sender].active) revert NotMember();
        if (state != CycleState.OPEN) revert InvalidState();

        Cycle storage c = cycles[currentCycle];
        if (c.paid[msg.sender]) revert AlreadyPaid();

        c.paid[msg.sender] = true;
        c.paidCount++;
        c.totalCollected += contribution;

        token.transferFrom(msg.sender, address(this), contribution);

        emit Contribution(msg.sender, currentCycle);
    }

    /*//////////////////////////////////////////////////////////////
                              PAYOUT
    //////////////////////////////////////////////////////////////*/
    function executePayout() external nonReentrant {
        if (state != CycleState.OPEN) revert InvalidState();
        if (members.length < maxMembers) revert InvalidState();

        Cycle storage c = cycles[currentCycle];

        // penalize defaulters
        for (uint256 i = 0; i < members.length; i++) {
            address m = members[i];
            if (!c.paid[m]) {
                memberInfo[m].reputation -= 1;
                emit Missed(m, currentCycle);
            } else {
                memberInfo[m].reputation += 1;
            }
        }

        uint256 payoutAmount = c.totalCollected;
        if (payoutAmount == 0) revert NothingToPayout();

        address recipient = payoutQueue[nextPayoutIndex];

        token.transfer(recipient, payoutAmount);
        memberInfo[recipient].reputation += 3;

        emit Payout(recipient, currentCycle, payoutAmount);
        emit ReputationUpdated(recipient, memberInfo[recipient].reputation);

        // advance state
        nextPayoutIndex = (nextPayoutIndex + 1) % payoutQueue.length;
        currentCycle++;
        state = CycleState.OPEN;
    }

    function checkMembersCount() external view returns (uint256) {
        return members.length;
    }

    function hasPaid(
        address member,
        uint256 cycle
    ) external view returns (bool) {
        return cycles[cycle].paid[member];
    }
}
