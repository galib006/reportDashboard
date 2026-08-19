import React, { useContext, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { GetDataContext } from "../components/DataContext";
import { FourSquare } from "react-loading-indicators";
import OrderForm from "../OrderReport/OrderForm";
import * as XLSX from "xlsx";
import ReactPaginate from "react-paginate";
import { 
  FiSearch, FiFilter, FiDownload, FiPrinter, FiChevronDown, FiChevronUp, 
  FiX, FiPackage, FiDollarSign, FiBarChart2, FiTrendingUp, FiFileText, 
  FiInfo, FiCalendar, FiUser, FiTag, FiBox, FiEye, FiRefreshCw, FiGrid, 
  FiList, FiMaximize2, FiMinimize2, FiCopy, FiStar, FiClock, FiTruck, 
  FiCheckCircle, FiAlertCircle, FiPieChart, FiActivity, FiLayers, 
  FiShoppingBag, FiUsers, FiAward, FiMapPin, FiPercent, FiArrowUp, 
  FiArrowDown, FiSliders, FiToggleLeft, FiToggleRight, FiMoon, FiSun, 
  FiZap, FiTarget, FiFlag, FiClipboard, FiTrendingDown, FiPlus, FiMinus,
  FiSettings, FiColumns, FiSave, FiShare2, FiBell, FiMenu, FiMoreVertical,
  FiExternalLink, FiHome, FiMail, FiPhone, FiGlobe, FiLinkedin, FiTwitter,
  FiArrowRight, FiCalendar as FiCalendarIcon
} from "react-icons/fi";
import { 
  FaStar, FaRegStar, FaTruck, FaCheckCircle as FaCheck, 
  FaClock as FaClockIcon, FaWhatsapp, FaTelegram, FaEnvelope 
} from "react-icons/fa";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line,
  AreaChart, Area, ComposedChart, Scatter, RadarChart, 
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

// ==================== CUSTOM HOOKS ====================
const useOutsideClick = (ref, setState) => {
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setState(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ref, setState]);
};

