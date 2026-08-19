// ============================================================
// INVENTORY MANAGEMENT SYSTEM
// Professional, Clean, and Well-Organized Component
// ============================================================

import React, { useContext, useEffect, useMemo, useState, useCallback, useRef } from "react";
import { GetDataContext } from "../components/DataContext";
import DateRangePicker from "../components/DatePickerData";
import axios from "axios";
import { toast } from "react-toastify";
import { saveAs } from "file-saver";
import _ from "lodash";
import XLSX from 'xlsx-js-style';
import { HashLoader } from "react-spinners";
import {
  FiSearch, FiDownload, FiRefreshCw, FiChevronDown, FiChevronUp,
  FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight,
  FiFilter, FiEye, FiEyeOff, FiAlertCircle, FiTrendingUp, FiTrendingDown,
  FiBarChart2, FiPackage, FiTruck, FiClipboard, FiFileText,
  FiHome, FiActivity, FiPieChart
} from "react-icons/fi";
import { FaSort, FaSortUp, FaSortDown } from "react-icons/fa";

// ============================================================
// 1. CONSTANTS & CONFIGURATION
// ============================================================

const API_BASE = "https://tpl-api.ebs365.info/api/InventoryBI";
const DEFAULT_PAGE_SIZE = 10;
const LOW_STOCK_THRESHOLD = 50;

// Opening balances for materials (should come from API in production)
const OPENING_BALANCES = {
  "10 mm Single Satin (White)": 9,
  "15 mm Single Satin (White)": 1954,
  "Silicon Oil (FLUID 5000)": 2350,
  "15 mm Single Satin Salvage (White)": 2,
  'S Board 300GSM (28"x44") - (CHENMING)': 100739,
  "20 mm Both Side Satin (White)": 3000,
  "20 mm Single Satin (Black)": 185,
  "20 mm Single Satin (White)": 185,
  "Poly Ink (Toyo Yellow)": 230,
  "20 mm Single Satin Salvage (White)": 2,
  "20 mm Taffeta (White)": 105,
  "20/2 Sewing Thread (Optical)": 250,
  "20/4 Sewing Thread": 1950,
  "25 mm Paper (White) - (DRAGON)": 235,
  "25 mm Single Satin (Black)": 136,
  "25 mm Single Satin Salvage (White)": 1,
  "30 mm Both Side Satin (White)": 30,
  "30 mm Paper (White) - (DRAGON)": 190,
  "30 mm Single Satin (Black)": 8,
  "30 mm Single Satin (White)": 195,
  "32 mm Paper (White) - (DRAGON)": 4,
  "32 mm Single Satin (White)": 20,
  "35 mm Both Side Satin (Black)": 35,
  "35 mm Single Satin (Black)": 15,
  "35 mm Single Satin (White)": 0,
  "38 mm Single Satin (White)": 3,
  "40 mm Paper (White) - (DRAGON)": 0,
  "40 mm Single Satin (White)": 0,
  "40 mm Single Satin Salvage (White)": 1,
  "50 mm Paper (White) - (DRAGON)": 0,
  "50 mm Single Satin (White)": 11,
  "57 mm Paper (White) - (DRAGON)": 10,
  "Acetone": 5,
  'Art Card 300GSM (22"x28") - (CHENMING)': 1979,
  "DANA PP": 0,
  "DANA RECYCLE": 0,
  "Jumbo role (40 mic)": 0,
  "LDPE": 0,
  "Poly Ink (Toyo Magenta)": 0
};

// ============================================================
// 2. TAB CONFIGURATION
// ============================================================

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: FiHome, color: 'blue' },
  { id: 'inventory', label: 'Inventory', icon: FiPackage, color: 'emerald' },
  { id: 'issues', label: 'Issues', icon: FiTruck, color: 'rose' },
  { id: 'requisitions', label: 'Requisitions', icon: FiClipboard, color: 'amber' },
  { id: 'stock-report', label: 'Stock Report', icon: FiBarChart2, color: 'purple' },
  { id: 'full-report', label: 'Full Report', icon: FiFileText, color: 'indigo' },
];

// ============================================================
// 3. HELPER FUNCTIONS
// ============================================================

/**
 * Format date to readable string
 */
