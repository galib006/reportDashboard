// components/home/tabs/CategoriesTab.jsx

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import CategoryChart from '../charts/CategoryChart';
import { CHART_COLORS } from '../utils/constants';
import { formatCompactCurrency } from '../utils/formatUtils';

const CategoriesTab = ({ data }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Category Analysis</h2>
          <p className="text-xs text-slate-400">Sales revenue by product category</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-3">Sales Revenue by Category</h3>
          <p className="text-xs text-slate-400 mb-4">Top product categories by delivered revenue</p>
          <CategoryChart data={data.categoryData} />
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-3">Top Sub-Categories</h3>
          <p className="text-xs text-slate-400 mb-4">Detailed product breakdown</p>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {data.topSubCategories.slice(0, 10).map((sub, index) => (
              <div key={sub.name}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 w-5">#{index + 1}</span>
                    <span className="text-slate-700 truncate max-w-[150px]" title={sub.name}>
                      {sub.name}
                    </span>
                    <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      {sub.category}
                    </span>
                  </div>
                  <span className="font-semibold text-emerald-600">
                    {formatCompactCurrency(sub.orderValue)}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                    style={{
                      width: `${(sub.orderValue / (data.topSubCategories[0]?.orderValue || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-3">Sales Distribution</h3>
          <p className="text-xs text-slate-400 mb-4">Distribution of sales values</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.distributionData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" tick={{ fontSize: 9 }} />
              <YAxis />
              <Tooltip
                formatter={(v) => `${v} orders`}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "8px 12px",
                }}
              />
              <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]}>
                {data.distributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-3">Order Size Distribution</h3>
          <p className="text-xs text-slate-400 mb-4">Breakdown of order sizes by sales value</p>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data.orderSizeDistribution}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {data.orderSizeDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
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
      </div>
    </div>
  );
};

export default CategoriesTab;