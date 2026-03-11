import React, { useContext, useEffect, useMemo, useState } from "react";
import { GetDataContext } from "../components/DataContext";
import { FourSquare } from "react-loading-indicators";
import OrderForm from "../OrderReport/OrderForm";
// import * as XLSX from "xlsx";
import * as XLSX from "xlsx-js-style";
import ReactPaginate from "react-paginate";

function OrderSummary() {
  const { cndata, loading } = useContext(GetDataContext);
  const [apidata, setApidata] = useState([]);
  const [Challandata, setChallandata] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;

  // Load API data from context
  useEffect(() => {
    if (cndata.length > 0) {
      setApidata(cndata[0].apiData || []);
      setChallandata(cndata[0].grupChallan || []);
    }
  }, [cndata]);

  // Pre-map Challan data for fast lookup
  const challanMap = useMemo(() => {
    const map = new Map();
    Challandata.forEach((c) => {
      const key = `${c.workOrderNo}-${c.challanNo}`;
      map.set(key, c.statusDesc);
    });
    return map;
  }, [Challandata]);
  
const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB"); // DD/MM/YYYY
};
  // Summarize & group data
  const summarizedData = useMemo(() => {
    if (!apidata?.length) return [];

    const grouped = apidata.reduce((acc, item) => {
      acc[item.WorkOrderNo] ??= {
        WorkOrderNo: item.WorkOrderNo,
        OrderReceiveDate: item.OrderReceiveDate,
        DeliverName: item.FName,
        CustomerName: item.CName,
        Buyer: item.BuyerName,
        PINO: item.CustomerPINo,
        CustomerPO: item.CustomerPONo,
        Section: item.ProductCategoryName,
        TotalQty: 0,
        TotalValue: 0,
        ChallanQTY: 0,
        ChallanValue: 0,
        BalanceQty: 0,
        BalanceValue: 0,
        ChallanNo: [],
      };

      acc[item.WorkOrderNo].TotalQty += Number(item.BreakDownQTY);
      acc[item.WorkOrderNo].ChallanQTY += Number(item.ChallanQTY);
      acc[item.WorkOrderNo].BalanceQty += Number(item.BalanceQTY);
      acc[item.WorkOrderNo].TotalValue += Number(item.TotalOrderValue);
      acc[item.WorkOrderNo].ChallanValue += Number(item.ChallanValue);
      acc[item.WorkOrderNo].BalanceValue += Number(item.BalanceValue);

      if (item.ChallanNo) {
        acc[item.WorkOrderNo].ChallanNo.push(item.ChallanNo);
      }

      return acc;
    }, {});
    

    return Object.values(grouped).map((item) => {
      const uniqueChallan = [...new Set(item.ChallanNo)];

      const challanWithStatus = uniqueChallan.map((cn) => {
        const status = challanMap.get(`${item.WorkOrderNo}-${cn}`) || "";
        return { challanNo: cn, status };
      });

      return {
        ...item,
        ChallanNo: challanWithStatus,
      };
    });
  }, [apidata, challanMap]);

  // Filtered data based on search
  const filteredData = useMemo(() => {
    if (!search) return summarizedData;

    return summarizedData.filter((item) => {
      const challanMatch =
        item.ChallanNo &&
        item.ChallanNo.some((ch) =>
          ch.challanNo.toLowerCase().includes(search.toLowerCase()),
        );

      return (
        item.WorkOrderNo.toString().includes(search) ||
        item.CustomerName?.toLowerCase().includes(search.toLowerCase()) ||
        item.DeliverName?.toLowerCase().includes(search.toLowerCase()) ||
        item.PINO?.toLowerCase().includes(search.toLowerCase()) ||
        item.Section?.toLowerCase().includes(search.toLowerCase()) ||
        challanMatch
      );
    });
  }, [summarizedData, search]);

  // Pagination
  const pageCount = Math.ceil(filteredData.length / itemsPerPage);
  const displayedData = filteredData.slice(
    currentPage * itemsPerPage,
    currentPage * itemsPerPage + itemsPerPage,
  );

  const handlePageClick = (event) => {
    setCurrentPage(event.selected);
  };

  // Status color helper
  const getStatusColor = (status) => {
    if (status === "Challan Received") return "text-green-600 font-semibold";
    if (status === "Send to Gate") return "text-yellow-600 font-semibold";
    if (status === "Delivered") return "text-blue-600 font-semibold";
    if (status === "Gate Out") return "text-red-600 font-semibold";
    return "text-gray-600";
  };

  // export to excel
