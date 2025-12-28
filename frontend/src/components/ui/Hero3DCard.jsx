import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export const Hero3DCard = () => {
  const ref = useRef(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["17.5deg", "-17.5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-17.5deg", "17.5deg"]);

  const handleMouseMove = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateY,
        rotateX,
        transformStyle: "preserve-3d",
      }}
      className="relative h-96 w-80 md:h-[500px] md:w-[400px] rounded-xl bg-gradient-to-br from-indigo-500/30 to-purple-500/30 p-8 backdrop-blur-xl border border-white/10 shadow-2xl"
    >
      <div
        style={{ transform: "translateZ(75px)", transformStyle: "preserve-3d" }}
        className="absolute inset-4 grid grid-rows-3 gap-4 rounded-xl bg-gray-950/80 p-4 shadow-lg border border-white/5"
      >
        {/* Mock UI Elements */}
        <div className="row-span-1 rounded-lg bg-gradient-to-r from-emerald-500/20 to-teal-500/20 p-4 border border-emerald-500/20 flex items-center justify-between">
          <div className="h-10 w-10 rounded-full bg-emerald-500/50 animate-pulse"></div>
          <div className="h-4 w-24 rounded bg-gray-700/50"></div>
        </div>
        <div className="row-span-2 rounded-lg bg-gray-800/50 border border-white/5 relative overflow-hidden">
           {/* Mock Chart Line */}
           <svg className="absolute bottom-0 left-0 w-full h-24 stroke-blue-500 fill-none stroke-2" viewBox="0 0 100 50" preserveAspectRatio="none">
             <path d="M0,50 Q20,40 40,30 T80,10 T100,5" className="animate-dash" />
           </svg>
        </div>
        
        {/* Floating Badge */}
        <div 
            style={{ transform: "translateZ(50px)" }}
            className="absolute -right-6 -top-6 rounded-lg bg-white p-3 shadow-xl"
        >
            <span className="text-2xl">🚀</span>
        </div>
      </div>
    </motion.div>
  );
};
