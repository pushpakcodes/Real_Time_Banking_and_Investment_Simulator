const BankAccount = require('../models/BankAccount');
const Stock = require('../models/Stock');
const Loan = require('../models/Loan');
const FixedDeposit = require('../models/FixedDeposit');
const Portfolio = require('../models/Portfolio');
const Transaction = require('../models/Transaction');
const SimulationSnapshot = require('../models/SimulationSnapshot');
const { computeNetWorth } = require('./netWorthService');
const SimulationSession = require('../models/SimulationSession');
const { recordSessionTransactions } = require('./simulationSessionService');
const { getDirectionalTrend } = require('./finnhubService');

// Helper for Normal Distribution (Box-Muller)
const randomNormal = (mean = 0, stdev = 1) => {
  const u = 1 - Math.random();
  const v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * stdev + mean;
};

// Month difference helper
const monthsBetween = (a, b) => {
  return (a.getFullYear() - b.getFullYear()) * 12 + (a.getMonth() - b.getMonth());
};

const advanceSimulation = async (user, days) => {
  const userId = user._id;
  let currentDate = new Date(user.simulationDate);

  // Load Data
  const accounts = await BankAccount.find({ user: userId });
  const stocks = await Stock.find({ user: userId });
  const loans = await Loan.find({ user: userId, status: 'ACTIVE' });
  const fds = await FixedDeposit.find({ user: userId, status: 'ACTIVE' });
  const portfolio = await Portfolio.find({ user: userId });

  // Map Portfolio for quick lookup
  const portfolioMap = {};
  portfolio.forEach(p => {
    if (p.stock) {
      portfolioMap[p.stock.toString()] = p.quantity;
    }
  });

  const transactionsToCreate = [];

  // Fetch Directional Trends (Finnhub)
  const sentimentMap = {};
  const uniqueSymbols = [...new Set(stocks.map(s => s.symbol))];
  // Parallel fetch but safe
  await Promise.all(uniqueSymbols.map(async (symbol) => {
    try {
        const sentiment = await getDirectionalTrend(symbol);
        sentimentMap[symbol] = sentiment.direction;
    } catch (e) {
        console.warn(`Failed to fetch sentiment for ${symbol} in simulation:`, e.message);
    }
  }));

  // Loop through days
  for (let i = 1; i <= days; i++) {
    currentDate.setDate(currentDate.getDate() + 1);
    const dayOfMonth = currentDate.getDate();

    // 1. Update Stocks
    stocks.forEach(stock => {
      let drift = stock.growthBias;

      // Apply Sentiment Bias
      const direction = sentimentMap[stock.symbol];
      if (direction === 'UP') drift += 0.0005;
      if (direction === 'DOWN') drift -= 0.0005;

      const shock = stock.volatility * randomNormal();
      let changePercent = drift + shock;
      
      // Trend influence removed to avoid double counting with growthBias
      // if (stock.trend === 'BULLISH') changePercent += 0.001;
      // if (stock.trend === 'BEARISH') changePercent -= 0.001;

      let newPrice = stock.currentPrice * (1 + changePercent);
      if (newPrice < 0.01) newPrice = 0.01; // Floor

      stock.currentPrice = newPrice;
      stock.simulatedHistory.push({ date: new Date(currentDate), price: newPrice });
    });

    // 2. Bank Interest (Daily Compounding for Simplicity)
    accounts.forEach(acc => {
      if (acc.type === 'Savings') {
        const dailyRate = acc.interestRate / 100 / 365;
        const interest = acc.balance * dailyRate;
        acc.balance += interest;
      }
    });

    // 2b. Monthly Recurring Deposits
    accounts.forEach(acc => {
      if (acc.monthlyDeposit && acc.monthlyDeposit.active) {
        const depositDay = acc.monthlyDeposit.dayOfMonth || 1;
        if (dayOfMonth === depositDay && acc.monthlyDeposit.amount > 0) {
          acc.balance += Number(acc.monthlyDeposit.amount);
          transactionsToCreate.push({
            user: userId,
            account: acc._id,
            type: 'DEPOSIT',
            amount: Number(acc.monthlyDeposit.amount),
            description: `Monthly deposit`,
            date: new Date(currentDate)
          });
        }
      }
    });
    // 3. Loan EMI
    loans.forEach(loan => {
      if (loan.status !== 'ACTIVE') return;
      const loanStartDay = new Date(loan.startDate).getDate();
      // Simple check: if day matches loan start day (approx monthly)
      if (dayOfMonth === loanStartDay) {
        // Find primary account (assume first savings account with balance)
        const primaryAccount = accounts[0];

        const monthlyRate = loan.interestRate / 1200;
        const interestForMonth = loan.remainingBalance * monthlyRate;
        const principalComponent = loan.emiAmount - interestForMonth;

        const monthsElapsed = monthsBetween(currentDate, new Date(loan.startDate));
        const isFinalMonth = (monthsElapsed + 1) >= loan.tenureMonths || principalComponent >= loan.remainingBalance;

        if (isFinalMonth) {
          const settlementAmount = interestForMonth + loan.remainingBalance;
          console.log(`Loan ${loan._id} FINAL EMI. Interest: ${interestForMonth.toFixed(2)} Remaining: ${loan.remainingBalance.toFixed(2)} Settlement: ${settlementAmount.toFixed(2)}`);
          primaryAccount.balance -= settlementAmount;
          loan.totalInterestPaid = Number(loan.totalInterestPaid || 0) + interestForMonth;
          loan.remainingBalance = 0;
          loan.status = 'CLOSED';
          transactionsToCreate.push({
            user: userId,
            account: primaryAccount._id,
            type: 'EMI',
            amount: -settlementAmount,
            description: `Final EMI for Loan ${loan._id}`,
            date: new Date(currentDate)
          });
          console.log(`Loan ${loan._id} status -> CLOSED`);
        } else {
          const canPay = primaryAccount && primaryAccount.balance >= loan.emiAmount;
          if (canPay) {
            primaryAccount.balance -= loan.emiAmount;
            const newRemaining = loan.remainingBalance - principalComponent;
            loan.remainingBalance = newRemaining < 0 ? 0 : newRemaining;
            loan.totalInterestPaid = Number(loan.totalInterestPaid || 0) + interestForMonth;
            if (loan.status === 'DEFAULTED') loan.status = 'ACTIVE';
            transactionsToCreate.push({
              user: userId,
              account: primaryAccount._id,
              type: 'EMI',
              amount: -loan.emiAmount,
              description: `EMI for Loan ${loan._id}`,
              date: new Date(currentDate)
            });
            console.log(`Loan ${loan._id} EMI paid: ${loan.emiAmount.toFixed(2)} | Interest: ${interestForMonth.toFixed(2)} | Remaining: ${loan.remainingBalance.toFixed(2)}`);
          } else {
            loan.tenureMonths += 1;
            console.log(`Loan ${loan._id} EMI skipped due to insufficient funds. Tenure extended to ${loan.tenureMonths} months. Remaining: ${loan.remainingBalance.toFixed(2)}`);
          }
        }
      }
    });

    // 4. FD Maturity
    fds.forEach(fd => {
        if (fd.status === 'ACTIVE' && new Date(currentDate) >= new Date(fd.maturityDate)) {
            // Matured
            const finalAmount = fd.principal * Math.pow((1 + fd.interestRate / 100), (fd.maturityDate - fd.startDate) / (1000 * 60 * 60 * 24 * 365)); // Simple Compound
            // Credit to source account
            const targetAcc = accounts.find(a => a._id.toString() === fd.account.toString()) || accounts[0];
            
            if (targetAcc) {
                targetAcc.balance += finalAmount;
                fd.status = 'MATURED';
                
                transactionsToCreate.push({
                    user: userId,
                    account: targetAcc._id,
                    type: 'FD_MATURITY',
                    amount: finalAmount,
                    description: `FD Matured ${fd._id}`,
                    date: new Date(currentDate)
                });
            } else {
                console.warn(`FD ${fd._id} matured but no account found to credit.`);
                // Optionally mark as MATURED_UNPAID or keep ACTIVE? 
                // For now, let's keep it ACTIVE so user doesn't lose money, or mark MATURED and log error.
                // Safest: Do nothing, let it retry next time or manual intervention? 
                // But simulation moves forward. If we don't process it, it stays ACTIVE.
            }
        } else {
            // Accrue interest (visual only if needed)
        }
    });
  }

  // Save State
  await Promise.all([
    ...accounts.map(a => a.save()),
    ...stocks.map(s => s.save()),
    ...loans.map(l => l.save()),
    ...fds.map(f => f.save()),
    transactionsToCreate.length > 0 ? Transaction.insertMany(transactionsToCreate) : Promise.resolve()
  ]);
  if (transactionsToCreate.length > 0) {
    const activeSession = await SimulationSession.findOne({ user: userId, active: true });
    if (activeSession) {
      const created = await Transaction.find({ user: userId }).sort({ realDate: -1 }).limit(transactionsToCreate.length).select('_id');
      await recordSessionTransactions(userId, created.map(c => c._id));
    }
  }

  // Update User Date
  user.simulationDate = currentDate;
  const breakdown = await computeNetWorth(userId, 'POST_SIMULATION');
  user.virtualNetWorth = breakdown.netWorth;
  await user.save();

  // Save Snapshot
  await SimulationSnapshot.create({
    user: userId,
    date: currentDate,
    netWorth: breakdown.netWorth,
    totalBankBalance: breakdown.totalBankBalance,
    totalStockValue: breakdown.totalStockValue,
    totalLoanLiability: breakdown.totalLoanLiability,
    totalFDValue: breakdown.totalFDValue
  });

  return {
    simulationDate: currentDate,
    netWorth: breakdown.netWorth,
    message: `Simulated ${days} days successfully.`
  };
};

module.exports = { advanceSimulation };
