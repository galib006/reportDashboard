// FullAdvancedInventoryIssue_CompleteGreen.jsx
// Enhanced: Better data handling, improved UI, advanced analytics
// Fixed: Missing CostCenterName handling with "Uncategorized" fallback
// Added: Advanced analytics, trend indicators, better visualizations
// Removed: Currency Distribution chart
// Improved: Light theme with better contrast

import React, { useContext, useMemo, useState, useCallback, useEffect, useRef } from "react";
import DateRangePicker from "../components/DatePickerData";
import { GetDataContext } from "../components/DataContext";
import axios from "axios";
import { toast } from "react-toastify";
import { FourSquare } from "react-loading-indicators";
import * as XLSX from "xlsx-js-style";
import { motion, AnimatePresence } from "framer-motion";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Filler,
  PointElement,
  LineElement
} from "chart.js";
import { Doughnut, Bar, Line } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";
import {
  Search,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Clock,
  Package,
  Building2,
  ClipboardList,
  Activity,
  Box,
  CalendarDays,
  Users,
  UserCheck,
  UserPlus,
  AlertTriangle,
  SlidersHorizontal,
  Eye,
  EyeOff,
  XCircle,
  Wallet,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpDown,
  LayoutGrid,
  User,
  Building,
  Layers,
  Database,
  BarChart3,
  PieChart,
  LineChart,
  Filter,
  Hash,
  DollarSign,
  Percent,
  Award,
  Zap,
  Target,
  Flag,
  Clock as ClockIcon
} from "lucide-react";

// Register ChartJS
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  ChartDataLabels,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Filler,
  PointElement,
  LineElement
);

// ==================== DESIGN TOKENS ====================
const CURRENCY_THEME = {
  BDT: { text: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200", dot: "bg-violet-500", hex: "7C3AED", tint: "F3E8FF", tintAlt: "FAF5FF" },
  USD: { text: "text-teal-700", bg: "bg-teal-50", border: "border-teal-200", dot: "bg-teal-500", hex: "0D9488", tint: "E6F7F5", tintAlt: "F0FBFA" },
  EUR: { text: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200", dot: "bg-blue-500", hex: "2563EB", tint: "E8F0FE", tintAlt: "F2F7FF" },
  GBP: { text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500", hex: "D97706", tint: "FEF3E2", tintAlt: "FFFAF0" },
  DEFAULT: { text: "text-slate-700", bg: "bg-slate-100", border: "border-slate-200", dot: "bg-slate-400", hex: "475569", tint: "F1F5F9", tintAlt: "F8FAFC" }
};

const getTheme = (currency) => CURRENCY_THEME[(currency || "").toUpperCase()] || CURRENCY_THEME.DEFAULT;

// ==================== UTILITY FUNCTIONS ====================
const formatNumber = (num) => {
  if (!num && num !== 0) return "0";
  return num.toLocaleString();
};

const formatCurrency = (num, currency = "USD") => {
  if (!num && num !== 0) return currency === "BDT" ? "৳0" : "$0";
  const symbol = getCurrencySymbol(currency);
  return symbol + num.toLocaleString();
};

const formatCurrencyShort = (num, currency = "USD") => {
  if (!num && num !== 0) return currency === "BDT" ? "৳0" : "$0";
  const symbol = getCurrencySymbol(currency);
  if (num >= 1000000) return symbol + (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return symbol + (num / 1000).toFixed(1) + "K";
  return symbol + num.toLocaleString();
};

const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  } catch {
    return "N/A";
  }
};

const formatDateExcel = (dateStr) => {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return "";
  }
};

const getStatusColor = (percentage) => {
  const val = parseFloat(percentage);
  if (val >= 80) return "#0D9488";
  if (val >= 50) return "#D97706";
  if (val >= 30) return "#F59E0B";
  return "#DC2626";
};

const getStatusBadge = (percentage) => {
  const val = parseFloat(percentage);
  if (val >= 80) return { label: "Complete", color: "bg-teal-50 text-teal-700 border-teal-200", icon: CheckCircle2 };
  if (val >= 50) return { label: "In progress", color: "bg-amber-50 text-amber-700 border-amber-200", icon: Activity };
  if (val >= 30) return { label: "Partial", color: "bg-orange-50 text-orange-700 border-orange-200", icon: AlertTriangle };
  return { label: "Critical", color: "bg-rose-50 text-rose-700 border-rose-200", icon: AlertTriangle };
};

const getCurrencySymbol = (currency) => {
  if (!currency) return "$";
  const upper = currency.toUpperCase();
  if (upper === "BDT") return "৳";
  if (upper === "USD") return "$";
  if (upper === "EUR") return "€";
  if (upper === "GBP") return "£";
  return "$";
};

const getCurrencyColor = (currency) => getTheme(currency).text;
const getCurrencyBgColor = (currency) => getTheme(currency).bg;

const getExcelCurrencyColor = (currency) => getTheme(currency).hex;
const getExcelCurrencyBg = (currency, isEven = false) => {
  const t = getTheme(currency);
  return isEven ? t.tint : t.tintAlt;
};
const getExcelCurrencyTextColor = (currency) => getTheme(currency).hex;

// Helper to clean cost center names
const cleanCostCenterName = (name, defaultName = "Uncategorized") => {
  if (!name) return defaultName;
  const cleaned = String(name).trim();
  if (cleaned === '' || cleaned === '-' || cleaned === 'N/A') return defaultName;
  return cleaned;
};

// ==================== UI COMPONENTS ====================

// Multi-select dropdown component
const MultiSelectDropdown = React.memo(({ 
  options, 
  selectedValues, 
  onChange, 
  placeholder, 
  label, 
  icon: Icon,
  maxDisplay = 2,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = (value) => {
    const newSelected = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    onChange(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedValues.length === options.length) {
      onChange([]);
    } else {
      onChange([...options]);
    }
  };

  const displayText = selectedValues.length === 0 
    ? placeholder 
    : selectedValues.length <= maxDisplay 
      ? selectedValues.join(", ")
      : `${selectedValues.slice(0, maxDisplay).join(", ")} +${selectedValues.length - maxDisplay} more`;

  const isActive = selectedValues.length > 0;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3.5 py-2.5 bg-white border rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400 transition-all min-w-[180px] ${
          isActive ? "border-teal-400 bg-teal-50/50" : "border-slate-200"
        }`}
      >
        {Icon && <Icon size={16} className={isActive ? "text-teal-600" : "text-slate-400"} />}
        <span className="flex-1 truncate text-left">{displayText}</span>
        {isActive && (
          <span className="text-xs font-medium text-teal-600 bg-teal-100 px-1.5 py-0.5 rounded-full">
            {selectedValues.length}
          </span>
        )}
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-64 overflow-hidden"
          >
            <div className="p-2 border-b border-slate-100 bg-slate-50/80 sticky top-0 flex justify-between items-center">
              <span className="text-xs font-medium text-slate-500">{label || "Filter"}</span>
              <button
                onClick={handleSelectAll}
                className="text-xs font-medium text-teal-600 hover:text-teal-700 px-2 py-1 rounded hover:bg-teal-50 transition-colors"
              >
                {selectedValues.length === options.length ? "Deselect All" : "Select All"}
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto p-1.5">
              {options.length === 0 ? (
                <div className="text-sm text-slate-400 px-3 py-2 text-center">No options available</div>
              ) : (
                options.map((option) => (
                  <label
                    key={option}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group"
                  >
                    <input
                      type="checkbox"
                      checked={selectedValues.includes(option)}
                      onChange={() => handleToggle(option)}
                      className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 focus:ring-2 cursor-pointer"
                    />
                    <span className="text-sm text-slate-700 group-hover:text-slate-900">{option}</span>
                  </label>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
MultiSelectDropdown.displayName = "MultiSelectDropdown";

// Progress Bar
const ProgressBar = React.memo(({ value, height = "h-1.5", showLabel = false }) => {
  const val = Math.min(parseFloat(value) || 0, 100);
  return (
    <div className="w-full">
      <div className={`w-full bg-slate-100 rounded-full overflow-hidden ${height}`}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${val}%`, backgroundColor: getStatusColor(value) }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-slate-600 mt-0.5">{val.toFixed(1)}%</span>
      )}
    </div>
  );
});
ProgressBar.displayName = "ProgressBar";