const exportToExcel = () => {

  const title = [["ORDER SUMMARY REPORT"]];
  const dateRow = [[`Generated: ${new Date().toLocaleDateString("en-GB")}`]];

  const headers = [[
    "Order No","Order Date","Customer","Delivery","PI No","Section",
    "Order Qty","Challan Qty","Balance Qty",
    "Order Value","Challan Value","Balance Value","Challan No"
  ]];

  const rows = filteredData.map((item)=>[
    item.WorkOrderNo,
    formatDate(item.OrderReceiveDate),
    item.CustomerName,
    item.DeliverName,
    item.PINO,
    item.Section,
    item.TotalQty,
    item.ChallanQTY,
    item.BalanceQty,
    item.TotalValue,
    item.ChallanValue,
    item.BalanceValue,
    item.ChallanNo.map(ch=>`${ch.challanNo} (${ch.status})`).join(", ")
  ]);

  const grandTotal = [
    "TOTAL","","","","","",
    rows.reduce((a,b)=>a+Number(b[6]),0),
    rows.reduce((a,b)=>a+Number(b[7]),0),
    rows.reduce((a,b)=>a+Number(b[8]),0),
    rows.reduce((a,b)=>a+Number(b[9]),0),
    rows.reduce((a,b)=>a+Number(b[10]),0),
    rows.reduce((a,b)=>a+Number(b[11]),0),
    ""
  ];

  const data = [...title,...dateRow,[],...headers,...rows,grandTotal];

  const ws = XLSX.utils.aoa_to_sheet(data);

  ws["!merges"] = [
    {s:{r:0,c:0},e:{r:0,c:12}},
    {s:{r:1,c:0},e:{r:1,c:12}}
  ];

  ws["!cols"] = [
    {wch:14},{wch:14},{wch:28},{wch:24},{wch:18},
    {wch:18},{wch:14},{wch:14},{wch:14},
    {wch:18},{wch:18},{},
  ];

  ws["A1"].s = {
    font:{bold:true,sz:22},
    alignment:{horizontal:"center",vertical:"center"}
  };

  ws["A2"].s = {
    font:{italic:true,sz:16},
    alignment:{horizontal:"center",vertical:"center"}
  };

  const headerRow = 3;

  for(let c=0;c<=12;c++){
    const cell = XLSX.utils.encode_cell({r:headerRow,c});

    ws[cell].s={
      font:{bold:true,sz:16,color:{rgb:"FFFFFF"}},
      fill:{fgColor:{rgb:"1F4E78"}},
      alignment:{horizontal:"center",vertical:"center"},
      border:{
        top:{style:"thin"},
        bottom:{style:"thin"},
        left:{style:"thin"},
        right:{style:"thin"}
      }
    };
  }

  const range = XLSX.utils.decode_range(ws["!ref"]);

  for(let r=4;r<=range.e.r;r++){
    for(let c=0;c<=range.e.c;c++){

      const cell = XLSX.utils.encode_cell({r,c});
      if(!ws[cell]) continue;

      ws[cell].s={
        font:{sz:16},
        alignment:{
          horizontal:"center",
          vertical:"center",
          wrapText:c===12
        },
        border:{
          top:{style:"thin"},
          bottom:{style:"thin"},
          left:{style:"thin"},
          right:{style:"thin"}
        }
      };

      if(c===9 || c===10 || c===11){

        ws[cell].s.numFmt='"$"#,##0';
        ws[cell].s.alignment.horizontal="right";

        if(c===9){
          ws[cell].s.font.color={rgb:"1F4E78"};
        }

        if(c===10){
          ws[cell].s.font.color={rgb:"008000"};
        }

        if(c===11){
          ws[cell].s.font.color={rgb:"C00000"};
        }

      }

    }
  }

  const totalRow = range.e.r;

  for(let c=0;c<=12;c++){
    const cell = XLSX.utils.encode_cell({r:totalRow,c});

    if(ws[cell]){
      ws[cell].s={
        font:{bold:true,sz:16},
        fill:{fgColor:{rgb:"D9E1F2"}},
        alignment:{horizontal:"center",vertical:"center"},
        border:{
          top:{style:"medium"},
          bottom:{style:"medium"},
          left:{style:"thin"},
          right:{style:"thin"}
        }
      };

      if(c===9 || c===10 || c===11){
        ws[cell].s.numFmt='"$"#,##0';
      }
    }
  }

  ws["!freeze"]={xSplit:0,ySplit:4};
  ws["!autofilter"]={ref:"A4:M4"};

  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,"Order Summary");

  XLSX.writeFile(wb,"OrderSummaryReport.xlsx");

};
  return (
    <>
      <OrderForm />

      {/* Search and Export */}
      <div className="flex justify-between my-5 px-9">
        <input
          type="text"
          className="input"
          placeholder="Search Here..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(0);
          }}
        />
        <button
          onClick={exportToExcel}
          className="btn btn-success px-4 py-2 text-white font-semibold rounded"
        >
          Export Excel
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <FourSquare color="#32cd32" size="large" />
          </div>
        ) : (
          <table className="table table-lg w-full">
            <thead>
              <tr className="bg-blue-400 text-center">
                <th className="border">Order No.</th>
                <th className="border">Order Date</th>
                <th className="border">Customer Name</th>
                <th className="border">Delivery</th>
                <th className="border">PI NO.</th>
                <th className="border">Section</th>
                <th className="border">Order Qty</th>
                <th className="border">Challan Qty</th>
                <th className="border">Balance Qty</th>
                <th className="border">Order Value</th>
                <th className="border">Challan Value</th>
                <th className="border">Balance Value</th>
                <th className="border">Challan NO.</th>
              </tr>
            </thead>
            <tbody>
              {displayedData.map((data) => (
                <tr
                  key={data.WorkOrderNo}
                  className="hover:bg-base-300 text-center"
                >
                  <td className="border">{data.WorkOrderNo}</td>
                  <td className="border">{formatDate(data.OrderReceiveDate)}</td>
                  <td className="border">{data.CustomerName}</td>
                  <td className="border">{data.DeliverName}</td>
                  <td className="border">{data.PINO}</td>
                  <td className="border">{data.Section}</td>
                  <td className="border">{data.TotalQty}</td>
                  <td className="border border-black text-blue-500">
                    $ {Math.ceil(data.TotalValue)}
                  </td>
                  <td className="border">{data.ChallanQTY}</td>
                  <td className="border border-black text-green-500">
                    $ {Math.ceil(data.ChallanValue)}
                  </td>
                  <td className="border">{data.BalanceQty}</td>
                  <td className="border border-black text-red-500">
                    $ {Math.ceil(data.BalanceValue)}
                  </td>
                  <td className="border">
                    {data.ChallanNo && data.ChallanNo.length > 0 ? (
                      data.ChallanNo.map((ch, i) => (
                        <div key={i} className={getStatusColor(ch.status)}>
                          {i + 1}. {ch.challanNo}{" "  } 
                          {ch.status && `(${ch.status})`}
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-400 font-semibold">
                        No Challan
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-5">
        <ReactPaginate
          breakLabel="..."
          nextLabel="Next >"
          onPageChange={handlePageClick}
          pageRangeDisplayed={5}
          pageCount={pageCount}
          previousLabel="< Prev"
          containerClassName="pagination flex gap-2"
          pageClassName="page-item"
          pageLinkClassName="page-link px-3 py-1 border rounded"
          previousClassName="page-item"
          previousLinkClassName="page-link px-3 py-1 border rounded"
          nextClassName="page-item"
          nextLinkClassName="page-link px-3 py-1 border rounded"
          activeLinkClassName="bg-blue-500 text-white"
        />
      </div>
    </>
  );
}

export default OrderSummary;
