// Load environment variables
require('dotenv').config();

// Import required libraries and functions
const WebSocket = require('ws');
const Binance = require('node-binance-api');

// Extract necessary variables from environment
const { BINANCE_API_KEY, BINANCE_SECRET_KEY } = process.env;

// Initialize Binance API client with authentication
const binance = new Binance().options({
    APIKEY: BINANCE_API_KEY,
    APISECRET: BINANCE_SECRET_KEY,
    useServerTime: true,
    recvWindow: 5000,
});

const analyzeMarketDirection = require("./analyzeMarketDirection");
const getBalancesAndPositions = require("./getBalancesAndPositions");
const managePositions = require("./managePositions");
const createNewMarketPositions = require("./createNewMarketPositions")

// Set binance object as global variable
global.binance = binance;

// Define the symbol to monitor
const symbol = "IMXUSDT";
const symbolUrl = `wss://fstream.binance.com/ws/${symbol.toLowerCase()}@depth`;

// Create a WebSocket connection to the Binance API for the symbol
const ws = new WebSocket(symbolUrl);

// Define the size of each batch of trade data to process
const batchSize = 100;

// Define the time interval between each batch of trade data to process
const batchInterval = 10000; // 10 seconds

// Define a timer variable to keep track of the time between batches
let batchTimer = null;

// Define a message buffer to hold incoming trade data
const messages = [];

// Define a function to process each batch of trade data
async function processBatch() {
    // Clear the batch timer
    clearTimeout(batchTimer);
    batchTimer = null;

    console.log(`Processing batch of ${messages.length} trade data...`);

    // Get the user's balances and open positions
    const balancesAndPositionsRes = await getBalancesAndPositions(binance);

    if (!balancesAndPositionsRes) {
        console.error("Error: unable to fetch BalancesAndPositions", balancesAndPositionsRes);
        return;
    }
    const { positions, balances } = balancesAndPositionsRes;

    console.log(`Got user balances and positions. Balances: ${JSON.stringify(balances)}, Positions: ${JSON.stringify(positions)}`);

    // Analyze the market direction based on the batch of trade data
    const marketDirection = await analyzeMarketDirection(messages);

    console.log(`Analyzed market direction. Direction: ${marketDirection.marketDirection}`);

    // If the user has no open positions, create new ones based on the market direction
    if (!marketDirection.direction || !marketDirection.prices) {
        console.log(`Could not get market direction from current batch.`);
    }

    let createdOrder;
    // If the user has no open positions, create new ones based on the market direction
    if (positions.length === 0) {
        createdOrder = await createNewMarketPositions(marketDirection, balances);
        console.log(`Created new positions based on market direction.`);
    }

    if(createdOrder){
        const balancesAndPositionsRes = await getBalancesAndPositions(binance);
        const { positions, balances } = balancesAndPositionsRes;
        // Manage the user's open positions based on the market direction, with the new positions refetched
        managePositions(marketDirection, positions, balances);
    } else {
        managePositions(marketDirection, positions, balances);
    }
    

    console.log(`Managed positions based on market direction.`);

    // Clear the message buffer
    messages.length = 0;

    console.log(`Batch processed successfully.`);
}

// Define a function to start monitoring the symbol
module.exports = async function start() {
    console.log(`Starting to monitor symbol ${symbol}...`);

    // Initialize the WebSocket connection
    ws.on('open', () => console.log(`WebSocket connected to ${symbolUrl}`));

    // Add incoming trade data to the message buffer
    ws.on('message', async (message) => {
        messages.push(message);

        // console.log(`Received trade data message. Message: ${message}`);

        // If the message buffer is full, process the batch of trade data
        if (messages.length >= batchSize) {
            await processBatch();
        } else {
            // If the batch timer is not already running, start it
            if (batchTimer === null) {
                console.log(`Starting batch timer for next batch of trade data...`);
                batchTimer = setTimeout(processBatch, batchInterval);
            }
        }
    });

    // Catch any errors with the WebSocket connection
    ws.on('error', (error) => console.error(`WebSocket error: ${error.message}`));
    ws.on('close', (code, reason) => console.error(`WebSocket closed: ${code} - ${reason}`));

    console.log(`Monitoring symbol ${symbol} started successfully.`);

    // Run the processBatch function once initially to start the batch timer
    await processBatch();

}

// Start monitoring the symbol
// start().catch(console.error);