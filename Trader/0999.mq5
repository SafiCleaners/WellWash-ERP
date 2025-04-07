#property copyright "Lucas Mariano Vieira"
#property link      "https://www.mql5.com"
#property version   "1.00"

// Input parameters
input int MAPeriodShort = 9;              // Short MA period
input int MAPeriodLong = 21;              // Long MA period
input int MAShift = 0;                    // MA shift
input ENUM_MA_METHOD MAMethodS = MODE_SMA; // Short MA method
input ENUM_MA_METHOD MAMethodL = MODE_SMA; // Long MA method
input ENUM_APPLIED_PRICE MAPrice = PRICE_CLOSE; // MA applied price

input double rewardRatio = 2.0;           // Reward-to-risk ratio (2:1)
input double fixedVolume = 2;          // Fixed lot size for debugging
input int slDistancePoints = 240;         // Stop loss distance in points
input int tpDistancePoints = 120;         // Take profit distance in points


// Configuration parameters
input int trailingTPDistance = 30;     // Distance (in points) to trail the Take Profit (TP) level behind the current market price
input double trailingSLDistance = 240.0; // Distance (in points) to trail the Stop Loss (SL) level behind the current market price
input double minProfitToMoveSL = 140.0; // Minimum profit (in points) required to move the Stop Loss (SL) to breakeven or start trailing

ulong magicNumber = 0; // Magic number for trade identification (set to 0 to auto-generate)

// Enum for order type
enum orderType {
   orderBuy,
   orderSell,
   orderNone
};

// Global variables
datetime candleTimes[], lastCandleTime;
MqlTradeRequest request;
MqlTradeResult result;
MqlTradeCheckResult checkResult;

// Global variable to track the time when a trade is opened
datetime tradeOpenTime = 0;

// Function to check if the trade is too new to apply a stop-loss
bool isTradeTooNew() {
    if (tradeOpenTime == 0) return false; // No trade opened yet
    datetime currentTime = TimeCurrent();
    double minutesSinceOpen = (currentTime - tradeOpenTime) / 60.0; // Convert to minutes
    return minutesSinceOpen < 2; // Disable SL for the first 2 minutes
}


// Function to check for a new candle
bool checkNewCandle(datetime &candles[], datetime &last) {
    bool newCandle = false;
    CopyTime(_Symbol, _Period, 0, 1, candles); // Copy only the latest candle time

    if (last != 0) {
        if (candles[0] > last) {
            newCandle = true;
            last = candles[0];
            //Print("New 1-minute candle detected! Time: ", TimeToString(candles[0]));
        }
    } else {
        last = candles[0];
        Print("First 1-minute candle detected! Time: ", TimeToString(candles[0]));
    }

    return newCandle;
}



// Global or static variables
int sarHandle = -1; // Parabolic SAR handle (no longer used)
int maxStepBackPoints = 300; // Maximum points to step back the SL (configurable)

// Global or static variables
bool slMoved = false;
datetime lastSLMoveTime = 0;
double originalSL = 0; // Store the original SL
double initialProfitMove = 0; // Store the initial profit move


// Strategy parameters
double initialSL = 0;
double initialTP = 0;
double lastSL = 0;
double lastTP = 0;

