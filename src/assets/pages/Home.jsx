import axios from "axios";
import React, { useEffect, useState } from "react";
import { BarChart } from "recharts";
import BarChartData from "../components/BarChartData";
import Gtotal from "../components/Gtotal";

// // Set config defaults when creating the instance
// const instance = axios.create({
//   baseURL: 'https://api.example.com'
// });

// // Alter defaults after instance has been created
// instance.defaults.headers.common['Authorization'] = AUTH_TOKEN;
function Home() {
  const [apiData, setapiData] = useState([]);
  const [grpData, setgrpData] = useState([]);
  const [grandTotal, setgrandTotal] = useState({});
  // console.log(apiData);

  useEffect(() => {
    axios
      .get("/public/data.json")
      .then(function (response) {
        const data = response.data;
        const groupData = Object.values(
          data.reduce((acc, item) => {
            const key = item.WorkOrderNo;
            const date = new Date(item.OrderReceiveDate);
            const formatDate = date.toLocaleDateString("en-GB");
            if (!acc[key]) {
              acc[key] = {
                WorkOrder: item.WorkOrderNo,
                OrderDate: formatDate,
                OrderQty: 0,
                OrderValue: 0,
                ChallanQTY: 0,
                ChallanValue: 0,
                BalanceQTY: 0,
                BalanceValue: 0,
                CustomerPINo: item.CustomerPINo,
              };
            }
            acc[key].OrderQty += Number(item.BreakDownQTY || 0);
            acc[key].OrderValue += Number(item.TotalOrderValue || 0);
            acc[key].ChallanQTY += Number(item.ChallanQTY || 0);
            acc[key].ChallanValue += Number(item.ChallanValue || 0);
            acc[key].BalanceQTY += Number(item.BalanceQTY || 0);
            acc[key].BalanceValue += Number(item.BalanceValue || 0);
            return acc;
          }, {})
        );

        const OrderCount = groupData.length;
        // console.log(OrderCount);

        const GrandTotal = groupData.reduce(
          (acc, item) => {
            acc.GrandTotalOrderQTY += Number(item.OrderQty || 0);
            acc.GrandTotalOrderValue += Number(item.OrderValue || 0);
            acc.GrandTotalDeliveryQTY += Number(item.ChallanQTY || 0);
            acc.GrandTotalDeliveryValue += Number(item.ChallanValue || 0);
            acc.GrandTotalBalanceQTY += Number(item.BalanceQTY || 0);
            acc.GrandTotalBalanceValue += Number(item.BalanceValue || 0);
            return acc;
          },
          {
            GrandTotalOrderQTY: 0,
            GrandTotalOrderValue: 0,
            GrandTotalDeliveryQTY: 0,
            GrandTotalDeliveryValue: 0,
            GrandTotalBalanceQTY: 0,
            GrandTotalBalanceValue: 0,
          }
        );
        setgrpData(groupData);
        setgrandTotal({ ...GrandTotal, OrderCount });
      })
      .catch(function (error) {
        console.log(error);
      })
      .finally(function (final) {});
  }, []);
  console.log(grandTotal);
  return (
    <div>
      <div className="bg-sky-200">
        <div className="mx-6 py-6">
          <div className="grid grid-cols-6 gap-5 my-3">
            <Gtotal
              title={"Order QTY"}
              Value={grandTotal?.GrandTotalOrderQTY?.toFixed(1)}
              fontStyle={"text-white"}
              bgStyle={"bg-blue"}
            ></Gtotal>
            <Gtotal
              title={"Order Value"}
              Value={grandTotal?.GrandTotalOrderValue?.toFixed(1)}
              sign={"$ "}
              fontStyle={"text-white"}
              bgStyle={"bg-blue"}
            ></Gtotal>
            <Gtotal
              title={"Sales QTY"}
              Value={grandTotal?.GrandTotalDeliveryQTY?.toFixed(1)}
              fontStyle={"text-white"}
              bgStyle={"bg-blue"}
            ></Gtotal>
            <Gtotal
              title={"Sales Value"}
              Value={grandTotal?.GrandTotalDeliveryValue?.toFixed(1)}
              sign={"$ "}
              fontStyle={"text-white"}
              bgStyle={"bg-blue"}
            ></Gtotal>
            <Gtotal
              title={"Balance QTY"}
              Value={grandTotal?.GrandTotalBalanceQTY?.toFixed(1)}
              fontStyle={"text-white"}
              bgStyle={"bg-blue"}
            ></Gtotal>
            <Gtotal
              title={"Balance Value"}
              Value={grandTotal?.GrandTotalBalanceValue?.toFixed(1)}
              sign={"$ "}
              fontStyle={"text-white"}
              bgStyle={"bg-blue"}
            ></Gtotal>
          </div>
        </div>
      </div>
      <BarChartData grpData={grpData}></BarChartData>
    </div>
  );
}

export default Home;
