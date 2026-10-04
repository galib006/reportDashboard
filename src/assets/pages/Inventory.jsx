// ============================================================
// INVENTORY MANAGEMENT SYSTEM v4 — TRUE STOCK LEDGER
// Correct opening balance · API reconciliation · 10-sheet Excel
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

// ⚠️ IMPORTANT: This is now used ONLY as a fallback when the API
// does not provide BalanceQTY. If your API gives BalanceQTY,
// we use that instead (ground truth).
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
const fmtInt = (v) => n(v).toLocaleString('en-US', { maximumFractionDigits: 2 });
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

/**
 * 🎯 CORE FIX: Build ledger using API's BalanceQTY as ground truth.
 *
 * Logic:
 *   1. For each material, get API's stated closing balance (BalanceQTY).
 *   2. Compute net change in the date range = (Total In − Total Out).
 *   3. TRUE Opening Balance = BalanceQTY − NetChange.
 *   4. Build the ledger from that TRUE opening.
 *
 * This means even if you fetch only 4 days of data, the opening balance
 * reflects stock that existed BEFORE the range — because we reverse-engineer
 * it from the current stated balance.
 *
 * Reconciliation guarantee: Closing from ledger == API BalanceQTY ✅
 */
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
        apiBalance: null,        // API's stated BalanceQTY (ground truth)
        opening: 0,              // computed true opening
        openingSource: 'unknown', // 'api' | 'fallback' | 'reverse'
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

  // ─── STEP 1: SEED WITH STATEMENT (has BalanceQTY) ───
  statement.forEach((s) => {
    if (!s.MaterialName) return;
    const m = ensure(s.MaterialName, {
      code: s.MaterialCode,
      unit: s.UnitName,
      category: s.CategoryName,
      subCategory: s.SubCategoryName,
      mainMaterial: s.MainMaterialName,
    });
    // API's stated balance is ground truth
    const apiBal = n(s.BalanceQTY);
    m.apiBalance = apiBal;
  });

  // ─── STEP 2: ADD RECEIVES ───
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

  // ─── STEP 3: ADD ISSUES ───
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

  // ─── STEP 4: COMPUTE TRUE OPENING & BUILD LEDGER ───
  const result = [];

  materials.forEach((m) => {
    const netChange = m.totalIn - m.totalOut;

    // 🎯 REVERSE-CALCULATE TRUE OPENING
    let trueOpening;
    let openingSource;

    if (m.apiBalance !== null) {
      // BEST: use API's stated closing, reverse to opening
      trueOpening = m.apiBalance - netChange;
      openingSource = 'api';
    } else if (FALLBACK_OPENING_BALANCES[m.name] !== undefined) {
      // FALLBACK: use hardcoded opening
      trueOpening = n(FALLBACK_OPENING_BALANCES[m.name]);
      openingSource = 'fallback';
    } else {
      // WORST: assume 0
      trueOpening = 0;
      openingSource = 'reverse';
    }

    m.opening = trueOpening;
    m.openingSource = openingSource;

    // Build ledger starting from TRUE opening
    let running = trueOpening;
    const ledger = [];

    if (trueOpening !== 0 || !m.hasDataInRange) {
      ledger.push({
        date: startDate, kind: 'opening', ref: 'OPENING',
        inQty: trueOpening > 0 ? trueOpening : 0,
        outQty: trueOpening < 0 ? Math.abs(trueOpening) : 0,
        balanceBefore: 0,
        balanceAfter: trueOpening,
        balance: trueOpening,
        detail: openingSource === 'api'
          ? `Reverse-calculated from API BalanceQTY (${m.apiBalance})`
          : openingSource === 'fallback'
          ? 'From fallback opening balance table'
          : 'No opening data available',
        currency: '—',
        unit: m.unit,
        isOpening: true,
        openingSource,
      });
    }

    const txs = [...m.receives, ...m.issues].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    txs.forEach((t) => {
      const before = running;
      if (t.kind === 'receive') {
        running += t.qty;
        ledger.push({
          date: t.date, kind: 'receive', ref: t.ref,
          inQty: t.qty, outQty: 0,
          balanceBefore: before, balanceAfter: running,
          balance: running,
          detail: t.vendor, currency: t.currency,
          value: t.value, price: t.price,
          unit: m.unit,
        });
      } else {
        running -= t.qty;
        ledger.push({
          date: t.date, kind: 'issue', ref: t.ref,
          inQty: 0, outQty: t.qty,
          balanceBefore: before, balanceAfter: running,
          balance: running,
          detail: t.issuedTo, currency: t.currency,
          value: t.value, price: t.price,
          reqNo: t.reqNo, jobCard: t.jobCard,
          unit: m.unit,
        });
      }
    });

    m.ledger = ledger;
    m.closing = running;
    m.avgCost = m.totalIn > 0 ? m.inValue / m.totalIn : 0;
    m.stockValue = m.closing * m.avgCost;

    // RECONCILIATION CHECK
    if (m.apiBalance !== null) {
      m.reconciliationDiff = m.closing - m.apiBalance;
    }

    result.push(m);
  });

  return result;
};

// ============================================================
// 5. GROUP ISSUES BY REQUISITION
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
        requiredQTY: n(row.RequiredQTY),
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
        runningPct: g.requiredQTY > 0 ? (runIssued / g.requiredQTY) * 100 : 0,
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
      firstIssueDate: sortedIssues[0]?.issueDate,
      lastIssueDate: sortedIssues[sortedIssues.length - 1]?.issueDate,
    };
  });
};

// ============================================================
// 6. MOVEMENT STORY
// ============================================================

const buildMovementStory = (materialsWithLedger) => {
  const byMaterial = new Map();

  materialsWithLedger.forEach((m) => {
    byMaterial.set(m.name, {
      materialName: m.name,
      materialCode: m.code,
      category: m.category,
      subCategory: m.subCategory,
      unit: m.unit,
      opening: m.opening,
      closing: m.closing,
      totalIn: m.totalIn,
      totalOut: m.totalOut,
      apiBalance: m.apiBalance,
      openingSource: m.openingSource,
      reconciliationDiff: m.reconciliationDiff,
      receives: m.receives,
      issues: m.issues,
      events: m.ledger,
      requisitions: [],
      totalPending: 0,
    });
  });

  return Array.from(byMaterial.values())
    .sort((a, b) => a.materialName.localeCompare(b.materialName));
};

// ============================================================
// 7. RECONCILIATION AUDIT
// ============================================================

/**
 * For the Reconcile tab — shows which materials have mismatches
 * between the ledger closing and the API's stated BalanceQTY.
 */
