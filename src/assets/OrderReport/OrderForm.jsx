import React, { useContext } from "react";
import DateRangePicker from "../components/DatePickerData";
import axios from "axios";
import { GetDataContext } from "../components/DataContext";

function OrderForm() {
  const { cndata, setcndata, setLoading } = useContext(GetDataContext);
  const apiKey = localStorage.getItem("apiKey");

  const dateSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    if (!cndata?.startDate || !cndata?.endDate) {
      console.log("Missing Date");
      return;
    }

    const stDate = cndata.startDate.toISOString().split("T")[0];
    const edDate = cndata.endDate.toISOString().split("T")[0];

    axios
      .all([
        axios.get(
          `https://tpl-api.ebs365.info/api/OrderReport/BI_OrderRelatedInformationReport?CompanyID=1&ProductCategoryID=0&ProductSubCategoryID=0&MarketingID=0&CustomerID=0&BuyerID=0&JobCardID=0&StartDate=${stDate}&EndDate=${edDate}&CommandID=5&EmpID=0`,
          {
            headers: {
              Authorization: `${apiKey}`,
            },
          }
        ),

        axios.get(
          `https://tpl-api.ebs365.info/api/InventoryBI/SCM_GetMaterialReceiveDetail?CompanyID=1&ParentCategoryID=6&CategoryID=0&SubCategoryID=0&MainMaterialID=0&StartDate=${stDate}&EndDate=${edDate}&CommandID=0`,
          {
            headers: {
              Authorization: `${apiKey}`,
            },
          }
        ),
      ])
      .then(
        axios.spread((response, res2) => {
          const data = response.data;
          console.log(response);

          const groupedData = Object.values(
            data.reduce((acc, item) => {
              const key = item.WorkOrderNo;
              const formateDate = new Date(
                item.OrderReceiveDate
              ).toLocaleDateString("en-GB");

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
        })
      )
      .catch((err) => console.log(err))
      .finally(() => setLoading(false));
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
    </>
  );
}

export default OrderForm;
