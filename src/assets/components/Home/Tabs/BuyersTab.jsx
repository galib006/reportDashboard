// components/home/tabs/BuyersTab.jsx

import React from 'react';
import BuyerChart from '../charts/BuyerChart';
import { formatCompactCurrency } from '../utils/formatUtils';

const BuyersTab = ({ data }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-slate-800">Buyer Analysis</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-3">Top Buyers by Sales</h3>
          <p className="text-xs text-slate-400 mb-4">Highest sales revenue buyers</p>
          <BuyerChart data={data.topBuyers} />
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-3">Top Customers by Sales</h3>
          <p className="text-xs text-slate-400 mb-4">By sales revenue</p>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            {data.topCustomers.slice(0, 10).map((customer, index) => (
              <div key={customer.name}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 w-5">#{index + 1}</span>
                    <span className="text-slate-700 truncate max-w-[150px]" title={customer.name}>
                      {customer.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-400">{customer.orders} orders</span>
                    <span className="font-semibold text-emerald-600">
                      {formatCompactCurrency(customer.orderValue)}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                    style={{
                      width: `${(customer.orderValue / (data.topCustomers[0]?.orderValue || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-3">Customer Loyalty</h3>
          <p className="text-xs text-slate-400 mb-4">Top customers with loyalty scores</p>
          <div className="space-y-3">
            {data.customerLoyalty.map((c, index) => (
              <div key={c.name}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-slate-700 truncate max-w-[120px]">{c.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-400">{c.orders} orders</span>
                    <span className="font-semibold text-emerald-600">
                      {formatCompactCurrency(c.orderValue)}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500"
                    style={{ width: `${Math.min(c.loyaltyScore, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-3">Customer Segmentation</h3>
          <p className="text-xs text-slate-400 mb-4">VIP, Regular & Occasional customers</p>

          {/* VIP Customers */}
          <div className="mb-3">
            <div
              className="flex items-center justify-between p-2 bg-purple-50 rounded-lg cursor-pointer hover:bg-purple-100 transition-all"
              onClick={() => {
                const vipList = document.getElementById("vip-customers-list");
                if (vipList) vipList.classList.toggle("hidden");
              }}
            >
              <span className="text-sm font-medium text-purple-700">👑 VIP Customers</span>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-purple-600">
                  {data.customerSegmentation?.vip?.length || 0}
                </span>
                <span className="text-xs text-purple-400">▼</span>
              </div>
            </div>
            <div id="vip-customers-list" className="mt-2 space-y-1 max-h-[120px] overflow-y-auto">
              {data.customerSegmentation?.vip?.length > 0 ? (
                data.customerSegmentation.vip.map((customer, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-1.5 bg-purple-50/50 rounded">
                    <span className="text-purple-700">{customer.name}</span>
                    <span className="text-purple-600 font-semibold">{customer.orderValue}</span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 p-2">No VIP customers</div>
              )}
            </div>
          </div>

          {/* Regular Customers */}
          <div className="mb-3">
            <div
              className="flex items-center justify-between p-2 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-all"
              onClick={() => {
                const regularList = document.getElementById("regular-customers-list");
                if (regularList) regularList.classList.toggle("hidden");
              }}
            >
              <span className="text-sm font-medium text-blue-700">📋 Regular Customers</span>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-blue-600">
                  {data.customerSegmentation?.regular?.length || 0}
                </span>
                <span className="text-xs text-blue-400">▼</span>
              </div>
            </div>
            <div id="regular-customers-list" className="mt-2 space-y-1 max-h-[120px] overflow-y-auto">
              {data.customerSegmentation?.regular?.length > 0 ? (
                data.customerSegmentation.regular.map((customer, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-1.5 bg-blue-50/50 rounded">
                    <span className="text-blue-700">{customer.name}</span>
                    <span className="text-blue-600 font-semibold">{customer.orderValue}</span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 p-2">No regular customers</div>
              )}
            </div>
          </div>

          {/* Occasional Customers */}
          <div className="mb-3">
            <div
              className="flex items-center justify-between p-2 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-all"
              onClick={() => {
                const occasionalList = document.getElementById("occasional-customers-list");
                if (occasionalList) occasionalList.classList.toggle("hidden");
              }}
            >
              <span className="text-sm font-medium text-slate-700">🔄 Occasional Customers</span>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-slate-600">
                  {data.customerSegmentation?.occasional?.length || 0}
                </span>
                <span className="text-xs text-slate-400">▼</span>
              </div>
            </div>
            <div id="occasional-customers-list" className="mt-2 space-y-1 max-h-[120px] overflow-y-auto">
              {data.customerSegmentation?.occasional?.length > 0 ? (
                data.customerSegmentation.occasional.map((customer, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-1.5 bg-slate-50/50 rounded">
                    <span className="text-slate-700">{customer.name}</span>
                    <span className="text-slate-600 font-semibold">{customer.orderValue}</span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 p-2">No occasional customers</div>
              )}
            </div>
          </div>

          <div className="mt-3 text-[10px] text-slate-400 text-center">
            💡 Click on each segment to expand and view customer names
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyersTab;