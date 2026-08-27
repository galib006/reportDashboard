// components/home/FilterBar.jsx

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter } from 'lucide-react';
import { FaCircle } from 'react-icons/fa';

const FilterBar = ({
  showFilters,
  selectedYear,
  setSelectedYear,
  selectedMonth,
  setSelectedMonth,
  selectedMarketing,
  setSelectedMarketing,
  viewMode,
  setViewMode,
  years,
  months,
  marketingNames,
  apiData,
  cndata,
  onResetFilters,
}) => {
  return (
    <AnimatePresence>
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-700">Filters</span>
              </div>
              <div className="h-6 w-px bg-slate-200 hidden sm:block" />

              <div className="flex flex-wrap gap-3 flex-1">
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(e.target.value);
                    setSelectedMonth("All");
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 min-w-[140px]"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y === "All" ? "📅 All Years" : `📅 ${y}`}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 min-w-[140px]"
                  disabled={selectedYear === "All" && months.length <= 1}
                >
                  {months.map((m) => (
                    <option key={m} value={m}>
                      {m === "All" ? "📊 All Months" : `📊 ${m}`}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedMarketing}
                  onChange={(e) => setSelectedMarketing(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 min-w-[180px]"
                >
                  {marketingNames.map((m) => (
                    <option key={m} value={m}>
                      {m === "All" ? "👤 All Sales Persons" : `👤 ${m}`}
                    </option>
                  ))}
                </select>

                <select
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 min-w-[140px]"
                >
                  <option value="yearly">📅 Yearly View</option>
                  <option value="monthly">📈 Monthly View</option>
                  <option value="weekly">📊 Weekly View</option>
                  <option value="daily">📅 Daily View</option>
                </select>

                {(selectedYear !== "All" ||
                  selectedMonth !== "All" ||
                  selectedMarketing !== "All") && (
                  <button
                    onClick={onResetFilters}
                    className="px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl hover:shadow-lg transition-all duration-200"
                  >
                    Show All Data
                  </button>
                )}
              </div>

              <div className="text-xs text-slate-400 flex items-center gap-2">
                <span>{apiData.length} records</span>
                {cndata?._lastFetch?.autoLoaded && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-medium border border-emerald-200">
                    <FaCircle className="w-1.5 h-1.5 text-emerald-400" />
                    {cndata._lastFetch.month} {cndata._lastFetch.year}
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FilterBar;