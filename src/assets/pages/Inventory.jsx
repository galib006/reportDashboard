import React, { useContext, useState } from "react";
import { GetDataContext } from "../components/DataContext";
import DateRangePicker from "../components/DatePickerData";
import axios from "axios";
import { toast } from "react-toastify";

function Inventory() {
  const { cndata, setcndata, setLoading } = useContext(GetDataContext);
  const apiKey = localStorage.getItem("apiKey");
  const [mtName, setmtName] = useState([]);

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
      const [res1, res2] = await axios.all([
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
      ]);

      const r1 = res1.data;
      const r2 = res2.data;

      const matched = r1.filter((data) =>
        r2.some((r) => r.MaterialName === data.MaterialName)
      );
      const unmatched = r1.filter(
        (data) => !r2.some((r) => r.MaterialName === data.MaterialName)
      );
      const grpData = [...matched, ...unmatched];
      // console.log(grpData);
      const itemName = [...new Set(grpData.map((data) => data.MaterialName))];

      setmtName(itemName);

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
      <table>
        {mtName.map((item, idx) => (
          <tr key={idx} className="border border-amber-950">
            <td className="border border-amber-950">{idx + 1}</td>
            <td className="border border-amber-950">{item}</td>
          </tr>
        ))}
        <tr></tr>
      </table>
    </>
  );
}

export default Inventory;
