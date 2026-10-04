// ============================================================
// INVENTORY MANAGEMENT SYSTEM — STOCK LEDGER EDITION
// Professional deep stock tracking with full cycle
// ============================================================

import React, { useContext, useEffect, useMemo, useState, useCallback, useRef } from "react";
import { GetDataContext } from "../components/DataContext";
import DateRangePicker from "../components/DatePickerData";
import axios from "axios";
import { toast } from "react-toastify";
import { saveAs } from "file-saver";
import _ from "lodash";
import XLSX from "xlsx-js-style";
import { HashLoader } from "react-spinners";
import {
  FiSearch, FiDownload, FiRefreshCw, FiChevronDown, FiChevronUp,
  FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight,
  FiFilter, FiAlertCircle, FiTrendingUp, FiTrendingDown,
  FiBarChart2, FiPackage, FiTruck, FiClipboard, FiFileText,
  FiHome, FiActivity, FiLayers, FiBookOpen, FiArrowDownCircle,
  FiArrowUpCircle, FiDollarSign, FiPercent, FiBox
} from "react-icons/fi";
import { FaSort, FaSortUp, FaSortDown } from "react-icons/fa";

// ============================================================
// 1. CONSTANTS
// ============================================================

const API_BASE = "https://tpl-api.ebs365.info/api/InventoryBI";
const DEFAULT_PAGE_SIZE = 15;
const LOW_STOCK_THRESHOLD = 50;

const OPENING_BALANCES = {
  "LDPE": 7258,
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
  "Poly Ink (Toyo Magenta)": 0
};

// ============================================================
// 2. TABS
// ============================================================

const TABS = [
  { id: 'dashboard', label: 'Dashboard',     icon: FiHome,      color: 'blue' },
  { id: 'summary',   label: 'Stock Summary', icon: FiLayers,    color: 'emerald' },
  { id: 'ledger',    label: 'Stock Ledger',  icon: FiBookOpen,  color: 'purple' },
  { id: 'receives',  label: 'Receives',      icon: FiArrowDownCircle, color: 'cyan' },
  { id: 'issues',    label: 'Issues',        icon: FiArrowUpCircle,   color: 'rose' },
  { id: 'requisitions', label: 'Requisitions', icon: FiClipboard, color: 'amber' },
  { id: 'full-report', label: 'Full Report', icon: FiFileText,  color: 'indigo' },
];

// ============================================================
// 3. HELPERS
// ============================================================

const formatDate = (date) => {
  if (!date) return "—";
  const dt = new Date(date);
  if (isNaN(dt)) return date;
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatDateTime = (date) => {
  if (!date) return "—";
  const dt = new Date(date);
  if (isNaN(dt)) return date;
  return dt.toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
};

const n = (v) => Number(v || 0);
const fmt = (v, d = 2) => n(v).toFixed(d);
const fmtMoney = (v, cur = "USD") =>
  `${cur} ${n(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const getStockStatus = (balance, threshold = LOW_STOCK_THRESHOLD) => {
  if (balance <= 0) return { key: 'out',      label: 'Out of Stock', cls: 'rose' };
  if (balance < threshold) return { key: 'low', label: 'Low Stock', cls: 'amber' };
  if (balance < threshold * 4) return { key: 'ok',  label: 'Healthy',    cls: 'emerald' };
  return { key: 'high', label: 'Well Stocked', cls: 'blue' };
};

const statusBadge = (cls) => ({
  rose:    'bg-rose-50 text-rose-700 border-rose-200',
  amber:   'bg-amber-50 text-amber-700 border-amber-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  blue:    'bg-blue-50 text-blue-700 border-blue-200',
  slate:   'bg-slate-100 text-slate-600 border-slate-200',
}[cls] || 'bg-slate-100 text-slate-600 border-slate-200');

// ============================================================
// 4. DATA PROCESSING (Grouping / Ledger / Requisitions)
// ============================================================

/**
 * Build the STOCK LEDGER for each material.
 * Opening → + Receives → − Issues → running balance.
 */
const buildStockLedger = (statement, receives, issues, startDate) => {
  const materials = new Map();

  // Seed with statement
  statement.forEach((s) => {
    if (!s.MaterialName) return;
    if (!materials.has(s.MaterialName)) {
      materials.set(s.MaterialName, {
        name: s.MaterialName,
        code: s.MaterialCode || '—',
        unit: s.UnitName || 'KG',
        category: s.CategoryName || '—',
        subCategory: s.SubCategoryName || '—',
        mainMaterial: s.MainMaterialName || '—',
        opening: n(OPENING_BALANCES[s.MaterialName]),
        receives: [],
        issues: [],
        ledger: [],
        totalIn: 0,
        totalOut: 0,
        closing: 0,
        avgCost: 0,
        inValue: 0,
        outValue: 0,
      });
    }
  });

  // Add receive rows
  receives.forEach((r) => {
    const name = r.MaterialName;
    if (!name) return;
    if (!materials.has(name)) {
      materials.set(name, {
        name, code: r.MaterialCode || '—', unit: r.Unit || 'KG',
        category: r.CategoryName || '—', subCategory: r.SubCategoryName || '—',
        mainMaterial: r.MainMaterialName || '—',
        opening: n(OPENING_BALANCES[name]),
        receives: [], issues: [], ledger: [],
        totalIn: 0, totalOut: 0, closing: 0, avgCost: 0, inValue: 0, outValue: 0,
      });
    }
    const m = materials.get(name);
    const qty = n(r.ActualReceiveQTY);
    const price = n(r.ActualReceivePrice);
    m.receives.push({
      date: r.GRNDate,
      ref: r.GRNNo || '—',
      qty, price,
      value: qty * price,
      vendor: r.VendorName || '—',
      currency: r.Currency || 'USD',
      kind: 'receive',
    });
    m.totalIn += qty;
    m.inValue += qty * price;
  });

  // Add issue rows
  issues.forEach((i) => {
    const name = i.MaterialName;
    if (!name) return;
    if (!materials.has(name)) {
      materials.set(name, {
        name, code: i.MaterialCode || '—', unit: i.UnitName || 'KG',
        category: i.CategoryName || '—', subCategory: i.SubCategoryName || '—',
        mainMaterial: i.MainMaterialName || '—',
        opening: n(OPENING_BALANCES[name]),
        receives: [], issues: [], ledger: [],
        totalIn: 0, totalOut: 0, closing: 0, avgCost: 0, inValue: 0, outValue: 0,
      });
    }
    const m = materials.get(name);
    const qty = n(i.IssueQTY);
    const price = n(i.IssuePrice);
    m.issues.push({
      date: i.IssueDate,
      ref: i.IssueNo || '—',
      reqNo: i.RequisitionNo || '—',
      reqDate: i.RequisitionDate,
      qty, price,
      value: qty * price,
      issuedTo: i.IssuedBy || '—',
      jobCard: i.JobCardNo || '—',
      currency: i.Currency || 'USD',
      kind: 'issue',
    });
    m.totalOut += qty;
    m.outValue += qty * price;
  });

  // Build ledger per material
  const result = [];
  materials.forEach((m) => {
    // Timeline: opening → all receives → all issues
    let running = m.opening;
    const ledger = [];

    if (m.opening > 0) {
      ledger.push({
        date: startDate,
        kind: 'opening',
        ref: 'OPENING',
        inQty: m.opening,
        outQty: 0,
        balance: running,
        detail: 'Opening balance',
        currency: '—',
      });
    }

    const txs = [...m.receives, ...m.issues].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    txs.forEach((t) => {
      if (t.kind === 'receive') {
        running += t.qty;
        ledger.push({
          date: t.date, kind: 'receive', ref: t.ref,
          inQty: t.qty, outQty: 0, balance: running,
          detail: t.vendor, currency: t.currency,
          value: t.value, price: t.price,
        });
      } else {
        running -= t.qty;
        ledger.push({
          date: t.date, kind: 'issue', ref: t.ref,
          inQty: 0, outQty: t.qty, balance: running,
          detail: t.issuedTo, currency: t.currency,
          value: t.value, price: t.price,
          reqNo: t.reqNo, jobCard: t.jobCard,
        });
      }
    });

    m.ledger = ledger;
    m.closing = running;
    m.avgCost = m.totalIn > 0 ? m.inValue / m.totalIn : 0;
    m.stockValue = m.closing * m.avgCost;

    result.push(m);
  });

  return result;
};

/**
 * Group ISSUES by RequisitionNo.
 * FIX: RequiredQTY is the SAME on every row — take it ONCE.
 *      IssueQTY is different per row — SUM it.
 */
const groupIssuesByRequisition = (issues) => {
  const map = new Map();

  issues.forEach((row) => {
    const key = row.RequisitionNo || `ORPHAN-${row.IssueNo}`;

    if (!map.has(key)) {
      map.set(key, {
        requisitionNo: row.RequisitionNo || '—',
        requisitionDate: row.RequisitionDate,
        materialName: row.MaterialName,
        materialCode: row.MaterialCode || '—',
        category: row.CategoryName || '—',
        subCategory: row.SubCategoryName || '—',
        unit: row.UnitName || 'KG',
        requiredQTY: n(row.RequiredQTY), // ✅ take ONCE
        raisedBy: row.RequistionRaiseBy || '—',
        department: row.Department || '—',
        costCenter: row.CostCenterName || '—',
        company: row.CompanyName || '—',
        currencies: new Set(),
        issues: [],
        totalIssued: 0,
        totalValue: 0,
      });
    }

    const g = map.get(key);
    g.issues.push({
      issueNo: row.IssueNo || '—',
      issueDate: row.IssueDate,
      issueQTY: n(row.IssueQTY),
      issuePrice: n(row.IssuePrice),
      issueValue: n(row.IssueValue),
      issuedBy: row.IssuedBy || '—',
      jobCardNo: row.JobCardNo || '—',
      grnNo: row.GRNNo || '—',
      currency: row.Currency || 'USD',
      pendingQTY: n(row.PendingQTY),
    });
    g.totalIssued += n(row.IssueQTY);
    g.totalValue += n(row.IssueValue);
    g.currencies.add(row.Currency || 'USD');
  });

  return Array.from(map.values()).map((g) => {
    const pending = Math.max(0, g.requiredQTY - g.totalIssued);
    const pct = g.requiredQTY > 0
      ? Math.min(100, (g.totalIssued / g.requiredQTY) * 100)
      : 0;

    let status = 'Pending';
    if (g.totalIssued >= g.requiredQTY && g.requiredQTY > 0) status = 'Completed';
    else if (g.totalIssued > 0) status = 'Partial';

    return {
      ...g,
      pendingQTY: pending,
      fulfillmentPct: pct,
      status,
      currency: g.currencies.size === 1 ? [...g.currencies][0] : 'MIXED',
      issueCount: g.issues.length,
      // sort issues chronologically
      issues: [...g.issues].sort((a, b) => new Date(a.issueDate) - new Date(b.issueDate)),
    };
  });
};

// ============================================================
// 5. SUB-COMPONENTS
// ============================================================

const TabBar = ({ active, setActive }) => (
  <div className="border-b border-slate-200 bg-white/90 backdrop-blur-md rounded-t-2xl overflow-x-auto scrollbar-thin">
    <div className="flex px-2 sm:px-4 gap-1 min-w-max">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`flex items-center gap-2 px-3 sm:px-4 py-3 border-b-2 transition-all whitespace-nowrap text-sm ${
              isActive
                ? `border-${tab.color}-500 text-${tab.color}-600 font-semibold`
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <Icon size={16} />
            <span>{tab.label}</span>
            {isActive && (
              <span className={`w-1.5 h-1.5 rounded-full bg-${tab.color}-500`} />
            )}
          </button>
        );
      })}
    </div>
  </div>
);

