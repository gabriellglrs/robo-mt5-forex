"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle } from 'lucide-react';

interface InfoTooltipProps {
  title: string;
  content: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ title, content }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block ml-1.5 align-middle group">
      <button
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="p-1 rounded-full text-gray-500 hover:text-primary transition-colors focus:outline-none"
      >
        <HelpCircle className="w-3 h-3" />
      </button>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50 w-64 pointer-events-none"
          >
            <div className="p-4 rounded-2xl border border-white/10 bg-[#0a0a0b]/95 backdrop-blur-xl shadow-2xl">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-1.5">{title}</h4>
              <p className="text-[11px] text-gray-300 leading-relaxed font-medium">
                {content}
              </p>
              {/* Arrow */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#0a0a0b] rotate-45 border-r border-b border-white/10" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