const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.log(error);
    }
  };

  return [storedValue, setValue];
};

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// ==================== UTILITY FUNCTIONS ====================
const formatDate = (dateStr, format = 'short') => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  
  if (format === 'short') {
    return date.toLocaleDateString("en-GB", {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } else if (format === 'long') {
    return date.toLocaleDateString("en-GB", {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      weekday: 'long'
    });
  } else if (format === 'relative') {
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString("en-GB", {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
  return date.toLocaleDateString("en-GB", {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0);
};

const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num?.toLocaleString() || '0';
};

const getStatusConfig = (status) => {
  const statusMap = {
    "Challan Received": { 
      color: "bg-emerald-100 text-emerald-800 border-emerald-300", 
      icon: "📋", 
      dot: "bg-emerald-500", 
      label: "Challan Received",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      gradient: "from-emerald-400 to-emerald-600"
    },
    "Send to Gate": { 
      color: "bg-amber-100 text-amber-800 border-amber-300", 
      icon: "📤", 
      dot: "bg-amber-500", 
      label: "Send to Gate",
      bg: "bg-amber-50",
      border: "border-amber-200",
      gradient: "from-amber-400 to-amber-600"
    },
    "Delivered": { 
      color: "bg-blue-100 text-blue-800 border-blue-300", 
      icon: "📦", 
      dot: "bg-blue-500", 
      label: "Delivered",
      bg: "bg-blue-50",
      border: "border-blue-200",
      gradient: "from-blue-400 to-blue-600"
    },
    "Gate Out": { 
      color: "bg-rose-100 text-rose-800 border-rose-300", 
      icon: "🚪", 
      dot: "bg-rose-500", 
      label: "Gate Out",
      bg: "bg-rose-50",
      border: "border-rose-200",
      gradient: "from-rose-400 to-rose-600"
    },
    "Pending": { 
      color: "bg-slate-100 text-slate-800 border-slate-300", 
      icon: "⏳", 
      dot: "bg-slate-500", 
      label: "Pending",
      bg: "bg-slate-50",
      border: "border-slate-200",
      gradient: "from-slate-400 to-slate-600"
    },
    "Partial": { 
      color: "bg-orange-100 text-orange-800 border-orange-300", 
      icon: "🔄", 
      dot: "bg-orange-500", 
      label: "Partial",
      bg: "bg-orange-50",
      border: "border-orange-200",
      gradient: "from-orange-400 to-orange-600"
    },
    "Completed": { 
      color: "bg-green-100 text-green-800 border-green-300", 
      icon: "✅", 
      dot: "bg-green-500", 
      label: "Completed",
      bg: "bg-green-50",
      border: "border-green-200",
      gradient: "from-green-400 to-green-600"
    },
    "In Transit": { 
      color: "bg-indigo-100 text-indigo-800 border-indigo-300", 
      icon: "🚚", 
      dot: "bg-indigo-500", 
      label: "In Transit",
      bg: "bg-indigo-50",
      border: "border-indigo-200",
      gradient: "from-indigo-400 to-indigo-600"
    }
  };
  return statusMap[status] || statusMap["Pending"];
};

const getPriorityConfig = (priority) => {
  const priorityMap = {
    'High': { color: 'text-rose-600 bg-rose-100', icon: '🔴' },
    'Medium': { color: 'text-amber-600 bg-amber-100', icon: '🟡' },
    'Low': { color: 'text-emerald-600 bg-emerald-100', icon: '🟢' }
  };
  return priorityMap[priority] || priorityMap['Medium'];
};

// ==================== THEME CONTEXT ====================
const ThemeContext = React.createContext({ 
  theme: 'light', 
  toggleTheme: () => {},
  colors: {}
});

// ==================== ANIMATED COMPONENTS ====================
const AnimatedCard = ({ children, className = "", delay = 0 }) => (
  <div 
    className={`animate-fadeInUp ${className}`}
    style={{ animationDelay: `${delay}ms` }}
  >
    {children}
  </div>
);

const StatusBadge = ({ status, size = 'md', showIcon = true }) => {
  const config = getStatusConfig(status);
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClasses[size]} ${config.color}`}>
      {showIcon && <span className="text-base">{config.icon}</span>}
      {config.label}
      <span className={`inline-block w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
    </span>
  );
};

// ==================== STATS CARD ====================
const StatsCard = ({ title, value, icon, color, subtitle, trend, onClick, loading = false }) => {
  const trendColor = trend > 0 ? 'text-emerald-600' : trend < 0 ? 'text-rose-600' : 'text-slate-400';
  const trendIcon = trend > 0 ? <FiArrowUp className="w-3 h-3" /> : trend < 0 ? <FiArrowDown className="w-3 h-3" /> : null;

  return (
    <div 
      onClick={onClick}
      className="group relative p-6 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-slate-200 cursor-pointer overflow-hidden"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-5 transition-opacity duration-500 `}></div>
      <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full ${color} opacity-0 group-hover:opacity-10 transition-opacity duration-700 blur-2xl `}></div>
      
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-500 tracking-wide">{title}</p>
            {loading ? (
              <div className="mt-2 h-8 w-24 bg-slate-200 rounded animate-pulse"></div>
            ) : (
              <p className="mt-2 text-2xl font-bold text-slate-800">{value}</p>
            )}
            {subtitle && (
              <p className="mt-1 text-xs text-slate-400 flex items-center gap-1">
                <span className="inline-block w-1 h-1 rounded-full bg-slate-300"></span>
                {subtitle}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-2xl ${color} bg-opacity-10 group-hover:scale-110 transition-transform duration-300`}>
            <div className={`text-${color.split(' ')[0].replace('bg-', '')}`}>
              {icon}
            </div>
          </div>
        </div>
        {trend !== undefined && trend !== null && (
          <div className={`mt-3 flex items-center gap-1 text-xs font-medium ${trendColor}`}>
            {trendIcon}
            <span>{Math.abs(trend)}%</span>
            <span className="text-slate-400 font-normal">vs last period</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== ADVANCED SEARCH BAR ====================
const AdvancedSearchBar = ({ 
  value, onChange, placeholder = "Search...", 
  onFilterToggle, filterCount = 0,
  className = ""
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isExpanded) {
      inputRef.current?.focus();
    }
  }, [isExpanded]);

  // Handle Ctrl+A to select all text - FIXED
  const handleKeyDown = (e) => {
    // Allow native Ctrl+A behavior - don't prevent default
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
      // Native select all will work
      return;
    }
  };

  // Handle click to select all on focus
  const handleFocus = (e) => {
    setIsExpanded(true);
    // Select all text on focus
    e.target.select();
  };

  return (
    <div className={`relative ${className}`}>
      <div className={`
        flex items-center gap-2 transition-all duration-300
        ${isExpanded ? 'bg-white shadow-lg border border-slate-200' : 'bg-slate-50 border border-slate-200'}
        rounded-xl px-4 py-2
      `}>
        <FiSearch className="w-5 h-5 text-slate-400 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={() => setIsExpanded(false)}
          className={`
            bg-transparent outline-none text-slate-700 placeholder-slate-400
            transition-all duration-300
            ${isExpanded ? 'w-64 md:w-96' : 'w-32 md:w-48'}
          `}
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="p-1 rounded-full hover:bg-slate-100 transition-colors"
          >
            <FiX className="w-4 h-4 text-slate-400" />
          </button>
        )}
        <button
          onClick={onFilterToggle}
          className={`
            p-2 rounded-lg transition-all duration-200 relative
            ${filterCount > 0 ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}
          `}
        >
          <FiFilter className="w-4 h-4" />
          {filterCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 text-[10px] font-bold text-white bg-blue-600 rounded-full flex items-center justify-center">
              {filterCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

// ==================== FILTER PANEL ====================
const FilterPanel = ({ 
  isOpen, onClose, filters, onFilterChange, 
  onReset, onApply, className = "" 
}) => {
  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-[999] bg-black/30 backdrop-blur-sm ${className}`}>
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl animate-slideInRight">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <FiSliders className="w-5 h-5 text-slate-600" />
            <h3 className="text-lg font-semibold text-slate-800">Advanced Filters</h3>
            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-600 rounded-full">
              {filters?.activeCount || 0} active
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <FiX className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto h-[calc(100vh-180px)]">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <FiCalendar className="inline mr-2 w-4 h-4" />
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500">From</label>
                  <input
                    type="date"
                    value={filters?.dateFrom || ''}
                    onChange={(e) => onFilterChange('dateFrom', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500">To</label>
                  <input
                    type="date"
                    value={filters?.dateTo || ''}
                    onChange={(e) => onFilterChange('dateTo', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <FiFlag className="inline mr-2 w-4 h-4" />
                Status
              </label>
              <div className="flex flex-wrap gap-2">
                {/* {['All', 'Challan Received', 'Send to Gate', 'Delivered', 'Gate Out', 'Pending', 'Partial', 'Completed'].map((status) => ( */}
                {['All', 'Pending', 'Partial', 'Completed'].map((status) => (
                  <button
                    key={status}
                    onClick={() => onFilterChange('status', status)}
                    className={`
                      px-3 py-1.5 text-xs rounded-full transition-all duration-200
                      ${filters?.status === status || (status === 'All' && !filters?.status)
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}
                    `}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <FiTarget className="inline mr-2 w-4 h-4" />
                Priority
              </label>
              <div className="flex gap-2">
                {['High', 'Medium', 'Low'].map((priority) => (
                  <button
                    key={priority}
                    onClick={() => onFilterChange('priority', priority)}
                    className={`
                      px-4 py-2 text-sm rounded-lg transition-all duration-200 flex-1
                      ${filters?.priority === priority
                        ? `bg-${priority === 'High' ? 'rose' : priority === 'Medium' ? 'amber' : 'emerald'}-600 text-white shadow-md`
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}
                    `}
                  >
                    {priority}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <FiUsers className="inline mr-2 w-4 h-4" />
                Buyer
              </label>
              <select
                value={filters?.buyer || ''}
                onChange={(e) => onFilterChange('buyer', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">All Buyers</option>
                {filters?.buyerOptions?.map((buyer) => (
                  <option key={buyer} value={buyer}>{buyer}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <FiBarChart2 className="inline mr-2 w-4 h-4" />
                Order Value Range
              </label>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-500">Min: ${filters?.minValue || 0}</label>
                  <input
                    type="range"
                    min="0"
                    max="100000"
                    value={filters?.minValue || 0}
                    onChange={(e) => onFilterChange('minValue', Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Max: ${filters?.maxValue || 100000}</label>
                  <input
                    type="range"
                    min="0"
                    max="100000"
                    value={filters?.maxValue || 100000}
                    onChange={(e) => onFilterChange('maxValue', Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-200">
          <div className="flex gap-3">
            <button
              onClick={onReset}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Reset All
            </button>
            <button
              onClick={onApply}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== DELIVERY BREAKDOWN COMPONENT ====================
const DeliveryBreakdown = ({ deliveries, orderData, onChallanClick }) => {
  const [expandedDeliveries, setExpandedDeliveries] = useState({});
  const [viewMode, setViewMode] = useState('list');

  const toggleDeliveryExpand = (id) => {
    setExpandedDeliveries(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  if (!deliveries || deliveries.length === 0) {
    return (
      <div className="p-8 text-center bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border-2 border-dashed border-slate-200">
        <div className="w-16 h-16 mx-auto bg-slate-200 rounded-full flex items-center justify-center">
          <FiTruck className="w-8 h-8 text-slate-400" />
        </div>
        <p className="mt-3 text-sm font-medium text-slate-600">No Deliveries Found</p>
        <p className="text-sm text-slate-400">This order has no delivery records yet</p>
      </div>
    );
  }

  const totalDelivered = deliveries.reduce((sum, d) => sum + (d.qty || 0), 0);
  const totalValue = deliveries.reduce((sum, d) => sum + (d.value || 0), 0);
  const completedCount = deliveries.filter(d => 
    d.status === 'Completed' || d.status === 'Delivered' || d.status === 'Challan Received'
  ).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
          <p className="text-xs text-blue-600 font-medium uppercase tracking-wider">Total Deliveries</p>
          <p className="text-2xl font-bold text-blue-700">{deliveries.length}</p>
        </div>
        <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
          <p className="text-xs text-green-600 font-medium uppercase tracking-wider">Completed</p>
          <p className="text-2xl font-bold text-green-700">{completedCount}</p>
        </div>
        <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
          <p className="text-xs text-orange-600 font-medium uppercase tracking-wider">Total Qty</p>
          <p className="text-2xl font-bold text-orange-700">{totalDelivered.toLocaleString()}</p>
        </div>
        <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
          <p className="text-xs text-purple-600 font-medium uppercase tracking-wider">Total Value</p>
          <p className="text-2xl font-bold text-purple-700">{formatCurrency(totalValue)}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
          {['list', 'grid', 'compact', 'timeline'].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                viewMode === mode 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              {mode === 'list' && <FiList className="inline mr-1" />}
              {mode === 'grid' && <FiGrid className="inline mr-1" />}
              {mode === 'compact' && <FiSliders className="inline mr-1" />}
              {mode === 'timeline' && <FiClock className="inline mr-1" />}
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-400">
          Showing {deliveries.length} deliveries
        </span>
      </div>

      <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
        {deliveries.map((delivery, idx) => {
          const isExpanded = expandedDeliveries[delivery.id || idx];
          const statusConfig = getStatusConfig(delivery.status);
          const progress = delivery.percentage || 0;

          if (viewMode === 'compact') {
            return (
              <div 
                key={delivery.id || idx} 
                className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 hover:shadow-lg transition-all duration-300 hover:border-blue-200 group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${statusConfig.bg}`}>
                    <FiTruck className={`w-5 h-5 ${statusConfig.color.split(' ')[0].replace('text-', 'text-')}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{delivery.challanNo || `Delivery #${idx + 1}`}</p>
                    <p className="text-xs text-slate-400">{formatDate(delivery.date, 'relative')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-slate-700">{delivery.qty}</span>
                  <StatusBadge status={delivery.status} size="sm" />
                </div>
              </div>
            );
          }

          if (viewMode === 'timeline') {
            return (
              <div key={delivery.id || idx} className="relative pl-8 pb-8 last:pb-0">
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-400 to-green-400"></div>
                <div className={`absolute left-0 top-1 w-4 h-4 rounded-full border-2 border-white shadow-lg ${statusConfig.dot}`}></div>
                <div className="p-4 bg-white rounded-xl border border-slate-200 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-slate-700">{delivery.challanNo}</span>
                      <StatusBadge status={delivery.status} size="sm" />
                    </div>
                    <span className="text-xs text-slate-400">{formatDate(delivery.date)}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-3">
                    <div>
                      <p className="text-xs text-slate-400">Quantity</p>
                      <p className="text-sm font-semibold text-slate-700">{delivery.qty}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Value</p>
                      <p className="text-sm font-semibold text-slate-700">{formatCurrency(delivery.value)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Progress</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-200 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full transition-all duration-1000 ${
                              progress >= 100 ? 'bg-green-500' : 
                              progress >= 50 ? 'bg-orange-500' : 
                              'bg-blue-500'
                            }`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-slate-500">{progress}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div 
              key={delivery.id || idx} 
              className={`
                p-5 bg-white rounded-xl border-2 transition-all duration-300 cursor-pointer hover:shadow-xl
                ${statusConfig.border}
                ${statusConfig.bg}
                ${isExpanded ? 'shadow-lg border-blue-300' : 'hover:border-blue-200'}
              `}
              onClick={() => toggleDeliveryExpand(delivery.id || idx)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${statusConfig.bg} border ${statusConfig.border}`}>
                      <FiTruck className={`w-4 h-4 ${statusConfig.color.split(' ')[0].replace('text-', 'text-')}`} />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{delivery.challanNo || `Delivery #${idx + 1}`}</p>
                      <p className="text-xs text-slate-400">{formatDate(delivery.date)}</p>
                    </div>
                  </div>
                </div>
                <StatusBadge status={delivery.status} size="md" />
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4 md:grid-cols-4">
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Quantity</p>
                  <p className="text-lg font-bold text-slate-700">{delivery.qty} <span className="text-sm font-normal text-slate-400">{delivery.unit || ''}</span></p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Value</p>
                  <p className="text-lg font-bold text-slate-700">{formatCurrency(delivery.value)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Progress</p>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex-1 bg-slate-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-1000 ${
                          progress >= 100 ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 
                          progress >= 50 ? 'bg-gradient-to-r from-orange-400 to-amber-500' : 
                          'bg-gradient-to-r from-blue-400 to-indigo-500'
                        }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-slate-600 min-w-[45px] text-right">{progress}%</span>
                  </div>
                </div>
              </div>

              {isExpanded && delivery.items && delivery.items.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-200 animate-fadeIn">
                  <p className="text-xs font-medium text-slate-600 mb-3 uppercase tracking-wider">Items in this delivery</p>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                    {delivery.items.map((item, itemIdx) => (
                      <div key={itemIdx} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-100">
                        <span className="text-sm text-slate-600 truncate">{item.item}</span>
                        <span className="text-sm font-medium text-slate-700">{item.qty}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-3 text-xs text-center text-slate-400">
                {delivery.items && delivery.items.length > 0 ? (
                  <span className="flex items-center justify-center gap-1">
                    {isExpanded ? <FiChevronUp className="w-3 h-3" /> : <FiChevronDown className="w-3 h-3" />}
                    {isExpanded ? 'Hide items' : `Show ${delivery.items.length} items`}
                  </span>
                ) : (
                  'No items listed'
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ==================== ORDER DETAIL MODAL ====================
const OrderDetailModal = ({ order, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const shareRef = useRef(null);

  useOutsideClick(shareRef, setShowShareMenu);

  if (!isOpen || !order) return null;

  const orderData = order;
  const totalQty = Number(orderData.BreakDownQTY || orderData.TotalQty || 0);
  const deliveredQty = Number(orderData.challanqty || orderData.ChallanQTY || 0);
  const balanceQty = totalQty - deliveredQty;
  const deliveryPercent = totalQty > 0 ? ((deliveredQty / totalQty) * 100).toFixed(1) : 0;
  
  const orderNumber = orderData.WorkOrderNo || "N/A";
  const orderDate = orderData.OrderReceiveDate || "";
  const customerName = orderData.CustomerName || "N/A";
  const piNumber = orderData.PINO || "N/A";
  const category = orderData.Category || orderData.Section || "N/A";
  const deliveryAddress = orderData.DeliveryToAddress || "N/A";
  const buyer = orderData.Buyer || orderData.BuyerName || "N/A";
  const unit = orderData.Unit || "N/A";

  const deliveries = useMemo(() => {
    const challanList = orderData.ChallanNo || [];
    const breakdownItems = orderData.breakdownItems || [];
    
    if (!Array.isArray(challanList) || challanList.length === 0) {
      return [];
    }
    
    return challanList.map((ch, idx) => {
      const deliveryItems = breakdownItems.slice(idx * 2, idx * 2 + 2).map(item => ({
        ...item,
        qty: Math.round(item.qty / challanList.length)
      }));
      
      return {
        id: idx + 1,
        challanNo: ch.challanNo || ch,
        date: orderData.OrderReceiveDate || new Date().toISOString(),
        qty: Math.round(totalQty / challanList.length),
        value: Math.round((orderData.TotalValue || 0) / challanList.length * 100) / 100,
        status: ch.status || "Pending",
        percentage: ((idx + 1) / challanList.length) * 100,
        items: deliveryItems,
        unit: unit,
        buyer: buyer,
        customer: customerName,
        deliveryAddress: deliveryAddress
      };
    });
  }, [orderData, totalQty, buyer, customerName, deliveryAddress, unit]);

  const pieData = [
    { name: 'Delivered', value: deliveredQty, color: '#22c55e' },
    { name: 'Pending', value: balanceQty, color: '#94a3b8' }
  ];

  const timelineData = deliveries.map((d, idx) => ({
    name: `Delivery ${idx + 1}`,
    value: d.qty,
    status: d.status,
    date: d.date
  }));

  const shareOptions = [
    { icon: <FiMail className="w-4 h-4" />, label: 'Email', color: 'text-blue-600' },
    { icon: <FaWhatsapp className="w-4 h-4" />, label: 'WhatsApp', color: 'text-green-600' },
    { icon: <FaTelegram className="w-4 h-4" />, label: 'Telegram', color: 'text-sky-600' },
    { icon: <FiLinkedin className="w-4 h-4" />, label: 'LinkedIn', color: 'text-blue-700' },
    { icon: <FiTwitter className="w-4 h-4" />, label: 'Twitter', color: 'text-sky-500' },
  ];

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className={`fixed inset-0 z-[9999] overflow-y-auto ${isFullscreen ? 'fullscreen-modal' : ''}`}>
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-slate-900 bg-opacity-50 backdrop-blur-sm" onClick={onClose}></div>

        <div className={`inline-block w-full ${isFullscreen ? 'max-w-full' : 'max-w-7xl'} my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl relative z-[10000]`}>
          <div className="relative px-6 py-5 bg-gradient-to-r from-blue-600 to-indigo-700">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
            
            <div className="relative flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-white/20 rounded-xl">
                  <FiFileText className="text-white text-2xl" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Order Details</h3>
                  <p className="text-sm text-blue-100 opacity-80">#{orderNumber}</p>
                </div>
                <button 
                  onClick={() => setIsFavorite(!isFavorite)}
                  className="p-2 text-white/80 transition-all hover:text-yellow-300 hover:scale-110"
                >
                  {isFavorite ? <FaStar className="w-5 h-5 text-yellow-400" /> : <FaRegStar className="w-5 h-5" />}
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="relative" ref={shareRef}>
                  <button
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    className="p-2 text-white/80 transition-colors rounded-lg hover:bg-white/20 hover:text-white"
                  >
                    <FiShare2 className="w-5 h-5" />
                  </button>
                  {showShareMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-10 animate-fadeIn">
                      {shareOptions.map((option, idx) => (
                        <button
                          key={idx}
                          className={`w-full px-4 py-2 text-sm text-left hover:bg-slate-50 transition-colors flex items-center gap-3 ${option.color}`}
                        >
                          {option.icon}
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-2 text-white/80 transition-colors rounded-lg hover:bg-white/20 hover:text-white"
                >
                  {isFullscreen ? <FiMinimize2 className="w-5 h-5" /> : <FiMaximize2 className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => handleCopy(orderNumber)}
                  className="p-2 text-white/80 transition-colors rounded-lg hover:bg-white/20 hover:text-white relative"
                >
                  <FiCopy className="w-5 h-5" />
                  {copySuccess && (
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 text-xs bg-green-600 text-white rounded whitespace-nowrap">
                      Copied!
                    </span>
                  )}
                </button>
                <button
                  onClick={onClose}
                  className="p-2 text-white/80 transition-colors rounded-lg hover:bg-white/20 hover:text-white"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="relative flex flex-wrap gap-4 mt-4 text-sm text-blue-100">
              <div className="flex items-center gap-2">
                <FiCalendar className="w-4 h-4" />
                <span>{formatDate(orderDate)}</span>
              </div>
              <div className="flex items-center gap-2">
                <FiUser className="w-4 h-4" />
                <span>{customerName}</span>
              </div>
              <div className="flex items-center gap-2">
                <FiTag className="w-4 h-4" />
                <span>{category}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${deliveryPercent >= 100 ? 'bg-green-400' : deliveryPercent > 0 ? 'bg-orange-400' : 'bg-slate-400'}`}></div>
                <span>{deliveryPercent >= 100 ? 'Completed' : deliveryPercent > 0 ? 'In Progress' : 'Pending'}</span>
              </div>
            </div>
          </div>

          <div className="px-6 pt-4 border-b border-slate-200 bg-slate-50/50">
            <div className="flex flex-wrap gap-1">
              {[
                { id: 'overview', label: 'Overview', icon: <FiInfo className="w-4 h-4" /> },
                { id: 'deliveries', label: 'Deliveries', icon: <FiTruck className="w-4 h-4" />, count: deliveries.length },
                { id: 'breakdown', label: 'Breakdown', icon: <FiLayers className="w-4 h-4" /> },
                { id: 'buyer-info', label: 'Buyer Info', icon: <FiUsers className="w-4 h-4" /> },
                { id: 'analytics', label: 'Analytics', icon: <FiPieChart className="w-4 h-4" /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all duration-200
                    ${activeTab === tab.id
                      ? 'text-blue-600 bg-white border-b-2 border-blue-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}
                  `}
                >
                  {tab.icon}
                  {tab.label}
                  {tab.count > 0 && (
                    <span className="ml-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-600 rounded-full">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <StatsCard
                    title="Total Quantity"
                    value={`${formatNumber(totalQty)} ${unit}`}
                    icon={<FiBox className="w-6 h-6" />}
                    color="from-blue-500 to-blue-600"
                    subtitle="Ordered"
                  />
                  <StatsCard
                    title="Delivered"
                    value={formatNumber(deliveredQty)}
                    icon={<FiCheckCircle className="w-6 h-6" />}
                    color="from-green-500 to-emerald-600"
                    subtitle={`${deliveryPercent}% complete`}
                  />
                  <StatsCard
                    title="Pending"
                    value={formatNumber(balanceQty)}
                    icon={<FiClock className="w-6 h-6" />}
                    color="from-orange-500 to-amber-600"
                    subtitle={`${deliveries.length} deliveries`}
                  />
                  <StatsCard
                    title="Total Value"
                    value={formatCurrency(orderData.TotalValue || 0)}
                    icon={<FiDollarSign className="w-6 h-6" />}
                    color="from-purple-500 to-violet-600"
                    subtitle={formatCurrency(orderData.ChallanValue || 0) + ' delivered'}
                  />
                </div>

                <div className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-indigo-100 rounded-xl">
                      <FiUsers className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-indigo-700">Buyer Information</p>
                      <div className="grid grid-cols-2 gap-4 mt-3 md:grid-cols-4">
                        <div>
                          <p className="text-xs text-indigo-500 font-medium uppercase tracking-wider">Buyer</p>
                          <p className="text-sm font-semibold text-indigo-700">{buyer}</p>
                        </div>
                        <div>
                          <p className="text-xs text-indigo-500 font-medium uppercase tracking-wider">Customer</p>
                          <p className="text-sm font-semibold text-indigo-700">{customerName}</p>
                        </div>
                        <div>
                          <p className="text-xs text-indigo-500 font-medium uppercase tracking-wider">PI Number</p>
                          <p className="text-sm font-semibold text-indigo-700">{piNumber || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-indigo-500 font-medium uppercase tracking-wider">Category</p>
                          <p className="text-sm font-semibold text-indigo-700">{category}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <div className="md:col-span-2 p-6 bg-slate-50 rounded-2xl border border-slate-200">
                    <p className="text-sm font-semibold text-slate-700">Overall Progress</p>
                    <div className="mt-4">
                      <div className="flex justify-between text-sm text-slate-500 mb-1">
                        <span>Progress</span>
                        <span className="font-medium text-slate-700">{deliveryPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 bg-gradient-to-r ${
                            deliveryPercent >= 100 ? 'from-green-400 to-emerald-500' : 
                            deliveryPercent >= 50 ? 'from-orange-400 to-amber-500' : 
                            'from-blue-400 to-indigo-500'
                          }`}
                          style={{ width: `${Math.min(Number(deliveryPercent), 100)}%` }}
                        >
                          <div className="h-full w-full bg-gradient-to-r from-transparent to-white/20 animate-pulse"></div>
                        </div>
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-slate-400">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 bg-white rounded-2xl border border-slate-200">
                    <p className="text-sm font-semibold text-slate-700">Distribution</p>
                    <div className="h-40 mt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={30}
                            outerRadius={55}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value) => formatNumber(value)}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {deliveries.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-3">Recent Deliveries</h4>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      {deliveries.slice(0, 3).map((delivery, idx) => (
                        <div key={idx} className="p-4 bg-white rounded-xl border border-slate-200 hover:shadow-lg transition-all duration-300 hover:border-blue-200">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-700">Delivery #{idx + 1}</span>
                            <StatusBadge status={delivery.status} size="sm" />
                          </div>
                          <p className="text-lg font-bold text-slate-800 mt-1">{delivery.qty}</p>
                          <p className="text-xs text-slate-400">{delivery.challanNo}</p>
                          <div className="mt-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-slate-200 rounded-full h-1.5">
                                <div 
                                  className={`h-1.5 rounded-full transition-all duration-1000 ${
                                    delivery.percentage >= 100 ? 'bg-green-500' : 
                                    delivery.percentage >= 50 ? 'bg-orange-500' : 
                                    'bg-blue-500'
                                  }`}
                                  style={{ width: `${delivery.percentage || 0}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-slate-500">{delivery.percentage || 0}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'deliveries' && (
              <DeliveryBreakdown 
                deliveries={deliveries} 
                orderData={orderData}
                onChallanClick={(challan) => console.log('Challan clicked:', challan)}
              />
            )}

            {activeTab === 'breakdown' && (
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-xs font-semibold text-left text-slate-600 uppercase tracking-wider">Item</th>
                        <th className="px-4 py-3 text-xs font-semibold text-right text-slate-600 uppercase tracking-wider">Order Qty</th>
                        <th className="px-4 py-3 text-xs font-semibold text-right text-slate-600 uppercase tracking-wider">Delivered</th>
                        <th className="px-4 py-3 text-xs font-semibold text-right text-slate-600 uppercase tracking-wider">Balance</th>
                        <th className="px-4 py-3 text-xs font-semibold text-center text-slate-600 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-xs font-semibold text-center text-slate-600 uppercase tracking-wider">Delivery</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(orderData.breakdownItems || []).map((item, idx) => {
                        const itemBalance = item.qty - item.delivered;
                        const assignedDelivery = deliveries.find((_, dIdx) => dIdx === idx % deliveries.length);
                        return (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 text-sm text-slate-700">{item.item}</td>
                            <td className="px-4 py-3 text-sm text-right text-slate-600">{item.qty}</td>
                            <td className="px-4 py-3 text-sm text-right text-emerald-600">{item.delivered}</td>
                            <td className="px-4 py-3 text-sm text-right text-rose-600">{itemBalance}</td>
                            <td className="px-4 py-3 text-center">
                              <StatusBadge status={item.status} size="sm" />
                            </td>
                            <td className="px-4 py-3 text-center">
                              {assignedDelivery ? (
                                <span className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer">
                                  <FiTruck className="inline mr-1" />
                                  {assignedDelivery.challanNo}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400">Not assigned</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 font-semibold border-t-2 border-blue-200">
                        <td className="px-4 py-3 text-sm text-blue-700">Total</td>
                        <td className="px-4 py-3 text-sm text-right text-blue-700">{totalQty}</td>
                        <td className="px-4 py-3 text-sm text-right text-emerald-700">{deliveredQty}</td>
                        <td className="px-4 py-3 text-sm text-right text-rose-700">{balanceQty}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {deliveryPercent}% Complete
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-xs text-blue-600">
                          {deliveries.length} Delivery{deliveries.length > 1 ? 's' : ''}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'buyer-info' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-blue-100 rounded-xl">
                        <FiUser className="w-5 h-5 text-blue-600" />
                      </div>
                      <h4 className="text-sm font-semibold text-blue-700">Buyer Details</h4>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Buyer Name</p>
                        <p className="text-sm font-semibold text-slate-800">{buyer}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Customer</p>
                        <p className="text-sm font-semibold text-slate-800">{customerName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">PI Number</p>
                        <p className="text-sm font-semibold text-slate-800">{piNumber || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-green-100 rounded-xl">
                        <FiMapPin className="w-5 h-5 text-green-600" />
                      </div>
                      <h4 className="text-sm font-semibold text-green-700">Delivery Information</h4>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Delivery Address</p>
                        <p className="text-sm font-semibold text-slate-800">{deliveryAddress}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Deliveries</p>
                        <p className="text-sm font-semibold text-slate-800">{deliveries.length}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Category</p>
                        <p className="text-sm font-semibold text-slate-800">{category}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                  <h4 className="text-sm font-semibold text-slate-700 mb-4">Delivery Timeline</h4>
                  <div className="relative pl-8 space-y-4">
                    <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-400 to-green-400"></div>
                    {deliveries.map((delivery, idx) => {
                      const statusConfig = getStatusConfig(delivery.status);
                      return (
                        <div key={idx} className="relative animate-fadeIn" style={{ animationDelay: `${idx * 100}ms` }}>
                          <div className={`absolute -left-6 w-4 h-4 rounded-full border-2 border-white shadow-lg ${statusConfig.dot}`}></div>
                          <div className="p-4 bg-white rounded-xl border border-slate-200 hover:shadow-lg transition-all duration-300">
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-slate-700">{delivery.challanNo}</span>
                              <StatusBadge status={delivery.status} size="sm" />
                            </div>
                            <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                              <div>
                                <span className="text-slate-400">Qty:</span>
                                <span className="ml-1 font-medium text-slate-700">{delivery.qty}</span>
                              </div>
                              <div>
                                <span className="text-slate-400">Value:</span>
                                <span className="ml-1 font-medium text-slate-700">{formatCurrency(delivery.value)}</span>
                              </div>
                              <div>
                                <span className="text-slate-400">Date:</span>
                                <span className="ml-1 font-medium text-slate-700">{formatDate(delivery.date)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="p-6 bg-white rounded-2xl border border-slate-200">
                    <h4 className="text-sm font-semibold text-slate-700 mb-4">Delivery Progress</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={timelineData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                          <YAxis stroke="#94a3b8" fontSize={12} />
                          <Tooltip 
                            formatter={(value) => formatNumber(value)}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          />
                          <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                            {timelineData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.status === 'Completed' || entry.status === 'Delivered' ? '#22c55e' : '#f59e0b'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="p-6 bg-white rounded-2xl border border-slate-200">
                    <h4 className="text-sm font-semibold text-slate-700 mb-4">Status Distribution</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={60}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value) => formatNumber(value)}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                    <p className="text-xs text-blue-600 font-medium uppercase tracking-wider">Completion Rate</p>
                    <p className="text-2xl font-bold text-blue-700">{deliveryPercent}%</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                    <p className="text-xs text-green-600 font-medium uppercase tracking-wider">Avg. Delivery Time</p>
                    <p className="text-2xl font-bold text-green-700">2.4 days</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                    <p className="text-xs text-purple-600 font-medium uppercase tracking-wider">Items Per Delivery</p>
                    <p className="text-2xl font-bold text-purple-700">{deliveries.length > 0 ? Math.round(totalQty / deliveries.length) : 0}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                    <p className="text-xs text-orange-600 font-medium uppercase tracking-wider">Total Deliveries</p>
                    <p className="text-2xl font-bold text-orange-700">{deliveries.length}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <span className={`inline-block w-2 h-2 rounded-full ${
                    deliveryPercent >= 100 ? 'bg-green-500' : 
                    deliveryPercent > 0 ? 'bg-orange-500' : 
                    'bg-slate-500'
                  }`}></span>
                  <span>{deliveryPercent >= 100 ? 'Completed' : deliveryPercent > 0 ? 'In Progress' : 'Pending'}</span>
                </div>
                <span className="text-slate-300">|</span>
                <span>{deliveries.length} deliveries</span>
                <span className="text-slate-300">|</span>
                <span>Buyer: {buyer}</span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all duration-200"
                >
                  <FiPrinter className="w-4 h-4" />
                  Print
                </button>
                <button
                  onClick={onClose}
                  className="flex items-center gap-2 px-6 py-2 text-white bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl hover:from-blue-700 hover:to-indigo-800 transition-all duration-200 shadow-lg shadow-blue-600/20"
                >
                  <FiX className="w-4 h-4" />
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================
function OrderReport() {
  const { cndata, loading: contextLoading, apiKey } = useContext(GetDataContext);
  // const { cndata, loading, apiKey } = useContext(GetDataContext);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedPI, setSelectedPI] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState([]);
  const [piSearch, setPiSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [piOpen, setPiOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const [viewMode, setViewMode] = useLocalStorage('orderReportViewMode', 'detail');
  const [sortOrder, setSortOrder] = useLocalStorage('orderReportSortOrder', 'desc');
  const [selectedOrderForModal, setSelectedOrderForModal] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [expandedRows, setExpandedRows] = useState({});
  const [showDeliveryBreakdown, setShowDeliveryBreakdown] = useState({});
  const [theme, setTheme] = useLocalStorage('orderReportTheme', 'light');
  const [layoutMode, setLayoutMode] = useLocalStorage('orderReportLayout', 'modern');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [selectedBuyer, setSelectedBuyer] = useState('All');
  const [minValue, setMinValue] = useState(0);
  const [maxValue, setMaxValue] = useState(100000);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedColumns, setSelectedColumns] = useLocalStorage('orderReportColumns', [
    'sl', 'orderNo', 'date', 'category', 'customer', 'buyer', 'pi', 
    'orderQty', 'deliveryQty', 'progress', 'deliveries', 'value', 'actions'
  ]);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef(null);

  const piRef = useRef(null);
  const orderRef = useRef(null);
  const itemsPerPage = 20;

  useOutsideClick(piRef, setPiOpen);
  useOutsideClick(orderRef, setOrderOpen);
  useOutsideClick(sortDropdownRef, () => setSortDropdownOpen(false));

  const debouncedSearch = useDebounce(search, 300);
  const debouncedPiSearch = useDebounce(piSearch, 300);
  const debouncedOrderSearch = useDebounce(orderSearch, 300);

  const getData = useCallback(() => {
    if (!cndata) return [];
    
    if (cndata.apiData && Array.isArray(cndata.apiData)) {
      return cndata.apiData;
    }
    
    if (cndata.groupedData && Array.isArray(cndata.groupedData)) {
      return cndata.groupedData;
    }
    
    if (Array.isArray(cndata)) {
      if (cndata[0]?.apiData) return cndata[0].apiData;
      if (cndata[0]?.groupedData) return cndata[0].groupedData;
      if (cndata[0]?.WorkOrderNo) return cndata;
    }
    
    if (cndata?.WorkOrderNo) return [cndata];
    
    return [];
  }, [cndata]);

  const rawData = getData();

  // Process and group data
  const processedData = useMemo(() => {
    if (!rawData || rawData.length === 0) return [];

    const grouped = {};
    rawData.forEach((item) => {
      const key = item.WorkOrderNo;
      if (!grouped[key]) {
        grouped[key] = {
          WorkOrderNo: key,
          OrderReceiveDate: item.OrderReceiveDate,
          CustomerName: item.CName || item.CustomerName,
          PINO: item.CustomerPINo || item.PINO,
          Category: item.ProductCategoryName || item.Category || item.Section,
          Section: item.ProductCategoryName || item.Section,
          BuyerName: item.BuyerName || item.Buyer,
          Buyer: item.BuyerName || item.Buyer,
          DeliveryToAddress: item.DeliveryToAddress,
          BreakDownQTY: 0,
          challanqty: 0,
          TotalQty: 0,
          ChallanQTY: 0,
          ChallanNo: new Set(),
          TotalValue: 0,
          ChallanValue: 0,
          BalanceValue: 0,
          Unit: item.Unit,
          DeliverName: item.FName || item.DeliverName,
          breakdownItems: [],
          deliveries: [],
          challanDates: [],
          status: "Pending",
          priority: "Medium",
          rawItems: []
        };
      }
      const row = grouped[key];
      row.BreakDownQTY += Number(item.BreakDownQTY) || 0;
      row.challanqty += Number(item.ChallanQTY) || 0;
      row.TotalQty += Number(item.BreakDownQTY) || 0;
      row.ChallanQTY += Number(item.ChallanQTY) || 0;
      row.TotalValue += Number(item.TotalOrderValue) || 0;
      row.ChallanValue += Number(item.ChallanValue) || 0;
      row.BalanceValue += Number(item.BalanceValue) || 0;
      
      row.rawItems.push(item);
      
      row.breakdownItems.push({
        id: item.ID || Math.random(),
        item: item.ItemDescription || item.ProductCategoryName || "Item",
        qty: Number(item.BreakDownQTY) || 0,
        delivered: Number(item.ChallanQTY) || 0,
        status: Number(item.ChallanQTY) > 0 ? 
          (Number(item.ChallanQTY) >= Number(item.BreakDownQTY) ? "Completed" : "Partial") : 
          "Pending",
        unit: item.Unit || "PC",
        challanNo: item.ChallanNo || null,
        challanStatus: item.ChallanStatus || null
      });

      if (item.ChallanNo) {
        const challans = item.ChallanNo.split(",")
          .map(c => c.trim())
          .filter(Boolean);
        challans.forEach(cn => {
          row.ChallanNo.add(cn);
          const challanStatus = item.ChallanStatus || item.Status || 
            (Number(item.ChallanQTY) > 0 ? 
              (Number(item.ChallanQTY) >= Number(item.BreakDownQTY) ? "Completed" : "Partial") : 
              "Pending");
          // Check if delivery already exists for this challan
          const existingDelivery = row.deliveries.find(d => d.challanNo === cn);
          if (!existingDelivery) {
            row.deliveries.push({
              challanNo: cn,
              date: item.ChallanDate || item.OrderReceiveDate,
              qty: Number(item.ChallanQTY) || 0,
              value: Number(item.ChallanValue) || 0,
              status: challanStatus,
              percentage: Number(item.ChallanQTY) > 0 ? 
                (Number(item.ChallanQTY) / Number(item.BreakDownQTY || 1) * 100) : 0
            });
          }
          if (item.ChallanDate) {
            row.challanDates.push(item.ChallanDate);
          }
        });
      }

      // Determine overall status
      if (row.deliveries.length > 0) {
        const allCompleted = row.deliveries.every(d => 
          d.status === 'Completed' || d.status === 'Delivered' || d.status === 'Challan Received'
        );
        const anyDelivered = row.deliveries.some(d => 
          d.status === 'Completed' || d.status === 'Delivered' || d.status === 'Challan Received'
        );
        row.status = allCompleted ? 'Completed' : anyDelivered ? 'Partial' : 'Pending';
      }
    });

    return Object.values(grouped).map((item) => ({
      ...item,
      ChallanNo: Array.from(item.ChallanNo).map(cn => ({ 
        challanNo: cn, 
        status: item.deliveries.find(d => d.challanNo === cn)?.status || "Pending" 
      })),
      deliveryPercent: item.BreakDownQTY 
        ? ((item.challanqty || 0) / item.BreakDownQTY * 100).toFixed(1)
        : 0,
      deliveryCount: item.deliveries.length,
      buyer: item.Buyer,
      customerName: item.CustomerName
    }));
  }, [rawData]);

  // Sort data: newest to oldest by default
  const sortedData = useMemo(() => {
    if (!processedData || processedData.length === 0) return [];
    
    return [...processedData].sort((a, b) => {
      const dateA = new Date(a.OrderReceiveDate);
      const dateB = new Date(b.OrderReceiveDate);
      
      if (sortOrder === 'asc') {
        return dateA - dateB;
      } else {
        return dateB - dateA;
      }
    });
  }, [processedData, sortOrder]);

  // Calculate comparison trends
  const comparisonData = useMemo(() => {
    if (!sortedData || sortedData.length === 0) {
      return { current: {}, previous: {}, trend: 0 };
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Get current period (last 3 months)
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(now.getMonth() - 3);
    
    // Get previous period (last 3 months before that)
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(now.getMonth() - 6);
    
    const currentPeriod = sortedData.filter(item => {
      const date = new Date(item.OrderReceiveDate);
      return date >= threeMonthsAgo && date <= now;
    });
    
    const previousPeriod = sortedData.filter(item => {
      const date = new Date(item.OrderReceiveDate);
      return date >= sixMonthsAgo && date < threeMonthsAgo;
    });
    
    const currentTotal = currentPeriod.reduce((sum, item) => sum + (item.TotalValue || 0), 0);
    const previousTotal = previousPeriod.reduce((sum, item) => sum + (item.TotalValue || 0), 0);
    
    const trend = previousTotal > 0 
      ? ((currentTotal - previousTotal) / previousTotal * 100) 
      : currentTotal > 0 ? 100 : 0;
    
    return {
      current: {
        orders: currentPeriod.length,
        value: currentTotal,
        qty: currentPeriod.reduce((sum, item) => sum + (item.BreakDownQTY || 0), 0)
      },
      previous: {
        orders: previousPeriod.length,
        value: previousTotal,
        qty: previousPeriod.reduce((sum, item) => sum + (item.BreakDownQTY || 0), 0)
      },
      trend: Math.round(trend * 10) / 10
    };
  }, [sortedData]);

  const uniquePI = useMemo(() => {
    if (!processedData || processedData.length === 0) return [];
    return [...new Set(processedData.map((d) => d.PINO).filter(Boolean))];
  }, [processedData]);

  const uniqueOrder = useMemo(() => {
    if (!processedData || processedData.length === 0) return [];
    return [...new Set(processedData.map((d) => d.WorkOrderNo).filter(Boolean))];
  }, [processedData]);

  const uniqueBuyer = useMemo(() => {
    if (!processedData || processedData.length === 0) return [];
    return [...new Set(processedData.map((d) => d.buyer || d.Buyer).filter(Boolean))];
  }, [processedData]);

  // Filter data
  const filteredData = useMemo(() => {
    if (!sortedData || sortedData.length === 0) return [];

    return sortedData
      .filter((item) => {
        const searchMatch = !debouncedSearch ||
          (item.WorkOrderNo && item.WorkOrderNo.toString().includes(debouncedSearch)) ||
          (item.CustomerName && item.CustomerName.toLowerCase().includes(debouncedSearch.toLowerCase())) ||
          (item.DeliverName && item.DeliverName.toLowerCase().includes(debouncedSearch.toLowerCase())) ||
          (item.PINO && item.PINO.toLowerCase().includes(debouncedSearch.toLowerCase())) ||
          (item.Buyer && item.Buyer.toLowerCase().includes(debouncedSearch.toLowerCase())) ||
          (item.buyer && item.buyer.toLowerCase().includes(debouncedSearch.toLowerCase()));

        const piMatch = selectedPI.length === 0 || (item.PINO && selectedPI.includes(item.PINO));
        const orderMatch = selectedOrder.length === 0 || (item.WorkOrderNo && selectedOrder.includes(item.WorkOrderNo));
        const statusMatch = selectedStatus === 'All' || item.status === selectedStatus;
        const buyerMatch = selectedBuyer === 'All' || item.buyer === selectedBuyer || item.Buyer === selectedBuyer;
        
        const valueMatch = (item.TotalValue || 0) >= minValue && (item.TotalValue || 0) <= maxValue;

        let dateMatch = true;
        if (dateRange.start && item.OrderReceiveDate) {
          const orderDate = new Date(item.OrderReceiveDate);
          const startDate = new Date(dateRange.start);
          if (orderDate < startDate) dateMatch = false;
        }
        if (dateRange.end && item.OrderReceiveDate) {
          const orderDate = new Date(item.OrderReceiveDate);
          const endDate = new Date(dateRange.end);
          if (orderDate > endDate) dateMatch = false;
        }

        return searchMatch && piMatch && orderMatch && statusMatch && buyerMatch && valueMatch && dateMatch;
      });
  }, [sortedData, debouncedSearch, selectedPI, selectedOrder, selectedStatus, selectedBuyer, minValue, maxValue, dateRange]);

  const grandTotal = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return { TotalQty: 0, ChallanQTY: 0, BalanceQty: 0, TotalValue: 0, ChallanValue: 0, BalanceValue: 0 };
    }

    return filteredData.reduce((acc, item) => {
      acc.TotalQty += Number(item.BreakDownQTY || item.TotalQty || 0);
      acc.ChallanQTY += Number(item.challanqty || item.ChallanQTY || 0);
      acc.BalanceQty = acc.TotalQty - acc.ChallanQTY;
      acc.TotalValue += Number(item.TotalValue || 0);
      acc.ChallanValue += Number(item.ChallanValue || 0);
      acc.BalanceValue = acc.TotalValue - acc.ChallanValue;
      return acc;
    }, { TotalQty: 0, ChallanQTY: 0, BalanceQty: 0, TotalValue: 0, ChallanValue: 0, BalanceValue: 0 });
  }, [filteredData]);

  const pageCount = Math.ceil((filteredData?.length || 0) / itemsPerPage);
  const displayedData = (filteredData || []).slice(
    currentPage * itemsPerPage,
    currentPage * itemsPerPage + itemsPerPage
  );

// ==================== EXPORT TO EXCEL - FIXED ====================
const exportToExcel = useCallback(() => {
  try {
    const dataToExport = filteredData;
    
    if (!dataToExport || dataToExport.length === 0) {
      alert("No data to export!");
      return;
    }
    
    const exportData = dataToExport.map((item, index) => ({
      "SL": index + 1,
      "Order No": item.WorkOrderNo || "",
      "Order Date": formatDate(item.OrderReceiveDate),
      "Customer": item.CustomerName || "",
      "Buyer": item.buyer || item.Buyer || "",
      "Category": item.Category || item.Section || "",
      "PI No": item.PINO || "",
      "Order Qty": item.BreakDownQTY || item.TotalQty || 0,
      "Delivery Qty": item.challanqty || item.ChallanQTY || 0,
      "Balance Qty": (item.BreakDownQTY || item.TotalQty || 0) - (item.challanqty || item.ChallanQTY || 0),
      "Delivery %": item.deliveryPercent ? `${item.deliveryPercent}%` : 
        (item.TotalQty ? ((item.ChallanQTY || 0) / (item.TotalQty || 0) * 100).toFixed(1) + "%" : "0%"),
      "Order Value": formatCurrency(item.TotalValue || 0),
      "Delivery Value": formatCurrency(item.ChallanValue || 0),
      "Deliveries": item.deliveryCount || 0,
      "Status": item.status || (item.deliveryPercent >= 100 ? "Completed" : 
                item.deliveryPercent > 0 ? "Partial" : "Pending")
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 8 }, { wch: 20 }, { wch: 15 }, { wch: 25 }, 
      { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, 
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 18 }, 
      { wch: 18 }, { wch: 15 }, { wch: 18 }
    ];

    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:O1');
    
    // Add title with merged columns
    const titleCell = XLSX.utils.encode_cell({ r: 0, c: 0 });
    ws[titleCell] = { 
      v: "Order Report", 
      t: "s",
      s: {
        font: { sz: 26, bold: true, color: { rgb: "1a56db" } },
        alignment: { horizontal: "center", vertical: "center" },
        fill: { fgColor: { rgb: "e0e7ff" } }
      }
    };

    // Merge first 2 columns for title
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];

    // Subtitle
    const subtitleCell = XLSX.utils.encode_cell({ r: 1, c: 0 });
    ws[subtitleCell] = {
      v: `Generated: ${new Date().toLocaleString()}`,
      t: "s",
      s: {
        font: { sz: 14, color: { rgb: "6b7280" } },
        alignment: { horizontal: "center", vertical: "center" }
      }
    };

    // Headers - Font size: 22
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellRef = XLSX.utils.encode_cell({ r: 2, c });
      if (!ws[cellRef]) continue;
      ws[cellRef].s = {
        font: { sz: 22, bold: true, color: { rgb: "ffffff" } },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        fill: { fgColor: { rgb: "1e40af" } },
        border: {
          top: { style: "thin", color: { rgb: "d1d5db" } },
          bottom: { style: "thin", color: { rgb: "d1d5db" } },
          left: { style: "thin", color: { rgb: "d1d5db" } },
          right: { style: "thin", color: { rgb: "d1d5db" } }
        }
      };
    }

    // Data rows - Font size: 18
    const dataStartRow = 3;
    const dataEndRow = dataStartRow + exportData.length - 1;
    
    for (let r = dataStartRow; r <= dataEndRow; r++) {
      for (let c = range.s.c; c <= range.e.c; c++) {
        const cellRef = XLSX.utils.encode_cell({ r, c });
        if (!ws[cellRef]) continue;
        
        const isTextColumn = c <= 6;
        ws[cellRef].s = {
          font: { sz: 18 },
          alignment: { 
            vertical: "center",
            horizontal: isTextColumn ? "left" : "right"
          },
          border: {
            top: { style: "thin", color: { rgb: "d1d5db" } },
            bottom: { style: "thin", color: { rgb: "d1d5db" } },
            left: { style: "thin", color: { rgb: "d1d5db" } },
            right: { style: "thin", color: { rgb: "d1d5db" } }
          }
        };
      }
    }

    // Total row - Font size: 20
    if (grandTotal.TotalQty > 0) {
      const totalRow = dataEndRow + 1;
      for (let c = range.s.c; c <= range.e.c; c++) {
        const cellRef = XLSX.utils.encode_cell({ r: totalRow, c });
        if (!ws[cellRef]) continue;
        
        const isTextColumn = c <= 6;
        ws[cellRef].s = {
          font: { sz: 20, bold: true, color: { rgb: "1e40af" } },
          alignment: { 
            horizontal: isTextColumn ? "left" : "right", 
            vertical: "center" 
          },
          fill: { fgColor: { rgb: "dbeafe" } },
          border: {
            top: { style: "medium", color: { rgb: "1e40af" } },
            bottom: { style: "medium", color: { rgb: "1e40af" } },
            left: { style: "thin", color: { rgb: "d1d5db" } },
            right: { style: "thin", color: { rgb: "d1d5db" } }
          }
        };
      }
    }

    // Add auto-filter
    ws['!autofilter'] = { ref: `A3:O${dataEndRow + 1}` };

    // Update range
    const totalRows = dataEndRow + (grandTotal.TotalQty > 0 ? 2 : 1);
    ws['!ref'] = XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: totalRows, c: range.e.c }
    });

    XLSX.utils.book_append_sheet(wb, ws, "Order Report");
    XLSX.writeFile(wb, `OrderReport_${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    console.error("Export error:", error);
    alert("Error exporting data. Please try again.");
  }
}, [filteredData, grandTotal]);

  const handleFilterChange = (key, value) => {
    switch(key) {
      case 'dateFrom': setDateRange(prev => ({ ...prev, start: value })); break;
      case 'dateTo': setDateRange(prev => ({ ...prev, end: value })); break;
      case 'status': setSelectedStatus(value); break;
      case 'priority': setSelectedPriority(value); break;
      case 'buyer': setSelectedBuyer(value); break;
      case 'minValue': setMinValue(value); break;
      case 'maxValue': setMaxValue(value); break;
      default: break;
    }
  };

  const resetFilters = () => {
    setDateRange({ start: "", end: "" });
    setSelectedStatus('All');
    setSelectedPriority('All');
    setSelectedBuyer('All');
    setMinValue(0);
    setMaxValue(100000);
    setSelectedPI([]);
    setSelectedOrder([]);
    setSearch("");
  };

  const applyFilters = () => {
    setIsFilterPanelOpen(false);
    setCurrentPage(0);
  };

  const toggleRowExpand = (orderId) => {
    setExpandedRows(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const toggleDeliveryBreakdown = (orderId) => {
    setShowDeliveryBreakdown(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const handleRowClick = (order) => {
    setSelectedOrderForModal(order);
    setIsModalOpen(true);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshKey(prev => prev + 1);
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsRefreshing(false);
  };

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getColumnVisibility = (col) => selectedColumns.includes(col);

  const renderTableRows = () => {
    if (contextLoading) {
      return (
        <tr>
          <td colSpan="15" className="py-20 text-center">
            <div className="flex flex-col items-center justify-center">
              <FourSquare color="#3b82f6" size="large" />
              <p className="mt-4 text-sm text-slate-500">Loading orders...</p>
            </div>
          </td>
        </tr>
      );
    }

    if (!displayedData || displayedData.length === 0) {
      return (
        <tr>
          <td colSpan="15" className="py-20 text-center">
            <div className="flex flex-col items-center justify-center text-slate-500">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <FiPackage className="w-10 h-10 text-slate-300" />
              </div>
              <p className="text-xl font-semibold text-slate-700">No orders found</p>
              <p className="text-sm text-slate-400">Try adjusting your filters or search criteria</p>
              <button
                onClick={resetFilters}
                className="mt-4 px-4 py-2 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </td>
        </tr>
      );
    }

    return displayedData.map((data, index) => {
      const isExpanded = expandedRows[data.WorkOrderNo];
      const showDeliveries = showDeliveryBreakdown[data.WorkOrderNo];
      const deliveryPercent = Number(data.deliveryPercent) || 
        (data.TotalQty ? ((data.ChallanQTY || 0) / (data.TotalQty || 0) * 100).toFixed(1) : 0);
      const deliveryCount = data.deliveryCount || 0;
      const status = data.status || (deliveryPercent >= 100 ? "Completed" : deliveryPercent > 0 ? "Partial" : "Pending");
      const statusConfig = getStatusConfig(status);
      
      return (
        <React.Fragment key={data.WorkOrderNo || index}>
          <tr 
            className={`
              transition-all duration-200 cursor-pointer group
              ${statusConfig.bg}
              hover:shadow-md
              ${layoutMode === 'compact' ? 'text-sm' : ''}
            `}
            onClick={() => handleRowClick(data)}
          >
            {getColumnVisibility('sl') && (
              <td className="px-4 py-3 text-center text-slate-400 font-medium">
                {index + 1 + currentPage * itemsPerPage}
              </td>
            )}
            {getColumnVisibility('orderNo') && (
              <td className="px-4 py-3 font-semibold text-blue-600 group-hover:text-blue-800">
                {data.WorkOrderNo || "N/A"}
              </td>
            )}
            {getColumnVisibility('date') && (
              <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                {formatDate(data.OrderReceiveDate)}
              </td>
            )}
            {getColumnVisibility('category') && (
              <td className="px-4 py-3">
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700">
                  {data.Category || data.Section || "N/A"}
                </span>
              </td>
            )}
            {getColumnVisibility('customer') && (
              <td className="px-4 py-3 text-slate-700 max-w-[150px] truncate">
                {data.CustomerName || "N/A"}
              </td>
            )}
            {getColumnVisibility('buyer') && (
              <td className="px-4 py-3">
                <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full">
                  {data.buyer || data.Buyer || "N/A"}
                </span>
              </td>
            )}
            {getColumnVisibility('pi') && (
              <td className="px-4 py-3 text-slate-600 text-sm">
                {data.PINO || "N/A"}
              </td>
            )}
            {getColumnVisibility('orderQty') && (
              <td className="px-4 py-3 text-right font-semibold text-slate-700">
                {formatNumber(data.BreakDownQTY || data.TotalQty || 0)}
              </td>
            )}
            {getColumnVisibility('deliveryQty') && (
              <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                {formatNumber(data.challanqty || data.ChallanQTY || 0)}
              </td>
            )}
            {getColumnVisibility('progress') && (
              <td className="px-4 py-3">
                <div className="flex items-center justify-center">
                  <div className="w-24 bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-2 rounded-full transition-all duration-1000 ${
                        deliveryPercent >= 100 ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                        deliveryPercent >= 50 ? 'bg-gradient-to-r from-orange-400 to-amber-500' :
                        'bg-gradient-to-r from-blue-400 to-indigo-500'
                      }`}
                      style={{ width: `${Math.min(Number(deliveryPercent), 100)}%` }}
                    >
                      <div className="h-full w-full bg-gradient-to-r from-transparent to-white/20 animate-pulse"></div>
                    </div>
                  </div>
                  <span className="ml-2 text-xs font-medium text-slate-600 min-w-[40px]">
                    {deliveryPercent}%
                  </span>
                </div>
              </td>
            )}
            {getColumnVisibility('deliveries') && (
              <td className="px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-2">
                  <div className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                    deliveryCount > 0 ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <FiTruck className="w-3 h-3" />
                    {deliveryCount}
                  </div>
                  {deliveryCount > 0 && (
                    <div className="flex -space-x-1">
                      {[...Array(Math.min(deliveryCount, 3))].map((_, i) => (
                        <div key={i} className={`w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white ${statusConfig.dot.replace('bg-', 'bg-')}`}>
                          {i + 1}
                        </div>
                      ))}
                      {deliveryCount > 3 && (
                        <div className="w-5 h-5 rounded-full bg-slate-400 border-2 border-white flex items-center justify-center text-[10px] font-bold text-white">
                          +
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </td>
            )}
            {getColumnVisibility('value') && (
              <td className="px-4 py-3 text-right font-semibold text-blue-600">
                {formatCurrency(data.TotalValue || 0)}
              </td>
            )}
            {getColumnVisibility('actions') && (
              <td className="px-4 py-3">
                <div className="flex items-center justify-center gap-1">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleRowExpand(data.WorkOrderNo);
                    }}
                    className="p-1.5 text-slate-400 transition-all rounded-lg hover:text-blue-600 hover:bg-blue-50"
                    title="View Details"
                  >
                    <FiEye className="w-4 h-4" />
                  </button>
                  {deliveryCount > 0 && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDeliveryBreakdown(data.WorkOrderNo);
                      }}
                      className={`p-1.5 transition-all rounded-lg ${
                        showDeliveries ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                      }`}
                      title="View Deliveries"
                    >
                      <FiLayers className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(data.WorkOrderNo);
                    }}
                    className="p-1.5 text-slate-400 transition-all rounded-lg hover:text-slate-600 hover:bg-slate-100 relative"
                    title="Copy Order No"
                  >
                    <FiCopy className="w-4 h-4" />
                  </button>
                </div>
              </td>
            )}
          </tr>
          
          {isExpanded && (
            <tr className="bg-slate-50/80">
              <td colSpan="15" className="px-4 py-4">
                <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <FiLayers className="w-4 h-4 text-blue-600" />
                      Order Breakdown
                    </h5>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRowClick(data);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                    >
                      View Full Details
                      <FiArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Item</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Qty</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Delivered</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Balance</th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Challan</th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Challan Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(data.breakdownItems || []).slice(0, 5).map((item, idx) => {
                          return (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                              <td className="px-3 py-2 text-slate-700">{item.item}</td>
                              <td className="px-3 py-2 text-right text-slate-600">{item.qty}</td>
                              <td className="px-3 py-2 text-right text-emerald-600">{item.delivered}</td>
                              <td className="px-3 py-2 text-right text-rose-600">{item.qty - item.delivered}</td>
                              <td className="px-3 py-2 text-center">
                                <StatusBadge status={item.status} size="sm" />
                              </td>
                              <td className="px-3 py-2 text-center text-sm text-slate-600">
                                {item.challanNo || '-'}
                              </td>
                              <td className="px-3 py-2 text-center">
                                {item.challanStatus ? (
                                  <StatusBadge status={item.challanStatus} size="sm" />
                                ) : (
                                  <span className="text-xs text-slate-400">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        {(!data.breakdownItems || data.breakdownItems.length === 0) && (
                          <tr>
                            <td colSpan="7" className="px-3 py-4 text-center text-slate-400">
                              No breakdown items available
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </td>
            </tr>
          )}

          {showDeliveries && data.deliveries && data.deliveries.length > 0 && (
            <tr className="bg-blue-50/50">
              <td colSpan="15" className="px-4 py-4">
                <div className="p-6 bg-white rounded-xl border border-blue-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <FiTruck className="w-4 h-4 text-blue-600" />
                      Delivery Breakdown ({data.deliveries.length} deliveries)
                    </h5>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {data.deliveries.map((delivery, idx) => {
                      const statusConfig = getStatusConfig(delivery.status);
                      return (
                        <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:shadow-lg transition-all duration-300 hover:border-blue-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${statusConfig.bg}`}>
                                {delivery.status === 'Completed' || delivery.status === 'Delivered' ? 
                                  <FiCheckCircle className="w-4 h-4 text-emerald-600" /> :
                                  delivery.status === 'Partial' ? 
                                  <FiAlertCircle className="w-4 h-4 text-orange-600" /> :
                                  <FiClock className="w-4 h-4 text-blue-600" />
                                }
                              </div>
                              <div>
                                <span className="text-sm font-medium text-slate-700">#{idx + 1}</span>
                                <p className="text-xs text-slate-400">{delivery.challanNo}</p>
                              </div>
                            </div>
                            <StatusBadge status={delivery.status} size="sm" />
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-3">
                            <div>
                              <p className="text-xs text-slate-400">Quantity</p>
                              <p className="text-sm font-semibold text-slate-700">{delivery.qty}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-400">Value</p>
                              <p className="text-sm font-semibold text-slate-700">{formatCurrency(delivery.value)}</p>
                            </div>
                          </div>
                          <div className="mt-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-slate-200 rounded-full h-1.5">
                                <div 
                                  className={`h-1.5 rounded-full transition-all duration-1000 ${
                                    delivery.percentage >= 100 ? 'bg-green-500' :
                                    delivery.percentage >= 50 ? 'bg-orange-500' :
                                    'bg-blue-500'
                                  }`}
                                  style={{ width: `${Math.min(delivery.percentage || 0, 100)}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-slate-500">{delivery.percentage || 0}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </td>
            </tr>
          )}
        </React.Fragment>
      );
    });
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Apply theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <>
      <OrderForm />
      
      {isModalOpen && (
        <OrderDetailModal 
          order={selectedOrderForModal} 
          isOpen={isModalOpen} 
          onClose={() => {
            setIsModalOpen(false);
            setSelectedOrderForModal(null);
          }} 
        />
      )}

      <FilterPanel
        isOpen={isFilterPanelOpen}
        onClose={() => setIsFilterPanelOpen(false)}
        filters={{
          dateFrom: dateRange.start,
          dateTo: dateRange.end,
          status: selectedStatus,
          priority: selectedPriority,
          buyer: selectedBuyer,
          minValue: minValue,
          maxValue: maxValue,
          activeCount: [dateRange.start, dateRange.end, selectedStatus !== 'All', selectedPriority !== 'All', selectedBuyer !== 'All', minValue > 0, maxValue < 100000].filter(Boolean).length,
          buyerOptions: uniqueBuyer
        }}
        onFilterChange={handleFilterChange}
        onReset={resetFilters}
        onApply={applyFilters}
      />

      <div className="px-9 pt-6 pb-2 bg-white dark:bg-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
              <FiPackage className="w-7 h-7 text-blue-600" />
              Order Report
              <span className="ml-2 text-sm font-normal text-slate-400">
                ({filteredData.length} orders)
              </span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Track and manage all your orders in one place</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 text-slate-400 transition-colors rounded-lg hover:text-blue-600 hover:bg-blue-50 disabled:opacity-50"
              title="Refresh Data"
            >
              <FiRefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowColumnSelector(!showColumnSelector)}
              className="p-2 text-slate-400 transition-colors rounded-lg hover:text-blue-600 hover:bg-blue-50"
              title="Select Columns"
            >
              <FiColumns className="w-5 h-5" />
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-400 transition-colors rounded-lg hover:text-blue-600 hover:bg-blue-50"
              title="Toggle Theme"
            >
              {theme === 'light' ? <FiMoon className="w-5 h-5" /> : <FiSun className="w-5 h-5 bg-black-500 " />}
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Section with Comparison */}
      {grandTotal.TotalQty > 0 && (
        <div className="grid grid-cols-1 gap-4 px-9 mt-6 md:grid-cols-5 ">
          <AnimatedCard delay={0}>
            <StatsCard 
              title="Total Orders"
              value={filteredData.length}
              icon={<FiPackage className="w-6 h-6 text-white" />}
              color="from-blue-500 to-blue-600"
              trend={comparisonData.trend}
            />
          </AnimatedCard>
          <AnimatedCard delay={100}>
            <StatsCard 
              title="Total Quantity"
              value={formatNumber(Math.ceil(grandTotal.TotalQty))}
              icon={<FiBarChart2 className="w-6 h-6 text-white" />}
              color="from-green-500 to-green-600"
              subtitle={`${formatNumber(Math.ceil(grandTotal.ChallanQTY))} delivered`}
              trend={comparisonData.trend > 0 ? comparisonData.trend * 0.8 : null}
            />
          </AnimatedCard>
          <AnimatedCard delay={200}>
            <StatsCard 
              title="Total Value"
              value={formatCurrency(grandTotal.TotalValue)}
              icon={<FiDollarSign className="w-6 h-6 text-white" />}
              color="from-purple-500 to-purple-600"
              subtitle={`${formatCurrency(grandTotal.ChallanValue)} delivered`}
              trend={comparisonData.trend}
            />
          </AnimatedCard>
          <AnimatedCard delay={300}>
            <StatsCard 
              title="Delivery Rate"
              value={`${grandTotal.TotalQty ? ((grandTotal.ChallanQTY / grandTotal.TotalQty) * 100).toFixed(1) : 0}%`}
              icon={<FiTrendingUp className="w-6 h-6 text-white" />}
              color="from-orange-500 to-orange-600"
              subtitle={`${formatNumber(Math.ceil(grandTotal.BalanceQty))} remaining`}
            />
          </AnimatedCard>
          <AnimatedCard delay={400}>
            <StatsCard 
              title="Avg Order Value"
              value={formatCurrency(filteredData.length > 0 ? grandTotal.TotalValue / filteredData.length : 0)}
              icon={<FiDollarSign className="w-6 h-6 text-white" />}
              color="from-rose-500 to-pink-600"
              trend={comparisonData.trend > 0 ? comparisonData.trend * 0.5 : null}
            />
          </AnimatedCard>
        </div>
      )}
      
      <div className="px-9 my-5">
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex flex-wrap items-center gap-3">
            <AdvancedSearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search orders, buyers, PI..."
              filterCount={[
                selectedPI.length > 0,
                selectedOrder.length > 0,
                selectedStatus !== 'All',
                selectedBuyer !== 'All',
                dateRange.start || dateRange.end,
                minValue > 0 || maxValue < 100000
              ].filter(Boolean).length}
              onFilterToggle={() => setIsFilterPanelOpen(true)}
            />

            <div className="flex p-1 bg-slate-100 dark:bg-slate-700 rounded-lg">
              <button
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                  viewMode === 'detail' 
                    ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm' 
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-800'
                }`}
                onClick={() => setViewMode('detail')}
              >
                <FiList className="inline mr-1" />
                Detail
              </button>
              <button
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                  viewMode === 'summary' 
                    ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm' 
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-800'
                }`}
                onClick={() => setViewMode('summary')}
              >
                <FiGrid className="inline mr-1" />
                Summary
              </button>
            </div>

            <div className="flex p-1 bg-slate-100 dark:bg-slate-700 rounded-lg">
              <button
                onClick={() => setLayoutMode('modern')}
                className={`px-3 py-1.5 text-xs rounded-md transition-all duration-200 ${
                  layoutMode === 'modern' ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-600 dark:text-slate-300'
                }`}
                title="Modern Layout"
              >
                <FiZap className="inline w-4 h-4" />
              </button>
              <button
                onClick={() => setLayoutMode('compact')}
                className={`px-3 py-1.5 text-xs rounded-md transition-all duration-200 ${
                  layoutMode === 'compact' ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-600 dark:text-slate-300'
                }`}
                title="Compact Layout"
              >
                <FiSliders className="inline w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-1 overflow-x-auto">
              {['All', 'Pending', 'Partial', 'Completed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`
                    px-2.5 py-1 text-xs rounded-full transition-all duration-200 whitespace-nowrap
                    ${selectedStatus === status 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}
                  `}
                >
                  {status === 'All' ? 'All' : status.length > 12 ? status.slice(0, 10) + '…' : status}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative" ref={sortDropdownRef}>
              <button 
                onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <span className="text-sm">Sort</span>
                <FiChevronDown className={`w-4 h-4 transition-transform ${sortDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {sortDropdownOpen && (
                <ul className="absolute right-0 z-50 w-48 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg py-1">
                  <li>
                    <button 
                      className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
                      onClick={() => { 
                        setSortOrder('desc'); 
                        setSortDropdownOpen(false);
                        setCurrentPage(0);
                      }}
                    >
                      <FiArrowDown className="w-3 h-3" />
                      Newest First
                    </button>
                  </li>
                  <li>
                    <button 
                      className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
                      onClick={() => { 
                        setSortOrder('asc'); 
                        setSortDropdownOpen(false);
                        setCurrentPage(0);
                      }}
                    >
                      <FiArrowUp className="w-3 h-3" />
                      Oldest First
                    </button>
                  </li>
                </ul>
              )}
            </div>

            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2 text-white transition-all duration-200 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg hover:from-green-600 hover:to-emerald-700 shadow-sm shadow-green-500/20"
            >
              <FiDownload className="w-4 h-4" />
              <span className="text-sm font-medium">Export</span>
            </button>
          </div>
        </div>

        {([selectedPI.length > 0, selectedOrder.length > 0, selectedStatus !== 'All', selectedBuyer !== 'All', dateRange.start || dateRange.end, minValue > 0 || maxValue < 100000].some(Boolean)) && (
          <div className="flex flex-wrap items-center gap-2 mt-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-2">Active Filters:</span>
            {selectedPI.length > 0 && (
              <span className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
                PI: {selectedPI.length}
                <button onClick={() => setSelectedPI([])} className="hover:text-blue-900 dark:hover:text-blue-100">
                  <FiX className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedOrder.length > 0 && (
              <span className="flex items-center gap-1 px-2 py-1 text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full">
                Orders: {selectedOrder.length}
                <button onClick={() => setSelectedOrder([])} className="hover:text-indigo-900 dark:hover:text-indigo-100">
                  <FiX className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedStatus !== 'All' && (
              <span className={`flex items-center gap-1 px-2 py-1 text-xs rounded-full ${getStatusConfig(selectedStatus).color}`}>
                Status: {selectedStatus}
                <button onClick={() => setSelectedStatus('All')} className="hover:text-inherit opacity-70 hover:opacity-100">
                  <FiX className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedBuyer !== 'All' && (
              <span className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full">
                Buyer: {selectedBuyer}
                <button onClick={() => setSelectedBuyer('All')} className="hover:text-purple-900 dark:hover:text-purple-100">
                  <FiX className="w-3 h-3" />
                </button>
              </span>
            )}
            {(dateRange.start || dateRange.end) && (
              <span className="flex items-center gap-1 px-2 py-1 text-xs bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded-full">
                {dateRange.start && `From ${formatDate(dateRange.start)}`}
                {dateRange.start && dateRange.end && ' - '}
                {dateRange.end && `To ${formatDate(dateRange.end)}`}
                <button onClick={() => setDateRange({ start: '', end: '' })} className="hover:text-orange-900 dark:hover:text-orange-100">
                  <FiX className="w-3 h-3" />
                </button>
              </span>
            )}
            {(minValue > 0 || maxValue < 100000) && (
              <span className="flex items-center gap-1 px-2 py-1 text-xs bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 rounded-full">
                Value: ${minValue} - ${maxValue}
                <button onClick={() => { setMinValue(0); setMaxValue(100000); }} className="hover:text-teal-900 dark:hover:text-teal-100">
                  <FiX className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={resetFilters}
              className="px-2 py-1 text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      <div className="px-9">
        <div className={`overflow-x-auto bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 ${
          layoutMode === 'compact' ? 'text-sm' : ''
        }`}>
          <table className="w-full">
            <thead className={`bg-gradient-to-r from-slate-50 to-slate-100/80 dark:from-slate-700 dark:to-slate-800 border-b border-slate-200 dark:border-slate-700 ${
              layoutMode === 'compact' ? 'text-xs' : ''
            }`}>
              <tr>
                {viewMode === "summary" ? (
                  <>
                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left text-slate-600 dark:text-slate-400 uppercase">Order</th>
                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left text-slate-600 dark:text-slate-400 uppercase">Date</th>
                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left text-slate-600 dark:text-slate-400 uppercase">Customer</th>
                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left text-slate-600 dark:text-slate-400 uppercase">Buyer</th>
                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left text-slate-600 dark:text-slate-400 uppercase">PI</th>
                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left text-slate-600 dark:text-slate-400 uppercase">Section</th>
                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-right text-slate-600 dark:text-slate-400 uppercase">Order Qty</th>
                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-right text-slate-600 dark:text-slate-400 uppercase">Delivered</th>
                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-right text-slate-600 dark:text-slate-400 uppercase">Balance</th>
                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-right text-slate-600 dark:text-slate-400 uppercase">Value</th>
                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-center text-slate-600 dark:text-slate-400 uppercase">Deliveries</th>
                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-center text-slate-600 dark:text-slate-400 uppercase">Status</th>
                  </>
                ) : (
                  <>
                    {getColumnVisibility('sl') && <th className="px-4 py-3 text-xs font-semibold tracking-wider text-center text-slate-600 dark:text-slate-400 uppercase">#</th>}
                    {getColumnVisibility('orderNo') && <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left text-slate-600 dark:text-slate-400 uppercase">Order No.</th>}
                    {getColumnVisibility('date') && <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left text-slate-600 dark:text-slate-400 uppercase">Date</th>}
                    {getColumnVisibility('category') && <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left text-slate-600 dark:text-slate-400 uppercase">Category</th>}
                    {getColumnVisibility('customer') && <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left text-slate-600 dark:text-slate-400 uppercase">Customer</th>}
                    {getColumnVisibility('buyer') && <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left text-slate-600 dark:text-slate-400 uppercase">Buyer</th>}
                    {getColumnVisibility('pi') && <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left text-slate-600 dark:text-slate-400 uppercase">PI No.</th>}
                    {getColumnVisibility('orderQty') && <th className="px-4 py-3 text-xs font-semibold tracking-wider text-right text-slate-600 dark:text-slate-400 uppercase">Order Qty</th>}
                    {getColumnVisibility('deliveryQty') && <th className="px-4 py-3 text-xs font-semibold tracking-wider text-right text-slate-600 dark:text-slate-400 uppercase">Delivery</th>}
                    {getColumnVisibility('progress') && <th className="px-4 py-3 text-xs font-semibold tracking-wider text-center text-slate-600 dark:text-slate-400 uppercase">Progress</th>}
                    {getColumnVisibility('deliveries') && <th className="px-4 py-3 text-xs font-semibold tracking-wider text-center text-slate-600 dark:text-slate-400 uppercase">Deliveries</th>}
                    {getColumnVisibility('value') && <th className="px-4 py-3 text-xs font-semibold tracking-wider text-right text-slate-600 dark:text-slate-400 uppercase">Value</th>}
                    {getColumnVisibility('actions') && <th className="px-4 py-3 text-xs font-semibold tracking-wider text-center text-slate-600 dark:text-slate-400 uppercase">Actions</th>}
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {renderTableRows()}
            </tbody>
            {grandTotal.TotalQty > 0 && (
              <tfoot className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-t-2 border-blue-200 dark:border-blue-800">
                <tr className="font-semibold">
                  {viewMode === "summary" ? (
                    <>
                      <td colSpan={6} className="px-4 py-3 text-sm text-blue-700 dark:text-blue-400">Total</td>
                      <td className="px-4 py-3 text-right text-blue-700 dark:text-blue-400">{formatNumber(grandTotal.TotalQty || 0)}</td>
                      <td className="px-4 py-3 text-right text-emerald-700 dark:text-emerald-400">{formatNumber(grandTotal.ChallanQTY || 0)}</td>
                      <td className="px-4 py-3 text-right text-rose-700 dark:text-rose-400">{formatNumber(grandTotal.BalanceQty || 0)}</td>
                      <td className="px-4 py-3 text-right text-blue-700 dark:text-blue-400">{formatCurrency(grandTotal.TotalValue || 0)}</td>
                      <td className="px-4 py-3 text-center text-blue-700 dark:text-blue-400">{grandTotal.TotalQty ? grandTotal.TotalQty : 0}</td>
                      <td className="px-4 py-3 text-center text-blue-700 dark:text-blue-400">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200">
                          {grandTotal.TotalQty ? ((grandTotal.ChallanQTY || 0) / (grandTotal.TotalQty || 0) * 100).toFixed(1) : 0}%
                        </span>
                      </td>
                    </>
                  ) : (
                    <>
                      {getColumnVisibility('sl') && <td className="px-4 py-3"></td>}
                      <td colSpan={getColumnVisibility('sl') ? 6 : 7} className="px-4 py-3 text-sm text-blue-700 dark:text-blue-400">Total</td>
                      {getColumnVisibility('orderQty') && <td className="px-4 py-3 text-right text-blue-700 dark:text-blue-400">{formatNumber(grandTotal.TotalQty || 0)}</td>}
                      {getColumnVisibility('deliveryQty') && <td className="px-4 py-3 text-right text-emerald-700 dark:text-emerald-400">{formatNumber(grandTotal.ChallanQTY || 0)}</td>}
                      {getColumnVisibility('progress') && <td className="px-4 py-3 text-center text-blue-700 dark:text-blue-400">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200">
                          {grandTotal.TotalQty ? ((grandTotal.ChallanQTY || 0) / (grandTotal.TotalQty || 0) * 100).toFixed(1) : 0}%
                        </span>
                      </td>}
                      {getColumnVisibility('deliveries') && <td className="px-4 py-3 text-center text-blue-700 dark:text-blue-400">{grandTotal.TotalQty ? grandTotal.TotalQty : 0}</td>}
                      {getColumnVisibility('value') && <td className="px-4 py-3 text-right text-blue-700 dark:text-blue-400">{formatCurrency(grandTotal.TotalValue || 0)}</td>}
                      {getColumnVisibility('actions') && <td></td>}
                    </>
                  )}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {pageCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 px-9 py-4">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Showing <span className="font-semibold">{currentPage * itemsPerPage + 1}</span> to <span className="font-semibold">{Math.min((currentPage + 1) * itemsPerPage, filteredData.length)}</span> of <span className="font-semibold">{filteredData.length}</span> entries
          </div>
          <ReactPaginate
            breakLabel="..."
            nextLabel={
              <span className="flex items-center gap-1">
                Next <FiChevronDown className="w-4 h-4 rotate-270" />
              </span>
            }
            previousLabel={
              <span className="flex items-center gap-1">
                <FiChevronDown className="w-4 h-4 rotate-90" /> Prev
              </span>
            }
            pageCount={pageCount}
            onPageChange={({ selected }) => setCurrentPage(selected)}
            containerClassName="flex items-center gap-1"
            pageClassName="px-3.5 py-2 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors dark:text-slate-300"
            activeClassName="bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20"
            previousClassName="px-3.5 py-2 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors dark:text-slate-300"
            nextClassName="px-3.5 py-2 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors dark:text-slate-300"
            disabledClassName="opacity-40 cursor-not-allowed hover:bg-transparent"
            breakClassName="px-2 py-1.5 text-sm text-slate-400 dark:text-slate-500"
          />
        </div>
      )}

      {showColumnSelector && (
        <div className="fixed inset-0 z-[999] bg-black/30 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Select Columns</h3>
              <button
                onClick={() => setShowColumnSelector(false)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <FiX className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {[
                { id: 'sl', label: 'SL' },
                { id: 'orderNo', label: 'Order No.' },
                { id: 'date', label: 'Date' },
                { id: 'category', label: 'Category' },
                { id: 'customer', label: 'Customer' },
                { id: 'buyer', label: 'Buyer' },
                { id: 'pi', label: 'PI No.' },
                { id: 'orderQty', label: 'Order Qty' },
                { id: 'deliveryQty', label: 'Delivery Qty' },
                { id: 'progress', label: 'Progress' },
                { id: 'deliveries', label: 'Deliveries' },
                { id: 'value', label: 'Value' },
                { id: 'actions', label: 'Actions' }
              ].map((col) => (
                <label key={col.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedColumns.includes(col.id)}
                    onChange={() => {
                      if (selectedColumns.includes(col.id)) {
                        setSelectedColumns(selectedColumns.filter(c => c !== col.id));
                      } else {
                        setSelectedColumns([...selectedColumns, col.id]);
                      }
                    }}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 dark:bg-slate-700"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">{col.label}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setSelectedColumns(['sl', 'orderNo', 'date', 'category', 'customer', 'buyer', 'pi', 'orderQty', 'deliveryQty', 'progress', 'deliveries', 'value', 'actions']);
                }}
                className="px-4 py-2 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Select All
              </button>
              <button
                onClick={() => setSelectedColumns(['orderNo', 'customer', 'progress', 'value'])}
                className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Minimal
              </button>
              <button
                onClick={() => setShowColumnSelector(false)}
                className="flex-1 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .animate-fadeInUp {
          opacity: 0;
          animation: fadeInUp 0.5s ease-out forwards;
        }
        .animate-slideInRight {
          animation: slideInRight 0.3s ease-out forwards;
        }
        .fullscreen-modal {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          z-index: 99999 !important;
        }
        .fullscreen-modal .max-w-7xl {
          max-width: 100% !important;
          margin: 0 !important;
          border-radius: 0 !important;
          height: 100vh !important;
        }
        .fullscreen-modal .max-h-\\[70vh\\] {
          max-height: calc(100vh - 200px) !important;
        }
        .rotate-90 {
          transform: rotate(90deg);
        }
        .rotate-270 {
          transform: rotate(270deg);
        }
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb {
          background: #c1c7cd;
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #a0a7ae;
        }
        .dark ::-webkit-scrollbar-track {
          background: #1e293b;
        }
        .dark ::-webkit-scrollbar-thumb {
          background: #475569;
        }
        .dark ::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
      `}</style>
    </>
  );
}

export default OrderReport;