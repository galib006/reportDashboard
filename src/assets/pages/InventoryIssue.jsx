// AdvancedInventoryIssueFull.jsx
import React, { useContext, useMemo, useState, useEffect } from "react";
import DateRangePicker from "../components/DatePickerData";
import { GetDataContext } from "../components/DataContext";
import axios from "axios";
import { toast } from "react-toastify";
import { FourSquare } from "react-loading-indicators";
import * as XLSX from "xlsx";

// Reusable ProgressBar Component
const ProgressBar = ({ issued, required }) => {
  const percent = required > 0 ? Math.min((issued / required) * 100, 100) : 0;
  let color = "bg-red-500";
  if (percent === 100) color = "bg-green-500";
  else if (percent > 0) color = "bg-yellow-500";
  return (
    <div className="w-full h-4 bg-gray-200 rounded overflow-hidden">
      <div className={`${color} h-4`} style={{ width: `${percent}%` }}></div>
    </div>
  );
};

// Requisition Block
const RequisitionBlock = ({ req, expandAll }) => {
  const [showIssues, setShowIssues] = useState(expandAll);
  useEffect(() => setShowIssues(expandAll), [expandAll]);
  return (
    <div className="border-b mb-2 pb-2">
      <div
        className="cursor-pointer font-semibold flex justify-between"
        onClick={() => setShowIssues(!showIssues)}
      >
        <p>
          Req No: {req.RequisitionNo} | Req Qty: {req.RequiredQty}
        </p>
        <p>{showIssues ? "▲" : "▼"}</p>
      </div>
      {showIssues &&
        req.Issues.map((iss, idx) => (
          <div key={idx} className="flex items-center gap-2 my-1">
            <p className="w-32 text-sm">Issue No: {iss.IssueNo}</p>
            <p className="w-20 text-sm">Qty: {iss.IssueQty}</p>
            <ProgressBar issued={iss.IssueQty} required={req.RequiredQty} />
          </div>
        ))}
    </div>
  );
};

// Material Block
const MaterialBlock = ({ item, expandAll }) => {
  const [showReqs, setShowReqs] = useState(expandAll);
  useEffect(() => setShowReqs(expandAll), [expandAll]);
  return (
    <div className="mb-4 border rounded p-2">
      <div
        className="font-semibold cursor-pointer"
        onClick={() => setShowReqs(!showReqs)}
      >
        {item.Material} {showReqs ? "▲" : "▼"}
      </div>
      {showReqs &&
        item.Requisitions.map((req, idx) => (
          <RequisitionBlock key={idx} req={req} expandAll={expandAll} />
        ))}
    </div>
  );
};

// Inventory Section
const InventorySection = ({ cc, expandAll }) => {
  return (
    <div className="mb-6 border rounded p-2">
      <h2 className="font-bold text-xl mb-2 bg-blue-500 text-white p-2">{cc.CostCenter}</h2>
      {cc.Items.map((item, idx) => (
        <MaterialBlock key={idx} item={item} expandAll={expandAll} />
      ))}
    </div>
  );
};

