// components/home/GrowthIndicator.jsx

import React from 'react';
import { FaArrowUp, FaArrowDown, FaMinus } from 'react-icons/fa';

const GrowthIndicator = ({ value }) => {
  if (value > 0) {
    return (
      <span className="flex items-center gap-0.5 text-emerald-600">
        <FaArrowUp className="w-2.5 h-2.5" /> {value.toFixed(1)}%
      </span>
    );
  } else if (value < 0) {
    return (
      <span className="flex items-center gap-0.5 text-red-600">
        <FaArrowDown className="w-2.5 h-2.5" /> {value.toFixed(1)}%
      </span>
    );
  }
  return (
    <span className="flex items-center gap-0.5 text-slate-400">
      <FaMinus className="w-2.5 h-2.5" /> 0%
    </span>
  );
};

export default GrowthIndicator;