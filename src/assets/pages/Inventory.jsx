// Inventory.jsx
import React, { useContext, useEffect, useMemo, useState } from "react";
import { GetDataContext } from "../components/DataContext";
import DateRangePicker from "../components/DatePickerData";
import axios from "axios";
import { toast } from "react-toastify";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import _ from "lodash";
import { FourSquare } from "react-loading-indicators";
import { HashLoader } from "react-spinners";

function Inventory() {
  const { cndata, setcndata, setLoading } = useContext(GetDataContext);
  const apiKey = localStorage.getItem("apiKey");

  const [receives, setReceives] = useState([]);
  const [issues, setIssues] = useState([]);
  const [inventoryStatement, setInventoryStatement] = useState([]);
  const [materialInfo, setMaterialInfo] = useState([]);

  const [filters, setFilters] = useState({
    company: "all",
    category: "all",
    subcategory: "all",
    material: "all",
    search: "",
    negativeGap: false,
    startDate: null,
    endDate: null,
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState({ key: "itemName", dir: "asc" });

  const [companies, setCompanies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [materialsList, setMaterialsList] = useState([]);
  const [openRows, setOpenRows] = useState({});
  const [loading, setLocalLoading] = useState(false);

const fmtDate = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt)) return d;

  const day = String(dt.getDate()).padStart(2, "0");
  const month = String(dt.getMonth() + 1).padStart(2, "0"); // months are 0-based
  const year = dt.getFullYear();

  return `${day}-${month}-${year}`;
};


  const dateSubmit = async (e) => {
    e?.preventDefault?.();
    if (!cndata?.startDate || !cndata?.endDate) {
      toast.error("Please select start & end date!");
      return;
    }
    setLocalLoading(true);
    setPage(1);

    const stDate = cndata.startDate.toISOString().split("T")[0];
    const edDate = cndata.endDate.toISOString().split("T")[0];

    try {
      const [resR, resI, resS] = await axios.all([
        axios.get(
          `https://tpl-api.ebs365.info/api/InventoryBI/SCM_GetMaterialReceiveDetail?CompanyID=1&ParentCategoryID=6&CategoryID=0&SubCategoryID=0&MainMaterialID=0&StartDate=${stDate}&EndDate=${edDate}&CommandID=0`,
          { headers: { Authorization: `${apiKey}` } }
        ),
        axios.get(
          `https://tpl-api.ebs365.info/api/InventoryBI/SCM_GET_MaterialIssueDetail?CompanyID=1&ParentCategoryID=6&CategoryID=0&SubCategoryID=0&MainMaterialID=0&StartDate=${stDate}&EndDate=${edDate}&CommandID=2`,
          { headers: { Authorization: `${apiKey}` } }
        ),
        axios.get(
          `https://tpl-api.ebs365.info/api/InventoryBI/BI_SCM_GETInventoryStatement?CompanyID=1&ParentCategoryID=6&CategoryID=0&SubCategoryID=0&MaterialID=0&StartDate=${stDate}&EndDate=${edDate}&CommandID=2&EmpID=0`,
          { headers: { Authorization: `${apiKey}` } }
        ),
      ]);

      const r1 = resR.data || [];
      const r2 = resI.data || [];
      const r3 = resS.data || [];

      setReceives(r1);
      setIssues(r2);
      setInventoryStatement(r3);

      setCompanies(_.uniq(r1.concat(r2).map((x) => x.CompanyName).filter(Boolean)));
      setCategories(_.uniq(r1.concat(r2).map((x) => x.CategoryName).filter(Boolean)));
      setSubCategories(_.uniq(r1.concat(r2).map((x) => x.SubCategoryName).filter(Boolean)));
      setMaterialsList(_.uniq(r3.map((x) => x.MaterialName).filter(Boolean)));

      // build materialInfo with detailed timeline and running balance
      const mtl = r3.map((it) => {
        const recs = r1.filter((d) => d.MaterialName === it.MaterialName)
          .sort((a,b) => new Date(a.GRNDate) - new Date(b.GRNDate));
        const iss = r2.filter((d) => d.MaterialName === it.MaterialName)
          .sort((a,b) => new Date(a.IssueDate) - new Date(b.IssueDate));

        let runningBalance = 0;
        const timeline = [];

        // Merge receive & issue by date order
        const events = [...recs.map(r=>({...r,type:"Receive"})), ...iss.map(q=>({...q,type:"Issue"}))]
          .sort((a,b)=>new Date(a.GRNDate || a.IssueDate) - new Date(b.GRNDate || b.IssueDate));

        events.forEach(ev=>{
          if(ev.type==="Receive") runningBalance += Number(ev.ActualReceiveQTY || 0);
          else runningBalance -= Number(ev.IssueQTY || 0);
          timeline.push({
            ...ev,
            runningBalance,
          });
        });

        const totalRcv = recs.reduce((acc,c)=>acc+Number(c.ActualReceiveQTY||0),0);
        const totalIss = iss.reduce((acc,c)=>acc+Number(c.IssueQTY||0),0);

        return {
          itemName: it.MaterialName,
          Balance: it.BalanceQTY,
          totalReceive: totalRcv,
          totalIssue: totalIss,
          timeline,
        };
      });

      setMaterialInfo(mtl);
      setFilters((f) => ({ ...f, startDate: cndata.startDate, endDate: cndata.endDate }));
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Something went wrong!");
    } finally {
      setLocalLoading(false);
    }
  };

  // Derived filtered & sorted list
  const processedList = useMemo(()=>{
    let list = materialInfo.slice();

    if(filters.company!=="all") list=list.filter(it=>it.timeline.some(x=>x.CompanyName===filters.company));
    if(filters.category!=="all") list=list.filter(it=>it.timeline.some(x=>x.CategoryName===filters.category));
    if(filters.subcategory!=="all") list=list.filter(it=>it.timeline.some(x=>x.SubCategoryName===filters.subcategory));
    if(filters.material!=="all") list=list.filter(it=>it.itemName===filters.material);
    if(filters.search.trim()!=="") list=list.filter(it=>it.itemName.toLowerCase().includes(filters.search.toLowerCase()));
    if(filters.negativeGap) list=list.filter(it=>it.totalReceive - it.totalIssue < 0);

    list = _.orderBy(list,[sortBy.key],[sortBy.dir]);

    return list;
  },[materialInfo,filters,sortBy]);

  const totalPages = Math.max(1, Math.ceil(processedList.length/pageSize));
  const pagedList = filters.pageOff ? processedList : processedList.slice((page-1)*pageSize,page*pageSize);

  const toggleRow = (name)=>setOpenRows(s=>({...s,[name]:!s[name]}));
  const toggleSort = (key)=>setSortBy(s=>s.key===key?{key,dir:s.dir==="asc"?"desc":"asc"}:{key,dir:"asc"});

  const exportExcel = ()=>{
    const rows=[];
    processedList.forEach(it=>{
      rows.push({
        Type:"Summary",
        Item: it.itemName,
        Balance: it.Balance,
        TotalReceive: it.totalReceive,
        TotalIssue: it.totalIssue,
        RunningBalance:'',
        Gap: it.totalReceive - it.totalIssue,
      });
      it.timeline.forEach(ev=>{
        rows.push({
          Type: ev.type,
          Item: it.itemName,
          // <td>{ev.type==="Issue"?:""}</td>
          //       <td>{ev.runningBalance}</td>
          //       <td>{ev.IssueNo}</td>
          //       <td>{ev.RequisitionNo}</td>
          TotalReceive: ev.ActualReceiveQTY,
          // Qty: ev.type==="Receive"?ev.ActualReceiveQTY:ev.IssueQTY,
          TotalIssue: ev.IssueQTY,
          RunningBalance: Number(ev.runningBalance).toFixed(2),
          Date: fmtDate(ev.GRNDate||ev.IssueDate),
          DocNo: ev.GRNNo || ev.IssueNo || ev.RequisitionNo || ev.OrderNo,
          RequistionNo : ev.RequisitionNo,
          IssueNo: ev.IssueNo,
          Remarks: ev.VendorName || ev.IssuedBy || ev.ChallanNo || ev.JobCardNo || "",
        });
      });
    });
    const ws=XLSX.utils.json_to_sheet(rows);
    const wb=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,ws,"Inventory");
    const buf=XLSX.write(wb,{bookType:"xlsx",type:"array"});
    saveAs(new Blob([buf],{type:"application/octet-stream"}),`inventory_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const resetFilters = ()=>{
    setFilters(f=>({...f, company:"all", category:"all", subcategory:"all", material:"all", search:"", negativeGap:false}));
  };

  console.log(pagedList);
  
  return (
    <div className="p-4">
      {/* Loading */}
      {loading  ? <div className="text-center font-bold py-2">Loading...</div>:""}

      {/* Controls */}
      <form onSubmit={dateSubmit} className="flex flex-wrap gap-3 items-end mb-4">
        <div><label>Date Range</label><DateRangePicker /></div>
        <div>
          <label>Company</label>
          <select value={filters.company} onChange={e=>setFilters(f=>({...f,company:e.target.value}))}>
            <option value="all">All</option>
            {companies.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label>Category</label>
          <select value={filters.category} onChange={e=>setFilters(f=>({...f,category:e.target.value}))}>
            <option value="all">All</option>
            {categories.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label>Subcategory</label>
          <select value={filters.subcategory} onChange={e=>setFilters(f=>({...f,subcategory:e.target.value}))}>
            <option value="all">All</option>
            {subCategories.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label>Material</label>
          <select value={filters.material} onChange={e=>setFilters(f=>({...f,material:e.target.value}))}>
            <option value="all">All</option>
            {materialsList.map(m=><option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label>Search</label>
          <input value={filters.search} onChange={e=>setFilters(f=>({...f,search:e.target.value}))} placeholder="Material..." />
        </div>
        <div className="flex items-center gap-2">
          <label><input type="checkbox" checked={filters.negativeGap} onChange={e=>setFilters(f=>({...f,negativeGap:e.target.checked}))}/> Negative Gap</label>
          <button type="submit" className="btn btn-info">Apply Date</button>
          <button type="button" className="btn" onClick={resetFilters}>Reset</button>
          <button type="button" className="btn btn-success" onClick={exportExcel}>Export Excel</button>
        </div>
        <div className="flex items-center gap-2">
          <label><input type="checkbox" checked={filters.pageOff} onChange={e=>setFilters(f=>({...f,pageOff:e.target.checked}))}/> Show All (No Pagination)</label>
        </div>
      </form>
    {loading ? (
        <div className="flex justify-center items-center h-screen">
          <HashLoader color="#51a340"/>
          {/* <FourSquareuare color="#32cd32" size="large" /> */}
        </div>
      ) : 
      (
      <div className="overflow-x-auto">
        <table className="table w-full table-zebra border">
          <thead>
            <tr>
              <th>SL</th>
              <th onClick={()=>toggleSort("itemName")}>Item {sortBy.key==="itemName"?sortBy.dir==="asc"?"▲":"▼":""}</th>
              <th>Total Receive</th>
              <th>Total Issue</th>
              <th>Balance</th>
              <th>Gap</th>
              <th>Timeline</th>
            </tr>
          </thead>
          <tbody>
            {pagedList.length===0 && <tr><td colSpan="7" className="text-center">No data found.</td></tr>}
            {pagedList.map((it,idx)=>{
              const gap = it.totalReceive - it.totalIssue;
              return (
                <React.Fragment key={it.itemName}>
                  <tr>
                    <td>{idx+1}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button className="btn btn-ghost btn-xs" onClick={()=>toggleRow(it.itemName)}>{openRows[it.itemName]?"-":"+"}</button>
                        {it.itemName}
                      </div>
                    </td>
                    <td>{it.totalReceive}</td>
                    <td>{Number(it.totalIssue).toFixed(2)}</td>
                    <td>{it.Balance}</td>
                    <td className={gap<0?"text-red-600 font-bold":""}>{Number(gap).toFixed(2)}</td>
                    <td>{it.timeline.length} events</td>
                  </tr>
                  {openRows[it.itemName] && (
  <tr className="bg-base-10">
    <td colSpan="7" className="p-2">
      <div className="overflow-x-auto max-h-80">
        <table className="table table-compact w-full">
          <thead>
            <tr>
              <th>SL</th>
              <th>Date</th>
              <th>DocNo</th>
              <th>Receive</th>
              <th>Issue</th>
              <th>Running Balance</th>
              <th>Issue No</th>
              <th>Req No</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {it.timeline.map((ev,i)=>(
              <tr key={i} className={ev.runningBalance < 0 ? "text-red-800" : ""}>
                <td>{i+1}</td>
                <td>{fmtDate(ev.GRNDate||ev.IssueDate)}</td>
                <td>{ev.GRNNo||ev.IssueNo||ev.RequisitionNo||ev.OrderNo}</td>
                <td>{ev.type==="Receive"?ev.ActualReceiveQTY:""}</td>
                <td>{ev.type==="Issue"?ev.IssueQTY:""}</td>
                <td>{ev.runningBalance}</td>
                <td>{ev.IssueNo}</td>
                <td>{ev.RequisitionNo}</td>
                <td>{ev.VendorName||ev.IssuedBy||ev.ChallanNo||ev.JobCardNo||""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </td>
  </tr>
)}


                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      )}
      {!filters.pageOff && (
        <div className="flex items-center justify-between mt-2">
          <div className="flex gap-2">
            <button className="btn btn-sm" onClick={()=>setPage(1)} disabled={page===1}>« First</button>
            <button className="btn btn-sm" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}>‹ Prev</button>
            <button className="btn btn-sm" onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}>Next ›</button>
            <button className="btn btn-sm" onClick={()=>setPage(totalPages)} disabled={page===totalPages}>Last »</button>
          </div>
          <div>
            <input type="number" value={page} min={1} max={totalPages} onChange={e=>setPage(Math.min(Math.max(1,Number(e.target.value)||1),totalPages))}/>
          </div>
        </div>
      )}
    </div>
  );

}

export default Inventory;
