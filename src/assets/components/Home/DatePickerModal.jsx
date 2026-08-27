// components/home/DatePickerModal.jsx

import React from 'react';
import DatePicker from 'react-datepicker';
import { CalendarIcon, X } from 'lucide-react';
import "react-datepicker/dist/react-datepicker.css";

const DatePickerModal = ({
  showDatePicker,
  setShowDatePicker,
  dateRange,
  setDateRange,
  isFetchingRange,
  rangeFetchProgress,
  rangeFetchStatus,
  handleDateRangeSubmit,
  fetchDataByDateRange,
  cancelTokenRef,
  setIsFetchingRange,
  setRangeFetchProgress,
  setRangeFetchStatus,
}) => {
  if (!showDatePicker) return null;

  const handleQuickRange = (days) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    setDateRange({ startDate, endDate });
    setTimeout(() => {
      setShowDatePicker(false);
      fetchDataByDateRange(startDate, endDate);
    }, 150);
  };

  const handleThisMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setDateRange({ startDate: firstDay, endDate: lastDay });
    setTimeout(() => {
      setShowDatePicker(false);
      fetchDataByDateRange(firstDay, lastDay);
    }, 150);
  };

  const handleYearToDate = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), 0, 1);
    setDateRange({ startDate: firstDay, endDate: now });
    setTimeout(() => {
      setShowDatePicker(false);
      fetchDataByDateRange(firstDay, now);
    }, 150);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          setShowDatePicker(false);
        }
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 w-[480px] max-w-[90vw] max-h-[90vh] overflow-y-auto">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-700">Select Date Range</h4>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowDatePicker(false);
              }}
              className="p-1 hover:bg-slate-100 rounded-lg transition-all"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-xs text-slate-500 block mb-1">Start Date</label>
              <DatePicker
                selected={dateRange.startDate}
                onChange={(date) => setDateRange((prev) => ({ ...prev, startDate: date }))}
                selectsStart
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                dateFormat="MMM d, yyyy"
                placeholderText="Select start date"
                popperPlacement="bottom-start"
                onClickOutside={() => {}}
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-slate-500 block mb-1">End Date</label>
              <DatePicker
                selected={dateRange.endDate}
                onChange={(date) => setDateRange((prev) => ({ ...prev, endDate: date }))}
                selectsEnd
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
                minDate={dateRange.startDate}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                dateFormat="MMM d, yyyy"
                placeholderText="Select end date"
                popperPlacement="bottom-start"
                onClickOutside={() => {}}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleQuickRange(7);
              }}
              className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
            >
              Last 7 days
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleQuickRange(30);
              }}
              className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
            >
              Last 30 days
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleQuickRange(90);
              }}
              className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
            >
              Last 90 days
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleThisMonth();
              }}
              className="px-3 py-1.5 text-xs font-medium bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-all"
            >
              This Month
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleYearToDate();
              }}
              className="px-3 py-1.5 text-xs font-medium bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg transition-all"
            >
              Year to Date
            </button>
          </div>

          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDateRangeSubmit(e);
              }}
              disabled={isFetchingRange}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isFetchingRange ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <CalendarIcon className="w-4 h-4" />
                  Fetch Data
                </>
              )}
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowDatePicker(false);
              }}
              className="px-4 py-2.5 bg-slate-100 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-200 transition-all duration-200"
            >
              Cancel
            </button>
          </div>

          {isFetchingRange && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>{rangeFetchStatus || "Loading..."}</span>
                <span>{Math.round(rangeFetchProgress)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                  style={{ width: `${rangeFetchProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DatePickerModal;