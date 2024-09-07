// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract PriceConsumerV3 {
    AggregatorV3Interface internal priceFeed;

    /**
     * Network: Kovan
     * Aggregator: INR/USD
     * Address: (Get the latest address from Chainlink documentation)
     */
    constructor() {
        priceFeed = AggregatorV3Interface(0xAB594600376Ec9fD91F8e885dADF0CE036862dE0);
    }

    /**
     * Returns the latest price
     */
    function getLatestPrice() public view returns (int) {
        ( , int price , , , ) = priceFeed.latestRoundData();
        return price;
    }
}