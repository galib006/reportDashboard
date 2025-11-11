import React from 'react'
import SingleOrderContent from '../OrderReport/SingleOrderContent';

function TableRow({data,length}) {

  
  const getId = () =>{
    console.log(data.WorkOrderNo);
  }
  return (
 
       <tr>
        <th>
          <label>
            <input type="checkbox" className="checkbox" />
          </label>
        </th>
        <td>
          {length+1}
        </td>
        <td>
          <div className="flex items-center gap-3">
            {/* <div className="avatar">
              <div className="mask mask-squircle h-12 w-12">
                <img
                  src="https://img.daisyui.com/images/profile/demo/2@94.webp"
                  alt="Avatar Tailwind CSS Component" />
              </div>
            </div> */}
            <div>
              <div className="font-bold">{data.WorkOrderNo}</div>
              <div className="text-sm opacity-50">{data.Category}</div>
            </div>
          </div>
        </td>
        <td>
          {data.CustomerName}
          <br />
          <span className="badge badge-ghost badge-sm font-bold ">Buyer: <sapn className="text-blue-500">{data.Buyer}</sapn></span>
        </td>
        <td className=''>{data.TotalOrderValue.toFixed(2)}</td>
        <th>
          <SingleOrderContent data={data.WorkOrderNo}></SingleOrderContent>
        </th>
      </tr>

  )
}

export default TableRow
