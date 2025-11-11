import React, { useContext, useEffect, useState } from 'react'
import SearchBar from '../components/SearchBar'
import TableRow from '../components/TableRow'
import { GetDataContext } from '../components/DataContext'

function OrderReport() {
const {cndata} = useContext(GetDataContext);
 const grpData = cndata[0]?.groupedData || [];
 const apiData = cndata[0]?.apiData || [];
 const grpDataTotal = grpData.reduce((sum,item)=>sum + Number(item.TotalOrderValue || 0),0
 );
//  console.log(apiData);
 
  useEffect(() => {
    // console.log("grpData:", grpData);
  }, [grpData]);
 
  return (
    <>
    <div className="overflow-x-auto">
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
        <th>Order Value</th>
        <th>Delivery Complete</th>
        
        <th></th>
      </tr>
    </thead>
    <tbody>
      {/* row 1 */}

        <td>Hsdfdf</td>

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
  )
}

export default OrderReport
