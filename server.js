// Import necessary libraries and modules
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const { ethers } = require('ethers');

// Custom modules (make sure these paths are correct)
const { RCSPrice } = require('./SwapPool/RCSPrice'); // Adjust path if necessary
const { TotalValue } = require('./Reserve/TotalValue');
const INRCpriceCalculator = require('./OraclePrice/INRCPrice');
const LINKPrice = require('./OraclePrice/LINKPrice');
const MaticPrice = require('./OraclePrice/MaticPrice');
const ReserveManager = require('./ReserveManager');

// ABI and Contract details
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

// Express app initialization
const app = express();
app.use(cors());
app.use(bodyParser.json());

const CSV_FILE_PATH_RCS = path.join(__dirname, './frontend/public/RCSPrice.csv');
const CSV_FILE_PATH_RCOIN = path.join(__dirname, './frontend/public/RCoinPrice.csv');


// Utility Functions for CSV
const getLastPriceFromCSV = async (csvFilePath) => {
    try {
        const data = fs.readFileSync(csvFilePath, 'utf8');
        const lines = data.trim().split('\n');
        const lastLine = lines[lines.length - 1];
        return parseFloat(lastLine);
    } catch (error) {
        return null;
    }
};

const appendPriceToCSV = async (csvFilePath, price) => {
    const csvLine = `\n${price}`;
    fs.appendFileSync(csvFilePath, csvLine, 'utf8');
};

// Price Fetching Logic
let latestRCSPrice = null;
let latestRCOINPrice = null;

const fetchRCSPricePeriodically = async () => {
    try {
        const rcsPrice = await RCSPrice();
        const lastPrice = await getLastPriceFromCSV(CSV_FILE_PATH_RCS);
        if (rcsPrice !== lastPrice) {
            await appendPriceToCSV(CSV_FILE_PATH_RCS, rcsPrice);
            latestRCSPrice = rcsPrice;
        }
    } catch (error) {
        console.error("Error fetching RCS price:", error);
    }
};

const fetchRCOINPricePeriodically = async () => {
    try {
        const { TVL, RCOINAmount } = await TotalValue();
        const rcoinPrice = TVL / RCOINAmount;
        const lastPrice = await getLastPriceFromCSV(CSV_FILE_PATH_RCOIN);
        if (rcoinPrice !== lastPrice) {
            await appendPriceToCSV(CSV_FILE_PATH_RCOIN, rcoinPrice);
            latestRCOINPrice = rcoinPrice;
        }
    } catch (error) {
        console.error("Error fetching RCOIN price:", error);
    }
};

// Start periodic fetching every minute
setInterval(fetchRCSPricePeriodically, 120000);
setInterval(fetchRCOINPricePeriodically, 120000);

// Initial fetch on server start
fetchRCSPricePeriodically();
fetchRCOINPricePeriodically();

// API Endpoints

// RCS Price endpoint
app.get('/rcsprice', (req, res) => {
    if (latestRCSPrice !== null) {
        res.json({ rcsPrice: latestRCSPrice });
    } else {
        res.status(500).json({ error: 'Price not available yet' });
    }
});

// RCOIN Price endpoint
app.get('/rcoinprice', (req, res) => {
    if (latestRCOINPrice !== null) {
        res.json({ rcoinPrice: latestRCOINPrice });
    } else {
        res.status(500).json({ error: 'Price not available yet' });
    }
});

// Collateral Management endpoint
app.post('/api/collateral-action', async (req, res) => {
    let { mode, token, amount } = req.body;

    try {
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


// Calculate Rcoin amount endpoint
app.post('/api/calculate-rcoin-amount', async (req, res) => {
    const { token, amount } = req.body;

    try {
        let tokenPrice;
        switch (token) {
            case 'INRC':
                tokenPrice = await INRCpriceCalculator();
                break;
            case 'MATIC':
                tokenPrice = await MaticPrice();
                break;
            case 'LINK':
                tokenPrice = await LINKPrice();
                break;
            default:
                throw new Error('Invalid token');
        }

        const {oracleP } = await TotalValue();
        const rcoinAmount = (amount * tokenPrice) / oracleP;
        
        res.json({ 
            rcoinAmount: ethers.parseUnits(rcoinAmount.toString(), 18).toString()
        });
    } catch (error) {
        console.error('Error calculating Rcoin amount:', error);
        res.status(500).json({ message: 'An error occurred while calculating Rcoin amount.' });
    }
});

app.post('/api/reserve-details', async (req, res) => {
    try {
        const { INRCAmount,MATICAmount,oracleP,LINKAmount,RCOINAmount,totalINRCValue, totalMATICValue, totalLINKValue } = await TotalValue();
        let curentINRCprice = (await INRCpriceCalculator())/oracleP;
        let curentMATICprice = (await MaticPrice())/oracleP;
        let curentLINKprice = (await LINKPrice())/oracleP;
        res.json({ 
            INRCAmount,
            MATICAmount,
            LINKAmount,
            RCOINAmount,
            totalINRCValue,
            totalMATICValue,
            totalLINKValue,
            curentINRCprice,
            curentMATICprice,
            curentLINKprice,
        });
    } catch (error) {
        console.error('Error Displaying Reserve Details:', error);
        res.status(500).json({ message: 'An error occurred while fetching Reserve Details.' });
    }
});

app.post('/api/run-reserve-manager', async (req, res) => {
    await ReserveManager();
    res.status(200).json({ message: 'Reserve Manager executed successfully!' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
