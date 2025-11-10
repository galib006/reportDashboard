import React, { useContext, useEffect, useState } from 'react'
import SearchBar from '../components/SearchBar'
import TableRow from '../components/TableRow'
import { GetDataContext } from '../components/DataContext'

function OrderReport() {
  const {cndata} = useContext(GetDataContext);
 const grpData = cndata[0]?.groupedData || [];

  useEffect(() => {
    console.log("grpData:", grpData);
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
        <th>Name</th>
        <th>Job</th>
        <th>Favorite Color</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      {/* row 1 */}
      {
        grpData.map((data,idx)=>(
          <TableRow key={idx} data={data}></TableRow>
        ))
      }
     

    
      
    </tbody>
    {/* foot */}
    <tfoot>
      <tr>
        <th></th>
        <th>Name</th>
        <th>Job</th>
        <th>Favorite Color</th>
        <th></th>
      </tr>
    </tfoot>
  </table>
</div>
    </>
  )
}

export default OrderReport
