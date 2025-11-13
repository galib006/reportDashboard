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
          <thead>
            <tr>
              <th>SL.</th>
              <th>Style</th>
              <th>Color</th>
              <th>PO</th>
              <th>Description</th>
              <th>Order Qty</th>
              <th>Delivery Qty</th>
              <th>Balacne Qty</th>
              <th>Challan No.</th>
              <th>Challan Date</th>
            </tr>
          </thead>
          <tbody>
            {/* row 1 */}
            {sngData.matched.map((item, idx) => (
              <tr
                key={idx}
                className={
                  item.ChallanQTY < item.BreakDownQTY
                    ? "text-red-400"
                    : "text-gray-400"
                }
              >
                <th>{idx + 1}</th>
                <td>{item.KeyEntry1Value || "-"}</td>
                <td>{item.KeyEntry2Value || "-"}</td>
                <td>{item.KeyEntry3Value || "-"}</td>
                <td>{item.KeyEntry9Value || "-"}</td>
                <td>{item.BreakDownQTY}</td>
                <td>{item.ChallanQTY}</td>
                <td>{item.BreakDownQTY - item.ChallanQTY}</td>
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
            <tr>
              <th></th>
              <td></td>
              <td></td>
              <td>Total = </td>
              <td></td>
              <td>{sngData.Ordertotal}</td>
              <td>{sngData.Deliverytotal}</td>
              <td>{sngData.Balancetotal}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  );
}

export default SingleOrderData;
