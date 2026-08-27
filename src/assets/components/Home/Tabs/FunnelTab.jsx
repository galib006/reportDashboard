// components/home/tabs/FunnelTab.jsx

import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import FunnelChart from '../charts/FunnelChart';
import { formatCurrency } from '../utils/formatUtils';

const FunnelTab = ({ data }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-slate-800">Order Funnel Analysis</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-3">Order Funnel Stages</h3>
          <p className="text-xs text-slate-400 mb-4">Order → Delivered → Pending</p>
          <FunnelChart data={data.orderFunnelData} />
          <div className="mt-4 text-xs text-slate-500 text-center">
            Overall Delivery Rate: {data.deliveryPercent.toFixed(2)}%
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-3">Order Status Distribution</h3>
          <p className="text-xs text-slate-400 mb-4">Current order status breakdown</p>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.completionData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={true}
              >
                {data.completionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => `${v} orders`}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "8px 12px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6 lg:col-span-2">
          <h3 className="text-base font-semibold text-slate-800 mb-3">Funnel Efficiency Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-indigo-50 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-400">Total Order Value</p>
              <p className="text-2xl font-bold text-indigo-600">
                {formatCurrency(data.totals.orderValue)}
              </p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-400">Delivered Value</p>
              <p className="text-2xl font-bold text-emerald-600">
                {formatCurrency(data.totals.saleValue)}
              </p>
              <p className="text-xs text-emerald-500">
                {((data.totals.saleValue / (data.totals.orderValue || 1)) * 100).toFixed(0)}% conversion
              </p>
            </div>
            <div className="bg-red-50 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-400">Pending Value</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(data.totals.balanceValue)}
              </p>
              <p className="text-xs text-red-500">
                {((data.totals.balanceValue / (data.totals.orderValue || 1)) * 100).toFixed(0)}% pending
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FunnelTab;