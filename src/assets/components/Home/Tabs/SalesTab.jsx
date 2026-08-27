// components/home/tabs/SalesTab.jsx

import React from 'react';
import MarketingChart from '../charts/MarketingChart';
import RadarChartComponent from '../charts/RadarChart';
import EfficiencyChart from '../charts/EfficiencyChart';
import OrderVsSalesChart from '../charts/OrderVsSalesChart';
import { formatCurrency, formatCompactCurrency } from '../utils/formatUtils';

const SalesTab = ({ data, viewMode, chartData }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Sales Person Performance</h2>
          <p className="text-xs text-slate-400">Order Value vs Sales Revenue by Sales Person</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-indigo-600">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>Order Value
          </span>
          <span className="flex items-center gap-1 text-emerald-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>Sales Revenue
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-3">Order & Sales Revenue by Sales Person</h3>
          <p className="text-xs text-slate-400 mb-4">Top performing sales persons</p>
          <MarketingChart data={data.marketingData} />
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-3">Sales Person Comparison</h3>
          <p className="text-xs text-slate-400 mb-4">Multi-dimensional performance</p>
          <RadarChartComponent data={data.radarData} />
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6 lg:col-span-2">
          <h3 className="text-base font-semibold text-slate-800 mb-3">Sales Efficiency Matrix</h3>
          <p className="text-xs text-slate-400 mb-4">Orders vs Sales Revenue efficiency</p>
          <EfficiencyChart data={data.efficiencyData} />
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6 lg:col-span-2">
          <OrderVsSalesChart data={chartData} viewMode={viewMode} />
        </div>

        {/* Sales Person Ranking */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6 lg:col-span-2">
          <h3 className="text-base font-semibold text-slate-800 mb-3">🏅 Sales Person Ranking</h3>
          <p className="text-xs text-slate-400 mb-4">Ranked by Total Order Value with Delivery Performance</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-3 text-xs font-medium text-slate-400">Rank</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-slate-400">Sales Person</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-slate-400">Total Order Value</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-slate-400">Avg Order Value</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-slate-400">Sales Revenue</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-slate-400">Orders</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-slate-400">Delivery %</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-slate-400">Tier</th>
                </tr>
              </thead>
              <tbody>
                {data.salesPersonRanking.map((m) => {
                  const Icon = m.tierIcon;
                  return (
                    <tr key={m.name} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2 px-3 text-slate-600">{m.badge}</td>
                      <td className="py-2 px-3 text-slate-700 font-medium">{m.name}</td>
                      <td className="text-right py-2 px-3 font-semibold text-indigo-600">{m.orderValue}</td>
                      <td className="text-right py-2 px-3 text-slate-600">{m.avgOrderValue}</td>
                      <td className="text-right py-2 px-3 text-emerald-600">{m.revenue}</td>
                      <td className="text-right py-2 px-3 text-slate-600">{m.orders}</td>
                      <td className="text-right py-2 px-3">
                        <span className={`font-medium ${parseFloat(m.deliveryRate) >= 70 ? "text-emerald-600" : parseFloat(m.deliveryRate) >= 50 ? "text-amber-600" : "text-red-600"}`}>
                          {m.deliveryRate}
                        </span>
                      </td>
                      <td className="text-right py-2 px-3">
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${m.tierBg}`}>
                          <Icon className="w-3 h-3" style={{ color: m.tierColor }} />
                          <span className="text-[10px] font-medium" style={{ color: m.tierColor }}>
                            {m.tier}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesTab;