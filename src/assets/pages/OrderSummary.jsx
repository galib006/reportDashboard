import React, { useContext, useMemo, useState } from "react";
import { GetDataContext } from "../components/DataContext";
import { FourSquare } from "react-loading-indicators";
import OrderForm from "../OrderReport/OrderForm";
import * as XLSX from "xlsx-js-style";
import ReactPaginate from "react-paginate";

function OrderSummary() {

const { cndata, loading } = useContext(GetDataContext);

const [search, setSearch] = useState("");
const [currentPage, setCurrentPage] = useState(0);

const [selectedPI, setSelectedPI] = useState([]);
const [selectedOrder, setSelectedOrder] = useState([]);

const [piSearch,setPiSearch] = useState("")
const [orderSearch,setOrderSearch] = useState("")

const itemsPerPage = 10;


/* ---------------- DATE FORMAT ---------------- */

const formatDate = (dateStr) => {
if (!dateStr) return "";
return new Date(dateStr).toLocaleDateString("en-GB");
};



/* ---------------- SUMMARIZED DATA ---------------- */

const summarizedData = useMemo(()=>{

const apidata = cndata[0]?.apiData || []
const challandata = cndata[0]?.grupChallan || []

const challanMap = new Map()

challandata.forEach((c)=>{
const key = `${c.workOrderNo}-${c.challanNo}`
challanMap.set(key,c.statusDesc)
})

const grouped = {}

apidata.forEach((item)=>{

if(!grouped[item.WorkOrderNo]){

grouped[item.WorkOrderNo] = {

WorkOrderNo:item.WorkOrderNo,
OrderReceiveDate:item.OrderReceiveDate,
DeliverName:item.FName,
CustomerName:item.CName,
PINO:item.CustomerPINo,
Section:item.ProductCategoryName,

TotalQty:0,
TotalValue:0,

ChallanQTY:0,
ChallanValue:0,

BalanceQty:0,
BalanceValue:0,

ChallanNo:[]
}

}

const row = grouped[item.WorkOrderNo]

row.TotalQty += Number(item.BreakDownQTY)
row.ChallanQTY += Number(item.ChallanQTY)
row.BalanceQty += Number(item.BalanceQTY)

row.TotalValue += Number(item.TotalOrderValue)
row.ChallanValue += Number(item.ChallanValue)
row.BalanceValue += Number(item.BalanceValue)

if(item.ChallanNo){

row.ChallanNo.push(item.ChallanNo)

}

})

return Object.values(grouped).map((item)=>({

...item,

ChallanNo:[...new Set(item.ChallanNo)].map((cn)=>({

challanNo:cn,
status:challanMap.get(`${item.WorkOrderNo}-${cn}`) || ""

}))

}))

},[cndata])



/* ---------------- UNIQUE FILTER LIST ---------------- */

const uniquePI = useMemo(()=>{
return [...new Set(summarizedData.map(d=>d.PINO).filter(Boolean))]
},[summarizedData])


const uniqueOrder = useMemo(()=>{
return [...new Set(summarizedData.map(d=>d.WorkOrderNo))]
},[summarizedData])



/* ---------------- SEARCHABLE FILTER LIST ---------------- */

const filteredPI = uniquePI.filter(pi =>
pi.toLowerCase().includes(piSearch.toLowerCase())
)

const filteredOrder = uniqueOrder.filter(order =>
order.toString().includes(orderSearch)
)



/* ---------------- FILTER TOGGLE ---------------- */

const togglePI = (pi)=>{

setSelectedPI(prev =>
prev.includes(pi)
? prev.filter(p=>p!==pi)
: [...prev,pi]
)

}


const toggleOrder = (order)=>{

setSelectedOrder(prev =>
prev.includes(order)
? prev.filter(o=>o!==order)
: [...prev,order]
)

}



/* ---------------- FILTER DATA ---------------- */

const filteredData = useMemo(()=>{

return summarizedData.filter(item=>{

const searchMatch =
!search ||
item.WorkOrderNo.toString().includes(search) ||
item.CustomerName?.toLowerCase().includes(search.toLowerCase()) ||
item.DeliverName?.toLowerCase().includes(search.toLowerCase()) ||
item.PINO?.toLowerCase().includes(search.toLowerCase())


const piMatch =
selectedPI.length === 0 || selectedPI.includes(item.PINO)

const orderMatch =
selectedOrder.length === 0 || selectedOrder.includes(item.WorkOrderNo)

return searchMatch && piMatch && orderMatch

})

},[summarizedData,search,selectedPI,selectedOrder])



/* ---------------- PAGINATION ---------------- */

const pageCount = Math.ceil(filteredData.length/itemsPerPage)

const displayedData = filteredData.slice(
currentPage*itemsPerPage,
currentPage*itemsPerPage+itemsPerPage
)

const handlePageClick = (event)=>{
setCurrentPage(event.selected)
}



/* ---------------- STATUS COLOR ---------------- */

const getStatusColor = (status)=>{

if(status==="Challan Received") return "text-green-600 font-semibold"
if(status==="Send to Gate") return "text-yellow-600 font-semibold"
if(status==="Delivered") return "text-blue-600 font-semibold"
if(status==="Gate Out") return "text-red-600 font-semibold"

return "text-gray-500"

}



/* ---------------- EXPORT EXCEL ---------------- */

const exportToExcel = () => {
  // Filtered data as per search & selection
  const filteredData = summarizedData.filter(item => {
    const searchMatch =
      !search ||
      item.WorkOrderNo.toString().includes(search) ||
      item.CustomerName?.toLowerCase().includes(search.toLowerCase()) ||
      item.DeliverName?.toLowerCase().includes(search.toLowerCase());
    const piMatch = selectedPI.length === 0 || selectedPI.includes(item.PINO);
    const orderMatch = selectedOrder.length === 0 || selectedOrder.includes(item.WorkOrderNo);
    return searchMatch && piMatch && orderMatch;
  });

  // Group data by PI
  const groupedByPI = {};
  filteredData.forEach(item => {
    const key = item.PINO || "No PI";
    if (!groupedByPI[key]) groupedByPI[key] = [];
    groupedByPI[key].push(item);
  });

  let data = [];

  for (const [pi, items] of Object.entries(groupedByPI)) {
    // PI Title row
    data.push([`PI: ${pi}`]);
    data.push([`Generated: ${new Date().toLocaleDateString("en-GB")}`]);
    data.push([]); // empty row before header

    // Header
    data.push([
      "Order No","Order Date","Customer","Delivery","PI No","Section",
      "Order Qty","Challan Qty","Balance Qty",
      "Order Value","Challan Value","Balance Value","Challan No"
    ]);

    // Rows
    items.forEach(item => {
      data.push([
        item.WorkOrderNo,
        item.OrderReceiveDate ? new Date(item.OrderReceiveDate).toLocaleDateString("en-GB") : "",
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
        item.ChallanNo.map(ch => `${ch.challanNo} (${ch.status})`).join(", ")
      ]);
    });

    // Subtotal per PI
    data.push([
      "Subtotal","","","","","",
      items.reduce((a,b)=>a+Number(b.TotalQty),0),
      items.reduce((a,b)=>a+Number(b.ChallanQTY),0),
      items.reduce((a,b)=>a+Number(b.BalanceQty),0),
      items.reduce((a,b)=>a+Number(b.TotalValue),0),
      items.reduce((a,b)=>a+Number(b.ChallanValue),0),
      items.reduce((a,b)=>a+Number(b.BalanceValue),0),
      ""
    ]);

    data.push([]); // empty row after each PI
  }

  const ws = XLSX.utils.aoa_to_sheet(data);

  // Merge PI title & date rows
  ws["!merges"] = [
    { s: { r:0, c:0 }, e:{ r:0, c:12 } },
    { s: { r:1, c:0 }, e:{ r:1, c:12 } }
  ];

  // Auto width
  const colWidths = [];
  for(let c=0;c<=12;c++){
    let maxLength = 10;
    for(let r=0;r<data.length;r++){
      const cellValue = data[r][c];
      if(cellValue){
        const len = cellValue.toString().length;
        if(len>maxLength) maxLength = len + 2;
      }
    }
    colWidths.push({wch: maxLength});
  }
  ws["!cols"] = colWidths;

  // Style rows
  data.forEach((row,r)=>{
    row.forEach((_,c)=>{
      const cell = XLSX.utils.encode_cell({r,c});
      if(!ws[cell]) return;

      // Default style
      ws[cell].s = {
        font: { sz: 16, name: "Calibri" },
        alignment: {
          horizontal: c===12 ? "left" : "center",
          vertical: "center",
          wrapText: c===12
        },
        border: {
          top: { style: "thin", color: { rgb:"000000" } },
          bottom: { style: "thin", color: { rgb:"000000" } },
          left: { style: "thin", color: { rgb:"000000" } },
          right: { style: "thin", color: { rgb:"000000" } }
        }
      };

      // PI title
      if(r===0){
        ws[cell].s = {
          font: { bold:true, sz:26, color:{ rgb:"FFFFFF" }, name:"Calibri" },
          fill:{ fgColor:{ rgb:"2F75B5" } },
          alignment:{ horizontal:"center", vertical:"center" }
        }
      }

      // Date row
      if(r===1){
        ws[cell].s = {
          font:{ italic:true, sz:16, name:"Calibri" },
          alignment:{ horizontal:"center", vertical:"center" }
        }
      }

      // Header row
      if(r===3 || (r>3 && data[r-1].length===0 && r<data.length-1 && data[r+1].length>0)){
        ws[cell].s = {
          font: { bold:true, sz:16, color:{rgb:"FFFFFF"}, name:"Calibri" },
          fill: { fgColor:{ rgb:"305496" } },
          alignment: { horizontal:"center", vertical:"center" },
          border: {
            top:{ style:"thin", color:{rgb:"000000"} },
            bottom:{ style:"thin", color:{rgb:"000000"} },
            left:{ style:"thin", color:{rgb:"000000"} },
            right:{ style:"thin", color:{rgb:"000000"} }
          }
        }
      }

      // Currency formatting
      if(c===9 || c===10 || c===11){
        ws[cell].s.numFmt = '"$"#,##0';
        if(c===9) ws[cell].s.font.color={rgb:"1F4E78"};
        if(c===10) ws[cell].s.font.color={rgb:"008000"};
        if(c===11) ws[cell].s.font.color={rgb:"C00000"};
        ws[cell].s.alignment.horizontal="right";
      }

      // Subtotal row style
      if(row[0]==="Subtotal"){
        ws[cell].s.fill={ fgColor:{ rgb:"D9E1F2" } };
        ws[cell].s.font.bold=true;
      }
    })
  });

  // Freeze header
  ws["!freeze"] = { xSplit:0, ySplit:4 };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws,"Order Summary");
  XLSX.writeFile(wb,"OrderSummaryReport.xlsx");
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
          <div className="dropdown relative">
            <label tabIndex={0} className="btn btn-outline">
              Filter PI
            </label>

            <div
              className="dropdown-content bg-base-100 shadow p-3 rounded w-64 max-h-60 overflow-y-auto absolute z-50"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Select / Uncheck All */}
              <div className="flex justify-between mb-2">
                <button
                  className="text-blue-600 text-sm hover:underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPI(uniquePI);
                  }}
                >
                  Select All
                </button>
                <button
                  className="text-red-600 text-sm hover:underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPI([]);
                  }}
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
                onClick={(e) => e.stopPropagation()}
              />

              {/* Checkbox List */}
              {filteredPI.map((pi) => (
                <label
                  key={pi}
                  className="flex gap-2 py-1 items-center hover:bg-blue-100 rounded cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
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
          </div>

          {/* ORDER FILTER */}
          <div className="dropdown relative">
            <label tabIndex={0} className="btn btn-outline">
              Filter Order
            </label>

            <div
              className="dropdown-content bg-base-100 shadow p-3 rounded w-64 max-h-60 overflow-y-auto absolute z-50"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Select / Uncheck All */}
              <div className="flex justify-between mb-2">
                <button
                  className="text-blue-600 text-sm hover:underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedOrder(uniqueOrder);
                  }}
                >
                  Select All
                </button>
                <button
                  className="text-red-600 text-sm hover:underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedOrder([]);
                  }}
                >
                  Uncheck All
                </button>
              </div>

              {/* Search Input */}
              <input
                type="text"
                placeholder="Search Order"
                className="input input-sm w-full mb-2"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />

              {/* Checkbox List */}
              {filteredOrder.map((order) => (
                <label
                  key={order}
                  className="flex gap-2 py-1 items-center hover:bg-blue-100 rounded cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={selectedOrder.includes(order)}
                    onChange={() => toggleOrder(order)}
                  />
                  <span className="select-none">{order}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={exportToExcel}
          className="btn btn-success text-white"
        >
          Export Excel
        </button>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <FourSquare color="#32cd32" size="large" />
          </div>
        ) : (
          <table className="table w-full text-center">
            <thead className="bg-blue-500 text-white">
              <tr>
                <th>Order</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Delivery</th>
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
                <tr key={data.WorkOrderNo}>
                  <td>{data.WorkOrderNo}</td>
                  <td>{formatDate(data.OrderReceiveDate)}</td>
                  <td>{data.CustomerName}</td>
                  <td>{data.DeliverName}</td>
                  <td>{data.PINO}</td>
                  <td>{data.Section}</td>
                  <td>{data.TotalQty}</td>
                  <td>{data.ChallanQTY}</td>
                  <td>{data.BalanceQty}</td>
                  <td className="text-blue-600">
                    $ {Math.ceil(data.TotalValue)}
                  </td>
                  <td className="text-green-600">
                    $ {Math.ceil(data.ChallanValue)}
                  </td>
                  <td className="text-red-600">
                    $ {Math.ceil(data.BalanceValue)}
                  </td>
                  <td>
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
          </table>
        )}
      </div>

      {/* PAGINATION */}
      <div className="flex justify-center mt-5">
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