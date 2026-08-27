// components/home/charts/RadarChart.jsx

import React from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  Legend,
} from 'recharts';
import { formatCurrency, formatNumber } from '../utils/formatUtils';

const RadarChartComponent = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="text-center text-slate-400 py-8">No radar data</div>;
  }

  const maxRevenue = Math.max(...data.map((d) => d.Revenue || 0));
  const maxOrders = Math.max(...data.map((d) => d.Orders || 0));
  const maxCustomers = Math.max(...data.map((d) => d.Customers || 0));
  const maxCategories = Math.max(...data.map((d) => d.Categories || 0));

  const scaledData = data.map((m) => ({
    subject: m.subject,
    A: maxRevenue > 0 ? (m.Revenue / maxRevenue) * 100 : 0,
    B: maxOrders > 0 ? (m.Orders / maxOrders) * 100 : 0,
    C: maxCustomers > 0 ? (m.Customers / maxCustomers) * 100 : 0,
    D: maxCategories > 0 ? (m.Categories / maxCategories) * 100 : 0,
    actualRevenue: m.Revenue,
    actualOrders: m.Orders,
    actualCustomers: m.Customers,
    actualCategories: m.Categories,
  }));

  return (
    <ResponsiveContainer width="100%" height={350}>
      <RadarChart data={scaledData} margin={{ top: 20, right: 30, left: 30, bottom: 20 }}>
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fontSize: 9, fill: "#1E293B", fontWeight: 500 }}
          tickLine={false}
        />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8, fill: "#94A3B8" }} tickFormatter={(v) => `${Math.round(v)}%`} />
        <Radar name="Sales Revenue" dataKey="A" stroke="#10B981" fill="#10B981" fillOpacity={0.2} strokeWidth={2} />
        <Radar name="Orders" dataKey="B" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.2} strokeWidth={2} />
        <Radar name="Customers" dataKey="C" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.2} strokeWidth={2} />
        <Radar name="Categories" dataKey="D" stroke="#EC4899" fill="#EC4899" fillOpacity={0.2} strokeWidth={2} />
        <Tooltip
          formatter={(value, name, props) => {
            const payload = props.payload;
            if (name === "Sales Revenue") return [`${formatCurrency(payload.actualRevenue || 0)}`, name];
            if (name === "Orders") return [`${formatNumber(payload.actualOrders || 0)}`, name];
            if (name === "Customers") return [`${formatNumber(payload.actualCustomers || 0)}`, name];
            if (name === "Categories") return [`${formatNumber(payload.actualCategories || 0)}`, name];
            return [value, name];
          }}
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "10px 14px",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
          }}
        />
        <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "15px", fontWeight: 500 }} iconType="circle" iconSize={8} />
      </RadarChart>
    </ResponsiveContainer>
  );
};

export default RadarChartComponent;