import { useState, useEffect } from 'react';
import api from '../api';
import { useToast } from '../context/ToastContext';
import { CreditCard, Plus, ShoppingBag, Receipt, AlertCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '../components/ui/GlassCard';
import { GlowingButton } from '../components/ui/GlowingButton';

const CreditCards = () => {
  const [cards, setCards] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showSpendForm, setShowSpendForm] = useState(false);
  const [showPayForm, setShowPayForm] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  
  // Form States
  const [newLimit, setNewLimit] = useState(50000);
  const [spendAmount, setSpendAmount] = useState('');
  const [spendDesc, setSpendDesc] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payAccount, setPayAccount] = useState('');
  
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      const [cardsRes, accRes] = await Promise.all([
        api.get('/credit-cards'),
        api.get('/bank/accounts')
      ]);
      setCards(cardsRes.data);
      setAccounts(accRes.data);
      if (cardsRes.data.length > 0 && !selectedCard) {
        setSelectedCard(cardsRes.data[0]);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load credit card data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateCard = async (e) => {
    e.preventDefault();
    try {
      await api.post('/credit-cards', { limit: Number(newLimit) });
      toast.success('Credit Card issued successfully!');
      setShowCreateForm(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating card');
    }
  };

  const handleSpend = async (e) => {
    e.preventDefault();
    if (!selectedCard) return;
    try {
      await api.post('/credit-cards/spend', {
        cardId: selectedCard._id,
        amount: Number(spendAmount),
        description: spendDesc
      });
      toast.success('Transaction approved!');
      setShowSpendForm(false);
      setSpendAmount('');
      setSpendDesc('');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transaction declined');
    }
  };

  const handlePay = async (e) => {
    e.preventDefault();
    if (!selectedCard) return;
    try {
      await api.post('/credit-cards/pay', {
        cardId: selectedCard._id,
        amount: Number(payAmount),
        fromAccountId: payAccount
      });
      toast.success('Payment successful!');
      setShowPayForm(false);
      setPayAmount('');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    }
  };

  if (loading) return <div className="text-gray-400 p-8">Loading Cards...</div>;

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <CreditCard className="text-purple-400 h-8 w-8" />
            Credit Cards
          </h1>
          <p className="text-gray-400 mt-1">Manage your credit lines and billing cycles</p>
        </div>
        <GlowingButton onClick={() => setShowCreateForm(true)} icon={Plus}>
          Apply for Card
        </GlowingButton>
      </div>

      {/* Cards List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Card List */}
        <div className="lg:col-span-2 space-y-4">
          {cards.length === 0 ? (
            <GlassCard className="p-8 text-center text-gray-400">
              No credit cards found. Apply for one to get started.
            </GlassCard>
          ) : (
            <div className="grid gap-4">
              {cards.map(card => (
                <motion.div
                  key={card._id}
                  onClick={() => setSelectedCard(card)}
                  whileHover={{ scale: 1.01 }}
                  className={`p-6 rounded-2xl cursor-pointer border transition-all ${
                    selectedCard?._id === card._id 
                      ? 'bg-purple-900/20 border-purple-500/50' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-md opacity-80" />
                        <div>
                            <h3 className="font-bold text-white">{card.cardName}</h3>
                            <p className="text-sm text-gray-400">**** **** **** {card.cardNumber.slice(-4)}</p>
                        </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                        card.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                        {card.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                        <p className="text-xs text-gray-400">Outstanding Balance</p>
                        <p className="text-xl font-bold text-white">₹{card.outstandingBalance.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400">Available Credit</p>
                        <p className="text-xl font-bold text-green-400">₹{card.availableCredit.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/10 flex justify-between text-sm">
                    <div className="text-gray-400">
                        Limit: <span className="text-white">₹{card.creditLimit.toLocaleString()}</span>
                    </div>
                    <div className="text-gray-400">
                        Due: <span className="text-red-400">{card.nextDueDate ? new Date(card.nextDueDate).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {selectedCard && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Statement Summary */}
                <GlassCard className="p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Receipt className="text-blue-400 h-5 w-5" />
                        Statement Summary
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Statement Balance</span>
                            <span className="text-white">₹{selectedCard.statementBalance.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Min Due</span>
                            <span className="text-red-400 font-bold">₹{selectedCard.minimumDue.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Billing Cycle</span>
                            <span className="text-white">Day {selectedCard.billingDay}</span>
                        </div>
                         <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Interest Rate</span>
                            <span className="text-white">{selectedCard.interestRate}% APR</span>
                        </div>
                    </div>
                </GlassCard>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => setShowSpendForm(true)}
                        className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex flex-col items-center gap-2"
                    >
                        <ShoppingBag className="text-purple-400 h-6 w-6" />
                        <span className="text-sm font-bold text-white">Spend</span>
                    </button>
                     <button 
                        onClick={() => setShowPayForm(true)}
                        className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex flex-col items-center gap-2"
                    >
                        <CheckCircle className="text-green-400 h-6 w-6" />
                        <span className="text-sm font-bold text-white">Pay Bill</span>
                    </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showCreateForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <GlassCard className="w-full max-w-md p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Apply for Credit Card</h2>
              <form onSubmit={handleCreateCard} className="space-y-4">
                <div>
                  <label className="block text-gray-400 mb-2">Credit Limit Request</label>
                  <select 
                    value={newLimit}
                    onChange={(e) => setNewLimit(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="25000">₹25,000 (Silver)</option>
                    <option value="50000">₹50,000 (Gold)</option>
                    <option value="100000">₹1,00,000 (Platinum)</option>
                    <option value="500000">₹5,00,000 (Black)</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 px-4 py-3 rounded-xl bg-white/5 text-white hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 rounded-xl bg-purple-600 text-white hover:bg-purple-700 font-bold"
                  >
                    Apply Now
                  </button>
                </div>
              </form>
            </GlassCard>
          </div>
        )}

        {showSpendForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <GlassCard className="w-full max-w-md p-6">
              <h2 className="text-2xl font-bold text-white mb-6">New Transaction</h2>
              <form onSubmit={handleSpend} className="space-y-4">
                 <div>
                  <label className="block text-gray-400 mb-2">Description</label>
                  <input
                    type="text"
                    value={spendDesc}
                    onChange={(e) => setSpendDesc(e.target.value)}
                    placeholder="e.g. Grocery, Amazon, Uber"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-2">Amount (₹)</label>
                  <input
                    type="number"
                    value={spendAmount}
                    onChange={(e) => setSpendAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowSpendForm(false)}
                    className="flex-1 px-4 py-3 rounded-xl bg-white/5 text-white hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-bold"
                  >
                    Pay
                  </button>
                </div>
              </form>
            </GlassCard>
          </div>
        )}

        {showPayForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <GlassCard className="w-full max-w-md p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Pay Credit Card Bill</h2>
              <form onSubmit={handlePay} className="space-y-4">
                 <div>
                  <label className="block text-gray-400 mb-2">Pay From Account</label>
                  <select
                    value={payAccount}
                    onChange={(e) => setPayAccount(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                    required
                  >
                    <option value="">Select Account</option>
                    {accounts.map(acc => (
                        <option key={acc._id} value={acc._id}>
                            {acc.bankName} - ₹{acc.balance.toLocaleString()}
                        </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 mb-2">Amount (₹)</label>
                  <input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                  <div className="flex gap-2 mt-2">
                    <button type="button" onClick={() => setPayAmount(selectedCard.minimumDue)} className="text-xs bg-white/5 px-2 py-1 rounded text-gray-300 hover:text-white">
                        Min Due: ₹{selectedCard.minimumDue}
                    </button>
                    <button type="button" onClick={() => setPayAmount(selectedCard.outstandingBalance)} className="text-xs bg-white/5 px-2 py-1 rounded text-gray-300 hover:text-white">
                        Full: ₹{selectedCard.outstandingBalance}
                    </button>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowPayForm(false)}
                    className="flex-1 px-4 py-3 rounded-xl bg-white/5 text-white hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 rounded-xl bg-green-600 text-white hover:bg-green-700 font-bold"
                  >
                    Submit Payment
                  </button>
                </div>
              </form>
            </GlassCard>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CreditCards;