void updateTrailingSL() {
    if (!PositionSelect(_Symbol)) {
        Print("No position found for symbol: ", _Symbol);
        return;
    }

    // Get position details
    long positionType = PositionGetInteger(POSITION_TYPE);
    double currentPrice = PositionGetDouble(POSITION_PRICE_OPEN);
    double currentSL = PositionGetDouble(POSITION_SL);
    double currentTP = PositionGetDouble(POSITION_TP);
    double pointValue = SymbolInfoDouble(_Symbol, SYMBOL_POINT);
    double currentMarketPrice = (positionType == POSITION_TYPE_BUY) 
        ? SymbolInfoDouble(_Symbol, SYMBOL_BID) 
        : SymbolInfoDouble(_Symbol, SYMBOL_ASK);

    // Calculate current profit in points
    double currentProfitPoints = (positionType == POSITION_TYPE_BUY) 
        ? (currentMarketPrice - currentPrice) / pointValue 
        : (currentPrice - currentMarketPrice) / pointValue;

    // Initialize initial SL and TP if not already set
    if (initialSL == 0) {
        initialSL = currentSL;
        Print("Initialized initial SL to: ", initialSL);
    }
    if (initialTP == 0) {
        initialTP = currentTP;
        Print("Initialized initial TP to: ", initialTP);
    }

    // Log current state
    Print("Current Price: ", currentPrice);
    Print("Current Market Price: ", currentMarketPrice);
    Print("Current Profit: ", currentProfitPoints, " points");
    Print("Current SL: ", currentSL);
    Print("Min Profit to Move SL: ", minProfitToMoveSL, " points");
    Print("Trailing SL Distance: ", trailingSLDistance, " points");

    // Check if position is in profit and meets the minimum profit threshold
    if (currentProfitPoints > minProfitToMoveSL) {
        Print("Position is profitable enough to potentially move SL");

        // Calculate new SL based on fixed distance
        double newSL = (positionType == POSITION_TYPE_BUY) 
            ? currentMarketPrice - (trailingSLDistance * pointValue) 
            : currentMarketPrice + (trailingSLDistance * pointValue);

        // Ensure SL does not move beyond initial SL
        if (positionType == POSITION_TYPE_BUY && newSL < initialSL) {
            newSL = initialSL;
            Print("SL cannot be moved below initial SL");
        } else if (positionType == POSITION_TYPE_SELL && newSL > initialSL) {
            newSL = initialSL;
            Print("SL cannot be moved above initial SL");
        }

        // Update SL only if it is moving in the right direction
        if ((positionType == POSITION_TYPE_BUY && newSL > currentSL) || 
            (positionType == POSITION_TYPE_SELL && newSL < currentSL)) {

            Print("Attempting to update SL from ", currentSL, " to ", newSL);

            // Try to update SL to the desired level
            if (!updateSL(newSL, currentTP)) {
                Print("Failed to update SL. Adjusting SL to broker-allowed level...");

                // Calculate the minimum allowed SL distance
                int minStopLevel = (int)SymbolInfoInteger(_Symbol, SYMBOL_TRADE_STOPS_LEVEL);
                double minStopDistance = minStopLevel * pointValue;

                // Adjust SL to the closest allowed level
                double adjustedSL = (positionType == POSITION_TYPE_BUY) 
                    ? currentMarketPrice - minStopDistance 
                    : currentMarketPrice + minStopDistance;

                // Ensure the adjusted SL does not violate the initial SL constraint
                if (positionType == POSITION_TYPE_BUY && adjustedSL < initialSL) {
                    adjustedSL = initialSL;
                    Print("Adjusted SL cannot be moved below initial SL");
                } else if (positionType == POSITION_TYPE_SELL && adjustedSL > initialSL) {
                    adjustedSL = initialSL;
                    Print("Adjusted SL cannot be moved above initial SL");
                }

                // Retry updating SL with the adjusted level
                if (!updateSL(adjustedSL, currentTP)) {
                    Print("Failed to update SL even after adjustment. Leaving SL in place since the position is in profit.");
                } else {
                    Print("Successfully updated SL to broker-allowed level: ", adjustedSL);
                }
            } else {
                Print("Successfully updated SL to: ", newSL);
            }
        } else {
            Print("SL not updated - moving in wrong direction");
        }
    }
    else if (currentProfitPoints < 0) {
        Print("Position is in loss");
        // Determine if the market price is near the initial SL
        bool isNearSL = (positionType == POSITION_TYPE_BUY && currentMarketPrice - initialSL < (trailingSLDistance * pointValue)) ||
                         (positionType == POSITION_TYPE_SELL && initialSL - currentMarketPrice < (trailingSLDistance * pointValue));

        if (isNearSL) {
            Print("Market price is near initial SL");
            // Check the current trend direction
            orderType trend = determineTrendDirection();
            if (trend == positionType) {
                Print("Trend is still favorable, adjusting SL further");
                // Trend is still favorable, move SL further to give more room
                double newSL = (positionType == POSITION_TYPE_BUY) 
                    ? initialSL - (trailingSLDistance * pointValue)
                    : initialSL + (trailingSLDistance * pointValue);

                // Ensure SL does not go beyond initial constraints
                if (positionType == POSITION_TYPE_BUY && newSL < currentSL) {
                    newSL = currentSL;
                    Print("SL cannot be moved below current SL");
                } else if (positionType == POSITION_TYPE_SELL && newSL > currentSL) {
                    newSL = currentSL;
                    Print("SL cannot be moved above current SL");
                }

                // Update SL only if moving in the right direction
                if ((positionType == POSITION_TYPE_BUY && newSL < currentSL) || 
                    (positionType == POSITION_TYPE_SELL && newSL > currentSL)) {

                    Print("Adjusting SL from ", currentSL, " to ", newSL);
                    if (!updateSL(newSL, currentTP)) {
                        Print("Failed to adjust SL while in loss. Removing SL to give the position more room.");
                        removeSL(currentTP); // Remove SL only if the position is in loss
                    } else {
                        Print("SL adjusted while in loss to prevent premature closing.");
                    }
                } else {
                    Print("SL not adjusted - moving in wrong direction");
                }
            }
            // else, trend is not favorable, do not adjust SL
        }
    }
    else {
        Print("Position is not yet profitable enough to move SL");
        Print("Current Profit: ", currentProfitPoints, " points");
        Print("Min Profit to Move SL: ", minProfitToMoveSL, " points");
    }
}


