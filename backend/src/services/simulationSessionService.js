const SimulationSession = require('../models/SimulationSession');
const BankAccount = require('../models/BankAccount');
const Stock = require('../models/Stock');
const Loan = require('../models/Loan');
const FixedDeposit = require('../models/FixedDeposit');
const CreditCard = require('../models/CreditCard');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const SimulationSnapshot = require('../models/SimulationSnapshot');

const recordSessionTransactions = async (userId, txIds = []) => {
  if (!txIds.length) return;
  const session = await SimulationSession.findOne({ user: userId, active: true });
  if (!session) return;
  session.transactionsCreated = [...session.transactionsCreated, ...txIds];
  await session.save();
};

const endSession = async (userId) => {
  const session = await SimulationSession.findOne({ user: userId, active: true });
  if (!session) return { message: 'No active session' };

  const { baseline, transactionsCreated } = session;

  // Restore user
  await User.findByIdAndUpdate(userId, {
    simulationDate: baseline.user.simulationDate,
    virtualNetWorth: baseline.user.virtualNetWorth
  });

  // Restore accounts
  for (const a of baseline.accounts) {
    await BankAccount.findByIdAndUpdate(a._id, { balance: a.balance });
  }

  // Restore stocks and clear simulated history residue
  for (const s of baseline.stocks) {
    await Stock.findByIdAndUpdate(s._id, { currentPrice: s.currentPrice, simulatedHistory: [] });
  }

  // Restore loans
  for (const l of baseline.loans) {
    await Loan.findByIdAndUpdate(l._id, { remainingBalance: l.remainingBalance, status: l.status });
  }

  // Restore FDs
  for (const f of baseline.fds) {
    await FixedDeposit.findByIdAndUpdate(f._id, { status: f.status });
  }

  // Restore Credit Cards
  if (baseline.creditCards) {
    for (const cc of baseline.creditCards) {
      await CreditCard.findByIdAndUpdate(cc._id, {
        outstandingBalance: cc.outstandingBalance,
        availableCredit: cc.availableCredit,
        statementBalance: cc.statementBalance,
        minimumDue: cc.minimumDue,
        totalInterestPaid: cc.totalInterestPaid,
        missedPaymentsCount: cc.missedPaymentsCount,
        lastStatementDate: cc.lastStatementDate,
        nextDueDate: cc.nextDueDate,
        lastInterestAppliedDate: cc.lastInterestAppliedDate
      });
    }
  }

  // Delete transactions created during the session
  if (transactionsCreated && transactionsCreated.length > 0) {
    await Transaction.deleteMany({ _id: { $in: transactionsCreated } });
  }

  session.active = false;
  await session.save();

  return { message: 'Simulation session ended and original values restored' };
};

const startSession = async (userId) => {
  // Check if user is already in a simulation
  // If so, end it first to restore original values before capturing new baseline
  const existingSession = await SimulationSession.findOne({ user: userId, active: true });
  if (existingSession) {
    console.log(`[Simulation] Active session found for user ${userId}. Restoring baseline before restarting.`);
    await endSession(userId);
  }

  const accounts = await BankAccount.find({ user: userId });
  const stocks = await Stock.find({ user: userId });
  const loans = await Loan.find({ user: userId });
  const fds = await FixedDeposit.find({ user: userId });
  const creditCards = await CreditCard.find({ user: userId });
  const user = await User.findById(userId);

  const baseline = {
    user: {
      simulationDate: user.simulationDate,
      virtualNetWorth: user.virtualNetWorth
    },
    accounts: accounts.map(a => ({ _id: a._id, balance: Number(a.balance || 0) })),
    stocks: stocks.map(s => ({ _id: s._id, currentPrice: Number(s.currentPrice || 0) })),
    loans: loans.map(l => ({ _id: l._id, remainingBalance: Number(l.remainingBalance || 0), status: l.status })),
    fds: fds.map(f => ({ _id: f._id, status: f.status })),
    creditCards: creditCards.map(c => ({
      _id: c._id,
      outstandingBalance: Number(c.outstandingBalance || 0),
      availableCredit: Number(c.availableCredit || 0),
      statementBalance: Number(c.statementBalance || 0),
      minimumDue: Number(c.minimumDue || 0),
      totalInterestPaid: Number(c.totalInterestPaid || 0),
      missedPaymentsCount: Number(c.missedPaymentsCount || 0),
      lastStatementDate: c.lastStatementDate,
      nextDueDate: c.nextDueDate,
      lastInterestAppliedDate: c.lastInterestAppliedDate
    }))
  };

  await SimulationSession.findOneAndUpdate(
    { user: userId },
    { active: true, startedAt: new Date(), baseline, transactionsCreated: [] },
    { upsert: true }
  );

  // Clear previous simulation snapshots to ensure graph only shows current session data
  await SimulationSnapshot.deleteMany({ user: userId });

  return { message: 'Simulation session started' };
};

module.exports = { startSession, endSession, recordSessionTransactions };
