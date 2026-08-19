import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { GetDataContext } from "../components/DataContext";
import { FourSquare } from "react-loading-indicators";
import OrderForm from "../OrderReport/OrderForm";
import * as XLSX from "xlsx-js-style";
import ReactPaginate from "react-paginate";
import { toast } from "react-toastify";
import axios from "axios";
import JSZip from 'jszip';
import CryptoJS from 'crypto-js';
import * as ExcelJS from 'exceljs';

// ============================================================
// CONSTANTS & CONFIGURATION
// ============================================================
const CONFIG = {
  ITEMS_PER_PAGE: 50,
  MAX_EXCEL_ROWS: 10000,
  DEBOUNCE_DELAY: 300,
  MAX_CHALLAN_DISPLAY: 5,
  DATE_FORMAT: "en-GB",
  CURRENCY_SYMBOL: "$",
  EXCEL_MAX_WIDTH: 25,
  AUTO_REFRESH_INTERVAL: 60000,
  TOP_ITEMS_COUNT: 5,
  MAX_HISTORY_ITEMS: 50,
  CACHE_DURATION: 300000,
  ANIMATION_DURATION: 300,
  SPARKLINE_WIDTH: 80,
  SPARKLINE_HEIGHT: 24,
  MAX_LC_PER_PI: 10,
  MAX_INVOICE_PER_LC: 20,
  STORAGE_PREFIX: 'pi_summary_',
  EXPANDED_VIEW_LIMIT: 100,
};

const COLUMN_CONFIG = {
  defaultVisible: [
    "SNo", "Order", "Date", "Customer", "Delivery", "SalesPerson", "Buyer", "PI",
    "PICompany", "LC", "Invoice", "Section", "OrderQty", "ChallanQty",
    "BalanceQty", "OrderValue", "ChallanValue", "BalanceValue", "Challan", "Progress"
  ],
  allColumns: [
    { id: "SNo", label: "#", required: true, pinned: false, width: 40 },
    { id: "Order", label: "Order No", required: true, pinned: false, width: 120 },
    { id: "Date", label: "Date", required: true, pinned: false, width: 100 },
    { id: "Customer", label: "Customer", required: true, pinned: false, width: 150 },
    { id: "Delivery", label: "Delivery", required: true, pinned: false, width: 150 },
    { id: "SalesPerson", label: "Sales Person", required: false, pinned: false, width: 130 },
    { id: "Buyer", label: "Buyer", required: true, pinned: false, width: 120 },
    { id: "PI", label: "PI No", required: false, pinned: false, width: 100 },
    { id: "PICompany", label: "PI Company", required: false, pinned: false, width: 150 },
    { id: "LC", label: "LC No", required: false, pinned: false, width: 100 },
    { id: "Invoice", label: "Invoice No", required: false, pinned: false, width: 100 },
    { id: "Section", label: "Section", required: true, pinned: false, width: 100 },
    { id: "OrderQty", label: "Order Qty", required: true, pinned: false, width: 100 },
    { id: "ChallanQty", label: "Challan Qty", required: true, pinned: false, width: 100 },
    { id: "BalanceQty", label: "Balance Qty", required: true, pinned: false, width: 100 },
    { id: "OrderValue", label: "Order Value", required: true, pinned: false, width: 120 },
    { id: "ChallanValue", label: "Challan Value", required: true, pinned: false, width: 120 },
    { id: "BalanceValue", label: "Balance Value", required: true, pinned: false, width: 120 },
    { id: "Challan", label: "Challan", required: false, pinned: false, width: 300 },
    { id: "Progress", label: "Progress", required: false, pinned: false, width: 120 },
    // NEW COLUMNS
    { id: "Style", label: "Style", required: false, pinned: false, width: 100 },
    { id: "Color", label: "Color", required: false, pinned: false, width: 100 },
    { id: "PO", label: "PO", required: false, pinned: false, width: 120 },
    { id: "CustomerPO", label: "Customer PO", required: false, pinned: false, width: 120 },
  ]
};

const BACKGROUNDS = [
  { gradient: 'from-blue-50 to-indigo-100', pattern: 'dots', name: 'Ocean Blue' },
  { gradient: 'from-purple-50 to-pink-100', pattern: 'grid', name: 'Purple Haze' },
  { gradient: 'from-green-50 to-teal-100', pattern: 'cross', name: 'Forest Green' },
  { gradient: 'from-yellow-50 to-orange-100', pattern: 'diamond', name: 'Sunset' },
  { gradient: 'from-red-50 to-pink-100', pattern: 'stripe', name: 'Rose Garden' },
  { gradient: 'from-indigo-50 to-blue-100', pattern: 'wave', name: 'Midnight' },
  { gradient: 'from-emerald-50 to-cyan-100', pattern: 'circle', name: 'Emerald' },
  { gradient: 'from-rose-50 to-red-100', pattern: 'hex', name: 'Crimson' },
];

const DARK_BACKGROUNDS = [
  { gradient: 'from-gray-900 to-blue-950', pattern: 'dots', name: 'Midnight Blue' },
  { gradient: 'from-gray-900 to-purple-950', pattern: 'grid', name: 'Deep Purple' },
  { gradient: 'from-gray-900 to-green-950', pattern: 'cross', name: 'Dark Forest' },
  { gradient: 'from-gray-900 to-red-950', pattern: 'hex', name: 'Dark Crimson' },
];
// ============================================================
// ATTACHMENT FETCH AND DOWNLOAD FUNCTIONS - FIXED
// ============================================================

// Fetch attachments for a specific reference
// ============================================================
// ATTACHMENT FETCH AND DOWNLOAD FUNCTIONS - FIXED
// ============================================================

// Fetch attachments for a specific reference
// ============================================================
// ATTACHMENT FETCH AND DOWNLOAD FUNCTIONS - CLEANED UP
// ============================================================

// Fetch attachments for a specific reference
// ============================================================
// ATTACHMENT FETCH AND DOWNLOAD FUNCTIONS - CLEANED UP
// ============================================================

// Fetch attachments for a specific reference
/////////////////////////////////
////////////////////////////////
////////////////////////////////
const fetchAttachments = async (referenceDocNameID, referenceDocID, apiKey) => {
  try {
    const response = await axios.get(
      `https://tpl-api.ebs365.info/api/File?ReferenceDocNameID=${referenceDocNameID}&ReferenceDocID=${referenceDocID}`,
      { headers: { Authorization: `${apiKey}` } }
    );
    return response.data || [];
  } catch (error) {
    console.error("Error fetching attachments:", error);
    return [];
  }
};
////////////////////////////////
////////////////////////////////
////////////////////////////////
// ============================================================
// ATTACHMENT DOWNLOAD FUNCTIONS - FIXED CORS
// ============================================================

// ============================================================
// ATTACHMENT DOWNLOAD FUNCTIONS - FIXED FOR MULTIPLE FILES
// ============================================================

// Download a single attachment with proper blob handling
const downloadSingleAttachmentWithCORS = async (attachment, apiKey, prefix = '') => {
  try {
    // Use fetch with credentials and proper headers
    const response = await fetch(attachment.documentPath, {
      method: 'GET',
      headers: {
        'Authorization': `${apiKey}`,
        'Accept': '*/*'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Get the blob from the response
    const blob = await response.blob();

    // Create a URL for the blob
    const url = window.URL.createObjectURL(blob);

    // Create a temporary anchor element
    const link = document.createElement('a');
    link.href = url;
    let fileName = attachment.documentLocation || 'attachment';
    // Clean filename
    fileName = fileName.replace(/[^a-zA-Z0-9.\-_\s]/g, '');
    const finalFileName = prefix ? `${prefix}_${fileName}` : fileName;
    link.download = finalFileName;

    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();

    // Clean up after a short delay
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 100);

    return true;
  } catch (error) {
    console.error("Error downloading attachment:", error);

    // Fallback: Try using axios
    try {
      const fileResponse = await axios.get(attachment.documentPath, {
        responseType: 'blob',
        headers: {
          'Authorization': `${apiKey}`,
        }
      });

      const url = window.URL.createObjectURL(fileResponse.data);
      const link = document.createElement('a');
      link.href = url;
      let fileName = attachment.documentLocation || 'attachment';
      fileName = fileName.replace(/[^a-zA-Z0-9.\-_\s]/g, '');
      const finalFileName = prefix ? `${prefix}_${fileName}` : fileName;
      link.download = finalFileName;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      return true;
    } catch (axiosError) {
      console.error("Axios download failed:", axiosError);
    }

    // Final fallback: Open in new tab
    if (attachment.documentPath) {
      toast.info(`Opening ${attachment.documentLocation || 'file'} in new tab. Right-click to save.`);
      window.open(attachment.documentPath, '_blank');
      return true;
    }
    return false;
  }
};

// Download all attachments for a reference - FIXED
const downloadAllAttachments = async (referenceDocNameID, referenceDocID, apiKey, prefix = '') => {
  try {
    const attachments = await fetchAttachments(referenceDocNameID, referenceDocID, apiKey);
    if (!attachments || attachments.length === 0) {
      toast.warning("No attachments found");
      return 0;
    }

    console.log(`Found ${attachments.length} attachments`);

    let successCount = 0;
    for (let i = 0; i < attachments.length; i++) {
      const attachment = attachments[i];
      console.log(`Downloading attachment ${i + 1}/${attachments.length}: ${attachment.documentLocation}`);

      // Add a small delay to prevent browser blocking
      await new Promise(resolve => setTimeout(resolve, 500));

      const success = await downloadSingleAttachmentWithCORS(attachment, apiKey, prefix);
      if (success) successCount++;
    }
    return successCount;
  } catch (error) {
    console.error("Error downloading all attachments:", error);
    return 0;
  }
};
// Fetch Challan Receive data for status check - FIXED
const fetchChallanReceiveData = async (apiKey, startDate, endDate) => {
  try {
    // Use dynamic dates from context instead of hardcoded
    const stDate = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const edDate = endDate || new Date().toISOString();

    const response = await axios.get(
      `https://tpl-api.ebs365.info/api/Challan/GetDeliveryChalanReceiveDashboard?CompanyID=1&ProductCategoryID=0&CustomerID=0&MarkettingID=0&Status=Receive-Complete&StartDate=${stDate}&EndDate=${edDate}`,
      { headers: { Authorization: `${apiKey}` } }
    );
    return response.data || [];
  } catch (error) {
    console.error("Error fetching challan receive data:", error);
    return [];
  }
};

// Download a single attachment
const downloadSingleAttachment = async (attachment, apiKey, prefix = '') => {
  try {
    const fileResponse = await axios.get(attachment.documentPath, {
      responseType: 'blob',
      headers: { Authorization: `${apiKey}` }
    });

    const url = window.URL.createObjectURL(fileResponse.data);
    const link = document.createElement('a');
    link.href = url;
    const fileName = prefix ? `${prefix}_${attachment.documentLocation}` : attachment.documentLocation;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error("Error downloading attachment:", error);
    return false;
  }
};


// ============================================================
// ENCRYPTION UTILITY FOR WORK ORDER ID - AES WITH CORRECT KEY
// ============================================================
const encryptWorkOrderId = (workOrderId) => {
  try {
    const secretKey = "12HMZ5kjhg";
    const idString = String(workOrderId);
    const encrypted = CryptoJS.AES.encrypt(idString, secretKey).toString();
    return encodeURIComponent(encrypted);
  } catch (error) {
    console.error("Encryption error:", error);
    try {
      return encodeURIComponent(btoa(String(workOrderId)));
    } catch (fallbackError) {
      return workOrderId;
    }
  }
};

// ============================================================
// ENCRYPTION UTILITY FOR DELIVERY CHALLAN ID
// ============================================================

const encryptDeliveryChallanId = (deliveryChallanId) => {
  try {
    // Use the exact same encryption as the working code
    const encrypted = CryptoJS.AES.encrypt(
      String(deliveryChallanId),
      "12HMZ5kjhg"
    ).toString();

    // URL encode the result
    return encodeURIComponent(encrypted);
  } catch (error) {
    console.error("Encryption error:", error);
    return deliveryChallanId;
  }
};


// ============================================================
// UTILITY FUNCTIONS
// ============================================================

const formatCurrency = (value) => {
  const num = Number(value || 0);
  return `${CONFIG.CURRENCY_SYMBOL}${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatNumber = (value) => {
  const num = Number(value || 0);
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleDateString(CONFIG.DATE_FORMAT, {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  } catch { return "-"; }
};

const cn = (...classes) => classes.filter(Boolean).join(' ');

const safeAccess = (obj, path, defaultValue = 'N/A') => {
  try {
    const result = path.split('.').reduce((current, key) => current?.[key], obj);
    return result !== undefined && result !== null ? result : defaultValue;
  } catch {
    return defaultValue;
  }
};

// ============================================================
// CUSTOM HOOKS
// ============================================================

const useDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current?.contains(event.target) || buttonRef.current?.contains(event.target)) return;
      setIsOpen(false);
    };
    const handleEsc = (e) => e.key === 'Escape' && setIsOpen(false);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  return { isOpen, toggle: () => setIsOpen(!isOpen), close: () => setIsOpen(false), open: () => setIsOpen(true), dropdownRef, buttonRef };
};

const useDebounce = (value, delay = CONFIG.DEBOUNCE_DELAY) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

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

const useTheme = () => {
  const [theme, setTheme] = useLocalStorage('app-theme', 'light');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
  return { theme, toggleTheme: useCallback(() => setTheme(t => t === 'light' ? 'dark' : 'light'), [setTheme]), setTheme };
};

// ============================================================
// ENHANCED ATTACHMENT DOWNLOADER COMPONENT
// ============================================================

// ============================================================
// ENHANCED ATTACHMENT DOWNLOADER COMPONENT - FIXED CORS
// ============================================================

// ============================================================
// ENHANCED ATTACHMENT DOWNLOADER COMPONENT - FIXED
// ============================================================

const AttachmentDownloader = React.memo(({
  referenceDocNameID,
  referenceDocID,
  folderName,
  onComplete,
  docType = 'attachment',
  showButton = true,
  buttonSize = 'xs',
  apiKey,
  isChallanReceive = false,
  attachments = [] // Pass attachments directly from parent
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [localAttachments, setLocalAttachments] = useState([]);
  const [showAttachments, setShowAttachments] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadedCount, setDownloadedCount] = useState(0);

  const effectiveApiKey = apiKey || localStorage.getItem("apiKey");

  // Update local attachments when prop changes
  useEffect(() => {
    if (attachments && attachments.length > 0) {
      setLocalAttachments(attachments);
    }
  }, [attachments]);

  // Fetch attachments if not provided
  useEffect(() => {
    if (referenceDocID && referenceDocNameID && (!attachments || attachments.length === 0)) {
      loadAttachments();
    }
  }, [referenceDocID, referenceDocNameID]);

  const loadAttachments = async () => {
    if (!referenceDocID) return;
    setIsLoading(true);
    try {
      const data = await fetchAttachments(referenceDocNameID, referenceDocID, effectiveApiKey);
      // console.log(`Loaded ${data.length} attachments for ${docType} ${referenceDocID}`, data);
      setLocalAttachments(data);
    } catch (error) {
      console.error("Error loading attachments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadAll = async (e) => {
    e.stopPropagation();
    if (localAttachments.length === 0) {
      toast.warning("No attachments found");
      return;
    }

    console.log(`Starting download of ${localAttachments.length} attachments`);
    setIsDownloading(true);
    setDownloadProgress(0);
    setDownloadedCount(0);

    let successCount = 0;
    const total = localAttachments.length;

    toast.info(`Downloading ${total} attachments...`);

    // Use a for loop instead of forEach for better control
    for (let i = 0; i < localAttachments.length; i++) {
      const attachment = localAttachments[i];
      const fileName = attachment.documentLocation || `file_${i + 1}`;
      console.log(`Downloading ${i + 1}/${total}: ${fileName}`);

      try {
        // Use fetch directly with proper blob handling
        const response = await fetch(attachment.documentPath, {
          method: 'GET',
          headers: {
            'Authorization': `${effectiveApiKey}`,
            'Accept': '*/*'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        let cleanFileName = attachment.documentLocation || 'attachment';
        cleanFileName = cleanFileName.replace(/[^a-zA-Z0-9.\-_\s]/g, '');
        const finalFileName = folderName ? `${folderName}_${cleanFileName}` : cleanFileName;
        link.download = finalFileName;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }, 100);

        successCount++;
        setDownloadedCount(successCount);
        toast.info(`Downloaded ${i + 1}/${total}: ${cleanFileName}`);
      } catch (error) {
        console.error(`Error downloading ${fileName}:`, error);
        // Try fallback - open in new tab
        if (attachment.documentPath) {
          toast.info(`Opening ${fileName} in new tab. Right-click to save.`);
          window.open(attachment.documentPath, '_blank');
          successCount++;
          setDownloadedCount(successCount);
        }
      }

      // Update progress
      const progress = ((i + 1) / total) * 100;
      setDownloadProgress(progress);

      // Add a delay between downloads - CRITICAL for multiple files
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    setIsDownloading(false);
    setDownloadProgress(100);

    if (successCount > 0) {
      toast.success(`✅ Downloaded ${successCount}/${total} attachments successfully!`);
    } else {
      toast.error(`❌ Failed to download attachments.`);
    }

    if (onComplete) onComplete();
  };

  // In AttachmentDownloader - handle single file download with CORS fallback
  const handleSingleDownload = async (attachment, e) => {
    e.stopPropagation();

    try {
      // Try fetch with credentials
      const response = await fetch(attachment.documentPath, {
        method: 'GET',
        headers: {
          'Authorization': `${effectiveApiKey}`,
          'Accept': '*/*'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fileName = folderName ? `${folderName}_${attachment.documentLocation}` : attachment.documentLocation;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`Downloaded: ${attachment.documentLocation}`);
    } catch (error) {
      console.error('Download error:', error);
      // Fallback: Open in new tab
      if (attachment.documentPath) {
        toast.info(`Opening ${attachment.documentLocation} in new tab. Right-click to save.`);
        window.open(attachment.documentPath, '_blank');
      } else {
        toast.error('Failed to download attachment');
      }
    }
  };

  const toggleAttachments = (e) => {
    e.stopPropagation();
    setShowAttachments(!showAttachments);
  };

  // Open attachment in new tab (bypasses CORS)
  const openAttachmentInNewTab = (attachment, e) => {
    e.stopPropagation();
    if (attachment.documentPath) {
      window.open(attachment.documentPath, '_blank');
    }
  };

  if (!referenceDocID) return null;

  // Don't show if no attachments and it's a challan receive check
  if (isChallanReceive && localAttachments.length === 0) {
    return null;
  }

  return (
    <div className="relative inline-block">
      {localAttachments.length > 0 ? (
        <div className="flex items-center gap-1">
          <button
            className={`btn btn-${buttonSize} btn-ghost text-blue-500 hover:text-blue-700`}
            onClick={toggleAttachments}
            title={`${localAttachments.length} attachment(s)`}
          >
            📎 {localAttachments.length}
          </button>

          <button
            className={`btn btn-${buttonSize} btn-ghost text-green-500 hover:text-green-700`}
            onClick={handleDownloadAll}
            disabled={isDownloading}
            title="Download all attachments"
          >
            {isDownloading ? `${Math.round(downloadProgress)}%` : '⬇ All'}
          </button>
        </div>
      ) : (
        <span className="text-gray-300 text-xs opacity-50">📎</span>
      )}

      {showAttachments && localAttachments.length > 0 && (
        <div
          className="absolute right-0 mt-1 bg-white shadow-xl rounded-lg p-2 z-50 border border-gray-200 min-w-[280px] max-h-80 overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-gray-700">
              📎 {docType.toUpperCase()} Attachments ({localAttachments.length})
            </span>
            <button
              className="text-xs text-gray-400 hover:text-gray-600"
              onClick={toggleAttachments}
            >
              ✕
            </button>
          </div>

          {isDownloading && (
            <div className="mb-2">
              <div className="text-xs text-gray-500 mb-1">
                Downloading {downloadedCount}/{localAttachments.length}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="space-y-1 max-h-40 overflow-y-auto">
            {localAttachments.map((att, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-2 p-1.5 hover:bg-gray-50 rounded text-xs cursor-pointer"
              >
                <span className="truncate max-w-[150px] text-gray-700" title={att.documentLocation}>
                  {att.documentLocation || `File ${idx + 1}`}
                </span>
                <span className="text-gray-400 text-[10px] flex-shrink-0">
                  {(att.fileSize / 1024).toFixed(1)} KB
                </span>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    className="text-blue-500 hover:text-blue-700"
                    onClick={(e) => openAttachmentInNewTab(att, e)}
                    title="Open in new tab"
                  >
                    👁️
                  </button>
                  <button
                    className="text-green-500 hover:text-green-700"
                    onClick={(e) => handleSingleDownload(att, e)}
                    title="Download"
                    disabled={isDownloading}
                  >
                    ⬇
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t">
            <button
              className="btn btn-xs btn-primary text-white w-full"
              onClick={handleDownloadAll}
              disabled={isDownloading}
            >
              {isDownloading
                ? `Downloading ${Math.round(downloadProgress)}% (${downloadedCount}/${localAttachments.length})`
                : `⬇ Download All (${localAttachments.length} files)`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
AttachmentDownloader.displayName = "AttachmentDownloader";



// ============================================================
// BULK ATTACHMENT DOWNLOADER
// ============================================================

// ============================================================
// BULK ATTACHMENT DOWNLOADER - FIXED
// ============================================================

const BulkAttachmentDownloader = React.memo(({
  selectedOrders,
  onComplete,
  apiKey
}) => {
  const { cndata } = useContext(GetDataContext);
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloaded, setDownloaded] = useState(0);
  const [totalAttachments, setTotalAttachments] = useState(0);
  const [currentOrder, setCurrentOrder] = useState('');
  const [failedDownloads, setFailedDownloads] = useState([]);

  const downloadAllSelected = useCallback(async () => {
    if (selectedOrders.length === 0) {
      toast.warning("No orders selected");
      return;
    }

    setIsDownloading(true);
    setProgress(0);
    setDownloaded(0);
    setTotalAttachments(0);
    setCurrentOrder('');
    setFailedDownloads([]);

    let successCount = 0;
    let total = 0;

    toast.info(`Scanning ${selectedOrders.length} orders for attachments...`);

    // First pass: collect all attachments
    const allAttachmentsList = [];

    for (const order of selectedOrders) {
      try {
        setCurrentOrder(`Scanning: ${order.WorkOrderNo}`);

        // Get Work Order attachments (ReferenceDocNameID: 51)
        const woAttachments = await fetchAttachments(51, order.WorkOrderID, apiKey);
        if (woAttachments && woAttachments.length > 0) {
          allAttachmentsList.push({
            order,
            type: 'workorder',
            attachments: woAttachments
          });
          total += woAttachments.length;
        }

        // Check if order has challans
        if (order.ChallanNo && order.ChallanNo.length > 0) {
          for (const challan of order.ChallanNo) {
            const challanEntry = cndata?.grupChallan?.find(c =>
              c.challanNo === challan.challanNo && c.workOrderNo === order.WorkOrderNo
            );

            if (challanEntry && challanEntry.deliveryChallanID) {
              const challanAttachments = await fetchAttachments(52, challanEntry.deliveryChallanID, apiKey);
              if (challanAttachments && challanAttachments.length > 0) {
                allAttachmentsList.push({
                  order,
                  type: 'challan',
                  attachments: challanAttachments,
                  challanNo: challan.challanNo
                });
                total += challanAttachments.length;
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error scanning ${order.WorkOrderNo}:`, error);
      }
    }

    setTotalAttachments(total);

    if (total === 0) {
      toast.warning("No attachments found for selected orders");
      setIsDownloading(false);
      setCurrentOrder('');
      return;
    }

    toast.info(`Found ${total} attachments across ${selectedOrders.length} orders. Starting download...`);
    toast.info(`Note: Some attachments may open in new tabs. Right-click and select "Save as..." to download.`);

    // Second pass: download all attachments
    // Second pass: download all attachments with proper delays
    let currentIndex = 0;
    for (const { order, type, attachments, challanNo } of allAttachmentsList) {
      const prefix = type === 'challan' ? `${order.WorkOrderNo}_${challanNo || 'challan'}` : order.WorkOrderNo;

      for (const attachment of attachments) {
        currentIndex++;
        setCurrentOrder(`${order.WorkOrderNo} (${currentIndex}/${total})`);

        try {
          // Use fetch directly
          const response = await fetch(attachment.documentPath, {
            method: 'GET',
            headers: {
              'Authorization': `${apiKey}`,
              'Accept': '*/*'
            }
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          let fileName = attachment.documentLocation || 'attachment';
          fileName = fileName.replace(/[^a-zA-Z0-9.\-_\s]/g, '');
          const finalFileName = prefix ? `${prefix}_${fileName}` : fileName;
          link.download = finalFileName;
          document.body.appendChild(link);
          link.click();
          setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
          }, 100);

          successCount++;
          setDownloaded(successCount);
          setProgress((currentIndex / total) * 100);
        } catch (error) {
          console.error("Error downloading attachment:", error);
          // Fallback: open in new tab
          if (attachment.documentPath) {
            window.open(attachment.documentPath, '_blank');
            successCount++;
            setDownloaded(successCount);
            setProgress((currentIndex / total) * 100);
          }
        }

        // CRITICAL: Add delay between downloads
        await new Promise(resolve => setTimeout(resolve, 600));
      }
    }

    setIsDownloading(false);
    setProgress(100);
    setCurrentOrder('');

    if (successCount > 0) {
      toast.success(`✅ ${successCount}/${total} attachments processed successfully!`);
      if (failedDownloads.length > 0) {
        toast.warning(`⚠️ ${failedDownloads.length} files could not be downloaded. They may open in new tabs.`);
      }
    } else {
      toast.warning("No attachments could be downloaded. Please try opening in new tabs.");
    }

    if (onComplete) onComplete();
  }, [selectedOrders, apiKey, onComplete]);

  if (selectedOrders.length === 0) return null;

  return (
    <button
      className="btn btn-primary btn-sm text-white shadow-lg"
      onClick={downloadAllSelected}
      disabled={isDownloading}
    >
      {isDownloading ? (
        <>
          <span className="loading loading-spinner loading-xs"></span>
          {Math.round(progress)}% ({downloaded} of {totalAttachments})
          {currentOrder && <span className="ml-1 truncate max-w-[100px]">- {currentOrder}</span>}
        </>
      ) : (
        <>⬇ Download All Selected ({selectedOrders.length} orders)</>
      )}
    </button>
  );
});
BulkAttachmentDownloader.displayName = "BulkAttachmentDownloader";