const formatDate = (date) => {
  if (!date) return "";
  const dt = new Date(date);
  if (isNaN(dt)) return date;
  return dt.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

/**
 * Get status based on balance and gap
 */
const getInventoryStatus = (balance, gap) => {
  if (balance <= 0) return { type: 'danger', label: 'Critical', color: 'rose' };
  if (gap < 0) return { type: 'warning', label: 'Gap Alert', color: 'amber' };
  if (balance < LOW_STOCK_THRESHOLD) return { type: 'info', label: 'Low Stock', color: 'blue' };
  return { type: 'success', label: 'Healthy', color: 'emerald' };
};

/**
 * Get status badge styles
 */
const getStatusBadgeStyles = (status) => {
  const styles = {
    success: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    warning: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    danger: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
    info: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' }
  };
  return styles[status] || styles.success;
};

/**
 * Get balance color class
 */
const getBalanceColor = (balance) => {
  if (balance <= 0) return 'text-rose-600';
  if (balance < LOW_STOCK_THRESHOLD) return 'text-amber-600';
  return 'text-slate-800';
};

// ============================================================
// 4. SUB-COMPONENTS
// ============================================================

/**
 * Tab Navigation Component
 */
const TabNavigation = ({ activeTab, setActiveTab }) => {
  return (
    <div className="border-b border-slate-200 bg-white/80 backdrop-blur-sm rounded-t-2xl overflow-x-auto">
      <div className="flex px-4 space-x-1 min-w-max">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all duration-200 whitespace-nowrap ${
                isActive
                  ? `border-${tab.color}-500 text-${tab.color}-600`
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={18} className={isActive ? `text-${tab.color}-500` : ''} />
              <span className="text-sm font-medium">{tab.label}</span>
              {isActive && (
                <span className={`w-1.5 h-1.5 rounded-full bg-${tab.color}-500 animate-pulse`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Loading Spinner Component
 */
const LoadingSpinner = ({ message = 'Loading data...' }) => (
  <div className="flex justify-center items-center h-96 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/50">
    <div className="text-center">
      <HashLoader color="#3b82f6" size={50} />
      <p className="text-slate-500 mt-4 font-medium">{message}</p>
    </div>
  </div>
);

/**
 * Empty State Component
 */
const EmptyState = ({ onReset }) => (
  <tr>
    <td colSpan="8" className="px-4 py-12 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="p-4 bg-slate-50 rounded-full">
          <FiAlertCircle size={40} className="text-slate-300" />
        </div>
        <p className="text-slate-600 font-medium">No materials found</p>
        <p className="text-slate-400 text-sm">Try adjusting your filters or search criteria</p>
        <button
          onClick={onReset}
          className="mt-2 px-4 py-2 text-blue-600 hover:text-blue-700 text-sm font-medium hover:bg-blue-50 rounded-lg transition-colors"
        >
          Clear all filters
        </button>
      </div>
    </td>
  </tr>
);

// ============================================================
// 5. MAIN COMPONENT
// ============================================================

function Inventory() {
  // ============================================================
  // 5.1 CONTEXT & REFS
  // ============================================================
  
  const { cndata, apiKey } = useContext(GetDataContext);
  const tableRef = useRef(null);

  // ============================================================
  // 5.2 STATE MANAGEMENT
  // ============================================================
  
  // UI State
  const [activeTab, setActiveTab] = useState('inventory');
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [expandedRows, setExpandedRows] = useState({});

  // Data State
  const [receives, setReceives] = useState([]);
  const [issues, setIssues] = useState([]);
  const [inventoryStatement, setInventoryStatement] = useState([]);
  const [materialData, setMaterialData] = useState([]);

  // Filter State
  const [filters, setFilters] = useState({
    company: "all",
    category: "all",
    subcategory: "all",
    material: "all",
    search: "",
    negativeGap: false,
    zeroBalance: false,
    lowStock: false,
    startDate: null,
    endDate: null,
    showAll: false,
  });

  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  
  // Sort State
  const [sortConfig, setSortConfig] = useState({ key: "itemName", direction: "asc" });

  // Filter Options State
  const [filterOptions, setFilterOptions] = useState({
    companies: [],
    categories: [],
    subCategories: [],
    materials: [],
  });

  // ============================================================
  // 5.3 DATA FETCHING
  // ============================================================

  /**
   * Fetch all inventory data from API
   */
  const fetchInventoryData = useCallback(async () => {
    // Validate date selection
    if (!cndata?.startDate || !cndata?.endDate) {
      toast.error("Please select start and end dates!");
      return;
    }

    setLoading(true);
    setPage(1);

    const startDate = cndata.startDate.toISOString().split("T")[0];
    const endDate = cndata.endDate.toISOString().split("T")[0];

    try {
      // Fetch all three data sources in parallel
      const [receiveResponse, issueResponse, statementResponse] = await Promise.all([
        axios.get(
          `${API_BASE}/SCM_GetMaterialReceiveDetail?CompanyID=1&ParentCategoryID=6&CategoryID=0&SubCategoryID=0&MainMaterialID=0&StartDate=${startDate}&EndDate=${endDate}&CommandID=0`,
          { headers: { Authorization: `${apiKey}` } }
        ),
        axios.get(
          `${API_BASE}/SCM_GET_MaterialIssueDetail?CompanyID=1&ParentCategoryID=6&CategoryID=0&SubCategoryID=0&MainMaterialID=0&StartDate=${startDate}&EndDate=${endDate}&CommandID=2`,
          { headers: { Authorization: `${apiKey}` } }
        ),
        axios.get(
          `${API_BASE}/BI_SCM_GETInventoryStatement?CompanyID=1&ParentCategoryID=6&CategoryID=0&SubCategoryID=0&MaterialID=0&StartDate=${startDate}&EndDate=${endDate}&CommandID=2&EmpID=0`,
          { headers: { Authorization: `${apiKey}` } }
        ),
      ]);

      const receiveData = receiveResponse.data || [];
      const issueData = issueResponse.data || [];
      const statementData = statementResponse.data || [];

      // Store raw data
      setReceives(receiveData);
      setIssues(issueData);
      setInventoryStatement(statementData);

      // Build filter options
      const allItems = [...receiveData, ...issueData];
      setFilterOptions({
        companies: _.uniq(allItems.map(x => x.CompanyName).filter(Boolean)),
        categories: _.uniq(allItems.map(x => x.CategoryName).filter(Boolean)),
        subCategories: _.uniq(allItems.map(x => x.SubCategoryName).filter(Boolean)),
        materials: _.uniq(statementData.map(x => x.MaterialName).filter(Boolean)),
      });

      // Process material data with timeline
      const processedMaterials = processMaterialData(
        statementData,
        receiveData,
        issueData,
        cndata.startDate
      );

      setMaterialData(processedMaterials);
      
      // Update filters with dates
      setFilters(prev => ({
        ...prev,
        startDate: cndata.startDate,
        endDate: cndata.endDate,
      }));

      toast.success(`✓ Loaded ${processedMaterials.length} materials successfully!`);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error(error?.response?.data?.message || "Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [cndata, apiKey]);

  /**
   * Process raw data into structured material information with timeline
   */
  const processMaterialData = (statementData, receiveData, issueData, startDate) => {
    return statementData.map((item) => {
      const materialName = item.MaterialName;
      
      // Get opening balance
      const openingQty = OPENING_BALANCES[materialName] || 0;
      
      // Filter transactions for this material
      const materialReceives = receiveData
        .filter(d => d.MaterialName === materialName)
        .sort((a, b) => new Date(a.GRNDate) - new Date(b.GRNDate));
      
      const materialIssues = issueData
        .filter(d => d.MaterialName === materialName)
        .sort((a, b) => new Date(a.IssueDate) - new Date(b.IssueDate));

      // Build transaction timeline
      let timeline = [];
      let runningBalance = openingQty;

      // Add opening balance if exists
      if (openingQty > 0) {
        timeline.push({
          type: "Opening",
          date: startDate,
          reference: "OPENING",
          receiveQty: openingQty,
          issueQty: 0,
          runningBalance: openingQty,
          remarks: "Opening Balance",
          isOpening: true,
        });
      }

      // Add receive transactions
      materialReceives.forEach(rec => {
        const qty = Number(rec.ActualReceiveQTY || 0);
        runningBalance += qty;
        timeline.push({
          type: "Receive",
          date: rec.GRNDate,
          reference: rec.GRNNo || "N/A",
          receiveQty: qty,
          issueQty: 0,
          runningBalance: runningBalance,
          remarks: rec.VendorName || "N/A",
        });
      });

      // Add issue transactions
      materialIssues.forEach(issue => {
        const qty = Number(issue.IssueQTY || 0);
        runningBalance -= qty;
        timeline.push({
          type: "Issue",
          date: issue.IssueDate,
          reference: issue.IssueNo || issue.RequisitionNo || "N/A",
          receiveQty: 0,
          issueQty: qty,
          runningBalance: runningBalance,
          remarks: issue.IssuedBy || issue.JobCardNo || "N/A",
        });
      });

      // Sort timeline by date
      timeline = timeline.sort((a, b) => new Date(a.date) - new Date(b.date));

      // Calculate totals
      const totalReceive = materialReceives.reduce(
        (sum, r) => sum + Number(r.ActualReceiveQTY || 0), 
        openingQty
      );
      const totalIssue = materialIssues.reduce(
        (sum, i) => sum + Number(i.IssueQTY || 0), 
        0
      );

      return {
        name: materialName,
        balance: runningBalance,
        openingBalance: openingQty,
        totalReceive: totalReceive,
        totalIssue: totalIssue,
        gap: totalReceive - totalIssue,
        timeline: timeline,
        transactionCount: timeline.length,
      };
    });
  };

  // ============================================================
  // 5.4 DATA PROCESSING (Filtering & Sorting)
  // ============================================================

  /**
   * Apply filters and sorting to material data
   */
  const processedData = useMemo(() => {
    let data = [...materialData];

    // Apply filters
    if (filters.company !== "all") {
      data = data.filter(item => 
        item.timeline.some(t => t.remarks === filters.company)
      );
    }

    if (filters.category !== "all") {
      data = data.filter(item => 
        item.timeline.some(t => t.remarks === filters.category)
      );
    }

    if (filters.subcategory !== "all") {
      data = data.filter(item => 
        item.timeline.some(t => t.remarks === filters.subcategory)
      );
    }

    if (filters.material !== "all") {
      data = data.filter(item => item.name === filters.material);
    }

    if (filters.search.trim() !== "") {
      const searchTerm = filters.search.toLowerCase();
      data = data.filter(item => 
        item.name.toLowerCase().includes(searchTerm) ||
        item.timeline.some(t => 
          String(t.remarks).toLowerCase().includes(searchTerm) ||
          String(t.reference).toLowerCase().includes(searchTerm)
        )
      );
    }

    if (filters.negativeGap) {
      data = data.filter(item => item.gap < 0);
    }

    if (filters.zeroBalance) {
      data = data.filter(item => Math.abs(item.balance) < 0.01);
    }

    if (filters.lowStock) {
      data = data.filter(item => item.balance > 0 && item.balance < LOW_STOCK_THRESHOLD);
    }

    // Apply sorting
    data = _.orderBy(data, [sortConfig.key], [sortConfig.direction]);

    return data;
  }, [materialData, filters, sortConfig]);

  /**
   * Calculate summary statistics
   */
  const summaryStats = useMemo(() => {
    const totalItems = processedData.length;
    const negativeGapItems = processedData.filter(item => item.gap < 0).length;
    const zeroBalanceItems = processedData.filter(item => Math.abs(item.balance) < 0.01).length;
    const lowStockItems = processedData.filter(
      item => item.balance > 0 && item.balance < LOW_STOCK_THRESHOLD
    ).length;
    
    const totalBalance = processedData.reduce((sum, item) => sum + item.balance, 0);
    const totalReceives = processedData.reduce((sum, item) => sum + item.totalReceive, 0);
    const totalIssues = processedData.reduce((sum, item) => sum + item.totalIssue, 0);
    
    const healthyItems = totalItems - negativeGapItems - zeroBalanceItems;
    const healthScore = totalItems > 0 
      ? ((totalItems - negativeGapItems - zeroBalanceItems) / totalItems * 100).toFixed(1)
      : 0;

    return {
      totalItems,
      negativeGapItems,
      zeroBalanceItems,
      lowStockItems,
      healthyItems,
      totalBalance: totalBalance.toFixed(2),
      totalReceives: totalReceives.toFixed(2),
      totalIssues: totalIssues.toFixed(2),
      healthScore: Number(healthScore),
    };
  }, [processedData]);

  // ============================================================
  // 5.5 PAGINATION
  // ============================================================

  const totalPages = Math.max(1, Math.ceil(processedData.length / pageSize));
  const paginatedData = filters.showAll 
    ? processedData 
    : processedData.slice((page - 1) * pageSize, page * pageSize);

  const handlePageChange = useCallback((newPage) => {
    setPage(Math.min(Math.max(1, newPage), totalPages));
    if (tableRef.current) {
      tableRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [totalPages]);

  // ============================================================
  // 5.6 EVENT HANDLERS
  // ============================================================

  const toggleRowExpansion = useCallback((name) => {
    setExpandedRows(prev => ({ ...prev, [name]: !prev[name] }));
  }, []);

  const toggleSort = useCallback((key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      company: "all",
      category: "all",
      subcategory: "all",
      material: "all",
      search: "",
      negativeGap: false,
      zeroBalance: false,
      lowStock: false,
    }));
    setPage(1);
    toast.info("Filters have been reset");
  }, []);

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);


/**
 * Export inventory data to professional Excel with full styling
 * Data sorted from NEWEST to OLDEST
 */
const exportToExcel = useCallback(async () => {
  try {
    toast.info('📊 Generating professional report...', { autoClose: false });

    // ============================================================
    // 1. CREATE UNIT MAPPING FROM RECEIVES & ISSUES
    // ============================================================
    
    const unitMap = new Map();
    
    receives.forEach(item => {
      if (item.MaterialName && item.Unit) {
        unitMap.set(item.MaterialName, item.Unit);
      }
    });
    
    issues.forEach(item => {
      if (item.MaterialName && item.UnitName) {
        unitMap.set(item.MaterialName, item.UnitName);
      }
    });
    
    inventoryStatement.forEach(item => {
      if (item.MaterialName && item.UnitName) {
        unitMap.set(item.MaterialName, item.UnitName);
      }
    });

    // ============================================================
    // 2. SORT DATA - NEWEST TO OLDEST
    // ============================================================
    
    // Sort receives by GRN Date (newest first)
const sortedReceives = [...receives].sort((a, b) => {
  const dateA = new Date(a.GRNDate || 0);
  const dateB = new Date(b.GRNDate || 0);
  return dateB - dateA; // Descending = newest first
});

// Sort issues by Issue Date (newest first)
const sortedIssues = [...issues].sort((a, b) => {
  const dateA = new Date(a.IssueDate || 0);
  const dateB = new Date(b.IssueDate || 0);
  return dateB - dateA;
});

// Sort requisitions by Date (newest first)
const sortedRequisitions = [...issues]
  .filter(i => i.RequisitionNo)
  .sort((a, b) => {
    const dateA = new Date(a.RequisitionDate || 0);
    const dateB = new Date(b.RequisitionDate || 0);
    return dateB - dateA;
  });

    // Sort inventory statement by Balance QTY (highest first) or by name
    const sortedInventory = [...inventoryStatement].sort((a, b) => {
      // Sort by Balance QTY descending (highest first)
      return (Number(b.BalanceQTY || 0) - Number(a.BalanceQTY || 0));
    });

    // ============================================================
    // 3. CALCULATE TURNOVER & STATISTICS
    // ============================================================
    
    const totalReceiveValue = receives.reduce((sum, r) => 
      sum + Number(r.ReceiveValue || r.ActualReceiveQTY * r.ActualReceivePrice || 0), 0
    );
    
    const totalIssueValue = issues.reduce((sum, i) => 
      sum + Number(i.IssueValue || i.IssueQTY * i.IssuePrice || 0), 0
    );
    
    const annualTurnover = totalReceiveValue * 12;

    const totalQtyInHand = inventoryStatement.reduce((sum, item) => 
      sum + Number(item.BalanceQTY || 0), 0
    );
    
    const totalAvailableQty = receives.reduce((sum, r) => 
      sum + Number(r.ActualReceiveQTY || 0), 0
    );
    
    const totalQtyToShip = issues.reduce((sum, i) => 
      sum + Number(i.IssueQTY || 0), 0
    );
    
    const totalIncomingQty = receives.reduce((sum, r) => 
      sum + Number(r.ActualReceiveQTY || 0), 0
    );

    // ============================================================
    // 4. STYLE DEFINITIONS
    // ============================================================
    
    const STYLES = {
      title: {
        font: { bold: true, sz: 22, color: { rgb: "1A3A5C" }, name: 'Calibri' },
        alignment: { horizontal: "center", vertical: "center" },
        fill: { fgColor: { rgb: "E8EDF5" } },
        border: {
          top: { style: "medium", color: { rgb: "1A3A5C" } },
          bottom: { style: "medium", color: { rgb: "1A3A5C" } },
          left: { style: "medium", color: { rgb: "1A3A5C" } },
          right: { style: "medium", color: { rgb: "1A3A5C" } }
        }
      },
      
      subtitle: {
        font: { sz: 12, color: { rgb: "4A5568" }, name: 'Calibri' },
        alignment: { horizontal: "center", vertical: "center" }
      },
      
      sectionHeader: {
        font: { bold: true, sz: 16, color: { rgb: "1A3A5C" }, name: 'Calibri' },
        fill: { fgColor: { rgb: "F0F4F8" } },
        alignment: { horizontal: "left", vertical: "center" },
        border: {
          bottom: { style: "medium", color: { rgb: "1A3A5C" } }
        }
      },

      headerBlue: {
        font: { bold: true, sz: 11, color: { rgb: "FFFFFF" }, name: 'Calibri' },
        fill: { fgColor: { rgb: "1A56DB" } },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border: {
          top: { style: "medium", color: { rgb: "153E7C" } },
          bottom: { style: "medium", color: { rgb: "153E7C" } },
          left: { style: "medium", color: { rgb: "153E7C" } },
          right: { style: "medium", color: { rgb: "153E7C" } }
        }
      },
      headerGreen: {
        font: { bold: true, sz: 11, color: { rgb: "FFFFFF" }, name: 'Calibri' },
        fill: { fgColor: { rgb: "059669" } },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border: {
          top: { style: "medium", color: { rgb: "047857" } },
          bottom: { style: "medium", color: { rgb: "047857" } },
          left: { style: "medium", color: { rgb: "047857" } },
          right: { style: "medium", color: { rgb: "047857" } }
        }
      },
      headerOrange: {
        font: { bold: true, sz: 11, color: { rgb: "FFFFFF" }, name: 'Calibri' },
        fill: { fgColor: { rgb: "D97706" } },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border: {
          top: { style: "medium", color: { rgb: "B45309" } },
          bottom: { style: "medium", color: { rgb: "B45309" } },
          left: { style: "medium", color: { rgb: "B45309" } },
          right: { style: "medium", color: { rgb: "B45309" } }
        }
      },
      headerPurple: {
        font: { bold: true, sz: 11, color: { rgb: "FFFFFF" }, name: 'Calibri' },
        fill: { fgColor: { rgb: "7C3AED" } },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border: {
          top: { style: "medium", color: { rgb: "6D28D9" } },
          bottom: { style: "medium", color: { rgb: "6D28D9" } },
          left: { style: "medium", color: { rgb: "6D28D9" } },
          right: { style: "medium", color: { rgb: "6D28D9" } }
        }
      },
      headerRose: {
        font: { bold: true, sz: 11, color: { rgb: "FFFFFF" }, name: 'Calibri' },
        fill: { fgColor: { rgb: "E11D48" } },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border: {
          top: { style: "medium", color: { rgb: "BE123C" } },
          bottom: { style: "medium", color: { rgb: "BE123C" } },
          left: { style: "medium", color: { rgb: "BE123C" } },
          right: { style: "medium", color: { rgb: "BE123C" } }
        }
      },

      kpiLabel: {
        font: { bold: true, sz: 11, color: { rgb: "FFFFFF" }, name: 'Calibri' },
        fill: { fgColor: { rgb: "1A56DB" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "medium", color: { rgb: "153E7C" } },
          bottom: { style: "medium", color: { rgb: "153E7C" } },
          left: { style: "medium", color: { rgb: "153E7C" } },
          right: { style: "medium", color: { rgb: "153E7C" } }
        }
      },
      kpiValue: {
        font: { bold: true, sz: 16, color: { rgb: "1A3A5C" }, name: 'Calibri' },
        fill: { fgColor: { rgb: "E8EDF5" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "1A3A5C" } },
          bottom: { style: "medium", color: { rgb: "1A3A5C" } },
          left: { style: "medium", color: { rgb: "1A3A5C" } },
          right: { style: "medium", color: { rgb: "1A3A5C" } }
        }
      },
      kpiValueGreen: {
        font: { bold: true, sz: 16, color: { rgb: "059669" }, name: 'Calibri' },
        fill: { fgColor: { rgb: "D1FAE5" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "059669" } },
          bottom: { style: "medium", color: { rgb: "059669" } },
          left: { style: "medium", color: { rgb: "059669" } },
          right: { style: "medium", color: { rgb: "059669" } }
        }
      },
      kpiValueRed: {
        font: { bold: true, sz: 16, color: { rgb: "DC2626" }, name: 'Calibri' },
        fill: { fgColor: { rgb: "FEE2E2" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "DC2626" } },
          bottom: { style: "medium", color: { rgb: "DC2626" } },
          left: { style: "medium", color: { rgb: "DC2626" } },
          right: { style: "medium", color: { rgb: "DC2626" } }
        }
      },

      cellLeft: {
        font: { sz: 10, name: 'Calibri' },
        alignment: { horizontal: "left", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "D1D5DB" } },
          bottom: { style: "thin", color: { rgb: "D1D5DB" } },
          left: { style: "thin", color: { rgb: "D1D5DB" } },
          right: { style: "thin", color: { rgb: "D1D5DB" } }
        }
      },
      cellCenter: {
        font: { sz: 10, name: 'Calibri' },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "D1D5DB" } },
          bottom: { style: "thin", color: { rgb: "D1D5DB" } },
          left: { style: "thin", color: { rgb: "D1D5DB" } },
          right: { style: "thin", color: { rgb: "D1D5DB" } }
        }
      },
      cellRight: {
        font: { sz: 10, name: 'Calibri' },
        alignment: { horizontal: "right", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "D1D5DB" } },
          bottom: { style: "thin", color: { rgb: "D1D5DB" } },
          left: { style: "thin", color: { rgb: "D1D5DB" } },
          right: { style: "thin", color: { rgb: "D1D5DB" } }
        }
      },
      cellBold: {
        font: { bold: true, sz: 10, name: 'Calibri' },
        alignment: { horizontal: "left", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "D1D5DB" } },
          bottom: { style: "thin", color: { rgb: "D1D5DB" } },
          left: { style: "thin", color: { rgb: "D1D5DB" } },
          right: { style: "thin", color: { rgb: "D1D5DB" } }
        }
      },
      cellRightBold: {
        font: { bold: true, sz: 10, name: 'Calibri' },
        alignment: { horizontal: "right", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "D1D5DB" } },
          bottom: { style: "thin", color: { rgb: "D1D5DB" } },
          left: { style: "thin", color: { rgb: "D1D5DB" } },
          right: { style: "thin", color: { rgb: "D1D5DB" } }
        }
      },

      rowEven: {
        font: { sz: 10, name: 'Calibri' },
        fill: { fgColor: { rgb: "F9FAFB" } },
        alignment: { horizontal: "left", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "D1D5DB" } },
          bottom: { style: "thin", color: { rgb: "D1D5DB" } },
          left: { style: "thin", color: { rgb: "D1D5DB" } },
          right: { style: "thin", color: { rgb: "D1D5DB" } }
        }
      },
      rowOdd: {
        font: { sz: 10, name: 'Calibri' },
        alignment: { horizontal: "left", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "D1D5DB" } },
          bottom: { style: "thin", color: { rgb: "D1D5DB" } },
          left: { style: "thin", color: { rgb: "D1D5DB" } },
          right: { style: "thin", color: { rgb: "D1D5DB" } }
        }
      },
      rowEvenRight: {
        font: { sz: 10, name: 'Calibri' },
        fill: { fgColor: { rgb: "F9FAFB" } },
        alignment: { horizontal: "right", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "D1D5DB" } },
          bottom: { style: "thin", color: { rgb: "D1D5DB" } },
          left: { style: "thin", color: { rgb: "D1D5DB" } },
          right: { style: "thin", color: { rgb: "D1D5DB" } }
        }
      },
      rowOddRight: {
        font: { sz: 10, name: 'Calibri' },
        alignment: { horizontal: "right", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "D1D5DB" } },
          bottom: { style: "thin", color: { rgb: "D1D5DB" } },
          left: { style: "thin", color: { rgb: "D1D5DB" } },
          right: { style: "thin", color: { rgb: "D1D5DB" } }
        }
      },

      statusGreen: {
        font: { bold: true, color: { rgb: "065F46" }, sz: 10, name: 'Calibri' },
        fill: { fgColor: { rgb: "D1FAE5" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "A7F3D0" } },
          bottom: { style: "thin", color: { rgb: "A7F3D0" } },
          left: { style: "thin", color: { rgb: "A7F3D0" } },
          right: { style: "thin", color: { rgb: "A7F3D0" } }
        }
      },
      statusYellow: {
        font: { bold: true, color: { rgb: "92400E" }, sz: 10, name: 'Calibri' },
        fill: { fgColor: { rgb: "FEF3C7" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "FDE68A" } },
          bottom: { style: "thin", color: { rgb: "FDE68A" } },
          left: { style: "thin", color: { rgb: "FDE68A" } },
          right: { style: "thin", color: { rgb: "FDE68A" } }
        }
      },
      statusRed: {
        font: { bold: true, color: { rgb: "991B1B" }, sz: 10, name: 'Calibri' },
        fill: { fgColor: { rgb: "FEE2E2" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "FCA5A5" } },
          bottom: { style: "thin", color: { rgb: "FCA5A5" } },
          left: { style: "thin", color: { rgb: "FCA5A5" } },
          right: { style: "thin", color: { rgb: "FCA5A5" } }
        }
      },
      statusBlue: {
        font: { bold: true, color: { rgb: "1E40AF" }, sz: 10, name: 'Calibri' },
        fill: { fgColor: { rgb: "DBEAFE" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "93C5FD" } },
          bottom: { style: "thin", color: { rgb: "93C5FD" } },
          left: { style: "thin", color: { rgb: "93C5FD" } },
          right: { style: "thin", color: { rgb: "93C5FD" } }
        }
      }
    };

    // ============================================================
    // 5. HELPER FUNCTION
    // ============================================================
    const applyStyleToRow = (sheet, row, startCol, endCol, style) => {
      for (let C = startCol; C <= endCol; C++) {
        const address = XLSX.utils.encode_cell({ r: row, c: C });
        if (sheet[address]) {
          sheet[address].s = style;
        }
      }
    };

    // ============================================================
    // 6. SHEET 1: EXECUTIVE SUMMARY
    // ============================================================
    const summaryData = [];

    summaryData.push(['INVENTORY MANAGEMENT REPORT']);
    summaryData.push([`${issues[0]?.CompanyName || 'Texas Packages & Accessories Ltd.'}`]);
    summaryData.push([`Annual Turnover: $${annualTurnover.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`]);
    summaryData.push([`Production: ${issues[0]?.Department || 'Manufacturing'} | Location: ${issues[0]?.CompanyName || 'Bangladesh'}`]);
    summaryData.push([]);
    summaryData.push([]);

    summaryData.push(['KEY PERFORMANCE INDICATORS']);
    summaryData.push([]);
    summaryData.push([
      'Total Quantity in Hand',
      'Total Available Quantity',
      'Total Quantity to Ship',
      'Total Incoming Quantity'
    ]);
    summaryData.push([
      totalQtyInHand.toFixed(2),
      totalAvailableQty.toFixed(2),
      totalQtyToShip.toFixed(2),
      totalIncomingQty.toFixed(2)
    ]);
    summaryData.push([]);
    summaryData.push([]);

    summaryData.push(['FINANCIAL SUMMARY']);
    summaryData.push([]);
    summaryData.push([
      'Total Receive Value',
      'Total Issue Value',
      'Inventory Value',
      'Annual Turnover'
    ]);
    summaryData.push([
      `$${totalReceiveValue.toFixed(2)}`,
      `$${totalIssueValue.toFixed(2)}`,
      `$${(totalReceiveValue - totalIssueValue).toFixed(2)}`,
      `$${annualTurnover.toFixed(2)}`
    ]);
    summaryData.push([]);
    summaryData.push([]);

    summaryData.push(['STOCK SUMMARY']);
    summaryData.push([]);
    summaryData.push([
      'Total Materials',
      'Total Balance QTY',
      'Average Price',
      'Total Categories'
    ]);
    
    const uniqueCategories = [...new Set(inventoryStatement.map(item => item.CategoryName))];
    const avgPrice = receives.length > 0 
      ? receives.reduce((sum, r) => sum + Number(r.ActualReceivePrice || 0), 0) / receives.length 
      : 0;
      
    summaryData.push([
      inventoryStatement.length,
      totalQtyInHand.toFixed(2),
      `$${avgPrice.toFixed(2)}`,
      uniqueCategories.length
    ]);

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    summarySheet['!cols'] = [
      { wch: 30 }, { wch: 30 }, { wch: 25 }, { wch: 25 }
    ];

    summarySheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
      { s: { r: 6, c: 0 }, e: { r: 6, c: 3 } },
      { s: { r: 13, c: 0 }, e: { r: 13, c: 3 } },
      { s: { r: 20, c: 0 }, e: { r: 20, c: 3 } },
    ];

    if (summarySheet['A1']) summarySheet['A1'].s = STYLES.title;
    if (summarySheet['A2']) summarySheet['A2'].s = STYLES.subtitle;
    if (summarySheet['A3']) summarySheet['A3'].s = { ...STYLES.subtitle, font: { ...STYLES.subtitle.font, color: { rgb: "059669" }, bold: true } };
    if (summarySheet['A4']) summarySheet['A4'].s = STYLES.subtitle;
    if (summarySheet['A7']) summarySheet['A7'].s = STYLES.sectionHeader;
    if (summarySheet['A14']) summarySheet['A14'].s = STYLES.sectionHeader;
    if (summarySheet['A21']) summarySheet['A21'].s = STYLES.sectionHeader;

    applyStyleToRow(summarySheet, 9, 0, 3, STYLES.kpiLabel);
    applyStyleToRow(summarySheet, 10, 0, 3, STYLES.kpiValue);

    applyStyleToRow(summarySheet, 16, 0, 3, { ...STYLES.kpiLabel, fill: { fgColor: { rgb: "059669" } } });
    applyStyleToRow(summarySheet, 17, 0, 3, STYLES.kpiValueGreen);

    applyStyleToRow(summarySheet, 23, 0, 3, { ...STYLES.kpiLabel, fill: { fgColor: { rgb: "7C3AED" } } });
    applyStyleToRow(summarySheet, 24, 0, 3, { ...STYLES.kpiValue, fill: { fgColor: { rgb: "EDE9FE" } } });

    // ============================================================
    // 7. SHEET 2: INVENTORY STATEMENT (SORTED - HIGHEST BALANCE FIRST)
    // ============================================================
    const inventoryData = [
      ['SL', 'Material Name', 'Material Code', 'Balance QTY', 'Unit', 'Category', 'Sub Category']
    ];

    sortedInventory.forEach((item, index) => {
      let unit = item.UnitName || 'N/A';
      if (unit === 'N/A' && item.MaterialName) {
        unit = unitMap.get(item.MaterialName) || 'N/A';
      }
      
      inventoryData.push([
        index + 1,
        item.MaterialName || 'N/A',
        item.MaterialCode || 'N/A',
        Number(item.BalanceQTY || 0).toFixed(2),
        unit,
        item.CategoryName || 'N/A',
        item.SubCategoryName || 'N/A'
      ]);
    });

    const invSheet = XLSX.utils.aoa_to_sheet(inventoryData);
    invSheet['!cols'] = [
      { wch: 8 }, { wch: 45 }, { wch: 20 }, { wch: 15 }, 
      { wch: 12 }, { wch: 25 }, { wch: 25 }
    ];

    applyStyleToRow(invSheet, 0, 0, 6, STYLES.headerPurple);

    for (let row = 1; row < inventoryData.length; row++) {
      const isEven = row % 2 === 0;
      for (let col = 0; col < inventoryData[row].length; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        if (!invSheet[cellRef]) continue;

        if (col === 0 || col === 4 || col === 5 || col === 6) {
          invSheet[cellRef].s = isEven ? STYLES.rowEven : STYLES.rowOdd;
        } else if (col === 1) {
          invSheet[cellRef].s = isEven ? STYLES.rowEven : STYLES.rowOdd;
          invSheet[cellRef].s.font = { ...invSheet[cellRef].s.font, bold: true };
        } else if (col === 3) {
          const balance = parseFloat(inventoryData[row][col]);
          const style = isEven ? STYLES.rowEvenRight : STYLES.rowOddRight;
          if (balance <= 0) {
            invSheet[cellRef].s = { ...style, font: { ...style.font, color: { rgb: "DC2626" }, bold: true } };
          } else if (balance < 50) {
            invSheet[cellRef].s = { ...style, font: { ...style.font, color: { rgb: "D97706" }, bold: true } };
          } else {
            invSheet[cellRef].s = { ...style, font: { ...style.font, color: { rgb: "059669" }, bold: true } };
          }
        } else {
          invSheet[cellRef].s = isEven ? STYLES.rowEven : STYLES.rowOdd;
        }
      }
    }

    // ============================================================
    // 8. SHEET 3: RECEIVES (SORTED - NEWEST FIRST)
    // ============================================================
    const receiveData = [
      ['GRN No', 'Material Name', 'Material Code', 'Receive QTY', 'Unit', 'Unit Price', 'Total Value', 'Vendor', 'GRN Date']
    ];

    sortedReceives.forEach((item) => {
      const qty = Number(item.ActualReceiveQTY || 0);
      const price = Number(item.ActualReceivePrice || 0);
      const total = qty * price;
      
      receiveData.push([
        item.GRNNo || 'N/A',
        item.MaterialName || 'N/A',
        item.MaterialCode || 'N/A',
        qty.toFixed(2),
        item.Unit || 'KG',
        `$${price.toFixed(2)}`,
        `$${total.toFixed(2)}`,
        item.VendorName || 'N/A',
        formatDate(item.GRNDate)
      ]);
    });

    const recSheet = XLSX.utils.aoa_to_sheet(receiveData);
    recSheet['!cols'] = [
      { wch: 20 }, { wch: 45 }, { wch: 20 }, { wch: 15 }, 
      { wch: 12 }, { wch: 15 }, { wch: 18 }, { wch: 30 }, { wch: 15 }
    ];

    applyStyleToRow(recSheet, 0, 0, 8, STYLES.headerGreen);

    for (let row = 1; row < receiveData.length; row++) {
      const isEven = row % 2 === 0;
      for (let col = 0; col < receiveData[row].length; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        if (!recSheet[cellRef]) continue;

        if (col === 3) {
          const style = isEven ? STYLES.rowEvenRight : STYLES.rowOddRight;
          recSheet[cellRef].s = { ...style, font: { ...style.font, color: { rgb: "059669" }, bold: true } };
        } else if (col === 5 || col === 6) {
          const style = isEven ? STYLES.rowEvenRight : STYLES.rowOddRight;
          recSheet[cellRef].s = { ...style, font: { ...style.font, color: { rgb: "1A56DB" }, bold: true } };
        } else if (col === 1) {
          recSheet[cellRef].s = isEven ? STYLES.rowEven : STYLES.rowOdd;
          recSheet[cellRef].s.font = { ...recSheet[cellRef].s.font, bold: true };
        } else {
          recSheet[cellRef].s = isEven ? STYLES.rowEven : STYLES.rowOdd;
        }
      }
    }

    // ============================================================
    // 9. SHEET 4: ISSUES (SORTED - NEWEST FIRST)
    // ============================================================
    const issueData = [
      ['Issue No', 'Material Name', 'Material Code', 'Issue QTY', 'Unit', 'Unit Price', 'Total Value', 'Issued To', 'Issue Date']
    ];

    sortedIssues.forEach((item) => {
      const qty = Number(item.IssueQTY || 0);
      const price = Number(item.IssuePrice || 0);
      const total = qty * price;
      
      issueData.push([
        item.IssueNo || 'N/A',
        item.MaterialName || 'N/A',
        item.MaterialCode || 'N/A',
        qty.toFixed(2),
        item.UnitName || 'KG',
        `$${price.toFixed(2)}`,
        `$${total.toFixed(2)}`,
        item.IssuedBy || 'N/A',
        formatDate(item.IssueDate)
      ]);
    });

    const issSheet = XLSX.utils.aoa_to_sheet(issueData);
    issSheet['!cols'] = [
      { wch: 20 }, { wch: 45 }, { wch: 20 }, { wch: 15 }, 
      { wch: 12 }, { wch: 15 }, { wch: 18 }, { wch: 30 }, { wch: 15 }
    ];

    applyStyleToRow(issSheet, 0, 0, 8, STYLES.headerRose);

    for (let row = 1; row < issueData.length; row++) {
      const isEven = row % 2 === 0;
      for (let col = 0; col < issueData[row].length; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        if (!issSheet[cellRef]) continue;

        if (col === 3) {
          const style = isEven ? STYLES.rowEvenRight : STYLES.rowOddRight;
          issSheet[cellRef].s = { ...style, font: { ...style.font, color: { rgb: "DC2626" }, bold: true } };
        } else if (col === 5 || col === 6) {
          const style = isEven ? STYLES.rowEvenRight : STYLES.rowOddRight;
          issSheet[cellRef].s = { ...style, font: { ...style.font, color: { rgb: "DC2626" }, bold: true } };
        } else if (col === 1) {
          issSheet[cellRef].s = isEven ? STYLES.rowEven : STYLES.rowOdd;
          issSheet[cellRef].s.font = { ...issSheet[cellRef].s.font, bold: true };
        } else {
          issSheet[cellRef].s = isEven ? STYLES.rowEven : STYLES.rowOdd;
        }
      }
    }

    // ============================================================
    // 10. SHEET 5: REQUISITIONS (SORTED - NEWEST FIRST)
    // ============================================================
    const reqMap = new Map();
    sortedRequisitions.forEach(issue => {
      if (!issue.RequisitionNo) return;
      if (!reqMap.has(issue.RequisitionNo)) {
        reqMap.set(issue.RequisitionNo, {
          reqNo: issue.RequisitionNo,
          material: issue.MaterialName || 'N/A',
          qty: Number(issue.RequiredQTY || 0),
          unit: issue.UnitName || 'KG',
          dept: issue.Department || 'N/A',
          date: formatDate(issue.RequisitionDate),
          raisedBy: issue.RequistionRaiseBy || 'N/A',
          status: issue.IssueNo && issue.IssueNo !== 'N/A' ? 'Issued' : 'Pending'
        });
      }
    });

    const reqData = [
      ['Requisition No', 'Material Name', 'Required QTY', 'Unit', 'Department', 'Date', 'Raised By', 'Status']
    ];

    Array.from(reqMap.values()).forEach((req) => {
      reqData.push([
        req.reqNo,
        req.material,
        req.qty.toFixed(2),
        req.unit,
        req.dept,
        req.date,
        req.raisedBy,
        req.status
      ]);
    });

    const reqSheet = XLSX.utils.aoa_to_sheet(reqData);
    reqSheet['!cols'] = [
      { wch: 20 }, { wch: 45 }, { wch: 15 }, { wch: 12 }, 
      { wch: 25 }, { wch: 15 }, { wch: 25 }, { wch: 15 }
    ];

    applyStyleToRow(reqSheet, 0, 0, 7, STYLES.headerOrange);

    for (let row = 1; row < reqData.length; row++) {
      const isEven = row % 2 === 0;
      const status = reqData[row][7];
      
      for (let col = 0; col < reqData[row].length; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        if (!reqSheet[cellRef]) continue;

        if (col === 2) {
          const style = isEven ? STYLES.rowEvenRight : STYLES.rowOddRight;
          reqSheet[cellRef].s = { ...style, font: { ...style.font, color: { rgb: "D97706" }, bold: true } };
        } else if (col === 7) {
          reqSheet[cellRef].s = status === 'Issued' ? STYLES.statusGreen : STYLES.statusYellow;
        } else if (col === 1) {
          reqSheet[cellRef].s = isEven ? STYLES.rowEven : STYLES.rowOdd;
          reqSheet[cellRef].s.font = { ...reqSheet[cellRef].s.font, bold: true };
        } else {
          reqSheet[cellRef].s = isEven ? STYLES.rowEven : STYLES.rowOdd;
        }
      }
    }

    // ============================================================
    // 11. CREATE WORKBOOK & DOWNLOAD
    // ============================================================
    const wb = XLSX.utils.book_new();
    
    XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");
    XLSX.utils.book_append_sheet(wb, invSheet, "Inventory");
    XLSX.utils.book_append_sheet(wb, recSheet, "Receives");
    XLSX.utils.book_append_sheet(wb, issSheet, "Issues");
    XLSX.utils.book_append_sheet(wb, reqSheet, "Requisitions");

    const fileName = `inventory_report_${new Date().toISOString().slice(0, 10)}.xlsx`;
    const wbout = XLSX.write(wb, { 
      bookType: "xlsx", 
      type: "array",
      cellStyles: true,
      bookSST: false
    });
    
    saveAs(
      new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      fileName
    );
    
    toast.dismiss();
    toast.success('✅ Professional report exported successfully!');
  } catch (error) {
    console.error("Export error:", error);
    toast.dismiss();
    toast.error("Failed to export report. Please try again.");
  }
}, [processedData, issues, receives, inventoryStatement, formatDate]);
  // ============================================================
  // 5.8 RENDER FUNCTIONS
  // ============================================================

  /**
   * Render inventory table with all features
   */
  const renderInventoryTable = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200">
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">#</th>
              <th 
                className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700"
                onClick={() => toggleSort("name")}
              >
                <div className="flex items-center gap-1">
                  Material
                  {sortConfig.key === "name" ? (
                    sortConfig.direction === "asc" ? <FaSortUp className="text-blue-500" /> : <FaSortDown className="text-blue-500" />
                  ) : (
                    <FaSort className="text-slate-300" />
                  )}
                </div>
              </th>
              <th 
                className="px-4 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700"
                onClick={() => toggleSort("totalReceive")}
              >
                <div className="flex items-center justify-end gap-1">
                  Receive
                  {sortConfig.key === "totalReceive" && (
                    sortConfig.direction === "asc" ? <FaSortUp className="text-blue-500" /> : <FaSortDown className="text-blue-500" />
                  )}
                </div>
              </th>
              <th 
                className="px-4 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700"
                onClick={() => toggleSort("totalIssue")}
              >
                <div className="flex items-center justify-end gap-1">
                  Issue
                  {sortConfig.key === "totalIssue" && (
                    sortConfig.direction === "asc" ? <FaSortUp className="text-blue-500" /> : <FaSortDown className="text-blue-500" />
                  )}
                </div>
              </th>
              <th 
                className="px-4 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700"
                onClick={() => toggleSort("balance")}
              >
                <div className="flex items-center justify-end gap-1">
                  Balance
                  {sortConfig.key === "balance" && (
                    sortConfig.direction === "asc" ? <FaSortUp className="text-blue-500" /> : <FaSortDown className="text-blue-500" />
                  )}
                </div>
              </th>
              <th className="px-4 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Gap</th>
              <th className="px-4 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedData.length === 0 && <EmptyState onReset={resetFilters} />}
            
            {paginatedData.map((item, index) => {
              const status = getInventoryStatus(item.balance, item.gap);
              const statusStyles = getStatusBadgeStyles(status.type);
              const isExpanded = expandedRows[item.name];
              const rowNumber = (page - 1) * pageSize + index + 1;

              return (
                <React.Fragment key={item.name}>
                  <tr className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-4 py-3.5 text-sm text-slate-400">{rowNumber}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleRowExpansion(item.name)}
                          className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                          aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                        >
                          {isExpanded ? (
                            <FiChevronDown size={16} className="text-blue-500" />
                          ) : (
                            <FiChevronUp size={16} className="text-slate-400" />
                          )}
                        </button>
                        <span className="font-medium text-slate-800 text-sm">{item.name}</span>
                        {item.openingBalance > 0 && (
                          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">
                            Opening: {item.openingBalance}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right text-sm font-medium text-emerald-600">
                      {Number(item.totalReceive).toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5 text-right text-sm font-medium text-rose-500">
                      {Number(item.totalIssue).toFixed(2)}
                    </td>
                    <td className={`px-4 py-3.5 text-right text-sm font-bold ${getBalanceColor(item.balance)}`}>
                      {Number(item.balance).toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5 text-right text-sm font-bold">
                      <div className="flex items-center justify-end gap-1.5">
                        {item.gap >= 0 ? (
                          <FiTrendingUp className="text-emerald-500" size={14} />
                        ) : (
                          <FiTrendingDown className="text-rose-500" size={14} />
                        )}
                        <span className={item.gap < 0 ? 'text-rose-600' : 'text-emerald-600'}>
                          {item.gap.toFixed(2)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusStyles.bg} ${statusStyles.text} ${statusStyles.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full bg-${status.color}-500`} />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center text-sm text-slate-400">
                      {item.transactionCount} events
                    </td>
                  </tr>

                  {/* Expanded row with transaction timeline */}
                  {isExpanded && (
                    <tr className="bg-slate-50/50">
                      <td colSpan="8" className="px-4 py-4">
                        <div className="overflow-x-auto max-h-96">
                          <table className="w-full text-sm">
                            <thead className="bg-white">
                              <tr>
                                <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">#</th>
                                <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                                <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Reference</th>
                                <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Receive</th>
                                <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Issue</th>
                                <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Balance</th>
                                <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Remarks</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {item.timeline.map((transaction, idx) => {
                                const isNegative = transaction.runningBalance < 0;
                                const isOpening = transaction.type === "Opening";
                                const isReceive = transaction.type === "Receive";
                                const isIssue = transaction.type === "Issue";

                                return (
                                  <tr key={idx} className={isNegative ? 'bg-rose-50/50' : 'hover:bg-white/50 transition-colors'}>
                                    <td className="px-3 py-2.5 text-slate-400">{idx + 1}</td>
                                    <td className="px-3 py-2.5 text-slate-700">{formatDate(transaction.date)}</td>
                                    <td className="px-3 py-2.5">
                                      <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${
                                        isOpening ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                        isReceive ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                        'bg-rose-50 text-rose-700 border border-rose-100'
                                      }`}>
                                        {transaction.reference || '-'}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2.5 text-right text-emerald-600 font-medium">
                                      {isReceive || isOpening ? transaction.receiveQty : '-'}
                                    </td>
                                    <td className="px-3 py-2.5 text-right text-rose-500 font-medium">
                                      {isIssue ? transaction.issueQty : '-'}
                                    </td>
                                    <td className={`px-3 py-2.5 text-right font-bold ${
                                      isNegative ? 'text-rose-600' : 
                                      transaction.runningBalance < LOW_STOCK_THRESHOLD ? 'text-amber-600' : 'text-slate-800'
                                    }`}>
                                      {Number(transaction.runningBalance).toFixed(2)}
                                    </td>
                                    <td className="px-3 py-2.5 text-slate-600 text-sm">
                                      {transaction.remarks || '-'}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {!filters.showAll && processedData.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 border-t border-slate-200 bg-slate-50/50">
          <div className="text-sm text-slate-500">
            Showing <span className="font-medium text-slate-700">
              {Math.min((page - 1) * pageSize + 1, processedData.length)}
            </span> -{' '}
            <span className="font-medium text-slate-700">
              {Math.min(page * pageSize, processedData.length)}
            </span> of{' '}
            <span className="font-medium text-slate-700">{processedData.length}</span> items
          </div>
          
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handlePageChange(1)}
              disabled={page === 1}
              className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-slate-600"
              aria-label="First page"
            >
              <FiChevronsLeft size={16} />
            </button>
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-slate-600"
              aria-label="Previous page"
            >
              <FiChevronLeft size={16} />
            </button>
            
            <span className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium border border-blue-100">
              {page} / {totalPages}
            </span>
            
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-slate-600"
              aria-label="Next page"
            >
              <FiChevronRight size={16} />
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-slate-600"
              aria-label="Last page"
            >
              <FiChevronsRight size={16} />
            </button>
            
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="ml-2 px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              aria-label="Items per page"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );

  /**
   * Render dashboard with summary statistics
   */
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Materials</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{summaryStats.totalItems}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Balance</p>
          <p className="text-3xl font-bold text-emerald-600 mt-1">{summaryStats.totalBalance}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Issues</p>
          <p className="text-3xl font-bold text-rose-600 mt-1">{summaryStats.totalIssues}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Health Score</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{summaryStats.healthScore}%</p>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <FiPieChart className="text-blue-500" />
            Stock Status Distribution
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
              <span className="text-sm text-emerald-700">Healthy Stock</span>
              <span className="text-sm font-bold text-emerald-700">
                {summaryStats.totalItems - summaryStats.negativeGapItems - summaryStats.zeroBalanceItems}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
              <span className="text-sm text-amber-700">Negative Gap</span>
              <span className="text-sm font-bold text-amber-700">{summaryStats.negativeGapItems}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-rose-50 rounded-xl">
              <span className="text-sm text-rose-700">Zero Balance</span>
              <span className="text-sm font-bold text-rose-700">{summaryStats.zeroBalanceItems}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
              <span className="text-sm text-blue-700">Low Stock</span>
              <span className="text-sm font-bold text-blue-700">{summaryStats.lowStockItems}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <FiActivity className="text-emerald-500" />
            Recent Issues
          </h3>
          <div className="space-y-3">
            {issues.slice(0, 5).map((issue, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="w-2 h-2 rounded-full bg-rose-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">
                    {issue.MaterialName || 'Unknown Material'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatDate(issue.IssueDate)} • QTY: {issue.IssueQTY || 0}
                  </p>
                </div>
                <span className="text-xs font-medium text-rose-600 bg-rose-50 px-2 py-1 rounded-full">
                  Issued
                </span>
              </div>
            ))}
            {issues.length === 0 && (
              <p className="text-center text-slate-400 py-8">No recent issues</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  /**
   * Render issues report
   */
  const renderIssuesReport = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-semibold text-slate-700 flex items-center gap-2">
          <FiTruck className="text-rose-500" />
          Issues Report ({issues.length} total)
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">#</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Material</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Issue Date</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Quantity</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Issued To</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Issue No</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Requisition No</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {issues.slice(0, 50).map((issue, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 text-sm text-slate-400">{idx + 1}</td>
                <td className="px-4 py-3 text-sm font-medium text-slate-700">{issue.MaterialName || 'N/A'}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{formatDate(issue.IssueDate)}</td>
                <td className="px-4 py-3 text-sm text-right font-medium text-rose-600">{issue.IssueQTY || 0}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{issue.IssuedBy || issue.JobCardNo || 'N/A'}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{issue.IssueNo || 'N/A'}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{issue.RequisitionNo || 'N/A'}</td>
              </tr>
            ))}
            {issues.length > 50 && (
              <tr>
                <td colSpan="7" className="px-4 py-3 text-center text-sm text-slate-400">
                  Showing first 50 of {issues.length} issues
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  /**
   * Render requisitions report
   */
  const renderRequisitionsReport = () => {
    // Group and deduplicate requisitions
    const requisitionMap = new Map();
    issues.forEach(issue => {
      if (!issue.RequisitionNo) return;
      
      if (!requisitionMap.has(issue.RequisitionNo)) {
        const isIssued = issues.some(i => 
          i.RequisitionNo === issue.RequisitionNo && 
          i.IssueNo && 
          i.IssueNo !== 'N/A' &&
          i.IssueNo !== ''
        );
        
        requisitionMap.set(issue.RequisitionNo, {
          material: issue.MaterialName || 'N/A',
          date: formatDate(issue.IssueDate),
          quantity: Number(issue.IssueQTY || 0),
          department: issue.DepartmentName || issue.JobCardNo || 'N/A',
          requisitionNo: issue.RequisitionNo,
          status: isIssued ? 'Issued' : 'Pending'
        });
      }
    });

    const requisitions = Array.from(requisitionMap.values());

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-700 flex items-center gap-2">
            <FiClipboard className="text-amber-500" />
            Requisitions Report ({requisitions.length} total)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Material</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Date</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Quantity</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Department</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Requisition No</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requisitions.map((req, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-slate-400">{idx + 1}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-700">{req.material}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{req.date}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-amber-600">{req.quantity.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{req.department}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{req.requisitionNo}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                      req.status === 'Issued' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {req.status}
                    </span>
                  </td>
                </tr>
              ))}
              {requisitions.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-slate-400">
                    No requisitions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  /**
   * Render stock report
   */
  const renderStockReport = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-semibold text-slate-700 flex items-center gap-2">
          <FiBarChart2 className="text-purple-500" />
          Stock Position Report
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Material</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Opening</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Receive</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Issue</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Balance</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {processedData.map((item, idx) => {
              const status = getInventoryStatus(item.balance, item.gap);
              const statusStyles = getStatusBadgeStyles(status.type);
              
              return (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-slate-700">{item.name}</td>
                  <td className="px-4 py-3 text-sm text-right text-slate-600">
                    {Number(item.openingBalance || 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-emerald-600">
                    {Number(item.totalReceive).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-rose-600">
                    {Number(item.totalIssue).toFixed(2)}
                  </td>
                  <td className={`px-4 py-3 text-sm text-right font-bold ${getBalanceColor(item.balance)}`}>
                    {Number(item.balance).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles.bg} ${statusStyles.text} ${statusStyles.border}`}>
                      {status.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  /**
   * Render full report (combination of all views)
   */
  const renderFullReport = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
          <FiFileText className="text-indigo-500" />
          Complete Management Report
        </h3>
        <button
          onClick={exportToExcel}
          className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center gap-2 font-medium"
        >
          <FiDownload size={18} />
          Export Full Report
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <p className="text-xs text-slate-400">Total Items</p>
          <p className="text-2xl font-bold text-slate-800">{summaryStats.totalItems}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <p className="text-xs text-slate-400">Total Balance</p>
          <p className="text-2xl font-bold text-emerald-600">{summaryStats.totalBalance}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <p className="text-xs text-slate-400">Total Issues</p>
          <p className="text-2xl font-bold text-rose-600">{summaryStats.totalIssues}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <p className="text-xs text-slate-400">Health Score</p>
          <p className="text-2xl font-bold text-blue-600">{summaryStats.healthScore}%</p>
        </div>
      </div>

      {renderInventoryTable()}
    </div>
  );

  // ============================================================
  // 5.9 MAIN RENDER
  // ============================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/25">
              <FiPackage className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Inventory Pro
              </h1>
              <p className="text-xs text-slate-400">Advanced Management System</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <DateRangePicker />
            <button
              onClick={fetchInventoryData}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Loading...' : 'Load Data'}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white/80 backdrop-blur-sm rounded-t-2xl shadow-sm border border-white/50 overflow-hidden mb-6">
          <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>

        {/* Filter Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/50 p-4 md:p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <FiFilter className="text-blue-500" />
              Filters
            </h3>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              {showFilters ? <FiEyeOff size={14} /> : <FiEye size={14} />}
              {showFilters ? 'Hide' : 'Show'}
            </button>
          </div>

          {showFilters && (
            <div className="space-y-4">
              {/* Filter Row 1 */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Company</label>
                  <select
                    value={filters.company}
                    onChange={(e) => handleFilterChange('company', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  >
                    <option value="all">All Companies</option>
                    {filterOptions.companies.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  >
                    <option value="all">All Categories</option>
                    {filterOptions.categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Subcategory</label>
                  <select
                    value={filters.subcategory}
                    onChange={(e) => handleFilterChange('subcategory', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  >
                    <option value="all">All Subcategories</option>
                    {filterOptions.subCategories.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Material</label>
                  <select
                    value={filters.material}
                    onChange={(e) => handleFilterChange('material', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  >
                    <option value="all">All Materials</option>
                    {filterOptions.materials.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Search</label>
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={14} />
                    <input
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      placeholder="Search materials..."
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Filter Row 2 - Checkboxes & Actions */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={filters.negativeGap}
                      onChange={(e) => handleFilterChange('negativeGap', e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500/20"
                    />
                    Negative Gap
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={filters.zeroBalance}
                      onChange={(e) => handleFilterChange('zeroBalance', e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500/20"
                    />
                    Zero Balance
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={filters.lowStock}
                      onChange={(e) => handleFilterChange('lowStock', e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500/20"
                    />
                    Low Stock
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={filters.showAll}
                      onChange={(e) => handleFilterChange('showAll', e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500/20"
                    />
                    Show All
                  </label>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={resetFilters}
                    className="px-3.5 py-1.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors text-sm font-medium flex items-center gap-1.5"
                  >
                    <FiRefreshCw size={14} />
                    Reset
                  </button>
                  <button
                    onClick={exportToExcel}
                    className="px-3.5 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors text-sm font-medium flex items-center gap-1.5"
                  >
                    <FiDownload size={14} />
                    Export
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        {loading ? (
          <LoadingSpinner />
        ) : (
          <div ref={tableRef}>
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'inventory' && renderInventoryTable()}
            {activeTab === 'issues' && renderIssuesReport()}
            {activeTab === 'requisitions' && renderRequisitionsReport()}
            {activeTab === 'stock-report' && renderStockReport()}
            {activeTab === 'full-report' && renderFullReport()}
          </div>
        )}
      </div>
    </div>
  );
}

export default Inventory;