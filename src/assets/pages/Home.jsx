import React, { useContext, useEffect } from "react";
import BarChartData from "../components/BarChartData";
import Gtotal from "../components/Gtotal";
import { FaCartFlatbed } from "react-icons/fa6";
import { RiMoneyDollarCircleFill } from "react-icons/ri";
import { TbTruckDelivery } from "react-icons/tb";
import { GetDataContext } from "../components/DataContext";

function Home() {
  const { cndata } = useContext(GetDataContext);

  // Extract data safely
  const grpData = cndata[0]?.groupedData || [];

  // Compute grand totals
  const grandTotal = grpData.reduce(
    (acc, item) => {
      acc.TotalDOrderQTY += Number(item.BreakDownQTY);
      acc.TotalOrderValue += Number(item.TotalOrderValue);
      acc.TotalChallanQty += Number(item.challanqty);
      acc.TotalChallanValue += Number(item.ChallanValue);
      acc.TotalBalanceQTY += Number(item.BalanceQTY);
      acc.TotalBalanceValue += Number(item.BalanceValue);
      return acc;
    },
    {
      TotalDOrderQTY: 0,
      TotalOrderValue: 0,
      TotalChallanQty: 0,
      TotalChallanValue: 0,
      TotalBalanceQTY: 0,
      TotalBalanceValue: 0,
    }
  );

  useEffect(() => {
    console.log("cndata in Home:", cndata);
  }, [cndata]);

  return (
    <div>
      <div className="bg-[#3e939585]">
        <div className="mx-6 py-6">
          <div className="grid grid-cols-6 gap-5 my-3">
            <Gtotal
              title={"Order QTY"}
              Value={grandTotal.TotalDOrderQTY.toFixed(2)}
              fontStyle={"text-white"}
              bgStyle={"bg-blue"}
              Icons={<FaCartFlatbed />}
            />
            <Gtotal
              title={"Order Value"}
              Value={grandTotal.TotalOrderValue.toFixed(2)}
              sign={"$ "}
              fontStyle={"text-white"}
              bgStyle={"bg-blue"}
              Icons={<RiMoneyDollarCircleFill />}
            />
            <Gtotal
              title={"Sales QTY"}
              Value={grandTotal.TotalChallanQty.toFixed(2)}
              fontStyle={"text-white"}
              bgStyle={"bg-blue"}
              Icons={<TbTruckDelivery />}
            />
            <Gtotal
              title={"Sales Value"}
              Value={grandTotal.TotalChallanValue.toFixed(2)}
              sign={"$ "}
              fontStyle={"text-white"}
              bgStyle={"bg-blue"}
              Icons={<RiMoneyDollarCircleFill />}
            />
            <Gtotal
              title={"Balance QTY"}
              Value={grandTotal.TotalBalanceQTY.toFixed(2)}
              fontStyle={"text-white"}
              bgStyle={"bg-blue"}
              Icons={<FaCartFlatbed />}
            />
            <Gtotal
              title={"Balance Value"}
              Value={grandTotal.TotalBalanceValue.toFixed(2)}
              sign={"$ "}
              fontStyle={"text-white"}
              bgStyle={"bg-blue"}
              Icons={<RiMoneyDollarCircleFill />}
            />
             <Gtotal
              title={"Delivery Complete"}
              Value={((grandTotal.TotalChallanQty / grandTotal.TotalDOrderQTY) * 100).toFixed(0) + "%"}
              fontStyle={"text-white"}
              bgStyle={"bg-blue"}
              Icons={<FaCartFlatbed />}
            />
          </div>
        </div>
      </div>
      <BarChartData grpData={grpData} />
    </div>
  );
}

export default Home;
