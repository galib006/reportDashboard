// components/home/tabs/PredictiveTab.jsx

import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ZAxis,
  ReferenceLine,
} from 'recharts';
import PredictionChart from '../charts/PredictionChart';
import { COLORS } from '../utils/constants';
import { formatCurrency, formatCompactCurrency } from '../utils/formatUtils';

const PredictiveTab = ({ data }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-slate-800">Predictive Analytics</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6 lg:col-span-2">
          <h3 className="text-base font-semibold text-slate-800 mb-3">Sales Revenue Forecast</h3>
          <p className="text-xs text-slate-400 mb-4">3-month prediction based on historical sales trends</p>
          <PredictionChart data={data.monthlyData} />
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-3">Seasonal Pattern</h3>
          <p className="text-xs text-slate-400 mb-4">Monthly recurring sales patterns</p>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data.seasonalData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(v) => formatCompactCurrency(v)} />
              <Tooltip
                formatter={(v) => formatCurrency(v)}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "8px 12px",
                }}
              />
              <Line type="monotone" dataKey="value" stroke={COLORS.emerald} strokeWidth={2} dot={{ fill: COLORS.emerald, r: 4 }} />
              <ReferenceLine
                y={data.seasonalData.reduce((sum, d) => sum + d.value, 0) / (data.seasonalData.length || 1)}
                stroke={COLORS.warning}
                strokeDasharray="3 3"
                label="Avg"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-3">Marketing Performance Scatter</h3>
          <p className="text-xs text-slate-400 mb-4">Orders vs Sales Revenue by sales person</p>
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" dataKey="x" name="Orders" />
              <YAxis type="number" dataKey="y" name="Sales Revenue" tickFormatter={(v) => formatCompactCurrency(v)} />
              <ZAxis type="number" dataKey="z" range={[50, 400]} />
              <Tooltip
                formatter={(v) => formatCurrency(v)}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "8px 12px",
                }}
              />
              <Scatter name="Sales Persons" data={data.scatterData} fill={COLORS.primary} shape="circle" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6 lg:col-span-2">
          <h3 className="text-base font-semibold text-slate-800 mb-3">Year-over-Year Comparison</h3>
          <p className="text-xs text-slate-400 mb-4">Current year vs last year sales performance</p>
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={data.yoyComparison} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" tickFormatter={(v) => formatCompactCurrency(v)} />
              <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${v.toFixed(0)}%`} />
              <Tooltip
                formatter={(v) => formatCurrency(v)}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "8px 12px",
                }}
              />
              <Legend />
              <Bar dataKey="currentYear" fill={COLORS.success} name="Current Year Sales" yAxisId="left" />
              <Bar dataKey="lastYear" fill={COLORS.gray} name="Last Year Sales" yAxisId="left" />
              <Line
                type="monotone"
                dataKey="growth"
                stroke={COLORS.warning}
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Growth %"
                yAxisId="right"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default PredictiveTab;