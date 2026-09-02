// components/home/tabs/SalesTab.jsx

import React from 'react';
import { 
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, Cell, ReferenceLine, Area, PieChart, Pie
} from 'recharts';
import { COLORS } from '../utils/constants';
import {
  formatCurrency,
  formatCompactCurrency,
  getStatusColor,
} from '../utils/formatUtils';
import { 
  FaMoneyBillWave, FaTruck, FaChartLine, FaArrowUp, FaArrowDown,
  FaCalendarAlt, FaShoppingCart, FaPercent
} from 'react-icons/fa';
import { TbTruckDelivery } from 'react-icons/tb';

const SalesTab = ({ data, viewMode, chartData }) => {
  
  // Get sales data from the hook (aggregated by ChallanDate)
  const salesByDate = data.salesByDate || [];
  const totals = data.totals || { orderQty: 0, orderValue: 0, saleQty: 0, saleValue: 0 };
  const performanceMetrics = data.performanceMetrics || {};
  
  // Calculate sales metrics from salesByDate
  const totalSaleQty = salesByDate.reduce((sum, d) => sum + d.saleQty, 0);
  const totalSaleValue = salesByDate.reduce((sum, d) => sum + d.saleValue, 0);
  const totalSaleDays = salesByDate.length;
  const avgDailySale = totalSaleDays > 0 ? totalSaleValue / totalSaleDays : 0;
  const avgDailyQty = totalSaleDays > 0 ? totalSaleQty / totalSaleDays : 0;
  
  // Calculate growth
  const calculateGrowth = (dataArray) => {
    if (!dataArray || dataArray.length < 2) return 0;
    const current = dataArray[dataArray.length - 1]?.saleValue || 0;
    const previous = dataArray[dataArray.length - 2]?.saleValue || 0;
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };
  
  const salesGrowth = calculateGrowth(salesByDate);
  
  // Format dates
  const formatDateLabel = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Prepare daily sales chart data
  const dailySalesData = salesByDate.map((d) => ({
    date: d.date,
    name: formatDateLabel(d.date),
    saleValue: d.saleValue,
    saleQty: d.saleQty,
    orderCount: d.orderCount,
    recordCount: d.recordCount,
    // Calculate cumulative
    cumulativeValue: 0, // Will be calculated below
  }));

  // Calculate cumulative values
  let cumValue = 0;
  dailySalesData.forEach(d => {
    cumValue += d.saleValue;
    d.cumulativeValue = cumValue;
  });

  // Prepare weekly sales data
  const weeklySalesData = data.weeklyData || [];
  
  // Prepare monthly sales data
  const monthlySalesData = data.monthlyData || [];

  // Sales KPIs
  const salesKPIs = [
    {
      id: 'totalSales',
      title: 'Total Sales Revenue',
      value: totalSaleValue,
      icon: FaMoneyBillWave,
      color: 'emerald',
      bg: 'bg-emerald-50',
      prefix: '$',
      subtitle: `${totalSaleDays} sale days`,
    },
    {
      id: 'totalQty',
      title: 'Total Sales Quantity',
      value: totalSaleQty,
      icon: TbTruckDelivery,
      color: 'blue',
      bg: 'bg-blue-50',
      subtitle: `${avgDailyQty.toFixed(0)} avg per day`,
    },
    {
      id: 'avgDaily',
      title: 'Avg Daily Sales',
      value: avgDailySale,
      icon: FaChartLine,
      color: 'purple',
      bg: 'bg-purple-50',
      prefix: '$',
      subtitle: `based on ${totalSaleDays} days`,
    },
    {
      id: 'growth',
      title: 'Sales Growth',
      value: salesGrowth,
      icon: salesGrowth >= 0 ? FaArrowUp : FaArrowDown,
      color: salesGrowth >= 0 ? 'emerald' : 'red',
      bg: salesGrowth >= 0 ? 'bg-emerald-50' : 'bg-red-50',
      suffix: '%',
      subtitle: salesGrowth >= 0 ? '↑ Upward trend' : '↓ Downward trend',
    },
  ];

  // Delivery Metrics
  const deliveryMetrics = [
    {
      id: 'deliveryRate',
      title: 'Delivery Rate',
      value: data.deliveryPercent || 0,
      icon: FaPercent,
      color: 'indigo',
      bg: 'bg-indigo-50',
      suffix: '%',
    },
    {
      id: 'orderValue',
      title: 'Order Value',
      value: totals.orderValue || 0,
      icon: FaShoppingCart,
      color: 'blue',
      bg: 'bg-blue-50',
      prefix: '$',
    },
    {
      id: 'balanceValue',
      title: 'Balance Value',
      value: totals.balanceValue || 0,
      icon: FaTruck,
      color: 'red',
      bg: 'bg-red-50',
      prefix: '$',
    },
    {
      id: 'valuePercent',
      title: 'Value Delivery %',
      value: data.valuePercent || 0,
      icon: FaPercent,
      color: 'teal',
      bg: 'bg-teal-50',
      suffix: '%',
    },
  ];

  return (
    <div className="space-y-6">
      {/* ============================================================ */}
      {/* Sales KPIs */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {salesKPIs.map((kpi) => (
          <div
            key={kpi.id}
            className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">{kpi.title}</p>
                <p className="text-xl font-bold text-slate-800">
                  {kpi.prefix || ''}
                  {kpi.suffix === '%' 
                    ? kpi.value.toFixed(1) + '%'
                    : kpi.id === 'totalQty'
                      ? kpi.value.toLocaleString()
                      : kpi.value.toFixed(2)
                  }
                </p>
                {kpi.subtitle && (
                  <p className="text-[10px] text-slate-400">{kpi.subtitle}</p>
                )}
              </div>
              <div className={`p-2.5 rounded-xl ${kpi.bg}`}>
                <kpi.icon className={`w-4 h-4 text-${kpi.color}-500`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ============================================================ */}
      {/* Daily Sales Chart */}
      {/* ============================================================ */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Daily Sales Performance</h3>
            <p className="text-xs text-slate-400">Sales revenue and quantity by day</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Sales Revenue
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span> Sales Quantity
            </span>
          </div>
        </div>
        
        {dailySalesData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={dailySalesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 10 }}
                interval={Math.max(0, Math.floor(dailySalesData.length / 10))}
              />
              <YAxis 
                yAxisId="left"
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => formatCompactCurrency(value)}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(0)}K` : value}
              />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'saleValue') return ['Sales Revenue', formatCurrency(value)];
                  if (name === 'saleQty') return ['Sales Qty', value.toLocaleString()];
                  if (name === 'cumulativeValue') return ['Cumulative Sales', formatCurrency(value)];
                  return [name, value];
                }}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend />
              <Bar 
                yAxisId="left"
                dataKey="saleValue" 
                name="Sales Revenue" 
                fill={COLORS.emerald}
                radius={[4, 4, 0, 0]}
                barSize={20}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="saleQty" 
                name="Sales Qty" 
                stroke={COLORS.blue}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="cumulativeValue" 
                name="Cumulative Sales" 
                stroke={COLORS.purple}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-8 text-slate-400">
            <p>No sales data available for the selected period</p>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* Delivery Metrics */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {deliveryMetrics.map((metric) => (
          <div
            key={metric.id}
            className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${metric.bg}`}>
                <metric.icon className={`w-4 h-4 text-${metric.color}-500`} />
              </div>
              <div>
                <p className="text-xs text-slate-400">{metric.title}</p>
                <p className="text-lg font-bold text-slate-800">
                  {metric.prefix || ''}
                  {metric.suffix === '%' 
                    ? metric.value.toFixed(1) + '%'
                    : formatCurrency(metric.value)
                  }
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ============================================================ */}
      {/* Weekly Sales Performance */}
      {/* ============================================================ */}
      {weeklySalesData.length > 0 && (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Weekly Sales Performance</h3>
              <p className="text-xs text-slate-400">Sales trends by week</p>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={weeklySalesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 10 }}
              />
              <YAxis 
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => formatCompactCurrency(value)}
              />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'saleValue') return ['Sales Revenue', formatCurrency(value)];
                  if (name === 'saleQty') return ['Sales Qty', value.toLocaleString()];
                  return [name, value];
                }}
              />
              <Legend />
              <Bar 
                dataKey="saleValue" 
                name="Sales Revenue" 
                fill={COLORS.emerald}
                radius={[4, 4, 0, 0]}
                barSize={30}
              />
              <Line 
                type="monotone" 
                dataKey="saleQty" 
                name="Sales Qty" 
                stroke={COLORS.blue}
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ============================================================ */}
      {/* Monthly Sales Performance */}
      {/* ============================================================ */}
      {monthlySalesData.length > 0 && (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Monthly Sales Performance</h3>
              <p className="text-xs text-slate-400">Sales trends by month</p>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={monthlySalesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 10 }}
              />
              <YAxis 
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => formatCompactCurrency(value)}
              />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'saleValue') return ['Sales Revenue', formatCurrency(value)];
                  if (name === 'saleQty') return ['Sales Qty', value.toLocaleString()];
                  if (name === 'predicted') return ['Predicted', formatCurrency(value)];
                  return [name, value];
                }}
              />
              <Legend />
              <Bar 
                dataKey="saleValue" 
                name="Sales Revenue" 
                fill={COLORS.emerald}
                radius={[4, 4, 0, 0]}
                barSize={30}
              />
              <Line 
                type="monotone" 
                dataKey="predicted" 
                name="Predicted Sales" 
                stroke={COLORS.purple}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ============================================================ */}
      {/* Sales Summary Table */}
      {/* ============================================================ */}
      {dailySalesData.length > 0 && (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">
            📋 Daily Sales Breakdown (by ChallanDate)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-3 text-slate-500 font-medium text-xs">Date</th>
                  <th className="text-right py-2 px-3 text-slate-500 font-medium text-xs">Sales Qty</th>
                  <th className="text-right py-2 px-3 text-slate-500 font-medium text-xs">Sales Value</th>
                  <th className="text-right py-2 px-3 text-slate-500 font-medium text-xs">Orders</th>
                  <th className="text-right py-2 px-3 text-slate-500 font-medium text-xs">Records</th>
                  <th className="text-right py-2 px-3 text-slate-500 font-medium text-xs">Cumulative</th>
                </tr>
              </thead>
              <tbody>
                {dailySalesData.slice(0, 15).map((d) => (
                  <tr key={d.date} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2 px-3 text-slate-700 font-medium">
                      {new Date(d.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="text-right py-2 px-3 text-slate-700">
                      {d.saleQty.toLocaleString()}
                    </td>
                    <td className="text-right py-2 px-3 text-emerald-600 font-medium">
                      {formatCurrency(d.saleValue)}
                    </td>
                    <td className="text-right py-2 px-3 text-slate-700">
                      {d.orderCount || 0}
                    </td>
                    <td className="text-right py-2 px-3 text-slate-500 text-xs">
                      {d.recordCount || 0}
                    </td>
                    <td className="text-right py-2 px-3 text-purple-600 font-medium">
                      {formatCurrency(d.cumulativeValue)}
                    </td>
                  </tr>
                ))}
                {dailySalesData.length > 15 && (
                  <tr>
                    <td colSpan="6" className="text-center py-2 text-xs text-slate-400">
                      + {dailySalesData.length - 15} more days
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 font-semibold">
                  <td className="py-2 px-3 text-slate-700">Total</td>
                  <td className="text-right py-2 px-3 text-slate-700">
                    {dailySalesData.reduce((sum, d) => sum + d.saleQty, 0).toLocaleString()}
                  </td>
                  <td className="text-right py-2 px-3 text-emerald-600">
                    {formatCurrency(dailySalesData.reduce((sum, d) => sum + d.saleValue, 0))}
                  </td>
                  <td className="text-right py-2 px-3 text-slate-700">
                    {new Set(dailySalesData.flatMap(d => d.orderCount || 0)).size || 0}
                  </td>
                  <td className="text-right py-2 px-3 text-slate-500">
                    {dailySalesData.reduce((sum, d) => sum + (d.recordCount || 0), 0)}
                  </td>
                  <td className="text-right py-2 px-3 text-purple-600">
                    {formatCurrency(dailySalesData[dailySalesData.length - 1]?.cumulativeValue || 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* Sales Data Source Info */}
      {/* ============================================================ */}
      <div className="bg-slate-50 rounded-xl p-3 text-center">
        <p className="text-xs text-slate-400">
          📊 Sales data sourced from <span className="font-medium text-emerald-600">CommandID=3</span> (Actual Sales via ChallanDate)
          <span className="mx-2">•</span>
          {dailySalesData.length} sale days
          <span className="mx-2">•</span>
          Total Sales: {formatCurrency(totalSaleValue)}
          <span className="mx-2">•</span>
          Total Qty: {totalSaleQty.toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default SalesTab;