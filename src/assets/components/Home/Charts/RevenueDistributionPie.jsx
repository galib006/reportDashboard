// components/home/charts/RevenueDistributionPie.jsx

import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import { CHART_COLORS } from '../utils/constants';
import { formatCurrency } from '../utils/formatUtils';

const RevenueDistributionPie = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center text-slate-400 py-8">No data available</div>
    );
  }

  const pieData = data.map((channel) => ({
    name: channel.channel,
    value: parseFloat(channel.orderValue.replace(/[$,]/g, "")),
    color: channel.color,
  }));

  const totalRevenue = pieData.reduce((sum, d) => sum + d.value, 0);

  const renderCustomLabel = ({
    name,
    percent,
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
  }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null;

    return (
      <text
        x={x}
        y={y}
        fill="#1E293B"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={9}
        fontWeight="500"
      >
        {`${name.split(" ").slice(0, 2).join(" ")} ${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={90}
            dataKey="value"
            label={renderCustomLabel}
            labelLine={false}
            paddingAngle={2}
          >
            {pieData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(v, name) => [
              `${formatCurrency(v)} (${((v / totalRevenue) * 100).toFixed(1)}%)`,
              name,
            ]}
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "8px 12px",
            }}
          />
          <Legend wrapperStyle={{ fontSize: "10px" }} verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-2 text-xs text-slate-500 text-center">
        Total Order Value: {formatCurrency(totalRevenue)}
      </div>
    </div>
  );
};

export default RevenueDistributionPie;