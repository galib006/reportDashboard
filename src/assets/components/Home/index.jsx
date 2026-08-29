// components/home/index.jsx

import React, { useContext, useMemo, useState, useEffect, useRef } from "react";
import { GetDataContext } from "../DataContext";
import { toast } from "react-toastify";
import { AnimatePresence } from "framer-motion";
import axios from "axios";

// Utils
import { COLORS, API_ENDPOINTS } from "./utils/constants";  // ✅ API_ENDPOINTS ইম্পোর্ট করুন
import { 
  formatCurrency, 
  formatNumber, 
  formatCompactCurrency, 
  getStatusColor 
} from "./utils/formatUtils";
import { getCurrentMonthDates } from "./utils/dateUtils";

// Hooks
import { useComprehensiveData } from "./hooks/useComprehensiveData";

// Components
import LoadingState from "./LoadingState";
import Header from "./Header";
import AutoLoadProgress from "./AutoLoadProgress";
import DatePickerModal from "./DatePickerModal";
import FilterBar from "./FilterBar";
import StatusBar from "./StatusBar";
import GrowthStrategies from "./GrowthStrategies";
import KpiGrid from "./KpiGrid";
import TabNavigation from "./TabNavigation";
import Footer from "./Footer";

// Tabs
import OverviewTab from "./tabs/OverviewTab";
import SalesTab from "./tabs/SalesTab";
import CategoriesTab from "./tabs/CategoriesTab";
import BuyersTab from "./tabs/BuyersTab";
import FunnelTab from "./tabs/FunnelTab";
import ChannelsTab from "./tabs/ChannelsTab";
import AnalyticsTab from "./tabs/AnalyticsTab";
import PredictiveTab from "./tabs/PredictiveTab";
import InsightsTab from "./tabs/InsightsTab";

// Icons
import {
  FaShoppingCart,
  FaMoneyBillWave,
  FaDollarSign,
  FaBoxOpen,
  FaExclamationTriangle,
  FaUserTie,
  FaTag,
  FaStore,
  FaPercentage,
  FaUsers,
} from "react-icons/fa";
import {
  RiMoneyDollarCircleFill,
} from "react-icons/ri";
import {
  TbTruckDelivery,
} from "react-icons/tb";

