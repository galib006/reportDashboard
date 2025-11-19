import React, { useContext, useState } from "react";
import { GetDataContext } from "../components/DataContext";
import DateRangePicker from "../components/DatePickerData";
import axios from "axios";
import { toast } from "react-toastify";

function Inventory() {
  const { cndata, setcndata, setLoading } = useContext(GetDataContext);
  const apiKey = localStorage.getItem("apiKey");
  const [materialDB, setmaterialDB] = useState();
  const [materialInfo, setmaterialInfo] = useState([]);
  const [materialTotalreceive, setmaterialTotalreceive] = useState(0);

  const dateSubmit = async (e) => {
    e.preventDefault();

    if (!cndata?.startDate || !cndata?.endDate) {
      toast.error("Please select start & end date!");
      return;
    }

    setLoading(true);

    const stDate = cndata.startDate.toISOString().split("T")[0];
    const edDate = cndata.endDate.toISOString().split("T")[0];

    try {
      const [res1, res2, res3] = await axios.all([
        axios.get(
          `https://tpl-api.ebs365.info/api/InventoryBI/SCM_GetMaterialReceiveDetail?CompanyID=1&ParentCategoryID=6&CategoryID=0&SubCategoryID=0&MainMaterialID=0&StartDate=${stDate}&EndDate=${edDate}&CommandID=0`,
          {
            headers: { Authorization: `${apiKey}` },
          }
        ),

        axios.get(
          `https://tpl-api.ebs365.info/api/InventoryBI/SCM_GET_MaterialIssueDetail?CompanyID=1&ParentCategoryID=6&CategoryID=0&SubCategoryID=0&MainMaterialID=0&StartDate=${stDate}&EndDate=${edDate}&CommandID=2`,
          {
            headers: { Authorization: `${apiKey}` },
          }
        ),
        axios.get(
          `https://tpl-api.ebs365.info/api/InventoryBI/BI_SCM_GETInventoryStatement?CompanyID=1&ParentCategoryID=6&CategoryID=0&SubCategoryID=0&MaterialID=0&StartDate=${stDate}&EndDate=${edDate}&CommandID=2&EmpID=0`,
          {
            headers: { Authorization: `${apiKey}` },
          }
        ),
      ]);

      const r1 = res1.data;
      const r2 = res2.data;
      const r3 = res3.data;
      const item = r3.map((item, idx) => ({
        itemName: item.MaterialName,
        Balance: item.BalanceQTY,
      }));
      // console.log(item);

      // const matched = r1.filter((data) =>
      //   r2.some((r) => r.MaterialName === data.MaterialName)
      // );
      // const unmatched = r1.filter(
      //   (data) => !r2.some((r) => r.MaterialName === data.MaterialName)
      // );
      // const grpData = [...matched, ...unmatched];
      // // console.log(grpData);
      // const itemName = [...new Set(grpData.map((data) => data.MaterialName))];
      setmaterialDB(item);
      console.log(materialDB);
      const data = 0;
      const mtl = Object.values(item).map((item, idx) => {
        const Receive = r1.filter((dd) => dd.MaterialName === item.itemName);
        const Issue = r2.filter((dd) => dd.MaterialName === item.itemName);
        const itemWiseTotalrcv = Receive.map((i) => i.ActualReceiveQTY).reduce(
          (acc, value) => acc + value,
          0
        );
        const itemRcvQtyTotal = Number(itemWiseTotalrcv).toFixed(2);
        const itemissueQty = Issue.map((i) => i.IssueQTY).reduce(
          (acc, sum) => acc + sum,
          0
        );
        const issueItemTotal = Number(itemissueQty).toFixed(2);
        return {
          itemName: item.itemName,
          Balance: item.Balance,
          Receive,
          Issue,
          itemRcvQtyTotal,
          issueItemTotal,
        };
      });

      setmaterialInfo(mtl);
      console.log(mtl);
      // const mergeData = {
      //   Matched: fldata,
      //   Issue: r2,
      // };
      // console.log(unmatched);

      // console.log(mergeData);
    } catch (err) {
      console.log("ERROR:", err);

      if (err.response?.status === 401) {
        toast.error("Unauthorized! Your session has expired.");
      } else {
        toast.error(err.response?.data?.message || "Something went wrong!");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form
        onSubmit={dateSubmit}
        className="flex gap-5 justify-center items-center"
      >
        <DateRangePicker />
        <input type="submit" value="Submit" className="btn btn-info" />
      </form>
      <div className="overflow-x-auto">
        <table className="table table-zebra" border="1">
          {/* head */}
          <thead>
            <tr>
              <th>SL.</th>
              <th>Item Name</th>
              <th>Balance</th>
              <th>Gap</th>
              <th>Receive</th>
              <th>Issue</th>
            </tr>
          </thead>
          <tbody>
            {materialInfo.map((item, idx) => (
              <tr
                key={idx}
                className="border border-amber-950 hover:bg-base-300"
              >
                <td className="border border-amber-950 text-center">
                  {idx + 1}
                </td>
                <td className="border border-amber-950">{item.itemName}</td>
                <td className="border border-amber-950">{item.Balance}</td>

                <td
                  className={`border border-amber-950 ${
                    Number(item.itemRcvQtyTotal - item.issueItemTotal) >= 0
                      ? ""
                      : "text-red-600 text-2xl font-bold"
                  }`}
                >
                  {Number(item.itemRcvQtyTotal - item.issueItemTotal)}
                </td>
                <td className=" m-0 p-0 gap-0">
                  <table>
                    <thead>
                      <tr>
                        <th className="text-center border border-amber-950 hover:bg-base-300">
                          SL.
                        </th>
                        <th className="text-center border border-amber-950 hover:bg-base-300">
                          QTY
                        </th>
                        <th className="text-center border border-amber-950 hover:bg-base-300">
                          Date
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {item.Receive.map((item, idx) => (
                        <tr key={idx}>
                          <td className="border border-amber-950 hover:bg-base-300">
                            {idx + 1}
                          </td>
                          <td className="border border-amber-950 hover:bg-base-300">
                            {item.ActualReceiveQTY}
                          </td>
                          <td className="border border-amber-950 hover:bg-base-300">
                            {item.GRNDate}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td>Total:</td>
                        <td>{item.itemRcvQtyTotal}</td>
                      </tr>
                    </tfoot>
                  </table>
                </td>

                <td>
                  <table>
                    <thead>
                      <tr>
                        <th className="border border-amber-950 hover:bg-base-300 text-center">
                          SL.
                        </th>
                        <th className="border border-amber-950 hover:bg-base-300 text-center">
                          QTY
                        </th>
                        <th className="border border-amber-950 hover:bg-base-300 text-center">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {item.Issue.map((item, idx) => (
                        <tr key={idx}>
                          <td className="border border-amber-950 hover:bg-base-300">
                            {idx + 1}
                          </td>
                          <td className="border border-amber-950 hover:bg-base-300">
                            {item.IssueQTY}
                          </td>
                          <td className="border border-amber-950 hover:bg-base-300">
                            {item.IssueDate}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td>Total:</td>
                        <td>{item.issueItemTotal}</td>
                      </tr>
                    </tfoot>
                  </table>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default Inventory;