// Function to update trailing take profit using fixed distance
void updateTrailingTP() {
    if (!PositionSelect(_Symbol)) {
        Print("No position selected for ", _Symbol, ". Skipping TP update.");
        return;
    }

    // Get position details
    long positionType = PositionGetInteger(POSITION_TYPE);
    double currentPrice = PositionGetDouble(POSITION_PRICE_OPEN);
    double currentSL = PositionGetDouble(POSITION_SL);
    double currentTP = PositionGetDouble(POSITION_TP);
    double pointValue = SymbolInfoDouble(_Symbol, SYMBOL_POINT);
    double currentMarketPrice = (positionType == POSITION_TYPE_BUY) 
        ? SymbolInfoDouble(_Symbol, SYMBOL_BID) 
        : SymbolInfoDouble(_Symbol, SYMBOL_ASK);

    double currentProfit = (positionType == POSITION_TYPE_BUY) 
        ? (currentMarketPrice - currentPrice) 
        : (currentPrice - currentMarketPrice);

    // Initialize initial TP if not already set
    if (initialTP == 0) {
        initialTP = currentTP;
    }

    // Only update TP if the position is profitable and exceeds the minimum profit threshold
    if (currentProfit > (minProfitToMoveSL * pointValue)) {
        // Calculate new TP based on fixed distance
        double newTP = (positionType == POSITION_TYPE_BUY) 
            ? currentMarketPrice + (trailingTPDistance * pointValue) 
            : currentMarketPrice - (trailingTPDistance * pointValue);

        // Ensure TP is valid
        if (newTP != currentTP) {
            if (!updateSL(currentSL, newTP)) {
                Print("Failed to update TP. Removing TP entirely.");
                removeSL(currentSL);
            }
        }
    }

    // Move SL to breakeven once we have enough profit
    if (currentProfit <  0){// (minProfitToMoveSL * pointValue)) {
        double breakevenSL = currentPrice;

        if (currentSL != breakevenSL) {
            if (!updateSL(breakevenSL, currentTP)) {
                Print("Failed to update SL to breakeven. Removing TP.");
                //removeSL(currentTP);
            } else {
                lastSL = breakevenSL;
            }
        }
    }
}

// Helper function to update SL
bool updateSL(double newSL, double tp) {
    MqlTradeRequest request;
    MqlTradeResult result;
    ZeroMemory(request);
    request.action = TRADE_ACTION_SLTP; 
    request.symbol = _Symbol;
    request.sl = newSL;
    request.tp = NormalizeDouble(tp, _Digits);
    request.position = PositionGetInteger(POSITION_TICKET);
    if (!OrderSend(request, result)) {
        Print("Error updating SL: ", GetLastError());
        return false;
    } else {
        Print("SL updated successfully to: ", newSL);
        return true;
    }
}

// Helper function to remove SL
void removeSL(double tp) {
    MqlTradeRequest request;
    MqlTradeResult result;
    ZeroMemory(request);
    request.action = TRADE_ACTION_SLTP; 
    request.symbol = _Symbol;
    request.sl = 0; // Remove SL
    request.tp = NormalizeDouble(tp, _Digits);
    request.position = PositionGetInteger(POSITION_TICKET);
    if (!OrderSend(request, result)) {
        Print("Error removing SL: ", GetLastError());
    } else {
        Print("SL removed successfully to give the position more room.");
        slMoved = false;
    }
}


// Function to calculate position size based on risk
double calculateVolume(double riskAmount, double slDistance) {
    double tickValue = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
    double volume = riskAmount / (slDistance * tickValue);
    return NormalizeDouble(volume, 2); // Round to 2 decimal places
}

