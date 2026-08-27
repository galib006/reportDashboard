// components/home/TabNavigation.jsx

import React from 'react';
import { motion } from 'framer-motion';

const TabNavigation = ({ activeTab, setActiveTab }) => {
  const tabs = [
    "overview",
    "orderReport",
    "sales",
    "categories",
    "buyers",
    "funnel",
    "channels",
    "analytics",
    "predictive",
    "insights",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-wrap gap-2 border-b border-slate-200 pb-2"
    >
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
            activeTab === tab
              ? "bg-indigo-500 text-white shadow-lg shadow-indigo-200"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          {tab.charAt(0).toUpperCase() + tab.slice(1)}
        </button>
      ))}
    </motion.div>
  );
};

export default TabNavigation;