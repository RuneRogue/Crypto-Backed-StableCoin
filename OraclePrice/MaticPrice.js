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

const oracleAddress = "0x71Fdc4a066D9d7d69480A96E4303158102B7cafE";
const provider = new ethers.JsonRpcProvider('https://polygon-mainnet.g.alchemy.com/v2/ON1ctftr6l4I-udsVICw75aKx-JLPufd');
const privateKey = '127676b648f696051c0d4d77cdcb1a0bace3fb9fbbcd5e46e42076e64d1b0f12'; // Your private key
const wallet = new ethers.Wallet(privateKey, provider);
const oracleContract = new ethers.Contract(oracleAddress, oracleABI, wallet);

async function MaticPrice() {
    const pc = await oracleContract.getLatestPrice();
    const pcNumber = Number(pc);
    
    // Scale the result up by 10^8 to avoid precision loss
    const result = pcNumber / (10 ** 8);
    
    //console.log(result);
    return result;
}
MaticPrice();
module.exports = MaticPrice;