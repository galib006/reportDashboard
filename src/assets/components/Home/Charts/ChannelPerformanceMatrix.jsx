// components/home/charts/ChannelPerformanceMatrix.jsx

import React from 'react';
import { motion } from 'framer-motion';

const ChannelPerformanceMatrix = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center text-slate-400 py-8">No channel data</div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-2 px-3 text-xs font-medium text-slate-400">Sales Person</th>
            <th className="text-right py-2 px-3 text-xs font-medium text-slate-400">Total Order Value</th>
            <th className="text-right py-2 px-3 text-xs font-medium text-slate-400">Avg Order Value</th>
            <th className="text-right py-2 px-3 text-xs font-medium text-slate-400">Sales Revenue</th>
            <th className="text-right py-2 px-3 text-xs font-medium text-slate-400">Orders</th>
            <th className="text-right py-2 px-3 text-xs font-medium text-slate-400">Delivery %</th>
            <th className="text-center py-2 px-3 text-xs font-medium text-slate-400">Performance</th>
          </tr>
        </thead>
        <tbody>
          {data.map((channel, index) => {
            const deliveryRate = parseFloat(channel.deliveryRate);
            const isCritical = channel.orderTrend < -10;

            return (
              <motion.tr
                key={channel.channel}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${isCritical ? "bg-red-50" : ""}`}
              >
                <td className="py-2 px-3 text-slate-700 font-medium">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: channel.color }} />
                    {channel.channel}
                    {isCritical && (
                      <span className="text-[10px] text-red-600 font-bold ml-1">⚠️ CRITICAL</span>
                    )}
                  </div>
                </td>
                <td className="text-right py-2 px-3 text-indigo-600">{channel.orderValue}</td>
                <td className="text-right py-2 px-3 text-slate-600">{channel.avgOrderValue}</td>
                <td className="text-right py-2 px-3 font-semibold text-emerald-600">{channel.revenue}</td>
                <td className="text-right py-2 px-3 text-slate-600">{channel.orders}</td>
                <td className="text-right py-2 px-3">
                  <span
                    className={`font-medium ${
                      deliveryRate >= 70
                        ? "text-emerald-600"
                        : deliveryRate >= 50
                        ? "text-amber-600"
                        : "text-red-600"
                    }`}
                  >
                    {channel.deliveryRate}
                  </span>
                </td>
                <td className="text-center py-2 px-3">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium ${channel.tierBg}`}
                  >
                    <channel.tierIcon className="w-3 h-3" style={{ color: channel.tierColor }} />
                    <span style={{ color: channel.tierColor }}>{channel.tier}</span>
                  </span>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ChannelPerformanceMatrix;