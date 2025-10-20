import React from 'react'

function BarChart() {
  return (
    <div>
      <TickParamsSelector
  tickPlacement={tickPlacement}
  tickLabelPlacement={tickLabelPlacement}
  setTickPlacement={setTickPlacement}
  setTickLabelPlacement={setTickLabelPlacement}
/>
<BarChart
  dataset={dataset}
  xAxis={[{ dataKey: 'month', tickPlacement, tickLabelPlacement }]}
  {...chartSetting}
/>
    </div>
  )
}

export default BarChart
