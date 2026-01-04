import { useContext, useEffect, useState } from "react";
import { GetDataContext } from "../components/DataContext";

function SingleOrderData({ data }) {
  const { cndata } = useContext(GetDataContext);
  //  const grpData = cndata[0]?.groupedData || [];
  // const Balancetotal = matched.reduce((acc,item)=> acc + Number(item.ChallanQTY),0)
  const [sngData, setSngData] = useState({
    matched: [],
    Ordertotal: 0,
    Deliverytotal: 0,
    Balancetotal: 0,
  });
  const apiData = cndata[0]?.apiData || [];

  useEffect(() => {
    const matched = apiData.filter((dd) => dd.WorkOrderNo == data);
    const Ordertotal = matched.reduce(
      (acc, item) => acc + Number(item.BreakDownQTY),
      0
    );
    const Deliverytotal = matched.reduce(
      (acc, item) => acc + Number(item.ChallanQTY),
      0
    );
    const Balancetotal = Ordertotal - Deliverytotal;
    setSngData({ matched, Ordertotal, Deliverytotal, Balancetotal });
  }, [data, apiData]);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="table">
          {/* head */}
          <thead className="text-center">
            <tr>
              <th>SL.</th>
              <th>Style</th>
              <th>Color</th>
              <th>PO</th>
              <th>Key 7</th>
              <th>Description</th>
              <th className="text-right">Order Qty</th>
              <th className="text-right">Delivery Qty</th>
              <th className="text-right">Balacne Qty</th>
              <th>Challan No.</th>
              <th>Challan Date</th>
            </tr>
          </thead>
          <tbody className="text-cente">
            {/* row 1 */}
            {sngData.matched.map((item, idx) => (
              <tr
                key={idx}
                className={`text-center ${
                  item.ChallanQTY < item.BreakDownQTY
                    ? "text-red-400 hover:bg-gray-300"
                    : "text-gray-400 hover:bg-gray-300 hover:text-gray-600"
                }`}
              >
                <th>{idx + 1}</th>
                <td>{item.KeyEntry1Value || "-"}</td>
                <td>{item.KeyEntry2Value || "-"}</td>
                <td>{item.KeyEntry3Value || "-"}</td>
                <td>{item.KeyEntry7Value || "-"}</td>
                <td>{item.KeyEntry9Value || "-"}</td>
                <td className="text-right">{item.BreakDownQTY}</td>
                <td className="text-right">{item.ChallanQTY}</td>
                <td className="text-right">
                  {item.BreakDownQTY - item.ChallanQTY}
                </td>
                <td>{item.ChallanNo || "-"}</td>
                <td>
                  {item.ChallanDate
                    ? new Date(item.ChallanDate).toLocaleDateString("en-GB")
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="text-xl text-black font-bold">
              <th></th>
              <td></td>
              <td></td>
              <td></td>
              <td className="text-right">Total = </td>
              <td className="text-right">{sngData.Ordertotal}</td>
              <td className="text-right">{sngData.Deliverytotal}</td>
              <td className="text-right">{sngData.Balancetotal}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  );
}

export default SingleOrderData;
