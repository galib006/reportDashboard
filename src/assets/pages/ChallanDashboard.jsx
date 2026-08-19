// ChallanDashboard.js - Fixed with Dark Mode Support
import React, { useContext, useState, useEffect, useMemo, useCallback, useRef } from "react";
import { GetDataContext } from "../components/DataContext";
import axios from "axios";
import { toast } from "react-toastify";
import * as XLSX from "xlsx-js-style";
import ReactPaginate from "react-paginate";
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import CryptoJS from 'crypto-js';
import { FiCopy, FiCheck, FiDownload, FiRefreshCw, FiFilter, FiEye, FiFileText } from 'react-icons/fi';
import { MdOutlineAttachFile, MdOutlineDashboard, MdOutlineTableRows } from 'react-icons/md';

// ============================================================
// CONSTANTS & CONFIGURATION
// ============================================================
const CONFIG = {
  ITEMS_PER_PAGE: 100,
  DATE_FORMAT: "en-GB",
  CURRENCY_SYMBOL: "$",
  STORAGE_PREFIX: 'challan_dashboard_',
};

const STATUS_CONFIG = {
  'Send to Gate': { 
    bg: 'bg-amber-50 dark:bg-amber-900/30', 
    text: 'text-amber-700 dark:text-amber-400', 
    border: 'border-amber-200 dark:border-amber-700', 
    dot: 'bg-amber-500',
    icon: '🚪',
    label: 'Send to Gate'
  },
  'Gate Out': { 
    bg: 'bg-orange-50 dark:bg-orange-900/30', 
    text: 'text-orange-700 dark:text-orange-400', 
    border: 'border-orange-200 dark:border-orange-700', 
    dot: 'bg-orange-500',
    icon: '🚚',
    label: 'Gate Out'
  },
  'Delivered': { 
    bg: 'bg-green-50 dark:bg-green-900/30', 
    text: 'text-green-700 dark:text-green-400', 
    border: 'border-green-200 dark:border-green-700', 
    dot: 'bg-green-500',
    icon: '✅',
    label: 'Delivered'
  },
  'Challan Received': { 
    bg: 'bg-blue-50 dark:bg-blue-900/30', 
    text: 'text-blue-700 dark:text-blue-400', 
    border: 'border-blue-200 dark:border-blue-700', 
    dot: 'bg-blue-500',
    icon: '📥',
    label: 'Challan Received'
  },
  'Receive-Complete': { 
    bg: 'bg-emerald-50 dark:bg-emerald-900/30', 
    text: 'text-emerald-700 dark:text-emerald-400', 
    border: 'border-emerald-200 dark:border-emerald-700', 
    dot: 'bg-emerald-500',
    icon: '✅',
    label: 'Receive Complete'
  },
  'Pending': { 
    bg: 'bg-gray-50 dark:bg-gray-800/50', 
    text: 'text-gray-600 dark:text-gray-400', 
    border: 'border-gray-200 dark:border-gray-700', 
    dot: 'bg-gray-400',
    icon: '⏳',
    label: 'Pending'
  },
  'Unknown': { 
    bg: 'bg-gray-50 dark:bg-gray-800/50', 
    text: 'text-gray-500 dark:text-gray-400', 
    border: 'border-gray-200 dark:border-gray-700', 
    dot: 'bg-gray-300',
    icon: '❓',
    label: 'Unknown'
  },
};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================
const formatCurrency = (value) => {
  const num = Number(value || 0);
  return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatNumber = (value) => {
  const num = Number(value || 0);
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
    if (isNaN(date.getTime())) return "-";
    return format(date, 'dd MMM yyyy');
  } catch { return "-"; }
};

const formatShortDate = (dateStr) => {
  if (!dateStr) return "-";
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
    if (isNaN(date.getTime())) return "-";
    return format(date, 'dd/MM/yy');
  } catch { return "-"; }
};

const cn = (...classes) => classes.filter(Boolean).join(' ');

// ============================================================
// ENCRYPTION UTILITY
// ============================================================
const encryptDeliveryChallanId = (deliveryChallanId) => {
  try {
    const encrypted = CryptoJS.AES.encrypt(
      String(deliveryChallanId),
      "12HMZ5kjhg"
    ).toString();
    return encodeURIComponent(encrypted);
  } catch (error) {
    return deliveryChallanId;
  }
};

