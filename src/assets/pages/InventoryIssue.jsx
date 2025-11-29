import React, { useContext, useEffect } from 'react'
import DateRangePicker from '../components/DatePickerData'
import { GetDataContext } from '../components/DataContext'
import axios from 'axios'
import { toast } from 'react-toastify';
import { FourSquare } from 'react-loading-indicators';
import Table from '@mui/material/Table';
import { enGB } from 'date-fns/locale';


function InventoryIssue() {
  const {cndata, setcndata, loading,setLoading} = useContext(GetDataContext);
  // console.log(cndata);
  const DateFormat = (e)=>{
    const Ndate =  Date(e).toString(enGB)
    return new Date(e).toISOString().split("T")[0]
  }
    const stDate = cndata?.startDate
  ? cndata.startDate.toISOString().split("T")[0]
  : "";
const edDate = cndata?.endDate
  ? cndata.endDate.toISOString().split("T")[0]
  : "";
  
  const apiKey = localStorage.getItem("apiKey")
  const InvIssue = async (e)=>{
    e.preventDefault();
    if(!cndata.startDate || !cndata.endDate){
      toast.error("Please Select Start & End Date");
      return
    }
    setLoading(true)
    
    try{
      const res = await axios.get(
        `https://tpl-api.ebs365.info/api/InventoryBI/SCM_GET_MaterialIssueDetail?CompanyID=1&ParentCategoryID=6&CategoryID=0&SubCategoryID=0&MainMaterialID=0&StartDate=${stDate}&EndDate=${edDate}&CommandID=2`,
          { headers: { Authorization: `${apiKey}` } }
        );
       setcndata((prev)=>({
        ...prev,
        inventory:res.data
       }))
    }
    catch (err) {
          console.log("API ERROR:", err);
    
          if (err.response?.status === 401) {
            toast.error("Unauthorized! Your session has expired.");
          } else {
            toast.error(err.response?.data?.message || "Something went wrong!");
          }
        }
          finally{
      setLoading(false)
    }
  }
  const data = cndata.inventory || [];
  console.log(data);
  const ddd = data.map((data,idx)=>data.CostCenterName) || 0;
  const costCenter = [...new Set(data.map((data)=>data.CostCenterName))] || 0;
  // console.log(costCenter);
  const FilterData = costCenter.map((aaa)=>{
    // return uniqueReq
    return{
    CostCenter: aaa,
    Item: data.filter((dd)=>(
        aaa == dd.CostCenterName
    ))}
  })
  // const uniqueReq = [...new Set(FilterData.RequisitionNo)]
  // console.log(uniqueReq);
  const ReqNO =  FilterData.map((data)=>data.Item.map(dd));
  console.log(ReqNO);
  
  
  

  // const uniqueItem =[...new Set(FilterData.map(data=>data.Item))] || [];
  // const 
  // console.log(uniqueItem);
  
  return (
    <>
    <form action="" onSubmit={(e)=>InvIssue(e)}>

           <div className='flex justify-center items-center gap-4'>
            <DateRangePicker/>
            <input type="submit" value="Submit" className='btn btn-success'/>
            </div>
    </form>
    <>
      {
        loading ? ( 
        <div className="flex justify-center items-center h-screen">
          <FourSquare color="#32cd32" size="large" />
        </div>) : (

          <table className='table'>
            <thead>
              <tr>
              <th>SL.</th>
              <th>Section</th>
              <th>Req No</th>
              <th>Req Date</th>
              <th>Issue No.</th>
              <th>Issue Date</th>
            </tr>
            </thead>
            <tbody>
              {
              FilterData && FilterData.map((dd,idx)=>(
                <>
                <tr className='text-2xl bg-blue-300 font-bold' key={idx}>
                  <td colspan="100%">{dd.CostCenter}</td>
                </tr>
                {
                  dd.Item.map((dd,idx)=>(
                  <tr key={idx}>
                  <td>
                    {idx+1}
                  </td>
                  <td>{dd.CostCenterName}</td>
                  <td>{dd.RequisitionNo}</td>
                  <td>{DateFormat(dd.RequisitionDate)}</td>
                </tr>
                ))
                }
                </>
              ))}
            </tbody>
          </table>
        )
      }
    </>
    </>
  )
}

export default InventoryIssue
