// components/home/LoadingState.jsx

import React from 'react';

const LoadingState = ({ recordCount = 0 }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 border-4 border-slate-200 rounded-full" />
          <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin" />
          <div className="absolute inset-2 border-4 border-emerald-500 rounded-full border-b-transparent animate-spin" />
        </div>
        <h2 className="text-xl font-semibold text-slate-700">
          Loading Dashboard
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Preparing your analytics...
        </p>
        {recordCount > 0 && (
          <p className="text-xs text-slate-300 mt-2">
            {recordCount} records loaded
          </p>
        )}
      </div>
    </div>
  );
};

export default LoadingState;