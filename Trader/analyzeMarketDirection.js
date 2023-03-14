// Convert messages to OHLC data
function convertToOHLC(messages) {
    // Assume messages are in chronological order
    const ohlcData = [];

    for (const message of messages) {
        const { E, T, s, a, b } = JSON.parse(message);

        if (b[0] && a[0]) {
            const [openPrice, , openTimestamp] = b[0];
            const [closePrice, , closeTimestamp] = a[0];
            const highPrice = a.reduce((max, [price]) => Math.max(max, parseFloat(price)), 0);
            const lowPrice = b.reduce((min, [price]) => Math.min(min, parseFloat(price)), Infinity);

            ohlcData.push({
                timestamp: T / 1000,
                open: parseFloat(openPrice),
                high: highPrice,
                low: lowPrice,
                close: parseFloat(closePrice),
                symbol: s
            });
        }
    }

    return ohlcData;
}



// Calculate moving average
function calculateMovingAverage(ohlcData, period) {
    const prices = ohlcData.map((d) => d.close);
    const ma = [];

    for (let i = period - 1; i < prices.length; i++) {
        const sum = prices.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val);
        const average = sum / period;
        ma.push(average);
    }

    return ma;
}

// Calculate trendlines
function calculateTrendlines(ohlcData) {
    const highs = ohlcData.map((d) => d.high);
    const lows = ohlcData.map((d) => d.low);

    // Calculate resistance line (drawn on highs)
    const resistancePoints = [];
    let resistanceSlope = 0;
    let resistanceIntercept = 0;
    let resistanceCount = 0;

    for (let i = 2; i < highs.length; i++) {
        const x1 = i - 2;
        const y1 = highs[i - 2];
        const x2 = i - 1;
        const y2 = highs[i - 1];
        const x3 = i;
        const y3 = highs[i];

        const s1 = (y2 - y1) / (x2 - x1);
        const s2 = (y3 - y2) / (x3 - x2);
        const slopeDiff = Math.abs(s1 - s2);

        if (slopeDiff < 0.1) {
            resistanceSlope = (resistanceSlope * resistanceCount + s2) / (resistanceCount + 1);
            resistanceIntercept = y2 - resistanceSlope * x2;
            resistanceCount++;
        } else if (resistanceCount > 1) {
            const startPoint = (y1 - resistanceIntercept) / resistanceSlope;
            const endPoint = (y3 - resistanceIntercept) / resistanceSlope;
            resistancePoints.push({ startPoint, endPoint });
            resistanceCount = 0;
        }
    }

    // Calculate support line (drawn on lows)
    const supportPoints = [];
    let supportSlope = 0;
    let supportIntercept = 0;
    let supportCount = 0;

    for (let i = 2; i < lows.length; i++) {
        const x1 = i - 2;
        const y1 = lows[i - 2];
        const x2 = i - 1;
        const y2 = lows[i - 1];
        const x3 = i;
        const y3 = lows[i];

        const s1 = (y2 - y1) / (x2 - x1);
        const s2 = (y3 - y2) / (x3 - x2);
        const slopeDiff = Math.abs(s1 - s2);

        if (slopeDiff < 0.1) {
            supportSlope = (supportSlope * supportCount + s2) / (supportCount + 1);
            supportIntercept = y2 - supportSlope * x2;
            supportCount++;
        } else if (supportCount > 1) {
            const startPoint = (y1 - supportIntercept) / supportSlope;
            const endPoint = (y3 - supportIntercept) / supportSlope;
            supportPoints.push({ startPoint, endPoint });
            supportCount = 0;
        }
    }

    return { resistance: resistancePoints, support: supportPoints };
}

// Calculate support and resistance levels
function calculateSupportResistanceLevels(ohlcData, trendlines, levelType) {
    const levels = [];

    if (levelType === 'resistance') {
        const points = trendlines.resistance;
        for (const point of points) {
            const { startPoint, endPoint } = point;
            const trendlineValues = calculateTrendlineValues(startPoint, endPoint, ohlcData);
            levels.push(Math.max(...trendlineValues));
        }
    } else if (levelType === 'support') {
        const points = trendlines.support;
        for (const point of points) {
            const { startPoint, endPoint } = point;
            const trendlineValues = calculateTrendlineValues(startPoint, endPoint, ohlcData);
            levels.push(Math.min(...trendlineValues));
        }
    }

    return levels;
}

