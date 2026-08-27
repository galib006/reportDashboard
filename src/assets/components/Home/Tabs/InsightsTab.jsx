// components/home/tabs/InsightsTab.jsx

import React from 'react';
import { formatCurrency, formatCompactCurrency } from '../utils/formatUtils';

const InsightsTab = ({ data }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-slate-800">Business Insights</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SWOT Analysis */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4">
          <h3 className="text-base font-semibold text-slate-800 mb-3">📊 SWOT Analysis</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
              <h4 className="text-xs font-bold text-emerald-700">💪 Strengths</h4>
              <ul className="mt-1 space-y-1">
                {data.swotAnalysis?.strengths?.slice(0, 3).map((s, i) => (
                  <li key={i} className="text-[10px] text-emerald-600">✓ {s}</li>
                ))}
              </ul>
            </div>
            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
              <h4 className="text-xs font-bold text-red-700">⚠️ Weaknesses</h4>
              <ul className="mt-1 space-y-1">
                {data.swotAnalysis?.weaknesses?.slice(0, 3).map((s, i) => (
                  <li key={i} className="text-[10px] text-red-600">✗ {s}</li>
                ))}
              </ul>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <h4 className="text-xs font-bold text-blue-700">🚀 Opportunities</h4>
              <ul className="mt-1 space-y-1">
                {data.swotAnalysis?.opportunities?.slice(0, 3).map((s, i) => (
                  <li key={i} className="text-[10px] text-blue-600">→ {s}</li>
                ))}
              </ul>
            </div>
            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
              <h4 className="text-xs font-bold text-amber-700">🔥 Threats</h4>
              <ul className="mt-1 space-y-1">
                {data.swotAnalysis?.threats?.slice(0, 3).map((s, i) => (
                  <li key={i} className="text-[10px] text-amber-600">• {s}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Market Basket Analysis */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4">
          <h3 className="text-base font-semibold text-slate-800 mb-3">🛒 Market Basket Analysis</h3>
          <p className="text-xs text-slate-400 mb-3">Top product combinations</p>
          <div className="space-y-3">
            {data.marketBasket.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                <div>
                  <span className="text-sm font-medium text-slate-700">{item.products}</span>
                  <span className="text-[10px] text-slate-400 ml-2">({item.category})</span>
                </div>
                <span className="text-sm font-semibold text-emerald-600">
                  {formatCompactCurrency(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Key Recommendations */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 lg:col-span-2">
          <h3 className="text-base font-semibold text-slate-800 mb-3">💡 Key Recommendations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
              <h4 className="text-sm font-semibold text-blue-800">🚀 Growth Opportunity</h4>
              <p className="text-xs text-blue-600 mt-1">
                {data.categoryData[0]?.name || "Top"} category shows strong sales performance. 
                Consider expanding product lines in this category.
              </p>
            </div>
            <div className="bg-purple-50 rounded-xl p-3 border border-purple-100">
              <h4 className="text-sm font-semibold text-purple-800">💼 Sales Strategy</h4>
              <p className="text-xs text-purple-600 mt-1">
                {data.marketingData[0]?.name || "Top"} sales person is performing well with{" "}
                {formatCurrency(data.marketingData[0]?.orderValue || 0)} in orders. 
                Consider mentoring others to replicate their success.
              </p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
              <h4 className="text-sm font-semibold text-amber-800">👥 Customer Focus</h4>
              <p className="text-xs text-amber-600 mt-1">
                Top buyer {data.topBuyers[0]?.name || ""} contributes significantly. 
                Consider loyalty program and personalized offers.
              </p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
              <h4 className="text-sm font-semibold text-emerald-800">📦 Inventory Focus</h4>
              <p className="text-xs text-emerald-600 mt-1">
                {data.categoryData[0]?.name || "Top"} category has high sales demand. 
                Ensure adequate inventory levels to maintain delivery rate.
              </p>
            </div>
          </div>
        </div>

        {/* Performance Scorecard */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 lg:col-span-2">
          <h3 className="text-base font-semibold text-slate-800 mb-3">🎯 Performance Scorecard</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-emerald-50 p-3 rounded-lg text-center">
              <p className="text-xs text-emerald-600">Total Sales Revenue</p>
              <p className="text-lg font-bold text-emerald-700">
                {formatCompactCurrency(data.totals.saleValue)}
              </p>
            </div>
            <div className="bg-indigo-50 p-3 rounded-lg text-center">
              <p className="text-xs text-indigo-600">Total Orders</p>
              <p className="text-lg font-bold text-indigo-700">{data.totalOrders}</p>
            </div>
            <div className="bg-amber-50 p-3 rounded-lg text-center">
              <p className="text-xs text-amber-600">Delivery Rate</p>
              <p className="text-lg font-bold text-amber-700">
                {data.deliveryPercent.toFixed(0)}%
              </p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg text-center">
              <p className="text-xs text-purple-600">Avg Sale Value</p>
              <p className="text-lg font-bold text-purple-700">
                {formatCompactCurrency(data.performanceMetrics?.avgSaleValue || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsightsTab;