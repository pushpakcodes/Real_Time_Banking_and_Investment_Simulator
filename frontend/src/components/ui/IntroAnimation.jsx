import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const IntroAnimation = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Extremely fast loading
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 4; // Much faster increment
      });
    }, 20); // Faster interval

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      const timeout = setTimeout(() => {
        onComplete();
      }, 2500); // Shorter delay before finishing
      return () => clearTimeout(timeout);
    }
  }, [progress, onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black text-white overflow-hidden font-sans"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)", transition: { duration: 0.5, ease: "easeInOut" } }}
    >
      <div className="relative z-10 flex flex-col items-center text-center px-4">
        {/* Main Logo Text */}
        <motion.div 
          className="flex overflow-hidden mb-2"
          initial={{ opacity: 1 }}
        >
          {"FINSIM".split("").map((char, index) => (
            <motion.span
              key={index}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                duration: 0.4,
                ease: "backOut",
                delay: index * 0.05,
              }}
              className="text-7xl md:text-9xl font-black tracking-tighter text-white"
            >
              {char}
            </motion.span>
          ))}
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-lg md:text-xl text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 font-medium tracking-wide uppercase mb-8"
        >
          Real Time Real Life Banking & Investment Simulator
        </motion.p>

        {/* Loading Bar */}
        <div className="w-64 md:w-96 space-y-2">
           <div className="h-0.5 w-full bg-gray-900 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)]"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progress, 100)}%` }}
                transition={{ ease: "linear", duration: 0.1 }}
              />
           </div>
           <div className="flex justify-between text-[10px] font-mono text-gray-600 uppercase tracking-widest">
              <span>Initializing Market Data</span>
              <span>{Math.min(progress, 100)}%</span>
           </div>
        </div>
      </div>

      {/* Footer Credit */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="absolute bottom-8 left-0 right-0 text-center"
      >
        <p className="text-gray-600 text-xs tracking-widest uppercase font-semibold">
          Developed by Pushpak Jadhav
        </p>
      </motion.div>

      {/* Subtle Background Effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-money-green/10 blur-[120px] rounded-full pointer-events-none" />
    </motion.div>
  );
};

export default IntroAnimation;
