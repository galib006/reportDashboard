import React, { useContext, useEffect, useMemo } from "react";
import BarChartData from "../components/BarChartData";
import Gtotal from "../components/Gtotal";
import { FaCartFlatbed } from "react-icons/fa6";
import { RiMoneyDollarCircleFill } from "react-icons/ri";
import { TbTruckDelivery } from "react-icons/tb";
import { GetDataContext } from "../components/DataContext";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

function Home() {
  const { cndata } = useContext(GetDataContext);

  // Extract data safely
  const grpData = cndata[0]?.groupedData || [];

  // Compute grand totals
  const grandTotal = grpData.reduce(
    (acc, item) => {
      acc.TotalDOrderQTY += Number(item.BreakDownQTY);
      acc.TotalOrderValue += Number(item.TotalOrderValue);
      acc.TotalChallanQty += Number(item.challanqty);
      acc.TotalChallanValue += Number(item.ChallanValue);
      acc.TotalBalanceQTY += Number(item.BalanceQTY);
      acc.TotalBalanceValue += Number(item.BalanceValue);
      return acc;
    },
    {
      TotalDOrderQTY: 0,
      TotalOrderValue: 0,
      TotalChallanQty: 0,
      TotalChallanValue: 0,
      TotalBalanceQTY: 0,
      TotalBalanceValue: 0,
    },
  );

  useEffect(() => {
    console.log("cndata in Home:", cndata[0]?.apiData);
  }, [cndata]);
  const monthlyData = useMemo(() => {
    const apiData = cndata[0]?.apiData || [];
    return Object.values(
      apiData.reduce((acc, item) => {
        const date = new Date(item.OrderReceiveDate);
        const monthName = date.toLocaleString("default", { month: "short" });
        if (!acc[monthName]) {
          acc[monthName] = {
            month: monthName,
            TotalOrderValue: 0,
            TotalSaleValue: 0,
          };
        }
        acc[monthName].TotalOrderValue += item.TotalOrderValue || 0;
        acc[monthName].TotalSaleValue += item.ChallanValue || 0;

        return acc;
      }, {}),
    );
  }, [cndata]);
console.log(monthlyData);

const chartData = {
  labels: monthlyData.map(item => item.month),

  datasets: [
    {
      label: "Total Order Value",
      data: monthlyData.map(item => Number(item.TotalOrderValue.toFixed(2))),
      backgroundColor: "#4CAF50"
    },
    {
      label: "Total Sale Value",
      data: monthlyData.map(item => Number(item.TotalSaleValue.toFixed(2))),
      backgroundColor: "#2196F3"
    }
  ]
};

  return (
    <div>

    <div>
      {monthlyData.map((item) => (
        <div key={item.month}>
          <h3>{item.month}-  <span>{item.TotalOrderValue.toFixed(2)}</span></h3> 
          <h3>{item.month}-  <span>{item.TotalSaleValue.toFixed(2)}</span></h3> 
          
        </div>
      ))}
    </div>
      
      <div className="bg-[#3e939585]">
        <div className="mx-6 py-6">
          <div className="grid grid-cols-6 gap-5 my-3">
            <Gtotal
              title={"Order QTY"}
              Value={grandTotal.TotalDOrderQTY.toFixed(2)}
              fontStyle={"text-white"}
              bgStyle={"bg-blue"}
              Icons={<FaCartFlatbed />}
            />
            <Gtotal
              title={"Order Value"}
              Value={grandTotal.TotalOrderValue.toFixed(2)}
              sign={"$ "}
              fontStyle={"text-white"}
              bgStyle={"bg-blue"}
              Icons={<RiMoneyDollarCircleFill />}
            />
            <Gtotal
              title={"Sales QTY"}
              Value={grandTotal.TotalChallanQty.toFixed(2)}
              fontStyle={"text-white"}
              bgStyle={"bg-blue"}
              Icons={<TbTruckDelivery />}
            />
            <Gtotal
              title={"Sales Value"}
              Value={grandTotal.TotalChallanValue.toFixed(2)}
              sign={"$ "}
              fontStyle={"text-white"}
              bgStyle={"bg-blue"}
              Icons={<RiMoneyDollarCircleFill />}
            />
            <Gtotal
              title={"Balance QTY"}
              Value={grandTotal.TotalBalanceQTY.toFixed(2)}
              fontStyle={"text-white"}
              bgStyle={"bg-blue"}
              Icons={<FaCartFlatbed />}
            />
            <Gtotal
              title={"Balance Value"}
              Value={grandTotal.TotalBalanceValue.toFixed(2)}
              sign={"$ "}
              fontStyle={"text-white"}
              bgStyle={"bg-blue"}
              Icons={<RiMoneyDollarCircleFill />}
            />
            <Gtotal
              title={"Delivery Complete"}
              Value={
                (
                  (grandTotal.TotalChallanQty / grandTotal.TotalDOrderQTY) *
                  100
                ).toFixed(0) + "%"
              }
              fontStyle={"text-white"}
              bgStyle={"bg-blue"}
              Icons={<FaCartFlatbed />}
            />
          </div>
        </div>
      </div>
      {/* <BarChartData grpData={grpData} /> */}
      <div style={{ width: "700px" }}>
  <Bar data={chartData} />
</div>
    </div>
  );
}

export default Home;
