import React, { useContext, useEffect, useMemo, useState } from "react";
import DateRangePicker from "../components/DatePickerData";
import { GetDataContext } from "../components/DataContext";
import axios from "axios";
import { toast } from "react-toastify";
import { FourSquare } from "react-loading-indicators";
import * as XLSX from "xlsx";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

function CompactInventoryReport() {
  const { cndata, setcndata, loading, setLoading } = useContext(GetDataContext);
  const [searchText, setSearchText] = useState("");
  const [expandedItems, setExpandedItems] = useState({}); // Expand/Collapse

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

        // Aggregate by IssueNo
        const issuesMap = {};
        filteredItems.forEach((d) => {
          const qty = Number(d.IssueQTY) || 0;
          if (!issuesMap[d.IssueNo]) {
            issuesMap[d.IssueNo] = {
              IssueNo: d.IssueNo,
              IssueQty: qty,
              IssueDate: d.IssueDate,
              RequisitionNo: d.RequisitionNo,
              Unit: d.Unit || ""
            };
          } else {
            issuesMap[d.IssueNo].IssueQty += qty;
          }
        });

        const totalRequired = filteredItems.reduce((s, d) => s + (Number(d.RequiredQTY) || 0), 0);
        const totalIssued = Object.values(issuesMap).reduce((s, i) => s + i.IssueQty, 0);
        const pending = totalRequired - totalIssued;

        return {
          Material: mat,
          TotalRequired: totalRequired,
          TotalIssued: totalIssued,
          Pending: pending,
          Issues: Object.values(issuesMap)
        };
      });

      return { CostCenter: cc, Items: items };
    });
  }, [cndata.inventory, searchText]);

  const exportExcelAdvanced = (structuredData) => {
    const wb = XLSX.utils.book_new();
    structuredData.forEach((sec) => {
      const sheetData = [];
      sec.Items.forEach((item) => {
        item.Issues?.forEach((iss) => {
          sheetData.push({
            Section: sec.CostCenter,
            Material: item.Material,
            Unit: iss.Unit,
            RequisitionNo: iss.RequisitionNo,
            IssueNo: iss.IssueNo,
            IssueQty: iss.IssueQty,
            IssueDate: iss.IssueDate ? new Date(iss.IssueDate).toLocaleDateString("en-GB") : "",
          });
        });
      });
      const ws = XLSX.utils.json_to_sheet(sheetData);
      XLSX.utils.book_append_sheet(wb, ws, sec.CostCenter.substring(0, 31));
    });
    XLSX.writeFile(wb, "Compact_Inventory_Report.xlsx");
  };

  const toggleItem = (material) => {
    setExpandedItems((prev) => ({ ...prev, [material]: !prev[material] }));
  };

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          InvIssue();
        }}
      >
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
        <button className="btn btn-primary" onClick={() => exportExcelAdvanced(UseData)}>
          Export Excel
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-screen">
          <FourSquare color="#32cd32" size="large" />
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {UseData.map((cc, ccIdx) => (
            <div key={ccIdx} className="border rounded p-3 shadow-sm">
              <h2 className="font-bold text-xl mb-2 bg-blue-500 text-white p-2 rounded">{cc.CostCenter}</h2>
              {cc.Items.map((item) => {
                const isExpanded = expandedItems[item.Material] ?? true;
                const pieData = {
                  labels: [...item.Issues.map((i) => `Issue ${i.IssueNo}`), "Pending"],
                  datasets: [
                    {
                      data: [...item.Issues.map((i) => i.IssueQty), item.Pending],
                      backgroundColor: [
                        ...item.Issues.map((i) => i.IssueQty >= item.TotalRequired ? "#2ecc71" : "#3498db"),
                        "#e5e5e5", // Pending
                      ],
                      hoverOffset: 6,
                    },
                  ],
                };

                return (
                  <div key={item.Material} className="mb-4 border rounded p-2 bg-gray-50">
                    <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleItem(item.Material)}>
                      <h3 className="font-semibold mb-2 text-lg">{item.Material}</h3>
                      <button className="btn btn-sm">{isExpanded ? "Collapse" : "Expand"}</button>
                    </div>

                    {isExpanded && (
                      <div className="md:flex md:gap-4">
                        <div className="md:w-1/3">
                          <Pie
                            data={pieData}
                            options={{
                              responsive: true,
                              plugins: {
                                tooltip: {
                                  callbacks: {
                                    label: function (context) {
                                      const idx = context.dataIndex;
                                      if (idx < item.Issues.length) {
                                        const issue = item.Issues[idx];
                                        const percent = ((issue.IssueQty / item.TotalRequired) * 100).toFixed(1);
                                        return `IssueNo: ${issue.IssueNo}, Qty: ${issue.IssueQty}, Date: ${new Date(issue.IssueDate).toLocaleDateString()}, ${percent}%`;
                                      } else {
                                        const percent = ((item.Pending / item.TotalRequired) * 100).toFixed(1);
                                        return `Pending: ${item.Pending} (${percent}%)`;
                                      }
                                    },
                                  },
                                },
                                legend: { position: "bottom" },
                              },
                            }}
                            height={150}
                          />
                        </div>
                        <div className="md:w-2/3 mt-2 md:mt-0">
                          <div className="overflow-x-auto border rounded bg-white">
                            <table className="min-w-full text-sm">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="p-1 border">Req No</th>
                                  <th className="p-1 border">Req Qty</th>
                                  <th className="p-1 border">Req Date</th>
                                  <th className="p-1 border">Issue No</th>
                                  <th className="p-1 border">Issue Qty</th>
                                  <th className="p-1 border">Issue Date</th>
                                  <th className="p-1 border">Unit</th>
                                </tr>
                              </thead>
                              <tbody>
                                {item.Issues.map((iss) => (
                                  <tr key={iss.IssueNo} className="border-b hover:bg-gray-50">
                                    <td className="p-1 border">{iss.RequisitionNo}</td>
                                    <td className="p-1 border">{iss.IssueQty}</td>
                                    <td className="p-1 border">{new Date(iss.IssueDate).toLocaleDateString()}</td>
                                    <td className="p-1 border">{iss.IssueNo}</td>
                                    <td className="p-1 border">{iss.IssueQty}</td>
                                    <td className="p-1 border">{new Date(iss.IssueDate).toLocaleDateString()}</td>
                                    <td className="p-1 border">{iss.Unit}</td>
                                  </tr>
                                ))}
                                {item.Pending > 0 && (
                                  <tr className="bg-yellow-50">
                                    <td className="p-1 border" colSpan={2}><b>Pending</b></td>
                                    <td className="p-1 border">-</td>
                                    <td className="p-1 border">-</td>
                                    <td className="p-1 border">{item.Pending}</td>
                                    <td className="p-1 border">-</td>
                                    <td className="p-1 border">-</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
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

export default CompactInventoryReport;
