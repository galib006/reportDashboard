import React, { useContext, useEffect, useMemo, useState } from "react";
import { GetDataContext } from "../components/DataContext";
import { FourSquare } from "react-loading-indicators";
import OrderForm from "../OrderReport/OrderForm";
import * as XLSX from "xlsx";
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
      acc[item.WorkOrderNo].TotalValue += Number(item.TotalOrderValue);
      acc[item.WorkOrderNo].ChallanQTY += Number(item.ChallanQTY);
      acc[item.WorkOrderNo].ChallanValue += Number(item.ChallanValue);
      acc[item.WorkOrderNo].BalanceQty += Number(item.BalanceQTY);
      acc[item.WorkOrderNo].BalanceValue += Number(item.BalanceValue);

      if (item.ChallanNo) {
        acc[item.WorkOrderNo].ChallanNo.push(item.ChallanNo);
      }

      return acc;
    }, {});
    console.log("---------------------------------------------------",cndata);
    

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

  // Export to Excel
  const exportToExcel = () => {
    const excelData = filteredData.map((item) => ({
      ...item,
      ChallanNo: item.ChallanNo.map(
        (ch) => `${ch.challanNo} (${ch.status})`,
      ).join(", "),
    }));
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
    XLSX.writeFile(workbook, "OrderSummary.xlsx");
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
                <th className="border">Order Value</th>
                <th className="border">Challan Qty</th>
                <th className="border">Challan Value</th>
                <th className="border">Balance Qty</th>
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