// Main Component
function AdvancedInventoryIssue() {
  const { cndata, setcndata, loading, setLoading } = useContext(GetDataContext);
  const [searchText, setSearchText] = useState("");
  const [expandAll, setExpandAll] = useState(true);

  const stDate = cndata?.startDate ? cndata.startDate.toISOString().split("T")[0] : "";
  const edDate = cndata?.endDate ? cndata.endDate.toISOString().split("T")[0] : "";
  const apiKey = localStorage.getItem("apiKey");

  // Fetch Data
  const InvIssue = async () => {
    if (!cndata.startDate || !cndata.endDate) {
      toast.error("Please select start & end date");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(
        `https://tpl-api.ebs365.info/api/InventoryBI/SCM_GET_MaterialIssueDetail?CompanyID=1&ParentCategoryID=6&CategoryID=0&SubCategoryID=0&MainMaterialID=0&StartDate=${stDate}&EndDate=${edDate}&CommandID=2`,
        { headers: { Authorization: `${apiKey}` } }
      );
      setcndata(prev => ({ ...prev, inventory: res.data }));
    } catch (err) {
      console.error("API ERROR:", err);
      toast.error(err.response?.data?.message || "Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  // Process Data
  const UseData = useMemo(() => {
    const data = cndata.inventory || [];
    const filteredData = searchText
      ? data.filter(d =>
          d.CostCenterName.toLowerCase().includes(searchText.toLowerCase()) ||
          d.MaterialName.toLowerCase().includes(searchText.toLowerCase())
        )
      : data;

    const costCenters = [...new Set(filteredData.map(i => i.CostCenterName))].sort();
    return costCenters.map(cc => {
      const materials = [...new Set(filteredData.filter(i => i.CostCenterName === cc).map(i => i.MaterialName))];
      const items = materials.map(mat => {
        const filteredItems = filteredData.filter(i => i.CostCenterName === cc && i.MaterialName === mat);
        const requisitions = [...new Set(filteredItems.map(i => i.RequisitionNo))].map(reqNo => {
          const reqData = filteredItems.filter(i => i.RequisitionNo === reqNo);
          const issuesMap = {};
          reqData.forEach(d => {
            const qty = d.IssueQTY ? parseFloat(d.IssueQTY) : 0;
            if (!issuesMap[d.IssueNo]) {
              issuesMap[d.IssueNo] = { IssueNo: d.IssueNo, IssueQty: qty, IssueDate: d.IssueDate };
            } else {
              issuesMap[d.IssueNo].IssueQty += qty;
            }
          });
          return {
            RequisitionNo: reqNo,
            RequisitionDate: reqData[0]?.RequisitionDate,
            RequiredQty: reqData.reduce((s,d)=>s + (Number(d.RequiredQTY)||0), 0),
            Issues: Object.values(issuesMap)
          };
        });
        return { Material: mat, Requisitions: requisitions };
      });
      return { CostCenter: cc, Items: items };
    });
  }, [cndata.inventory, searchText]);

  // Excel Export
  const exportExcelAdvanced = (structuredData) => {
    const wb = XLSX.utils.book_new();
    structuredData.forEach(sec => {
      const sheetData = [];
      sec.Items.forEach(item => {
        item.Requisitions.forEach(req => {
          req.Issues.forEach(iss => {
            sheetData.push({
              Section: sec.CostCenter,
              Material: item.Material,
              RequisitionNo: req.RequisitionNo,
              RequisitionDate: req.RequisitionDate ? new Date(req.RequisitionDate).toLocaleDateString('en-GB') : '',
              RequiredQty: req.RequiredQty,
              IssueNo: iss.IssueNo,
              IssueQty: iss.IssueQty,
              IssueDate: iss.IssueDate ? new Date(iss.IssueDate).toLocaleDateString('en-GB') : ''
            });
          });
        });
      });
      const ws = XLSX.utils.json_to_sheet(sheetData);
      XLSX.utils.book_append_sheet(wb, ws, sec.CostCenter.substring(0,31));
    });
    XLSX.writeFile(wb, 'Advanced_Inventory_Report.xlsx');
  };

  return (
    <>
      <form onSubmit={e => { e.preventDefault(); InvIssue(); }}>
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
          onChange={e => setSearchText(e.target.value)}
        />
        <button className="btn btn-sm btn-info" onClick={() => setExpandAll(!expandAll)}>
          {expandAll ? "Collapse All" : "Expand All"}
        </button>
        <button className="btn btn-primary" onClick={() => exportExcelAdvanced(UseData)}>Export Excel</button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-screen">
          <FourSquare color="#32cd32" size="large" />
        </div>
      ) : (
        <div className="mt-5">
          {UseData.map((cc, idx) => <InventorySection key={idx} cc={cc} expandAll={expandAll} />)}
        </div>
      )}
    </>
  );
}

export default AdvancedInventoryIssue;