// Helper function to calculate values on a trendline
function calculateTrendlineValues(startPoint, endPoint, ohlcData) {
    const slope = (endPoint - startPoint) / (ohlcData.length - 1);
    const intercept = startPoint - slope;
    const trendlineValues = [];

    for (const d of ohlcData) {
        const value = slope * d.timestamp + intercept;
        trendlineValues.push(value);
    }

    return trendlineValues;
}

// Calculate Bollinger Bands
function calculateBollingerBands(ohlcData, period = 20, stdDev = 2) {
    const prices = ohlcData.map((d) => d.close);
    const ma = calculateMovingAverage(ohlcData, period);
    const upper = [];
    const lower = [];

    for (let i = period - 1; i < prices.length; i++) {
        const stdDeviation = stdDev * calculateStandardDeviation(prices.slice(i - period + 1, i + 1), ma[ma.length - 1]);
        const upperBand = ma[ma.length - 1] + stdDeviation;
        const lowerBand = ma[ma.length - 1] - stdDeviation;
        upper.push(upperBand);
        lower.push(lowerBand);
    }

    return { upper, lower };
}

// Calculate MACD line
function calculateMACDLine(ohlcData, shortPeriod = 12, longPeriod = 26) {
    const prices = ohlcData.map((d) => d.close);
    const shortEMA = calculateEMA(prices, shortPeriod);
    const longEMA = calculateEMA(prices, longPeriod);
    const macdLine = [];

    for (let i = longEMA.length - 1; i < prices.length; i++) {
        const shortSide = shortEMA[i - longEMA.length + 1];
        const longSide = longEMA[i - longEMA.length + 1];
        const macd = Number(shortSide) - Number(longSide);
        macdLine.push(macd);
    }

    return macdLine;
}


// Calculate signal line
function calculateSignalLine(macdLine, period = 9) {
    const signalLine = calculateEMA(macdLine, period);
    return signalLine;
}

// Calculate RSI line
function calculateRSILine(ohlcData, period = 14) {
    const prices = ohlcData.map((d) => d.close);
    const gains = [];
    const losses = [];
    const rs = [];
    const rsiLine = [];

    for (let i = 1; i < prices.length; i++) {
        const diff = prices[i] - prices[i - 1];
        if (diff > 0) {
            gains.push(diff);
            losses.push(0);
        } else {
            gains.push(0);
            losses.push(Math.abs(diff));
        }
    }

    for (let i = period; i <= prices.length; i++) {
        const avgGain = gains.slice(i - period, i).reduce((acc, val) => acc + val) / period;
        const avgLoss = losses.slice(i - period, i).reduce((acc, val) => acc + val) / period;
        const rsValue = avgGain / avgLoss;
        rs.push(rsValue);
    }

    for (let i = 0; i < rs.length; i++) {
        const rsi = 100 - (100 / (1 + rs[i]));
        rsiLine.push(rsi);
    }

    return rsiLine;
}

// Calculate volatility using Lorentzian function
function calculateVolatility(ohlcData, period = 24) {
    if (ohlcData.length < 2) {
        return [];
    }

    const prices = ohlcData.map((d) => d.close);
    const diffs = [];

    for (let i = 1; i < prices.length; i++) {
        const diff = prices[i] - prices[i - 1];
        diffs.push(diff);
    }

    const meanDiff = diffs.reduce((acc, val) => acc + val) / diffs.length;
    const stdDeviation = calculateStandardDeviation(diffs, meanDiff);
    const volatility = [];

    for (let i = period - 1; i < diffs.length; i++) {
        const slice = diffs.slice(i - period + 1, i + 1);
        const average = slice.reduce((acc, val) => acc + val) / slice.length;
        const lorentzian = 1 / (1 + Math.pow((average / stdDeviation), 2));
        volatility.push(lorentzian);
    }

    return volatility;
}

// Calculate exponential moving average
function calculateEMA(prices, period) {
    const multiplier = 2 / (period + 1);
    const ema = [];
    let currentEMA = prices[period - 1];

    for (let i = period; i < prices.length; i++) {
        currentEMA = (prices[i] - currentEMA) * multiplier + currentEMA;
        ema.push(currentEMA);
    }

    return ema;
}

