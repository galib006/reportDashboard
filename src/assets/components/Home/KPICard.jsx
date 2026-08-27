// components/home/KPICard.jsx

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import AnimatedCounter from './AnimatedCounter';
import GrowthIndicator from './GrowthIndicator';

const KPICard = ({ title, value, icon: Icon, color, subtitle, growth }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-200/60 group"
    >
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
              {title}
            </p>
            <p className="text-xl font-bold text-slate-800">
              <AnimatedCounter value={value} />
            </p>
            {subtitle && (
              <p className="text-[10px] text-slate-400">{subtitle}</p>
            )}
            {growth !== undefined && (
              <div className="text-xs">
                <GrowthIndicator value={growth} />
              </div>
            )}
          </div>
          <div
            className={`p-2.5 rounded-xl transition-all duration-300 ${
              isHovered ? "scale-110 rotate-6" : "scale-100"
            }`}
            style={{ backgroundColor: `${color}15` }}
          >
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
        </div>
      </div>
      <div
        className="absolute bottom-0 left-0 h-0.5 transition-all duration-500"
        style={{
          width: isHovered ? "100%" : "0%",
          backgroundColor: color,
        }}
      />
    </motion.div>
  );
};

export default KPICard;