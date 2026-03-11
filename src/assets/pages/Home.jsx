import React, { useContext, useMemo, useState } from "react";
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
  const apiData = cndata[0]?.apiData || [];

  // Filters
  const [selectedYear, setSelectedYear] = useState("All");
  const [selectedMonth, setSelectedMonth] = useState("All");

  // Unique years & months
  const years = useMemo(() => {
    const uniqueYears = Array.from(
      new Set(apiData.map(item => new Date(item.OrderReceiveDate).getFullYear()))
    );
    return ["All", ...uniqueYears];
  }, [apiData]);

  const months = useMemo(() => {
    const filtered = selectedYear === "All" ? apiData : apiData.filter(item => new Date(item.OrderReceiveDate).getFullYear() === Number(selectedYear));
    const uniqueMonths = Array.from(
      new Set(filtered.map(item => new Date(item.OrderReceiveDate).toLocaleString("default", { month: "short" })))
    );
    return ["All", ...uniqueMonths];
  }, [apiData, selectedYear]);

  // Aggregated Data
  const aggregatedData = useMemo(() => {
    const filtered = apiData.filter(item => {
      const date = new Date(item.OrderReceiveDate);
      const yearMatch = selectedYear === "All" || date.getFullYear() === Number(selectedYear);
      const monthMatch = selectedMonth === "All" || date.toLocaleString("default", { month: "short" }) === selectedMonth;
      return yearMatch && monthMatch;
    });

    const totals = {
      TotalOrderQty: 0,
      TotalOrderValue: 0,
      TotalSaleQty: 0,
      TotalSaleValue: 0,
      TotalBalanceQty: 0,
      TotalBalanceValue: 0,
    };

    const monthly = {};

    filtered.forEach(item => {
      totals.TotalOrderQty += Number(item.BreakDownQTY).toFixed(2);
      totals.TotalOrderValue += Number(item.TotalOrderValue).toFixed(2);
      totals.TotalSaleQty += Number(item.challanqty).toFixed(2);
      totals.TotalSaleValue += Number(item.ChallanValue).toFixed(2);
      totals.TotalBalanceQty += Number(item.BalanceQTY).toFixed(2);
      totals.TotalBalanceValue += Number(item.BalanceValue).toFixed(2);

      const monthName = new Date(item.OrderReceiveDate).toLocaleString("default", { month: "short" });
      if (!monthly[monthName]) monthly[monthName] = { Order: 0, Sale: 0, Balance: 0 };
      monthly[monthName].Order += Number(item.TotalOrderValue).toFixed(2);
      monthly[monthName].Sale += Number(item.ChallanValue).toFixed(2);
      monthly[monthName].Balance += Number(item.BalanceValue).toFixed(2);
    });

    return { totals, monthly };
  }, [apiData, selectedYear, selectedMonth]);

  const chartLabels = Object.keys(aggregatedData.monthly);
  const orderChartData = {
    labels: chartLabels,
    datasets: [{ label: "Order", data: chartLabels.map(m => aggregatedData.monthly[m].Order), backgroundColor: "#4CAF50" }]
  };
  const saleChartData = {
    labels: chartLabels,
    datasets: [{ label: "Sale", data: chartLabels.map(m => aggregatedData.monthly[m].Sale), backgroundColor: "#2196F3" }]
  };
  const balanceChartData = {
    labels: chartLabels,
    datasets: [{ label: "Balance", data: chartLabels.map(m => aggregatedData.monthly[m].Balance), backgroundColor: "#cd0c0c" }]
  };

  return (
    <div className="p-6">
      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="input">
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="input">
          {months.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-7 gap-5 mb-8">
        <Gtotal title="Order Qty" Value={Number(aggregatedData.totals.TotalOrderQty).toFixed(2)} fontStyle="text-white" bgStyle="bg-blue" Icons={<FaCartFlatbed />} />
        <Gtotal title="Order Value" Value={Number(aggregatedData.totals.TotalOrderValue).toFixed(2)} sign="$ " fontStyle="text-white" bgStyle="bg-blue" Icons={<RiMoneyDollarCircleFill />} />
        <Gtotal title="Sales Qty" Value={Number(aggregatedData.totals.TotalSaleQty).toFixed(2)} fontStyle="text-white" bgStyle="bg-blue" Icons={<TbTruckDelivery />} />
        <Gtotal title="Sales Value" Value={Number(aggregatedData.totals.TotalSaleValue).toFixed(2)} sign="$ " fontStyle="text-white" bgStyle="bg-blue" Icons={<RiMoneyDollarCircleFill />} />
        <Gtotal title="Balance Qty" Value={Number(aggregatedData.totals.TotalBalanceQty).toFixed(2)} fontStyle="text-white" bgStyle="bg-blue" Icons={<FaCartFlatbed />} />
        <Gtotal title="Balance Value" Value={Number(aggregatedData.totals.TotalBalanceValue).toFixed(2)} sign="$ " fontStyle="text-white" bgStyle="bg-blue" Icons={<RiMoneyDollarCircleFill />} />
        <Gtotal title="Delivery %" Value={`${((Number(aggregatedData.totals.TotalSaleQty) / Number(aggregatedData.totals.TotalOrderQty))*100).toFixed(0)}%`} fontStyle="text-white" bgStyle="bg-blue" Icons={<FaCartFlatbed />} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-3 gap-8">
        <div className="p-4 bg-white shadow rounded">
          <h3 className="mb-2 font-semibold">Order Value</h3>
          <Bar data={orderChartData} />
        </div>
        <div className="p-4 bg-white shadow rounded">
          <h3 className="mb-2 font-semibold">Sales Value</h3>
          <Bar data={saleChartData} />
        </div>
        <div className="p-4 bg-white shadow rounded">
          <h3 className="mb-2 font-semibold">Balance Value</h3>
          <Bar data={balanceChartData} />
        </div>
      </div>
    </div>
  );
}

export default Home;