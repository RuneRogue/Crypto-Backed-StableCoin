const { ethers, toBeArray } = require('ethers');
const getTotalDepositedAmounts = require('./AmountFetcher');
const INRCpriceCalculator = require('../OraclePrice/INRCPrice');
const MaticPrice = require('../OraclePrice/MaticPrice');
const LINKPrice = require('../OraclePrice/LINKPrice');
const oracleABI = [
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [],
		"name": "getLatestPrice",
		"outputs": [
			{
				"internalType": "int256",
				"name": "",
				"type": "int256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

const oracleAddress = "0x572BEB57EAB1aD11cBE4C79f5Fd0C8569Ab73086";
const provider = new ethers.JsonRpcProvider('https://polygon-mainnet.g.alchemy.com/v2/ON1ctftr6l4I-udsVICw75aKx-JLPufd');
const privateKey = '***************************'; // Your private key
const wallet = new ethers.Wallet(privateKey, provider);
const oracleContract = new ethers.Contract(oracleAddress, oracleABI, wallet);

async function oracle() {
    const pc = await oracleContract.getLatestPrice();
    const pcNumber = Number(pc);
    
    // Scale the result up by 10^8 to avoid precision loss
    const result = pcNumber / (10 ** 8);
    
    //console.log(result);
    return result;
}
let INRCAmount;
let MATICAmount;
let LINKAmount;
let RCSAmount;
async function RCSPrice()
{
	const result = await getTotalDepositedAmounts();
	INRCAmount = result.INRCAmount;
    MATICAmount = result.MATICAmount;
    LINKAmount = result.LINKAmount;
	RCSAmount = result.RCSAmount;

	const inrcP = await INRCpriceCalculator();
	const maticP = await MaticPrice();
	const linkP = await LINKPrice();

	let totalINRCValue = INRCAmount * inrcP;
	let totalMATICValue = MATICAmount * maticP;
	let totalLINKValue = LINKAmount * linkP;

	const oracleP = await oracle();

	totalINRCValue = totalINRCValue / oracleP;
	totalMATICValue = totalMATICValue / oracleP;
	totalLINKValue = totalLINKValue / oracleP;

	let TotalValue = totalINRCValue + totalMATICValue + totalLINKValue;
	let RCSP = TotalValue/RCSAmount;
	//console.log(RCSP);
	return RCSP;

}
module.exports = {
    RCSPrice,
    INRCAmount,
    MATICAmount,
    LINKAmount
};