// components/home/tabs/ChannelsTab.jsx

import React from 'react';
import RevenueDistributionPie from '../charts/RevenueDistributionPie';
import OrderVsSalesChart from '../charts/OrderVsSalesChart';
import ChannelPerformanceMatrix from '../charts/ChannelPerformanceMatrix';

const ChannelsTab = ({ data }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Sales Person Performance</h2>
          <p className="text-xs text-slate-400">Order Value vs Sales Revenue by Sales Person</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1 text-indigo-600">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>Order Value
          </span>
          <span className="flex items-center gap-1 text-emerald-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>Sales Revenue
          </span>
          <span className="flex items-center gap-1 text-red-600">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>Leakage
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-3">Revenue Distribution</h3>
          <p className="text-xs text-slate-400 mb-4">Sales revenue distribution by sales person</p>
          <RevenueDistributionPie data={data.channelPerformanceData} />
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-3">Order vs Sales Comparison</h3>
          <p className="text-xs text-slate-400 mb-4">Bar chart showing Order Value vs Sales Revenue</p>
          {data.channelPerformanceData && data.channelPerformanceData.length > 0 ? (
            <OrderVsSalesChart
              data={data.channelPerformanceData.map((item) => ({
                ...item,
                orderValue: item.orderValueNum || 0,
                saleValue: item.saleValueNum || 0,
                name: item.channel,
              }))}
            />
          ) : (
            <div className="h-[280px] flex items-center justify-center text-slate-400 flex-col gap-2">
              <div className="text-4xl">📊</div>
              <p>No data available</p>
            </div>
          )}
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6 lg:col-span-2">
          <h3 className="text-base font-semibold text-slate-800 mb-3">Sales Performance Matrix</h3>
          <p className="text-xs text-slate-400 mb-4">Detailed breakdown with Order Value, Sales Revenue & Leakage</p>
          <ChannelPerformanceMatrix data={data.channelPerformanceData} />
        </div>
      </div>
    </div>
  );
};

export default ChannelsTab;