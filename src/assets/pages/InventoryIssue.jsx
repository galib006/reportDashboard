// AdvancedInventoryIssue.jsx

import React, { useContext, useMemo, useState } from "react";
import DateRangePicker from "../components/DatePickerData";
import { GetDataContext } from "../components/DataContext";
import axios from "axios";
import { toast } from "react-toastify";
import { FourSquare } from "react-loading-indicators";
import * as XLSX from "xlsx";

import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

function AdvancedInventoryIssue() {
  const { cndata, setcndata, loading, setLoading } = useContext(GetDataContext);
  const [searchText, setSearchText] = useState("");

  const stDate = cndata?.startDate ? cndata.startDate.toISOString().split("T")[0] : "";
  const edDate = cndata?.endDate ? cndata.endDate.toISOString().split("T")[0] : "";
  const apiKey = localStorage.getItem("apiKey");

  const InvIssue = async () => {
    if (!cndata.startDate || !cndata.endDate) {
      toast.error("Please Select Start & End Date");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(
        `https://tpl-api.ebs365.info/api/InventoryBI/SCM_GET_MaterialIssueDetail?CompanyID=1&ParentCategoryID=6&CategoryID=0&SubCategoryID=0&MainMaterialID=0&StartDate=${stDate}&EndDate=${edDate}&CommandID=2`,
        { headers: { Authorization: `${apiKey}` } }
      );
      setcndata((prev) => ({ ...prev, inventory: res.data }));
    } catch (err) {
      console.log("API ERROR:", err);
      toast.error(err.response?.data?.message || "Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  const UseData = useMemo(() => {
    const data = cndata.inventory || [];
    const filteredData = searchText
      ? data.filter(
          (d) =>
            d.CostCenterName.toLowerCase().includes(searchText.toLowerCase()) ||
            d.MaterialName.toLowerCase().includes(searchText.toLowerCase())
        )
      : data;

    const costCenters = [...new Set(filteredData.map((i) => i.CostCenterName))].sort();

    return costCenters.map((cc) => {
      const materials = [...new Set(filteredData.filter((i) => i.CostCenterName === cc).map((i) => i.MaterialName))];

      const items = materials.map((mat) => {
        const filteredItems = filteredData.filter((i) => i.CostCenterName === cc && i.MaterialName === mat);

        const requisitions = [...new Set(filteredItems.map((i) => i.RequisitionNo))].map((reqNo) => {
          const reqData = filteredItems.filter((i) => i.RequisitionNo === reqNo);
          const issuesMap = {};

          reqData.forEach((d) => {
            const qty = d.IssueQTY ? parseFloat(d.IssueQTY) : 0;
            if (!issuesMap[d.IssueNo]) {
              issuesMap[d.IssueNo] = { IssueNo: d.IssueNo, IssueQty: qty, IssueDate: d.IssueDate };
            } else {
              issuesMap[d.IssueNo].IssueQty += qty;
            }
          });

          const requiredQty = reqData.reduce((s, d) => s + (Number(d.RequiredQTY) || 0), 0);
          const totalIssue = Object.values(issuesMap).reduce((s, i) => s + i.IssueQty, 0);
          const pendingQty = Math.max(requiredQty - totalIssue, 0);

          return {
            RequisitionNo: reqNo,
            RequisitionDate: reqData[0]?.RequisitionDate,
            RequiredQty: requiredQty,
            PendingQty: pendingQty,
            Issues: Object.values(issuesMap),
            Unit: reqData[0]?.Unit || ""
          };
        });

        return { Material: mat, Requisitions: requisitions };
      });

      return { CostCenter: cc, Items: items };
    });
  }, [cndata.inventory, searchText]);

  const exportExcel = (structuredData) => {
    const wb = XLSX.utils.book_new();
    structuredData.forEach((sec) => {
      const sheetData = [];
      sec.Items.forEach((item) => {
        item.Requisitions.forEach((req) => {
          req.Issues.forEach((iss) => {
            sheetData.push({
              Section: sec.CostCenter,
              Material: item.Material,
              Unit: req.Unit,
              RequisitionNo: req.RequisitionNo,
              RequisitionDate: req.RequisitionDate ? new Date(req.RequisitionDate).toLocaleDateString("en-GB") : "",
              RequiredQty: req.RequiredQty,
              PendingQty: req.PendingQty,
              IssueNo: iss.IssueNo,
              IssueQty: iss.IssueQty,
              IssueDate: iss.IssueDate ? new Date(iss.IssueDate).toLocaleDateString("en-GB") : "",
            });
          });
        });
      });
      const ws = XLSX.utils.json_to_sheet(sheetData);
      XLSX.utils.book_append_sheet(wb, ws, sec.CostCenter.substring(0, 31));
    });
    XLSX.writeFile(wb, "Advanced_Inventory_Report.xlsx");
  };

  return (
    <>
      <form onSubmit={(e) => { e.preventDefault(); InvIssue(); }}>
        <div className="flex justify-center items-center gap-4">
          <DateRangePicker />
          <input type="submit" value="Submit" className="btn btn-success" />
        </div>
      </form>

      <div className="mt-5 flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Search Section / Material"
          className="input input-bordered"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <button className="btn btn-primary" onClick={() => exportExcel(UseData)}>Export Excel</button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-screen">
          <FourSquare color="#32cd32" size="large" />
        </div>
      ) : (
        <div className="mt-5">
          {UseData.map((cc, ccIdx) => (
            <div key={ccIdx} className="mb-6 border rounded p-2">
              <h2 className="font-bold text-xl mb-2 bg-blue-500 text-white p-2">{cc.CostCenter}</h2>
              {cc.Items.map((item, idx) => {
                // Aggregate all requisitions for this item into a single pie chart
                const pieLabels = [];
                const pieData = [];
                const pieColors = [];
                const issuesTooltip = [];

                item.Requisitions.forEach((req) => {
                  // Pending
                  if (req.PendingQty > 0) {
                    pieLabels.push("Pending");
                    pieData.push(req.PendingQty);
                    pieColors.push("red");
                    issuesTooltip.push(`Pending Qty: ${req.PendingQty}`);
                  }

                  // Issues
                  req.Issues.forEach((iss) => {
                    pieLabels.push(`Issue ${iss.IssueNo}`);
                    pieData.push(iss.IssueQty);
                    pieColors.push(iss.IssueQty >= req.RequiredQty ? "green" : "#007bff");
                    issuesTooltip.push(`Issue ${iss.IssueNo} | Qty: ${iss.IssueQty} | Date: ${iss.IssueDate}`);
                  });
                });

                return (
                  <div key={idx} className="mb-4 border p-2 rounded">
                    <h3 className="font-semibold mb-2">{item.Material}</h3>

                    {/* Single Pie Chart per Item */}
                    <div className="w-full max-w-sm mx-auto mb-4">
                      <Pie
                        data={{ labels: pieLabels, datasets: [{ data: pieData, backgroundColor: pieColors }] }}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: { position: "bottom" },
                            tooltip: {
                              callbacks: {
                                label: function (context) {
                                  const val = context.raw;
                                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                  const perc = ((val / total) * 100).toFixed(2);
                                  return `${context.label}: ${val} (${perc}%)`;
                                },
                              },
                            },
                            datalabels: {
                              display: true,
                              formatter: (value, context) => {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                return ((value / total) * 100).toFixed(1) + "%";
                              },
                              color: "#fff",
                              font: { weight: "bold", size: 12 },
                            },
                          },
                        }}
                      />
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                      <table className="min-w-full border border-gray-300">
                        <thead className="bg-gray-100 text-gray-700 text-sm">
                          <tr>
                            <th className="p-2 border">Req No</th>
                            <th className="p-2 border">Req Date</th>
                            <th className="p-2 border">Req Qty</th>
                            <th className="p-2 border">Pending Qty</th>
                            <th className="p-2 border">Unit</th>
                            <th className="p-2 border">Issue No</th>
                            <th className="p-2 border">Issue Date</th>
                            <th className="p-2 border">Issue Qty</th>
                          </tr>
                        </thead>
                        <tbody>
                          {item.Requisitions.map((req) =>
                            req.Issues.map((iss, iIdx) => (
                              <tr key={`${req.RequisitionNo}-${iss.IssueNo}`} className="odd:bg-white even:bg-gray-50">
                                {iIdx === 0 && (
                                  <>
                                    <td className="p-2 border" rowSpan={req.Issues.length}>{req.RequisitionNo}</td>
                                    <td className="p-2 border" rowSpan={req.Issues.length}>{req.RequisitionDate ? new Date(req.RequisitionDate).toLocaleDateString("en-GB") : ""}</td>
                                    <td className="p-2 border" rowSpan={req.Issues.length}>{req.RequiredQty}</td>
                                    <td className="p-2 border" rowSpan={req.Issues.length}>{req.PendingQty}</td>
                                    <td className="p-2 border" rowSpan={req.Issues.length}>{req.Unit}</td>
                                  </>
                                )}
                                <td className="p-2 border">{iss.IssueNo}</td>
                                <td className="p-2 border">{iss.IssueDate ? new Date(iss.IssueDate).toLocaleDateString("en-GB") : ""}</td>
                                <td className="p-2 border">{iss.IssueQty}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default AdvancedInventoryIssue;
