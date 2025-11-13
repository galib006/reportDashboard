import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

export const GetDataContext = createContext();

function DataContext({ children }) {
  const [cndata, setcndata] = useState([]);
  const [loading, setLoading] = useState(false); // 🔹 loading state

  useEffect(() => {
    const apiKey = localStorage.getItem("apiKey");
    if (!apiKey) return; // যদি key না থাকে, fetch skip করবে

    setLoading(true); // 🔹 spinner start

    axios
      .get(
        "https://tpl-api.ebs365.info/api/OrderReport/BI_OrderRelatedInformationReport?CompanyID=1&ProductCategoryID=0&ProductSubCategoryID=0&MarketingID=0&CustomerID=0&BuyerID=0&JobCardID=0&StartDate=2025-10-27T15:05:04.149Z&EndDate=2025-11-13T15:05:04.149Z&CommandID=5&EmpID=0",
        {
          headers: {
            Authorization: `Bearer ${apiKey}`, // 🔹 Bearer token fix
          },
        }
      )
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

  return (
    <GetDataContext.Provider value={{ cndata, setcndata, loading }}>
      {children}
    </GetDataContext.Provider>
  );
}

export default DataContext;
