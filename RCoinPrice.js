const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { TotalValue } = require('./Reserve/TotalValue');


const app = express();
app.use(cors());
const CSV_FILE_PATH = path.join(__dirname, './frontend/public/RCoinPrice.csv');

// Function to read the last stored price from the CSV file
const getLastPriceFromCSV = async () => {
    try {
        const data = fs.readFileSync(CSV_FILE_PATH, 'utf8');
        const lines = data.trim().split('\n');
        const lastLine = lines[lines.length - 1];
        const lastPrice = parseFloat(lastLine);
        return lastPrice;
    } catch (error) {
        // If file doesn't exist or is empty, return null
        return null;
    }
};

// Function to append the new price to the CSV file
const appendPriceToCSV = async (price) => {
    const csvLine = `\n${price}`;
    fs.appendFileSync(CSV_FILE_PATH, csvLine, 'utf8');
};

let latestRCOINPrice = null; // Store the latest fetched RCS price

// Function to fetch and store the RCS price every 2 minutes
const fetchRCSPricePeriodically = async () => {
    try {
        const { TVL, RCOINAmount } = await TotalValue();
        const rcoinPrice = TVL/RCOINAmount; // Fetch the RCS price
        const lastPrice = await getLastPriceFromCSV(); // Get the last stored price

        if (rcoinPrice !== lastPrice) {
            // Price has changed, append to CSV
            await appendPriceToCSV(rcoinPrice);
            latestRCOINPrice = rcoinPrice; // Update the latest price
        }
    } catch (error) {
        console.error("Error fetching RCS price:", error);
    }
};

// Start fetching the RCS price every 2 minutes (120,000 milliseconds)
setInterval(fetchRCSPricePeriodically, 60000);

// Immediately fetch the price when the server starts
fetchRCSPricePeriodically();

app.get('/rcoinprice', (req, res) => {
    if (latestRCOINPrice !== null) {
        res.json({ rcoinPrice: latestRCOINPrice });
    } else {
        res.status(500).json({ error: 'Price not available yet' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
