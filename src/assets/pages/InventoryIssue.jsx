import React, { useContext, useEffect, useMemo, useState } from "react";
import DateRangePicker from "../components/DatePickerData";
import { GetDataContext } from "../components/DataContext";
import axios from "axios";
import { toast } from "react-toastify";
import { FourSquare } from "react-loading-indicators";
import Table from "@mui/material/Table";
import { enGB } from "date-fns/locale";

function InventoryIssue() {
  const { cndata, setcndata, loading, setLoading } = useContext(GetDataContext);
  const [costCenter,setCostcenter] = useState([]);
  const [itemName,setitemName] = useState([]);
  const [reqDaatee,setreqDaatee] = useState('');
  const [TotalreqQty,setTotalreqQty] = useState('');
  // console.log(cndata);
  const DateFormat = (e) => {
    const Ndate = Date(e).toString(enGB);
    return new Date(e).toISOString().split("T")[0];
  };
  const stDate = cndata?.startDate
    ? cndata.startDate.toISOString().split("T")[0]
    : "";
  const edDate = cndata?.endDate
    ? cndata.endDate.toISOString().split("T")[0]
    : "";

  const apiKey = localStorage.getItem("apiKey");

    const InvIssue = async (e) => {
    if (!cndata.startDate || !cndata.endDate) {
      toast.error("Please Select Start & End Date");
      return;
    }
    setLoading(true);

    try {
      const res = await axios.get(
        `https://tpl-api.ebs365.info/api/InventoryBI/SCM_GET_MaterialIssueDetail?CompanyID=1&ParentCategoryID=6&CategoryID=0&SubCategoryID=0&MainMaterialID=0&StartDate=${stDate}&EndDate=${edDate}&CommandID=2`,
        { headers: { Authorization: `${apiKey}` } }
      );
      setcndata((prev) => ({
        ...prev,
        inventory: res.data,
      }));
    } catch (err) {
      console.log("API ERROR:", err);

      if (err.response?.status === 401) {
        toast.error("Unauthorized! Your session has expired.");
      } else {
        toast.error(err.response?.data?.message || "Something went wrong!");
      }
    } finally {
      setLoading(false);
    }
  };

  
  const UseData = useMemo(() => {
  const data = cndata.inventory || [];

  const costCenters = [...new Set(data.map(item => item.CostCenterName))];
  setCostcenter(costCenters.sort());

  const filteredData = costCenters.map(cc => {
    // Materials in this cost center
    const materials = [...new Set(
      data.filter(item => item.CostCenterName === cc)
          .map(item => item.MaterialName)
    )];
    const UniqueMaterial = [...new Set(data.map((data)=>data.MaterialName))]
    // console.log(data.MaterialName);
    
    setitemName(UniqueMaterial.sort())

    const items = materials.map(mat => {
      // Items for this cost center + material
      const filteredItems = data.filter(item => item.CostCenterName === cc && item.MaterialName === mat);

      // Group by RequisitionNo
      const requisitions = [...new Set(filteredItems.map(item => item.RequisitionNo))].map(reqNo => {
        const reqData = filteredItems.filter(item => item.RequisitionNo === reqNo); // all data for this requisition
        const reqDate = filteredItems.find(item => item.RequisitionNo === reqNo); // all data for this requisition
        const reqQty = filteredItems.find(item => item.RequiredQTY === reqNo); // requistion qty
        
        return {
          RequisitionNo: reqNo,
          RequistionDate: reqDate.RequisitionDate,
          RequistionQty: reqDate.RequiredQTY,
          Data: reqData
        };
      });

      return {
        Material: mat,
        Requisitions: requisitions,
      };
    });

    return {
      CostCenter: cc,
      Item: items
    };
  });
  console.log(filteredData)
  return filteredData;
}, [cndata.inventory, setCostcenter,setitemName]);


  // console.log(FilterData);
  // const uniqueReq = [...new Set(FilterData.RequisitionNo)]
  // console.log(uniqueReq);
  // const ReqNO =  FilterData.map((data)=>data.Item.map(dd));
  // console.log(ReqNO);

  // const uniqueItem =[...new Set(FilterData.map(data=>data.Item))] || [];
  // const
  // console.log(uniqueItem);

  return (
    <>
      <form action="" onSubmit={(e) =>{ e.preventDefault(); InvIssue(e);}}>
        <div className="flex justify-center items-center gap-4">
          <DateRangePicker />
          <input type="submit" value="Submit" className="btn btn-success" />
        </div>
      </form>
      <>
        {loading ? (
          <div className="flex justify-center items-center h-screen">
            <FourSquare color="#32cd32" size="large" />
          </div>
        ) : (
          <>
      <div className="flex gap-5">
        { costCenter == '' ?  
        ""
      : 
      <>      <select defaultValue="Pick a text editor" className="select select-primary">
        <option disabled={false}>-- Select Section --</option>
        {
          costCenter && costCenter.map((data,idx)=>(
            <option key={idx}>{data}</option>
          ))
        }
      </select>
      <select defaultValue="Pick a text editor" className="select select-primary">
        <option disabled={false}>-- Select Item --</option>
        {
          itemName && itemName.map((data,idx)=>(
            <option key={idx}>{data}</option>
          ))
        }
      </select>
      </>
      }
      </div>
         <table className="table">
  <thead></thead>
  <tbody>
    {UseData &&
      UseData.map((dd, idx) => (
        <React.Fragment key={idx}>
          {/* CostCenter Header Row */}
          <tr className="text-2xl bg-blue-300 font-bold">
            <td colSpan="100%">{dd.CostCenter}</td>
          </tr>

          {/* Table Column Header */}
          <tr>
            <th>SL.</th>
            <th>Section</th>
            <th>Req No</th>
            <th>Req Date</th>
            <th>Req QTY</th>
            <th>Issue No.</th>
            <th>Issue Date</th>
          </tr>

          {/* Item Rows */}
          {dd.Item.map((item, idx2) => (
            <tr key={idx2}>
              <td>{idx2 + 1}</td>

              {/* Section / Material */}
              <td>{item.Material}</td>

              {/* Req No – show list using <div> */}
              <td>
                {item.Requisitions.map((r, i) => (
                  <div key={i}>{r.RequisitionNo}</div>
                ))}
              </td>

              {/* Req Date */}
              <td>
                
                {item.Requisitions.map((r, i) => (
               <div key={i}>{r.RequistionDate ? new Date(r.RequistionDate).toLocaleString(enGB).split(",", 1) : ""}  </div>
                ))}
              </td>

              {/* Req QTY */}
              <td>
                {item.Requisitions.map((r, i) => (
                  <div key={i}>
                    {r.Data?.reduce((sum, d) => sum + (d.RequiredQTY || 0), 0)}
                  </div>
                ))}
              </td>

              {/* Issue No */}
              <td>
                {item.Requisitions.map((r, i) => (
                  <div key={i}>{r.IssueNo}</div>
                ))}
              </td>

              {/* Issue Date */}
              <td>
                {item.Requisitions.map((r, i) => (
                  <div key={i}>
                    {r.IssueDate
                      ? new Date(r.IssueDate).toLocaleDateString()
                      : ""}
                  </div>
                ))}
              </td>
            </tr>
          ))}
          <tr>
           <td>Total</td>
           <td>{}</td>
          </tr>
        </React.Fragment>
      ))}
  </tbody>
</table>

          </>
        )}
      </>
    </>
  );
}

export default InventoryIssue;
