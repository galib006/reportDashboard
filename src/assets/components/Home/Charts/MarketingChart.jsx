// components/home/charts/MarketingChart.jsx

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
import { formatCurrency, formatCompactCurrency, formatNumber } from '../utils/formatUtils';

const MarketingChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center text-slate-400 py-8">No marketing data</div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" height={60} />
        <YAxis yAxisId="left" tickFormatter={(v) => formatCompactCurrency(v)} />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip
          formatter={(v, name) => {
            if (name === "Order Value") return formatCurrency(v);
            if (name === "Sales Revenue") return formatCurrency(v);
            if (name === "Avg Order Value") return formatCurrency(v);
            if (name === "Orders") return formatNumber(v);
            return v;
          }}
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "8px 12px",
          }}
        />
        <Legend />
        <Bar dataKey="orderValue" fill={COLORS.primary} name="Order Value" yAxisId="left" radius={[4, 4, 0, 0]} />
        <Bar dataKey="value" fill={COLORS.success} name="Sales Revenue" yAxisId="left" radius={[4, 4, 0, 0]} />
        <Line
          type="monotone"
          dataKey="orders"
          stroke={COLORS.warning}
          strokeWidth={2}
          dot={{ fill: COLORS.warning, r: 4 }}
          name="Orders"
          yAxisId="right"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default MarketingChart;