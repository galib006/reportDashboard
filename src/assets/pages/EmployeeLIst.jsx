import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { GetDataContext } from "../components/DataContext";
import { FourSquare } from "react-loading-indicators";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

function EmployeeListSingleSheet() {
  const { cndata, loading, setLoading } = useContext(GetDataContext);
  const [apiData, setApiData] = useState([]);
  const [month,setMonth] = useState('');

  // ===== Column Config =====
  const allColumns = [
    { key: "EmpIDNo", label: "Employee ID" },
    { key: "EmpName", label: "Employee Name" },
    { key: "FathersName", label: "Father Name" },
    { key: "MothersName", label: "Mother Name" },
    { key: "Religion", label: "Religion" },
    { key: "BloodGroup", label: "Blood Group" },
    { key: "Gender", label: "Gender" },
    { key: "NationalIDNo", label: "NID" },
    { key: "PresentAddress", label: "Present Address" },
    { key: "ParmanentAddress", label: "Permanent Address" },
    { key: "DateOfJoining", label: "Joining Date" },
    { key: "Designation", label: "Designation" },
    { key: "CashSalary", label: "Salary" },
  ];

  const [selectedColumns, setSelectedColumns] = useState(() => {
    const saved = localStorage.getItem("emp_columns");
    return saved ? JSON.parse(saved) : allColumns.map(col => col.key);
  });

  useEffect(() => {
    localStorage.setItem("emp_columns", JSON.stringify(selectedColumns));
  }, [selectedColumns]);

  const DateFormat = (e) => {
    if (!e) return "";
    const dateObj = new Date(e);
    return dateObj.toLocaleDateString("en-GB");
  };

  const apiKey = localStorage.getItem("apiKey");

  const fetchEmployees = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.get(
        `https://tpl-api.ebs365.info/api/HRMBI/HRM_GET_EmployeeInformation_ReportExcel?CompanyID=1&DepartmentID=0&SectionID=0&LineID=0&FloorID=0&EmpTypeID=4&CommandID=1&MM=[December]&YYYY=${year}`,
        { headers: { Authorization: `${apiKey}` } }
      );
      setApiData(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching employee data:", err);
    } finally {
      setLoading(false);
    }
  };

  const designationPriority = {
    "Incharge": 1,
    "Supervisor": 2,  
    "Printing Supervisor ": 3,
    "Sr. Operator": 4,
    "Operator": 5,
    "Asst. operator": 6 ,
    "Jr. Operator": 7,
    "Helper": 8,
    "Operator (Washing)": 9,
    "Helper (Washing)": 10,
    "Quality Controller (Finishing)": 11,
    "Helper ( Finishing)": 12,
    "Operator (Warping)": 13,
    "Technician (Rubber Covering)": 14,
    "Helper (Warping)": 15,
    "Asst. QI": 16,
    "Q.C (Finishing)": 17,
    "Asst. Supervisor": 18,
    "Delivery Man": 19,
    "Office Assistant": 20,
    "Driver": 21,
    "Cook": 22, 
    "Cleaner": 23,
    "Loader": 24,
    "Caretaker": 25,
  };

  const section = {
    "Offset Printing" : 1,
    "Sewing Thread" : 2,
    "Poly" : 3,
    "Printed Label" : 4,
    "Gum Tape" : 5,
    "Elastic" : 6,
    "Drawstring" : 7,
    "Twill Tape" : 8,
    "Rib Tape" : 9,
    "Jacquard & Woven Elastic" : 10,
    "Warping & Rubber Covering" : 11,
    "Washing" : 12,
    "Finishing ": 13,
    "Operations and Maintenance" : 14,
    "Store" : 15,
    "General" : 16,
    "Security" : 17,
  };

  // Group by section
  const uniqueSection = [...new Set(apiData.map(item => item.SectionName))];

  const sortedSection = uniqueSection.sort((a, b) => {
    const rankA = section[a] || 999;
    const rankB = section[b] || 999;
    return rankA - rankB;
  });

  const grpData = sortedSection.map((sec) => {
    const employees = apiData.filter(item => item.SectionName === sec);
    const sortedEmployees = employees.sort((a, b) => {
      const rankA = designationPriority[a.Designation] || 999;
      const rankB = designationPriority[b.Designation] || 999;
      return rankA - rankB;
    });
    return { Section: sec, Employee: sortedEmployees };
  });

  const fullBorder = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };

  const headerStyle = {
    font: { bold: true },
    alignment: { horizontal: "center", vertical: "middle" },
    border: fullBorder,
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E2E2" } },
  };

  const sectionStyle = {
    font: { bold: true, size: 20 },
    alignment: { horizontal: "center", vertical: "middle" },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFCCE5FF" } },
  };

  const ExportExcelWithAllSheet = async (grpData) => {
    if (!grpData || grpData.length === 0) return;
    const wb = new ExcelJS.Workbook();

    const headerRow = [
      "SL",
      ...allColumns.filter(col => selectedColumns.includes(col.key)).map(col => col.label),
      "Remarks",
    ];

    // ========== Individual Sheets ==========
    grpData.forEach((section) => {
      const ws = wb.addWorksheet(section.Section);

      // Section row merge
      ws.mergeCells(`A1:${String.fromCharCode(65 + headerRow.length - 1)}1`);
      const sCell = ws.getCell("A1");
      sCell.value = section.Section;
      sCell.style = sectionStyle;
      for (let col = 1; col <= headerRow.length; col++) ws.getCell(1, col).border = fullBorder;

      // Header
      const header = ws.addRow(headerRow);
      header.eachCell(cell => { cell.style = headerStyle; });

      // Data
      section.Employee.forEach((emp, idx) => {
        const rowData = [
          idx + 1,
          ...allColumns.filter(col => selectedColumns.includes(col.key)).map(col => {
            if (col.key === "DateOfJoining") return DateFormat(emp[col.key]);
            if (col.key === "NationalIDNo") return String(emp[col.key]);
            return emp[col.key];
          }),
          "",
        ];
        const row = ws.addRow(rowData);
        row.eachCell(cell => { cell.border = fullBorder; });
      });

      ws.columns.forEach(col => col.width = 20);
    });

    // ========== Combined Sheet ==========
    const combined = wb.addWorksheet("All Employees");
    grpData.forEach((section) => {
      const startRow = combined.lastRow ? combined.lastRow.number + 1 : 1;
      combined.mergeCells(`A${startRow}:${String.fromCharCode(65 + headerRow.length - 1)}${startRow}`);
      const sCell = combined.getCell(`A${startRow}`);
      sCell.value = section.Section;
      sCell.style = sectionStyle;
      for (let col = 1; col <= headerRow.length; col++) combined.getCell(startRow, col).border = fullBorder;

      const header = combined.addRow(headerRow);
      header.eachCell(cell => { cell.style = headerStyle; });

      section.Employee.forEach((emp, idx) => {
        const rowData = [
          idx + 1,
          ...allColumns.filter(col => selectedColumns.includes(col.key)).map(col => {
            if (col.key === "DateOfJoining") return DateFormat(emp[col.key]);
            if (col.key === "NationalIDNo") return String(emp[col.key]);
            return emp[col.key];
          }),
          "",
        ];
        const row = combined.addRow(rowData);
        row.eachCell(cell => { cell.border = fullBorder; });
      });
    });
    combined.columns.forEach(col => col.width = 20);

    const buffer = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Worker_Sheet_${mnt}_${year}.xlsx`);
  };

  const year = month.year;
  const mnt = month.month;

  return (
    <div className="p-4">
      <form onSubmit={fetchEmployees}>
        <div className="flex justify-center items-center gap-4 mb-4">
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker label={'Month'} views={['month', 'year']} onChange={(value) => {
              const month = value?.month() + 1;
              const year = value?.year();
              setMonth({ month, year });
            }} />
          </LocalizationProvider>
          <input type="submit" value="Submit" className="btn btn-success" disabled={!month}/>
          <input type="button" value="Export Excel" className="btn btn-success" onClick={() => ExportExcelWithAllSheet(grpData)} disabled={grpData.length === 0}/>
        </div>

        {/* ===== Column Selection UI ===== */}
        <div className="flex gap-2 mb-2">
          <button type="button" className="btn btn-xs btn-primary" onClick={() => setSelectedColumns(allColumns.map(col => col.key))}>Select All</button>
          <button type="button" className="btn btn-xs btn-warning" onClick={() => setSelectedColumns([])}>Unselect All</button>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {allColumns.map(col => (
            <label key={col.key} className="flex gap-2">
              <input
                type="checkbox"
                checked={selectedColumns.includes(col.key)}
                onChange={(e) => {
                  if (e.target.checked) setSelectedColumns([...selectedColumns, col.key]);
                  else setSelectedColumns(selectedColumns.filter(c => c !== col.key));
                }}
              />
              {col.label}
            </label>
          ))}
        </div>
      </form>

      {loading && (
        <div className="flex justify-center items-center h-screen w-full text-center">
          <FourSquare color="#32cd32" size="large" />
        </div>
      )}

      <table className="table border">
        <thead>
          <tr>
            <th>SL</th>
            {allColumns.map(col => <th key={col.key}>{col.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {grpData.map((emp, idx) => (
            <React.Fragment key={idx}>
              <tr className="bg-gray-200">
                <th colSpan={allColumns.length + 1} className="text-left text-xl">{emp.Section}</th>
              </tr>
              {emp.Employee.map((data, empIdx) => (
                <tr key={empIdx}>
                  <td>{empIdx + 1}</td>
                  {allColumns.map(col => {
                    let val = data[col.key];
                    if (col.key === "DateOfJoining") val = DateFormat(val);
                    if (col.key === "NationalIDNo") val = String(val);
                    return <td key={col.key}>{val}</td>;
                  })}
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default EmployeeListSingleSheet;