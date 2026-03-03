import React, { useContext, useEffect, useState } from "react";
import TableRow from "../components/TableRow";
import { GetDataContext } from "../components/DataContext";
import { FourSquare } from "react-loading-indicators";
import OrderForm from "../OrderReport/OrderForm";
import * as XLSX from "xlsx";
import ReactPaginate from "react-paginate";
import { UNSAFE_useFogOFWarDiscovery } from "react-router";

function OrderSummary() {
  const { cndata, loading } = useContext(GetDataContext);
   const [apidata,setApidata] = useState();
  const [search, setSearch] = useState("");
  const [itemOffset, setItemOffset] = useState(1);
  const itemsPerPage = 10;
  // setApidata(cndata[0].apiData);
  // console.log(cndata[0].groupedData);
  useEffect(()=>{
    if(cndata.length > 0){
      setApidata(cndata[0].apiData);
    }
  },[cndata]);
  console.log(apidata);
   const uniqueOrderNO = [...new Set(apidata.WorkOrderNo)]
                    console.log(uniqueOrderNO);
  
  return (
    <>
      <OrderForm />

      {/* Search Box */}
      <div className="flex justify-between my-5 px-9">
        <input
          type="text"
          className="input"
          placeholder="Search Here..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setItemOffset(0); // search দিলে pagination reset হবে
          }}
        />
        <button
    onClick={() => exportToExcel(filteredData)}
    className="btn btn-success px-4 py-2 text-white font-semibold rounded"
  >
    Export Excel
  </button>
      </div>
          <table className="table">
            <thead>
            <tr>
              <th>Order No.</th>
              <th>Customer Name.</th>
              <th>Challan NO.</th>
            </tr>
            </thead>
            {loading ?
                    (<div className="flex justify-center items-center h-screen">
                      <FourSquare color="#32cd32" size="large" />
                    </div>) 
                   : (
                apidata?.map((data)=>(
                 <tr className="hover:bg-base-300">
                 <td>{data.WorkOrderNo}</td>
                 <td>{data.CName}</td>
                 <td>{data.ChallanNo}</td>
                 </tr>
              )
            )
              )}
          </table>
          


    </>
  );
}

export default OrderSummary;
