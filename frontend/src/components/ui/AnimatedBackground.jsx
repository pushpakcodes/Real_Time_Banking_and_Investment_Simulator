import React from 'react';

export const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 -z-50 overflow-hidden bg-black">
      <div className="absolute -top-[20%] -left-[10%] h-[500px] w-[500px] rounded-full bg-money-dark/40 blur-[120px] animate-pulse-slow" />
      <div className="absolute top-[40%] right-[10%] h-[400px] w-[400px] rounded-full bg-money-green/20 blur-[120px] animate-blob" />
      <div className="absolute -bottom-[20%] left-[20%] h-[600px] w-[600px] rounded-full bg-money-light/10 blur-[120px] animate-pulse-slower" />
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
    </div>
  );
};
