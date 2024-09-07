// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TokenVault is Ownable{
    // Address of the INRC, MATIC, LINK, and RCS tokens
    IERC20 public inrcToken;
    IERC20 public maticToken;
    IERC20 public linkToken;
    IERC20 public rcsToken;

    constructor(
        address _inrcToken,
        address _maticToken,
        address _linkToken,
        address _rcsToken
    ) Ownable(msg.sender){
        inrcToken = IERC20(_inrcToken);
        maticToken = IERC20(_maticToken);
        linkToken = IERC20(_linkToken);
        rcsToken = IERC20(_rcsToken);
    }
             
    // Deposit tokens into the contract
    function depositINRC(uint256 amount) external onlyOwner{
        require(inrcToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
    }

    function depositMATIC(uint256 amount) external onlyOwner{
        require(maticToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
    }

    function depositLINK(uint256 amount) external onlyOwner{
        require(linkToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
    }

    function depositRCS(uint256 amount) external onlyOwner{
        require(rcsToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
    }

    // Withdraw tokens from the contract
    function withdrawINRC(uint256 amount) external onlyOwner{
        require(inrcToken.transfer(msg.sender, amount), "Transfer failed");
    }

    function withdrawMATIC(uint256 amount) external onlyOwner{
        require(maticToken.transfer(msg.sender, amount), "Transfer failed");
    }

    function withdrawLINK(uint256 amount) external onlyOwner{
        require(linkToken.transfer(msg.sender, amount), "Transfer failed");
    }

    function withdrawRCS(uint256 amount) external onlyOwner{
        require(rcsToken.transfer(msg.sender, amount), "Transfer failed");
    }

    // Get balance of tokens in the contract
    function getBalanceINRC() external view returns (uint256) {
        return inrcToken.balanceOf(address(this));
    }

    function getBalanceMATIC() external view returns (uint256) {
        return maticToken.balanceOf(address(this));
    }

    function getBalanceLINK() external view returns (uint256) {
        return linkToken.balanceOf(address(this));
    }

    function getBalanceRCS() external view returns (uint256) {
        return rcsToken.balanceOf(address(this));
    }
}
