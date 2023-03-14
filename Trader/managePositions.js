const YAML = require('json-to-pretty-yaml');
const sms = require("../client/utils/sms")

const executeOrder = require('./executeOrder');
const trailingDistance = 0.02; // 2%

async function getCurrentPrice(symbol) {
  return new Promise(async (resolve, reject) => {
    try {
      binance.futuresTickerStream(symbol, ticker => {
        const currentPrice = parseFloat(ticker.close);
        resolve(currentPrice)
      });
    } catch (error) {
      console.error(`Error getting current price for symbol ${symbol}: ${error.message}`);
      throw error;
    }
  })
}


async function getOpenOrders(symbol) {
  try {
    const openOrders = await global.binance.futuresOpenOrders(symbol);
    console.log(`Open orders for symbol ${symbol}:`, openOrders);
    return openOrders;
  } catch (error) {
    console.error(`Error getting open orders for symbol ${symbol}: ${error.message}`);
    throw error;
  }
}

function calculateNewStopPrice(marketDirection, currentPrice, entryPrice, trailingDistance) {
  const diff = currentPrice - entryPrice;
  const stopPrice = marketDirection === 'up' ? currentPrice - (diff * trailingDistance) : currentPrice + (diff * trailingDistance);
  return stopPrice;
}

module.exports = async function manageOrders(marketDirection, positions, balances) {
  const profitThreshold = 0.03; // 3%
  const lossThreshold = -0.02; // 7%
  const closeThreshold = -0.5; // 10%

  if (!positions[0]) {
    console.log('No positions to manage.');
    return;
  }

  const symbol = positions[0].symbol;
  console.log(`Managing orders for symbol ${symbol}...`);

  // Loop through each position
  for (let i = 0; i < positions.length; i++) {
    const position = positions[i];
    const { entryPrice, side = 'BOTH', positionAmt, unRealizedProfit, isHedged, markPrice, notional, leverage } = position;
    const quantity = Math.abs(positionAmt);
    const initialMargin = (Number(notional) / Number(leverage)) / Number(entryPrice);

    console.log(`Processing position for symbol ${symbol}, entry price: ${entryPrice}, side: ${side}, quantity: ${quantity}`);

    const shouldTakeProfits = Number(unRealizedProfit) / quantity > profitThreshold;
    const shouldHedgePosition = Number(unRealizedProfit) / quantity < lossThreshold;
    const shouldClosePosition = Number(unRealizedProfit) / quantity < closeThreshold;

    const { availableBalance } = await global.binance.futuresAccount();
    let order = null;
    switch (true) {
      case shouldClosePosition && initialMargin < Number(availableBalance):
        // Close the position
        order = createMarketOrder(symbol, getHedgeSide(side), quantity);
        console.log(`Closing position for symbol ${symbol}:`, order);
        await executeOrder(order);
        console.log(`Position for symbol ${symbol} closed.`);
        break;

      case shouldHedgePosition && !isHedged && canHedge():
        // Hedge the position
        order = createMarketOrder(symbol, getHedgeSide(side), quantity);
        console.log(`Hedging position for symbol ${symbol}:`, order);
        await executeOrder(order);
        console.log(`Position for symbol ${symbol} hedged.`);
        break;

      case shouldTakeProfits:
        // Take profits on the position
        order = createMarketOrder(symbol, getHedgeSide(side), quantity);
        order.price = await getCurrentPrice(order.symbol)
        console.log(`Taking profits on position for symbol ${symbol}:`, order);

        const breakevenPriceForProfits = Number(entryPrice) + Number(unRealizedProfit) / quantity;
        const targetPrice = breakevenPriceForProfits + 1;
        if (order.side === 'BUY' && targetPrice <= order.price || order.side === 'SELL' && targetPrice >= order.price) {
          // Close the position
          const orderToClosePosition = {
            symbol: symbol,
            side: position.side === 'LONG' ? 'SELL' : 'BUY',
            type: 'LIMIT',
            quantity: quantity,
            price: targetPrice.toFixed(2)
          }
          console.log(`Closing position for symbol ${symbol}:`, orderToClosePosition);
          await executeOrder(orderToClosePosition);
          console.log(`Profits taken on position for symbol ${symbol}.`);
        } else {
          console.log(`Waiting for price to reach target for symbol ${symbol}. Target price: ${targetPrice.toFixed(2)}, current price: ${order.price.toFixed(2)}`);
        }
        break;

      default:
        const roe = (Number(unRealizedProfit) / (Number(notional) / Number(leverage))) * 100;
        const lossPerContract = Number(unRealizedProfit) / quantity;
        console.log(`Position for symbol ${symbol} is within the profit/loss $${lossPerContract.toFixed(5)} per contract thresholds. No need to close or take profits on, waiting. unRealizedProfit: $${Number(unRealizedProfit).toFixed(2)}(${roe.toFixed(2)}% KES${Number(unRealizedProfit).toFixed(2) * 121})`);

        // Determine the breakeven price for the position

        const breakevenPrice = Number((Number(entryPrice) + Number(unRealizedProfit) / Number(positionAmt)).toFixed(4));
        const currentPrice = await getCurrentPrice(symbol);
        const hasBrokenEvenYet = (breakevenPrice < currentPrice);
        const positionValue = Number(notional) + Number(positionAmt) * currentPrice;
        const breakevenPositionValue = Number(positionAmt) * breakevenPrice;
        console.log(`Position for symbol ${symbol}:
        - Entry price: ${Number(entryPrice).toFixed(4)}
        - Quantity: ${quantity}
        - Current price: ${currentPrice}
        - Unrealized PNL: ${Number(unRealizedProfit).toFixed(4)}
        - Position value: $${positionValue.toFixed(4)}
        - Unrealized PNL value: $${Number(unRealizedProfit).toFixed(4)}
        - Breakeven price: $${breakevenPrice.toFixed(4)}
        - Breakeven position value: $${breakevenPositionValue.toFixed(4)}
        - Has broken even yet? ${hasBrokenEvenYet}
        - Amount Above break even? ${breakevenPrice - currentPrice}
        - Notional: ${Number(notional).toFixed(4)}
        - Leverage: ${leverage}
        `);

        // Check if the position has an overall profit of $1 or more
        if (hasBrokenEvenYet && Number(unRealizedProfit) > 4) {
          // Check if the available balance is sufficient to close the position
          const { availableBalance } = await global.binance.futuresAccount();
          // if (initialMargin < Number(availableBalance)) {
          // Close the position with the current quantity

          const sideToClose = Number(positionAmt) > 0 ? 'SELL' : 'BUY';
          const order = {
            symbol,
            side: sideToClose,
            type: 'MARKET',
            quantity: Math.abs(Number(positionAmt))
          }

          console.log(`Closing position for symbol ${symbol}:`, order);
          order.price = await getCurrentPrice(order.symbol);
          order.orderToClosePosition = true
          await executeOrder(order);
          console.log(`Position for symbol ${symbol} closed with an overall profit of $1.`);

          const { availableBalance:newAvailableBalance } = await global.binance.futuresAccount();
          const message = YAML.stringify({ message: `Closing position for symbol ${symbol} with unRealizedProfit: $${unRealizedProfit}, newAvailableBalance: $${newAvailableBalance}`, order })
          console.log(message.length, message)
          sms({
            phone: "+254711657108",
            message
          }, console.log)
          // } else {
          //   console.error("InitialMargin is < availableBalance, add balance to account to close this position")
          // }
        }

        break;

        function canHedge() {
          // Check if the account has sufficient funds to open a hedged position
          return initialMargin < balances.walletBalance;
        }


    }
  }

}


function createMarketOrder(symbol, side, quantity) {
  // Create a market order object
  return {
    symbol,
    side,
    type: 'MARKET',
    quantity
  };
}

function createLimitOrder(symbol, side, quantity, price) {
  // Create a limit order object
  return {
    symbol,
    side,
    type: 'LIMIT',
    quantity,
    price
  };
}

function getHedgeSide(side) {
  // Determine the opposite side for hedging
  return side === 'long' ? 'sell' : 'buy';
}

function getCancelSide(side) {
  // Determine the opposite side for hedging
  return side === 'long' ? 'sell' : 'buy';
}


