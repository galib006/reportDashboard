// components/home/Header.jsx

import React from 'react';
import { motion } from 'framer-motion';
import { 
  CalendarRange, LayoutDashboard, RefreshCw, Download, 
  Filter, X, Maximize2, Minimize2, Calendar 
} from 'lucide-react';
import { FaCircle, FaArrowUp, FaArrowDown } from 'react-icons/fa';

const Header = ({
  dateRange,
  cndata,
  data,
  isRefreshing,
  isAutoLoading,
  isFullscreen,
  showFilters,
  setShowFilters,
  setShowDatePicker,
  handleRefresh,
  handleExport,
  toggleFullscreen,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
    >
      {/* Date Range Button */}
      <div className="relative">
        <button
          onClick={() => setShowDatePicker(!showDatePicker)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:border-indigo-300 hover:shadow-md transition-all duration-200 flex items-center gap-2 min-w-[160px]"
        >
          <CalendarRange className="w-4 h-4 text-indigo-500" />
          <span className="truncate">
            {dateRange.startDate && dateRange.endDate
              ? `${dateRange.startDate.toLocaleDateString()} - ${dateRange.endDate.toLocaleDateString()}`
              : "Select Date Range"}
          </span>
        </button>
        {cndata?._lastFetch?.dateRange && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-medium border border-indigo-200">
            <CalendarRange className="w-3 h-3" />
            {new Date(cndata._lastFetch.startDate).toLocaleDateString()} -{" "}
            {new Date(cndata._lastFetch.endDate).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Dashboard Title */}
      <div>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-200">
            <LayoutDashboard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Enterprise Analytics Dashboard
            </h1>
            <p className="text-sm text-slate-400 flex items-center gap-1.5 flex-wrap">
              <FaCircle className="w-1.5 h-1.5 text-emerald-500" />
              {data.totalOrders} orders • {data.totals.saleQty} delivered •{" "}
              {data.totalCustomers} customers • {data.totalMarketing} sales persons
              {data.salesGrowth !== 0 && (
                <span
                  className={`flex items-center gap-0.5 text-xs font-medium ${
                    data.salesGrowth > 0 ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {data.salesGrowth > 0 ? (
                    <FaArrowUp className="w-2 h-2" />
                  ) : (
                    <FaArrowDown className="w-2 h-2" />
                  )}
                  {data.salesGrowth.toFixed(1)}% sales growth
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-slate-200/60 shadow-sm">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-600 whitespace-nowrap">
            {new Date().toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
              timeZone: "Asia/Dhaka",
            })}
          </span>
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="p-2 rounded-xl bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-200"
        >
          {showFilters ? (
            <X className="w-4 h-4 text-slate-600" />
          ) : (
            <Filter className="w-4 h-4 text-slate-600" />
          )}
        </button>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing || isAutoLoading}
          className={`p-2 rounded-xl bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-200 ${
            isRefreshing || isAutoLoading ? "animate-spin opacity-70" : ""
          }`}
        >
          <RefreshCw className="w-4 h-4 text-slate-600" />
        </button>

        <button
          onClick={handleExport}
          className="p-2 rounded-xl bg-indigo-500 text-white shadow-sm hover:shadow-md hover:bg-indigo-600 transition-all duration-200"
        >
          <Download className="w-4 h-4" />
        </button>

        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-xl bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-200"
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4 text-slate-600" />
          ) : (
            <Maximize2 className="w-4 h-4 text-slate-600" />
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default Header;