const BankAccount = require('../models/BankAccount');
const Portfolio = require('../models/Portfolio');
const Loan = require('../models/Loan');
const FixedDeposit = require('../models/FixedDeposit');
const Stock = require('../models/Stock');
const CreditCard = require('../models/CreditCard');

const computeNetWorth = async (userId, mode = 'LIVE') => {
  const accounts = await BankAccount.find({ user: userId });
  const loans = await Loan.find({ user: userId, status: 'ACTIVE' });
  const fds = await FixedDeposit.find({ user: userId, status: 'ACTIVE' });
  const creditCards = await CreditCard.find({ user: userId, status: 'ACTIVE' });
  const portfolio = await Portfolio.find({ user: userId }).populate('stock');

  const totalBankBalance = accounts.reduce((sum, a) => sum + Math.max(0, Number(a.balance || 0)), 0);
  const totalStockValue = portfolio.reduce((sum, p) => {
    const price = p.stock ? Number(p.stock.currentPrice || 0) : 0;
    return sum + (price * Number(p.quantity || 0));
  }, 0);
  const totalFDValue = fds.reduce((sum, f) => sum + Math.max(0, Number(f.principal || 0)), 0);
  const totalLoanLiability = loans.reduce((sum, l) => sum + Math.max(0, Number(l.remainingBalance || 0)), 0);
  const totalCreditCardLiability = creditCards.reduce((sum, c) => sum + Math.max(0, Number(c.outstandingBalance || 0)), 0);

  const netWorth = totalBankBalance + totalStockValue + totalFDValue - totalLoanLiability - totalCreditCardLiability;

  return {
    netWorth,
    totalBankBalance,
    totalStockValue,
    totalFDValue,
    totalLoanLiability,
    totalCreditCardLiability
  };
};

module.exports = { computeNetWorth };
