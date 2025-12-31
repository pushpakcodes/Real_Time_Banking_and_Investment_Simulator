import { useState, useEffect } from 'react';
import api from '../api';
import { ArrowUpRight, ArrowDownLeft, Search, Filter, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { GlassCard } from '../components/ui/GlassCard';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, DEPOSIT, WITHDRAWAL, TRANSFER, EMI, LOAN_DISBURSAL
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const { data } = await api.get('/bank/transactions');
        setTransactions(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const filteredTransactions = transactions.filter(tx => {
    const matchesFilter = filter === 'ALL' || tx.type === filter;
    const matchesSearch = tx.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (tx.account?.bankName || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getAmountColor = (type, amount) => {
    if (amount > 0) return 'text-emerald-400';
    if (amount < 0) return 'text-red-400';
    return 'text-white';
  };

  const getTypeIcon = (type) => {
    switch (type) {
        case 'DEPOSIT':
        case 'FD_MATURITY':
        case 'LOAN_DISBURSAL':
            return <ArrowDownLeft className="h-4 w-4 text-emerald-400" />;
        case 'WITHDRAWAL':
        case 'EMI':
        case 'FD_CREATION':
        case 'INVESTMENT':
            return <ArrowUpRight className="h-4 w-4 text-red-400" />;
        case 'TRANSFER':
            return <ArrowUpRight className="h-4 w-4 text-blue-400" />;
        default:
            return <ArrowUpRight className="h-4 w-4 text-gray-400" />;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (loading) return <div className="text-gray-400 p-8">Loading Transactions...</div>;

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8 pb-8"
    >
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
            Transaction History
          </h1>
          <p className="text-gray-400 mt-2">Track all your financial activities</p>
        </div>
      </div>

      <GlassCard className="p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Search transactions..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                {['ALL', 'DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'EMI', 'INVESTMENT'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                            filter === f 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                        }`}
                    >
                        {f.replace('_', ' ')}
                    </button>
                ))}
            </div>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="text-left border-b border-white/10">
                        <th className="pb-4 text-gray-400 font-medium">Date</th>
                        <th className="pb-4 text-gray-400 font-medium">Description</th>
                        <th className="pb-4 text-gray-400 font-medium">Account</th>
                        <th className="pb-4 text-gray-400 font-medium">Type</th>
                        <th className="pb-4 text-right text-gray-400 font-medium">Amount</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {filteredTransactions.length > 0 ? (
                        filteredTransactions.map((tx) => (
                            <motion.tr 
                                key={tx._id} 
                                variants={itemVariants}
                                className="group hover:bg-white/5 transition-colors"
                            >
                                <td className="py-4 text-gray-300">
                                    {new Date(tx.date).toLocaleDateString('en-IN', { 
                                        day: 'numeric', month: 'short', year: 'numeric',
                                        hour: '2-digit', minute: '2-digit'
                                    })}
                                </td>
                                <td className="py-4">
                                    <div className="font-medium text-white group-hover:text-blue-400 transition-colors">
                                        {tx.description}
                                    </div>
                                </td>
                                <td className="py-4 text-gray-400 text-sm">
                                    {tx.account ? `${tx.account.bankName} (...${tx.account.accountNumber.slice(-4)})` : 'N/A'}
                                </td>
                                <td className="py-4">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-white/5 ${getAmountColor(tx.type, tx.amount)}`}>
                                        {getTypeIcon(tx.type)}
                                        {tx.type.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className={`py-4 text-right font-medium ${getAmountColor(tx.type, tx.amount)}`}>
                                    {tx.amount > 0 ? '+' : ''}₹{Math.abs(tx.amount).toLocaleString('en-IN')}
                                </td>
                            </motion.tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="5" className="py-8 text-center text-gray-500">
                                No transactions found matching your criteria.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default Transactions;
