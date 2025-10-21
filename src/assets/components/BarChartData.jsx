import React from "react";
import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

function BarChartComponent({ grpData }) {
<<<<<<< HEAD
=======


>>>>>>> d7cfa9d2e7e6385d43f8f3c61bdb479238040ca6
  return (
    <div>
      <ReBarChart width={1000} height={600} data={grpData}>
        <XAxis dataKey="WorkOrderNo" stroke="#8884d8" />
        <YAxis />
        <Tooltip wrapperStyle={{ width: 100, backgroundColor: "#ccc" }} />
        <Legend
          width={100}
          wrapperStyle={{
            top: 40,
            right: 20,
            backgroundColor: "#f5f5f5",
            border: "1px solid #d5d5d5",
            borderRadius: 3,
            lineHeight: "40px",
          }}
        />
        <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
        <Bar dataKey="OrderValue" fill="#8884d8" barSize={30} />
        <Bar dataKey="DeliveryValue" fill="#8884d8" barSize={30} />
      </ReBarChart>
    </div>
  );
}

export default BarChartComponent;
