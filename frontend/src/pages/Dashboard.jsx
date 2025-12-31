import { useEffect, useState } from 'react';
import api from '../api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { GlassCard } from '../components/ui/GlassCard';
import { TrendingUp, IndianRupee, Briefcase } from 'lucide-react';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scaleType, setScaleType] = useState('linear'); // 'linear' | 'log'
  const [viewMode, setViewMode] = useState('absolute'); // 'absolute' | 'relative'

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await api.get('/analytics/dashboard');
        setData(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="text-gray-400 p-8">Loading Dashboard...</div>;
  if (!data) return <div className="text-red-400 p-8">Error loading data</div>;

  // Process data for Chart
  let chartData = [];
  let initialNetWorth = 1;

  if (data.snapshots && data.snapshots.length > 0) {
      initialNetWorth = data.snapshots[0].netWorth || 1;
      
      chartData = data.snapshots.map(s => {
          let nw = s.netWorth;
          // Relative Mode: Normalized to Initial Net Worth (1.0 = baseline)
          if (viewMode === 'relative') {
              nw = initialNetWorth !== 0 ? (s.netWorth / initialNetWorth) : 1;
          }

          return {
            date: new Date(s.date).toLocaleDateString(),
            netWorth: nw,
            bank: s.totalBankBalance,
            stocks: s.totalStockValue,
            originalNetWorth: s.netWorth // For tooltip
          };
      });
  }

  const current = data.current || { netWorth: 0, totalBankBalance: 0, totalStockValue: 0 };

  // Safety check for Log Scale
  const hasNonPositive = chartData.some(d => d.netWorth <= 0);
  const effectiveScale = (scaleType === 'log' && !hasNonPositive) ? 'log' : 'linear';

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
        <motion.h1 variants={itemVariants} className="text-3xl font-bold text-white">Financial Dashboard</motion.h1>
        <motion.span variants={itemVariants} className="text-sm text-gray-400">Last updated: {new Date().toLocaleTimeString()}</motion.span>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard variants={itemVariants} className="bg-emerald-500/10 border-emerald-500/20">
            <div className="flex items-center space-x-4">
                <div className="p-3 bg-emerald-500/20 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                    <p className="text-gray-400 text-sm">Net Worth</p>
                    <p className="text-2xl font-bold text-white">₹{current.netWorth?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
            </div>
        </GlassCard>

        <GlassCard variants={itemVariants} className="bg-blue-500/10 border-blue-500/20">
            <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                    <IndianRupee className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                    <p className="text-gray-400 text-sm">Bank Balance</p>
                    <p className="text-2xl font-bold text-white">₹{current.totalBankBalance?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
            </div>
        </GlassCard>

        <GlassCard variants={itemVariants} className="bg-purple-500/10 border-purple-500/20">
            <div className="flex items-center space-x-4">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                    <Briefcase className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                    <p className="text-gray-400 text-sm">Stock Value</p>
                    <p className="text-2xl font-bold text-white">₹{current.totalStockValue?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
            </div>
        </GlassCard>
      </div>

      {/* Main Chart */}
      <GlassCard variants={itemVariants} className="h-96 p-6 flex flex-col">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-200">Net Worth Growth</h3>
            
            <div className="flex space-x-4">
                {/* Scale Toggle */}
                <div className="flex bg-gray-800 rounded-lg p-1">
                    <button 
                        onClick={() => setScaleType('linear')}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${scaleType === 'linear' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        Linear
                    </button>
                    <button 
                        onClick={() => setScaleType('log')}
                        disabled={hasNonPositive}
                        title={hasNonPositive ? "Cannot use Log scale with zero or negative values" : ""}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${scaleType === 'log' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'} ${hasNonPositive ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        Log
                    </button>
                </div>

                {/* View Mode Toggle */}
                <div className="flex bg-gray-800 rounded-lg p-1">
                    <button 
                        onClick={() => setViewMode('absolute')}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${viewMode === 'absolute' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        Absolute
                    </button>
                    <button 
                        onClick={() => setViewMode('relative')}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${viewMode === 'relative' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        Relative
                    </button>
                </div>
            </div>
        </div>

        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#9ca3af" 
                tick={{fill: '#9ca3af', fontSize: 12}}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis 
                scale={effectiveScale}
                domain={effectiveScale === 'log' ? ['auto', 'auto'] : ['auto', 'auto']}
                stroke="#9ca3af" 
                tick={{fill: '#9ca3af', fontSize: 12}}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => {
                    if (viewMode === 'relative') return `${value.toFixed(2)}x`;
                    if (Math.abs(value) >= 1000000) return `₹${(value/1000000).toFixed(1)}M`;
                    if (Math.abs(value) >= 1000) return `₹${Math.round(value/1000)}k`;
                    return `₹${value}`;
                }}
              />
              <Tooltip 
                contentStyle={{ 
                    backgroundColor: 'rgba(17, 24, 39, 0.9)', 
                    borderColor: 'rgba(255, 255, 255, 0.1)', 
                    backdropFilter: 'blur(8px)',
                    borderRadius: '8px',
                    color: '#fff' 
                }}
                itemStyle={{ color: '#fff' }}
                formatter={(value, name, props) => {
                    if (name === "Net Worth") {
                        const original = props.payload.originalNetWorth;
                        if (viewMode === 'relative') return [`${value.toFixed(2)}x (₹${original.toLocaleString()})`, name];
                        return [`₹${Number(value).toLocaleString()}`, name];
                    }
                    return [`₹${Number(value).toLocaleString()}`, name];
                }}
              />
              <Legend wrapperStyle={{paddingTop: '20px'}} />
              <Line type="monotone" dataKey="netWorth" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{r: 6}} name="Net Worth" />
              <Line type="monotone" dataKey="bank" stroke="#60a5fa" strokeWidth={2} dot={false} name="Bank Balance" />
              <Line type="monotone" dataKey="stocks" stroke="#a855f7" strokeWidth={2} dot={false} name="Stock Value" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <p>No simulation data yet.</p>
            <p className="text-sm mt-2">Use the simulator in the top bar to advance time!</p>
          </div>
        )}
      </GlassCard>

      {/* Transactions Table */}
      <GlassCard variants={itemVariants} className="overflow-hidden p-0">
        <div className="p-6 border-b border-white/10">
            <h3 className="text-xl font-semibold text-gray-200">Recent Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/5">
              <tr className="text-gray-400 text-sm uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Description</th>
                <th className="px-6 py-4 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.recentTransactions.map(tx => (
                <tr key={tx._id} className="group hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-gray-300 whitespace-nowrap">{new Date(tx.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-gray-300 capitalize">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        tx.type === 'deposit' ? 'bg-emerald-500/20 text-emerald-400' :
                        tx.type === 'withdrawal' ? 'bg-red-500/20 text-red-400' :
                        'bg-blue-500/20 text-blue-400'
                    }`}>
                        {tx.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-300">{tx.description}</td>
                  <td className={`px-6 py-4 text-right font-medium ${tx.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {tx.amount >= 0 ? '+' : ''}{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.recentTransactions.length === 0 && (
            <p className="text-center text-gray-500 py-12">No transactions yet.</p>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default Dashboard;
