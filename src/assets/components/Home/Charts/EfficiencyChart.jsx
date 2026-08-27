// components/home/charts/EfficiencyChart.jsx

import React from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { COLORS, CHART_COLORS } from '../utils/constants';
import { formatCurrency, formatNumber } from '../utils/formatUtils';

const EfficiencyChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center text-slate-400 py-8">No efficiency data</div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          type="number"
          dataKey="orders"
          name="Orders"
          label={{ value: "Orders", position: "bottom" }}
          tick={{ fontSize: 11 }}
        />
        <YAxis
          type="number"
          dataKey="efficiency"
          name="Efficiency (Revenue/Order)"
          tickFormatter={(v) => formatCurrency(v)}
          label={{ value: "Efficiency (Revenue per Order)", angle: -90, position: "left" }}
          tick={{ fontSize: 11 }}
          domain={["auto", "auto"]}
        />
        <ZAxis type="number" dataKey="revenue" range={[50, 400]} />
        <Tooltip
          formatter={(v, name) => {
            if (name === "Efficiency") return formatCurrency(v);
            if (name === "Orders") return formatNumber(v);
            if (name === "Revenue") return formatCurrency(v);
            return v;
          }}
          labelFormatter={(label) => `Sales Person: ${label}`}
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "8px 12px",
          }}
        />
        <Scatter name="Sales Persons" data={data} fill={COLORS.primary} shape="circle">
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
};

export default EfficiencyChart;