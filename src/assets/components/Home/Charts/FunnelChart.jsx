// components/home/charts/FunnelChart.jsx

import React from 'react';
import { motion } from 'framer-motion';
import { CHART_COLORS } from '../utils/constants';
import { formatCurrency } from '../utils/formatUtils';

const FunnelChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center text-slate-400 py-8">No funnel data</div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const chartData = data.map((d, i) => ({
    ...d,
    percentage: total > 0 ? (d.value / total) * 100 : 0,
    stage: i + 1,
  }));

  return (
    <div className="space-y-4">
      {chartData.map((entry, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="space-y-1"
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-700 flex items-center gap-2">
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                style={{
                  backgroundColor: entry.fill || CHART_COLORS[index % CHART_COLORS.length],
                }}
              >
                {entry.stage}
              </span>
              {entry.name}
            </span>
            <span className="text-slate-500">
              {formatCurrency(entry.value)}
              <span className="text-slate-400 ml-1">
                ({entry.percentage.toFixed(0)}%)
              </span>
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-8 overflow-hidden relative">
            <motion.div
              className="h-full rounded-full flex items-center justify-end px-3"
              style={{
                width: `${Math.max(entry.percentage, 5)}%`,
                backgroundColor: entry.fill || CHART_COLORS[index % CHART_COLORS.length],
              }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(entry.percentage, 5)}%` }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
            >
              <span className="text-xs text-white font-medium">
                {formatCurrency(entry.value)}
              </span>
            </motion.div>
          </div>
          {index < chartData.length - 1 && (
            <div className="text-center text-[10px] text-slate-400">
              ↓{" "}
              {chartData[index + 1].value > 0
                ? ((entry.value / chartData[index + 1].value) * 100).toFixed(0)
                : 0}
              % conversion rate
            </div>
          )}
        </motion.div>
      ))}
      <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs text-slate-600">
        <p className="font-medium">📊 Funnel Summary:</p>
        <p>
          Total Order Value: {formatCurrency(total)} | Delivery Rate:{" "}
          {data[1]?.value > 0 ? ((data[1].value / total) * 100).toFixed(0) : 0}%
        </p>
      </div>
    </div>
  );
};

export default FunnelChart;