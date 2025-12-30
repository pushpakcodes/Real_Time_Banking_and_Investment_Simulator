import { useEffect, useState, useCallback } from 'react';
import api from '../api';
import { useToast } from '../context/ToastContext';
import { TrendingUp, Activity, PieChart, Search, Plus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area } from 'recharts';
import { motion } from 'framer-motion';
import { GlassCard } from '../components/ui/GlassCard';
import { GlowingButton } from '../components/ui/GlowingButton';

const Stocks = () => {
  const [stocks, setStocks] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [selectedStockForPred, setSelectedStockForPred] = useState(null);
  
  // Search State
  const [searchSymbol, setSearchSymbol] = useState('');
  const [searchedStock, setSearchedStock] = useState(null);
  const [addQty, setAddQty] = useState('');
  
  // Sell Modal State
  const [showSellModal, setShowSellModal] = useState(false);
  const [sellStockId, setSellStockId] = useState(null);
  const [sellQty, setSellQty] = useState('');

  const { toast } = useToast();
  const isMotionAvailable = !!motion;

  const fetchData = useCallback(async () => {
    try {
      const [s, p, a] = await Promise.all([
        api.get('/stocks'),
        api.get('/stocks/portfolio'),
        api.get('/bank/accounts')
      ]);
      setStocks(s.data);
      setPortfolio(p.data);
      setAccounts(a.data);
      if (a.data.length > 0 && !selectedAccount) setSelectedAccount(a.data[0]._id);
    } catch (err) {
      console.error(err);
    }
  }, [selectedAccount]);

  useEffect(() => {
    Promise.resolve().then(() => fetchData());
  }, [fetchData]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchSymbol) return;
    try {
      const { data } = await api.get(`/stocks/search?symbol=${searchSymbol}`);
      setSearchedStock(data);
    } catch {
      toast.error('Stock not found or API error');
      setSearchedStock(null);
    }
  };

  const handleAddHolding = async () => {
    if (!searchedStock || !addQty) return;
    try {
      await api.post('/stocks/buy', {
        symbol: searchedStock.symbol,
        quantity: addQty,
        accountId: selectedAccount
      });
      toast.success(`Bought ${addQty} ${searchedStock.symbol} successfully!`);
      setSearchSymbol('');
      setSearchedStock(null);
      setAddQty('');
      fetchData();
    } catch (err) {
      toast.error('Error: ' + err.response?.data?.message);
    }
  };

  const handleBuy = async (stockId) => {
    const qty = prompt('Enter quantity to buy:');
    if (!qty) return;
    try {
      await api.post('/stocks/buy', {
        stockId,
        quantity: qty,
        accountId: selectedAccount
      });
      toast.success('Bought successfully!');
      fetchData();
    } catch (err) {
      toast.error('Error: ' + err.response?.data?.message);
    }
  };

  const openSellModal = (stockId) => {
    setSellStockId(stockId);
    setSellQty('');
    setShowSellModal(true);
  };

  const confirmSell = async () => {
    if (!sellQty || !sellStockId) return;
    try {
      await api.post('/stocks/sell', {
        stockId: sellStockId,
        quantity: sellQty,
        accountId: selectedAccount
      });
      toast.success('Sold successfully!');
      setShowSellModal(false);
      setSellStockId(null);
      setSellQty('');
      fetchData();
    } catch (err) {
      toast.error('Error: ' + err.response?.data?.message);
    }
  };

  const handlePredict = async (stock) => {
    setSelectedStockForPred(stock);
    try {
      const { data } = await api.get(`/stocks/${stock._id}/prediction?days=30`);
      setPrediction(data);
    } catch {
      toast.error('Error fetching prediction');
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
      <div className="flex justify-between items-center">
        <motion.h1 variants={itemVariants} className="text-3xl font-bold text-white">Stock Market</motion.h1>
        <motion.div variants={itemVariants} className="flex items-center space-x-3 bg-black/20 p-2 rounded-xl border border-white/5">
          <label className="text-gray-400 text-sm font-medium ml-2">Trading Account:</label>
          <select 
            value={selectedAccount} 
            onChange={e => setSelectedAccount(e.target.value)}
            className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 [&>option]:bg-gray-900"
          >
            {accounts.map(a => (
              <option key={a._id} value={a._id}>{a.bankName} (₹{a.balance.toFixed(2)})</option>
            ))}
          </select>

    </motion.div>
      {isMotionAvailable && null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Search & Buy Stocks */}
        <GlassCard variants={itemVariants} className="col-span-1 lg:col-span-2">
          <h3 className="text-xl font-semibold text-gray-200 flex items-center gap-2 mb-4">
            <Search className="text-blue-400" /> Search & Buy Stocks
          </h3>
          <div className="flex flex-col md:flex-row gap-4 items-end">
             <div className="flex-1 w-full">
                <label className="block text-sm font-medium text-gray-400 mb-1">Search Stock Symbol</label>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={searchSymbol}
                        onChange={(e) => setSearchSymbol(e.target.value.toUpperCase())}
                        placeholder="e.g. IBM, AAPL"
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                    <button 
                        onClick={handleSearch}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl transition-colors"
                    >
                        Search
                    </button>
                </div>
             </div>

             {searchedStock && (
                 <>
                    <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                        <p className="text-sm text-gray-400">Current Price</p>
                        <p className="text-xl font-bold text-emerald-400">₹{Number(searchedStock.price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                    <div className="w-32">
                        <label className="block text-sm font-medium text-gray-400 mb-1">Quantity</label>
                        <input 
                            type="number" 
                            value={addQty}
                            onChange={(e) => setAddQty(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                    </div>
                    <GlowingButton 
                        onClick={handleAddHolding}
                        className="h-[42px] from-emerald-600 to-teal-600"
                    >
                        <Plus size={18} className="mr-1" /> Buy
                    </GlowingButton>
                 </>
             )}
          </div>
        </GlassCard>

        {/* Market Table */}
        <GlassCard variants={itemVariants} className="overflow-hidden p-0">
          <div className="p-6 border-b border-white/10">
            <h3 className="text-xl font-semibold text-gray-200 flex items-center gap-2">
              <Activity className="text-blue-400" /> Live Market
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5">
                <tr className="text-gray-400 text-sm uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">Symbol</th>
                  <th className="px-6 py-4 font-medium text-right">Price</th>
                  <th className="px-6 py-4 font-medium text-center">Trend</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stocks.map(s => (
                  <tr key={s._id} className="group hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{s.symbol}</td>
                    <td className="px-6 py-4 text-right text-emerald-400 font-mono">₹{s.currentPrice.toFixed(2)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.trend === 'UP' ? 'bg-emerald-500/20 text-emerald-400' : s.trend === 'DOWN' ? 'bg-red-500/20 text-red-400' : 'bg-gray-600/20 text-gray-400'}`}>
                        {s.trend}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => handlePredict(s)} className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">Predict</button>
                      <button 
                        onClick={() => handleBuy(s._id)} 
                        className="bg-emerald-600/80 hover:bg-emerald-600 text-white px-3 py-1 rounded-lg text-sm transition-all border border-emerald-500/50"
                      >
                        Buy
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* Portfolio Table */}
        <GlassCard variants={itemVariants} className="overflow-hidden p-0">
          <div className="p-6 border-b border-white/10">
            <h3 className="text-xl font-semibold text-gray-200 flex items-center gap-2">
              <PieChart className="text-purple-400" /> Your Portfolio
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5">
                <tr className="text-gray-400 text-sm uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">Symbol</th>
                  <th className="px-6 py-4 font-medium text-right">Qty</th>
                  <th className="px-6 py-4 font-medium text-right">Avg</th>
                  <th className="px-6 py-4 font-medium text-right">P/L</th>
                  <th className="px-6 py-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {portfolio.map(p => {
                  const currentPrice = p.stock.currentPrice || 0;
                  const pl = (currentPrice - p.averageBuyPrice) * p.quantity;
                  return (
                    <tr key={p._id} className="group hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-medium text-white">{p.stock.symbol}</td>
                      <td className="px-6 py-4 text-right text-gray-300">{p.quantity}</td>
                      <td className="px-6 py-4 text-right text-gray-300">₹{p.averageBuyPrice.toFixed(2)}</td>
                      <td className={`px-6 py-4 text-right font-medium ${pl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {pl >= 0 ? '+' : ''}₹{pl.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => openSellModal(p.stock._id)} 
                          className="bg-red-600/80 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm transition-all border border-red-500/50"
                        >
                          Sell
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {portfolio.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">No stocks owned. Start trading!</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>

      {/* Prediction Modal/Section */}
      {prediction && selectedStockForPred && (
        <GlassCard variants={itemVariants} className="mt-6 border-blue-500/30 bg-blue-900/10">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-200 flex items-center gap-2">
              <TrendingUp className="text-blue-400" /> Prediction for {selectedStockForPred.symbol} (Next 30 Days)
            </h3>
            <button 
              onClick={() => setPrediction(null)} 
              className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors text-sm"
            >
              Close Analysis
            </button>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={prediction.predictions.map((p, i) => ({ 
                  day: i+1, 
                  price: p.expectedPrice, 
                  upper: p.upperBound, 
                  lower: p.lowerBound 
              }))}>
                <defs>
                  <linearGradient id="confidenceFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                    dataKey="day" 
                    stroke="#9ca3af" 
                    tick={{fill: '#9ca3af', fontSize: 12}}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                />
                <YAxis 
                    domain={['auto', 'auto']} 
                    stroke="#9ca3af" 
                    tick={{fill: '#9ca3af', fontSize: 12}}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `₹${val.toFixed(0)}`}
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
                  formatter={(value) => [`₹${Number(value).toFixed(2)}`, '']}
                />
                <Area type="monotone" dataKey="upper" stroke="none" fill="url(#confidenceFill)" />
                <Area type="monotone" dataKey="lower" stroke="none" fill="url(#confidenceFill)" />
                <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{r: 6}} name="Forecast" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-4 text-center">
            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
              <p className="text-gray-400 text-sm mb-1">Expected Return</p>
              <p className={`text-xl font-bold ${prediction.expectedReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {prediction.expectedReturn > 0 ? '+' : ''}{prediction.expectedReturn.toFixed(2)}%
              </p>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <p className="text-gray-400 text-sm mb-1">Risk Factor</p>
                <p className="text-xl font-bold text-amber-400">{selectedStockForPred.volatility * 100}%</p>
            </div>
             <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <p className="text-gray-400 text-sm mb-1">Confidence</p>
                <p className="text-xl font-bold text-blue-400">85%</p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Sell Modal */}
      {showSellModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-xl"
          >
            <h3 className="text-xl font-bold text-white mb-4">Sell Stock</h3>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">Quantity to Sell</label>
              <input 
                type="number" 
                value={sellQty}
                onChange={(e) => setSellQty(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 text-lg"
                placeholder="0"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowSellModal(false)}
                className="flex-1 px-4 py-2 rounded-xl bg-white/5 text-gray-300 hover:bg-white/10 transition-colors font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={confirmSell}
                className="flex-1 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white transition-colors font-medium"
              >
                Confirm Sell
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default Stocks;