function Home() {
  // ============================================================
  // Context
  // ============================================================
  const { cndata, setcndata, loading: contextLoading, apiKey } =
    useContext(GetDataContext);
  const apiData = useMemo(() => cndata?.apiData || [], [cndata]);

  // ============================================================
  // State
  // ============================================================
  const [isLoading, setIsLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState("All");
  const [selectedMonth, setSelectedMonth] = useState("All");
  const [selectedMarketing, setSelectedMarketing] = useState("All");
  const [viewMode, setViewMode] = useState("monthly");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [isAutoLoading, setIsAutoLoading] = useState(false);
  const [autoLoadProgress, setAutoLoadProgress] = useState(0);
  const [autoLoadStatus, setAutoLoadStatus] = useState("");
  const [autoLoadAttempted, setAutoLoadAttempted] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(),
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isFetchingRange, setIsFetchingRange] = useState(false);
  const [rangeFetchProgress, setRangeFetchProgress] = useState(0);
  const [rangeFetchStatus, setRangeFetchStatus] = useState("");

  const autoLoadRef = useRef(false);
  const cancelTokenRef = useRef(null);

  // ❌ এখান থেকে process.env সরান - API_ENDPOINTS ইম্পোর্ট করা আছে

  // ============================================================
  // Data
  // ============================================================
  const data = useComprehensiveData(
    apiData,
    selectedYear,
    selectedMonth,
    selectedMarketing,
    viewMode,
  );
  console.log("Comprehensive Data:", data);
  
  console.log("📊 Order Map Data:", data.orderMapData);

  // ============================================================
  // Memoized Values
  // ============================================================
  const years = useMemo(() => {
    if (!apiData || apiData.length === 0) return ["All"];
    const uniqueYears = Array.from(
      new Set(
        apiData.map((item) => new Date(item.OrderReceiveDate).getFullYear()),
      ),
    );
    return ["All", ...uniqueYears.sort((a, b) => b - a)];
  }, [apiData]);

  const months = useMemo(() => {
    if (!apiData || apiData.length === 0) return ["All"];

    const yearFiltered =
      selectedYear === "All"
        ? apiData
        : apiData.filter(
            (item) =>
              new Date(item.OrderReceiveDate).getFullYear() ===
              Number(selectedYear),
          );

    const uniqueMonths = Array.from(
      new Set(
        yearFiltered.map((item) =>
          new Date(item.OrderReceiveDate).toLocaleString("default", {
            month: "short",
          }),
        ),
      ),
    );

    const monthOrder = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    const sortedMonths = uniqueMonths.sort(
      (a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b),
    );
    return ["All", ...sortedMonths];
  }, [apiData, selectedYear]);

  const marketingNames = useMemo(() => {
    if (!apiData || !Array.isArray(apiData)) return ["All"];
    const names = new Set(
      apiData.map((item) => item.MarketingName || "Unknown").filter(Boolean),
    );
    return ["All", ...Array.from(names)];
  }, [apiData]);

  // ============================================================
  // KPI Config
  // ============================================================
  const kpiConfig = [
    {
      id: "orders",
      title: "Total Orders",
      value: data.totalOrders,
      icon: FaShoppingCart,
      color: COLORS.primary,
      subtitle: `${data.totalCustomers} customers`,
    },
    {
      id: "orderValue",
      title: "Total Order Value",
      value: formatCurrency(data.totals.orderValue),
      icon: RiMoneyDollarCircleFill,
      color: COLORS.indigo,
      subtitle: formatCompactCurrency(data.totals.orderValue),
    },
    {
      id: "avgOrderValue",
      title: "Avg Order Value",
      value: formatCurrency(data.performanceMetrics?.avgOrderValue || 0),
      icon: FaDollarSign,
      color: COLORS.cyan,
      subtitle: `per order`,
    },
    {
      id: "salesValue",
      title: "Sales Revenue",
      value: formatCurrency(data.totals.saleValue),
      icon: FaMoneyBillWave,
      color: COLORS.emerald,
      subtitle: formatCompactCurrency(data.totals.saleValue),
      growth: data.salesGrowth,
    },
    {
      id: "salesQty",
      title: "Sales Qty",
      value: formatNumber(data.totals.saleQty),
      icon: TbTruckDelivery,
      color: COLORS.success,
      subtitle: `${data.deliveryPercent.toFixed(0)}% delivered`,
    },
    {
      id: "balance",
      title: "Balance Qty",
      value: formatNumber(data.totals.balanceQty),
      icon: FaBoxOpen,
      color: COLORS.danger,
      subtitle: `${((data.totals.balanceQty / (data.totals.orderQty || 1)) * 100).toFixed(0)}% pending`,
    },
    {
      id: "deliveryRate",
      title: "Delivery Rate",
      value: `${data.deliveryPercent.toFixed(0)}%`,
      icon: FaPercentage,
      color: getStatusColor(data.deliveryPercent),
      subtitle: `${data.valuePercent.toFixed(0)}% value`,
    },
    {
      id: "marketing",
      title: "Sales Persons",
      value: data.totalMarketing,
      icon: FaUserTie,
      color: COLORS.violet,
      subtitle: `active sellers`,
    },
    {
      id: "categories",
      title: "Categories",
      value: data.totalCategories,
      icon: FaTag,
      color: COLORS.teal,
      subtitle: `${data.categoryData.reduce((sum, c) => sum + (c.subCategories || 0), 0)} sub-categories`,
    },
    {
      id: "buyers",
      title: "Buyers",
      value: data.totalBuyers,
      icon: FaStore,
      color: COLORS.orange,
      subtitle: `active buyers`,
    },
    {
      id: "customerValue",
      title: "Avg Customer Value",
      value: formatCurrency(data.performanceMetrics?.avgCustomerValue || 0),
      icon: FaUsers,
      color: COLORS.pink,
      subtitle: `per customer`,
    },
  ];

  // ============================================================
  // Tab Components Mapping
  // ============================================================
  const tabComponents = {
    overview: OverviewTab,
    orderReport: null,
    sales: SalesTab,
    categories: CategoriesTab,
    buyers: BuyersTab,
    funnel: FunnelTab,
    channels: ChannelsTab,
    analytics: AnalyticsTab,
    predictive: PredictiveTab,
    insights: InsightsTab,
  };

  // ============================================================
  // ✅ API Functions - ইম্পোর্ট করা API_ENDPOINTS ব্যবহার করুন
  // ============================================================
  const fetchCurrentMonthData = async (force = false) => {
    if (autoLoadRef.current && !force) return;
    if (
      !force &&
      cndata?.apiData &&
      cndata.apiData.length > 0 &&
      cndata?._lastFetch
    ) {
      const lastFetchTime = new Date(cndata._lastFetch.timestamp);
      const now = new Date();
      const hoursSinceLastFetch = (now - lastFetchTime) / (1000 * 60 * 60);
      if (hoursSinceLastFetch < 1) {
        setAutoLoadAttempted(true);
        return;
      }
    }
    if (!apiKey) {
      setAutoLoadAttempted(true);
      return;
    }

    autoLoadRef.current = true;
    setIsAutoLoading(true);
    setAutoLoadProgress(0);
    setAutoLoadStatus("Loading current month data...");
    setIsLoading(true);

    const source = axios.CancelToken.source();
    cancelTokenRef.current = source;

    try {
      const { stDate, edDate, month, year } = getCurrentMonthDates();
      setAutoLoadProgress(5);
      setAutoLoadStatus(`Fetching orders for ${month} ${year}...`);

      // ✅ ইম্পোর্ট করা API_ENDPOINTS ব্যবহার করুন
      const primaryResponse = await axios.get(
        `${API_ENDPOINTS.primary.url}?CompanyID=1&ProductCategoryID=0&ProductSubCategoryID=0&MarketingID=0&CustomerID=0&BuyerID=0&StartDate=${stDate}&EndDate=${edDate}&CommandID=${API_ENDPOINTS.primary.commandId}&EmpID=0`,
        {
          headers: { Authorization: `${apiKey}` },
          timeout: 300000,
          cancelToken: source.token,
        },
      );

      const primaryData = primaryResponse.data || [];
      setAutoLoadProgress(30);

      if (!Array.isArray(primaryData) || primaryData.length === 0) {
        toast.warning(`No data found for ${month} ${year}.`);
        setIsAutoLoading(false);
        autoLoadRef.current = false;
        setAutoLoadAttempted(true);
        return;
      }

      setAutoLoadProgress(40);
      setAutoLoadStatus(`Found ${primaryData.length} orders from primary API...`);

      // Secondary API
      setAutoLoadProgress(50);
      setAutoLoadStatus("Fetching supporting data from secondary API...");

      let secondaryData = [];
      try {
        // ✅ ইম্পোর্ট করা API_ENDPOINTS ব্যবহার করুন
        const secondaryResponse = await axios.get(
          `${API_ENDPOINTS.secondary.url}?CompanyID=1&ProductCategoryID=0&ProductSubCategoryID=0&MarketingID=0&CustomerID=0&BuyerID=0&JobCardID=0&StartDate=${stDate}&EndDate=${edDate}&CommandID=${API_ENDPOINTS.secondary.commandId}&EmpID=0`,
          {
            headers: { Authorization: `${apiKey}` },
            timeout: 300000,
            cancelToken: source.token,
          },
        );
        secondaryData = secondaryResponse.data || [];
      } catch (secondaryErr) {
        console.warn("Secondary API fetch failed:", secondaryErr);
      }

      setAutoLoadProgress(55);
      setAutoLoadStatus(`Found ${secondaryData.length} orders from secondary API...`);

      // Merge Data
      setAutoLoadProgress(60);
      setAutoLoadStatus("Merging data from both APIs...");

      const primaryMap = new Map();
      primaryData.forEach((item) => {
        const orderNo = item.WorkOrderNo || item.workOrderNo || "";
        if (orderNo) {
          primaryMap.set(orderNo, {
            ...item,
            BreakDownQTY: item.TotalBreakDownQTY || 0,
            ChallanQTY: item.ChallanQTY || 0,
            ChallanValue: item.ChallanValue || 0,
            BalanceQTY: item.BalanceQTY || 0,
            BalanceValue: item.BalanceValue || 0,
          });
        }
      });

      let mergedCount = 0;
      secondaryData.forEach((item) => {
        const orderNo = item.WorkOrderNo || item.workOrderNo || "";
        if (orderNo && primaryMap.has(orderNo)) {
          const existing = primaryMap.get(orderNo);
          if (!existing.ChallanQTY && item.ChallanQTY) {
            existing.ChallanQTY = item.ChallanQTY || 0;
          }
          if (!existing.ChallanValue && item.ChallanValue) {
            existing.ChallanValue = item.ChallanValue || 0;
          }
          if (!existing.BalanceQTY && item.BalanceQTY) {
            existing.BalanceQTY = item.BalanceQTY || 0;
          }
          if (!existing.BalanceValue && item.BalanceValue) {
            existing.BalanceValue = item.BalanceValue || 0;
          }
          mergedCount++;
        }
      });

      const mergedData = Array.from(primaryMap.values());

      setAutoLoadProgress(75);
      setAutoLoadStatus(
        `Merged ${mergedData.length} unique orders (${mergedCount} enriched from secondary)...`,
      );

      setAutoLoadProgress(90);
      setAutoLoadStatus("Processing data...");

      setAutoLoadProgress(95);
      setAutoLoadStatus("Updating dashboard...");

      setcndata((prevState) => ({
        ...prevState,
        apiData: mergedData,
        groupedData: [],
        workOrderIdMap: {},
        challanReceiveMap: {},
        workOrderStatus: "auto-loaded",
        _lastFetch: {
          timestamp: new Date().toISOString(),
          startDate: stDate,
          endDate: edDate,
          month: month,
          year: year,
          orderCount: mergedData.length,
          primaryCount: primaryData.length,
          secondaryCount: secondaryData.length,
          mergedCount: mergedCount,
          workOrderStatus: "auto-loaded",
          autoLoaded: true,
          apiUsed: "merged-primary-secondary",
        },
      }));

      setIsLoading(false);
      setAutoLoadProgress(100);
      setAutoLoadStatus(
        `✅ Loaded ${mergedData.length} unique orders (${primaryData.length} primary + ${secondaryData.length} secondary) for ${month} ${year}!`,
      );
      setAutoLoadAttempted(true);
      toast.success(
        `✅ Loaded ${mergedData.length} unique orders for ${month} ${year}`,
      );

      setIsLoading(false);

    } catch (err) {
      if (axios.isCancel(err)) return;
      console.error("Date range fetch error:", err);
      toast.error("Failed to fetch data for the selected date range.");
      setAutoLoadStatus("❌ Error fetching data");
      setIsLoading(false);
    } finally {
      setIsFetchingRange(false);
      setRangeFetchProgress(0);
      cancelTokenRef.current = null;
      setTimeout(() => setAutoLoadStatus(""), 3000);
    }
  };

  const fetchDataByDateRange = async (startDate, endDate) => {
    setIsLoading(true);
  const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const stDate = formatLocalDate(startDate);
  const edDate = formatLocalDate(endDate);
  
  console.log("📅 Selected Dates:", stDate, "to", edDate); // Should show correct dates


    if (!apiKey) {
      toast.error("API key not available");
      return;
    }

    setShowDatePicker(false);
    setIsFetchingRange(true);
    setRangeFetchProgress(0);
    setRangeFetchStatus("Preparing to fetch data...");

    const source = axios.CancelToken.source();
    cancelTokenRef.current = source;

    try {
      setRangeFetchProgress(10);
      setRangeFetchStatus(`Fetching orders from ${stDate} to ${edDate}...`);

      if (!stDate || !edDate) {
        toast.warning("Please select a valid date range");
        setIsFetchingRange(false);
        setRangeFetchStatus("");
        return;
      }

      setRangeFetchProgress(15);
      setRangeFetchStatus("Fetching primary order data...");

      const primaryResponse = await axios.get(
        `${API_ENDPOINTS.primary.url}?CompanyID=1&ProductCategoryID=0&ProductSubCategoryID=0&MarketingID=0&CustomerID=0&BuyerID=0&StartDate=${stDate}&EndDate=${edDate}&CommandID=${API_ENDPOINTS.primary.commandId}&EmpID=0`,
        {
          headers: { Authorization: `${apiKey}` },
          timeout: 300000,
          cancelToken: source.token,
        },
      );

      const primaryData = primaryResponse.data || [];
      setRangeFetchProgress(30);

      if (!Array.isArray(primaryData) || primaryData.length === 0) {
        toast.warning(`No data found for ${stDate} to ${edDate}.`);
        setIsFetchingRange(false);
        setRangeFetchStatus("");
        return;
      }

      setRangeFetchProgress(40);
      setRangeFetchStatus(`Found ${primaryData.length} primary orders...`);

      // Secondary API
      setRangeFetchProgress(45);
      setRangeFetchStatus("Fetching secondary order data...");

      let secondaryData = [];
      try {
        const secondaryResponse = await axios.get(
          `${API_ENDPOINTS.secondary.url}?CompanyID=1&ProductCategoryID=0&ProductSubCategoryID=0&MarketingID=0&CustomerID=0&BuyerID=0&JobCardID=0&StartDate=${stDate}&EndDate=${edDate}&CommandID=${API_ENDPOINTS.secondary.commandId}&EmpID=0`,
          {
            headers: { Authorization: `${apiKey}` },
            timeout: 300000,
            cancelToken: source.token,
          },
        );
        secondaryData = secondaryResponse.data || [];
      } catch (secondaryErr) {
        console.warn("Secondary API fetch failed:", secondaryErr);
      }

      setRangeFetchProgress(55);

      // Merge Data
      setRangeFetchProgress(70);
      setRangeFetchStatus("Merging data...");

      const mergedMap = new Map();

      secondaryData.forEach((item) => {
        const orderNo = item.WorkOrderNo || item.workOrderNo || "";
        if (orderNo) {
          mergedMap.set(orderNo, {
            ...item,
            OrderReceiveDate: "",
            _merged: false,
          });
        }
      });

      let mergedCount = 0;
      let primaryOnlyCount = 0;

      primaryData.forEach((item) => {
        const orderNo = item.WorkOrderNo || item.workOrderNo || "";
        if (!orderNo) return;

        const approvedDate =
          item.ApprovedDate ||
          item.approvedDate ||
          item.OrderReceiveDate ||
          item.orderReceiveDate ||
          "";

        if (mergedMap.has(orderNo)) {
          const existing = mergedMap.get(orderNo);
          existing.OrderReceiveDate = approvedDate;
          existing._merged = true;
          mergedCount++;
        } else {
          mergedMap.set(orderNo, {
            WorkOrderNo: orderNo,
            OrderReceiveDate: approvedDate,
            TotalOrderValue: 0,
            BreakDownQTY: 0,
            BalanceQTY: 0,
            BalanceValue: 0,
            ChallanQTY: 0,
            ChallanValue: 0,
            ProductCategoryName: "Uncategorized",
            ProductSubCategoryName: "",
            MarketingName: "Unknown",
            CName: "Unknown",
            BuyerName: "Unknown",
            BrandName: "",
            ItemDescription: "",
            CustomerPONo: "",
            DeliveryToAddress: "",
            CompanyID: 1,
            ProductCategoryID: 0,
            MarketingID: 0,
            TeamLeaderID: 0,
            SequenceNo: 0,
            SL: 0,
            CustomerID: 0,
            Unit: "",
            UnitPrice: 0,
            ChallanDate: null,
            ChallanNo: null,
            CustomerPINo: "",
            JobCardNo: "",
            FName: "",
            KeyEntry1: "",
            KeyEntry1Value: "",
            KeyEntry2: "",
            KeyEntry2Value: "",
            KeyEntry3: "",
            KeyEntry3Value: "",
            KeyEntry4: "",
            KeyEntry4Value: "",
            KeyEntry5: "",
            KeyEntry5Value: "",
            KeyEntry6: "",
            KeyEntry6Value: "",
            KeyEntry7: "",
            KeyEntry7Value: "",
            KeyEntry8: "",
            KeyEntry8Value: "",
            KeyEntry9: "",
            KeyEntry9Value: "",
            _source: "primary-only",
            _merged: false,
            _count: 0,
          });
          primaryOnlyCount++;
        }
      });

      const mergedData = Array.from(mergedMap.values());
 

      setRangeFetchProgress(80);

      setcndata((prevState) => ({
        ...prevState,
        apiData: mergedData,
        groupedData: [],
        workOrderIdMap: {},
        challanReceiveMap: {},
        workOrderStatus: "date-range-loaded",
        _lastFetch: {
          timestamp: new Date().toISOString(),
          startDate: stDate,
          endDate: edDate,
          orderCount: mergedData.length,
          primaryCount: primaryData.length,
          secondaryCount: secondaryData.length,
          mergedCount: mergedCount,
          primaryOnlyCount: primaryOnlyCount,
          workOrderStatus: "date-range-loaded",
          autoLoaded: false,
          dateRange: true,
          apiUsed: "merged-primary-secondary",
        },
      }));

      setRangeFetchProgress(100);
      setRangeFetchStatus(
        `✅ Loaded ${mergedData.length} unique orders from ${stDate} to ${edDate}!`,
      );
      toast.success(
        `✅ Loaded ${mergedData.length} unique orders from ${stDate} to ${edDate}`,
      );

      setSelectedYear("All");
      setSelectedMonth("All");

    } catch (err) {
      if (axios.isCancel(err)) return;
      console.error("Date range fetch error:", err);
      toast.error("Failed to fetch data for the selected date range.");
      setRangeFetchStatus("❌ Error fetching data");
      setIsLoading(false);
    } finally {
      setIsFetchingRange(false);
      setRangeFetchProgress(0);
      cancelTokenRef.current = null;
      setTimeout(() => setRangeFetchStatus(""), 3000);
    }
  };

  // ============================================================
  // Handlers
  // ============================================================
  const handleRefresh = () => {
    setIsRefreshing(true);
    toast.info("Refreshing dashboard data...");
    fetchCurrentMonthData(true).finally(() => setIsRefreshing(false));
  };

  const handleExport = () => {
    toast.info("Exporting dashboard data...");
    setTimeout(() => toast.success("Data exported successfully!"), 1000);
  };

  const handleResetFilters = () => {
    setSelectedYear("All");
    setSelectedMonth("All");
    setSelectedMarketing("All");
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleDateRangeSubmit = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (dateRange.startDate && dateRange.endDate) {
      setShowDatePicker(false);
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      setTimeout(() => {
        fetchDataByDateRange(start, end);
      }, 150);
    } else {
      toast.warning("Please select both start and end dates.");
    }
  };

  // ============================================================
  // Effects
  // ============================================================
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (apiData && apiData.length > 0) {
      setIsLoading(false);
    }
  }, [apiData]);

  // Auto-load on mount
  useEffect(() => {
    const shouldAutoLoad = () => {
      if (autoLoadAttempted || !apiKey || autoLoadRef.current) return false;
      if (cndata?.apiData && cndata.apiData.length > 0 && cndata?._lastFetch) {
        const hoursSinceLastFetch =
          (new Date() - new Date(cndata._lastFetch.timestamp)) /
          (1000 * 60 * 60);
        if (hoursSinceLastFetch < 1) {
          setAutoLoadAttempted(true);
          return false;
        }
      }
      return true;
    };

    if (shouldAutoLoad()) {
      setTimeout(() => fetchCurrentMonthData(false), 1000);
    }
  }, [apiKey, cndata, autoLoadAttempted]);

  // ============================================================
  // Chart Helpers
  // ============================================================
  const getChartData = () => {
    switch (viewMode) {
      case "yearly":
        return data.yearlyData || [];
      case "daily":
        return data.dailyData || [];
      case "weekly":
        return data.weeklyData || [];
      case "monthly":
      default:
        return data.monthlyData || [];
    }
  };

  const getGrowthData = () => {
    if (viewMode === "weekly" && data.allWeeklyGrowthData?.length >= 2) {
      return data.allWeeklyGrowthData;
    }
    if (viewMode === "daily" && data.allDailyGrowthData?.length >= 2) {
      return data.allDailyGrowthData;
    }
    if (viewMode === "yearly" && data.allYearlyGrowthData?.length >= 2) {
      return data.allYearlyGrowthData;
    }
    if (data.allGrowthData?.length >= 2) {
      return data.allGrowthData;
    }
    if (data.growthData?.length >= 2) {
      return data.growthData;
    }
    return [];
  };

  const getGrowthLabel = () => {
    if (viewMode === "yearly") return "Year-over-year";
    if (viewMode === "daily") return "Day-over-day";
    if (viewMode === "weekly") return "Week-over-week";
    return "Month-over-month";
  };

  const chartData = getChartData();
  const growthChartData = getGrowthData();

  // ============================================================
  // Render
  // ============================================================
  if (isLoading || contextLoading) {
    return <LoadingState recordCount={apiData.length} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <Header
          dateRange={dateRange}
          cndata={cndata}
          data={data}
          isRefreshing={isRefreshing}
          isAutoLoading={isAutoLoading}
          isFullscreen={isFullscreen}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          setShowDatePicker={setShowDatePicker}
          handleRefresh={handleRefresh}
          handleExport={handleExport}
          toggleFullscreen={toggleFullscreen}
        />

        <AutoLoadProgress
          isAutoLoading={isAutoLoading}
          autoLoadProgress={autoLoadProgress}
          autoLoadStatus={autoLoadStatus}
        />

        <DatePickerModal
          showDatePicker={showDatePicker}
          setShowDatePicker={setShowDatePicker}
          dateRange={dateRange}
          setDateRange={setDateRange}
          isFetchingRange={isFetchingRange}
          rangeFetchProgress={rangeFetchProgress}
          rangeFetchStatus={rangeFetchStatus}
          handleDateRangeSubmit={handleDateRangeSubmit}
          fetchDataByDateRange={fetchDataByDateRange}
          cancelTokenRef={cancelTokenRef}
          setIsFetchingRange={setIsFetchingRange}
          setRangeFetchProgress={setRangeFetchProgress}
          setRangeFetchStatus={setRangeFetchStatus}
        />

        <FilterBar
          showFilters={showFilters}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          selectedMarketing={selectedMarketing}
          setSelectedMarketing={setSelectedMarketing}
          viewMode={viewMode}
          setViewMode={setViewMode}
          years={years}
          months={months}
          marketingNames={marketingNames}
          apiData={apiData}
          cndata={cndata}
          onResetFilters={handleResetFilters}
        />

        <StatusBar data={data} />
        <GrowthStrategies data={data} />
        <KpiGrid kpiConfig={kpiConfig} />
        <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <OverviewTab
              data={data}
              viewMode={viewMode}
              chartData={chartData}
              growthChartData={growthChartData}
              getGrowthLabel={getGrowthLabel}
              selectedYear={selectedYear}
              selectedMonth={selectedMonth} 
            />
          )}
          {activeTab === "sales" && <SalesTab data={data} viewMode={viewMode} chartData={chartData} />}
          {activeTab === "categories" && <CategoriesTab data={data} />}
          {activeTab === "buyers" && <BuyersTab data={data} />}
          {activeTab === "funnel" && <FunnelTab data={data} />}
          {activeTab === "channels" && <ChannelsTab data={data} />}
          {activeTab === "analytics" && <AnalyticsTab data={data} />}
          {activeTab === "predictive" && <PredictiveTab data={data} />}
          {activeTab === "insights" && <InsightsTab data={data} />}
        </AnimatePresence>

        <Footer apiData={apiData} data={data} />
      </div>
    </div>
  );
}

export default Home;