bool isTrendConfirmed(orderType type) {
    // Get handles for the moving averages
    int fastMAHandle = iMA(_Symbol, _Period, 9, 0, MODE_SMA, PRICE_CLOSE);
    int slowMAHandle = iMA(_Symbol, _Period, 21, 0, MODE_SMA, PRICE_CLOSE);

    // Check if handles are valid
    if (fastMAHandle == INVALID_HANDLE || slowMAHandle == INVALID_HANDLE) {
        Print("Error getting MA handles: ", GetLastError());
        return false;
    }

    // Copy the MA values for the latest candle
    double fastMAValues[], slowMAValues[];
    ArraySetAsSeries(fastMAValues, true);
    ArraySetAsSeries(slowMAValues, true);

    if (CopyBuffer(fastMAHandle, 0, 0, 1, fastMAValues) <= 0 || CopyBuffer(slowMAHandle, 0, 0, 1, slowMAValues) <= 0) {
        Print("Error copying MA values: ", GetLastError());
        return false;
    }

    // Get the latest MA values
    double fastMA = fastMAValues[0];
    double slowMA = slowMAValues[0];

    // Confirm the trend
    if (type == orderBuy) {
        return fastMA > slowMA; // Uptrend confirmed
    } else if (type == orderSell) {
        return fastMA < slowMA; // Downtrend confirmed
    }
    return false;
}

input double riskPercent = 1.0;        // Risk percentage per trade



// Function to calculate fixed distance-based stop loss with multiplier
double calculateFixedStopLoss(orderType type, double multiplier = 1.0) {
    double pointValue = SymbolInfoDouble(_Symbol, SYMBOL_POINT);
    double fixedSL = slDistancePoints * pointValue * multiplier;  // Apply multiplier

    if (type == orderBuy) {
        return NormalizeDouble(SymbolInfoDouble(_Symbol, SYMBOL_BID) - fixedSL, _Digits);
    } else if (type == orderSell) {
        return NormalizeDouble(SymbolInfoDouble(_Symbol, SYMBOL_ASK) + fixedSL, _Digits);
    }

    return 0.0;
}

// Function to make a position (buy/sell)
bool makePosition(orderType type) {
    MqlTradeRequest request;
    MqlTradeResult result;
    MqlTradeCheckResult checkResult;
    ZeroMemory(request);
    request.symbol = _Symbol;
    request.action = TRADE_ACTION_DEAL;
    request.type_filling = ORDER_FILLING_FOK;
    request.deviation = 10;
    request.magic = magicNumber;
    double price = 0;

    double pointValue = SymbolInfoDouble(_Symbol, SYMBOL_POINT);
    int minStopLevel = (int)SymbolInfoInteger(_Symbol, SYMBOL_TRADE_STOPS_LEVEL);

    // Ensure SL and TP distances are valid
    double slDistance = MathMax(slDistancePoints, minStopLevel) * pointValue;
    double tpDistance = MathMax(tpDistancePoints, minStopLevel) * pointValue;

    double accountBalance = AccountInfoDouble(ACCOUNT_BALANCE);
    double riskAmount = accountBalance * (riskPercent / 100.0);

    double tickValue = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
    double volume = fixedVolume;

    if (type == orderBuy) {
        request.type = ORDER_TYPE_BUY;
        price = NormalizeDouble(SymbolInfoDouble(_Symbol, SYMBOL_ASK), _Digits);
        // Calculate SL with doubled distance
        request.sl = calculateFixedStopLoss(orderBuy, 33); 
        //request.tp = NormalizeDouble(price + tpDistance, _Digits);
        Print("=== Opening Buy Position ===");
        Print("Buy Price: ", price);
        Print("Initial SL: ", request.sl);
        Print("Initial TP: ", request.tp);
    } else if (type == orderSell) {
        request.type = ORDER_TYPE_SELL;
        price = NormalizeDouble(SymbolInfoDouble(_Symbol, SYMBOL_BID), _Digits);
        // Calculate SL with doubled distance
        request.sl = calculateFixedStopLoss(orderSell, 33);
        //request.tp = NormalizeDouble(price - tpDistance, _Digits);
        Print("=== Opening Sell Position ===");
        Print("Sell Price: ", price);
        Print("Initial SL: ", request.sl);
        Print("Initial TP: ", request.tp);
    }

    // Adjust SL to the broker's allowed value
    double minSLDistance = minStopLevel * pointValue;
    if (type == orderBuy && request.sl > 0 && (price - request.sl) < minSLDistance) {
        request.sl = NormalizeDouble(price - minSLDistance, _Digits);
        Print("Adjusted SL for Buy: ", request.sl);
    } else if (type == orderSell && request.sl > 0 && (request.sl - price) < minSLDistance) {
        request.sl = NormalizeDouble(price + minSLDistance, _Digits);
        Print("Adjusted SL for Sell: ", request.sl);
    }

    request.volume = volume;
    request.price = price;

    // Validate the trade request
    //if (!OrderCheck(request, checkResult)) {
      //  Print("Order check failed! Error: ", checkResult.retcode);
        //return false;
    //}

    // Send the trade request
    if (OrderSend(request, result)) {
        Print("Order sent successfully! Ticket: ", result.order);
        tradeOpenTime = TimeCurrent(); // Record the trade open time
    } else {
        Print("Order failed to send! Error: ", result.retcode);
        return false;
    }

    // Check if the trade was successful
    if (result.retcode == TRADE_RETCODE_DONE || result.retcode == TRADE_RETCODE_PLACED) {
        Print("Trade opened successfully!");
        Print("Final SL: ", request.sl);
        Print("Final TP: ", request.tp);
        return true;
    } else {
        Print("Trade opening failed! Retcode: ", result.retcode);
        return false;
    }
}

