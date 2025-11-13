import React, { useContext, useEffect, useState } from "react";
import TableRow from "../components/TableRow";
import { GetDataContext } from "../components/DataContext";

function OrderReport() {
  const [search, setSearch] = useState("");

  const { cndata } = useContext(GetDataContext);

  const grpData = cndata[0]?.groupedData || [];
  const apiData = cndata[0]?.apiData || [];

  // Global search
  const filteredData = grpData.filter((item) =>
    Object.values(item).some((value) =>
      String(value).toLowerCase().includes(search.toLowerCase())
    )
  );

  const grpDataTotal = filteredData.reduce(
    (sum, item) => sum + Number(item.BreakDownQTY || 0),
    0
  );
  const grpDelivery = filteredData.reduce(
    (sum, item) => sum + Number(item.challanqty || 0),
    0
  );

  const deliveryPercent = grpDataTotal
    ? ((grpDelivery / grpDataTotal) * 100).toFixed(0)
    : 0;

  console.log(filteredData);

  return (
    <>
      <div className="overflow-x-auto">
        <div className="my-5">
          <input
            type="text"
            className="input"
            placeholder="Search Here..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>
                <label>
                  <input type="checkbox" className="checkbox" />
                </label>
              </th>
              <th>SL.</th>
              <th>Order No.</th>
              <th>Customer</th>
              <th>Order Qty</th>
              <th>Delivery Qty</th>
              <th>Delivery Complete</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((data, idx) => (
                <TableRow key={idx} data={data} idx={idx} />
              ))
            ) : (
              // grpData.map((data, idx) => (
              //     <TableRow key={idx} data={data} idx={idx} />

              <tr>
                <td colSpan="8" className="text-center">
                  No data found
                </td>
              </tr>
            )}
          </tbody>

          <tfoot>
            <tr>
              <th></th>
              <th></th>
              <th></th>
              <th>Grand Total</th>
              <th>
                {grpDataTotal.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </th>
              <th>
                {grpDelivery.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </th>
              <th>{deliveryPercent}%</th>
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  );
}

export default OrderReport;