const OrderDetailViewModal = React.memo(({
  order,
  isOpen,
  onClose,
  onDownloadFull,
  apiKey
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [challans, setChallans] = useState([]);
  const [pis, setPis] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [challanAttachments, setChallanAttachments] = useState({});
  const { cndata } = useContext(GetDataContext);

  useEffect(() => {
    if (isOpen && order) {
      // Use the challans from the order data directly
      if (order.ChallanNo && order.ChallanNo.length > 0) {
        // Convert to format expected by the modal
        const formattedChallans = order.ChallanNo.map(ch => {
          // Find the full challan info from grupChallan
          const challanEntry = cndata?.grupChallan?.find(c =>
            c.challanNo === ch.challanNo || c.challanNo?.includes(ch.challanNo)
          );

          return {
            challanNo: ch.challanNo,
            statusDesc: ch.status || challanEntry?.statusDesc || 'Unknown',
            hasAttachments: ch.hasAttachments || false,
            challanDate: challanEntry?.challanDate || order.OrderReceiveDate || new Date().toISOString(),
            challanQty: challanEntry?.challanQty || 0,
            totalChallanValue: challanEntry?.totalChallanValue || 0,
            jobCardNo: challanEntry?.jobCardNo || order.JobBag || 'N/A',
            customerName: challanEntry?.customerName || order.CustomerName || 'N/A',
            deliveryChallanID: challanEntry?.deliveryChallanID || null
          };
        });
        setChallans(formattedChallans);

        // Check attachments for each challan
        formattedChallans.forEach(ch => {
          checkChallanAttachments(ch.challanNo);
        });
      }

      fetchPIsAndInvoices();
    }
  }, [isOpen, order, cndata]);

  const checkChallanAttachments = useCallback(async (challanNo) => {
    if (!apiKey) return;

    try {
      // First find the deliveryChallanID from the grupChallan data
      const challanEntry = cndata?.grupChallan?.find(c =>
        c.challanNo === challanNo
      );

      const deliveryChallanID = challanEntry?.deliveryChallanID;
      if (!deliveryChallanID) {
        console.log(`No deliveryChallanID found for ${challanNo}`);
        // Try to get it from the order's challan data
        const orderChallan = order?.ChallanNo?.find(c => c.challanNo === challanNo);
        if (orderChallan) {
          // Try to find the deliveryChallanID from the raw data
          const rawEntry = cndata?.grupChallan?.find(c =>
            c.challanNo === challanNo || c.challanNo?.includes(challanNo)
          );
          if (rawEntry?.deliveryChallanID) {
            const id = rawEntry.deliveryChallanID;
            console.log(`Found deliveryChallanID ${id} from raw data for ${challanNo}`);
            await fetchAttachmentsForChallan(challanNo, id);
          }
        }
        return;
      }

      await fetchAttachmentsForChallan(challanNo, deliveryChallanID);

    } catch (error) {
      console.error(`Error checking attachments for ${challanNo}:`, error);
    }
  }, [apiKey, cndata, order]);

  // Add this helper function
  const fetchAttachmentsForChallan = useCallback(async (challanNo, deliveryChallanID) => {
    if (!deliveryChallanID) {
      console.log(`No deliveryChallanID for ${challanNo}`);
      return;
    }

    console.log(`Fetching attachments for challan: ${challanNo} (ID: ${deliveryChallanID})`);

    try {
      const response = await axios.get(
        `https://tpl-api.ebs365.info/api/File?ReferenceDocNameID=52&ReferenceDocID=${deliveryChallanID}`,
        { headers: { Authorization: `${apiKey}` } }
      );

      const attachments = response.data || [];
      if (attachments.length > 0) {
        setChallanAttachments(prev => ({
          ...prev,
          [challanNo]: attachments
        }));
        console.log(`✅ Found ${attachments.length} attachments for challan ${challanNo}`);
      } else {
        console.log(`ℹ️ No attachments found for challan ${challanNo}`);
      }
    } catch (error) {
      console.error(`Error fetching attachments for ${challanNo}:`, error);
    }
  }, [apiKey]);

  const fetchPIsAndInvoices = useCallback(async () => {
    if (!order || !apiKey) return;
    setIsLoading(true);

    try {
      // Fetch PIs
      const piResponse = await axios.get(
        `https://tpl-api.ebs365.info/api/CustomerPI/GetCustomerPIDashboard?CompanyID=1&CustomerID=0&MarketingID=0`,
        { headers: { Authorization: `${apiKey}` } }
      );
      const filteredPIs = (piResponse.data || []).filter(pi => {
        if (!pi.workOrderNo) return false;
        return pi.workOrderNo.split(',').map(w => w.trim()).includes(order.WorkOrderNo);
      });
      setPis(filteredPIs);

      // Fetch Invoices
      const invoiceResponse = await axios.get(
        `https://tpl-api.ebs365.info/api/CommercialInvoice/GetInvoiceDashboard?CompanyID=1&CustomerID=0`,
        { headers: { Authorization: `${apiKey}` } }
      );
      const orderPIs = filteredPIs.map(pi => pi.customerPINo);
      const filteredInvoices = (invoiceResponse.data || []).filter(inv =>
        orderPIs.includes(inv.customerPINo)
      );
      setInvoices(filteredInvoices);

    } catch (error) {
      console.error("Error fetching PI/Invoice data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [order, apiKey]);

  const hasAttachments = useCallback((challanNo) => {
    return challanAttachments[challanNo] && challanAttachments[challanNo].length > 0;
  }, [challanAttachments]);

  // ... rest of the component
});
// ============================================================
// FULL DOWNLOAD FUNCTION
// ============================================================

const fetchChallanReport = async (challanId, apiKey) => {
  try {
    const response = await axios({
      method: 'POST',
      url: `https://tpl-api.ebs365.info/api/Report/GetDeliveryChallanReports`,
      headers: {
        Authorization: `${apiKey}`,
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
      data: { DeliveryChallanID: parseInt(challanId) }
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching challan report:", error);
    return null;
  }
};

const downloadFullOrder = async (order, apiKey) => {
  if (!order) {
    toast.error("No order data provided");
    return;
  }

  console.log("Downloading full order:", order);

  let workOrderId = order.WorkOrderID;

  // If WorkOrderID is not directly available, try to get it from the map
  if (!workOrderId && cndata?.workOrderIdMap) {
    workOrderId = cndata.workOrderIdMap[order.WorkOrderNo];
  }

  // If still no WorkOrderID, try to find it from the apiData
  if (!workOrderId && cndata?.apiData) {
    const foundItem = cndata.apiData.find(item => item.WorkOrderNo === order.WorkOrderNo);
    if (foundItem && foundItem.WorkOrderID) {
      workOrderId = foundItem.WorkOrderID;
    }
  }

  if (!workOrderId) {
    toast.error(`Order ID is missing for ${order.WorkOrderNo}. Please refresh the data and try again.`);
    return;
  }

  toast.info(`Preparing full download for ${order.WorkOrderNo || 'Order'}...`);

  try {
    // Fetch Work Order Report
    const workOrderResponse = await axios({
      method: 'POST',
      url: `https://tpl-api.ebs365.info/api/Report/WorkOrderReport`,
      headers: {
        Authorization: `${apiKey}`,
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
      data: { WorkOrderID: parseInt(workOrderId) }
    });

    // Fetch Work Order attachments (ReferenceDocNameID: 51)
    const woAttachments = await fetchAttachments(51, workOrderId, apiKey);

    // Fetch Challan attachments if there are challans
    let challanAttachments = [];
    if (order.ChallanNo && order.ChallanNo.length > 0) {
      for (const challan of order.ChallanNo) {
        // Find the actual challan entry
        const challanEntry = cndata?.grupChallan?.find(c =>
          c.challanNo === challan.challanNo && c.workOrderNo === order.WorkOrderNo
        );

        if (challanEntry && challanEntry.deliveryChallanID) {
          const attachments = await fetchAttachments(52, challanEntry.deliveryChallanID, apiKey);
          if (attachments && attachments.length > 0) {
            challanAttachments = [...challanAttachments, ...attachments.map(a => ({
              ...a,
              challanNo: challan.challanNo
            }))];
          }
        }
      }
    }

    const allAttachments = [...woAttachments, ...challanAttachments];

    const fullData = {
      order: {
        workOrderNo: order.WorkOrderNo,
        workOrderID: workOrderId,
        salesPerson: order.SalesPerson || 'Unknown',
        customerName: order.CustomerName,
        deliverName: order.DeliverName,
        buyer: order.Buyer,
        section: order.Section,
        orderDate: order.OrderReceiveDate,
        totalQty: order.TotalQty,
        totalValue: order.TotalValue,
        challanQty: order.ChallanQTY,
        challanValue: order.ChallanValue,
        balanceQty: order.BalanceQty,
        balanceValue: order.BalanceValue,
        completionRate: order.completionRate,
        piCompany: order.PICompany,
        piCount: order.piCount,
      },
      workOrderDetails: workOrderResponse.data,
      attachments: allAttachments || [],
      attachmentCount: allAttachments?.length || 0
    };

    // Download JSON data
    const jsonBlob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
    const jsonUrl = window.URL.createObjectURL(jsonBlob);
    const jsonLink = document.createElement('a');
    jsonLink.href = jsonUrl;
    jsonLink.download = `${order.WorkOrderNo}_full_data.json`;
    document.body.appendChild(jsonLink);
    jsonLink.click();
    document.body.removeChild(jsonLink);
    window.URL.revokeObjectURL(jsonUrl);

    // Download attachments
    let attachmentCount = 0;
    if (allAttachments && allAttachments.length > 0) {
      toast.info(`Downloading ${allAttachments.length} attachments...`);
      for (let i = 0; i < allAttachments.length; i++) {
        const doc = allAttachments[i];
        const prefix = doc.challanNo ? `${order.WorkOrderNo}_${doc.challanNo}` : order.WorkOrderNo;
        const success = await downloadSingleAttachmentWithCORS(doc, apiKey, prefix);
        if (success) attachmentCount++;
        // Show progress every 5 files
        if ((i + 1) % 5 === 0 || i === allAttachments.length - 1) {
          toast.info(`Downloaded ${i + 1}/${allAttachments.length} attachments`);
        }
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    toast.success(`✅ Downloaded ${attachmentCount}/${allAttachments.length} attachments with data for ${order.WorkOrderNo}`);

  } catch (error) {
    console.error("Error downloading full order:", error);
    toast.error("Failed to download full order: " + (error.message || "Unknown error"));
  }
};

// ============================================================
// useDataMaps
// ============================================================

const useDataMaps = (cndata, piCompanyData) => {
  return useMemo(() => {
    const challanMap = new Map();
    const lcMap = new Map();
    const invoiceMap = new Map();
    const piCompanyMap = new Map();
    const salesPersonMap = new Map();

    try {
      if (!cndata) {
        console.log("useDataMaps: cndata is null or undefined");
        return { challanMap, lcMap, invoiceMap, piCompanyMap, salesPersonMap };
      }

      // console.log("useDataMaps: cndata keys:", Object.keys(cndata));
      // console.log("useDataMaps: cndata.grupChallan length:", cndata.grupChallan?.length || 0);

      if (piCompanyData && Array.isArray(piCompanyData)) {
        piCompanyData.forEach(item => {
          if (item.customerPINo && item.customerName) {
            piCompanyMap.set(item.customerPINo.trim(), item.customerName);
          }
        });
      }
      if (cndata.apiData && Array.isArray(cndata.apiData)) {
        cndata.apiData.forEach(item => {
          const orderNo = item.WorkOrderNo || '';
          const marketingName = item.MarketingName || 'Unknown';
          if (orderNo) {
            salesPersonMap.set(orderNo.trim(), marketingName);
            salesPersonMap.set(orderNo.trim().toLowerCase(), marketingName);
          }
        });
      }
      // ===== BUILD challanMap FROM grupChallan =====
      // In useDataMaps - update the part where we build challanMap

      // ===== BUILD challanMap FROM grupChallan =====
      if (cndata.grupChallan && Array.isArray(cndata.grupChallan) && cndata.grupChallan.length > 0) {
        // console.log("Building challanMap from grupChallan, count:", cndata.grupChallan.length);

        for (const c of cndata.grupChallan) {
          const challanNo = c.challanNo || c.ChallanNo || null;
          const workOrderNo = c.workOrderNo || null;

          if (challanNo) {
            // ===== FIX: Trim the challan number to remove any spaces =====
            const trimmedChallanNo = challanNo.trim();
            // Get status from statusDesc field
            const status = c.statusDesc || c.StatusDesc || 'Unknown';

            // Store by trimmed challanNo (primary key)
            challanMap.set(trimmedChallanNo, status);

            // Store by workOrderNo (this is the key fix!)
            if (workOrderNo) {
              const trimmedWorkOrderNo = workOrderNo.trim();
              // Store by workOrderNo -> status
              challanMap.set(`WO_${trimmedWorkOrderNo}`, status);
              // Store by workOrderNo-challanNo combination
              challanMap.set(`${trimmedWorkOrderNo}-${trimmedChallanNo}`, status);
            }

            // Store additional info
            challanMap.set(`${trimmedChallanNo}_info`, {
              workOrderNo: workOrderNo,
              statusDesc: status,
              deliveryChallanID: c.deliveryChallanID,
              challanDate: c.challanDate,
              challanQty: c.challanQty,
              totalChallanValue: c.totalChallanValue,
              customerName: c.customerName
            });

            // console.log(`Added to challanMap: '${trimmedChallanNo}' -> ${status} (WO: ${workOrderNo})`);
          }
        }
      }

      else {
        console.log("WARNING: cndata.grupChallan is empty or not an array!");
      }

      // ... rest of the code (BBLC, Invoice, etc.)

    } catch (e) {
      console.error("Data map error:", e);
    }

    // console.log("challanMap size:", challanMap.size);
    // console.log("challanMap keys sample:", [...challanMap.keys()].slice(0, 10));

    return { challanMap, lcMap, invoiceMap, piCompanyMap, salesPersonMap };
  }, [cndata, piCompanyData]);
};
// ============================================================
// useSummarizedData
// ============================================================
const useSummarizedData = (cndata, maps) => {
  return useMemo(() => {
    const apidata = cndata?.apiData ?? [];
    const workOrderIdMap = cndata?.workOrderIdMap || {};
    const challanReceiveMap = cndata?.challanReceiveMap || {};

    const { challanMap, lcMap, invoiceMap, piCompanyMap, salesPersonMap } = maps;

    try {
      if (!apidata.length) return [];

      // ===== FIRST, BUILD CHALLAN MAP FROM ORDERREPORT API DATA =====
      // This ensures we have qty and value for ALL challans
      const apiChallanMap = {};
      apidata.forEach(item => {
        if (item.ChallanNo) {
          const challans = item.ChallanNo.split(",").map(c => c.trim()).filter(Boolean);
          const challanQty = Number(item.ChallanQTY) || 0;
          const challanValue = Number(item.ChallanValue) || 0;

          challans.forEach(challanNo => {
            if (!apiChallanMap[challanNo]) {
              apiChallanMap[challanNo] = {
                challanQty: 0,
                totalChallanValue: 0,
                statusDesc: 'Unknown',
                deliveryChallanID: null
              };
            }
            apiChallanMap[challanNo].challanQty += challanQty;
            apiChallanMap[challanNo].totalChallanValue += challanValue;
          });
        }
      });

      // ===== MERGE WITH EXISTING challanReceiveMap (for deliveryChallanID & status) =====
    const mergedChallanMap = {};

      // First, copy from apiChallanMap (has qty and value)
      Object.keys(challanReceiveMap).forEach(key => {
  if (mergedChallanMap[key]) {
    // Update existing with deliveryChallanID and status
    mergedChallanMap[key].deliveryChallanID = challanReceiveMap[key].deliveryChallanID || null;
    mergedChallanMap[key].statusDesc = challanReceiveMap[key].statusDesc || 'Unknown';
    // Also update qty and value if they exist in challanReceiveMap
    if (challanReceiveMap[key].challanQty) {
      mergedChallanMap[key].challanQty = challanReceiveMap[key].challanQty;
    }
    if (challanReceiveMap[key].totalChallanValue) {
      mergedChallanMap[key].totalChallanValue = challanReceiveMap[key].totalChallanValue;
    }
  } else {
    // Add new entry from challanReceiveMap
    mergedChallanMap[key] = {
      challanQty: challanReceiveMap[key].challanQty || 0,
      totalChallanValue: challanReceiveMap[key].totalChallanValue || 0,
      deliveryChallanID: challanReceiveMap[key].deliveryChallanID || null,
      statusDesc: challanReceiveMap[key].statusDesc || 'Unknown'
    };
  }
});

      if (cndata) {
  cndata.mergedChallanMap = mergedChallanMap;
}

console.log('📊 mergedChallanMap built with keys:', Object.keys(mergedChallanMap));
console.log('📊 mergedChallanMap sample:', mergedChallanMap['CLN-006467-2026']);

      const grouped = new Map();

      for (const item of apidata) {
        const orderNo = item.WorkOrderNo || 'N/A';
        const piNo = item.CustomerPINo || 'No PI';
        const piCompany = piCompanyMap.get(piNo.trim()) || '-';

        // ===== GET SALES PERSON - ONLY ONCE =====
        let salesPerson = 'Unknown';
        if (orderNo) {
          if (salesPersonMap && salesPersonMap.has(orderNo.trim())) {
            salesPerson = salesPersonMap.get(orderNo.trim());
          } else if (salesPersonMap && salesPersonMap.has(orderNo.trim().toLowerCase())) {
            salesPerson = salesPersonMap.get(orderNo.trim().toLowerCase());
          } else {
            salesPerson = item.MarketingName || 'Unknown';
          }
        }

        // Get WorkOrderID with case-insensitive matching
        let workOrderID = null;
        if (workOrderIdMap && Object.keys(workOrderIdMap).length > 0) {
          if (workOrderIdMap[orderNo]) {
            workOrderID = workOrderIdMap[orderNo];
          } else {
            const orderNoUpper = orderNo.toUpperCase().trim();
            const orderNoLower = orderNo.toLowerCase().trim();

            const matchedKey = Object.keys(workOrderIdMap).find(key =>
              key.toUpperCase().trim() === orderNoUpper ||
              key.toLowerCase().trim() === orderNoLower ||
              key.trim() === orderNo.trim()
            );

            if (matchedKey) {
              workOrderID = workOrderIdMap[matchedKey];
            }
          }
        }

        if (!grouped.has(orderNo)) {
          grouped.set(orderNo, {
            WorkOrderNo: orderNo,
            WorkOrderID: workOrderID,
            OrderReceiveDate: item.OrderReceiveDate || null,
            DeliverName: item.FName || 'Unknown',
            CustomerName: item.CName || 'Unknown',
            SalesPerson: salesPerson,
            PINOs: new Set(),
            PICompany: piCompany,
            Section: item.ProductCategoryName || 'Uncategorized',
            Buyer: item.BuyerName || 'Unknown',
            TotalQty: 0,
            TotalValue: 0,
            ChallanQTY: 0,
            ChallanValue: 0,
            BalanceQty: 0,
            BalanceValue: 0,
            ChallanNo: [],
            itemCount: 0,
            history: [],
            PIList: [],
            Status: item.Status || 'Active',
            ChallanStatusMap: {},
            Style: item.KeyEntry1Value || '',
            Color: item.KeyEntry2Value || '',
            PO: item.KeyEntry3Value || '',
            CustomerPO: item.CustomerPONo || '',
          });
        }

        const row = grouped.get(orderNo);
        const breakdownQty = Number(item.BreakDownQTY) || 0;
        const challanQty = Number(item.ChallanQTY) || 0;
        const balanceQty = Number(item.BalanceQTY) || 0;
        const orderValue = Number(item.TotalOrderValue) || 0;
        const challanValue = Number(item.ChallanValue) || 0;
        const balanceValue = Number(item.BalanceValue) || 0;

        row.PINOs.add(piNo);
        if (salesPerson !== 'Unknown' && (row.SalesPerson === 'Unknown' || row.SalesPerson === '')) {
          row.SalesPerson = salesPerson;
        }

        if (piCompany !== 'N/A') {
          row.PICompany = piCompany;
        }

        let existingPI = row.PIList.find(p => p.piNo === piNo);
        if (existingPI) {
          existingPI.qty += breakdownQty;
          existingPI.value += orderValue;
          existingPI.challanQty += challanQty;
          existingPI.balanceQty += balanceQty;
          existingPI.challanValue += challanValue;
          existingPI.balanceValue += balanceValue;
          existingPI.piCompany = piCompany;
          existingPI.items.push({
            breakdownQty,
            orderValue,
            challanQty,
            balanceQty,
            challanValue,
            balanceValue,
            ChallanNo: item.ChallanNo || '',
            ProductCategoryName: item.ProductCategoryName || 'Uncategorized',
            WorkOrderNo: orderNo
          });
        } else {
          row.PIList.push({
            piNo: piNo,
            piCompany: piCompany,
            salesPerson: row.SalesPerson,
            qty: breakdownQty,
            value: orderValue,
            challanQty: challanQty,
            balanceQty: balanceQty,
            challanValue: challanValue,
            balanceValue: balanceValue,
            items: [{
              breakdownQty,
              orderValue,
              challanQty,
              balanceQty,
              challanValue,
              balanceValue,
              ChallanNo: item.ChallanNo || '',
              ProductCategoryName: item.ProductCategoryName || 'Uncategorized',
              WorkOrderNo: orderNo
            }],
            lcList: [],
            invoiceList: []
          });
        }

        row.TotalQty += breakdownQty;
        row.ChallanQTY += challanQty;
        row.BalanceQty += balanceQty;
        row.TotalValue += orderValue;
        row.ChallanValue += challanValue;
        row.BalanceValue += balanceValue;
        row.itemCount += 1;
        row.history.push(challanQty);

        if (row.history.length > CONFIG.MAX_HISTORY_ITEMS) {
          row.history = row.history.slice(-CONFIG.MAX_HISTORY_ITEMS);
        }

        // ===== PROCESS CHALLANS - USE MERGED CHALLAN MAP =====
        if (item.ChallanNo) {
          const challans = item.ChallanNo.split(",")
            .map(c => c.trim())
            .filter(Boolean);

          const trimmedOrderNo = orderNo.trim();
          let workOrderStatus = null;

          if (challanMap && challanMap.has(`WO_${trimmedOrderNo}`)) {
            workOrderStatus = challanMap.get(`WO_${trimmedOrderNo}`);
          } else if (challanMap) {
            const allKeys = [...challanMap.keys()];
            const foundKey = allKeys.find(k =>
              typeof k === 'string' && k.includes(`WO_${trimmedOrderNo}`)
            );
            if (foundKey) {
              workOrderStatus = challanMap.get(foundKey);
            }
          }

          for (const challanNo of challans) {
            const trimmedChallanNo = challanNo.trim();
            let status = "Unknown";
            let hasAttachments = false;
            let deliveryChallanID = null;

            // ===== GET STATUS FROM MERGED CHALLAN MAP =====
            const mergedData = mergedChallanMap[trimmedChallanNo];
            if (mergedData) {
              status = mergedData.statusDesc || 'Unknown';
              deliveryChallanID = mergedData.deliveryChallanID;
            }

            // If no status from merged map, try from challanMap
            if (status === "Unknown") {
              if (workOrderStatus) {
                status = workOrderStatus;
              } else if (challanMap && challanMap.has(`${trimmedOrderNo}-${trimmedChallanNo}`)) {
                status = challanMap.get(`${trimmedOrderNo}-${trimmedChallanNo}`);
              } else if (challanMap && challanMap.has(trimmedChallanNo)) {
                status = challanMap.get(trimmedChallanNo);
              }
            }

            if (!row.ChallanNo.some(c => c.challanNo === trimmedChallanNo)) {
              row.ChallanNo.push({
                challanNo: trimmedChallanNo,
                status: status,
                hasAttachments: hasAttachments,
                deliveryChallanID: deliveryChallanID
              });
            }
          }
        }
      }

      // Build result
      const result = [];
      for (const item of grouped.values()) {
        for (const pi of item.PIList) {
          const lcList = (lcMap && lcMap.get(pi.piNo)) || [];
          const filteredLcList = lcList.filter(lc => lc.lcNo && lc.lcNo !== 'N/A');

          const invoiceList = [];
          for (const lc of filteredLcList) {
            const invoices = (invoiceMap && invoiceMap.get(lc.lcNo)) || [];
            for (const inv of invoices) {
              if (inv.invoiceNo && inv.invoiceNo !== 'N/A') {
                invoiceList.push(inv);
              }
            }
          }

          pi.lcList = filteredLcList;
          pi.invoiceList = invoiceList;
        }

        const completionRate = item.TotalQty > 0
          ? ((item.ChallanQTY / item.TotalQty) * 100)
          : 0;

        result.push({
          ...item,
          SalesPerson: item.SalesPerson || 'Unknown',
          PINO: [...item.PINOs].join(', '),
          PINOList: [...item.PINOs],
          PIList: item.PIList,
          completionRate: Math.min(100, completionRate),
          avgOrderValue: item.itemCount > 0 ? item.TotalValue / item.itemCount : 0,
          piCount: item.PINOs.size,
          LCList: item.PIList.flatMap(pi => pi.lcList || []),
          InvoiceList: item.PIList.flatMap(pi => pi.invoiceList || []),
        });
      }
      // In useSummarizedData, after building mergedChallanMap:
      console.log('📊 mergedChallanMap built with keys:', Object.keys(mergedChallanMap));
      console.log('📊 mergedChallanMap sample:', mergedChallanMap['CLN-006467-2026']);

      return result;
    } catch (e) {
      console.error("Summarize error:", e);
      return [];
    }
  }, [cndata, maps]);
};
// ============================================================
// useFilters
// ============================================================
const useFilters = (summarizedData, filters, search, maps) => {
  const normalize = useCallback(v => String(v || "").trim().toLowerCase(), []);
  const getMultiSearchItems = useCallback(ms => {
    if (!ms?.trim()) return [];
    return ms.split(/[\n,;|]+/).map(s => s.trim()).filter(Boolean);
  }, []);

  const multiSearchItems = useMemo(() => getMultiSearchItems(filters.multiSearch), [filters.multiSearch, getMultiSearchItems]);

  return useMemo(() => {
    try {
      if (!summarizedData.length) return [];

      const { challanMap } = maps;
      const sv = normalize(search);
      const {
        selectedPI, selectedOrder, selectedSalesPerson, selectedLC, selectedInvoice,
        selectedCustomer, selectedBuyer, selectedDelivery, selectedChallan,
        dateRange, minValue, maxValue, statusFilter, sectionFilter,
        favorites, showFavoritesOnly, multiSearch, selectedPIMultiOrder,
        minQty, maxQty, orderStatusFilter, deliveryStatusFilter,
        selectedPICompany
      } = filters;
      const safeSelectedChallan = selectedChallan || [];
      const challanSet = new Set(safeSelectedChallan.map(normalize));
      const piSet = new Set(selectedPI.map(normalize));
      const piMultiSet = selectedPIMultiOrder && selectedPIMultiOrder.length > 0
        ? new Set(selectedPIMultiOrder.map(normalize))
        : new Set();
      const orderSet = new Set(selectedOrder.map(normalize));
      const salesPersonSet = new Set((selectedSalesPerson || []).map(normalize));
      const lcSet = new Set(selectedLC.map(normalize));
      const invSet = new Set(selectedInvoice.map(normalize));
      const custSet = new Set(selectedCustomer.map(normalize));
      const buyerSet = new Set(selectedBuyer.map(normalize));
      const delSet = new Set(selectedDelivery.map(normalize));
      const favSet = new Set(favorites || []);
      const piCompanySet = new Set((selectedPICompany || []).map(normalize));
      const msItems = multiSearchItems;

      const minVal = minValue ? Number(minValue) : null;
      const maxVal = maxValue ? Number(maxValue) : null;
      const minQtyVal = minQty ? Number(minQty) : null;
      const maxQtyVal = maxQty ? Number(maxQty) : null;

      const hasPIFilter = piSet.size > 0 || piMultiSet.size > 0 || piCompanySet.size > 0;
      let processedData = summarizedData;

      if (hasPIFilter) {
        processedData = summarizedData
          .map(item => {
            let matchingPIs = item.PIList || [];

            if (piSet.size > 0) {
              matchingPIs = matchingPIs.filter(pi => {
                const piNormalized = normalize(pi.piNo || '');
                return piSet.has(piNormalized);
              });
            }

            if (piMultiSet.size > 0) {
              matchingPIs = matchingPIs.filter(pi => {
                const piNormalized = normalize(pi.piNo || '');
                return piMultiSet.has(piNormalized);
              });
            }

            if (piCompanySet.size > 0) {
              matchingPIs = matchingPIs.filter(pi => {
                const companyNormalized = normalize(pi.piCompany || 'N/A');
                return piCompanySet.has(companyNormalized);
              });
            }

            if (matchingPIs.length === 0) return null;

            const totalQty = matchingPIs.reduce((sum, pi) => sum + (pi.qty || 0), 0);
            const totalValue = matchingPIs.reduce((sum, pi) => sum + (pi.value || 0), 0);
            const totalChallanQty = matchingPIs.reduce((sum, pi) => sum + (pi.challanQty || 0), 0);
            const totalChallanValue = matchingPIs.reduce((sum, pi) => sum + (pi.challanValue || 0), 0);
            const totalBalanceQty = matchingPIs.reduce((sum, pi) => sum + (pi.balanceQty || 0), 0);
            const totalBalanceValue = matchingPIs.reduce((sum, pi) => sum + (pi.balanceValue || 0), 0);

            const allChallans = [];
            matchingPIs.forEach(pi => {
              if (pi.items) {
                pi.items.forEach(item => {
                  if (item.ChallanNo) {
                    let challans = [];
                    if (typeof item.ChallanNo === 'string') {
                      challans = item.ChallanNo.split(",")
                        .map(c => c.trim())
                        .filter(Boolean);
                    } else if (Array.isArray(item.ChallanNo)) {
                      challans = item.ChallanNo.map(c => c.challanNo || c).filter(Boolean);
                    }

                    const orderNo = item.WorkOrderNo || '';
                    challans.forEach(ch => {
                      const status = challanMap.get(`${orderNo}-${ch}`) || 'Unknown';
                      let foundStatus = status;
                      if (Array.isArray(item.ChallanNo)) {
                        const found = item.ChallanNo.find(c => c.challanNo === ch);
                        if (found && found.status) {
                          foundStatus = found.status;
                        }
                      }
                      if (!allChallans.some(c => c.challanNo === ch)) {
                        allChallans.push({ challanNo: ch, status: foundStatus || 'Unknown' });
                      }
                    });
                  }
                });
              }
            });

            const history = [];
            matchingPIs.forEach(pi => {
              if (pi.items) {
                pi.items.forEach(item => {
                  history.push(item.challanQty || 0);
                });
              }
            });

            const completionRate = totalQty > 0
              ? Math.min(100, (totalChallanQty / totalQty) * 100)
              : 0;

            const piCompany = matchingPIs.length > 0 ? matchingPIs[0].piCompany || 'N/A' : 'N/A';

            return {
              ...item,
              PIList: matchingPIs,
              PINOList: matchingPIs.map(pi => pi.piNo),
              PINO: matchingPIs.map(pi => pi.piNo).join(', '),
              piCount: matchingPIs.length,
              PICompany: piCompany,
              TotalQty: totalQty,
              TotalValue: totalValue,
              ChallanQTY: totalChallanQty,
              ChallanValue: totalChallanValue,
              BalanceQty: totalBalanceQty,
              BalanceValue: totalBalanceValue,
              completionRate: completionRate,
              LCList: matchingPIs.flatMap(pi => pi.lcList || []),
              InvoiceList: matchingPIs.flatMap(pi => pi.invoiceList || []),
              ChallanNo: allChallans,
              history: history.slice(-CONFIG.MAX_HISTORY_ITEMS),
              itemCount: matchingPIs.reduce((sum, pi) => sum + (pi.items?.length || 0), 0),
            };
          })
          .filter(item => item !== null);
      }

      return processedData
        .filter(item => {
          const wo = normalize(item.WorkOrderNo);
          const cust = normalize(item.CustomerName);
          const del = normalize(item.DeliverName);
          const salesPerson = normalize(item.SalesPerson || 'Unknown');
          const salesPersonMatch = salesPersonSet.size === 0 || salesPersonSet.has(salesPerson);
          const buy = normalize(item.Buyer);
          const pi = normalize(item.PINO || "No PI");
          const piCompany = normalize(item.PICompany || "N/A");
          const lc = normalize((item.LCList || []).map(l => l.lcNo).join(",") || "No LC");
          const inv = normalize((item.InvoiceList || []).map(i => i.invoiceNo).join(",") || "No Invoice");
          const searchMatch = !sv || [
            wo, cust, del, pi, piCompany, buy, lc, inv,
            (item.ChallanNo || []).map(ch => ch.challanNo).join(","),
            // NEW FIELDS
            item.Style || '',
            item.Color || '',
            item.PO || '',
            item.CustomerPO || ''
          ].some(v => String(v || '').toLowerCase().includes(sv));
          const msMatch = msItems.length === 0 || msItems.some(msi => {
            const n = normalize(msi);
            return [wo, cust, del, pi, piCompany, buy, lc, inv].some(v => v.includes(n));
          });
          const orderMatch = orderSet.size === 0 || orderSet.has(wo);
          const custMatch = custSet.size === 0 || custSet.has(cust);
          const buyerMatch = buyerSet.size === 0 || buyerSet.has(buy);
          const delMatch = delSet.size === 0 || delSet.has(del);
          const favMatch = !showFavoritesOnly || favSet.has(item.WorkOrderNo);
          const challanMatch = challanSet.size === 0 || (item.ChallanNo && item.ChallanNo.some(ch => challanSet.has(normalize(ch.challanNo))));

          let dateMatch = true;
          if (dateRange?.start && dateRange?.end) {
            const orderDate = new Date(item.OrderReceiveDate);
            const start = new Date(dateRange.start);
            const end = new Date(dateRange.end);
            if (!isNaN(orderDate.getTime()) && !isNaN(start.getTime()) && !isNaN(end.getTime())) {
              start.setHours(0, 0, 0, 0);
              end.setHours(23, 59, 59, 999);
              dateMatch = orderDate >= start && orderDate <= end;
            }
          }

          let valueMatch = true;
          if (minVal !== null || maxVal !== null) {
            const tv = Number(item.TotalValue) || 0;
            if (minVal !== null && tv < minVal) valueMatch = false;
            if (maxVal !== null && tv > maxVal) valueMatch = false;
          }

          let qtyMatch = true;
          if (minQtyVal !== null || maxQtyVal !== null) {
            const tq = Number(item.TotalQty) || 0;
            if (minQtyVal !== null && tq < minQtyVal) qtyMatch = false;
            if (maxQtyVal !== null && tq > maxQtyVal) qtyMatch = false;
          }

          let statusMatch = true;
          if (statusFilter) {
            const c = parseFloat(item.completionRate);
            if (statusFilter === 'complete' && c < 100) statusMatch = false;
            if (statusFilter === 'in-progress' && (c >= 100 || c <= 0)) statusMatch = false;
            if (statusFilter === 'pending' && c > 0) statusMatch = false;
            if (statusFilter === 'multi-pi' && item.piCount < 2) statusMatch = false;
            if (statusFilter === 'high-value' && Number(item.TotalValue) < 50000) statusMatch = false;
          }

          let orderStatusMatch = true;
          if (orderStatusFilter) {
            const status = item.Status || 'Active';
            if (orderStatusFilter === 'active' && status !== 'Active') orderStatusMatch = false;
            if (orderStatusFilter === 'completed' && status !== 'Completed') orderStatusMatch = false;
            if (orderStatusFilter === 'cancelled' && status !== 'Cancelled') orderStatusMatch = false;
          }

          let deliveryStatusMatch = true;
          if (deliveryStatusFilter) {
            const hasChallan = item.ChallanNo && item.ChallanNo.length > 0;
            if (deliveryStatusFilter === 'delivered' && !hasChallan) deliveryStatusMatch = false;
            if (deliveryStatusFilter === 'pending-delivery' && hasChallan) deliveryStatusMatch = false;
          }

          const sectionMatch = !sectionFilter || normalize(item.Section) === normalize(sectionFilter);

          let lcMatch = true;
          if (lcSet.size > 0) {
            lcMatch = (item.LCList || []).some(l => lcSet.has(normalize(l.lcNo)));
          }

          let invMatch = true;
          if (invSet.size > 0) {
            invMatch = (item.InvoiceList || []).some(i => invSet.has(normalize(i.invoiceNo)));
          }

          // CHALLAN STATUS FILTER REMOVED - No longer filtering by status

          return searchMatch && msMatch && orderMatch &&
            custMatch && buyerMatch && delMatch &&
            favMatch && dateMatch && valueMatch &&
            salesPersonMatch &&
            qtyMatch && statusMatch && sectionMatch &&
            orderStatusMatch && deliveryStatusMatch &&
            lcMatch && invMatch && challanMatch;
        })
        .sort((a, b) => {
          const gp = v => {
            const parts = (v || "").split("-");
            return {
              num: Number(parts[1]) || 0,
              year: Number(parts[2]) || 0
            };
          };
          const A = gp(a.WorkOrderNo);
          const B = gp(b.WorkOrderNo);
          return B.year !== A.year ? B.year - A.year : B.num - A.num;
        });
    } catch (e) {
      console.error("Filter error:", e);
      return [];
    }
  }, [summarizedData, search, filters, normalize, multiSearchItems]);
};

const usePagination = (filteredData, itemsPerPage = CONFIG.ITEMS_PER_PAGE) => {
  const [currentPage, setCurrentPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const displayedData = filteredData.slice(currentPage * itemsPerPage, currentPage * itemsPerPage + itemsPerPage);

  const totalData = useMemo(() => {
    return displayedData.reduce((a, i) => {
      a.TotalQty += Number(i.TotalQty) || 0;
      a.ChallanQTY += Number(i.ChallanQTY) || 0;
      a.BalanceQty += Number(i.BalanceQty) || 0;
      a.TotalValue += Number(i.TotalValue) || 0;
      a.ChallanValue += Number(i.ChallanValue) || 0;
      a.BalanceValue += Number(i.BalanceValue) || 0;
      a.itemCount += 1;
      return a;
    }, { TotalQty: 0, ChallanQTY: 0, BalanceQty: 0, TotalValue: 0, ChallanValue: 0, BalanceValue: 0, itemCount: 0 });
  }, [displayedData]);

  const grandTotal = useMemo(() => {
    return filteredData.reduce((a, i) => {
      a.TotalQty += Number(i.TotalQty) || 0;
      a.ChallanQTY += Number(i.ChallanQTY) || 0;
      a.BalanceQty += Number(i.BalanceQty) || 0;
      a.TotalValue += Number(i.TotalValue) || 0;
      a.ChallanValue += Number(i.ChallanValue) || 0;
      a.BalanceValue += Number(i.BalanceValue) || 0;
      return a;
    }, { TotalQty: 0, ChallanQTY: 0, BalanceQty: 0, TotalValue: 0, ChallanValue: 0, BalanceValue: 0 });
  }, [filteredData]);

  useEffect(() => setCurrentPage(0), [filteredData.length]);

  return {
    currentPage,
    setCurrentPage,
    pageCount,
    displayedData,
    totalData,
    grandTotal,
    totalItems: filteredData.length
  };
};

// ============================================================
// ERROR BOUNDARY
// ============================================================

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 text-center">
            <div className="text-6xl mb-4">🚨</div>
            <h1 className="text-2xl font-bold text-red-600 mb-2">Something went wrong</h1>
            <p className="text-gray-600 mb-4">{this.state.error?.message || "An unexpected error occurred"}</p>
            <details className="text-left bg-gray-50 rounded-lg p-3 text-xs overflow-auto max-h-40">
              <summary className="cursor-pointer font-medium text-gray-700">Error Details</summary>
              <pre className="mt-2 text-gray-600 whitespace-pre-wrap">
                {this.state.errorInfo?.componentStack || "No stack trace available"}
              </pre>
            </details>
            <div className="mt-6 space-x-3">
              <button className="btn btn-primary text-white" onClick={() => window.location.reload()}>🔄 Reload Page</button>
              <button className="btn btn-ghost" onClick={() => { localStorage.clear(); window.location.reload(); }}>🧹 Clear & Reload</button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================
// SVG CHARTS COMPONENTS
// ============================================================

const Sparkline = React.memo(({ data, width = CONFIG.SPARKLINE_WIDTH, height = CONFIG.SPARKLINE_HEIGHT, color = "#3b82f6" }) => {
  if (!data || data.length === 0) return null;

  const validData = data.filter(d => !isNaN(d) && isFinite(d));
  if (validData.length === 0) return null;

  const max = Math.max(...validData);
  const min = Math.min(...validData);
  const range = max - min || 1;

  const points = validData.map((d, i) => {
    const x = (i / (validData.length - 1 || 1)) * width;
    const y = height - ((d - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg width={width} height={height} className="inline-block">
      <defs>
        <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#spark-${color.replace('#', '')})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={width} cy={height - ((validData[validData.length - 1] - min) / range) * height} r="2" fill={color} />
    </svg>
  );
});
Sparkline.displayName = "Sparkline";

const ProgressBar = React.memo(({ value, color, height = 6, showLabel = false, animated = true }) => {
  const v = Math.min(100, Math.max(0, parseFloat(value) || 0));
  const barColor = color || (v >= 100 ? '#10b981' : v > 50 ? '#f59e0b' : '#ef4444');

  return (
    <div className="w-full">
      <div className="w-full bg-gray-200 rounded-full overflow-hidden" style={{ height }}>
        <div
          className={cn('h-full rounded-full transition-all duration-700', animated && 'relative overflow-hidden')}
          style={{ width: `${v}%`, background: `linear-gradient(90deg, ${barColor}, ${barColor}dd)` }}
        >
          {animated && (
            <div
              className="absolute inset-0 bg-white/30"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                animation: 'shimmer 2s infinite'
              }}
            />
          )}
        </div>
      </div>
      {showLabel && <div className="text-[10px] text-gray-500 mt-0.5 text-center">{v.toFixed(0)}%</div>}
    </div>
  );
});
ProgressBar.displayName = "ProgressBar";

const ProgressRing = React.memo(({ value, size = 60, strokeWidth = 6, color, label }) => {
  const v = Math.min(100, Math.max(0, parseFloat(value) || 0));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (v / 100) * circumference;
  const ringColor = color || (v >= 100 ? '#10b981' : v > 50 ? '#f59e0b' : '#ef4444');

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#e5e7eb" strokeWidth={strokeWidth} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={ringColor} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.7s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs font-bold" style={{ color: ringColor }}>{Math.round(v)}%</span>
        {label && <span className="text-[8px] text-gray-500">{label}</span>}
      </div>
    </div>
  );
});
ProgressRing.displayName = "ProgressRing";

const DonutChart = React.memo(({ data, size = 200, thickness = 30 }) => {
  if (!data || data.length === 0) return null;
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
  return (
    <div className="flex items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} stroke="#e5e7eb" strokeWidth={thickness} fill="none" />
          {data.map((d, i) => {
            const pct = d.value / total;
            const dash = pct * circumference;
            const seg = (
              <circle key={i} cx={size / 2} cy={size / 2} r={radius}
                stroke={colors[i % colors.length]} strokeWidth={thickness} fill="none"
                strokeDasharray={`${dash} ${circumference - dash}`} strokeDashoffset={-offset}
                style={{ transition: 'stroke-dasharray 0.5s ease' }} />
            );
            offset += dash;
            return seg;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-800">{total}</span>
          <span className="text-xs text-gray-500">Total</span>
        </div>
      </div>
      <div className="space-y-1">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 rounded-sm" style={{ background: colors[i % colors.length] }} />
            <span className="font-medium truncate max-w-[120px]" title={d.label}>{d.label}</span>
            <span className="text-gray-500">({((d.value / total) * 100).toFixed(1)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
});
DonutChart.displayName = "DonutChart";

const BarChartMini = React.memo(({ data, width = 300, height = 150 }) => {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.value)) || 1;
  const barWidth = (width - 20) / data.length - 4;
  return (
    <svg width={width} height={height} className="overflow-visible">
      {data.map((d, i) => {
        const h = (d.value / max) * (height - 30);
        const x = 10 + i * (barWidth + 4);
        const y = height - h - 20;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barWidth} height={h} fill="url(#barGrad)" rx="2"
              style={{ transition: 'all 0.5s ease' }}>
              <title>{d.label}: {d.value}</title>
            </rect>
            <text x={x + barWidth / 2} y={height - 8} textAnchor="middle" className="text-[9px] fill-gray-500">
              {d.label.length > 8 ? d.label.slice(0, 8) + '…' : d.label}
            </text>
            <text x={x + barWidth / 2} y={y - 4} textAnchor="middle" className="text-[8px] fill-gray-700 font-bold">
              {d.value > 999 ? `${(d.value / 1000).toFixed(1)}k` : d.value}
            </text>
          </g>
        );
      })}
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
    </svg>
  );
});
BarChartMini.displayName = "BarChartMini";

// ============================================================
// COMPONENT: EXPANDABLE SUMMARY CARDS
// ============================================================
const ExpandableSummaryCards = React.memo(({ data, onQuickView, onFilter }) => {
  const [expandedCard, setExpandedCard] = useState(null);
  const [showAllModal, setShowAllModal] = useState(false);
  const [modalData, setModalData] = useState([]);
  const [modalTitle, setModalTitle] = useState('');
  const [modalIcon, setModalIcon] = useState('');

  // ===== REMOVE activeCategory state - we'll show ALL categories =====
  // const [activeCategory, setActiveCategory] = useState('customers');

  const summaryData = useMemo(() => {
    if (!data || data.length === 0) return {};

    const categoryFieldMap = {
      customers: 'CustomerName',
      salesPersons: 'SalesPerson',
      buyers: 'Buyer',
      deliveries: 'DeliverName',
      sections: 'Section',
      piCompanies: 'PICompany'
    };

    const result = {};

    Object.keys(categoryFieldMap).forEach(category => {
      const field = categoryFieldMap[category];
      const groupMap = new Map();

      data.forEach(item => {
        const name = item[field] || 'Unknown';
        if (!groupMap.has(name)) {
          groupMap.set(name, {
            name,
            totalOrders: 0,
            totalValue: 0,
            totalQty: 0,
            completedOrders: 0,
            orders: []
          });
        }
        const group = groupMap.get(name);
        group.totalOrders += 1;
        group.totalValue += Number(item.TotalValue) || 0;
        group.totalQty += Number(item.TotalQty) || 0;
        if (parseFloat(item.completionRate) >= 100) group.completedOrders += 1;
        group.orders.push(item);
      });

      result[category] = Array.from(groupMap.values())
        .sort((a, b) => b.totalValue - a.totalValue);
    });

    return result;
  }, [data]);

  const categoryConfig = {
    customers: { icon: '👤', label: 'Customers', color: 'blue' },
    salesPersons: { icon: '👤', label: 'Sales Persons', color: 'indigo' },
    buyers: { icon: '💼', label: 'Buyers', color: 'purple' },
    deliveries: { icon: '🚚', label: 'Deliveries', color: 'green' },
    sections: { icon: '📦', label: 'Sections', color: 'orange' },
    piCompanies: { icon: '🏢', label: 'PI Companies', color: 'teal' }
  };

  const handleViewAll = (category, items) => {
    const config = categoryConfig[category];
    setModalData(items || []);
    setModalTitle(config.label);
    setModalIcon(config.icon);
    setShowAllModal(true);
  };

  // Check if any data exists
  const hasData = Object.values(summaryData).some(arr => arr && arr.length > 0);
  if (!hasData) return null;

  return (
    <>
      {/* ===== CARDS DISPLAY - ALL CATEGORIES SIDE BY SIDE ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 mb-4">
        {Object.keys(categoryConfig).map(category => {
          const items = summaryData[category] || [];
          const config = categoryConfig[category];
          const displayItems = items.slice(0, CONFIG.TOP_ITEMS_COUNT);
          const hasMore = items.length > CONFIG.TOP_ITEMS_COUNT;

          if (items.length === 0) return null;

          return (
            <div
              key={category}
              className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm p-3 border transition-all hover:shadow-md"
            >
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {config.icon} {config.label}
                  <span className="ml-1 text-[10px] font-normal text-gray-400">
                    ({items.length})
                  </span>
                </h4>
                {hasMore && (
                  <button
                    className="text-[10px] text-blue-500 font-medium hover:text-blue-700"
                    onClick={() => handleViewAll(category, items)}
                  >
                    ▼ View All
                  </button>
                )}
              </div>

              <div className="mt-1.5 space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                {displayItems.map((item, idx) => (
                  <div
                    key={`${category}-${item.name}-${idx}`}
                    className="flex items-center justify-between group hover:bg-gray-50 rounded px-1 py-0.5 cursor-pointer transition-colors"
                  // onClick={() => {
                  //   if (item.orders && item.orders.length > 0) {
                  //     onQuickView(item.orders[0]);
                  //   }
                  // }}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className={cn(
                        'text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full flex-shrink-0',
                        idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                          idx === 1 ? 'bg-gray-300 text-gray-700' :
                            idx === 2 ? 'bg-orange-300 text-orange-900' :
                              'bg-blue-100 text-blue-700'
                      )}>
                        {idx + 1}
                      </span>
                      <span className="text-xs truncate" title={item.name}>
                        {item.name}
                      </span>
                      {item.totalOrders > 1 && (
                        <span className="text-[9px] text-gray-400 flex-shrink-0">
                          ({item.totalOrders} ord)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] flex-shrink-0">
                      <span className="font-semibold text-blue-600">
                        {formatCurrency(item.totalValue)}
                      </span>
                      <span className="text-gray-400 text-[9px]">
                        {formatNumber(item.totalQty)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {showAllModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="flex justify-between items-center p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
              <div>
                <h3 className="text-lg font-bold">
                  {modalIcon} All {modalTitle}
                </h3>
                <p className="text-xs text-gray-500">
                  {modalData.length} items found • Sorted by value
                </p>
              </div>
              <button
                className="btn btn-ghost btn-sm btn-circle hover:bg-gray-200 text-lg"
                onClick={() => setShowAllModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {modalData.map((item, idx) => (
                <div
                  key={`modal-${modalTitle}-${idx}`}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border-b last:border-b-0 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-xs font-bold text-gray-400 w-8 text-right">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{item.name}</div>
                      <div className="text-xs text-gray-500">
                        {item.totalOrders} orders • Qty: {formatNumber(item.totalQty)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-bold text-blue-600">
                        {formatCurrency(item.totalValue)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.totalOrders > 0
                          ? `${Math.round((item.completedOrders / item.totalOrders) * 100)}% complete`
                          : 'No orders'
                        }
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 border-t bg-gray-50 text-xs text-gray-500 flex justify-between">
              <span>Click any item to view order details</span>
              <button
                className="btn btn-xs btn-ghost text-red-500"
                onClick={() => setShowAllModal(false)}
              >
                Close ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});
ExpandableSummaryCards.displayName = "ExpandableSummaryCards";
// ============================================================
// COMPONENT: PI MATCH FILTER
// ============================================================



const PIMatchFilter = React.memo(({
  availablePIs,
  selectedPIs,
  onToggle,
  onClear,
  data,
  label = "PI Match",
  icon = "📋"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  const multiPIOrders = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.filter(order => order.piCount > 1);
  }, [data]);

  const allPIs = useMemo(() => {
    const piSet = new Set();
    multiPIOrders.forEach(order => {
      order.PIList.forEach(pi => piSet.add(pi.piNo));
    });
    return [...piSet];
  }, [multiPIOrders]);

  const filteredOrders = useMemo(() => {
    let list = multiPIOrders;

    if (selectedPIs && selectedPIs.length > 0) {
      list = list.filter(order =>
        selectedPIs.every(pi => order.PIList.some(p => p.piNo === pi))
      );
    }

    if (search && search.trim()) {
      const searchLower = search.toLowerCase().trim();
      list = list.filter(order =>
        order.WorkOrderNo.toLowerCase().includes(searchLower) ||
        order.CustomerName.toLowerCase().includes(searchLower) ||
        order.PIList.some(pi => pi.piNo.toLowerCase().includes(searchLower))
      );
    }

    return list;
  }, [multiPIOrders, selectedPIs, search]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current?.contains(event.target) || buttonRef.current?.contains(event.target)) return;
      setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = (pi) => {
    if (Array.isArray(pi)) {
      onToggle(pi);
    } else {
      onToggle(pi);
    }
  };

  const handleSelectAll = () => {
    onToggle(allPIs);
  };

  const handleClear = () => {
    onClear();
    setIsOpen(false);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleAutoSelectMultiPIs = () => {
    const allMultiPIs = new Set();
    multiPIOrders.forEach(order => {
      order.PIList.forEach(pi => allMultiPIs.add(pi.piNo));
    });
    onToggle([...allMultiPIs]);
    toast.success(`Selected ${allMultiPIs.size} PIs from ${multiPIOrders.length} multi-PI orders`);
    setIsOpen(false);
  };

  const getOrderSelectionStatus = (order) => {
    if (!selectedPIs || selectedPIs.length === 0) return 'none';
    const hasAll = selectedPIs.every(pi => order.PIList.some(p => p.piNo === pi));
    const hasSome = selectedPIs.some(pi => order.PIList.some(p => p.piNo === pi));
    if (hasAll) return 'all';
    if (hasSome) return 'some';
    return 'none';
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        data-pi-match
        className={cn('btn btn-xs gap-1 transition-all',
          selectedPIs && selectedPIs.length > 0 ? 'btn-warning text-white' : 'btn-ghost bg-white/80 backdrop-blur-sm'
        )}
        onClick={() => setIsOpen(!isOpen)}
        title="Filter orders by PIs - shows orders containing selected PIs"
      >
        {icon} {label}
        {selectedPIs && selectedPIs.length > 0 && (
          <span className="badge badge-xs badge-info">{selectedPIs.length} PIs</span>
        )}
        {multiPIOrders.length > 0 && (!selectedPIs || selectedPIs.length === 0) && (
          <span className="badge badge-xs badge-success">{multiPIOrders.length} multi-PI</span>
        )}
        <span>{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute left-0 mt-1 bg-white shadow-xl rounded-xl p-3 w-[500px] z-50 border border-gray-200 max-h-[650px] flex flex-col"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-sm">📋 Multi-PI Orders</span>
            <div className="flex gap-1">
              <button
                className="text-[10px] text-blue-600 hover:text-blue-800 px-2 py-0.5 rounded hover:bg-blue-50"
                onClick={handleSelectAll}
              >
                Select All
              </button>
              <button
                className="text-[10px] text-red-500 hover:text-red-700 px-2 py-0.5 rounded hover:bg-red-50"
                onClick={handleClear}
              >
                Clear
              </button>
              <button
                className="text-[10px] text-gray-400 hover:text-gray-600 px-2 py-0.5 rounded hover:bg-gray-50"
                onClick={handleClose}
              >
                ✕ Close
              </button>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-2 mb-2 text-xs">
            <div className="flex justify-between">
              <span>📊 <span className="font-medium">{multiPIOrders.length}</span> orders with multiple PIs</span>
              <span>📋 <span className="font-medium">{allPIs.length}</span> total PIs</span>
              {selectedPIs && selectedPIs.length > 0 && (
                <span className="text-blue-600">🔍 {filteredOrders.length} matched</span>
              )}
            </div>
          </div>

          <div className="flex gap-1 mb-2">
            <button
              className="btn btn-xs btn-success text-white flex-1"
              onClick={handleAutoSelectMultiPIs}
              disabled={multiPIOrders.length === 0}
            >
              ⚡ Auto Select All PIs
            </button>
          </div>

          <div className="mb-2">
            <input
              type="text"
              placeholder="Search by Order No, Customer, or PI..."
              className="input input-xs input-bordered w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="text-[10px] text-gray-500 mb-2">
            {selectedPIs && selectedPIs.length > 0 ? (
              <span className="text-blue-600">
                🔍 Showing orders containing ALL {selectedPIs.length} selected PI(s)
              </span>
            ) : (
              <span>Select PIs below to filter orders containing ALL selected PIs</span>
            )}
          </div>

          {selectedPIs && selectedPIs.length > 0 && (
            <div className="mb-2 p-1.5 bg-gray-50 rounded border border-gray-200 max-h-[60px] overflow-y-auto">
              <div className="flex flex-wrap gap-1">
                {selectedPIs.map(pi => (
                  <span key={pi} className="badge badge-xs badge-info gap-1">
                    {pi}
                    <button
                      className="ml-0.5 hover:text-red-500"
                      onClick={() => handleToggle(pi)}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto max-h-[320px] space-y-2">
            {filteredOrders.length === 0 ? (
              <div className="text-center text-gray-400 text-xs py-8">
                {selectedPIs && selectedPIs.length > 0
                  ? 'No multi-PI orders contain all selected PIs'
                  : 'No multi-PI orders found'}
              </div>
            ) : (
              filteredOrders.map((order, orderIndex) => {
                const status = getOrderSelectionStatus(order);
                const isHighlighted = status === 'all' || !selectedPIs || selectedPIs.length === 0;

                return (
                  <div
                    key={`${order.WorkOrderNo}-${orderIndex}`}
                    className={cn(
                      'p-3 rounded-lg border-2 transition-all',
                      isHighlighted ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white',
                      status === 'some' && !isHighlighted ? 'border-yellow-400 bg-yellow-50' : ''
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-gray-800">
                            📦 {order.WorkOrderNo}
                          </span>
                          <span className="badge badge-info badge-sm">
                            {order.piCount} PIs
                          </span>
                          {status === 'all' && selectedPIs && selectedPIs.length > 0 && (
                            <span className="badge badge-success badge-sm">✓ Match</span>
                          )}
                          {status === 'some' && selectedPIs && selectedPIs.length > 0 && (
                            <span className="badge badge-warning badge-sm">Partial</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          👤 {order.CustomerName}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <div className="text-sm font-bold text-blue-600">
                          {formatCurrency(order.TotalValue)}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {order.completionRate}% complete
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 my-2"></div>

                    <div className="space-y-1.5">
                      {order.PIList.map((pi, piIndex) => {
                        const isSelected = selectedPIs && selectedPIs.includes(pi.piNo);
                        return (
                          <div
                            key={`${order.WorkOrderNo}-${pi.piNo}-${piIndex}`}
                            className={cn(
                              'flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer',
                              isSelected
                                ? 'bg-blue-200 border-l-4 border-blue-600'
                                : 'bg-gray-100 border-l-4 border-transparent hover:bg-gray-200'
                            )}
                            onClick={() => handleToggle(pi.piNo)}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <span
                                className={cn(
                                  'font-mono font-semibold text-xs transition-all flex-shrink-0',
                                  isSelected ? 'text-blue-700' : 'text-gray-700'
                                )}
                              >
                                {isSelected ? '✅' : '📄'} {pi.piNo}
                              </span>
                              <span className="text-[10px] text-gray-500">
                                Qty: {formatNumber(pi.qty)}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 flex-shrink-0">
                              <span className="text-xs font-semibold text-green-600">
                                💰 {formatCurrency(pi.value)}
                              </span>
                              {pi.challanQty > 0 && (
                                <span className="text-[10px] text-blue-500">
                                  Ch: {formatNumber(pi.challanQty)}
                                </span>
                              )}
                              {pi.balanceQty > 0 && (
                                <span className="text-[10px] text-red-400">
                                  Bal: {formatNumber(pi.balanceQty)}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-2 pt-2 border-t text-[10px] text-gray-400 flex justify-between items-center">
            <div>
              {selectedPIs && selectedPIs.length > 0 ? (
                <span>🎯 {selectedPIs.length} PI(s) selected • {filteredOrders.length} orders match</span>
              ) : (
                <span>📊 {multiPIOrders.length} total multi-PI orders</span>
              )}
            </div>
            <button
              className="btn btn-xs btn-ghost text-red-500"
              onClick={handleClose}
            >
              ✕ Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
PIMatchFilter.displayName = "PIMatchFilter";

// ============================================================
// COMPONENT: BACKGROUND GENERATOR
// ============================================================

const BackgroundGenerator = React.memo(({ children, theme, onBackgroundChange }) => {
  const backgrounds = theme === 'dark' ? DARK_BACKGROUNDS : BACKGROUNDS;
  const [currentBg, setCurrentBg] = useState(() => backgrounds[Math.floor(Math.random() * backgrounds.length)]);
  const [isHovering, setIsHovering] = useState(false);

  const changeBackground = useCallback(() => {
    let newBg;
    do {
      newBg = backgrounds[Math.floor(Math.random() * backgrounds.length)];
    } while (newBg === currentBg && backgrounds.length > 1);
    setCurrentBg(newBg);
    onBackgroundChange?.(newBg);
    toast.info(`Theme: ${newBg.name}`, { autoClose: 1500 });
  }, [currentBg, backgrounds, onBackgroundChange]);

  const patternClass = useMemo(() => {
    const patterns = {
      dots: 'bg-[radial-gradient(currentColor_1px,transparent_1px)] bg-[length:20px_20px]',
      grid: 'bg-[linear-gradient(currentColor_1px,transparent_1px),linear-gradient(90deg,currentColor_1px,transparent_1px)] bg-[length:20px_20px]',
      cross: 'bg-[linear-gradient(45deg,currentColor_2px,transparent_2px),linear-gradient(-45deg,currentColor_2px,transparent_2px)] bg-[length:20px_20px]',
      diamond: 'bg-[linear-gradient(45deg,currentColor_2px,transparent_2px)] bg-[length:20px_20px]',
      stripe: 'bg-[linear-gradient(45deg,currentColor_2px,transparent_2px,transparent_4px)] bg-[length:20px_20px]',
      wave: 'bg-[radial-gradient(circle_at_20px_20px,currentColor_2px,transparent_2px)] bg-[length:40px_40px]',
      circle: 'bg-[radial-gradient(currentColor_2px,transparent_2px)] bg-[length:20px_20px]',
      hex: 'bg-[linear-gradient(30deg,currentColor_2px,transparent_2px),linear-gradient(-30deg,currentColor_2px,transparent_2px)] bg-[length:20px_20px]',
    };
    return patterns[currentBg.pattern] || patterns.dots;
  }, [currentBg]);

  return (
    <div
      className={cn('relative min-h-screen transition-all duration-1000 bg-gradient-to-br', currentBg.gradient, theme === 'dark' ? 'text-gray-100' : 'text-gray-800')}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className={cn('absolute inset-0 opacity-5 pointer-events-none', patternClass)} />
      <div className={cn('fixed bottom-4 right-4 z-50 transition-opacity duration-300', isHovering ? 'opacity-100' : 'opacity-0')}>
        <button
          className="btn btn-sm btn-primary text-white shadow-lg rounded-full w-12 h-12 flex items-center justify-center hover:scale-110 transition-transform"
          onClick={changeBackground}
          title="Change Background"
        >
          🎨
        </button>
      </div>
      <div className={cn('fixed bottom-4 left-4 z-50 opacity-20 hover:opacity-100 transition-opacity')}>
        <div className={cn('text-xs px-2 py-1 rounded-full backdrop-blur-sm', theme === 'dark' ? 'bg-white/10 text-gray-300' : 'bg-white/50 text-gray-600')}>
          {currentBg.name}
        </div>
      </div>
      {children}
    </div>
  );
});
BackgroundGenerator.displayName = "BackgroundGenerator";

// ============================================================
// COMPONENT: SKELETON LOADER
// ============================================================

const SkeletonRow = React.memo(() => (
  <tr>
    {Array.from({ length: 14 }).map((_, i) => (
      <td key={i} className="px-2 py-2">
        <div className="h-3 bg-gray-200 rounded animate-pulse" style={{ width: `${50 + Math.random() * 50}%` }} />
      </td>
    ))}
  </tr>
));
SkeletonRow.displayName = "SkeletonRow";

const TableSkeleton = React.memo(() => (
  <div className="border rounded-xl overflow-hidden bg-white/95">
    <div className="h-10 bg-gradient-to-r from-blue-600 to-blue-700" />
    <table className="table table-xs w-full">
      <tbody>
        {Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} />)}
      </tbody>
    </table>
  </div>
));
TableSkeleton.displayName = "TableSkeleton";

// ============================================================
// COMPONENT: COMMAND PALETTE
// ============================================================

const CommandPalette = React.memo(({ isOpen, onClose, commands }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const filteredCommands = useMemo(() => {
    if (!query) return commands;
    const lowerQuery = query.toLowerCase();
    return commands.filter(c =>
      c.label.toLowerCase().includes(lowerQuery) ||
      c.category.toLowerCase().includes(lowerQuery) ||
      (c.shortcut && c.shortcut.toLowerCase().includes(lowerQuery))
    );
  }, [commands, query]);

  useEffect(() => setSelectedIndex(0), [query]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    }
    if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
      e.preventDefault();
      filteredCommands[selectedIndex].action();
      onClose();
    }
    if (e.key === 'Escape') onClose();
  }, [filteredCommands, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-[99999] pt-20 px-4 animate-fadeIn" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          <span className="text-gray-400">🔍</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 outline-none text-sm bg-transparent"
          />
          <kbd className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">ESC</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No commands found</div>
          ) : (
            filteredCommands.map((cmd, i) => (
              <button
                key={i}
                className={cn('w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors',
                  i === selectedIndex && 'bg-blue-50 border-l-4 border-blue-500'
                )}
                onClick={() => { cmd.action(); onClose(); }}
                onMouseEnter={() => setSelectedIndex(i)}
              >
                <span className="text-lg">{cmd.icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium">{cmd.label}</div>
                  <div className="text-[10px] text-gray-400">{cmd.category}</div>
                </div>
                {cmd.shortcut && <kbd className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{cmd.shortcut}</kbd>}
              </button>
            ))
          )}
        </div>
        <div className="px-4 py-2 border-t bg-gray-50 text-[10px] text-gray-400 flex justify-between">
          <span>↑↓ Navigate • Enter Select • ESC Close</span>
          <span>{filteredCommands.length} commands</span>
        </div>
      </div>
    </div>
  );
});
CommandPalette.displayName = "CommandPalette";

// ============================================================
// COMPONENT: KEYBOARD SHORTCUTS OVERLAY
// ============================================================

const KeyboardShortcutsOverlay = React.memo(({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { keys: 'Ctrl+F', desc: 'Focus search bar' },
    { keys: 'Ctrl+K', desc: 'Open command palette' },
    { keys: 'Ctrl+A', desc: 'Select all rows on page' },
    { keys: 'Ctrl+T', desc: 'Run Deep Think analysis' },
    { keys: 'Ctrl+D', desc: 'Toggle dark mode' },
    { keys: 'Ctrl+E', desc: 'Export data' },
    { keys: 'Ctrl+\\', desc: 'Toggle view mode (Table/Dashboard)' },
    { keys: 'ESC', desc: 'Close dialogs / Clear search' },
    { keys: '?', desc: 'Show this help' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999] p-4 animate-fadeIn" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">⌨️ Keyboard Shortcuts</h2>
          <button className="btn btn-ghost btn-sm btn-circle" onClick={onClose}>✕</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {shortcuts.map((s, i) => (
            <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">{s.desc}</span>
              <kbd className="text-xs bg-white border px-2 py-1 rounded shadow-sm font-mono">{s.keys}</kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
KeyboardShortcutsOverlay.displayName = "KeyboardShortcutsOverlay";

// ============================================================
// COMPONENT: BULK ACTIONS TOOLBAR
// ============================================================

const BulkActionsToolbar = React.memo(({ selectedCount, onClear, onExport, onFavorite, onDelete, onAssign }) => (
  <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 animate-slideUp">
    <div className="bg-gray-900 text-white rounded-full shadow-2xl px-4 py-2 flex items-center gap-3">
      <span className="text-sm font-medium">{selectedCount} selected</span>
      <div className="h-4 w-px bg-gray-700" />
      <button className="btn btn-ghost btn-xs text-white hover:bg-gray-800" onClick={onExport} title="Export selected">⬇ Export</button>
      <button className="btn btn-ghost btn-xs text-white hover:bg-gray-800" onClick={onFavorite} title="Add to favorites">⭐ Favorite</button>
      <button className="btn btn-ghost btn-xs text-white hover:bg-gray-800" onClick={onAssign} title="Assign tag">🏷️ Tag</button>
      <button className="btn btn-ghost btn-xs text-red-400 hover:bg-red-900/30" onClick={onDelete} title="Clear selection">✕ Clear</button>
    </div>
  </div>
));
BulkActionsToolbar.displayName = "BulkActionsToolbar";

// ============================================================
// COMPONENT: MULTI-SEARCH DROPDOWN
// ============================================================

const MultiSearchDropdown = React.memo(({ value, onChange, onClear, onSearch, totalMatches, isActive }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef(null);

  const handleKeyDown = useCallback((e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onSearch();
    }
  }, [onSearch]);

  const matchCount = value ? value.split(/[\n,;|]+/).filter(s => s.trim()).length : 0;

  return (
    <div className="relative">
      <button
        className={cn('btn btn-xs gap-1 transition-all',
          isActive || matchCount > 0 ? 'btn-warning text-white' : 'btn-ghost bg-white/80 backdrop-blur-sm'
        )}
        onClick={() => setIsExpanded(!isExpanded)}
        title="Multi-search orders"
      >
        🔍 Multi-Search
        {matchCount > 0 && <span className="badge badge-xs badge-info">{matchCount}</span>}
        <span>{isExpanded ? '▲' : '▼'}</span>
      </button>
      {isExpanded && (
        <div className="absolute left-0 mt-1 bg-white shadow-xl rounded-xl p-3 w-80 z-50 border border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-xs">📋 Multi-Order Search</span>
            <div className="flex gap-1">
              {value?.trim() && (
                <button
                  className="text-[10px] text-red-500 hover:text-red-700 px-2 py-0.5 rounded hover:bg-red-50"
                  onClick={() => { onChange(''); onClear?.(); }}
                >
                  Clear
                </button>
              )}
              <button
                className="text-[10px] text-gray-400 hover:text-gray-600 px-2 py-0.5 rounded hover:bg-gray-50"
                onClick={() => setIsExpanded(false)}
              >
                ✕
              </button>
            </div>
          </div>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={e => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Paste order numbers (one per line)..."
            className="textarea textarea-bordered w-full text-xs font-mono min-h-[120px] max-h-[200px] resize-y"
            autoFocus
          />
          <div className="flex justify-between items-center mt-2 text-[10px] text-gray-400">
            <span>{matchCount > 0 ? `${matchCount} items entered` : 'Paste order numbers'}</span>
            {matchCount > 0 && <span className="text-gray-600">Press Ctrl+Enter</span>}
          </div>
          {matchCount > 0 && (
            <button className="btn btn-primary btn-xs w-full text-white mt-2" onClick={() => { onSearch(); setIsExpanded(false); }}>
              🔍 Search {matchCount} Orders
            </button>
          )}
          {totalMatches > 0 && matchCount > 0 && (
            <div className="mt-2 p-2 bg-green-50 rounded text-[10px] text-green-700 border border-green-200">
              ✅ Found {totalMatches} matching orders
            </div>
          )}
        </div>
      )}
    </div>
  );
});
MultiSearchDropdown.displayName = "MultiSearchDropdown";

// ============================================================
// COMPONENT: DEEP THINKING
// ============================================================

const DeepThinking = React.memo(({ data, onInsight }) => {
  const [isThinking, setIsThinking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [abortController, setAbortController] = useState(null);
  const { toggle, buttonRef } = useDropdown();
  const hasData = data && data.length > 0;

  const generateInsights = useCallback(() => {
    if (isThinking || !hasData) return;

    setIsThinking(true);
    setProgress(0);
    setCurrentStep('Initializing analysis...');

    const controller = new AbortController();
    setAbortController(controller);

    const steps = [
      { label: '📊 Analyzing data structure...', weight: 10 },
      { label: '📈 Processing metrics...', weight: 25 },
      { label: '🔍 Identifying patterns...', weight: 35 },
      { label: '🧠 Generating insights...', weight: 30 },
    ];

    let stepIdx = 0;
    let currentProgress = 0;

    const interval = setInterval(() => {
      if (controller.signal.aborted) {
        clearInterval(interval);
        return;
      }

      if (stepIdx < steps.length) {
        const step = steps[stepIdx];
        currentProgress += step.weight;
        setProgress(Math.min(100, currentProgress));
        setCurrentStep(step.label);
        stepIdx++;

        if (stepIdx >= steps.length) {
          clearInterval(interval);
          completeAnalysis();
        }
      }
    }, 600);

    const completeAnalysis = () => {
      try {
        const insights = [];
        const totalOrders = data.length;
        const totalValue = data.reduce((s, d) => s + Number(d.TotalValue || 0), 0);
        const totalQty = data.reduce((s, d) => s + Number(d.TotalQty || 0), 0);
        const totalChallanQty = data.reduce((s, d) => s + Number(d.ChallanQTY || 0), 0);
        const completionRate = totalQty > 0 ? (totalChallanQty / totalQty) * 100 : 0;

        if (completionRate < 50) {
          insights.push({
            icon: '⚠️',
            title: 'Low Overall Completion',
            description: `Only ${completionRate.toFixed(1)}% delivered. Prioritize pending orders.`,
            priority: 'critical'
          });
        } else if (completionRate < 80) {
          insights.push({
            icon: '📊',
            title: 'Moderate Completion',
            description: `${completionRate.toFixed(1)}% completion. Focus on pending orders.`,
            priority: 'high'
          });
        } else {
          insights.push({
            icon: '✅',
            title: 'High Completion Rate',
            description: `${completionRate.toFixed(1)}% achieved. Excellent!`,
            priority: 'low'
          });
        }

        const multiPIOrders = data.filter(d => d.piCount > 1);
        if (multiPIOrders.length > 0) {
          insights.push({
            icon: '📋',
            title: 'Multi-PI Orders',
            description: `${multiPIOrders.length} orders with multiple PIs. Avg: ${(multiPIOrders.reduce((s, d) => s + d.piCount, 0) / multiPIOrders.length).toFixed(1)} PIs/order`,
            priority: 'medium'
          });
        }

        const customerMap = new Map();
        data.forEach(d => {
          const n = d.CustomerName || "Unknown";
          customerMap.set(n, {
            value: (customerMap.get(n)?.value || 0) + Number(d.TotalValue || 0),
            count: (customerMap.get(n)?.count || 0) + 1
          });
        });
        const topCustomer = [...customerMap.entries()].sort((a, b) => b[1].value - a[1].value)[0];
        if (topCustomer) {
          insights.push({
            icon: '🏆',
            title: 'Top Customer',
            description: `${topCustomer[0]}: ${topCustomer[1].count} orders, ${formatCurrency(topCustomer[1].value)}.`,
            priority: 'medium'
          });
        }

        const pendingOrders = data.filter(d => parseFloat(d.completionRate) < 50);
        if (pendingOrders.length > 0) {
          insights.push({
            icon: '📋',
            title: 'Pending Orders',
            description: `${pendingOrders.length} orders <50% completion.`,
            priority: 'high'
          });
        }

        if (totalValue > 1000000) {
          insights.push({
            icon: '💰',
            title: 'High Value Volume',
            description: `Total exceeds $1M (${formatCurrency(totalValue)}).`,
            priority: 'high'
          });
        }

        onInsight?.(insights);
        toast.success(`🧠 ${insights.length} insights generated!`);
        setIsThinking(false);
        setProgress(100);
        setCurrentStep('✅ Analysis complete!');
      } catch (error) {
        console.error('DeepThink error:', error);
        toast.error('Analysis failed: ' + error.message);
        setIsThinking(false);
        setProgress(0);
        setCurrentStep('');
      }
    };
  }, [data, onInsight, isThinking, hasData]);

  useEffect(() => {
    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
  }, [abortController]);

  const status = isThinking
    ? { text: '🧠 Thinking...', color: 'btn-warning', disabled: true }
    : !hasData
      ? { text: '🔒 No Data', color: 'btn-disabled', disabled: true }
      : { text: '🤔 Deep Think', color: 'btn-primary', disabled: false };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        className={cn('btn btn-xs gap-1 text-white transition-all', status.color, isThinking && 'animate-pulse')}
        onClick={() => {
          if (!isThinking && hasData) {
            generateInsights();
          }
        }}
        disabled={status.disabled}
        title={!hasData ? "No data" : "Deep Think - AI Analysis"}
        data-deep-think
      >
        {status.text}
        {isThinking && (
          <span className="badge badge-xs badge-info ml-1">
            {Math.round(progress)}%
          </span>
        )}
        {hasData && !isThinking && (
          <span className="badge badge-xs badge-success ml-1">
            {data.length}
          </span>
        )}
      </button>

      {isThinking && currentStep && (
        <div className="absolute left-0 mt-1 bg-white shadow-xl rounded-lg p-2 w-64 z-50 border border-gray-200 text-xs">
          <div className="flex items-center gap-2">
            <span className="animate-pulse">⏳</span>
            <span className="text-gray-700">{currentStep}</span>
          </div>
          <div className="mt-2 bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-500 h-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
});
DeepThinking.displayName = "DeepThinking";

// ============================================================
// COMPONENT: QUICK VIEW MODAL
// ============================================================

// ============================================================
// COMPONENT: QUICK VIEW MODAL - REDESIGNED
// ============================================================

const QuickViewModal = React.memo(({ item, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  useEffect(() => setActiveTab('overview'), [item]);

  if (!isOpen || !item) return null;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'quantities', label: 'Quantities', icon: '📊' },
    { id: 'financials', label: 'Financials', icon: '💰' },
    { id: 'challans', label: 'Challans', icon: '🚚' },
    { id: 'documents', label: 'Documents', icon: '📄' },
    { id: 'pis', label: 'PIs', icon: '📋' },
  ];

  // Helper to get status color
  const getStatusColor = (rate) => {
    const c = parseFloat(rate);
    if (c >= 100) return 'text-green-600 bg-green-50 border-green-200';
    if (c > 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getStatusLabel = (rate) => {
    const c = parseFloat(rate);
    if (c >= 100) return 'Complete';
    if (c > 50) return 'In Progress';
    return 'Pending';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999] p-4 animate-fadeIn" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold truncate">{item.WorkOrderNo}</h2>
            <p className="text-sm opacity-90 truncate">
              {item.CustomerName} • {formatDate(item.OrderReceiveDate)}
              {order.SalesPerson && order.SalesPerson !== 'Unknown' && (
                <span className="ml-2 inline-flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                  👤 {order.SalesPerson}
                </span>
              )}
              {item.piCount > 1 && (
                <span className="ml-2 inline-flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                  📋 {item.piCount} PIs
                </span>
              )}
              {item.PICompany && item.PICompany !== 'N/A' && (
                <span className="ml-2 inline-flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                  🏢 {item.PICompany}
                </span>
              )}
            </p>
          </div>
          <button
            className="ml-4 p-1.5 rounded-lg hover:bg-white/20 transition-colors flex-shrink-0"
            onClick={onClose}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-gray-50/80 overflow-x-auto px-4 gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={cn(
                'px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap flex items-center gap-2',
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 bg-white -mb-px rounded-t-lg'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Status Card */}
              <div className={cn(
                'p-4 rounded-xl border-2',
                getStatusColor(item.completionRate)
              )}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Order Status</div>
                    <div className="text-2xl font-bold mt-1">
                      {getStatusLabel(item.completionRate)}
                    </div>
                    <div className="text-sm opacity-75 mt-0.5">
                      {item.completionRate}% Complete
                    </div>
                  </div>
                  <div className="relative w-20 h-20">
                    <svg className="w-20 h-20 -rotate-90">
                      <circle cx="40" cy="40" r="32" stroke="#e5e7eb" strokeWidth="6" fill="none" />
                      <circle
                        cx="40" cy="40" r="32"
                        stroke={parseFloat(item.completionRate) >= 100 ? '#10b981' : parseFloat(item.completionRate) > 50 ? '#f59e0b' : '#ef4444'}
                        strokeWidth="6"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 32 * (parseFloat(item.completionRate) / 100)} ${2 * Math.PI * 32}`}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dasharray 0.7s ease' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold">{Math.round(parseFloat(item.completionRate))}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  ['Order No', item.WorkOrderNo],
                  ['Date', formatDate(item.OrderReceiveDate)],
                  ['Customer', item.CustomerName],
                  ['Delivery', item.DeliverName],
                  ['Buyer', item.Buyer || 'N/A'],
                  ['Section', item.Section],
                  ['PI Count', item.piCount],
                  ['Items', item.itemCount],
                  ['PI Company', item.PICompany || 'N/A'],
                ].map(([label, val]) => (
                  <div key={label} className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-500 uppercase tracking-wider">{label}</div>
                    <div className="font-medium text-sm truncate mt-0.5" title={String(val)}>
                      {String(val) || '-'}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  ['Order Qty', formatNumber(item.TotalQty), 'text-blue-600'],
                  ['Challan Qty', formatNumber(item.ChallanQTY), 'text-green-600'],
                  ['Balance Qty', formatNumber(item.BalanceQty), 'text-red-600'],
                ].map(([label, val, color]) => (
                  <div key={label} className="bg-gray-50 p-3 rounded-lg text-center">
                    <div className="text-xs text-gray-500">{label}</div>
                    <div className={cn('text-lg font-bold', color)}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'quantities' && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                {[
                  ['Total Order Qty', formatNumber(item.TotalQty), '📦', 'bg-blue-50 text-blue-600'],
                  ['Challan Qty', formatNumber(item.ChallanQTY), '✅', 'bg-green-50 text-green-600'],
                  ['Balance Qty', formatNumber(item.BalanceQty), '⏳', 'bg-red-50 text-red-600'],
                ].map(([label, val, icon, bgClass]) => (
                  <div key={label} className={cn('p-4 rounded-xl text-center', bgClass)}>
                    <div className="text-2xl">{icon}</div>
                    <div className="text-xs text-gray-500 mt-1">{label}</div>
                    <div className="text-xl font-bold mt-1">{val}</div>
                  </div>
                ))}
              </div>

              <div className="bg-white p-4 rounded-xl border">
                <div className="text-sm font-medium mb-3">Progress Trend</div>
                <div className="h-16 flex items-end gap-1">
                  {(item.history || [item.TotalQty, item.ChallanQTY]).map((val, idx) => {
                    const max = Math.max(...(item.history || [item.TotalQty, item.ChallanQTY]));
                    const height = max > 0 ? (val / max) * 100 : 0;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-full bg-blue-500 rounded-sm transition-all duration-500"
                          style={{ height: `${Math.max(5, height)}%`, minHeight: '4px' }}
                        />
                        <span className="text-[8px] text-gray-400">{idx + 1}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'financials' && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                {[
                  ['Order Value', formatCurrency(item.TotalValue), '📊', 'bg-indigo-50 text-indigo-600'],
                  ['Challan Value', formatCurrency(item.ChallanValue), '💰', 'bg-emerald-50 text-emerald-600'],
                  ['Balance Value', formatCurrency(item.BalanceValue), '💳', 'bg-rose-50 text-rose-600'],
                ].map(([label, val, icon, bgClass]) => (
                  <div key={label} className={cn('p-4 rounded-xl text-center', bgClass)}>
                    <div className="text-2xl">{icon}</div>
                    <div className="text-xs text-gray-500 mt-1">{label}</div>
                    <div className="text-xl font-bold mt-1">{val}</div>
                  </div>
                ))}
              </div>

              <div className="bg-white p-4 rounded-xl border">
                <div className="text-sm font-medium mb-3">Value Distribution</div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Challan vs Balance</span>
                      <span className="font-medium">
                        {((item.ChallanValue / (item.TotalValue || 1)) * 100).toFixed(1)}% Complete
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden flex">
                      <div
                        className="bg-green-500 h-full transition-all duration-700"
                        style={{ width: `${(item.ChallanValue / (item.TotalValue || 1)) * 100}%` }}
                      />
                      <div
                        className="bg-red-400 h-full transition-all duration-700"
                        style={{ width: `${(item.BalanceValue / (item.TotalValue || 1)) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs mt-1 text-gray-500">
                      <span>✅ Challan: {formatCurrency(item.ChallanValue)}</span>
                      <span>⏳ Balance: {formatCurrency(item.BalanceValue)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'challans' && (
            <div className="space-y-4">
              {item.ChallanNo && item.ChallanNo.length > 0 ? (
                item.ChallanNo.map((ch, idx) => (
                  <div key={idx} className="border rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{ch.challanNo}</span>
                          <span className={cn(
                            'px-2 py-0.5 rounded-full text-[10px] font-medium',
                            ch.status === 'Challan Received' ? 'bg-green-100 text-green-700' :
                              ch.status === 'Send to Gate' ? 'bg-yellow-100 text-yellow-700' :
                                ch.status === 'Delivered' ? 'bg-blue-100 text-blue-700' :
                                  ch.status === 'Gate Out' ? 'bg-red-100 text-red-700' :
                                    'bg-gray-100 text-gray-600'
                          )}>
                            {ch.status || 'Unknown'}
                          </span>
                          {ch.hasAttachments && (
                            <span className="text-blue-500 text-xs">📎</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Date: {formatDate(item.OrderReceiveDate)}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0 ml-4">
                        <button className="btn btn-xs btn-ghost text-blue-500 hover:text-blue-700">
                          👁️ View
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <div className="text-4xl mb-3">📭</div>
                  <div className="text-sm">No challans found for this order</div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  📄 LC Documents
                  <span className="text-xs font-normal text-gray-400">({(item.LCList || []).length})</span>
                </h4>
                {(item.LCList || []).length > 0 ? (
                  <div className="space-y-2">
                    {item.LCList.map((lc, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-mono text-sm">{lc.lcNo}</span>
                        <span className="text-xs text-gray-500">
                          {formatDate(lc.lcDate)} • {formatCurrency(lc.totalLCValue)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-400">No LC documents</div>
                )}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  📄 Invoices
                  <span className="text-xs font-normal text-gray-400">({(item.InvoiceList || []).length})</span>
                </h4>
                {(item.InvoiceList || []).length > 0 ? (
                  <div className="space-y-2">
                    {item.InvoiceList.map((inv, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-mono text-sm">{inv.invoiceNo}</span>
                        <span className="text-xs text-gray-500">
                          {formatDate(inv.invoiceDate)} • {formatCurrency(inv.totalInvoiceValue)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-400">No invoices</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'pis' && (
            <div className="space-y-4">
              {(item.PIList || []).length > 0 ? (
                item.PIList.map((pi, idx) => (
                  <div key={idx} className="border rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-blue-600 text-sm">{pi.piNo}</div>
                        {pi.piCompany && pi.piCompany !== 'N/A' && (
                          <div className="text-xs text-teal-600">🏢 {pi.piCompany}</div>
                        )}
                        <div className="flex flex-wrap gap-3 mt-2 text-xs">
                          <span>Qty: <span className="font-medium">{formatNumber(pi.qty)}</span></span>
                          <span>Value: <span className="font-medium text-blue-600">{formatCurrency(pi.value)}</span></span>
                          <span>Challan: <span className="font-medium text-green-600">{formatNumber(pi.challanQty)}</span></span>
                          <span>Balance: <span className="font-medium text-red-500">{formatNumber(pi.balanceQty)}</span></span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                        {pi.challanQty > 0 && pi.balanceQty === 0 && (
                          <span className="badge badge-success badge-xs">✓ Complete</span>
                        )}
                        {pi.balanceQty > 0 && pi.challanQty > 0 && (
                          <span className="badge badge-warning badge-xs">⏳ Partial</span>
                        )}
                        {pi.challanQty === 0 && pi.balanceQty > 0 && (
                          <span className="badge badge-error badge-xs">⏸ Pending</span>
                        )}
                      </div>
                    </div>
                    {(pi.lcList?.length > 0 || pi.invoiceList?.length > 0) && (
                      <div className="mt-3 pt-3 border-t flex gap-2 flex-wrap">
                        {pi.lcList?.length > 0 && (
                          <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            📄 {pi.lcList.length} LC
                          </span>
                        )}
                        {pi.invoiceList?.length > 0 && (
                          <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            📄 {pi.invoiceList.length} Inv
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <div className="text-4xl mb-3">📋</div>
                  <div className="text-sm">No PI details available</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-4 border-t bg-gray-50">
          <div className="text-xs text-gray-500">
            Order ID: {item.WorkOrderNo}
          </div>
          <button
            className="btn btn-ghost btn-sm text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
});
QuickViewModal.displayName = "QuickViewModal";

// ============================================================
// COMPONENT: PROFESSIONAL FILTER DROPDOWN
// ============================================================

const ProfessionalFilterDropdown = React.memo(({ label, open, setOpen, items, selectedItems, onToggle, searchValue, setSearchValue, ref, placeholder, color = "blue", icon }) => {
  const [selectAll, setSelectAll] = useState(false);
  useEffect(() => setSelectAll(selectedItems.length === items.length && items.length > 0), [selectedItems, items]);
  const handleSelectAll = () => onToggle(selectAll ? [] : items);
  return (
    <div className="relative" ref={ref}>
      <button className={cn('btn btn-outline btn-xs gap-1 transition-all hover:shadow-md', selectedItems.length > 0 && `border-${color}-500 bg-${color}-50`)}
        onClick={() => setOpen(!open)} aria-expanded={open}>
        {icon && <span className="text-xs">{icon}</span>}
        <span className="text-[10px]">{label}</span>
        {selectedItems.length > 0 && <span className={cn('badge badge-xs', `badge-${color}`)}>{selectedItems.length}</span>}
        <span className="text-[10px]">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="absolute bg-base-100 shadow-xl p-2 rounded-lg w-56 max-h-72 overflow-y-auto z-50 mt-1 border border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-[10px]">{label} Filter</span>
            <div className="flex gap-1">
              <button className="text-[15px] text-blue-600 hover:text-blue-800 font-medium bg-gray-100 px-2 py-0.5 rounded" onClick={handleSelectAll}>{selectAll ? 'Deselect' : 'All'}</button>
              <button className="text-[15px] text-red-600 hover:text-red-800 font-medium bg-gray-100 px-2 py-0.5 rounded" onClick={() => { onToggle([]); setSearchValue(""); }}>Clear</button>
            </div>
          </div>
          <input id="search" type="text" placeholder={placeholder} className="input input-xs w-full mb-2" value={searchValue} onChange={e => setSearchValue(e.target.value)} />
          <div className="space-y-0.5 max-h-40 overflow-y-auto">
            {items.length === 0 ? <div className="text-gray-400 text-[10px] text-center py-2">No items</div> :
              items.map(item => (
                <label key={item} className="flex gap-2 py-1 px-2 items-center hover:bg-gray-100 rounded cursor-pointer">
                  <input type="checkbox" checked={selectedItems.includes(item)} onChange={() => onToggle(item)} className="checkbox checkbox-xs" />
                  <span className="text-[11px] select-none truncate">{item}</span>
                </label>
              ))}
          </div>
          <div className="mt-2 pt-2 border-t text-[10px] text-gray-500">{selectedItems.length} selected</div>
        </div>
      )}
    </div>
  );
});
ProfessionalFilterDropdown.displayName = "ProfessionalFilterDropdown";

// ============================================================
// COMPONENT: ENHANCED CHALLAN CELL - FIXED STATE CLOSURE
// ============================================================
const EnhancedChallanCell = React.memo(({
  challanNo,
  cndata,
  apiKey,
  workOrderNo,
  onChallanClick
}) => {
  const [expanded, setExpanded] = useState(false);
  const [attachmentCache, setAttachmentCache] = useState({});
  const [loadingAttachments, setLoadingAttachments] = useState({});
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // Safety check
  if (!challanNo || !Array.isArray(challanNo) || challanNo.length === 0) {
    return <div className="text-gray-400 text-[10px] text-center py-2 opacity-50">No Challan</div>;
  }

  const displayed = expanded ? challanNo : challanNo.slice(0, CONFIG.MAX_CHALLAN_DISPLAY);
  const hasMore = challanNo.length > CONFIG.MAX_CHALLAN_DISPLAY;

  const statusColors = {
    'Challan Received': 'bg-green-50 text-green-700 border-green-200',
    'Send to Gate': 'bg-yellow-50 text-yellow-700 border-yellow-200',
    'Gate Out': 'bg-red-50 text-red-700 border-red-200',
    'Delivered': 'bg-blue-50 text-blue-700 border-blue-200',
    'Entry': 'bg-gray-50 text-gray-700 border-gray-200',
    'Pending': 'bg-orange-50 text-orange-700 border-orange-200',
    'Unknown': 'bg-gray-50 text-gray-600 border-gray-200'
  };

  const handleCopy = () => {
    const textToCopy = challanNo.map(function (c) {
      const details = getChallanDetails(c.challanNo);
      let text = (c.challanNo || 'N/A') + ' (' + (c.status || 'Unknown') + ')';
      if (details.qty > 0) {
        text += ' || Challan QTY (' + details.qty + ')';
      }
      if (details.value > 0) {
        text += ' || Challan Value ($' + details.value.toFixed(2) + ')';
      }
      return text;
    }).join("\n");

    navigator.clipboard.writeText(textToCopy)
      .then(function () { toast.success("Challans copied!"); })
      .catch(function () { toast.error("Copy failed"); });
  };

  // ===== FETCH ATTACHMENTS FOR A SPECIFIC CHALLAN =====
  const fetchAttachmentsForChallan = useCallback(async function (challanId, deliveryChallanID) {
    if (!deliveryChallanID) return [];
    if (attachmentCache[challanId]) return attachmentCache[challanId];

    setLoadingAttachments(function (prev) {
      var newState = Object.assign({}, prev);
      newState[challanId] = true;
      return newState;
    });

    try {
      var response = await axios.get(
        'https://tpl-api.ebs365.info/api/File?ReferenceDocNameID=52&ReferenceDocID=' + deliveryChallanID,
        { headers: { Authorization: apiKey } }
      );

      var attachments = response.data || [];

      setAttachmentCache(function (prev) {
        var newState = Object.assign({}, prev);
        newState[challanId] = attachments;
        return newState;
      });

      if (attachments.length > 0) {
        console.log('✅ Found ' + attachments.length + ' attachments for challan ' + challanId);
      }
      return attachments;
    } catch (error) {
      console.error('Error fetching attachments for ' + challanId + ':', error);
      return [];
    } finally {
      setLoadingAttachments(function (prev) {
        var newState = Object.assign({}, prev);
        newState[challanId] = false;
        return newState;
      });
    }
  }, [apiKey, attachmentCache]);

  // ===== GET CHALLAN DETAILS (QTY & VALUE) - FIXED =====
  const getChallanDetails = useCallback((challanId) => {
    // ===== FIRST CHECK MERGED CHALLAN MAP =====
    const mergedChallanMap = cndata?.mergedChallanMap || {};

    console.log('🔍 Looking for challan:', challanId);
    console.log('📊 mergedChallanMap keys:', Object.keys(mergedChallanMap));

    let challanData = mergedChallanMap[challanId];

    // Try case-insensitive match in mergedChallanMap
    if (!challanData) {
      const lowerChallanId = challanId.toLowerCase();
      const matchedKey = Object.keys(mergedChallanMap).find(key =>
        key.toLowerCase() === lowerChallanId
      );
      if (matchedKey) {
        challanData = mergedChallanMap[matchedKey];
        console.log('✅ Found challan data via case-insensitive match in mergedChallanMap:', challanData);
      }
    }

    // Try partial match in mergedChallanMap
    if (!challanData) {
      const matchedKey = Object.keys(mergedChallanMap).find(key =>
        key.includes(challanId) || challanId.includes(key)
      );
      if (matchedKey) {
        challanData = mergedChallanMap[matchedKey];
        console.log('✅ Found challan data via partial match in mergedChallanMap:', challanData);
      }
    }

    // If found in merged map, return immediately
    if (challanData) {
      console.log('✅ Found challan data in mergedChallanMap:', challanData);
      return {
        qty: challanData?.challanQty || 0,
        value: challanData?.totalChallanValue || 0,
        status: challanData?.statusDesc || 'Unknown'
      };
    }

    // ===== FALLBACK: Try challanReceiveMap =====
    const challanReceiveMap = cndata?.challanReceiveMap || {};
    console.log('📊 challanReceiveMap keys:', Object.keys(challanReceiveMap));

    // Try direct match
    challanData = challanReceiveMap[challanId];

    // If not found, try case-insensitive match
    if (!challanData) {
      const lowerChallanId = challanId.toLowerCase();
      const matchedKey = Object.keys(challanReceiveMap).find(key =>
        key.toLowerCase() === lowerChallanId
      );
      if (matchedKey) {
        challanData = challanReceiveMap[matchedKey];
        console.log('✅ Found challan data via case-insensitive match in challanReceiveMap:', challanData);
      }
    }

    // If still not found, try partial match
    if (!challanData) {
      const matchedKey = Object.keys(challanReceiveMap).find(key =>
        key.includes(challanId) || challanId.includes(key)
      );
      if (matchedKey) {
        challanData = challanReceiveMap[matchedKey];
        console.log('✅ Found challan data via partial match in challanReceiveMap:', challanData);
      }
    }

    // ===== FALLBACK: Try grupChallan =====
    if (!challanData && cndata?.grupChallan) {
      console.log('📊 Checking grupChallan for:', challanId);
      const found = cndata.grupChallan.find(c =>
        c.challanNo === challanId || c.challanNo?.includes(challanId)
      );
      if (found) {
        challanData = found;
        console.log('✅ Found challan data from grupChallan:', found);
      }
    }

    // ===== FINAL FALLBACK: Check if this challan exists in the order data =====
    if (!challanData) {
      console.log('📊 Searching in apiData for challan:', challanId);
      const apiData = cndata?.apiData || [];
      for (const item of apiData) {
        if (item.ChallanNo) {
          const challans = item.ChallanNo.split(",").map(c => c.trim());
          if (challans.includes(challanId)) {
            // Found the challan in order data, use its qty and value
            challanData = {
              challanQty: Number(item.ChallanQTY) || 0,
              totalChallanValue: Number(item.ChallanValue) || 0,
              statusDesc: ch.status || 'Unknown'
            };
            console.log('✅ Found challan data from apiData:', challanData);
            break;
          }
        }
      }
    }

    // If still no data, log warning
    if (!challanData) {
      console.warn('⚠️ No data found for challan:', challanId);
    }

    return {
      qty: challanData?.challanQty || 0,
      value: challanData?.totalChallanValue || 0,
      status: challanData?.statusDesc || 'Unknown'
    };
  }, [cndata]);

  // ===== CHECK ALL CHALLANS FOR ATTACHMENTS =====
  const checkAllChallansForAttachments = useCallback(async function () {
    var challanReceiveMap = cndata?.challanReceiveMap || {};
    var foundAny = false;
    var allAttachments = {};

    setIsLoadingAll(true);

    for (var idx = 0; idx < challanNo.length; idx++) {
      var ch = challanNo[idx];
      var challanId = ch.challanNo;

      if (!challanId) continue;

      var cached = attachmentCache[challanId];
      if (cached && Array.isArray(cached) && cached.length > 0) {
        foundAny = true;
        allAttachments[challanId] = cached;
        continue;
      }

      var challanData = challanReceiveMap[challanId];
      var deliveryChallanID = challanData?.deliveryChallanID || ch.deliveryChallanID;

      if (deliveryChallanID) {
        var attachments = await fetchAttachmentsForChallan(challanId, deliveryChallanID);
        if (attachments && Array.isArray(attachments) && attachments.length > 0) {
          foundAny = true;
          allAttachments[challanId] = attachments;
          ch.hasAttachments = true;
        }
      }
    }

    setIsLoadingAll(false);
    return { found: foundAny, attachments: allAttachments };
  }, [challanNo, cndata, attachmentCache, fetchAttachmentsForChallan]);

  // ===== DOWNLOAD SINGLE ATTACHMENT =====
  const downloadAttachment = useCallback(async function (attachment, e) {
    e.stopPropagation();

    if (!attachment || !attachment.documentPath) {
      toast.error('No document path available');
      return;
    }

    try {
      var response = await fetch(attachment.documentPath, {
        method: 'GET',
        headers: {
          'Authorization': apiKey,
          'Accept': '*/*'
        }
      });

      if (!response.ok) {
        throw new Error('HTTP error! status: ' + response.status);
      }

      var blob = await response.blob();
      var url = window.URL.createObjectURL(blob);
      var link = document.createElement('a');
      link.href = url;
      var fileName = attachment.documentLocation || 'attachment';
      fileName = fileName.replace(/[^a-zA-Z0-9.\-_\s]/g, '');
      var finalFileName = workOrderNo ? workOrderNo + '_' + fileName : fileName;
      link.download = finalFileName;
      document.body.appendChild(link);
      link.click();
      setTimeout(function () {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);

      toast.success('Downloaded: ' + fileName);
    } catch (error) {
      console.error('Download error:', error);
      if (attachment.documentPath) {
        toast.info('Opening in new tab. Right-click to save.');
        window.open(attachment.documentPath, '_blank');
      } else {
        toast.error('Failed to download attachment');
      }
    }
  }, [apiKey, workOrderNo]);

  // ===== DOWNLOAD ALL ATTACHMENTS FOR A CHALLAN =====
  const downloadAllAttachmentsForChallan = useCallback(async function (challanId, attachments, e) {
    e.stopPropagation();

    if (!attachments || !Array.isArray(attachments) || attachments.length === 0) {
      toast.warning('No attachments to download for ' + challanId);
      return;
    }

    toast.info('Downloading ' + attachments.length + ' attachment(s) for ' + challanId + '...');

    var successCount = 0;
    for (var i = 0; i < attachments.length; i++) {
      var attachment = attachments[i];
      try {
        var response = await fetch(attachment.documentPath, {
          method: 'GET',
          headers: {
            'Authorization': apiKey,
            'Accept': '*/*'
          }
        });

        if (!response.ok) {
          throw new Error('HTTP error! status: ' + response.status);
        }

        var blob = await response.blob();
        var url = window.URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.href = url;
        var fileName = attachment.documentLocation || 'file_' + (i + 1);
        fileName = fileName.replace(/[^a-zA-Z0-9.\-_\s]/g, '');
        var finalFileName = workOrderNo ? workOrderNo + '_' + challanId + '_' + fileName : challanId + '_' + fileName;
        link.download = finalFileName;
        document.body.appendChild(link);
        link.click();
        setTimeout(function () {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }, 100);

        successCount++;
        toast.info('Downloaded ' + (i + 1) + '/' + attachments.length + ': ' + fileName);
      } catch (error) {
        console.error('Error downloading attachment ' + (i + 1) + ':', error);
        if (attachment.documentPath) {
          toast.info('Opening ' + (attachment.documentLocation || 'file') + ' in new tab. Right-click to save.');
          window.open(attachment.documentPath, '_blank');
          successCount++;
        }
      }

      await new Promise(function (resolve) { setTimeout(resolve, 500); });
    }

    if (successCount > 0) {
      toast.success('✅ Downloaded ' + successCount + '/' + attachments.length + ' attachments for ' + challanId);
    } else {
      toast.error('Failed to download attachments');
    }
  }, [apiKey, workOrderNo]);

  // ===== HANDLE "ALL" BUTTON =====
  const handleDownloadAll = useCallback(async function (e) {
    e.stopPropagation();
    setIsDownloadingAll(true);
    setDownloadProgress(0);

    if (!challanNo || !Array.isArray(challanNo) || challanNo.length === 0) {
      toast.warning('No challans to download');
      setIsDownloadingAll(false);
      return;
    }

    toast.info('Checking all challans for attachments...');

    var result = await checkAllChallansForAttachments();

    if (!result.found) {
      toast.warning('No attachments found for any challan');
      setIsDownloadingAll(false);
      return;
    }

    var allAttachments = [];
    var totalFiles = 0;
    var attachmentKeys = Object.keys(result.attachments);

    for (var idx = 0; idx < attachmentKeys.length; idx++) {
      var challanId = attachmentKeys[idx];
      var attachments = result.attachments[challanId];
      if (attachments && Array.isArray(attachments) && attachments.length > 0) {
        allAttachments.push({
          challanNo: challanId,
          attachments: attachments
        });
        totalFiles += attachments.length;
      }
    }

    for (var cIdx = 0; cIdx < challanNo.length; cIdx++) {
      var ch = challanNo[cIdx];
      var challanId = ch.challanNo;
      if (!challanId) continue;

      var cached = attachmentCache[challanId];
      if (cached && Array.isArray(cached) && cached.length > 0) {
        var alreadyAdded = allAttachments.some(function (item) {
          return item.challanNo === challanId;
        });
        if (!alreadyAdded) {
          allAttachments.push({
            challanNo: challanId,
            attachments: cached
          });
          totalFiles += cached.length;
        }
      }
    }

    if (totalFiles === 0) {
      toast.warning('No attachments found for any challan');
      setIsDownloadingAll(false);
      return;
    }

    toast.info('Downloading ' + totalFiles + ' attachments from ' + allAttachments.length + ' challans...');

    var successCount = 0;
    var fileIndex = 0;

    for (var aIdx = 0; aIdx < allAttachments.length; aIdx++) {
      var item = allAttachments[aIdx];
      var challanId = item.challanNo;
      var attachments = item.attachments;

      for (var fIdx = 0; fIdx < attachments.length; fIdx++) {
        var attachment = attachments[fIdx];
        fileIndex++;
        setDownloadProgress(Math.round((fileIndex / totalFiles) * 100));

        try {
          var response = await fetch(attachment.documentPath, {
            method: 'GET',
            headers: {
              'Authorization': apiKey,
              'Accept': '*/*'
            }
          });

          if (!response.ok) {
            throw new Error('HTTP error! status: ' + response.status);
          }

          var blob = await response.blob();
          var url = window.URL.createObjectURL(blob);
          var link = document.createElement('a');
          link.href = url;
          var fileName = attachment.documentLocation || 'file_' + fileIndex;
          fileName = fileName.replace(/[^a-zA-Z0-9.\-_\s]/g, '');
          var finalFileName = workOrderNo ? workOrderNo + '_' + challanId + '_' + fileName : challanId + '_' + fileName;
          link.download = finalFileName;
          document.body.appendChild(link);
          link.click();
          setTimeout(function () {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
          }, 100);

          successCount++;
          toast.info('Downloaded ' + fileIndex + '/' + totalFiles + ': ' + fileName);
        } catch (error) {
          console.error('Error downloading file ' + fileIndex + ':', error);
          if (attachment.documentPath) {
            toast.info('Opening ' + (attachment.documentLocation || 'file') + ' in new tab. Right-click to save.');
            window.open(attachment.documentPath, '_blank');
            successCount++;
          }
        }

        await new Promise(function (resolve) { setTimeout(resolve, 400); });
      }
    }

    setIsDownloadingAll(false);
    setDownloadProgress(100);

    if (successCount > 0) {
      toast.success('✅ Downloaded ' + successCount + '/' + totalFiles + ' attachments successfully!');
    } else {
      toast.error('Failed to download attachments');
    }
  }, [challanNo, attachmentCache, checkAllChallansForAttachments, apiKey, workOrderNo]);

  const handleExpand = useCallback(function () {
    setExpanded(!expanded);
    if (!expanded) {
      checkAllChallansForAttachments();
    }
  }, [expanded, checkAllChallansForAttachments]);

  // Count challans with attachments
  var challansWithAttachments = challanNo.filter(function (ch) {
    var challanId = ch.challanNo;
    if (!challanId) return false;
    var cached = attachmentCache[challanId];
    return (cached && Array.isArray(cached) && cached.length > 0) || ch.hasAttachments;
  });

  var hasAttachments = challansWithAttachments.length > 0;
  var totalChallansWithAttachments = challansWithAttachments.length;

  return (
    <div className="border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center bg-gray-50 px-2 py-1 rounded-t-lg border-b">
        <span className="text-[10px] font-semibold text-gray-600">
          📋 Challans ({challanNo.length})
        </span>
        <div className="flex gap-1">
          {hasAttachments && (
            <button
              className="text-[10px] bg-blue-500 hover:bg-blue-600 text-white px-1.5 py-0.5 rounded flex items-center gap-1"
              onClick={handleDownloadAll}
              disabled={isDownloadingAll || isLoadingAll}
              title="Download all attachments from all challans"
            >
              {isDownloadingAll ? (
                <>
                  <span className="loading loading-spinner loading-xs"></span>
                  {downloadProgress}%
                </>
              ) : isLoadingAll ? (
                <>
                  <span className="loading loading-spinner loading-xs"></span>
                  Loading...
                </>
              ) : (
                <>⬇ ALL ({totalChallansWithAttachments})</>
              )}
            </button>
          )}
          {hasMore && (
            <button
              className="text-[10px] text-blue-600 hover:text-blue-800 px-1 py-0.5 rounded hover:bg-blue-50"
              onClick={handleExpand}
            >
              {expanded ? 'Less' : '+' + (challanNo.length - CONFIG.MAX_CHALLAN_DISPLAY)}
            </button>
          )}
          <button
            className="text-[10px] bg-green-500 hover:bg-green-600 text-white px-1.5 py-0.5 rounded"
            onClick={handleCopy}
          >
            Copy
          </button>
        </div>
      </div>

      <div
        className="overflow-y-auto p-1.5 space-y-0.5"
        style={{ maxHeight: expanded ? "200px" : "100px" }}
      >
        {displayed.map(function (ch, i) {
          var challanId = ch.challanNo;
          if (!challanId) return null;

          var deliveryChallanID = ch.deliveryChallanID || null;
          var challanReceiveMap = cndata?.challanReceiveMap || {};
          var challanData = challanReceiveMap[challanId];
          var effectiveDeliveryChallanID = deliveryChallanID || (challanData ? challanData.deliveryChallanID : null);

          var attachments = attachmentCache[challanId] || [];
          var hasAttachmentsLoaded = attachments && Array.isArray(attachments) && attachments.length > 0;
          var isLoading = loadingAttachments[challanId] || false;
          var status = ch.status || 'Unknown';
          var details = getChallanDetails(challanId);

          if (details.status && details.status !== 'Unknown') {
            status = details.status;
          }

          var statusColorClass = statusColors[status] || statusColors['Unknown'];

          // Build the display text with QTY and Value
          var displayText = challanId;
          if (status) {
            displayText += ' (' + status + ')';
          }
          if (details.qty > 0) {
            displayText += ' || Challan QTY (' + details.qty + ')';
          }
          if (details.value > 0) {
            displayText += ' || Challan Value ($' + details.value.toFixed(2) + ')';
          }

          return (
            <div
              key={i}
              className={'flex justify-between items-center text-[10px] px-2 py-0.5 rounded border hover:shadow-md transition-all ' + statusColorClass}
            >
              <span className="font-medium truncate max-w-[200px]" title={displayText}>
                {i + 1}. {displayText}
              </span>
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className={'px-1 py-0.5 rounded text-[8px] font-medium ' + (
                  status === 'Challan Received' ? 'bg-green-200 text-green-800' :
                    status === 'Send to Gate' ? 'bg-yellow-200 text-yellow-800' :
                      status === 'Delivered' ? 'bg-blue-200 text-blue-800' :
                        status === 'Gate Out' ? 'bg-red-200 text-red-800' :
                          status === 'Unknown' ? 'bg-gray-200 text-gray-700' :
                            'bg-gray-200 text-gray-700'
                )}>
                  {status}
                </span>

                {hasAttachmentsLoaded && attachments.length > 0 && (
                  <div className="flex items-center gap-0.5">
                    <span className="text-[8px] text-gray-500">📎{attachments.length}</span>
                    <button
                      className="text-[8px] text-blue-500 hover:text-blue-700 px-1"
                      onClick={function (e) {
                        e.stopPropagation();
                        downloadAllAttachmentsForChallan(challanId, attachments, e);
                      }}
                      title={'Download ' + attachments.length + ' attachments for this challan'}
                    >
                      ⬇
                    </button>
                  </div>
                )}

                {isLoading && (
                  <span className="text-[8px] text-gray-400 animate-pulse">⏳</span>
                )}

                {effectiveDeliveryChallanID && !hasAttachmentsLoaded && !isLoading && (
                  <button
                    className="text-[8px] text-blue-500 hover:text-blue-700"
                    onClick={function (e) {
                      e.stopPropagation();
                      fetchAttachmentsForChallan(challanId, effectiveDeliveryChallanID);
                    }}
                  >
                    📎 Load
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
EnhancedChallanCell.displayName = "EnhancedChallanCell";
// ============================================================
// COMPONENT: PROFESSIONAL SUMMARY TABLE - WITH ATTACHMENT COLUMN
// ============================================================

const ProfessionalSummaryTable = React.memo(({
  data, columns, totalData, onRowClick, onRowSelect, onQuickView,
  onFavoriteToggle, selectedRows, favorites, loading, currentPage = 0,
  onOrderClick, onChallanClick,
  apiKey,
  cndata
}) => {

  const handleChallanClickInternal = (ch) => {
    if (onChallanClick && ch.deliveryChallanID) {
      onChallanClick({
        challanNo: ch.challanNo,
        deliveryChallanID: ch.deliveryChallanID
      });
    }
  };

  const handleRowCheck = (item, checked) => onRowSelect(checked ? [...selectedRows, item.WorkOrderNo] : selectedRows.filter(id => id !== item.WorkOrderNo));
  const handleSelectAll = (checked) => onRowSelect(checked ? data.map(d => d.WorkOrderNo) : []);
  const getStatusBadge = (item) => {
    const c = parseFloat(item.completionRate);
    if (c >= 100) return <span className="badge badge-success badge-xs gap-0.5 h-auto">✓ Complete</span>;
    if (c > 50) return <span className="badge badge-warning badge-xs gap-0.5 h-auto">⏳ In Progress</span>;
    return <span className="badge badge-error badge-xs gap-0.5 h-auto">⏸ Pending</span>;
  };
  const getPIBadge = (item) => {
    if (item.piCount > 1) {
      return <span className="badge badge-info badge-xs gap-0.5">{item.piCount} PIs</span>;
    }
    return null;
  };

  if (loading) return <TableSkeleton />;
  if (data.length === 0) return (
    <div className="text-center py-16 bg-white/80 rounded-xl">
      <div className="text-6xl mb-3 opacity-30">📭</div>
      <div className="text-gray-500 text-lg">No data to display</div>
      <div className="text-gray-400 text-sm mt-2">Try adjusting your filters or search criteria</div>
    </div>
  );

  const totalColSpan = 12 + (columns.includes("PI") ? 1 : 0) + (columns.includes("PICompany") ? 1 : 0) + (columns.includes("LC") ? 1 : 0) + (columns.includes("Invoice") ? 1 : 0);

  return (
    <div className="max-h-[500px] overflow-auto border rounded-xl shadow-sm bg-white/95 backdrop-blur-sm">
      <table className="table table-xs table-zebra min-w-[1800px]">
        <thead className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white sticky top-0 z-10">
          <tr className="text-center text-[10px] uppercase tracking-wider">
            <th className="py-2 w-8">👁️</th>
            <th className="py-2 w-8"><input type="checkbox" className="checkbox checkbox-xs" checked={data.length > 0 && selectedRows.length === data.length} onChange={e => handleSelectAll(e.target.checked)} /></th>
            <th className="py-2 w-8">⭐</th>
            {columns.includes("SNo") && <th className="py-2">#</th>}
            {columns.includes("Order") && <th className="py-2">Order</th>}
            <th className="py-2">Date</th>
            {columns.includes("SalesPerson") && <th className="py-2 min-w-[120px]">Sales Person</th>}
            <th className="py-2">Customer</th>
            <th className="py-2">Delivery</th>
            <th className="py-2">Buyer</th>
            {columns.includes("PI") && <th className="py-2 min-w-[200px]">PI(s)</th>}
            {columns.includes("PICompany") && <th className="py-2 min-w-[120px]">PI Company</th>}
            {columns.includes("LC") && <th className="py-2">LC</th>}
            {columns.includes("Invoice") && <th className="py-2">Invoice</th>}
            <th className="py-2">Section</th>
            {/* NEW COLUMN HEADERS */}
            {columns.includes("Style") && <th className="py-2">Style</th>}
            {columns.includes("Color") && <th className="py-2">Color</th>}
            {columns.includes("PO") && <th className="py-2">PO</th>}
            {columns.includes("CustomerPO") && <th className="py-2">Customer PO</th>}
            <th className="py-2 text-right">Order Qty</th>
            <th className="py-2 text-right">Challan Qty</th>
            <th className="py-2 text-right">Balance Qty</th>
            <th className="py-2 text-right">Order Value</th>
            <th className="py-2 text-right">Challan Value</th>
            <th className="py-2 text-right">Balance Value</th>
            <th className="py-2 text-center">Progress</th>
            <th className="py-2 text-center">Trend</th>
            <th className="py-2 text-center">Challan</th>
            <th className="py-2 text-center">Status</th>
            <th className="py-2 w-8">📎</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => {
            const serialNumber = (currentPage * CONFIG.ITEMS_PER_PAGE) + idx + 1;
            return (
              <tr key={`${item.WorkOrderNo}`} className={cn('hover:bg-blue-50 transition-colors cursor-pointer', selectedRows.includes(item.WorkOrderNo) && 'bg-blue-100')} onClick={() => onRowClick?.(item)}>
                <td className="px-2 py-1 text-center" onClick={e => e.stopPropagation()}>
                  <button className="btn btn-ghost btn-xs text-gray-400 hover:text-blue-500" onClick={() => onQuickView(item)} title="Quick View">👁️</button>
                </td>
                <td className="px-2 py-1" onClick={e => e.stopPropagation()}>
                  <input type="checkbox" className="checkbox checkbox-xs" checked={selectedRows.includes(item.WorkOrderNo)} onChange={e => handleRowCheck(item, e.target.checked)} />
                </td>
                <td className="px-2 py-1" onClick={e => e.stopPropagation()}>
                  <button className={cn('btn btn-ghost btn-xs', favorites.includes(item.WorkOrderNo) ? 'text-yellow-500' : 'text-gray-300')} onClick={() => onFavoriteToggle(item.WorkOrderNo)}>
                    {favorites.includes(item.WorkOrderNo) ? '⭐' : '☆'}
                  </button>
                </td>
                {columns.includes("SNo") && (
                  <td className="px-2 py-1 text-center text-xs font-medium text-gray-400">{serialNumber}</td>
                )}
                {columns.includes("Order") && (
                  <td className="px-2 py-1 whitespace-nowrap font-medium text-xs">
                    <button
                      className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onOrderClick) onOrderClick(item);
                      }}
                    >
                      {item.WorkOrderNo}
                    </button>
                    {getPIBadge(item)}
                  </td>
                )}
                <td className="px-2 py-1 whitespace-nowrap text-[11px]">{formatDate(item.OrderReceiveDate)}</td>
                {columns.includes("SalesPerson") && (
                  <td className="px-2 py-1 whitespace-nowrap text-xs font-medium text-indigo-600" title={item.SalesPerson}>
                    {item.SalesPerson && item.SalesPerson !== 'Unknown' ? (
                      <span className="bg-indigo-50 px-1.5 py-0.5 rounded-full border border-indigo-200">
                        {item.SalesPerson.length > 15 ? item.SalesPerson.slice(0, 15) + "..." : item.SalesPerson}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                )}
                <td className="px-2 py-1 whitespace-nowrap font-medium text-xs" title={item.CustomerName}>
                  {item.CustomerName.length > 12 ? item.CustomerName.slice(0, 12) + "..." : item.CustomerName}
                </td>
                <td className="px-2 py-1 whitespace-nowrap text-xs" title={item.DeliverName}>
                  {item.DeliverName.length > 12 ? item.DeliverName.slice(0, 12) + "..." : item.DeliverName}
                </td>
                <td className="px-2 py-1 whitespace-nowrap text-xs" title={item.Buyer}>
                  {item.Buyer.length > 10 ? item.Buyer.slice(0, 10) + "..." : item.Buyer}
                </td>

                {columns.includes("PI") && (
                  <td className="px-2 py-1">
                    {item.PIList && item.PIList.length > 0 ? (
                      <div className="space-y-1.5 w-[280px]">
                        {item.PIList.map((pi, idx) => (
                          <div key={idx} className="text-[10px] bg-gray-50 rounded-md p-1.5 border border-gray-200 hover:border-blue-300 transition-colors">
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-semibold text-blue-600 text-[16px] w-full">
                                {pi.piNo}
                              </span>
                              {pi.challanQty > 0 && pi.balanceQty === 0 && (
                                <span className="badge badge-success badge-xs h-auto w-auto">✓ Complete</span>
                              )}
                              {pi.balanceQty > 0 && pi.challanQty > 0 && (
                                <span className="badge badge-warning badge-xs h-auto w-auto">⏳ Partial</span>
                              )}
                              {pi.challanQty === 0 && pi.balanceQty > 0 && (
                                <span className="badge badge-error badge-xs h-auto w-auto">⏸ Pending</span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[9px] text-gray-600">
                              <span className="font-medium">Qty: <span className="text-gray-800">{formatNumber(pi.qty)}</span></span>
                              <span className="text-gray-300">|</span>
                              <span className="font-medium text-blue-600">${formatNumber(pi.value)}</span>
                              <span className="text-gray-300">|</span>
                              <span className="font-medium text-green-600">Ch: {formatNumber(pi.challanQty)}</span>
                              <span className="text-gray-300">|</span>
                              <span className="font-medium text-red-500">Bal: {formatNumber(pi.balanceQty)}</span>
                            </div>
                            {pi.piCompany && pi.piCompany !== 'N/A' && (
                              <div className="text-[8px] text-teal-600 truncate mt-0.5">🏢 {pi.piCompany}</div>
                            )}
                            {(pi.lcList?.length > 0 || pi.invoiceList?.length > 0) && (
                              <div className="flex gap-1 mt-0.5">
                                {pi.lcList?.length > 0 && (
                                  <span className="text-[8px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                                    📄 {pi.lcList.length} LC
                                  </span>
                                )}
                                {pi.invoiceList?.length > 0 && (
                                  <span className="text-[8px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                                    📄 {pi.invoiceList.length} Inv
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-[10px]">No PI</span>
                    )}
                  </td>
                )}

                {columns.includes("PICompany") && (
                  <td className="px-2 py-1 text-xs">
                    {item.PICompany && item.PICompany !== 'N/A' ? (
                      <span className="text-teal-700 font-medium">{item.PICompany}</span>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </td>
                )}

                {columns.includes("LC") && <td className="px-2 py-1 whitespace-nowrap text-[11px] font-mono">{(item.LCList || []).map(l => l.lcNo).join(", ") || "-"}</td>}
                {columns.includes("Invoice") && <td className="px-2 py-1 whitespace-nowrap text-[11px] font-mono">{(item.InvoiceList || []).map(i => i.invoiceNo).join(", ") || "-"}</td>}

                <td className="px-2 py-1 whitespace-nowrap text-xs">{item.Section}</td>

                {/* NEW COLUMN DATA CELLS - THESE MUST BE IN tbody */}
                {columns.includes("Style") && <td className="px-2 py-1 text-xs">{item.Style || '-'}</td>}
                {columns.includes("Color") && <td className="px-2 py-1 text-xs">{item.Color || '-'}</td>}
                {columns.includes("PO") && <td className="px-2 py-1 text-xs">{item.PO || '-'}</td>}
                {columns.includes("CustomerPO") && <td className="px-2 py-1 text-xs">{item.CustomerPO || '-'}</td>}

                <td className="px-2 py-1 whitespace-nowrap text-right font-medium text-xs">{formatNumber(item.TotalQty)}</td>
                <td className="px-2 py-1 whitespace-nowrap text-right font-medium text-xs">{formatNumber(item.ChallanQTY)}</td>
                <td className="px-2 py-1 whitespace-nowrap text-right text-red-600 font-medium text-xs">{formatNumber(item.BalanceQty)}</td>
                <td className="px-2 py-1 whitespace-nowrap text-right text-blue-600 font-semibold text-xs">{formatCurrency(item.TotalValue)}</td>
                <td className="px-2 py-1 whitespace-nowrap text-right text-green-600 font-semibold text-xs">{formatCurrency(item.ChallanValue)}</td>
                <td className="px-2 py-1 whitespace-nowrap text-right text-red-600 font-semibold text-xs">{formatCurrency(item.BalanceValue)}</td>
                <td className="px-2 py-1 min-w-[100px]"><ProgressBar value={item.completionRate} showLabel /></td>
                <td className="px-2 py-1"><Sparkline data={item.history || [item.TotalQty, item.ChallanQTY]} /></td>
                <td className="px-2 py-1 min-w-[180px]">
                  {item.ChallanNo && item.ChallanNo.length > 0 ? (
                    <EnhancedChallanCell
                      challanNo={item.ChallanNo}
                      cndata={cndata}
                      apiKey={apiKey}
                      workOrderNo={item.WorkOrderNo}
                      onChallanClick={handleChallanClickInternal}
                    // showChallanQty={columns.includes("ChallanQtyDetail")}
                    // showChallanValue={columns.includes("ChallanValueDetail")}
                    />
                  ) : (
                    <span className="text-gray-400 text-[10px]">No Challan</span>
                  )}
                </td>
                <td className="px-2 py-1 text-center">
                  <div className="flex flex-col items-center gap-0.5">
                    {getStatusBadge(item)}
                    {item.piCount > 1 && (
                      <span className="text-[8px] text-blue-500">{item.piCount} PIs</span>
                    )}
                  </div>
                </td>
                <td className="px-2 py-1 text-center" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-center gap-1">
                    <AttachmentDownloader
                      referenceDocNameID={51}
                      referenceDocID={item.WorkOrderID}
                      folderName={item.WorkOrderNo}
                      docType="workorder"
                      buttonSize="xs"
                      apiKey={apiKey}
                    />
                    {item.ChallanNo && item.ChallanNo.some(ch => ch.hasAttachments) && (
                      <span className="text-blue-500 text-xs" title="Has challan attachments">📎</span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="sticky bottom-0 bg-blue-100 z-10 border-t-2 border-blue-300">
          <tr className="font-bold text-xs">
            <td className="text-right pr-2" colSpan={totalColSpan}>Totals:</td>
            <td className="text-right">{formatNumber(totalData.TotalQty)}</td>
            <td className="text-right">{formatNumber(totalData.ChallanQTY)}</td>
            <td className="text-right text-red-700">{formatNumber(totalData.BalanceQty)}</td>
            <td className="text-right text-blue-700">{formatCurrency(totalData.TotalValue)}</td>
            <td className="text-right text-green-700">{formatCurrency(totalData.ChallanValue)}</td>
            <td className="text-right text-red-700">{formatCurrency(totalData.BalanceValue)}</td>
            <td colSpan={4}></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
});
ProfessionalSummaryTable.displayName = "ProfessionalSummaryTable";

// ============================================================
// COMPONENT: EXPORT OPTIONS
// ============================================================

const ExportOptions = React.memo(({ onExport, totalItems, disabled }) => {
  const [format, setFormat] = useState('excel');
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeCharts, setIncludeCharts] = useState(false);
  const [emailReport, setEmailReport] = useState(false);
  const { isOpen, toggle, close, dropdownRef, buttonRef } = useDropdown();
  return (
    <div className="relative">
      <button ref={buttonRef} className="btn btn-success btn-xs gap-1 text-white" onClick={toggle} disabled={disabled}>⬇ Export ▾</button>
      {isOpen && (
        <div ref={dropdownRef} className="absolute right-0 mt-2 bg-white shadow-xl rounded-xl p-4 w-72 z-50 border max-h-[90vh] overflow-y-auto">
          <h4 className="font-semibold text-sm mb-3">Export Options</h4>
          <div className="space-y-2">
            {[['excel', 'Excel (.xlsx)'], ['csv', 'CSV (.csv)'], ['json', 'JSON (.json)'], ['pdf', 'PDF (.pdf)']].map(([v, l]) => (
              <label key={v} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="format" value={v} checked={format === v} onChange={() => setFormat(v)} className="radio radio-xs" />
                <span className="text-sm">{l}</span>
              </label>
            ))}
            <div className="divider my-1" />
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={includeSummary} onChange={() => setIncludeSummary(!includeSummary)} className="checkbox checkbox-xs" /><span className="text-sm">Include Summary</span></label>
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={includeCharts} onChange={() => setIncludeCharts(!includeCharts)} className="checkbox checkbox-xs" /><span className="text-sm">Include Charts</span></label>
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={emailReport} onChange={() => setEmailReport(!emailReport)} className="checkbox checkbox-xs" /><span className="text-sm">📧 Email Report</span></label>
          </div>
          <div className="mt-3 flex gap-2">
            <button className="btn btn-primary btn-xs flex-1 text-white" onClick={() => { onExport({ format, includeSummary, includeCharts, emailReport }); close(); }}>Export Now</button>
            <button className="btn btn-ghost btn-xs" onClick={close}>Cancel</button>
          </div>
          <div className="mt-2 text-[10px] text-gray-400 text-center">{totalItems} items to export</div>
        </div>
      )}
    </div>
  );
});
ExportOptions.displayName = "ExportOptions";

// ============================================================
// COMPONENT: TOP ITEMS ANALYTICS
// ============================================================

const TopItemsAnalytics = React.memo(({ data, onQuickView }) => {
  const [showAllModal, setShowAllModal] = useState(false);
  const [modalData, setModalData] = useState([]);
  const [modalTitle, setModalTitle] = useState('');
  const [modalIcon, setModalIcon] = useState('');

  const groupDataByField = useCallback((field, limit = CONFIG.TOP_ITEMS_COUNT) => {
    const m = new Map();
    data.forEach(d => {
      const key = d[field] || "Unknown";
      if (!m.has(key)) {
        m.set(key, {
          value: 0,
          orders: 0,
          qty: 0,
          completion: 0,
          orderRefs: []
        });
      }
      const e = m.get(key);
      e.value += Number(d.TotalValue) || 0;
      e.orders += 1;
      e.qty += Number(d.TotalQty) || 0;
      const compRate = parseFloat(d.completionRate) || 0;
      e.completion += compRate;
      e.orderRefs.push({
        workOrderNo: d.WorkOrderNo,
        completionRate: compRate,
        totalValue: d.TotalValue,
        totalQty: d.TotalQty,
        challengQty: d.ChallanQTY,
        balanceQty: d.BalanceQty,
        customerName: d.CustomerName,
        deliverName: d.DeliverName,
        buyer: d.Buyer,
        section: d.Section,
        piCompany: d.PICompany || 'N/A',
        piList: d.PIList || [],
        challanNo: d.ChallanNo || []
      });
    });

    const results = [...m.entries()]
      .sort((a, b) => b[1].value - a[1].value)
      .map(([name, v]) => ({
        name,
        ...v,
        avgCompletion: v.orders > 0 ? (v.completion / v.orders) : 0,
        representativeOrder: v.orderRefs?.length > 0
          ? v.orderRefs.reduce((best, current) =>
            current.totalValue > best.totalValue ? current : best
          )
          : null
      }));

    return limit ? results.slice(0, limit) : results;
  }, [data]);

  const topItems = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        topCustomers: [],
        topBuyers: [],
        topDeliveries: [],
        topSections: [],
        topPICompanies: []
      };
    }
    return {
      topCustomers: groupDataByField('CustomerName', CONFIG.TOP_ITEMS_COUNT),
      topBuyers: groupDataByField('Buyer', CONFIG.TOP_ITEMS_COUNT),
      topDeliveries: groupDataByField('DeliverName', CONFIG.TOP_ITEMS_COUNT),
      topSections: groupDataByField('Section', CONFIG.TOP_ITEMS_COUNT),
      topPICompanies: groupDataByField('PICompany', CONFIG.TOP_ITEMS_COUNT),
    };
  }, [data, groupDataByField]);

  const allItems = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        customers: [],
        buyers: [],
        deliveries: [],
        sections: [],
        piCompanies: []
      };
    }
    return {
      customers: groupDataByField('CustomerName', null),
      buyers: groupDataByField('Buyer', null),
      deliveries: groupDataByField('DeliverName', null),
      sections: groupDataByField('Section', null),
      piCompanies: groupDataByField('PICompany', null),
    };
  }, [data, groupDataByField]);

  const handleViewAll = (title, items, icon) => {
    setModalData(items || []);
    setModalTitle(title || '');
    setModalIcon(icon || '');
    setShowAllModal(true);
  };

  const renderCard = (title, items, allItemsList, icon, showCompletion = false) => {
    if (!items?.length) return null;

    return (
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm p-3 border transition-all hover:shadow-md">
        <div className="flex justify-between items-center">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {icon} {title}
            <span className="ml-1 text-[10px] font-normal text-gray-400">
              ({items.length})
            </span>
          </h4>
          {allItemsList && allItemsList.length > CONFIG.TOP_ITEMS_COUNT && (
            <button
              className="text-[10px] text-blue-500 font-medium hover:text-blue-700"
              onClick={() => handleViewAll(title, allItemsList, icon)}
            >
              ▼ View All ({allItemsList.length})
            </button>
          )}
        </div>

        <div className="mt-1.5 space-y-1.5">
          {items.map((item, i) => (
            <div
              key={`${title}-${item.name}-${i}`}
              className="flex items-center justify-between group hover:bg-gray-50 rounded px-1 py-0.5 cursor-pointer transition-colors"
            // onClick={() => {
            //   if (item.representativeOrder) {
            //     const actualOrder = data.find(d => 
            //       d.WorkOrderNo === item.representativeOrder.workOrderNo
            //     );
            //     if (actualOrder) {
            //       onQuickView(actualOrder);
            //     } else {
            //       const fallbackOrder = data.find(d => {
            //         if (title === 'Top Customers') return d.CustomerName === item.name;
            //         if (title === 'Top Buyers') return d.Buyer === item.name;
            //         if (title === 'Top Deliveries') return d.DeliverName === item.name;
            //         if (title === 'Top Sections') return d.Section === item.name;
            //         if (title === 'Top PI Companies') return d.PICompany === item.name;
            //         return false;
            //       });
            //       if (fallbackOrder) onQuickView(fallbackOrder);
            //     }
            //   }
            // }}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className={cn(
                  'text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full flex-shrink-0',
                  i === 0 ? 'bg-yellow-400 text-yellow-900' :
                    i === 1 ? 'bg-gray-300 text-gray-700' :
                      i === 2 ? 'bg-orange-300 text-orange-900' :
                        'bg-blue-100 text-blue-700'
                )}>
                  {i + 1}
                </span>
                <span className="text-xs truncate" title={item.name}>
                  {item.name}
                </span>
                {item.orders > 1 && (
                  <span className="text-[9px] text-gray-400 flex-shrink-0">
                    ({item.orders} ord)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[10px] flex-shrink-0">
                <span className="font-semibold text-blue-600">
                  {formatCurrency(item.value)}
                </span>
                {showCompletion && (
                  <span className={cn(
                    'px-1.5 py-0.5 rounded',
                    item.avgCompletion >= 100 ? 'bg-green-100 text-green-700' :
                      item.avgCompletion > 50 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                  )}>
                    {Math.round(item.avgCompletion)}%
                  </span>
                )}
                <span className="text-gray-400 text-[9px]">
                  {formatNumber(item.qty)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!data || data.length === 0) return null;

  const { topCustomers, topBuyers, topDeliveries, topSections, topPICompanies } = topItems;
  const { customers, buyers, deliveries, sections, piCompanies } = allItems;


});
TopItemsAnalytics.displayName = "TopItemsAnalytics";

// ============================================================
// COMPONENT: ADVANCED FILTERS PANEL
// ============================================================

const AdvancedFiltersPanel = React.memo(({ filters, onFilterChange, onReset, totalItems, loading, sections, onSaveFilter, savedFilters, onLoadFilter, onDeleteFilter, onDeepThink, data }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const handleSaveFilter = () => {
    if (!filterName.trim()) { toast.warning('Please enter a filter name'); return; }
    onSaveFilter(filterName); setFilterName(''); setShowSaveDialog(false);
  };
  return (
    <div className="bg-white/85 backdrop-blur-sm rounded-xl p-3 shadow-sm border">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-3">
          <button className="btn btn-ghost btn-xs gap-1" onClick={() => setIsExpanded(!isExpanded)}>🔍 Advanced <span>{isExpanded ? '▲' : '▼'}</span></button>
          <span className="text-xs text-gray-500">{loading ? 'Loading...' : `${totalItems} items found`}</span>
        </div>
        <div className="flex gap-1 flex-wrap items-center">
          <DeepThinking data={data} onInsight={onDeepThink} />
          {savedFilters?.length > 0 && (
            <div className="dropdown dropdown-end">
              <button className="btn btn-ghost btn-xs gap-1">💾 Saved <span className="badge badge-xs">{savedFilters.length}</span></button>
              <div className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-48 z-50">
                {savedFilters.map((f, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <button className="btn btn-ghost btn-xs flex-1 text-left" onClick={() => onLoadFilter(f)}>{f.name}</button>
                    <button className="btn btn-ghost btn-xs text-red-400" onClick={() => onDeleteFilter(f.id)}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <button className="btn btn-ghost btn-xs gap-1" onClick={() => setShowSaveDialog(true)}>💾 Save Filter</button>
          <button className="btn btn-ghost btn-xs" onClick={onReset} disabled={loading}>Reset</button>
        </div>
      </div>
      {isExpanded && (
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <div className="form-control">
            <label className="label"><span className="label-text text-xs">📅 Date Range</span></label>
            <div className="flex gap-1">
              <input type="date" className="input input-bordered input-xs flex-1" value={filters.dateRange?.start || ''} onChange={e => onFilterChange('dateRange', { ...filters.dateRange, start: e.target.value })} />
              <input type="date" className="input input-bordered input-xs flex-1" value={filters.dateRange?.end || ''} onChange={e => onFilterChange('dateRange', { ...filters.dateRange, end: e.target.value })} />
            </div>
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text text-xs">💵 Value Range</span></label>
            <div className="flex gap-1">
              <input type="number" className="input input-bordered input-xs flex-1" placeholder="Min" value={filters.minValue || ''} onChange={e => onFilterChange('minValue', e.target.value)} />
              <input type="number" className="input input-bordered input-xs flex-1" placeholder="Max" value={filters.maxValue || ''} onChange={e => onFilterChange('maxValue', e.target.value)} />
            </div>
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text text-xs">📦 Quantity Range</span></label>
            <div className="flex gap-1">
              <input type="number" className="input input-bordered input-xs flex-1" placeholder="Min Qty" value={filters.minQty || ''} onChange={e => onFilterChange('minQty', e.target.value)} />
              <input type="number" className="input input-bordered input-xs flex-1" placeholder="Max Qty" value={filters.maxQty || ''} onChange={e => onFilterChange('maxQty', e.target.value)} />
            </div>
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text text-xs">📊 Status</span></label>
            <select className="select select-bordered select-xs" value={filters.statusFilter || ''} onChange={e => onFilterChange('statusFilter', e.target.value)}>
              <option value="">All Status</option>
              <option value="complete">Complete</option>
              <option value="in-progress">In Progress</option>
              <option value="pending">Pending</option>
              <option value="multi-pi">Multi-PI Orders</option>
              <option value="high-value">High Value (>$50k)</option>
            </select>
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text text-xs">📦 Section</span></label>
            <select className="select select-bordered select-xs" value={filters.sectionFilter || ''} onChange={e => onFilterChange('sectionFilter', e.target.value)}>
              <option value="">All Sections</option>
              {sections.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text text-xs">📋 Order Status</span></label>
            <select className="select select-bordered select-xs" value={filters.orderStatusFilter || ''} onChange={e => onFilterChange('orderStatusFilter', e.target.value)}>
              <option value="">All Orders</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text text-xs">🚚 Delivery Status</span></label>
            <select className="select select-bordered select-xs" value={filters.deliveryStatusFilter || ''} onChange={e => onFilterChange('deliveryStatusFilter', e.target.value)}>
              <option value="">All Deliveries</option>
              <option value="delivered">Delivered</option>
              <option value="pending-delivery">Pending Delivery</option>
            </select>
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text text-xs">⭐ Favorites</span></label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="checkbox checkbox-xs" checked={filters.showFavoritesOnly || false} onChange={e => onFilterChange('showFavoritesOnly', e.target.checked)} />
              <span className="text-xs">Show Favorites Only</span>
            </label>
          </div>
        </div>
      )}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999]">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-bold text-lg mb-4">💾 Save Filter</h3>
            <input type="text" className="input input-bordered w-full mb-4" placeholder="Filter name" value={filterName} onChange={e => setFilterName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSaveFilter()} autoFocus />
            <div className="flex gap-2 justify-end">
              <button className="btn btn-ghost btn-sm" onClick={() => setShowSaveDialog(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm text-white" onClick={handleSaveFilter}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
AdvancedFiltersPanel.displayName = "AdvancedFiltersPanel";

// ============================================================
// COMPONENT: NOTIFICATION CENTER
// ============================================================

const NotificationCenter = React.memo(({ data }) => {
  const [dismissed, setDismissed] = useState(new Set());
  const { isOpen, toggle, close, dropdownRef, buttonRef } = useDropdown();
  const notifications = useMemo(() => {
    if (!data?.length) return [];
    const n = [];
    const critical = data.filter(d => parseFloat(d.completionRate) < 30);
    if (critical.length) n.push({ id: 1, type: 'error', icon: '⚠️', message: `${critical.length} critically low orders`, details: 'Less than 30% completion' });
    const highValue = data.filter(d => Number(d.TotalValue) > 100000);
    if (highValue.length) n.push({ id: 2, type: 'warning', icon: '💰', message: `${highValue.length} high-value orders`, details: 'Exceeding $100,000' });
    const complete = data.filter(d => parseFloat(d.completionRate) === 100);
    if (complete.length === data.length && data.length > 0) n.push({ id: 3, type: 'success', icon: '✅', message: 'All orders complete!', details: `${data.length} delivered` });
    else if (complete.length) n.push({ id: 4, type: 'info', icon: '📊', message: `${complete.length} orders complete`, details: `${((complete.length / data.length) * 100).toFixed(1)}% rate` });
    const multiPI = data.filter(d => d.piCount > 1);
    if (multiPI.length > 0) n.push({ id: 5, type: 'info', icon: '📋', message: `${multiPI.length} multi-PI orders`, details: `Avg ${(multiPI.reduce((s, d) => s + d.piCount, 0) / multiPI.length).toFixed(1)} PIs/order` });
    return n;
  }, [data]);
  const visible = notifications.filter(n => !dismissed.has(n.id));
  if (visible.length === 0) return null;
  return (
    <div className="relative">
      <button ref={buttonRef} className="btn btn-ghost btn-xs gap-1 relative" onClick={toggle}>
        🔔<span className="badge badge-error badge-xs absolute -top-1 -right-1 animate-pulse">{visible.length}</span>
      </button>
      {isOpen && (
        <div ref={dropdownRef} className="absolute right-0 mt-2 w-80 bg-white shadow-xl rounded-xl p-3 z-50 border max-h-80 overflow-y-auto">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold text-sm">Notifications</h4>
            <button className="text-xs text-gray-400 hover:text-gray-600" onClick={() => { setDismissed(new Set(notifications.map(n => n.id))); close(); }}>Dismiss All</button>
          </div>
          <div className="space-y-2">
            {visible.map(n => (
              <div key={n.id} className={cn('p-3 rounded-lg flex items-start gap-2',
                n.type === 'success' ? 'bg-green-50 border-green-200' :
                  n.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                    n.type === 'error' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200')} style={{ border: '1px solid' }}>
                <span className="text-lg">{n.icon}</span>
                <div className="flex-1"><div className="text-sm font-medium">{n.message}</div>{n.details && <div className="text-xs opacity-70 mt-0.5">{n.details}</div>}</div>
                <button className="text-xs opacity-50 hover:opacity-100" onClick={e => { e.stopPropagation(); setDismissed(p => new Set([...p, n.id])); }}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
NotificationCenter.displayName = "NotificationCenter";

// ============================================================
// COMPONENT: DATA HISTORY
// ============================================================

const DataHistory = React.memo(() => {
  const [history, setHistory] = useLocalStorage('dataHistory', []);
  const { isOpen, toggle, close, dropdownRef, buttonRef } = useDropdown();
  return (
    <div className="relative">
      <button ref={buttonRef} className="btn btn-ghost btn-xs gap-1" onClick={toggle}>📜 History{history.length > 0 && <span className="badge badge-xs">{history.length}</span>}</button>
      {isOpen && (
        <div ref={dropdownRef} className="absolute right-0 mt-2 w-72 bg-white shadow-xl rounded-xl p-3 z-50 border max-h-72 overflow-y-auto">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold text-sm">Recent Actions</h4>
            <button className="text-xs text-red-500 hover:text-red-700" onClick={() => { setHistory([]); close(); }}>Clear All</button>
          </div>
          {history.length === 0 ? <div className="text-center text-gray-400 text-sm py-4">No history yet</div> : (
            <div className="space-y-2">
              {history.slice(0, 20).map((e, i) => (
                <div key={i} className="text-xs border-b pb-2 last:border-b-0">
                  <div className="flex justify-between"><span className="font-medium">{e.action}</span><span className="text-gray-400">{new Date(e.timestamp).toLocaleTimeString()}</span></div>
                  <div className="text-gray-500 truncate">{typeof e.data === 'string' ? e.data : JSON.stringify(e.data || '').substring(0, 50)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
DataHistory.displayName = "DataHistory";

// ============================================================
// COMPONENT: COLUMN VISIBILITY MANAGER
// ============================================================

const ColumnVisibilityManager = React.memo(({ columns, visibleColumns, onToggle }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative">
      <button className="btn btn-ghost btn-xs gap-1" onClick={() => setIsOpen(!isOpen)}>⚙️ Columns <span>{isOpen ? '▲' : '▼'}</span></button>
      {isOpen && (
        <div className="absolute right-0 mt-2 bg-base-100 shadow-xl p-2 rounded-lg w-48 z-50 border">
          <div className="font-semibold text-xs mb-2">Toggle Columns</div>
          <div className="space-y-0.5 max-h-60 overflow-y-auto">
            {columns.map(col => (
              <label key={col.id} className="flex gap-2 py-1 px-2 items-center hover:bg-gray-100 rounded cursor-pointer">
                <input type="checkbox" checked={visibleColumns.includes(col.id)} onChange={() => onToggle(col.id)} disabled={col.required} className="checkbox checkbox-xs" />
                <span className="text-xs">{col.label}</span>
                {col.required && <span className="text-[10px] text-gray-400 ml-auto">(req)</span>}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
ColumnVisibilityManager.displayName = "ColumnVisibilityManager";

// ============================================================
// COMPONENT: DASHBOARD VIEW
// ============================================================

const DashboardView = React.memo(({ data, grandTotal, onQuickView, onFavoriteToggle, favorites }) => {
  const customerStats = useMemo(() => {
    const m = new Map();
    data.forEach(d => {
      const n = d.CustomerName || "Unknown";
      if (!m.has(n)) m.set(n, { value: 0, orders: 0, qty: 0 });
      m.get(n).value += +d.TotalValue || 0;
      m.get(n).orders += 1;
      m.get(n).qty += +d.TotalQty || 0;
    });
    return [...m.entries()].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.value - a.value).slice(0, 7);
  }, [data]);
  const salesPersonStats = useMemo(() => {
    const m = new Map();
    data.forEach(d => {
      const n = d.SalesPerson || "Unknown";
      if (n === 'Unknown') return;
      if (!m.has(n)) m.set(n, { value: 0, orders: 0, qty: 0 });
      m.get(n).value += +d.TotalValue || 0;
      m.get(n).orders += 1;
      m.get(n).qty += +d.TotalQty || 0;
    });
    return [...m.entries()].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.value - a.value).slice(0, 7);
  }, [data]);
  const piCompanyStats = useMemo(() => {
    const m = new Map();
    data.forEach(d => {
      const n = d.PICompany || "Unknown";
      if (n === 'N/A' || n === 'Unknown') return;
      if (!m.has(n)) m.set(n, { value: 0, orders: 0, qty: 0 });
      m.get(n).value += +d.TotalValue || 0;
      m.get(n).orders += 1;
      m.get(n).qty += +d.TotalQty || 0;
    });
    return [...m.entries()].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.value - a.value).slice(0, 7);
  }, [data]);

  const sectionStats = useMemo(() => {
    const m = new Map();
    data.forEach(d => {
      const n = d.Section || "Unknown";
      m.set(n, (m.get(n) || 0) + 1);
    });
    return [...m.entries()].map(([label, value]) => ({ label, value }));
  }, [data]);

  const multiPIStats = useMemo(() => {
    const multi = data.filter(d => d.piCount > 1);
    return {
      count: multi.length,
      percentage: data.length > 0 ? (multi.length / data.length) * 100 : 0,
      avgPIs: multi.length > 0 ? multi.reduce((s, d) => s + d.piCount, 0) / multi.length : 0
    };
  }, [data]);

  const statusStats = useMemo(() => {
    const complete = data.filter(d => parseFloat(d.completionRate) >= 100).length;
    const progress = data.filter(d => parseFloat(d.completionRate) > 0 && parseFloat(d.completionRate) < 100).length;
    const pending = data.filter(d => parseFloat(d.completionRate) === 0).length;
    return [
      { label: 'Complete', value: complete },
      { label: 'In Progress', value: progress },
      { label: 'Pending', value: pending },
    ];
  }, [data]);

  if (data.length === 0) {
    return <div className="text-center py-12 text-gray-400">No data available for dashboard view</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-4 shadow-lg">
          <div className="text-xs opacity-80">Total Orders</div>
          <div className="text-3xl font-bold mt-1">{data.length}</div>
          <div className="text-xs opacity-80 mt-1">across {customerStats.length} customers</div>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-xl p-4 shadow-lg">
          <div className="text-xs opacity-80">Sales Persons</div>
          <div className="text-2xl font-bold mt-1">{salesPersonStats.length}</div>
          <div className="text-xs opacity-80 mt-1">Active sellers</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl p-4 shadow-lg">
          <div className="text-xs opacity-80">Total Value</div>
          <div className="text-2xl font-bold mt-1">{formatCurrency(grandTotal.TotalValue)}</div>
          <div className="text-xs opacity-80 mt-1">Avg: {formatCurrency(grandTotal.TotalValue / (data.length || 1))}</div>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-xl p-4 shadow-lg">
          <div className="text-xs opacity-80">Completion Rate</div>
          <div className="text-3xl font-bold mt-1">{grandTotal.TotalQty > 0 ? Math.round((grandTotal.ChallanQTY / grandTotal.TotalQty) * 100) : 0}%</div>
          <ProgressBar value={grandTotal.TotalQty > 0 ? (grandTotal.ChallanQTY / grandTotal.TotalQty) * 100 : 0} color="#fff" height={4} animated={false} />
        </div>
        <div className="bg-gradient-to-br from-rose-500 to-pink-600 text-white rounded-xl p-4 shadow-lg">
          <div className="text-xs opacity-80">Balance Value</div>
          <div className="text-2xl font-bold mt-1">{formatCurrency(grandTotal.BalanceValue)}</div>
          <div className="text-xs opacity-80 mt-1">Pending delivery</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-violet-600 text-white rounded-xl p-4 shadow-lg">
          <div className="text-xs opacity-80">Multi-PI Orders</div>
          <div className="text-2xl font-bold mt-1">{multiPIStats.count}</div>
          <div className="text-xs opacity-80 mt-1">{multiPIStats.percentage.toFixed(1)}% of total</div>
        </div>
        <div className="bg-gradient-to-br from-teal-500 to-cyan-600 text-white rounded-xl p-4 shadow-lg">
          <div className="text-xs opacity-80">PI Companies</div>
          <div className="text-2xl font-bold mt-1">{piCompanyStats.length}</div>
          <div className="text-xs opacity-80 mt-1">Unique PI Companies</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-sm border">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">📊 Top Customers by Value</h3>
          <BarChartMini data={customerStats.map(c => ({ label: c.name, value: Math.round(c.value) }))} width={400} height={180} />
        </div>
        <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-sm border">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">👤 Top Sales Persons by Value</h3>
          <BarChartMini data={salesPersonStats.map(c => ({ label: c.name, value: Math.round(c.value) }))} width={400} height={180} />
        </div>
        <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-sm border">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">🏢 Top PI Companies by Value</h3>
          <BarChartMini data={piCompanyStats.map(c => ({ label: c.name, value: Math.round(c.value) }))} width={400} height={180} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-sm border">
          <h3 className="text-sm font-semibold mb-3">📦 Section Distribution</h3>
          <div className="space-y-2">
            {sectionStats.map((s, i) => {
              const max = Math.max(...sectionStats.map(x => x.value));
              return (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs w-24 truncate">{s.label}</span>
                  <div className="flex-1"><ProgressBar value={(s.value / max) * 100} height={8} animated={false} /></div>
                  <span className="text-xs font-medium w-8 text-right">{s.value}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-sm border">
          <h3 className="text-sm font-semibold mb-3">⚡ Top Value Orders</h3>
          <div className="space-y-2">
            {[...data].sort((a, b) => b.TotalValue - a.TotalValue).slice(0, 5).map((item, i) => (
              <div key={i} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors"
                onClick={() => onQuickView(item)}>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                    i === 0 ? 'bg-yellow-400 text-yellow-900' : i === 1 ? 'bg-gray-300' : i === 2 ? 'bg-orange-300' : 'bg-blue-100')}>{i + 1}</span>
                  <div className="min-w-0">
                    <div className="text-xs font-medium truncate">{item.WorkOrderNo}</div>
                    <div className="text-[10px] text-gray-500 truncate">{item.CustomerName}</div>
                    {item.piCount > 1 && (
                      <span className="text-[8px] text-blue-500">({item.piCount} PIs)</span>
                    )}
                    {item.PICompany && item.PICompany !== 'N/A' && (
                      <span className="text-[8px] text-teal-500 ml-1">🏢 {item.PICompany}</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-blue-600">{formatCurrency(item.TotalValue)}</div>
                  <div className="text-[10px] text-gray-500">{item.completionRate}%</div>
                </div>
                <button className="ml-1" onClick={e => { e.stopPropagation(); onFavoriteToggle(item.WorkOrderNo); }}>
                  {favorites.includes(item.WorkOrderNo) ? '⭐' : '☆'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});
DashboardView.displayName = "DashboardView";

// ============================================================
// MAIN COMPONENT: BalanceSummary
// ============================================================

function BalanceSummary() {
  // const { cndata, setcndata, setLoading, apiKey } = useContext(GetDataContext);
  const { cndata, loading, apiKey } = useContext(GetDataContext);
  const { theme, toggleTheme } = useTheme();
  // const apiKey = localStorage.getItem("apiKey");

  // State
  const [selectedPI, setSelectedPI] = useLocalStorage('bs_pi', []);
  const [selectedOrder, setSelectedOrder] = useLocalStorage('bs_order', []);
  const [selectedSalesPerson, setSelectedSalesPerson] = useLocalStorage('bs_sales_person', []);
  const [salesPersonSearch, setSalesPersonSearch] = useState("");
  const [salesPersonOpen, setSalesPersonOpen] = useState(false);
  const salesPersonRef = useRef(null);
  const [selectedStyle, setSelectedStyle] = useLocalStorage('bs_style', []);
  const [styleSearch, setStyleSearch] = useState("");
  const [styleOpen, setStyleOpen] = useState(false);
  const styleRef = useRef(null);
  const [selectedLC, setSelectedLC] = useLocalStorage('bs_lc', []);
  const [selectedInvoice, setSelectedInvoice] = useLocalStorage('bs_inv', []);
  const [selectedCustomer, setSelectedCustomer] = useLocalStorage('bs_cust', []);
  const [selectedBuyer, setSelectedBuyer] = useLocalStorage('bs_buyer', []);
  const [selectedDelivery, setSelectedDelivery] = useLocalStorage('bs_del', []);
  const [selectedPICompany, setSelectedPICompany] = useLocalStorage('bs_pi_company', []);
  const [selectedColumns, setSelectedColumns] = useLocalStorage('bs_cols', COLUMN_CONFIG.defaultVisible);
  const [selectedRows, setSelectedRows] = useLocalStorage('bs_rows', []);
  const [favorites, setFavorites] = useLocalStorage('bs_fav', []);
  const [savedFilters, setSavedFilters] = useLocalStorage('bs_saved', []);
  const [selectedPIMultiOrder, setSelectedPIMultiOrder] = useLocalStorage('bs_pi_multi', []);
  const [challanStatusSearch, setChallanStatusSearch] = useState("");
  const [challanStatusOpen, setChallanStatusOpen] = useState(false);
  const challanStatusRef = useRef(null);
  // UI State
  const [search, setSearch] = useState("");
  const [multiSearch, setMultiSearch] = useState("");
  const [viewMode, setViewMode] = useLocalStorage('bs_view', 'table');
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [quickViewItem, setQuickViewItem] = useState(null);
  const [showQuickView, setShowQuickView] = useState(false);
  const [deepInsights, setDeepInsights] = useState([]);
  const [currentBg, setCurrentBg] = useState(null);

  // Order Detail View State
  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);

  const [minQty, setMinQty] = useState("");
  const [maxQty, setMaxQty] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("");
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState("");

  const [piSearch, setPiSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [lcSearch, setLcSearch] = useState("");
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [buyerSearch, setBuyerSearch] = useState("");
  const [deliverySearch, setDeliverySearch] = useState("");
  const [piCompanySearch, setPiCompanySearch] = useState("");
  const [piOpen, setPiOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const [lcOpen, setLcOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [buyerOpen, setBuyerOpen] = useState(false);
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const [piCompanyOpen, setPiCompanyOpen] = useState(false);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");







  const [selectedChallan, setSelectedChallan] = useLocalStorage('bs_challan', []);
  const [challanSearch, setChallanSearch] = useState("");
  const [challanOpen, setChallanOpen] = useState(false);
  const challanRef = useRef(null);

  const piRef = useRef(null);
  const orderRef = useRef(null);
  const lcRef = useRef(null);
  const invoiceRef = useRef(null);
  const customerRef = useRef(null);
  const buyerRef = useRef(null);
  const deliveryRef = useRef(null);
  const piCompanyRef = useRef(null);

  const debouncedSearch = useDebounce(search);

  const maps = useDataMaps(cndata, cndata?.piCompanyData);
  const summarizedData = useSummarizedData(cndata, maps);

  const uniqueSections = useMemo(() => [...new Set(summarizedData.map(d => d.Section).filter(Boolean))], [summarizedData]);
  const uniquePI = useMemo(() => {
    const allPIs = [];
    summarizedData.forEach(d => {
      if (d.PINOList) allPIs.push(...d.PINOList);
    });
    return [...new Set(allPIs)].filter(Boolean).sort();
  }, [summarizedData]);
  const uniqueSalesPersons = useMemo(() => {
    const persons = new Set();
    summarizedData.forEach(d => {
      if (d.SalesPerson && d.SalesPerson !== 'Unknown') {
        persons.add(d.SalesPerson);
      }
    });
    return [...persons].sort();
  }, [summarizedData]);
  const uniqueOrder = useMemo(() => [...new Set(summarizedData.map(d => String(d.WorkOrderNo).trim()).filter(Boolean))], [summarizedData]);
  const uniqueLC = useMemo(() => [...new Set(summarizedData.flatMap(d => d.LCList.map(l => l.lcNo || "No LC")))], [summarizedData]);
  const uniqueInvoice = useMemo(() => [...new Set(summarizedData.flatMap(d => d.InvoiceList.map(i => i.invoiceNo || "No Invoice")))], [summarizedData]);
  const uniqueCustomers = useMemo(() => [...new Set(summarizedData.map(d => d.CustomerName || "Unknown"))], [summarizedData]);
  const uniqueBuyers = useMemo(() => [...new Set(summarizedData.map(d => d.Buyer || "Unknown"))], [summarizedData]);
  const uniqueDeliveries = useMemo(() => [...new Set(summarizedData.map(d => d.DeliverName || "Unknown"))], [summarizedData]);
  const uniquePICompanies = useMemo(() => {
    const companies = new Set();
    summarizedData.forEach(d => {
      if (d.PICompany && d.PICompany !== 'N/A') {
        companies.add(d.PICompany);
      }
    });
    return [...companies].sort();
  }, [summarizedData]);

  const uniqueChallans = useMemo(() => {
    const challanSet = new Set();
    summarizedData.forEach(item => {
      if (item.ChallanNo && Array.isArray(item.ChallanNo)) {
        item.ChallanNo.forEach(ch => {
          if (ch.challanNo) {
            challanSet.add(ch.challanNo);
          }
        });
      }
    });
    return [...challanSet].sort();
  }, [summarizedData]);
  const filteredChallans = useMemo(() =>
    uniqueChallans.filter(c => c.toLowerCase().includes(challanSearch.toLowerCase())),
    [uniqueChallans, challanSearch]
  );
  const filteredSalesPersons = useMemo(() =>
    uniqueSalesPersons.filter(p => p.toLowerCase().includes(salesPersonSearch.toLowerCase())),
    [uniqueSalesPersons, salesPersonSearch]
  );

  const filteredPI = useMemo(() => uniquePI.filter(p => p.toLowerCase().includes(piSearch.toLowerCase())), [uniquePI, piSearch]);
  const filteredOrder = useMemo(() => uniqueOrder.filter(o => o.includes(orderSearch)), [uniqueOrder, orderSearch]);
  const filteredLC = useMemo(() => uniqueLC.filter(l => l.toLowerCase().includes(lcSearch.toLowerCase())), [uniqueLC, lcSearch]);
  const filteredInvoice = useMemo(() => uniqueInvoice.filter(i => i.toLowerCase().includes(invoiceSearch.toLowerCase())), [uniqueInvoice, invoiceSearch]);
  const filteredCustomers = useMemo(() => uniqueCustomers.filter(c => c.toLowerCase().includes(customerSearch.toLowerCase())), [uniqueCustomers, customerSearch]);
  const filteredBuyers = useMemo(() => uniqueBuyers.filter(b => b.toLowerCase().includes(buyerSearch.toLowerCase())), [uniqueBuyers, buyerSearch]);
  const filteredDeliveries = useMemo(() => uniqueDeliveries.filter(d => d.toLowerCase().includes(deliverySearch.toLowerCase())), [uniqueDeliveries, deliverySearch]);
  const filteredPICompanies = useMemo(() => uniquePICompanies.filter(c => c.toLowerCase().includes(piCompanySearch.toLowerCase())), [uniquePICompanies, piCompanySearch]);

  const filters = useMemo(() => ({
    selectedPI, selectedOrder, selectedLC, selectedInvoice, selectedCustomer, selectedBuyer, selectedDelivery, selectedSalesPerson,
    selectedChallan, dateRange, minValue, maxValue, statusFilter, sectionFilter, favorites, showFavoritesOnly, multiSearch,
    selectedPIMultiOrder, minQty, maxQty, orderStatusFilter, deliveryStatusFilter,
    selectedPICompany
  }), [selectedPI, selectedOrder, selectedLC, selectedInvoice, selectedCustomer, selectedSalesPerson,
    selectedBuyer, selectedDelivery, selectedChallan, dateRange, minValue, maxValue,
    statusFilter, sectionFilter, favorites,
    showFavoritesOnly, multiSearch, selectedPIMultiOrder, minQty, maxQty,
    orderStatusFilter, deliveryStatusFilter, selectedPICompany]);

  const filteredData = useFilters(summarizedData, filters, debouncedSearch, maps);
  const { currentPage, setCurrentPage, pageCount, displayedData, totalData, grandTotal, totalItems } = usePagination(filteredData);



  const logHistory = useCallback((action, data) => {
    try {
      const h = JSON.parse(localStorage.getItem('dataHistory') || '[]');
      const newH = [{ timestamp: new Date().toISOString(), action, data: typeof data === 'string' ? data : JSON.stringify(data) }, ...h].slice(0, CONFIG.MAX_HISTORY_ITEMS);
      localStorage.setItem('dataHistory', JSON.stringify(newH));
    } catch { }
  }, []);

  // ===== HANDLE ORDER CLICK - KEEP THIS ONE =====
  const handleOrderClick = useCallback((order) => {
    if (!order || !order.WorkOrderID) {
      toast.error("Cannot open: Order ID is missing");
      return;
    }
    const workOrderId = order.WorkOrderID;
    const encryptedId = encryptWorkOrderId(workOrderId);
    const url = `https://tpl.ebs365.info/#/report/work-order-information-report?WorkOrderID=${encryptedId}`;
    console.log(`Opening work order: ${order.WorkOrderNo} (ID: ${workOrderId})`);
    console.log(`URL: ${url}`);
    window.open(url, '_blank');
    logHistory('Opened work order in TPL', order.WorkOrderNo);
    toast.success(`Opening ${order.WorkOrderNo} in TPL...`);
  }, [logHistory]);

  // ===== HANDLE CHALLAN CLICK - COMPLETE FIX =====
  const handleChallanClick = useCallback((challan) => {
    if (!challan || !challan.deliveryChallanID) {
      toast.error("Cannot open: Challan ID is missing");
      return;
    }

    const deliveryChallanId = challan.deliveryChallanID;
    const encryptedId = encryptDeliveryChallanId(deliveryChallanId);

    // Try multiple authentication sources
    let authToken = localStorage.getItem("token");

    // If no token, try apiKey
    if (!authToken || authToken === 'undefined' || authToken === 'null') {
      authToken = localStorage.getItem("apiKey");
      console.log("Using apiKey as authentication token");
    }

    // If still no token, try other common keys
    if (!authToken || authToken === 'undefined' || authToken === 'null') {
      const possibleKeys = ['authToken', 'accessToken', 'jwtToken', 'apiToken', 'auth'];
      for (const key of possibleKeys) {
        const value = localStorage.getItem(key);
        if (value && value !== 'undefined' && value !== 'null') {
          authToken = value;
          console.log(`Found auth token in localStorage key: ${key}`);
          break;
        }
      }
    }

    // Build URL
    let url;
    if (authToken && authToken !== 'undefined' && authToken !== 'null') {
      url = `https://tpl-rpt.ebs365.info/#/delivery-challan-report?DeliveryChallanID=${encryptedId}&t=${encodeURIComponent(authToken)}`;
    } else {
      // If no token found, try without it
      url = `https://tpl-rpt.ebs365.info/#/delivery-challan-report?DeliveryChallanID=${encryptedId}`;
      console.warn("⚠️ No authentication token found, opening without t parameter");
    }

    console.log(`Opening challan: ${challan.challanNo} (ID: ${deliveryChallanId})`);
    console.log(`URL: ${url}`);

    window.open(url, '_blank');
    logHistory('Opened delivery challan report', challan.challanNo);
    toast.success(`Opening ${challan.challanNo} in TPL...`);
  }, [logHistory]);


  // ===== HANDLE DEEP THINK (ADD THIS) =====
  const handleDeepThink = useCallback((insights) => {
    setDeepInsights(insights || []);
    if (insights?.length) toast.success(`🧠 ${insights.length} insights generated!`);
  }, []);



  const makeToggle = (setter) => useCallback((value) => {
    if (Array.isArray(value)) setter(value);
    else setter(prev => prev.includes(value) ? prev.filter(x => x !== value) : [...prev, value]);
    setCurrentPage(0);
  }, [setter, setCurrentPage]);
  const uniqueStyles = useMemo(() => {
    const styles = new Set();
    summarizedData.forEach(d => {
      if (d.Style && d.Style.trim()) {
        styles.add(d.Style.trim());
      }
    });
    return [...styles].sort();
  }, [summarizedData]);

  const filteredStyles = useMemo(() =>
    uniqueStyles.filter(s => s.toLowerCase().includes(styleSearch.toLowerCase())),
    [uniqueStyles, styleSearch]
  );

  // const uniqueSections = useMemo(() => [...new Set(summarizedData.map(d => d.Section).filter(Boolean))], [summarizedData]);
  // const uniquePI = useMemo(() => {
  //   const allPIs = [];
  //   summarizedData.forEach(d => {
  //     if (d.PINOList) allPIs.push(...d.PINOList);
  //   });
  //   return [...new Set(allPIs)].filter(Boolean).sort();
  // }, [summarizedData]);
  const toggleStyle = makeToggle(setSelectedStyle);
  const toggleChallan = makeToggle(setSelectedChallan);
  const togglePI = makeToggle(setSelectedPI);
  const toggleOrder = makeToggle(setSelectedOrder);
  const toggleSalesPerson = makeToggle(setSelectedSalesPerson);
  const toggleLC = makeToggle(setSelectedLC);
  const toggleInvoice = makeToggle(setSelectedInvoice);
  const toggleCustomer = makeToggle(setSelectedCustomer);
  const toggleBuyer = makeToggle(setSelectedBuyer);
  const toggleDelivery = makeToggle(setSelectedDelivery);
  const togglePICompany = makeToggle(setSelectedPICompany);
  const togglePIMulti = useCallback((value) => {
    if (Array.isArray(value)) {
      setSelectedPIMultiOrder(value);
    } else {
      setSelectedPIMultiOrder(prev =>
        prev.includes(value) ? prev.filter(x => x !== value) : [...prev, value]
      );
    }
    setCurrentPage(0);
  }, [setSelectedPIMultiOrder, setCurrentPage]);

  const toggleColumn = useCallback(c => setSelectedColumns(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]), [setSelectedColumns]);
  const toggleFavorite = useCallback(id => { setFavorites(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]); logHistory(favorites.includes(id) ? 'Removed favorite' : 'Added favorite', id); }, [favorites, setFavorites, logHistory]);

  const resetFilters = useCallback(() => {
    setSelectedPI([]); setSelectedOrder([]); setSelectedLC([]); setSelectedInvoice([]);
    setSelectedCustomer([]); setSelectedBuyer([]); setSelectedDelivery([]); setSelectedChallan([]);
    setSelectedPIMultiOrder([]); setSelectedPICompany([]); setSelectedSalesPerson([]);
    setSearch(""); setMultiSearch(""); setDateRange({ start: "", end: "" });
    setMinValue(""); setMaxValue(""); setStatusFilter(""); setSectionFilter("");
    setMinQty(""); setMaxQty(""); setOrderStatusFilter(""); setDeliveryStatusFilter("");
    setShowFavoritesOnly(false); setCurrentPage(0);
    toast.info("All filters reset");
  }, [setSelectedPI, setSelectedOrder, setSelectedLC, setSelectedInvoice, setSelectedCustomer, setSelectedChallan, setSelectedBuyer, setSelectedDelivery, setSelectedPIMultiOrder, setSelectedPICompany, setCurrentPage]);

  const handleFilterChange = useCallback((key, value) => {
    const setters = {
      dateRange: setDateRange, minValue: setMinValue, maxValue: setMaxValue,
      statusFilter: setStatusFilter, sectionFilter: setSectionFilter,
      showFavoritesOnly: setShowFavoritesOnly, minQty: setMinQty,
      maxQty: setMaxQty, orderStatusFilter: setOrderStatusFilter,
      deliveryStatusFilter: setDeliveryStatusFilter,
    };
    setters[key]?.(value); setCurrentPage(0);
  }, [setCurrentPage]);

  const saveFilter = useCallback((name) => {
    setSavedFilters(prev => [...prev, { id: Date.now().toString(), name, filters, created: new Date().toISOString() }]);
    logHistory('Saved filter', name); toast.success(`Filter "${name}" saved!`);
  }, [filters, setSavedFilters, logHistory]);

  const loadFilter = useCallback((f) => {
    const d = f.filters;
    setSelectedPI(d.selectedPI || []); setSelectedOrder(d.selectedOrder || []);
    setSelectedLC(d.selectedLC || []); setSelectedInvoice(d.selectedInvoice || []);
    setSelectedCustomer(d.selectedCustomer || []); setSelectedBuyer(d.selectedBuyer || []);
    setSelectedDelivery(d.selectedDelivery || []);
    setSelectedChallan(d.selectedChallan || []);
    setSelectedPIMultiOrder(d.selectedPIMultiOrder || []);
    setSelectedPICompany(d.selectedPICompany || []);
    setDateRange(d.dateRange || { start: "", end: "" });
    setMinValue(d.minValue || ""); setMaxValue(d.maxValue || "");
    setStatusFilter(d.statusFilter || ""); setSectionFilter(d.sectionFilter || "");
    setMinQty(d.minQty || ""); setMaxQty(d.maxQty || "");
    setOrderStatusFilter(d.orderStatusFilter || ""); setDeliveryStatusFilter(d.deliveryStatusFilter || "");
    setShowFavoritesOnly(d.showFavoritesOnly || false); setMultiSearch(d.multiSearch || "");
    setCurrentPage(0); toast.success(`Loaded: ${f.name}`);
  }, [setSelectedPI, setSelectedOrder, setSelectedLC, setSelectedInvoice, setSelectedChallan, setSelectedCustomer, setSelectedBuyer, setSelectedDelivery, setSelectedPIMultiOrder, setSelectedPICompany, setCurrentPage]);

  const deleteFilter = useCallback(id => { setSavedFilters(prev => prev.filter(f => f.id !== id)); toast.info('Filter deleted'); }, [setSavedFilters]);

  const handleRowClick = useCallback(item => {
    toast.info(`Order: ${item.WorkOrderNo} • ${item.CustomerName} • ${item.completionRate}%`);
    logHistory('Viewed order', item.WorkOrderNo);
  }, [logHistory]);

  const handleQuickView = useCallback(item => { setQuickViewItem(item); setShowQuickView(true); logHistory('Quick view', item.WorkOrderNo); }, [logHistory]);


  const handleBackgroundChange = useCallback(bg => { setCurrentBg(bg); logHistory('Background changed', bg.name); }, [logHistory]);

  const handleDownloadFull = useCallback(async (order) => {
    if (!order || !order.WorkOrderID) {
      toast.error("Cannot download: Order ID is missing");
      return;
    }
    await downloadFullOrder(order, apiKey);
  }, [apiKey]);

  const getMultiSearchCount = useCallback(() => multiSearch?.trim() ? multiSearch.split(/[\n,;|]+/).filter(s => s.trim()).length : 0, [multiSearch]);
  // In BalanceSummary, after the context is updated
// Add this to verify mergedChallanMap is available
useEffect(() => {
  if (cndata && cndata.mergedChallanMap) {
    console.log('✅ mergedChallanMap has', Object.keys(cndata.mergedChallanMap).length, 'entries');
    // Log a sample to verify
    const sampleKey = Object.keys(cndata.mergedChallanMap)[0];
    if (sampleKey) {
      console.log('✅ Sample mergedChallanMap entry:', sampleKey, cndata.mergedChallanMap[sampleKey]);
    }
  }
}, [cndata]);
  // Keyboard shortcuts
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (piRef.current && !piRef.current.contains(e.target)) setPiOpen(false);
      if (orderRef.current && !orderRef.current.contains(e.target)) setOrderOpen(false);
      if (lcRef.current && !lcRef.current.contains(e.target)) setLcOpen(false);
      if (invoiceRef.current && !invoiceRef.current.contains(e.target)) setInvoiceOpen(false);
      if (customerRef.current && !customerRef.current.contains(e.target)) setCustomerOpen(false);
      if (buyerRef.current && !buyerRef.current.contains(e.target)) setBuyerOpen(false);
      if (deliveryRef.current && !deliveryRef.current.contains(e.target)) setDeliveryOpen(false);
      if (piCompanyRef.current && !piCompanyRef.current.contains(e.target)) setPiCompanyOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') { e.preventDefault(); document.getElementById('global-search')?.focus(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setShowCommandPalette(true); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') { e.preventDefault(); toggleTheme(); }
      if ((e.ctrlKey || e.metaKey) && e.key === '\\') { e.preventDefault(); setViewMode(v => v === 'table' ? 'dashboard' : 'table'); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') { e.preventDefault(); if (displayedData.length) { setSelectedRows(displayedData.map(d => d.WorkOrderNo)); toast.info(`Selected ${displayedData.length} items`); } }
      if ((e.ctrlKey || e.metaKey) && e.key === 't') { e.preventDefault(); document.querySelector('[data-deep-think]')?.click(); }
      if (e.key === 'Escape') { setSearch(''); setShowQuickView(false); setShowOrderDetail(false); setShowCommandPalette(false); setShowShortcuts(false); }
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') { e.preventDefault(); setShowShortcuts(true); }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [displayedData, setSelectedRows, toggleTheme, setViewMode]);

  const commands = useMemo(() => [
    { icon: '🌙', label: 'Toggle Dark Mode', category: 'Theme', shortcut: 'Ctrl+D', action: toggleTheme },
    { icon: '📊', label: 'Switch to Dashboard View', category: 'View', action: () => setViewMode('dashboard') },
    { icon: '📋', label: 'Switch to Table View', category: 'View', action: () => setViewMode('table') },
    { icon: '🔄', label: 'Reset All Filters', category: 'Actions', action: resetFilters },
    { icon: '⭐', label: 'Toggle Favorites Only', category: 'Filters', action: () => setShowFavoritesOnly(p => !p) },
    { icon: '🧠', label: 'Run Deep Think Analysis', category: 'AI', shortcut: 'Ctrl+T', action: () => document.querySelector('[data-deep-think]')?.click() },
    { icon: '⬇', label: 'Export Data', category: 'Export', action: () => document.querySelector('[data-export]')?.click() },
    { icon: '📋', label: 'Multi-PI Filter', category: 'Filters', action: () => document.querySelector('[data-pi-match]')?.click() },
    { icon: '🏢', label: 'PI Company Filter', category: 'Filters', action: () => document.querySelector('[data-pi-company-filter]')?.click() },
    { icon: '❓', label: 'Show Keyboard Shortcuts', category: 'Help', shortcut: '?', action: () => setShowShortcuts(true) },
  ], [toggleTheme, setViewMode, resetFilters]);




  const exportToExcel = useCallback(async (options = {}) => {
    const { format = 'excel', includeSummary = true, includeCharts = false, emailReport = false } = options;
    try {
      if (filteredData.length === 0) { toast.warning("No data to export"); return; }
      toast.info(`Preparing ${format.toUpperCase()} export...`);

      // --- DYNAMIC COLUMN DEFINITION BASED ON USER SELECTION ---
      const columnDisplayMap = {
        'SNo': '#',
        'Order': 'Order No',
        'Date': 'Date',
        'Customer': 'Customer',
        'Delivery': 'Delivery',
        'SalesPerson': 'Sales Person',
        'Buyer': 'Buyer',
        'Section': 'Section',
        'PI': 'PI No',
        'PICompany': 'PI Company',
        'LC': 'LC No',
        'Invoice': 'Invoice No',
        'OrderQty': 'Order Qty',
        'ChallanQty': 'Challan Qty',
        'BalanceQty': 'Balance Qty',
        'OrderValue': 'Order Value',
        'ChallanValue': 'Challan Value',
        'BalanceValue': 'Balance Value',
        'Challan': 'Challan',
        'Progress': 'Progress %',
        'Style': 'Style',
        'Color': 'Color',
        'PO': 'PO',
        'CustomerPO': 'Customer PO',
        'ChallanQtyDetail': 'Challan Qty (Detail)',
        'ChallanValueDetail': 'Challan Value (Detail)'
      };

      const essentialColumns = ['Order', 'Date', 'Customer', 'Delivery', 'SalesPerson', 'Buyer', 'Section'];

      let finalColumns = [...new Set([...essentialColumns, ...selectedColumns])]
        .filter(col => columnDisplayMap[col]);

      if (selectedColumns.includes('PICompany')) {
        finalColumns = finalColumns.filter(col => col !== 'PICompany');
        const piIndex = finalColumns.indexOf('PI');
        if (piIndex !== -1) {
          finalColumns.splice(piIndex + 1, 0, 'PICompany');
        } else {
          const buyerIndex = finalColumns.indexOf('Buyer');
          if (buyerIndex !== -1) {
            finalColumns.splice(buyerIndex + 1, 0, 'PICompany');
          } else {
            finalColumns.push('PICompany');
          }
        }
      }

      if (selectedColumns.includes('SNo')) {
        finalColumns = ['SNo', ...finalColumns.filter(col => col !== 'SNo')];
      }

      const getHeaders = () => finalColumns.map(col => columnDisplayMap[col]);

      const getRowData = (item, index) => {
        const valueMap = {
          'SNo': index,
          'Order': item.WorkOrderNo || '',
          'Date': formatDate(item.OrderReceiveDate),
          'Customer': item.CustomerName || '',
          'Delivery': item.DeliverName || '',
          'SalesPerson': item.SalesPerson || 'Unknown',
          'Buyer': item.Buyer || '',
          'PI': (item.PINO || 'No PI'),
          'PICompany': (item.PICompany || 'N/A'),
          'LC': (item.LCList || []).map(l => l.lcNo).join("; "),
          'Invoice': (item.InvoiceList || []).map(i => i.invoiceNo).join("; "),
          'Section': item.Section || '',
          'OrderQty': +(item.TotalQty?.toFixed(2) || 0),
          'ChallanQty': +(item.ChallanQTY?.toFixed(2) || 0),
          'BalanceQty': +(item.BalanceQty?.toFixed(2) || 0),
          'OrderValue': +(item.TotalValue?.toFixed(2) || 0),
          'ChallanValue': +(item.ChallanValue?.toFixed(2) || 0),
          'BalanceValue': +(item.BalanceValue?.toFixed(2) || 0),
          'Challan': (item.ChallanNo || []).map((c, idx) => {
  // Try mergedChallanMap first
  let mergedChallanMap = cndata?.mergedChallanMap || {};
  let details = mergedChallanMap[c.challanNo] || {};
  
  // If not found, try challanReceiveMap as fallback
  if (!details.challanQty && !details.totalChallanValue) {
    const challanReceiveMap = cndata?.challanReceiveMap || {};
    const receiveData = challanReceiveMap[c.challanNo] || {};
    details = {
      challanQty: receiveData.challanQty || 0,
      totalChallanValue: receiveData.totalChallanValue || 0
    };
  }
  
  // If still not found, try to get from the item's own data
  if (!details.challanQty && !details.totalChallanValue) {
    // Try to find the challan in the order data
    const challanEntry = item.ChallanNo?.find(ch => ch.challanNo === c.challanNo);
    if (challanEntry && challanEntry.challanQty !== undefined) {
      details = {
        challanQty: challanEntry.challanQty || 0,
        totalChallanValue: challanEntry.totalChallanValue || 0
      };
    }
  }
  
  let text = `${idx + 1}. ${c.challanNo} (${c.status || 'Unknown'})`;
  if (details.challanQty > 0) {
    text += ` || Challan QTY (${details.challanQty})`;
  }
  if (details.totalChallanValue > 0) {
    text += ` || Challan Value ($${details.totalChallanValue.toFixed(2)})`;
  }
  return text;
}).join("\n"),
          'Progress': `${item.completionRate?.toFixed(1) || 0}%`,
          'Style': item.Style || '',
          'Color': item.Color || '',
          'PO': item.PO || '',
          'CustomerPO': item.CustomerPO || '',
          'ChallanQtyDetail': (item.ChallanNo || []).map(ch => {
            const mergedChallanMap = cndata?.mergedChallanMap || {};
            const details = mergedChallanMap[ch.challanNo] || {};
            return details.challanQty || 0;
          }).filter(q => q > 0).join('; ') || '-',
          'ChallanValueDetail': (item.ChallanNo || []).reduce((sum, ch) => {
            const mergedChallanMap = cndata?.mergedChallanMap || {};
            const details = mergedChallanMap[ch.challanNo] || {};
            return sum + (details.totalChallanValue || 0);
          }, 0)
        };
        return finalColumns.map(col => valueMap[col] !== undefined ? valueMap[col] : '');
      };

      // --- JSON EXPORT ---
      if (format === 'json') {
        const headers = getHeaders();
        const jsonData = filteredData.map((item, index) => {
          const rowData = getRowData(item, index + 1);
          return headers.reduce((obj, header, idx) => {
            obj[header] = rowData[idx];
            return obj;
          }, {});
        });
        const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `OrderSummary_${Date.now()}.json`; a.click();
        URL.revokeObjectURL(url); toast.success("JSON exported!"); return;
      }

      // --- CSV EXPORT ---
      if (format === 'csv') {
        const headers = getHeaders();
        const rows = filteredData.map((item, index) => getRowData(item, index + 1));
        const csv = [headers, ...rows].map(r => r.map(c => `"${String(c || '').replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `OrderSummary_${Date.now()}.csv`; a.click();
        URL.revokeObjectURL(url); toast.success("CSV exported!"); return;
      }

      // --- PDF EXPORT ---
      if (format === 'pdf') {
        const headers = getHeaders();
        const win = window.open('', '_blank');
        win.document.write(`<html><head><title>Order Summary Report</title><style>
    body{font-family:Arial;padding:20px} 
    h1{color:#000000;border-bottom:2px solid #000;padding-bottom:10px}
    table{width:100%;border-collapse:collapse;font-size:10px}
    th{background:#2d96dd;color:black;padding:5px;border:1px solid #000; font-size: 14px}
    td{border:1px solid #000;padding:4px;text-align:center}
    .total{font-weight:bold;background: #3ebdc2}
    .header{text-align:center;margin-bottom:20px}
    .grand-total{background:#2d96dd;color:#000;font-weight:bold;font-size:12px}
    .grand-total td{border:1px solid #000}
    .balance-red{color:#000;font-weight:bold}
    .challan-red{color:#000;font-weight:bold}
  </style></head><body><div class="header"><h1>Order Summary Report</h1>
  <p>Generated: ${new Date().toLocaleString()} • Total Orders: ${filteredData.length}</p></div>
  <table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>
  ${filteredData.map((item, index) => {
          const rowData = getRowData(item, index + 1);
          const challanData = rowData[headers.indexOf('Challan')] || '';

          let hasNonReceived = false;
          if (challanData) {
            const lines = challanData.split('\n');
            lines.forEach(line => {
              const trimmed = line.trim();
              if (trimmed && !trimmed.includes('Challan Received')) {
                hasNonReceived = true;
              }
            });
          }

          return `<tr>${rowData.map((d, idx) => {
            const header = headers[idx];
            if (header === 'Challan' && hasNonReceived) {
              return `<td style="color:#ff0000;font-weight:bold;">${d}</td>`;
            }
            return `<td>${d}</td>`;
          }).join('')}</tr>`;
        }).join('')}
  </tbody>
  <tfoot>
    <tr class="grand-total">
      <td colspan="${headers.indexOf('Order Qty')}" style="text-align:right;font-weight:bold;color:#000;border:1px solid #000;">GRAND TOTAL</td>
      <td style="font-weight:bold;border:1px solid #000;">${Number(grandTotal.TotalQty || 0).toFixed(2)}</td>
      <td style="font-weight:bold;border:1px solid #000;">${Number(grandTotal.ChallanQTY || 0).toFixed(2)}</td>
      <td style="font-weight:bold;border:1px solid #000;color:#000;">${Number(grandTotal.BalanceQty || 0).toFixed(2)}</td>
      <td style="font-weight:bold;border:1px solid #000;">$${Number(grandTotal.TotalValue || 0).toFixed(2)}</td>
      <td style="font-weight:bold;border:1px solid #000;">$${Number(grandTotal.ChallanValue || 0).toFixed(2)}</td>
      <td style="font-weight:bold;border:1px solid #000;color:#000;">$${Number(grandTotal.BalanceValue || 0).toFixed(2)}</td>
      <td colspan="${headers.length - headers.indexOf('Progress %') - 1}" style="border:1px solid #000;"></td>
    </tr>
  </tfoot></body></html>`);
        win.document.close(); setTimeout(() => win.print(), 500);
        toast.success("PDF opened for print!"); return;
      }
      // ============================================================
      // EXCEL EXPORT WITH EXCELJS - PER-LINE COLORING & AUTO-WIDTH
      // ============================================================

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Order Summary Report';
      workbook.created = new Date();

      const headers = getHeaders();

      // ===== HELPER FUNCTION: Create a sheet with rich text =====
// ===== HELPER FUNCTION: Create a sheet with rich text =====
// ===== HELPER FUNCTION: Create a sheet with rich text =====
const createSheetWithRichText = (dataItems, sheetName) => {
  if (!dataItems || dataItems.length === 0) {
    return null;
  }

  const worksheet = workbook.addWorksheet(sheetName);

  // ===== AUTO-WIDTH CALCULATION =====
  const columnWidths = {};

  // Initialize with header widths
  headers.forEach((header, index) => {
    columnWidths[index] = (header?.length || 10) + 4;
  });

  // Check data rows for max content width
  dataItems.forEach((item) => {
    const rowData = getRowData(item, 0);
    headers.forEach((header, colIndex) => {
      let cellValue = rowData[colIndex] || '';

      if (header === 'Challan' && item.ChallanNo && item.ChallanNo.length > 0) {
        const mergedChallanMap = cndata?.mergedChallanMap || {};
        const challanText = item.ChallanNo.map((ch, idx) => {
          const details = mergedChallanMap[ch.challanNo] || {};
          let text = `${idx + 1}. ${ch.challanNo} (${ch.status || 'Unknown'})`;
          if (details.challanQty > 0) {
            text += ` || Challan QTY (${details.challanQty})`;
          }
          if (details.totalChallanValue > 0) {
            text += ` || Challan Value ($${details.totalChallanValue.toFixed(2)})`;
          }
          return text;
        }).join('\n');
        cellValue = challanText;
      }

      const cellLength = String(cellValue).length;
      const headerLength = header?.length || 10;
      const maxLength = Math.max(cellLength + 2, headerLength + 4);

      columnWidths[colIndex] = Math.max(columnWidths[colIndex] || 10, Math.min(maxLength, 60));
    });
  });

  // Apply column widths
  headers.forEach((header, index) => {
    const col = worksheet.getColumn(index + 1);
    col.width = Math.max(columnWidths[index] || 15, 10);
    col.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // ===== ADD HEADER ROW =====
  const headerRow = worksheet.addRow(headers);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, size: 18, color: { argb: 'FF000000' }, name: 'Calibri' };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFDDD9C4' }
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    };
  });

  // ===== Add data rows with rich text for Challan column =====
  dataItems.forEach((item, index) => {
    const rowData = getRowData(item, index + 1);
    const rowValues = [];

    headers.forEach((header, colIndex) => {
      if (header === 'Challan' && item.ChallanNo && item.ChallanNo.length > 0) {
  const mergedChallanMap = cndata?.mergedChallanMap || {};
  const richText = [];
  item.ChallanNo.forEach((ch, idx) => {
    const isReceived = ch.status === 'Challan Received';
    let details = mergedChallanMap[ch.challanNo] || {};
    
    // Fallback to challanReceiveMap
    if (!details.challanQty && !details.totalChallanValue) {
      const challanReceiveMap = cndata?.challanReceiveMap || {};
      const receiveData = challanReceiveMap[ch.challanNo] || {};
      details = {
        challanQty: receiveData.challanQty || 0,
        totalChallanValue: receiveData.totalChallanValue || 0
      };
    }
    
    const qty = details.challanQty || 0;
    const value = details.totalChallanValue || 0;
    
    let text = `${idx + 1}. ${ch.challanNo} (${ch.status || 'Unknown'})`;
    if (qty > 0) {
      text += ` || Challan QTY (${qty})`;
    }
    if (value > 0) {
      text += ` || Challan Value ($${value.toFixed(2)})`;
    }

    richText.push({
      text: text,
      font: {
        color: { argb: isReceived ? 'FF000000' : 'FFFF0000' },
        bold: !isReceived,
        size: 16,
        name: 'Calibri'
      }
    });

    if (idx < item.ChallanNo.length - 1) {
      richText.push({ text: '\n' });
    }
  });

  rowValues.push({ richText });
} else {
        const val = rowData[colIndex];
        if (typeof val === 'number' && !isNaN(val)) {
          rowValues.push(val);
        } else {
          rowValues.push(val || '');
        }
      }
    });

    const row = worksheet.addRow(rowValues);
    row.height = Math.max(30, (item.ChallanNo?.length || 1) * 25);

    row.eachCell((cell, colNumber) => {
      const header = headers[colNumber - 1];
      const isChallanCol = header === 'Challan';
      const isNumericCol = ['Order Qty', 'Challan Qty', 'Balance Qty', 'Order Value', 'Challan Value', 'Balance Value'].includes(header);
      const isBalanceCol = ['Balance Qty', 'Balance Value'].includes(header);
      const isValueCol = ['Order Value', 'Challan Value', 'Balance Value'].includes(header);

      if (cell.value && typeof cell.value === 'object' && cell.value.richText) {
        cell.alignment = { wrapText: true, vertical: 'middle', horizontal: 'left' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        };
        return;
      }

      cell.font = { size: 16, name: 'Calibri' };

      if (isNumericCol) {
        cell.numFmt = isValueCol ? '"$"#,##0.00' : '#,##0.00';
        cell.alignment = { horizontal: 'right', vertical: 'middle' };

        if (isBalanceCol && cell.value > 0) {
          cell.font = { bold: true, color: { argb: 'FFFF0000' }, size: 16, name: 'Calibri' };
        }
      }

      if (header === '#') {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }

      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
    });
  });

  // ===== ADD SUBTOTAL ROW WITH PROPER MERGING =====
  if (dataItems.length > 0) {
    const subtotal = dataItems.reduce((acc, item) => ({
      totalQty: acc.totalQty + (+item.TotalQty || 0),
      challanQty: acc.challanQty + (+item.ChallanQTY || 0),
      balanceQty: acc.balanceQty + (+item.BalanceQty || 0),
      totalValue: acc.totalValue + (+item.TotalValue || 0),
      challanValue: acc.challanValue + (+item.ChallanValue || 0),
      balanceValue: acc.balanceValue + (+item.BalanceValue || 0)
    }), { totalQty: 0, challanQty: 0, balanceQty: 0, totalValue: 0, challanValue: 0, balanceValue: 0 });

    // Find where numeric columns start
    let startIndex = 0;
    for (let i = 0; i < headers.length; i++) {
      if (['Order Qty', 'Challan Qty', 'Balance Qty', 'Order Value', 'Challan Value', 'Balance Value'].includes(headers[i])) {
        startIndex = i;
        break;
      }
    }

    const subtotalRow = [];
    headers.forEach((header, idx) => {
      if (idx === 0) {
        subtotalRow.push('Subtotal');
      } else if (idx < startIndex) {
        subtotalRow.push('');
      } else if (header === 'Order Qty') {
        subtotalRow.push(subtotal.totalQty);
      } else if (header === 'Challan Qty') {
        subtotalRow.push(subtotal.challanQty);
      } else if (header === 'Balance Qty') {
        subtotalRow.push(subtotal.balanceQty);
      } else if (header === 'Order Value') {
        subtotalRow.push(subtotal.totalValue);
      } else if (header === 'Challan Value') {
        subtotalRow.push(subtotal.challanValue);
      } else if (header === 'Balance Value') {
        subtotalRow.push(subtotal.balanceValue);
      } else {
        subtotalRow.push('');
      }
    });

    const subRow = worksheet.addRow(subtotalRow);

    // Merge cells for "Subtotal" text from column 1 to column before numeric columns
    if (startIndex > 1) {
      const rowNumber = subRow.number;
      worksheet.mergeCells(rowNumber, 1, rowNumber, startIndex);
    }

    subRow.eachCell((cell, colNumber) => {
      const header = headers[colNumber - 1];
      const isNumericCol = ['Order Qty', 'Challan Qty', 'Balance Qty', 'Order Value', 'Challan Value', 'Balance Value'].includes(header);
      const isValueCol = ['Order Value', 'Challan Value', 'Balance Value'].includes(header);
      const isBalanceCol = ['Balance Qty', 'Balance Value'].includes(header);

      cell.font = { bold: true, size: 16, color: { argb: 'FF1E3A5F' }, name: 'Calibri' };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9E1F2' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };

      if (isNumericCol) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.numFmt = isValueCol ? '"$"#,##0.00' : '#,##0.00';

        if (isBalanceCol && cell.value > 0) {
          cell.font = { bold: true, size: 16, color: { argb: 'FFFF0000' }, name: 'Calibri' };
        }
      }

      if (colNumber === 1 && cell.value === 'Subtotal') {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }

      cell.border = {
        top: { style: 'medium', color: { argb: 'FF000000' } },
        bottom: { style: 'medium', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
    });
  }

  return worksheet;
};
      // ============================================================
      // CREATE SHEETS
      // ============================================================

      // --- SHEET 1: ALL DATA (Grouped by PI) ---
      const groupedByPI = {};
      filteredData.forEach(item => {
        const piList = item.PINO ? item.PINO.split(',').map(p => p.trim()) : ["No PI"];
        piList.forEach(pi => {
          if (!groupedByPI[pi]) groupedByPI[pi] = [];
          groupedByPI[pi].push(item);
        });
      });

      // Create main sheet with all data grouped by PI
      const mainSheet = workbook.addWorksheet('All Data (by PI)');
      let currentRow = 1;

      // ===== AUTO-WIDTH CALCULATION FOR MAIN SHEET =====
      const mainColumnWidths = {};

      // Initialize with header widths
      headers.forEach((header, index) => {
        mainColumnWidths[index] = (header?.length || 10) + 4;
      });

      // Check all data for max content width
      filteredData.forEach((item) => {
        const rowData = getRowData(item, 0);
        headers.forEach((header, colIndex) => {
          let cellValue = rowData[colIndex] || '';

          if (header === 'Challan' && item.ChallanNo && item.ChallanNo.length > 0) {
            const challanText = item.ChallanNo.map((ch, idx) =>
              `${idx + 1}. ${ch.challanNo} (${ch.status || 'Unknown'})`
            ).join('\n');
            cellValue = challanText;
          }

          const cellLength = String(cellValue).length;
          const headerLength = header?.length || 10;
          const maxLength = Math.max(cellLength + 2, headerLength + 4);

          mainColumnWidths[colIndex] = Math.max(mainColumnWidths[colIndex] || 10, Math.min(maxLength, 60));
        });
      });

      // Apply column widths
      headers.forEach((header, index) => {
        const col = mainSheet.getColumn(index + 1);
        col.width = Math.max(mainColumnWidths[index] || 15, 10);
        col.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      // Add data grouped by PI

      // ALL Data pI
      for (const [pi, items] of Object.entries(groupedByPI)) {
        // Add PI header row
        const piHeaderRow = mainSheet.addRow([`PI: ${pi}`]);
        mainSheet.mergeCells(`A${currentRow}:${String.fromCharCode(64 + headers.length)}${currentRow}`);
        piHeaderRow.getCell(1).font = { bold: true, size: 20, color: { argb: 'FF000000' }, name: 'Calibri' };
        piHeaderRow.getCell(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          // fgColor: { argb: 'FF2F75B5' }
          fgColor: { argb: 'FFDDD9C4' }
        };
        piHeaderRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        piHeaderRow.height = 35;
        currentRow++;

        // Add HEADER row after PI header - 16px Bold Black
        const headerRowMain = mainSheet.addRow(headers);
        headerRowMain.eachCell((cell) => {
          cell.font = { bold: true, size: 18, color: { argb: 'FF000000' }, name: 'Calibri' };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFB8CCE4' }
          };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
          };
          headerRowMain.height = 25;
        });
        currentRow++;

        // Add data rows for this PI
        items.forEach((item, idx) => {
          const rowData = getRowData(item, idx + 1);
          const rowValues = [];

          headers.forEach((header, colIndex) => {
            if (header === 'Challan' && item.ChallanNo && item.ChallanNo.length > 0) {
              const richText = [];
              item.ChallanNo.forEach((ch, chIdx) => {
                const isReceived = ch.status === 'Challan Received';
                const text = `${chIdx + 1}. ${ch.challanNo} (${ch.status || 'Unknown'})`;

                richText.push({
                  text: text,
                  font: {
                    color: { argb: isReceived ? 'FF000000' : 'FFFF0000' },
                    bold: !isReceived,
                    size: 16,
                    name: 'Calibri'
                  }
                });

                if (chIdx < item.ChallanNo.length - 1) {
                  richText.push({ text: '\n' });
                }
              });

              rowValues.push({ richText });
            } else {
              const val = rowData[colIndex];
              if (typeof val === 'number' && !isNaN(val)) {
                rowValues.push(val);
              } else {
                rowValues.push(val || '');
              }
            }
          });

          const row = mainSheet.addRow(rowValues);
          row.height = Math.max(30, (item.ChallanNo?.length || 1) * 25);

          // Style each cell - ALL FONT SIZE 16
          row.eachCell((cell, colNumber) => {
            const header = headers[colNumber - 1];
            const isChallanCol = header === 'Challan';
            const isNumericCol = ['Order Qty', 'Challan Qty', 'Balance Qty', 'Order Value', 'Challan Value', 'Balance Value'].includes(header);
            const isBalanceCol = ['Balance Qty', 'Balance Value'].includes(header);
            const isValueCol = ['Order Value', 'Challan Value', 'Balance Value'].includes(header);

            if (cell.value && typeof cell.value === 'object' && cell.value.richText) {
              cell.alignment = { wrapText: true, vertical: 'middle', horizontal: 'left' };
              cell.border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } }
              };
              return;
            }

            cell.font = { size: 16, name: 'Calibri' };

            if (isNumericCol) {
              cell.numFmt = isValueCol ? '"$"#,##0.00' : '#,##0.00';
              cell.alignment = { horizontal: 'right', vertical: 'middle' };
              if (isBalanceCol && cell.value > 0) {
                cell.font = { bold: true, color: { argb: 'FFFF0000' }, size: 16, name: 'Calibri' };
              }
            }

            if (header === '#') {
              cell.alignment = { horizontal: 'center', vertical: 'middle' };
            }

            cell.border = {
              top: { style: 'thin', color: { argb: 'FF000000' } },
              bottom: { style: 'thin', color: { argb: 'FF000000' } },
              left: { style: 'thin', color: { argb: 'FF000000' } },
              right: { style: 'thin', color: { argb: 'FF000000' } }
            };
          });

          currentRow++;
        });

        // ===== ADD SUBTOTAL ROW WITH PROPER MERGING FOR MAIN SHEET =====
        const subtotal = items.reduce((acc, item) => ({
          totalQty: acc.totalQty + (+item.TotalQty || 0),
          challanQty: acc.challanQty + (+item.ChallanQTY || 0),
          balanceQty: acc.balanceQty + (+item.BalanceQty || 0),
          totalValue: acc.totalValue + (+item.TotalValue || 0),
          challanValue: acc.challanValue + (+item.ChallanValue || 0),
          balanceValue: acc.balanceValue + (+item.BalanceValue || 0)
        }), { totalQty: 0, challanQty: 0, balanceQty: 0, totalValue: 0, challanValue: 0, balanceValue: 0 });

        // Find where numeric columns start
        let startIndexMain = 0;
        for (let i = 0; i < headers.length; i++) {
          if (['Order Qty', 'Challan Qty', 'Balance Qty', 'Order Value', 'Challan Value', 'Balance Value'].includes(headers[i])) {
            startIndexMain = i;
            break;
          }
        }

        const subtotalRowMain = [];
        headers.forEach((header, idx) => {
          if (idx === 0) {
            subtotalRowMain.push('Subtotal');
          } else if (idx < startIndexMain) {
            subtotalRowMain.push('');
          } else if (header === 'Order Qty') {
            subtotalRowMain.push(subtotal.totalQty);
          } else if (header === 'Challan Qty') {
            subtotalRowMain.push(subtotal.challanQty);
          } else if (header === 'Balance Qty') {
            subtotalRowMain.push(subtotal.balanceQty);
          } else if (header === 'Order Value') {
            subtotalRowMain.push(subtotal.totalValue);
          } else if (header === 'Challan Value') {
            subtotalRowMain.push(subtotal.challanValue);
          } else if (header === 'Balance Value') {
            subtotalRowMain.push(subtotal.balanceValue);
          } else {
            subtotalRowMain.push('');
          }
        });

        const subRowMain = mainSheet.addRow(subtotalRowMain);

        // Merge cells for "Subtotal" text
        if (startIndexMain > 1) {
          const rowNumber = subRowMain.number;
          mainSheet.mergeCells(rowNumber, 1, rowNumber, startIndexMain);
        }

        subRowMain.eachCell((cell, colNumber) => {
          const header = headers[colNumber - 1];
          const isNumericCol = ['Order Qty', 'Challan Qty', 'Balance Qty', 'Order Value', 'Challan Value', 'Balance Value'].includes(header);
          const isValueCol = ['Order Value', 'Challan Value', 'Balance Value'].includes(header);
          const isBalanceCol = ['Balance Qty', 'Balance Value'].includes(header);

          cell.font = { bold: true, size: 16, color: { argb: 'FF1E3A5F' }, name: 'Calibri' };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD9E1F2' }
          };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };

          if (isNumericCol) {
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
            cell.numFmt = isValueCol ? '"$"#,##0.00' : '#,##0.00';

            if (isBalanceCol && cell.value > 0) {
              cell.font = { bold: true, size: 16, color: { argb: 'FFFF0000' }, name: 'Calibri' };
            }
          }

          if (colNumber === 1 && cell.value === 'Subtotal') {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          }

          cell.border = {
            top: { style: 'medium', color: { argb: 'FF000000' } },
            bottom: { style: 'medium', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
          };
        });
        currentRow++;

        // Add gap between PI groups
        if (Object.keys(groupedByPI).length > 1) {
          currentRow++;
          mainSheet.addRow([]);
        }
      }

      // --- SHEET 2: NO PI DATA ---
      const noPIData = filteredData.filter(item => {
        const pi = item.PINO || 'No PI';
        return pi === 'No PI' || pi === 'N/A' || pi === '' || pi === ' ' || pi === '-';
      });

      if (noPIData.length > 0) {
        createSheetWithRichText(noPIData, 'No PI');
      }

      // --- SHEET 3: ALL PI DATA ---
      const allPIData = filteredData.filter(item => {
        const pi = item.PINO || 'No PI';
        return pi !== 'No PI' && pi !== 'N/A' && pi !== '' && pi !== ' ' && pi !== '-';
      });

      if (allPIData.length > 0) {
        createSheetWithRichText(allPIData, 'All PI');
      }

      // ============================================================
      // SHEET 4: SUMMARY PI
      // ============================================================

      const summaryPISheet = workbook.addWorksheet('Summary PI');

      // Header
      summaryPISheet.addRow(['SUMMARY PI REPORT']);
      summaryPISheet.mergeCells('A1:J1');
      summaryPISheet.getCell('A1').font = { bold: true, size: 18, color: { argb: 'FF1E3A5F' }, name: 'Calibri' };
      summaryPISheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
      summaryPISheet.addRow([]);

      // Table headers - 16px Bold Black
      const piHeaders = ['S.No', 'PI No', 'PI Company', 'Order Count', 'Total Qty', 'Total Value', 'Total Challan Qty', 'Total Challan Value', 'Total Balance Qty', 'Total Balance Value'];
      const piHeaderRow = summaryPISheet.addRow(piHeaders);
      piHeaderRow.eachCell((cell) => {
        cell.font = { bold: true, size: 16, color: { argb: 'FF000000' }, name: 'Calibri' };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF0F0F0' }
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        };
      });

      // Set column widths (fixed for Summary PI)
      [8, 25, 30, 15, 18, 20, 18, 20, 18, 20].forEach((width, index) => {
        summaryPISheet.getColumn(index + 1).width = width;
      });

      // Group data by PI
      const piGroupMap = new Map();
      allPIData.forEach(item => {
        if (item.PIList && item.PIList.length > 0) {
          item.PIList.forEach(pi => {
            const piKey = pi.piNo || 'Unknown PI';
            if (!piGroupMap.has(piKey)) {
              piGroupMap.set(piKey, {
                piNo: piKey,
                piCompany: pi.piCompany || 'N/A',
                orderCount: 0,
                totalQty: 0,
                totalValue: 0,
                totalChallanQty: 0,
                totalChallanValue: 0,
                totalBalanceQty: 0,
                totalBalanceValue: 0
              });
            }
            const group = piGroupMap.get(piKey);
            group.orderCount += 1;
            group.totalQty += (pi.qty || 0);
            group.totalValue += (pi.value || 0);
            group.totalChallanQty += (pi.challanQty || 0);
            group.totalChallanValue += (pi.challanValue || 0);
            group.totalBalanceQty += (pi.balanceQty || 0);
            group.totalBalanceValue += (pi.balanceValue || 0);
          });
        }
      });

      const sortedPIList = Array.from(piGroupMap.values())
        .sort((a, b) => b.totalValue - a.totalValue);

      let piSNo = 0;
      sortedPIList.forEach(pi => {
        piSNo++;
        const row = summaryPISheet.addRow([
          piSNo,
          pi.piNo,
          pi.piCompany,
          pi.orderCount,
          pi.totalQty,
          pi.totalValue,
          pi.totalChallanQty,
          pi.totalChallanValue,
          pi.totalBalanceQty,
          pi.totalBalanceValue
        ]);

        row.eachCell((cell, colNumber) => {
          cell.font = { size: 16, name: 'Calibri' };
          cell.border = {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
          };
          cell.alignment = { horizontal: colNumber === 1 ? 'left' : 'right', vertical: 'middle' };

          if (colNumber >= 5 && colNumber <= 10) {
            cell.numFmt = (colNumber === 6 || colNumber === 8 || colNumber === 10) ? '"$"#,##0.00' : '#,##0.00';
          }
        });
      });

      // Grand total row
      const summaryPITotals = sortedPIList.reduce((acc, pi) => ({
        orderCount: acc.orderCount + pi.orderCount,
        totalQty: acc.totalQty + pi.totalQty,
        totalValue: acc.totalValue + pi.totalValue,
        totalChallanQty: acc.totalChallanQty + pi.totalChallanQty,
        totalChallanValue: acc.totalChallanValue + pi.totalChallanValue,
        totalBalanceQty: acc.totalBalanceQty + pi.totalBalanceQty,
        totalBalanceValue: acc.totalBalanceValue + pi.totalBalanceValue
      }), { orderCount: 0, totalQty: 0, totalValue: 0, totalChallanQty: 0, totalChallanValue: 0, totalBalanceQty: 0, totalBalanceValue: 0 });

      summaryPISheet.addRow([]);
      const totalRow = summaryPISheet.addRow([
        'TOTAL',
        '',
        '',
        summaryPITotals.orderCount,
        summaryPITotals.totalQty,
        summaryPITotals.totalValue,
        summaryPITotals.totalChallanQty,
        summaryPITotals.totalChallanValue,
        summaryPITotals.totalBalanceQty,
        summaryPITotals.totalBalanceValue
      ]);

      totalRow.eachCell((cell) => {
        cell.font = { bold: true, size: 16, color: { argb: 'FF1E3A5F' }, name: 'Calibri' };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD9E1F2' }
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'medium' },
          bottom: { style: 'medium' },
          left: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      // ============================================================
      // SHEET 5: SUMMARY (if includeSummary is true)
      // ============================================================
      if (includeSummary) {
        const summarySheet = workbook.addWorksheet('Summary');

        // Add summary content
        const summaryRows = [];
        summaryRows.push(['ORDER SUMMARY REPORT']);
        summaryRows.push([]);
        summaryRows.push(['Generated:', new Date().toLocaleString()]);
        summaryRows.push(['Total Orders:', filteredData.length]);
        summaryRows.push(['Orders with PI:', allPIData.length]);
        summaryRows.push(['Orders without PI:', noPIData.length]);
        summaryRows.push([]);

        const uniquePIs = new Set();
        allPIData.forEach(item => {
          if (item.PINO) {
            item.PINO.split(',').forEach(p => uniquePIs.add(p.trim()));
          }
        });
        summaryRows.push(['Unique PIs:', uniquePIs.size]);

        const uniquePICompanies = new Set();
        allPIData.forEach(item => {
          if (item.PICompany && item.PICompany !== 'N/A') {
            uniquePICompanies.add(item.PICompany);
          }
        });
        summaryRows.push(['Unique PI Companies:', uniquePICompanies.size]);
        summaryRows.push([]);

        summaryRows.push(['QUANTITY SUMMARY']);
        summaryRows.push(['Total Quantity:', grandTotal.TotalQty]);
        summaryRows.push(['Total Challan Qty:', grandTotal.ChallanQTY]);
        summaryRows.push(['Total Balance Qty:', grandTotal.BalanceQty]);
        summaryRows.push([]);

        summaryRows.push(['VALUE SUMMARY']);
        summaryRows.push(['Total Value:', `$${grandTotal.TotalValue.toFixed(2)}`]);
        summaryRows.push(['Total Challan Value:', `$${grandTotal.ChallanValue.toFixed(2)}`]);
        summaryRows.push(['Total Balance Value:', `$${grandTotal.BalanceValue.toFixed(2)}`]);
        summaryRows.push([]);

        const overallCompletion = grandTotal.TotalQty > 0 ? ((grandTotal.ChallanQTY / grandTotal.TotalQty) * 100) : 0;
        summaryRows.push(['COMPLETION SUMMARY']);
        summaryRows.push(['Overall Completion Rate:', `${overallCompletion.toFixed(1)}%`]);

        // Write summary rows
        summaryRows.forEach((row, index) => {
          const sheetRow = summarySheet.addRow(row);
          sheetRow.eachCell((cell) => {
            cell.font = { size: 16, name: 'Calibri' };
          });
          if (index === 0) {
            sheetRow.getCell(1).font = { bold: true, size: 18, color: { argb: 'FF1E3A5F' }, name: 'Calibri' };
          }
          if (row.length === 2 && typeof row[1] === 'number') {
            sheetRow.getCell(2).numFmt = '#,##0.00';
          }
          if (row.length === 2 && typeof row[1] === 'string' && row[1].startsWith('$')) {
            sheetRow.getCell(2).numFmt = '"$"#,##0.00';
          }
        });

        summarySheet.getColumn(1).width = 30;
        summarySheet.getColumn(2).width = 25;
      }

      // ============================================================
      // WRITE FILE
      // ============================================================
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `OrderSummaryReport_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${filteredData.length} rows with per-line coloring!`);
      if (emailReport) toast.info('📧 Report scheduled for email');
      logHistory('Exported data', { format, count: filteredData.length });

    } catch (error) {
      console.error("Export error:", error);
      toast.error(`Export failed: ${error.message}`);
    }
  }, [filteredData, grandTotal, logHistory, selectedColumns]);
  // ============================================================
  // COMPONENT RENDER
  // ============================================================
  return (
    <BackgroundGenerator theme={theme} onBackgroundChange={handleBackgroundChange}>
      <style>{`
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{transform:translate(-50%,100%);opacity:0} to{transform:translate(-50%,0);opacity:1} }
        @keyframes slideIn { from{transform:translateY(-20px);opacity:0} to{transform:translateY(0);opacity:1} }
        .animate-fadeIn{animation:fadeIn .2s ease} .animate-slideUp{animation:slideUp .3s ease}
        .animate-slideIn{animation:slideIn .3s ease} .animate-shimmer{animation:shimmer 2s infinite}
      `}</style>
      <div className="container mx-auto px-3 py-4 relative z-10">
        <OrderForm />

        <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Order / PI Summary</h1>
            <p className="text-xs text-gray-600 mt-0.5">
              {totalItems} orders • {summarizedData.length} total
              {favorites.length > 0 && ` • ⭐ ${favorites.length}`}
              {selectedPIMultiOrder.length > 0 && <span className="ml-2 text-warning">• 📋 Multi-PI: {selectedPIMultiOrder.length} PIs</span>}
              {selectedPICompany.length > 0 && <span className="ml-2 text-teal-600">• 🏢 PI Companies: {selectedPICompany.length}</span>}
              {selectedSalesPerson.length > 0 && <span className="ml-2 text-indigo-600">• 👤 Sales: {selectedSalesPerson.length}</span>}
              {selectedChallan.length > 0 && <span className="ml-2 text-cyan-600">• 🚚 Challans: {selectedChallan.length}</span>}
              {multiSearch?.trim() && <span className="ml-2 text-warning">• 🔍 Multi: {getMultiSearchCount()}</span>}
              {uniqueSalesPersons.length > 0 && <span className="ml-2 text-indigo-600">• 👤 {uniqueSalesPersons.length} Sales Persons</span>}
            </p>
          </div>
          <div className="flex gap-1 flex-wrap items-center">
            <div className="join">
              <button className={cn('join-item btn btn-xs', viewMode === 'table' ? 'btn-primary text-white' : 'btn-ghost bg-white/80')} onClick={() => setViewMode('table')}>📋</button>
              <button className={cn('join-item btn btn-xs', viewMode === 'dashboard' ? 'btn-primary text-white' : 'btn-ghost bg-white/80')} onClick={() => setViewMode('dashboard')}>📊</button>
            </div>
            <button className="btn btn-ghost btn-xs bg-white/80 backdrop-blur-sm" onClick={toggleTheme} title="Toggle Theme (Ctrl+D)">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button className="btn btn-ghost btn-xs bg-white/80 backdrop-blur-sm" onClick={() => setShowShortcuts(true)}>⌨️</button>
            <button className="btn btn-ghost btn-xs bg-white/80 backdrop-blur-sm" onClick={() => setShowCommandPalette(true)}>⚡</button>
            <NotificationCenter data={filteredData} />
            <DataHistory />
            <ColumnVisibilityManager columns={COLUMN_CONFIG.allColumns} visibleColumns={selectedColumns} onToggle={toggleColumn} />
            <div data-export><ExportOptions onExport={exportToExcel} totalItems={totalItems} disabled={totalItems === 0} /></div>
          </div>
        </div>

        <ExpandableSummaryCards data={filteredData} onQuickView={handleQuickView} />

        <TopItemsAnalytics data={filteredData} onQuickView={handleQuickView} />

        {grandTotal.TotalQty > 0 && (
          <div className="grid grid-cols-3 md:grid-cols-8 gap-2 mb-4">
            {[
              { label: 'Orders', value: totalItems, color: 'text-gray-800' },
              { label: 'Order Value', value: formatCurrency(grandTotal.TotalValue), color: 'text-indigo-600' },
              { label: 'Sales', value: formatCurrency(grandTotal.ChallanValue), color: 'text-green-600' },
              { label: 'Balance', value: formatCurrency(grandTotal.BalanceValue), color: 'text-red-600' },
              { label: 'Completion', value: `${grandTotal.TotalQty > 0 ? Math.round((grandTotal.ChallanQTY / grandTotal.TotalQty) * 100) : 0}%`, color: 'text-purple-600' },
              { label: 'PI Value', value: formatCurrency(filteredData.filter(d => d.PINO !== 'No PI' && d.PINO !== 'N/A').reduce((sum, d) => sum + (Number(d.TotalValue) || 0), 0)), color: 'text-blue-600' },
              { label: 'No PI', value: `${filteredData.filter(d => d.PINO === 'No PI' || d.PINO === 'N/A').length} (${formatCurrency(filteredData.filter(d => d.PINO === 'No PI' || d.PINO === 'N/A').reduce((sum, d) => sum + (Number(d.TotalValue) || 0), 0))})`, color: 'text-orange-600' },
              { label: 'PI Companies', value: `${new Set(filteredData.map(d => d.PICompany).filter(c => c && c !== 'N/A')).size}`, color: 'text-teal-600' },
            ].map((stat, i) => (
              <div key={i} className="bg-white/85 backdrop-blur-sm rounded-lg shadow-sm p-2 border hover:shadow-md transition-shadow">
                <div className="text-[10px] text-gray-500">{stat.label}</div>
                <div className={cn('text-base font-bold', stat.color)}>{stat.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Bulk Download Button */}
        {selectedRows.length > 0 && (
          <div className="mb-3 flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <span className="text-sm font-medium text-blue-700">
              {selectedRows.length} orders selected
            </span>
            <BulkAttachmentDownloader
              selectedOrders={selectedRows.map(id => displayedData.find(d => d.WorkOrderNo === id)).filter(Boolean)}
              apiKey={apiKey}
              onComplete={() => { }}
            />
            <button
              className="btn btn-xs btn-ghost text-gray-500"
              onClick={() => setSelectedRows([])}
            >
              ✕ Clear
            </button>
          </div>
        )}

        <div className="mb-3">
          <AdvancedFiltersPanel
            filters={{ dateRange, minValue, maxValue, statusFilter, sectionFilter, showFavoritesOnly, minQty, maxQty, orderStatusFilter, deliveryStatusFilter }}
            onFilterChange={handleFilterChange} onReset={resetFilters} totalItems={totalItems} loading={loading}
            sections={uniqueSections} onSaveFilter={saveFilter} savedFilters={savedFilters}
            onLoadFilter={loadFilter} onDeleteFilter={deleteFilter} onDeepThink={handleDeepThink} data={filteredData}
          />
        </div>

        <div className="flex flex-wrap gap-1 mb-3 items-center">
          <div className="flex-1 min-w-[150px]">
            <input id="global-search" type="text" placeholder="🔍 Search... (Ctrl+F)" className="input input-bordered input-xs w-full bg-white/90 backdrop-blur-sm" value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(0); }} />
          </div>
          <MultiSearchDropdown value={multiSearch} onChange={setMultiSearch} onClear={() => setMultiSearch('')} onSearch={() => { if (multiSearch?.trim()) { toast.info(`🔍 Searching ${getMultiSearchCount()} items...`); setCurrentPage(0); } }} totalMatches={filteredData.length} isActive={multiSearch?.trim()?.length > 0} />

          <PIMatchFilter
            availablePIs={uniquePI}
            selectedPIs={selectedPIMultiOrder}
            onToggle={togglePIMulti}
            onClear={() => { setSelectedPIMultiOrder([]); setCurrentPage(0); }}
            data={summarizedData}
            label="PI Match"
            icon="📋"
          />

          <ProfessionalFilterDropdown
            label="PI Company"
            open={piCompanyOpen}
            setOpen={setPiCompanyOpen}
            items={filteredPICompanies}
            selectedItems={selectedPICompany}
            onToggle={togglePICompany}
            searchValue={piCompanySearch}
            setSearchValue={setPiCompanySearch}
            ref={piCompanyRef}
            color="teal"
            icon="🏢"
          />
          <ProfessionalFilterDropdown
            label="Sales Person"
            open={salesPersonOpen}
            setOpen={setSalesPersonOpen}
            items={filteredSalesPersons}
            selectedItems={selectedSalesPerson}
            onToggle={toggleSalesPerson}
            searchValue={salesPersonSearch}
            setSearchValue={setSalesPersonSearch}
            ref={salesPersonRef}
            color="indigo"
            icon="👤"
          />

          <ProfessionalFilterDropdown label="Order" open={orderOpen} setOpen={setOrderOpen} items={filteredOrder} selectedItems={selectedOrder} onToggle={toggleOrder} searchValue={orderSearch} setSearchValue={setOrderSearch} ref={orderRef} color="primary" />
          <ProfessionalFilterDropdown label="PI" open={piOpen} setOpen={setPiOpen} items={filteredPI} selectedItems={selectedPI} onToggle={togglePI} searchValue={piSearch} setSearchValue={setPiSearch} ref={piRef} color="secondary" />
          <ProfessionalFilterDropdown label="LC" open={lcOpen} setOpen={setLcOpen} items={filteredLC} selectedItems={selectedLC} onToggle={toggleLC} searchValue={lcSearch} setSearchValue={setLcSearch} ref={lcRef} color="info" />
          <ProfessionalFilterDropdown label="Invoice" open={invoiceOpen} setOpen={setInvoiceOpen} items={filteredInvoice} selectedItems={selectedInvoice} onToggle={toggleInvoice} searchValue={invoiceSearch} setSearchValue={setInvoiceSearch} ref={invoiceRef} color="success" />
          <ProfessionalFilterDropdown label="Customer" open={customerOpen} setOpen={setCustomerOpen} items={filteredCustomers} selectedItems={selectedCustomer} onToggle={toggleCustomer} searchValue={customerSearch} setSearchValue={setCustomerSearch} ref={customerRef} color="purple" icon="👤" />
          <ProfessionalFilterDropdown label="Buyer" open={buyerOpen} setOpen={setBuyerOpen} items={filteredBuyers} selectedItems={selectedBuyer} onToggle={toggleBuyer} searchValue={buyerSearch} setSearchValue={setBuyerSearch} ref={buyerRef} color="pink" icon="💼" />
          <ProfessionalFilterDropdown label="Delivery" open={deliveryOpen} setOpen={setDeliveryOpen} items={filteredDeliveries} selectedItems={selectedDelivery} onToggle={toggleDelivery} searchValue={deliverySearch} setSearchValue={setDeliverySearch} ref={deliveryRef} color="orange" icon="🚚" />
          <ProfessionalFilterDropdown
            label="Challan"
            open={challanOpen}
            setOpen={setChallanOpen}
            items={filteredChallans}
            selectedItems={selectedChallan}
            onToggle={toggleChallan}
            searchValue={challanSearch}
            setSearchValue={setChallanSearch}
            ref={challanRef}
            color="cyan"
            icon="🚚"
          />
          <ProfessionalFilterDropdown
            label="Style"
            open={styleOpen}
            setOpen={setStyleOpen}
            items={filteredStyles}
            selectedItems={selectedStyle}
            onToggle={toggleStyle}
            searchValue={styleSearch}
            setSearchValue={setStyleSearch}
            ref={styleRef}
            color="purple"
            icon="🎨"
          />
          <button className={cn('btn btn-xs', showFavoritesOnly ? 'btn-warning' : 'btn-ghost bg-white/80')} onClick={() => setShowFavoritesOnly(p => !p)} title="Toggle Favorites">{showFavoritesOnly ? '⭐' : '☆'}</button>
          {(selectedPI.length || selectedOrder.length || selectedLC.length || selectedInvoice.length || selectedCustomer.length || selectedBuyer.length || selectedDelivery.length || selectedChallan.length || selectedPIMultiOrder.length || selectedPICompany.length || search || multiSearch || dateRange.start || dateRange.end || minValue || maxValue || minQty || maxQty || statusFilter || sectionFilter || orderStatusFilter || deliveryStatusFilter || showFavoritesOnly) ? (
            <button className="btn btn-ghost btn-xs bg-white/80" onClick={resetFilters}>Clear All</button>
          ) : null}
        </div>

        {viewMode === 'dashboard' ? (
          <DashboardView data={filteredData} grandTotal={grandTotal} onQuickView={handleQuickView} onFavoriteToggle={toggleFavorite} favorites={favorites} />
        ) : (
          <ProfessionalSummaryTable
            data={displayedData}
            columns={selectedColumns}
            totalData={totalData}
            onRowSelect={setSelectedRows}
            onQuickView={handleQuickView}
            onFavoriteToggle={toggleFavorite}
            onOrderClick={handleOrderClick}
            onChallanClick={handleChallanClick}
            selectedRows={selectedRows}
            favorites={favorites}
            loading={loading}
            currentPage={currentPage}
            apiKey={apiKey}
            cndata={cndata}
          />

        )}

        {pageCount > 1 && viewMode === 'table' && (
          <div className="flex flex-wrap justify-between items-center mt-3 gap-2">
            <div className="text-xs text-gray-600">
              Showing {currentPage * CONFIG.ITEMS_PER_PAGE + 1} to {Math.min((currentPage + 1) * CONFIG.ITEMS_PER_PAGE, totalItems)} of {totalItems}
              {selectedRows.length > 0 && ` • ${selectedRows.length} selected`}
              {selectedPIMultiOrder.length > 0 && ` • ${selectedPIMultiOrder.length} PIs matched`}
              {selectedPICompany.length > 0 && ` • 🏢 ${selectedPICompany.length} PI Companies`}
              {selectedSalesPerson.length > 0 && ` • 👤 ${selectedSalesPerson.length} Sales Persons`}
            </div>
            <ReactPaginate
              breakLabel="..." nextLabel="Next →" previousLabel="← Previous" pageCount={pageCount}
              onPageChange={({ selected }) => setCurrentPage(selected)} containerClassName="flex gap-0.5"
              pageLinkClassName="px-2 py-1 border rounded text-xs hover:bg-gray-100 bg-white/80"
              activeLinkClassName="bg-primary text-white" previousLinkClassName="px-2 py-1 border rounded text-xs bg-white/80"
              nextLinkClassName="px-2 py-1 border rounded text-xs bg-white/80" disabledClassName="opacity-50"
              renderOnZeroPageCount={null}
            />
          </div>
        )}

        {selectedRows.length > 0 && (
          <BulkActionsToolbar
            selectedCount={selectedRows.length}
            onClear={() => setSelectedRows([])}
            onExport={() => exportToExcel({ format: 'excel' })}
            onFavorite={() => { selectedRows.forEach(id => !favorites.includes(id) && toggleFavorite(id)); toast.success('Added to favorites!'); }}
            onDelete={() => setSelectedRows([])}
            onAssign={() => toast.info('Tag assignment coming soon!')}
          />
        )}

        <QuickViewModal item={quickViewItem} isOpen={showQuickView} onClose={() => setShowQuickView(false)} />

        <OrderDetailViewModal
          order={selectedOrderDetail}
          isOpen={showOrderDetail}
          onClose={() => {
            setShowOrderDetail(false);
            setSelectedOrderDetail(null);
          }}
          onDownloadFull={handleDownloadFull}
          apiKey={apiKey}
        />

        <CommandPalette isOpen={showCommandPalette} onClose={() => setShowCommandPalette(false)} commands={commands} />

        <KeyboardShortcutsOverlay isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />

        {deepInsights.length > 0 && (
          <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 backdrop-blur-sm rounded-xl p-4 border border-blue-200 animate-slideIn">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-semibold text-sm text-blue-800">🧠 Deep Think Insights</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                  {deepInsights.map((insight, i) => (
                    <div key={i} className={cn('p-2 rounded-lg text-xs',
                      insight.priority === 'critical' ? 'bg-red-100 text-red-700' :
                        insight.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                          insight.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700')}>
                      <span className="mr-1">{insight.icon}</span>
                      <span className="font-medium">{insight.title}:</span>
                      <span className="ml-1">{insight.description}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button className="btn btn-ghost btn-xs" onClick={() => setDeepInsights([])}>✕</button>
            </div>
          </div>
        )}

        <div className="mt-4 text-center text-[10px] text-gray-500 border-t pt-3">
          <p>{totalItems} orders • Updated: {new Date().toLocaleString(CONFIG.DATE_FORMAT)}{favorites.length > 0 && ` • ⭐ ${favorites.length} favorites`}{selectedPIMultiOrder.length > 0 && ` • 📋 ${selectedPIMultiOrder.length} PIs matched`}{selectedPICompany.length > 0 && ` • 🏢 ${selectedPICompany.length} PI Companies`} {selectedChallan.length > 0 && ` • 🚚 ${selectedChallan.length} Challans`}</p>
          <div className="flex flex-wrap justify-center gap-2 mt-1">
            <span>💡 Ctrl+F: Search</span><span>•</span>
            <span>⚡ Ctrl+K: Commands</span><span>•</span>
            <span>🌙 Ctrl+D: Theme</span><span>•</span>
            <span>🔄 Ctrl+\\: View</span><span>•</span>
            <span>🧠 Ctrl+T: AI</span><span>•</span>
            <span>❓ ?: Help</span>
          </div>
        </div>
      </div>


    </BackgroundGenerator>
  );
}

// ============================================================
// EXPORT WITH ERROR BOUNDARY
// ============================================================

const SafeBalanceSummary = () => {
  return (
    <ErrorBoundary>
      <BalanceSummary />
    </ErrorBoundary>
  );
};

export default SafeBalanceSummary;


