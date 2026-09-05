// components/home/index.jsx

import React, { useContext, useMemo, useState, useEffect, useRef } from "react";
import { GetDataContext } from "../DataContext";
import { toast } from "react-toastify";
import { AnimatePresence } from "framer-motion";
import axios from "axios";

// Utils
import {
  COLORS,
  API_ENDPOINTS,
  USE_LOCAL_DATA,
} from "./utils/constants";

import commandId1 from "../../api/command1.json";
import commandId5 from "../../api/command2.json";
import commandId3 from "../../api/command3.json";
import commandId15 from "../../api/command15.json";
import {
  formatCurrency,
  formatNumber,
  formatCompactCurrency,
  getStatusColor,
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
import { RiMoneyDollarCircleFill } from "react-icons/ri";
import { TbTruckDelivery } from "react-icons/tb";

const normalizeLocalData = (data) => {
  const formatDateKey = (value) => {
    if (!value) return "";

    const text = String(value).trim();

    // YYYY-MM-DD / YYYY/MM/DD / ISO date
    const match = text.match(
      /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/
    );

    if (match) {
      return `${match[1]}-${String(match[2]).padStart(2, "0")}-${String(
        match[3]
      ).padStart(2, "0")}`;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };

  const filterByDateRange = (data, dateField, startDate, endDate) => {
    if (!Array.isArray(data)) return [];

    const startKey = formatDateKey(startDate);
    const endKey = formatDateKey(endDate);

    return data.filter((item) => {
      const itemKey = formatDateKey(item?.[dateField]);

      if (!itemKey) return false;

      return itemKey >= startKey && itemKey <= endKey;
    });
  };

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.Data)) {
    return data.Data;
  }

  return [];
};

