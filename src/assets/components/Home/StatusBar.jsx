// components/home/StatusBar.jsx

import React from 'react';
import StatusIndicator from './StatusIndicator';
import { getStatusColor } from './utils/formatUtils';
import { COLORS } from './utils/constants';

const StatusBar = ({ data }) => {
  return (
    <div className="flex flex-wrap gap-3 items-center">
      <StatusIndicator status="complete" />
      <StatusIndicator status="inProgress" />
      <StatusIndicator status="pending" />
      <div className="ml-auto flex items-center gap-3 text-xs">
        <span className="text-slate-400">
          Updated: {new Date().toLocaleTimeString()}
        </span>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-slate-400">|</span>
        <span className="text-slate-400">
          Delivery:{" "}
          <span style={{ color: getStatusColor(data.deliveryPercent) }}>
            {data.deliveryPercent.toFixed(0)}%
          </span>
        </span>
        <span className="text-slate-400">|</span>
        <span className="text-slate-400">
          Sales Growth:{" "}
          <span
            style={{
              color: data.salesGrowth >= 0 ? COLORS.success : COLORS.danger,
            }}
          >
            {data.salesGrowth.toFixed(1)}%
          </span>
        </span>
      </div>
    </div>
  );
};

export default StatusBar;