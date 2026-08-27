// components/home/charts/PerformanceChart.jsx

import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { COLORS } from '../utils/constants';
import { formatCurrency, formatCompactCurrency } from '../utils/formatUtils';

const PerformanceChart = ({ data, viewMode }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-[320px] flex items-center justify-center text-slate-400">
        No data available
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-800">
            {viewMode === "yearly"
              ? "Yearly Performance"
              : viewMode === "daily"
              ? "Daily Performance"
              : viewMode === "weekly"
              ? "Weekly Performance"
              : "Monthly Performance"}
          </h3>
          <p className="text-xs text-slate-400">
            {viewMode === "yearly"
              ? "Year-over-year trends"
              : viewMode === "daily"
              ? "Day-by-day trends"
              : viewMode === "weekly"
              ? "Week-by-week trends"
              : "Month-over-month trends"}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            Order
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Sales
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            Balance
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10 }}
            tickFormatter={(value, index) => {
              const item = data[index];
              if (item && item.year) {
                return `${value} ${item.year}`;
              }
              return value;
            }}
          />
          <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => formatCompactCurrency(v)} />
          <Tooltip
            formatter={(v, name) => [formatCurrency(v), name]}
            labelFormatter={(label, payload) => {
              if (payload && payload.length > 0 && payload[0]?.payload) {
                const dataItem = payload[0].payload;
                return dataItem.fullName || dataItem.name || label;
              }
              return label;
            }}
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "10px 14px",
            }}
          />
          <Legend />
          <Bar dataKey="orderValue" fill={COLORS.primary} radius={[4, 4, 0, 0]} name="Order Value" />
          <Bar dataKey="saleValue" fill={COLORS.success} radius={[4, 4, 0, 0]} name="Sales Revenue" />
          <Bar dataKey="balanceValue" fill={COLORS.danger} radius={[4, 4, 0, 0]} name="Balance Value" />
          <Line type="monotone" dataKey="deliveryRate" stroke={COLORS.warning} strokeWidth={2} dot={{ r: 4 }} name="Delivery %" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PerformanceChart;