import axios from "axios";
import React, { useContext, useState } from "react";
import { GetDataContext } from "../components/DataContext";
import DateRangePicker from "../components/DatePickerData";
import { FourSquare } from "react-loading-indicators";
import * as XLSX from "xlsx";

function EmployeeListSingleSheet() {
  const { cndata, loading, setLoading } = useContext(GetDataContext);
  const [apiData, setApiData] = useState([]);

  const DateFormat = (e) => {
    if (!e) return "";
    const dateObj = new Date(e);
    return dateObj.toLocaleDateString("en-GB"); // DD/MM/YYYY
  };

  const apiKey = localStorage.getItem("apiKey");

  const fetchEmployees = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.get(
        `https://tpl-api.ebs365.info/api/HRMBI/HRM_GET_EmployeeInformation_ReportExcel?CompanyID=1&DepartmentID=2&SectionID=0&LineID=0&FloorID=0&EmpTypeID=4&CommandID=1&MM=November&YYYY=2025`,
        { headers: { Authorization: `${apiKey}` } }
      );
      setApiData(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching employee data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Group data by section
  const uniqueSection = [...new Set(apiData.map((item) => item.SectionName))];
  const grpData = uniqueSection.map((section) => ({
    Section: section,
    Employee: apiData.filter((data) => data.SectionName === section),
  }));

  const ExportExcelWithAllSheet = (grpData) => {
    if (!grpData || grpData.length === 0) return;

    const wb = XLSX.utils.book_new();

    // --- Individual section sheets ---
    grpData.forEach((section) => {
      const ws_data = [];
      ws_data.push([section.Section]);
      ws_data.push([
        "SL",
        "Employee ID",
        "Employee Name",
        "Joining Date",
        "Section",
        "Designation",
      ]);
      section.Employee.forEach((emp, idx) => {
        ws_data.push([
          idx + 1,
          emp.EmpIDNo,
          emp.EmpName,
          emp.DateOfJoining ? new Date(emp.DateOfJoining) : "",
          emp.SectionName,
          emp.Designation,
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(ws_data);
      ws["!merges"] = ws["!merges"] || [];
      ws["!merges"].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } });

      XLSX.utils.book_append_sheet(wb, ws, section.Section);
    });

    // --- Combined sheet for all sections ---
    const combined_data = [];
    grpData.forEach((section) => {
      combined_data.push([section.Section]); // Section row
      combined_data.push([
        "SL",
        "Employee ID",
        "Employee Name",
        "Joining Date",
        "Section",
        "Designation",
      ]);
      section.Employee.forEach((emp, idx) => {
        combined_data.push([
          idx + 1,
          emp.EmpIDNo,
          emp.EmpName,
          emp.DateOfJoining ? new Date(emp.DateOfJoining) : "",
          emp.SectionName,
          emp.Designation,
        ]);
      });
    });

    const combined_ws = XLSX.utils.aoa_to_sheet(combined_data);

    // Merge section rows in combined sheet
    let rowIndex = 0;
    grpData.forEach((section) => {
      combined_ws["!merges"] = combined_ws["!merges"] || [];
      combined_ws["!merges"].push({
        s: { r: rowIndex, c: 0 },
        e: { r: rowIndex, c: 5 },
      });
      rowIndex += 2 + section.Employee.length;
    });

    XLSX.utils.book_append_sheet(wb, combined_ws, "All Employees");

    XLSX.writeFile(wb, "EmployeeData_AllTabs.xlsx");
  };

  return (
    <div className="p-4">
      <form onSubmit={fetchEmployees}>
        <div className="flex justify-center items-center gap-4 mb-4">
          <DateRangePicker />
          <input type="submit" value="Submit" className="btn btn-success" />
          <input
            type="button"
            value="Export Excel"
            className="btn btn-success"
            onClick={() => ExportExcelWithAllSheet(grpData)}
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
          </tr>
        </thead>
        <tbody>
          {grpData.map((emp, idx) => (
            <React.Fragment key={idx}>
              <tr className="bg-gray-200">
                <th colSpan={6} className="text-left text-xl">
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
