// components/home/Footer.jsx

import React from 'react';
import { motion } from 'framer-motion';
import { getStatusColor, formatCurrency } from './utils/formatUtils';
import { COLORS } from './utils/constants';

const Footer = ({ apiData, data }) => {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-4 text-center hover:shadow-md transition-all">
          <p className="text-xs text-slate-400 uppercase tracking-wider">
            Total Orders
          </p>
          <p className="text-xl font-bold text-slate-800">
            {data.totalOrders}
          </p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-4 text-center hover:shadow-md transition-all">
          <p className="text-xs text-slate-400 uppercase tracking-wider">
            Avg Sale Value
          </p>
          <p className="text-xl font-bold text-slate-800">
            {data.totalOrders > 0
              ? formatCurrency(data.totals.saleValue / data.totalOrders)
              : "$0"}
          </p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-4 text-center hover:shadow-md transition-all">
          <p className="text-xs text-slate-400 uppercase tracking-wider">
            Delivery Rate
          </p>
          <p
            className="text-xl font-bold"
            style={{ color: getStatusColor(data.deliveryPercent) }}
          >
            {data.deliveryPercent.toFixed(0)}%
          </p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-4 text-center hover:shadow-md transition-all">
          <p className="text-xs text-slate-400 uppercase tracking-wider">
            Sales Growth
          </p>
          <p
            className="text-xl font-bold"
            style={{
              color: data.salesGrowth >= 0 ? COLORS.success : COLORS.danger,
            }}
          >
            {data.salesGrowth.toFixed(1)}%
          </p>
        </div>
      </motion.div>

      <div className="text-center">
        <p className="text-[10px] text-slate-400">
          Last updated: {new Date().toLocaleString()} • {apiData.length} records loaded
        </p>
      </div>
    </>
  );
};

export default Footer;