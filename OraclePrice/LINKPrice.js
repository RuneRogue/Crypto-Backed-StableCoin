const { ethers } = require('ethers');
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

const oracleAddress = "0x5C0B43FFD63616C8d270cCdA36ce51bebabcD2eB";
const provider = new ethers.JsonRpcProvider('https://polygon-mainnet.g.alchemy.com/v2/ON1ctftr6l4I-udsVICw75aKx-JLPufd');
const privateKey = '127676b648f696051c0d4d77cdcb1a0bace3fb9fbbcd5e46e42076e64d1b0f12'; // Your private key
const wallet = new ethers.Wallet(privateKey, provider);
const oracleContract = new ethers.Contract(oracleAddress, oracleABI, wallet);

async function LINKPrice() {
    const pc = await oracleContract.getLatestPrice();
    const pcNumber = Number(pc);
    
    // Scale the result up by 10^8 to avoid precision loss
    const result = pcNumber / (10 ** 8);
    
    // console.log(result);
    return result;
}
LINKPrice();
module.exports = LINKPrice;