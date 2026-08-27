// components/home/charts/OrderVsSalesChart.jsx

import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { COLORS } from '../utils/constants';
import { formatCurrency, formatCompactCurrency } from '../utils/formatUtils';

const OrderVsSalesChart = ({ data, viewMode }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-800">Order vs Sales Comparison</h3>
            <p className="text-xs text-slate-400">
              {viewMode === "yearly"
                ? "Year-over-year"
                : viewMode === "daily"
                ? "Day-by-day"
                : viewMode === "weekly"
                ? "Week-by-week"
                : "Month-over-month"}{" "}
              comparison with predictions
            </p>
          </div>
        </div>
        <div className="h-[300px] flex items-center justify-center text-slate-400 flex-col gap-2">
          <div className="text-4xl">📊</div>
          <p>No data available for comparison</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Order vs Sales Comparison</h3>
          <p className="text-xs text-slate-400">
            {viewMode === "yearly"
              ? "Year-over-year"
              : viewMode === "daily"
              ? "Day-by-day"
              : viewMode === "weekly"
              ? "Week-by-week"
              : "Month-over-month"}{" "}
            comparison with predictions
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-emerald-500"></span>
            Actual Sales
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-indigo-500 border-t-2 border-dashed"></span>
            Predicted Sales
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748B" }} tickLine={false} axisLine={{ stroke: "#E2E8F0" }} />
          <YAxis
            tick={{ fontSize: 10, fill: "#64748B" }}
            tickLine={false}
            axisLine={{ stroke: "#E2E8F0" }}
            tickFormatter={(v) => formatCompactCurrency(v)}
            domain={["auto", "auto"]}
          />
          <Tooltip
            formatter={(v, name) => [formatCurrency(v), name]}
            labelFormatter={(label) => `${label}`}
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "8px 12px",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
            }}
          />
          <Legend wrapperStyle={{ fontSize: "10px", paddingTop: "8px" }} iconType="circle" />

          <Area
            type="monotone"
            dataKey="saleValue"
            name="Actual Sales"
            fill="#10B981"
            fillOpacity={0.15}
            stroke="#10B981"
            strokeWidth={2.5}
            dot={{ fill: "#10B981", r: 4 }}
            activeDot={{ r: 6 }}
          />

          <Line
            type="monotone"
            dataKey="orderValue"
            name="Order Value"
            stroke="#4F46E5"
            strokeWidth={2}
            dot={{ fill: "#4F46E5", r: 3 }}
            activeDot={{ r: 5 }}
          />

          <Line
            type="monotone"
            dataKey="predicted"
            name="Predicted Sales"
            stroke="#8B5CF6"
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={{ fill: "#8B5CF6", r: 3 }}
          />

          {(() => {
            const avg = data.reduce((sum, d) => sum + (d.saleValue || 0), 0) / (data.length || 1);
            return (
              <ReferenceLine
                y={avg}
                stroke="#94A3B8"
                strokeDasharray="3 3"
                label={{
                  value: `Avg ${formatCompactCurrency(avg)}`,
                  position: "right",
                  fill: "#94A3B8",
                  fontSize: 9,
                }}
              />
            );
          })()}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default OrderVsSalesChart;