// AC Oscillator settings
   input int fastPeriod = 5;    // Fast SMA period
   input int slowPeriod = 34;    // Slow SMA period
   input int aoPeriod = 5;      // AO SMA period
   input int dataLimit = 100;    // Minimum number of bars required for calculation

//+------------------------------------------------------------------+
//| Function:      determineTrendDirection                         |
//| Purpose:       Determine trend direction based on AC Oscillator|
//+------------------------------------------------------------------+
orderType determineTrendDirection() {
   // Input parameters
   int fastSmaHandle = iMA(_Symbol, PERIOD_M1, fastPeriod, 0, MODE_SMA, PRICE_CLOSE);
   int slowSmaHandle = iMA(_Symbol, PERIOD_M1, slowPeriod, 0, MODE_SMA, PRICE_CLOSE);

   // Log initial values
   Print("--------------------------------------------------------------------------------");
   Print("HFT AC Oscillator Analysis");
   Print("Time: ", iTime(_Symbol, PERIOD_M1, 0));
   Print("Symbol: ", _Symbol);
   Print("Fast SMA Period: ", fastPeriod);
   Print("Slow SMA Period: ", slowPeriod);
   Print("AO Period: ", aoPeriod);
   Print("--------------------------------------------------------------------------------");

   // Check if indicators are initialized correctly
   if (fastSmaHandle == INVALID_HANDLE || slowSmaHandle == INVALID_HANDLE) {
      Print("Error initializing indicators: ", GetLastError());
      return orderNone;
   }

   // Define array size dynamically based on available data
   int dataLimit = 100; // Adjust based on your needs
   double fastSmaValues[100], slowSmaValues[100], aoValues[100], acValues[100];
   ArraySetAsSeries(fastSmaValues, true);
   ArraySetAsSeries(slowSmaValues, true);
   ArraySetAsSeries(aoValues, true);
   ArraySetAsSeries(acValues, true);

   // Copy SMA data
   if (CopyBuffer(fastSmaHandle, 0, 0, dataLimit, fastSmaValues) <= 0) {
      Print("Error copying Fast SMA data: ", GetLastError());
      return orderNone;
   }
   if (CopyBuffer(slowSmaHandle, 0, 0, dataLimit, slowSmaValues) <= 0) {
      Print("Error copying Slow SMA data: ", GetLastError());
      return orderNone;
   }

   // Calculate AO values (Fast SMA - Slow SMA)
   for (int i = 0; i < dataLimit; i++) {
      aoValues[i] = fastSmaValues[i] - slowSmaValues[i];
   }

   // Calculate AC values (SMA of AO)
   for (int i = aoPeriod; i < dataLimit; i++) {
      double sum = 0;
      for (int j = i - aoPeriod + 1; j <= i; j++) {
         sum += aoValues[j];
      }
      acValues[i] = sum / aoPeriod;
   }

   // Log SMA values
   Print("Current Fast SMA: ", fastSmaValues[dataLimit - 1]);
   Print("Current Slow SMA: ", slowSmaValues[dataLimit - 1]);
   Print("Current AO: ", aoValues[dataLimit - 1]);

   // Get current and previous AC values
   double currentAc = acValues[dataLimit - 1];
   double previousAc = dataLimit >= 2 ? acValues[dataLimit - 2] : 0.0;

   // Log AC values
   Print("Current AC: ", currentAc);
   Print("Previous AC: ", previousAc);

   // Trend direction logic with AC Oscillator
   Print("--------------------------------------------------------------------------------");
   if (currentAc > previousAc) {
      Print("AC is rising (Current: ", currentAc, ", Previous: ", previousAc, ")");
      // Buy signal logic
      if (currentAc > 0.0) {
         Print("Buy Signal Conditions Met:");
         Print("1. AC is rising (Bullish momentum increasing)");
         Print("2. Current AC is above zero (Positive momentum)");
         Print("3. AC turned green and rose above previous bar's high");
         Print("Generating BUY signal...");
         Print("--------------------------------------------------------------------------------");
         return orderBuy;
      }
   } else if (currentAc < previousAc) {
      Print("AC is falling (Current: ", currentAc, ", Previous: ", previousAc, ")");
      // Sell signal logic
      if (currentAc < 0.0) {
         Print("Sell Signal Conditions Met:");
         Print("1. AC is falling (Bearish momentum increasing)");
         Print("2. Current AC is below zero (Negative momentum)");
         Print("3. AC turned red and fell below previous bar's low");
         Print("Generating SELL signal...");
         Print("--------------------------------------------------------------------------------");
         return orderSell;
      }
   }

   Print("No clear trend or AC signal");
   Print("--------------------------------------------------------------------------------");
   return orderNone;
}


