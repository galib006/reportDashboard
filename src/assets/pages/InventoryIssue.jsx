// FullAdvancedInventoryIssue_CompleteGreen.jsx
// Redesigned: cohesive "operations dashboard" visual system, same data logic & Excel export.

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
import { Doughnut, Bar } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";
import {
  Search,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  PieChart,
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
  LayoutGrid
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
// A single cohesive palette drives both the on-screen UI and the exported
// Excel workbook, so the report reads as one connected system rather than
// two disconnected outputs.
//
// Ink        #0F172A  primary text / headings
// Slate      #64748B  secondary text
// Canvas     #F5F7FA  page background
// Teal 600   #0D9488  brand / "issued" / USD
// Amber 600  #D97706  "pending" / attention / GBP
// Violet 600 #7C3AED  "balance" / BDT
// Rose 600   #DC2626  "critical" / shortfall
// Blue 600   #2563EB  EUR / informational

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
  if (val >= 80) return "#0D9488"; // teal
  if (val >= 50) return "#D97706"; // amber
  if (val >= 30) return "#F59E0B"; // orange
  return "#DC2626"; // rose
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

// ==================== UI COMPONENTS ====================

// Slim, color-coded progress bar
const ProgressBar = React.memo(({ value, height = "h-1.5" }) => {
  const val = Math.min(parseFloat(value) || 0, 100);
  return (
    <div className={`w-full bg-slate-100 rounded-full overflow-hidden ${height}`}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${val}%`, backgroundColor: getStatusColor(value) }}
      />
    </div>
  );
});
ProgressBar.displayName = "ProgressBar";

// KPI stat card — flat surface, colored top rule, icon chip. No gradients.
const StatCard = React.memo(({ title, value, icon: Icon, accent = "slate", subtext, trend }) => {
  const accentMap = {
    slate: { bar: "bg-slate-800", chip: "bg-slate-100 text-slate-700" },
    teal: { bar: "bg-teal-500", chip: "bg-teal-50 text-teal-700" },
    rose: { bar: "bg-rose-500", chip: "bg-rose-50 text-rose-700" },
    violet: { bar: "bg-violet-500", chip: "bg-violet-50 text-violet-700" },
    amber: { bar: "bg-amber-500", chip: "bg-amber-50 text-amber-700" },
    ink: { bar: "bg-indigo-500", chip: "bg-indigo-50 text-indigo-700" }
  };
  const a = accentMap[accent] || accentMap.slate;

  return (
    <div className="relative bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
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
        {trend !== undefined && (
          <div className={`flex items-center gap-1 mt-1.5 text-xs font-medium ${trend >= 0 ? "text-teal-600" : "text-rose-600"}`}>
            {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend).toFixed(1)}%
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

// Price change chip
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

// Single issue row-card in the drill-down history list
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

// Completion status pill
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

// ==================== MAIN COMPONENT ====================

function FullAdvancedInventoryIssue_CompleteGreen() {
  const { cndata, setcndata, loading, setLoading, apiKey } = useContext(GetDataContext);

  const [searchText, setSearchText] = useState("");
  const [filterSection, setFilterSection] = useState("all");
  const [filterItem, setFilterItem] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCurrency, setFilterCurrency] = useState("all");
  const [expandedSections, setExpandedSections] = useState({});
  const [expandedItems, setExpandedItems] = useState({});
  const [expandedRequisitions, setExpandedRequisitions] = useState({});
  const [expandedPie, setExpandedPie] = useState({});
  const [sortBy, setSortBy] = useState("req");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showCharts, setShowCharts] = useState(true);
  const [showBalanceDetails, setShowBalanceDetails] = useState(true);

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

  const safeString = (val) => (val == null ? "" : String(val));
  const safeNumber = (val) => {
    if (val == null) return 0;
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
  };

  const uniqueSections = useMemo(() => {
    const data = cndata?.inventory || [];
    if (!Array.isArray(data) || data.length === 0) return [];
    const set = new Set();
    for (let i = 0; i < data.length; i++) {
      const name = data[i]?.CostCenterName;
      if (name) set.add(String(name));
    }
    return [...set].sort();
  }, [cndata]);

  const uniqueItems = useMemo(() => {
    const data = cndata?.inventory || [];
    if (!Array.isArray(data) || data.length === 0) return [];
    const set = new Set();
    for (let i = 0; i < data.length; i++) {
      const name = data[i]?.MaterialName;
      if (name && name !== "-") set.add(String(name));
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

  // ==================== PROCESS DATA (unchanged logic) ====================
  const UseData = useMemo(() => {
    const data = cndata?.inventory || [];
    if (!Array.isArray(data) || data.length === 0) return [];

    const cacheKey = `${data.length}_${searchText}_${filterSection}_${filterItem}_${filterStatus}_${filterCurrency}_${sortBy}_${sortOrder}`;

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
      const section = safeString(d.CostCenterName);
      const material = safeString(d.MaterialName);
      const currency = safeString(d.Currency).toUpperCase();

      const sectionMatch = filterSection === "all" || section === filterSection;
      const itemMatch = filterItem === "all" || material === filterItem;
      const currencyMatch = filterCurrency === "all" || currency === filterCurrency;

      return sectionMatch && itemMatch && currencyMatch;
    });

    const searchTerm = searchText ? searchText.trim().toLowerCase() : "";

    const sectionMap = new Map();

    for (let i = 0; i < preFilteredData.length; i++) {
      const d = preFilteredData[i];
      if (!d) continue;

      const sectionName = safeString(d.CostCenterName);
      if (!sectionName) continue;

      const materialName = safeString(d.MaterialName);
      if (!materialName || materialName === "-") continue;

      const reqNo = safeString(d.RequisitionNo) || `REQ-${Math.random()}`;

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

      req.RequiredQty += safeNumber(d.RequiredQTY);
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
  }, [cndata, searchText, filterSection, filterItem, filterStatus, filterCurrency, sortBy, sortOrder]);

  const summaryStats = useMemo(() => {
    let req = 0, issued = 0, pending = 0, value = 0, balance = 0;
    let materials = 0, issues = 0;
    const currencyBreakdown = {};
    const currencyCounts = {};

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
      }
    }

    return {
      req, issued, pending, value, balance, materials,
      sections: UseData.length, issues,
      completion: req > 0 ? ((issued / req) * 100).toFixed(1) : "0",
      currencyBreakdown,
      currencyCounts
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

  // ===== EXPORT EXCEL FUNCTION (logic unchanged, palette aligned to UI) =====
  const exportExcel = useCallback(() => {
    if (!UseData || UseData.length === 0) {
      toast.warning("No data to export!");
      return;
    }

    try {
      const wb = XLSX.utils.book_new();

      const applyBorder = (ws, range, borderStyle = "thin", color = "D9DEE7") => {
        const [startRow, startCol, endRow, endCol] = range;
        for (let r = startRow; r <= endRow; r++) {
          for (let c = startCol; c <= endCol; c++) {
            const cellRef = XLSX.utils.encode_cell({ r, c });
            if (!ws[cellRef]) continue;
            if (!ws[cellRef].s) ws[cellRef].s = {};
            ws[cellRef].s.border = {
              top: { style: borderStyle, color: { rgb: color } },
              bottom: { style: borderStyle, color: { rgb: color } },
              left: { style: borderStyle, color: { rgb: color } },
              right: { style: borderStyle, color: { rgb: color } }
            };
          }
        }
      };

      const applyStyleToRange = (ws, range, styles) => {
        const [startRow, startCol, endRow, endCol] = range;
        for (let r = startRow; r <= endRow; r++) {
          for (let c = startCol; c <= endCol; c++) {
            const cellRef = XLSX.utils.encode_cell({ r, c });
            if (!ws[cellRef]) ws[cellRef] = { v: "", t: "s" };
            if (!ws[cellRef].s) ws[cellRef].s = {};
            Object.assign(ws[cellRef].s, styles);
          }
        }
      };

      const applyMainTitleStyle = (ws, row, startCol, endCol) => {
        applyStyleToRange(ws, [row, startCol, row, endCol], {
          fill: { fgColor: { rgb: "0F172A" } },
          font: { bold: true, color: { rgb: "FFFFFF" }, sz: 28, name: "Calibri" },
          alignment: { horizontal: "center", vertical: "center" }
        });
      };

      const applySubTitleStyle = (ws, row, startCol, endCol) => {
        applyStyleToRange(ws, [row, startCol, row, endCol], {
          fill: { fgColor: { rgb: "334155" } },
          font: { bold: true, color: { rgb: "FFFFFF" }, sz: 22, name: "Calibri" },
          alignment: { horizontal: "center", vertical: "center" }
        });
      };

      const applySectionHeaderStyle = (ws, row, startCol, endCol, currency) => {
        const headerColor = getExcelCurrencyColor(currency);
        applyStyleToRange(ws, [row, startCol, row, endCol], {
          fill: { fgColor: { rgb: headerColor } },
          font: { bold: true, color: { rgb: "FFFFFF" }, sz: 20, name: "Calibri" },
          alignment: { horizontal: "left", vertical: "center" }
        });
        applyBorder(ws, [row, startCol, row, endCol], "medium", headerColor);
      };

      const applyTableHeaderStyle = (ws, row, startCol, endCol, currency) => {
        applyStyleToRange(ws, [row, startCol, row, endCol], {
          fill: { fgColor: { rgb: "1E293B" } },
          font: { bold: true, color: { rgb: "FFFFFF" }, sz: 16, name: "Calibri" },
          alignment: { horizontal: "center", vertical: "center", wrapText: true }
        });
        applyBorder(ws, [row, startCol, row, endCol], "medium", "1E293B");
      };

      const applyCurrencyRowStyle = (ws, row, startCol, endCol, currency, isEven = false) => {
        const bgColor = getExcelCurrencyBg(currency, isEven);
        const textColor = getExcelCurrencyTextColor(currency);

        applyStyleToRange(ws, [row, startCol, row, endCol], {
          fill: { fgColor: { rgb: bgColor } },
          font: { bold: false, color: { rgb: textColor }, sz: 14, name: "Calibri" }
        });
        applyBorder(ws, [row, startCol, row, endCol], "thin", "D9DEE7");
      };

      const applySubtotalStyle = (ws, row, startCol, endCol, currency) => {
        const textColor = getExcelCurrencyColor(currency);
        applyStyleToRange(ws, [row, startCol, row, endCol], {
          fill: { fgColor: { rgb: "E2E8F0" } },
          font: { bold: true, color: { rgb: textColor }, sz: 16, name: "Calibri" },
          alignment: { horizontal: "right", vertical: "center" }
        });
        applyBorder(ws, [row, startCol, row, endCol], "medium", textColor);
      };

      const applyGrandTotalStyle = (ws, row, startCol, endCol) => {
        applyStyleToRange(ws, [row, startCol, row, endCol], {
          fill: { fgColor: { rgb: "0D9488" } },
          font: { bold: true, color: { rgb: "FFFFFF" }, sz: 16, name: "Calibri" },
          alignment: { horizontal: "center", vertical: "center" }
        });
        applyBorder(ws, [row, startCol, row, endCol], "medium", "0D9488");
      };

      const applyInfoRowStyle = (ws, row, startCol, endCol) => {
        applyStyleToRange(ws, [row, startCol, row, endCol], {
          font: { sz: 13, name: "Calibri", color: { rgb: "475569" } },
          alignment: { horizontal: "left", vertical: "center" },
          fill: { fgColor: { rgb: "F1F5F9" } }
        });
      };

      const applyLabelStyle = (ws, row, startCol, endCol) => {
        applyStyleToRange(ws, [row, startCol, row, endCol], {
          font: { bold: true, sz: 13, name: "Calibri", color: { rgb: "0F172A" } },
          alignment: { horizontal: "left", vertical: "center" }
        });
      };

      const applyPriceVariationColor = (ws, row, col, priceChange) => {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        if (!ws[cellRef]) return;
        if (!ws[cellRef].s) ws[cellRef].s = {};

        const numChange = parseFloat(priceChange);
        if (!isNaN(numChange)) {
          if (numChange > 0.001) {
            ws[cellRef].s.font = { bold: true, color: { rgb: "DC2626" }, sz: 14, name: "Calibri" };
            ws[cellRef].s.fill = { fgColor: { rgb: "FEE2E2" } };
          } else if (numChange < -0.001) {
            ws[cellRef].s.font = { bold: true, color: { rgb: "0D9488" }, sz: 14, name: "Calibri" };
            ws[cellRef].s.fill = { fgColor: { rgb: "E6F7F5" } };
          }
          ws[cellRef].s.alignment = { horizontal: "center", vertical: "center" };
        }
      };

      // ===== SHEET 1: MASTER SUMMARY =====
      const summaryData = [];

      summaryData.push(["INVENTORY ISSUE REPORT"]);
      summaryData.push(["SECTION & ITEM SUMMARY"]);
      summaryData.push([]);
      summaryData.push(["Generated:", new Date().toLocaleString()]);
      summaryData.push(["Date Range:", cndata.startDate ? formatDateExcel(cndata.startDate) : "N/A", "to", cndata.endDate ? formatDateExcel(cndata.endDate) : "N/A"]);
      summaryData.push([]);

      let grandReq = 0, grandIssued = 0, grandPending = 0;
      let currentRow = 6;

      UseData.forEach((section) => {
        summaryData.push([`${section.CostCenter}`, "", "", "", "", "", "", "", ""]);
        const sectionHeaderRow = currentRow;
        currentRow++;

        summaryData.push(["#", "MATERIAL", "UNIT", "CURRENCY", "REQUIRED", "ISSUED", "PENDING", "AVG PRICE", "TOTAL VALUE"]);
        currentRow++;

        let sectionReq = 0, sectionIssued = 0, sectionPending = 0;
        let itemCounter = 1;

        section.Items.forEach((item) => {
          const unit = item.Requisitions.length > 0 ? item.Requisitions[0].Unit || "" : "";
          const currency = item.Currency || section.Currency || "USD";
          const symbol = getCurrencySymbol(currency);

          let totalPrice = 0;
          let priceCount = 0;
          item.Requisitions.forEach((req) => {
            req.Issues.forEach((issue) => {
              if (issue.IssuePrice > 0) {
                totalPrice += issue.IssuePrice;
                priceCount++;
              }
            });
          });
          const avgPrice = priceCount > 0 ? totalPrice / priceCount : 0;

          summaryData.push([
            itemCounter,
            item.Material,
            unit,
            `${symbol} ${currency}`,
            item.TotalRequired || 0,
            item.TotalIssued || 0,
            item.TotalPending || 0,
            avgPrice > 0 ? avgPrice.toFixed(4) : "-",
            Math.round(item.TotalValue || 0)
          ]);

          sectionReq += item.TotalRequired || 0;
          sectionIssued += item.TotalIssued || 0;
          sectionPending += item.TotalPending || 0;
          itemCounter++;
          currentRow++;
        });

        summaryData.push(["", `SUBTOTAL: ${section.CostCenter}`, "", "", sectionReq, sectionIssued, sectionPending, "", ""]);
        currentRow++;

        summaryData.push([]);
        summaryData.push([]);
        summaryData.push([]);
        summaryData.push([]);
        summaryData.push([]);
        currentRow += 5;

        grandReq += sectionReq;
        grandIssued += sectionIssued;
        grandPending += sectionPending;
      });

      summaryData.push(["", "GRAND TOTAL", "", "", grandReq, grandIssued, grandPending, "", ""]);
      const grandTotalRow = currentRow;

      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      wsSummary["!cols"] = [
        { wch: 6 }, { wch: 40 }, { wch: 12 }, { wch: 14 },
        { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }
      ];

      applyMainTitleStyle(wsSummary, 0, 0, 8);
      applySubTitleStyle(wsSummary, 1, 0, 8);
      if (!wsSummary["!merges"]) wsSummary["!merges"] = [];
      wsSummary["!merges"].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 8 } });
      wsSummary["!merges"].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 8 } });

      applyLabelStyle(wsSummary, 3, 0, 1);
      applyInfoRowStyle(wsSummary, 4, 0, 3);

      let styleRow = 6;

      UseData.forEach((section) => {
        const sectionCurrency = section.Currency || "USD";

        applySectionHeaderStyle(wsSummary, styleRow, 0, 8, sectionCurrency);
        if (!wsSummary["!merges"]) wsSummary["!merges"] = [];
        wsSummary["!merges"].push({ s: { r: styleRow, c: 0 }, e: { r: styleRow, c: 8 } });
        styleRow++;

        applyTableHeaderStyle(wsSummary, styleRow, 0, 8, sectionCurrency);
        styleRow++;

        section.Items.forEach((item) => {
          const itemCurrency = item.Currency || sectionCurrency || "USD";
          const isEven = styleRow % 2 === 0;
          applyCurrencyRowStyle(wsSummary, styleRow, 0, 8, itemCurrency, isEven);
          styleRow++;
        });

        applySubtotalStyle(wsSummary, styleRow, 0, 8, sectionCurrency);
        styleRow++;

        styleRow += 5;
      });

      applyGrandTotalStyle(wsSummary, grandTotalRow, 0, 8);

      XLSX.utils.book_append_sheet(wb, wsSummary, "Master Summary");

      // ===== SHEET 2: DETAILED ISSUES WITH PRICE HISTORY =====
      const detailData = [];

      detailData.push(["INVENTORY ISSUE REPORT"]);
      detailData.push(["DETAILED ISSUES WITH PRICE HISTORY"]);
      detailData.push([]);
      detailData.push(["Generated:", new Date().toLocaleString()]);
      detailData.push(["Date Range:", cndata.startDate ? formatDateExcel(cndata.startDate) : "N/A", "to", cndata.endDate ? formatDateExcel(cndata.endDate) : "N/A"]);
      detailData.push([]);
      detailData.push([
        "SECTION", "MATERIAL", "REQ NO", "ISSUE NO", "ISSUE DATE",
        "QTY", "PRICE", "PREVIOUS PRICE", "PRICE CHANGE", "CHANGE %",
        "VALUE", "CURRENCY", "ISSUED BY"
      ]);

      UseData.forEach((section) => {
        section.Items.forEach((item) => {
          const itemCurrency = item.Currency || section.Currency || "USD";

          item.Requisitions.forEach((req) => {
            req.Issues.forEach((issue) => {
              const priceChange = issue.PreviousPrice ? issue.IssuePrice - issue.PreviousPrice : 0;
              const changePercent = issue.PreviousPrice && issue.PreviousPrice > 0 ? (priceChange / issue.PreviousPrice) * 100 : 0;
              const symbol = getCurrencySymbol(issue.Currency || "USD");

              const priceFormat = issue.IssuePrice < 1 ? issue.IssuePrice.toFixed(4) : issue.IssuePrice.toFixed(2);
              const prevPriceFormat = issue.PreviousPrice && issue.PreviousPrice < 1
                ? issue.PreviousPrice.toFixed(4)
                : issue.PreviousPrice ? issue.PreviousPrice.toFixed(2) : "-";

              detailData.push([
                section.CostCenter,
                item.Material,
                req.RequisitionNo,
                issue.IssueNo,
                formatDateExcel(issue.IssueDate),
                issue.IssueQty || 0,
                priceFormat,
                prevPriceFormat,
                priceChange !== 0 ? `${priceChange > 0 ? "+" : ""}${priceChange.toFixed(4)}` : "No Change",
                changePercent !== 0 ? `${changePercent > 0 ? "+" : ""}${changePercent.toFixed(1)}%` : "0%",
                Math.round(issue.IssueValue || 0),
                `${symbol} ${issue.Currency || "USD"}`,
                issue.IssuedBy || "-"
              ]);
            });
          });
        });
      });

      const wsDetail = XLSX.utils.aoa_to_sheet(detailData);
      wsDetail["!cols"] = [
        { wch: 20 }, { wch: 35 }, { wch: 18 }, { wch: 18 },
        { wch: 15 }, { wch: 12 }, { wch: 18 }, { wch: 18 },
        { wch: 20 }, { wch: 15 }, { wch: 18 }, { wch: 12 }, { wch: 20 }
      ];

      applyMainTitleStyle(wsDetail, 0, 0, 12);
      applySubTitleStyle(wsDetail, 1, 0, 12);
      if (!wsDetail["!merges"]) wsDetail["!merges"] = [];
      wsDetail["!merges"].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 12 } });
      wsDetail["!merges"].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 12 } });

      applyLabelStyle(wsDetail, 3, 0, 1);
      applyInfoRowStyle(wsDetail, 4, 0, 3);
      applyTableHeaderStyle(wsDetail, 6, 0, 12, "USD");

      let detailRow = 7;
      UseData.forEach((section) => {
        section.Items.forEach((item) => {
          const itemCurrency = item.Currency || section.Currency || "USD";

          item.Requisitions.forEach((req) => {
            req.Issues.forEach((issue) => {
              const isEven = detailRow % 2 === 0;
              applyCurrencyRowStyle(wsDetail, detailRow, 0, 12, itemCurrency, isEven);

              const rowData = detailData[detailRow];
              if (rowData && rowData[8] && rowData[8] !== "No Change") {
                applyPriceVariationColor(wsDetail, detailRow, 8, rowData[8]);
              }

              detailRow++;
            });
          });
        });
      });

      XLSX.utils.book_append_sheet(wb, wsDetail, "Price History");

      // ===== SHEET 3: CURRENCY BREAKDOWN =====
      const currencyData = [];

      currencyData.push(["INVENTORY ISSUE REPORT"]);
      currencyData.push(["CURRENCY BREAKDOWN"]);
      currencyData.push([]);
      currencyData.push(["Generated:", new Date().toLocaleString()]);
      currencyData.push(["Date Range:", cndata.startDate ? formatDateExcel(cndata.startDate) : "N/A", "to", cndata.endDate ? formatDateExcel(cndata.endDate) : "N/A"]);
      currencyData.push([]);
      currencyData.push(["CURRENCY", "TOTAL VALUE", "NO. OF TRANSACTIONS", "PERCENTAGE OF TOTAL"]);

      const currencyTotals = {};
      const currencyCounts = {};
      let totalValueAll = 0;
      let totalTransactions = 0;

      UseData.forEach((section) => {
        section.Items.forEach((item) => {
          const curr = item.Currency || section.Currency || "USD";
          currencyTotals[curr] = (currencyTotals[curr] || 0) + item.TotalValue;
          currencyCounts[curr] = (currencyCounts[curr] || 0) + item.Requisitions.length;
          totalValueAll += item.TotalValue;
        });
      });

      Object.values(currencyCounts).forEach((v) => (totalTransactions += v));

      const sortedCurrencies = Object.keys(currencyTotals).sort();

      sortedCurrencies.forEach((curr) => {
        const value = currencyTotals[curr] || 0;
        const count = currencyCounts[curr] || 0;
        const percentage = totalValueAll > 0 ? ((value / totalValueAll) * 100).toFixed(1) : "0";
        const symbol = getCurrencySymbol(curr);

        currencyData.push([`${symbol} ${curr}`, Math.round(value), count, `${percentage}%`]);
      });

      currencyData.push([]);
      currencyData.push(["TOTAL", Math.round(totalValueAll), totalTransactions, "100%"]);

      const wsCurrency = XLSX.utils.aoa_to_sheet(currencyData);
      wsCurrency["!cols"] = [{ wch: 20 }, { wch: 25 }, { wch: 25 }, { wch: 20 }];

      applyMainTitleStyle(wsCurrency, 0, 0, 3);
      applySubTitleStyle(wsCurrency, 1, 0, 3);
      if (!wsCurrency["!merges"]) wsCurrency["!merges"] = [];
      wsCurrency["!merges"].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } });
      wsCurrency["!merges"].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 3 } });

      applyLabelStyle(wsCurrency, 3, 0, 1);
      applyInfoRowStyle(wsCurrency, 4, 0, 3);
      applyTableHeaderStyle(wsCurrency, 6, 0, 3, "USD");

      for (let i = 7; i < currencyData.length; i++) {
        const row = currencyData[i];
        if (!row || row.length === 0) continue;
        const firstCell = String(row[0] || "");

        if (firstCell && firstCell !== "TOTAL" && !firstCell.includes("TOTAL")) {
          const isEven = i % 2 === 0;
          const currency = firstCell.replace(/[^\w]/g, "");
          applyCurrencyRowStyle(wsCurrency, i, 0, 3, currency, isEven);
        } else if (firstCell === "TOTAL") {
          applyGrandTotalStyle(wsCurrency, i, 0, 3);
        }
      }

      XLSX.utils.book_append_sheet(wb, wsCurrency, "Currency Breakdown");

      const fileName = `Inventory_Issue_Report_${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast.success(`Exported ${wb.SheetNames.length} sheets successfully`);
    } catch (error) {
      console.error("Export Error:", error);
      toast.error("Failed to export data. Please try again.");
    }
  }, [UseData, cndata]);

  // Currency filter control
  const currencyFilterUI = useMemo(() => {
    if (uniqueCurrencies.length === 0) return null;
    return (
      <select
        className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400 transition-all"
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
    );
  }, [uniqueCurrencies, filterCurrency]);

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="min-h-screen bg-[#F5F7FA] p-4 md:p-6 font-sans text-slate-800">
      <div className="max-w-[1600px] mx-auto">

        {/* HEADER */}
        <motion.div
          initial={{ y: -16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative bg-white rounded-2xl shadow-sm border border-slate-200 p-5 md:p-6 mb-5 overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-slate-900 via-teal-600 to-slate-900" />
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-900 rounded-xl">
                <Package className="text-white" size={22} />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Inventory Issue Report</h1>
                <div className="flex items-center gap-2.5 text-xs text-slate-400 mt-1 flex-wrap">
                  <span className="flex items-center gap-1"><Users size={12} /> {uniqueSections.length} sections</span>
                  <span className="text-slate-300">•</span>
                  <span>{summaryStats.materials} materials</span>
                  <span className="text-slate-300">•</span>
                  <span>{summaryStats.issues} issues</span>
                  {cndata.startDate && cndata.endDate && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span className="inline-flex items-center gap-1 text-slate-500 font-medium">
                        <CalendarDays size={12} />
                        {formatDate(cndata.startDate)} → {formatDate(cndata.endDate)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); InvIssue(); }} className="flex flex-wrap items-center gap-3">
              <DateRangePicker />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold shadow-sm transition-all flex items-center gap-2 disabled:opacity-60"
                disabled={loading}
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                {loading ? "Loading…" : "Load data"}
              </motion.button>
            </form>
          </div>
        </motion.div>

        {/* SEARCH RESULTS BANNER */}
        {searchText && searchText.trim().length > 0 && UseData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-2 text-sm">
              <Search size={14} className="text-amber-600" />
              <span className="text-slate-700">
                Results for <span className="font-semibold text-amber-800">"{searchText.trim()}"</span>
              </span>
              <span className="text-xs text-slate-400">
                ({UseData.length} sections · {summaryStats.materials} materials · {summaryStats.issues} issues)
              </span>
            </div>
            <button onClick={() => setSearchText("")} className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 font-medium">
              <XCircle size={13} />
              Clear
            </button>
          </motion.div>
        )}

        {/* KPI STRIP */}
        {!loading && UseData.length > 0 && (
          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.05 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5"
          >
            <StatCard title="Requisitioned" value={formatNumber(summaryStats.req)} icon={ClipboardList} accent="slate" />
            <StatCard title="Issued" value={formatNumber(summaryStats.issued)} icon={CheckCircle2} accent="teal" />
            <StatCard title="Pending" value={formatNumber(summaryStats.pending)} icon={Clock} accent="rose" />
            <StatCard title="Balance" value={formatNumber(summaryStats.balance)} icon={Box} accent="violet" />
            <StatCard
              title="Total value"
              value={Object.entries(summaryStats.currencyBreakdown).map(([curr, val]) => `${getCurrencySymbol(curr)}${formatNumber(Math.round(val))}`).join(" · ")}
              icon={Wallet}
              accent="amber"
              subtext={Object.keys(summaryStats.currencyBreakdown).join(" · ")}
            />
            <StatCard title="Completion" value={`${summaryStats.completion}%`} icon={TrendingUp} accent="ink" />
          </motion.div>
        )}

        {/* FILTER BAR */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3.5 mb-5"
        >
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex-1 min-w-[220px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search section, material, req no, issue no, person…"
                className="w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400 transition-all"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
              {searchText && (
                <button onClick={() => setSearchText("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <XCircle size={15} />
                </button>
              )}
            </div>

            <select
              className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400 transition-all"
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
            >
              <option value="all">All sections</option>
              {uniqueSections.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select
              className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400 transition-all"
              value={filterItem}
              onChange={(e) => setFilterItem(e.target.value)}
            >
              <option value="all">All materials</option>
              {uniqueItems.map((i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>

            {currencyFilterUI}

            <select
              className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400 transition-all"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All status</option>
              <option value="completed">Complete (≥80%)</option>
              <option value="pending">In progress (1–79%)</option>
              <option value="critical">Critical (0%)</option>
            </select>

            <div className="h-6 w-px bg-slate-200 mx-0.5 hidden md:block" />

            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
              {[
                { key: "req", label: "Req" },
                { key: "pending", label: "Pending" },
                { key: "issue", label: "Issued" }
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setSortBy(opt.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    sortBy === opt.key ? "bg-white shadow-sm text-teal-700" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
              title={sortOrder === "desc" ? "Descending" : "Ascending"}
              className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-slate-500"
            >
              <ArrowUpDown size={16} />
            </button>

            <button
              onClick={() => setShowCharts(!showCharts)}
              title="Toggle charts"
              className={`p-2.5 rounded-xl border transition-all ${showCharts ? "bg-teal-50 border-teal-200 text-teal-700" : "bg-white border-slate-200 text-slate-400"}`}
            >
              <LayoutGrid size={16} />
            </button>

            <button
              onClick={() => setShowBalanceDetails(!showBalanceDetails)}
              title="Toggle balance details"
              className={`p-2.5 rounded-xl border transition-all ${showBalanceDetails ? "bg-violet-50 border-violet-200 text-violet-700" : "bg-white border-slate-200 text-slate-400"}`}
            >
              <SlidersHorizontal size={16} />
            </button>

            <button
              onClick={exportExcel}
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all flex items-center gap-2"
            >
              <Download size={16} />
              Export
            </button>
          </div>
        </motion.div>

        {/* LOADING STATE */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <FourSquare color="#0D9488" size="medium" />
            <p className="text-sm text-slate-400">Loading inventory data…</p>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && UseData.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-dashed border-slate-300 gap-3">
            <div className="p-4 bg-slate-100 rounded-2xl">
              <Package size={28} className="text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-600">No data to show yet</p>
            <p className="text-xs text-slate-400 max-w-xs text-center">
              Choose a date range above and select <span className="font-medium text-slate-600">Load data</span>, or adjust your filters to widen the results.
            </p>
          </div>
        )}

        {/* SECTIONS */}
        <div className="space-y-4">
          {UseData.map((section, idx) => {
            const sectionSymbol = getCurrencySymbol(section.Currency || "USD");
            const sectionTheme = getTheme(section.Currency);

            return (
              <motion.div
                key={section.CostCenter}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.02, 0.3) }}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow duration-300"
              >
                {/* SECTION HEADER */}
                <div
                  className="flex flex-wrap items-center justify-between gap-3 p-4 md:p-5 cursor-pointer hover:bg-slate-50/70 transition-colors"
                  onClick={() => toggleSection(section.CostCenter)}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-2.5 bg-slate-900 rounded-xl">
                      <Building2 size={18} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">{section.CostCenter}</h2>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1"><Package size={11} /> {section.MaterialCount} materials</span>
                        <span className="flex items-center gap-1"><ClipboardList size={11} /> {section.RequisitionCount} requisitions</span>
                        <span className="flex items-center gap-1 text-teal-600 font-medium"><CheckCircle2 size={11} /> {formatNumber(section.TotalIssued)} issued</span>
                        <span className="flex items-center gap-1 text-rose-500 font-medium"><Clock size={11} /> {formatNumber(section.TotalPending)} pending</span>
                        <span className="flex items-center gap-1 text-violet-600 font-medium"><Box size={11} /> {formatNumber(section.TotalBalance)} balance</span>
                        <span className={`flex items-center gap-1 font-semibold ${sectionTheme.text}`}>
                          {sectionSymbol}{formatNumber(Math.round(section.TotalValue))}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-2.5">
                      <div className="text-right">
                        <div className="text-sm font-bold text-slate-800 tabular-nums">{section.CompletionRate}%</div>
                        <div className="text-[10px] text-slate-400">complete</div>
                      </div>
                      <div className="w-20">
                        <ProgressBar value={section.CompletionRate} />
                      </div>
                    </div>
                    <StatusBadge percentage={section.CompletionRate} />
                    {expandedSections[section.CostCenter] ? (
                      <ChevronDown size={20} className="text-slate-400" />
                    ) : (
                      <ChevronRight size={20} className="text-slate-400" />
                    )}
                  </div>
                </div>

                {/* SECTION CONTENT */}
                <AnimatePresence>
                  {expandedSections[section.CostCenter] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="border-t border-slate-200"
                    >
                      {/* Section Chart */}
                      {showCharts && section.Items.length > 1 && (
                        <div className="p-4 bg-slate-50/60 border-b border-slate-200">
                          <div className="h-48">
                            <Bar
                              data={{
                                labels: section.Items.map((i) => i.Material),
                                datasets: [
                                  { label: "Issued", data: section.Items.map((i) => i.TotalIssued), backgroundColor: "#0D9488", borderRadius: 4 },
                                  { label: "Pending", data: section.Items.map((i) => i.TotalPending), backgroundColor: "#DC2626", borderRadius: 4 },
                                  { label: "Balance", data: section.Items.map((i) => i.TotalBalance), backgroundColor: "#7C3AED", borderRadius: 4 }
                                ]
                              }}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                  legend: { position: "top", labels: { boxWidth: 10, font: { size: 10 } } },
                                  datalabels: { display: false }
                                },
                                scales: {
                                  y: { beginAtZero: true, grid: { color: "rgba(15,23,42,0.05)" } },
                                  x: { grid: { display: false } }
                                }
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* MATERIALS */}
                      <div className="p-4 space-y-3">
                        {section.Items.map((item) => {
                          const itemKey = `${section.CostCenter}-${item.Material}`;
                          const isItemExpanded = expandedItems[itemKey] || false;
                          const showPie = expandedPie[itemKey] || false;
                          const itemTheme = getTheme(item.Currency || section.Currency);
                          const itemSymbol = getCurrencySymbol(item.Currency || section.Currency || "USD");

                          return (
                            <div key={itemKey} className="relative border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 hover:shadow-sm transition-all duration-200">
                              <div className={`absolute left-0 top-0 bottom-0 w-1 ${itemTheme.dot}`} />

                              {/* MATERIAL HEADER */}
                              <div
                                className="flex flex-wrap items-center justify-between gap-2 pl-4 pr-3 py-3 bg-white cursor-pointer hover:bg-slate-50/70 transition-all"
                                onClick={(e) => toggleItem(itemKey, e)}
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div className="p-1.5 bg-slate-100 rounded-lg flex-shrink-0">
                                    <Box size={14} className="text-slate-600" />
                                  </div>
                                  <span className="font-semibold text-sm text-slate-800 truncate">{item.Material}</span>
                                  <div className="hidden md:flex flex-wrap items-center gap-3 text-xs text-slate-400 tabular-nums">
                                    <span>Req <b className="text-slate-600 font-semibold">{formatNumber(item.TotalRequired)}</b></span>
                                    <span>Issued <b className="text-teal-600 font-semibold">{formatNumber(item.TotalIssued)}</b></span>
                                    <span>Pending <b className="text-rose-500 font-semibold">{formatNumber(item.TotalPending)}</b></span>
                                    <span>Balance <b className="text-violet-600 font-semibold">{formatNumber(item.TotalBalance)}</b></span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <button
                                    onClick={(e) => togglePie(itemKey, e)}
                                    className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400"
                                    title="Toggle breakdown"
                                  >
                                    {showPie ? <EyeOff size={15} /> : <Eye size={15} />}
                                  </button>
                                  <div className="w-16">
                                    <ProgressBar value={item.CompletionRate} height="h-1" />
                                  </div>
                                  {isItemExpanded ? <ChevronDown size={17} className="text-slate-400" /> : <ChevronRight size={17} className="text-slate-400" />}
                                </div>
                              </div>

                              {/* MATERIAL CONTENT */}
                              <AnimatePresence>
                                {isItemExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="border-t border-slate-200"
                                  >
                                    {/* Pie Chart */}
                                    {showPie && item.Requisitions.length > 0 && (
                                      <div className="p-3 pl-4 bg-slate-50/60 border-b border-slate-200">
                                        <div className="flex items-center gap-6 flex-wrap">
                                          <div className="h-24 w-24 flex-shrink-0">
                                            <Doughnut
                                              data={getItemPieData(item.Requisitions)}
                                              options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: {
                                                  legend: { position: "bottom", labels: { boxWidth: 9, font: { size: 9 } } },
                                                  datalabels: {
                                                    display: true,
                                                    formatter: (v, ctx) => {
                                                      const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                                                      return total > 0 ? ((v / total) * 100).toFixed(1) + "%" : "0%";
                                                    },
                                                    color: "#fff",
                                                    font: { weight: "bold", size: 9 }
                                                  }
                                                }
                                              }}
                                            />
                                          </div>
                                          <div className="flex-1 grid grid-cols-3 gap-3 text-xs min-w-[220px]">
                                            <div>
                                              <p className="text-slate-400">Required</p>
                                              <p className="font-bold text-slate-700 tabular-nums">{formatNumber(item.TotalRequired)}</p>
                                            </div>
                                            <div>
                                              <p className="text-slate-400">Issued</p>
                                              <p className="font-bold text-teal-600 tabular-nums">{formatNumber(item.TotalIssued)}</p>
                                            </div>
                                            <div>
                                              <p className="text-slate-400">Pending</p>
                                              <p className="font-bold text-rose-500 tabular-nums">{formatNumber(item.TotalPending)}</p>
                                            </div>
                                            <div>
                                              <p className="text-slate-400">Balance</p>
                                              <p className="font-bold text-violet-600 tabular-nums">{formatNumber(item.TotalBalance)}</p>
                                            </div>
                                            <div>
                                              <p className="text-slate-400 flex items-center gap-1"><Wallet size={11} /> Value</p>
                                              <p className={`font-bold tabular-nums ${itemTheme.text}`}>{itemSymbol}{formatNumber(Math.round(item.TotalValue))}</p>
                                            </div>
                                            <div>
                                              <p className="text-slate-400">Extra</p>
                                              <p className="font-bold text-amber-600 tabular-nums">{formatNumber(item.TotalExtraIssued)}</p>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* REQUISITIONS TABLE */}
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-sm">
                                        <thead>
                                          <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider border-b border-slate-200">
                                            <th className="p-2.5 text-left font-semibold">Req no</th>
                                            <th className="p-2.5 text-left font-semibold">Date</th>
                                            <th className="p-2.5 text-right font-semibold">Req qty</th>
                                            <th className="p-2.5 text-right font-semibold">Issued</th>
                                            <th className="p-2.5 text-right font-semibold">Pending</th>
                                            <th className="p-2.5 text-right font-semibold">Balance</th>
                                            <th className="p-2.5 text-center font-semibold">Progress</th>
                                            <th className="p-2.5 text-left font-semibold">Unit</th>
                                            <th className="p-2.5 text-left font-semibold">Currency</th>
                                            <th className="p-2.5 text-left font-semibold">Raised by</th>
                                            <th className="p-2.5 text-left font-semibold">Issues</th>
                                          </tr>
                                          <tr className="bg-teal-50/70 font-semibold border-b border-teal-100">
                                            <td colSpan={2} className="p-2.5 text-right text-slate-500 text-xs">Total</td>
                                            <td className="p-2.5 text-right tabular-nums text-slate-700">{formatNumber(item.TotalRequired)}</td>
                                            <td className="p-2.5 text-right tabular-nums text-teal-700">{formatNumber(item.TotalIssued)}</td>
                                            <td className="p-2.5 text-right tabular-nums text-rose-600">{formatNumber(item.TotalPending)}</td>
                                            <td className="p-2.5 text-right tabular-nums text-violet-700">{formatNumber(item.TotalBalance)}</td>
                                            <td className="p-2.5 text-center">
                                              <span className={`px-2 py-0.5 rounded-full text-[11px] border ${getStatusBadge(item.CompletionRate).color}`}>
                                                {item.CompletionRate}%
                                              </span>
                                            </td>
                                            <td colSpan={4}></td>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {item.Requisitions.map((req, reqIdx) => {
                                            const reqKey = `${itemKey}-${req.RequisitionNo}`;
                                            const isReqExpanded = expandedRequisitions[reqKey] || false;
                                            const reqCurrencyVal = req.Currency || item.Currency || section.Currency || "USD";
                                            const reqSymbol = getCurrencySymbol(reqCurrencyVal);

                                            return (
                                              <React.Fragment key={reqIdx}>
                                                <tr
                                                  className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors cursor-pointer"
                                                  onClick={(e) => toggleRequisition(reqKey, e)}
                                                >
                                                  <td className="p-2.5 font-semibold text-slate-700">
                                                    {req.RequisitionNo}
                                                    {req.JobCardNo && <div className="text-[10px] text-slate-400 font-normal">Job: {req.JobCardNo}</div>}
                                                  </td>
                                                  <td className="p-2.5 text-slate-500">{formatDate(req.RequisitionDate)}</td>
                                                  <td className="p-2.5 text-right font-medium tabular-nums">{formatNumber(req.RequiredQty)}</td>
                                                  <td className="p-2.5 text-right text-teal-600 font-medium tabular-nums">{formatNumber(req.TotalIssue)}</td>
                                                  <td className="p-2.5 text-right text-rose-500 font-medium tabular-nums">{formatNumber(req.PendingQty)}</td>
                                                  <td className="p-2.5 text-right text-violet-600 font-medium tabular-nums">{formatNumber(req.BalanceQTY)}</td>
                                                  <td className="p-2.5 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                      <div className="w-14">
                                                        <ProgressBar value={req.CompletionPercent} height="h-1.5" />
                                                      </div>
                                                      <span className="text-[11px] font-semibold tabular-nums">{req.CompletionPercent}%</span>
                                                    </div>
                                                  </td>
                                                  <td className="p-2.5 text-slate-500">{req.Unit || "N/A"}</td>
                                                  <td className="p-2.5"><CurrencyBadge currency={reqCurrencyVal} /></td>
                                                  <td className="p-2.5 text-slate-500 text-xs">
                                                    {req.RequistionRaiseBy && (
                                                      <div className="flex items-center gap-1">
                                                        <UserPlus size={11} className="text-slate-400" />
                                                        <span>{req.RequistionRaiseBy}</span>
                                                      </div>
                                                    )}
                                                  </td>
                                                  <td className="p-2.5">
                                                    <div className="flex items-center gap-1.5">
                                                      <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                                                        {req.IssueCount} issues
                                                      </span>
                                                      {isReqExpanded ? <ChevronDown size={13} className="text-slate-400" /> : <ChevronRight size={13} className="text-slate-400" />}
                                                    </div>
                                                  </td>
                                                </tr>

                                                <AnimatePresence>
                                                  {isReqExpanded && (
                                                    <tr>
                                                      <td colSpan={11} className="p-0">
                                                        <motion.div
                                                          initial={{ height: 0, opacity: 0 }}
                                                          animate={{ height: "auto", opacity: 1 }}
                                                          exit={{ height: 0, opacity: 0 }}
                                                          transition={{ duration: 0.2 }}
                                                          className="bg-slate-50/60 p-3.5"
                                                        >
                                                          <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 mb-3">
                                                            {req.RequistionRaiseBy && (
                                                              <div className="bg-white rounded-xl p-2.5 border border-slate-200">
                                                                <div className="flex items-center gap-1.5">
                                                                  <UserPlus size={13} className="text-slate-400" />
                                                                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Raised by</span>
                                                                </div>
                                                                <p className="text-sm font-semibold text-slate-800 mt-0.5">{req.RequistionRaiseBy}</p>
                                                                {req.Department && <span className="text-[11px] text-slate-400">{req.Department}</span>}
                                                              </div>
                                                            )}

                                                            {req.PrimaryIssuer && req.PrimaryIssuer !== "N/A" && (
                                                              <div className="bg-white rounded-xl p-2.5 border border-slate-200">
                                                                <div className="flex items-center gap-1.5">
                                                                  <UserCheck size={13} className="text-teal-500" />
                                                                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Primary issuer</span>
                                                                </div>
                                                                <p className="text-sm font-semibold text-slate-800 mt-0.5">{req.PrimaryIssuer}</p>
                                                                {req.UniqueIssuers && req.UniqueIssuers.length > 1 && (
                                                                  <span className="text-[11px] text-slate-400">+{req.UniqueIssuers.length - 1} other issuers</span>
                                                                )}
                                                              </div>
                                                            )}

                                                            <div className={`rounded-xl p-2.5 border ${getTheme(reqCurrencyVal).bg} ${getTheme(reqCurrencyVal).border}`}>
                                                              <div className="flex items-center gap-1.5">
                                                                <Wallet size={13} className={getTheme(reqCurrencyVal).text} />
                                                                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Currency</span>
                                                              </div>
                                                              <p className={`text-sm font-semibold mt-0.5 ${getTheme(reqCurrencyVal).text}`}>
                                                                {reqSymbol} {reqCurrencyVal}
                                                              </p>
                                                            </div>

                                                            {req.Issues.length > 1 && (
                                                              <div className="bg-white rounded-xl p-2.5 border border-slate-200">
                                                                <div className="flex items-center gap-1.5">
                                                                  <TrendingUp size={13} className="text-amber-500" />
                                                                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Price changes</span>
                                                                </div>
                                                                <div className="mt-1">
                                                                  {req.Issues.map((issue, idx2) => {
                                                                    if (issue.PreviousPrice && Math.abs(issue.PreviousPrice - issue.IssuePrice) > 0.001) {
                                                                      const diff = issue.IssuePrice - issue.PreviousPrice;
                                                                      const up = diff > 0;
                                                                      return (
                                                                        <span key={idx2} className={`text-[11px] mr-2 font-medium ${up ? "text-rose-600" : "text-teal-600"}`}>
                                                                          {up ? "↑" : "↓"} {issue.IssuePrice.toFixed(4)}
                                                                        </span>
                                                                      );
                                                                    }
                                                                    return null;
                                                                  })}
                                                                  {req.Issues.every((i) => !i.PreviousPrice || Math.abs(i.PreviousPrice - i.IssuePrice) <= 0.001) && (
                                                                    <span className="text-[11px] text-slate-400">No price changes</span>
                                                                  )}
                                                                </div>
                                                              </div>
                                                            )}
                                                          </div>

                                                          {showBalanceDetails && (
                                                            <div className="grid grid-cols-4 gap-2 p-3 bg-white rounded-xl border border-slate-200 mb-3">
                                                              <div className="text-center">
                                                                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Required</p>
                                                                <p className="text-sm font-bold text-slate-700 tabular-nums">{formatNumber(req.RequiredQty)}</p>
                                                              </div>
                                                              <div className="text-center">
                                                                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Issued</p>
                                                                <p className="text-sm font-bold text-teal-600 tabular-nums">{formatNumber(req.TotalIssue)}</p>
                                                              </div>
                                                              <div className="text-center">
                                                                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Pending</p>
                                                                <p className="text-sm font-bold text-rose-500 tabular-nums">{formatNumber(req.PendingQty)}</p>
                                                              </div>
                                                              <div className="text-center">
                                                                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Balance</p>
                                                                <p className="text-sm font-bold text-violet-600 tabular-nums">{formatNumber(req.BalanceQTY)}</p>
                                                              </div>
                                                            </div>
                                                          )}

                                                          <div className="bg-white rounded-xl p-3 border border-slate-200">
                                                            <h5 className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
                                                              <Activity size={13} />
                                                              Issue history ({req.Issues.length})
                                                            </h5>
                                                            <div className="space-y-2 max-h-64 overflow-y-auto pr-1.5">
                                                              {req.Issues.map((issue, i) => (
                                                                <IssueCard key={i} issue={issue} index={i} />
                                                              ))}
                                                            </div>
                                                          </div>

                                                          {req.UniqueIssuers && req.UniqueIssuers.length > 1 && (
                                                            <div className="mt-2.5 p-2.5 bg-white rounded-xl border border-slate-200">
                                                              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                                                                <Users size={12} />
                                                                All issuers ({req.UniqueIssuers.length})
                                                              </p>
                                                              <div className="flex flex-wrap gap-1.5 mt-1.5">
                                                                {req.UniqueIssuers.map((issuer, idx3) => (
                                                                  <span key={idx3} className="text-[11px] bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200 text-slate-600">
                                                                    {issuer}
                                                                  </span>
                                                                ))}
                                                              </div>
                                                            </div>
                                                          )}
                                                        </motion.div>
                                                      </td>
                                                    </tr>
                                                  )}
                                                </AnimatePresence>
                                              </React.Fragment>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>

                      {/* Section Footer */}
                      <div className="px-4 py-3 bg-slate-50/60 border-t border-slate-200 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400">
                        <span>Materials <b className="text-slate-600 font-semibold">{section.MaterialCount}</b></span>
                        <span>Requisitions <b className="text-slate-600 font-semibold">{section.RequisitionCount}</b></span>
                        <span>Issues <b className="text-slate-600 font-semibold">{section.IssueCount}</b></span>
                        <span>Req <b className="text-slate-600 font-semibold">{formatNumber(section.TotalRequired)}</b></span>
                        <span>Issued <b className="text-teal-600 font-semibold">{formatNumber(section.TotalIssued)}</b></span>
                        <span>Pending <b className="text-rose-500 font-semibold">{formatNumber(section.TotalPending)}</b></span>
                        <span>Balance <b className="text-violet-600 font-semibold">{formatNumber(section.TotalBalance)}</b></span>
                        <span className={`font-semibold ${sectionTheme.text}`}>{sectionSymbol}{formatNumber(Math.round(section.TotalValue))}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* FOOTER */}
        {!loading && UseData.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 text-center bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
            <p className="text-[11px] text-slate-400">Inventory Issue Report · Generated {new Date().toLocaleString()}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {UseData.length} sections · {summaryStats.materials} materials · {summaryStats.req} requisitions · {summaryStats.issues} issues
              {cndata.startDate && cndata.endDate && ` · ${formatDate(cndata.startDate)} → ${formatDate(cndata.endDate)}`}
              {searchText && searchText.trim().length > 0 && ` · Search: "${searchText.trim()}"`}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default FullAdvancedInventoryIssue_CompleteGreen;
