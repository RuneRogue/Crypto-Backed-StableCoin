const { ethers } = require('ethers');

// Replace with your Polygon and Binance Smart Chain RPC endpoints and contract addresses
const polygonRpcUrl = 'https://polygon-mainnet.g.alchemy.com/v2/ON1ctftr6l4I-udsVICw75aKx-JLPufd';

const SwappoolAddress = '0xb633b4420f7E690C6EDc2b41b6Dd55335B718512';

// Polygon Collateral Manager ABI
const SwappoolManagerAbi = require('../ABI/SwappoolManagerAbi.json');

async function getTotalDepositedAmounts() {
  // Connect to Polygon and Binance Smart Chain
  const polygonProvider = new ethers.JsonRpcProvider(polygonRpcUrl);

  // Instantiate Polygon Collateral Manager contract
  const SwappoolManager = new ethers.Contract(
    SwappoolAddress,
    SwappoolManagerAbi,
    polygonProvider
  );

  try {
    // Fetch total deposited amounts
    let INRCAmount = await SwappoolManager.getBalanceINRC();
    INRCAmount = Number(INRCAmount) / (10 ** 18);

    let MATICAmount = await SwappoolManager.getBalanceMATIC();
    MATICAmount = Number(MATICAmount) / (10 ** 18);

	let LINKAmount = await SwappoolManager.getBalanceLINK();
    LINKAmount = Number(LINKAmount) / (10 ** 18);

	let RCSAmount = await SwappoolManager.getBalanceRCS();
    RCSAmount = Number(RCSAmount) / (10 ** 18);

    // console.log('Total INRC Collateral:', INRCAmount.toString());
    // console.log('Total MATIC Collateral:', MATICAmount.toString());
	// console.log('Total LINK Collateral:', LINKAmount.toString());
    // console.log('Total RCS Collateral:', RCSAmount.toString());

    // Handle further processing or return the values as needed
    return {
		INRCAmount: INRCAmount.toString(),
		MATICAmount: MATICAmount.toString(),
		LINKAmount: LINKAmount.toString(),
		RCSAmount: RCSAmount.toString(),
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