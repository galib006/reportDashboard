import axios from "axios";
import React, { useEffect, useState } from "react";
import { BarChart } from "recharts";
import BarChartData from "../components/BarChartData";



// // Set config defaults when creating the instance
// const instance = axios.create({
//   baseURL: 'https://api.example.com'
// });

// // Alter defaults after instance has been created
// instance.defaults.headers.common['Authorization'] = AUTH_TOKEN;
function Home() {
  const [apiData,setapiData] = useState([]);
  const [grpData,setgrpData] = useState([]);
  console.log(apiData);
  console.log(grpData);
  

  useEffect(()=>{
 axios.get('/public/data.json')
  .then(function (response) {
    const data = response.data;
    const groupedData = Object.values(
      data.reduce((acc,item)=>{
        if(!acc[item.WorkOrderNo]){
          acc[item.WorkOrderNo] = { WorkOrderNo: item.WorkOrderNo, BreakDownQTY: 0 };
        }
         acc[item.WorkOrderNo, item.OrderReceiveDate].BreakDownQTY += Number(item.BreakDownQTY || 0);
            return acc;
      },{})
    )
    setapiData(response.data);
    setgrpData(groupedData);
  }).catch(function (error) {
    // handle error
    // console.log(error);
  })
  .finally(function () {
    // always executed
  });
  },[])
  // console.log(grpData);
  
 
  return (
    <div>
      <BarChartData grpData={grpData}></BarChartData>
      {/* {apiData.map((data,index) =>(
        
        <p key={index}>{data.CName} {index}</p>))

      } */}
      
    </div>
  );
}

export default Home;
