const { ethers } = require('ethers');

// Replace with your Polygon and Binance Smart Chain RPC endpoints and contract addresses
const polygonRpcUrl = 'https://polygon-mainnet.g.alchemy.com/v2/ON1ctftr6l4I-udsVICw75aKx-JLPufd';

const ReserveAddress = '0x463C4C3c9b223F9eb3453C033eb93Aed102bD8fB';

// Polygon Collateral Manager ABI
const ReserveManagerAbi = require('../ABI/ReserveManagerABI.json');

async function getTotalDepositedAmounts() {
  // Connect to Polygon and Binance Smart Chain
  const polygonProvider = new ethers.JsonRpcProvider(polygonRpcUrl);

  // Instantiate Polygon Collateral Manager contract
  const ReserveManager = new ethers.Contract(
    ReserveAddress,
    ReserveManagerAbi,
    polygonProvider
  );

  try {
    // Fetch total deposited amounts
    let INRCAmount = await ReserveManager.getINRCCollateral();
    INRCAmount = Number(INRCAmount) / (10 ** 18);

    let MATICAmount = await ReserveManager.getMATICCollateral();
    MATICAmount = Number(MATICAmount) / (10 ** 18);

	let LINKAmount = await ReserveManager.getLINKCollateral();
    LINKAmount = Number(LINKAmount) / (10 ** 18);

    let RCOINAmount = await ReserveManager.getRCOINBalance();
    RCOINAmount = Number(RCOINAmount) / (10 ** 18);

    // console.log('Total INRC Collateral:', INRCAmount.toString());
    // console.log('Total MATIC Collateral:', MATICAmount.toString());
	// console.log('Total LINK Collateral:', LINKAmount.toString());
    // console.log('Total Rcoin Supply:', RCOINAmount.toString());

    // Handle further processing or return the values as needed
    return {
		INRCAmount: INRCAmount.toString(),
		MATICAmount: MATICAmount.toString(),
		LINKAmount: LINKAmount.toString(),
		RCOINAmount: RCOINAmount.toString()
    };
  } catch (error) {
    console.error('Error fetching total deposited amounts:', error);
    throw error;
  }
}

// Execute the function
getTotalDepositedAmounts().then((result) => {
  
  
}).catch((error) => {
  console.error('Failed to fetch total deposited amounts:', error);
});

 module.exports = getTotalDepositedAmounts;