const axios = require('axios');
const crypto = require('crypto');
const qs = require('qs');
const debounce = require('./utils/debounce');

const { BINANCE_API_KEY, BINANCE_SECRET_KEY } = process.env;

// By setting a debounce time of 1 second (1000ms), we ensure that the function won't be called more frequently than once per second. 
// This should help to reduce the number of requests being made to the Binance API.

const assetInfoCache = {};
const contractSizeCache = {};

const getAssetInfo = async function (symbol) {
    // Check if the response is already cached
    if (assetInfoCache[symbol]) {
        return Promise.resolve(assetInfoCache[symbol]);
    }

    try {
        const response = await axios({
            method: 'GET',
            url: 'https://fapi.binance.com/fapi/v1/exchangeInfo',
        });

        const { symbols } = response.data;
        const symbolInfo = symbols.find(s => s.symbol === symbol);

        if (!symbolInfo.baseAssetPrecision) {
            console.log(symbolInfo);
        }

        // Store the response in the cache
        assetInfoCache[symbol] = {
            basePrecision: symbolInfo.baseAssetPrecision,
            quotePrecision: symbolInfo.quotePrecision,
        };

        return Promise.resolve(assetInfoCache[symbol]);
    } catch (error) {
        console.error(`Error getting asset info: ${error}`);
        throw error;
    }
}

async function getContractSize(symbol) {
    // Check if the response is already cached
    if (contractSizeCache[symbol]) {
        return Promise.resolve(contractSizeCache[symbol]);
    }

    try {
        const exchangeInfo = await global.binance.futuresExchangeInfo();
        const symbolInfo = exchangeInfo.symbols.find(s => s.symbol === symbol);
        const contractSize = symbolInfo.contractSize;

        // Store the response in the cache
        contractSizeCache[symbol] = contractSize;

        return Promise.resolve(contractSizeCache[symbol]);
    } catch (error) {
        console.error(`Error getting contract size: ${error}`);
        throw error;
    }
}

const getAssetInfoDebounced = getAssetInfo
const getContractSizeDebounced = getContractSize



module.exports = async function executeOrder(order) {
    const { symbol, side, type, quantity, price, orderToClosePosition,  } = order;

    // Get asset precision and minimum notional value
    const assetInfo = await getAssetInfoDebounced(symbol);
    const { basePrecision, quotePrecision, minNotional } = assetInfo
    const qtyPrecision = parseFloat(basePrecision);
    const pricePrecision = parseFloat(quotePrecision);

    // Get available balance and calculate risk amount
    const { availableBalance } = await global.binance.futuresAccount();
    const riskPercentage = 0.3; // Risk 30% of available balance
    const riskAmount = availableBalance * riskPercentage; // Example risk amount
    const leverage = 20; // Example leverage
    const currentPrice = order.stopPrice || order.price;
    let positionSize = Math.floor((riskAmount * leverage) / currentPrice);

    if(orderToClosePosition === true){
        positionSize = order.quantity
    }

    // Round quantity and price to appropriate precision
    const roundedPositionSize = parseFloat(positionSize.toFixed(qtyPrecision));
    const roundedPrice = parseFloat(currentPrice.toFixed(pricePrecision));

    const minTradeSize = Math.pow(riskAmount, -qtyPrecision);

    // Set a minimum position size based on the minimum trade size
    const minPositionSize = Math.ceil(minTradeSize * currentPrice * leverage);
    if (positionSize < minPositionSize) {
        positionSize = minPositionSize;
    }

    const symbolInfoResponse = await global.binance.futuresExchangeInfo(symbol);
    const symbolInfo = symbolInfoResponse.symbols.filter(({ symbol }) => symbol === symbol)[0]
    const lotSizeFilter = symbolInfo.filters.find(filter => filter.filterType === 'LOT_SIZE');
    const minQty = parseFloat(lotSizeFilter.minQty);
    const maxQty = parseFloat(lotSizeFilter.maxQty);
    const minimumAllowedQuantity = Math.max(minQty, 1);
    const maximumQuantity = Math.floor(Number(availableBalance) / currentPrice / leverage / minQty) * minQty;

    // Execute the order
    const { serverTime: timestamp } = await global.binance.futuresTime();

    
    let response = null;
    if (type.toUpperCase() === 'MARKET') {
        if (side.toUpperCase() === 'BUY') {
            // Buy the asset
            response = await global.binance.futuresMarketBuy(symbol, roundedPositionSize, {
                leverage,
                stopPrice: order.stopPrice,
                workingType: 'MARK_PRICE',
                activationPrice: order.stopPrice
            });
        } else if (side.toUpperCase() === 'SELL') {
            // Sell the asset
            response = await global.binance.futuresMarketSell(symbol, roundedPositionSize, {
                leverage,
                stopPrice: order.stopPrice,
                workingType: 'MARK_PRICE',
                activationPrice: order.stopPrice
            });
        }
    } else if (type.toUpperCase() === 'LIMIT') {
        if (side.toUpperCase() === 'BUY') {
            // Buy the asset
            response = await global.binance.futuresBuy(symbol, roundedPositionSize, roundedPrice, {
                leverage,
                stopPrice: order.stopPrice,
                workingType: 'MARK_PRICE',
                activationPrice: order.stopPrice
            });
        } else if (side.toUpperCase() === 'SELL') {
            // Sell the asset
            response = await global.binance.futuresSell(symbol, roundedPositionSize, roundedPrice, {
                leverage,
                stopPrice: order.stopPrice
            })
        } else if (type === 'LIMIT') {
            if (side.toUpperCase() === 'BUY') {
                // Buy the asset
                response = await global.binance.futuresBuy(symbol, roundedPositionSize, roundedPrice, {
                    leverage,
                    stopPrice: order.stopPrice,
                    workingType: 'MARK_PRICE',
                    activationPrice: order.stopPrice
                });
            } else if (side.toUpperCase() === 'SELL') {
                // Sell the asset
                response = await global.binance.futuresSell(symbol, roundedPositionSize, roundedPrice, {
                    leverage,
                    stopPrice: order.stopPrice,
                    workingType: 'MARK_PRICE',
                    activationPrice: order.stopPrice
                });
            }
        }

        console.log(`Order executed for symbol ${symbol}:`, response);
        return response;
    }

    if (!response) {
        return console.error("Unable to get any execution response", response)
    }


    if (response && response.code) {
        return console.error("Error placing order", response.msg, order)
    }

    if (response && response.code) {
        return console.error("Error placing order", response.msg, order)
    }

    // Log the order execution details
    const { orderId, status, price: executedPrice, origQty } = response;
    console.log(`Order executed: ${orderId}`)
    console.log(`Status: ${status}`);
    // console.log(`Executed price: ${executedPrice}`);
    console.log(`Quantity: ${origQty}`);
}
