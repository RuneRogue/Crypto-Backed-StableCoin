// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@uniswap/v3-core/contracts/libraries/TickMath.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";

contract SupplyAdjustment is Ownable {
    using SafeMath for uint256;
    using SafeCast for uint256;

    IUniswapV3Pool public pool;

    constructor(
        address _pool,
        address initialOwner
    ) Ownable(initialOwner) {
        pool = IUniswapV3Pool(_pool);
    }

    function getCurrentINRCPrice() external view returns (uint) {
    (, int24 currentTick, , , , , ) = pool.slot0();
    uint160 sqrtPriceX96 = TickMath.getSqrtRatioAtTick(currentTick);
    uint priceSquared = uint256(sqrtPriceX96).mul(uint256(sqrtPriceX96));
    return priceSquared;
    }

}
