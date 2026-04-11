import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { GetDataContext } from "../components/DataContext";
import { FourSquare } from "react-loading-indicators";
import OrderForm from "../OrderReport/OrderForm";
import * as XLSX from "xlsx-js-style";
import ReactPaginate from "react-paginate";
// import FixedSizeList from 'react-window/dist/react-window.development.js';

function OrderSummary() {
  const { cndata, loading } = useContext(GetDataContext);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(0);

  const [selectedPI, setSelectedPI] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState([]);

  const [piSearch, setPiSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [piOpen, setPiOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);

  const piRef = useRef(null);
  const orderRef = useRef(null);
  const itemsPerPage = 50;

  /* ---------------- DATE FORMAT ---------------- */

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-GB");
  };

  /* ---------------- SUMMARIZED DATA ---------------- */

const summarizedData = useMemo(() => {
  const apidata = cndata?.[0]?.apiData || [];
  const challandata = cndata?.[0]?.grupChallan || [];

  // 🔹 challan status map
  const challanMap = new Map();
  challandata.forEach((c) => {
    challanMap.set(`${c.workOrderNo}-${c.challanNo}`, c.statusDesc);
  });

  // 🔹 grouped data
  const grouped = {};

  apidata.forEach((item) => {
    const key = item.WorkOrderNo;

    if (!grouped[key]) {
      grouped[key] = {
        WorkOrderNo: key,
        OrderReceiveDate: item.OrderReceiveDate,
        DeliverName: item.FName,
        CustomerName: item.CName,
        PINO: item.CustomerPINo,
        Section: item.ProductCategoryName,
        Buyer: item.BuyerName,

        TotalQty: 0,
        TotalValue: 0,
        ChallanQTY: 0,
        ChallanValue: 0,
        BalanceQty: 0,
        BalanceValue: 0,

        ChallanNo: new Set(), // 🔥 use Set directly
      };
    }

    const row = grouped[key];

    // 🔹 numeric calculation
    row.TotalQty += Number(item.BreakDownQTY) || 0;
    row.ChallanQTY += Number(item.ChallanQTY) || 0;
    row.BalanceQty += Number(item.BalanceQTY) || 0;

    row.TotalValue += Number(item.TotalOrderValue) || 0;
    row.ChallanValue += Number(item.ChallanValue) || 0;
    row.BalanceValue += Number(item.BalanceValue) || 0;

    // 🔹 split challan safely
    if (item.ChallanNo) {
      item.ChallanNo.split(",")
        .map((c) => c.trim())
        .filter(Boolean) // remove empty
        .forEach((cn) => row.ChallanNo.add(cn));
    }
  });

  // 🔹 final format
  return Object.values(grouped).map((item) => ({
    ...item,
    ChallanNo: Array.from(item.ChallanNo).map((cn) => ({
      challanNo: cn,
      status: challanMap.get(`${item.WorkOrderNo}-${cn}`) || "",
    })),
  }));
}, [cndata]);

  console.log("Summarize data", summarizedData);
  
  /* ---------------- UNIQUE FILTER LIST ---------------- */

  const uniquePI = useMemo(() => {
    return [...new Set(summarizedData.map((d) => d.PINO).filter(Boolean))];
  }, [summarizedData]);

  const uniqueOrder = useMemo(() => {
    return [...new Set(summarizedData.map((d) => d.WorkOrderNo))];
  }, [summarizedData]);

  /* ---------------- SEARCHABLE FILTER LIST ---------------- */

  const filteredPI = uniquePI.filter((pi) =>
    pi.toLowerCase().includes(piSearch.toLowerCase()),
  );

  const filteredOrder = uniqueOrder.filter((order) =>
    order.toString().includes(orderSearch),
  );

  /* ---------------- FILTER TOGGLE ---------------- */

  const togglePI = (pi) => {
    setSelectedPI((prev) =>
      prev.includes(pi) ? prev.filter((p) => p !== pi) : [...prev, pi],
    );
  };

  const toggleOrder = (order) => {
    setSelectedOrder((prev) =>
      prev.includes(order) ? prev.filter((o) => o !== order) : [...prev, order],
    );
  };

  /* ---------------- FILTER DATA ---------------- */

const filteredData = useMemo(() => {
  return summarizedData
    .filter((item) => {
      const searchMatch =
        !search ||
        item.WorkOrderNo.toString().includes(search) ||
        item.CustomerName?.toLowerCase().includes(search.toLowerCase()) ||
        item.DeliverName?.toLowerCase().includes(search.toLowerCase()) ||
        item.PINO?.toLowerCase().includes(search.toLowerCase()) ||
        item.Buyer?.toLowerCase().includes(search.toLowerCase());

      const piMatch =
        selectedPI.length === 0 || selectedPI.includes(item.PINO);

      const orderMatch =
        selectedOrder.length === 0 ||
        selectedOrder.includes(item.WorkOrderNo);

      return searchMatch && piMatch && orderMatch;
    })
    .sort((a, b) => {
  const getParts = (val) => {
    const parts = val.split("-");
    return {
      num: Number(parts[1]) || 0,
      year: Number(parts[2]) || 0,
    };
  };

  const A = getParts(a.WorkOrderNo);
  const B = getParts(b.WorkOrderNo);

  // 🔥 First sort by YEAR (descending)
  if (B.year !== A.year) {
    return B.year - A.year;
  }

  // 🔥 Then sort by NUMBER (descending)
  return B.num - A.num;
});
}, [summarizedData, search, selectedPI, selectedOrder]);

//full grand total for all filtered data without pagination
const grandTotal = useMemo(() => {
  return filteredData.reduce((acc, item) => {
    acc.TotalQty += Number(item.TotalQty || 0);
    acc.ChallanQTY += Number(item.ChallanQTY || 0);
    acc.BalanceQty += Number(item.BalanceQty || 0);
    acc.TotalValue += Number(item.TotalValue || 0);
    acc.ChallanValue += Number(item.ChallanValue || 0);
    acc.BalanceValue += Number(item.BalanceValue || 0);

    return acc;
  }, {
    TotalQty: 0,
    ChallanQTY: 0,
    BalanceQty: 0,
    TotalValue: 0,
    ChallanValue: 0,
    BalanceValue: 0
  });
}, [filteredData]);

  /* ---------------- PAGINATION ---------------- */

  const pageCount = Math.ceil(filteredData.length / itemsPerPage);
  const displayedData = filteredData.slice(
    currentPage * itemsPerPage,
    currentPage * itemsPerPage + itemsPerPage,
  );
    const totalData = displayedData.reduce((acc, item) => {
  acc.TotalQty += Number(item.TotalQty || 0);
  acc.ChallanQTY += Number(item.ChallanQTY || 0);
  acc.BalanceQty += Number(item.BalanceQty || 0);
  acc.TotalValue += Number(item.TotalValue || 0);
  acc.ChallanValue += Number(item.ChallanValue || 0);
  acc.BalanceValue += Number(item.BalanceValue || 0);

  return acc; 
}, {
  TotalQty: 0,
  ChallanQTY: 0,
  BalanceQty: 0,
  TotalValue: 0,
  ChallanValue: 0,
  BalanceValue: 0
}); 
console.log(displayedData);


  const handlePageClick = (event) => {
    setCurrentPage(event.selected);
  };

  /* ---------------- STATUS COLOR ---------------- */

  const getStatusColor = (status) => {
    if (status === "Challan Received") return "text-green-600 font-semibold";
    if (status === "Send to Gate") return "text-yellow-600 font-semibold";
    if (status === "Delivered") return "text-blue-600 font-semibold";
    if (status === "Gate Out") return "text-red-600 font-semibold";

    return "text-gray-500";
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (piRef.current && !piRef.current.contains(event.target)) {
        setPiOpen(false);
      }

      if (orderRef.current && !orderRef.current.contains(event.target)) {
        setOrderOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /* ---------------- EXPORT EXCEL ---------------- */

const exportToExcel = () => {

  // UI filtered data use directly
  const dataToExport = filteredData;

  // Group data by PI
  const groupedByPI = {};
  dataToExport.forEach((item) => {
    const key = item.PINO || "No PI";
    if (!groupedByPI[key]) groupedByPI[key] = [];
    groupedByPI[key].push(item);
  });

  let data = [];

  // Build data array
  for (const [pi, items] of Object.entries(groupedByPI)) {

    // PI title
    data.push([`PI: ${pi}`]);
    data.push([]);

    // Header
    data.push([
      "Order No",
      "Order Date",
      "Customer",
      "Delivery",
      "PI No",
      "Section",
      "Order Qty",
      "Challan Qty",
      "Balance Qty",
      "Order Value",
      "Challan Value",
      "Balance Value",
      "Challan No",
    ]);

    // Rows
    items.forEach((item) => {
      data.push([
        item.WorkOrderNo,
        item.OrderReceiveDate
          ? new Date(item.OrderReceiveDate).toLocaleDateString("en-GB")
          : "",
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
        item.ChallanNo.map(
          (ch) => `${ch.challanNo} (${ch.status})`
        ).join(", "),
      ]);
    });

    // Subtotal
    data.push([
      "Subtotal",
      "",
      "",
      "",
      "",
      "",
      items.reduce((a, b) => a + Number(b.TotalQty), 0),
      items.reduce((a, b) => a + Number(b.ChallanQTY), 0),
      items.reduce((a, b) => a + Number(b.BalanceQty), 0),
      items.reduce((a, b) => a + Number(b.TotalValue), 0),
      items.reduce((a, b) => a + Number(b.ChallanValue), 0),
      items.reduce((a, b) => a + Number(b.BalanceValue), 0),
      "",
    ]);

    data.push([]);
  }

  const ws = XLSX.utils.aoa_to_sheet(data);

  /* -------- PI TITLE MERGE -------- */

  let rowPointer = 0;
  for (const items of Object.values(groupedByPI)) {

    if (!ws["!merges"]) ws["!merges"] = [];

    ws["!merges"].push({
      s: { r: rowPointer, c: 0 },
      e: { r: rowPointer, c: 12 },
    });

    rowPointer += 3 + items.length + 2;
  }

  /* -------- COLUMN WIDTH AUTO -------- */

  const colWidths = [];

  for (let c = 0; c <= 12; c++) {

    let maxLength = 10;

    for (let r = 0; r < data.length; r++) {

      const cellValue = data[r][c];

      if (cellValue) {
        const len = cellValue.toString().length;
        if (len > maxLength) maxLength = len + 2;
      }
    }

    colWidths.push({ wch: maxLength });
  }

  ws["!cols"] = colWidths;

  /* -------- ROW HEIGHT AUTO -------- */

  ws["!rows"] = data.map((row) => {

    let maxLines = 1;

    row.forEach((cell) => {
      if (!cell) return;

      const lines = cell.toString().split("\n").length;
      if (lines > maxLines) maxLines = lines;
    });

    return { hpt: maxLines * 20 };

  });

  /* -------- STYLING -------- */

  data.forEach((row, r) => {

    row.forEach((_, c) => {

      const cell = XLSX.utils.encode_cell({ r, c });

      if (!ws[cell]) return;

      ws[cell].s = {
        font: { sz: 16, name: "Calibri" },
        alignment: {
          horizontal: c === 12 ? "left" : "center",
          vertical: "center",
          wrapText: true,
        },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
        },
      };

      // PI title
      if (ws["!merges"]?.some((m) => m.s.r === r)) {

        ws[cell].s.font = {
          bold: true,
          sz: 26,
          color: { rgb: "FFFFFF" },
        };

        ws[cell].s.fill = { fgColor: { rgb: "2F75B5" } };

        ws[cell].s.alignment = {
          horizontal: "center",
          vertical: "center",
        };
      }

      // Currency
      if (c === 9 || c === 10 || c === 11) {

        ws[cell].s.numFmt = '"$"#,##0';

        ws[cell].s.alignment.horizontal = "right";
      }

      // Subtotal style
      if (row[0] === "Subtotal") {

        ws[cell].s.fill = { fgColor: { rgb: "D9E1F2" } };

        ws[cell].s.font.bold = true;
      }
    });
  });

  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, ws, "Order Summary");

  XLSX.writeFile(wb, "OrderSummaryReport.xlsx");
};
  /* ---------------- UI ---------------- */

  return (
    <>
      <OrderForm />

      <div className="flex justify-between px-9 my-5">
        <div className="flex gap-4">
          {/* GLOBAL SEARCH */}
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

          {/* PI FILTER */}
          <div className="relative" ref={piRef}>
            <button
              className="btn btn-outline w-32"
              onClick={() => setPiOpen(!piOpen)}
            >
              Filter PI {selectedPI.length ? `(${selectedPI.length})` : ""}
            </button>

            {piOpen && (
              <div className="absolute bg-base-100 shadow p-3 rounded w-64 max-h-60 overflow-y-auto z-50 mt-2">
                {/* Select / Uncheck All */}
                <div className="flex justify-between mb-2">
                  <button
                    className="text-blue-600 text-sm hover:underline"
                    onClick={() => setSelectedPI(uniquePI)}
                  >
                    Select All
                  </button>

                  <button
                    className="text-red-600 text-sm hover:underline"
                    onClick={() => setSelectedPI([])}
                  >
                    Uncheck All
                  </button>
                </div>

                {/* Search Input */}
                <input
                  type="text"
                  placeholder="Search PI"
                  className="input input-sm w-full mb-2"
                  value={piSearch}
                  onChange={(e) => setPiSearch(e.target.value)}
                />

                {/* Checkbox List */}
                {filteredPI.map((pi) => (
                  <label
                    key={pi}
                    className="flex gap-2 py-1 items-center hover:bg-blue-100 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPI.includes(pi)}
                      onChange={() => togglePI(pi)}
                    />
                    <span className="select-none">{pi}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* <div style={style}>
      <label className="flex gap-2 py-1 items-center hover:bg-blue-100 rounded cursor-pointer px-2">
        <input
          type="checkbox"
          checked={selectedOrder.includes(order)}
          onChange={() => toggleOrder(order)}
        />
        <span className="select-none">{order}</span>
      </label>
    </div> */}
          {/* ///////////////////////////////////////////////////////////////////////// */}
          {/* Error */}
          {/* /////////////////////////////////////////////////////////////////////// */}
          {/* ORDER FILTER */}
          {/* ORDER FILTER */}
          {/* <div className="relative" ref={orderRef}>
            {/* <button
              className="btn btn-outline w-32"
              onClick={() => setOrderOpen(!orderOpen)}
            >
              Filter Order{" "}
              {selectedOrder.length ? `(${selectedOrder.length})` : ""}
            </button> */}

          {/* <div className="absolute bg-base-100 shadow p-3 rounded w-64 max-h-60 overflow-y-auto z-50 mt-2"> */}
          {/* Select / Uncheck All */}
          {/* <div className="flex justify-between mb-2">
                  <button
                    className="text-blue-600 text-sm hover:underline"
                    onClick={() => setSelectedOrder(uniqueOrder)}
                  >
                    Select All
                  </button>
                  <button
                    className="text-red-600 text-sm hover:underline"
                    onClick={() => setSelectedOrder([])}
                  >
                    Uncheck All
                  </button>
                </div>

                {/* Search Input */}
          {/* <input
                  type="text"
                  placeholder="Search Order"
                  className="input input-sm w-full mb-2"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                /> */}

          {/* ✅ Virtualized List */}
          {/* <FixedSizeList
                  height={240} // dropdown visible height
                  itemCount={filteredOrder.length}
                  itemSize={32} // এক একটি row এর height
                  width="100%"
                > */}
          {/* {({ index, style }) => {
                    const order = filteredOrder[index];
                    return (
                      <div style={style} className="px-1">
                        <label className="flex gap-2 py-1 items-center hover:bg-blue-100 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedOrder.includes(order)}
                            onChange={() => toggleOrder(order)}
                          />
                          <span className="select-none">{order}</span>
                        </label>
                      </div>
                    );
                  }}
                </FixedSizeList> */}
          {/* </div> */}

          {/* </div>  */}
        </div>
        {grandTotal.TotalQty  > 0 && (
          <div className="flex items-center border rounded bg-gray-100">
            <p className="border border-black p-3 font-bold bg-cyan-300">Total Qty: {Math.ceil(grandTotal.TotalQty)}</p>
            <p className="border border-black p-3 font-bold bg-cyan-300">Challan Qty: {Math.ceil(grandTotal.ChallanQTY)}</p>
            <p className="border border-black p-3 font-bold bg-cyan-300">Balance Qty: {Math.ceil(grandTotal.BalanceQty)}</p>
            <p className="border border-black p-3 font-bold bg-emerald-500 text-white">Order: ${Math.ceil(grandTotal.TotalValue)}</p>
            <p className="border border-black p-3 font-bold bg-cyan-300 bg-emerald-500 text-white">Sales: ${Math.ceil(grandTotal.ChallanValue)}</p>
          <p className="border border-black p-3 font-bold bg-cyan-300 bg-emerald-500 text-white">Balance: ${Math.ceil(grandTotal.BalanceValue)}</p>
            
        </div>)}

        <button onClick={exportToExcel} className="btn btn-success text-white">
          Export Excel
        </button>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto w-full max-h-[650px] overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <FourSquare color="#32cd32" size="large" />
          </div>
        ) : (
          <table className="table table-md min-w-full border">
            <thead className="bg-blue-500 text-white sticky top-0 z-10">
              <tr className="text-center">
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
              </tr>
            </thead>
            <tbody>
              {displayedData.map((data) => (
  
                <tr key={data.WorkOrderNo} className="hover:bg-gray-300 cursor-pointer text-center">
                  <td className="w-xl ">{data.WorkOrderNo}</td>
                  <td className="w-sm ">{formatDate(data.OrderReceiveDate)}</td>
                  <td className="w-sm ">{data.CustomerName}</td>
                  <td className="w-sm ">{data.DeliverName}</td>
                  <td className="w-sm ">{data.Buyer}</td>
                  <td className="w-lg ">{data.PINO}</td>
                  <td className="w-sm ">{data.Section}</td>
                  <td className="w-sm ">{data.TotalQty.toFixed(2)}</td>
                  <td className="w-sm ">{data.ChallanQTY.toFixed(2)}</td>
                  <td className="w-sm ">{data.BalanceQty.toFixed(2)}</td>
                  <td className="text-blue-600  ">
                    $ {(data.TotalValue).toFixed(2)}
                  </td>
                  <td className="text-green-600  ">
                    $ {(data.ChallanValue).toFixed(2)}
                  </td>
                  <td className="text-red-600  ">
                    $ {(data.BalanceValue).toFixed(2)}
                  </td>
                  <td className="w-xl text-left">
                    {data.ChallanNo.length > 0 ? (
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
           
              ))}

            </tbody>
            <tfoot className="sticky bottom-0 bg-blue-300 z-10">
            <tr className="font-bold text-lg text-center text-black">
              <td colSpan={7}></td>
              <td>{totalData.TotalQty.toFixed(2)}</td>
              <td className="text-green-700">{totalData.ChallanQTY.toFixed(2)}</td>
              <td className="text-red-700">{totalData.BalanceQty.toFixed(2)}</td>
              <td>${(totalData.TotalValue).toFixed(2)}</td>
              <td className="text-green-700">${(totalData.ChallanValue).toFixed(2)}</td>
              <td className="text-red-700">${(totalData.BalanceValue).toFixed(2)}</td>
              <td></td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* PAGINATION */}
      <div className="flex justify-center mt-5 page-paginate">
        <ReactPaginate
          breakLabel="..."
          nextLabel="Next >"
          previousLabel="< Prev"
          pageCount={pageCount}
          onPageChange={handlePageClick}
          containerClassName="flex gap-2"
          pageLinkClassName="px-3 py-1 border rounded"
          activeLinkClassName="bg-blue-500 text-white"
        />
      </div>
    </>
  );
}

export default OrderSummary;