const Loader = ({ msg = 'Loading…' }) => (
  <div className="flex flex-col items-center justify-center h-96 bg-white rounded-2xl border border-slate-100">
    <HashLoader color="#3b82f6" size={50} />
    <p className="text-slate-500 mt-4 font-medium">{msg}</p>
  </div>
);

const Empty = ({ onReset }) => (
  <tr>
    <td colSpan="20" className="px-4 py-16 text-center">
      <div className="flex flex-col items-center gap-3">
        <FiAlertCircle size={44} className="text-slate-300" />
        <p className="text-slate-600 font-medium">No data found</p>
        <button
          onClick={onReset}
          className="mt-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium"
        >
          Clear filters
        </button>
      </div>
    </td>
  </tr>
);

const KpiCard = ({ label, value, sub, icon: Icon, color = 'blue' }) => (
  <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold truncate">
          {label}
        </p>
        <p className={`text-2xl sm:text-3xl font-bold mt-1 text-${color}-600 truncate`}>
          {value}
        </p>
        {sub && <p className="text-xs text-slate-400 mt-1 truncate">{sub}</p>}
      </div>
      {Icon && (
        <div className={`p-2.5 rounded-xl bg-${color}-50 text-${color}-500 shrink-0`}>
          <Icon size={20} />
        </div>
      )}
    </div>
  </div>
);

// ============================================================
// 6. MAIN COMPONENT
// ============================================================