// ============================================================
// CUSTOM HOOKS
// ============================================================
const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(`${CONFIG.STORAGE_PREFIX}${key}`);
      return item ? JSON.parse(item) : initialValue;
    } catch { return initialValue; }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(`${CONFIG.STORAGE_PREFIX}${key}`, JSON.stringify(valueToStore));
    } catch (error) {
      console.error("localStorage error:", error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
};

const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

// ============================================================
// ATTACHMENT FUNCTIONS
// ============================================================
const fetchAttachments = async (deliveryChallanID, apiKey) => {
  try {
    const response = await axios.get(
      `https://tpl-api.ebs365.info/api/File?ReferenceDocNameID=52&ReferenceDocID=${deliveryChallanID}`,
      { headers: { Authorization: `${apiKey}` } }
    );
    return response.data || [];
  } catch (error) {
    return [];
  }
};

const downloadAttachment = async (attachment, apiKey) => {
  try {
    const response = await fetch(attachment.documentPath, {
      method: 'GET',
      headers: { 'Authorization': `${apiKey}`, 'Accept': '*/*' }
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    let fileName = attachment.documentLocation || 'attachment';
    fileName = fileName.replace(/[^a-zA-Z0-9.\-_\s]/g, '');
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 100);
    return true;
  } catch (error) {
    if (attachment.documentPath) {
      window.open(attachment.documentPath, '_blank');
      return true;
    }
    return false;
  }
};

// ============================================================
// COMPONENT: CopyableText
// ============================================================
const CopyableText = ({ text, className }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(`Copied: ${text}`);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  return (
    <span className={cn('group inline-flex items-center gap-1 cursor-pointer', className)} onClick={handleCopy}>
      <span className="truncate">{text}</span>
      <span className="opacity-0 group-hover:opacity-100 transition-opacity">
        {copied ? <FiCheck className="text-green-500 text-[10px]" /> : <FiCopy className="text-gray-400 dark:text-gray-500 text-[10px]" />}
      </span>
    </span>
  );
};

// ============================================================
// COMPONENT: StatusBadge
// ============================================================
const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG['Unknown'];
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border',
      config.bg, config.text, config.border
    )}>
      <span className="text-[12px]">{config.icon}</span>
      {config.label}
    </span>
  );
};

// ============================================================
// COMPONENT: ReceiveDateBadge
// ============================================================
const ReceiveDateBadge = ({ receivedDate }) => {
  if (!receivedDate) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-700">
        ❌ Not Received
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700">
      ✅ {formatShortDate(receivedDate)}
    </span>
  );
};

// ============================================================
// COMPONENT: FilterChip
// ============================================================
const FilterChip = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-700">
    {label}
    <button onClick={onRemove} className="hover:text-red-500 transition-colors">✕</button>
  </span>
);

// ============================================================
// COMPONENT: ChallanDateFilter
// ============================================================
const ChallanDateFilter = ({ 
  startDate, 
  endDate, 
  onStartChange, 
  onEndChange, 
  onApply, 
  onClear,
  isRefreshing 
}) => {
  return (
    <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg px-2 py-1 border border-blue-200 dark:border-blue-700">
      <span className="text-[10px] font-medium text-blue-700 dark:text-blue-400">📅 Challan:</span>
      <input
        type="date"
        className="input input-bordered input-xs w-28 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
        value={startDate}
        onChange={(e) => onStartChange(e.target.value)}
      />
      <span className="text-[10px] text-gray-400 dark:text-gray-500">→</span>
      <input
        type="date"
        className="input input-bordered input-xs w-28 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
        value={endDate}
        onChange={(e) => onEndChange(e.target.value)}
      />
      <button
        className="btn btn-xs btn-primary text-white ml-1"
        onClick={onApply}
        disabled={isRefreshing}
      >
        {isRefreshing ? <span className="loading loading-spinner loading-xs"></span> : 'Apply'}
      </button>
      {(startDate || endDate) && (
        <button
          className="text-[10px] text-red-500 hover:text-red-700 ml-0.5"
          onClick={onClear}
          title="Clear date filter"
        >
          ✕
        </button>
      )}
    </div>
  );
};

// ============================================================
// COMPONENT: ReceiveDateFilter
// ============================================================
const ReceiveDateFilter = ({ 
  startDate, 
  endDate, 
  onStartChange, 
  onEndChange, 
  onClear 
}) => {
  return (
    <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-2 py-1 border border-emerald-200 dark:border-emerald-700">
      <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400">📅 Receive:</span>
      <input
        type="date"
        className="input input-bordered input-xs w-28 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
        value={startDate}
        onChange={(e) => onStartChange(e.target.value)}
      />
      <span className="text-[10px] text-gray-400 dark:text-gray-500">→</span>
      <input
        type="date"
        className="input input-bordered input-xs w-28 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
        value={endDate}
        onChange={(e) => onEndChange(e.target.value)}
      />
      {(startDate || endDate) && (
        <button
          className="text-[10px] text-red-500 hover:text-red-700 ml-0.5"
          onClick={onClear}
          title="Clear receive date filter"
        >
          ✕
        </button>
      )}
    </div>
  );
};

