import React, { useContext, useEffect, useMemo, useState } from "react";
import TableRow from "../components/TableRow";
import { GetDataContext } from "../components/DataContext";
import { FourSquare } from "react-loading-indicators";
import OrderForm from "../OrderReport/OrderForm";
import * as XLSX from "xlsx";
import ReactPaginate from "react-paginate";
import { UNSAFE_useFogOFWarDiscovery } from "react-router";

function OrderSummary() {
  const { cndata, loading } = useContext(GetDataContext);
   const [apidata,setApidata] = useState([]);
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
  // console.log(apidata);
  // const UniqueWorkOrderNO = [...new Set(apidata.map((data)=>data.WorkOrderNo))];
  // console.log(UniqueWorkOrderNO);
const SummarizedData = useMemo(() => {
  if (!apidata?.length) return [];

  const grouped = apidata?.reduce((acc, item) => {

    acc[item.WorkOrderNo] ??= {
      WorkOrderNo: item.WorkOrderNo,
      DeliverName: item.FName,
      CustomerName: item.CName,
      Buyer: item.BuyerName,
      PINO: item.CustomerPINo,
      CustomerPO: item.CustomerPONo,
      Section: item.ProductCategoryName,
      TotalQty: 0,
      ChallanQTY: 0,
      BalanceQty: 0,
      ChallanNo: []
    };

    // qty sum
    acc[item.WorkOrderNo].TotalQty += Number(item.BreakDownQTY);
    acc[item.WorkOrderNo].ChallanQTY += Number(item.ChallanQTY);
    acc[item.WorkOrderNo].BalanceQty += Number(item.BalanceQTY);

    // challan collect
    acc[item.WorkOrderNo].ChallanNo.push(item.ChallanNo);

    return acc;
  }, {});

  // object → array + challan join
  return Object.values(grouped).map(item => ({
    ...item,
    ChallanNo: [...new Set(item.ChallanNo)].join(", ")
  }));

}, [apidata]);

  console.log(SummarizedData);
  
  
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
      <div className="overflow-x-auto">
          <table className="table table-lg">
            <thead>
            <tr>
              <th>Order No.</th>
              <th>Customer Name.</th>
              <th>Delivery</th>
              <th>PI NO.</th>
              <th>Section</th>
              <th>Order Qty</th>
              <th>Challan Qty</th>
              <th>Balance Qty</th>
              <th>Challan NO.</th>
            </tr>
            </thead>
            {loading ?
                    (<div className="flex justify-center items-center h-screen">
                      <FourSquare color="#32cd32" size="large" />
                    </div>) 
                   : (
                SummarizedData?.map((data)=>(
                  
                 <tr className="hover:bg-base-300">
                 <td>{data.WorkOrderNo}</td>
                 <td>{data.CustomerName}</td>
                 <td>{data.DeliverName}</td>
                 <td>{data.PINO}</td>
                 <td>{data.Section}</td>
                 <td>{data.TotalQty}</td>
                 <td>{data.ChallanQTY}</td>
                 <td>{data.BalanceQty}</td>                
                 <td>{data.ChallanNo}</td>
                 </tr>
              )
            )
              )}
          </table>
          </div>
          


    </>
  );
}

export default OrderSummary;