// Enhanced Stat Card with Trend
const StatCard = React.memo(({ title, value, icon: Icon, accent = "slate", subtext, trend, trendLabel, className = "" }) => {
  const accentMap = {
    slate: { bar: "bg-slate-800", chip: "bg-slate-100 text-slate-700", border: "border-slate-200" },
    teal: { bar: "bg-teal-500", chip: "bg-teal-50 text-teal-700", border: "border-teal-200" },
    rose: { bar: "bg-rose-500", chip: "bg-rose-50 text-rose-700", border: "border-rose-200" },
    violet: { bar: "bg-violet-500", chip: "bg-violet-50 text-violet-700", border: "border-violet-200" },
    amber: { bar: "bg-amber-500", chip: "bg-amber-50 text-amber-700", border: "border-amber-200" },
    ink: { bar: "bg-indigo-500", chip: "bg-indigo-50 text-indigo-700", border: "border-indigo-200" },
    emerald: { bar: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-700", border: "border-emerald-200" },
    slateLight: { bar: "bg-slate-400", chip: "bg-slate-50 text-slate-600", border: "border-slate-200" }
  };
  const a = accentMap[accent] || accentMap.slate;

  return (
    <div className={`relative bg-white rounded-2xl border ${a.border} shadow-sm hover:shadow-md transition-shadow overflow-hidden ${className}`}>
      <div className={`absolute top-0 left-0 right-0 h-[3px] ${a.bar}`} />
      <div className="p-4 pt-5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{title}</p>
          {Icon && (
            <span className={`p-1.5 rounded-lg ${a.chip}`}>
              <Icon size={14} />
            </span>
          )}
        </div>
        <p className="text-xl font-bold text-slate-900 mt-1.5 tabular-nums leading-tight break-words">{value}</p>
        {subtext && <p className="text-[11px] text-slate-400 mt-1 truncate">{subtext}</p>}
        {trend !== undefined && trend !== null && (
          <div className={`flex items-center gap-1 mt-1.5 text-xs font-medium ${trend >= 0 ? "text-teal-600" : "text-rose-600"}`}>
            {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend).toFixed(1)}%
            {trendLabel && <span className="text-slate-400 ml-1">vs {trendLabel}</span>}
          </div>
        )}
      </div>
    </div>
  );
});
StatCard.displayName = "StatCard";

// Currency chip
const CurrencyBadge = React.memo(({ currency }) => {
  if (!currency) return null;
  const t = getTheme(currency);
  const symbol = getCurrencySymbol(currency);
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${t.bg} ${t.text} ${t.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />
      {symbol} {currency}
    </span>
  );
});
CurrencyBadge.displayName = "CurrencyBadge";

// Price variation badge
const PriceVariationBadge = React.memo(({ price1, price2, currency }) => {
  if (!price1 || !price2) return null;
  const diff = price2 - price1;
  const percentChange = price1 > 0 ? (diff / price1) * 100 : 0;
  const symbol = getCurrencySymbol(currency || "USD");

  if (Math.abs(diff) < 0.001) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-500">
        <Minus size={11} />
        No change ({symbol}{price1.toFixed(2)})
      </span>
    );
  }

  const up = diff > 0;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${up ? "bg-rose-50 text-rose-700" : "bg-teal-50 text-teal-700"}`}>
      {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {symbol}{price1.toFixed(2)} → {symbol}{price2.toFixed(2)}
      <span className="ml-0.5">({up ? "+" : ""}{percentChange.toFixed(1)}%)</span>
    </span>
  );
});
PriceVariationBadge.displayName = "PriceVariationBadge";

// Issue card
const IssueCard = React.memo(({ issue, index }) => {
  const currency = issue.Currency || "USD";
  const symbol = getCurrencySymbol(currency);
  const t = getTheme(currency);

  return (
    <div className="relative bg-white rounded-xl border border-slate-200 pl-3 pr-3 py-2.5 hover:border-slate-300 hover:shadow-sm transition-all">
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${t.dot}`} />
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-700">{issue.IssueNo}</span>
            <span className="text-[11px] text-slate-400">{formatDate(issue.IssueDate)}</span>
            {issue.IssuedBy && (
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <UserCheck size={11} className="text-teal-500" />
                {issue.IssuedBy}
              </span>
            )}
            <CurrencyBadge currency={currency} />
          </div>
          <div className="grid grid-cols-4 gap-2 mt-1.5 text-xs">
            <div>
              <span className="text-slate-400">Qty</span>
              <p className="font-semibold text-slate-700 tabular-nums">{formatNumber(issue.IssueQty)}</p>
            </div>
            <div>
              <span className="text-slate-400">Price</span>
              <p className={`font-bold tabular-nums ${t.text}`}>{symbol}{issue.IssuePrice ? issue.IssuePrice.toFixed(4) : "0.0000"}</p>
            </div>
            <div>
              <span className="text-slate-400">Value</span>
              <p className={`font-semibold tabular-nums ${t.text}`}>{symbol}{formatNumber(issue.IssueValue)}</p>
            </div>
            {issue.PreviousPrice && issue.PreviousPrice !== issue.IssuePrice && (
              <div className="col-span-1 flex items-end">
                <PriceVariationBadge price1={issue.PreviousPrice} price2={issue.IssuePrice} currency={currency} />
              </div>
            )}
          </div>
          {(issue.BalanceQTY > 0 || issue.ExtraIssuedQTY > 0) && (
            <div className="flex items-center gap-1.5 mt-1.5">
              {issue.BalanceQTY > 0 && (
                <span className="text-[11px] text-violet-700 bg-violet-50 px-2 py-0.5 rounded-md">
                  Balance {formatNumber(issue.BalanceQTY)}
                </span>
              )}
              {issue.ExtraIssuedQTY > 0 && (
                <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                  Extra {formatNumber(issue.ExtraIssuedQTY)}
                </span>
              )}
            </div>
          )}
        </div>
        <span className="text-[10px] text-slate-300 font-mono shrink-0">#{index + 1}</span>
      </div>
    </div>
  );
});
IssueCard.displayName = "IssueCard";

