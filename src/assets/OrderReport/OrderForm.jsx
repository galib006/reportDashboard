import React, { useContext } from "react";
import DateRangePicker from "../components/DatePickerData";
import axios from "axios";
import { GetDataContext } from "../components/DataContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function OrderForm() {
  const { cndata, setcndata, setLoading } = useContext(GetDataContext);
  const apiKey = localStorage.getItem("apiKey");

  const dateSubmit = async (e) => {
    e.preventDefault();

    if (!cndata?.startDate || !cndata?.endDate) {
      toast.error("Please select start and end date!");
      return;
    }

    setLoading(true);

    const stDate = cndata.startDate.toISOString().split("T")[0];
    const edDate = cndata.endDate.toISOString().split("T")[0];

    try {
      const [res1, res2, res3] = await axios.all([
        axios.get(
          `https://tpl-api.ebs365.info/api/OrderReport/BI_OrderRelatedInformationReport?CompanyID=1&ProductCategoryID=0&ProductSubCategoryID=0&MarketingID=0&CustomerID=0&BuyerID=0&JobCardID=0&StartDate=${stDate}&EndDate=${edDate}&CommandID=5&EmpID=0`,
          { headers: { Authorization: `${apiKey}` } }
        ),
        axios.get(
          `https://tpl-api.ebs365.info/api/InventoryBI/SCM_GetMaterialReceiveDetail?CompanyID=1&ParentCategoryID=6&CategoryID=0&SubCategoryID=0&MainMaterialID=0&StartDate=${stDate}&EndDate=${edDate}&CommandID=0`,
          { headers: { Authorization: `${apiKey}` } }
        ),
        axios.get(
          `https://tpl-api.ebs365.info/api/InventoryBI/SCM_GET_MaterialIssueDetail?CompanyID=1&ParentCategoryID=6&CategoryID=0&SubCategoryID=0&MainMaterialID=0&StartDate=${stDate}&EndDate=${edDate}&CommandID=2`,
          { headers: { Authorization: `${apiKey}` } }
        ),
      ]);

      const data = res1.data;
      const data2 = res2.data;
      const data3 = res3.data;

      // Purchase & Issue filtering example
      const groupPRandIssue = data2.filter((item) => item.MaterialName);
      console.log("Purchase & Issue Data:", groupPRandIssue);

      // Group Order Data
      const groupedData = Object.values(
        data.reduce((acc, item) => {
          const key = item.WorkOrderNo;
          const formateDate = new Date(item.OrderReceiveDate).toLocaleDateString("en-GB");

          if (!acc[key]) {
            acc[key] = {
              WorkOrderNo: item.WorkOrderNo,
              Buyer: item.BuyerName,
              Category: item.ProductCategoryName,
              challanqty: 0,
              BreakDownQTY: 0,
              TotalOrderValue: 0,
              ChallanValue: 0,
              BalanceQTY: 0,
              BalanceValue: 0,
              OrderReceiveDate: formateDate,
            };
          }

          acc[key].CustomerName = item.CName;
          acc[key].challanqty += Number(item.ChallanQTY);
          acc[key].BreakDownQTY += Number(item.BreakDownQTY || 0);
          acc[key].TotalOrderValue += Number(item.TotalOrderValue || 0);
          acc[key].ChallanValue += Number(item.ChallanValue || 0);
          acc[key].BalanceQTY += Number(item.BalanceQTY || 0);
          acc[key].BalanceValue += Number(item.BalanceValue || 0);

          return acc;
        }, {})
      );

      setcndata([{ groupedData, apiData: data }]);
      toast.success("Data fetched successfully!");
    } catch (err) {
      console.log("API ERROR:", err);

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
      <ToastContainer position="top-right" />
      <form onSubmit={dateSubmit} className="flex gap-5 justify-center items-center">
        <DateRangePicker />
        <input type="submit" value="Submit" className="btn btn-info" />
      </form>
    </>
  );
}

export default OrderForm;
