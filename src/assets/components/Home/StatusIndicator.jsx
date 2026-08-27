// components/home/StatusIndicator.jsx

import React from 'react';
import { FaCheckCircle, FaClock, FaExclamationTriangle } from 'react-icons/fa';
import { COLORS } from './utils/constants';

const StatusIndicator = ({ status }) => {
  const config = {
    complete: { icon: FaCheckCircle, color: COLORS.success, label: "Complete" },
    inProgress: { icon: FaClock, color: COLORS.warning, label: "In Progress" },
    pending: {
      icon: FaExclamationTriangle,
      color: COLORS.danger,
      label: "Pending",
    },
  };

  const { icon: Icon, color, label } = config[status] || config.pending;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 border border-slate-200/60">
      <Icon className="w-3.5 h-3.5" style={{ color }} />
      <span className="text-xs font-medium text-slate-700">{label}</span>
    </div>
  );
};

export default StatusIndicator;