import React from 'react';
import { motion } from 'framer-motion';
import { twMerge } from 'tailwind-merge';

export const GlowingButton = ({ children, onClick, className, ...props }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={twMerge(
        "relative inline-flex items-center justify-center px-8 py-3 overflow-hidden font-bold text-white rounded-full group bg-gradient-to-br from-money-green to-money-light hover:from-money-light hover:to-emerald-500 focus:ring-4 focus:ring-money-green/50 dark:focus:ring-money-dark",
        className
      )}
      onClick={onClick}
      {...props}
    >
      <span className="absolute w-0 h-0 transition-all duration-500 ease-out bg-white rounded-full group-hover:w-56 group-hover:h-56 opacity-10"></span>
      <span className="relative flex items-center gap-2">{children}</span>
    </motion.button>
  );
};
