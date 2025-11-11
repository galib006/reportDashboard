import React, { useState } from "react";
import ReactPaginate from "react-paginate";
import PropTypes from "prop-types";
import SingleOrderContent from "../OrderReport/SingleOrderContent";

// ---------- TableRow ----------
function TableRow({ data, index }) {
  const orderQty = data?.BreakDownQTY ?? 0;
  const deliveredQty = data?.challanqty ?? 0;
  const deliveryPercent =
    orderQty > 0 ? ((deliveredQty / orderQty) * 100).toFixed(2) : "0.00";

  return (
    <tr>
      <th>
        <label>
          <input type="checkbox" className="checkbox" />
        </label>
      </th>
      <td>{index + 1}</td>
      <td>
        <div className="flex items-center gap-3">
          <div>
            <div className="font-bold">{data.WorkOrderNo}</div>
            <div className="text-sm opacity-50">{data.Category}</div>
          </div>
        </div>
      </td>
      <td>
        {data.CustomerName}
        <br />
        <span className="badge badge-ghost badge-sm font-bold">
          Buyer: <span className="text-blue-500">{data.Buyer}</span>
        </span>
      </td>
      <td>{orderQty.toFixed(2)}</td>
      <td>{deliveredQty.toFixed(2)}</td>
      <td>{deliveryPercent}%</td>
      <th>
        <SingleOrderContent data={data.WorkOrderNo} />
      </th>
    </tr>
  );
}

TableRow.propTypes = {
  data: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
};

// ---------- OrderTable ----------
function OrderTable({ items = [], itemsPerPage = 10 }) {
  const [itemOffset, setItemOffset] = useState(0);

  const endOffset = itemOffset + itemsPerPage;
  const currentItems = items.slice(itemOffset, endOffset);
  const pageCount = Math.ceil(items.length / itemsPerPage);

  const handlePageClick = (event) => {
    const newOffset = (event.selected * itemsPerPage) % items.length;
    setItemOffset(newOffset);
    window.scrollTo({ top: 0, behavior: "smooth" }); // UX improvement
  };

  return (
    <div className="p-4">
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th></th>
              <th>SL</th>
              <th>Work Order</th>
              <th>Customer</th>
              <th>Order Qty</th>
              <th>Delivered Qty</th>
              <th>Delivery %</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-4 text-gray-500">
                  No records found
                </td>
              </tr>
            ) : (
              currentItems.map((data, index) => (
                <TableRow
                  key={index}
                  data={data}
                  index={itemOffset + index}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {items.length > itemsPerPage && (
        <div className="flex justify-center mt-4">
          <ReactPaginate
            breakLabel="..."
            nextLabel="Next >"
            onPageChange={handlePageClick}
            pageRangeDisplayed={3}
            marginPagesDisplayed={1}
            pageCount={pageCount}
            previousLabel="< Prev"
            containerClassName="flex items-center space-x-2 text-sm"
            pageClassName="px-3 py-1 border rounded-md hover:bg-blue-100 cursor-pointer"
            activeClassName="bg-blue-500 text-white font-bold"
            previousClassName="px-3 py-1 border rounded-md hover:bg-blue-100 cursor-pointer"
            nextClassName="px-3 py-1 border rounded-md hover:bg-blue-100 cursor-pointer"
          />
        </div>
      )}
    </div>
  );
}

OrderTable.propTypes = {
  items: PropTypes.array.isRequired,
  itemsPerPage: PropTypes.number,
};

export default OrderTable;
