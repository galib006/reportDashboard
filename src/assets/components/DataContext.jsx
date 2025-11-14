import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

export const GetDataContext = createContext();

function DataContext({ children }) {
  const [cndata, setcndata] = useState([]);
  const [loading, setLoading] = useState(false); // 🔹 loading state

  const StartDate = cndata.startDate;
  let stDate = null;

  if (StartDate) {
    const d = new Date(StartDate);
    if (!isNaN(d.getTime())) {
      // valid date check
      stDate = d.toISOString();
    } else {
      console.error("Invalid StartDate:", StartDate);
    }
  } else {
    console.error("StartDate is missing");
  }

  const endDate = cndata.endDate;
  let edDate = null;

  if (endDate) {
    const d = new Date(endDate);
    if (!isNaN(d.getTime())) {
      edDate = d.toISOString();
    } else {
      console.error("Invalid endDate:", endDate);
    }
  } else {
    console.error("endDate is missing");
  }

  useEffect(() => {
    const apiKey = localStorage.getItem("apiKey");
    console.log();

    if (!apiKey) return; // যদি key না থাকে, fetch skip করবে

    setLoading(true); // 🔹 spinner start

    axios
      .get(
        `https://tpl-api.ebs365.info/api/OrderReport/BI_OrderRelatedInformationReport?CompanyID=1&ProductCategoryID=0&ProductSubCategoryID=0&MarketingID=0&CustomerID=0&BuyerID=0&JobCardID=0&StartDate=${stDate}&EndDate=${edDate}&CommandID=5&EmpID=0`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`, // 🔹 Bearer token fix
          },
        }
      )
      // .get("data.json")
      .then((response) => {
        const data = response.data;

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
      .catch(console.log)
      .finally(() => setLoading(false)); // 🔹 spinner stop
  }, []);
  // console.log(StartDate);

  return (
    <GetDataContext.Provider value={{ cndata, setcndata, loading }}>
      {children}
    </GetDataContext.Provider>
  );
}

export default DataContext;
