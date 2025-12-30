import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

const StockTicker = ({ symbol, price, change, isUp, delay }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10"
  >
    <span className="font-bold text-xs text-white">{symbol}</span>
    <span className="text-xs text-gray-400">₹{price}</span>
    <span className={`text-[10px] flex items-center ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
      {isUp ? <TrendingUp size={10} className="mr-1" /> : <TrendingDown size={10} className="mr-1" />}
      {change}%
    </span>
  </motion.div>
);

const AnimatedChart = () => {
  const [points, setPoints] = useState([50, 60, 45, 70, 65, 80, 75, 90, 85, 100]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setPoints(prev => {
        const newPoints = [...prev.slice(1)];
        const last = prev[prev.length - 1];
        const next = Math.max(20, Math.min(120, last + (Math.random() * 30 - 15)));
        newPoints.push(next);
        return newPoints;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate SVG path
  const width = 400;
  const height = 200;
  const path = `M 0 ${height - points[0]} ` + points.map((p, i) => `L ${(i / (points.length - 1)) * width} ${height - p}`).join(' ');
  const areaPath = `${path} L ${width} ${height} L 0 ${height} Z`;

  return (
    <div className="relative w-full h-36 overflow-hidden rounded-xl bg-gradient-to-b from-emerald-500/5 to-transparent border border-white/5">
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Area */}
        <motion.path 
          d={areaPath} 
          fill="url(#chartGradient)" 
          stroke="none"
          animate={{ d: areaPath }}
          transition={{ duration: 1, ease: "linear" }}
        />
        
        {/* Line */}
        <motion.path 
          d={path} 
          fill="none" 
          stroke="#10b981" 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          animate={{ d: path }}
          transition={{ duration: 1, ease: "linear" }}
          filter="drop-shadow(0 0 8px rgba(16, 185, 129, 0.5))"
        />
      </svg>
      
      {/* Live Indicator */}
      <div className="absolute top-4 left-4 flex items-center gap-2">
         <div className="relative">
            <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-75"></div>
            <div className="relative h-2 w-2 bg-emerald-500 rounded-full"></div>
         </div>
         <span className="text-xs font-mono text-emerald-400">MARKET LIVE</span>
      </div>
    </div>
  );
};

export const StockMarketFlow = () => {
  return (
    <div className="w-full max-w-lg mx-auto relative">
      {/* Glass Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="relative bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl shadow-money-dark/40 overflow-hidden"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity className="text-money-light" size={20} />
              Market Pulse
            </h3>
            <p className="text-xs text-gray-400">Real-time global indices</p>
          </div>
          <div className="text-right">
             <p className="text-2xl font-bold text-white tracking-tight">₹14,293.42</p>
             <p className="text-xs text-emerald-400 font-medium">+1.24% today</p>
          </div>
        </div>

        {/* Live Chart */}
        <AnimatedChart />

        {/* Floating Tickers */}
        <div className="flex flex-wrap gap-2 mt-6 justify-center">
           <StockTicker symbol="AAPL" price="189.4" change="1.2" isUp={true} delay={0.2} />
           <StockTicker symbol="TSLA" price="242.1" change="0.8" isUp={false} delay={0.4} />
           <StockTicker symbol="NVDA" price="485.2" change="3.5" isUp={true} delay={0.6} />
           <StockTicker symbol="AMZN" price="145.8" change="0.5" isUp={true} delay={0.8} />
        </div>

        {/* Decorative Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 blur-[60px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/20 blur-[60px] rounded-full pointer-events-none" />
      </motion.div>
    </div>
  );
};
