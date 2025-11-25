import axios from 'axios'
import React, { useContext, useEffect } from 'react'
import { GetDataContext } from '../components/DataContext'
import DateRangePicker from '../components/DatePickerData'

function EmployeeLIst() {
    const { cndata, setcndata, loading, setLoading } = useContext(GetDataContext)
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
    
       const emplst = async (e)=>{
        e.preventDefault();
        try{
            const res = await axios.get(
                `https://tpl-api.ebs365.info/api/HRMBI/HRM_GET_EmployeeInformation_ReportExcel?CompanyID=1&DepartmentID=2&SectionID=0&LineID=0&FloorID=0&EmpTypeID=4&CommandID=1&MM=November&YYYY=2025`,
                {
                    headers:{Authorization:`${apiKey}`}
                }
            )
        }catch(err){
            console.log("Error:", err );
        }finally{

        }
        
        
       }


  return (
    <>
     <form action="" onSubmit={(e)=>emplst(e)}>
           <div className='flex justify-center items-center gap-4'>
            <DateRangePicker/>
            <input type="submit" value="Submit" className='btn btn-success'/>
            </div>
    </form>
    </>
  )
}

export default EmployeeLIst
