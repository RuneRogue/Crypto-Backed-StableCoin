const { ethers } = require('ethers');
const fs = require('fs');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const ExcelJS = require('exceljs');
const { TotalValue } = require('./Reserve/TotalValue');
const INRCpriceCalculator = require('./OraclePrice/INRCPrice');
const LINKPrice = require('./OraclePrice/LINKPrice');
const MaticPrice = require('./OraclePrice/MaticPrice');
const {RCSPrice} = require('./SwapPool/RCSPrice');
const { format } = require('date-fns');

const ReserveManagerManagerABI = require('./ABI/ReserveManagerABI.json');
const RcoinABI = require('./ABI/RcoinABI.json');
const MaticABI = require('./ABI/MaticABI.json');
const InrcABI = require('./ABI/InrcABI.json');
const LinkABI = require('./ABI/LinkABI.json');
const RcsABI = require('./ABI/RcsABI.json');
const SwappoolManagerAbi = require('./ABI/SwappoolManagerAbi.json');

const RcoinAddress = "0xDD01448e9DF16595BDaD8af820aFd50A175E12F4";
const provider = new ethers.JsonRpcProvider('https://polygon-mainnet.g.alchemy.com/v2/ON1ctftr6l4I-udsVICw75aKx-JLPufd');
const privateKey = '***************************'; // Your private key
const wallet = new ethers.Wallet(privateKey, provider);
const Rcoin = new ethers.Contract(RcoinAddress, RcoinABI, wallet);
const ReserveManagerAddress = '0x463C4C3c9b223F9eb3453C033eb93Aed102bD8fB';
const ReserveManagerContract = new ethers.Contract(ReserveManagerAddress, ReserveManagerManagerABI, wallet);
const SwappoolManagerContract = new ethers.Contract('0xb633b4420f7E690C6EDc2b41b6Dd55335B718512', SwappoolManagerAbi, wallet);

const Inrc = new ethers.Contract('0x87e32F78a22DeE1BBBE316d5CdAf68fe1D842749', InrcABI, wallet);
const Matic = new ethers.Contract('0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', MaticABI, wallet);
const Link = new ethers.Contract('0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39', LinkABI, wallet);
const Rcs = new ethers.Contract('0x6200A3a22B29bB2EE3C8Cc65e5F283Ed92543C80', RcsABI, wallet);

async function fetchPreviousBalance() {
    const workbook = new ExcelJS.Workbook();
    const filePath = 'cgra_balance.xlsx';
        await workbook.xlsx.readFile(filePath);
        const worksheet = workbook.getWorksheet('Balance Sheet');
        let lastRowNumber = null;
        worksheet.eachRow({ includeEmpty: false }, function(row, rowNumber) {
            // Track the last non-empty row number
            lastRowNumber = rowNumber;
        });
        const lastRow = worksheet.getRow(lastRowNumber);
        const lastBalance = lastRow.getCell(4).value;
        return lastBalance;
}

