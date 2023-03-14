
module.exports = async function getBalancesAndPositions() {
    try {
        // fetch all account balances
        const accountInfo = await global.binance.futuresAccount();

        // extract the balances object
        const balances = accountInfo.assets;

        // fetch all open positions
        const positions = await global.binance.futuresPositionRisk();

        console.log({positions})
        // handle no positions being returned
        if(!positions[0]){
            console.error(`Error getting current positions`, positions)
            return {
                balances: [],
                positions: []
            };
        }

        // filter out positions with wallet balance of zero
        const filteredPositions = positions.filter(position => {
            return parseFloat(position.positionAmt) !== 0;
        });

        // filter out assets with wallet balance of zero
        const nonZeroBalances = balances.filter(balance => parseFloat(balance.walletBalance) > 0);

        // map the relevant information for each non-zero balance
        const relevantBalances = nonZeroBalances.map(balance => {
            const position = filteredPositions.find(p => p.symbol === balance.asset);
            return {
                asset: balance.asset,
                availableBalance: balance.availableBalance,
                maxWithdrawAmount: balance.maxWithdrawAmount,
                updateTime: balance.updateTime,
                position
            };
        });

        return {
            balances: relevantBalances,
            positions: filteredPositions
        };
    } catch (err) {
        console.error(err);
        return null;
    }
}
