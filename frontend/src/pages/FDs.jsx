import { useEffect, useState } from 'react';
import api from '../api';
import { Lock, Clock, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { GlassCard } from '../components/ui/GlassCard';
import { GlowingButton } from '../components/ui/GlowingButton';

const FDs = () => {
  const [fds, setFds] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form
  const [amount, setAmount] = useState(5000);
  const [tenure, setTenure] = useState(1);
  const [accountId, setAccountId] = useState('');

  const fetchData = async () => {
    try {
      const [f, a] = await Promise.all([
        api.get('/fds'),
        api.get('/bank/accounts')
      ]);
      setFds(f.data);
      setAccounts(a.data);
      if (a.data.length > 0 && !accountId) setAccountId(a.data[0]._id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/fds/create', { amount, tenureYears: tenure, accountId });
      alert('FD Created!');
      fetchData();
    } catch (err) {
      alert('Error: ' + err.response?.data?.message);
    }
  };

  if (loading) return <div className="text-gray-400 p-8">Loading FDs...</div>;

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
      <motion.h1 variants={itemVariants} className="text-3xl font-bold text-white">Fixed Deposits</motion.h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active FDs */}
        <div className="space-y-4">
          <motion.h3 variants={itemVariants} className="text-xl font-semibold text-gray-200 flex items-center gap-2">
            <Lock className="text-amber-400" /> Your Investments
          </motion.h3>
          <div className="grid gap-4">
            {fds.map(f => (
              <GlassCard 
                key={f._id} 
                variants={itemVariants}
                className="hover:border-amber-500/30 transition-colors group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">Fixed Deposit</h4>
                    <p className="text-xs text-gray-400">ID: {f._id.slice(-6)}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${f.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {f.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Principal</p>
                    <p className="text-white font-medium">${f.principal.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Interest Rate</p>
                    <p className="text-emerald-400 font-bold">{f.interestRate}%</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Maturity Date</p>
                    <p className="text-blue-400 font-medium">{new Date(f.maturityDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Accrued Interest</p>
                    <p className="text-amber-400 font-medium">+${(f.accumulatedInterest || 0).toFixed(2)}</p>
                  </div>
                </div>
              </GlassCard>
            ))}
            {fds.length === 0 && <p className="text-gray-500">No active Fixed Deposits.</p>}
          </div>
        </div>

        {/* Create FD Form */}
        <GlassCard variants={itemVariants} className="h-fit">
          <h3 className="text-xl font-semibold text-gray-200 mb-6 flex items-center gap-2">
            <TrendingUp className="text-emerald-400" /> New Investment
          </h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Investment Amount ($)</label>
              <input 
                type="number" 
                value={amount} 
                onChange={e => setAmount(e.target.value)} 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all hover:bg-white/10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Tenure (Years)</label>
              <input 
                type="number" 
                value={tenure} 
                onChange={e => setTenure(e.target.value)} 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all hover:bg-white/10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Debit From Account</label>
              <select 
                value={accountId} 
                onChange={e => setAccountId(e.target.value)} 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all [&>option]:bg-gray-900"
              >
                {accounts.map(a => (
                  <option key={a._id} value={a._id}>{a.bankName} (${a.balance.toFixed(2)})</option>
                ))}
              </select>
            </div>

            <GlowingButton 
              type="submit" 
              className="w-full from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500"
            >
              Create Fixed Deposit
            </GlowingButton>
          </form>
        </GlassCard>
      </div>
    </motion.div>
  );
};

export default FDs;
