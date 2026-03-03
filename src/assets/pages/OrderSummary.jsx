import React, { useContext, useEffect, useMemo, useState } from "react";
import TableRow from "../components/TableRow";
import { GetDataContext } from "../components/DataContext";
import { FourSquare } from "react-loading-indicators";
import OrderForm from "../OrderReport/OrderForm";
import * as XLSX from "xlsx";
import ReactPaginate from "react-paginate";
import { UNSAFE_useFogOFWarDiscovery } from "react-router";
// import { MultiSelect } from "react-multi-select-component";
import { MultiSelect } from "primereact/multiselect";

function OrderSummary() {
  const { cndata, loading } = useContext(GetDataContext);
  const [apidata, setApidata] = useState([]);
  const [search, setSearch] = useState("");
  const [itemOffset, setItemOffset] = useState(1);
  const itemsPerPage = 10;
  const [selectedCities, setSelectedCities] = useState([]);
  // setApidata(cndata[0].apiData);
  // console.log(cndata[0].groupedData);
  useEffect(() => {
    if (cndata.length > 0) {
      setApidata(cndata[0].apiData);
    }
  }, [cndata]);
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
        ChallanNo: [],
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
    return Object.values(grouped).map((item) => ({
      ...item,
      ChallanNo: [...new Set(item.ChallanNo)].join(", "),
    }));
  }, [apidata]);

  console.log(SummarizedData);

  const cities = [
    { name: "New York", code: "NY" },
    { name: "Rome", code: "RM" },
    { name: "London", code: "LDN" },
    { name: "Istanbul", code: "IST" },
    { name: "Paris", code: "PRS" },
  ];

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
        <div className="card flex justify-content-center">
          <MultiSelect
            value={selectedCities}
            onChange={(e) => setSelectedCities(e.value)}
            options={cities}
            optionLabel="name"
            filter
            filterDelay={400}
            placeholder="Select Cities"
            maxSelectedLabels={3}
            className="w-full md:w-20rem"
          />
        </div>
        <button
          onClick={() => exportToExcel(filteredData)}
          className="btn btn-success px-4 py-2 text-white font-semibold rounded"
        >
          Export Excel
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="table table-lg w-full">
          <thead>
            <tr>
              <th className="w-1/12">Order No.</th>
              <th className="w-1/12">Customer Name.</th>
              <th className="w-1/12">Delivery</th>
              <th className="w-1/12">PI NO.</th>
              <th className="w-1/12">Section</th>
              <th className="w-1/12">Order Qty</th>
              <th className="w-1/12">Challan Qty</th>
              <th className="w-1/12">Balance Qty</th>
              <th className="w-1/12">Challan NO.</th>
            </tr>
          </thead>
          {loading ? (
            <div className="flex justify-center items-center h-screen">
              <FourSquare color="#32cd32" size="large" />
            </div>
          ) : (
            SummarizedData?.map((data) => (
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
            ))
          )}
        </table>
      </div>
    </>
  );
}

export default OrderSummary;
