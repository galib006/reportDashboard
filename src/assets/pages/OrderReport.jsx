import React, { useContext, useState } from "react";
import TableRow from "../components/TableRow";
import { GetDataContext } from "../components/DataContext";
import { FourSquare } from "react-loading-indicators";
import OrderForm from "../OrderReport/orderForm";
import ReactPaginate from "react-paginate";

function OrderReport() {
  const [search, setSearch] = useState("");
  const [itemOffset, setItemOffset] = useState(1);
  const itemsPerPage = 10;

  const { cndata, loading } = useContext(GetDataContext);

  const grpData = cndata[0]?.groupedData || [];

  // Global Search
  const filteredData = grpData.filter((item) =>
    Object.values(item).some((value) =>
      String(value).toLowerCase().includes(search.toLowerCase())
    )
  );

  // Pagination calculations
  const endOffset = itemOffset + itemsPerPage;
  const currentItems = filteredData.slice(itemOffset, endOffset);
  const pageCount = Math.ceil(filteredData.length / itemsPerPage);

  const handlePageClick = (event) => {
    const newOffset = (event.selected * itemsPerPage) % filteredData.length;
    setItemOffset(newOffset);
  };

  // Totals
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <FourSquare color="#32cd32" size="large" />
      </div>
    );
  }

  return (
    <>
      <OrderForm />

      {/* Search Box */}
      <div className="my-5 px-9">
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
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th></th>
              <th>SL.</th>
              <th>Order No.</th>
              <th>Order Date</th>
              <th>Customer</th>
              <th>Order Qty</th>
              <th>Delivery Qty</th>
              <th>Delivery Complete</th>
            </tr>
          </thead>

          <tbody>
            {currentItems.length > 0 ? (
              currentItems.map((data, idx) => (
                <TableRow
                  key={idx}
                  data={data}
                  idx={idx + itemOffset} // correct serial number
                />
              ))
            ) : (
              <tr>
                <td
                  colSpan="8"
                  className="text-center text-red-500 text-2xl font-bold"
                >
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
              <th>{grpDataTotal.toLocaleString()}</th>
              <th>{grpDelivery.toLocaleString()}</th>
              <th>{deliveryPercent}%</th>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Pagination */}
      <div className="my-5 flex justify-center mt-15">
        <ReactPaginate
          breakLabel="..."
          nextLabel="Next"
          previousLabel="Previous"
          onPageChange={handlePageClick}
          pageRangeDisplayed={5}
          pageCount={pageCount}
          containerClassName="flex gap-2"
          pageClassName="border rounded cursor-pointer select-none"
          previousClassName="border rounded cursor-pointer select-none"
          nextClassName="border rounded cursor-pointer select-none"
          activeClassName="bg-blue-500 text-white cursor-text"
          pageLinkClassName="w-full h-full block px-4 py-2"
          previousLinkClassName="w-full h-full block px-4 py-2"
          nextLinkClassName="w-full h-full block px-4 py-2"
          breakLinkClassName="w-full h-full block"
          disabledClassName="border cursor-text text-gray-300"
        />
      </div>
    </>
  );
}

export default OrderReport;
