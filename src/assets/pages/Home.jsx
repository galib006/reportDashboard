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

  useEffect(() => {
    axios
      .get("/public/data.json")
      .then(function (response) {
        const data = response.data;
        const groupedData = Object.values(
          data.reduce((acc, item) => {
            const key = item.WorkOrderNo;
            if (!acc[key]) {
              acc[key] = {
                WorkOrderNo: item.WorkOrderNo,
                OrderReceiveDate: item.OrderReceiveDate,
                id: item.ID,
                BreakDownQTY: 0,
                OrderValue: 0,
                Delivery: 0,
                DeliveryValue: 0,
              };
            }
            acc[key].BreakDownQTY += Number(item.BreakDownQTY || 0);
            acc[key].OrderValue += Number(item.TotalOrderValue || 0);
            acc[key].Delivery += Number(item.ChallanQTY || 0);
            acc[key].DeliveryValue += Number(item.ChallanValue || 0);

            return acc;
          }, {})
        );
        setapiData(response.data);
        setgrpData(groupedData);
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      })
      .finally(function () {
        // always executed
      });
  }, []);

  const {
    GrandTotalOrderQTY,
    GrandTotalOrderValue,
    GrandTotalDeliveryQTY,
    GrandTotalDeliveryValue,
    GrandTotalBalanceValue,
  } = React.useMemo(() => {
    const totals = grpData.reduce(
      (acc, item) => {
        acc.GrandTotalOrderQTY += Number(item.BreakDownQTY || 0);
        acc.GrandTotalOrderValue += Number(item.OrderValue || 0);
        acc.GrandTotalDeliveryQTY += Number(item.Delivery || 0);
        acc.GrandTotalDeliveryValue += Number(item.ChallanValue || 0);
        acc.GrandTotalBalanceValue +=
          Number(item.OrderValue || 0) - Number(item.ChallanValue || 0);
        return acc;
      },
      {
        GrandTotalOrderQTY: 0,
        GrandTotalOrderValue: 0,
        GrandTotalDeliveryQTY: 0,
        GrandTotalDeliveryValue: 0,
        GrandTotalBalanceValue: 0,
      }
    );

    return totals;
  }, [grpData]);

  return (
    <div>
      <div className="bg-sky-200">
        <div className="mx-6 py-6">
          <div className="grid grid-cols-6 gap-5 my-3">
            <Gtotal
              title={"Order QTY"}
              Value={GrandTotalOrderQTY.toFixed(0)}
              fontStyle={"text-white"}
              bgStyle={"bg-blue"}
            ></Gtotal>
            <Gtotal
              title={"Order Value"}
              Value={GrandTotalOrderValue.toFixed(0)}
              sign={"$ "}
              fontStyle={"text-white"}
              bgStyle={"bg-blue"}
            ></Gtotal>
            <Gtotal
              title={"Sales QTY"}
              Value={GrandTotalDeliveryQTY.toFixed(0)}
              fontStyle={"text-white"}
              bgStyle={"bg-blue"}
            ></Gtotal>
            <Gtotal
              title={"Sales Value"}
              Value={GrandTotalOrderValue.toFixed(0)}
              sign={"$ "}
              fontStyle={"text-white"}
              bgStyle={"bg-blue"}
            ></Gtotal>
            <Gtotal
              title={"Balance QTY"}
              Value={GrandTotalOrderValue.toFixed(0)}
              sign={"$ "}
              fontStyle={"text-white"}
              bgStyle={"bg-blue"}
            ></Gtotal>
            <Gtotal
              title={"Balance Value"}
              Value={GrandTotalOrderValue.toFixed(0)}
              sign={"$ "}
              fontStyle={"text-white"}
              bgStyle={"bg-blue"}
            ></Gtotal>
          </div>
        </div>
      </div>
      <BarChartData grpData={grpData}></BarChartData>
      {/* {apiData.map((data,index) =>(
        
        <p key={index}>{data.CName} {index}</p>))

      } */}
    </div>
  );
}

export default Home;
