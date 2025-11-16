import React, { useState } from "react";
import SingleOrderContent from "../OrderReport/SingleOrderContent";
import { useContext } from "react";
function TableRow({ data, idx }) {
  // console.log(data);

  const orderQty = Number(data.BreakDownQTY).toFixed(2);
  const challanQty = Number(data.challanqty).toFixed(2);
  const deliveryPercent = ((challanQty / orderQty) * 100).toFixed(0);
  return (
    <>
      <tr>
        <th>
          <label>
            <input type="checkbox" className="checkbox" />
          </label>
        </th>
        <td>{Number(idx) + 1}</td>
        <td>
          <div className="flex items-center gap-3">
            <div>
              <div className="font-bold">{data.WorkOrderNo}</div>
              <div className="text-sm opacity-50">{data.Category}</div>
            </div>
          </div>
        </td>
        <td>{data.OrderReceiveDate}</td>
        <td>
          {data.CustomerName}
          <br />
          <span className="badge badge-ghost badge-sm font-bold">
            Buyer: <span className="text-blue-500">{data.Buyer}</span>
          </span>
        </td>
        <td>{data.CustomerPINo ? data.CustomerPINo : "-"}</td>
        <td className="text-right">{orderQty}</td>
        <td className="text-right">{challanQty}</td>
        <td
          className={`text-center ${
            deliveryPercent == 100 ? "text-green-700" : "text-red-600"
          } `}
        >
          {deliveryPercent}%
        </td>
        <th>
          <SingleOrderContent Wrk={data.WorkOrderNo} data={data} />
        </th>
      </tr>
    </>
  );
}

export default TableRow;
