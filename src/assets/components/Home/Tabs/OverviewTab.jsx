// components/home/tabs/OverviewTab.jsx

import React from 'react';
import { 
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, Cell, ReferenceLine 
} from 'recharts';
import { COLORS } from '../utils/constants';
import {
  formatCurrency,
  formatCompactCurrency,
  getStatusColor,
  getPerformanceTier, 
} from '../utils/formatUtils';
import { FaUsers, FaChartLine, FaBox } from 'react-icons/fa';
import { RiUserStarFill } from 'react-icons/ri';
import PerformanceChart from '../charts/PerformanceChart';
import OrderVsSalesChart from '../charts/OrderVsSalesChart';

const OverviewTab = ({ data, viewMode, chartData, growthChartData, getGrowthLabel, selectedYear = "All",  selectedMonth = "All", }) => {
  // Quick Stats Data
  const quickStats = [
    {
      id: 'avgOrder',
      title: 'Avg Order Value',
      value: data.performanceMetrics?.avgOrderValue || 0,
      icon: FaUsers,
      color: 'indigo',
      bg: 'bg-indigo-50',
    },
    {
      id: 'avgSale',
      title: 'Avg Sale Value',
      value: data.performanceMetrics?.avgSaleValue || 0,
      icon: FaChartLine,
      color: 'emerald',
      bg: 'bg-emerald-50',
    },
    {
      id: 'avgCustomer',
      title: 'Avg Customer Value',
      value: data.performanceMetrics?.avgCustomerValue || 0,
      icon: RiUserStarFill,
      color: 'purple',
      bg: 'bg-purple-50',
    },
    {
      id: 'deliveryRatio',
      title: 'Order-to-Delivery',
      value: ((data.performanceMetrics?.orderToDeliveryRatio || 0) * 100),
      icon: FaBox,
      color: 'orange',
      bg: 'bg-orange-50',
      suffix: '%',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Performance Chart */}
      <PerformanceChart data={chartData} viewMode={viewMode} />

      {/* Order vs Sales Comparison */}
      <OrderVsSalesChart data={chartData} viewMode={viewMode} />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat) => (
          <div
            key={stat.id}
            className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4"
          >
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 text-${stat.color}-500`} />
              </div>
              <div>
                <p className="text-xs text-slate-400">{stat.title}</p>
                <p className="text-lg font-bold text-slate-800">
                  {stat.suffix === '%' 
                    ? stat.value.toFixed(0) + '%'
                    : formatCurrency(stat.value)
                  }
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Top Performing Marketing & Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">
            🏆 Top Performing Sales Persons
          </h3>
          <div className="space-y-2">
            {data.topPerformingMarketing.slice(0, 5).map((m, i) => {
              const avgValue = parseFloat(m.avgOrderValue.replace(/[$,]/g, ""));
              const tier = getPerformanceTier(
                avgValue,
                parseFloat(m.deliveryRate),
                m.orderValue,
                m.orders,
                selectedYear,
                selectedMonth,
              );
              const Icon = tier.icon;
              return (
                <div
                  key={m.name}
                  className={`flex items-center justify-between text-sm p-2 rounded-lg ${tier.bg}`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" style={{ color: tier.color }} />
                    <span className="text-slate-700 font-medium">{m.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-400">{m.orders} orders</span>
                    <span className="text-[10px] text-slate-400">{m.deliveryRate}</span>
                    <span className="font-semibold text-emerald-600">
                      {formatCompactCurrency(m.orderValue)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">
            📊 Top Categories by Sales
          </h3>
          <div className="space-y-2">
            {data.categoryPerformance.slice(0, 5).map((c, i) => (
              <div
                key={c.name}
                className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-slate-50"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 w-5">#{i + 1}</span>
                  <span className="text-slate-700">{c.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-400">{c.orders} orders</span>
                  <span className="text-[10px] text-slate-400">{c.deliveryRate}</span>
                  <span className="font-semibold text-emerald-600">
                    {formatCompactCurrency(c.orderValue)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;