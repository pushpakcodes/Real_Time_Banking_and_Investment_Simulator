const CreditCard = require('../models/CreditCard');
const BankAccount = require('../models/BankAccount');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');
const { recordSessionTransactions } = require('./simulationSessionService');

// Create a new Credit Card
const createCard = async (userId, limit = 50000) => {
    const cardNumber = '4' + Math.floor(Math.random() * 1000000000000000); // Simple mock
    const card = await CreditCard.create({
        user: userId,
        cardNumber,
        creditLimit: limit,
        availableCredit: limit,
        cardName: 'Platinum Rewards'
    });
    return card;
};

// Spend Logic
const spend = async (cardId, amount, description, date) => {
    const card = await CreditCard.findById(cardId);
    if (!card) throw new Error('Card not found');
    if (card.status !== 'ACTIVE') throw new Error('Card is not active');

    if (amount <= 0) throw new Error('Invalid amount');
    if (card.outstandingBalance + amount > card.creditLimit) {
        throw new Error('Transaction declined: Over credit limit');
    }

    card.outstandingBalance += Number(amount);
    card.availableCredit -= Number(amount);
    
    await card.save();

    const tx = await Transaction.create({
        user: card.user,
        account: card._id, // Polymorphic-ish reference, or just store ID
        type: 'EXPENSE', // Credit Card Spend
        amount: -amount,
        description: `${description} (Credit Card)`,
        date: date || new Date()
    });

    await recordSessionTransactions(card.user, [tx._id]);

    return card;
};

// Billing Cycle Logic (Run Monthly)
const generateStatement = async (card, simulationDate) => {
    // 1. Calculate Statement Balance (Snapshot of current outstanding)
    // Note: In real life, statement balance is expenses in cycle. 
    // Simplified: Statement Balance = Total Outstanding at billing date
    const statementBalance = card.outstandingBalance;

    // 2. Calculate Min Due
    const minDue = Math.max(statementBalance * card.minimumDuePercent, 500); // Min 500 rs
    
    // 3. Set Due Date (e.g. 20 days later)
    const billingDate = new Date(simulationDate);
    const dueDate = new Date(billingDate);
    dueDate.setDate(billingDate.getDate() + 20);

    card.statementBalance = statementBalance;
    card.minimumDue = statementBalance > 0 ? (minDue > statementBalance ? statementBalance : minDue) : 0;
    card.lastStatementDate = billingDate;
    card.nextDueDate = dueDate;

    await card.save();
    return card;
};

// Payment Logic
const payBill = async (userId, cardId, amount, fromAccountId, date) => {
    const card = await CreditCard.findById(cardId);
    const account = await BankAccount.findOne({ _id: fromAccountId, user: userId });
    
    if (!card || !account) throw new Error('Card or Account not found');
    if (account.balance < amount) throw new Error('Insufficient bank balance');

    // 1. Deduct from Bank
    account.balance -= Number(amount);
    await account.save();

    // 2. Pay Card
    card.outstandingBalance -= Number(amount);
    card.availableCredit += Number(amount);
    
    // Adjust statement balance logic if paying specific bill?
    // Simplified: Just reduce outstanding. 
    // Real world: Payment clears statement balance first.
    if (card.statementBalance > 0) {
        card.statementBalance -= Number(amount);
        if (card.statementBalance < 0) card.statementBalance = 0;
    }
    
    if (card.minimumDue > 0) {
        card.minimumDue -= Number(amount);
        if (card.minimumDue < 0) card.minimumDue = 0;
    }

    await card.save();

    // 3. Log Transactions
    const tx = await Transaction.create({
        user: userId,
        account: account._id,
        type: 'PAYMENT',
        amount: -amount,
        description: `Credit Card Bill Payment (${card.cardNumber.slice(-4)})`,
        date: date || new Date()
    });

    await recordSessionTransactions(userId, [tx._id]);

    return { card, account };
};

// Interest Application (Run Daily or Monthly? Monthly per prompt)
const applyInterest = async (card, simulationDate) => {
    // Only apply if past due date and balance remains
    if (!card.nextDueDate) return;
    
    // Idempotency Check: Prevent multiple interest applications in the same month
    if (card.lastInterestAppliedDate) {
        const lastDate = new Date(card.lastInterestAppliedDate);
        const simDate = new Date(simulationDate);
        if (lastDate.getMonth() === simDate.getMonth() && 
            lastDate.getFullYear() === simDate.getFullYear()) {
            return; // Already applied for this month
        }
    }

    if (new Date(simulationDate) > new Date(card.nextDueDate) && card.statementBalance > 0) {
        // Late! Apply Interest
        // Monthly Rate
        const monthlyRate = card.interestRate / 100 / 12;
        const interest = card.outstandingBalance * monthlyRate; // Interest on entire outstanding usually
        
        card.outstandingBalance += interest;
        card.availableCredit -= interest; // Reduces limit
        card.totalInterestPaid += interest; // Tracking (technically not paid yet, but accrued)

        // Late Fee
        const lateFee = 500;
        card.outstandingBalance += lateFee;
        card.availableCredit -= lateFee;
        card.missedPaymentsCount += 1;
        
        // Mark as applied
        card.lastInterestAppliedDate = simulationDate;

        await card.save();
        
        const tx1 = await Transaction.create({
            user: card.user,
            account: card._id,
            type: 'INTEREST',
            amount: -interest,
            description: `Credit Card Interest Charge`,
            date: simulationDate
        });
        
        const tx2 = await Transaction.create({
            user: card.user,
            account: card._id,
            type: 'EXPENSE', // Or FEE? Using EXPENSE as per schema
            amount: -lateFee,
            description: `Credit Card Late Fee`,
            date: simulationDate
        });

        await recordSessionTransactions(card.user, [tx1._id, tx2._id]);
    }
};

module.exports = {
    createCard,
    spend,
    generateStatement,
    payBill,
    applyInterest
};
