import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

export const GetDataContext = createContext();

function DataContext({ children }) {
  const [cndata, setcndata] = useState([]);

  useEffect(() => {
    axios.get("/public/data.json")
      .then((response) => {
        const data = response.data;
        const groupedData = Object.values(
          data.reduce((acc, item) => {
            const key = item.WorkOrderNo;
            const formateDate = new Date(item.OrderReceiveDate).toLocaleDateString('en-GB');
            if (!acc[key]) {
              acc[key] = {
                WorkOrderNo: item.WorkOrderNo,
                challanqty: 0,
                BreakDownQTY: 0,
                TotalOrderValue: 0,
                ChallanValue: 0,
                BalanceQTY: 0,
                BalanceValue: 0,
                OrderReceiveDate: formateDate
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
      .catch(console.log);
  }, []);

  return (
    <GetDataContext.Provider value={{ cndata, setcndata }}>
      {children}
    </GetDataContext.Provider>
  );
}

export default DataContext;
