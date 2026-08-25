import axios from "axios";
import React, { useContext, useEffect, useState, useMemo } from "react";
import { GetDataContext } from "../components/DataContext";
import { FourSquare } from "react-loading-indicators";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

function OfficeStaffList() {
  const { cndata, loading, setLoading, apiKey} = useContext(GetDataContext);
  const [apiData, setApiData] = useState([]);
  const [month, setMonth] = useState(null);
  const [employeeType, setEmployeeType] = useState('both');
  const [factoryData, setFactoryData] = useState([]);
  const [officeData, setOfficeData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState({});
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [allDiscontinuedEmployees, setAllDiscontinuedEmployees] = useState([]);
  const [filterStatus, setFilterStatus] = useState('active');
  const [isExporting, setIsExporting] = useState(false);

  // ===== Column Config =====
  const allColumns = [
    { key: "EmpIDNo", label: "Employee ID", icon: "🔑" },
    { key: "EmpName", label: "Employee Name", icon: "👤" },
    { key: "FathersName", label: "Father Name", icon: "👨" },
    { key: "MothersName", label: "Mother Name", icon: "👩" },
    { key: "Religion", label: "Religion", icon: "🕊️" },
    { key: "BloodGroup", label: "Blood Group", icon: "🩸" },
    { key: "Gender", label: "Gender", icon: "⚤" },
    { key: "NationalIDNo", label: "NID", icon: "🪪" },
    { key: "PresentAddress", label: "Present Address", icon: "🏠" },
    { key: "ParmanentAddress", label: "Permanent Address", icon: "🏡" },
    { key: "DateOfJoining", label: "Joining Date", icon: "📅" },
    { key: "CertificateDOB", label: "Date of Birth", icon: "🎂" },
    { key: "Designation", label: "Designation", icon: "💼" },
    { key: "CashSalary", label: "Salary", icon: "💰" },
    { key: "Status", label: "Status", icon: "📊" },
  ];

  const [selectedColumns, setSelectedColumns] = useState(() => {
    const saved = localStorage.getItem("emp_columns");
    return saved ? JSON.parse(saved) : ["EmpIDNo", "EmpName", "Designation", "DateOfJoining", "CashSalary", "Status"];
  });

  useEffect(() => {
    localStorage.setItem("emp_columns", JSON.stringify(selectedColumns));
  }, [selectedColumns]);

  // ===== Date Format: DD/MM/YYYY =====
  const DateFormat = (dateValue) => {
    if (!dateValue) return "-";
    try {
      const dateObj = new Date(dateValue);
      if (isNaN(dateObj.getTime())) return dateValue || "-";
      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const year = dateObj.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateValue || "-";
    }
  };

  // ===== Format Salary =====
  const formatSalary = (val) => {
    const num = Number(val);
    if (isNaN(num)) return val ?? "-";
    return `৳ ${num.toLocaleString("en-BD")}`;
  };

  // ===== Safe value getter =====
  const getSafeValue = (obj, key, fallback = "-") => {
    if (!obj) return fallback;
    const value = obj[key];
    if (value === null || value === undefined || value === '') return fallback;
    return value;
  };

  // const apiKey = localStorage.getItem("apiKey");

  // ===== Month Names =====
  const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  // ===== Normalize ID for matching =====
  const normalizeId = (val) => {
    if (val === undefined || val === null || val === "") return "";
    return String(val).trim();
  };

  // ===== Check if employee is discontinued =====
  const isEmployeeDiscontinued = (empIDNo) => {
    if (!empIDNo || !allDiscontinuedEmployees.length) return false;
    const normalizedEmpId = normalizeId(empIDNo);
    return allDiscontinuedEmployees.some(emp => {
      const discontinuedId = normalizeId(emp?.emp_ID || emp?.empID || emp?.EmpIDNo);
      return discontinuedId === normalizedEmpId;
    });
  };

  // ===== Designation Priority =====
  const designationPriority = {
    "GM": 1, "AGM": 2, "DPM": 3, "Manager": 4, "Deputy Manager": 5, "Asst. Manager": 6, "PM": 7, "APM": 8, "Sr. Executive": 9, "Jr. Executive": 10, "Executive": 11, "Officer": 12, "Adviser -Land Development": 13, "project Engineer": 14, "Sr. Designer": 15, "Designer": 16, "QI": 17, "Office Assistant": 18, "Driver": 19

  };

  // ===== Section Priority =====
  const section = {
    "General": 1, "Operations and Maintenance": 2, "Admin & HR": 3,
    "Commercial - Customs": 4, "Commercial - Banking": 5, "Commercial": 6,
    "Business Development": 7, "Offset Printing": 8, "Sewing Thread": 9,
    "Jacquard & Woven Elastic": 10, "Printed Label": 11, "Engineering": 12, "IT": 13, "Design": 14, "Sales & Marketing": 15, "Accounts & Finance": 16, "Accounting": 17, "Store": 18,
  };

  const fetchEmployees = async (e) => {
    e.preventDefault();
    
    if (!month) {
      alert("Please select a month");
      return;
    }

    setLoading(true);
    try {
      const yearToUse = selectedYear || new Date().getFullYear();
      
      const [factoryRes, officeRes, discontinuedRes] = await Promise.all([
        axios.get(
          `https://tpl-api.ebs365.info/api/HRMBI/HRM_GET_EmployeeInformation_ReportExcel?CompanyID=1&DepartmentID=0&SectionID=0&LineID=0&FloorID=0&EmpTypeID=3&CommandID=1&MM=[object%20Object]&YYYY=${yearToUse}`,
          { headers: { Authorization: `${apiKey}` } }
        ),
        axios.get(
          `https://tpl-api.ebs365.info/api/HRMBI/HRM_GET_EmployeeInformation_ReportExcel?CompanyID=1&DepartmentID=0&SectionID=0&LineID=0&FloorID=0&EmpTypeID=6&CommandID=1&MM=[object%20Object]&YYYY=${yearToUse}`,
          { headers: { Authorization: `${apiKey}` } }
        ),
        axios.get(
          `https://tpl-api.ebs365.info/api/Employee/GetDiscontinuedEmployees?CompanyID=1&DepartmentID=0&DesignationID=0&SectionID=0&FloorID=0&LineID=0&EmpTypeID=0`,
          { headers: { Authorization: `${apiKey}` } }
        )
      ]);

      const factoryDataArray = Array.isArray(factoryRes.data) ? factoryRes.data : [];
      const officeDataArray = Array.isArray(officeRes.data) ? officeRes.data : [];
      
      let discontinuedDataArray = [];
      if (Array.isArray(discontinuedRes.data)) {
        discontinuedDataArray = discontinuedRes.data;
      } else if (discontinuedRes.data?.data && Array.isArray(discontinuedRes.data.data)) {
        discontinuedDataArray = discontinuedRes.data.data;
      } else if (discontinuedRes.data?.Data && Array.isArray(discontinuedRes.data.Data)) {
        discontinuedDataArray = discontinuedRes.data.Data;
      } else {
        discontinuedDataArray = [];
      }

      // Filter out Workers - only keep non-Worker discontinued employees
      const nonWorkerDiscontinued = discontinuedDataArray.filter(
        emp => emp?.employeeTypeName !== "Worker"
      );

      setFactoryData(factoryDataArray);
      setOfficeData(officeDataArray);
      setAllDiscontinuedEmployees(nonWorkerDiscontinued);

      let combinedData = [];
      if (employeeType === 'factory') {
        combinedData = factoryDataArray;
      } else if (employeeType === 'office') {
        combinedData = officeDataArray;
      } else {
        combinedData = [...factoryDataArray, ...officeDataArray];
      }

      setApiData(combinedData);

    } catch (err) {
      console.error("Error fetching employee data:", err);
      alert("Error fetching employee data. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  // ===== GENDER SUMMARY COMPONENT =====
function GenderSummaryOffice({ data, filterStatus, employeeType }) {
  // Calculate gender counts
  const genderCounts = useMemo(() => {
    const counts = { male: 0, female: 0, other: 0 };
    
    data.forEach(emp => {
      const gender = (emp.Gender || "").toLowerCase().trim();
      if (gender === "male" || gender === "m") {
        counts.male++;
      } else if (gender === "female" || gender === "f") {
        counts.female++;
      } else if (gender) {
        counts.other++;
      }
    });
    
    return counts;
  }, [data]);

  const total = genderCounts.male + genderCounts.female + genderCounts.other;

  if (total === 0) return null;

  const malePercentage = total > 0 ? ((genderCounts.male / total) * 100).toFixed(1) : 0;
  const femalePercentage = total > 0 ? ((genderCounts.female / total) * 100).toFixed(1) : 0;

  const getTypeLabel = () => {
    if (employeeType === 'factory') return 'Factory';
    if (employeeType === 'office') return 'Office';
    return 'All';
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-5 md:p-6 mb-6 border border-gray-100">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <span>👥</span>
            Gender Summary
            <span className="text-xs font-normal text-gray-400">
              ({getTypeLabel()} {filterStatus === 'discontinued' ? '· Discontinued' : '· Active'})
            </span>
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Total: {total} employees
          </p>
        </div>

        <div className="flex flex-wrap gap-6 items-center w-full md:w-auto">
          {/* Male */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ background: "#2563eb" }}></span>
              <span className="text-sm font-medium text-gray-700">Male</span>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-gray-800">
                {genderCounts.male}
              </div>
              <div className="text-xs text-gray-400">
                {malePercentage}%
              </div>
            </div>
          </div>

          {/* Female */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ background: "#ec4899" }}></span>
              <span className="text-sm font-medium text-gray-700">Female</span>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-gray-800">
                {genderCounts.female}
              </div>
              <div className="text-xs text-gray-400">
                {femalePercentage}%
              </div>
            </div>
          </div>

          {/* Other (if any) */}
          {genderCounts.other > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ background: "#8b5cf6" }}></span>
                <span className="text-sm font-medium text-gray-700">Other</span>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-800">
                  {genderCounts.other}
                </div>
                <div className="text-xs text-gray-400">
                  {((genderCounts.other / total) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          )}

          {/* Progress bar */}
          <div className="flex-1 min-w-[120px] h-2.5 rounded-full overflow-hidden bg-gray-200">
            <div
              className="h-full transition-all duration-500 ease-out"
              style={{
                width: `${malePercentage}%`,
                background: "#2563eb",
                float: "left"
              }}
            />
            <div
              className="h-full transition-all duration-500 ease-out"
              style={{
                width: `${femalePercentage}%`,
                background: "#ec4899",
                float: "left"
              }}
            />
            {genderCounts.other > 0 && (
              <div
                className="h-full transition-all duration-500 ease-out"
                style={{
                  width: `${(genderCounts.other / total) * 100}%`,
                  background: "#8b5cf6",
                  float: "left"
                }}
              />
            )}
          </div>

          {/* Gender ratio badge */}
          <div className="text-xs px-3 py-1 rounded-full border border-gray-200 bg-gray-50 shrink-0">
            {genderCounts.male}:{genderCounts.female}
            <span className="text-gray-400 ml-1">M:F</span>
          </div>
        </div>
      </div>
    </div>
  );
}

  // ===== UPDATE DATA when employee type changes =====
  useEffect(() => {
    if (factoryData.length > 0 || officeData.length > 0) {
      let combinedData = [];
      if (employeeType === 'factory') {
        combinedData = factoryData;
      } else if (employeeType === 'office') {
        combinedData = officeData;
      } else {
        combinedData = [...factoryData, ...officeData];
      }
      setApiData(combinedData);
    }
  }, [employeeType, factoryData, officeData]);

  // ===== FILTER DATA =====
  const getFilteredData = useMemo(() => {
    if (filterStatus === 'discontinued') {
      return allDiscontinuedEmployees.map(emp => ({
        EmpIDNo: emp?.emp_ID || emp?.empID || "",
        EmpName: emp?.name || emp?.EmpName || "",
        Designation: emp?.designation || "",
        SectionName: emp?.section || "Unknown",
        DateOfJoining: emp?.join_Date || "",
        CashSalary: emp?.cashSalary || 0,
        Status: "Discontinued",
        EmpTypeID: emp?.empTypeID || 0,
        FathersName: emp?.fathersName || "",
        MothersName: emp?.mothersName || "",
        Religion: emp?.religion || "",
        BloodGroup: emp?.bloodGroup || "",
        Gender: emp?.gender || "",
        NationalIDNo: emp?.nationalIDNo || "",
        PresentAddress: emp?.presentAddress || "",
        ParmanentAddress: emp?.permanentAddress || "",
        CertificateDOB: emp?.certificateDOB || "",
        _original: emp
      }));
    }
    
    return apiData.filter(emp => !isEmployeeDiscontinued(emp.EmpIDNo));
  }, [apiData, filterStatus, allDiscontinuedEmployees]);

  // Apply search filter
  const getSearchedData = useMemo(() => {
    if (!searchTerm) return getFilteredData;
    const searchLower = searchTerm.toLowerCase();
    return getFilteredData.filter(item => {
      return (
        (item.EmpName?.toLowerCase().includes(searchLower)) ||
        (item.EmpIDNo?.toString().toLowerCase().includes(searchLower)) ||
        (item.Designation?.toLowerCase().includes(searchLower)) ||
        (item.SectionName?.toLowerCase().includes(searchLower))
      );
    });
  }, [getFilteredData, searchTerm]);

  // ===== VISIBLE COLUMNS =====
  const visibleColumns = useMemo(
    () => allColumns.filter((col) => selectedColumns.includes(col.key)),
    [selectedColumns]
  );

  // Group by section
  const grpData = useMemo(() => {
    const uniqueSection = [...new Set(getSearchedData.map(item => item.SectionName || "Unknown"))];
    
    const sortedSection = uniqueSection.sort((a, b) => {
      const rankA = section[a] || 999;
      const rankB = section[b] || 999;
      return rankA - rankB;
    });

    return sortedSection.map((sec) => {
      const employees = getSearchedData.filter(item => (item.SectionName || "Unknown") === sec);
      const sortedEmployees = employees.sort((a, b) => {
        const rankA = designationPriority[a.Designation?.trim()] || 999;
        const rankB = designationPriority[b.Designation?.trim()] || 999;
        return rankA - rankB;
      });
      return { Section: sec, Employee: sortedEmployees };
    });
  }, [getSearchedData]);

  // Toggle section expansion
  const toggleSection = (sectionName) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  // ===== PROFESSIONAL EXCEL EXPORT =====
  const ExportExcelWithAllSheet = async (grpDataToExport, employeeTypeLabel = '') => {
    if (!grpDataToExport || grpDataToExport.length === 0) {
      alert("No data to export");
      return;
    }

    setIsExporting(true);
    try {
      const wb = new ExcelJS.Workbook();

      const headerRow = ["SL", ...visibleColumns.map((col) => col.label), "Status", "Remarks"];

      // Professional color palette
      const COLORS = {
        primary: "FF1C2430",
        secondary: "FF2F6B4A",
        accent: "FFA9812F",
        lightBg: "FFF7F8FA",
        headerBg: "FF253A5E",
        headerText: "FFFFFFFF",
        border: "FFD6D2C4",
        evenRow: "FFFBFCFD",
        discontinuedBg: "FFF3E1DC",
        discontinuedText: "FF8C3B2E",
      };

      // Professional fonts
      const FONTS = {
        header: { name: 'Calibri', size: 16, bold: true, color: { argb: COLORS.headerText } },
        section: { name: 'Calibri', size: 20, bold: true, color: { argb: COLORS.headerText } },
        body: { name: 'Calibri', size: 16, color: { argb: COLORS.primary } },
        bodyBold: { name: 'Calibri', size: 16, bold: true, color: { argb: COLORS.primary } },
        discontinued: { name: 'Calibri', size: 16, bold: true, color: { argb: COLORS.discontinuedText } },
      };

      // Professional border styles
      const BORDERS = {
        thin: {
          top: { style: 'thin', color: { argb: COLORS.border } },
          left: { style: 'thin', color: { argb: COLORS.border } },
          bottom: { style: 'thin', color: { argb: COLORS.border } },
          right: { style: 'thin', color: { argb: COLORS.border } },
        },
        medium: {
          top: { style: 'medium', color: { argb: COLORS.primary } },
          left: { style: 'medium', color: { argb: COLORS.primary } },
          bottom: { style: 'medium', color: { argb: COLORS.primary } },
          right: { style: 'medium', color: { argb: COLORS.primary } },
        },
      };

      const headerStyle = {
        font: FONTS.header,
        alignment: { horizontal: "center", vertical: "middle", wrapText: true },
        border: BORDERS.thin,
        fill: { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.headerBg } },
      };

      const sectionStyle = {
        font: FONTS.section,
        alignment: { horizontal: "center", vertical: "middle" },
        fill: { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.secondary } },
        border: BORDERS.medium,
      };

      const bodyStyle = (rowIndex, isDiscontinued) => {
        if (isDiscontinued) {
          return {
            font: FONTS.discontinued,
            alignment: { horizontal: "left", vertical: "middle" },
            border: BORDERS.thin,
            fill: { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.discontinuedBg } },
          };
        }
        return {
          font: FONTS.body,
          alignment: { horizontal: "left", vertical: "middle" },
          border: BORDERS.thin,
          fill: rowIndex % 2 === 0
            ? { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.evenRow } }
            : { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } },
        };
      };

      // ========== Individual Section Sheets ==========
      grpDataToExport.forEach((sec) => {
        const sheetName = sec.Section.replace(/[\\/:*?"<>|]/g, '').substring(0, 31);
        const ws = wb.addWorksheet(sheetName || "Section");

        ws.columns = [
          { width: 8 },
          ...visibleColumns.map(() => ({ width: 22 })),
          { width: 15 },
          { width: 15 },
        ];

        const lastColLetter = String.fromCharCode(65 + headerRow.length - 1);

        // Section header
        ws.mergeCells(`A1:${lastColLetter}1`);
        const sCell = ws.getCell("A1");
        sCell.value = sec.Section;
        sCell.style = sectionStyle;
        ws.getRow(1).height = 45;

        // Header row
        const header = ws.addRow(headerRow);
        header.eachCell((cell) => {
          cell.style = headerStyle;
        });
        ws.getRow(2).height = 35;

        // Data rows
        sec.Employee.forEach((emp, idx) => {
          const isDiscontinued = filterStatus === "discontinued" || isEmployeeDiscontinued(emp.EmpIDNo);
          
          // Build row data
          const rowData = [
            idx + 1,
            ...visibleColumns.map((col) => {
              if (col.key === "DateOfJoining") return DateFormat(emp[col.key]);
              if (col.key === "CashSalary") return formatSalary(emp[col.key]);
              if (col.key === "Status") return isDiscontinued ? "Discontinued" : "Active";
              return emp[col.key] ?? "";
            }),
            isDiscontinued ? "Discontinued" : "Active",
            isDiscontinued ? "Discontinued" : "",
          ];
          
          const row = ws.addRow(rowData);
          row.height = 30;

          row.eachCell((cell, colNumber) => {
            const style = bodyStyle(idx, isDiscontinued);
            Object.assign(cell.style, style);

            if (colNumber === 1) {
              cell.style.alignment = { horizontal: "center", vertical: "middle" };
            }

            if (isDiscontinued) {
              cell.style.font = { name: 'Calibri', size: 16, bold: true, color: { argb: COLORS.discontinuedText } };
            }
          });
        });

        // Footer
        const footerRow = ws.addRow([`Generated: ${new Date().toLocaleString()}`]);
        ws.mergeCells(`A${ws.rowCount}:${lastColLetter}${ws.rowCount}`);
        const footerCell = ws.getCell(`A${ws.rowCount}`);
        footerCell.style = {
          font: { name: 'Calibri', size: 12, italic: true, color: { argb: "FF6B6F76" } },
          alignment: { horizontal: "right", vertical: "middle" },
          border: { top: { style: 'thin', color: { argb: COLORS.border } } },
          fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F6F8" } },
        };
        ws.getRow(ws.rowCount).height = 25;
      });

      // ========== Combined Sheet ==========
      const combined = wb.addWorksheet("All Employees");
      combined.columns = [
        { width: 8 },
        ...visibleColumns.map(() => ({ width: 22 })),
        { width: 15 },
        { width: 15 },
      ];

      let currentRow = 1;
      const lastColLetter = String.fromCharCode(65 + headerRow.length - 1);

      grpDataToExport.forEach((sec, secIndex) => {
        // Section header
        combined.mergeCells(`A${currentRow}:${lastColLetter}${currentRow}`);
        const sCell = combined.getCell(`A${currentRow}`);
        sCell.value = sec.Section;
        sCell.style = sectionStyle;
        combined.getRow(currentRow).height = 45;
        currentRow++;

        // Header row
        const header = combined.addRow(headerRow);
        header.eachCell((cell) => {
          cell.style = headerStyle;
        });
        combined.getRow(currentRow).height = 35;
        currentRow++;

        // Data rows
        sec.Employee.forEach((emp, idx) => {
          const isDiscontinued = filterStatus === "discontinued" || isEmployeeDiscontinued(emp.EmpIDNo);
          
          const rowData = [
            idx + 1,
            ...visibleColumns.map((col) => {
              if (col.key === "DateOfJoining") return DateFormat(emp[col.key]);
              if (col.key === "CashSalary") return formatSalary(emp[col.key]);
              if (col.key === "Status") return isDiscontinued ? "Discontinued" : "Active";
              return emp[col.key] ?? "";
            }),
            isDiscontinued ? "Discontinued" : "Active",
            isDiscontinued ? "Discontinued" : "",
          ];
          
          const row = combined.addRow(rowData);
          row.height = 30;

          row.eachCell((cell, colNumber) => {
            const style = bodyStyle(idx, isDiscontinued);
            Object.assign(cell.style, style);

            if (colNumber === 1) {
              cell.style.alignment = { horizontal: "center", vertical: "middle" };
            }

            if (isDiscontinued) {
              cell.style.font = { name: 'Calibri', size: 16, bold: true, color: { argb: COLORS.discontinuedText } };
            }
          });
          currentRow++;
        });

        // Spacing between sections
        if (secIndex < grpDataToExport.length - 1) {
          const spacerRow = combined.addRow([]);
          spacerRow.height = 10;
          currentRow++;
        }
      });

      // Global footer
      const footerRow = combined.addRow([`Generated: ${new Date().toLocaleString()}`]);
      combined.mergeCells(`A${combined.rowCount}:${lastColLetter}${combined.rowCount}`);
      const footerCell = combined.getCell(`A${combined.rowCount}`);
      footerCell.style = {
        font: { name: 'Calibri', size: 12, italic: true, color: { argb: "FF6B6F76" } },
        alignment: { horizontal: "right", vertical: "middle" },
        border: { top: { style: 'thin', color: { argb: COLORS.border } } },
        fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F6F8" } },
      };
      combined.getRow(combined.rowCount).height = 25;

      // Save file
      const monthNumber = month ? month.month : 1;
      const yearNumber = selectedYear || new Date().getFullYear();
      const typeLabel = employeeTypeLabel ? `_${employeeTypeLabel}` : '';

      const buffer = await wb.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Employee_Sheet${typeLabel}_${monthNumber}_${yearNumber}.xlsx`);
      alert("Excel file exported successfully!");

    } catch (error) {
      console.error("Export Error:", error);
      alert("Error exporting Excel file: " + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const getEmployeeTypeLabel = () => {
    if (employeeType === 'factory') return 'Factory';
    if (employeeType === 'office') return 'Office';
    return 'All';
  };

  const getEmployeeType = (emp) => {
    if (emp.EmpTypeID === 3) return { label: 'Factory', color: 'bg-blue-100 text-blue-800' };
    if (emp.EmpTypeID === 6) return { label: 'Office', color: 'bg-green-100 text-green-800' };
    return { label: 'Unknown', color: 'bg-gray-100 text-gray-800' };
  };

  const hasData = apiData.length > 0 || allDiscontinuedEmployees.length > 0;
  
  const totalEmployees = apiData.length;
  const activeCount = apiData.filter(emp => !isEmployeeDiscontinued(emp.EmpIDNo)).length;
  const discontinuedCount = apiData.filter(emp => isEmployeeDiscontinued(emp.EmpIDNo)).length;
  const totalDiscontinuedAll = allDiscontinuedEmployees.length;
  const showingCount = getSearchedData.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* ===== Header ===== */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
                <span>👥</span> Employee Directory
              </h1>
              <p className="text-gray-500 mt-1 text-sm">
                {filterStatus === 'active' ? 'Showing Active Employees' : 'Showing All Discontinued Employees (Independent of Month)'}
                {employeeType === 'factory' && ' (Factory Staff)'}
                {employeeType === 'office' && ' (Office Staff)'}
                {employeeType === 'both' && ' (All Employees)'}
              </p>
              {/* {totalDiscontinuedAll > 0 && (
                <p className="text-sm text-red-600 mt-1">
                  ❌ {totalDiscontinuedAll} total discontinued employees (non-Worker, independent of month)
                </p>
              )} */}
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 rounded-xl border border-blue-100">
                <span className="text-blue-600">📊</span>
                <span className="text-sm font-semibold text-gray-700">
                  {showingCount} <span className="font-normal text-gray-500">Showing</span>
                </span>
              </div>
              <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                <span className="text-emerald-600">✅</span>
                <span className="text-sm font-semibold text-emerald-700">
                  {filterStatus === 'discontinued' ? 0 : activeCount} <span className="font-normal text-emerald-600">Active</span>
                </span>
              </div>
              <div className="flex items-center gap-2 bg-red-50 px-4 py-2 rounded-xl border border-red-100">
                <span className="text-red-600">❌</span>
                <span className="text-sm font-semibold text-red-700">
                  {filterStatus === 'discontinued' ? totalDiscontinuedAll : discontinuedCount} <span className="font-normal text-red-600">Discontinued</span>
                </span>
              </div>
            </div>
          </div>
        </div>
        {!loading && hasData && getSearchedData.length > 0 && (
        <GenderSummaryOffice 
          data={getSearchedData} 
          filterStatus={filterStatus}
          employeeType={employeeType}
        />
      )}
        {/* ===== Controls ===== */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-gray-100">
          <form onSubmit={fetchEmployees}>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-3">
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                  📅 Select Month
                </label>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker 
                    views={['month', 'year']}
                    value={month ? dayjs(`${month.year}-${month.month}-01`) : null}
                    onChange={(value) => {
                      if (value) {
                        const monthNumber = value.month() + 1;
                        const yearValue = value.year();
                        setMonth({ month: monthNumber, year: yearValue });
                        setSelectedYear(yearValue);
                      } else {
                        setMonth(null);
                      }
                    }}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'medium',
                        className: 'bg-gray-50 rounded-xl',
                        InputProps: {
                          className: 'rounded-xl'
                        }
                      }
                    }}
                  />
                </LocalizationProvider>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                  🏢 Employee Type
                </label>
                <select 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  value={employeeType}
                  onChange={(e) => setEmployeeType(e.target.value)}
                >
                  <option value="both">👥 Both</option>
                  <option value="factory">🏭 Factory</option>
                  <option value="office">🏢 Office</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                  📊 View
                </label>
                <select 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="active">✅ Active Only</option>
                  <option value="discontinued">❌ Discontinued Only</option>
                </select>
              </div>

              <div className="md:col-span-5 flex flex-wrap gap-3 items-end">
                <button
                  type="submit"
                  disabled={!month || loading}
                  className="flex-1 min-w-[100px] px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin">⏳</span> Loading...
                    </>
                  ) : (
                    <>
                      <span>🚀</span> Fetch Data
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => ExportExcelWithAllSheet(grpData, getEmployeeTypeLabel())}
                  disabled={!hasData || loading || isExporting}
                  className="flex-1 min-w-[100px] px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl font-semibold hover:from-emerald-700 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  {isExporting ? (
                    <>
                      <span className="animate-spin">⏳</span> Exporting...
                    </>
                  ) : (
                    <>
                      <span>📥</span> Export
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowColumnSelector(!showColumnSelector)}
                  className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all duration-200 flex items-center gap-2"
                >
                  <span>⚙️</span> Columns
                </button>
              </div>
            </div>

            {hasData && (
              <div className="mt-4 relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
                <input
                  type="text"
                  placeholder="Search by name, ID, designation, or section..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
              </div>
            )}

            {showColumnSelector && hasData && (
              <div className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200 animate-slideDown">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-700">Select Columns</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedColumns(allColumns.map(col => col.key))}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedColumns([])}
                      className="px-3 py-1 text-xs bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {allColumns.map(col => (
                    <label
                      key={col.key}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedColumns.includes(col.key)
                          ? 'bg-blue-100 border-2 border-blue-400'
                          : 'bg-white border-2 border-transparent hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedColumns.includes(col.key)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedColumns([...selectedColumns, col.key]);
                          } else {
                            setSelectedColumns(selectedColumns.filter(c => c !== col.key));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm">{col.icon}</span>
                      <span className="text-sm text-gray-700">{col.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </form>
        </div>

        {loading && (
          <div className="bg-white rounded-2xl shadow-xl p-16 flex flex-col items-center justify-center border border-gray-100">
            <FourSquare color="#3b82f6" size="large" />
            <p className="mt-6 text-gray-600 font-medium">Loading employee data...</p>
            <p className="text-sm text-gray-400 mt-1">Please wait while we fetch the records</p>
          </div>
        )}

        {!loading && !hasData && month && (
          <div className="bg-white rounded-2xl shadow-xl p-16 text-center border border-gray-100">
            <div className="text-7xl mb-4">📋</div>
            <h3 className="text-2xl font-semibold text-gray-700 mb-2">No Data Found</h3>
            <p className="text-gray-500">No employee records available for the selected month</p>
            <p className="text-sm text-gray-400 mt-1">Try selecting a different month or employee type</p>
          </div>
        )}

        {!loading && !hasData && !month && (
          <div className="bg-white rounded-2xl shadow-xl p-16 text-center border border-gray-100">
            <div className="text-7xl mb-4">📊</div>
            <h3 className="text-2xl font-semibold text-gray-700 mb-2">Ready to Get Started</h3>
            <p className="text-gray-500">Select a month and click "Fetch Data" to view employee records</p>
            <div className="mt-4 flex justify-center gap-4 text-sm text-gray-400">
              <span>📅 Pick a month</span>
              <span>→</span>
              <span>🏢 Choose employee type</span>
              <span>→</span>
              <span>🚀 Click Fetch Data</span>
            </div>
          </div>
        )}

        {!loading && hasData && grpData.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-600 to-indigo-600">
                    <th className="px-4 py-4 text-left text-sm font-semibold text-white">#</th>
                    {allColumns.map(col => 
                      selectedColumns.includes(col.key) && (
                        <th key={col.key} className="px-4 py-4 text-left text-sm font-semibold text-white whitespace-nowrap">
                          {col.icon} {col.label}
                        </th>
                      )
                    )}
                    {/* <th className="px-4 py-4 text-left text-sm font-semibold text-white whitespace-nowrap">Type</th> */}
                  </tr>
                </thead>
                <tbody>
                  {grpData.map((group, idx) => {
                    const isExpanded = expandedSections[group.Section] !== false;
                    return (
                      <React.Fragment key={idx}>
                        <tr 
                          className="bg-gradient-to-r from-gray-50 to-gray-100 cursor-pointer hover:from-gray-100 hover:to-gray-200 transition-all duration-200 border-t border-gray-200"
                          onClick={() => toggleSection(group.Section)}
                        >
                          <td colSpan={selectedColumns.length + 2} className="px-4 py-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="text-lg font-bold text-gray-700">📁 {group.Section}</span>
                                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full">
                                  {group.Employee.length} employees
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">
                                  {isExpanded ? 'Click to collapse' : 'Click to expand'}
                                </span>
                                <span className="text-gray-400 text-lg transition-transform duration-200">
                                  {isExpanded ? '▼' : '▶'}
                                </span>
                              </div>
                            </div>
                          </td>
                        </tr>
                        
                        {isExpanded && group.Employee.map((data, empIdx) => {
                          const empType = getEmployeeType(data);
                          const isDiscontinued = filterStatus === 'discontinued' || isEmployeeDiscontinued(data.EmpIDNo);
                          return (
                            <tr 
                              key={empIdx} 
                              className={`hover:bg-blue-50 transition-colors duration-150 border-b border-gray-100 ${
                                isDiscontinued ? 'bg-red-50/30' : ''
                              }`}
                            >
                              <td className="px-4 py-3 text-sm text-gray-600 font-medium">{empIdx + 1}</td>
                              {allColumns.map(col => {
                                if (!selectedColumns.includes(col.key)) return null;
                                let val = getSafeValue(data, col.key);
                                if (col.key === "DateOfJoining" || col.key === "CertificateDOB") {
                                  val = DateFormat(val);
                                }
                                if (col.key === "CashSalary" && val !== "-") {
                                  val = `৳${parseFloat(val).toFixed(2)}`;
                                }
                                if (col.key === "Status") {
                                  val = isDiscontinued ? "Discontinued" : "Active";
                                }
                                return (
                                  <td 
                                    key={col.key} 
                                    className={`px-4 py-3 text-sm max-w-xs truncate ${
                                      col.key === "Status" 
                                        ? isDiscontinued 
                                          ? 'text-red-600 font-semibold' 
                                          : 'text-emerald-600 font-semibold'
                                        : isDiscontinued 
                                          ? 'text-gray-500' 
                                          : 'text-gray-700'
                                    }`} 
                                    title={val}
                                  >
                                    {col.key === "Status" ? (
                                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                        isDiscontinued 
                                          ? 'bg-red-100 text-red-700' 
                                          : 'bg-emerald-100 text-emerald-700'
                                      }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                          isDiscontinued ? 'bg-red-500' : 'bg-emerald-500'
                                        }`} />
                                        {val}
                                      </span>
                                    ) : (
                                      val
                                    )}
                                  </td>
                                );
                              })}
                              {/* <td className="px-4 py-3">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${empType.color}`}>
                                  {empType.label} .....
                                </span>
                              </td> */}
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && hasData && grpData.length === 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-16 text-center border border-gray-100">
            <div className="text-7xl mb-4">🔍</div>
            <h3 className="text-2xl font-semibold text-gray-700 mb-2">No Results Found</h3>
            <p className="text-gray-500">
              {filterStatus === 'active' 
                ? 'No active employees found matching your criteria' 
                : 'No discontinued employees found'}
            </p>
            {searchTerm && (
              <p className="text-sm text-gray-400 mt-1">Try adjusting your search terms</p>
            )}
          </div>
        )}

        {hasData && grpData.length > 0 && (
          <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-gray-500 bg-white rounded-xl px-6 py-3 shadow-md border border-gray-100">
            <div className="flex items-center gap-2">
              <span>📊</span>
              Showing <span className="font-semibold text-gray-700">{getSearchedData.length}</span> employees
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <span>✅</span>
                <span className="font-semibold text-emerald-600">{filterStatus === 'discontinued' ? 0 : activeCount}</span>
                <span className="text-gray-400">active</span>
              </div>
              <div className="flex items-center gap-1">
                <span>❌</span>
                <span className="font-semibold text-red-600">{filterStatus === 'discontinued' ? totalDiscontinuedAll : discontinuedCount}</span>
                <span className="text-gray-400">discontinued</span>
              </div>
              <div className="flex items-center gap-1">
                <span>📁</span>
                <span className="font-semibold text-gray-700">{grpData.length}</span>
                <span className="text-gray-400">sections</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span>🏢</span>
              <span className="font-semibold text-gray-700">
                {employeeType === 'factory' ? 'Factory Staff' : 
                 employeeType === 'office' ? 'Office Staff' : 'All Employees'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default OfficeStaffList;