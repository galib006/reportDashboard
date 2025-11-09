import axios, { toFormData } from "axios";
import React, { useEffect, useState } from "react";
import { BarChart } from "recharts";
import BarChartData from "../components/BarChartData";
import Gtotal from "../components/Gtotal";
import { FaCartFlatbed } from "react-icons/fa6";
import { FaCartFlatbedSuitcase } from "react-icons/fa6";
import { RiMoneyDollarCircleFill } from "react-icons/ri";
import { TbTruckDelivery } from "react-icons/tb";

// // Set config defaults when creating the instance
// const instance = axios.create({
//   baseURL: 'https://api.example.com'
// });

// // Alter defaults after instance has been created
// instance.defaults.headers.common['Authorization'] = AUTH_TOKEN;
function Home() {
  const [apiData,setapiData] = useState([]);
  const [grpData,setgrpData] = useState([]);
  const [grandTotal,setgrandTotal] = useState({
     TotalDOrderQTY: 0,
     TotalOrderValue:0,
      TotalChallanQty: 0,
      TotalChallanValue: 0,
      TotalBalanceQTY:0,
      TotalBalanceValue:0
  });
  // console.log(apiData);


  

  useEffect(()=>{
 axios.get('/public/data.json')
  .then(function (response) {
    const data = response.data;
    const groupedData = Object.values(
      data.reduce((acc,item)=>{
        const key = item.WorkOrderNo
        const date = new Date(item.OrderReceiveDate);
        const formateDate = date.toLocaleDateString('en-GB');
        if(!acc[key]){
          acc[key] = {
            WorkOrderNo: item.WorkOrderNo,
            challanqty: 0,
            BreakDownQTY: 0,
            TotalOrderValue: 0,
            ChallanValue: 0,
            BalanceQTY: 0,
            BalanceValue:0,
            
            OrderReceiveDate: formateDate
          }
        }
        acc[key].challanqty += Number(item.ChallanQTY);
        acc[key].BreakDownQTY += Number(item.BreakDownQTY || 0); 
        acc[key].TotalOrderValue += Number(item.TotalOrderValue || 0); 
        acc[key].ChallanValue += Number(item.ChallanValue || 0); 
        acc[key].BalanceQTY += Number(item.BalanceQTY || 0); 
        acc[key].BalanceValue += Number(item.BalanceValue || 0); 
        return acc;
      },{})

    )
    const {TotalDOrderQTY,TotalOrderValue, TotalChallanQty,TotalChallanValue,TotalBalanceQTY,TotalBalanceValue} =  groupedData.reduce((acc,item)=>{
      acc.TotalDOrderQTY += Number(item.BreakDownQTY || 0);
      acc.TotalOrderValue += Number(item.TotalOrderValue || 0);
       acc.TotalChallanQty += Number(item.challanqty || 0);
       acc.TotalChallanValue += Number(item.ChallanValue || 0);
       acc.TotalBalanceQTY += Number(item.BalanceQTY || 0);
       acc.TotalBalanceValue += Number(item.BalanceValue || 0);
       return acc
    },{TotalDOrderQTY:0,TotalOrderValue:0, TotalChallanQty:0,TotalChallanValue:0,TotalBalanceQTY:0,TotalBalanceValue:0})
    setapiData(response.data);
    setgrpData(groupedData);

    setgrandTotal({TotalDOrderQTY,TotalOrderValue, TotalChallanQty, TotalChallanValue, TotalBalanceQTY,TotalBalanceValue});
  }).catch(function (error) {
    console.log(error);
  })
  .finally(function () {
    // always executed
  });
  },[])
  console.log(grpData);

  return (
    <div>
      <div className="bg-[#3e939585]">
        <div className="mx-6 py-6">
          <div className="grid grid-cols-6 gap-5 my-3">
            <Gtotal
              title={"Order QTY"}
              Value={grandTotal?.TotalDOrderQTY?.toFixed(2)}
              fontStyle={"text-white"}
              bgStyle={"bg-blue"}
              Icons={<FaCartFlatbed />}
            ></Gtotal>
            <Gtotal
              title={"Order Value"}
              Value={grandTotal?.TotalOrderValue?.toFixed(2)}
              sign={"$ "}
              fontStyle={"text-white"}
              bgStyle={"bg-blue"}
              Icons={<RiMoneyDollarCircleFill   />}
            ></Gtotal>
            <Gtotal
              title={"Sales QTY"}
              Value={grandTotal?.TotalChallanQty?.toFixed(2)}
              fontStyle={"text-white"}
              bgStyle={"bg-blue"}
              Icons={<TbTruckDelivery  />}
            ></Gtotal>
            <Gtotal
              title={"Sales Value"}
              Value={grandTotal?.TotalChallanValue?.toFixed(0)}
              sign={"$ "}
              fontStyle={"text-white"}
              bgStyle={"bg-blue"}
              Icons={<RiMoneyDollarCircleFill  />}
            ></Gtotal>
            <Gtotal
              title={"Balance QTY"}
              Value={grandTotal?.TotalBalanceQTY?.toFixed(0)}
              fontStyle={"text-white"}
              bgStyle={"bg-blue"}
              Icons={<FaCartFlatbed />}
            ></Gtotal>
            <Gtotal
              title={"Balance Value"}
              Value={grandTotal?.TotalBalanceValue?.toFixed(0)}
              sign={"$ "}
              fontStyle={"text-white"}
              bgStyle={"bg-blue"}
              Icons={<RiMoneyDollarCircleFill />}
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
