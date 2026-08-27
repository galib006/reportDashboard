// components/home/tabs/AnalyticsTab.jsx

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import FunnelChart from '../charts/FunnelChart';
import { COLORS } from '../utils/constants';
import { formatCurrency, formatCompactCurrency } from '../utils/formatUtils';

const AnalyticsTab = ({ data }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-slate-800">Advanced Analytics</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-3">Order Funnel Analysis</h3>
          <p className="text-xs text-slate-400 mb-4">Order → Delivered → Pending</p>
          <FunnelChart data={data.orderFunnelData} />
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-3">Order Completion Status</h3>
          <p className="text-xs text-slate-400 mb-4">Current order status distribution</p>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={data.completionData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
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

        {/* Growth Rate */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-3">Monthly Growth Rate</h3>
          <p className="text-xs text-slate-400 mb-4">Month-over-month growth percentage</p>
          {data.growthData && data.growthData.length >= 2 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.growthData} margin={{ top: 30, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => `${v.toFixed(0)}%`} />
                <Tooltip
                  formatter={(v) => `${v.toFixed(1)}%`}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    padding: "8px 12px",
                  }}
                />
                <Legend />
                <Bar dataKey="salesGrowth" name="Sales Growth %" radius={[4, 4, 0, 0]}>
                  {data.growthData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.salesGrowth >= 0 ? COLORS.success : COLORS.danger}
                    />
                  ))}
                </Bar>
                <Bar dataKey="orderGrowth" name="Order Growth %" radius={[4, 4, 0, 0]} fill={COLORS.primary}>
                  {data.growthData.map((entry, index) => (
                    <Cell
                      key={`cell-order-${index}`}
                      fill={entry.orderGrowth >= 0 ? COLORS.indigo : COLORS.rose}
                    />
                  ))}
                </Bar>
                <ReferenceLine y={0} stroke={COLORS.gray} strokeDasharray="3 3" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-slate-400 flex-col gap-2">
              <div className="text-4xl">📊</div>
              <p>Not enough data for growth comparison</p>
            </div>
          )}
        </div>

        {/* Correlation Matrix */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-3">Correlation Matrix</h3>
          <p className="text-xs text-slate-400 mb-4">Key metric relationships</p>
          <div className="space-y-3">
            {data.correlationData.map((item, index) => (
              <div key={index} className="bg-slate-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{item.name}</span>
                  <div className="flex items-center gap-3 flex-1 ml-4">
                    <div
                      className="flex-1 h-2 rounded-full overflow-hidden"
                      style={{
                        backgroundColor: item.value > 0 ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
                      }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(Math.abs(item.value) * 100, 100)}%`,
                          backgroundColor: item.value > 0 ? COLORS.success : COLORS.danger,
                        }}
                      />
                    </div>
                    <span
                      className={`text-xs font-medium min-w-[40px] ${
                        item.value > 0 ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {item.value > 0 ? "+" : ""}{item.value.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Peak Hours */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-3">Peak Order Hours</h3>
          <p className="text-xs text-slate-400 mb-4">Order volume and sales by hour</p>
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={data.peakHoursData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" tick={{ fontSize: 8 }} />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => formatCompactCurrency(v)} />
              <Tooltip
                formatter={(v, name) => {
                  if (name === "Sales Revenue") return formatCurrency(v);
                  return `${v} orders`;
                }}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "8px 12px",
                }}
              />
              <Legend />
              <Bar dataKey="orders" fill={COLORS.primary} name="Orders" yAxisId="left" radius={[4, 4, 0, 0]} />
              <Line
                type="monotone"
                dataKey="saleRevenue"
                stroke={COLORS.success}
                strokeWidth={2}
                dot={{ r: 3 }}
                name="Sales Revenue"
                yAxisId="right"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Leakage */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-3">Revenue Leakage</h3>
          <p className="text-xs text-slate-400 mb-4">Revenue breakdown by delivery status</p>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data.revenueLeakage}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {data.revenueLeakage.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => formatCurrency(v)}
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
      </div>
    </div>
  );
};

export default AnalyticsTab;