// Function to set initial stop loss and take profit based on points
void setInitialStopLoss() {
    // Check if a position exists for the current symbol
    if (!PositionSelect(_Symbol)) {
        Print("No position found for symbol: ", _Symbol);
        return;
    }

    // Get position details
    long positionType = PositionGetInteger(POSITION_TYPE); // POSITION_TYPE_BUY or POSITION_TYPE_SELL
    double currentPrice = PositionGetDouble(POSITION_PRICE_OPEN); // Opening price of the position
    double pointValue = SymbolInfoDouble(_Symbol, SYMBOL_POINT); // Value of one point for the symbol

    // Calculate SL and TP distances in points
    double slDistance = slDistancePoints * pointValue; // SL distance in price terms
    double tpDistance = tpDistancePoints * pointValue; // TP distance in price terms

    // Calculate SL and TP levels based on position type
    if (positionType == POSITION_TYPE_BUY) {
        // For a Buy position, SL is below the opening price, TP is above
        initialSL = NormalizeDouble(currentPrice - slDistance, _Digits);
        initialTP = NormalizeDouble(currentPrice + tpDistance, _Digits);
    } else if (positionType == POSITION_TYPE_SELL) {
        // For a Sell position, SL is above the opening price, TP is below
        initialSL = NormalizeDouble(currentPrice + slDistance, _Digits);
        initialTP = NormalizeDouble(currentPrice - tpDistance, _Digits);
    } else {
        Print("Invalid position type!");
        return;
    }

    // Update the SL and TP for the position
    if (!updateSL(initialSL, initialTP)) {
        Print("Failed to set initial stop loss and take profit!");
    } else {
        Print("Initial SL and TP set successfully!");
        Print("SL: ", initialSL, " | TP: ", initialTP);
    }
}

// Function to calculate historical volatility
double calculateHistoricalVolatility(int period) {
    double priceChanges[];
    ArrayResize(priceChanges, period);
    double sum = 0;

    // Calculate price changes over the specified period
    for (int i = 0; i < period; i++) {
        priceChanges[i] = (iClose(_Symbol, _Period, i) - iClose(_Symbol, _Period, i + 1)) / iClose(_Symbol, _Period, i + 1);
        sum += priceChanges[i];
    }

    // Calculate the mean of price changes
    double mean = sum / period;

    // Calculate the variance
    double variance = 0;
    for (int i = 0; i < period; i++) {
        variance += MathPow(priceChanges[i] - mean, 2);
    }
    variance /= period;

    // Return the standard deviation (historical volatility)
    return MathSqrt(variance);
}

double calculateVolatilityBasedVolume(double riskAmount) {
    double atrValue = iATR(_Symbol, PERIOD_M1, 14);
    double tickValue = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
    double volume = riskAmount / (atrValue * tickValue);
    return NormalizeDouble(volume, 2); // Round to 2 decimal places
}

bool isOverbought(double rsi) {
    return rsi > 70;
}

bool isOversold(double rsi) {
    return rsi < 30;
}

double calculateRiskRewardRatio(double entryPrice, double stopLoss, double takeProfit) {
    double risk = MathAbs(entryPrice - stopLoss);
    double reward = MathAbs(takeProfit - entryPrice);
    return reward / risk;
}

// Function to check if it's a good time to trade
bool isGoodTimeToTrade() {
    // Get the current server time
    //datetime currentTime = TimeCurrent();

    // Convert the current time to a MqlDateTime structure
    //MqlDateTime timeStruct;
    //TimeToStruct(currentTime, timeStruct);

    // Extract the hour from the time structure
    //int hour = timeStruct.hour;

    // Avoid trading during market open/close (e.g., midnight and 11 PM)
    //if (hour == 0 || hour == 23) {
    //    return false;
    //}

    // Add logic to check for high-impact news events
    // (You can use an external news API or a predefined list of events)

    return true;
}