// Calculate standard deviation
function calculateStandardDeviation(values, mean) {
    const diffs = values.map((val) => val - mean);
    const squaredDiffs = diffs.map((diff) => diff * diff);
    const avgSquaredDiff = squaredDiffs.reduce((acc, val) => acc + val) / squaredDiffs.length;
    const stdDeviation = Math.sqrt(avgSquaredDiff);
    return stdDeviation;
}

module.exports = function analyzeMarketDirection(messages) {
    // Convert messages to OHLC data (open, high, low, close)
    const ohlcData = convertToOHLC(messages);

    // Return early with a neutral market direction if there is no OHLC data
    if (ohlcData.length === 0) {
        return {
            symbol: null,
            prices: null,
            ohlcData: null,
            movingAverages: {
                ma50: [],
                ma200: [],
            },
            supportResistanceLevels: {
                support: [],
                resistance: [],
            },
            bollingerBands: {
                upper: [],
                lower: [],
            },
            macd: {
                macdLine: [],
                signalLine: [],
            },
            rsi: {
                rsiLine: [],
            },
            volatility: [],
            marketDirection: 'neutral',
        };
    }


    let symbol;
    const prices = messages.map(message => {
        const parsedMessage = JSON.parse(message);
        if (parsedMessage.e === 'depthUpdate') {
            const bids = parsedMessage.b.map(bid => Number(bid[0]));
            const asks = parsedMessage.a.map(ask => Number(ask[0]));
            symbol = parsedMessage.s
            return { bids, asks };
        } else {
            return null;
        }
    }).filter(Boolean);

    // Calculate moving averages (50-hour and 200-hour)
    const ma50 = calculateMovingAverage(ohlcData, 50);
    const ma200 = calculateMovingAverage(ohlcData, 200);

    // Calculate support and resistance levels
    const trendlines = calculateTrendlines(ohlcData);
    const supportLevels = calculateSupportResistanceLevels(ohlcData, trendlines, 'support');
    const resistanceLevels = calculateSupportResistanceLevels(ohlcData, trendlines, 'resistance');

    // Calculate Bollinger Bands
    const bollingerBands = calculateBollingerBands(ohlcData);

    // Calculate MACD line and signal line
    const macdLine = calculateMACDLine(ohlcData);
    const signalLine = calculateSignalLine(macdLine);

    // Calculate RSI line
    const rsiLine = calculateRSILine(ohlcData);

    // Calculate Lorentzian function
    const volatility = calculateVolatility(ohlcData);

    // Combine all data into single object
    const marketData = {
        symbol,
        prices,
        ohlcData,
        movingAverages: {
            ma50,
            ma200,
        },
        supportResistanceLevels: {
            support: supportLevels,
            resistance: resistanceLevels,
        },
        bollingerBands,
        macd: {
            macdLine,
            signalLine,
        },
        rsi: {
            rsiLine,
        },
        volatility,
    };


    // Determine market direction based on analysis
    let marketDirection = 'neutral';

    if (ma50[ma50.length - 1] > ma200[ma200.length - 1]) {
        marketDirection = 'bullish';
    } else if (ma50[ma50.length - 1] < ma200[ma200.length - 1]) {
        marketDirection = 'bearish';
    }

    if (ohlcData[ohlcData.length - 1].close > resistanceLevels[0]) {
        marketDirection = 'bullish';
    } else if (ohlcData[ohlcData.length - 1].close < supportLevels[0]) {
        marketDirection = 'bearish';
    }

    if (ohlcData[ohlcData.length - 1].close > bollingerBands.upper[0]) {
        marketDirection = 'overbought';
    } else if (ohlcData[ohlcData.length - 1].close < bollingerBands.lower[0]) {
        marketDirection = 'oversold';
    }

    if (macdLine[macdLine.length - 1] > signalLine[signalLine.length - 1]) {
        marketDirection = 'bullish';
    } else if (macdLine[macdLine.length - 1] < signalLine[signalLine.length - 1]) {
        marketDirection = 'bearish';
    }

    if (rsiLine[rsiLine.length - 1] > 70) {
        marketDirection = 'overbought';
    } else if (rsiLine[rsiLine.length - 1] < 30) {
        marketDirection = 'oversold';
    }

    marketData.marketDirection = marketDirection;

    return marketData;
}
