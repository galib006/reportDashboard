import React, { useContext, useState } from 'react'
import TableRow from '../components/TableRow'
import { GetDataContext } from '../components/DataContext'

function OrderReport() {
  const [search, setSearch] = useState('')
  const { cndata } = useContext(GetDataContext);

  const grpData = cndata[0]?.groupedData || [];
  const apiData = cndata[0]?.apiData || [];

  const grpDataTotal = grpData.reduce(
    (sum, item) => sum + Number(item.TotalOrderValue || 0),
    0
  );

  // Global search
  const filteredData = apiData.filter((item) =>
    Object.values(item).some((value) =>
      String(value).toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div className="overflow-x-auto">
<<<<<<< HEAD
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
          {/* {filteredData.length > 0 ? (
            filteredData.map((data, idx) => (
              <TableRow key={idx} data={data} idx={idx} />
            ))
          ) : (
            <tr>
              <td colSpan="10" className="text-center text-gray-400 py-3">
                No matching data found
              </td>
            </tr>
          )} */}
        </tbody>

        <tfoot>
          <tr>
            <th></th>
            <th></th>
            <th></th>
            <th>Grand Total</th>
            <th>{grpDataTotal.toFixed(2)}</th>
          </tr>
        </tfoot>
      </table>
    </div>
=======
  <table className="table">
    {/* head */}
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
      {/* row 1 */}
      {
        grpData.map((data,idx)=>(
          <TableRow key={idx} data={data} length={idx}></TableRow>
          // setgrpDataTotal()
        ))
      }
          
    </tbody>
    {/* foot */}
    <tfoot>
      <tr>
        <th></th>
        <th></th>
        <th></th>
        <th>Grand Total</th>
        <th>{grpDataTotal.toFixed(2)}</th>
      </tr>
    </tfoot>
  </table>
</div>
    </>
>>>>>>> 97bec7201a2d3972e480043b20e3a898de328997
  )
}

export default OrderReport
