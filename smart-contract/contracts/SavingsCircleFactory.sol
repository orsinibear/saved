// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {SavingsCircle} from "./SavingsCircle.sol";

/// @title SavingsCircleFactory - Deploys SavingsCircle instances and emits registry events
contract SavingsCircleFactory {
    event CircleCreated(
        address indexed circle,
        address indexed creator,
        address cUSD,
        uint256 contributionAmount,
        uint256 cycleLength,
        uint256 maxMembers
    );

    address public immutable cUSD;

    constructor(address _cUSD) {
        require(_cUSD != address(0), "invalid cUSD");
        cUSD = _cUSD;
    }

    function createCircle(
        uint256 contributionAmount,
        uint256 cycleLength,
        uint256 maxMembers,
        uint256[] calldata payoutOrder
    ) external returns (address circle) {
        circle = address(
            new SavingsCircle(
                cUSD,
                msg.sender,
                contributionAmount,
                cycleLength,
                maxMembers,
                payoutOrder
            )
        );
        emit CircleCreated(circle, msg.sender, cUSD, contributionAmount, cycleLength, maxMembers);
    }
}
