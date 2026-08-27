// components/home/charts/PredictionChart.jsx

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { COLORS } from '../utils/constants';
import { formatCurrency, formatCompactCurrency } from '../utils/formatUtils';

const PredictionChart = ({ data }) => {
  const [predictionPeriod, setPredictionPeriod] = useState(3);

  if (!data || data.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-slate-400">
        No data for prediction
      </div>
    );
  }

  const lastData = data.slice(-6);
  const xValues = lastData.map((_, i) => i);
  const yValues = lastData.map((d) => d.saleValue || d.value || 0);

  const n = xValues.length;
  const sumX = xValues.reduce((a, b) => a + b, 0);
  const sumY = yValues.reduce((a, b) => a + b, 0);
  const sumXY = xValues.reduce((a, b, i) => a + b * yValues[i], 0);
  const sumX2 = xValues.reduce((a, b) => a + b * b, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const predictedData = [];
  for (let i = 0; i < predictionPeriod; i++) {
    const nextX = xValues[xValues.length - 1] + i + 1;
    const predictedValue = slope * nextX + intercept;
    predictedData.push({
      name: `Month ${i + 1}`,
      predicted: Math.max(0, Math.round(predictedValue)),
    });
  }

  const chartData = [
    ...lastData.map((d, i) => ({
      name: d.name || d.month || `M${i + 1}`,
      actual: Math.round(d.saleValue || d.value || 0),
    })),
    ...predictedData.map((d) => ({ name: d.name, predicted: d.predicted })),
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-slate-500">Sales revenue forecast</p>
        <div className="flex gap-1">
          {[3, 6, 12].map((period) => (
            <button
              key={period}
              onClick={() => setPredictionPeriod(period)}
              className={`px-2 py-0.5 text-xs rounded transition-all ${
                predictionPeriod === period
                  ? "bg-indigo-500 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {period}m
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => formatCompactCurrency(v)} />
          <Tooltip
            formatter={(v) => formatCurrency(v)}
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "8px 12px",
            }}
          />
          <Legend />
          <Bar dataKey="actual" fill={COLORS.success} radius={[4, 4, 0, 0]} name="Actual Sales" />
          <Line
            dataKey="predicted"
            stroke={COLORS.secondary}
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: COLORS.secondary, r: 4 }}
            name="Predicted Sales"
          />
          <Area dataKey="predicted" fill={COLORS.secondary} fillOpacity={0.1} stroke="none" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PredictionChart;