const BankAccount = require('../models/BankAccount');
const Stock = require('../models/Stock');
const Loan = require('../models/Loan');
const FixedDeposit = require('../models/FixedDeposit');
const Portfolio = require('../models/Portfolio');
const Transaction = require('../models/Transaction');
const SimulationSnapshot = require('../models/SimulationSnapshot');

// Helper for Normal Distribution (Box-Muller)
const randomNormal = (mean = 0, stdev = 1) => {
  const u = 1 - Math.random();
  const v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * stdev + mean;
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

  // Loop through days
  for (let i = 1; i <= days; i++) {
    currentDate.setDate(currentDate.getDate() + 1);
    const dayOfMonth = currentDate.getDate();

    // 1. Update Stocks
    stocks.forEach(stock => {
      const drift = stock.growthBias;
      const shock = stock.volatility * randomNormal();
      let changePercent = drift + shock;
      
      // Trend influence
      if (stock.trend === 'BULLISH') changePercent += 0.001;
      if (stock.trend === 'BEARISH') changePercent -= 0.001;

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

    // 3. Loan EMI
    loans.forEach(loan => {
      const loanStartDay = new Date(loan.startDate).getDate();
      // Simple check: if day matches loan start day (approx monthly)
      if (dayOfMonth === loanStartDay) {
        // Find primary account (assume first savings account with balance)
        const primaryAccount = accounts.find(a => a.type === 'Savings' && a.balance >= loan.emiAmount) || accounts[0];
        
        if (primaryAccount) {
            // Deduct EMI
            primaryAccount.balance -= loan.emiAmount;
            loan.remainingBalance -= (loan.emiAmount - (loan.remainingBalance * loan.interestRate / 1200)); // Rough Principal reduction
            if (loan.remainingBalance < 0) loan.remainingBalance = 0;
            
            // If it was defaulted, maybe restore to ACTIVE if they have funds now? 
            // For now, let's keep it simple: If they pay, it stays/becomes ACTIVE.
            if (loan.status === 'DEFAULTED') loan.status = 'ACTIVE';

            transactionsToCreate.push({
                user: userId,
                account: primaryAccount._id,
                type: 'EMI',
                amount: -loan.emiAmount, // Negative for deduction
                description: `EMI for Loan ${loan._id}`,
                date: new Date(currentDate)
            });

            if (loan.remainingBalance <= 0) {
                loan.status = 'CLOSED';
            }
        } else {
            // Insufficient Funds Logic or No Account
            console.log(`Loan ${loan._id} defaulted due to insufficient funds or no account.`);
            loan.status = 'DEFAULTED';
            
            // Optional: Add penalty to principal? 
            // loan.remainingBalance += 500; 
        }
      }
    });

    // 4. FD Maturity
    fds.forEach(fd => {
        if (new Date(currentDate) >= new Date(fd.maturityDate)) {
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

  // Update User Date
  user.simulationDate = currentDate;
  
  // Calculate Net Worth
  const totalBankBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const totalStockValue = stocks.reduce((sum, stock) => {
    const qty = portfolioMap[stock._id.toString()] || 0;
    return sum + (stock.currentPrice * qty);
  }, 0);
  const totalLoanLiability = loans.reduce((sum, loan) => sum + loan.remainingBalance, 0);
  const totalFDValue = fds.filter(f => f.status === 'ACTIVE').reduce((sum, fd) => sum + fd.principal, 0); // Simplified

  const netWorth = totalBankBalance + totalStockValue + totalFDValue - totalLoanLiability;
  
  user.virtualNetWorth = netWorth;
  await user.save();

  // Save Snapshot
  await SimulationSnapshot.create({
    user: userId,
    date: currentDate,
    netWorth,
    totalBankBalance,
    totalStockValue,
    totalLoanLiability,
    totalFDValue
  });

  return {
    simulationDate: currentDate,
    netWorth,
    message: `Simulated ${days} days successfully.`
  };
};

module.exports = { advanceSimulation };
