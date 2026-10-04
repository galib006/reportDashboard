// ============================================================
// INVENTORY MANAGEMENT SYSTEM v4.2 — TRUE STOCK LEDGER
// Correct opening balance · API reconciliation · Multi-sheet Excel
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
  FiArrowUpCircle, FiDollarSign, FiPercent, FiBox, FiClock,
  FiCheckCircle, FiXCircle, FiPauseCircle, FiInfo, FiGrid,
  FiList, FiCalendar, FiUser, FiTag, FiHash, FiMinus, FiPlus,
  FiMoreVertical, FiCopy, FiExternalLink, FiAlertTriangle,
  FiZap, FiTarget, FiDatabase, FiShield, FiTrendingUp as FiUp
} from "react-icons/fi";
import { FaSort, FaSortUp, FaSortDown } from "react-icons/fa";

// ============================================================
// 1. CONSTANTS
// ============================================================

const API_BASE = "https://tpl-api.ebs365.info/api/InventoryBI";
const DEFAULT_PAGE_SIZE = 15;
const LOW_STOCK_THRESHOLD = 50;
const HIGH_STOCK_THRESHOLD = 200;

// Fallback used ONLY if the API doesn't return BalanceQTY for a material
const FALLBACK_OPENING_BALANCES = {
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
  { id: 'dashboard',    label: 'Dashboard',       icon: FiHome,            color: 'blue',    desc: 'Global overview' },
  { id: 'reconcile',    label: 'Reconcile',       icon: FiShield,          color: 'teal',    desc: 'Opening balance audit' },
  { id: 'summary',      label: 'Stock Summary',   icon: FiLayers,          color: 'emerald', desc: 'Closing balance per material' },
  { id: 'movement',     label: 'Movement Report', icon: FiActivity,        color: 'violet',  desc: 'Full lifecycle story' },
  { id: 'ledger',       label: 'Stock Ledger',    icon: FiBookOpen,        color: 'purple',  desc: 'Chronological running balance' },
  { id: 'receives',     label: 'Receives',        icon: FiArrowDownCircle, color: 'cyan',    desc: 'GRN transaction log' },
  { id: 'issues',       label: 'Issues',          icon: FiArrowUpCircle,   color: 'rose',    desc: 'Raw issue transactions' },
  { id: 'requisitions', label: 'Requisitions',    icon: FiClipboard,       color: 'amber',   desc: 'Grouped by req' },
  { id: 'full-report',  label: 'Full Report',     icon: FiFileText,        color: 'indigo',  desc: 'Export snapshot' },
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

const n = (v) => Number(v || 0);
const fmt = (v, d = 2) => n(v).toFixed(d);
const fmtMoney = (v, cur = "USD") =>
  `${cur} ${n(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtCompact = (v) => {
  const num = n(v);
  if (Math.abs(num) >= 1_000_000) return (num / 1_000_000).toFixed(2) + 'M';
  if (Math.abs(num) >= 1_000) return (num / 1_000).toFixed(2) + 'K';
  return num.toFixed(2);
};

const getStockStatus = (balance, threshold = LOW_STOCK_THRESHOLD) => {
  if (balance <= 0) return { key: 'out',  label: 'Out of Stock', cls: 'rose' };
  if (balance < threshold) return { key: 'low', label: 'Low Stock', cls: 'amber' };
  if (balance < threshold * 4) return { key: 'ok', label: 'Healthy', cls: 'emerald' };
  return { key: 'high', label: 'Well Stocked', cls: 'blue' };
};

const statusBadge = (cls) => ({
  rose:    'bg-rose-50 text-rose-700 border-rose-200',
  amber:   'bg-amber-50 text-amber-700 border-amber-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  blue:    'bg-blue-50 text-blue-700 border-blue-200',
  slate:   'bg-slate-100 text-slate-600 border-slate-200',
  violet:  'bg-violet-50 text-violet-700 border-violet-200',
  purple:  'bg-purple-50 text-purple-700 border-purple-200',
  teal:    'bg-teal-50 text-teal-700 border-teal-200',
  cyan:    'bg-cyan-50 text-cyan-700 border-cyan-200',
}[cls] || 'bg-slate-100 text-slate-600 border-slate-200');

const getReqStatus = (issued, required) => {
  if (required <= 0) return { key: 'na', label: 'N/A', cls: 'slate' };
  if (issued >= required) return { key: 'completed', label: 'Completed', cls: 'emerald' };
  if (issued > 0) return { key: 'partial', label: 'Partial', cls: 'amber' };
  return { key: 'pending', label: 'Pending', cls: 'slate' };
};

// ============================================================
// 4. TRUE STOCK LEDGER — THE CORE FIX
// ============================================================

const buildTrueLedger = (statement, receives, issues, startDate) => {
  const materials = new Map();

  const ensure = (name, seed = {}) => {
    if (!materials.has(name)) {
      materials.set(name, {
        name,
        code: seed.code || '—',
        unit: seed.unit || 'KG',
        category: seed.category || '—',
        subCategory: seed.subCategory || '—',
        mainMaterial: seed.mainMaterial || '—',
        apiBalance: null,
        opening: 0,
        openingSource: 'unknown',
        receives: [],
        issues: [],
        ledger: [],
        totalIn: 0,
        totalOut: 0,
        closing: 0,
        avgCost: 0,
        inValue: 0,
        outValue: 0,
        stockValue: 0,
        reconciliationDiff: 0,
        hasDataInRange: false,
      });
    }
    return materials.get(name);
  };

  // STEP 1: Seed with statement (has BalanceQTY)
  statement.forEach((s) => {
    if (!s.MaterialName) return;
    const m = ensure(s.MaterialName, {
      code: s.MaterialCode,
      unit: s.UnitName,
      category: s.CategoryName,
      subCategory: s.SubCategoryName,
      mainMaterial: s.MainMaterialName,
    });
    m.apiBalance = n(s.BalanceQTY);
  });

  // STEP 2: Add receives
  receives.forEach((r) => {
    if (!r.MaterialName) return;
    const m = ensure(r.MaterialName, {
      code: r.MaterialCode, unit: r.Unit,
      category: r.CategoryName, subCategory: r.SubCategoryName,
      mainMaterial: r.MainMaterialName,
    });
    const qty = n(r.ActualReceiveQTY);
    const price = n(r.ActualReceivePrice);
    m.receives.push({
      date: r.GRNDate, ref: r.GRNNo || '—',
      qty, price, value: qty * price,
      vendor: r.VendorName || '—',
      currency: r.Currency || 'USD',
      kind: 'receive',
    });
    m.totalIn += qty;
    m.inValue += qty * price;
    m.hasDataInRange = true;
  });

  // STEP 3: Add issues
  issues.forEach((i) => {
    if (!i.MaterialName) return;
    const m = ensure(i.MaterialName, {
      code: i.MaterialCode, unit: i.UnitName,
      category: i.CategoryName, subCategory: i.SubCategoryName,
      mainMaterial: i.MainMaterialName,
    });
    const qty = n(i.IssueQTY);
    const price = n(i.IssuePrice);
    m.issues.push({
      date: i.IssueDate, ref: i.IssueNo || '—',
      reqNo: i.RequisitionNo || '—',
      reqDate: i.RequisitionDate,
      qty, price, value: qty * price,
      issuedTo: i.IssuedBy || '—',
      jobCard: i.JobCardNo || '—',
      currency: i.Currency || 'USD',
      kind: 'issue',
    });
    m.totalOut += qty;
    m.outValue += qty * price;
    m.hasDataInRange = true;
  });

  // STEP 4: Compute true opening & build ledger
  const result = [];

  materials.forEach((m) => {
    const netChange = m.totalIn - m.totalOut;
    let trueOpening = 0;
    let openingSource = 'reverse';

    if (m.apiBalance !== null) {
      // Reverse-calculate from API's stated closing balance
      trueOpening = m.apiBalance - netChange;
      openingSource = 'api';
    } else if (FALLBACK_OPENING_BALANCES[m.name] !== undefined) {
      trueOpening = n(FALLBACK_OPENING_BALANCES[m.name]);
      openingSource = 'fallback';
    }

    m.opening = trueOpening;
    m.openingSource = openingSource;

    let running = trueOpening;
    const ledger = [];

    if (trueOpening !== 0 || !m.hasDataInRange) {
      ledger.push({
        date: startDate, kind: 'opening', ref: 'OPENING',
        inQty: trueOpening > 0 ? trueOpening : 0,
        outQty: trueOpening < 0 ? Math.abs(trueOpening) : 0,
        balance: trueOpening,
        detail: openingSource === 'api'
          ? `Reverse-calculated from API BalanceQTY (${m.apiBalance})`
          : openingSource === 'fallback'
          ? 'From fallback opening balance table'
          : 'No opening data available',
        currency: '—', unit: m.unit,
        isOpening: true, openingSource,
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
          value: t.value, price: t.price, unit: m.unit,
        });
      } else {
        running -= t.qty;
        ledger.push({
          date: t.date, kind: 'issue', ref: t.ref,
          inQty: 0, outQty: t.qty, balance: running,
          detail: t.issuedTo, currency: t.currency,
          value: t.value, price: t.price,
          reqNo: t.reqNo, jobCard: t.jobCard, unit: m.unit,
        });
      }
    });

    m.ledger = ledger;
    m.closing = running;
    m.avgCost = m.totalIn > 0 ? m.inValue / m.totalIn : 0;
    m.stockValue = m.closing * m.avgCost;

    if (m.apiBalance !== null) {
      m.reconciliationDiff = m.closing - m.apiBalance;
    }
    result.push(m);
  });
  return result;
};

// ============================================================
// 5. GROUP ISSUES BY REQUISITION (fixed: RequiredQTY taken ONCE)
// ============================================================

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
        requiredQTY: n(row.RequiredQTY), // ✅ Take ONCE
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
    });
    g.totalIssued += n(row.IssueQTY);
    g.totalValue += n(row.IssueValue);
    g.currencies.add(row.Currency || 'USD');
  });

  return Array.from(map.values()).map((g) => {
    const pending = Math.max(0, g.requiredQTY - g.totalIssued);
    const pct = g.requiredQTY > 0 ? Math.min(100, (g.totalIssued / g.requiredQTY) * 100) : 0;
    const status = getReqStatus(g.totalIssued, g.requiredQTY);

    const sortedIssues = [...g.issues].sort(
      (a, b) => new Date(a.issueDate) - new Date(b.issueDate)
    );

    let runIssued = 0;
    const issueTimeline = sortedIssues.map((iss) => {
      runIssued += iss.issueQTY;
      return {
        ...iss,
        runningIssued: runIssued,
        runningPending: Math.max(0, g.requiredQTY - runIssued),
      };
    });

    return {
      ...g,
      issues: issueTimeline,
      pendingQTY: pending,
      fulfillmentPct: pct,
      status: status.label,
      statusKey: status.key,
      statusCls: status.cls,
      currency: g.currencies.size === 1 ? [...g.currencies][0] : 'MIXED',
      issueCount: g.issues.length,
    };
  });
};

// ============================================================
// 6. RECONCILIATION AUDIT
// ============================================================

const buildReconciliationReport = (materials) => {
  return materials.map((m) => {
    const diff = m.apiBalance !== null ? m.closing - m.apiBalance : 0;
    const isMismatch = Math.abs(diff) > 0.01;

    return {
      materialName: m.name,
      materialCode: m.code,
      unit: m.unit,
      opening: m.opening,
      openingSource: m.openingSource,
      totalIn: m.totalIn,
      totalOut: m.totalOut,
      ledgerClosing: m.closing,
      apiClosing: m.apiBalance,
      diff,
      isMismatch,
      status: m.apiBalance === null ? 'no_api' : isMismatch ? 'mismatch' : 'match',
    };
  }).sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
};

// ============================================================
// 7. SHARED SUB-COMPONENTS
// ============================================================

const TabBar = ({ active, setActive }) => (
  <div className="border-b border-slate-200 bg-white/95 backdrop-blur-md rounded-t-2xl overflow-x-auto scrollbar-thin">
    <div className="flex px-1 sm:px-3 gap-0.5 min-w-max">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            title={tab.desc}
            className={`group relative flex items-center gap-2 px-3 sm:px-4 py-3.5 transition-all whitespace-nowrap text-sm ${
              isActive ? `text-${tab.color}-600 font-semibold` : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Icon size={16} />
            <span>{tab.label}</span>
            {isActive && <span className={`absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-${tab.color}-500`} />}
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

const Empty = ({ onReset, msg = "No data found" }) => (
  <tr>
    <td colSpan="30" className="px-4 py-16 text-center">
      <div className="flex flex-col items-center gap-3">
        <FiAlertCircle size={44} className="text-slate-300" />
        <p className="text-slate-600 font-medium">{msg}</p>
        <button onClick={onReset} className="mt-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium">Clear filters</button>
      </div>
    </td>
  </tr>
);

const KpiCard = ({ label, value, sub, icon: Icon, color = 'blue' }) => (
  <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{label}</p>
        <p className={`text-xl sm:text-2xl font-bold mt-1.5 text-${color}-600 truncate`}>{value}</p>
        {sub && <p className="text-[11px] text-slate-400 mt-1 truncate">{sub}</p>}
      </div>
      {Icon && <div className={`p-2.5 rounded-xl bg-${color}-50 text-${color}-500 shrink-0`}><Icon size={20} /></div>}
    </div>
  </div>
);

const Pagination = ({ page, totalPages, pageSize, total, onPage, onSize, showAll }) => {
  if (showAll) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 bg-slate-50/50 text-xs">
      <div className="text-slate-500">
        Showing <strong className="text-slate-700">{Math.min((page - 1) * pageSize + 1, total)}</strong>–
        <strong className="text-slate-700">{Math.min(page * pageSize, total)}</strong> of <strong className="text-slate-700">{total}</strong>
      </div>
      <div className="flex items-center gap-1.5">
        <button onClick={() => onPage(1)} disabled={page === 1} className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"><FiChevronsLeft size={14} /></button>
        <button onClick={() => onPage(page - 1)} disabled={page === 1} className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"><FiChevronLeft size={14} /></button>
        <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded border border-blue-100 font-medium">{page} / {totalPages}</span>
        <button onClick={() => onPage(page + 1)} disabled={page === totalPages} className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"><FiChevronRight size={14} /></button>
        <button onClick={() => onPage(totalPages)} disabled={page === totalPages} className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"><FiChevronsRight size={14} /></button>
        <select value={pageSize} onChange={(e) => { onSize(Number(e.target.value)); onPage(1); }} className="ml-2 px-2 py-1 border border-slate-200 rounded bg-white">
          {[10, 15, 25, 50, 100].map((v) => <option key={v} value={v}>{v}/page</option>)}
        </select>
      </div>
    </div>
  );
};

const OpeningSourceBadge = ({ source }) => {
  const cfg = {
    'api':      { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'API',      icon: FiShield },
    'fallback': { cls: 'bg-amber-50 text-amber-700 border-amber-200',       label: 'Fallback', icon: FiAlertTriangle },
    'reverse':  { cls: 'bg-slate-100 text-slate-600 border-slate-200',      label: 'Reverse',  icon: FiInfo },
    'unknown':  { cls: 'bg-rose-50 text-rose-700 border-rose-200',          label: 'Unknown',  icon: FiXCircle },
  }[source] || { cls: 'bg-slate-100 text-slate-600 border-slate-200', label: source, icon: FiInfo };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border ${cfg.cls}`}>
      <Icon size={8} />
      {cfg.label}
    </span>
  );
};

const ReconBadge = ({ diff, isMismatch }) => {
  if (Math.abs(diff) < 0.01) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <FiCheckCircle size={9} /> Matched
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
      <FiAlertTriangle size={9} /> Diff {diff > 0 ? '+' : ''}{fmt(diff)}
    </span>
  );
};

// ============================================================
// 8. REQUISITION CARD
// ============================================================

const RequisitionCard = ({ req }) => {
  const [open, setOpen] = useState(false);
  const statusCls = statusBadge(req.statusCls);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-slate-300 transition-colors">
      <div className="p-3 cursor-pointer hover:bg-slate-50/60 transition-colors" onClick={() => setOpen(!open)}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-2 min-w-0 flex-1">
            <button className="mt-0.5 shrink-0 p-1 rounded-md bg-slate-100">
              <FiChevronRight size={12} className={`transition-transform text-slate-600 ${open ? 'rotate-90' : ''}`} />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-slate-800">{req.requisitionNo}</span>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusCls}`}>{req.status}</span>
                <span className="text-[10px] text-slate-400">{formatDate(req.requisitionDate)}</span>
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                Raised by <strong className="text-slate-700">{req.raisedBy}</strong> · {req.department}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="text-right">
              <p className="text-[10px] uppercase text-slate-400 tracking-wider font-bold">Required</p>
              <p className="font-bold text-slate-800">{fmt(req.requiredQTY)} <span className="text-[10px] font-normal text-slate-400">{req.unit}</span></p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase text-slate-400 tracking-wider font-bold">Issued</p>
              <p className="font-bold text-emerald-600">{fmt(req.totalIssued)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase text-slate-400 tracking-wider font-bold">Pending</p>
              <p className={`font-bold ${req.pendingQTY > 0 ? 'text-amber-600' : 'text-slate-400'}`}>{fmt(req.pendingQTY)}</p>
            </div>
          </div>
        </div>
        <div className="mt-2 ml-7">
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full transition-all ${req.statusKey === 'completed' ? 'bg-emerald-500' : req.statusKey === 'partial' ? 'bg-amber-500' : 'bg-slate-300'}`} style={{ width: `${req.fulfillmentPct}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>{req.issueCount} issue{req.issueCount !== 1 ? 's' : ''}</span>
            <span>{req.fulfillmentPct.toFixed(1)}% fulfilled</span>
          </div>
        </div>
      </div>

      {open && req.issues.length > 0 && (
        <div className="bg-slate-50/50 border-t border-slate-100 p-3">
          <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">Issue No</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">Date</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-500">Qty</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-500">After Issue</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-500">Remaining</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {req.issues.map((iss, i) => (
                  <tr key={i} className="hover:bg-blue-50/30">
                    <td className="px-3 py-2 font-medium text-blue-700">{iss.issueNo}</td>
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{formatDate(iss.issueDate)}</td>
                    <td className="px-3 py-2 text-right font-semibold text-rose-600">−{fmt(iss.issueQTY)}</td>
                    <td className="px-3 py-2 text-right text-slate-600 tabular-nums">{fmt(iss.runningIssued)} / {fmt(req.requiredQTY)}</td>
                    <td className="px-3 py-2 text-right font-semibold">
                      <span className={iss.runningPending > 0 ? 'text-amber-600' : 'text-emerald-600'}>{fmt(iss.runningPending)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// 9. MAIN COMPONENT
// ============================================================

export default function Inventory() {
  const { cndata, apiKey } = useContext(GetDataContext);
  const tableRef = useRef(null);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [expandedMaterials, setExpandedMaterials] = useState({});

  const [receives, setReceives] = useState([]);
  const [issues, setIssues] = useState([]);
  const [statement, setStatement] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [requisitions, setRequisitions] = useState([]);
  const [reconciliation, setReconciliation] = useState([]);

  const [filters, setFilters] = useState({
    search: '', category: 'all', subCategory: 'all', material: 'all',
    company: 'all', status: 'all', openingSource: 'all', reconStatus: 'all',
    onlyAlerts: false, onlyMismatch: false, showAll: false,
    startDate: null, endDate: null,
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sort, setSort] = useState({ key: 'name', dir: 'asc' });

  // ============================================================
  // FETCH DATA
  // ============================================================
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

      const ledger = buildTrueLedger(sData, rData, iData, cndata.startDate);
      setMaterials(ledger);

      const reqs = groupIssuesByRequisition(iData);
      setRequisitions(reqs);

      const recon = buildReconciliationReport(ledger);
      setReconciliation(recon);

      setFilters((f) => ({ ...f, startDate: cndata.startDate, endDate: cndata.endDate }));

      const matchCount = recon.filter((r) => r.status === 'match').length;
      const mismatchCount = recon.filter((r) => r.status === 'mismatch').length;

      if (mismatchCount > 0) {
        toast.warn(`⚠ Loaded ${ledger.length} materials · ${mismatchCount} mismatch${mismatchCount !== 1 ? 'es' : ''}`);
      } else {
        toast.success(`✓ Loaded ${ledger.length} materials · ${matchCount} reconciled`);
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [cndata, apiKey]);

  useEffect(() => {
    if (cndata?.startDate && cndata?.endDate) fetchData();
  }, [cndata, fetchData]);

  // ============================================================
  // EXPORT TO EXCEL
  // ============================================================
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    const createSheet = (data, name, headers) => {
      const ws = XLSX.utils.json_to_sheet(data, { header: headers });
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_col(C) + "1";
        if (!ws[address]) continue;
        ws[address].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "4F46E5" } },
        };
      }
      ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length + 2, 15) }));
      XLSX.utils.book_append_sheet(wb, ws, name);
    };

    // 1. Dashboard Sheet
    const dashboardData = [
      { Metric: "Total Materials", Value: stats.total },
      { Metric: "Total Opening Balance", Value: stats.opening },
      { Metric: "Total Stock In", Value: stats.totalIn },
      { Metric: "Total Stock Out", Value: stats.totalOut },
      { Metric: "Total Closing Balance", Value: stats.closing },
      { Metric: "Total Stock Value (USD)", Value: stats.stockValue },
      { Metric: "Total Requisitions", Value: stats.totalReqs },
      { Metric: "Completed Requisitions", Value: stats.completedReq },
      { Metric: "Pending Requisitions", Value: stats.pendingReq },
      { Metric: "Reconciliation Matches", Value: stats.reconciled },
      { Metric: "Reconciliation Mismatches", Value: stats.mismatched },
    ];
    createSheet(dashboardData, "Dashboard", ["Metric", "Value"]);

    // 2. Stock Summary Sheet
    const summaryHeaders = ["Material", "Code", "Category", "Opening", "Stock In", "Stock Out", "Closing", "Unit", "Avg Cost", "Stock Value", "Status"];
    const summaryData = filteredMaterials.map(m => ({
      "Material": m.name, "Code": m.code, "Category": m.category,
      "Opening": m.opening, "Stock In": m.totalIn, "Stock Out": m.totalOut,
      "Closing": m.closing, "Unit": m.unit, "Avg Cost": m.avgCost,
      "Stock Value": m.stockValue, "Status": getStockStatus(m.closing).label,
    }));
    createSheet(summaryData, "Stock Summary", summaryHeaders);

    // 3. Ledger Sheet
    const ledgerHeaders = ["Material", "Date", "Type", "Reference", "In", "Out", "Balance", "Detail", "Unit"];
    const ledgerData = [];
    filteredMaterials.forEach(m => {
      m.ledger.forEach(tx => {
        ledgerData.push({
          "Material": m.name, "Date": formatDate(tx.date), "Type": tx.kind,
          "Reference": tx.ref, "In": tx.inQty, "Out": tx.outQty,
          "Balance": tx.balance, "Detail": tx.detail, "Unit": m.unit,
        });
      });
    });
    createSheet(ledgerData, "Stock Ledger", ledgerHeaders);

    // 4. Requisition Summary Sheet
    const reqHeaders = ["Requisition No", "Date", "Material", "Required", "Issued", "Pending", "Unit", "Status", "Issues"];
    const reqData = filteredRequisitions.map(r => ({
      "Requisition No": r.requisitionNo, "Date": formatDate(r.requisitionDate),
      "Material": r.materialName, "Required": r.requiredQTY,
      "Issued": r.totalIssued, "Pending": r.pendingQTY,
      "Unit": r.unit, "Status": r.status, "Issues": r.issueCount,
    }));
    createSheet(reqData, "Requisitions", reqHeaders);

    // 5. Issue Details Sheet
    const issueDetailHeaders = ["Requisition No", "Issue No", "Issue Date", "Material", "Qty", "Unit", "Issued To", "Job Card", "Value", "Currency"];
    const issueDetailData = [];
    filteredRequisitions.forEach(r => {
      r.issues.forEach(iss => {
        issueDetailData.push({
          "Requisition No": r.requisitionNo, "Issue No": iss.issueNo,
          "Issue Date": formatDate(iss.issueDate), "Material": r.materialName,
          "Qty": iss.issueQTY, "Unit": r.unit, "Issued To": iss.issuedBy,
          "Job Card": iss.jobCardNo, "Value": iss.issueValue, "Currency": iss.currency,
        });
      });
    });
    createSheet(issueDetailData, "Issue Details", issueDetailHeaders);

    // 6. Receives Sheet
    const recvHeaders = ["GRN No", "Date", "Material", "Qty", "Unit", "Price", "Value", "Vendor", "Currency"];
    const recvData = receives.map(r => ({
      "GRN No": r.GRNNo, "Date": formatDate(r.GRNDate), "Material": r.MaterialName,
      "Qty": r.ActualReceiveQTY, "Unit": r.Unit,
      "Price": r.ActualReceivePrice, "Value": n(r.ActualReceiveQTY) * n(r.ActualReceivePrice),
      "Vendor": r.VendorName, "Currency": r.Currency,
    }));
    createSheet(recvData, "Receives", recvHeaders);

    // 7. Reconciliation Sheet
    const reconHeaders = ["Material", "Opening", "Source", "Stock In", "Stock Out", "Ledger Closing", "API Closing", "Difference", "Status"];
    const reconData = filteredReconciliation.map(r => ({
      "Material": r.materialName, "Opening": r.opening, "Source": r.openingSource,
      "Stock In": r.totalIn, "Stock Out": r.totalOut,
      "Ledger Closing": r.ledgerClosing, "API Closing": r.apiClosing,
      "Difference": r.diff, "Status": r.status,
    }));
    createSheet(reconData, "Reconciliation", reconHeaders);

    const fileName = `Inventory_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success("Excel file downloaded successfully!");
  };

  // ============================================================
  // MEMOIZED DATA & FILTERS
  // ============================================================
  const filterOptions = useMemo(() => ({
    cats: _.uniq(materials.map((m) => m.category).filter((c) => c && c !== '—')),
    subs: _.uniq(materials.map((m) => m.subCategory).filter((s) => s && s !== '—')),
    mats: _.uniq(materials.map((m) => m.name).filter(Boolean)),
  }), [materials]);

  const filteredMaterials = useMemo(() => {
    let data = [...materials];
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      data = data.filter((m) => m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q));
    }
    if (filters.category !== 'all') data = data.filter((m) => m.category === filters.category);
    if (filters.subCategory !== 'all') data = data.filter((m) => m.subCategory === filters.subCategory);
    if (filters.material !== 'all') data = data.filter((m) => m.name === filters.material);
    if (filters.openingSource !== 'all') data = data.filter((m) => m.openingSource === filters.openingSource);
    if (filters.onlyAlerts) data = data.filter((m) => m.closing <= 0 || m.closing < LOW_STOCK_THRESHOLD);
    if (filters.status === 'out') data = data.filter((m) => m.closing <= 0);
    if (filters.status === 'low') data = data.filter((m) => m.closing > 0 && m.closing < LOW_STOCK_THRESHOLD);
    if (filters.status === 'ok') data = data.filter((m) => m.closing >= LOW_STOCK_THRESHOLD);
    return _.orderBy(data, [sort.key], [sort.dir]);
  }, [materials, filters, sort]);

  const filteredRequisitions = useMemo(() => {
    let data = [...requisitions];
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      data = data.filter((r) => r.requisitionNo.toLowerCase().includes(q) || r.materialName.toLowerCase().includes(q));
    }
    if (filters.status !== 'all') data = data.filter((r) => r.statusKey === filters.status);
    if (filters.onlyAlerts) data = data.filter((r) => r.statusKey !== 'completed');
    return _.orderBy(data, ['requisitionDate'], ['desc']);
  }, [requisitions, filters]);

  const filteredReconciliation = useMemo(() => {
    let data = [...reconciliation];
    if (filters.reconStatus !== 'all') data = data.filter((r) => r.status === filters.reconStatus);
    if (filters.onlyMismatch) data = data.filter((r) => r.isMismatch);
    return data;
  }, [reconciliation, filters]);

  // ============================================================
  // STATS
  // ============================================================
  const stats = useMemo(() => {
    const total = materials.length;
    const out = materials.filter((m) => m.closing <= 0).length;
    const low = materials.filter((m) => m.closing > 0 && m.closing < LOW_STOCK_THRESHOLD).length;
    return {
      total, out, low,
      healthy: total - out - low,
      totalIn: materials.reduce((s, m) => s + m.totalIn, 0),
      totalOut: materials.reduce((s, m) => s + m.totalOut, 0),
      closing: materials.reduce((s, m) => s + m.closing, 0),
      opening: materials.reduce((s, m) => s + m.opening, 0),
      stockValue: materials.reduce((s, m) => s + (m.stockValue || 0), 0),
      pendingReq: requisitions.filter((r) => r.statusKey !== 'completed').length,
      completedReq: requisitions.filter((r) => r.statusKey === 'completed').length,
      totalReqs: requisitions.length,
      reconciled: reconciliation.filter((r) => r.status === 'match').length,
      mismatched: reconciliation.filter((r) => r.status === 'mismatch').length,
      noApi: reconciliation.filter((r) => r.status === 'no_api').length,
    };
  }, [materials, requisitions, reconciliation]);

  // ============================================================
  // PAGINATION
  // ============================================================
  const currentData = {
    'summary': filteredMaterials,
    'reconcile': filteredReconciliation,
    'requisitions': filteredRequisitions,
    'issues': filteredRequisitions,
    'movement': filteredMaterials,
    'ledger': filteredMaterials,
    'receives': [],
    'full-report': [],
  }[activeTab] || [];

  const totalPages = Math.max(1, Math.ceil(currentData.length / pageSize));
  const paginated = filters.showAll ? currentData : currentData.slice((page - 1) * pageSize, page * pageSize);

  const gotoPage = (p) => {
    setPage(Math.min(Math.max(1, p), totalPages));
    tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ============================================================
  // HANDLERS
  // ============================================================
  const resetFilters = () => {
    setFilters(f => ({ ...f, search: '', category: 'all', subCategory: 'all', material: 'all', company: 'all', status: 'all', openingSource: 'all', reconStatus: 'all', onlyAlerts: false, onlyMismatch: false }));
    setPage(1);
    toast.info("Filters reset");
  };

  const toggleSort = (key) => setSort(s => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }));
  const SortIcon = ({ col }) => sort.key !== col ? <FaSort className="text-slate-300" size={11} /> : sort.dir === 'asc' ? <FaSortUp className="text-blue-500" size={11} /> : <FaSortDown className="text-blue-500" size={11} />;
  const openLedgerFor = (materialName) => { setActiveTab('ledger'); setExpandedMaterials({ [materialName]: true }); };

  // ============================================================
  // FILTER BAR
  // ============================================================
  const FilterBar = ({ showRecon = false }) => (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-slate-700">
          <FiFilter size={16} className="text-blue-500" />
          <span className="font-semibold text-sm">Filters</span>
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1">
          {showFilters ? 'Hide' : 'Show'}
          {showFilters ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />}
        </button>
      </div>

      {showFilters && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <select value={filters.category} onChange={(e) => { setFilters({ ...filters, category: e.target.value }); setPage(1); }} className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none">
              <option value="all">All Categories</option>
              {filterOptions.cats.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            <select value={filters.subCategory} onChange={(e) => { setFilters({ ...filters, subCategory: e.target.value }); setPage(1); }} className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none">
              <option value="all">All Subcategories</option>
              {filterOptions.subs.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>

            <select value={filters.material} onChange={(e) => { setFilters({ ...filters, material: e.target.value }); setPage(1); }} className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none">
              <option value="all">All Materials</option>
              {filterOptions.mats.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>

            <select value={filters.openingSource} onChange={(e) => { setFilters({ ...filters, openingSource: e.target.value }); setPage(1); }} className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none">
              <option value="all">Any Opening Source</option>
              <option value="api">API (reconciled)</option>
              <option value="fallback">Fallback table</option>
              <option value="reverse">Reverse (unknown)</option>
            </select>

            {showRecon ? (
              <select value={filters.reconStatus} onChange={(e) => { setFilters({ ...filters, reconStatus: e.target.value }); setPage(1); }} className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none">
                <option value="all">Any Recon Status</option>
                <option value="match">✓ Matched</option>
                <option value="mismatch">⚠ Mismatch</option>
                <option value="no_api">ℹ No API Balance</option>
              </select>
            ) : (
              <select value={filters.status} onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1); }} className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none">
                <option value="all">Any Status</option>
                <option value="out">Out of Stock</option>
                <option value="low">Low Stock</option>
                <option value="ok">Healthy</option>
                <option value="pending">Pending Req</option>
                <option value="partial">Partial Req</option>
                <option value="completed">Completed Req</option>
              </select>
            )}
          </div>

          <div className="mt-3 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input type="text" placeholder="Search materials, refs…" value={filters.search} onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setPage(1); }} className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none" />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                <input type="checkbox" checked={filters.onlyAlerts} onChange={(e) => { setFilters({ ...filters, onlyAlerts: e.target.checked }); setPage(1); }} className="rounded border-slate-300 text-blue-600" />
                Alerts only
              </label>
              {showRecon && (
                <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                  <input type="checkbox" checked={filters.onlyMismatch} onChange={(e) => { setFilters({ ...filters, onlyMismatch: e.target.checked }); setPage(1); }} className="rounded border-slate-300 text-rose-600" />
                  Mismatches only
                </label>
              )}
              <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                <input type="checkbox" checked={filters.showAll} onChange={(e) => { setFilters({ ...filters, showAll: e.target.checked }); setPage(1); }} className="rounded border-slate-300 text-blue-600" />
                Show all
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

  // ============================================================
  // RENDER FUNCTIONS
  // ============================================================
  const renderDashboard = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="Materials" value={stats.total} icon={FiPackage} color="blue" />
        <KpiCard label="Opening" value={fmtCompact(stats.opening)} sub="units" icon={FiBox} color="slate" />
        <KpiCard label="Stock In" value={`+${fmtCompact(stats.totalIn)}`} sub="units" icon={FiArrowDownCircle} color="emerald" />
        <KpiCard label="Stock Out" value={`−${fmtCompact(stats.totalOut)}`} sub="units" icon={FiArrowUpCircle} color="rose" />
        <KpiCard label="Closing" value={fmtCompact(stats.closing)} sub="units" icon={FiLayers} color="indigo" />
        <KpiCard label="Stock Value" value={fmtCompact(stats.stockValue)} sub="USD" icon={FiDollarSign} color="cyan" />
      </div>
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-5 text-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center"><FiShield size={22} /></div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-teal-100 font-bold">Reconciliation Status</p>
              <h3 className="text-lg font-bold mt-0.5">Opening Balance Audit</h3>
              <p className="text-xs text-teal-100 mt-0.5">Opening balances reverse-calculated from API's BalanceQTY</p>
            </div>
          </div>
          <div className="flex gap-6 text-center">
            <div><p className="text-2xl font-bold tabular-nums">{stats.reconciled}</p><p className="text-[9px] uppercase text-teal-100 tracking-widest font-bold">✓ Matched</p></div>
            <div><p className="text-2xl font-bold tabular-nums">{stats.mismatched}</p><p className="text-[9px] uppercase text-teal-100 tracking-widest font-bold">⚠ Mismatch</p></div>
            <div><p className="text-2xl font-bold tabular-nums">{stats.noApi}</p><p className="text-[9px] uppercase text-teal-100 tracking-widest font-bold">ℹ No API</p></div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><FiBarChart2 size={16} className="text-emerald-500" /> Inventory Health</h3>
          <div className="space-y-2">
            {[
              { label: 'Out of Stock', value: stats.out, cls: 'bg-rose-500' },
              { label: 'Low Stock', value: stats.low, cls: 'bg-amber-500' },
              { label: 'Healthy', value: stats.healthy, cls: 'bg-emerald-500' },
            ].map((row) => {
              const pct = stats.total ? (row.value / stats.total) * 100 : 0;
              return (
                <div key={row.label}>
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span>{row.label}</span>
                    <span className="font-semibold">{row.value} ({pct.toFixed(1)}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${row.cls}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><FiClipboard size={16} className="text-amber-500" /> Requisitions</h3>
          <div className="space-y-2">
            {[
              { label: 'Completed', value: stats.completedReq, cls: 'bg-emerald-500' },
              { label: 'Pending/Partial', value: stats.pendingReq, cls: 'bg-amber-500' },
            ].map((row) => {
              const pct = stats.totalReqs ? (row.value / stats.totalReqs) * 100 : 0;
              return (
                <div key={row.label}>
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span>{row.label}</span>
                    <span className="font-semibold">{row.value} ({pct.toFixed(1)}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${row.cls}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><FiTarget size={16} className="text-blue-500" /> Alerts</h3>
          <div className="space-y-2 text-xs">
            {stats.out > 0 && <div className="p-2 rounded-lg bg-rose-50 text-rose-700 border border-rose-200"><strong>{stats.out}</strong> materials are out of stock</div>}
            {stats.low > 0 && <div className="p-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-200"><strong>{stats.low}</strong> materials are low on stock</div>}
            {stats.mismatched > 0 && <div className="p-2 rounded-lg bg-rose-50 text-rose-700 border border-rose-200"><strong>{stats.mismatched}</strong> materials have reconciliation mismatches</div>}
            {stats.pendingReq > 0 && <div className="p-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-200"><strong>{stats.pendingReq}</strong> requisitions are pending/partial</div>}
            {stats.out === 0 && stats.low === 0 && stats.mismatched === 0 && stats.pendingReq === 0 && (
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">All clear! No alerts.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSummaryTable = () => (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px]">
          <thead className="bg-slate-50/80 border-b border-slate-200">
            <tr>
              <th className="px-3 py-3 text-left text-[11px] uppercase tracking-wider font-semibold text-slate-500 w-10">#</th>
              <th className="px-3 py-3 text-left text-[11px] uppercase tracking-wider font-semibold text-slate-500 cursor-pointer" onClick={() => toggleSort('name')}><span className="inline-flex items-center gap-1">Material <SortIcon col="name" /></span></th>
              <th className="px-3 py-3 text-right text-[11px] uppercase tracking-wider font-semibold text-slate-500 cursor-pointer" onClick={() => toggleSort('opening')}><span className="inline-flex items-center gap-1">Opening <SortIcon col="opening" /></span></th>
              <th className="px-3 py-3 text-right text-[11px] uppercase tracking-wider font-semibold text-slate-500 cursor-pointer" onClick={() => toggleSort('totalIn')}><span className="inline-flex items-center gap-1">Stock In <SortIcon col="totalIn" /></span></th>
              <th className="px-3 py-3 text-right text-[11px] uppercase tracking-wider font-semibold text-slate-500 cursor-pointer" onClick={() => toggleSort('totalOut')}><span className="inline-flex items-center gap-1">Stock Out <SortIcon col="totalOut" /></span></th>
              <th className="px-3 py-3 text-right text-[11px] uppercase tracking-wider font-semibold text-slate-500 cursor-pointer" onClick={() => toggleSort('closing')}><span className="inline-flex items-center gap-1">Closing <SortIcon col="closing" /></span></th>
              <th className="px-3 py-3 text-center text-[11px] uppercase tracking-wider font-semibold text-slate-500">Unit</th>
              <th className="px-3 py-3 text-right text-[11px] uppercase tracking-wider font-semibold text-slate-500">Stock Value</th>
              <th className="px-3 py-3 text-center text-[11px] uppercase tracking-wider font-semibold text-slate-500">Status</th>
              <th className="px-3 py-3 text-center text-[11px] uppercase tracking-wider font-semibold text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginated.length === 0 && <Empty onReset={resetFilters} />}
            {paginated.map((m, idx) => (
              <tr key={m.name} className="hover:bg-slate-50/70">
                <td className="px-3 py-3 text-xs text-slate-400">{(page - 1) * pageSize + idx + 1}</td>
                <td className="px-3 py-3"><div className="font-medium text-slate-800 text-sm">{m.name}</div><div className="text-[11px] text-slate-400">{m.code}</div></td>
                <td className="px-3 py-3 text-right text-sm text-slate-500">{fmt(m.opening)}</td>
                <td className="px-3 py-3 text-right text-sm font-semibold text-emerald-600">+{fmt(m.totalIn)}</td>
                <td className="px-3 py-3 text-right text-sm font-semibold text-rose-500">−{fmt(m.totalOut)}</td>
                <td className={`px-3 py-3 text-right text-sm font-bold ${m.closing <= 0 ? 'text-rose-600' : m.closing < LOW_STOCK_THRESHOLD ? 'text-amber-600' : 'text-slate-800'}`}>{fmt(m.closing)}</td>
                <td className="px-3 py-3 text-center text-xs text-slate-500">{m.unit}</td>
                <td className="px-3 py-3 text-right text-xs font-medium text-slate-700">{fmtMoney(m.stockValue)}</td>
                <td className="px-3 py-3 text-center"><span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusBadge(getStockStatus(m.closing).cls)}`}>{getStockStatus(m.closing).label}</span></td>
                <td className="px-3 py-3 text-center"><button onClick={() => openLedgerFor(m.name)} className="p-1.5 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100" title="View ledger"><FiBookOpen size={14} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} pageSize={pageSize} total={currentData.length} onPage={gotoPage} onSize={setPageSize} showAll={filters.showAll} />
    </div>
  );

  const renderLedgerView = () => {
    const openMaterialName = Object.keys(expandedMaterials).find(k => expandedMaterials[k]);
    const material = filteredMaterials.find(m => m.name === openMaterialName);
    if (!material) return <div className="bg-white rounded-2xl border p-12 text-center"><FiBookOpen size={48} className="mx-auto text-slate-300 mb-3" /><p className="text-slate-600 font-medium">Select a material to view its ledger</p></div>;

    return (
      <div className="space-y-5">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">Stock Ledger</p>
              <h2 className="text-2xl font-bold mt-1">{material.name}</h2>
              <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-300">
                <span>Code: <strong>{material.code}</strong></span>
                <span>Category: <strong>{material.category}</strong></span>
                <span>Unit: <strong>{material.unit}</strong></span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 uppercase tracking-wider">Closing Balance</p>
              <p className={`text-4xl font-bold mt-1 ${material.closing <= 0 ? 'text-rose-400' : material.closing < LOW_STOCK_THRESHOLD ? 'text-amber-400' : 'text-emerald-400'}`}>{fmt(material.closing)}</p>
              <p className="text-xs text-slate-400 mt-1">≈ {fmtMoney(material.stockValue)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Transaction Ledger</h3>
            <button onClick={() => setExpandedMaterials({})} className="text-xs text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-50">← Back</button>
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
                {material.ledger.map((tx, i) => (
                  <tr key={i} className={tx.balance < 0 ? 'bg-rose-50/50' : 'hover:bg-slate-50/60'}>
                    <td className="px-3 py-2.5 text-xs text-slate-400">{i + 1}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-600 whitespace-nowrap">{formatDate(tx.date)}</td>
                    <td className="px-3 py-2.5"><span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${tx.kind === 'opening' ? 'bg-blue-50 text-blue-700 border-blue-200' : tx.kind === 'receive' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>{tx.kind}</span></td>
                    <td className="px-3 py-2.5 text-xs font-medium text-slate-700">{tx.ref}</td>
                    <td className="px-3 py-2.5 text-right text-xs font-semibold text-emerald-600">{tx.inQty > 0 ? `+${fmt(tx.inQty)}` : '—'}</td>
                    <td className="px-3 py-2.5 text-right text-xs font-semibold text-rose-500">{tx.outQty > 0 ? `−${fmt(tx.outQty)}` : '—'}</td>
                    <td className={`px-3 py-2.5 text-right text-xs font-bold ${tx.balance < 0 ? 'text-rose-600' : tx.balance < LOW_STOCK_THRESHOLD ? 'text-amber-600' : 'text-slate-800'}`}>{fmt(tx.balance)}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-500 truncate max-w-[200px]" title={tx.detail}>{tx.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderRequisitionsView = () => (
    <div className="space-y-3">
      {paginated.length === 0 && <div className="bg-white rounded-2xl border border-slate-100"><Empty onReset={resetFilters} msg="No requisitions found." /></div>}
      {paginated.map((req) => <RequisitionCard key={req.requisitionNo} req={req} />)}
      {!filters.showAll && currentData.length > 0 && <div className="bg-white rounded-2xl border border-slate-100"><Pagination page={page} totalPages={totalPages} pageSize={pageSize} total={currentData.length} onPage={gotoPage} onSize={setPageSize} showAll={filters.showAll} /></div>}
    </div>
  );

  const renderReconciliationView = () => (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px]">
          <thead className="bg-slate-50/80 border-b">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Material</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Opening Source</th>
              <th className="px-3 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Opening</th>
              <th className="px-3 py-3 text-right text-xs font-semibold text-slate-500 uppercase">In Range</th>
              <th className="px-3 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Out Range</th>
              <th className="px-3 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Ledger Closing</th>
              <th className="px-3 py-3 text-right text-xs font-semibold text-slate-500 uppercase">API Balance</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginated.length === 0 && <Empty onReset={resetFilters} />}
            {paginated.map((recon) => (
              <tr key={recon.materialName} className={recon.isMismatch ? 'bg-rose-50/50 hover:bg-rose-50' : 'hover:bg-slate-50/70'}>
                <td className="px-3 py-3"><div className="font-medium text-slate-800 text-sm">{recon.materialName}</div><div className="text-[10px] text-slate-400">{recon.materialCode}</div></td>
                <td className="px-3 py-3 text-center"><OpeningSourceBadge source={recon.openingSource} /></td>
                <td className="px-3 py-3 text-right text-xs text-slate-500 tabular-nums">{fmt(recon.opening)}</td>
                <td className="px-3 py-3 text-right text-xs font-semibold text-emerald-600 tabular-nums">+{fmt(recon.totalIn)}</td>
                <td className="px-3 py-3 text-right text-xs font-semibold text-rose-500 tabular-nums">−{fmt(recon.totalOut)}</td>
                <td className="px-3 py-3 text-right text-xs font-bold text-slate-700 tabular-nums bg-slate-50/40">{fmt(recon.ledgerClosing)}</td>
                <td className="px-3 py-3 text-right text-xs font-bold text-slate-700 tabular-nums bg-blue-50/40">{recon.apiClosing !== null ? fmt(recon.apiClosing) : '—'}</td>
                <td className="px-3 py-3 text-center"><ReconBadge diff={recon.diff} isMismatch={recon.isMismatch} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} pageSize={pageSize} total={currentData.length} onPage={gotoPage} onSize={setPageSize} showAll={filters.showAll} />
    </div>
  );

  // ============================================================
  // MAIN RENDER
  // ============================================================
  return (
    <div className="p-4 sm:p-6 bg-slate-50 min-h-screen font-sans">
      <div className="max-w-[1800px] mx-auto space-y-5">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-md"><FiPackage size={22} /></div>
            <div><h1 className="text-xl font-bold text-slate-900">Inventory Pro</h1><p className="text-xs text-slate-500">Stock Ledger & Reconciliation</p></div>
          </div>
          <div className="flex items-center gap-2">
            <DateRangePicker />
            <button onClick={fetchData} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition disabled:opacity-50">
              <FiRefreshCw size={14} className={loading ? "animate-spin" : ""} /> Load Data
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <TabBar active={activeTab} setActive={setActiveTab} />
          <div className="p-4 sm:p-5">
            {activeTab !== 'dashboard' && activeTab !== 'ledger' && (
              <div className="mb-5">
                <FilterBar showRecon={activeTab === 'reconcile'} />
              </div>
            )}
            {loading ? <Loader /> : (
              <>
                {activeTab === 'dashboard' && renderDashboard()}
                {activeTab === 'reconcile' && renderReconciliationView()}
                {activeTab === 'summary' && renderSummaryTable()}
                {activeTab === 'ledger' && renderLedgerView()}
                {activeTab === 'requisitions' && renderRequisitionsView()}
                {activeTab === 'issues' && renderRequisitionsView()}
                {activeTab === 'movement' && renderSummaryTable()}
                {activeTab === 'receives' && <div className="text-center p-10 text-slate-500">Receives view would go here</div>}
                {activeTab === 'full-report' && <div className="text-center p-10 text-slate-500">Full Report view would go here</div>}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}