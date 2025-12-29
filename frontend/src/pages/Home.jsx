import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AuthContext from '../context/AuthContext';
import { TrendingUp, DollarSign, Clock, ArrowRight, ShieldCheck, BarChart3, Zap } from 'lucide-react';
import { AnimatedBackground } from '../components/ui/AnimatedBackground';
import { GlassCard } from '../components/ui/GlassCard';
import { GlowingButton } from '../components/ui/GlowingButton';
import { StockMarketFlow } from '../components/ui/StockMarketFlow';
import { BankingFlow } from '../components/ui/BankingFlow';
import IntroAnimation from '../components/ui/IntroAnimation';

const Home = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showIntro, setShowIntro] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.5, // Wait for intro fade out slightly
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="relative h-screen w-full overflow-hidden text-white font-sans selection:bg-money-green selection:text-white bg-black">
      <AnimatePresence mode="wait">
        {showIntro && (
          <IntroAnimation key="intro" onComplete={() => setShowIntro(false)} />
        )}
      </AnimatePresence>

      {!showIntro && (
        <>
          <AnimatedBackground />

          {/* Navbar */}
          <motion.nav 
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="fixed top-0 left-0 right-0 z-40 border-b border-white/5 bg-transparent backdrop-blur-sm"
          >
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-tr from-money-green to-money-light shadow-lg shadow-money-green/20">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold tracking-tight">FinSim</span>
              </div>
              <div className="flex items-center space-x-6">
                {user ? (
                  <>
                    <GlowingButton onClick={() => navigate('/dashboard')} className="text-sm px-6 py-2">
                      Dashboard
                    </GlowingButton>
                    <button 
                        onClick={() => {
                            // Assuming logout function is available in context, otherwise just redirect or clear storage
                            // For Home.jsx, we might not have logout directly exposed from context in the same way as Layout
                            // But we can check AuthContext
                            localStorage.removeItem('token');
                            window.location.reload(); 
                        }} 
                        className="px-6 py-2 rounded-full border border-white/10 hover:bg-white/10 hover:border-white/30 text-white transition-all text-sm font-medium backdrop-blur-sm"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="px-6 py-2 rounded-full border border-white/10 hover:bg-white/10 hover:border-white/30 text-white transition-all text-sm font-medium backdrop-blur-sm">
                      Login
                    </Link>
                    <GlowingButton onClick={() => navigate('/register')} className="px-6 py-2 text-sm">
                      Register
                    </GlowingButton>
                  </>
                )}
              </div>
            </div>
          </motion.nav>

          {/* Main Content - Flex Container for Centering */}
          <main className="relative h-full pt-20 flex flex-col justify-center px-6">
            <div className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              
              {/* Left Column: Text & CTA */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="flex flex-col space-y-5 md:space-y-8 text-center lg:text-left z-10 lg:-mt-12"
              >
                <motion.div variants={itemVariants} className="inline-flex items-center space-x-2 rounded-full bg-white/5 border border-white/10 px-3 py-1 w-fit mx-auto lg:mx-0 backdrop-blur-sm">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-xs font-medium text-emerald-300 uppercase tracking-wide">Live Simulation v2.0</span>
                </motion.div>

                <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-bold tracking-tight leading-none">
                  Master Your <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-money-light via-emerald-500 to-money-green">
                    Wealth
                  </span>
                </motion.h1>

                <motion.p variants={itemVariants} className="text-lg text-gray-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  Trade stocks, manage loans, and simulate decades of compound interest in seconds.
                  The most advanced banking simulator for the modern web.
                </motion.p>

                <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start pt-2">
                  {!user && (
                    <GlowingButton onClick={() => navigate('/register')} className="w-full sm:w-auto px-8 py-4 text-lg">
                      Start Your Journey <ArrowRight className="ml-2 h-5 w-5" />
                    </GlowingButton>
                  )}
                  {user && (
                     <GlowingButton onClick={() => navigate('/dashboard')} className="w-full sm:w-auto px-8 py-4 text-lg">
                      Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                    </GlowingButton>
                  )}
                  <button className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all font-medium backdrop-blur-sm">
                    Documentation
                  </button>
                </motion.div>

                {/* Compact Stats / Features Footer */}
                <motion.div variants={itemVariants} className="pt-16 md:pt-35 flex flex-wrap items-center justify-center lg:justify-start gap-4 md:gap-6 border-t border-white/5 mt-auto">
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 p-3 rounded-2xl flex items-center gap-3 hover:bg-white/10 transition-colors cursor-default">
                        <ShieldCheck className="text-money-light h-6 w-6" />
                        <div className="text-left">
                          <p className="text-sm font-bold text-white">100% Secure</p>
                          <p className="text-xs text-gray-400">Bank-grade encryption</p>
                        </div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 p-3 rounded-2xl flex items-center gap-3 hover:bg-white/10 transition-colors cursor-default">
                        <BarChart3 className="text-teal-400 h-6 w-6" />
                        <div className="text-left">
                          <p className="text-sm font-bold text-white">Real-time Data</p>
                          <p className="text-xs text-gray-400">Live market updates</p>
                        </div>
                    </div>
                     <div className="bg-white/5 backdrop-blur-md border border-white/10 p-3 rounded-2xl flex items-center gap-3 hover:bg-white/10 transition-colors cursor-default">
                        <Zap className="text-amber-400 h-6 w-6" />
                        <div className="text-left">
                          <p className="text-sm font-bold text-white">Instant Exec</p>
                          <p className="text-xs text-gray-400">Zero latency trades</p>
                        </div>
                    </div>
                </motion.div>
              </motion.div>

              {/* Right Column: Stacked Animations */}
              <motion.div
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, delay: 0.5, type: "spring" }}
                style={{ perspective: '1000px' }}
                className="hidden lg:flex flex-col gap-6 items-end justify-center h-full overflow-visible py-10"
              >
                <div className="relative w-full max-w-md transform hover:scale-[1.02] transition-transform duration-500 mr-0">
                   {/* Background Glow */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-money-green to-money-dark rounded-3xl blur opacity-30 animate-pulse"></div>
                  <StockMarketFlow />
                </div>

                <div className="relative w-full max-w-md transform hover:scale-[1.02] transition-transform duration-500 mr-0">
                   <BankingFlow />
                </div>
              </motion.div>
            </div>
          </main>
        </>
      )}
    </div>
  );
};

export default Home;