// ============================================================
// MAIN COMPONENT: ChallanDashboard
// ============================================================
function ChallanDashboard() {
  const { cndata, apiKey } = useContext(GetDataContext);

  // Data State
  const [challanData, setChallanData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingAttachments, setFetchingAttachments] = useState({});
  const [attachmentCache, setAttachmentCache] = useState({});

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [challanStartDate, setChallanStartDate] = useState("");
  const [challanEndDate, setChallanEndDate] = useState("");
  const [receivedStartDate, setReceivedStartDate] = useState("");
  const [receivedEndDate, setReceivedEndDate] = useState("");
  const [selectedStatus, setSelectedStatus] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState([]);
  const [selectedDeliveryTo, setSelectedDeliveryTo] = useState([]);
  const [selectedPI, setSelectedPI] = useState([]);
  const [selectedChallanNo, setSelectedChallanNo] = useState([]);

  // UI State
  const [currentPage, setCurrentPage] = useState(0);
  const [viewMode, setViewMode] = useState('table');
  const [showFilters, setShowFilters] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const debouncedSearch = useDebounce(searchTerm, 300);

  // ============================================================
  // FETCH DATA
  // ============================================================
  const fetchChallanData = useCallback(async (showLoading = true, customStartDate, customEndDate) => {
    if (!apiKey) {
      toast.error("API Key not found. Please login again.");
      return;
    }

    const stDate = customStartDate || challanStartDate || 
      (cndata?.startDate ? cndata.startDate.toISOString().split('T')[0] : 
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      
    const edDate = customEndDate || challanEndDate || 
      (cndata?.endDate ? cndata.endDate.toISOString().split('T')[0] : 
      new Date().toISOString().split('T')[0]);

    if (showLoading) setLoading(true);
    setIsRefreshing(true);

    try {
      if (!challanStartDate) setChallanStartDate(stDate);
      if (!challanEndDate) setChallanEndDate(edDate);

      const [challanRes, receiveRes] = await Promise.all([
        axios.get(
          `https://tpl-api.ebs365.info/api/Challan/GetDeliveryChalanDashboard?CompanyID=1&ProductCategoryID=0&CustomerID=0&MarkettingID=0&StatusID=7&StartDate=${stDate}&EndDate=${edDate}`,
          { headers: { Authorization: `${apiKey}` } }
        ),
        axios.get(
          `https://tpl-api.ebs365.info/api/Challan/GetDeliveryChalanReceiveDashboard?CompanyID=1&ProductCategoryID=0&CustomerID=0&MarkettingID=0&Status=Receive-Complete&StartDate=${stDate}&EndDate=${edDate}`,
          { headers: { Authorization: `${apiKey}` } }
        )
      ]);

      const challans = challanRes.data || [];
      const receives = receiveRes.data || [];

      const receiveMap = {};
      receives.forEach(r => {
        if (r.challanNo) {
          receiveMap[r.challanNo] = {
            receivedDate: r.receivedDate,
            isReceive: r.isReceive || true,
            receiveData: r
          };
        }
      });

      const mergedData = challans.map(ch => ({
        ...ch,
        receivedDate: receiveMap[ch.challanNo]?.receivedDate || null,
        isReceive: receiveMap[ch.challanNo]?.isReceive || false,
        receiveData: receiveMap[ch.challanNo]?.receiveData || null,
        hasAttachments: false,
        attachmentCount: 0
      }));

      setChallanData(mergedData);
      toast.success(`📊 ${mergedData.length} challans loaded`);

    } catch (error) {
      console.error("Error fetching challan data:", error);
      toast.error("Failed to load challan data");
    } finally {
      if (showLoading) setLoading(false);
      setIsRefreshing(false);
    }
  }, [apiKey, cndata, challanStartDate, challanEndDate]);

  // ============================================================
  // APPLY DATE FILTER
  // ============================================================
  const applyDateFilter = useCallback(() => {
    if (challanStartDate && challanEndDate) {
      if (new Date(challanStartDate) > new Date(challanEndDate)) {
        toast.error("Start date cannot be after end date");
        return;
      }
      fetchChallanData(true, challanStartDate, challanEndDate);
    } else {
      toast.warning("Please select both start and end dates");
    }
  }, [challanStartDate, challanEndDate, fetchChallanData]);

  // ============================================================
  // CHECK ATTACHMENTS
  // ============================================================
  const checkAttachments = useCallback(async (challan) => {
    if (!challan?.deliveryChallanID || fetchingAttachments[challan.deliveryChallanID]) return;

    setFetchingAttachments(prev => ({ ...prev, [challan.deliveryChallanID]: true }));

    try {
      const attachments = await fetchAttachments(challan.deliveryChallanID, apiKey);
      setAttachmentCache(prev => ({ ...prev, [challan.deliveryChallanID]: attachments }));
      
      setChallanData(prev => prev.map(c => 
        c.deliveryChallanID === challan.deliveryChallanID 
          ? { ...c, hasAttachments: attachments.length > 0, attachmentCount: attachments.length }
          : c
      ));
    } catch (error) {
      console.error("Error checking attachments:", error);
    } finally {
      setFetchingAttachments(prev => ({ ...prev, [challan.deliveryChallanID]: false }));
    }
  }, [apiKey, fetchingAttachments]);

  // ============================================================
  // OPEN CHALLAN REPORT
  // ============================================================
  const openChallanReport = useCallback((challan) => {
    if (!challan?.deliveryChallanID) {
      toast.error("Challan ID is missing");
      return;
    }

    const encryptedId = encryptDeliveryChallanId(challan.deliveryChallanID);
    const authToken = localStorage.getItem("token") || localStorage.getItem("apiKey");
    
    const url = authToken && authToken !== 'undefined' && authToken !== 'null'
      ? `https://tpl-rpt.ebs365.info/#/delivery-challan-report?DeliveryChallanID=${encryptedId}&t=${encodeURIComponent(authToken)}`
      : `https://tpl-rpt.ebs365.info/#/delivery-challan-report?DeliveryChallanID=${encryptedId}`;
    
    window.open(url, '_blank');
    toast.success(`Opening ${challan.challanNo}`);
  }, []);

  // ============================================================
  // DOWNLOAD ATTACHMENTS
  // ============================================================
  const downloadAllAttachments = useCallback(async (challan) => {
    if (!challan?.deliveryChallanID) {
      toast.error("Challan ID is missing");
      return;
    }

    let attachments = attachmentCache[challan.deliveryChallanID];
    if (!attachments) {
      toast.info("Fetching attachments...");
      attachments = await fetchAttachments(challan.deliveryChallanID, apiKey);
      setAttachmentCache(prev => ({ ...prev, [challan.deliveryChallanID]: attachments }));
    }

    if (!attachments || attachments.length === 0) {
      toast.warning("No attachments found");
      return;
    }

    toast.info(`Downloading ${attachments.length} attachments...`);
    let successCount = 0;

    for (let i = 0; i < attachments.length; i++) {
      const success = await downloadAttachment(attachments[i], apiKey);
      if (success) successCount++;
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    toast.success(`Downloaded ${successCount}/${attachments.length} attachments`);
  }, [apiKey, attachmentCache]);

  // ============================================================
  // FILTER DATA
  // ============================================================
  const filteredData = useMemo(() => {
    let data = [...challanData];

    if (debouncedSearch) {
      const s = debouncedSearch.toLowerCase().trim();
      data = data.filter(ch =>
        ch.challanNo?.toLowerCase().includes(s) ||
        ch.workOrderNo?.toLowerCase().includes(s) ||
        ch.customerName?.toLowerCase().includes(s) ||
        ch.deliveryToName?.toLowerCase().includes(s) ||
        ch.gatePassNo?.toLowerCase().includes(s) ||
        ch.customerPINo?.toLowerCase().includes(s)
      );
    }

    if (selectedStatus.length > 0) {
      data = data.filter(ch => selectedStatus.includes(ch.statusDesc));
    }

    if (selectedCustomer.length > 0) {
      data = data.filter(ch => selectedCustomer.includes(ch.customerName));
    }

    if (selectedDeliveryTo.length > 0) {
      data = data.filter(ch => selectedDeliveryTo.includes(ch.deliveryToName));
    }

    if (selectedPI.length > 0) {
      data = data.filter(ch => selectedPI.includes(ch.customerPINo));
    }

    if (selectedChallanNo.length > 0) {
      data = data.filter(ch => selectedChallanNo.includes(ch.challanNo));
    }

    // Receive Date Range Filter
    if (receivedStartDate && receivedEndDate) {
      const start = startOfDay(new Date(receivedStartDate));
      const end = endOfDay(new Date(receivedEndDate));
      data = data.filter(ch => {
        if (!ch.receivedDate) return false;
        const date = new Date(ch.receivedDate);
        return isWithinInterval(date, { start, end });
      });
    }

    data.sort((a, b) => new Date(b.challanDate) - new Date(a.challanDate));

    return data;
  }, [challanData, debouncedSearch, selectedStatus, selectedCustomer, selectedDeliveryTo, 
      selectedPI, selectedChallanNo, receivedStartDate, receivedEndDate]);

  // ============================================================
  // PAGINATION
  // ============================================================
  const paginatedData = useMemo(() => {
    const start = currentPage * CONFIG.ITEMS_PER_PAGE;
    return filteredData.slice(start, start + CONFIG.ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  const pageCount = Math.ceil(filteredData.length / CONFIG.ITEMS_PER_PAGE);

  // ============================================================
  // FILTER OPTIONS
  // ============================================================
  const filterOptions = useMemo(() => ({
    statuses: [...new Set(challanData.map(ch => ch.statusDesc).filter(Boolean))],
    customers: [...new Set(challanData.map(ch => ch.customerName).filter(Boolean))],
    deliveryTos: [...new Set(challanData.map(ch => ch.deliveryToName).filter(Boolean))],
    pis: [...new Set(challanData.map(ch => ch.customerPINo).filter(Boolean))],
    challans: [...new Set(challanData.map(ch => ch.challanNo).filter(Boolean))],
  }), [challanData]);

  // ============================================================
  // STATISTICS
  // ============================================================
  const statistics = useMemo(() => {
    const total = filteredData.length;
    const totalQty = filteredData.reduce((sum, ch) => sum + (ch.challanQty || 0), 0);
    const totalValue = filteredData.reduce((sum, ch) => sum + (ch.totalChallanValue || 0), 0);
    const receivedCount = filteredData.filter(ch => ch.isReceive).length;
    const notReceivedCount = total - receivedCount;
    const statusCounts = {};
    filteredData.forEach(ch => {
      const status = ch.statusDesc || 'Unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    return { total, totalQty, totalValue, receivedCount, notReceivedCount, statusCounts };
  }, [filteredData]);

  // ============================================================
  // EFFECTS
  // ============================================================
  useEffect(() => {
    fetchChallanData(true);
  }, []);

  // ============================================================
  // FILTER DROPDOWN
  // ============================================================
  const FilterDropdown = ({ label, options, selected, onChange, icon, color = "blue" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const ref = useRef(null);

    useEffect(() => {
      const handleClickOutside = (e) => {
        if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filtered = options.filter(opt => opt?.toLowerCase().includes(search.toLowerCase()));

    const handleToggle = (value) => {
      onChange(selected.includes(value) ? selected.filter(v => v !== value) : [...selected, value]);
    };

    const handleSelectAll = () => {
      onChange(filtered.length === selected.length ? [] : filtered);
    };

    const colorMap = {
      amber: 'border-amber-500 bg-amber-50 dark:bg-amber-900/20',
      blue: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
      purple: 'border-purple-500 bg-purple-50 dark:bg-purple-900/20',
      indigo: 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20',
      cyan: 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20',
    };

    const badgeColorMap = {
      amber: 'badge-amber',
      blue: 'badge-blue',
      purple: 'badge-purple',
      indigo: 'badge-indigo',
      cyan: 'badge-cyan',
    };

    return (
      <div className="relative z-50" ref={ref}>
        <button
          className={cn(
            'btn btn-outline btn-xs gap-1 transition-all hover:shadow-md',
            selected.length > 0 && colorMap[color]
          )}
          onClick={() => setIsOpen(!isOpen)}
        >
          {icon && <span className="text-xs">{icon}</span>}
          <span className="text-[10px]">{label}</span>
          {selected.length > 0 && (
            <span className={cn('badge badge-xs', badgeColorMap[color])}>{selected.length}</span>
          )}
          <span className="text-[10px]">{isOpen ? '▲' : '▼'}</span>
        </button>

        {isOpen && (
          <div className="absolute bg-white dark:bg-gray-800 shadow-xl p-2 rounded-lg w-56 max-h-72 overflow-y-auto z-[100] mt-1 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-[10px] text-gray-900 dark:text-gray-100">{label}</span>
              <div className="flex gap-1">
                <button className="text-[10px] text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 px-2 py-0.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20" onClick={handleSelectAll}>
                  {filtered.length === selected.length ? 'Deselect' : 'All'}
                </button>
                <button className="text-[10px] text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 px-2 py-0.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => { onChange([]); setSearch(""); }}>
                  Clear
                </button>
              </div>
            </div>
            <input
              type="text"
              placeholder={`Search ${label}...`}
              className="input input-xs w-full mb-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-600"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="space-y-0.5 max-h-36 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="text-gray-400 dark:text-gray-500 text-[10px] text-center py-2">No items</div>
              ) : (
                filtered.map(opt => (
                  <label key={opt} className="flex gap-2 py-1 px-2 items-center hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                    <input type="checkbox" checked={selected.includes(opt)} onChange={() => handleToggle(opt)} className="checkbox checkbox-xs" />
                    <span className="text-[11px] select-none truncate text-gray-900 dark:text-gray-100">{opt}</span>
                  </label>
                ))
              )}
            </div>
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 text-[10px] text-gray-500 dark:text-gray-400">{selected.length} selected</div>
          </div>
        )}
      </div>
    );
  };

  // ============================================================
  // ACTIVE FILTERS
  // ============================================================
  const ActiveFilters = () => {
    const hasFilters = selectedStatus.length || selectedCustomer.length || 
      selectedDeliveryTo.length || selectedPI.length || selectedChallanNo.length ||
      receivedStartDate || receivedEndDate || searchTerm || challanStartDate || challanEndDate;

    if (!hasFilters) return null;

    return (
      <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
        <span className="text-[10px] text-gray-400 dark:text-gray-500 mr-1">Active filters:</span>
        
        {(challanStartDate || challanEndDate) && (
          <FilterChip 
            label={`📅 Challan ${challanStartDate || 'Any'} → ${challanEndDate || 'Any'}`} 
            onRemove={() => { 
              setChallanStartDate(""); 
              setChallanEndDate(""); 
              setCurrentPage(0);
              fetchChallanData(true);
            }} 
          />
        )}
        
        {searchTerm && (
          <FilterChip label={`🔍 ${searchTerm}`} onRemove={() => { setSearchTerm(""); setCurrentPage(0); }} />
        )}
        
        {(receivedStartDate || receivedEndDate) && (
          <FilterChip 
            label={`📅 Receive ${receivedStartDate || 'Any'} → ${receivedEndDate || 'Any'}`} 
            onRemove={() => { setReceivedStartDate(""); setReceivedEndDate(""); setCurrentPage(0); }} 
          />
        )}
        
        {selectedStatus.length > 0 && (
          <FilterChip 
            label={`📊 ${selectedStatus.length} statuses`} 
            onRemove={() => { setSelectedStatus([]); setCurrentPage(0); }} 
          />
        )}
        
        {selectedCustomer.length > 0 && (
          <FilterChip 
            label={`👤 ${selectedCustomer.length} customers`} 
            onRemove={() => { setSelectedCustomer([]); setCurrentPage(0); }} 
          />
        )}
        
        {selectedDeliveryTo.length > 0 && (
          <FilterChip 
            label={`🏢 ${selectedDeliveryTo.length} locations`} 
            onRemove={() => { setSelectedDeliveryTo([]); setCurrentPage(0); }} 
          />
        )}
        
        {selectedPI.length > 0 && (
          <FilterChip 
            label={`📋 ${selectedPI.length} PIs`} 
            onRemove={() => { setSelectedPI([]); setCurrentPage(0); }} 
          />
        )}
        
        {selectedChallanNo.length > 0 && (
          <FilterChip 
            label={`📄 ${selectedChallanNo.length} challans`} 
            onRemove={() => { setSelectedChallanNo([]); setCurrentPage(0); }} 
          />
        )}
        
        <button 
          className="text-[10px] text-red-500 hover:text-red-700 font-medium ml-1"
          onClick={() => {
            setSearchTerm("");
            setChallanStartDate("");
            setChallanEndDate("");
            setReceivedStartDate("");
            setReceivedEndDate("");
            setSelectedStatus([]);
            setSelectedCustomer([]);
            setSelectedDeliveryTo([]);
            setSelectedPI([]);
            setSelectedChallanNo([]);
            setCurrentPage(0);
            fetchChallanData(true);
            toast.info("All filters cleared");
          }}
        >
          Clear All ✕
        </button>
      </div>
    );
  };

  // ============================================================
  // STATISTICS CARDS - Fixed with dark mode and no gradients
  // ============================================================
  const StatisticsCards = () => (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
      <div className="bg-blue-500 dark:bg-blue-600 text-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
        <div className="flex items-center justify-between">
          <div className="text-xs opacity-80">Total Challans</div>
          <span className="text-lg">📋</span>
        </div>
        <div className="text-2xl font-bold mt-1">{statistics.total}</div>
      </div>
      
      <div className="bg-emerald-500 dark:bg-emerald-600 text-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
        <div className="flex items-center justify-between">
          <div className="text-xs opacity-80">Total Quantity</div>
          <span className="text-lg">📦</span>
        </div>
        <div className="text-2xl font-bold mt-1">{formatNumber(statistics.totalQty)}</div>
      </div>
      
      <div className="bg-purple-500 dark:bg-purple-600 text-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
        <div className="flex items-center justify-between">
          <div className="text-xs opacity-80">Total Value</div>
          <span className="text-lg">💰</span>
        </div>
        <div className="text-2xl font-bold mt-1">{formatCurrency(statistics.totalValue)}</div>
      </div>
      
      <div className="bg-teal-500 dark:bg-teal-600 text-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
        <div className="flex items-center justify-between">
          <div className="text-xs opacity-80">Received</div>
          <span className="text-lg">✅</span>
        </div>
        <div className="text-2xl font-bold mt-1">{statistics.receivedCount}</div>
        <div className="text-xs opacity-80 mt-0.5">
          {statistics.total > 0 ? ((statistics.receivedCount / statistics.total) * 100).toFixed(1) : 0}%
        </div>
      </div>
      
      <div className="bg-rose-500 dark:bg-rose-600 text-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
        <div className="flex items-center justify-between">
          <div className="text-xs opacity-80">Not Received</div>
          <span className="text-lg">❌</span>
        </div>
        <div className="text-2xl font-bold mt-1">{statistics.notReceivedCount}</div>
        <div className="text-xs opacity-80 mt-0.5">
          {statistics.total > 0 ? ((statistics.notReceivedCount / statistics.total) * 100).toFixed(1) : 0}%
        </div>
      </div>
      
      <div className="bg-indigo-500 dark:bg-indigo-600 text-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
        <div className="flex items-center justify-between">
          <div className="text-xs opacity-80">Customers</div>
          <span className="text-lg">👥</span>
        </div>
        <div className="text-2xl font-bold mt-1">{new Set(filteredData.map(ch => ch.customerName).filter(Boolean)).size}</div>
      </div>
    </div>
  );

  // ============================================================
  // TABLE VIEW - Fixed with dark mode
  // ============================================================
  const TableView = () => (
    <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm bg-white dark:bg-gray-800 h-[470px]">
      <table className="table table-xs min-w-[1200px]">
        <thead className="bg-blue-600 dark:bg-blue-700 text-white sticky top-0 z-10">
          <tr className="text-center text-[10px] uppercase tracking-wider">
            <th className="py-2.5 w-8">#</th>
            <th className="py-2.5 text-left min-w-[120px]">Challan No</th>
            <th className="py-2.5">Challan Date</th>
            <th className="py-2.5">Receive Date</th>
            <th className="py-2.5">Status</th>
            <th className="py-2.5 text-left min-w-[100px]">Customer</th>
            <th className="py-2.5 text-left min-w-[100px]">Delivery To</th>
            <th className="py-2.5">Work Order</th>
            <th className="py-2.5 text-right">Qty</th>
            <th className="py-2.5 text-right">Value</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800">
          {paginatedData.map((ch, idx) => {
            const serial = currentPage * CONFIG.ITEMS_PER_PAGE + idx + 1;

            return (
              <tr key={ch.deliveryChallanID} className="hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors group border-b border-gray-100 dark:border-gray-700">
                <td className="px-2 py-1.5 text-center text-[10px] text-gray-400 dark:text-gray-500">{serial}</td>
                <td className="px-2 py-1.5">
                  <CopyableText text={ch.challanNo} className="text-blue-600 dark:text-blue-400 font-medium text-xs" />
                </td>
                <td className="px-2 py-1.5 text-center text-[11px] text-gray-700 dark:text-gray-300">{formatShortDate(ch.challanDate)}</td>
                <td className="px-2 py-1.5 text-center">
                  <ReceiveDateBadge receivedDate={ch.receivedDate} />
                </td>
                <td className="px-2 py-1.5">
                  <StatusBadge status={ch.statusDesc} />
                </td>
                <td className="px-2 py-1.5 text-xs truncate max-w-[100px] text-gray-700 dark:text-gray-300" title={ch.customerName}>
                  {ch.customerName || '-'}
                </td>
                <td className="px-2 py-1.5 text-xs truncate max-w-[100px] text-gray-700 dark:text-gray-300" title={ch.deliveryToName}>
                  {ch.deliveryToName || '-'}
                </td>
                <td className="px-2 py-1.5 text-[10px] font-mono text-gray-600 dark:text-gray-400">{ch.workOrderNo || '-'}</td>
                <td className="px-2 py-1.5 text-right text-[11px] font-medium text-gray-700 dark:text-gray-300">{formatNumber(ch.challanQty)}</td>
                <td className="px-2 py-1.5 text-right text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                  {formatCurrency(ch.totalChallanValue)}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="sticky bottom-0 bg-blue-100 dark:bg-blue-900/40 z-10 border-t-2 border-blue-300 dark:border-blue-700">
          <tr className="font-bold text-xs text-gray-800 dark:text-gray-200">
            <td colSpan="8" className="text-right pr-2">Totals:</td>
            <td className="text-right">{formatNumber(statistics.totalQty)}</td>
            <td className="text-right text-blue-700 dark:text-blue-400">{formatCurrency(statistics.totalValue)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );

  // ============================================================
  // CARDS VIEW - Fixed with dark mode
  // ============================================================
  const CardsView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {paginatedData.map((ch) => {
        const attachments = attachmentCache[ch.deliveryChallanID] || [];
        const hasAttachments = attachments.length > 0 || ch.hasAttachments;

        return (
          <div
            key={ch.deliveryChallanID}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 p-4 hover:-translate-y-0.5 group"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="min-w-0 flex-1">
                <CopyableText text={ch.challanNo} className="text-blue-600 dark:text-blue-400 font-semibold text-sm" />
                <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">WO: {ch.workOrderNo || '-'}</div>
              </div>
              <StatusBadge status={ch.statusDesc} />
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
              <div>
                <span className="text-gray-400 dark:text-gray-500">Customer</span>
                <div className="font-medium truncate text-gray-700 dark:text-gray-300" title={ch.customerName}>{ch.customerName || '-'}</div>
              </div>
              <div>
                <span className="text-gray-400 dark:text-gray-500">Delivery</span>
                <div className="font-medium truncate text-gray-700 dark:text-gray-300" title={ch.deliveryToName}>{ch.deliveryToName || '-'}</div>
              </div>
              <div>
                <span className="text-gray-400 dark:text-gray-500">Challan Date</span>
                <div className="font-medium text-gray-700 dark:text-gray-300">{formatDate(ch.challanDate)}</div>
              </div>
              <div>
                <span className="text-gray-400 dark:text-gray-500">Receive Date</span>
                <div><ReceiveDateBadge receivedDate={ch.receivedDate} /></div>
              </div>
              <div>
                <span className="text-gray-400 dark:text-gray-500">Qty</span>
                <div className="font-medium text-gray-700 dark:text-gray-300">{formatNumber(ch.challanQty)}</div>
              </div>
              <div>
                <span className="text-gray-400 dark:text-gray-500">Value</span>
                <div className="font-medium text-blue-600 dark:text-blue-400">{formatCurrency(ch.totalChallanValue)}</div>
              </div>
            </div>

            <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                {hasAttachments && (
                  <button
                    className="text-blue-500 dark:text-blue-400 text-xs font-medium hover:text-blue-700 dark:hover:text-blue-300 transition-colors flex items-center gap-0.5"
                    onClick={() => downloadAllAttachments(ch)}
                  >
                    <MdOutlineAttachFile className="text-sm" /> {attachments.length || ch.attachmentCount || '?'}
                  </button>
                )}
                {ch.deliveryChallanID && !attachmentCache[ch.deliveryChallanID] && !fetchingAttachments[ch.deliveryChallanID] && (
                  <button
                    className="text-[10px] text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                    onClick={() => checkAttachments(ch)}
                  >
                    🔍 Check
                  </button>
                )}
                {fetchingAttachments[ch.deliveryChallanID] && (
                  <span className="loading loading-spinner loading-xs"></span>
                )}
              </div>
              <div className="flex gap-1">
                <button
                  className="btn btn-xs btn-ghost text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  onClick={() => openChallanReport(ch)}
                  title="View Report"
                >
                  <FiFileText className="text-sm" />
                </button>
                {hasAttachments && (
                  <button
                    className="btn btn-xs btn-ghost text-green-500 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                    onClick={() => downloadAllAttachments(ch)}
                    title="Download Attachments"
                  >
                    <FiDownload className="text-sm" />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  // ============================================================
  // EXPORT TO EXCEL
  // ============================================================
  const exportToExcel = useCallback(() => {
    try {
      const data = filteredData.map(ch => ({
        'Challan No': ch.challanNo,
        'Challan Date': formatDate(ch.challanDate),
        'Receive Date': ch.receivedDate ? formatDate(ch.receivedDate) : 'Not Received',
        'Status': ch.statusDesc,
        'Customer': ch.customerName || '',
        'Delivery To': ch.deliveryToName || '',
        'Work Order': ch.workOrderNo || '',
        'Gate Pass': ch.gatePassNo || '',
        'PI No': ch.customerPINo || '',
        'Qty': ch.challanQty || 0,
        'Value': ch.totalChallanValue || 0
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Challans");

      const colWidths = [
        { wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 15 }, 
        { wch: 25 }, { wch: 25 }, { wch: 18 }, { wch: 18 }, 
        { wch: 20 }, { wch: 12 }, { wch: 15 }
      ];
      ws['!cols'] = colWidths;

      XLSX.writeFile(wb, `Challan_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success(`✅ Exported ${data.length} challans`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Export failed: " + error.message);
    }
  }, [filteredData]);

  // ============================================================
  // MAIN RENDER
  // ============================================================
  if (loading && challanData.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading challan data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 py-4 max-w-7xl bg-white dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
        <div>
          <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            🚚 Challan Dashboard
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {filteredData.length} of {challanData.length} challans shown
            {challanStartDate && challanEndDate && ` · Challan: ${formatDate(challanStartDate)} - ${formatDate(challanEndDate)}`}
            {receivedStartDate && receivedEndDate && ` · Receive: ${formatDate(receivedStartDate)} - ${formatDate(receivedEndDate)}`}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            className="btn btn-xs btn-success text-white shadow-sm hover:shadow transition-all"
            onClick={exportToExcel}
          >
            <FiDownload className="mr-1" /> Export
          </button>
          <button
            className="btn btn-xs btn-info text-white shadow-sm hover:shadow transition-all"
            onClick={() => fetchChallanData(false)}
            disabled={isRefreshing}
          >
            {isRefreshing ? <span className="loading loading-spinner loading-xs"></span> : <><FiRefreshCw className="mr-1" /> Refresh</>}
          </button>
        </div>
      </div>

      {/* Stats */}
      <StatisticsCards />

      {/* Filter Bar - Sticky with dark mode */}
      <div className="sticky top-0 z-40 bg-white/90 dark:bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 mb-4">
        <div className="flex flex-wrap gap-2 items-center">
          <button
            className={cn(
              'btn btn-xs gap-1 transition-all',
              showFilters ? 'btn-primary text-white' : 'btn-ghost bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300'
            )}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FiFilter className="text-sm" /> {showFilters ? 'Hide' : 'Show'} Filters
          </button>

          <div className="flex-1 min-w-[120px]">
            <input
              type="text"
              placeholder="🔍 Search challans..."
              className="input input-bordered input-xs w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(0); }}
            />
          </div>

          <div className="join shadow-sm">
            <button
              className={cn('join-item btn btn-xs', viewMode === 'table' ? 'btn-primary text-white' : 'btn-ghost bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300')}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              <MdOutlineTableRows className="text-sm" />
            </button>
            <button
              className={cn('join-item btn btn-xs', viewMode === 'cards' ? 'btn-primary text-white' : 'btn-ghost bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300')}
              onClick={() => setViewMode('cards')}
              title="Card View"
            >
              <MdOutlineDashboard className="text-sm" />
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-3 flex flex-wrap gap-2 items-center">
            {/* Challan Date Filter */}
            <ChallanDateFilter
              startDate={challanStartDate}
              endDate={challanEndDate}
              onStartChange={(value) => { setChallanStartDate(value); setCurrentPage(0); }}
              onEndChange={(value) => { setChallanEndDate(value); setCurrentPage(0); }}
              onApply={applyDateFilter}
              onClear={() => { 
                setChallanStartDate(""); 
                setChallanEndDate(""); 
                setCurrentPage(0);
                fetchChallanData(true);
              }}
              isRefreshing={isRefreshing}
            />

            {/* Receive Date Filter */}
            <ReceiveDateFilter
              startDate={receivedStartDate}
              endDate={receivedEndDate}
              onStartChange={(value) => { setReceivedStartDate(value); setCurrentPage(0); }}
              onEndChange={(value) => { setReceivedEndDate(value); setCurrentPage(0); }}
              onClear={() => { setReceivedStartDate(""); setReceivedEndDate(""); setCurrentPage(0); }}
            />

            {/* Other filters */}
            <FilterDropdown
              label="Status"
              options={filterOptions.statuses}
              selected={selectedStatus}
              onChange={setSelectedStatus}
              icon="📊"
              color="amber"
            />
            <FilterDropdown
              label="Customer"
              options={filterOptions.customers}
              selected={selectedCustomer}
              onChange={setSelectedCustomer}
              icon="👤"
              color="blue"
            />
            <FilterDropdown
              label="Delivery To"
              options={filterOptions.deliveryTos}
              selected={selectedDeliveryTo}
              onChange={setSelectedDeliveryTo}
              icon="🏢"
              color="purple"
            />
            <FilterDropdown
              label="PI No"
              options={filterOptions.pis}
              selected={selectedPI}
              onChange={setSelectedPI}
              icon="📋"
              color="indigo"
            />
            <FilterDropdown
              label="Challan No"
              options={filterOptions.challans}
              selected={selectedChallanNo}
              onChange={setSelectedChallanNo}
              icon="📄"
              color="cyan"
            />
          </div>
        )}

        <ActiveFilters />
      </div>

      {/* Data */}
      {filteredData.length === 0 ? (
        <div className="text-center py-16 bg-white/80 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="text-6xl mb-3 opacity-30">📭</div>
          <div className="text-gray-500 dark:text-gray-400 text-lg">No challans found</div>
          <div className="text-gray-400 dark:text-gray-500 text-sm mt-1">
            {challanStartDate && challanEndDate 
              ? `No data for ${formatDate(challanStartDate)} - ${formatDate(challanEndDate)}` 
              : 'Try adjusting your filters'}
          </div>
        </div>
      ) : (
        <>
          {viewMode === 'table' ? <TableView /> : <CardsView />}

          {pageCount > 1 && (
            <div className="flex flex-wrap justify-between items-center mt-4 gap-2">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Showing {currentPage * CONFIG.ITEMS_PER_PAGE + 1}–{Math.min((currentPage + 1) * CONFIG.ITEMS_PER_PAGE, filteredData.length)} of {filteredData.length}
              </div>
              <ReactPaginate
                breakLabel="…"
                nextLabel="Next →"
                prevLabel="← Prev"
                pageCount={pageCount}
                onPageChange={({ selected }) => setCurrentPage(selected)}
                containerClassName="flex gap-0.5"
                pageLinkClassName="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-xs hover:bg-gray-100 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                activeLinkClassName="bg-blue-600 dark:bg-blue-700 text-white border-blue-600 dark:border-blue-700"
                prevLinkClassName="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-xs hover:bg-gray-100 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                nextLinkClassName="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-xs hover:bg-gray-100 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                disabledClassName="opacity-40 pointer-events-none"
                renderOnZeroPageCount={null}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ChallanDashboard;