// components/home/KpiGrid.jsx

import React from 'react';
import KPICard from './KPICard';

const KpiGrid = ({ kpiConfig }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
      {kpiConfig.map((kpi) => (
        <KPICard key={kpi.id} {...kpi} />
      ))}
    </div>
  );
};

export default KpiGrid;