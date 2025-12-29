import { useState, useEffect } from 'react';
import api from '../api';
import { useToast } from '../context/ToastContext';
import { Wallet, CreditCard, ArrowRightLeft, Building2, Plus, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '../components/ui/GlassCard';
import { GlowingButton } from '../components/ui/GlowingButton';

const Banking = () => {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAccountType, setNewAccountType] = useState('Savings');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [initialDeposit, setInitialDeposit] = useState('');
  const [transferData, setTransferData] = useState({ toAccountId: '', amount: '' });
  const [selectedAccount, setSelectedAccount] = useState(null);
  
  const { toast } = useToast();

  const banks = [
    "HDFC Bank",
    "SBI Bank",
    "Barclays Bank",
    "Deutsche Bank",
    "Citi Bank",
    "JP Morgan Chase & Co"
  ];

  const fetchBankingData = async () => {
    try {
      const accRes = await api.get('/bank/accounts');
      setAccounts(accRes.data);
      if (accRes.data.length > 0 && !selectedAccount) {
        setSelectedAccount(accRes.data[0]);
      }
      
      const txRes = await api.get('/bank/transactions');
      setTransactions(txRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBankingData();
  }, []);

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    try {
      await api.post('/bank/accounts', {
        type: newAccountType,
        bankName: selectedBank,
        initialDeposit: Number(initialDeposit)
      });
      toast.success('Account created successfully!');
      setShowCreateForm(false);
      setInitialDeposit('');
      fetchBankingData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating account');
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!selectedAccount) return;
    try {
      await api.post('/bank/transfer', {
        fromAccountId: selectedAccount._id,
        toAccountNumber: transferData.toAccountNumber,
        amount: Number(transferData.amount)
      });
      toast.success('Transfer successful!');
      setTransferData({ toAccountNumber: '', amount: '' });
      fetchBankingData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transfer failed');
    }
  };

  if (loading) return <div className="text-gray-400 p-8">Loading Banking...</div>;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <motion.h1 variants={itemVariants} className="text-3xl font-bold text-white">Banking Operations</motion.h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account List */}
        <div className="space-y-4">
          <motion.h3 variants={itemVariants} className="text-xl font-semibold text-gray-200 flex items-center gap-2">
            <Wallet className="text-emerald-400" /> Your Accounts
          </motion.h3>
          <div className="grid gap-4">
            {accounts.map((acc, index) => (
              <GlassCard 
                key={acc._id} 
                variants={itemVariants}
                className="hover:border-emerald-500/50 transition-colors group"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">{acc.bankName}</h4>
                    <p className="text-sm text-gray-400 uppercase tracking-wider">{acc.type}</p>
                  </div>
                  <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-sm font-medium border border-emerald-500/20">
                    {acc.interestRate}% APY
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-1">Account Number</p>
                  <p className="font-mono text-gray-300 bg-black/20 p-2 rounded border border-white/5">{acc.accountNumber}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-sm text-gray-500">Available Balance</p>
                  <p className="text-2xl font-bold text-emerald-400">₹{acc.balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              </GlassCard>
            ))}
            {accounts.length === 0 && <p className="text-gray-500">No accounts open yet.</p>}
          </div>
        </div>

        {/* Operations */}
        <div className="space-y-6">
          {/* Open Account Form */}
          <GlassCard variants={itemVariants}>
            <h3 className="text-xl font-semibold text-gray-200 mb-6 flex items-center gap-2">
              <Plus className="text-blue-400" /> Open New Account
            </h3>
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Bank Name</label>
                <select 
                  value={selectedBank} 
                  onChange={e => setSelectedBank(e.target.value)} 
                  required 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all [&>option]:bg-gray-900"
                >
                  {banks.map((bank) => (
                    <option key={bank} value={bank}>{bank}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Type</label>
                  <select 
                    value={newAccountType} 
                    onChange={e => setNewAccountType(e.target.value)} 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all [&>option]:bg-gray-900"
                  >
                    <option value="Savings">Savings</option>
                    <option value="Current">Current</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Initial Deposit</label>
                  <input 
                    type="number" 
                    value={initialDeposit} 
                    onChange={e => setInitialDeposit(e.target.value)} 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all hover:bg-white/10"
                  />
                </div>
              </div>
              <GlowingButton 
                type="submit" 
                className="w-full from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500"
              >
                Create Account
              </GlowingButton>
            </form>
          </GlassCard>

          {/* Transfer Form */}
          <GlassCard variants={itemVariants}>
            <h3 className="text-xl font-semibold text-gray-200 mb-6 flex items-center gap-2">
              <ArrowRightLeft className="text-purple-400" /> Transfer Money
            </h3>
            <form onSubmit={handleTransfer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">From Account</label>
                <select 
                  value={selectedAccount ? selectedAccount._id : ''}
                  onChange={e => {
                    const acc = accounts.find(a => a._id === e.target.value);
                    setSelectedAccount(acc);
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all [&>option]:bg-gray-900"
                >
                  {accounts.map(acc => (
                    <option key={acc._id} value={acc._id}>
                      {acc.bankName} - ₹{acc.balance.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">To Account Number</label>
                <input 
                  type="text" 
                  value={transferData.toAccountNumber} 
                  onChange={e => setTransferData({ ...transferData, toAccountNumber: e.target.value })} 
                  required 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all hover:bg-white/10"
                  placeholder="Recipient Account Number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Amount</label>
                <input 
                  type="number" 
                  value={transferData.amount} 
                  onChange={e => setTransferData({ ...transferData, amount: e.target.value })} 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all hover:bg-white/10"
                />
              </div>
              <GlowingButton 
                type="submit" 
                className="w-full from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
              >
                Transfer Funds
              </GlowingButton>
            </form>
          </GlassCard>
        </div>
      </div>
    </motion.div>
  );
};

export default Banking;