// Function to count open Buy positions
int CountBuyPositions() {
    int totalPositions = PositionsTotal();
    int buyPositionCount = 0;

    for (int i = 0; i < totalPositions; i++) {
        if (PositionGetTicket(i) == 0) {
            Print("ERROR CODE: ", GetLastError());
            continue;
        }
        if (PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY) {
            buyPositionCount++;
        }
    }
    return buyPositionCount;
}

// Function to count open Sell positions
int CountSellPositions() {
    int totalPositions = PositionsTotal();
    int sellPositionCount = 0;

    for (int i = 0; i < totalPositions; i++) {
        if (PositionGetTicket(i) == 0) {
            Print("ERROR CODE: ", GetLastError());
            continue;
        }
        if (PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_SELL) {
            sellPositionCount++;
        }
    }
    return sellPositionCount;
}

// OnInit function
int OnInit() {
    ArraySetAsSeries(candleTimes, true);
    Print("=============RESTARTED====================");
    Print("EA initialized successfully for 1-minute chart.");
    
    // Generate a unique magic number for each chart
    if (magicNumber == 0) {
        magicNumber = ChartID(); // Use ChartID() as the magic number
    }
    Print("Magic Number for this chart: ", magicNumber);
    
    InitializeSession();
    
    sarHandle = iSAR(_Symbol, _Period, 0.02, 0.2);
    if (sarHandle == INVALID_HANDLE) {
        Print("Error creating Parabolic SAR handle: ", GetLastError());
    }

    // Reset cooldown on restart
    lastTradeTime = 0;
   
    return INIT_SUCCEEDED;
}

// Global variables for cooldown
datetime lastTradeTime = 0; // Time of the last trade
input int cooldownMinutes = 5; // Cooldown period in minutes (configurable)

// Global variable to track the last losing trade time
datetime lastLosingTradeTime = 0;

// Global variables
int lastCallTime = 0;

void OnTick() {

    // If it's not yet time to call the function, exit
    lastCallTime = TimeCurrent();
    
    // Check if the losing trade cooldown period has passed
    
    if (checkNewCandle(candleTimes, lastCandleTime)) {
        int buyPositions = 0;
        int sellPositions = 0;

        // Count positions with the current chart's magic number
        for (int i = 0; i < PositionsTotal(); i++) {
            if (PositionGetTicket(i) > 0) {
                ulong posMagic = PositionGetInteger(POSITION_MAGIC);
                if (posMagic == magicNumber) {
                    if (PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY) {
                        buyPositions++;
                    } else if (PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_SELL) {
                        sellPositions++;
                    }
                }
            }
        }

        if (buyPositions > 0 || sellPositions > 0) {
            Print("Positions already open on this chart. No new position will be opened.");
            updateTrailingSL(); // Update trailing stop for the open positions
            return;
        }

        if (!isGoodTimeToTrade()) {
            Print("Market conditions are not favorable. Skipping trade.");
            return;
        }

        // Determine the trend direction using the high-frequency algorithm
        orderType trendDirection = determineTrendDirection();

        if (trendDirection == orderBuy) {
            Print("Trend direction: Buy. Opening Buy position.");
            if (makePosition(orderBuy)) {
                lastTradeTime = TimeCurrent(); // Update the last trade time
            }
            setInitialStopLoss();
        } else if (trendDirection == orderSell) {
            Print("Trend direction: Sell. Opening Sell position.");
            if (makePosition(orderSell)) {
                lastTradeTime = TimeCurrent(); // Update the last trade time
            }
            setInitialStopLoss();
        }
    } else {
        if (PositionSelect(_Symbol)) {
            updateTrailingSL();
            updateTrailingTP(); // Update trailing TP for the open positions
        }
    }
}

// Global variables to store session start time and counters
datetime sessionStartTime;
int slCount = 0;
int tpCount = 0;

// Function to initialize the session
void InitializeSession() {
    sessionStartTime = TimeCurrent(); // Record the start time of the session
    slCount = 0; // Reset SL counter
    tpCount = 0; // Reset TP counter
    Print("Session started at: ", sessionStartTime);
}

