// FullAdvancedInventoryIssue_CompleteGreen.jsx

import React, { useContext, useMemo, useState } from "react";
import DateRangePicker from "../components/DatePickerData";
import { GetDataContext } from "../components/DataContext";
import axios from "axios";
import { toast } from "react-toastify";
import { FourSquare } from "react-loading-indicators";
import * as XLSX from "xlsx";

import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

function FullAdvancedInventoryIssue_CompleteGreen() {
  const { cndata, setcndata, loading, setLoading } = useContext(GetDataContext);
  const [searchText, setSearchText] = useState("");
  const [filterSection, setFilterSection] = useState("all");
  const [filterItem, setFilterItem] = useState("all");
  const [expandedPie, setExpandedPie] = useState({});

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
    const filteredData = data.filter((d) => {
      const sectionMatch = filterSection === "all" || d.CostCenterName === filterSection;
      const itemMatch = filterItem === "all" || d.MaterialName === filterItem;
      const searchMatch =
        d.CostCenterName.toLowerCase().includes(searchText.toLowerCase()) ||
        d.MaterialName.toLowerCase().includes(searchText.toLowerCase());
      return sectionMatch && itemMatch && searchMatch;
    });

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
            PendingPercent: ((pendingQty / requiredQty) * 100).toFixed(2),
            Issues: Object.values(issuesMap),
            Unit: reqData[0]?.Unit || "",
          };
        });

        return { Material: mat, Requisitions: requisitions };
      });

      return { CostCenter: cc, Items: items };
    });
  }, [cndata.inventory, searchText, filterSection, filterItem]);

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
              PendingPercent: req.PendingPercent,
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

  const getItemPieData = (reqs) => {
    let totalPending = 0;
    let totalIssued = 0;
    const issues = [];

    reqs.forEach((req) => {
      totalPending += req.PendingQty;
      req.Issues.forEach((iss) => {
        totalIssued += iss.IssueQty;
        issues.push({ label: `Issue ${iss.IssueNo}`, qty: iss.IssueQty });
      });
    });

    const labels = ["Pending", ...issues.map((i) => i.label)];
    const data = [totalPending, ...issues.map((i) => i.qty)];

    const colors = [
      totalIssued >= totalPending + totalIssued ? "green" : "red", // Pending
      ...issues.map((i) => (i.qty / (totalIssued + totalPending) >= 1 ? "green" : "#007bff")),
    ];

    return { labels, datasets: [{ data, backgroundColor: colors }] };
  };

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          InvIssue();
        }}
      >
        <div className="flex flex-wrap justify-center items-center gap-4">
          <DateRangePicker />
          <input type="submit" value="Submit" className="btn btn-success" />
        </div>
      </form>

      <div className="mt-5 flex flex-wrap gap-2 mb-4 items-center">
        <input
          type="text"
          placeholder="Search Section / Material"
          className="input input-bordered"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />

        <select className="select select-bordered" value={filterSection} onChange={(e) => setFilterSection(e.target.value)}>
          <option value="all">All Sections</option>
          {[...new Set(cndata.inventory?.map((i) => i.CostCenterName) || [])].map((sec) => (
            <option key={sec} value={sec}>{sec}</option>
          ))}
        </select>

        <select className="select select-bordered" value={filterItem} onChange={(e) => setFilterItem(e.target.value)}>
          <option value="all">All Items</option>
          {[...new Set(cndata.inventory?.map((i) => i.MaterialName) || [])].map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>

        <button className="btn btn-primary" onClick={() => exportExcel(UseData)}>Export Excel</button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-screen">
          <FourSquare color="#32cd32" size="large" />
        </div>
      ) : (
        <div className="mt-5 space-y-6">
          {UseData.map((cc, ccIdx) => (
            <div key={ccIdx} className="border rounded p-2">
              <h2 className="font-bold text-xl mb-2 bg-blue-500 text-white p-2">{cc.CostCenter}</h2>

              {cc.Items.map((item, idx) => (
                <div key={idx} className="border rounded p-2 mb-4">
                  <h3
                    className="font-semibold mb-2 cursor-pointer text-blue-700 hover:underline"
                    onClick={() => setExpandedPie((prev) => ({ ...prev, [item.Material]: !prev[item.Material] }))}
                  >
                    {item.Material} {expandedPie[item.Material] ? "▲" : "▼"}
                  </h3>

                  {expandedPie[item.Material] && (
                    <div className="w-full max-w-sm mb-2">
                      <Pie
                        data={getItemPieData(item.Requisitions)}
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
                  )}

                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-300">
                      <thead className="bg-gray-100 text-gray-700 text-sm">
                        <tr>
                          <th className="p-2 border">Req No</th>
                          <th className="p-2 border">Req Date</th>
                          <th className="p-2 border">Req Qty</th>
                          <th className="p-2 border">Pending Qty</th>
                          <th className="p-2 border">Pending %</th>
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
                                  <td className="p-2 border" rowSpan={req.Issues.length}>{req.PendingPercent}%</td>
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
              ))}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default FullAdvancedInventoryIssue_CompleteGreen;
