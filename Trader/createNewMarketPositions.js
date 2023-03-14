const executeOrder = require("./executeOrder")

async function calculatePositionSize(currentPrice, balance, leverage = 20) {
  const maxPositionSize = balance * leverage;
  const positionSize = Math.floor(maxPositionSize / currentPrice);

  return positionSize;
}

module.exports = async function createNewMarketPositions(marketDirection, balances) {
  return new Promise(async (resolve, reject)=>{
    console.log(`Attempting to create new market position for ${marketDirection.marketDirection} market direction`);

  const { symbol, prices } = marketDirection;
  const baseAsset = "USDT";
  const baseAssetBalance = parseFloat(balances.find(b => b.asset === baseAsset)?.availableBalance);
  if (!baseAssetBalance || isNaN(baseAssetBalance)) {
    console.log(`Error: No valid USDT balance found in balances array`);
    return;
  }
  console.log(`Base asset balance: ${baseAssetBalance.toFixed(2)} ${baseAsset}`);

  const currentPrice = prices && parseFloat(prices[0]?.bids[0] || prices[0]?.asks[0]);
  if (!currentPrice || isNaN(currentPrice)) {
    console.log(`Error: No valid ${symbol} price found in prices array`);
    return;
  }
  console.log(`Current ${symbol} price: ${currentPrice}`);

  if (marketDirection.marketDirection === 'bullish' || marketDirection.marketDirection === 'overbought') {
    const usableBalance = (baseAssetBalance * 0.1);
    console.log(`Usable balance: ${usableBalance.toFixed(2)} ${baseAsset}`);
    const positionSize = await calculatePositionSize(currentPrice, usableBalance);
    if (!positionSize || isNaN(positionSize)) {
      console.log(`Error: Could not calculate a valid position size`);
      return;
    }
    console.log(`Position size: ${positionSize.toFixed(4)} ${symbol}`);

    let order = {
      symbol,
      side: 'buy',
      type: 'market',
      quantity: positionSize,
      price: currentPrice
    };
    console.log(`Placing ${symbol} buy order: ${JSON.stringify(order)}`);
    let orderResponse = await executeOrder(order)
    resolve(orderResponse);
    console.log(`Buy order for ${order.origQty} ${symbol} executed at ${order.price}`);
  } else if (marketDirection.marketDirection === 'bearish' || marketDirection.marketDirection === 'oversold') {
    const usableBalance = (baseAssetBalance * 0.3);
    console.log(`Usable balance: ${usableBalance.toFixed(2)} ${baseAsset}`);
    const positionSize = await calculatePositionSize(currentPrice, usableBalance);
    if (!positionSize || isNaN(positionSize)) {
      console.log(`Error: Could not calculate a valid position size`);
      return;
    }
    console.log(`Position size: ${positionSize.toFixed(4)} ${symbol}`);

    const order = {
      symbol,
      side: 'sell',
      type: 'market',
      quantity: positionSize,
      price: currentPrice
    };
    console.log(`Placing ${symbol} sell order: ${JSON.stringify(order)}`);
    let orderResponse = await executeOrder(order)
    resolve(orderResponse);
    console.log(`Sell order for ${order.quantity} ${symbol} executed at ${order.price}`);
  } else {
    console.log(`No action taken: Invalid market direction`);
    return;
  }

  console.log(`Completed running createNewMarketPositions function`);
  })
}