// Function to analyze trade history at the end of the session
void AnalyzeTradeHistory() {
    // Select trade history for the period the EA was active
    if (!HistorySelect(sessionStartTime, TimeCurrent())) {
        Print("Error retrieving trade history: ", GetLastError());
        return;
    }

    // Get the total number of deals in the history
    int totalDeals = HistoryDealsTotal();
    Print("Total deals in session: ", totalDeals);

    // Loop through the deals to analyze closed trades
    for (int i = 0; i < totalDeals; i++) {
        ulong dealTicket = HistoryDealGetTicket(i); // Get the deal ticket
        if (dealTicket > 0) {
            // Check if the deal is a trade close
            long dealType = HistoryDealGetInteger(dealTicket, DEAL_TYPE);
            if (dealType == DEAL_TYPE_SELL || dealType == DEAL_TYPE_BUY) {
                // Check the reason for closing the trade
                long closeReason = HistoryDealGetInteger(dealTicket, DEAL_REASON);
                if (closeReason == DEAL_REASON_SL) {
                    slCount++; // Increment SL counter
                } else if (closeReason == DEAL_REASON_TP) {
                    tpCount++; // Increment TP counter
                }
            }
        }
    }

    // Print the results
    Print("Trades closed due to Stop Loss: ", slCount);
    Print("Trades closed due to Take Profit: ", tpCount);
}

// OnDeinit function to analyze trade history when the EA is stopped
void OnDeinit(const int reason) {
    AnalyzeTradeHistory();
}

// Global variable to store the last position ticket
ulong lastPositionTicket = 0;

// OnTrade function to detect when a position is closed
void OnTrade() {
    // Check if there are any positions for the current symbol
    if (PositionSelect(_Symbol)) {
        ulong currentTicket = PositionGetInteger(POSITION_TICKET);

        // If the current ticket is different from the last recorded ticket, it means a new position was opened
        if (currentTicket != lastPositionTicket) {
            lastPositionTicket = currentTicket;
            Print("New position opened. Ticket: ", lastPositionTicket);
        }
    } else {
        // If no position is found for the symbol, it means the position was closed
        if (lastPositionTicket != 0) {
            // Retrieve the closed position details from the history
            HistorySelect(0, TimeCurrent()); // Load trade history
            int totalDeals = HistoryDealsTotal();
            ulong dealTicket = 0;
            double pnl = 0.0; // Declare and initialize pnl variable
            datetime openTime = 0;
            datetime closeTime = 0;
            double volume = 0.0;
            string symbol = "";
            long positionType = 0;
            long closeReason = 0;

            // Loop through the deals to find the closed position
            for (int i = totalDeals - 1; i >= 0; i--) {
                dealTicket = HistoryDealGetTicket(i);
                if (HistoryDealGetInteger(dealTicket, DEAL_POSITION_ID) == lastPositionTicket) {
                    pnl = HistoryDealGetDouble(dealTicket, DEAL_PROFIT); // Calculate PnL
                    openTime = (datetime)HistoryDealGetInteger(dealTicket, DEAL_TIME);
                    closeTime = (datetime)HistoryDealGetInteger(dealTicket, DEAL_TIME);
                    volume = HistoryDealGetDouble(dealTicket, DEAL_VOLUME);
                    symbol = HistoryDealGetString(dealTicket, DEAL_SYMBOL);
                    positionType = HistoryDealGetInteger(dealTicket, DEAL_TYPE);
                    closeReason = HistoryDealGetInteger(dealTicket, DEAL_REASON);
                    break;
                }
            }

            // Calculate the duration the position was open
            double durationMinutes = (closeTime - openTime);

            // Determine the reason for closure
            string reasonText = "Unknown";
            switch (closeReason) {
                case DEAL_REASON_SL:
                    reasonText = "Stop Loss";
                    break;
                case DEAL_REASON_TP:
                    reasonText = "Take Profit";
                    break;
                case DEAL_REASON_SO:
                    reasonText = "Stop Out (Margin Call)";
                    break;
                case DEAL_REASON_EXPERT:
                    reasonText = "Closed by Expert Advisor";
                    break;
                default:
                    reasonText = "Unknown";
                    break;
            }

            // Display the closed position information
            Print("=== Position Closed ===");
            Print("Ticket: ", lastPositionTicket);
            Print("Symbol: ", symbol);
            Print("Type: ", (positionType == DEAL_TYPE_BUY) ? "Buy" : "Sell");
            Print("Volume: ", volume);
            Print("Open Time: ", TimeToString(openTime));
            Print("Close Time: ", TimeToString(closeTime));
            Print("Duration (Minutes): ", durationMinutes);
            Print("PnL: ", pnl, " ", AccountInfoString(ACCOUNT_CURRENCY));
            Print("Reason for Closure: ", reasonText);
            Print("======================");

            // Check if the trade was a losing trade and update the last losing trade time
            if (pnl < 0) {
                lastLosingTradeTime = TimeCurrent(); // Update the last losing trade time
                Print("Losing trade detected. Cooldown activated.");
            }

            // Reset the last position ticket
            lastPositionTicket = 0;
        }
    }
}