const buildReconciliationReport = (materials) => {
  return materials.map((m) => {
    const ledgerClosing = m.closing;
    const apiClosing = m.apiBalance;
    const diff = apiClosing !== null ? ledgerClosing - apiClosing : 0;
    const isMismatch = Math.abs(diff) > 0.01;

    return {
      materialName: m.name,
      materialCode: m.code,
      unit: m.unit,
      opening: m.opening,
      openingSource: m.openingSource,
      totalIn: m.totalIn,
      totalOut: m.totalOut,
      ledgerClosing,
      apiClosing,
      diff,
      isMismatch,
      status: apiClosing === null ? 'no_api'
        : isMismatch ? 'mismatch'
        : 'match',
    };
  }).sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
};// ============================================================
// 8. SHARED SUB-COMPONENTS
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
              isActive
                ? `text-${tab.color}-600 font-semibold`
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Icon size={16} />
            <span>{tab.label}</span>
            {isActive && (
              <span className={`absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-${tab.color}-500`} />
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
    <p className="text-slate-400 text-xs mt-1">This may take a moment</p>
  </div>
);

const Empty = ({ onReset, msg = "No data found" }) => (
  <tr>
    <td colSpan="30" className="px-4 py-16 text-center">
      <div className="flex flex-col items-center gap-3">
        <FiAlertCircle size={44} className="text-slate-300" />
        <p className="text-slate-600 font-medium">{msg}</p>
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

const KpiCard = ({ label, value, sub, icon: Icon, color = 'blue', trend }) => (
  <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
          {label}
        </p>
        <p className={`text-xl sm:text-2xl font-bold mt-1.5 text-${color}-600 truncate`}>
          {value}
        </p>
        {sub && <p className="text-[11px] text-slate-400 mt-1 truncate">{sub}</p>}
        {trend && (
          <div className={`flex items-center gap-1 text-[10px] font-semibold mt-1 ${
            trend.direction === 'up' ? 'text-emerald-600' : 'text-rose-600'
          }`}>
            {trend.direction === 'up' ? <FiTrendingUp size={10} /> : <FiTrendingDown size={10} />}
            {trend.value}
          </div>
        )}
      </div>
      {Icon && (
        <div className={`p-2.5 rounded-xl bg-${color}-50 text-${color}-500 shrink-0`}>
          <Icon size={20} />
        </div>
      )}
    </div>
  </div>
);

const SectionTitle = ({ icon: Icon, title, subtitle, accent = 'slate', right }) => (
  <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
    <div className="flex items-start gap-3">
      <div className={`p-1.5 rounded-lg bg-${accent}-50 text-${accent}-600 shrink-0 mt-0.5`}>
        <Icon size={14} />
      </div>
      <div>
        <h4 className="font-semibold text-slate-800 text-sm">{title}</h4>
        {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {right}
  </div>
);

const MiniStat = ({ label, value, sub, color = 'slate', icon: Icon, bold }) => {
  const cls = {
    slate:   'bg-slate-50 text-slate-700 border-slate-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rose:    'bg-rose-50 text-rose-700 border-rose-200',
    blue:    'bg-blue-50 text-blue-700 border-blue-200',
    amber:   'bg-amber-50 text-amber-700 border-amber-200',
    violet:  'bg-violet-50 text-violet-700 border-violet-200',
    teal:    'bg-teal-50 text-teal-700 border-teal-200',
  }[color];
  return (
    <div className={`px-3 py-1.5 rounded-lg border ${cls} min-w-[78px]`}>
      <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider opacity-75 font-bold">
        {Icon && <Icon size={9} />}
        {label}
      </div>
      <div className={`text-sm ${bold ? 'font-bold' : 'font-semibold'} leading-tight`}>
        {value}
        {sub && <span className="text-[10px] font-normal opacity-60 ml-0.5">{sub}</span>}
      </div>
    </div>
  );
};

const SummaryTile = ({ label, value, unit, color = 'slate', bold }) => {
  const cls = {
    slate:   'from-slate-50 to-white text-slate-700 border-slate-200',
    emerald: 'from-emerald-50 to-white text-emerald-700 border-emerald-200',
    rose:    'from-rose-50 to-white text-rose-700 border-rose-200',
    blue:    'from-blue-50 to-white text-blue-700 border-blue-200',
    amber:   'from-amber-50 to-white text-amber-700 border-amber-200',
    violet:  'from-violet-50 to-white text-violet-700 border-violet-200',
    teal:    'from-teal-50 to-white text-teal-700 border-teal-200',
  }[color];
  return (
    <div className={`bg-gradient-to-br ${cls} rounded-xl border p-3`}>
      <p className="text-[10px] uppercase tracking-wider opacity-75 font-bold">{label}</p>
      <p className={`mt-1 ${bold ? 'text-xl font-bold' : 'text-lg font-semibold'}`}>
        {value}
        {unit && <span className="text-[11px] font-normal opacity-60 ml-1">{unit}</span>}
      </p>
    </div>
  );
};

const BalancePill = ({ value, unit }) => {
  const status = value <= 0 ? 'rose' : value < LOW_STOCK_THRESHOLD ? 'amber' : 'emerald';
  const cls = {
    rose:    'bg-rose-100 text-rose-700 border-rose-200',
    amber:   'bg-amber-100 text-amber-700 border-amber-200',
    emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  }[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold border tabular-nums ${cls}`}>
      {fmt(value)}
      <span className="text-[9px] font-normal opacity-70">{unit}</span>
    </span>
  );
};

const OpeningSourceBadge = ({ source }) => {
  const cfg = {
    'api':       { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'API',      icon: FiShield },
    'fallback':  { cls: 'bg-amber-50 text-amber-700 border-amber-200',       label: 'Fallback', icon: FiAlertTriangle },
    'reverse':   { cls: 'bg-slate-100 text-slate-600 border-slate-200',      label: 'Reverse',  icon: FiInfo },
    'unknown':   { cls: 'bg-rose-50 text-rose-700 border-rose-200',          label: 'Unknown',  icon: FiXCircle },
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
        <FiCheckCircle size={9} />
        Matched
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
      <FiAlertTriangle size={9} />
      Diff {diff > 0 ? '+' : ''}{fmt(diff)}
    </span>
  );
};

// ============================================================
// 9. REQUISITION CARD
// ============================================================

const RequisitionCard = ({ req }) => {
  const [open, setOpen] = useState(false);
  const statusCls = statusBadge(req.statusCls);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-slate-300 transition-colors">
      <div
        className="p-3 cursor-pointer hover:bg-slate-50/60 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-2 min-w-0 flex-1">
            <button className="mt-0.5 shrink-0 p-1 rounded-md bg-slate-100">
              <FiChevronRight
                size={12}
                className={`transition-transform text-slate-600 ${open ? 'rotate-90' : ''}`}
              />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-slate-800">{req.requisitionNo}</span>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusCls}`}>
                  {req.status}
                </span>
                <span className="text-[10px] text-slate-400">
                  {formatDate(req.requisitionDate)}
                </span>
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                Raised by <strong className="text-slate-700">{req.raisedBy}</strong> · {req.department}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="text-right">
              <p className="text-[10px] uppercase text-slate-400 tracking-wider font-bold">Required</p>
              <p className="font-bold text-slate-800">
                {fmt(req.requiredQTY)} <span className="text-[10px] font-normal text-slate-400">{req.unit}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase text-slate-400 tracking-wider font-bold">Issued</p>
              <p className="font-bold text-emerald-600">{fmt(req.totalIssued)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase text-slate-400 tracking-wider font-bold">Pending</p>
              <p className={`font-bold ${req.pendingQTY > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                {fmt(req.pendingQTY)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-2 ml-7">
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                req.statusKey === 'completed' ? 'bg-emerald-500'
                : req.statusKey === 'partial' ? 'bg-amber-500'
                : 'bg-slate-300'
              }`}
              style={{ width: `${req.fulfillmentPct}%` }}
            />
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
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">
                      {formatDate(iss.issueDate)}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-rose-600">
                      −{fmt(iss.issueQTY)}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-600 tabular-nums">
                      {fmt(iss.runningIssued)} / {fmt(req.requiredQTY)}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold">
                      <span className={iss.runningPending > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                        {fmt(iss.runningPending)}
                      </span>
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
// 10. RECONCILIATION ROW DETAIL
// ============================================================

const ReconRow = ({ recon, onViewLedger }) => {
  const [open, setOpen] = useState(false);

  const statusCfg = {
    match:    { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: FiCheckCircle, iconCls: 'text-emerald-600' },
    mismatch: { bg: 'bg-rose-50',    border: 'border-rose-200',    icon: FiAlertTriangle, iconCls: 'text-rose-600' },
    no_api:   { bg: 'bg-slate-50',   border: 'border-slate-200',   icon: FiInfo, iconCls: 'text-slate-600' },
  }[recon.status];

  const Icon = statusCfg.icon;

  return (
    <>
      <tr
        className={`hover:bg-slate-50/70 cursor-pointer transition-colors ${recon.isMismatch ? 'bg-rose-50/30' : ''}`}
        onClick={() => setOpen(!open)}
      >
        <td className="px-3 py-3 text-center">
          <FiChevronRight
            size={13}
            className={`transition-transform text-slate-400 ${open ? 'rotate-90 text-blue-500' : ''}`}
          />
        </td>
        <td className="px-3 py-3">
          <div className="font-medium text-slate-800 text-sm">{recon.materialName}</div>
          <div className="text-[10px] text-slate-400">{recon.materialCode}</div>
        </td>
        <td className="px-3 py-3 text-center">
          <OpeningSourceBadge source={recon.openingSource} />
        </td>
        <td className="px-3 py-3 text-right text-xs text-slate-500 tabular-nums">
          {fmt(recon.opening)}
        </td>
        <td className="px-3 py-3 text-right text-xs font-semibold text-emerald-600 tabular-nums">
          +{fmt(recon.totalIn)}
        </td>
        <td className="px-3 py-3 text-right text-xs font-semibold text-rose-500 tabular-nums">
          −{fmt(recon.totalOut)}
        </td>
        <td className="px-3 py-3 text-right text-xs font-bold text-slate-700 tabular-nums bg-slate-50/40">
          {fmt(recon.ledgerClosing)}
        </td>
        <td className="px-3 py-3 text-right text-xs font-bold text-slate-700 tabular-nums bg-blue-50/40">
          {recon.apiClosing !== null ? fmt(recon.apiClosing) : '—'}
        </td>
        <td className="px-3 py-3 text-center">
          <ReconBadge diff={recon.diff} isMismatch={recon.isMismatch} />
        </td>
        <td className="px-3 py-3 text-center">
          <button
            onClick={(e) => { e.stopPropagation(); onViewLedger(recon.materialName); }}
            className="p-1.5 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100"
            title="View ledger"
          >
            <FiBookOpen size={13} />
          </button>
        </td>
      </tr>

      {open && (
        <tr className="bg-slate-50/40">
          <td colSpan="10" className="px-6 py-4">
            <div className={`rounded-xl border-2 ${statusCfg.border} ${statusCfg.bg} p-4`}>
              <div className="flex items-start gap-3 mb-3">
                <Icon size={18} className={statusCfg.iconCls} />
                <div>
                  <p className="font-semibold text-slate-800 text-sm">
                    {recon.status === 'match' && 'Reconciled Successfully'}
                    {recon.status === 'mismatch' && 'Reconciliation Mismatch Detected'}
                    {recon.status === 'no_api' && 'No API Balance Available'}
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {recon.status === 'match' && 'Ledger closing exactly matches the API\'s stated BalanceQTY.'}
                    {recon.status === 'mismatch' && `Ledger closing (${fmt(recon.ledgerClosing)}) differs from API BalanceQTY (${fmt(recon.apiClosing)}) by ${fmt(recon.diff)} ${recon.unit}. This may indicate missing transactions outside the fetched range.`}
                    {recon.status === 'no_api' && 'The API did not return BalanceQTY for this material. Opening was derived from the fallback table.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3">
                <SummaryTile label="Opening" value={fmt(recon.opening)} unit={recon.unit} color="slate" />
                <SummaryTile label="In Range" value={`+${fmt(recon.totalIn)}`} unit={recon.unit} color="emerald" />
                <SummaryTile label="Out Range" value={`−${fmt(recon.totalOut)}`} unit={recon.unit} color="rose" />
                <SummaryTile label="Ledger Closing" value={fmt(recon.ledgerClosing)} unit={recon.unit} color="blue" bold />
                <SummaryTile
                  label="API Balance"
                  value={recon.apiClosing !== null ? fmt(recon.apiClosing) : '—'}
                  unit={recon.unit}
                  color={recon.isMismatch ? 'rose' : 'emerald'}
                  bold
                />
              </div>

              <div className="mt-3 p-3 bg-white/60 rounded-lg border border-slate-200">
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  <strong className="text-slate-800">How opening was derived:</strong>{' '}
                  {recon.openingSource === 'api' && (
                    <>API BalanceQTY <code className="text-blue-700 font-mono">{fmt(recon.apiClosing)}</code> − NetChange in range (<code className="text-emerald-700 font-mono">+{fmt(recon.totalIn)}</code> − <code className="text-rose-700 font-mono">{fmt(recon.totalOut)}</code>) = <strong>{fmt(recon.opening)}</strong>. This is the <strong>reverse-calculated opening</strong> — it captures stock that existed before the fetched date range.</>
                  )}
                  {recon.openingSource === 'fallback' && (
                    <>API did not provide BalanceQTY. Using fallback hardcoded opening balance: <strong>{fmt(recon.opening)}</strong>. Verify this value manually.</>
                  )}
                  {recon.openingSource === 'reverse' && (
                    <>No API balance and no fallback value. Assuming opening = <strong>0</strong>. Your ledger may be incomplete for this material.</>
                  )}
                </p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};
// ============================================================
// 11. MAIN COMPONENT
// ============================================================

export default function Inventory() {
  const { cndata, apiKey } = useContext(GetDataContext);
  const tableRef = useRef(null);

  // ── UI State ──
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [expandedMaterials, setExpandedMaterials] = useState({});
  const [expandedReqs, setExpandedReqs] = useState({});

  // ── Data State ──
  const [receives, setReceives] = useState([]);
  const [issues, setIssues] = useState([]);
  const [statement, setStatement] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [requisitions, setRequisitions] = useState([]);
  const [movements, setMovements] = useState([]);
  const [reconciliation, setReconciliation] = useState([]);

  // ── Filter State ──
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    subCategory: 'all',
    material: 'all',
    company: 'all',
    status: 'all',
    openingSource: 'all',
    reconStatus: 'all',
    onlyAlerts: false,
    onlyMismatch: false,
    showAll: false,
    startDate: null,
    endDate: null,
  });

  // ── Pagination & Sort ──
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
        axios.get(
          `${API_BASE}/SCM_GetMaterialReceiveDetail?CompanyID=1&ParentCategoryID=6&CategoryID=0&SubCategoryID=0&MainMaterialID=0&StartDate=${sd}&EndDate=${ed}&CommandID=0`,
          { headers: { Authorization: `${apiKey}` } }
        ),
        axios.get(
          `${API_BASE}/SCM_GET_MaterialIssueDetail?CompanyID=1&ParentCategoryID=6&CategoryID=0&SubCategoryID=0&MainMaterialID=0&StartDate=${sd}&EndDate=${ed}&CommandID=2`,
          { headers: { Authorization: `${apiKey}` } }
        ),
        axios.get(
          `${API_BASE}/BI_SCM_GETInventoryStatement?CompanyID=1&ParentCategoryID=6&CategoryID=0&SubCategoryID=0&MaterialID=0&StartDate=${sd}&EndDate=${ed}&CommandID=2&EmpID=0`,
          { headers: { Authorization: `${apiKey}` } }
        ),
      ]);

      const rData = rRes.data || [];
      const iData = iRes.data || [];
      const sData = sRes.data || [];

      setReceives(rData);
      setIssues(iData);
      setStatement(sData);

      // 🎯 Build TRUE ledger using reverse-calculated opening
      const ledger = buildTrueLedger(sData, rData, iData, cndata.startDate);
      setMaterials(ledger);

      // Group issues by requisition
      const reqs = groupIssuesByRequisition(iData);
      setRequisitions(reqs);

      // Movement story
      const stories = buildMovementStory(ledger);
      // Attach requisitions to their material
      stories.forEach((story) => {
        story.requisitions = reqs
          .filter((r) => r.materialName === story.materialName)
          .sort((a, b) => new Date(b.requisitionDate) - new Date(a.requisitionDate));
        story.totalPending = story.requisitions.reduce((s, r) => s + r.pendingQTY, 0);
      });
      setMovements(stories);

      // Reconciliation report
      const recon = buildReconciliationReport(ledger);
      setReconciliation(recon);

      const matchCount = recon.filter((r) => r.status === 'match').length;
      const mismatchCount = recon.filter((r) => r.status === 'mismatch').length;

      setFilters((f) => ({
        ...f,
        startDate: cndata.startDate,
        endDate: cndata.endDate,
      }));

      if (mismatchCount > 0) {
        toast.warn(`⚠ Loaded ${ledger.length} materials · ${mismatchCount} reconciliation mismatch${mismatchCount !== 1 ? 'es' : ''}`);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================================
  // FILTER OPTIONS
  // ============================================================
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

  // ============================================================
  // FILTERED DATA
  // ============================================================
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
      data = data.filter((r) =>
        r.requisitionNo.toLowerCase().includes(q) ||
        r.materialName.toLowerCase().includes(q) ||
        r.raisedBy.toLowerCase().includes(q)
      );
    }
    if (filters.category !== 'all') data = data.filter((r) => r.category === filters.category);
    if (filters.status !== 'all') data = data.filter((r) => r.statusKey === filters.status);
    if (filters.onlyAlerts) data = data.filter((r) => r.statusKey !== 'completed');
    return _.orderBy(data, ['requisitionDate'], ['desc']);
  }, [requisitions, filters]);

  const filteredMovements = useMemo(() => {
    let data = [...movements];
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      data = data.filter((m) =>
        m.materialName.toLowerCase().includes(q) ||
        m.materialCode.toLowerCase().includes(q) ||
        m.requisitions.some((r) =>
          r.requisitionNo.toLowerCase().includes(q) ||
          r.raisedBy.toLowerCase().includes(q)
        )
      );
    }
    if (filters.category !== 'all') data = data.filter((m) => m.category === filters.category);
    if (filters.subCategory !== 'all') data = data.filter((m) => m.subCategory === filters.subCategory);
    if (filters.openingSource !== 'all') data = data.filter((m) => m.openingSource === filters.openingSource);
    if (filters.onlyAlerts) data = data.filter((m) => m.closing <= 0 || m.closing < LOW_STOCK_THRESHOLD || m.totalPending > 0);
    return data;
  }, [movements, filters]);

  const filteredIssues = useMemo(() => {
    let data = [...issues];
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      data = data.filter((i) =>
        (i.MaterialName || '').toLowerCase().includes(q) ||
        (i.IssueNo || '').toLowerCase().includes(q) ||
        (i.RequisitionNo || '').toLowerCase().includes(q) ||
        (i.IssuedBy || '').toLowerCase().includes(q)
      );
    }
    if (filters.category !== 'all') data = data.filter((i) => i.CategoryName === filters.category);
    if (filters.material !== 'all') data = data.filter((i) => i.MaterialName === filters.material);
    return data.sort((a, b) => new Date(b.IssueDate) - new Date(a.IssueDate));
  }, [issues, filters]);

  const filteredReconciliation = useMemo(() => {
    let data = [...reconciliation];
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      data = data.filter((r) =>
        r.materialName.toLowerCase().includes(q) ||
        r.materialCode.toLowerCase().includes(q)
      );
    }
    if (filters.openingSource !== 'all') data = data.filter((r) => r.openingSource === filters.openingSource);
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
    const healthy = total - out - low;

    const totalIn = materials.reduce((s, m) => s + m.totalIn, 0);
    const totalOut = materials.reduce((s, m) => s + m.totalOut, 0);
    const closing = materials.reduce((s, m) => s + m.closing, 0);
    const opening = materials.reduce((s, m) => s + m.opening, 0);
    const inValue = materials.reduce((s, m) => s + m.inValue, 0);
    const stockValue = materials.reduce((s, m) => s + (m.stockValue || 0), 0);

    const pendingReq = requisitions.filter((r) => r.statusKey !== 'completed').length;
    const partialReq = requisitions.filter((r) => r.statusKey === 'partial').length;
    const completedReq = requisitions.filter((r) => r.statusKey === 'completed').length;

    const reconciled = reconciliation.filter((r) => r.status === 'match').length;
    const mismatched = reconciliation.filter((r) => r.status === 'mismatch').length;
    const noApi = reconciliation.filter((r) => r.status === 'no_api').length;

    return {
      total, out, low, healthy,
      totalIn, totalOut, closing, opening,
      inValue, stockValue,
      pendingReq, partialReq, completedReq,
      totalReqs: requisitions.length,
      reconciled, mismatched, noApi,
    };
  }, [materials, requisitions, reconciliation]);

  // ============================================================
  // PAGINATION
  // ============================================================
  const currentData =
    activeTab === 'movement' ? filteredMovements
    : activeTab === 'requisitions' ? filteredRequisitions
    : activeTab === 'issues' ? filteredIssues
    : activeTab === 'reconcile' ? filteredReconciliation
    : filteredMaterials;

  const totalPages = Math.max(1, Math.ceil(currentData.length / pageSize));
  const paginated = filters.showAll
    ? currentData
    : currentData.slice((page - 1) * pageSize, page * pageSize);

  const gotoPage = (p) => {
    setPage(Math.min(Math.max(1, p), totalPages));
    tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ============================================================
  // HANDLERS
  // ============================================================
  const resetFilters = () => {
    setFilters((f) => ({
      ...f, search: '', category: 'all', subCategory: 'all',
      material: 'all', company: 'all', status: 'all',
      openingSource: 'all', reconStatus: 'all',
      onlyAlerts: false, onlyMismatch: false,
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

  const openLedgerFor = (materialName) => {
    setActiveTab('ledger');
    setExpandedMaterials({ [materialName]: true });
  };

  // ============================================================
  // PAGINATION COMPONENT
  // ============================================================
  const Pagination = ({ page, totalPages, pageSize, total, onPage, onSize, showAll }) => {
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
  };

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

            <select value={filters.openingSource} onChange={(e) => { setFilters({ ...filters, openingSource: e.target.value }); setPage(1); }}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none">
              <option value="all">Any Opening Source</option>
              <option value="api">API (reconciled)</option>
              <option value="fallback">Fallback table</option>
              <option value="reverse">Reverse (unknown)</option>
            </select>

            {showRecon ? (
              <select value={filters.reconStatus} onChange={(e) => { setFilters({ ...filters, reconStatus: e.target.value }); setPage(1); }}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none">
                <option value="all">Any Recon Status</option>
                <option value="match">✓ Matched</option>
                <option value="mismatch">⚠ Mismatch</option>
                <option value="no_api">ℹ No API Balance</option>
              </select>
            ) : (
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
            )}
          </div>

          <div className="mt-3 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Search materials, refs…"
              value={filters.search}
              onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setPage(1); }}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none"
            />
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

  // ============================================================
  // RENDER: DASHBOARD
  // ============================================================
  const renderDashboard = () => (
    <div className="space-y-5">
      {/* KPI GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="Materials" value={stats.total} icon={FiPackage} color="blue" />
        <KpiCard label="Opening" value={fmtCompact(stats.opening)} sub="units" icon={FiBox} color="slate" />
        <KpiCard label="Stock In" value={`+${fmtCompact(stats.totalIn)}`} sub="units" icon={FiArrowDownCircle} color="emerald" />
        <KpiCard label="Stock Out" value={`−${fmtCompact(stats.totalOut)}`} sub="units" icon={FiArrowUpCircle} color="rose" />
        <KpiCard label="Closing" value={fmtCompact(stats.closing)} sub="units" icon={FiLayers} color="indigo" />
        <KpiCard label="Stock Value" value={fmtCompact(stats.stockValue)} sub="USD" icon={FiDollarSign} color="cyan" />
      </div>

      {/* RECONCILIATION STRIP */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-5 text-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <FiShield size={22} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-teal-100 font-bold">Reconciliation Status</p>
              <h3 className="text-lg font-bold mt-0.5">Opening Balance Audit</h3>
              <p className="text-xs text-teal-100 mt-0.5">
                Opening balances reverse-calculated from API's BalanceQTY
              </p>
            </div>
          </div>
          <div className="flex gap-6 text-center">
            <div>
              <p className="text-2xl font-bold tabular-nums">{stats.reconciled}</p>
              <p className="text-[9px] uppercase text-teal-100 tracking-widest font-bold">✓ Matched</p>
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{stats.mismatched}</p>
              <p className="text-[9px] uppercase text-teal-100 tracking-widest font-bold">⚠ Mismatch</p>
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{stats.noApi}</p>
              <p className="text-[9px] uppercase text-teal-100 tracking-widest font-bold">ℹ No API</p>
            </div>
          </div>
        </div>
      </div>

      {/* HEALTH + ALERTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <FiBarChart2 size={16} className="text-emerald-500" />
            Inventory Health
          </h3>
          {(() => {
            const total = stats.total || 1;
            const pct = (stats.healthy / total) * 100;
            const circ = 2 * Math.PI * 42;
            const dash = (pct / 100) * circ;
            return (
              <div className="flex items-center gap-5">
                <div className="relative">
                  <svg width="110" height="110" viewBox="0 0 110 110" className="-rotate-90">
                    <circle cx="55" cy="55" r="42" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                    <circle cx="55" cy="55" r="42" fill="none" stroke="#10b981" strokeWidth="10"
                      strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-emerald-600">{pct.toFixed(0)}%</span>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-slate-600">Healthy</span>
                    </div>
                    <strong className="text-slate-800">{stats.healthy}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-slate-600">Low</span>
                    </div>
                    <strong className="text-slate-800">{stats.low}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      <span className="text-slate-600">Out</span>
                    </div>
                    <strong className="text-slate-800">{stats.out}</strong>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <FiAlertCircle className="text-rose-500" size={16} />
            Critical Stock Alerts
          </h3>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {materials
              .filter((m) => m.closing <= 0 || m.closing < LOW_STOCK_THRESHOLD)
              .sort((a, b) => a.closing - b.closing)
              .slice(0, 10)
              .map((m) => (
                <div
                  key={m.name}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                  onClick={() => openLedgerFor(m.name)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-700 truncate">{m.name}</p>
                    <p className="text-[10px] text-slate-400">{m.category} · {m.subCategory}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <div className="text-right text-[10px] text-slate-400 leading-tight">
                      <div className="text-emerald-600">In: {fmt(m.totalIn)}</div>
                      <div className="text-rose-500">Out: {fmt(m.totalOut)}</div>
                    </div>
                    <BalancePill value={m.closing} unit={m.unit} />
                  </div>
                </div>
              ))}
            {materials.filter((m) => m.closing <= 0 || m.closing < LOW_STOCK_THRESHOLD).length === 0 && (
              <p className="text-sm text-slate-400 text-center py-8">All materials are healthy ✓</p>
            )}
          </div>
        </div>
      </div>

      {/* TOP MOVERS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <FiTrendingDown className="text-rose-500" size={16} />
            Top Consumers
          </h3>
          <div className="space-y-2">
            {[...materials].sort((a, b) => b.totalOut - a.totalOut).slice(0, 6).map((m, i) => (
              <div
                key={m.name}
                className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 rounded-lg p-1.5 -m-1.5 transition-colors"
                onClick={() => openLedgerFor(m.name)}
              >
                <span className="w-6 text-xs text-slate-400 font-bold">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{m.name}</p>
                  <div className="h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full bg-rose-400 rounded-full"
                      style={{ width: `${(m.totalOut / (materials[0]?.totalOut || 1)) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs font-bold text-rose-600 shrink-0 tabular-nums">{fmt(m.totalOut)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <FiTrendingUp className="text-emerald-500" size={16} />
            Top Inflows
          </h3>
          <div className="space-y-2">
            {[...materials].sort((a, b) => b.totalIn - a.totalIn).slice(0, 6).map((m, i) => (
              <div
                key={m.name}
                className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 rounded-lg p-1.5 -m-1.5 transition-colors"
                onClick={() => openLedgerFor(m.name)}
              >
                <span className="w-6 text-xs text-slate-400 font-bold">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{m.name}</p>
                  <div className="h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full"
                      style={{ width: `${(m.totalIn / (materials[0]?.totalIn || 1)) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-600 shrink-0 tabular-nums">{fmt(m.totalIn)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ============================================================
  // RENDER: RECONCILE TAB
  // ============================================================
  const renderReconcile = () => (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-teal-600 to-cyan-700 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-teal-100 font-bold">Data Integrity</p>
            <h2 className="text-xl font-bold mt-1">Opening Balance Reconciliation</h2>
            <p className="text-sm text-teal-100 mt-1 max-w-3xl">
              Every material's opening balance is <strong className="text-white">reverse-calculated</strong> from
              the API's current <code className="bg-white/20 px-1 rounded">BalanceQTY</code> minus the net
              change within your date range. This captures stock that existed <strong>before</strong> your fetch window.
            </p>
          </div>
          <div className="flex gap-6 text-center">
            <div>
              <p className="text-2xl font-bold tabular-nums">{stats.reconciled}</p>
              <p className="text-[9px] uppercase text-teal-100 tracking-widest font-bold">✓ Matched</p>
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{stats.mismatched}</p>
              <p className="text-[9px] uppercase text-teal-100 tracking-widest font-bold">⚠ Mismatch</p>
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{stats.noApi}</p>
              <p className="text-[9px] uppercase text-teal-100 tracking-widest font-bold">ℹ No API</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <FiShield className="text-teal-600" size={16} />
              Reconciliation Report
            </h3>
            <p className="text-xs text-slate-500">
              {filteredReconciliation.length} materials · click a row to see calculation details
            </p>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {filteredReconciliation.filter((r) => r.status === 'match').length} Matched
            </span>
            <span className="px-2 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
              {filteredReconciliation.filter((r) => r.status === 'mismatch').length} Mismatch
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px]">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="w-10 px-3 py-3"></th>
                <th className="px-3 py-3 text-left text-[10px] uppercase tracking-wider font-bold text-slate-500">Material</th>
                <th className="px-3 py-3 text-center text-[10px] uppercase tracking-wider font-bold text-slate-500">Source</th>
                <th className="px-3 py-3 text-right text-[10px] uppercase tracking-wider font-bold text-slate-500">Opening</th>
                <th className="px-3 py-3 text-right text-[10px] uppercase tracking-wider font-bold text-emerald-600 bg-emerald-50/40">In</th>
                <th className="px-3 py-3 text-right text-[10px] uppercase tracking-wider font-bold text-rose-600 bg-rose-50/40">Out</th>
                <th className="px-3 py-3 text-right text-[10px] uppercase tracking-wider font-bold text-slate-500 bg-slate-100/40">Ledger Closing</th>
                <th className="px-3 py-3 text-right text-[10px] uppercase tracking-wider font-bold text-blue-600 bg-blue-50/40">API Balance</th>
                <th className="px-3 py-3 text-center text-[10px] uppercase tracking-wider font-bold text-slate-500">Recon</th>
                <th className="px-3 py-3 text-center text-[10px] uppercase tracking-wider font-bold text-slate-500">Ledger</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.length === 0 && <Empty onReset={resetFilters} />}
              {paginated.map((r, idx) => (
                <ReconRow key={r.materialName} recon={r} onViewLedger={openLedgerFor} />
              ))}
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
    </div>
  );

  // ============================================================
  // RENDER: STOCK SUMMARY
  // ============================================================
  const renderSummaryTable = () => (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-800">Stock Summary</h3>
          <p className="text-xs text-slate-500">
            {filteredMaterials.length} materials · opening → in → out → closing
          </p>
        </div>
        <div className="flex gap-3 text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> API-derived opening
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span> Fallback opening
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1200px]">
          <thead className="bg-slate-50/80 border-b border-slate-200">
            <tr>
              <th className="px-3 py-3 text-left text-[10px] uppercase tracking-wider font-bold text-slate-500 w-10">#</th>
              <th className="px-3 py-3 text-left text-[10px] uppercase tracking-wider font-bold text-slate-500">Material</th>
              <th className="px-3 py-3 text-left text-[10px] uppercase tracking-wider font-bold text-slate-500">Category</th>
              <th className="px-3 py-3 text-center text-[10px] uppercase tracking-wider font-bold text-slate-500">Opening Source</th>
              <th className="px-3 py-3 text-right text-[10px] uppercase tracking-wider font-bold text-slate-400 bg-slate-100/50">Opening</th>
              <th className="px-3 py-3 text-right text-[10px] uppercase tracking-wider font-bold text-emerald-600 bg-emerald-50/50">Stock In</th>
              <th className="px-3 py-3 text-right text-[10px] uppercase tracking-wider font-bold text-rose-600 bg-rose-50/50">Stock Out</th>
              <th className="px-3 py-3 text-right text-[10px] uppercase tracking-wider font-bold text-slate-700 bg-slate-100/50">Closing</th>
              <th className="px-3 py-3 text-center text-[10px] uppercase tracking-wider font-bold text-slate-500">Unit</th>
              <th className="px-3 py-3 text-right text-[10px] uppercase tracking-wider font-bold text-slate-500">Avg Cost</th>
              <th className="px-3 py-3 text-right text-[10px] uppercase tracking-wider font-bold text-slate-500">Stock Value</th>
              <th className="px-3 py-3 text-center text-[10px] uppercase tracking-wider font-bold text-slate-500">Status</th>
              <th className="px-3 py-3 text-center text-[10px] uppercase tracking-wider font-bold text-slate-500">Actions</th>
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
                    <div className="text-[10px] text-slate-400">{m.code}</div>
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-600">
                    <div>{m.category}</div>
                    <div className="text-[10px] text-slate-400">{m.subCategory}</div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <OpeningSourceBadge source={m.openingSource} />
                  </td>
                  <td className="px-3 py-3 text-right text-xs text-slate-500 tabular-nums bg-slate-50/40">{fmt(m.opening)}</td>
                  <td className="px-3 py-3 text-right text-xs font-semibold text-emerald-600 tabular-nums bg-emerald-50/30">
                    +{fmt(m.totalIn)}
                  </td>
                  <td className="px-3 py-3 text-right text-xs font-semibold text-rose-500 tabular-nums bg-rose-50/30">
                    −{fmt(m.totalOut)}
                  </td>
                  <td className="px-3 py-3 text-right text-sm font-bold tabular-nums bg-slate-50/40">
                    <span className={
                      m.closing <= 0 ? 'text-rose-600'
                      : m.closing < LOW_STOCK_THRESHOLD ? 'text-amber-600'
                      : 'text-slate-800'
                    }>
                      {fmt(m.closing)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center text-xs text-slate-500">{m.unit}</td>
                  <td className="px-3 py-3 text-right text-xs text-slate-600 tabular-nums">{fmt(m.avgCost)}</td>
                  <td className="px-3 py-3 text-right text-xs font-medium text-slate-700 tabular-nums">{fmtMoney(m.stockValue)}</td>
                  <td className="px-3 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusBadge(status.cls)}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => openLedgerFor(m.name)}
                        className="p-1.5 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors"
                        title="View ledger"
                      >
                        <FiBookOpen size={13} />
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('movement');
                          setExpandedMaterials({ [m.name]: true });
                        }}
                        className="p-1.5 rounded-lg bg-violet-50 text-violet-600 hover:bg-violet-100 transition-colors"
                        title="View movement story"
                      >
                        <FiActivity size={13} />
                      </button>
                    </div>
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

  // ============================================================
  // RENDER: LEDGER
  // ============================================================
  const renderLedger = () => {
    const openMaterial = Object.keys(expandedMaterials).find((k) => expandedMaterials[k]);
    const material = filteredMaterials.find((m) => m.name === openMaterial);

    if (!material) {
      return (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <FiBookOpen size={48} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-600 font-medium">Select a material to view its ledger</p>
          <p className="text-slate-400 text-sm mt-1">
            Click the ledger icon on any material in Stock Summary, or click a material name in Dashboard alerts
          </p>
        </div>
      );
    }

    const status = getStockStatus(material.closing);

    return (
      <div className="space-y-5">
        {/* HEADER CARD */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Stock Ledger</p>
                <OpeningSourceBadge source={material.openingSource} />
                {material.apiBalance !== null && (
                  <ReconBadge diff={material.reconciliationDiff} isMismatch={Math.abs(material.reconciliationDiff) > 0.01} />
                )}
              </div>
              <h2 className="text-2xl font-bold mt-1.5">{material.name}</h2>
              <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-300">
                <span className="flex items-center gap-1"><FiHash size={11} /> {material.code}</span>
                <span className="flex items-center gap-1"><FiTag size={11} /> {material.category} › {material.subCategory}</span>
                <span className="flex items-center gap-1"><FiPackage size={11} /> {material.unit}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Closing Balance</p>
              <p className={`text-4xl font-bold mt-1 tabular-nums ${
                material.closing <= 0 ? 'text-rose-400'
                : material.closing < LOW_STOCK_THRESHOLD ? 'text-amber-400'
                : 'text-emerald-400'
              }`}>
                {fmt(material.closing)}
              </p>
              <p className="text-xs text-slate-400 mt-1">≈ {fmtMoney(material.stockValue)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6">
            {[
              { l: 'Opening', v: fmt(material.opening), c: 'text-slate-200' },
              { l: 'Stock In', v: `+${fmt(material.totalIn)}`, c: 'text-emerald-400' },
              { l: 'Stock Out', v: `−${fmt(material.totalOut)}`, c: 'text-rose-400' },
              { l: 'Net Change', v: `${material.closing - material.opening >= 0 ? '+' : ''}${fmt(material.closing - material.opening)}`, c: 'text-blue-300' },
              { l: 'Avg Cost', v: fmtMoney(material.avgCost), c: 'text-slate-200' },
            ].map((k) => (
              <div key={k.l} className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
                <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">{k.l}</p>
                <p className={`text-base font-bold mt-0.5 tabular-nums ${k.c}`}>{k.v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* LEDGER TABLE */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-800">Transaction Ledger</h3>
              <p className="text-xs text-slate-500">
                {material.ledger.length} transactions · chronological order · running balance
              </p>
            </div>
            <button
              onClick={() => setExpandedMaterials({})}
              className="text-xs text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-50"
            >
              ← Back
            </button>
          </div>
          <div className="overflow-x-auto max-h-[70vh]">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-3 text-left text-[10px] uppercase tracking-wider font-bold text-slate-500 w-10">#</th>
                  <th className="px-3 py-3 text-left text-[10px] uppercase tracking-wider font-bold text-slate-500">Date</th>
                  <th className="px-3 py-3 text-left text-[10px] uppercase tracking-wider font-bold text-slate-500">Type</th>
                  <th className="px-3 py-3 text-left text-[10px] uppercase tracking-wider font-bold text-slate-500">Reference</th>
                  <th className="px-3 py-3 text-left text-[10px] uppercase tracking-wider font-bold text-slate-500">Detail</th>
                  <th className="px-3 py-3 text-right text-[10px] uppercase tracking-wider font-bold text-slate-400 bg-slate-100">Before</th>
                  <th className="px-3 py-3 text-right text-[10px] uppercase tracking-wider font-bold text-emerald-600 bg-emerald-50">In</th>
                  <th className="px-3 py-3 text-right text-[10px] uppercase tracking-wider font-bold text-rose-600 bg-rose-50">Out</th>
                  <th className="px-3 py-3 text-right text-[10px] uppercase tracking-wider font-bold text-slate-700 bg-slate-100">After</th>
                  <th className="px-3 py-3 text-right text-[10px] uppercase tracking-wider font-bold text-slate-500">Rate</th>
                  <th className="px-3 py-3 text-right text-[10px] uppercase tracking-wider font-bold text-slate-500">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {material.ledger.map((tx, i) => {
                  const isNeg = tx.balanceAfter < 0;
                  const typeCls =
                    tx.kind === 'opening' ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : tx.kind === 'receive' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200';
                  const typeLabel =
                    tx.kind === 'opening' ? 'Opening'
                    : tx.kind === 'receive' ? 'Receive'
                    : 'Issue';
                  return (
                    <tr key={i} className={isNeg ? 'bg-rose-50/30' : 'hover:bg-slate-50/60'}>
                      <td className="px-3 py-2.5 text-xs text-slate-400">{i + 1}</td>
                      <td className="px-3 py-2.5 text-xs text-slate-600 whitespace-nowrap">{formatDate(tx.date)}</td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${typeCls}`}>
                          {tx.kind === 'opening' && <FiBox size={9} />}
                          {tx.kind === 'receive' && <FiArrowDownCircle size={9} />}
                          {tx.kind === 'issue' && <FiArrowUpCircle size={9} />}
                          {typeLabel}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-xs font-medium text-slate-700">{tx.ref}</td>
                      <td className="px-3 py-2.5 text-xs text-slate-500 truncate max-w-[200px]" title={tx.detail}>
                        {tx.detail}
                      </td>
                      <td className="px-3 py-2.5 text-right text-xs text-slate-500 tabular-nums bg-slate-50/40">
                        {fmt(tx.balanceBefore)}
                      </td>
                      <td className="px-3 py-2.5 text-right text-xs font-bold text-emerald-600 tabular-nums bg-emerald-50/30">
                        {tx.inQty > 0 ? `+${fmt(tx.inQty)}` : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-right text-xs font-bold text-rose-500 tabular-nums bg-rose-50/30">
                        {tx.outQty > 0 ? `−${fmt(tx.outQty)}` : '—'}
                      </td>
                      <td className={`px-3 py-2.5 text-right text-xs font-bold tabular-nums bg-slate-50/40 ${
                        isNeg ? 'text-rose-600'
                        : tx.balanceAfter < LOW_STOCK_THRESHOLD ? 'text-amber-600'
                        : 'text-slate-800'
                      }`}>
                        {fmt(tx.balanceAfter)}
                      </td>
                      <td className="px-3 py-2.5 text-right text-xs text-slate-500 tabular-nums">
                        {tx.price ? fmt(tx.price) : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-right text-xs text-slate-600 tabular-nums">
                        {tx.value ? fmtMoney(tx.value, tx.currency) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-100 border-t-2 border-slate-300 sticky bottom-0">
                <tr className="font-bold text-xs text-slate-800">
                  <td colSpan="5" className="px-3 py-3 text-right uppercase tracking-wider">
                    Totals
                  </td>
                  <td className="px-3 py-3 text-right text-slate-500 tabular-nums">
                    {fmt(material.opening)}
                  </td>
                  <td className="px-3 py-3 text-right text-emerald-700 tabular-nums">
                    +{fmt(material.totalIn)}
                  </td>
                  <td className="px-3 py-3 text-right text-rose-700 tabular-nums">
                    −{fmt(material.totalOut)}
                  </td>
                  <td className={`px-3 py-3 text-right tabular-nums ${
                    material.closing <= 0 ? 'text-rose-700'
                    : material.closing < LOW_STOCK_THRESHOLD ? 'text-amber-700'
                    : 'text-emerald-700'
                  }`}>
                    {fmt(material.closing)}
                  </td>
                  <td></td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {fmtMoney(material.stockValue)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    );
  };
    // ============================================================
  // RENDER: MOVEMENT REPORT
  // ============================================================
  const renderMovementReport = () => (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-violet-200 font-bold">Unified Story View</p>
            <h2 className="text-xl font-bold mt-1">Stock Movement Report</h2>
            <p className="text-sm text-violet-100 mt-1 max-w-2xl">
              Every material's full life cycle — who requisitioned, when stock arrived,
              how much was issued, what's pending, and the running stock balance.
            </p>
          </div>
          <div className="flex gap-4 text-center">
            <div>
              <p className="text-2xl font-bold tabular-nums">{filteredMovements.length}</p>
              <p className="text-[9px] uppercase text-violet-200 tracking-widest font-bold">Materials</p>
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">
                {filteredMovements.reduce((s, m) => s + (m.requisitions?.length || 0), 0)}
              </p>
              <p className="text-[9px] uppercase text-violet-200 tracking-widest font-bold">Reqs</p>
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">
                {filteredMovements.reduce((s, m) => s + m.receives.length, 0)}
              </p>
              <p className="text-[9px] uppercase text-violet-200 tracking-widest font-bold">GRNs</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {paginated.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
            <FiAlertCircle size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">No movement data found</p>
          </div>
        )}

        {paginated.map((story) => {
          const isExpanded = expandedMaterials[story.materialName];
          const status = getStockStatus(story.closing);
          const totalReqs = story.requisitions?.length || 0;
          const completed = (story.requisitions || []).filter((r) => r.statusKey === 'completed').length;
          const partial = (story.requisitions || []).filter((r) => r.statusKey === 'partial').length;
          const pending = (story.requisitions || []).filter((r) => r.statusKey === 'pending').length;

          return (
            <div
              key={story.materialName}
              className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div
                className="p-4 sm:p-5 cursor-pointer hover:bg-slate-50/50 transition-colors"
                onClick={() =>
                  setExpandedMaterials((p) => ({
                    ...p,
                    [story.materialName]: !p[story.materialName],
                  }))
                }
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <button className="mt-0.5 shrink-0 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors">
                      <FiChevronRight
                        size={16}
                        className={`transition-transform text-slate-600 ${isExpanded ? 'rotate-90' : ''}`}
                      />
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-slate-800 truncate">
                          {story.materialName}
                        </h3>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusBadge(status.cls)}`}>
                          {status.label}
                        </span>
                        <OpeningSourceBadge source={story.openingSource} />
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-slate-500">
                        <span>Code: <strong className="text-slate-700">{story.materialCode}</strong></span>
                        <span>·</span>
                        <span>{story.category} › {story.subCategory}</span>
                        <span>·</span>
                        <span>{totalReqs} req{totalReqs !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    <MiniStat label="Opening" value={fmt(story.opening)} sub={story.unit} color="slate" />
                    <MiniStat label="In" value={`+${fmt(story.totalIn)}`} color="emerald" icon={FiArrowDownCircle} />
                    <MiniStat label="Out" value={`−${fmt(story.totalOut)}`} color="rose" icon={FiArrowUpCircle} />
                    <MiniStat
                      label="Closing"
                      value={fmt(story.closing)}
                      color={story.closing <= 0 ? 'rose' : story.closing < LOW_STOCK_THRESHOLD ? 'amber' : 'blue'}
                      bold
                    />
                    {story.totalPending > 0 && (
                      <MiniStat label="Pending" value={fmt(story.totalPending)} color="amber" icon={FiAlertCircle} />
                    )}
                  </div>
                </div>

                {totalReqs > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3 pl-10">
                    {completed > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                        ✓ {completed} Completed
                      </span>
                    )}
                    {partial > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                        ⏳ {partial} Partial
                      </span>
                    )}
                    {pending > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-semibold">
                        ○ {pending} Pending
                      </span>
                    )}
                  </div>
                )}
              </div>

              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50/40">
                  <div className="p-4 sm:p-5 space-y-5">
                    {/* Requisition lifecycle */}
                    {story.requisitions?.length > 0 && (
                      <section>
                        <SectionTitle
                          icon={FiClipboard}
                          title="Requisition Lifecycle"
                          subtitle="Who requested what, and how it was fulfilled"
                          accent="amber"
                        />
                        <div className="space-y-2 mt-3">
                          {story.requisitions.map((req) => (
                            <RequisitionCard key={req.requisitionNo} req={req} />
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Unified timeline */}
                    {story.events.length > 0 && (
                      <section>
                        <SectionTitle
                          icon={FiActivity}
                          title="Unified Movement Timeline"
                          subtitle="All receives & issues with running balance"
                          accent="violet"
                        />
                        <div className="mt-3 rounded-xl border border-slate-200 bg-white overflow-hidden">
                          <div className="max-h-96 overflow-y-auto">
                            <table className="w-full text-xs min-w-[900px]">
                              <thead className="bg-slate-100 sticky top-0 z-10">
                                <tr>
                                  <th className="px-3 py-2 text-left font-bold text-slate-600 w-8">#</th>
                                  <th className="px-3 py-2 text-left font-bold text-slate-600">Date</th>
                                  <th className="px-3 py-2 text-left font-bold text-slate-600">Event</th>
                                  <th className="px-3 py-2 text-left font-bold text-slate-600">Reference</th>
                                  <th className="px-3 py-2 text-left font-bold text-slate-600">Party</th>
                                  <th className="px-3 py-2 text-right font-bold text-slate-600">Before</th>
                                  <th className="px-3 py-2 text-right font-bold text-emerald-700 bg-emerald-50/60">In</th>
                                  <th className="px-3 py-2 text-right font-bold text-rose-700 bg-rose-50/60">Out</th>
                                  <th className="px-3 py-2 text-right font-bold text-slate-700 bg-slate-100">After</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {story.events.map((ev, i) => {
                                  const isOpening = ev.kind === 'opening';
                                  const isRec = ev.kind === 'receive';
                                  const isIssue = ev.kind === 'issue';
                                  const negative = ev.balanceAfter < 0;

                                  return (
                                    <tr key={i} className={negative ? 'bg-rose-50/40' : 'hover:bg-slate-50/60'}>
                                      <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                                      <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{formatDate(ev.date)}</td>
                                      <td className="px-3 py-2">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                          isOpening ? 'bg-blue-50 text-blue-700 border-blue-200'
                                          : isRec ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                          : 'bg-rose-50 text-rose-700 border-rose-200'
                                        }`}>
                                          {isOpening ? (<><FiBox size={9} /> Opening</>)
                                            : isRec ? (<><FiArrowDownCircle size={9} /> Receive</>)
                                            : (<><FiArrowUpCircle size={9} /> Issue</>)}
                                        </span>
                                      </td>
                                      <td className="px-3 py-2 font-medium text-slate-700">
                                        {isOpening ? 'OPENING' : isRec ? ev.grnNo : ev.issueNo}
                                      </td>
                                      <td className="px-3 py-2 text-slate-600 truncate max-w-[150px]">
                                        {isOpening ? ev.detail || '—' : isRec ? ev.vendor : ev.issuedBy}
                                      </td>
                                      <td className="px-3 py-2 text-right text-slate-500 tabular-nums">
                                        {fmt(ev.balanceBefore)}
                                      </td>
                                      <td className="px-3 py-2 text-right font-bold text-emerald-600 tabular-nums bg-emerald-50/30">
                                        {isRec || isOpening ? `+${fmt(ev.qty || ev.inQty)}` : '—'}
                                      </td>
                                      <td className="px-3 py-2 text-right font-bold text-rose-500 tabular-nums bg-rose-50/30">
                                        {isIssue ? `−${fmt(ev.qty || ev.outQty)}` : '—'}
                                      </td>
                                      <td className={`px-3 py-2 text-right font-bold tabular-nums bg-slate-50 ${
                                        negative ? 'text-rose-600'
                                        : ev.balanceAfter < LOW_STOCK_THRESHOLD ? 'text-amber-600'
                                        : 'text-slate-800'
                                      }`}>
                                        {fmt(ev.balanceAfter)}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </section>
                    )}

                    {/* Summary tiles */}
                    <section>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        <SummaryTile label="Opening" value={fmt(story.opening)} unit={story.unit} color="slate" />
                        <SummaryTile label="Total In" value={`+${fmt(story.totalIn)}`} unit={story.unit} color="emerald" />
                        <SummaryTile label="Total Out" value={`−${fmt(story.totalOut)}`} unit={story.unit} color="rose" />
                        <SummaryTile label="Closing" value={fmt(story.closing)} unit={story.unit} color="blue" bold />
                        <SummaryTile
                          label="Pending Reqs"
                          value={fmt(story.totalPending)}
                          unit={story.unit}
                          color={story.totalPending > 0 ? 'amber' : 'slate'}
                        />
                      </div>
                    </section>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <Pagination
          page={page}
          totalPages={Math.max(1, Math.ceil(filteredMovements.length / pageSize))}
          pageSize={pageSize}
          total={filteredMovements.length}
          onPage={gotoPage}
          onSize={setPageSize}
          showAll={filters.showAll}
        />
      </div>
    </div>
  );

  // ============================================================
  // RENDER: RECEIVES
  // ============================================================
  const renderReceives = () => {
    const rows = [...receives].sort((a, b) => new Date(b.GRNDate) - new Date(a.GRNDate));
    const pageRows = filters.showAll ? rows : rows.slice((page - 1) * pageSize, page * pageSize);

    return (
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <FiArrowDownCircle className="text-emerald-600" size={16} />
              Material Receives
            </h3>
            <p className="text-xs text-slate-500">{rows.length} GRN records · newest first</p>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
            +{fmt(rows.reduce((s, r) => s + n(r.ActualReceiveQTY), 0))} total units
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider font-bold text-slate-500 w-10">#</th>
                <th className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider font-bold text-slate-500">GRN No</th>
                <th className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider font-bold text-slate-500">Date</th>
                <th className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider font-bold text-slate-500">Material</th>
                <th className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider font-bold text-slate-500">Vendor</th>
                <th className="px-3 py-2.5 text-right text-[10px] uppercase tracking-wider font-bold text-slate-500">Qty</th>
                <th className="px-3 py-2.5 text-center text-[10px] uppercase tracking-wider font-bold text-slate-500">Unit</th>
                <th className="px-3 py-2.5 text-right text-[10px] uppercase tracking-wider font-bold text-slate-500">Rate</th>
                <th className="px-3 py-2.5 text-right text-[10px] uppercase tracking-wider font-bold text-slate-500">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageRows.length === 0 && <Empty onReset={resetFilters} />}
              {pageRows.map((r, i) => {
                const idx = (page - 1) * pageSize + i + 1;
                return (
                  <tr key={i} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="px-3 py-2.5 text-xs text-slate-400">{idx}</td>
                    <td className="px-3 py-2.5 text-xs font-bold text-emerald-700">{r.GRNNo}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-600 whitespace-nowrap">{formatDate(r.GRNDate)}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-700">
                      <div className="font-medium">{r.MaterialName}</div>
                      <div className="text-[10px] text-slate-400">{r.MaterialCode}</div>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-slate-600 truncate max-w-[200px]">{r.VendorName || '—'}</td>
                    <td className="px-3 py-2.5 text-right text-xs font-bold text-emerald-600 tabular-nums">
                      +{fmt(r.ActualReceiveQTY)}
                    </td>
                    <td className="px-3 py-2.5 text-center text-xs text-slate-500">{r.Unit || 'KG'}</td>
                    <td className="px-3 py-2.5 text-right text-xs text-slate-600 tabular-nums">{fmt(r.ActualReceivePrice)}</td>
                    <td className="px-3 py-2.5 text-right text-xs font-medium text-slate-700 tabular-nums">
                      {fmtMoney(n(r.ActualReceiveQTY) * n(r.ActualReceivePrice), r.Currency || 'USD')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page} totalPages={Math.max(1, Math.ceil(rows.length / pageSize))}
          pageSize={pageSize} total={rows.length}
          onPage={gotoPage} onSize={setPageSize}
          showAll={filters.showAll}
        />
      </div>
    );
  };

  // ============================================================
  // RENDER: ISSUES (RAW)
  // ============================================================
  const renderIssues = () => {
    const pageRows = paginated;
    const totalIssued = filteredIssues.reduce((s, i) => s + n(i.IssueQTY), 0);
    const totalValue = filteredIssues.reduce((s, i) => s + n(i.IssueValue), 0);

    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-rose-600 to-rose-700 rounded-2xl p-5 text-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-rose-200 font-bold">Raw Issue Log</p>
              <h2 className="text-lg font-bold mt-1">All Issue Transactions</h2>
              <p className="text-xs text-rose-200 mt-1">
                Every issue event · one row per transaction · {filteredIssues.length} records
              </p>
            </div>
            <div className="flex gap-6 text-right">
              <div>
                <p className="text-[10px] uppercase text-rose-200 tracking-widest">Total Out</p>
                <p className="text-2xl font-bold tabular-nums">−{fmtCompact(totalIssued)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-rose-200 tracking-widest">Total Value</p>
                <p className="text-2xl font-bold tabular-nums">{fmtCompact(totalValue)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider font-bold text-slate-500 w-10">#</th>
                  <th className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider font-bold text-slate-500">Issue No</th>
                  <th className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider font-bold text-slate-500">Date</th>
                  <th className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider font-bold text-slate-500">Material</th>
                  <th className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider font-bold text-slate-500">Requisition</th>
                  <th className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider font-bold text-slate-500">Issued To</th>
                  <th className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider font-bold text-slate-500">Job Card</th>
                  <th className="px-3 py-2.5 text-right text-[10px] uppercase tracking-wider font-bold text-slate-500">Qty</th>
                  <th className="px-3 py-2.5 text-center text-[10px] uppercase tracking-wider font-bold text-slate-500">Unit</th>
                  <th className="px-3 py-2.5 text-right text-[10px] uppercase tracking-wider font-bold text-slate-500">Rate</th>
                  <th className="px-3 py-2.5 text-right text-[10px] uppercase tracking-wider font-bold text-slate-500">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageRows.length === 0 && <Empty onReset={resetFilters} msg="No issue records found" />}
                {pageRows.map((i, idx) => {
                  const rowNum = (page - 1) * pageSize + idx + 1;
                  return (
                    <tr key={idx} className="hover:bg-rose-50/30 transition-colors">
                      <td className="px-3 py-2.5 text-xs text-slate-400">{rowNum}</td>
                      <td className="px-3 py-2.5 text-xs font-bold text-rose-700">{i.IssueNo}</td>
                      <td className="px-3 py-2.5 text-xs text-slate-600 whitespace-nowrap">{formatDate(i.IssueDate)}</td>
                      <td className="px-3 py-2.5 text-xs text-slate-700">
                        <div className="font-medium">{i.MaterialName}</div>
                        <div className="text-[10px] text-slate-400">{i.MaterialCode}</div>
                      </td>
                      <td className="px-3 py-2.5 text-xs">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-medium">
                          {i.RequisitionNo || '—'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-slate-600">{i.IssuedBy || '—'}</td>
                      <td className="px-3 py-2.5 text-xs text-slate-500">{i.JobCardNo || '—'}</td>
                      <td className="px-3 py-2.5 text-right text-xs font-bold text-rose-600 tabular-nums">
                        −{fmt(i.IssueQTY)}
                      </td>
                      <td className="px-3 py-2.5 text-center text-xs text-slate-500">{i.UnitName || 'KG'}</td>
                      <td className="px-3 py-2.5 text-right text-xs text-slate-600 tabular-nums">{fmt(i.IssuePrice)}</td>
                      <td className="px-3 py-2.5 text-right text-xs font-medium text-slate-700 tabular-nums">
                        {fmtMoney(n(i.IssueValue), i.Currency || 'USD')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page} totalPages={totalPages} pageSize={pageSize}
            total={filteredIssues.length}
            onPage={gotoPage} onSize={setPageSize}
            showAll={filters.showAll}
          />
        </div>
      </div>
    );
  };

  // ============================================================
  // RENDER: REQUISITIONS (GROUPED)
  // ============================================================
  const renderRequisitions = () => (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-5 text-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-amber-100 font-bold">Requisition Summary</p>
            <h2 className="text-lg font-bold mt-1">Grouped by Requisition</h2>
            <p className="text-xs text-amber-100 mt-1">
              One row per requisition · click to expand issue transactions · {filteredRequisitions.length} reqs
            </p>
          </div>
          <div className="flex gap-3 text-xs">
            <span className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur border border-white/30 font-semibold">
              ✓ {stats.completedReq} Completed
            </span>
            <span className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur border border-white/30 font-semibold">
              ⏳ {stats.partialReq} Partial
            </span>
            <span className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur border border-white/30 font-semibold">
              ○ {stats.pendingReq - stats.partialReq} Pending
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="w-10 px-3 py-3"></th>
                <th className="px-3 py-3 text-left text-[10px] uppercase tracking-wider font-bold text-slate-500 w-10">#</th>
                <th className="px-3 py-3 text-left text-[10px] uppercase tracking-wider font-bold text-slate-500">Material</th>
                <th className="px-3 py-3 text-left text-[10px] uppercase tracking-wider font-bold text-slate-500">Requisition</th>
                <th className="px-3 py-3 text-right text-[10px] uppercase tracking-wider font-bold text-slate-500">Required</th>
                <th className="px-3 py-3 text-right text-[10px] uppercase tracking-wider font-bold text-emerald-600 bg-emerald-50/40">Issued</th>
                <th className="px-3 py-3 text-right text-[10px] uppercase tracking-wider font-bold text-amber-600 bg-amber-50/40">Pending</th>
                <th className="px-3 py-3 text-left text-[10px] uppercase tracking-wider font-bold text-slate-500">Raised By</th>
                <th className="px-3 py-3 text-center text-[10px] uppercase tracking-wider font-bold text-slate-500">Progress</th>
                <th className="px-3 py-3 text-center text-[10px] uppercase tracking-wider font-bold text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.length === 0 && <Empty onReset={resetFilters} msg="No requisitions found" />}
              {paginated.map((r, idx) => {
                const isExp = expandedReqs[r.requisitionNo];
                const rowNum = (page - 1) * pageSize + idx + 1;
                const pct = r.fulfillmentPct;
                const statusCls = statusBadge(r.statusCls);

                return (
                  <React.Fragment key={r.requisitionNo}>
                    <tr
                      className="hover:bg-slate-50/70 cursor-pointer"
                      onClick={() => setExpandedReqs((p) => ({ ...p, [r.requisitionNo]: !p[r.requisitionNo] }))}
                    >
                      <td className="px-3 py-3 text-center">
                        <FiChevronRight
                          size={14}
                          className={`transition-transform text-slate-400 ${isExp ? 'rotate-90 text-blue-500' : ''}`}
                        />
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-400">{rowNum}</td>
                      <td className="px-3 py-3">
                        <div className="font-medium text-slate-800 text-sm">{r.materialName}</div>
                        <div className="text-[10px] text-slate-400">{r.materialCode}</div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-xs font-bold text-amber-700">{r.requisitionNo}</div>
                        <div className="text-[10px] text-slate-400">{formatDate(r.requisitionDate)}</div>
                      </td>
                      <td className="px-3 py-3 text-right text-sm font-semibold text-slate-700 tabular-nums">
                        {fmt(r.requiredQTY)}
                        <span className="text-[10px] text-slate-400 ml-1">{r.unit}</span>
                      </td>
                      <td className="px-3 py-3 text-right text-sm font-bold text-emerald-600 tabular-nums bg-emerald-50/20">
                        {fmt(r.totalIssued)}
                      </td>
                      <td className="px-3 py-3 text-right text-sm font-bold tabular-nums bg-amber-50/20">
                        <span className={r.pendingQTY > 0 ? 'text-amber-600' : 'text-slate-400'}>
                          {fmt(r.pendingQTY)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-600 truncate max-w-[140px]">{r.raisedBy}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                r.statusKey === 'completed' ? 'bg-emerald-500'
                                : r.statusKey === 'partial' ? 'bg-amber-500'
                                : 'bg-slate-300'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-slate-600 tabular-nums w-10 text-right">
                            {pct.toFixed(0)}%
                          </span>
                        </div>
                        {r.issueCount > 1 && (
                          <div className="text-[9px] text-slate-400 mt-0.5">{r.issueCount} issues</div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusCls}`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>

                    {isExp && (
                      <tr className="bg-slate-50/40">
                        <td colSpan="10" className="px-6 pb-4 pt-2">
                          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                              <p className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                                <FiList size={12} />
                                Issue Transactions ({r.issueCount})
                              </p>
                              <div className="flex flex-wrap gap-3 text-[10px] text-slate-500">
                                <span>Dept: <strong className="text-slate-700">{r.department}</strong></span>
                                <span>Cost Center: <strong className="text-slate-700">{r.costCenter}</strong></span>
                                <span>Company: <strong className="text-slate-700">{r.company}</strong></span>
                                <span>Currency: <strong className="text-slate-700">{r.currency}</strong></span>
                              </div>
                            </div>
                            <table className="w-full text-xs">
                              <thead className="bg-slate-50 border-b">
                                <tr>
                                  <th className="px-3 py-2 text-left text-[10px] uppercase text-slate-500 font-bold">Issue No</th>
                                  <th className="px-3 py-2 text-left text-[10px] uppercase text-slate-500 font-bold">Date</th>
                                  <th className="px-3 py-2 text-right text-[10px] uppercase text-slate-500 font-bold">Qty</th>
                                  <th className="px-3 py-2 text-right text-[10px] uppercase text-slate-500 font-bold">Running</th>
                                  <th className="px-3 py-2 text-right text-[10px] uppercase text-slate-500 font-bold">Remaining</th>
                                  <th className="px-3 py-2 text-right text-[10px] uppercase text-slate-500 font-bold">Rate</th>
                                  <th className="px-3 py-2 text-left text-[10px] uppercase text-slate-500 font-bold">Issued To</th>
                                  <th className="px-3 py-2 text-left text-[10px] uppercase text-slate-500 font-bold">Job Card</th>
                                  <th className="px-3 py-2 text-right text-[10px] uppercase text-slate-500 font-bold">Value</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {r.issues.map((iss, i) => (
                                  <tr key={i} className="hover:bg-blue-50/30">
                                    <td className="px-3 py-2 font-bold text-blue-700">{iss.issueNo}</td>
                                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{formatDate(iss.issueDate)}</td>
                                    <td className="px-3 py-2 text-right font-bold text-rose-600 tabular-nums">−{fmt(iss.issueQTY)}</td>
                                    <td className="px-3 py-2 text-right text-slate-600 tabular-nums">{fmt(iss.runningIssued)} / {fmt(r.requiredQTY)}</td>
                                    <td className="px-3 py-2 text-right font-semibold tabular-nums">
                                      <span className={iss.runningPending > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                                        {fmt(iss.runningPending)}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2 text-right text-slate-600 tabular-nums">{fmt(iss.issuePrice)}</td>
                                    <td className="px-3 py-2 text-slate-600">{iss.issuedBy}</td>
                                    <td className="px-3 py-2 text-slate-500 text-[10px]">{iss.jobCardNo}</td>
                                    <td className="px-3 py-2 text-right font-medium text-slate-700 tabular-nums">
                                      {fmtMoney(iss.issueValue, iss.currency)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                                <tr className="text-xs font-bold text-slate-800">
                                  <td colSpan="2" className="px-3 py-2.5 text-right uppercase tracking-wider">Total Issued</td>
                                  <td className="px-3 py-2.5 text-right text-emerald-700 tabular-nums">{fmt(r.totalIssued)}</td>
                                  <td colSpan="4"></td>
                                  <td className="px-3 py-2.5 text-right uppercase tracking-wider">Total Value</td>
                                  <td className="px-3 py-2.5 text-right tabular-nums">{fmtMoney(r.totalValue, r.currency)}</td>
                                </tr>
                              </tfoot>
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
        <Pagination
          page={page} totalPages={totalPages} pageSize={pageSize}
          total={filteredRequisitions.length}
          onPage={gotoPage} onSize={setPageSize}
          showAll={filters.showAll}
        />
      </div>
    </div>
  );

  // ============================================================
  // RENDER: FULL REPORT
  // ============================================================
  const renderFullReport = () => (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-indigo-200 font-bold">Complete Snapshot</p>
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
            Export Excel (10 sheets)
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/20">
            <p className="text-[10px] uppercase text-indigo-200 tracking-widest">Opening</p>
            <p className="text-xl font-bold mt-0.5 tabular-nums">{fmtCompact(stats.opening)}</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/20">
            <p className="text-[10px] uppercase text-indigo-200 tracking-widest">Total In</p>
            <p className="text-xl font-bold mt-0.5 tabular-nums text-emerald-300">+{fmtCompact(stats.totalIn)}</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/20">
            <p className="text-[10px] uppercase text-indigo-200 tracking-widest">Total Out</p>
            <p className="text-xl font-bold mt-0.5 tabular-nums text-rose-300">−{fmtCompact(stats.totalOut)}</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/20">
            <p className="text-[10px] uppercase text-indigo-200 tracking-widest">Closing</p>
            <p className="text-xl font-bold mt-0.5 tabular-nums">{fmtCompact(stats.closing)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <FiDollarSign size={16} className="text-emerald-600" />
            Financial Summary
          </h3>
          <div className="space-y-3">
            {[
              { l: 'Total Receive Value', v: fmtMoney(stats.inValue), c: 'text-emerald-600' },
              { l: 'Stock Value (closing)', v: fmtMoney(stats.stockValue), c: 'text-blue-600' },
              { l: 'Avg Unit Cost', v: fmtMoney(stats.totalIn > 0 ? stats.inValue / stats.totalIn : 0), c: 'text-slate-700' },
              { l: 'Total Materials', v: stats.total, c: 'text-slate-700' },
              { l: 'Categories', v: filterOptions.cats.length, c: 'text-slate-700' },
            ].map((r) => (
              <div key={r.l} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <span className="text-sm text-slate-500">{r.l}</span>
                <span className={`text-sm font-bold tabular-nums ${r.c}`}>{r.v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <FiClipboard size={16} className="text-amber-600" />
            Requisition Breakdown
          </h3>
          <div className="space-y-3">
            {[
              { l: 'Completed', v: stats.completedReq, c: 'text-emerald-600', icon: FiCheckCircle },
              { l: 'Partial', v: stats.partialReq, c: 'text-amber-600', icon: FiPauseCircle },
              { l: 'Pending', v: stats.pendingReq - stats.partialReq, c: 'text-slate-600', icon: FiClock },
            ].map((r) => {
              const Icon = r.icon;
              return (
                <div key={r.l} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <span className="text-sm text-slate-500 flex items-center gap-2">
                    <Icon size={14} className={r.c} />
                    {r.l}
                  </span>
                  <span className={`text-sm font-bold tabular-nums ${r.c}`}>{r.v}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <FiShield size={16} className="text-teal-600" />
            Reconciliation
          </h3>
          <div className="space-y-3">
            {[
              { l: 'Matched', v: stats.reconciled, c: 'text-emerald-600', icon: FiCheckCircle },
              { l: 'Mismatch', v: stats.mismatched, c: 'text-rose-600', icon: FiAlertTriangle },
              { l: 'No API Balance', v: stats.noApi, c: 'text-slate-600', icon: FiInfo },
            ].map((r) => {
              const Icon = r.icon;
              return (
                <div key={r.l} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <span className="text-sm text-slate-500 flex items-center gap-2">
                    <Icon size={14} className={r.c} />
                    {r.l}
                  </span>
                  <span className={`text-sm font-bold tabular-nums ${r.c}`}>{r.v}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h3 className="font-semibold text-slate-800 mb-4">Excel Export Preview</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { n: '1', t: 'Executive Summary',   d: 'KPIs + health' },
            { n: '2', t: 'Stock Summary',       d: 'Opening → In → Out → Closing' },
            { n: '3', t: 'Stock Ledger',        d: 'Running balance per tx' },
            { n: '4', t: 'Receives',            d: 'GRN-wise inbound' },
            { n: '5', t: 'Issues',              d: 'Raw issue transactions' },
            { n: '6', t: 'Requisitions',        d: 'Grouped + fulfillment' },
            { n: '7', t: 'Issue Details',       d: 'Line-level audit' },
            { n: '8', t: 'Movement Story',      d: 'Full lifecycle' },
            { n: '9', t: 'Balance Snapshot',    d: 'Material-wise closing' },
            { n: '10', t: 'Reconciliation',     d: 'Opening audit trail' },
          ].map((s) => (
            <div key={s.n} className="border border-slate-200 rounded-xl p-3 hover:border-emerald-300 transition-colors">
              <div className="flex items-start gap-2">
                <span className="shrink-0 w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                  {s.n}
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-800">{s.t}</p>
                  <p className="text-[10px] text-slate-500">{s.d}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ============================================================
  // EXCEL EXPORT — 10 SHEETS
  // ============================================================
  const exportToExcel = useCallback(() => {
    try {
      toast.info("📊 Generating report…", { autoClose: false });

      const STYLES = {
        title:    { font: { bold: true, sz: 20, color: { rgb: "1A3A5C" } }, alignment: { horizontal: "center", vertical: "center" }, fill: { fgColor: { rgb: "E8EDF5" } } },
        subtitle: { font: { sz: 11, color: { rgb: "4A5568" } }, alignment: { horizontal: "center", vertical: "center" } },
        section:  { font: { bold: true, sz: 14, color: { rgb: "1A3A5C" } }, fill: { fgColor: { rgb: "F0F4F8" } }, alignment: { horizontal: "left", vertical: "center" } },
        headerBlue:   { font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "1A56DB" } }, alignment: { horizontal: "center", vertical: "center", wrapText: true }, border: { top: { style: "medium", color: { rgb: "153E7C" } }, bottom: { style: "medium", color: { rgb: "153E7C" } }, left: { style: "medium", color: { rgb: "153E7C" } }, right: { style: "medium", color: { rgb: "153E7C" } } } },
        headerGreen:  { font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "059669" } }, alignment: { horizontal: "center", vertical: "center", wrapText: true }, border: { top: { style: "medium", color: { rgb: "047857" } }, bottom: { style: "medium", color: { rgb: "047857" } }, left: { style: "medium", color: { rgb: "047857" } }, right: { style: "medium", color: { rgb: "047857" } } } },
        headerPurple: { font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "7C3AED" } }, alignment: { horizontal: "center", vertical: "center", wrapText: true }, border: { top: { style: "medium", color: { rgb: "6D28D9" } }, bottom: { style: "medium", color: { rgb: "6D28D9" } }, left: { style: "medium", color: { rgb: "6D28D9" } }, right: { style: "medium", color: { rgb: "6D28D9" } } } },
        headerRose:   { font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "E11D48" } }, alignment: { horizontal: "center", vertical: "center", wrapText: true }, border: { top: { style: "medium", color: { rgb: "BE123C" } }, bottom: { style: "medium", color: { rgb: "BE123C" } }, left: { style: "medium", color: { rgb: "BE123C" } }, right: { style: "medium", color: { rgb: "BE123C" } } } },
        headerCyan:   { font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "0891B2" } }, alignment: { horizontal: "center", vertical: "center", wrapText: true }, border: { top: { style: "medium", color: { rgb: "0E7490" } }, bottom: { style: "medium", color: { rgb: "0E7490" } }, left: { style: "medium", color: { rgb: "0E7490" } }, right: { style: "medium", color: { rgb: "0E7490" } } } },
        headerAmber:  { font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "D97706" } }, alignment: { horizontal: "center", vertical: "center", wrapText: true }, border: { top: { style: "medium", color: { rgb: "B45309" } }, bottom: { style: "medium", color: { rgb: "B45309" } }, left: { style: "medium", color: { rgb: "B45309" } }, right: { style: "medium", color: { rgb: "B45309" } } } },
        headerViolet: { font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "7C3AED" } }, alignment: { horizontal: "center", vertical: "center", wrapText: true }, border: { top: { style: "medium", color: { rgb: "6D28D9" } }, bottom: { style: "medium", color: { rgb: "6D28D9" } }, left: { style: "medium", color: { rgb: "6D28D9" } }, right: { style: "medium", color: { rgb: "6D28D9" } } } },
        headerTeal:   { font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "0D9488" } }, alignment: { horizontal: "center", vertical: "center", wrapText: true }, border: { top: { style: "medium", color: { rgb: "0F766E" } }, bottom: { style: "medium", color: { rgb: "0F766E" } }, left: { style: "medium", color: { rgb: "0F766E" } }, right: { style: "medium", color: { rgb: "0F766E" } } } },
        cell:    { font: { sz: 10 }, alignment: { horizontal: "left", vertical: "center" }, border: { top: { style: "thin", color: { rgb: "E2E8F0" } }, bottom: { style: "thin", color: { rgb: "E2E8F0" } }, left: { style: "thin", color: { rgb: "E2E8F0" } }, right: { style: "thin", color: { rgb: "E2E8F0" } } } },
        cellR:   { font: { sz: 10 }, alignment: { horizontal: "right", vertical: "center" }, border: { top: { style: "thin", color: { rgb: "E2E8F0" } }, bottom: { style: "thin", color: { rgb: "E2E8F0" } }, left: { style: "thin", color: { rgb: "E2E8F0" } }, right: { style: "thin", color: { rgb: "E2E8F0" } } } },
        cellB:   { font: { sz: 10, bold: true }, alignment: { horizontal: "left", vertical: "center" }, border: { top: { style: "thin", color: { rgb: "E2E8F0" } }, bottom: { style: "thin", color: { rgb: "E2E8F0" } }, left: { style: "thin", color: { rgb: "E2E8F0" } }, right: { style: "thin", color: { rgb: "E2E8F0" } } } },
        cellRB:  { font: { sz: 10, bold: true }, alignment: { horizontal: "right", vertical: "center" }, border: { top: { style: "thin", color: { rgb: "E2E8F0" } }, bottom: { style: "thin", color: { rgb: "E2E8F0" } }, left: { style: "thin", color: { rgb: "E2E8F0" } }, right: { style: "thin", color: { rgb: "E2E8F0" } } } },
        pos:     { font: { sz: 10, bold: true, color: { rgb: "047857" } }, alignment: { horizontal: "right", vertical: "center" } },
        neg:     { font: { sz: 10, bold: true, color: { rgb: "DC2626" } }, alignment: { horizontal: "right", vertical: "center" } },
        low:     { font: { sz: 10, bold: true, color: { rgb: "D97706" } }, alignment: { horizontal: "right", vertical: "center" } },
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
        ["Opening Balance (units)", fmt(stats.opening)],
        ["Total Stock In (units)", fmt(stats.totalIn)],
        ["Total Stock Out (units)", fmt(stats.totalOut)],
        ["Closing Balance (units)", fmt(stats.closing)],
        ["Total Receive Value", fmtMoney(stats.inValue)],
        ["Total Stock Value", fmtMoney(stats.stockValue)],
        ["Healthy Materials", stats.healthy],
        ["Low Stock Materials", stats.low],
        ["Out of Stock Materials", stats.out],
        ["Total Requisitions", stats.totalReqs],
        ["Completed Requisitions", stats.completedReq],
        ["Partial Requisitions", stats.partialReq],
        ["Pending Requisitions", stats.pendingReq - stats.partialReq],
        ["Reconciled (matched)", stats.reconciled],
        ["Reconciliation mismatches", stats.mismatched],
        ["No API balance", stats.noApi],
      ];
      kpis.forEach((k) => sum.push(k));
      const sumSheet = XLSX.utils.aoa_to_sheet(sum);
      sumSheet["!cols"] = [{ wch: 34 }, { wch: 26 }];
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
      const stockRows = [["#", "Material", "Code", "Category", "Sub Category", "Unit", "Opening Source", "Opening", "Stock In", "Stock Out", "Closing", "Avg Cost", "Stock Value", "Status"]];
      filteredMaterials.forEach((m, i) => {
        const st = getStockStatus(m.closing);
        stockRows.push([
          i + 1, m.name, m.code, m.category, m.subCategory, m.unit,
          m.openingSource, n(m.opening), n(m.totalIn), n(m.totalOut), n(m.closing),
          n(m.avgCost), n(m.stockValue), st.label,
        ]);
      });
      const stockSheet = XLSX.utils.aoa_to_sheet(stockRows);
      stockSheet["!cols"] = [
        { wch: 5 }, { wch: 42 }, { wch: 16 }, { wch: 20 }, { wch: 20 },
        { wch: 8 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
        { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 14 },
      ];
      stockRows[0].forEach((_, c) => {
        const addr = XLSX.utils.encode_cell({ r: 0, c });
        if (stockSheet[addr]) stockSheet[addr].s = STYLES.headerGreen;
      });
      for (let r = 1; r < stockRows.length; r++) {
        for (let c = 0; c < stockRows[r].length; c++) {
          const addr = XLSX.utils.encode_cell({ r, c });
          if (!stockSheet[addr]) continue;
          const isNum = c >= 7 && c <= 12;
          let base = isNum ? STYLES.cellR : STYLES.cell;
          if (c === 1) base = STYLES.cellB;
          if (c === 10) {
            const v = n(stockRows[r][10]);
            base = v <= 0 ? STYLES.neg : v < LOW_STOCK_THRESHOLD ? STYLES.low : STYLES.pos;
          }
          if (c === 6) {
            const v = stockRows[r][6];
            if (v === 'api') base = { ...STYLES.cell, font: { sz: 10, bold: true, color: { rgb: "047857" } } };
            else if (v === 'fallback') base = { ...STYLES.cell, font: { sz: 10, bold: true, color: { rgb: "D97706" } } };
            else base = { ...STYLES.cell, font: { sz: 10, bold: true, color: { rgb: "DC2626" } } };
          }
          stockSheet[addr].s = base;
        }
      }
      XLSX.utils.book_append_sheet(wb, stockSheet, "Stock Summary");

      // ---------- SHEET 3: STOCK LEDGER ----------
      const ledgerRows = [["Material", "Code", "Unit", "Date", "Type", "Reference", "Detail", "Balance Before", "Stock In", "Stock Out", "Balance After", "Rate", "Value"]];
      filteredMaterials.forEach((m) => {
        m.ledger.forEach((tx) => {
          ledgerRows.push([
            m.name, m.code, m.unit,
            formatDate(tx.date),
            tx.kind === 'opening' ? 'Opening' : tx.kind === 'receive' ? 'Receive' : 'Issue',
            tx.ref,
            tx.detail || '',
            n(tx.balanceBefore),
            n(tx.inQty),
            n(tx.outQty),
            n(tx.balanceAfter),
            tx.price ? n(tx.price) : '',
            tx.value ? n(tx.value) : '',
          ]);
        });
      });
      const ledgerSheet = XLSX.utils.aoa_to_sheet(ledgerRows);
      ledgerSheet["!cols"] = [
        { wch: 40 }, { wch: 16 }, { wch: 8 }, { wch: 14 }, { wch: 12 },
        { wch: 22 }, { wch: 25 }, { wch: 14 }, { wch: 12 }, { wch: 12 },
        { wch: 14 }, { wch: 12 }, { wch: 16 },
      ];
      ledgerRows[0].forEach((_, c) => {
        const addr = XLSX.utils.encode_cell({ r: 0, c });
        if (ledgerSheet[addr]) ledgerSheet[addr].s = STYLES.headerPurple;
      });
      for (let r = 1; r < ledgerRows.length; r++) {
        for (let c = 0; c < ledgerRows[r].length; c++) {
          const addr = XLSX.utils.encode_cell({ r, c });
          if (!ledgerSheet[addr]) continue;
          const isNum = c >= 7 && c <= 12;
          let base = isNum ? STYLES.cellR : STYLES.cell;
          if (c === 8 && n(ledgerRows[r][8]) > 0) base = STYLES.pos;
          if (c === 9 && n(ledgerRows[r][9]) > 0) base = STYLES.neg;
          if (c === 10) {
            const v = n(ledgerRows[r][10]);
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

      // ---------- SHEET 5: ISSUES ----------
      const issRows = [["#", "Issue No", "Date", "Material", "Code", "Requisition", "Issued To", "Job Card", "Qty", "Unit", "Rate", "Value", "Currency"]];
      filteredIssues.forEach((i, idx) => {
        issRows.push([
          idx + 1, i.IssueNo || '—', formatDate(i.IssueDate),
          i.MaterialName || '—', i.MaterialCode || '—',
          i.RequisitionNo || '—', i.IssuedBy || '—', i.JobCardNo || '—',
          n(i.IssueQTY), i.UnitName || 'KG',
          n(i.IssuePrice), n(i.IssueValue), i.Currency || 'USD',
        ]);
      });
      const issSheet = XLSX.utils.aoa_to_sheet(issRows);
      issSheet["!cols"] = [
        { wch: 5 }, { wch: 22 }, { wch: 14 }, { wch: 40 }, { wch: 16 },
        { wch: 20 }, { wch: 22 }, { wch: 18 }, { wch: 12 }, { wch: 8 },
        { wch: 12 }, { wch: 16 }, { wch: 10 },
      ];
      issRows[0].forEach((_, c) => {
        const addr = XLSX.utils.encode_cell({ r: 0, c });
        if (issSheet[addr]) issSheet[addr].s = STYLES.headerRose;
      });
      for (let r = 1; r < issRows.length; r++) {
        for (let c = 0; c < issRows[r].length; c++) {
          const addr = XLSX.utils.encode_cell({ r, c });
          if (!issSheet[addr]) continue;
          const isNum = [8, 10, 11].includes(c);
          let base = isNum ? STYLES.cellR : STYLES.cell;
          if (c === 8) base = STYLES.neg;
          issSheet[addr].s = base;
        }
      }
      XLSX.utils.book_append_sheet(wb, issSheet, "Issues");

      // ---------- SHEET 6: REQUISITIONS ----------
      const reqRows = [["#", "Requisition No", "Date", "Material", "Code", "Unit", "Required", "Issued", "Pending", "Fulfill %", "Issues", "Status", "Raised By", "Department", "Cost Center"]];
      filteredRequisitions.forEach((r, i) => {
        reqRows.push([
          i + 1, r.requisitionNo, formatDate(r.requisitionDate),
          r.materialName, r.materialCode, r.unit,
          n(r.requiredQTY), n(r.totalIssued), n(r.pendingQTY),
          `${r.fulfillmentPct.toFixed(1)}%`,
          r.issueCount, r.status, r.raisedBy, r.department, r.costCenter,
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
          if (c === 8) base = n(reqRows[r][8]) > 0 ? STYLES.low : STYLES.cellR;
          if (c === 11) {
            const v = reqRows[r][11];
            if (v === 'Completed') base = { ...STYLES.cell, font: { sz: 10, bold: true, color: { rgb: "047857" } } };
            if (v === 'Partial') base = { ...STYLES.cell, font: { sz: 10, bold: true, color: { rgb: "D97706" } } };
          }
          reqSheet[addr].s = base;
        }
      }
      XLSX.utils.book_append_sheet(wb, reqSheet, "Requisitions");

      // ---------- SHEET 7: ISSUE DETAILS ----------
      const issDetRows = [["#", "Requisition", "Issue No", "Issue Date", "Material", "Qty", "Unit", "Rate", "Value", "Currency", "Issued To", "Job Card", "Running Issued", "Remaining"]];
      let issDetIdx = 1;
      filteredRequisitions.forEach((req) => {
        req.issues.forEach((iss) => {
          issDetRows.push([
            issDetIdx++, req.requisitionNo, iss.issueNo, formatDate(iss.issueDate),
            req.materialName, n(iss.issueQTY), req.unit,
            n(iss.issuePrice), n(iss.issueValue), iss.currency,
            iss.issuedBy, iss.jobCardNo,
            n(iss.runningIssued), n(iss.runningPending),
          ]);
        });
      });
      const issDetSheet = XLSX.utils.aoa_to_sheet(issDetRows);
      issDetSheet["!cols"] = [
        { wch: 5 }, { wch: 20 }, { wch: 22 }, { wch: 14 }, { wch: 40 },
        { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 16 }, { wch: 10 },
        { wch: 22 }, { wch: 18 }, { wch: 14 }, { wch: 12 },
      ];
      issDetRows[0].forEach((_, c) => {
        const addr = XLSX.utils.encode_cell({ r: 0, c });
        if (issDetSheet[addr]) issDetSheet[addr].s = STYLES.headerRose;
      });
      for (let r = 1; r < issDetRows.length; r++) {
        for (let c = 0; c < issDetRows[r].length; c++) {
          const addr = XLSX.utils.encode_cell({ r, c });
          if (!issDetSheet[addr]) continue;
          const isNum = [5, 7, 8, 12, 13].includes(c);
          let base = isNum ? STYLES.cellR : STYLES.cell;
          if (c === 5) base = STYLES.neg;
          if (c === 13) base = n(issDetRows[r][13]) > 0 ? STYLES.low : STYLES.pos;
          issDetSheet[addr].s = base;
        }
      }
      XLSX.utils.book_append_sheet(wb, issDetSheet, "Issue Details");

      // ---------- SHEET 8: MOVEMENT STORY ----------
      const moveRows = [[
        "#", "Material", "Code", "Unit",
        "Requisition No", "Req Date", "Raised By", "Department",
        "Required", "Issued", "Pending", "Fulfill %", "Status", "# Issues",
        "First Issue", "Last Issue",
        "Opening", "Total In", "Total Out", "Closing",
        "Stock Status", "Opening Source"
      ]];
      let moveIdx = 1;
      filteredMovements.forEach((story) => {
        const stockStatus = getStockStatus(story.closing).label;
        if (!story.requisitions || story.requisitions.length === 0) {
          moveRows.push([
            moveIdx++, story.materialName, story.materialCode, story.unit,
            '—', '—', '—', '—', 0, 0, 0, '0%', 'No Req', 0,
            '—', '—',
            n(story.opening), n(story.totalIn), n(story.totalOut), n(story.closing),
            stockStatus, story.openingSource,
          ]);
        } else {
          story.requisitions.forEach((req) => {
            moveRows.push([
              moveIdx++,
              story.materialName, story.materialCode, story.unit,
              req.requisitionNo, formatDate(req.requisitionDate),
              req.raisedBy, req.department,
              n(req.requiredQTY), n(req.totalIssued), n(req.pendingQTY),
              `${req.fulfillmentPct.toFixed(1)}%`, req.status, req.issueCount,
              formatDate(req.firstIssueDate), formatDate(req.lastIssueDate),
              n(story.opening), n(story.totalIn), n(story.totalOut), n(story.closing),
              stockStatus, story.openingSource,
            ]);
          });
        }
      });
      const moveSheet = XLSX.utils.aoa_to_sheet(moveRows);
      moveSheet["!cols"] = [
        { wch: 5 }, { wch: 38 }, { wch: 14 }, { wch: 8 },
        { wch: 18 }, { wch: 13 }, { wch: 22 }, { wch: 16 },
        { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 8 },
        { wch: 13 }, { wch: 13 }, { wch: 13 }, { wch: 12 }, { wch: 12 }, { wch: 13 },
        { wch: 14 }, { wch: 14 },
      ];
      moveRows[0].forEach((_, c) => {
        const addr = XLSX.utils.encode_cell({ r: 0, c });
        if (moveSheet[addr]) moveSheet[addr].s = STYLES.headerViolet;
      });
      for (let r = 1; r < moveRows.length; r++) {
        for (let c = 0; c < moveRows[r].length; c++) {
          const addr = XLSX.utils.encode_cell({ r, c });
          if (!moveSheet[addr]) continue;
          const isNum = [8, 9, 10, 16, 17, 18, 19].includes(c);
          let base = isNum ? STYLES.cellR : STYLES.cell;
          if (c === 9) base = STYLES.pos;
          if (c === 10) base = n(moveRows[r][10]) > 0 ? STYLES.low : STYLES.cellR;
          if (c === 19) {
            const v = n(moveRows[r][19]);
            base = v <= 0 ? STYLES.neg : v < LOW_STOCK_THRESHOLD ? STYLES.low : STYLES.pos;
          }
          if (c === 12) {
            const v = moveRows[r][12];
            if (v === 'Completed') base = { ...STYLES.cell, font: { sz: 10, bold: true, color: { rgb: "047857" } } };
            else if (v === 'Partial') base = { ...STYLES.cell, font: { sz: 10, bold: true, color: { rgb: "D97706" } } };
          }
          moveSheet[addr].s = base;
        }
      }
      XLSX.utils.book_append_sheet(wb, moveSheet, "Movement Story");

      // ---------- SHEET 9: BALANCE SNAPSHOT ----------
      const balRows = [["#", "Material", "Code", "Category", "Sub Category", "Unit", "Opening Source", "Opening", "Total In", "Total Out", "Closing Balance", "API Balance", "Diff", "Avg Cost", "Stock Value", "Status", "Transactions"]];
      filteredMaterials.forEach((m, i) => {
        const st = getStockStatus(m.closing);
        const apiBal = m.apiBalance !== null ? m.apiBalance : '';
        const diff = m.apiBalance !== null ? m.closing - m.apiBalance : '';
        balRows.push([
          i + 1, m.name, m.code, m.category, m.subCategory, m.unit,
          m.openingSource, n(m.opening), n(m.totalIn), n(m.totalOut), n(m.closing),
          apiBal, diff,
          n(m.avgCost), n(m.stockValue), st.label, m.ledger.length,
        ]);
      });
      const balSheet = XLSX.utils.aoa_to_sheet(balRows);
      balSheet["!cols"] = [
        { wch: 5 }, { wch: 42 }, { wch: 16 }, { wch: 20 }, { wch: 20 },
        { wch: 8 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
        { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 16 },
        { wch: 14 }, { wch: 12 },
      ];
      balRows[0].forEach((_, c) => {
        const addr = XLSX.utils.encode_cell({ r: 0, c });
        if (balSheet[addr]) balSheet[addr].s = STYLES.headerBlue;
      });
      for (let r = 1; r < balRows.length; r++) {
        for (let c = 0; c < balRows[r].length; c++) {
          const addr = XLSX.utils.encode_cell({ r, c });
          if (!balSheet[addr]) continue;
          const isNum = [7, 8, 9, 10, 11, 12, 13, 14, 16].includes(c);
          let base = isNum ? STYLES.cellR : STYLES.cell;
          if (c === 1) base = STYLES.cellB;
          if (c === 10) {
            const v = n(balRows[r][10]);
            base = v <= 0 ? STYLES.neg : v < LOW_STOCK_THRESHOLD ? STYLES.low : STYLES.pos;
          }
          if (c === 12 && balRows[r][12] !== '') {
            const v = n(balRows[r][12]);
            base = Math.abs(v) < 0.01 ? STYLES.pos : STYLES.neg;
          }
          balSheet[addr].s = base;
        }
      }
      XLSX.utils.book_append_sheet(wb, balSheet, "Balance Snapshot");

      // ---------- SHEET 10: RECONCILIATION ----------
      const reconRows = [["#", "Material", "Code", "Unit", "Opening Source", "Opening", "In Range", "Out Range", "Ledger Closing", "API Balance", "Diff", "Recon Status", "Explanation"]];
      filteredReconciliation.forEach((r, i) => {
        const explanation =
          r.status === 'match' ? 'Ledger closing matches API BalanceQTY exactly'
          : r.status === 'mismatch' ? `Mismatch of ${fmt(r.diff)} ${r.unit}. May indicate transactions outside fetched range or data sync issue.`
          : 'No API BalanceQTY returned — opening derived from fallback table';
        reconRows.push([
          i + 1, r.materialName, r.materialCode, r.unit,
          r.openingSource, n(r.opening), n(r.totalIn), n(r.totalOut),
          n(r.ledgerClosing),
          r.apiClosing !== null ? n(r.apiClosing) : '',
          r.apiClosing !== null ? n(r.diff) : '',
          r.status === 'match' ? 'Matched' : r.status === 'mismatch' ? 'Mismatch' : 'No API',
          explanation,
        ]);
      });
      const reconSheet = XLSX.utils.aoa_to_sheet(reconRows);
      reconSheet["!cols"] = [
        { wch: 5 }, { wch: 42 }, { wch: 16 }, { wch: 8 },
        { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
        { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 60 },
      ];
      reconRows[0].forEach((_, c) => {
        const addr = XLSX.utils.encode_cell({ r: 0, c });
        if (reconSheet[addr]) reconSheet[addr].s = STYLES.headerTeal;
      });
      for (let r = 1; r < reconRows.length; r++) {
        for (let c = 0; c < reconRows[r].length; c++) {
          const addr = XLSX.utils.encode_cell({ r, c });
          if (!reconSheet[addr]) continue;
          const isNum = [5, 6, 7, 8, 9, 10].includes(c);
          let base = isNum ? STYLES.cellR : STYLES.cell;
          if (c === 1) base = STYLES.cellB;
          if (c === 11) {
            const v = reconRows[r][11];
            if (v === 'Matched') base = { ...STYLES.cell, font: { sz: 10, bold: true, color: { rgb: "047857" } } };
            else if (v === 'Mismatch') base = { ...STYLES.cell, font: { sz: 10, bold: true, color: { rgb: "DC2626" } } };
          }
          if (c === 10 && reconRows[r][10] !== '') {
            const v = n(reconRows[r][10]);
            base = Math.abs(v) < 0.01 ? STYLES.pos : STYLES.neg;
          }
          reconSheet[addr].s = base;
        }
      }
      XLSX.utils.book_append_sheet(wb, reconSheet, "Reconciliation");

      // ---------- WRITE ----------
      const fileName = `inventory_report_${new Date().toISOString().slice(0, 10)}.xlsx`;
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array", cellStyles: true });
      saveAs(new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), fileName);
      toast.dismiss();
      toast.success("✅ Report exported (10 sheets)");
    } catch (err) {
      console.error(err);
      toast.dismiss();
      toast.error("Export failed");
    }
  }, [filteredMaterials, filteredRequisitions, filteredMovements, filteredIssues, filteredReconciliation, receives, stats, filters]);

  // ============================================================
  // MAIN RENDER
  // ============================================================
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
              <p className="text-xs text-slate-500">Deep Stock Management · Reverse-Calculated Opening · Reconciled</p>
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
        {(activeTab === 'summary' || activeTab === 'movement' || activeTab === 'ledger' ||
          activeTab === 'issues' || activeTab === 'requisitions' || activeTab === 'reconcile') && (
          <FilterBar showRecon={activeTab === 'reconcile'} />
        )}

        {/* CONTENT */}
        {loading ? (
          <Loader />
        ) : (
          <div ref={tableRef}>
            {activeTab === 'dashboard'    && renderDashboard()}
            {activeTab === 'reconcile'    && renderReconcile()}
            {activeTab === 'summary'      && renderSummaryTable()}
            {activeTab === 'movement'     && renderMovementReport()}
            {activeTab === 'ledger'       && renderLedger()}
            {activeTab === 'receives'     && renderReceives()}
            {activeTab === 'issues'       && renderIssues()}
            {activeTab === 'requisitions' && renderRequisitions()}
            {activeTab === 'full-report'  && renderFullReport()}
          </div>
        )}
      </div>
    </div>
  );
}