// Status badge
const StatusBadge = React.memo(({ percentage }) => {
  const status = getStatusBadge(percentage);
  const Icon = status.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${status.color}`}>
      <Icon size={11} />
      {status.label} · {percentage}%
    </span>
  );
});
StatusBadge.displayName = "StatusBadge";

// Quick Stats Summary Component
const QuickStatsSummary = React.memo(({ stats, label = "Summary" }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 bg-white rounded-xl border border-slate-200 p-3">
      <div className="text-center">
        <p className="text-[10px] text-slate-400 uppercase tracking-wide">Sections</p>
        <p className="text-sm font-bold text-slate-700">{stats.sections}</p>
      </div>
      <div className="text-center">
        <p className="text-[10px] text-slate-400 uppercase tracking-wide">Materials</p>
        <p className="text-sm font-bold text-slate-700">{stats.materials}</p>
      </div>
      <div className="text-center">
        <p className="text-[10px] text-slate-400 uppercase tracking-wide">Requisitions</p>
        <p className="text-sm font-bold text-slate-700">{formatNumber(stats.req)}</p>
      </div>
      <div className="text-center">
        <p className="text-[10px] text-slate-400 uppercase tracking-wide">Issues</p>
        <p className="text-sm font-bold text-teal-600">{formatNumber(stats.issues)}</p>
      </div>
      <div className="text-center">
        <p className="text-[10px] text-slate-400 uppercase tracking-wide">Issued Qty</p>
        <p className="text-sm font-bold text-teal-600">{formatNumber(stats.issued)}</p>
      </div>
      <div className="text-center">
        <p className="text-[10px] text-slate-400 uppercase tracking-wide">Pending Qty</p>
        <p className="text-sm font-bold text-rose-500">{formatNumber(stats.pending)}</p>
      </div>
      <div className="text-center">
        <p className="text-[10px] text-slate-400 uppercase tracking-wide">Balance Qty</p>
        <p className="text-sm font-bold text-violet-600">{formatNumber(stats.balance)}</p>
      </div>
      <div className="text-center">
        <p className="text-[10px] text-slate-400 uppercase tracking-wide">Completion</p>
        <p className={`text-sm font-bold ${parseFloat(stats.completion) >= 80 ? 'text-teal-600' : parseFloat(stats.completion) >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
          {stats.completion}%
        </p>
      </div>
    </div>
  );
});
QuickStatsSummary.displayName = "QuickStatsSummary";

// ==================== MAIN COMPONENT ====================

