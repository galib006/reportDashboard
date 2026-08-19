import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { GetDataContext } from "../components/DataContext";
import { FourSquare } from "react-loading-indicators";
import OrderForm from "../OrderReport/OrderForm";
import * as XLSX from "xlsx-js-style";
import ReactPaginate from "react-paginate";

// Custom hook for outside click detection
const useOutsideClick = (ref, setState) => {
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setState(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ref, setState]);
};

// Date formatter utility
const formatDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-GB");
};

// Main Order Summary Component
function OrderSummary() {
  // const { cndata, loading } = useContext(GetDataContext);
  const { cndata, loading, apiKey } = useContext(GetDataContext);

  // State management
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedPI, setSelectedPI] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState([]);
  const [piSearch, setPiSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [piOpen, setPiOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const [viewMode, setViewMode] = useState("summary"); // "summary" or "detail"

  const piRef = useRef(null);
  const orderRef = useRef(null);
  const itemsPerPage = 50;

  // Outside click handlers
  useOutsideClick(piRef, setPiOpen);
  useOutsideClick(orderRef, setOrderOpen);

  // Data processing with memoization
  const processedData = useMemo(() => {
    // Debug: Log what we're receiving
    console.log("cndata received:", cndata);
    
    // Check if cndata exists and has data
    if (!cndata || cndata.length === 0) {
      console.log("No cndata available");
      return [];
    }

    // Try to get data from different possible locations
    const firstItem = cndata[0] || {};
    const apidata = firstItem.apiData || [];
    const challandata = firstItem.grupChallan || [];
    const groupedData = firstItem.groupedData || [];

    console.log("apiData:", apidata);
    console.log("groupedData:", groupedData);

    // If both are empty, try to use cndata directly
    if (apidata.length === 0 && groupedData.length === 0) {
      // Try to use cndata as is
      if (Array.isArray(cndata)) {
        // Check if cndata has the expected structure
        const possibleData = cndata.find(item => 
          item.apiData || item.groupedData || item.WorkOrderNo
        );
        
        if (possibleData) {
          // Use the found data
          if (possibleData.apiData) {
            return processSummaryData(possibleData.apiData, possibleData.grupChallan || []);
          } else if (possibleData.groupedData) {
            return processDetailData(possibleData.groupedData);
          } else if (possibleData.WorkOrderNo) {
            // If it's already the data we need
            return processSummaryData(cndata, []);
          }
        }
      }
      return [];
    }

    // Process based on view mode
    if (viewMode === "summary" && apidata.length > 0) {
      return processSummaryData(apidata, challandata);
    } else if (viewMode === "detail" && groupedData.length > 0) {
      return processDetailData(groupedData);
    }

    // Fallback: try to use whichever has data
    if (apidata.length > 0) {
      return processSummaryData(apidata, challandata);
    } else if (groupedData.length > 0) {
      return processDetailData(groupedData);
    }

    return [];
  }, [cndata, viewMode]);

  // Helper function to process summary data
  const processSummaryData = (apidata, challandata) => {
    const challanMap = new Map();
    challandata.forEach((c) => {
      challanMap.set(`${c.workOrderNo}-${c.challanNo}`, c.statusDesc);
    });

    const grouped = {};
    apidata.forEach((item) => {
      const key = item.WorkOrderNo;
      if (!grouped[key]) {
        grouped[key] = {
          WorkOrderNo: key,
          OrderReceiveDate: item.OrderReceiveDate,
          DeliverName: item.FName || item.DeliverName,
          CustomerName: item.CName || item.CustomerName,
          PINO: item.CustomerPINo || item.PINO,
          Section: item.ProductCategoryName || item.Section,
          Buyer: item.BuyerName || item.Buyer,
          TotalQty: 0,
          TotalValue: 0,
          ChallanQTY: 0,
          ChallanValue: 0,
          BalanceQty: 0,
          BalanceValue: 0,
          ChallanNo: new Set(),
        };
      }

      const row = grouped[key];
      row.TotalQty += Number(item.BreakDownQTY || item.TotalQty || 0);
      row.ChallanQTY += Number(item.ChallanQTY || 0);
      row.BalanceQty += Number(item.BalanceQTY || 0);
      row.TotalValue += Number(item.TotalOrderValue || item.TotalValue || 0);
      row.ChallanValue += Number(item.ChallanValue || 0);
      row.BalanceValue += Number(item.BalanceValue || 0);

      if (item.ChallanNo) {
        item.ChallanNo.split(",")
          .map((c) => c.trim())
          .filter(Boolean)
          .forEach((cn) => row.ChallanNo.add(cn));
      }
    });

    return Object.values(grouped).map((item) => ({
      ...item,
      ChallanNo: Array.from(item.ChallanNo).map((cn) => ({
        challanNo: cn,
        status: challanMap.get(`${item.WorkOrderNo}-${cn}`) || "",
      })),
    }));
  };

  // Helper function to process detail data
  const processDetailData = (groupedData) => {
    return groupedData.map((item) => ({
      ...item,
      deliveryPercent: item.BreakDownQTY 
        ? ((item.challanqty / item.BreakDownQTY) * 100).toFixed(0)
        : 0
    }));
  };

  // Filter options - only if data exists
  const uniquePI = useMemo(() => {
    if (!processedData || processedData.length === 0) return [];
    return [...new Set(processedData.map((d) => d.PINO).filter(Boolean))];
  }, [processedData]);

  const uniqueOrder = useMemo(() => {
    if (!processedData || processedData.length === 0) return [];
    return [...new Set(processedData.map((d) => d.WorkOrderNo))];
  }, [processedData]);

  // Filtered lists
  const filteredPI = uniquePI.filter((pi) =>
    pi.toLowerCase().includes(piSearch.toLowerCase())
  );

  const filteredOrder = uniqueOrder.filter((order) =>
    order.toString().includes(orderSearch)
  );

  // Toggle functions
  const togglePI = (pi) => {
    setSelectedPI((prev) =>
      prev.includes(pi) ? prev.filter((p) => p !== pi) : [...prev, pi]
    );
  };

  const toggleOrder = (order) => {
    setSelectedOrder((prev) =>
      prev.includes(order) ? prev.filter((o) => o !== order) : [...prev, order]
    );
  };

  // Filter data based on selections
  const filteredData = useMemo(() => {
    if (!processedData || processedData.length === 0) return [];
    
    return processedData
      .filter((item) => {
        const searchMatch = !search ||
          (item.WorkOrderNo && item.WorkOrderNo.toString().includes(search)) ||
          (item.CustomerName && item.CustomerName.toLowerCase().includes(search.toLowerCase())) ||
          (item.DeliverName && item.DeliverName.toLowerCase().includes(search.toLowerCase())) ||
          (item.PINO && item.PINO.toLowerCase().includes(search.toLowerCase())) ||
          (item.Buyer && item.Buyer.toLowerCase().includes(search.toLowerCase()));

        const piMatch = selectedPI.length === 0 || (item.PINO && selectedPI.includes(item.PINO));
        const orderMatch = selectedOrder.length === 0 || (item.WorkOrderNo && selectedOrder.includes(item.WorkOrderNo));

        return searchMatch && piMatch && orderMatch;
      })
      .sort((a, b) => {
        if (!a.WorkOrderNo || !b.WorkOrderNo) return 0;
        const getParts = (val) => {
          if (!val) return { num: 0, year: 0 };
          const parts = val.split("-");
          return { num: Number(parts[1]) || 0, year: Number(parts[2]) || 0 };
        };
        const A = getParts(a.WorkOrderNo);
        const B = getParts(b.WorkOrderNo);
        if (B.year !== A.year) return B.year - A.year;
        return B.num - A.num;
      });
  }, [processedData, search, selectedPI, selectedOrder]);

  // Grand totals
  const grandTotal = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return { TotalQty: 0, ChallanQTY: 0, BalanceQty: 0, TotalValue: 0, ChallanValue: 0, BalanceValue: 0 };
    }

    return filteredData.reduce((acc, item) => {
      if (viewMode === "summary") {
        acc.TotalQty += Number(item.TotalQty || 0);
        acc.ChallanQTY += Number(item.ChallanQTY || 0);
        acc.BalanceQty += Number(item.BalanceQty || 0);
        acc.TotalValue += Number(item.TotalValue || 0);
        acc.ChallanValue += Number(item.ChallanValue || 0);
        acc.BalanceValue += Number(item.BalanceValue || 0);
      } else {
        acc.TotalQty += Number(item.BreakDownQTY || 0);
        acc.ChallanQTY += Number(item.challanqty || 0);
        acc.BalanceQty = acc.TotalQty - acc.ChallanQTY;
        acc.TotalValue = acc.TotalQty;
        acc.ChallanValue = acc.ChallanQTY;
        acc.BalanceValue = acc.BalanceQty;
      }
      return acc;
    }, { TotalQty: 0, ChallanQTY: 0, BalanceQty: 0, TotalValue: 0, ChallanValue: 0, BalanceValue: 0 });
  }, [filteredData, viewMode]);

  // Pagination
  const pageCount = Math.ceil((filteredData?.length || 0) / itemsPerPage);
  const displayedData = (filteredData || []).slice(
    currentPage * itemsPerPage,
    currentPage * itemsPerPage + itemsPerPage
  );

  const totalData = useMemo(() => {
    if (!displayedData || displayedData.length === 0) {
      return { TotalQty: 0, ChallanQTY: 0, BalanceQty: 0, TotalValue: 0, ChallanValue: 0, BalanceValue: 0 };
    }

    return displayedData.reduce((acc, item) => {
      if (viewMode === "summary") {
        acc.TotalQty += Number(item.TotalQty || 0);
        acc.ChallanQTY += Number(item.ChallanQTY || 0);
        acc.BalanceQty += Number(item.BalanceQty || 0);
        acc.TotalValue += Number(item.TotalValue || 0);
        acc.ChallanValue += Number(item.ChallanValue || 0);
        acc.BalanceValue += Number(item.BalanceValue || 0);
      } else {
        acc.TotalQty += Number(item.BreakDownQTY || 0);
        acc.ChallanQTY += Number(item.challanqty || 0);
        acc.BalanceQty = acc.TotalQty - acc.ChallanQTY;
      }
      return acc;
    }, { TotalQty: 0, ChallanQTY: 0, BalanceQty: 0, TotalValue: 0, ChallanValue: 0, BalanceValue: 0 });
  }, [displayedData, viewMode]);

  // Status color helper
  const getStatusColor = (status) => {
    const statusMap = {
      "Challan Received": "text-green-600 font-semibold",
      "Send to Gate": "text-yellow-600 font-semibold",
      "Delivered": "text-blue-600 font-semibold",
      "Gate Out": "text-red-600 font-semibold"
    };
    return statusMap[status] || "text-gray-500";
  };

  // Excel export with styling
  const exportToExcel = () => {
    const dataToExport = filteredData;
    
    if (!dataToExport || dataToExport.length === 0) {
      alert("No data to export!");
      return;
    }
    
    if (viewMode === "summary") {
      // Summary view export
      const groupedByPI = {};
      dataToExport.forEach((item) => {
        const key = item.PINO || "No PI";
        if (!groupedByPI[key]) groupedByPI[key] = [];
        groupedByPI[key].push(item);
      });

      let data = [];
      for (const [pi, items] of Object.entries(groupedByPI)) {
        data.push([`PI: ${pi}`], []);
        data.push([
          "Order No", "Order Date", "Customer", "Delivery", "PI No", "Section",
          "Order Qty", "Challan Qty", "Balance Qty", "Order Value", 
          "Challan Value", "Balance Value", "Challan No"
        ]);
        
        items.forEach((item) => {
          data.push([
            item.WorkOrderNo || "",
            formatDate(item.OrderReceiveDate),
            item.CustomerName || "",
            item.DeliverName || "",
            item.PINO || "",
            item.Section || "",
            item.TotalQty || 0,
            item.ChallanQTY || 0,
            item.BalanceQty || 0,
            item.TotalValue || 0,
            item.ChallanValue || 0,
            item.BalanceValue || 0,
            (item.ChallanNo || []).map(ch => `${ch.challanNo} (${ch.status})`).join(", ")
          ]);
        });

        data.push([
          "Subtotal", "", "", "", "", "",
          items.reduce((a, b) => a + Number(b.TotalQty || 0), 0),
          items.reduce((a, b) => a + Number(b.ChallanQTY || 0), 0),
          items.reduce((a, b) => a + Number(b.BalanceQty || 0), 0),
          items.reduce((a, b) => a + Number(b.TotalValue || 0), 0),
          items.reduce((a, b) => a + Number(b.ChallanValue || 0), 0),
          items.reduce((a, b) => a + Number(b.BalanceValue || 0), 0),
          ""
        ]);
        data.push([]);
      }

      const ws = XLSX.utils.aoa_to_sheet(data);
      
      // Apply simple styling
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Order Summary");
      XLSX.writeFile(wb, "OrderSummaryReport.xlsx");
    } else {
      // Detail view export
      const exportData = dataToExport.map((item, index) => ({
        SL: index + 1,
        "Order No": item.WorkOrderNo || "",
        "Order Date": formatDate(item.OrderReceiveDate),
        Customer: item.CustomerName || "",
        Category: item.Category || item.Section || "",
        "PI No": item.PINO || "",
        "Order Qty": item.BreakDownQTY || item.TotalQty || 0,
        "Delivery Qty": item.challanqty || item.ChallanQTY || 0,
        "Delivery Complete": item.deliveryPercent ? `${item.deliveryPercent}%` : 
          (item.TotalQty ? ((item.ChallanQTY / item.TotalQty) * 100).toFixed(0) + "%" : "0%")
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Order Detail");
      XLSX.writeFile(wb, "OrderDetailReport.xlsx");
    }
  };

  // Render filter dropdown
  const renderFilterDropdown = (
    ref, 
    isOpen, 
    setIsOpen, 
    selectedItems, 
    setSelectedItems, 
    allItems, 
    searchValue, 
    setSearchValue, 
    filteredItems, 
    toggleItem,
    label
  ) => (
    <div className="relative" ref={ref}>
      <button
        className="btn btn-outline w-32"
        onClick={() => setIsOpen(!isOpen)}
      >
        {label} {selectedItems.length ? `(${selectedItems.length})` : ""}
      </button>
      {isOpen && (
        <div className="absolute bg-base-100 shadow p-3 rounded w-64 max-h-60 overflow-y-auto z-50 mt-2">
          <div className="flex justify-between mb-2">
            <button
              className="text-blue-600 text-sm hover:underline"
              onClick={() => setSelectedItems(allItems)}
            >
              Select All
            </button>
            <button
              className="text-red-600 text-sm hover:underline"
              onClick={() => setSelectedItems([])}
            >
              Uncheck All
            </button>
          </div>
          <input
            type="text"
            placeholder={`Search ${label}`}
            className="input input-sm w-full mb-2"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <label key={item} className="flex gap-2 py-1 items-center hover:bg-blue-100 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item)}
                  onChange={() => toggleItem(item)}
                />
                <span className="select-none">{item}</span>
              </label>
            ))
          ) : (
            <div className="text-gray-500 text-sm py-2">No items found</div>
          )}
        </div>
      )}
    </div>
  );

  // Render table rows based on view mode
  const renderTableRows = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan="14" className="text-center py-10">
            <FourSquare color="#32cd32" size="large" />
          </td>
        </tr>
      );
    }

    if (!displayedData || displayedData.length === 0) {
      return (
        <tr>
          <td colSpan="14" className="text-center text-red-500 text-2xl font-bold py-10">
            No data found
          </td>
        </tr>
      );
    }

    return displayedData.map((data, index) => {
      if (viewMode === "summary") {
        // Summary view row
        return (
          <tr key={data.WorkOrderNo || index} className="hover:bg-gray-300 cursor-pointer text-center">
            <td className="w-xl">{data.WorkOrderNo || "N/A"}</td>
            <td className="w-sm">{formatDate(data.OrderReceiveDate)}</td>
            <td className="w-sm">{data.CustomerName || "N/A"}</td>
            <td className="w-sm">{data.DeliverName || "N/A"}</td>
            <td className="w-sm">{data.Buyer || "N/A"}</td>
            <td className="w-lg">{data.PINO || "N/A"}</td>
            <td className="w-sm">{data.Section || "N/A"}</td>
            <td className="w-sm">{(data.TotalQty || 0).toFixed(2)}</td>
            <td className="w-sm">{(data.ChallanQTY || 0).toFixed(2)}</td>
            <td className="w-sm">{(data.BalanceQty || 0).toFixed(2)}</td>
            <td className="text-blue-600">$ {(data.TotalValue || 0).toFixed(2)}</td>
            <td className="text-green-600">$ {(data.ChallanValue || 0).toFixed(2)}</td>
            <td className="text-red-600">$ {(data.BalanceValue || 0).toFixed(2)}</td>
            <td className="w-xl text-left">
              {data.ChallanNo && data.ChallanNo.length > 0 ? (
                data.ChallanNo.map((ch, i) => (
                  <div key={i} className={getStatusColor(ch.status)}>
                    {i + 1}. {ch.challanNo} ({ch.status})
                  </div>
                ))
              ) : (
                <div className="text-gray-400">No Challan</div>
              )}
            </td>
          </tr>
        );
      } else {
        // Detail view row
        const deliveryPercent = data.deliveryPercent || 
          (data.TotalQty ? ((data.ChallanQTY || 0) / (data.TotalQty || 0) * 100).toFixed(0) : 0);
        
        return (
          <tr key={data.WorkOrderNo || index} className="hover:bg-gray-300 cursor-pointer text-center">
            <td className="w-xl">{index + 1 + currentPage * itemsPerPage}</td>
            <td className="w-xl">{data.WorkOrderNo || "N/A"}</td>
            <td className="w-sm">{formatDate(data.OrderReceiveDate)}</td>
            <td className="w-sm">{data.CustomerName || "N/A"}</td>
            <td className="w-sm">{data.Section || data.Category || "N/A"}</td>
            <td className="w-lg">{data.PINO || "N/A"}</td>
            <td className="w-sm text-right">{data.BreakDownQTY || data.TotalQty || 0}</td>
            <td className="w-sm text-right">{data.challanqty || data.ChallanQTY || 0}</td>
            <td className="text-center">{deliveryPercent}%</td>
          </tr>
        );
      }
    });
  };

  return (
    <>
      <OrderForm />
      
      {/* Controls Section */}
      <div className="flex justify-between px-9 my-5 flex-wrap gap-4">
        <div className="flex gap-4 flex-wrap">
          {/* Search */}
          <input
            type="text"
            placeholder="Search..."
            className="input"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(0);
            }}
          />

          {/* View Mode Toggle */}
          <div className="btn-group">
            <button
              className={`btn ${viewMode === 'summary' ? 'btn-active' : ''}`}
              onClick={() => setViewMode('summary')}
            >
              Summary
            </button>
            <button
              className={`btn ${viewMode === 'detail' ? 'btn-active' : ''}`}
              onClick={() => setViewMode('detail')}
            >
              Detail
            </button>
          </div>

          {/* PI Filter */}
          {uniquePI.length > 0 && renderFilterDropdown(
            piRef, piOpen, setPiOpen,
            selectedPI, setSelectedPI,
            uniquePI, piSearch, setPiSearch,
            filteredPI, togglePI, "Filter PI"
          )}
        </div>

        {/* Totals Display */}
        {grandTotal.TotalQty > 0 && (
          <div className="flex flex-wrap items-center border rounded bg-gray-100">
            <p className="border border-black p-3 font-bold bg-cyan-300">
              Total Qty: {Math.ceil(grandTotal.TotalQty)}
            </p>
            <p className="border border-black p-3 font-bold bg-cyan-300">
              Challan Qty: {Math.ceil(grandTotal.ChallanQTY)}
            </p>
            <p className="border border-black p-3 font-bold bg-cyan-300">
              Balance Qty: {Math.ceil(grandTotal.BalanceQty)}
            </p>
            {viewMode === "summary" && (
              <>
                <p className="border border-black p-3 font-bold bg-emerald-500 text-white">
                  Order: ${Math.ceil(grandTotal.TotalValue)}
                </p>
                <p className="border border-black p-3 font-bold bg-emerald-500 text-white">
                  Sales: ${Math.ceil(grandTotal.ChallanValue)}
                </p>
                <p className="border border-black p-3 font-bold bg-emerald-500 text-white">
                  Balance: ${Math.ceil(grandTotal.BalanceValue)}
                </p>
              </>
            )}
          </div>
        )}

        {/* Export Button */}
        <button onClick={exportToExcel} className="btn btn-success text-white">
          Export Excel
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto w-full max-h-[650px] overflow-y-auto">
        <table className="table table-md min-w-full border">
          <thead className="bg-blue-500 text-white sticky top-0 z-10">
            <tr className="text-center">
              {viewMode === "summary" ? (
                <>
                  <th>Order</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Delivery</th>
                  <th>Buyer</th>
                  <th>PI</th>
                  <th>Section</th>
                  <th>Order Qty</th>
                  <th>Challan Qty</th>
                  <th>Balance Qty</th>
                  <th>Order Value</th>
                  <th>Challan Value</th>
                  <th>Balance Value</th>
                  <th>Challan</th>
                </>
              ) : (
                <>
                  <th>SL.</th>
                  <th>Order No.</th>
                  <th>Order Date</th>
                  <th>Customer</th>
                  <th>Category</th>
                  <th>PI No.</th>
                  <th className="text-right">Order Qty</th>
                  <th className="text-right">Delivery Qty</th>
                  <th className="text-center">Delivery Complete</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {renderTableRows()}
          </tbody>
          <tfoot className="sticky bottom-0 bg-blue-300 z-10">
            <tr className="font-bold text-lg text-center text-black">
              {viewMode === "summary" ? (
                <>
                  <td colSpan={7}></td>
                  <td>{(totalData.TotalQty || 0).toFixed(2)}</td>
                  <td className="text-green-700">{(totalData.ChallanQTY || 0).toFixed(2)}</td>
                  <td className="text-red-700">{(totalData.BalanceQty || 0).toFixed(2)}</td>
                  <td>${(totalData.TotalValue || 0).toFixed(2)}</td>
                  <td className="text-green-700">${(totalData.ChallanValue || 0).toFixed(2)}</td>
                  <td className="text-red-700">${(totalData.BalanceValue || 0).toFixed(2)}</td>
                  <td></td>
                </>
              ) : (
                <>
                  <td colSpan={6}></td>
                  <td className="text-right">{(totalData.TotalQty || 0).toLocaleString()}</td>
                  <td className="text-right">{(totalData.ChallanQTY || 0).toLocaleString()}</td>
                  <td className="text-center">
                    {totalData.TotalQty ? ((totalData.ChallanQTY || 0) / (totalData.TotalQty || 0) * 100).toFixed(0) : 0}%
                  </td>
                </>
              )}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Pagination */}
      {pageCount > 0 && (
        <div className="flex justify-center mt-5 page-paginate">
          <ReactPaginate
            breakLabel="..."
            nextLabel="Next >"
            previousLabel="< Prev"
            pageCount={pageCount}
            onPageChange={({ selected }) => setCurrentPage(selected)}
            containerClassName="flex gap-2"
            pageLinkClassName="px-3 py-1 border rounded"
            activeLinkClassName="bg-blue-500 text-white"
          />
        </div>
      )}
    </>
  );
}

export default OrderSummary;