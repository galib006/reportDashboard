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
  const [grandTotal, setgrandTotal] = useState([]);
  // console.log(apiData);

  useEffect(() => {
    axios
      .get("/public/data.json")
      .then(function (response) {
        const data = response.data;
        const groupData = Object.values(
          data.reduce((acc, item) => {
            const key = item.WorkOrderNo;
            if (!acc[key]) {
              acc[key] = {
                WorkOrder: item.WorkOrderNo,
                OrderQty: 0,
                ChallanQTY: 0,
                BalanceQTY: 0,
              };
            }
            acc[key].OrderQty += Number(item.BreakDownQTY || 0);
            acc[key].ChallanQTY += Number(item.ChallanQTY || 0);
            acc[key].BalanceQTY += Number(item.BalanceQTY || 0);
            return acc;
          }, {})
        );

        const OrderCount = groupData.length;
        // console.log(OrderCount);

        const { GrandTotalOrderQTY, GrandTotalDeliveryQTY } = groupData.reduce(
          (acc, item) => {
            acc.GrandTotalOrderQTY += Number(item.OrderQty || 0);
            acc.GrandTotalDeliveryQTY += Number(item.ChallanQTY || 0);
            return acc;
          },
          { GrandTotalOrderQTY: 0, GrandTotalDeliveryQTY: 0 }
        );
        const GtotalData = {
          TotalOrder: OrderCount,
          GrandTotalOrderQTY: GrandTotalOrderQTY,
          GrandTotalDeliveryQTY: GrandTotalDeliveryQTY,
        };
        setgrandTotal(GtotalData);

        // console.log(GrandTotalOrderQTY, GrandTotalDeliveryQTY);
        // setgrpData({ grpData, GrandTotalOrderQTY, GrandTotalDeliveryQTY });
      })
      .catch(function (error) {
        console.log(error);
      })
      .finally(function (final) {});
  });

  // useEffect(() => {
  //   axios
  //     .get("/public/data.json")
  //     .then(function (response) {
  //       const data = response.data;
  //       const groupedData = Object.values(
  //         data.reduce((acc, item) => {
  //           const key = item.WorkOrderNo;
  //           if (!acc[key]) {
  //             acc[key] = {
  //               WorkOrderNo: item.WorkOrderNo,
  //               challanqty: 0,
  //               BreakDownQTY: 0,
  //             };
  //           }
  //           acc[key].challanqty += Number(item.ChallanQTY);
  //           acc[key].BreakDownQTY += Number(item.BreakDownQTY || 0);
  //           return acc;
  //         }, {})
  //       );
  //       const { TotalChallanQty, TotalOrderQty } = groupedData.reduce(
  //         (acc, item) => {
  //           acc.TotalChallanQty += Number(item.challanqty);
  //           acc.TotalOrderQty += Number(item.BreakDownQTY);
  //           return acc;
  //         },
  //         { TotalChallanQty: 0, TotalOrderQty: 0 }
  //       );
  //       setgrandTotal({ TotalChallanQty, TotalOrderQty });
  //       setapiData(response.data);
  //       setgrpData(groupedData);
  //     })
  //     .catch(function (error) {
  //       console.log(error);
  //     })
  //     .finally(function () {
  //       // always executed
  //     });
  // }, []);
  // // console.log(grpData);
  // console.log(grandTotal);

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
              // Value={GrandTotalOrderValue.toFixed(0)}
              sign={"$ "}
              fontStyle={"text-white"}
              bgStyle={"bg-blue"}
            ></Gtotal>
            <Gtotal
              title={"Sales QTY"}
              // Value={GrandTotalDeliveryQTY.toFixed(0)}
              fontStyle={"text-white"}
              bgStyle={"bg-blue"}
            ></Gtotal>
            <Gtotal
              title={"Sales Value"}
              // Value={GrandTotalOrderValue.toFixed(0)}
              sign={"$ "}
              fontStyle={"text-white"}
              bgStyle={"bg-blue"}
            ></Gtotal>
            <Gtotal
              title={"Balance QTY"}
              // Value={GrandTotalOrderValue.toFixed(0)}
              sign={"$ "}
              fontStyle={"text-white"}
              bgStyle={"bg-blue"}
            ></Gtotal>
            <Gtotal
              title={"Balance Value"}
              // Value={GrandTotalOrderValue.toFixed(0)}
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
