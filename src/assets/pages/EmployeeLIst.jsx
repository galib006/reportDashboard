import axios from "axios";
import React, { useContext, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { GetDataContext } from "../components/DataContext";
import { FourSquare } from "react-loading-indicators";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import {
  FiDownload,
  FiSearch,
  FiCheckSquare,
  FiSquare,
  FiFilter,
  FiChevronDown,
  FiPrinter,
  FiX,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
  FiUsers,
  FiUserCheck,
  FiUserX,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const TOKENS = `
  .epr-root {
    --ink: #1C2430;
    --ink-soft: #253A5E;
    --paper: #EFF1EA;
    --paper-raised: #FBFAF6;
    --line: #D6D2C4;
    --line-strong: #B8B2A0;
    --brass: #A9812F;
    --brass-soft: #EFE3C2;
    --active: #2F6B4A;
    --active-soft: #E4EEE7;
    --rust: #8C3B2E;
    --rust-soft: #F3E1DC;
    --text: #23262B;
    --text-muted: #6B6F76;
    font-family: "Inter", ui-sans-serif, system-ui, sans-serif;
    color: var(--text);
    background: var(--paper);
  }
  .epr-root .epr-display { font-family: "Space Grotesk", "Inter", sans-serif; }
  .epr-root .epr-mono { font-family: "IBM Plex Mono", ui-monospace, monospace; }

  .epr-grid-bg {
    background-image:
      radial-gradient(var(--line-strong) 1px, transparent 1px);
    background-size: 18px 18px;
    background-position: -9px -9px;
  }

  .epr-stamp {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 10px;
    border: 1.5px solid currentColor;
    border-radius: 3px;
    font-family: "IBM Plex Mono", monospace;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    transform: rotate(-1.5deg);
    white-space: nowrap;
  }

  .epr-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
  .epr-scrollbar::-webkit-scrollbar-thumb { background: var(--line-strong); border-radius: 4px; }
  .epr-scrollbar::-webkit-scrollbar-track { background: transparent; }

  @media print {
    .epr-no-print { display: none !important; }
    .epr-root { background: white !important; }
    .epr-print-break { break-inside: avoid; }
  }
`;

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const AVATAR_PALETTE = [
  { bg: "#253A5E", fg: "#EFF1EA" },
  { bg: "#A9812F", fg: "#1C2430" },
  { bg: "#2F6B4A", fg: "#EFF1EA" },
  { bg: "#8C3B2E", fg: "#EFF1EA" },
  { bg: "#4A5568", fg: "#EFF1EA" },
];

function getInitials(name) {
  if (!name) return "—";
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function avatarColorFor(name) {
  const idx = hashString(name || "?") % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[idx];
}

function csvEscape(value) {
  const str = value === undefined || value === null ? "" : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function ToastStack({ toasts, onDismiss }) {
  const ICONS = {
    success: <FiCheckCircle className="text-[var(--active)]" />,
    error: <FiAlertCircle className="text-[var(--rust)]" />,
    info: <FiInfo className="text-[var(--ink-soft)]" />,
  };
  return (
    <div className="epr-no-print fixed bottom-5 right-5 z-[100] flex flex-col gap-2 w-[min(340px,90vw)]">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 24, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 24, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="flex items-start gap-2.5 bg-[var(--paper-raised)] border border-[var(--line)] rounded-lg shadow-lg px-3.5 py-3"
          >
            <span className="mt-0.5 shrink-0">{ICONS[t.type] || ICONS.info}</span>
            <p className="text-sm text-[var(--text)] leading-snug flex-1">{t.message}</p>
            <button
              onClick={() => onDismiss(t.id)}
              className="text-[var(--text-muted)] hover:text-[var(--text)] shrink-0"
              aria-label="Dismiss notification"
            >
              <FiX size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function StatusStamp({ discontinued, className = "" }) {
  return (
    <span
      className={`epr-stamp ${className}`}
      style={{ color: discontinued ? "var(--rust)" : "var(--active)" }}
    >
      {discontinued ? "Discontinued" : "Active"}
    </span>
  );
}

function Avatar({ name }) {
  const { bg, fg } = avatarColorFor(name);
  return (
    <span
      className="epr-mono inline-flex items-center justify-center w-8 h-8 rounded-full text-[11px] font-semibold shrink-0"
      style={{ background: bg, color: fg }}
      aria-hidden="true"
    >
      {getInitials(name)}
    </span>
  );
}

function EmployeeListSingleSheet() {
  // const { cndata, loading, setLoading } = useContext(GetDataContext);
  const { cndata, loading, apiKey, setLoading } = useContext(GetDataContext);
  const [apiData, setApiData] = useState([]);
  const [month, setMonth] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isColumnSelectorOpen, setIsColumnSelectorOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("active");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [expandedRows, setExpandedRows] = useState(() => new Set());
  const [toasts, setToasts] = useState([]);
  const [fetchError, setFetchError] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [allDiscontinuedWorkers, setAllDiscontinuedWorkers] = useState([]);
  const searchInputRef = useRef(null);
  const columnPanelRef = useRef(null);
  const exportMenuRef = useRef(null);
  const sectionRefs = useRef({});

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
    { key: "CertificateDOB", label: "Date of Birth" },
    { key: "Designation", label: "Designation" },
    { key: "CashSalary", label: "Salary" },
    { key: "Status", label: "Status" },
  ];

  const SORTABLE_KEYS = new Set([
    "EmpIDNo", "EmpName", "Designation", "DateOfJoining", "CashSalary", "Status",
  ]);

  const [selectedColumns, setSelectedColumns] = useState(() => {
    try {
      const saved = localStorage.getItem("emp_columns");
      return saved ? JSON.parse(saved) : allColumns.map((col) => col.key);
    } catch {
      return allColumns.map((col) => col.key);
    }
  });

  useEffect(() => {
    localStorage.setItem("emp_columns", JSON.stringify(selectedColumns));
  }, [selectedColumns]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 220);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const pushToast = useCallback((type, message) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);
  
  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement?.tagName;
      const isTyping = tag === "INPUT" || tag === "TEXTAREA";
      if (e.key === "/" && !isTyping) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (columnPanelRef.current && !columnPanelRef.current.contains(e.target)) {
        setIsColumnSelectorOpen(false);
      }
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

const DateFormat = (e) => {
  if (!e) return "";
  
  // Try to parse as ISO string first
  try {
    const dateStr = e.split('T')[0];
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const month = parts[1];
      const day = parts[2];
      return `${day}/${month}/${year}`;
    }
  } catch (err) {
    // If parsing fails, fallback to Date object
  }
  
  // Fallback to Date object
  const dateObj = new Date(e);
  if (Number.isNaN(dateObj.getTime())) return "";
  
  const day = String(dateObj.getDate()).padStart(2, "0");
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const year = dateObj.getFullYear();
  return `${day}/${month}/${year}`;
};

  const formatSalary = (val) => {
    const num = Number(val);
    if (Number.isNaN(num)) return val ?? "-";
    return `৳ ${num.toLocaleString("en-BD")}`;
  };

  // const apiKey = localStorage.getItem("apiKey");

  const normalizeId = (val) => {
    if (val === undefined || val === null || val === "") return "";
    return String(val).trim();
  };

  const fetchEmployees = async (e) => {
    e.preventDefault();
    if (!month || !month.month || !month.year) return;

    setLoading(true);
    setFetchError(null);
    try {
      const monthLabel = MONTH_NAMES[month.month - 1];

      const [employeesRes, discontinuedRes] = await Promise.all([
        axios.get(
          `https://tpl-api.ebs365.info/api/HRMBI/HRM_GET_EmployeeInformation_ReportExcel?CompanyID=1&DepartmentID=0&SectionID=0&LineID=0&FloorID=0&EmpTypeID=4&CommandID=1&MM=[${monthLabel}]&YYYY=${month.year}`,
          { headers: { Authorization: `${apiKey}` } }
        ),
        axios.get(
          `https://tpl-api.ebs365.info/api/Employee/GetDiscontinuedEmployees?CompanyID=1&DepartmentID=0&DesignationID=0&SectionID=0&FloorID=0&LineID=0&EmpTypeID=0`,
          { headers: { Authorization: `${apiKey}` } }
        ),
      ]);

      let employees = [];
      if (Array.isArray(employeesRes.data)) {
        employees = employeesRes.data;
      } else if (employeesRes.data?.data && Array.isArray(employeesRes.data.data)) {
        employees = employeesRes.data.data;
      } else if (employeesRes.data?.Data && Array.isArray(employeesRes.data.Data)) {
        employees = employeesRes.data.Data;
      } else {
        employees = [];
      }

      let discontinued = [];
      if (Array.isArray(discontinuedRes.data)) {
        discontinued = discontinuedRes.data;
      } else if (discontinuedRes.data?.data && Array.isArray(discontinuedRes.data.data)) {
        discontinued = discontinuedRes.data.data;
      } else if (discontinuedRes.data?.Data && Array.isArray(discontinuedRes.data.Data)) {
        discontinued = discontinuedRes.data.Data;
      } else {
        discontinued = [];
      }

      // Filter ONLY Worker type discontinued employees - INDEPENDENT OF MONTH
      const workerDiscontinued = discontinued.filter(
        (emp) => emp?.employeeTypeName === "Worker"
      );
      
      // Store ALL discontinued workers (regardless of month)
      setAllDiscontinuedWorkers(workerDiscontinued);

      // Store employees for the selected month
      setApiData(employees);

      pushToast(
        "success",
        `Loaded ${employees.length} employees for ${monthLabel} ${month.year}. ${workerDiscontinued.length} total discontinued workers exist.`
      );

    } catch (err) {
      console.error("Error fetching data:", err);
      setApiData([]);
      setAllDiscontinuedWorkers([]);
      setFetchError("Couldn't load employee data. Check your connection or API key and try again.");
      pushToast("error", "Couldn't load employee data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const designationPriority = {
  "Incharge": 1,
  "Shift InCharge": 2,
  "Supervisor": 3,
  "Printing Supervisor ": 4,
  "Asst. Supervisor": 5,
  "Sr. Operator": 6,
  "Jr. Operator": 7,
  "Operator": 8,
  "Operator CD 102-6+L": 9,
  "Operator (Warping)": 10,
  "Operator (Washing)": 11,
  "Asst. operator": 12,
  "Technician": 13,
  "Quality Controller (Finishing)": 14,
  "Asst. QI": 15,
  "Electrician": 16,
  "Helper": 17,
  "Helper ( Finishing)": 18,
  "Helper (Warping)": 19,
  "Helper (Coning)": 20,
  "Helper (Covering)": 21,
  "Helper (Washing)": 22,
  "Delivery Man": 23,
  "Driver": 24,
  "Office Assistant": 25,
  "Cook": 26,
  "Cleaner": 27,
  "Loader": 28,
  "Caretaker": 29,
  "Guard": 30
};

  const section = {
    "Offset Printing": 1,
    "Poly": 2,
    "Printed Label": 3,
    "Gum Tape": 4,
    "Sewing Thread": 5,
    "Elastic": 6,
    "Jacquard & Woven Elastic": 7,
    "Rib Tape": 8,
    "Twill Tape": 9,
    "Drawstring": 10,
    "Warping & Rubber Covering": 11,
    "Washing": 12,
    "Finishing ": 13,
    "Operations and Maintenance": 14,
    "Store": 15,
    "General": 16,
    "Security": 17,
  };

  const sortEmployees = useCallback(
    (employees) => {
      const arr = [...employees];
      if (!sortConfig.key) {
        return arr.sort((a, b) => (designationPriority[a.Designation] || 999) - (designationPriority[b.Designation] || 999));
      }
      const { key, direction } = sortConfig;
      const dir = direction === "asc" ? 1 : -1;
      arr.sort((a, b) => {
        let va = a[key];
        let vb = b[key];
        if (key === "DateOfJoining") {
          va = new Date(va || 0).getTime();
          vb = new Date(vb || 0).getTime();
        } else if (key === "CashSalary") {
          va = Number(va) || 0;
          vb = Number(vb) || 0;
        } else {
          va = (va ?? "").toString().toLowerCase();
          vb = (vb ?? "").toString().toLowerCase();
        }
        if (va < vb) return -1 * dir;
        if (va > vb) return 1 * dir;
        return 0;
      });
      return arr;
    },
    [sortConfig]
  );

  const handleSort = (key) => {
    if (!SORTABLE_KEYS.has(key)) return;
    setSortConfig((prev) => {
      if (prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return { key: null, direction: "asc" };
    });
  };

  const toggleRowExpand = (empId) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(empId)) next.delete(empId);
      else next.add(empId);
      return next;
    });
  };

  const visibleColumns = useMemo(
    () => allColumns.filter((col) => selectedColumns.includes(col.key)),
    [selectedColumns]
  );

  // Get data based on filter status
  const getDisplayData = useCallback(() => {
    if (filterStatus === "discontinued") {
      // Show ALL discontinued workers - INDEPENDENT OF MONTH
      return allDiscontinuedWorkers.map((emp) => ({
        EmpIDNo: emp?.emp_ID || emp?.empID || "",
        EmpName: emp?.name || emp?.EmpName || "",
        Designation: emp?.designation || "",
        SectionName: emp?.section.trim() || "Unknown",
        DateOfJoining: emp?.join_Date || "",
        CashSalary: emp?.cashSalary || 0,
        Status: "Discontinued",
        FathersName: "",
        MothersName: "",
        Religion: "",
        BloodGroup: "",
        Gender: "",
        NationalIDNo: "",
        PresentAddress: "",
        ParmanentAddress: "",
        CertificateDOB: "",
        // Keep original data for reference
        _original: emp
      }));
    } else {
      // Show employees from the selected month
      return apiData;
    }
  }, [filterStatus, allDiscontinuedWorkers, apiData]);

  const displayData = useMemo(() => getDisplayData(), [getDisplayData]);

  const uniqueSection = useMemo(() => {
    return [...new Set(displayData.map((item) => item.SectionName || "Unknown"))];
  }, [displayData]);

  const sortedSectionNames = useMemo(
    () =>
      [...uniqueSection].sort((a, b) => (section[a] || 999) - (section[b] || 999)),
    [uniqueSection]
  );

  // Group data by section
  const grpData = useMemo(() => {
    return sortedSectionNames
      .map((sec) => {
        const employees = displayData.filter((item) => (item.SectionName || "Unknown") === sec);
        const sorted = sortEmployees(employees);
        return { Section: sec, Employee: sorted };
      })
      .filter((s) => s.Employee.length > 0);
  }, [sortedSectionNames, displayData, sortEmployees]);

  // Search filtering on grouped data
  const filteredGrpData = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    if (!term) return grpData;
    return grpData
      .map((sec) => ({
        Section: sec.Section,
        Employee: sec.Employee.filter(
          (emp) =>
            (emp.EmpName || "").toLowerCase().includes(term) ||
            (emp.EmpIDNo || "").toString().includes(term) ||
            sec.Section.toLowerCase().includes(term)
        ),
      }))
      .filter((sec) => sec.Employee.length > 0);
  }, [grpData, debouncedSearch]);

  const fullBorder = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };

  const headerStyle = {
    font: { bold: true, color: { argb: "FF1C2430" } },
    alignment: { horizontal: "center", vertical: "middle" },
    border: fullBorder,
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFE3C2" } },
  };

  const sectionStyle = {
    font: { bold: true, size: 18, color: { argb: "FFFFFFFF" } },
    alignment: { horizontal: "center", vertical: "middle" },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF253A5E" } },
  };

  const discontinuedStyle = {
    font: { color: { argb: "FF8C3B2E" }, bold: true },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3E1DC" } },
  };

  const buildRow = (emp, idx) => {
    const isDiscontinued = filterStatus === "discontinued" || emp.Status === "Discontinued";
    return [
      idx + 1,
      ...visibleColumns.map((col) => {
        if (col.key === "DateOfJoining") return DateFormat(emp[col.key]);
        if (col.key === "CashSalary") return formatSalary(emp[col.key]);
        if (col.key === "Status") return isDiscontinued ? "Discontinued" : "Active";
        return emp[col.key] ?? "";
      }),
      isDiscontinued ? "Discontinued" : "",
    ];
  };

  const ExportExcelWithAllSheet = async (grpDataToExport) => {
    if (!grpDataToExport || grpDataToExport.length === 0) return;
    setIsExporting(true);
    try {
      const wb = new ExcelJS.Workbook();
      const headerRow = ["SL", ...visibleColumns.map((col) => col.label), "Remarks"];

      grpDataToExport.forEach((sec) => {
        const ws = wb.addWorksheet(sec.Section.slice(0, 31));
        ws.mergeCells(`A1:${String.fromCharCode(65 + headerRow.length - 1)}1`);
        const sCell = ws.getCell("A1");
        sCell.value = sec.Section;
        sCell.style = sectionStyle;
        ws.getRow(1).height = 80;
        for (let col = 1; col <= headerRow.length; col++) ws.getCell(1, col).border = fullBorder;

        const header = ws.addRow(headerRow);
        header.eachCell((cell) => { cell.style = headerStyle; });

        sec.Employee.forEach((emp, idx) => {
          const row = ws.addRow(buildRow(emp, idx));
          row.eachCell((cell) => {
            cell.border = fullBorder;
            if (filterStatus === "discontinued" || emp.Status === "Discontinued") {
              Object.assign(cell.style, discontinuedStyle);
            }
          });
        });
        ws.columns.forEach((col) => { col.width = 20; });
      });

      const combined = wb.addWorksheet("All Employees");
      grpDataToExport.forEach((sec) => {
        const startRow = combined.lastRow ? combined.lastRow.number + 1 : 1;
        combined.mergeCells(`A${startRow}:${String.fromCharCode(65 + headerRow.length - 1)}${startRow}`);
        const sCell = combined.getCell(`A${startRow}`);
        sCell.value = sec.Section;
        sCell.style = sectionStyle;
        combined.getRow(startRow).height = 80;
        for (let col = 1; col <= headerRow.length; col++) combined.getCell(startRow, col).border = fullBorder;

        const header = combined.addRow(headerRow);
        header.eachCell((cell) => { cell.style = headerStyle; });

        sec.Employee.forEach((emp, idx) => {
          const row = combined.addRow(buildRow(emp, idx));
          row.eachCell((cell) => {
            cell.border = fullBorder;
            if (filterStatus === "discontinued" || emp.Status === "Discontinued") {
              Object.assign(cell.style, discontinuedStyle);
            }
          });
        });
      });
      combined.columns.forEach((col) => { col.width = 20; });

      const buffer = await wb.xlsx.writeBuffer();
      const year = month ? month.year : "";
      const mnt = month ? MONTH_NAMES[(month.month || 1) - 1] : "";
      saveAs(new Blob([buffer]), `Worker_Sheet_${mnt || "data"}_${year || ""}.xlsx`);
      pushToast("success", "Excel workbook exported.");
    } catch (err) {
      console.error("Export failed:", err);
      pushToast("error", "Excel export failed. Please try again.");
    } finally {
      setIsExporting(false);
      setIsExportMenuOpen(false);
    }
  };

  const exportCsv = (grpDataToExport) => {
    if (!grpDataToExport || grpDataToExport.length === 0) return;
    try {
      const headerRow = ["Section", "SL", ...visibleColumns.map((col) => col.label), "Remarks"];
      const lines = [headerRow.map(csvEscape).join(",")];

      grpDataToExport.forEach((sec) => {
        sec.Employee.forEach((emp, idx) => {
          const row = [sec.Section, ...buildRow(emp, idx)];
          lines.push(row.map(csvEscape).join(","));
        });
      });

      const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
      const year = month ? month.year : "";
      const mnt = month ? MONTH_NAMES[(month.month || 1) - 1] : "";
      saveAs(blob, `Worker_Sheet_${mnt || "data"}_${year || ""}.csv`);
      pushToast("success", "CSV file exported.");
    } catch (err) {
      console.error("CSV export failed:", err);
      pushToast("error", "CSV export failed. Please try again.");
    } finally {
      setIsExportMenuOpen(false);
    }
  };

  const year = month ? month.year : "";
  const mnt = month ? MONTH_NAMES[(month.month || 1) - 1] : "";

  const totalEmployees = apiData.length;
  const totalDiscontinuedWorkers = allDiscontinuedWorkers.length;

  const hasActiveFilters = filterStatus !== "active" || searchTerm.trim() !== "";
  const clearFilters = () => {
    setFilterStatus("active");
    setSearchTerm("");
  };

  const scrollToSection = (sectionName) => {
    sectionRefs.current[sectionName]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const SortIndicator = ({ colKey }) => {
    if (!SORTABLE_KEYS.has(colKey)) return null;
    if (sortConfig.key !== colKey) {
      return <FiChevronDown className="opacity-0 group-hover:opacity-40 inline-block ml-1" size={12} />;
    }
    return (
      <FiChevronDown
        className={`inline-block ml-1 transition-transform ${sortConfig.direction === "asc" ? "rotate-180" : ""}`}
        size={12}
      />
    );
  };

  return (
    <div className="epr-root min-h-screen">
      <style>{TOKENS}</style>
      <ToastStack toasts={toasts} onDismiss={dismissToast} />

      <div className="max-w-7xl mx-auto p-6">
        <div className="epr-grid-bg relative overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--paper-raised)] mb-6">
          <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: "linear-gradient(90deg, var(--brass), var(--ink-soft))" }} />
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div>
                {/* <p className="epr-mono text-xs tracking-[0.2em] uppercase text-[var(--brass)] mb-2">
                  Personnel Registry
                </p> */}
                <h1 className="epr-display text-3xl md:text-4xl font-bold text-[var(--ink)] leading-tight">
                  Worker Roster
                </h1>
                <p className="text-[var(--text-muted)] text-sm mt-1.5">
                  {month ? `${mnt} ${year} · ` : ""}
                  {filterStatus === "discontinued" ? "Showing ALL discontinued workers" : ""}
                </p>
                {totalDiscontinuedWorkers > 0 && (
                  <p className="text-sm text-[var(--rust)] mt-1">
                    <FiUserX className="inline mr-1" /> {totalDiscontinuedWorkers} total discontinued workers 
                  </p>
                )}
              </div>

              <div className="flex items-stretch gap-3 flex-wrap">
                <div className="flex items-center gap-2.5 rounded-lg border border-[var(--line)] bg-white px-4 py-2.5">
                  <FiUsers className="text-[var(--ink-soft)]" />
                  <div className="leading-none">
                    <div className="epr-mono text-lg font-semibold text-[var(--ink)]">
                      {filterStatus === "discontinued" ? totalDiscontinuedWorkers : totalEmployees}
                    </div>
                    <div className="text-[10px] uppercase tracking-wide text-[var(--text-muted)] mt-0.5">
                      {filterStatus === "discontinued" ? "Total Discontinued" : "Total"}
                    </div>
                  </div>
                </div>
                {filterStatus !== "discontinued" && (
                  <div className="flex items-center gap-2.5 rounded-lg border border-[var(--line)] bg-[var(--active-soft)] px-4 py-2.5">
                    <FiUserCheck className="text-[var(--active)]" />
                    <div className="leading-none">
                      <div className="epr-mono text-lg font-semibold" style={{ color: "var(--active)" }}>{totalEmployees}</div>
                      <div className="text-[10px] uppercase tracking-wide text-[var(--text-muted)] mt-0.5">Total Employees</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="epr-no-print rounded-2xl border border-[var(--line)] bg-[var(--paper-raised)] p-5 md:p-6 mb-6">
          <form onSubmit={fetchEmployees} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Select month"
                    views={["month", "year"]}
                    onChange={(value) => {
                      const m = value?.month() + 1;
                      const y = value?.year();
                      setMonth(m && y ? { month: m, year: y } : "");
                    }}
                    slotProps={{
                      textField: { fullWidth: true, variant: "outlined", className: "bg-white" },
                    }}
                  />
                </LocalizationProvider>
              </div>

              <div className="flex gap-2 flex-wrap">
                <button
                  type="submit"
                  disabled={!month || loading}
                  className="px-5 py-3 bg-[var(--ink-soft)] text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <FiSearch />
                  Fetch data
                </button>

                <div className="relative" ref={exportMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsExportMenuOpen((v) => !v)}
                    disabled={filteredGrpData.length === 0 || isExporting}
                    className="px-5 py-3 bg-[var(--brass)] text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <FiDownload />
                    {isExporting ? "Exporting…" : "Export"}
                    <FiChevronDown className={`transition-transform ${isExportMenuOpen ? "rotate-180" : ""}`} size={14} />
                  </button>

                  <AnimatePresence>
                    {isExportMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-56 bg-white border border-[var(--line)] rounded-xl shadow-xl overflow-hidden z-20"
                      >
                        <button
                          type="button"
                          onClick={() => ExportExcelWithAllSheet(filteredGrpData)}
                          className="w-full text-left px-4 py-3 text-sm hover:bg-[var(--paper)] transition-colors"
                        >
                          <div className="font-medium text-[var(--ink)]">Excel workbook</div>
                          <div className="text-xs text-[var(--text-muted)]">One sheet per section, plus combined</div>
                        </button>
                        <div className="h-px bg-[var(--line)]" />
                        <button
                          type="button"
                          onClick={() => exportCsv(filteredGrpData)}
                          className="w-full text-left px-4 py-3 text-sm hover:bg-[var(--paper)] transition-colors"
                        >
                          <div className="font-medium text-[var(--ink)]">CSV file</div>
                          <div className="text-xs text-[var(--text-muted)]">Flat list, all sections</div>
                        </button>
                        <div className="h-px bg-[var(--line)]" />
                        <button
                          type="button"
                          onClick={() => { window.print(); setIsExportMenuOpen(false); }}
                          className="w-full text-left px-4 py-3 text-sm hover:bg-[var(--paper)] transition-colors flex items-center gap-2"
                        >
                          <FiPrinter size={14} />
                          <span className="font-medium text-[var(--ink)]">Print view</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
              <div className="flex-1 w-full relative">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search by name, ID, or section… (press /)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-[var(--line)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--ink-soft)] focus:border-transparent transition-all bg-white"
                />
              </div>

              <div className="flex gap-2 flex-wrap items-center">
                <div className="relative">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="pl-4 pr-9 py-2.5 bg-white border border-[var(--line)] rounded-xl transition-colors appearance-none cursor-pointer text-sm"
                  >
                    <option value="active">Show Active Employees</option>
                    <option value="all">Show All Employees</option>
                    <option value="discontinued">Show Discontinued Only</option>
                  </select>
                  <FiFilter className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" size={14} />
                </div>

                <div className="relative" ref={columnPanelRef}>
                  <button
                    type="button"
                    onClick={() => setIsColumnSelectorOpen((v) => !v)}
                    className="px-4 py-2.5 bg-white border border-[var(--line)] hover:bg-[var(--paper)] rounded-xl transition-colors flex items-center gap-2 text-sm"
                  >
                    {isColumnSelectorOpen ? <FiSquare size={14} /> : <FiCheckSquare size={14} />}
                    Columns ({selectedColumns.length})
                  </button>

                  <AnimatePresence>
                    {isColumnSelectorOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-[min(460px,90vw)] bg-white border border-[var(--line)] rounded-xl shadow-xl p-4 z-20"
                      >
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Visible columns</span>
                          <div className="flex gap-3 text-xs">
                            <button type="button" onClick={() => setSelectedColumns(allColumns.map((c) => c.key))} className="text-[var(--ink-soft)] font-medium hover:underline">
                              Select all
                            </button>
                            <button type="button" onClick={() => setSelectedColumns([])} className="text-[var(--rust)] font-medium hover:underline">
                              Clear
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto epr-scrollbar pr-1">
                          {allColumns.map((col) => (
                            <label key={col.key} className="flex items-center gap-2 text-sm hover:bg-[var(--paper)] p-2 rounded-lg transition-colors cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedColumns.includes(col.key)}
                                onChange={(e) => {
                                  if (e.target.checked) setSelectedColumns([...selectedColumns, col.key]);
                                  else setSelectedColumns(selectedColumns.filter((c) => c !== col.key));
                                }}
                                className="w-4 h-4 accent-[var(--ink-soft)] rounded"
                              />
                              {col.label}
                            </label>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="px-3 py-2.5 text-sm text-[var(--rust)] hover:underline flex items-center gap-1"
                  >
                    <FiX size={14} /> Clear filters
                  </button>
                )}
              </div>
            </div>
          </form>

          {filteredGrpData.length > 1 && (
            <div className="flex gap-2 overflow-x-auto epr-scrollbar mt-4 pt-4 border-t border-[var(--line)]">
              {filteredGrpData.map((sec) => (
                <button
                  key={sec.Section}
                  onClick={() => scrollToSection(sec.Section)}
                  className="epr-mono shrink-0 text-xs px-3 py-1.5 rounded-full border border-[var(--line)] bg-white hover:border-[var(--brass)] hover:text-[var(--brass)] transition-colors"
                >
                  {sec.Section} <span className="text-[var(--text-muted)]">({sec.Employee.length})</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {loading && (
          <div className="epr-no-print fixed inset-0 bg-[var(--ink)]/40 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="bg-[var(--paper-raised)] p-8 rounded-2xl shadow-2xl border border-[var(--line)] text-center">
              <FourSquare color="#A9812F" size="large" />
              <p className="mt-4 text-[var(--text-muted)] text-sm">Fetching employee records…</p>
            </div>
          </div>
        )}

        {!loading && fetchError && (
          <div className="rounded-2xl border border-[var(--rust)]/30 bg-[var(--rust-soft)] p-6 mb-6 flex items-start gap-3">
            <FiAlertCircle className="text-[var(--rust)] mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-[var(--ink)] text-sm">Something went wrong</p>
              <p className="text-sm text-[var(--text-muted)] mt-0.5">{fetchError}</p>
            </div>
          </div>
        )}

        {!loading && filteredGrpData.length > 0 && (
          <div className="epr-print-break rounded-2xl border border-[var(--line)] bg-[var(--paper-raised)] overflow-hidden">
            <div className="hidden md:block overflow-x-auto epr-scrollbar">
              <table className="min-w-full">
                <thead className="sticky top-0 z-10 bg-[var(--brass-soft)] border-b border-[var(--line)]">
                  <tr>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-[var(--ink)] uppercase tracking-wider w-14">SL</th>
                    {visibleColumns.map((col) => (
                      <th
                        key={col.key}
                        onClick={() => handleSort(col.key)}
                        className={`group px-5 py-3.5 text-left text-xs font-semibold text-[var(--ink)] uppercase tracking-wider whitespace-nowrap ${SORTABLE_KEYS.has(col.key) ? "cursor-pointer select-none" : ""}`}
                      >
                        {col.label}
                        <SortIndicator colKey={col.key} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {filteredGrpData.map((sec) => (
                    <React.Fragment key={sec.Section}>
                      <tr
                        ref={(el) => { sectionRefs.current[sec.Section] = el; }}
                        className="bg-[var(--ink-soft)] scroll-mt-24"
                      >
                        <td colSpan={visibleColumns.length + 1} className="px-5 py-3.5">
                          <div className="flex items-center justify-between">
                            <span className="epr-display text-lg font-semibold text-white">{sec.Section}</span>
                            <span className="epr-mono text-xs text-white/80 bg-white/10 px-2.5 py-1 rounded-full">
                              {sec.Employee.length} employees
                            </span>
                          </div>
                        </td>
                      </tr>

                      {sec.Employee.map((data, empIdx) => {
                        const empId = data?.EmpIDNo || "";
                        const isDiscontinued = filterStatus === "discontinued" || data?.Status === "Discontinued";
                        const isExpanded = expandedRows.has(empId);
                        const hiddenDetails = allColumns.filter(
                          (c) => !selectedColumns.includes(c.key)
                        );
                        
                        return (
                          <React.Fragment key={empId || empIdx}>
                            <motion.tr
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: Math.min(empIdx * 0.015, 0.3) }}
                              onClick={() => toggleRowExpand(empId)}
                              className={`cursor-pointer hover:bg-[var(--paper)] transition-colors ${isDiscontinued ? "bg-[var(--rust-soft)]/40" : ""}`}
                            >
                              <td className="px-5 py-3 text-sm text-[var(--text-muted)] epr-mono">{empIdx + 1}</td>
                             {visibleColumns.map((col) => {
                                let val = data[col.key];
                                if (col.key === "DateOfJoining") val = DateFormat(val);
                                if (col.key === "CertificateDOB") val = DateFormat(val);
                                if (col.key === "CashSalary") val = formatSalary(val);
                                if (col.key === "Status") val = isDiscontinued ? "Discontinued" : "Active";
                                if (val === undefined || val === null) val = "-";

                                if (col.key === "EmpName") {
                                  return (
                                    <td key={col.key} className="px-5 py-3 text-sm text-[var(--text)]">
                                      <div className="flex items-center gap-2.5">
                                        <Avatar name={val} />
                                        <span className="font-medium">{val || "-"}</span>
                                      </div>
                                    </td>
                                  );
                                }
                                if (col.key === "Status") {
                                  return (
                                    <td key={col.key} className="px-5 py-3 text-sm">
                                      <StatusStamp discontinued={isDiscontinued} />
                                    </td>
                                  );
                                }
                                return (
                                  <td key={col.key} className="px-5 py-3 text-sm text-[var(--text)]">
                                    {val || "-"}
                                  </td>
                                );
                              })}
                            </motion.tr>

                            <AnimatePresence>
                              {isExpanded && (
                                <motion.tr
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                >
                                  <td colSpan={visibleColumns.length + 1} className="px-5 pb-4 pt-0 bg-[var(--paper)]">
                                    <div className="rounded-xl border border-[var(--line)] bg-white p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                                      {hiddenDetails.length > 0 ? (
                                        hiddenDetails.map((col) => (
                                          <div key={col.key}>
                                            <div className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{col.label}</div>
                                            <div className="text-sm text-[var(--text)] mt-0.5">
                                              {col.key === "DateOfJoining" ? DateFormat(data[col.key]) :
                                              col.key === "CertificateDOB" ? DateFormat(data[col.key]) :
                                               col.key === "CashSalary" ? formatSalary(data[col.key]) :
                                               data[col.key] || "-"}
                                            </div>
                                          </div>
                                        ))
                                      ) : (
                                        <p className="text-sm text-[var(--text-muted)] col-span-full">
                                          All available fields are already shown as columns.
                                        </p>
                                      )}
                                    </div>
                                  </td>
                                </motion.tr>
                              )}
                            </AnimatePresence>
                          </React.Fragment>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-[var(--line)]">
              {filteredGrpData.map((sec) => (
                <div key={sec.Section}>
                  <div className="bg-[var(--ink-soft)] px-4 py-3 flex items-center justify-between">
                    <span className="epr-display text-white font-semibold">{sec.Section}</span>
                    <span className="epr-mono text-xs text-white/80 bg-white/10 px-2 py-1 rounded-full">
                      {sec.Employee.length}
                    </span>
                  </div>
                  {sec.Employee.map((data, empIdx) => {
                    const empId = data?.EmpIDNo || "";
                    const isDiscontinued = filterStatus === "discontinued" || data?.Status === "Discontinued";
                    return (
                      <div key={empId || empIdx} className={`p-4 flex items-start gap-3 ${isDiscontinued ? "bg-[var(--rust-soft)]/30" : ""}`}>
                        <Avatar name={data?.EmpName || ""} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-[var(--text)] truncate">{data?.EmpName || "-"}</p>
                            <StatusStamp discontinued={isDiscontinued} />
                          </div>
                          <p className="epr-mono text-xs text-[var(--text-muted)] mt-0.5">ID {data?.EmpIDNo || "-"}</p>
                          {selectedColumns.includes("Designation") && (
                            <p className="text-sm text-[var(--text-muted)] mt-1">{data?.Designation || "-"}</p>
                          )}
                          {selectedColumns.includes("CashSalary") && (
                            <p className="epr-mono text-sm text-[var(--text)] mt-1">{formatSalary(data?.CashSalary)}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && filteredGrpData.length === 0 && apiData.length === 0 && !fetchError && (
          <div className="epr-grid-bg rounded-2xl border border-[var(--line)] bg-[var(--paper-raised)] p-14 text-center">
            <div className="epr-mono inline-flex items-center justify-center w-14 h-14 rounded-full border-2 border-[var(--brass)] text-[var(--brass)] text-xl font-semibold mb-4">
              §
            </div>
            <h3 className="epr-display text-xl font-semibold text-[var(--ink)] mb-1.5">No records loaded</h3>
            <p className="text-[var(--text-muted)] text-sm max-w-sm mx-auto">
              Choose a month above and select "Fetch data" to open that month's personnel registry.
            </p>
          </div>
        )}

        {!loading && filterStatus === "discontinued" && allDiscontinuedWorkers.length === 0 && (
          <div className="epr-grid-bg rounded-2xl border border-[var(--line)] bg-[var(--paper-raised)] p-14 text-center">
            <div className="epr-mono inline-flex items-center justify-center w-14 h-14 rounded-full border-2 border-[var(--brass)] text-[var(--brass)] text-xl font-semibold mb-4">
              §
            </div>
            <h3 className="epr-display text-xl font-semibold text-[var(--ink)] mb-1.5">No discontinued workers</h3>
            <p className="text-[var(--text-muted)] text-sm max-w-sm mx-auto">
              No discontinued workers found in the system.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default EmployeeListSingleSheet;