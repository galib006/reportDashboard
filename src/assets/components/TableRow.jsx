import React, { useState } from 'react'
import SingleOrderContent from '../OrderReport/SingleOrderContent'
import { useContext } from 'react';
function TableRow({data,idx}) {
  // const [orderQty,setorderQty] = useState(0);
  // const [challanQty,sechallanQty] = useState(0);
  // const [deliveryPercent,setdeliveryPercent] = useState(0);
  const orderQty = Number(data.BreakDownQTY).toFixed(2);
  const challanQty = Number(data.challanqty).toFixed(2);
  const deliveryPercent = ((challanQty / orderQty) * 100).toFixed(0);
  // sechallanQty(data.challanqty);
  // setdeliveryPercent(((orderQty-challanQty)*100))


// console.log(index); 
  
<<<<<<< HEAD
  return (
    <>
   
=======
  const getId = () =>{

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
        <td className=''>{data.BreakDownQTY.toFixed(2)}</td>
        <td className=''>{data.challanqty.toFixed(2)}</td>
        <td className=''>{(data.challanqty.toFixed(2) / data.BreakDownQTY.toFixed(2)) * 100}</td>
        <th>
          <SingleOrderContent data={data.WorkOrderNo}></SingleOrderContent>
        </th>
      </tr>
>>>>>>> 97bec7201a2d3972e480043b20e3a898de328997

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
      <td>
        {data.CustomerName}
        <br />
        <span className="badge badge-ghost badge-sm font-bold">
          Buyer: <span className="text-blue-500">{data.Buyer}</span>
        </span>
      </td>
      <td>{orderQty}</td>
      <td>{challanQty}</td>
      <td className={`${deliveryPercent == 100 ? "text-green-700" : "text-red-600"} `}>{deliveryPercent}%</td>
      <th>
        <SingleOrderContent data={data.WorkOrderNo} />
      </th>
    </tr>

    </>
  )
}

export default TableRow
