import axios from "axios";
import React, { useEffect, useState } from "react";



// // Set config defaults when creating the instance
// const instance = axios.create({
//   baseURL: 'https://api.example.com'
// });

// // Alter defaults after instance has been created
// instance.defaults.headers.common['Authorization'] = AUTH_TOKEN;
function Home() {
  const [apiData,setapiData] = useState([]);
  const [grpData,setgrpData] = useState([]);

  useEffect(()=>{
 axios.get('/public/data.json')
  .then(function (response) {
    console.log(response);
    const data = response.data;
    const groupedData = Object.values(
      data.reduce((acc,item)=>{
        if(!acc[item.WorkOrderNo]){
          acc[item.WorkOrderNo] = { WorkOrderNo: item.WorkOrderNo, TotalQty: 0 };
        }
         acc[item.WorkOrderNo].TotalQty += Number(item.Qty || 0);
            return acc;
      },{})
    )
    setapiData(response.data);
    setgrpData(groupedData);
  }).catch(function (error) {
    // handle error
    console.log(error);
  })
  .finally(function () {
    // always executed
  });
  },[])
  console.log(grpData);
  
 
  return (
    <div>
      
      {/* {apiData.map((data,index) =>(
        
        <p key={index}>{data.CName} {index}</p>))

      } */}
      
    </div>
  );
}

export default Home;
