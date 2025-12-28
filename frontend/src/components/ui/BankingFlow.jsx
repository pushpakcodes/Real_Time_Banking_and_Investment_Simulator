import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown, Wallet, ShieldCheck } from 'lucide-react';

const TransactionItem = ({ type, name, amount, delay }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 mb-2 last:mb-0"
  >
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-full ${type === 'credit' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
        {type === 'credit' ? <ArrowDown size={16} /> : <ArrowUp size={16} />}
      </div>
      <div>
        <p className="text-sm font-medium text-white">{name}</p>
        <p className="text-[10px] text-gray-400">Today, 10:42 AM</p>
      </div>
    </div>
    <span className={`text-sm font-bold ${type === 'credit' ? 'text-emerald-400' : 'text-white'}`}>
      {type === 'credit' ? '+' : '-'}${amount}
    </span>
  </motion.div>
);

export const BankingFlow = () => {
  return (
    <div className="w-full max-w-lg mx-auto relative">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl shadow-blue-900/20 overflow-hidden"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Wallet className="text-blue-400" size={20} />
              Smart Banking
            </h3>
            <p className="text-xs text-gray-400">Instant transfers & insights</p>
          </div>
          <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
             <ShieldCheck size={16} className="text-blue-400" />
          </div>
        </div>

        <div className="flex gap-6">
            {/* Card Visualization */}
            <div className="w-1/3 hidden sm:block">
                <motion.div 
                    className="w-full aspect-[1.586] rounded-xl bg-gradient-to-br from-money-green to-money-dark p-4 flex flex-col justify-between relative overflow-hidden shadow-lg border border-white/5"
                    animate={{ 
                        rotateY: [0, 10, 0],
                        y: [0, -5, 0]
                    }}
                    transition={{ 
                        duration: 6, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                    }}
                >
                    <div className="flex justify-between items-start z-10">
                        <div className="w-8 h-5 bg-white/20 rounded-md backdrop-blur-sm" />
                        <span className="text-white/80 font-bold italic text-xs">VISA</span>
                    </div>
                    <div className="z-10">
                        <div className="flex gap-2 mb-2">
                            <div className="w-full h-1 bg-white/20 rounded-full" />
                            <div className="w-2/3 h-1 bg-white/20 rounded-full" />
                        </div>
                         <p className="text-[10px] text-white/60 font-mono tracking-widest">**** 4242</p>
                    </div>
                    
                    {/* Card Shine Effect - Using Framer Motion directly for safety */}
                    <motion.div 
                        className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0"
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                        style={{ skewX: -12 }}
                    />
                </motion.div>
            </div>

            {/* Recent Activity */}
            <div className="flex-1">
                <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">Recent Activity</p>
                <div className="space-y-2">
                    <TransactionItem type="debit" name="Apple Store" amount="1,299.00" delay={0.4} />
                    <TransactionItem type="credit" name="Salary Deposit" amount="8,450.00" delay={0.6} />
                </div>
            </div>
        </div>

        {/* Decorative Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />
      </motion.div>
    </div>
  );
};