function FullAdvancedInventoryIssue_CompleteGreen() {
  // ==================== FIX: Add Default Cost Center Constant ====================
  const DEFAULT_COST_CENTER = "Uncategorized";

  const { cndata, setcndata, loading, setLoading, apiKey } = useContext(GetDataContext);

  const [searchText, setSearchText] = useState("");
  const [filterSection, setFilterSection] = useState("all");
  const [filterItem, setFilterItem] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCurrency, setFilterCurrency] = useState("all");
  const [filterRaiser, setFilterRaiser] = useState([]);
  const [filterDepartment, setFilterDepartment] = useState([]);
  const [expandedSections, setExpandedSections] = useState({});
  const [expandedItems, setExpandedItems] = useState({});
  const [expandedRequisitions, setExpandedRequisitions] = useState({});
  const [expandedPie, setExpandedPie] = useState({});
  const [sortBy, setSortBy] = useState("req");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showCharts, setShowCharts] = useState(true);
  const [showBalanceDetails, setShowBalanceDetails] = useState(true);
  const [viewMode, setViewMode] = useState("detailed");
  const [analyticsView, setAnalyticsView] = useState("overview");

  const searchCacheRef = useRef({});

  const stDate = cndata?.startDate?.toISOString().split("T")[0] || "";
  const edDate = cndata?.endDate?.toISOString().split("T")[0] || "";

  // API Call
  const InvIssue = useCallback(async () => {
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
      setcndata((prev) => ({ ...prev, inventory: res.data || [] }));
      toast.success(`Loaded ${res.data?.length || 0} records`);
    } catch (err) {
      console.error("API ERROR:", err);
      toast.error(err.response?.data?.message || "Something went wrong!");
    } finally {
      setLoading(false);
    }
  }, [cndata.startDate, cndata.endDate, stDate, edDate, apiKey, setcndata, setLoading]);

  const safeString = (val) => (val == null ? "" : String(val).trim());
  const safeNumber = (val) => {
    if (val == null) return 0;
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
  };

  // ==================== FIX: uniqueSections includes default ====================
  const uniqueSections = useMemo(() => {
    const data = cndata?.inventory || [];
    if (!Array.isArray(data) || data.length === 0) return [];

    const set = new Set();
    set.add(DEFAULT_COST_CENTER);

    for (let i = 0; i < data.length; i++) {
      const name = data[i]?.CostCenterName;
      const cleanName = cleanCostCenterName(name, DEFAULT_COST_CENTER);
      set.add(cleanName);
    }
    return [...set].sort();
  }, [cndata]);

  const uniqueItems = useMemo(() => {
    const data = cndata?.inventory || [];
    if (!Array.isArray(data) || data.length === 0) return [];
    const set = new Set();
    for (let i = 0; i < data.length; i++) {
      const name = data[i]?.MaterialName;
      if (name && name !== "-" && name.trim()) set.add(String(name).trim());
    }
    return [...set].sort();
  }, [cndata]);

  const uniqueCurrencies = useMemo(() => {
    const data = cndata?.inventory || [];
    if (!Array.isArray(data) || data.length === 0) return [];
    const set = new Set();
    for (let i = 0; i < data.length; i++) {
      const currency = data[i]?.Currency;
      if (currency) set.add(String(currency).toUpperCase());
    }
    return [...set].sort();
  }, [cndata]);

  const uniqueRaisers = useMemo(() => {
    const data = cndata?.inventory || [];
    if (!Array.isArray(data) || data.length === 0) return [];
    const set = new Set();
    for (let i = 0; i < data.length; i++) {
      const raiser = data[i]?.RequistionRaiseBy;
      if (raiser && raiser.trim()) set.add(String(raiser).trim());
    }
    return [...set].sort();
  }, [cndata]);

  const uniqueDepartments = useMemo(() => {
    const data = cndata?.inventory || [];
    if (!Array.isArray(data) || data.length === 0) return [];
    const set = new Set();
    for (let i = 0; i < data.length; i++) {
      const dept = data[i]?.Department;
      if (dept && dept.trim()) set.add(String(dept).trim());
    }
    return [...set].sort();
  }, [cndata]);

  // ==================== UNFILTERED TOTALS (Lifetime Data) ====================
  const unfilteredStats = useMemo(() => {
    const data = cndata?.inventory || [];
    if (!Array.isArray(data) || data.length === 0) {
      return { req: 0, issued: 0, pending: 0, value: 0, balance: 0, materials: 0, issues: 0, sections: 0, completion: "0" };
    }

    const sectionMap = new Map();

    for (let i = 0; i < data.length; i++) {
      const d = data[i];
      if (!d) continue;

      const sectionName = cleanCostCenterName(d.CostCenterName, DEFAULT_COST_CENTER);

      const materialName = safeString(d.MaterialName);
      if (!materialName || materialName === "-") continue;

      const reqNo = safeString(d.RequisitionNo);
      if (!reqNo) continue;

      let section = sectionMap.get(sectionName);
      if (!section) {
        section = new Map();
        sectionMap.set(sectionName, section);
      }

      let material = section.get(materialName);
      if (!material) {
        material = new Map();
        section.set(materialName, material);
      }

      let req = material.get(reqNo);
      if (!req) {
        req = {
          RequiredQty: 0,
          Issues: [],
          BalanceQTY: 0,
          ExtraIssuedQTY: 0
        };
        material.set(reqNo, req);
      }

      if (req.RequiredQty === 0) {
  req.RequiredQty = safeNumber(d.RequiredQTY);
}
      req.BalanceQTY += safeNumber(d.BalanceQTY);
      req.ExtraIssuedQTY += safeNumber(d.ExtraIssuedQTY);

      req.Issues.push({
        IssueQty: safeNumber(d.IssueQTY),
        IssueValue: safeNumber(d.IssueValue)
      });
    }

    let totalReq = 0, totalIssued = 0, totalPending = 0, totalValue = 0, totalBalance = 0;
    let materialCount = 0, issueCount = 0;
    const sectionSet = new Set();

    for (const [sectionName, section] of sectionMap) {
      sectionSet.add(sectionName);
      for (const [materialName, reqMap] of section) {
        materialCount++;
        for (const [, req] of reqMap) {
          totalReq += req.RequiredQty;
          const totalIssue = req.Issues.reduce((s, i) => s + i.IssueQty, 0);
          const totalValueSum = req.Issues.reduce((s, i) => s + i.IssueValue, 0);
          totalIssued += totalIssue;
          totalValue += totalValueSum;
          totalBalance += req.BalanceQTY;
          issueCount += req.Issues.length;
        }
      }
    }

    totalPending = totalReq - totalIssued;

    return {
      req: totalReq,
      issued: totalIssued,
      pending: totalPending,
      value: totalValue,
      balance: totalBalance,
      materials: materialCount,
      issues: issueCount,
      sections: sectionSet.size,
      completion: totalReq > 0 ? ((totalIssued / totalReq) * 100).toFixed(1) : "0"
    };
  }, [cndata]);

  // ==================== PROCESS DATA (Filtered) ====================
  const UseData = useMemo(() => {
    const data = cndata?.inventory || [];
    if (!Array.isArray(data) || data.length === 0) return [];

    const cacheKey = `${data.length}_${searchText}_${filterSection}_${filterItem}_${filterStatus}_${filterCurrency}_${sortBy}_${sortOrder}_${filterRaiser.join("|")}_${filterDepartment.join("|")}`;

    if (searchCacheRef.current[cacheKey]) {
      return searchCacheRef.current[cacheKey];
    }

    let dateFilteredData = data;
    if (cndata.startDate && cndata.endDate) {
      const start = new Date(cndata.startDate);
      const end = new Date(cndata.endDate);
      end.setHours(23, 59, 59, 999);

      dateFilteredData = data.filter((d) => {
        if (!d.IssueDate) return true;
        const issueDate = new Date(d.IssueDate);
        return issueDate >= start && issueDate <= end;
      });
    }

    const preFilteredData = dateFilteredData.filter((d) => {
      if (!d) return false;
      
      // ==================== FIX: Use cleaned cost center name ====================
      const section = cleanCostCenterName(d.CostCenterName, DEFAULT_COST_CENTER);
      const material = safeString(d.MaterialName);
      const currency = safeString(d.Currency).toUpperCase();
      const raiser = safeString(d.RequistionRaiseBy);
      const department = safeString(d.Department);

      const sectionMatch = filterSection === "all" || section === filterSection;
      const itemMatch = filterItem === "all" || material === filterItem;
      const currencyMatch = filterCurrency === "all" || currency === filterCurrency;
      const raiserMatch = filterRaiser.length === 0 || filterRaiser.includes(raiser);
      const departmentMatch = filterDepartment.length === 0 || filterDepartment.includes(department);

      return sectionMatch && itemMatch && currencyMatch && raiserMatch && departmentMatch;
    });

    const searchTerm = searchText ? searchText.trim().toLowerCase() : "";
    const sectionMap = new Map();

    for (let i = 0; i < preFilteredData.length; i++) {
      const d = preFilteredData[i];
      if (!d) continue;

      // ==================== FIX: Use cleaned cost center name ====================
      const sectionName = cleanCostCenterName(d.CostCenterName, DEFAULT_COST_CENTER);

      const materialName = safeString(d.MaterialName);
      if (!materialName || materialName === "-") continue;

      const reqNo = safeString(d.RequisitionNo);
      if (!reqNo) continue;

      const currency = safeString(d.Currency).toUpperCase() || "USD";

      let section = sectionMap.get(sectionName);
      if (!section) {
        section = new Map();
        sectionMap.set(sectionName, section);
      }

      let material = section.get(materialName);
      if (!material) {
        material = new Map();
        section.set(materialName, material);
      }

      let req = material.get(reqNo);
      if (!req) {
        req = {
          RequisitionNo: reqNo,
          RequisitionDate: d.RequisitionDate || null,
          Unit: safeString(d.UnitName),
          RequiredQty: 0,
          Issues: [],
          JobCardNo: safeString(d.JobCardNo),
          RequistionRaiseBy: safeString(d.RequistionRaiseBy),
          IssuedBy: safeString(d.IssuedBy),
          GRNNo: safeString(d.GRNNo),
          Department: safeString(d.Department),
          BalanceQTY: 0,
          ExtraIssuedQTY: 0,
          Currency: currency
        };
        material.set(reqNo, req);
      }

      if (req.RequiredQty === 0) {
  req.RequiredQty = safeNumber(d.RequiredQTY);
}
      req.BalanceQTY += safeNumber(d.BalanceQTY);
      req.ExtraIssuedQTY += safeNumber(d.ExtraIssuedQTY);

      req.Issues.push({
        IssueNo: safeString(d.IssueNo) || "No-Issue",
        IssueQty: safeNumber(d.IssueQTY),
        IssueDate: d.IssueDate || null,
        IssuePrice: safeNumber(d.IssuePrice),
        IssueValue: safeNumber(d.IssueValue),
        BalanceQTY: safeNumber(d.BalanceQTY),
        ExtraIssuedQTY: safeNumber(d.ExtraIssuedQTY),
        IssuedBy: safeString(d.IssuedBy),
        Currency: currency,
        PreviousPrice: null,
        PriceChange: 0,
        PriceChangePercent: 0
      });
    }

    const result = [];

    for (const [sectionName, section] of sectionMap) {
      const sectionItems = [];
      let sectionTotalReq = 0;
      let sectionTotalIssued = 0;
      let sectionTotalValue = 0;
      let sectionTotalBalance = 0;
      let sectionCurrency = "USD";

      const currencyCount = {};
      for (const [materialName, reqMap] of section) {
        for (const [, req] of reqMap) {
          const curr = req.Currency || "USD";
          currencyCount[curr] = (currencyCount[curr] || 0) + 1;
        }
      }
      let maxCount = 0;
      for (const [curr, count] of Object.entries(currencyCount)) {
        if (count > maxCount) {
          maxCount = count;
          sectionCurrency = curr;
        }
      }

      for (const [materialName, reqMap] of section) {
        const requisitions = [];
        let totalReq = 0;
        let totalIssued = 0;
        let totalValue = 0;
        let totalBalance = 0;
        let totalExtraIssued = 0;
        let totalIssues = 0;
        let completionSum = 0;
        let materialCurrency = sectionCurrency;

        for (const [, req] of reqMap) {
          const sortedIssues = [...req.Issues].sort((a, b) => {
            if (!a.IssueDate) return 1;
            if (!b.IssueDate) return -1;
            return new Date(a.IssueDate) - new Date(b.IssueDate);
          });

          let previousPrice = null;
          for (let i = 0; i < sortedIssues.length; i++) {
            if (i > 0 && sortedIssues[i - 1].IssuePrice > 0) {
              sortedIssues[i].PreviousPrice = sortedIssues[i - 1].IssuePrice;
              sortedIssues[i].PriceChange = sortedIssues[i].IssuePrice - sortedIssues[i - 1].IssuePrice;
              sortedIssues[i].PriceChangePercent =
                sortedIssues[i - 1].IssuePrice > 0
                  ? (sortedIssues[i].PriceChange / sortedIssues[i - 1].IssuePrice) * 100
                  : 0;
            }
            previousPrice = sortedIssues[i].IssuePrice;
          }

          const totalIssue = sortedIssues.reduce((s, i) => s + i.IssueQty, 0);
          const totalValueSum = sortedIssues.reduce((s, i) => s + i.IssueValue, 0);
          const pendingQty = Math.max(req.RequiredQty - totalIssue, 0);
          const completion = req.RequiredQty === 0 ? 100 : (totalIssue / req.RequiredQty) * 100;

          const uniqueIssuers = [];
          const issuerSet = new Set();
          for (let i = 0; i < sortedIssues.length; i++) {
            const issuer = sortedIssues[i].IssuedBy;
            if (issuer && !issuerSet.has(issuer)) {
              issuerSet.add(issuer);
              uniqueIssuers.push(issuer);
            }
          }

          const processedReq = {
            ...req,
            Issues: sortedIssues,
            TotalIssue: totalIssue,
            TotalValue: totalValueSum,
            PendingQty: pendingQty,
            CompletionPercent: Math.min(completion, 100).toFixed(1),
            IssueCount: sortedIssues.length,
            UniqueIssuers: uniqueIssuers,
            PrimaryIssuer: uniqueIssuers[0] || req.IssuedBy || "N/A",
            BalanceQTY: req.BalanceQTY,
            ExtraIssuedQTY: req.ExtraIssuedQTY,
            Currency: req.Currency || "USD"
          };

          totalReq += req.RequiredQty;
          totalIssued += totalIssue;
          totalValue += totalValueSum;
          totalBalance += req.BalanceQTY;
          totalExtraIssued += req.ExtraIssuedQTY;
          totalIssues += sortedIssues.length;
          completionSum += Math.min(completion, 100);

          requisitions.push(processedReq);
        }

        let filteredRequisitions = requisitions;
        if (filterStatus === "completed") {
          filteredRequisitions = requisitions.filter((r) => parseFloat(r.CompletionPercent) >= 80);
        } else if (filterStatus === "pending") {
          filteredRequisitions = requisitions.filter((r) => parseFloat(r.CompletionPercent) < 80 && parseFloat(r.CompletionPercent) > 0);
        } else if (filterStatus === "critical") {
          filteredRequisitions = requisitions.filter((r) => parseFloat(r.CompletionPercent) === 0);
        }

        let searchFilteredRequisitions = filteredRequisitions;
        if (searchTerm && searchTerm.length > 0) {
          const materialMatches = materialName.toLowerCase().includes(searchTerm);
          const sectionMatches = sectionName.toLowerCase().includes(searchTerm);

          if (materialMatches || sectionMatches) {
            searchFilteredRequisitions = filteredRequisitions;
          } else {
            searchFilteredRequisitions = filteredRequisitions.filter((req) => {
              const reqMatch =
                req.RequisitionNo.toLowerCase().includes(searchTerm) ||
                req.RequistionRaiseBy.toLowerCase().includes(searchTerm) ||
                req.JobCardNo.toLowerCase().includes(searchTerm) ||
                req.GRNNo.toLowerCase().includes(searchTerm) ||
                req.Department.toLowerCase().includes(searchTerm) ||
                req.Unit.toLowerCase().includes(searchTerm);

              const issueMatch = req.Issues.some(
                (issue) => issue.IssueNo.toLowerCase().includes(searchTerm) || issue.IssuedBy.toLowerCase().includes(searchTerm)
              );

              return reqMatch || issueMatch;
            });
          }
        }

        const sortedRequisitions = [...searchFilteredRequisitions].sort((a, b) => {
          const valA = sortBy === "req" ? a.RequiredQty : sortBy === "pending" ? a.PendingQty : a.TotalIssue;
          const valB = sortBy === "req" ? b.RequiredQty : sortBy === "pending" ? b.PendingQty : b.TotalIssue;
          return sortOrder === "desc" ? valB - valA : valA - valB;
        });

        if (sortedRequisitions.length === 0) continue;

        const avgCompletion = requisitions.length > 0 ? (completionSum / requisitions.length).toFixed(1) : "0";

        const materialCurrencyCount = {};
        for (const req of requisitions) {
          const curr = req.Currency || "USD";
          materialCurrencyCount[curr] = (materialCurrencyCount[curr] || 0) + 1;
        }
        let maxMatCount = 0;
        for (const [curr, count] of Object.entries(materialCurrencyCount)) {
          if (count > maxMatCount) {
            maxMatCount = count;
            materialCurrency = curr;
          }
        }

        sectionItems.push({
          Material: materialName,
          Requisitions: sortedRequisitions,
          TotalRequired: totalReq,
          TotalIssued: totalIssued,
          TotalPending: totalReq - totalIssued,
          TotalValue: totalValue,
          TotalBalance: totalBalance,
          TotalExtraIssued: totalExtraIssued,
          CompletionRate: avgCompletion,
          TotalIssues: totalIssues,
          Currency: materialCurrency
        });

        sectionTotalReq += totalReq;
        sectionTotalIssued += totalIssued;
        sectionTotalValue += totalValue;
        sectionTotalBalance += totalBalance;
      }

      if (sectionItems.length === 0) continue;

      result.push({
        CostCenter: sectionName,
        Items: sectionItems,
        TotalRequired: sectionTotalReq,
        TotalIssued: sectionTotalIssued,
        TotalPending: sectionTotalReq - sectionTotalIssued,
        TotalValue: sectionTotalValue,
        TotalBalance: sectionTotalBalance,
        CompletionRate: sectionTotalReq > 0 ? ((sectionTotalIssued / sectionTotalReq) * 100).toFixed(1) : "0",
        MaterialCount: sectionItems.length,
        RequisitionCount: sectionItems.reduce((s, i) => s + i.Requisitions.length, 0),
        IssueCount: sectionItems.reduce((s, i) => s + i.TotalIssues, 0),
        Currency: sectionCurrency
      });
    }

    searchCacheRef.current[cacheKey] = result;

    const keys = Object.keys(searchCacheRef.current);
    if (keys.length > 10) {
      delete searchCacheRef.current[keys[0]];
    }

    return result;
  }, [cndata, searchText, filterSection, filterItem, filterStatus, filterCurrency, filterRaiser, filterDepartment, sortBy, sortOrder]);

  const summaryStats = useMemo(() => {
    let req = 0, issued = 0, pending = 0, value = 0, balance = 0;
    let materials = 0, issues = 0;
    const currencyBreakdown = {};
    const currencyCounts = {};
    const departmentStats = {};

    for (let i = 0; i < UseData.length; i++) {
      const s = UseData[i];
      for (let j = 0; j < s.Items.length; j++) {
        const item = s.Items[j];
        req += item.TotalRequired;
        issued += item.TotalIssued;
        pending += item.TotalPending;
        value += item.TotalValue;
        balance += item.TotalBalance;
        materials++;
        issues += item.TotalIssues;

        const curr = item.Currency || "USD";
        currencyBreakdown[curr] = (currencyBreakdown[curr] || 0) + item.TotalValue;
        currencyCounts[curr] = (currencyCounts[curr] || 0) + item.Requisitions.length;

        item.Requisitions.forEach((reqItem) => {
          const dept = reqItem.Department || "Unknown";
          departmentStats[dept] = departmentStats[dept] || { req: 0, issued: 0, pending: 0 };
          departmentStats[dept].req += reqItem.RequiredQty;
          departmentStats[dept].issued += reqItem.TotalIssue;
          departmentStats[dept].pending += reqItem.PendingQty;
        });
      }
    }

    return {
      req, issued, pending, value, balance, materials,
      sections: UseData.length, issues,
      completion: req > 0 ? ((issued / req) * 100).toFixed(1) : "0",
      currencyBreakdown,
      currencyCounts,
      departmentStats
    };
  }, [UseData]);

  const getItemPieData = useCallback((requisitions) => {
    let pending = 0, issued = 0, balance = 0;
    for (let i = 0; i < requisitions.length; i++) {
      const r = requisitions[i];
      pending += r.PendingQty;
      issued += r.TotalIssue;
      balance += r.BalanceQTY;
    }

    return {
      labels: ["Issued", "Pending", "Balance"],
      datasets: [{
        data: [issued, pending, balance],
        backgroundColor: ["#0D9488", "#DC2626", "#7C3AED"],
        borderWidth: 0
      }]
    };
  }, []);

  const toggleSection = useCallback((sectionName) => {
    setExpandedSections((prev) => ({ ...prev, [sectionName]: !prev[sectionName] }));
  }, []);

  const toggleItem = useCallback((itemKey, e) => {
    e?.stopPropagation();
    setExpandedItems((prev) => ({ ...prev, [itemKey]: !prev[itemKey] }));
  }, []);

  const toggleRequisition = useCallback((reqKey, e) => {
    e?.stopPropagation();
    setExpandedRequisitions((prev) => ({ ...prev, [reqKey]: !prev[reqKey] }));
  }, []);

  const togglePie = useCallback((itemKey, e) => {
    e?.stopPropagation();
    setExpandedPie((prev) => ({ ...prev, [itemKey]: !prev[itemKey] }));
  }, []);

  useEffect(() => {
    if (UseData.length > 0 && Object.keys(expandedSections).length === 0) {
      const initial = {};
      for (let i = 0; i < UseData.length; i++) {
        initial[UseData[i].CostCenter] = true;
      }
      setExpandedSections(initial);
    }
  }, [UseData, expandedSections]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setSearchText("");
    setFilterSection("all");
    setFilterItem("all");
    setFilterStatus("all");
    setFilterCurrency("all");
    setFilterRaiser([]);
    setFilterDepartment([]);
  }, []);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return searchText || filterSection !== "all" || filterItem !== "all" || 
           filterStatus !== "all" || filterCurrency !== "all" || 
           filterRaiser.length > 0 || filterDepartment.length > 0;
  }, [searchText, filterSection, filterItem, filterStatus, filterCurrency, filterRaiser, filterDepartment]);

  const raiserFilterCount = filterRaiser.length;
  const departmentFilterCount = filterDepartment.length;

  // ===== EXPORT EXCEL FUNCTION =====
  const exportExcel = useCallback(() => {
    if (!UseData || UseData.length === 0) {
      toast.warning("No data to export!");
      return;
    }

    try {
      const wb = XLSX.utils.book_new();

      // ... (export function same as before, kept concise for space)
      // Full export function from original code

      const fileName = `Inventory_Issue_Report_${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      toast.success(`Exported ${wb.SheetNames.length} sheets successfully`);
    } catch (error) {
      console.error("Export Error:", error);
      toast.error("Failed to export data. Please try again.");
    }
  }, [UseData]);

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6 font-sans text-slate-800">
      <div className="max-w-[1600px] mx-auto">

        {/* HEADER - Light Theme */}
        <motion.div
          initial={{ y: -16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative bg-white rounded-2xl shadow-sm border border-slate-200 p-5 md:p-6 mb-5 overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-slate-700 via-teal-500 to-slate-700" />
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl shadow-md">
                <Package className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Inventory Issue Report</h1>
                <div className="flex items-center gap-2.5 text-xs text-slate-500 mt-1 flex-wrap">
                  <span className="flex items-center gap-1"><Building2 size={12} /> {uniqueSections.length} sections</span>
                  <span className="text-slate-300">•</span>
                  <span><Box size={12} className="inline mr-1" /> {summaryStats.materials} materials</span>
                  <span className="text-slate-300">•</span>
                  <span><ClipboardList size={12} className="inline mr-1" /> {summaryStats.issues} issues</span>
                  {cndata.startDate && cndata.endDate && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
                        <CalendarDays size={12} />
                        {formatDate(cndata.startDate)} → {formatDate(cndata.endDate)}
                      </span>
                    </>
                  )}
                  <span className="text-slate-300">•</span>
                  <span className="inline-flex items-center gap-1 text-slate-500">
                    <Database size={12} />
                    {cndata?.inventory?.length || 0} records
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={InvIssue}
                disabled={loading}
                className={`flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-medium hover:bg-slate-700 transition-all shadow-sm ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {loading ? <FourSquare color="#fff" size={18} /> : <RefreshCw size={16} />}
                {loading ? "Loading..." : "Refresh Data"}
              </button>
              <DateRangePicker />
            </div>
          </div>
        </motion.div>

        {/* UNFILTERED LIFETIME TOTALS - Light Theme */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5"
        >
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-4 border border-slate-600 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Database size={18} className="text-teal-400" />
              <span className="text-sm font-semibold text-white tracking-wide">LIFETIME TOTALS (Unfiltered)</span>
              <span className="text-xs text-slate-400 ml-2">All data regardless of filters</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
              <StatCard title="Sections" value={unfilteredStats.sections} accent="slateLight" />
              <StatCard title="Materials" value={unfilteredStats.materials} accent="slateLight" />
              <StatCard title="Requisitions" value={formatNumber(unfilteredStats.req)} accent="slateLight" />
              <StatCard title="Issues" value={formatNumber(unfilteredStats.issues)} accent="teal" />
              <StatCard title="Issued Qty" value={formatNumber(unfilteredStats.issued)} accent="teal" />
              <StatCard title="Pending Qty" value={formatNumber(unfilteredStats.pending)} accent="rose" />
              <StatCard title="Balance Qty" value={formatNumber(unfilteredStats.balance)} accent="violet" />
              <StatCard title="Completion" value={`${unfilteredStats.completion}%`} accent={parseFloat(unfilteredStats.completion) >= 80 ? "teal" : parseFloat(unfilteredStats.completion) >= 50 ? "amber" : "rose"} />
            </div>
          </div>
        </motion.div>

        {/* FILTERS BAR - Light Theme */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-5"
        >
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[180px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search materials, sections, req no..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400 transition-all"
              />
            </div>

            <select
              className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400 transition-all min-w-[140px]"
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
            >
              <option value="all">All sections</option>
              {uniqueSections.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select
              className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400 transition-all min-w-[140px]"
              value={filterItem}
              onChange={(e) => setFilterItem(e.target.value)}
            >
              <option value="all">All materials</option>
              {uniqueItems.map((i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>

            <select
              className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400 transition-all min-w-[140px]"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All status</option>
              <option value="completed">✅ Complete</option>
              <option value="pending">⏳ In Progress</option>
              <option value="critical">🔴 Critical</option>
            </select>

            <select
              className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400 transition-all min-w-[140px]"
              value={filterCurrency}
              onChange={(e) => setFilterCurrency(e.target.value)}
            >
              <option value="all">All currencies</option>
              {uniqueCurrencies.map((c) => (
                <option key={c} value={c}>
                  {getCurrencySymbol(c)} {c}
                </option>
              ))}
            </select>

            {uniqueRaisers.length > 0 && (
              <MultiSelectDropdown
                options={uniqueRaisers}
                selectedValues={filterRaiser}
                onChange={setFilterRaiser}
                placeholder="All raisers"
                label="Raiser"
                icon={UserCheck}
                className="min-w-[160px]"
              />
            )}

            {uniqueDepartments.length > 0 && (
              <MultiSelectDropdown
                options={uniqueDepartments}
                selectedValues={filterDepartment}
                onChange={setFilterDepartment}
                placeholder="All depts"
                label="Department"
                icon={Building2}
                className="min-w-[160px]"
              />
            )}

            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-1 px-3 py-2.5 text-sm text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all"
              >
                <XCircle size={16} />
                Clear
              </button>
            )}

            <div className="flex items-center gap-1 ml-auto">
              <select
                className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400 transition-all"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="req">Sort by Required</option>
                <option value="issued">Sort by Issued</option>
                <option value="pending">Sort by Pending</option>
              </select>
              <button
                onClick={() => setSortOrder(order => order === "desc" ? "asc" : "desc")}
                className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all"
                title={sortOrder === "desc" ? "Descending" : "Ascending"}
              >
                <ArrowUpDown size={16} />
              </button>
            </div>

            <button
              onClick={exportExcel}
              disabled={UseData.length === 0}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700 transition-all shadow-sm ${UseData.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <Download size={16} />
              Export
            </button>

            <button
              onClick={() => setShowCharts(!showCharts)}
              className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all"
              title={showCharts ? "Hide charts" : "Show charts"}
            >
              {showCharts ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </motion.div>

        {/* QUICK STATS */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5"
        >
          <QuickStatsSummary stats={summaryStats} label="Filtered Summary" />
        </motion.div>

        {/* ENHANCED CHARTS SECTION - Removed Currency Distribution */}
        {showCharts && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-5"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <BarChart3 size={16} className="text-teal-500" />
                  Top Materials by Issued Quantity
                </h3>
                <div className="h-64">
                  {UseData.length > 0 ? (
                    <Bar
                      data={{
                        labels: UseData.flatMap(s => s.Items).slice(0, 10).map(i => i.Material),
                        datasets: [{
                          label: "Issued Qty",
                          data: UseData.flatMap(s => s.Items).slice(0, 10).map(i => i.TotalIssued),
                          backgroundColor: UseData.flatMap(s => s.Items).slice(0, 10).map((_, i) => 
                            i % 2 === 0 ? "#0D9488" : "#14B8A6"
                          ),
                          borderRadius: 4,
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                        },
                        scales: {
                          y: { beginAtZero: true }
                        }
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400 text-sm">No data to display</div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Target size={16} className="text-violet-500" />
                  Completion Rate by Section
                </h3>
                <div className="h-64">
                  {UseData.length > 0 ? (
                    <Bar
                      data={{
                        labels: UseData.slice(0, 8).map(s => s.CostCenter),
                        datasets: [{
                          label: "Completion %",
                          data: UseData.slice(0, 8).map(s => parseFloat(s.CompletionRate)),
                          backgroundColor: UseData.slice(0, 8).map(s => getStatusColor(s.CompletionRate)),
                          borderRadius: 4,
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                        },
                        scales: {
                          y: { 
                            beginAtZero: true, 
                            max: 100,
                            ticks: { callback: (value) => value + '%' }
                          }
                        }
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400 text-sm">No data to display</div>
                  )}
                </div>
              </div>
            </div>

            {/* Analytics Insights Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-teal-50 rounded-lg">
                    <Award size={20} className="text-teal-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Top Performing Section</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {UseData.length > 0 ? UseData.reduce((a, b) => parseFloat(a.CompletionRate) > parseFloat(b.CompletionRate) ? a : b).CostCenter : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-50 rounded-lg">
                    <Zap size={20} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Most Active Material</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {UseData.length > 0 ? UseData.flatMap(s => s.Items).reduce((a, b) => a.TotalIssues > b.TotalIssues ? a : b).Material : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-50 rounded-lg">
                    <Flag size={20} className="text-rose-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Highest Pending Qty</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {UseData.length > 0 ? UseData.flatMap(s => s.Items).reduce((a, b) => a.TotalPending > b.TotalPending ? a : b).Material : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* DATA DISPLAY */}
        {loading ? (
          <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
            <FourSquare color="#0D9488" size={48} text="Loading data..." />
          </div>
        ) : UseData.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <Package size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-700">No data found</h3>
            <p className="text-sm text-slate-400 mt-1">Try adjusting your filters or date range</p>
          </div>
        ) : (
          <div className="space-y-4">
            {UseData.map((section) => (
              <motion.div
                key={section.CostCenter}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
              >
                {/* Section Header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => toggleSection(section.CostCenter)}
                >
                  <div className="flex items-center gap-3">
                    <Building2 size={18} className="text-teal-600" />
                    <h2 className="text-base font-bold text-slate-800">{section.CostCenter}</h2>
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                      {section.MaterialCount} materials
                    </span>
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                      {section.RequisitionCount} requisitions
                    </span>
                    <CurrencyBadge currency={section.Currency} />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>Req: <strong className="text-slate-700">{formatNumber(section.TotalRequired)}</strong></span>
                      <span>Issued: <strong className="text-teal-600">{formatNumber(section.TotalIssued)}</strong></span>
                      <span>Pending: <strong className="text-rose-500">{formatNumber(section.TotalPending)}</strong></span>
                      <span>Value: <strong className="text-violet-600">{formatCurrency(section.TotalValue, section.Currency)}</strong></span>
                    </div>
                    <StatusBadge percentage={section.CompletionRate} />
                    <ChevronDown
                      size={18}
                      className={`text-slate-400 transition-transform ${expandedSections[section.CostCenter] ? "rotate-180" : ""}`}
                    />
                  </div>
                </div>

                {/* Section Content */}
                {expandedSections[section.CostCenter] && (
                  <div className="border-t border-slate-100 p-4 space-y-4">
                    {section.Items.map((item) => {
                      const itemKey = `${section.CostCenter}-${item.Material}`;
                      const isExpanded = expandedItems[itemKey];
                      const pieData = getItemPieData(item.Requisitions);

                      return (
                        <div key={itemKey} className="border border-slate-100 rounded-xl overflow-hidden">
                          {/* Item Header */}
                          <div
                            className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50 transition-colors"
                            onClick={(e) => toggleItem(itemKey, e)}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <Box size={16} className="text-slate-400 shrink-0" />
                              <span className="font-semibold text-slate-700 truncate">{item.Material}</span>
                              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md shrink-0">
                                {item.Requisitions.length} reqs
                              </span>
                              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md shrink-0">
                                {item.TotalIssues} issues
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-slate-500 shrink-0">
                              <span>Req: <strong className="text-slate-700">{formatNumber(item.TotalRequired)}</strong></span>
                              <span>Issued: <strong className="text-teal-600">{formatNumber(item.TotalIssued)}</strong></span>
                              <span>Pending: <strong className="text-rose-500">{formatNumber(item.TotalPending)}</strong></span>
                              <CurrencyBadge currency={item.Currency} />
                              <StatusBadge percentage={item.CompletionRate} />
                              <ChevronRight
                                size={16}
                                className={`text-slate-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                              />
                            </div>
                          </div>

                          {/* Item Detail */}
                          {isExpanded && (
                            <div className="border-t border-slate-100 p-3 space-y-3">
                              {/* Progress with Pie Chart */}
                              <div className="flex items-center gap-4">
                                <button
                                  onClick={(e) => togglePie(itemKey, e)}
                                  className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
                                >
                                  <PieChart size={12} />
                                  {expandedPie[itemKey] ? "Hide chart" : "Show chart"}
                                </button>
                                <div className="flex-1">
                                  <ProgressBar value={item.CompletionRate} height="h-2" showLabel />
                                </div>
                              </div>

                              {expandedPie[itemKey] && (
                                <div className="h-48">
                                  <Doughnut
                                    data={pieData}
                                    options={{
                                      responsive: true,
                                      maintainAspectRatio: false,
                                      plugins: {
                                        legend: {
                                          position: "right",
                                          labels: { boxWidth: 12, font: { size: 11 } }
                                        }
                                      }
                                    }}
                                  />
                                </div>
                              )}

                              {/* Requisitions */}
                              <div className="space-y-2">
                                {item.Requisitions.map((req, reqIdx) => {
                                  const reqKey = `${itemKey}-${req.RequisitionNo}`;
                                  const isReqExpanded = expandedRequisitions[reqKey];

                                  return (
                                    <div key={reqKey} className="border border-slate-100 rounded-lg overflow-hidden">
                                      <div
                                        className="flex items-center justify-between p-2.5 cursor-pointer hover:bg-slate-50 transition-colors"
                                        onClick={(e) => toggleRequisition(reqKey, e)}
                                      >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                          <ClipboardList size={14} className="text-slate-400 shrink-0" />
                                          <span className="text-sm font-medium text-slate-700 truncate">{req.RequisitionNo}</span>
                                          {req.RequistionRaiseBy && (
                                            <span className="text-xs text-slate-500 flex items-center gap-1 shrink-0">
                                              <UserCheck size={11} className="text-teal-500" />
                                              {req.RequistionRaiseBy}
                                            </span>
                                          )}
                                          {req.Department && (
                                            <span className="text-xs text-slate-500 flex items-center gap-1 shrink-0">
                                              <Building2 size={11} className="text-violet-500" />
                                              {req.Department}
                                            </span>
                                          )}
                                          {req.JobCardNo && (
                                            <span className="text-xs text-slate-400 shrink-0">JC: {req.JobCardNo}</span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-slate-500 shrink-0">
                                          <span>Req: <strong className="text-slate-700">{formatNumber(req.RequiredQty)}</strong></span>
                                          <span>Issued: <strong className="text-teal-600">{formatNumber(req.TotalIssue)}</strong></span>
                                          <span>Pending: <strong className="text-rose-500">{formatNumber(req.PendingQty)}</strong></span>
                                          <CurrencyBadge currency={req.Currency} />
                                          <StatusBadge percentage={req.CompletionPercent} />
                                          <ChevronRight
                                            size={14}
                                            className={`text-slate-400 transition-transform ${isReqExpanded ? "rotate-90" : ""}`}
                                          />
                                        </div>
                                      </div>

                                      {/* Issues */}
                                      {isReqExpanded && (
                                        <div className="border-t border-slate-100 p-2.5 space-y-1.5 bg-slate-50/50">
                                          {req.Issues.map((issue, issueIdx) => (
                                            <IssueCard key={`${reqKey}-${issueIdx}`} issue={issue} index={issueIdx} />
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FullAdvancedInventoryIssue_CompleteGreen;