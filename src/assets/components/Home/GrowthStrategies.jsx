// components/home/GrowthStrategies.jsx

import React from 'react';
import { motion } from 'framer-motion';
import GrowthIndicator from './GrowthIndicator';
import { formatCompactCurrency } from './utils/formatUtils';

const GrowthStrategies = ({ data }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-r from-indigo-50 to-purple-50 backdrop-blur-sm rounded-2xl shadow-lg border border-indigo-200/60 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-800">📈 Growth Strategies</h3>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1 text-emerald-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Completed +{formatCompactCurrency(data.growthMetrics?.completed || 0)}
          </span>
          <span className="flex items-center gap-1 text-amber-600">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Recurring -{formatCompactCurrency(data.growthMetrics?.recurring || 0)}
          </span>
          <span className="flex items-center gap-1 text-red-600">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            Pending +{formatCompactCurrency(data.growthMetrics?.pending || 0)}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/80 rounded-xl p-4 text-center">
          <p className="text-xs text-slate-400">Completion Rate</p>
          <p className="text-2xl font-bold text-emerald-600">
            {data.deliveryPercent.toFixed(0)}%
          </p>
          <GrowthIndicator value={data.salesGrowth} />
        </div>
        <div className="bg-white/80 rounded-xl p-4 text-center">
          <p className="text-xs text-slate-400">Sales Growth</p>
          <p
            className={`text-2xl font-bold ${
              data.salesGrowth >= 0 ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {data.salesGrowth.toFixed(1)}%
          </p>
          <p className="text-xs text-slate-400">vs previous period</p>
        </div>
        <div className="bg-white/80 rounded-xl p-4 text-center">
          <p className="text-xs text-slate-400">Completed Value</p>
          <p className="text-2xl font-bold text-emerald-600">
            {formatCompactCurrency(data.growthMetrics?.completed || 0)}
          </p>
          <p className="text-xs text-emerald-500">+83.0%</p>
        </div>
        <div className="bg-white/80 rounded-xl p-4 text-center">
          <p className="text-xs text-slate-400">Pending Value</p>
          <p className="text-2xl font-bold text-amber-600">
            {formatCompactCurrency(data.growthMetrics?.pending || 0)}
          </p>
          <p className="text-xs text-amber-500">+10.3%</p>
        </div>
      </div>
      <div className="mt-4 text-xs text-slate-500 text-center">
        Business process starts from an owner invests cash on property in a business.
        Income is higher than outcome called "Profit".
      </div>
    </motion.div>
  );
};

export default GrowthStrategies;