async function logTransactionToExcel(operation, coin, amount, balance) {
    const workbook = new ExcelJS.Workbook();
    const filePath = 'cgra_balance.xlsx';
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.getWorksheet('Balance Sheet');
    worksheet.columns = [
        { header: 'Date/Time', key: 'date', width: 30 },
        { header: 'Operation', key: 'operation', width: 20 },
        { header: 'Amount (INR)', key: 'amount', width: 20 },
        { header: 'Current Balance', key: 'balance', width: 25 },
    ];

    const now = new Date();
    const formattedDate = format(now, 'yyyy-MM-dd HH:mm:ss');

    let color;
    if (operation === "Deposit") {
        balance += amount;
        color = 'FF00FF00'; // Green
    } else if (operation === "Withdraw") {
        balance -= amount;
        color = 'FFFF0000'; // Red
    } else {
        throw new Error('Invalid operation');
    }

    const row = worksheet.addRow({
        date: formattedDate,
        operation: `${operation} ${coin}`,
        amount: amount,
        balance: balance
    });

    row.eachCell((cell) => {
        cell.font = { size: 14 };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    row.getCell(3).font = {
        size: 14,
        color: { argb: color }
    };

    row.getCell(3).alignment = {
        vertical: 'middle',
        horizontal: 'center'
    };

    await workbook.xlsx.writeFile(filePath);

}


async function readPreviousPrice(token) {
    return new Promise((resolve, reject) => {
        let found = false;
        fs.createReadStream('prices.csv')
            .pipe(csv())
            .on('data', (row) => {
                if (row.token === token) {
                    found = true;
                    resolve(parseFloat(row.previousPrice));
                }
            })
            .on('end', () => {
                if (!found) resolve(0);  // Default value if token is not found
            })
            .on('error', reject);
    });
}

async function writeCurrentPrice(token, price) {
    const rows = [];
    const existingTokens = new Set();

    // Read existing CSV data
    if (fs.existsSync('prices.csv')) {
        await new Promise((resolve, reject) => {
            fs.createReadStream('prices.csv')
                .pipe(csv())
                .on('data', (row) => {
                    rows.push(row);
                    existingTokens.add(row.token);
                })
                .on('end', resolve)
                .on('error', reject);
        });
    }

    // Update the price for the token or add a new entry
    if (existingTokens.has(token)) {
        rows.forEach(row => {
            if (row.token === token) {
                row.previousPrice = price;
            }
        });
    } else {
        rows.push({ token, previousPrice: price });
    }

    // Write updated CSV data
    const csvWriter = createCsvWriter({
        path: 'prices.csv',
        header: [
            { id: 'token', title: 'token' },
            { id: 'previousPrice', title: 'previousPrice' }
        ]
    });

    await csvWriter.writeRecords(rows);
}

// async function updatePrices() {
//     try {
//         // Fetch the prices from respective sources
//         const inrcPrice = await INRCpriceCalculator();  // Fetch INRC price from your custom logic
//         const maticPrice = await MaticPrice();          // Fetch MATIC price from your custom logic
//         const linkPrice = await LINKPrice();            // Fetch LINK price from your custom logic

//         // Store them in the CSV file
//         await writeCurrentPrice('INRC', inrcPrice);
//         await writeCurrentPrice('MATIC', maticPrice);
//         await writeCurrentPrice('LINK', linkPrice);

//         console.log('Prices updated successfully in CSV.');
//     } catch (error) {
//         console.error('Error updating prices:', error);
//     }
// }

// // Call the function to update the prices and store them in CSV
// updatePrices();

async function ReserveManager()
{
	const { TVL, INRCAmount, MATICAmount, LINKAmount, RCOINAmount, oracleP } = await TotalValue();
    let CGRABalance = await fetchPreviousBalance();
    console.log("Collateral Value: ",TVL);
    console.log("R Coin Supply: ",RCOINAmount);

	let previousINRCprice = await readPreviousPrice('INRC'); //fetch from CSV
	let curentINRCprice = await INRCpriceCalculator();
	let INRCchange = 100 * (curentINRCprice-previousINRCprice)/previousINRCprice;

	let previousMATICprice = await readPreviousPrice('MATIC');
	let curentMATICprice = await MaticPrice();
	let MATICchange = 100 * (curentMATICprice-previousMATICprice)/previousMATICprice;

	let previousLINKprice = await readPreviousPrice('LINK');
	let curentLINKprice = await LINKPrice();
	let LINKchange = 100 * (curentLINKprice-previousLINKprice)/previousLINKprice;

	//INRC
	if (INRCchange>0) {
		let pchange = (previousINRCprice * INRCchange) / curentINRCprice;

		if ((INRCAmount!=0)&&(pchange!=0)) {

			let INRCamount = (INRCAmount * pchange) / 100;

			const inrcP = await INRCpriceCalculator();
			let RcsPrice = await RCSPrice();
			let RCSAmount = (INRCamount*inrcP/oracleP)/RcsPrice;
            let tranAmount = INRCamount*inrcP/oracleP;
			tranAmount = tranAmount.toFixed(3);
			tranAmount = parseFloat(tranAmount);
            await logTransactionToExcel("Deposit", "INRC", tranAmount, CGRABalance);
			console.log("RCS Amount: "+RCSAmount);

			console.log("Withdrawing "+INRCamount +" INRC");
			INRCamount = ethers.parseUnits(INRCamount.toString(),18);

			const gasPrice = (await provider.getFeeData()).gasPrice; // Fetch current gas price from the network
			const gasLimit = 3000000;
			//Withdrawing INRC from Reserve
			const tx = await ReserveManagerContract.withdrawINRC(INRCamount.toString() , {
				gasPrice: gasPrice, // Increase the gas price to make the transaction more competitive
				gasLimit: gasLimit
			});
			await tx.wait();
			console.log("Withdrawing Process of INRC from Reserve Done!!!!")

			//Depositing INRC in Swap pool
			const approvalResponse = await Inrc.approve('0xb633b4420f7E690C6EDc2b41b6Dd55335B718512' , INRCamount.toString() , {
				gasPrice: gasPrice, // Increase the gas price to make the transaction more competitive
				gasLimit: gasLimit
			});
			await approvalResponse.wait();
			const txn = await SwappoolManagerContract.depositINRC(INRCamount.toString() , {
				gasPrice: gasPrice, // Increase the gas price to make the transaction more competitive
				gasLimit: gasLimit
			});
			await txn.wait();
			console.log("Depositing of INRC in Swap pool Done!!!!")

			//Withdrawing RCS from swap pool
			RCSAmount = ethers.parseUnits(RCSAmount.toString(),18);
			const buyback = await SwappoolManagerContract.withdrawRCS(RCSAmount.toString() , {
				gasPrice: gasPrice, // Increase the gas price to make the transaction more competitive
				gasLimit: gasLimit
			});
			await buyback.wait();
			console.log("Withdrawing of RCS from Swap pool Done!!!!")

			//Burning RCS token
			const burn = await Rcs.burn(RCSAmount.toString() , {
				gasPrice: gasPrice, // Increase the gas price to make the transaction more competitive
				gasLimit: gasLimit
			});
			await burn.wait();
			console.log("Buy Back and Burn of RCS Done!!!!");
			console.log("---------------------------------------------------");
		}
		await writeCurrentPrice('INRC', curentINRCprice);
	}
	else
	{
		let pchange = -1*(previousINRCprice * INRCchange) / curentINRCprice;
		if ((INRCAmount!=0)&&(pchange!=0)) {

			let INRCamount = (INRCAmount * pchange) / 100;

			const inrcP = await INRCpriceCalculator();
			let RcsPrice = await RCSPrice();
			let RCSAmount = (INRCamount*inrcP/oracleP)/RcsPrice;
            let tranAmount = INRCamount*inrcP/oracleP;
			tranAmount = tranAmount.toFixed(3);
			tranAmount = parseFloat(tranAmount);
            await logTransactionToExcel("Withdraw", "INRC", tranAmount, CGRABalance);
			console.log("RCS Amount: "+RCSAmount);

			console.log("Depositing "+INRCamount +" INRC");
			INRCamount = ethers.parseUnits(INRCamount.toString(),18);

			//Minting RCS Token
			const gasPrice = (await provider.getFeeData()).gasPrice; // Fetch current gas price from the network
			const gasLimit = 3000000;
			RCSAmount = ethers.parseUnits(RCSAmount.toString(),18);
			const mint = await Rcs.mint('0xb633b4420f7E690C6EDc2b41b6Dd55335B718512',RCSAmount.toString() , {
				gasPrice: gasPrice, // Increase the gas price to make the transaction more competitive
				gasLimit: gasLimit
			});
			await mint.wait();
			console.log("Minting Process of RCS in Swap pool Done!!!");

			//Withdrawing INRC from Swap pool
			const withdraw = await SwappoolManagerContract.withdrawINRC(INRCamount.toString(), {
				gasPrice: gasPrice, // Increase the gas price to make the transaction more competitive
				gasLimit: gasLimit
			});
			await withdraw.wait();
			console.log("Withdrawing Process of INRC from Swap pool Done!!!");

			//Deposite INRC to Reserve
			const approvalResponse = await Inrc.approve(ReserveManagerAddress , INRCamount.toString() , {
				gasPrice: gasPrice, // Increase the gas price to make the transaction more competitive
				gasLimit: gasLimit
			});
			await approvalResponse.wait();
			const tx = await ReserveManagerContract.depositINRC(INRCamount.toString() , {
				gasPrice: gasPrice, // Increase the gas price to make the transaction more competitive
				gasLimit: gasLimit
			});
			await tx.wait();
			console.log("Depositing Process of INRC in Reserve Done!!!");
			console.log("---------------------------------------------------");
		}
		await writeCurrentPrice('INRC', curentINRCprice);
		
	}
	
	//MATIC----------------
	if (MATICchange>0) {
		let pchange = (previousMATICprice * MATICchange) / curentMATICprice;
		
		if ((MATICAmount!=0)&&(pchange!=0)) {
			let amount = (MATICAmount * pchange) / 100;
			const maticP = await MaticPrice();
			let RcsPrice = await RCSPrice();
			let RCSAmount = (amount*maticP/oracleP)/RcsPrice;
            let tranAmount = amount*maticP/oracleP;
			tranAmount = tranAmount.toFixed(3);
			tranAmount = parseFloat(tranAmount);
            await logTransactionToExcel("Deposit", "MATIC", tranAmount, CGRABalance);
			console.log("RCS Amount: "+RCSAmount);
			console.log("Withdrawing "+amount +" MATIC");
			amount = ethers.parseUnits((amount.toFixed(10)).toString(),18);

			const gasPrice = (await provider.getFeeData()).gasPrice;
			const gasLimit = 3000000;

			//Withdrawing MATIC from Reserve
			const tx = await ReserveManagerContract.withdrawMATIC(amount.toString() , {
				 			gasPrice: gasPrice, // Increase the gas price to make the transaction more competitive
				 			gasLimit: gasLimit
				 		});
			await tx.wait();
			console.log("Withdrawing Process of MATIC from Reserve Done!!!!");

			//Depositing MATIC in Swap pool
	 		const approvalResponse = await Matic.approve('0xb633b4420f7E690C6EDc2b41b6Dd55335B718512' , amount.toString() , {
	 			gasPrice: gasPrice, // Increase the gas price to make the transaction more competitive
	 			gasLimit: gasLimit
	 		});
			await approvalResponse.wait();
			const txn = await SwappoolManagerContract.depositMATIC(amount.toString() , {
			  	gasPrice: gasPrice, // Increase the gas price to make the transaction more competitive
			  	gasLimit: gasLimit
			});
			await txn.wait();
	 		console.log("Depositing of MATIC in Swap pool Done!!!!");

			//Withdrawing RCS from swap pool
			RCSAmount = ethers.parseUnits(RCSAmount.toString(),18);
			const buyback = await SwappoolManagerContract.withdrawRCS(RCSAmount.toString() , {
				gasPrice: gasPrice, // Increase the gas price to make the transaction more competitive
				gasLimit: gasLimit
			});
			await buyback.wait();
			console.log("Withdrawing of RCS from Swap pool Done!!!!")

			//Burning RCS token
			const burn = await Rcs.burn(RCSAmount.toString() , {
	 			gasPrice: gasPrice, // Increase the gas price to make the transaction more competitive
	 			gasLimit: gasLimit
			});
			await burn.wait();
			console.log("Buy Back and Burn of RCS Done!!!!");
			console.log("---------------------------------------------------");
		}
		await writeCurrentPrice('MATIC', curentMATICprice);
	}
	else
	{
		let pchange = -1*(previousMATICprice * MATICchange) / curentMATICprice;

		if ((MATICAmount!=0)&&(pchange!=0)) {
			let amount = (MATICAmount * pchange) / 100;
			const maticP = await MaticPrice();
			let RcsPrice = await RCSPrice();
			let RCSAmount = (amount*maticP/oracleP)/RcsPrice;
            let tranAmount = amount*maticP/oracleP;
			tranAmount = tranAmount.toFixed(3);
			tranAmount = parseFloat(tranAmount);
            await logTransactionToExcel("Withdraw", "MATIC", tranAmount, CGRABalance);
			console.log("RCS Amount: "+RCSAmount);
			console.log("Depositing "+amount +" MATIC");
			amount = ethers.parseUnits((amount.toFixed(10)).toString(),18);

			const gasPrice = (await provider.getFeeData()).gasPrice;
			const gasLimit = 3000000;

			//Minting RCS Token
			RCSAmount = ethers.parseUnits(RCSAmount.toString(),18);
			const mint = await Rcs.mint('0xb633b4420f7E690C6EDc2b41b6Dd55335B718512',RCSAmount.toString() , {
	 			gasPrice: gasPrice, // Increase the gas price to make the transaction more competitive
				gasLimit: gasLimit
			});
			await mint.wait();
			console.log("Minting Process of RCS in Swap pool Done!!!");
			
			//Withdrawing Matic from Swap pool
			const withdraw = await SwappoolManagerContract.withdrawMATIC(amount.toString(), {
	 			gasPrice: gasPrice, // Increase the gas price to make the transaction more competitive
	 			gasLimit: gasLimit
	 		});
			await withdraw.wait();
	 		console.log("Withdrawing Process of MATIC from Swap pool Done!!!");
			
			//Deposite MATIC to Reserve
			const approvalResponse = await Matic.approve(ReserveManagerAddress , amount.toString() , {
	 			gasPrice: gasPrice, // Increase the gas price to make the transaction more competitive
	 			gasLimit: gasLimit
	 		});
			await approvalResponse.wait();
			const tx = await ReserveManagerContract.depositMATIC(amount.toString() , {
	 			gasPrice: gasPrice, // Increase the gas price to make the transaction more competitive
	 			gasLimit: gasLimit
	 		});
			await tx.wait();
			console.log("Depositing Process of MATIC in Reserve Done!!!");
			console.log("---------------------------------------------------");
		}

		await writeCurrentPrice('MATIC', curentMATICprice);
	}

	//LINK--------------

	if (LINKchange>0) {
		let pchange = (previousLINKprice * LINKchange) / curentLINKprice;

		if ((LINKAmount!=0)&&(pchange!=0)) {
			let amount = (LINKAmount * pchange) / 100;
			const linkP = await LINKPrice();
	 		let RcsPrice = await RCSPrice();
			let RCSAmount = (amount*linkP/oracleP)/RcsPrice;
            let tranAmount = amount*linkP/oracleP;
			tranAmount = tranAmount.toFixed(3);
			tranAmount = parseFloat(tranAmount);
            await logTransactionToExcel("Deposit", "LINK", tranAmount, CGRABalance);
			console.log("RCS Amount: "+RCSAmount);
			console.log("Withdrawing "+amount +"LINK");
			amount = ethers.parseUnits((amount.toFixed(10)).toString(),18);
			
			const gasPrice = (await provider.getFeeData()).gasPrice;
			const gasLimit = 3000000;

			//Withdrawing LINK from Reserve
			const tx = await ReserveManagerContract.withdrawLINK(amount.toString() , {
	 			gasPrice: gasPrice, // Increase the gas price to make the transaction more competitive
	 			gasLimit: gasLimit
	 		});
			await tx.wait();
			console.log("Withdrawing Process of LINK from Reserve Done!!!!");

			//Depositing LINK in Swap pool
			const approvalResponse = await Link.approve('0xb633b4420f7E690C6EDc2b41b6Dd55335B718512' , amount.toString() , {
	 			gasPrice: gasPrice, // Increase the gas price to make the transaction more competitive
	 			gasLimit: gasLimit
	 		});
			await approvalResponse.wait();
			const txn = await SwappoolManagerContract.depositLINK(amount.toString() , {
	 			gasPrice: gasPrice, // Increase the gas price to make the transaction more competitive
	 			gasLimit: gasLimit
	 		});
			await txn.wait();
			console.log("Depositing of LINK in Swap pool Done!!!!");

			//Withdrawing RCS from swap pool
			RCSAmount = ethers.parseUnits(RCSAmount.toString(),18);
			const buyback = await SwappoolManagerContract.withdrawRCS(RCSAmount.toString() , {
	 			gasPrice: gasPrice, // Increase the gas price to make the transaction more competitive
	 			gasLimit: gasLimit
	 		});
			await buyback.wait();
			console.log("Withdrawing of RCS from Swap pool Done!!!!");

			//Burning RCS token
			const burn = await Rcs.burn(RCSAmount.toString() , {
				gasPrice: gasPrice, // Increase the gas price to make the transaction more competitive
	 			gasLimit: gasLimit
	 		});
			await burn.wait();
			console.log("Buy Back and Burn of RCS Done!!!!");
			console.log("---------------------------------------------------");
		}
		await writeCurrentPrice('LINK', curentLINKprice);
	}
	else	
	{
		let pchange = -1*(previousLINKprice * LINKchange) / curentLINKprice;

		if ((LINKAmount!=0)&&(pchange!=0)) {
			let amount = (LINKAmount * pchange) / 100;
			const linkP = await LINKPrice();
	 		let RcsPrice = await RCSPrice();
			let RCSAmount = (amount*linkP/oracleP)/RcsPrice;
            let tranAmount = amount*linkP/oracleP;
			tranAmount = tranAmount.toFixed(3);
			tranAmount = parseFloat(tranAmount);
            await logTransactionToExcel("Withdraw", "LINK", tranAmount, CGRABalance);
			console.log("RCS Amount: "+RCSAmount);
			console.log("Depositing "+amount +"LINK");
			amount = ethers.parseUnits((amount.toFixed(10)).toString(),18);

			//Minting RCS Token
			const gasPrice = (await provider.getFeeData()).gasPrice;
			const gasLimit = 3000000;
			RCSAmount = ethers.parseUnits(RCSAmount.toString(),18);
			const mint = await Rcs.mint('0xb633b4420f7E690C6EDc2b41b6Dd55335B718512',RCSAmount.toString() , {
	 			gasPrice: gasPrice, // Increase the gas price to make the transaction more competitive
				gasLimit: gasLimit
			});
			await mint.wait();
			console.log("Minting Process of RCS in Swap pool Done!!!");

			//Withdrawing LINK from Swap pool
			const withdraw = await SwappoolManagerContract.withdrawLINK(amount.toString(), {
	 			gasPrice: gasPrice, // Increase the gas price to make the transaction more competitive
				gasLimit: gasLimit
	 		});
			await withdraw.wait();
			console.log("Withdrawing Process of LINK from Swap pool Done!!!");

			//Deposite LINK to Reserve
			const approvalResponse = await Link.approve(ReserveManagerAddress , amount.toString() , {
	 			gasPrice: gasPrice, // Increase the gas price to make the transaction more competitive
	 			gasLimit: gasLimit
	 		});
			await approvalResponse.wait();
			const tx = await ReserveManagerContract.depositLINK(amount.toString() , {
				gasPrice: gasPrice, // Increase the gas price to make the transaction more competitive
				gasLimit: gasLimit
	 		});
			await tx.wait();
			console.log("Depositing Process of LINK in Reserve Done!!!");
			console.log("---------------------------------------------------");
		}
		await writeCurrentPrice('LINK', curentLINKprice);
	}

// const tx=await Rcoin.mint(ReserveManagerAddress,ethers.parseUnits(TVL.toString(),18));
//     await tx.wait();
// 	console.log(tx);
}
// ReserveManager();
module.exports = ReserveManager;