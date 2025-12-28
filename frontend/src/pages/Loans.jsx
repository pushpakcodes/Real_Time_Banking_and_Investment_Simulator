import { useEffect, useState } from 'react';
import api from '../api';
import { DollarSign, Briefcase, GraduationCap, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import { GlassCard } from '../components/ui/GlassCard';
import { GlowingButton } from '../components/ui/GlowingButton';

const Loans = () => {
  const [loans, setLoans] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form
  const [type, setType] = useState('PERSONAL');
  const [amount, setAmount] = useState(10000);
  const [tenure, setTenure] = useState(12);
  const [accountId, setAccountId] = useState('');

  const fetchData = async () => {
    try {
      const [l, a] = await Promise.all([
        api.get('/loans'),
        api.get('/bank/accounts')
      ]);
      setLoans(l.data);
      setAccounts(a.data);
      if (a.data.length > 0 && !accountId) setAccountId(a.data[0]._id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleApply = async (e) => {
    e.preventDefault();
    try {
      await api.post('/loans/apply', { type, amount, tenureMonths: tenure, accountId });
      alert('Loan Disbursed!');
      fetchData();
    } catch (err) {
      alert('Error: ' + err.response?.data?.message);
    }
  };

  if (loading) return <div className="text-gray-400 p-8">Loading Loans...</div>;

  const getLoanIcon = (type) => {
    switch(type) {
      case 'HOME': return <Home className="text-blue-400" />;
      case 'EDUCATION': return <GraduationCap className="text-purple-400" />;
      default: return <Briefcase className="text-emerald-400" />;
    }
  };

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
      <motion.h1 variants={itemVariants} className="text-3xl font-bold text-white">Loan Management</motion.h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Loans */}
        <div className="space-y-4">
          <motion.h3 variants={itemVariants} className="text-xl font-semibold text-gray-200 flex items-center gap-2">
            <DollarSign className="text-red-400" /> Active Liabilities
          </motion.h3>
          <div className="grid gap-4">
            {loans.map(l => (
              <GlassCard 
                key={l._id} 
                variants={itemVariants}
                className="hover:border-red-500/30 transition-colors group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/5 p-2 rounded-lg border border-white/10 group-hover:bg-white/10 transition-colors">
                      {getLoanIcon(l.type)}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white capitalize">{l.type.toLowerCase()} Loan</h4>
                      <p className="text-xs text-gray-400">ID: {l._id.slice(-6)}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${l.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {l.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Principal</p>
                    <p className="text-white font-medium">${l.principal.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Remaining</p>
                    <p className="text-white font-medium">${l.remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">EMI</p>
                    <p className="text-red-400 font-bold">${l.emiAmount.toFixed(2)}/mo</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Interest Paid</p>
                    <p className="text-white font-medium">${l.totalInterestPaid.toFixed(2)}</p>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="w-full bg-white/10 rounded-full h-2.5">
                    <div 
                      className="bg-emerald-500 h-2.5 rounded-full" 
                      style={{ width: `${((l.principal - l.remainingBalance) / l.principal) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-right text-gray-400 mt-1">
                    {Math.round(((l.principal - l.remainingBalance) / l.principal) * 100)}% Repaid
                  </p>
                </div>
              </GlassCard>
            ))}
            {loans.length === 0 && <p className="text-gray-500">No active loans. You are debt-free!</p>}
          </div>
        </div>

        {/* Apply Form */}
        <GlassCard variants={itemVariants} className="h-fit">
          <h3 className="text-xl font-semibold text-gray-200 mb-6 flex items-center gap-2">
            <Briefcase className="text-emerald-400" /> Apply for Loan
          </h3>
          <form onSubmit={handleApply} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Loan Type</label>
              <select 
                value={type} 
                onChange={e => setType(e.target.value)} 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all [&>option]:bg-gray-900"
              >
                <option value="PERSONAL">Personal (12% Interest)</option>
                <option value="HOME">Home (8% Interest)</option>
                <option value="EDUCATION">Education (10% Interest)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Amount ($)</label>
              <input 
                type="number" 
                value={amount} 
                onChange={e => setAmount(e.target.value)} 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all hover:bg-white/10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Tenure (Months)</label>
              <input 
                type="number" 
                value={tenure} 
                onChange={e => setTenure(e.target.value)} 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all hover:bg-white/10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Credit To Account</label>
              <select 
                value={accountId} 
                onChange={e => setAccountId(e.target.value)} 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all [&>option]:bg-gray-900"
              >
                {accounts.map(a => (
                  <option key={a._id} value={a._id}>{a.bankName}</option>
                ))}
              </select>
            </div>

            <GlowingButton 
              type="submit" 
              className="w-full from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500"
            >
              Apply Now
            </GlowingButton>
          </form>
        </GlassCard>
      </div>
    </motion.div>
  );
};

export default Loans;
