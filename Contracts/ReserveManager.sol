// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ReserveManager is Ownable {
    IERC20 public INRC;
    IERC20 public MATIC;
    IERC20 public LINK;
    IERC20 public RCOIN;

    constructor(address _inrcAddress, address _maticAddress, address _linkAddress, address _rcoinAddress) Ownable(msg.sender) {
        INRC = IERC20(_inrcAddress);
        MATIC = IERC20(_maticAddress);
        LINK = IERC20(_linkAddress);
        RCOIN = IERC20(_rcoinAddress);
    }

    function depositINRC(uint256 _amount) external onlyOwner{
        require(_amount > 0, "Amount must be greater than zero");
        INRC.transferFrom(msg.sender, address(this), _amount);
    }

    function withdrawINRC(uint256 _amount) external onlyOwner{
        require(_amount > 0, "Amount must be greater than zero");
        require(_amount < INRC.balanceOf(address(this)), "Insufficient Balance");
        INRC.transfer(msg.sender, _amount);
    }

    function depositMATIC(uint256 _amount) external onlyOwner{
        require(_amount > 0, "Amount must be greater than zero");
        MATIC.transferFrom(msg.sender, address(this), _amount);
    }

    function withdrawMATIC(uint256 _amount) external onlyOwner{
        require(_amount > 0, "Amount must be greater than zero");
        require(_amount < MATIC.balanceOf(address(this)), "Insufficient Balance");
        MATIC.transfer(msg.sender, _amount);
    }

    function depositLINK(uint256 _amount) external onlyOwner{
        require(_amount > 0, "Amount must be greater than zero");
        LINK.transferFrom(msg.sender, address(this), _amount);
    }

    function withdrawLINK(uint256 _amount) external onlyOwner{
        require(_amount > 0, "Amount must be greater than zero");
        require(_amount < LINK.balanceOf(address(this)), "Insufficient Balance");
        LINK.transfer(msg.sender, _amount);
    }

    function depositRCOIN(uint256 _amount) external onlyOwner{
        require(_amount > 0, "Amount must be greater than zero");
        RCOIN.transferFrom(msg.sender, address(this), _amount);
    }

    function withdrawRCOIN(uint256 _amount) external onlyOwner{
        require(_amount > 0, "Amount must be greater than zero");
        require(_amount < RCOIN.balanceOf(address(this)), "Insufficient Balance");
        RCOIN.transfer(msg.sender, _amount);
    }

    function getINRCCollateral() external view returns (uint256) {
        return INRC.balanceOf(address(this));
    }

    function getMATICCollateral() external view returns (uint256) {
        return MATIC.balanceOf(address(this));
    }

    function getLINKCollateral() external view returns (uint256) {
        return LINK.balanceOf(address(this));
    }

    function getRCOINBalance() external view returns (uint256) {
        return RCOIN.balanceOf(address(this));
    }
}