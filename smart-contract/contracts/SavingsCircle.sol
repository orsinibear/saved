// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title SavingsCircle - Core circle contract for Ajo/Esusu
contract SavingsCircle is Ownable, ReentrancyGuard {
    // Token (cUSD) used for contributions
    IERC20 public immutable cUSD;

    // Circle configuration
    uint256 public immutable contributionAmount; // in cUSD wei
    uint256 public immutable cycleLength; // seconds between cycles
    uint256 public immutable maxMembers;

    // Membership and scheduling
    address[] public members;
    mapping(address => uint256) public memberIndex; // 1-based index; 0 means not a member
    uint256[] public payoutOrder; // order of member indices

    // State tracking
    uint256 public currentCycle; // starts at 0
    uint256 public currentDueIndex; // index within payoutOrder indicating who gets payout this cycle
    mapping(uint256 => mapping(address => bool)) public paid; // cycle => member => paid?
    mapping(address => int256) public reputation; // simple score

    // Membership requests (SelfID gating)
    struct MembershipRequest {
        bytes32 selfIdRef;
        bool exists;
        bool approved;
    }

    mapping(address => MembershipRequest) public membershipRequests;
    mapping(address => bytes32) public membershipAttestations;

    // Events
    event MembershipRequested(address indexed account, bytes32 selfIdRef);
    event MembershipAttested(address indexed account, bytes32 attestationRef);
    event Joined(address indexed member);
    event Contributed(address indexed member, uint256 indexed cycle, uint256 amount);
    event Payout(address indexed to, uint256 indexed cycle, uint256 amount);
    event PayoutShortfall(uint256 expectedAmount, uint256 actualAmount);
    event Missed(address indexed member, uint256 indexed cycle);
    event ReputationUpdated(address indexed member, int256 delta, int256 newScore);

    error NotMember();
    error AlreadyMember();
    error InvalidParams();
    error NothingToPayout();
    error NoRequest();
    error AlreadyRequested();

    constructor(
        address _cUSD,
        address _creator,
        uint256 _contributionAmount,
        uint256 _cycleLength,
        uint256 _maxMembers,
        uint256[] memory _payoutOrder
    ) Ownable(_creator) {
        if (_cUSD == address(0) || _contributionAmount == 0 || _cycleLength == 0) revert InvalidParams();
        if (_maxMembers == 0 || _payoutOrder.length == 0) revert InvalidParams();
        cUSD = IERC20(_cUSD);
        contributionAmount = _contributionAmount;
        cycleLength = _cycleLength;
        maxMembers = _maxMembers;
        payoutOrder = _payoutOrder;
    }

    function membersCount() external view returns (uint256) {
        return members.length;
    }

    function isMember(address account) public view returns (bool) {
        return memberIndex[account] != 0;
    }

    function joinCircle(bytes32 selfIdRef) external {
        if (selfIdRef == bytes32(0)) revert InvalidParams();
        if (isMember(msg.sender)) revert AlreadyMember();
        if (members.length >= maxMembers) revert InvalidParams();

        MembershipRequest storage request = membershipRequests[msg.sender];
        if (request.exists && !request.approved) {
            revert AlreadyRequested();
        }

        membershipRequests[msg.sender] = MembershipRequest({selfIdRef: selfIdRef, exists: true, approved: false});
        emit MembershipRequested(msg.sender, selfIdRef);
    }

    function attestMembership(address account, bytes32 attestationRef) external onlyOwner {
        if (account == address(0) || attestationRef == bytes32(0)) revert InvalidParams();
        if (isMember(account)) revert AlreadyMember();
        if (members.length >= maxMembers) revert InvalidParams();

        MembershipRequest storage request = membershipRequests[account];
        if (!request.exists) revert NoRequest();
        if (request.approved) revert AlreadyMember();

        request.approved = true;
        membershipAttestations[account] = attestationRef;

        members.push(account);
        memberIndex[account] = members.length;

        emit MembershipAttested(account, attestationRef);
        emit Joined(account);
    }

    function contribute() external nonReentrant {
        if (!isMember(msg.sender)) revert NotMember();
        require(!paid[currentCycle][msg.sender], "Already paid this cycle");
        require(cUSD.transferFrom(msg.sender, address(this), contributionAmount), "Transfer failed");
        paid[currentCycle][msg.sender] = true;
        emit Contributed(msg.sender, currentCycle, contributionAmount);
    }

    function triggerPayout() external nonReentrant {
        require(members.length == maxMembers, "Circle not full");
        // Check all members paid
        for (uint256 i = 0; i < members.length; i++) {
            address m = members[i];
            if (!paid[currentCycle][m]) {
                // mark missed and update reputation
                emit Missed(m, currentCycle);
                _updateReputation(m, -1);
            } else {
                _updateReputation(m, 1);
            }
        }
        // Determine recipient by payoutOrder[currentDueIndex]
        uint256 memberIdx1Based = payoutOrder[currentDueIndex];
        require(memberIdx1Based > 0 && memberIdx1Based <= members.length, "Invalid payout index");
        address recipient = members[memberIdx1Based - 1];

        uint256 expectedAmount = contributionAmount * members.length;
        uint256 contractBalance = cUSD.balanceOf(address(this));
        uint256 payoutAmount = expectedAmount;

        if (contractBalance < expectedAmount) {
            payoutAmount = contractBalance;
            emit PayoutShortfall(expectedAmount, contractBalance);
            if (payoutAmount == 0) revert NothingToPayout();
        }

        require(cUSD.transfer(recipient, payoutAmount), "Payout transfer failed");
        emit Payout(recipient, currentCycle, payoutAmount);

        // Progress cycle
        currentCycle += 1;
        _updateReputation(recipient, 3); // completed a payout cycle
        currentDueIndex = (currentDueIndex + 1) % payoutOrder.length;
    }

    function skipMissedContribution(address member) external onlyOwner {
        if (!isMember(member)) revert NotMember();
        if (paid[currentCycle][member]) revert InvalidParams();

        paid[currentCycle][member] = true;
        emit Missed(member, currentCycle);
        _updateReputation(member, -1);
    }

    function getStatus()
        external
        view
        returns (
            uint256 _cycle,
            uint256 _dueIndex,
            uint256 _contribution,
            uint256 totalMembers
        )
    {
        return (currentCycle, currentDueIndex, contributionAmount, members.length);
    }

    function _updateReputation(address member, int256 delta) internal {
        int256 newScore = reputation[member] + delta;
        reputation[member] = newScore;
        emit ReputationUpdated(member, delta, newScore);
    }
}
