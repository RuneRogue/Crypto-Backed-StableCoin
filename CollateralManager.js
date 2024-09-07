const express = require('express');
const { ethers } = require('ethers');
const bodyParser = require('body-parser');
const cors = require('cors');

// Existing imports (keep your existing functionality)
const { TotalValue } = require('./Reserve/TotalValue');
const INRCpriceCalculator = require('./OraclePrice/INRCPrice');
const LINKPrice = require('./OraclePrice/LINKPrice');
const MaticPrice = require('./OraclePrice/MaticPrice');
const RcoinABI = require('./ABI/RcoinABI.json');
const MaticABI = require('./ABI/MaticABI.json');
const InrcABI = require('./ABI/InrcABI.json');
const LinkABI = require('./ABI/LinkABI.json');
const ReserveManagerManagerABI = require('./ABI/ReserveManagerABI.json');

const RcoinAddress = "0xDD01448e9DF16595BDaD8af820aFd50A175E12F4";
const provider = new ethers.JsonRpcProvider('https://polygon-mainnet.g.alchemy.com/v2/ON1ctftr6l4I-udsVICw75aKx-JLPufd');
const privateKey = '***************************'; 
const wallet = new ethers.Wallet(privateKey, provider);
const Rcoin = new ethers.Contract(RcoinAddress, RcoinABI, wallet);
const ReserveManagerAddress = '0x463C4C3c9b223F9eb3453C033eb93Aed102bD8fB';
const ReserveManagerContract = new ethers.Contract(ReserveManagerAddress, ReserveManagerManagerABI, wallet);
const Inrc = new ethers.Contract('0x87e32F78a22DeE1BBBE316d5CdAf68fe1D842749', InrcABI, wallet);
const Matic = new ethers.Contract('0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', MaticABI, wallet);
const Link = new ethers.Contract('0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39', LinkABI, wallet);

const app = express();
const PORT = 5000;
app.use(cors());
app.use(bodyParser.json());

app.post('/api/collateral-action', async (req, res) => {
  let { mode, token, amount } = req.body;

  try {
    // Handle the action based on mode (addCollateral, removeCollateral, mint, redeem)
    const { TVL,RCOINAmount, oracleP } = await TotalValue();
    console.log("collateral value:",TVL);
    console.log("RCoin Supply:",RCOINAmount);
    if (mode === 'addCollateral') {
        if (token=='INRC') {
            let curentINRCprice = await INRCpriceCalculator();
            let RcoinAmount=amount*curentINRCprice/oracleP;
            amount= ethers.parseUnits(amount.toString(),18);
            const gasPrice = (await provider.getFeeData()).gasPrice; // Fetch current gas price from the network
			const gasLimit = 1000000;
            const approvalResponse = await Inrc.approve(ReserveManagerAddress , amount.toString() , {
				gasPrice: gasPrice, // Increase the gas price to make the transaction more competitive
				gasLimit: gasLimit
			});
			await approvalResponse.wait();
            const tx= await ReserveManagerContract.depositINRC(amount.toString(), {
				gasPrice: gasPrice, // Increase the gas price to make the transaction more competitive
				gasLimit: gasLimit
			});
            await tx.wait();
            console.log("depositing process of INRC in reseve done ");
            RcoinAmount=ethers.parseUnits(RcoinAmount.toString(),18);
            const mint=await Rcoin.mint(ReserveManagerAddress,RcoinAmount.toString(), {
				gasPrice: gasPrice, // Increase the gas price to make the transaction more competitive
				gasLimit: gasLimit
			});
            await mint.wait();
            console.log("Minting process of Rcoin in reseve done ");
        }
        //MATIC
        if (token=='MATIC') {
            let curentMATICprice = await MaticPrice();
            let RcoinAmount=amount*curentMATICprice/oracleP;
            amount= ethers.parseUnits(amount.toString(),18);
            const gasPrice = (await provider.getFeeData()).gasPrice; // Fetch current gas price from the network
			const gasLimit = 1000000;
            const approvalResponse = await Matic.approve(ReserveManagerAddress , amount.toString() , {
				gasPrice: gasPrice, // Increase the gas price to make the transaction more competitive
				gasLimit: gasLimit
			});
			await approvalResponse.wait();
            const tx= await ReserveManagerContract.depositMATIC(amount.toString(), {
				gasPrice: gasPrice, // Increase the gas price to make the transaction more competitive
				gasLimit: gasLimit
			});
            await tx.wait();
            console.log("depositing process of MATIC in reseve done ");
            RcoinAmount=ethers.parseUnits(RcoinAmount.toString(),18);
            const mint=await Rcoin.mint(ReserveManagerAddress,RcoinAmount.toString(), {
				gasPrice: gasPrice, // Increase the gas price to make the transaction more competitive
				gasLimit: gasLimit
			});
            await mint.wait();
            console.log("Minting process of Rcoin in reseve done ");
        }
        //LINK
        if (token=='LINK') {
            let curentLINKprice = await LINKPrice();
            let RcoinAmount=amount*curentLINKprice/oracleP;
            amount= ethers.parseUnits(amount.toString(),18);
            const gasPrice = (await provider.getFeeData()).gasPrice; // Fetch current gas price from the network
			const gasLimit = 1000000;
            const approvalResponse = await Link.approve(ReserveManagerAddress , amount.toString() , {
				gasPrice: gasPrice, // Increase the gas price to make the transaction more competitive
				gasLimit: gasLimit
			});
			await approvalResponse.wait();
            const tx= await ReserveManagerContract.depositLINK(amount.toString(), {
				gasPrice: gasPrice, // Increase the gas price to make the transaction more competitive
				gasLimit: gasLimit
			});
            await tx.wait();
            console.log("depositing process of LINK in reseve done ");
            RcoinAmount=ethers.parseUnits(RcoinAmount.toString(),18);
            const mint=await Rcoin.mint(ReserveManagerAddress,RcoinAmount.toString(), {
				gasPrice: gasPrice, // Increase the gas price to make the transaction more competitive
				gasLimit: gasLimit
			});
            await mint.wait();
            console.log("Minting process of Rcoin in reseve done ");
        }
    } else if (mode === 'removeCollateral') {
      // Remove collateral logic
      await ReserveManagerContract.removeCollateral(token, ethers.utils.parseUnits(amount, 18));
    }
    // Other logic for mint, redeem if needed
    res.json({ message: `${mode} action successful for ${token} with amount ${amount}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while processing the transaction.' });
  }
});
app.post('/api/calculate-rcoin-amount', async (req, res) => {
    const { token, amount } = req.body;
  
    try {
      // Get the current price of the token and the oracle price
      let tokenPrice;
      if (token === 'INRC') {
        tokenPrice = await INRCpriceCalculator();
      } else if (token === 'MATIC') {
        tokenPrice = await MaticPrice();
      } else if (token === 'LINK') {
        tokenPrice = await LINKPrice();
      }
  
      const { oracleP } = await TotalValue();
      const rcoinAmount = amount * tokenPrice / oracleP;
      res.json({ rcoinAmount: ethers.parseUnits(rcoinAmount.toString(), 18).toString() });
    } catch (error) {
      console.error('Error calculating Rcoin amount:', error);
      res.status(500).json({ message: 'An error occurred while calculating Rcoin amount.' });
    }
  });

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
