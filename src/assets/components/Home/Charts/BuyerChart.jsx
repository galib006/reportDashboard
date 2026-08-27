// components/home/charts/BuyerChart.jsx

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import { COLORS, CHART_COLORS } from '../utils/constants';
import { formatCurrency, formatCompactCurrency } from '../utils/formatUtils';

const BuyerChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="text-center text-slate-400 py-8">No buyer data</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ top: 20, right: 30, left: 120, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" tickFormatter={(v) => formatCompactCurrency(v)} />
        <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={120} />
        <Tooltip
          formatter={(v, name) => {
            if (name === "Order Value") return formatCurrency(v);
            if (name === "Sales Revenue") return formatCurrency(v);
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
        <Bar dataKey="value" fill={COLORS.success} radius={[0, 4, 4, 0]} name="Sales Revenue">
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={CHART_COLORS[(index + 5) % CHART_COLORS.length]} />
          ))}
        </Bar>
        <Bar dataKey="orderValue" fill={COLORS.primary} radius={[0, 4, 4, 0]} name="Order Value" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default BuyerChart;