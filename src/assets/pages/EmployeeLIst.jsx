import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { GetDataContext } from "../components/DataContext";
import DateRangePicker from "../components/DatePickerData";
import { FourSquare } from "react-loading-indicators";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

function EmployeeListSingleSheet() {
  const { cndata, loading, setLoading } = useContext(GetDataContext);
  const [apiData, setApiData] = useState([]);
  const [month,setMonth] = useState('')

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
  "Drawstring" : 4,
  "Elastic" : 5,
  "Twill Tape" : 6,
  "Gum Tape" : 7,
  "Jacquard & Woven Elastic" : 8,
  "Warping & Rubber Covering ": 9,
  "Rib Tape" : 10,
  "Washing" : 11,
  "Warping & Rubber Covering" : 12,
  "Operations and Maintenance" : 13,
  "Store" : 14,
  "General" : 15,
  "Security" : 16,
}
// Group by section
const uniqueSection = [...new Set(apiData.map(item => item.SectionName))];

// section priority অনুযায়ী sort
const sortedSection = uniqueSection.sort((a, b) => {
  const rankA = section[a] || 999;
  const rankB = section[b] || 999;
  return rankA - rankB;
});

const grpData = sortedSection.map((sec) => {
  // এই section এর employee ফিল্টার
  const employees = apiData.filter(
    item => item.SectionName === sec
  );

  // designation priority অনুযায়ী sort
  const sortedEmployees = employees.sort((a, b) => {
    const rankA = designationPriority[a.Designation] || 999;
    const rankB = designationPriority[b.Designation] || 999;
    return rankA - rankB;
  });

  return {
    Section: sec,
    Employee: sortedEmployees,
  };
});

console.log(grpData);

  // ExcelJS Export
  const ExportExcelWithAllSheet = async (grpData) => {
    if (!grpData || grpData.length === 0) return;

    const wb = new ExcelJS.Workbook();

    // Common header row
    const headerRow = [
      "SL",
      "Employee ID",
      "Employee Name",
      "Joining Date",
      "Designation",
      "Remarks",
    ];

    // STYLE BLOCK
    const headerStyle = {
      font: { bold: true },
      alignment: { horizontal: "center", vertical: "middle" },
      border: {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      },
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE2E2E2" },
      },
    };

    const sectionStyle = {
      font: { bold: true, size: 14 },
      alignment: { horizontal: "center", vertical: "middle" },
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFCCE5FF" },
      },
    };

    const cellBorder = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };

    // Create individual sheets
    grpData.forEach((section) => {
      const ws = wb.addWorksheet(section.Section);

      // Merge & Style Section Name Row
      ws.mergeCells("A1:F1");
      ws.getCell("A1").value = section.Section;
      ws.getCell("A1").style = sectionStyle;

      // Add header
      const header = ws.addRow(headerRow);
      header.eachCell((cell) => (cell.style = headerStyle));

      // Add employee rows
      section.Employee.forEach((emp, idx) => {
        const row = ws.addRow([
          idx + 1,
          emp.EmpIDNo,
          emp.EmpName,
          DateFormat(emp.DateOfJoining),
          emp.Designation,
          "",
        ]);
         row.height = 20;

        row.eachCell((cell) => {
          cell.border = cellBorder;
        });
      });

      // Auto width
      ws.columns.forEach((col) => {
        col.width = 20;
      });
    });

    // Combined Sheet
    const combined = wb.addWorksheet("All Employees");

    grpData.forEach((section) => {
      // Section Row
      const startRow = combined.lastRow ? combined.lastRow.number + 1 : 1;
      combined.mergeCells(`A${startRow}:F${startRow}`);
      const sCell = combined.getCell(`A${startRow}`);
      sCell.value = section.Section;
      sCell.style = sectionStyle;

      // Header Row
      const header = combined.addRow(headerRow);
      header.eachCell((cell) => (cell.style = headerStyle));

      // Employees
      section.Employee.forEach((emp, idx) => {
        const row = combined.addRow([
          idx + 1,
          emp.EmpIDNo,
          emp.EmpName,
          DateFormat(emp.DateOfJoining),
          emp.Designation,
          "",
        ]);

        row.eachCell((cell) => (cell.border = cellBorder));
      });
    });

    combined.columns.forEach((col) => (col.width = 20));

    // Save File
    const buffer = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), "EmployeeData_AllTabs.xlsx");
  };

console.log(month);

    const year = month.year;
    const mnt = month.month;


  return (
    <div className="p-4">
      <form onSubmit={fetchEmployees}>
        <div className="flex justify-center items-center gap-4 mb-4">
          {/* <DateRangePicker /> */}
          <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker label={'Month'} views={['month', 'year']} onChange={(value) => {
  const month = value?.month() + 1; // 0-based index
  const year = value?.year();
  
  setMonth({ month, year });
}}  />
          </LocalizationProvider>

          <input type="submit" value="Submit" className={`btn btn-success`} disabled={!month}/>
          <input
            type="button"
            value="Export Excel"
            className={`btn btn-success`}
            onClick={() => ExportExcelWithAllSheet(grpData)}
            disabled={grpData ==""}
          />
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
            <th>Employee ID</th>
            <th>Employee Name</th>
            <th>Joining Date</th>
            <th>Section</th>
            <th>Designation</th>
            <th>Basic Salary</th>
            <th>Cash Salary</th>
          </tr>
        </thead>

        <tbody>
          {grpData.map((emp, idx) => (
            <React.Fragment key={idx}>
              <tr className="bg-gray-200">
                <th colSpan={8} className="text-left text-xl">
                  {emp.Section}
                </th>
              </tr>
              {emp.Employee.map((data, empIdx) => (
                <tr key={empIdx}>
                  <td>{empIdx + 1}</td>
                  <td>{data.EmpIDNo}</td>
                  <td>{data.EmpName}</td>
                  <td>{DateFormat(data.DateOfJoining)}</td>
                  <td>{data.SectionName}</td>
                  <td>{data.Designation}</td>
                  <td>{data.BasicSalary}</td>
                  <td>{data.CashSalary}</td>
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