export default function Inventory() {
  const { cndata, apiKey } = useContext(GetDataContext);
  const tableRef = useRef(null);

  // UI
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [expandedMaterials, setExpandedMaterials] = useState({});
  const [expandedReqs, setExpandedReqs] = useState({});

  // Data
  const [receives, setReceives] = useState([]);
  const [issues, setIssues] = useState([]);
  const [statement, setStatement] = useState([]);

  // Derived
  const [materials, setMaterials] = useState([]);           // ledger-based
  const [requisitions, setRequisitions] = useState([]);     // grouped issues

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    subCategory: 'all',
    material: 'all',
    company: 'all',
    status: 'all',
    onlyAlerts: false,
    showAll: false,
    startDate: null,
    endDate: null,
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sort, setSort] = useState({ key: 'name', dir: 'asc' });

  // ==============================
  // FETCH
  // ==============================
  const fetchData = useCallback(async () => {
    if (!cndata?.startDate || !cndata?.endDate) {
      toast.error("Please select start and end dates");
      return;
    }
    setLoading(true);
    setPage(1);

    const sd = cndata.startDate.toISOString().split("T")[0];
    const ed = cndata.endDate.toISOString().split("T")[0];

    try {
      const [rRes, iRes, sRes] = await Promise.all([
        axios.get(`${API_BASE}/SCM_GetMaterialReceiveDetail?CompanyID=1&ParentCategoryID=6&CategoryID=0&SubCategoryID=0&MainMaterialID=0&StartDate=${sd}&EndDate=${ed}&CommandID=0`, { headers: { Authorization: `${apiKey}` } }),
        axios.get(`${API_BASE}/SCM_GET_MaterialIssueDetail?CompanyID=1&ParentCategoryID=6&CategoryID=0&SubCategoryID=0&MainMaterialID=0&StartDate=${sd}&EndDate=${ed}&CommandID=2`, { headers: { Authorization: `${apiKey}` } }),
        axios.get(`${API_BASE}/BI_SCM_GETInventoryStatement?CompanyID=1&ParentCategoryID=6&CategoryID=0&SubCategoryID=0&MaterialID=0&StartDate=${sd}&EndDate=${ed}&CommandID=2&EmpID=0`, { headers: { Authorization: `${apiKey}` } }),
      ]);

      const rData = rRes.data || [];
      const iData = iRes.data || [];
      const sData = sRes.data || [];

      setReceives(rData);
      setIssues(iData);
      setStatement(sData);

      // Build ledger
      const ledger = buildStockLedger(sData, rData, iData, cndata.startDate);
      setMaterials(ledger);

      // Group issues → requisitions
      const reqs = groupIssuesByRequisition(iData);
      setRequisitions(reqs);

      setFilters((f) => ({
        ...f,
        startDate: cndata.startDate,
        endDate: cndata.endDate,
      }));

      toast.success(`✓ Loaded ${ledger.length} materials · ${reqs.length} requisitions`);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [cndata, apiKey]);

  // Filter options
  const filterOptions = useMemo(() => {
    const cats = _.uniq(materials.map((m) => m.category).filter((c) => c && c !== '—'));
    const subs = _.uniq(materials.map((m) => m.subCategory).filter((s) => s && s !== '—'));
    const mats = _.uniq(materials.map((m) => m.name).filter(Boolean));
    const comps = _.uniq([
      ...receives.map((r) => r.CompanyName),
      ...issues.map((i) => i.CompanyName),
    ].filter(Boolean));
    return { cats, subs, mats, comps };
  }, [materials, receives, issues]);

  // ==============================
  // APPLY FILTERS + SORT
  // ==============================
  const filteredMaterials = useMemo(() => {
    let data = [...materials];

    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      data = data.filter((m) =>
        m.name.toLowerCase().includes(q) ||
        m.code.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) ||
        m.subCategory.toLowerCase().includes(q)
      );
    }
    if (filters.category !== 'all') data = data.filter((m) => m.category === filters.category);
    if (filters.subCategory !== 'all') data = data.filter((m) => m.subCategory === filters.subCategory);
    if (filters.material !== 'all') data = data.filter((m) => m.name === filters.material);

    if (filters.onlyAlerts) {
      data = data.filter((m) => m.closing <= 0 || m.closing < LOW_STOCK_THRESHOLD);
    }
    if (filters.status === 'out') data = data.filter((m) => m.closing <= 0);
    if (filters.status === 'low') data = data.filter((m) => m.closing > 0 && m.closing < LOW_STOCK_THRESHOLD);
    if (filters.status === 'ok') data = data.filter((m) => m.closing >= LOW_STOCK_THRESHOLD);

    data = _.orderBy(data, [sort.key], [sort.dir]);
    return data;
  }, [materials, filters, sort]);

  const filteredRequisitions = useMemo(() => {
    let data = [...requisitions];
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      data = data.filter((r) =>
        r.requisitionNo.toLowerCase().includes(q) ||
        r.materialName.toLowerCase().includes(q) ||
        r.raisedBy.toLowerCase().includes(q)
      );
    }
    if (filters.category !== 'all') data = data.filter((r) => r.category === filters.category);
    if (filters.status !== 'all') data = data.filter((r) => r.status.toLowerCase() === filters.status);
    if (filters.onlyAlerts) data = data.filter((r) => r.status !== 'Completed');
    return _.orderBy(data, ['requisitionDate'], ['desc']);
  }, [requisitions, filters]);

  // ==============================
  // STATS
  // ==============================
  const stats = useMemo(() => {
    const total = materials.length;
    const out = materials.filter((m) => m.closing <= 0).length;
    const low = materials.filter((m) => m.closing > 0 && m.closing < LOW_STOCK_THRESHOLD).length;
    const healthy = total - out - low;

    const totalIn = materials.reduce((s, m) => s + m.totalIn, 0);
    const totalOut = materials.reduce((s, m) => s + m.totalOut, 0);
    const closing = materials.reduce((s, m) => s + m.closing, 0);
    const inValue = materials.reduce((s, m) => s + m.inValue, 0);
    const stockValue = materials.reduce((s, m) => s + (m.stockValue || 0), 0);

    const pendingReq = requisitions.filter((r) => r.status !== 'Completed').length;
    const partialReq = requisitions.filter((r) => r.status === 'Partial').length;

    return {
      total, out, low, healthy,
      totalIn, totalOut, closing,
      inValue, stockValue,
      pendingReq, partialReq,
      totalReqs: requisitions.length,
    };
  }, [materials, requisitions]);

  // ==============================
  // PAGINATION
  // ==============================
  const currentData =
    activeTab === 'requisitions' || activeTab === 'issues'
      ? filteredRequisitions
      : filteredMaterials;

  const totalPages = Math.max(1, Math.ceil(currentData.length / pageSize));
  const paginated = filters.showAll
    ? currentData
    : currentData.slice((page - 1) * pageSize, page * pageSize);

  const gotoPage = (p) => {
    setPage(Math.min(Math.max(1, p), totalPages));
    tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ==============================
  // HANDLERS
  // ==============================
  const resetFilters = () => {
    setFilters((f) => ({
      ...f, search: '', category: 'all', subCategory: 'all',
      material: 'all', company: 'all', status: 'all', onlyAlerts: false,
    }));
    setPage(1);
    toast.info("Filters reset");
  };

  const toggleSort = (key) => {
    setSort((s) => ({
      key,
      dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc',
    }));
  };

  const SortIcon = ({ col }) => {
    if (sort.key !== col) return <FaSort className="text-slate-300" size={11} />;
    return sort.dir === 'asc'
      ? <FaSortUp className="text-blue-500" size={11} />
      : <FaSortDown className="text-blue-500" size={11} />;
  };

  // ==============================
  // RENDER: SUMMARY TABLE
  // ==============================
  const renderSummaryTable = () => (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px]">
          <thead className="bg-slate-50/80 border-b border-slate-200">
            <tr>
              <th className="px-3 py-3 text-left text-[11px] uppercase tracking-wider font-semibold text-slate-500 w-10">#</th>
              <th className="px-3 py-3 text-left text-[11px] uppercase tracking-wider font-semibold text-slate-500">Material</th>
              <th className="px-3 py-3 text-left text-[11px] uppercase tracking-wider font-semibold text-slate-500">Category</th>
              <th className="px-3 py-3 text-right text-[11px] uppercase tracking-wider font-semibold text-slate-500 cursor-pointer" onClick={() => toggleSort('opening')}>
                <span className="inline-flex items-center gap-1">Opening <SortIcon col="opening" /></span>
              </th>
              <th className="px-3 py-3 text-right text-[11px] uppercase tracking-wider font-semibold text-slate-500 cursor-pointer" onClick={() => toggleSort('totalIn')}>
                <span className="inline-flex items-center gap-1">Stock In <SortIcon col="totalIn" /></span>
              </th>
              <th className="px-3 py-3 text-right text-[11px] uppercase tracking-wider font-semibold text-slate-500 cursor-pointer" onClick={() => toggleSort('totalOut')}>
                <span className="inline-flex items-center gap-1">Stock Out <SortIcon col="totalOut" /></span>
              </th>
              <th className="px-3 py-3 text-right text-[11px] uppercase tracking-wider font-semibold text-slate-500 cursor-pointer" onClick={() => toggleSort('closing')}>
                <span className="inline-flex items-center gap-1">Closing <SortIcon col="closing" /></span>
              </th>
              <th className="px-3 py-3 text-center text-[11px] uppercase tracking-wider font-semibold text-slate-500">Unit</th>
              <th className="px-3 py-3 text-right text-[11px] uppercase tracking-wider font-semibold text-slate-500">Avg Cost</th>
              <th className="px-3 py-3 text-right text-[11px] uppercase tracking-wider font-semibold text-slate-500">Stock Value</th>
              <th className="px-3 py-3 text-center text-[11px] uppercase tracking-wider font-semibold text-slate-500">Status</th>
              <th className="px-3 py-3 text-center text-[11px] uppercase tracking-wider font-semibold text-slate-500">Ledger</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginated.length === 0 && <Empty onReset={resetFilters} />}
            {paginated.map((m, idx) => {
              const status = getStockStatus(m.closing);
              const rowNum = (page - 1) * pageSize + idx + 1;
              return (
                <tr key={m.name} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-3 py-3 text-xs text-slate-400">{rowNum}</td>
                  <td className="px-3 py-3">
                    <div className="font-medium text-slate-800 text-sm">{m.name}</div>
                    <div className="text-[11px] text-slate-400">{m.code}</div>
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-600">
                    <div>{m.category}</div>
                    <div className="text-[10px] text-slate-400">{m.subCategory}</div>
                  </td>
                  <td className="px-3 py-3 text-right text-sm text-slate-500">{fmt(m.opening)}</td>
                  <td className="px-3 py-3 text-right text-sm font-semibold text-emerald-600">
                    +{fmt(m.totalIn)}
                  </td>
                  <td className="px-3 py-3 text-right text-sm font-semibold text-rose-500">
                    −{fmt(m.totalOut)}
                  </td>
                  <td className={`px-3 py-3 text-right text-sm font-bold ${
                    m.closing <= 0 ? 'text-rose-600'
                    : m.closing < LOW_STOCK_THRESHOLD ? 'text-amber-600'
                    : 'text-slate-800'
                  }`}>
                    {fmt(m.closing)}
                  </td>
                  <td className="px-3 py-3 text-center text-xs text-slate-500">{m.unit}</td>
                  <td className="px-3 py-3 text-right text-xs text-slate-600">{fmtMoney(m.avgCost)}</td>
                  <td className="px-3 py-3 text-right text-xs font-medium text-slate-700">
                    {fmtMoney(m.stockValue)}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusBadge(status.cls)}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <button
                      onClick={() => {
                        setActiveTab('ledger');
                        setExpandedMaterials({ [m.name]: true });
                      }}
                      className="p-1.5 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors"
                      title="Open ledger"
                    >
                      <FiBookOpen size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination
        page={page} totalPages={totalPages} pageSize={pageSize}
        total={currentData.length}
        onPage={gotoPage} onSize={setPageSize}
        showAll={filters.showAll}
      />
    </div>
  );

  // ==============================
  // RENDER: LEDGER VIEW
  // ==============================
  const renderLedger = () => {
    const openMaterial = Object.keys(expandedMaterials).find((k) => expandedMaterials[k]);
    const material = filteredMaterials.find((m) => m.name === openMaterial);

    if (!material) {
      return (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <FiBookOpen size={48} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-600 font-medium">Select a material to view its ledger</p>
          <p className="text-slate-400 text-sm mt-1">Click the ledger icon on any material in Stock Summary</p>
        </div>
      );
    }

    const status = getStockStatus(material.closing);

    return (
      <div className="space-y-5">
        {/* Material header */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">Stock Ledger</p>
              <h2 className="text-2xl font-bold mt-1">{material.name}</h2>
              <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-300">
                <span>Code: <strong>{material.code}</strong></span>
                <span>Category: <strong>{material.category}</strong></span>
                <span>Sub: <strong>{material.subCategory}</strong></span>
                <span>Unit: <strong>{material.unit}</strong></span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 uppercase tracking-wider">Closing Balance</p>
              <p className={`text-4xl font-bold mt-1 ${
                material.closing <= 0 ? 'text-rose-400'
                : material.closing < LOW_STOCK_THRESHOLD ? 'text-amber-400'
                : 'text-emerald-400'
              }`}>
                {fmt(material.closing)}
              </p>
              <p className="text-xs text-slate-400 mt-1">≈ {fmtMoney(material.stockValue)}</p>
            </div>
          </div>

          {/* Mini stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            {[
              { l: 'Opening', v: fmt(material.opening) },
              { l: 'Stock In', v: `+${fmt(material.totalIn)}`, c: 'text-emerald-400' },
              { l: 'Stock Out', v: `−${fmt(material.totalOut)}`, c: 'text-rose-400' },
              { l: 'Avg Cost', v: fmtMoney(material.avgCost) },
            ].map((k) => (
              <div key={k.l} className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
                <p className="text-[10px] uppercase tracking-wider text-slate-400">{k.l}</p>
                <p className={`text-lg font-bold mt-0.5 ${k.c || 'text-white'}`}>{k.v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Ledger table */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-800">Transaction Ledger</h3>
              <p className="text-xs text-slate-500">Chronological · running balance</p>
            </div>
            <button
              onClick={() => setExpandedMaterials({})}
              className="text-xs text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-50"
            >
              ← Back to summary
            </button>
          </div>
          <div className="overflow-x-auto max-h-[70vh]">
            <table className="w-full min-w-[800px]">
              <thead className="bg-slate-50 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2.5 text-left text-[11px] uppercase tracking-wider font-semibold text-slate-500 w-10">#</th>
                  <th className="px-3 py-2.5 text-left text-[11px] uppercase tracking-wider font-semibold text-slate-500">Date</th>
                  <th className="px-3 py-2.5 text-left text-[11px] uppercase tracking-wider font-semibold text-slate-500">Type</th>
                  <th className="px-3 py-2.5 text-left text-[11px] uppercase tracking-wider font-semibold text-slate-500">Reference</th>
                  <th className="px-3 py-2.5 text-right text-[11px] uppercase tracking-wider font-semibold text-slate-500">In</th>
                  <th className="px-3 py-2.5 text-right text-[11px] uppercase tracking-wider font-semibold text-slate-500">Out</th>
                  <th className="px-3 py-2.5 text-right text-[11px] uppercase tracking-wider font-semibold text-slate-500">Balance</th>
                  <th className="px-3 py-2.5 text-left text-[11px] uppercase tracking-wider font-semibold text-slate-500">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {material.ledger.map((tx, i) => {
                  const isNeg = tx.balance < 0;
                  const typeCls =
                    tx.kind === 'opening' ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : tx.kind === 'receive' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200';
                  const typeLabel =
                    tx.kind === 'opening' ? 'Opening'
                    : tx.kind === 'receive' ? 'Receive'
                    : 'Issue';
                  return (
                    <tr key={i} className={isNeg ? 'bg-rose-50/50' : 'hover:bg-slate-50/60'}>
                      <td className="px-3 py-2.5 text-xs text-slate-400">{i + 1}</td>
                      <td className="px-3 py-2.5 text-xs text-slate-600 whitespace-nowrap">{formatDate(tx.date)}</td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${typeCls}`}>
                          {typeLabel}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-xs font-medium text-slate-700">{tx.ref}</td>
                      <td className="px-3 py-2.5 text-right text-xs font-semibold text-emerald-600">
                        {tx.inQty > 0 ? `+${fmt(tx.inQty)}` : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-right text-xs font-semibold text-rose-500">
                        {tx.outQty > 0 ? `−${fmt(tx.outQty)}` : '—'}
                      </td>
                      <td className={`px-3 py-2.5 text-right text-xs font-bold ${
                        isNeg ? 'text-rose-600'
                        : tx.balance < LOW_STOCK_THRESHOLD ? 'text-amber-600'
                        : 'text-slate-800'
                      }`}>
                        {fmt(tx.balance)}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-slate-500 truncate max-w-[220px]" title={tx.detail}>
                        {tx.detail}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // ==============================
  // RENDER: RECEIVES VIEW
  // ==============================
  const renderReceives = () => {
    const rows = [...receives].sort((a, b) => new Date(b.GRNDate) - new Date(a.GRNDate));
    return (
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">Material Receives</h3>
          <p className="text-xs text-slate-500">{rows.length} GRN records · newest first</p>
        </div>
        <div className="overflow-x-auto max-h-[75vh]">
          <table className="w-full min-w-[1000px]">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr>
                {['#', 'GRN No', 'Date', 'Material', 'Qty', 'Unit', 'Rate', 'Value', 'Vendor'].map((h, i) => (
                  <th key={h} className={`px-3 py-2.5 text-[11px] uppercase tracking-wider font-semibold text-slate-500 ${i >= 4 ? 'text-right' : 'text-left'} ${h === '#' ? 'w-10' : ''}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50/60">
                  <td className="px-3 py-2.5 text-xs text-slate-400">{i + 1}</td>
                  <td className="px-3 py-2.5 text-xs font-medium text-cyan-700">{r.GRNNo}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-600 whitespace-nowrap">{formatDate(r.GRNDate)}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-700">
                    <div className="font-medium">{r.MaterialName}</div>
                    <div className="text-[10px] text-slate-400">{r.MaterialCode}</div>
                  </td>
                  <td className="px-3 py-2.5 text-right text-xs font-semibold text-emerald-600">
                    {fmt(r.ActualReceiveQTY)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-xs text-slate-500">{r.Unit || 'KG'}</td>
                  <td className="px-3 py-2.5 text-right text-xs text-slate-600">
                    {fmt(r.ActualReceivePrice)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-xs font-medium text-slate-700">
                    {fmtMoney(n(r.ActualReceiveQTY) * n(r.ActualReceivePrice), r.Currency || 'USD')}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-slate-600">{r.VendorName || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ==============================
  // RENDER: ISSUES (REQUISITION-GROUPED)
  // ==============================
  const renderIssues = () => (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-800">Issues — Grouped by Requisition</h3>
          <p className="text-xs text-slate-500">
            {paginated.length} requisitions · click a row to expand issue transactions
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            {filteredRequisitions.filter(r => r.status === 'Completed').length} Completed
          </span>
          <span className="px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            {filteredRequisitions.filter(r => r.status === 'Partial').length} Partial
          </span>
          <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            {filteredRequisitions.filter(r => r.status === 'Pending').length} Pending
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px]">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="w-10 px-3 py-3"></th>
              <th className="px-3 py-3 text-left text-[11px] uppercase tracking-wider font-semibold text-slate-500 w-10">#</th>
              <th className="px-3 py-3 text-left text-[11px] uppercase tracking-wider font-semibold text-slate-500">Material</th>
              <th className="px-3 py-3 text-left text-[11px] uppercase tracking-wider font-semibold text-slate-500">Requisition</th>
              <th className="px-3 py-3 text-right text-[11px] uppercase tracking-wider font-semibold text-slate-500">Required</th>
              <th className="px-3 py-3 text-right text-[11px] uppercase tracking-wider font-semibold text-slate-500">Issued</th>
              <th className="px-3 py-3 text-right text-[11px] uppercase tracking-wider font-semibold text-slate-500">Pending</th>
              <th className="px-3 py-3 text-left text-[11px] uppercase tracking-wider font-semibold text-slate-500">Raised By</th>
              <th className="px-3 py-3 text-center text-[11px] uppercase tracking-wider font-semibold text-slate-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginated.length === 0 && <Empty onReset={resetFilters} />}
            {paginated.map((r, idx) => {
              const isExp = expandedReqs[r.requisitionNo];
              const rowNum = (page - 1) * pageSize + idx + 1;
              const pct = r.fulfillmentPct;
              const statusCls =
                r.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : r.status === 'Partial' ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-slate-100 text-slate-600 border-slate-200';

              return (
                <React.Fragment key={r.requisitionNo}>
                  <tr
                    className="hover:bg-slate-50/70 cursor-pointer"
                    onClick={() => setExpandedReqs((p) => ({ ...p, [r.requisitionNo]: !p[r.requisitionNo] }))}
                  >
                    <td className="px-3 py-3 text-center">
                      {r.issueCount > 1 && (
                        <FiChevronRight
                          size={14}
                          className={`transition-transform text-slate-400 ${isExp ? 'rotate-90 text-blue-500' : ''}`}
                        />
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-400">{rowNum}</td>
                    <td className="px-3 py-3">
                      <div className="font-medium text-slate-800 text-sm">{r.materialName}</div>
                      <div className="text-[10px] text-slate-400">{r.materialCode}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-xs font-medium text-slate-700">{r.requisitionNo}</div>
                      <div className="text-[10px] text-slate-400">{formatDate(r.requisitionDate)}</div>
                    </td>
                    <td className="px-3 py-3 text-right text-sm font-semibold text-slate-700">
                      {fmt(r.requiredQTY)}
                      <span className="text-[10px] text-slate-400 ml-1">{r.unit}</span>
                    </td>
                    <td className="px-3 py-3 text-right text-sm font-semibold text-emerald-600">
                      {fmt(r.totalIssued)}
                    </td>
                    <td className="px-3 py-3 text-right text-sm font-semibold">
                      <span className={r.pendingQTY > 0 ? 'text-amber-600' : 'text-slate-400'}>
                        {fmt(r.pendingQTY)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-600 truncate max-w-[140px]">{r.raisedBy}</td>
                    <td className="px-3 py-3 text-center">
                      <div className="inline-flex flex-col items-center gap-1">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusCls}`}>
                          {r.status}
                        </span>
                        {r.issueCount > 1 && (
                          <span className="text-[9px] text-slate-400">{r.issueCount} issues</span>
                        )}
                      </div>
                    </td>
                  </tr>

                  {isExp && (
                    <tr className="bg-slate-50/40">
                      <td colSpan="9" className="px-6 pb-4 pt-1">
                        {/* Progress bar */}
                        <div className="mb-3">
                          <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                            <span>Fulfillment</span>
                            <span className="font-semibold">{pct.toFixed(1)}%</span>
                          </div>
                          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                r.status === 'Completed' ? 'bg-emerald-500'
                                : r.status === 'Partial' ? 'bg-amber-500'
                                : 'bg-slate-300'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>

                        {/* Issue sub-table */}
                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                          <table className="w-full text-xs">
                            <thead className="bg-slate-50 border-b">
                              <tr>
                                <th className="px-3 py-2 text-left text-[10px] uppercase text-slate-500 font-semibold">Issue No</th>
                                <th className="px-3 py-2 text-left text-[10px] uppercase text-slate-500 font-semibold">Date</th>
                                <th className="px-3 py-2 text-right text-[10px] uppercase text-slate-500 font-semibold">Qty</th>
                                <th className="px-3 py-2 text-right text-[10px] uppercase text-slate-500 font-semibold">Rate</th>
                                <th className="px-3 py-2 text-left text-[10px] uppercase text-slate-500 font-semibold">Issued To</th>
                                <th className="px-3 py-2 text-left text-[10px] uppercase text-slate-500 font-semibold">Job Card</th>
                                <th className="px-3 py-2 text-right text-[10px] uppercase text-slate-500 font-semibold">Value</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {r.issues.map((iss, i) => (
                                <tr key={i} className="hover:bg-blue-50/30">
                                  <td className="px-3 py-2 font-medium text-blue-700">{iss.issueNo}</td>
                                  <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{formatDate(iss.issueDate)}</td>
                                  <td className="px-3 py-2 text-right font-semibold text-slate-700">{fmt(iss.issueQTY)}</td>
                                  <td className="px-3 py-2 text-right text-slate-600">{fmt(iss.issuePrice)}</td>
                                  <td className="px-3 py-2 text-slate-600">{iss.issuedBy}</td>
                                  <td className="px-3 py-2 text-slate-500">{iss.jobCardNo}</td>
                                  <td className="px-3 py-2 text-right font-medium text-slate-700">
                                    {fmtMoney(iss.issueValue, iss.currency)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="bg-slate-50/80 border-t">
                              <tr className="font-semibold text-slate-700">
                                <td colSpan="2" className="px-3 py-2 text-right text-[11px] uppercase">Total</td>
                                <td className="px-3 py-2 text-right text-emerald-700">{fmt(r.totalIssued)}</td>
                                <td colSpan="3"></td>
                                <td className="px-3 py-2 text-right text-slate-800">{fmtMoney(r.totalValue, r.currency)}</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>

                        {/* Metadata row */}
                        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-500">
                          <div><span className="text-slate-400">Department:</span> {r.department}</div>
                          <div><span className="text-slate-400">Cost Center:</span> {r.costCenter}</div>
                          <div><span className="text-slate-400">Company:</span> {r.company}</div>
                          <div><span className="text-slate-400">Currency:</span> {r.currency}</div>
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
      <Pagination
        page={page} totalPages={totalPages} pageSize={pageSize}
        total={currentData.length}
        onPage={gotoPage} onSize={setPageSize}
        showAll={filters.showAll}
      />
    </div>
  );

  // ==============================
  // RENDER: DASHBOARD
  // ==============================
  const renderDashboard = () => (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="Materials" value={stats.total} icon={FiPackage} color="blue" />
        <KpiCard label="Total Stock In" value={fmt(stats.totalIn)} sub="units" icon={FiTrendingUp} color="emerald" />
        <KpiCard label="Total Stock Out" value={fmt(stats.totalOut)} sub="units" icon={FiTrendingDown} color="rose" />
        <KpiCard label="Closing Balance" value={fmt(stats.closing)} sub="units" icon={FiBox} color="indigo" />
        <KpiCard label="Stock Value" value={fmtMoney(stats.stockValue)} icon={FiDollarSign} color="cyan" />
        <KpiCard label="Pending Reqs" value={stats.pendingReq} sub={`of ${stats.totalReqs}`} icon={FiClipboard} color="amber" />
      </div>

      {/* Health strip */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Health ring */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Inventory Health</h3>
          {(() => {
            const total = stats.total || 1;
            const pct = (stats.healthy / total) * 100;
            const circ = 2 * Math.PI * 42;
            const dash = (pct / 100) * circ;
            return (
              <div className="flex items-center gap-5">
                <svg width="110" height="110" viewBox="0 0 110 110" className="-rotate-90">
                  <circle cx="55" cy="55" r="42" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                  <circle cx="55" cy="55" r="42" fill="none" stroke="#10b981" strokeWidth="10"
                    strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
                </svg>
                <div>
                  <p className="text-3xl font-bold text-emerald-600">{pct.toFixed(0)}%</p>
                  <p className="text-xs text-slate-500">Healthy stock</p>
                  <div className="mt-3 space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-slate-600">{stats.healthy} Healthy</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-slate-600">{stats.low} Low</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      <span className="text-slate-600">{stats.out} Out</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Alerts */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <FiAlertCircle className="text-rose-500" size={16} />
            Critical Stock Alerts
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {materials
              .filter((m) => m.closing <= 0 || m.closing < LOW_STOCK_THRESHOLD)
              .sort((a, b) => a.closing - b.closing)
              .slice(0, 8)
              .map((m) => (
                <div key={m.name} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{m.name}</p>
                    <p className="text-[10px] text-slate-400">{m.category} · {m.subCategory}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${
                    m.closing <= 0 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {fmt(m.closing)} {m.unit}
                  </span>
                </div>
              ))}
            {materials.filter((m) => m.closing <= 0 || m.closing < LOW_STOCK_THRESHOLD).length === 0 && (
              <p className="text-sm text-slate-400 text-center py-8">All materials are healthy ✓</p>
            )}
          </div>
        </div>
      </div>

      {/* Top movers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <FiTrendingDown className="text-rose-500" size={16} />
            Top Consumers (by Issue Qty)
          </h3>
          <div className="space-y-2">
            {[...materials].sort((a, b) => b.totalOut - a.totalOut).slice(0, 6).map((m, i) => (
              <div key={m.name} className="flex items-center gap-3">
                <span className="w-6 text-xs text-slate-400 font-medium">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{m.name}</p>
                  <div className="h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full bg-rose-400 rounded-full"
                      style={{ width: `${(m.totalOut / (materials[0]?.totalOut || 1)) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs font-semibold text-rose-600 shrink-0">{fmt(m.totalOut)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <FiTrendingUp className="text-emerald-500" size={16} />
            Top Inflows (by Receive Qty)
          </h3>
          <div className="space-y-2">
            {[...materials].sort((a, b) => b.totalIn - a.totalIn).slice(0, 6).map((m, i) => (
              <div key={m.name} className="flex items-center gap-3">
                <span className="w-6 text-xs text-slate-400 font-medium">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{m.name}</p>
                  <div className="h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full"
                      style={{ width: `${(m.totalIn / (materials[0]?.totalIn || 1)) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs font-semibold text-emerald-600 shrink-0">{fmt(m.totalIn)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ==============================
  // RENDER: FULL REPORT (compact summary + export CTA)
  // ==============================
  const renderFullReport = () => (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-6 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-indigo-200">Complete Snapshot</p>
            <h2 className="text-2xl font-bold mt-1">Full Inventory Report</h2>
            <p className="text-sm text-indigo-200 mt-1">
              {stats.total} materials · {receives.length} receives · {issues.length} issues · {stats.totalReqs} requisitions
            </p>
          </div>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-indigo-700 font-semibold hover:bg-indigo-50 transition-colors shadow-lg"
          >
            <FiDownload size={16} />
            Export Excel (6 sheets)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Financial Summary</h3>
          <div className="space-y-3">
            {[
              { l: 'Total Receive Value', v: fmtMoney(stats.inValue), c: 'text-emerald-600' },
              { l: 'Total Stock Value (closing)', v: fmtMoney(stats.stockValue), c: 'text-blue-600' },
              { l: 'Avg Unit Cost', v: fmtMoney(stats.totalIn > 0 ? stats.inValue / stats.totalIn : 0), c: 'text-slate-700' },
              { l: 'Total Materials', v: stats.total, c: 'text-slate-700' },
              { l: 'Categories', v: filterOptions.cats.length, c: 'text-slate-700' },
            ].map((r) => (
              <div key={r.l} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <span className="text-sm text-slate-500">{r.l}</span>
                <span className={`text-sm font-bold ${r.c}`}>{r.v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Requisition Breakdown</h3>
          <div className="space-y-3">
            {[
              { l: 'Completed', v: filteredRequisitions.filter(r => r.status === 'Completed').length, c: 'text-emerald-600' },
              { l: 'Partial', v: filteredRequisitions.filter(r => r.status === 'Partial').length, c: 'text-amber-600' },
              { l: 'Pending', v: filteredRequisitions.filter(r => r.status === 'Pending').length, c: 'text-slate-600' },
            ].map((r) => (
              <div key={r.l} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <span className="text-sm text-slate-500">{r.l}</span>
                <span className={`text-sm font-bold ${r.c}`}>{r.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ==============================
  // EXCEL EXPORT
  // ==============================
  const exportToExcel = useCallback(() => {
    try {
      toast.info("📊 Generating report…", { autoClose: false });

      const STYLES = {
        title: { font: { bold: true, sz: 20, color: { rgb: "1A3A5C" } }, alignment: { horizontal: "center", vertical: "center" }, fill: { fgColor: { rgb: "E8EDF5" } } },
        subtitle: { font: { sz: 11, color: { rgb: "4A5568" } }, alignment: { horizontal: "center", vertical: "center" } },
        section: { font: { bold: true, sz: 14, color: { rgb: "1A3A5C" } }, fill: { fgColor: { rgb: "F0F4F8" } }, alignment: { horizontal: "left", vertical: "center" } },
        headerBlue:    { font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "1A56DB" } }, alignment: { horizontal: "center", vertical: "center", wrapText: true }, border: { top: { style: "medium", color: { rgb: "153E7C" } }, bottom: { style: "medium", color: { rgb: "153E7C" } }, left: { style: "medium", color: { rgb: "153E7C" } }, right: { style: "medium", color: { rgb: "153E7C" } } } },
        headerGreen:   { font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "059669" } }, alignment: { horizontal: "center", vertical: "center", wrapText: true }, border: { top: { style: "medium", color: { rgb: "047857" } }, bottom: { style: "medium", color: { rgb: "047857" } }, left: { style: "medium", color: { rgb: "047857" } }, right: { style: "medium", color: { rgb: "047857" } } } },
        headerPurple:  { font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "7C3AED" } }, alignment: { horizontal: "center", vertical: "center", wrapText: true }, border: { top: { style: "medium", color: { rgb: "6D28D9" } }, bottom: { style: "medium", color: { rgb: "6D28D9" } }, left: { style: "medium", color: { rgb: "6D28D9" } }, right: { style: "medium", color: { rgb: "6D28D9" } } } },
        headerRose:    { font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "E11D48" } }, alignment: { horizontal: "center", vertical: "center", wrapText: true }, border: { top: { style: "medium", color: { rgb: "BE123C" } }, bottom: { style: "medium", color: { rgb: "BE123C" } }, left: { style: "medium", color: { rgb: "BE123C" } }, right: { style: "medium", color: { rgb: "BE123C" } } } },
        headerCyan:    { font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "0891B2" } }, alignment: { horizontal: "center", vertical: "center", wrapText: true }, border: { top: { style: "medium", color: { rgb: "0E7490" } }, bottom: { style: "medium", color: { rgb: "0E7490" } }, left: { style: "medium", color: { rgb: "0E7490" } }, right: { style: "medium", color: { rgb: "0E7490" } } } },
        headerAmber:   { font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "D97706" } }, alignment: { horizontal: "center", vertical: "center", wrapText: true }, border: { top: { style: "medium", color: { rgb: "B45309" } }, bottom: { style: "medium", color: { rgb: "B45309" } }, left: { style: "medium", color: { rgb: "B45309" } }, right: { style: "medium", color: { rgb: "B45309" } } } },
        cell:     { font: { sz: 10 }, alignment: { horizontal: "left", vertical: "center" }, border: { top: { style: "thin", color: { rgb: "E2E8F0" } }, bottom: { style: "thin", color: { rgb: "E2E8F0" } }, left: { style: "thin", color: { rgb: "E2E8F0" } }, right: { style: "thin", color: { rgb: "E2E8F0" } } } },
        cellR:    { font: { sz: 10 }, alignment: { horizontal: "right", vertical: "center" }, border: { top: { style: "thin", color: { rgb: "E2E8F0" } }, bottom: { style: "thin", color: { rgb: "E2E8F0" } }, left: { style: "thin", color: { rgb: "E2E8F0" } }, right: { style: "thin", color: { rgb: "E2E8F0" } } } },
        cellB:    { font: { sz: 10, bold: true }, alignment: { horizontal: "left", vertical: "center" }, border: { top: { style: "thin", color: { rgb: "E2E8F0" } }, bottom: { style: "thin", color: { rgb: "E2E8F0" } }, left: { style: "thin", color: { rgb: "E2E8F0" } }, right: { style: "thin", color: { rgb: "E2E8F0" } } } },
        cellRB:   { font: { sz: 10, bold: true }, alignment: { horizontal: "right", vertical: "center" }, border: { top: { style: "thin", color: { rgb: "E2E8F0" } }, bottom: { style: "thin", color: { rgb: "E2E8F0" } }, left: { style: "thin", color: { rgb: "E2E8F0" } }, right: { style: "thin", color: { rgb: "E2E8F0" } } } },
        pos:      { font: { sz: 10, bold: true, color: { rgb: "047857" } }, alignment: { horizontal: "right", vertical: "center" } },
        neg:      { font: { sz: 10, bold: true, color: { rgb: "DC2626" } }, alignment: { horizontal: "right", vertical: "center" } },
        low:      { font: { sz: 10, bold: true, color: { rgb: "D97706" } }, alignment: { horizontal: "right", vertical: "center" } },
      };

      const wb = XLSX.utils.book_new();

      // ---------- SHEET 1: EXECUTIVE SUMMARY ----------
      const sum = [];
      sum.push(["INVENTORY MANAGEMENT REPORT"]);
      sum.push([`Period: ${formatDate(filters.startDate)}  →  ${formatDate(filters.endDate)}`]);
      sum.push([`Generated: ${new Date().toLocaleString()}`]);
      sum.push([]);
      sum.push(["KEY METRICS"]);
      sum.push(["Metric", "Value"]);
      const kpis = [
        ["Total Materials", stats.total],
        ["Total Stock In (units)", fmt(stats.totalIn)],
        ["Total Stock Out (units)", fmt(stats.totalOut)],
        ["Closing Balance (units)", fmt(stats.closing)],
        ["Total Receive Value", fmtMoney(stats.inValue)],
        ["Total Stock Value", fmtMoney(stats.stockValue)],
        ["Healthy Materials", stats.healthy],
        ["Low Stock Materials", stats.low],
        ["Out of Stock Materials", stats.out],
        ["Total Requisitions", stats.totalReqs],
        ["Pending Requisitions", stats.pendingReq],
        ["Partial Requisitions", stats.partialReq],
      ];
      kpis.forEach((k) => sum.push(k));
      const sumSheet = XLSX.utils.aoa_to_sheet(sum);
      sumSheet["!cols"] = [{ wch: 32 }, { wch: 26 }];
      sumSheet["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } },
        { s: { r: 4, c: 0 }, e: { r: 4, c: 1 } },
      ];
      if (sumSheet["A1"]) sumSheet["A1"].s = STYLES.title;
      if (sumSheet["A2"]) sumSheet["A2"].s = STYLES.subtitle;
      if (sumSheet["A3"]) sumSheet["A3"].s = STYLES.subtitle;
      if (sumSheet["A5"]) sumSheet["A5"].s = STYLES.section;
      if (sumSheet["A6"]) sumSheet["A6"].s = STYLES.headerBlue;
      if (sumSheet["B6"]) sumSheet["B6"].s = STYLES.headerBlue;
      for (let r = 7; r <= 6 + kpis.length; r++) {
        if (sumSheet[`A${r + 1}`]) sumSheet[`A${r + 1}`].s = STYLES.cellB;
        if (sumSheet[`B${r + 1}`]) sumSheet[`B${r + 1}`].s = STYLES.cellR;
      }
      XLSX.utils.book_append_sheet(wb, sumSheet, "Executive Summary");

      // ---------- SHEET 2: STOCK SUMMARY ----------
      const stockRows = [["#", "Material", "Code", "Category", "Sub Category", "Unit", "Opening", "Stock In", "Stock Out", "Closing", "Avg Cost", "Stock Value", "Status"]];
      filteredMaterials.forEach((m, i) => {
        const st = getStockStatus(m.closing);
        stockRows.push([
          i + 1, m.name, m.code, m.category, m.subCategory, m.unit,
          n(m.opening), n(m.totalIn), n(m.totalOut), n(m.closing),
          n(m.avgCost), n(m.stockValue), st.label,
        ]);
      });
      const stockSheet = XLSX.utils.aoa_to_sheet(stockRows);
      stockSheet["!cols"] = [
        { wch: 5 }, { wch: 42 }, { wch: 16 }, { wch: 20 }, { wch: 20 },
        { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
        { wch: 12 }, { wch: 16 }, { wch: 14 },
      ];
      stockRows[0].forEach((_, c) => {
        const addr = XLSX.utils.encode_cell({ r: 0, c });
        if (stockSheet[addr]) stockSheet[addr].s = STYLES.headerGreen;
      });
      for (let r = 1; r < stockRows.length; r++) {
        for (let c = 0; c < stockRows[r].length; c++) {
          const addr = XLSX.utils.encode_cell({ r, c });
          if (!stockSheet[addr]) continue;
          const isNum = c >= 6 && c <= 11;
          let base = isNum ? STYLES.cellR : STYLES.cell;
          if (c === 1) base = STYLES.cellB;
          if (c === 9) {
            const v = n(stockRows[r][9]);
            base = v <= 0 ? STYLES.neg : v < LOW_STOCK_THRESHOLD ? STYLES.low : STYLES.pos;
          }
          stockSheet[addr].s = base;
        }
      }
      XLSX.utils.book_append_sheet(wb, stockSheet, "Stock Summary");

      // ---------- SHEET 3: STOCK LEDGER ----------
      const ledgerRows = [["Material", "Code", "Unit", "Date", "Type", "Reference", "Stock In", "Stock Out", "Balance", "Detail"]];
      filteredMaterials.forEach((m) => {
        m.ledger.forEach((tx) => {
          ledgerRows.push([
            m.name, m.code, m.unit,
            formatDate(tx.date),
            tx.kind === 'opening' ? 'Opening' : tx.kind === 'receive' ? 'Receive' : 'Issue',
            tx.ref,
            n(tx.inQty), n(tx.outQty), n(tx.balance), tx.detail || '',
          ]);
        });
      });
      const ledgerSheet = XLSX.utils.aoa_to_sheet(ledgerRows);
      ledgerSheet["!cols"] = [
        { wch: 40 }, { wch: 16 }, { wch: 8 }, { wch: 14 }, { wch: 12 },
        { wch: 22 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 30 },
      ];
      ledgerRows[0].forEach((_, c) => {
        const addr = XLSX.utils.encode_cell({ r: 0, c });
        if (ledgerSheet[addr]) ledgerSheet[addr].s = STYLES.headerPurple;
      });
      for (let r = 1; r < ledgerRows.length; r++) {
        for (let c = 0; c < ledgerRows[r].length; c++) {
          const addr = XLSX.utils.encode_cell({ r, c });
          if (!ledgerSheet[addr]) continue;
          const isNum = c >= 6 && c <= 8;
          let base = isNum ? STYLES.cellR : STYLES.cell;
          if (c === 6 && n(ledgerRows[r][6]) > 0) base = STYLES.pos;
          if (c === 7 && n(ledgerRows[r][7]) > 0) base = STYLES.neg;
          if (c === 8) {
            const v = n(ledgerRows[r][8]);
            base = v < 0 ? STYLES.neg : v < LOW_STOCK_THRESHOLD ? STYLES.low : STYLES.cellRB;
          }
          ledgerSheet[addr].s = base;
        }
      }
      XLSX.utils.book_append_sheet(wb, ledgerSheet, "Stock Ledger");

      // ---------- SHEET 4: RECEIVES ----------
      const recRows = [["#", "GRN No", "Date", "Material", "Code", "Qty", "Unit", "Rate", "Value", "Currency", "Vendor", "Company"]];
      [...receives]
        .sort((a, b) => new Date(b.GRNDate) - new Date(a.GRNDate))
        .forEach((r, i) => {
          recRows.push([
            i + 1, r.GRNNo || '—', formatDate(r.GRNDate),
            r.MaterialName || '—', r.MaterialCode || '—',
            n(r.ActualReceiveQTY), r.Unit || 'KG',
            n(r.ActualReceivePrice),
            n(r.ActualReceiveQTY) * n(r.ActualReceivePrice),
            r.Currency || 'USD',
            r.VendorName || '—',
            r.CompanyName || '—',
          ]);
        });
      const recSheet = XLSX.utils.aoa_to_sheet(recRows);
      recSheet["!cols"] = [
        { wch: 5 }, { wch: 22 }, { wch: 14 }, { wch: 40 }, { wch: 16 },
        { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 16 }, { wch: 10 },
        { wch: 28 }, { wch: 30 },
      ];
      recRows[0].forEach((_, c) => {
        const addr = XLSX.utils.encode_cell({ r: 0, c });
        if (recSheet[addr]) recSheet[addr].s = STYLES.headerCyan;
      });
      for (let r = 1; r < recRows.length; r++) {
        for (let c = 0; c < recRows[r].length; c++) {
          const addr = XLSX.utils.encode_cell({ r, c });
          if (!recSheet[addr]) continue;
          const isNum = [5, 7, 8].includes(c);
          recSheet[addr].s = isNum ? STYLES.cellR : STYLES.cell;
          if (c === 5) recSheet[addr].s = STYLES.pos;
        }
      }
      XLSX.utils.book_append_sheet(wb, recSheet, "Receives");

      // ---------- SHEET 5: REQUISITIONS (GROUPED) ----------
      const reqRows = [["#", "Requisition No", "Date", "Material", "Code", "Unit", "Required", "Issued", "Pending", "Fulfill %", "Issues", "Status", "Raised By", "Department", "Cost Center"]];
      filteredRequisitions.forEach((r, i) => {
        reqRows.push([
          i + 1,
          r.requisitionNo, formatDate(r.requisitionDate),
          r.materialName, r.materialCode, r.unit,
          n(r.requiredQTY), n(r.totalIssued), n(r.pendingQTY),
          `${r.fulfillmentPct.toFixed(1)}%`,
          r.issueCount,
          r.status, r.raisedBy, r.department, r.costCenter,
        ]);
      });
      const reqSheet = XLSX.utils.aoa_to_sheet(reqRows);
      reqSheet["!cols"] = [
        { wch: 5 }, { wch: 20 }, { wch: 14 }, { wch: 40 }, { wch: 16 },
        { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 10 },
        { wch: 8 }, { wch: 12 }, { wch: 22 }, { wch: 18 }, { wch: 20 },
      ];
      reqRows[0].forEach((_, c) => {
        const addr = XLSX.utils.encode_cell({ r: 0, c });
        if (reqSheet[addr]) reqSheet[addr].s = STYLES.headerAmber;
      });
      for (let r = 1; r < reqRows.length; r++) {
        for (let c = 0; c < reqRows[r].length; c++) {
          const addr = XLSX.utils.encode_cell({ r, c });
          if (!reqSheet[addr]) continue;
          const isNum = [6, 7, 8].includes(c);
          let base = isNum ? STYLES.cellR : STYLES.cell;
          if (c === 7) base = STYLES.pos;
          if (c === 8) {
            const v = n(reqRows[r][8]);
            base = v > 0 ? STYLES.low : STYLES.cellR;
          }
          if (c === 11) {
            const v = reqRows[r][11];
            if (v === 'Completed') base = { ...STYLES.cell, font: { sz: 10, bold: true, color: { rgb: "047857" } } };
            if (v === 'Partial') base = { ...STYLES.cell, font: { sz: 10, bold: true, color: { rgb: "D97706" } } };
          }
          reqSheet[addr].s = base;
        }
      }
      XLSX.utils.book_append_sheet(wb, reqSheet, "Requisitions");

      // ---------- SHEET 6: ISSUE DETAILS ----------
      const issRows = [["#", "Requisition", "Issue No", "Issue Date", "Material", "Qty", "Unit", "Rate", "Value", "Currency", "Issued To", "Job Card", "GRN"]];
      let issIdx = 1;
      filteredRequisitions.forEach((req) => {
        req.issues.forEach((iss) => {
          issRows.push([
            issIdx++, req.requisitionNo, iss.issueNo, formatDate(iss.issueDate),
            req.materialName, n(iss.issueQTY), req.unit,
            n(iss.issuePrice), n(iss.issueValue), iss.currency,
            iss.issuedBy, iss.jobCardNo, iss.grnNo,
          ]);
        });
      });
      const issSheet = XLSX.utils.aoa_to_sheet(issRows);
      issSheet["!cols"] = [
        { wch: 5 }, { wch: 20 }, { wch: 22 }, { wch: 14 }, { wch: 40 },
        { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 16 }, { wch: 10 },
        { wch: 22 }, { wch: 18 }, { wch: 22 },
      ];
      issRows[0].forEach((_, c) => {
        const addr = XLSX.utils.encode_cell({ r: 0, c });
        if (issSheet[addr]) issSheet[addr].s = STYLES.headerRose;
      });
      for (let r = 1; r < issRows.length; r++) {
        for (let c = 0; c < issRows[r].length; c++) {
          const addr = XLSX.utils.encode_cell({ r, c });
          if (!issSheet[addr]) continue;
          const isNum = [5, 7, 8].includes(c);
          let base = isNum ? STYLES.cellR : STYLES.cell;
          if (c === 5) base = STYLES.neg;
          issSheet[addr].s = base;
        }
      }
      XLSX.utils.book_append_sheet(wb, issSheet, "Issue Details");

      // ---------- WRITE ----------
      const fileName = `inventory_report_${new Date().toISOString().slice(0, 10)}.xlsx`;
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array", cellStyles: true });
      saveAs(new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), fileName);
      toast.dismiss();
      toast.success("✅ Report exported (6 sheets)");
    } catch (err) {
      console.error(err);
      toast.dismiss();
      toast.error("Export failed");
    }
  }, [filteredMaterials, filteredRequisitions, receives, stats, filters]);

  // ==============================
  // PAGINATION COMPONENT
  // ==============================
  function Pagination({ page, totalPages, pageSize, total, onPage, onSize, showAll }) {
    if (showAll) return null;
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 bg-slate-50/50 text-xs">
        <div className="text-slate-500">
          Showing <strong className="text-slate-700">{Math.min((page - 1) * pageSize + 1, total)}</strong>–
          <strong className="text-slate-700">{Math.min(page * pageSize, total)}</strong> of <strong className="text-slate-700">{total}</strong>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => onPage(1)} disabled={page === 1} className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40">
            <FiChevronsLeft size={14} />
          </button>
          <button onClick={() => onPage(page - 1)} disabled={page === 1} className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40">
            <FiChevronLeft size={14} />
          </button>
          <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded border border-blue-100 font-medium">
            {page} / {totalPages}
          </span>
          <button onClick={() => onPage(page + 1)} disabled={page === totalPages} className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40">
            <FiChevronRight size={14} />
          </button>
          <button onClick={() => onPage(totalPages)} disabled={page === totalPages} className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40">
            <FiChevronsRight size={14} />
          </button>
          <select
            value={pageSize}
            onChange={(e) => { onSize(Number(e.target.value)); onPage(1); }}
            className="ml-2 px-2 py-1 border border-slate-200 rounded bg-white"
          >
            {[10, 15, 25, 50, 100].map((v) => <option key={v} value={v}>{v}/page</option>)}
          </select>
        </div>
      </div>
    );
  }

  // ==============================
  // FILTER BAR
  // ==============================
  const FilterBar = () => (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-slate-700">
          <FiFilter size={16} className="text-blue-500" />
          <span className="font-semibold text-sm">Filters</span>
          {(filters.search || filters.category !== 'all' || filters.subCategory !== 'all' || filters.material !== 'all' || filters.status !== 'all' || filters.onlyAlerts) && (
            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">active</span>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
        >
          {showFilters ? 'Hide' : 'Show'}
          {showFilters ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />}
        </button>
      </div>

      {showFilters && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <select value={filters.category} onChange={(e) => { setFilters({ ...filters, category: e.target.value }); setPage(1); }}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none">
              <option value="all">All Categories</option>
              {filterOptions.cats.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            <select value={filters.subCategory} onChange={(e) => { setFilters({ ...filters, subCategory: e.target.value }); setPage(1); }}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none">
              <option value="all">All Subcategories</option>
              {filterOptions.subs.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>

            <select value={filters.material} onChange={(e) => { setFilters({ ...filters, material: e.target.value }); setPage(1); }}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none">
              <option value="all">All Materials</option>
              {filterOptions.mats.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>

            <select value={filters.status} onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1); }}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none">
              <option value="all">Any Status</option>
              <option value="out">Out of Stock</option>
              <option value="low">Low Stock</option>
              <option value="ok">Healthy</option>
              <option value="pending">Pending Req</option>
              <option value="partial">Partial Req</option>
              <option value="completed">Completed Req</option>
            </select>

            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search materials, refs…"
                value={filters.search}
                onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setPage(1); }}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                <input type="checkbox" checked={filters.onlyAlerts} onChange={(e) => { setFilters({ ...filters, onlyAlerts: e.target.checked }); setPage(1); }} className="rounded border-slate-300 text-blue-600" />
                Alerts only
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                <input type="checkbox" checked={filters.showAll} onChange={(e) => { setFilters({ ...filters, showAll: e.target.checked }); setPage(1); }} className="rounded border-slate-300 text-blue-600" />
                Show all (no paging)
              </label>
            </div>
            <div className="flex gap-2">
              <button onClick={resetFilters} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600">
                <FiRefreshCw size={12} /> Reset
              </button>
              <button onClick={exportToExcel} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium">
                <FiDownload size={12} /> Export
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );

  // ==============================
  // MAIN RENDER
  // ==============================
  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-5 lg:p-6">
      <div className="max-w-[1600px] mx-auto space-y-4 sm:space-y-5">
        {/* HEADER */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 flex flex-wrap items-center gap-4 justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <FiPackage size={22} />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-800">Inventory Pro</h1>
              <p className="text-xs text-slate-500">Deep Stock Management · Ledger · Requisitions</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <DateRangePicker />
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-50 shadow-sm transition-colors"
            >
              <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Load Data
            </button>
          </div>
        </div>

        {/* TABS */}
        <TabBar active={activeTab} setActive={(t) => { setActiveTab(t); setPage(1); }} />

        {/* FILTERS */}
        {(activeTab === 'summary' || activeTab === 'ledger' || activeTab === 'issues' || activeTab === 'requisitions') && (
          <FilterBar />
        )}

        {/* CONTENT */}
        {loading ? (
          <Loader />
        ) : (
          <div ref={tableRef}>
            {activeTab === 'dashboard'    && renderDashboard()}
            {activeTab === 'summary'      && renderSummaryTable()}
            {activeTab === 'ledger'       && renderLedger()}
            {activeTab === 'receives'     && renderReceives()}
            {activeTab === 'issues'       && renderIssues()}
            {activeTab === 'requisitions' && renderIssues()}
            {activeTab === 'full-report'  && renderFullReport()}
          </div>
        )}
      </div>
    </div>
  );
}