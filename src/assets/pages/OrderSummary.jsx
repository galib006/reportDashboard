import React, { useContext, useEffect, useMemo, useState } from "react";
import { GetDataContext } from "../components/DataContext";
import { FourSquare } from "react-loading-indicators";
import OrderForm from "../OrderReport/OrderForm";
import * as XLSX from "xlsx";
import ReactPaginate from "react-paginate";

function OrderSummary() {
  const { cndata, loading } = useContext(GetDataContext);

  const [apidata, setApidata] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;

  // Load API data from context
  useEffect(() => {
    if (cndata.length > 0) {
      setApidata(cndata[0].apiData || []);
    }
  }, [cndata]);


  // Summarize & group data
  const summarizedData = useMemo(() => {
    if (!apidata?.length) return [];

    const grouped = apidata.reduce((acc, item) => {
      acc[item.WorkOrderNo] ??= {
        WorkOrderNo: item.WorkOrderNo,
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
      acc[item.WorkOrderNo].ChallanNo.push(item.ChallanNo);

      return acc;
    }, {});

    return Object.values(grouped).map((item) => ({
      ...item,
      ChallanNo: [...new Set(item.ChallanNo)].join(", "),
    }));
  }, [apidata]);
  console.log("API Data:", apidata);
  // Filtered data based on search
  const filteredData = useMemo(() => {
    if (!search) return summarizedData;
    return summarizedData.filter(
      (item) =>
        item.WorkOrderNo.toString().includes(search) ||
        item.CustomerName?.toLowerCase().includes(search.toLowerCase()) ||
        item.DeliverName?.toLowerCase().includes(search.toLowerCase()) ||
        item.PINO?.toLowerCase().includes(search.toLowerCase()) ||
        item.Section?.toLowerCase().includes(search.toLowerCase()) ||
        item.ChallanNo?.toLowerCase().includes(search.toLowerCase())
    );
  }, [summarizedData, search]);

  // Pagination
  const pageCount = Math.ceil(filteredData.length / itemsPerPage);
  const displayedData = filteredData.slice(
    currentPage * itemsPerPage,
    currentPage * itemsPerPage + itemsPerPage
  );

  const handlePageClick = (event) => {
    setCurrentPage(event.selected);
  };

  // Export to Excel
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
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
                <tr key={data.WorkOrderNo} className="hover:bg-base-300 text-center">
                  <td className="border">{data.WorkOrderNo}</td>
                  <td className="border">{data.CustomerName}</td>
                  <td className="border">{data.DeliverName}</td>
                  <td className="border">{data.PINO}</td>
                  <td className="border">{data.Section}</td>
                  <td className="border">{data.TotalQty}</td>
                  <td className="border border-black text-blue-500">$ {Math.ceil(data.TotalValue)}</td>
                  <td className="border">{data.ChallanQTY}</td>
                  <td className="border border-black text-green-500">$ {Math.ceil(data.ChallanValue)}</td>
                  <td className="border">{data.BalanceQty}</td>
                  <td className="border border-black text-red-500">$ {Math.ceil(data.BalanceValue)}</td>
                  <td className="border">{data.ChallanNo}</td>
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