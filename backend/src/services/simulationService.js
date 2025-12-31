const BankAccount = require('../models/BankAccount');
const Stock = require('../models/Stock');
const Loan = require('../models/Loan');
const FixedDeposit = require('../models/FixedDeposit');
const CreditCard = require('../models/CreditCard');
const Portfolio = require('../models/Portfolio');
const Transaction = require('../models/Transaction');
const SimulationSnapshot = require('../models/SimulationSnapshot');
const { computeNetWorth } = require('./netWorthService');
const SimulationSession = require('../models/SimulationSession');
const { recordSessionTransactions } = require('./simulationSessionService');
const { getDirectionalTrend } = require('./finnhubService');
const creditCardService = require('./creditCardService');

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
  const creditCards = await CreditCard.find({ user: userId, status: 'ACTIVE' });
  const portfolio = await Portfolio.find({ user: userId });

  // Map Portfolio for quick lookup
  const portfolioMap = {};
  portfolio.forEach(p => {
    if (p.stock) {
      portfolioMap[p.stock.toString()] = p.quantity;
    }
  });

  const transactionsToCreate = [];
  const snapshotsToCreate = [];

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
    const dayOfWeek = currentDate.getDay(); // 0=Sun, 6=Sat

    // 1. Update Stocks (Only on Trading Days: Mon-Fri)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        stocks.forEach(stock => {
            // Cap drift to avoid unrealistic exponential growth (max 0.05% daily ~ 13% annual)
            // If historical bias is higher, we clamp it.
            let drift = stock.growthBias;
            if (drift > 0.0005) drift = 0.0005; 
            if (drift < -0.0005) drift = -0.0005;

            // Apply Sentiment Bias (Drastically reduced)
            const direction = sentimentMap[stock.symbol];
            if (direction === 'UP') drift += 0.00005; // Was 0.0001
            if (direction === 'DOWN') drift -= 0.00005; // Was 0.0001

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
    }

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

    // 5. Credit Cards
    for (const card of creditCards) {
        // Billing Logic (Monthly on Billing Day)
        if (dayOfMonth === card.billingDay) {
            await creditCardService.generateStatement(card, currentDate);
            
            // Auto-Pay or Miss Logic?
            // In simulation, we assume user might pay min due or full if they have balance?
            // Or we just let it sit until they manually pay?
            // Prompt says: "Credit card effects must be reversible on simulation exit... Payment deducts from bank balance"
            // For now, we'll just simulate interest/billing. Auto-payment is complex user behavior.
            // Let's assume user pays MINIMUM DUE automatically if they have funds, to avoid default?
            // Or better: Let it accrue interest if not paid.
            // But wait, "Part 3: Billing Cycle... Freeze statement balance".
            
            // Let's just generate statement.
        }
        
        // Interest Logic (Monthly? Or Daily Check?)
        // Part 5: "Interest is applied monthly... Add interest ONLY: After due date... On unpaid balances"
        // We can check this daily: Is today == Due Date + 1? Or just check if overdue.
        // creditCardService.applyInterest handles logic "if past due date and balance > 0".
        // But we need to call it appropriately. Maybe once a day check?
        // Or strictly once a month.
        // Let's call it daily, the service function has checks.
        // Actually, service function `applyInterest` adds interest. If we call it daily after due date, it might add interest DAILY.
        // The prompt says "Interest is applied monthly, NOT daily".
        // So we should only apply interest ONCE per billing cycle, specifically after grace period.
        // Let's say we apply it on (Due Date + 1).
        
        if (card.nextDueDate) {
            const dueDate = new Date(card.nextDueDate);
            // Check if today is exactly 1 day after due date
            const dayAfterDue = new Date(dueDate);
            dayAfterDue.setDate(dueDate.getDate() + 1);
            
            if (currentDate.getDate() === dayAfterDue.getDate() && 
                currentDate.getMonth() === dayAfterDue.getMonth() &&
                currentDate.getFullYear() === dayAfterDue.getFullYear()) {
                    
                await creditCardService.applyInterest(card, currentDate);
            }
        }
    }

    // 6. Snapshot Logic (Monthly)
    // Capture snapshot on the 1st of every month to ensure graph has data points
    // Also capture the very first day to have a starting point
    if (dayOfMonth === 1 || i === 1) {
        let currentBankSum = 0;
        accounts.forEach(a => currentBankSum += Math.max(0, a.balance));
        
        let currentStockSum = 0;
        stocks.forEach(s => {
            const qty = portfolioMap[s._id.toString()] || 0;
            currentStockSum += (s.currentPrice * qty);
        });

        let currentLoanSum = 0;
        loans.forEach(l => {
            if (l.status === 'ACTIVE') currentLoanSum += Math.max(0, l.remainingBalance);
        });

        let currentFDSum = 0;
        fds.forEach(f => {
             if (f.status === 'ACTIVE') currentFDSum += Math.max(0, f.principal);
        });

        let currentCCSum = 0;
        creditCards.forEach(c => {
             if (c.status === 'ACTIVE') currentCCSum += Math.max(0, c.outstandingBalance);
        });

        const currentNetWorth = currentBankSum + currentStockSum + currentFDSum - currentLoanSum - currentCCSum;

        snapshotsToCreate.push({
            user: userId,
            date: new Date(currentDate),
            netWorth: currentNetWorth,
            totalBankBalance: currentBankSum,
            totalStockValue: currentStockSum,
            totalLoanLiability: currentLoanSum,
            totalFDValue: currentFDSum
        });
    }
  }

  // Save State
  await Promise.all([
    ...accounts.map(a => a.save()),
    ...stocks.map(s => s.save()),
    ...loans.map(l => l.save()),
    ...fds.map(f => f.save()),
    transactionsToCreate.length > 0 ? Transaction.insertMany(transactionsToCreate) : Promise.resolve(),
    snapshotsToCreate.length > 0 ? SimulationSnapshot.insertMany(snapshotsToCreate) : Promise.resolve()
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

  // Save Final Snapshot (ensure we have the very last point)
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