function Home() {
  // ============================================================
  // Context
  // ============================================================
  const {
    cndata,
    setcndata,
    loading: contextLoading,
    apiKey,
  } = useContext(GetDataContext);
  
  const apiData = useMemo(() => cndata?.apiData || [], [cndata]);
  const actualSalesData = useMemo(() => cndata?.actualSalesData || [], [cndata]);
  console.log("🔍 API Data:", apiData);
  if (actualSalesData?.length > 0) {
    console.log("🔍 First Actual Sale:", actualSalesData);
    console.log("🔍 Actual Sale Keys:", Object.keys(actualSalesData[0]));
    console.log("✅ ChallanDate present:", !!actualSalesData[0].ChallanDate);
  }
console.log("cndata:", cndata);
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

  // ============================================================
  // Data - Pass actualSalesData to the hook
  // ============================================================
  const data = useComprehensiveData(
    apiData,
    actualSalesData,
    selectedYear,
    selectedMonth,
    selectedMarketing,
    viewMode,
  );
  console.log("Comprehensive Data:", data);
  console.log("apiData to UseComprehensiveData:", apiData);

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
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
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
  // KPI Config - Updated to use sales from Actual Sales (CommandID=3)
  // ============================================================
  const kpiConfig = useMemo(() => {
    const saleValue = data.totals?.saleValue || 0;
    const saleQty = data.totals?.saleQty || 0;
    const orderValue = data.totals?.orderValue || 0;
    const orderQty = data.totals?.orderQty || 0;
    const balanceQty = data.totals?.balanceQty || 0;
    
    return [
      {
        id: "orders",
        title: "Total Orders",
        value: data.totalOrders || 0,
        icon: FaShoppingCart,
        color: COLORS.primary,
        subtitle: `${data.totalCustomers || 0} customers`,
      },
      {
        id: "orderValue",
        title: "Total Order Value",
        value: formatCurrency(orderValue),
        icon: RiMoneyDollarCircleFill,
        color: COLORS.indigo,
        subtitle: formatCompactCurrency(orderValue),
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
        title: "Actual Sales Revenue",
        value: formatCurrency(saleValue),
        icon: FaMoneyBillWave,
        color: COLORS.emerald,
        subtitle: `Based on ChallanDate (CommandID=3)`,
        growth: data.salesGrowth || 0,
      },
      {
        id: "salesQty",
        title: "Actual Sales Qty",
        value: formatNumber(saleQty),
        icon: TbTruckDelivery,
        color: COLORS.success,
        subtitle: `${(data.deliveryPercent || 0).toFixed(0)}% delivered`,
      },
      {
        id: "balance",
        title: "Balance Qty",
        value: formatNumber(balanceQty),
        icon: FaBoxOpen,
        color: COLORS.danger,
        subtitle: `${orderQty > 0 ? ((balanceQty / orderQty) * 100).toFixed(0) : 0}% pending`,
      },
      {
        id: "deliveryRate",
        title: "Delivery Rate",
        value: `${(data.deliveryPercent || 0).toFixed(0)}%`,
        icon: FaPercentage,
        color: getStatusColor(data.deliveryPercent || 0),
        subtitle: `${(data.valuePercent || 0).toFixed(0)}% value`,
      },
      {
        id: "marketing",
        title: "Sales Persons",
        value: data.totalMarketing || 0,
        icon: FaUserTie,
        color: COLORS.violet,
        subtitle: `active sellers`,
      },
      {
        id: "categories",
        title: "Categories",
        value: data.totalCategories || 0,
        icon: FaTag,
        color: COLORS.teal,
        subtitle: `${data.categoryData?.reduce((sum, c) => sum + (c.subCategories || 0), 0) || 0} sub-categories`,
      },
      {
        id: "buyers",
        title: "Buyers",
        value: data.totalBuyers || 0,
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
  }, [data]);

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
  // ✅ API Functions
  // ============================================================
  const fetchActualSales = async (startDate, endDate, signal) => {
    // ==========================================
    // LOCAL DATA MODE
    // ==========================================
    if (USE_LOCAL_DATA) {
      console.log("🟢 LOCAL MODE: CommandID=3 API OFF");

      const localSales = normalizeLocalData(commandId3);

      console.log(
        `📦 Local CommandID=3 records: ${localSales.length}`
      );

      return localSales.map((item) => ({
        ...item,
        _apiSource: "command3",
        CommandID: 3,
      }));
    }

    // ==========================================
    // ONLINE API MODE
    // ==========================================
    if (!apiKey) {
      console.warn("No API key available for Actual Sales fetch");
      return [];
    }

    try {
      // Format dates for API
      const formatDate = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };
      
      const stDate = formatDate(startDate);
      const edDate = formatDate(endDate);
      
      const url = `${API_ENDPOINTS.actualSales.url}?CompanyID=1&ProductCategoryID=0&ProductSubCategoryID=0&MarketingID=0&CustomerID=0&BuyerID=0&JobCardID=0&StartDate=${stDate}T00:00:00.000Z&EndDate=${edDate}T23:59:59.000Z&CommandID=${API_ENDPOINTS.actualSales.commandId}&EmpID=0`;
      
      console.log(`📡 Fetching Actual Sales (CommandID=3) from ${stDate} to ${edDate}`);
      
      const response = await axios.get(url, {
        headers: { Authorization: `${apiKey}` },
        timeout: 300000,
        signal: signal,
      });
      
      const data = response.data || [];
      console.log(`✅ Actual Sales (CommandID=3): ${data.length} records`);
      
      // Log first record for debugging
      if (data.length > 0) {
        console.log("🔍 First Actual Sales Record:", data[0]);
        console.log("🔍 Actual Sales Keys:", Object.keys(data[0]));
        if (data[0].ChallanDate) {
          console.log("✅ ChallanDate found:", data[0].ChallanDate);
        } else {
          console.warn("⚠️ ChallanDate NOT found in actual sales data");
        }
        if (data[0].ChallanQTY !== undefined) {
          console.log("✅ ChallanQTY found:", data[0].ChallanQTY);
        }
        if (data[0].ChallanValue !== undefined) {
          console.log("✅ ChallanValue found:", data[0].ChallanValue);
        }
      }
      
      return data;
    } catch (err) {
      if (err.name === 'AbortError' || err.name === 'CanceledError') {
        console.log('🛑 Actual Sales fetch cancelled');
        return [];
      }
      console.error('❌ Actual Sales API (CommandID=3) failed:', err.message);
      return [];
    }
  };

  const fetchDataByDateRange = async (startDate, endDate) => {
    // ==========================================
    // LOCAL DATA MODE
    // ==========================================
    if (USE_LOCAL_DATA) {
      console.log("🟢 LOCAL MODE: Date range fetch");

      try {
        setIsLoading(true);
        setIsFetchingRange(true);
        setRangeFetchProgress(0);
        setRangeFetchStatus("Loading selected date range...");

        // ==========================================
        // DATE KEY HELPER
        // ==========================================

        const formatDateKey = (value) => {
          if (!value) return "";

          const text = String(value).trim();

          // YYYY-MM-DD / YYYY/MM/DD / ISO
          const match = text.match(
            /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/
          );

          if (match) {
            return `${match[1]}-${String(match[2]).padStart(2, "0")}-${String(
              match[3]
            ).padStart(2, "0")}`;
          }

          const d = new Date(value);

          if (Number.isNaN(d.getTime())) {
            return "";
          }

          return `${d.getFullYear()}-${String(
            d.getMonth() + 1
          ).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        };

        const startKey = formatDateKey(startDate);
        const endKey = formatDateKey(endDate);

        console.log("=========================================");
        console.log("📅 SELECTED DATE RANGE");
        console.log("Start:", startKey);
        console.log("End:", endKey);
        console.log("=========================================");

        // ==========================================
        // LOAD LOCAL JSON
        // ==========================================

        const allCommand1 = normalizeLocalData(commandId1);
        const allCommand5 = normalizeLocalData(commandId5);
        const allCommand15 = normalizeLocalData(commandId15);
        const allCommand3 = normalizeLocalData(commandId3);

        console.log("📦 TOTAL LOCAL DATA");
        console.log("CommandID=1:", allCommand1.length);
        console.log("CommandID=5:", allCommand5.length);
        console.log("CommandID=15:", allCommand15.length);
        console.log("CommandID=3:", allCommand3.length);

        setRangeFetchProgress(20);

        // ==========================================
        // COMMAND 1
        // ApprovedDate = Order Date
        // ==========================================

        const command1Filtered = allCommand1.filter((item) => {
          const date =
            item.ApprovedDate ||
            item.approvedDate ||
            "";

          const key = formatDateKey(date);

          return key && key >= startKey && key <= endKey;
        });

        // ==========================================
        // COMMAND 3
        // ChallanDate = Actual Sales Date
        // ==========================================

        const command3Filtered = allCommand3.filter((item) => {
          const date =
            item.ChallanDate ||
            item.challanDate ||
            "";

          const key = formatDateKey(date);

          return key && key >= startKey && key <= endKey;
        });

        // ==========================================
        // COMMAND 5
        // ChallanDate = Delivery/Sales Date
        // ==========================================

        const command5Filtered = allCommand5.filter((item) => {
          const date =
            item.ChallanDate ||
            item.challanDate ||
            "";

          const key = formatDateKey(date);

          return key && key >= startKey && key <= endKey;
        });

        // ==========================================
        // COMMAND 15
        // ==========================================

        const command15Filtered = allCommand15.filter((item) => {
          const date =
            item.ApprovedDate ||
            item.approvedDate ||
            item.OrderReceiveDate ||
            item.orderReceiveDate ||
            "";

          const key = formatDateKey(date);

          return key && key >= startKey && key <= endKey;
        });

        // ==========================================
        // CONSOLE - FILTERED DATA ONLY
        // ==========================================

        console.log("=========================================");
        console.log("✅ FILTERED LOCAL DATA");
        console.log("=========================================");

        console.log(
          "🟢 CommandID=1:",
          command1Filtered.length,
          command1Filtered
        );

        console.log(
          "🟡 CommandID=5:",
          command5Filtered.length,
          command5Filtered
        );

        console.log(
          "🔵 CommandID=15:",
          command15Filtered.length,
          command15Filtered
        );

        console.log(
          "🟣 CommandID=3:",
          command3Filtered.length,
          command3Filtered
        );

        console.log("=========================================");

        setRangeFetchProgress(40);

        // ==========================================
        // TAG COMMAND 15
        // ==========================================

        const command15Data = command15Filtered.map((item) => ({
          ...item,

          _apiSource: "command15",
          CommandID: 15,

          OrderReceiveDate:
            item.ApprovedDate ||
            item.approvedDate ||
            item.OrderReceiveDate ||
            "",
        }));

        // ==========================================
        // TAG COMMAND 5
        // ==========================================

        const command5Data = command5Filtered.map((item) => ({
          ...item,

          _apiSource: "command5",
          CommandID: 5,

          OrderReceiveDate: "",
        }));

        // ==========================================
        // TAG COMMAND 1
        // ==========================================

        const command1Data = command1Filtered.map((item) => ({
          ...item,

          _apiSource: "command1",
          CommandID: 1,

          OrderReceiveDate:
            item.ApprovedDate ||
            item.approvedDate ||
            "",
        }));

        // ==========================================
        // TAG COMMAND 3
        // ==========================================

        const command3Data = command3Filtered.map((item) => ({
          ...item,

          _apiSource: "command3",
          CommandID: 3,
        }));

        setRangeFetchProgress(55);

        // ==========================================
        // MERGE BY WORK ORDER
        // ==========================================

        const mergedMap = new Map();

        // ------------------------------------------
        // FIRST: COMMAND 15
        // ------------------------------------------

        command15Data.forEach((item) => {
          const workOrderNo =
            item.WorkOrderNo ||
            item.workOrderNo ||
            "";

          if (!workOrderNo) return;

          mergedMap.set(workOrderNo, {
            ...item,

            WorkOrderNo: workOrderNo,

            _apiSource: "command15",
            CommandID: 15,

            TotalBreakDownQTY:
              Number(
                item.TotalBreakDownQTY ||
                item.OrderQTY ||
                item.BreakDownQTY ||
                0
              ),

            TotalOrderValue:
              Number(
                item.TotalOrderValue ||
                item.OrderValue ||
                0
              ),

            ChallanQTY: 0,
            ChallanValue: 0,

            BalanceQTY: 0,
            BalanceValue: 0,
          });
        });

        // ------------------------------------------
        // SECOND: COMMAND 5
        // ------------------------------------------

        command5Data.forEach((item) => {
          const workOrderNo =
            item.WorkOrderNo ||
            item.workOrderNo ||
            "";

          if (!workOrderNo) return;

          const existing = mergedMap.get(workOrderNo);

          if (existing) {
            if (!existing.CName && item.CName) {
              existing.CName = item.CName;
            }

            if (!existing.BuyerName && item.BuyerName) {
              existing.BuyerName = item.BuyerName;
            }

            if (!existing.MarketingName && item.MarketingName) {
              existing.MarketingName = item.MarketingName;
            }

            if (
              !existing.ProductCategoryName &&
              item.ProductCategoryName
            ) {
              existing.ProductCategoryName =
                item.ProductCategoryName;
            }

            if (
              !existing.ProductSubCategoryName &&
              item.ProductSubCategoryName
            ) {
              existing.ProductSubCategoryName =
                item.ProductSubCategoryName;
            }

            existing.ChallanQTY =
              Number(existing.ChallanQTY || 0) +
              Number(item.ChallanQTY || 0);

            existing.ChallanValue =
              Number(existing.ChallanValue || 0) +
              Number(item.ChallanValue || 0);

            if (item.ChallanDate) {
              existing.ChallanDate = item.ChallanDate;
            }

            if (item.ChallanNo) {
              existing.ChallanNo = item.ChallanNo;
            }

            if (item.CustomerPINo) {
              existing.CustomerPINo = item.CustomerPINo;
            }

            if (item.CustomerPONo) {
              existing.CustomerPONo = item.CustomerPONo;
            }

            if (item.JobCardNo) {
              existing.JobCardNo = item.JobCardNo;
            }

            if (item.ItemDescription) {
              existing.ItemDescription =
                item.ItemDescription;
            }

            if (item.Unit) {
              existing.Unit = item.Unit;
            }

            if (item.UnitPrice !== undefined) {
              existing.UnitPrice =
                Number(item.UnitPrice) || 0;
            }

            if (item.DeliveryToAddress) {
              existing.DeliveryToAddress =
                item.DeliveryToAddress;
            }

            existing._apiSource =
              "command15+command5";

            existing._merged = true;
          }
        });

        // ------------------------------------------
        // THIRD: COMMAND 1
        // ------------------------------------------

        command1Data.forEach((item) => {
          const workOrderNo =
            item.WorkOrderNo ||
            item.workOrderNo ||
            "";

          if (!workOrderNo) return;

          const approvedDate =
            item.ApprovedDate ||
            item.approvedDate ||
            "";

          const existing = mergedMap.get(workOrderNo);

          if (existing) {
            existing.ApprovedDate = approvedDate;

            existing.OrderReceiveDate =
              approvedDate;

            existing._apiSource =
              `${existing._apiSource}+command1`;

            existing.CommandID = 1;

            existing._merged = true;
          } else {
            mergedMap.set(workOrderNo, {
              ...item,

              WorkOrderNo: workOrderNo,

              ApprovedDate: approvedDate,

              OrderReceiveDate: approvedDate,

              TotalBreakDownQTY: 0,
              TotalOrderValue: 0,

              ChallanQTY: 0,
              ChallanValue: 0,

              BalanceQTY: 0,
              BalanceValue: 0,

              ProductCategoryName:
                item.ProductCategoryName ||
                "Uncategorized",

              ProductSubCategoryName:
                item.ProductSubCategoryName ||
                "",

              MarketingName:
                item.MarketingName ||
                "Unknown",

              CName:
                item.CName ||
                item.CustomerName ||
                "Unknown",

              BuyerName:
                item.BuyerName ||
                "Unknown",

              _apiSource: "command1",

              CommandID: 1,

              _merged: false,
            });
          }
        });

        setRangeFetchProgress(75);

        // ==========================================
        // FINAL CALCULATIONS
        // ==========================================

        const mergedData =
          Array.from(mergedMap.values()).map((item) => {
            const orderQty =
              Number(item.TotalBreakDownQTY) || 0;

            const orderValue =
              Number(item.TotalOrderValue) || 0;

            const challanQty =
              Number(item.ChallanQTY) || 0;

            const challanValue =
              Number(item.ChallanValue) || 0;

            return {
              ...item,

              BreakDownQTY: orderQty,

              TotalBreakDownQTY: orderQty,

              TotalOrderValue: orderValue,

              ChallanQTY: challanQty,

              ChallanValue: challanValue,

              BalanceQTY: Math.max(
                0,
                orderQty - challanQty
              ),

              BalanceValue: Math.max(
                0,
                orderValue - challanValue
              ),
            };
          });

        // ==========================================
        // FINAL CONSOLE
        // ==========================================

        console.log("=========================================");
        console.log("🎯 FINAL DATE RANGE RESULT");
        console.log("=========================================");

        console.log(
          "📅 Range:",
          startKey,
          "→",
          endKey
        );

        console.log(
          "🟢 CommandID=1:",
          command1Data.length
        );

        console.log(
          "🟡 CommandID=5:",
          command5Data.length
        );

        console.log(
          "🔵 CommandID=15:",
          command15Data.length
        );

        console.log(
          "🟣 CommandID=3:",
          command3Data.length
        );

        console.log(
          "🔗 Final unique WorkOrders:",
          mergedData.length
        );

        console.log(
          "📊 FINAL MERGED DATA:",
          mergedData
        );

        console.log("=========================================");

        // ==========================================
        // SAVE TO CONTEXT
        // ==========================================

        setcndata((prevState) => ({
          ...prevState,

          apiData: mergedData,

          actualSalesData: command3Data,

          groupedData: [],

          workOrderIdMap: {},

          challanReceiveMap: {},

          workOrderStatus:
            "date-range-loaded",

          _lastFetch: {
            timestamp:
              new Date().toISOString(),

            startDate: startKey,

            endDate: endKey,

            orderCount:
              mergedData.length,

            primaryCount:
              command1Data.length,

            secondaryCount:
              command5Data.length,

            orderMasterCount:
              command15Data.length,

            actualSalesCount:
              command3Data.length,

            workOrderStatus:
              "date-range-loaded",

            autoLoaded: false,

            dateRange: true,

            apiUsed:
              "local-command1-command5-command15-command3",
          },
        }));

        setRangeFetchProgress(100);

        setRangeFetchStatus(
          `✅ Loaded ${mergedData.length} orders + ${command3Data.length} actual sales from ${startKey} to ${endKey}`
        );

        setSelectedYear("All");
        setSelectedMonth("All");

        if (command3Data.length > 0) {
          toast.success(
            `✅ Loaded ${mergedData.length} orders + ${command3Data.length} actual sales`
          );
        } else {
          toast.warning(
            `✅ Loaded ${mergedData.length} orders but no actual sales found`
          );
        }

      } catch (error) {
        console.error(
          "❌ Local date range error:",
          error
        );

        setRangeFetchStatus(
          "❌ Local data loading failed"
        );

        toast.error(
          "Failed to load selected date range."
        );
      } finally {
        setIsLoading(false);
        setIsFetchingRange(false);
        setRangeFetchProgress(0);
        setTimeout(() => {
          setRangeFetchStatus("");
        }, 3000);
      }

      return;
    }

    // ==========================================
    // ONLINE API MODE
    // ==========================================

    if (!apiKey) {
      toast.error("API key not available");
      setIsLoading(false);
      setIsFetchingRange(false);
      setRangeFetchProgress(0);
      setRangeFetchStatus("");
      return;
    }

    if (cancelTokenRef.current) {
      cancelTokenRef.current.abort();
      cancelTokenRef.current = null;
    }

    setIsLoading(true);
    setIsFetchingRange(true);
    setRangeFetchProgress(0);
    setRangeFetchStatus("Preparing to fetch data...");

    const formatLocalDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const stDate = formatLocalDate(startDate);
    const edDate = formatLocalDate(endDate);

    console.log("📅 Selected Dates:", stDate, "to", edDate);

    setShowDatePicker(false);
    setIsFetchingRange(true);
    setRangeFetchProgress(0);
    setRangeFetchStatus("Preparing to fetch data...");

    const controller = new AbortController();
    const signal = controller.signal;
    cancelTokenRef.current = controller;

    try {
      setRangeFetchProgress(10);
      setRangeFetchStatus("Fetching approved order data...");

      const primaryResponse = await axios.get(
        `${API_ENDPOINTS.primary.url}?CompanyID=1&ProductCategoryID=0&ProductSubCategoryID=0&MarketingID=0&CustomerID=0&BuyerID=0&StartDate=${stDate}&EndDate=${edDate}&CommandID=${API_ENDPOINTS.primary.commandId}&EmpID=0`,
        {
          headers: { Authorization: `${apiKey}` },
          timeout: 300000,
          signal: signal,
        },
      );

      const primaryData = Array.isArray(primaryResponse.data)
        ? primaryResponse.data
        : [];

      console.log("🟢 CommandID=1 records:", primaryData.length);

      if (primaryData.length === 0) {
        toast.warning(
          `No approved order data found for ${stDate} to ${edDate}.`,
        );
        setIsFetchingRange(false);
        setRangeFetchStatus("");
        setIsLoading(false);
        return;
      }

      setRangeFetchProgress(25);
      setRangeFetchStatus("Fetching delivery data...");

      let secondaryData = [];

      try {
        const secondaryResponse = await axios.get(
          `${API_ENDPOINTS.secondary.url}?CompanyID=1&ProductCategoryID=0&ProductSubCategoryID=0&MarketingID=0&CustomerID=0&BuyerID=0&JobCardID=0&StartDate=${stDate}&EndDate=${edDate}&CommandID=${API_ENDPOINTS.secondary.commandId}&EmpID=0`,
          {
            headers: { Authorization: `${apiKey}` },
            timeout: 300000,
            signal: signal,
          },
        );

        secondaryData = Array.isArray(secondaryResponse.data)
          ? secondaryResponse.data
          : [];
      } catch (secondaryErr) {
        if (secondaryErr.name === 'AbortError') throw secondaryErr;
        console.warn("⚠️ CommandID=5 API failed:", secondaryErr);
      }

      console.log("🟡 CommandID=5 records:", secondaryData.length);

      setRangeFetchProgress(40);
      setRangeFetchStatus("Fetching order master data...");

      let orderMasterData = [];

      try {
        const orderMasterResponse = await axios.get(
          `${API_ENDPOINTS.orderMaster.url}?CompanyID=1&ProductCategoryID=0&ProductSubCategoryID=0&MarketingID=0&CustomerID=0&BuyerID=0&JobCardID=0&StartDate=${stDate}T00:00:00.000Z&EndDate=${edDate}T06:00:00.000Z&CommandID=${API_ENDPOINTS.orderMaster.commandId}&EmpID=0`,
          {
            headers: { Authorization: `${apiKey}` },
            timeout: 300000,
            signal: signal,
          },
        );

        orderMasterData = Array.isArray(orderMasterResponse.data)
          ? orderMasterResponse.data
          : [];
      } catch (orderMasterErr) {
        if (orderMasterErr.name === 'AbortError') throw orderMasterErr;
        console.warn("⚠️ CommandID=15 API failed:", orderMasterErr);
      }

      console.log("🔵 CommandID=15 records:", orderMasterData.length);

      // 4. Fetch Actual Sales Data (CommandID=3)
      setRangeFetchProgress(50);
      setRangeFetchStatus("Fetching actual sales data (CommandID=3)...");

      const actualSalesDataResponse = await fetchActualSales(stDate, edDate, signal);
      console.log("🟣 Actual Sales (CommandID=3):", actualSalesDataResponse.length);

      setRangeFetchProgress(55);
      setRangeFetchStatus("Processing actual sales data...");

      // Tag each API
      const command1Data = primaryData.map((item) => ({
        ...item,
        _apiSource: "command1",
        OrderReceiveDate: item.ApprovedDate || item.approvedDate || "",
      }));

      const command5Data = secondaryData.map((item) => ({
        ...item,
        _apiSource: "command5",
        OrderReceiveDate: "",
      }));

      const command15Data = orderMasterData.map((item) => ({
        ...item,
        _apiSource: "command15",
        OrderReceiveDate: "",
      }));

      console.log("🟢 Tagged CommandID=1:", command1Data.length);
      console.log("🟡 Tagged CommandID=5:", command5Data.length);
      console.log("🔵 Tagged CommandID=15:", command15Data.length);
      console.log("🟣 Actual Sales (CommandID=3):", actualSalesDataResponse.length);

      setRangeFetchProgress(65);
      setRangeFetchStatus("Merging data sources...");

      const mergedMap = new Map();

      // First: CommandID=15 - Order MASTER
      command15Data.forEach((item) => {
        const orderNo = item.WorkOrderNo || item.workOrderNo || "";
        if (!orderNo) return;

        if (!mergedMap.has(orderNo)) {
          mergedMap.set(orderNo, {
            ...item,
            OrderReceiveDate: "",
            TotalBreakDownQTY: Number(item.TotalBreakDownQTY) || 0,
            TotalOrderValue: Number(item.TotalOrderValue) || 0,
            ChallanQTY: 0,
            ChallanValue: 0,
            BalanceQTY: 0,
            BalanceValue: 0,
            _apiSource: "command15",
            _merged: false,
          });
        }
      });

      // Second: CommandID=5 - Delivery / Product details
      let secondaryMergedCount = 0;

      command5Data.forEach((item) => {
        const orderNo = item.WorkOrderNo || item.workOrderNo || "";
        if (!orderNo) return;

        if (mergedMap.has(orderNo)) {
          const existing = mergedMap.get(orderNo);

          if (!existing.CName && item.CName) {
            existing.CName = item.CName;
          }
          if (!existing.BuyerName && item.BuyerName) {
            existing.BuyerName = item.BuyerName;
          }
          if (!existing.MarketingName && item.MarketingName) {
            existing.MarketingName = item.MarketingName;
          }
          if (!existing.ProductCategoryName && item.ProductCategoryName) {
            existing.ProductCategoryName = item.ProductCategoryName;
          }
          if (!existing.ProductSubCategoryName && item.ProductSubCategoryName) {
            existing.ProductSubCategoryName = item.ProductSubCategoryName;
          }

          existing.ChallanQTY =
            Number(existing.ChallanQTY || 0) + Number(item.ChallanQTY || 0);
          existing.ChallanValue =
            Number(existing.ChallanValue || 0) + Number(item.ChallanValue || 0);

          if (item.ChallanDate) {
            existing.ChallanDate = item.ChallanDate;
          }
          if (item.ChallanNo) {
            existing.ChallanNo = item.ChallanNo;
          }
          if (item.CustomerPINo) {
            existing.CustomerPINo = item.CustomerPINo;
          }
          if (item.CustomerPONo) {
            existing.CustomerPONo = item.CustomerPONo;
          }
          if (item.JobCardNo) {
            existing.JobCardNo = item.JobCardNo;
          }
          if (item.ItemDescription) {
            existing.ItemDescription = item.ItemDescription;
          }
          if (item.Unit) {
            existing.Unit = item.Unit;
          }
          if (item.UnitPrice !== undefined) {
            existing.UnitPrice = Number(item.UnitPrice) || 0;
          }
          if (item.DeliveryToAddress) {
            existing.DeliveryToAddress = item.DeliveryToAddress;
          }

          existing._apiSource = "command15+command5";
          existing._merged = true;
          secondaryMergedCount++;
        }
      });

      // Third: CommandID=1 - ONLY ApprovedDate
      let primaryMergedCount = 0;
      let primaryOnlyCount = 0;

      command1Data.forEach((item) => {
        const orderNo = item.WorkOrderNo || item.workOrderNo || "";
        if (!orderNo) return;

        const approvedDate = item.ApprovedDate || item.approvedDate || "";

        if (mergedMap.has(orderNo)) {
          const existing = mergedMap.get(orderNo);
          existing.OrderReceiveDate = approvedDate;
          existing.ApprovedDate = approvedDate;
          existing._apiSource = `${existing._apiSource}+command1`;
          existing._merged = true;
          primaryMergedCount++;
        } else {
          mergedMap.set(orderNo, {
            ...item,
            WorkOrderNo: orderNo,
            OrderReceiveDate: approvedDate,
            ApprovedDate: approvedDate,
            TotalBreakDownQTY: 0,
            TotalOrderValue: 0,
            ChallanQTY: 0,
            ChallanValue: 0,
            BalanceQTY: 0,
            BalanceValue: 0,
            ProductCategoryName: item.ProductCategoryName || "Uncategorized",
            ProductSubCategoryName: item.ProductSubCategoryName || "",
            MarketingName: item.MarketingName || "Unknown",
            CName: item.CName || item.CustomerName || "Unknown",
            BuyerName: item.BuyerName || "Unknown",
            _apiSource: "command1",
            _merged: false,
          });
          primaryOnlyCount++;
        }
      });

      // Final calculations
      const mergedData = Array.from(mergedMap.values()).map((item) => {
        const orderQty = Number(item.TotalBreakDownQTY) || 0;
        const orderValue = Number(item.TotalOrderValue) || 0;
        const challanQty = Number(item.ChallanQTY) || 0;
        const challanValue = Number(item.ChallanValue) || 0;

        return {
          ...item,
          BreakDownQTY: orderQty,
          TotalBreakDownQTY: orderQty,
          TotalOrderValue: orderValue,
          ChallanQTY: challanQty,
          ChallanValue: challanValue,
          BalanceQTY: Math.max(0, orderQty - challanQty),
          BalanceValue: Math.max(0, orderValue - challanValue),
        };
      });

      console.log("==========================================");
      console.log("✅ FINAL MERGED DATA");
      console.log("CommandID=1:", primaryData.length);
      console.log("CommandID=5:", secondaryData.length);
      console.log("CommandID=15:", orderMasterData.length);
      console.log("CommandID=3 (Actual Sales):", actualSalesDataResponse.length);
      console.log("Final unique WorkOrders:", mergedData.length);
      console.log("==========================================");

      setRangeFetchProgress(85);

      // Store both order data AND actual sales data in context
      setcndata((prevState) => ({
        ...prevState,
        apiData: mergedData,
        actualSalesData: actualSalesDataResponse,
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
          orderMasterCount: orderMasterData.length,
          actualSalesCount: actualSalesDataResponse.length,
          mergedCount: primaryMergedCount,
          primaryOnlyCount: primaryOnlyCount,
          workOrderStatus: "date-range-loaded",
          autoLoaded: false,
          dateRange: true,
          apiUsed: "command1-command5-command15-actualSales",
        },
      }));

      setRangeFetchProgress(100);
      setRangeFetchStatus(
        `✅ Loaded ${mergedData.length} orders + ${actualSalesDataResponse.length} actual sales from ${stDate} to ${edDate}!`,
      );
      
      if (actualSalesDataResponse.length > 0) {
        toast.success(
          `✅ Loaded ${mergedData.length} orders + ${actualSalesDataResponse.length} actual sales`,
        );
      } else {
        toast.warning(
          `✅ Loaded ${mergedData.length} orders but NO actual sales data found`,
        );
      }

      setSelectedYear("All");
      setSelectedMonth("All");
      setIsLoading(false);
      setIsAutoLoading(false);
    } catch (err) {
      if (err.name === 'AbortError' || err.name === 'CanceledError') {
        console.log("🛑 Date range request cancelled");
        setRangeFetchStatus("🛑 Request cancelled");
        setIsAutoLoading(false);
        return;
      }

      console.error("Date range fetch error:", err);
      toast.error("Failed to fetch data for the selected date range.");
      setRangeFetchStatus("❌ Error fetching data");
      setIsLoading(false);
      setIsAutoLoading(false);
    } finally {
      setIsLoading(false);
      setIsFetchingRange(false);
      setRangeFetchProgress(0);
      cancelTokenRef.current = null;
      setTimeout(() => {
        setRangeFetchStatus("");
        setIsAutoLoading(false);
      }, 3000);
    }
  };

  const fetchCurrentMonthData = async (force = false) => {
    // ==========================================
    // LOCAL DATA MODE
    // ==========================================
    if (USE_LOCAL_DATA) {
      console.log("🟢 LOCAL MODE: Loading saved JSON files");

      try {
        setIsLoading(true);
        setAutoLoadStatus("Loading local data...");
        setAutoLoadProgress(20);

        const primaryData = normalizeLocalData(commandId1);
        const secondaryData = normalizeLocalData(commandId5);
        const actualSales = normalizeLocalData(commandId3);

        console.log("📦 CommandID=1:", primaryData.length);
        console.log("📦 CommandID=5:", secondaryData.length);
        console.log("📦 CommandID=3:", actualSales.length);

        // ------------------------------------------
        // Merge logic
        // ------------------------------------------

        const primaryMap = new Map();

        primaryData.forEach((item) => {
          const workOrderNo =
            item.WorkOrderNo ||
            item.workOrderNo ||
            "";

          if (!workOrderNo) return;

          primaryMap.set(workOrderNo, {
            ...item,
            _apiSource: "command1",
            CommandID: 1,

            OrderReceiveDate:
              item.ApprovedDate ||
              item.approvedDate ||
              "",
          });
        });

        secondaryData.forEach((item) => {
          const workOrderNo =
            item.WorkOrderNo ||
            item.workOrderNo ||
            "";

          if (!workOrderNo) return;

          const existing = primaryMap.get(workOrderNo);

          if (existing) {
            primaryMap.set(workOrderNo, {
              ...existing,
              ...item,

              OrderReceiveDate:
                existing.ApprovedDate ||
                existing.approvedDate ||
                "",
              
              _apiSource: "command1+command5",
              CommandID: 5,
            });
          } else {
            primaryMap.set(workOrderNo, {
              ...item,
              _apiSource: "command5",
              CommandID: 5,
              OrderReceiveDate: "",
            });
          }
        });

        const mergedData = Array.from(primaryMap.values());

        setAutoLoadProgress(80);

       setcndata({ 
        apiData: mergedData,
        actualSalesData: actualSales,
      });

        setAutoLoadProgress(100);
        setAutoLoadStatus("Local data loaded");

        console.log("✅ LOCAL DATA LOADED");
        console.log("Final records:", mergedData.length);

      } catch (error) {
        console.error("❌ Local data error:", error);
        setAutoLoadStatus("Local data loading failed");
      } finally {
        setIsLoading(false);
        setAutoLoadProgress(100);
      }

      return;
    }

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

    const controller = new AbortController();
    const signal = controller.signal;
    cancelTokenRef.current = controller;

    try {
      const { stDate, edDate, month, year } = getCurrentMonthDates();
      setAutoLoadProgress(5);
      setAutoLoadStatus(`Fetching orders for ${month} ${year}...`);

      // 1. Fetch Primary Order Data (CommandID=1)
      setAutoLoadProgress(10);
      setAutoLoadStatus("Fetching order data...");
      
      const primaryResponse = await axios.get(
        `${API_ENDPOINTS.primary.url}?CompanyID=1&ProductCategoryID=0&ProductSubCategoryID=0&MarketingID=0&CustomerID=0&BuyerID=0&StartDate=${stDate}&EndDate=${edDate}&CommandID=${API_ENDPOINTS.primary.commandId}&EmpID=0`,
        {
          headers: { Authorization: `${apiKey}` },
          timeout: 300000,
          signal: signal,
        },
      );

      const primaryData = primaryResponse.data || [];
      setAutoLoadProgress(25);

      if (!Array.isArray(primaryData) || primaryData.length === 0) {
        toast.warning(`No order data found for ${stDate} to ${edDate}.`);
        setIsLoading(false);
        setIsAutoLoading(false);
        setIsFetchingRange(false);
        setRangeFetchStatus("");
        return;
      }

      setAutoLoadProgress(30);
      setAutoLoadStatus(`Found ${primaryData.length} orders from primary API...`);

      // 2. Fetch Secondary Data (CommandID=5)
      setAutoLoadProgress(40);
      setAutoLoadStatus("Fetching supporting data from secondary API...");

      let secondaryData = [];
      try {
        const secondaryResponse = await axios.get(
          `${API_ENDPOINTS.secondary.url}?CompanyID=1&ProductCategoryID=0&ProductSubCategoryID=0&MarketingID=0&CustomerID=0&BuyerID=0&JobCardID=0&StartDate=${stDate}&EndDate=${edDate}&CommandID=${API_ENDPOINTS.secondary.commandId}&EmpID=0`,
          {
            headers: { Authorization: `${apiKey}` },
            timeout: 300000,
            signal: signal,
          },
        );
        secondaryData = secondaryResponse.data || [];
      } catch (secondaryErr) {
        if (secondaryErr.name === 'AbortError') throw secondaryErr;
        console.warn("Secondary API fetch failed:", secondaryErr);
      }

      setAutoLoadProgress(50);
      setAutoLoadStatus(`Found ${secondaryData.length} records from secondary API...`);

      // 3. Fetch Actual Sales Data (CommandID=3)
      setAutoLoadProgress(55);
      setAutoLoadStatus("Fetching actual sales data (CommandID=3)...");
      
      const actualSales = await fetchActualSales(stDate, edDate, signal);
      
      setAutoLoadProgress(65);
      setAutoLoadStatus(`Found ${actualSales.length} actual sales records...`);

      // 4. Merge Data
      setAutoLoadProgress(70);
      setAutoLoadStatus("Merging data from all APIs...");

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

      setAutoLoadProgress(80);
      setAutoLoadStatus(`Merged ${mergedData.length} unique orders...`);

      setAutoLoadProgress(90);
      setAutoLoadStatus("Updating dashboard...");

      // Store both order data AND actual sales data in context
      setcndata((prevState) => ({
        ...prevState,
        apiData: mergedData,
        actualSalesData: actualSales,
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
          actualSalesCount: actualSales.length,
          mergedCount: mergedCount,
          workOrderStatus: "auto-loaded",
          autoLoaded: true,
          apiUsed: "merged-primary-secondary-actualSales",
        },
      }));

      setIsLoading(false);
      setAutoLoadProgress(100);
      setAutoLoadStatus(
        `✅ Loaded ${mergedData.length} orders + ${actualSales.length} actual sales records for ${month} ${year}!`,
      );
      setAutoLoadAttempted(true);
      
      if (actualSales.length > 0) {
        toast.success(
          `✅ Loaded ${mergedData.length} orders + ${actualSales.length} sales for ${month} ${year}`,
        );
      } else {
        toast.warning(
          `✅ Loaded ${mergedData.length} orders but NO actual sales data found for ${month} ${year}`,
        );
      }

      setIsLoading(false);
    } catch (err) {
      if (err.name === 'AbortError' || err.name === 'CanceledError') {
        setIsAutoLoading(false);
        return;
      }
      console.error("Date range fetch error:", err);
      toast.error("Failed to fetch data for the selected date range.");
      setAutoLoadStatus("❌ Error fetching data");
      setIsLoading(false);
      setIsAutoLoading(false);
    } finally {
      setIsFetchingRange(false);
      setRangeFetchProgress(0);
      cancelTokenRef.current = null;
      setTimeout(() => setAutoLoadStatus(""), 3000);
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

  // ============================================================
  // Auto-load on mount - FIXED (no infinite loops)
  // ============================================================
  useEffect(() => {
    let isMounted = true;
    let timeoutId = null;

    const shouldAutoLoad = () => {
      // Skip if already attempted or currently loading
      if (autoLoadAttempted || autoLoadRef.current || isAutoLoading) {
        return false;
      }

      // Skip if no API key (and not in local mode)
      if (!USE_LOCAL_DATA && !apiKey) {
        setAutoLoadAttempted(true);
        return false;
      }

      // Skip if data exists and is recent (less than 1 hour old)
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

    // Only run if not loaded yet
    if (shouldAutoLoad()) {
      autoLoadRef.current = true; // Prevent re-triggering
      timeoutId = setTimeout(() => {
        if (isMounted) {
          fetchCurrentMonthData(false);
        }
      }, 1000);
    }

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      if (cancelTokenRef.current) {
        cancelTokenRef.current.abort();
        cancelTokenRef.current = null;
      }
    };
  }, [apiKey]); // ← Only depends on apiKey, not cndata

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
              apiData={apiData}
              viewMode={viewMode}
              chartData={chartData}
              growthChartData={growthChartData}
              getGrowthLabel={getGrowthLabel}
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              selectedMarketing={selectedMarketing}
              dateRange={dateRange}
            />
          )}
          {activeTab === "sales" && (
            <SalesTab data={data} viewMode={viewMode} chartData={chartData} />
          )}
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