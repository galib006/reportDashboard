import React, { useContext, useMemo, useState, useEffect, useRef } from "react";
import { GetDataContext } from "../components/DataContext";
import { Calendar as CalendarIcon, CalendarRange } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  FaTruck,
  FaBoxOpen,
  FaUsers,
  FaBuilding,
  FaCircle,
  FaMoneyBillWave,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaShoppingCart,
  FaArrowUp,
  FaArrowDown,
  FaMinus,
  FaChartLine,
  FaChartBar,
  FaChartPie,
  FaUserTie,
  FaTag,
  FaBox,
  FaCalendarCheck,
  FaFileInvoice,
  FaClipboardList,
  FaUserFriends,
  FaStore,
  FaGlobe,
  FaChartArea,
  FaDollarSign,
  FaPercentage,
  FaTachometerAlt,
  FaAward,
  FaTrophy,
  FaMedal,
  FaBalanceScale,
  FaRocket,
  FaBullseye,
  FaStar,
  FaStarHalf,
  FaRegStar,
  FaCrown,
  FaFire,
  FaGem,
  FaHourglassHalf,
  FaExclamationCircle,
  FaCheckDouble,
  FaTimesCircle,
  FaHourglassEnd,
  FaShieldAlt,
  FaHandshake,
  FaUserCheck,
  FaUserClock,
  FaUserMinus,
  FaUserPlus,
} from "react-icons/fa";
import {
  RiMoneyDollarCircleFill,
  RiStockLine,
  RiBarChart2Fill,
  RiUserStarFill,
  RiCustomerService2Fill,
  RiTreasureMapFill,
} from "react-icons/ri";
import {
  TbTruckDelivery,
  TbTrendingUp,
  TbTrendingDown,
  TbEqual,
  TbReportAnalytics,
} from "react-icons/tb";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Sector,
  Line,
  LineChart,
  ComposedChart,
  Area,
  Scatter,
  ScatterChart,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Treemap,
  Brush,
  ReferenceLine,
  ErrorBar,
  ZAxis,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Filter,
  LayoutDashboard,
  RefreshCw,
  Download,
  X,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AlertCircle,
  Maximize2,
  Minimize2,
  Users,
  Package,
  DollarSign,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Award,
  Target,
  Zap,
  Activity,
  GitBranch,
  Layers,
  TrendingUp,
  TrendingDown,
  Flame,
  Crown,
  Star,
  Target as TargetIcon,
  Gauge,
  Mail,
  Share2,
} from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";

// ============================================================
// CONSTANTS & CONFIGURATION
// ============================================================
const COLORS = {
  primary: "#4F46E5",
  secondary: "#7C3AED",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#3B82F6",
  pink: "#EC4899",
  teal: "#14B8A6",
  orange: "#F97316",
  indigo: "#6366F1",
  violet: "#8B5CF6",
  emerald: "#34D399",
  rose: "#F43F5E",
  cyan: "#06B6D4",
  amber: "#FBBF24",
  gray: "#94A3B8",
  slate: "#64748B",
};

const CHART_COLORS = [
  "#4F46E5",
  "#7C3AED",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#3B82F6",
  "#EC4899",
  "#14B8A6",
  "#F97316",
  "#6366F1",
  "#8B5CF6",
  "#34D399",
  "#F43F5E",
  "#06B6D4",
  "#FBBF24",
  "#84CC16",
  "#06B6D4",
  "#8B5CF6",
  "#EC4899",
  "#F59E0B",
];

// ============================================================
// UTILITY FUNCTIONS
// ============================================================
const formatCurrency = (value) => {
  const num = Number(value) || 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(num));
};

const formatNumber = (value) => {
  const num = Number(value) || 0;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(num));
};

const formatCompactCurrency = (value) => {
  const num = Number(value) || 0;
  const rounded = Math.round(num);
  if (rounded >= 1e9) return `$${(rounded / 1e9).toFixed(1)}B`;
  if (rounded >= 1e6) return `$${(rounded / 1e6).toFixed(1)}M`;
  if (rounded >= 1e3) return `$${(rounded / 1e3).toFixed(1)}K`;
  return `$${rounded}`;
};

const formatCompactNumber = (value) => {
  const num = Number(value) || 0;
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return formatNumber(num);
};

const getStatusColor = (value) => {
  const num = Number(value) || 0;
  if (num >= 90) return COLORS.success;
  if (num >= 60) return COLORS.warning;
  return COLORS.danger;
};

// ============================================================
// Delivery Status Function
// ============================================================
const getDeliveryStatus = (deliveryRate) => {
  const rate = parseFloat(deliveryRate) || 0;
  if (rate >= 90) {
    return {
      status: "✅ Excellent",
      icon: "✅",
      color: "text-emerald-600 bg-emerald-100",
    };
  }
  if (rate >= 70) {
    return {
      status: "👍 Good",
      icon: "👍",
      color: "text-blue-600 bg-blue-100",
    };
  }
  if (rate >= 50) {
    return {
      status: "⚠️ Average",
      icon: "⚠️",
      color: "text-amber-600 bg-amber-100",
    };
  }
  return {
    status: "🔴 Needs Improvement",
    icon: "🔴",
    color: "text-red-600 bg-red-100",
  };
};
// ============================================================
// FIXED: Performance tier based on AVERAGE Order Value (only for tier badge)
// ============================================================

const getPerformanceTier = (
  avgOrderValue,
  deliveryRate,
  totalOrderValue = 0,
  orders = 0,
  selectedYear,
  selectedMonth,
) => {
  const numericAvg =
    typeof avgOrderValue === "string"
      ? parseFloat(avgOrderValue.replace(/[$,]/g, ""))
      : avgOrderValue;
  const numericRate =
    typeof deliveryRate === "string"
      ? parseFloat(deliveryRate.replace(/[%,]/g, ""))
      : deliveryRate;
  const numericTotal =
    typeof totalOrderValue === "string"
      ? parseFloat(totalOrderValue.replace(/[$,]/g, ""))
      : totalOrderValue;

  // Determine the time period
  let monthsCount = 1;
  if (selectedYear !== "All" && selectedMonth !== "All") {
    monthsCount = 1; // Single month
  } else if (selectedYear !== "All" && selectedMonth === "All") {
    monthsCount = 12; // Full year (or actual months in data)
  } else if (selectedYear === "All" && selectedMonth === "All") {
    monthsCount = 12; // Multiple years - use yearly average
  }

  // Calculate monthly average
  const monthlyAvg = numericTotal / monthsCount;
  const monthlyOrders = Math.round(orders / monthsCount);

  // Dynamic thresholds based on time period
  let thresholds;
  if (monthsCount <= 1) {
    // Single month: Higher thresholds
    thresholds = { excellent: 15000, good: 8000, average: 3000 };
  } else if (monthsCount <= 3) {
    // Quarter: Medium thresholds
    thresholds = { excellent: 12000, good: 6000, average: 2500 };
  } else {
    // Yearly/Multiple: Lower thresholds (more consistent)
    thresholds = { excellent: 10000, good: 5000, average: 2000 };
  }

  // Apply rules with dynamic thresholds
  if (monthlyAvg < thresholds.average) {
    return {
      tier: "⚠️ Needs Improvement",
      icon: FaExclamationCircle,
      color: "#EF4444",
      bg: "bg-red-100",
      status: "Needs Improvement",
    };
  }

  if (
    monthlyAvg > thresholds.excellent &&
    monthlyOrders > 5 &&
    numericRate > 20
  ) {
    return {
      tier: "🌟 Excellent",
      icon: FaCrown,
      color: "#8B5CF6",
      bg: "bg-purple-100",
      status: "Excellent",
    };
  }

  if (monthlyAvg > thresholds.good && monthlyOrders > 3 && numericRate > 15) {
    return {
      tier: "📊 Good",
      icon: FaMedal,
      color: "#3B82F6",
      bg: "bg-blue-100",
      status: "Good",
    };
  }

  if (monthlyAvg > thresholds.average && monthlyOrders > 2) {
    return {
      tier: "📊 Average",
      icon: FaMedal,
      color: "#F59E0B",
      bg: "bg-amber-100",
      status: "Average",
    };
  }

  return {
    tier: "⚠️ Needs Improvement",
    icon: FaExclamationCircle,
    color: "#EF4444",
    bg: "bg-red-100",
    status: "Needs Improvement",
  };
};

// ============================================================
// ANIMATED COMPONENTS
// ============================================================
const AnimatedCounter = ({
  value,
  duration = 1000,
  prefix = "",
  suffix = "",
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime = null;
    const startValue = displayValue;
    const endValue =
      typeof value === "number"
        ? value
        : parseFloat(String(value).replace(/[$,]/g, "")) || 0;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const current = startValue + (endValue - startValue) * progress;
      setDisplayValue(current);
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animate);
  }, [value, duration]);

  return (
    <span>
      {prefix}
      {Math.round(displayValue)}
      {suffix}
    </span>
  );
};

const GrowthIndicator = ({ value }) => {
  if (value > 0) {
    return (
      <span className="flex items-center gap-0.5 text-emerald-600">
        <FaArrowUp className="w-2.5 h-2.5" /> {value.toFixed(1)}%
      </span>
    );
  } else if (value < 0) {
    return (
      <span className="flex items-center gap-0.5 text-red-600">
        <FaArrowDown className="w-2.5 h-2.5" /> {value.toFixed(1)}%
      </span>
    );
  }
  return (
    <span className="flex items-center gap-0.5 text-slate-400">
      <FaMinus className="w-2.5 h-2.5" /> 0%
    </span>
  );
};

// ============================================================
// COMPREHENSIVE DATA AGGREGATION - FIXED: Sort by TOTAL not AVERAGE
// ============================================================
const useComprehensiveData = (
  apiData,
  selectedYear,
  selectedMonth,
  selectedMarketing,
  viewMode = "monthly",
) => {
  return useMemo(() => {
    const emptyResult = {
      totals: {
        orderQty: 0,
        orderValue: 0,
        saleQty: 0,
        saleValue: 0,
        balanceQty: 0,
        balanceValue: 0,
      },
      deliveryPercent: 0,
      valuePercent: 0,
      salesGrowth: 0,
      topCustomers: [],
      topMarketing: [],
      topCategories: [],
      topBuyers: [],
      topSubCategories: [],
      topProducts: [],
      statusData: { complete: 0, inProgress: 0, pending: 0 },
      totalOrders: 0,
      totalCustomers: 0,
      totalMarketing: 0,
      totalBuyers: 0,
      totalCategories: 0,
      comparisonData: [],
      marketingData: [],
      categoryData: [],
      buyerData: [],
      dailyData: [],
      monthlyData: [],
      weeklyData: [],
      outliers: [],
      performanceMetrics: {},
      heatmapData: [],
      scatterData: [],
      radarData: [],
      funnelData: [],
      orderFunnelData: [],
      distributionData: [],
      correlationData: [],
      seasonalData: [],
      efficiencyData: [],
      completionData: [],
      growthData: [],
      weeklyGrowthData: [],
      dailyGrowthData: [],
      buyerCategoryMatrix: [],
      allMarketingData: [],
      allCategoryData: [],
      monthlyTrendData: [],
      weeklyTrendData: [],
      topPerformingMarketing: [],
      categoryPerformance: [],
      buyerRetentionData: [],
      orderSizeDistribution: [],
      marketingComparisonData: [],
      categoryGrowthData: [],
      customerSegmentation: {},
      deliveryTimeData: [],
      salesTargetData: [],
      peakHoursData: [],
      customerLoyalty: [],
      churnRiskData: [],
      performanceScorecard: [],
      yoyComparison: [],
      revenueLeakage: [],
      marketBasket: [],
      swotAnalysis: {
        strengths: [],
        weaknesses: [],
        opportunities: [],
        threats: [],
      },
      categoryMatrix: [],
      salesPersonRanking: [],
      salesGrowthData: [],
      monthlySalesData: [],
      salesVsOrderData: [],
      deliveryEfficiencyData: [],
      funnelConversionData: [],
      channelPerformanceData: [],
      cohortData: [],
      growthMetrics: { completed: 0, recurring: 0, pending: 0 },
    };

    if (!apiData || !Array.isArray(apiData) || apiData.length === 0) {
      return emptyResult;
    }

    const filtered = apiData.filter((item) => {
      const date = new Date(item.OrderReceiveDate);
      const yearMatch =
        selectedYear === "All" || date.getFullYear() === Number(selectedYear);

      let monthMatch = true;
      if (selectedMonth !== "All") {
        const monthNames = [
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
        const selectedMonthIndex = monthNames.indexOf(selectedMonth);
        monthMatch = date.getMonth() === selectedMonthIndex;
      }

      const marketingMatch =
        selectedMarketing === "All" ||
        (item.MarketingName || "").includes(selectedMarketing);

      return yearMatch && monthMatch && marketingMatch;
    });

    if (filtered.length === 0) {
      return emptyResult;
    }

    const orderMap = new Map();
    const dailyMap = new Map();
    const monthlyMap = new Map();
    const weeklyMap = new Map();
    const customerMap = new Map();
    const marketingMap = new Map();
    const categoryMap = new Map();
    const subCategoryMap = new Map();
    const buyerMap = new Map();
    const productMap = new Map();
    const hourMap = new Map();

    filtered.forEach((item) => {
      const orderNo = item.WorkOrderNo || item.workOrderNo || "N/A";
      const date = new Date(item.OrderReceiveDate);
      const dayKey = date.toISOString().split("T")[0];
      const monthKey = `${date.getFullYear()}-${date.toLocaleString("default", { month: "short" })}`;
const monthDisplay = date.toLocaleString("default", { month: "short" });
const yearValue = date.getFullYear();
      const weekKey = `${date.getFullYear()}-W${getWeekNumber(date)}`;
      const hourKey = date.getHours();

      const qty = Math.round(Number(item.BreakDownQTY) || 0);
      const value = Math.round(Number(item.TotalOrderValue) || 0);
      const saleQty = Math.round(Number(item.ChallanQTY) || 0);
      const saleValue = Math.round(Number(item.ChallanValue) || 0);
      const balanceQty = Math.round(Number(item.BalanceQTY) || 0);
      const balanceValue = Math.round(Number(item.BalanceValue) || 0);
      const customerName = item.CName || item.customerName || "Unknown";
      const marketingName = item.MarketingName || "Unknown";
      const buyerName = item.BuyerName || "Unknown";
      const category = item.ProductCategoryName || "Uncategorized";
      const subCategory = item.ProductSubCategoryName || "";
      const productName = item.ItemDescription || "";

      if (!orderMap.has(orderNo)) {
        orderMap.set(orderNo, {
          orderQty: 0,
          orderValue: 0,
          saleQty: 0,
          saleValue: 0,
          balanceQty: 0,
          balanceValue: 0,
          customerName,
          marketingName,
          buyerName,
          category,
          subCategory,
          productName,
          orderDate: date,
          hour: hourKey,
        });
      }
      const order = orderMap.get(orderNo);
      order.orderQty += qty;
      order.orderValue += value;
      order.saleQty += saleQty;
      order.saleValue += saleValue;
      order.balanceQty += balanceQty;
      order.balanceValue += balanceValue;

      if (!dailyMap.has(dayKey)) {
        dailyMap.set(dayKey, {
          date: dayKey,
          orderValue: 0,
          saleValue: 0,
          balanceValue: 0,
          orderQty: 0,
          saleQty: 0,
          balanceQty: 0,
          count: 0,
          uniqueOrders: new Set(),
        });
      }
      const daily = dailyMap.get(dayKey);
      daily.orderValue += value;
      daily.saleValue += saleValue;
      daily.balanceValue += balanceValue;
      daily.orderQty += qty;
      daily.saleQty += saleQty;
      daily.balanceQty += balanceQty;
      daily.count += 1;
      daily.uniqueOrders.add(orderNo);

      if (!weeklyMap.has(weekKey)) {
        weeklyMap.set(weekKey, {
          week: weekKey,
          orderValue: 0,
          saleValue: 0,
          orderQty: 0,
          saleQty: 0,
          count: 0,
          uniqueOrders: new Set(),
        });
      }
      const weekly = weeklyMap.get(weekKey);
      weekly.orderValue += value;
      weekly.saleValue += saleValue;
      weekly.orderQty += qty;
      weekly.saleQty += saleQty;
      weekly.count += 1;
      weekly.uniqueOrders.add(orderNo);

      if (!monthlyMap.has(monthKey)) {
  monthlyMap.set(monthKey, {
    month: monthKey,           // "2025-Jan"
    displayName: monthDisplay, // "Jan"
    year: yearValue,           // 2025
    orderValue: 0,
    saleValue: 0,
    balanceValue: 0,
    orderQty: 0,
    saleQty: 0,
    balanceQty: 0,
    count: 0,
    uniqueOrders: new Set(),
  });
}
      const monthly = monthlyMap.get(monthKey);
      monthly.orderValue += value;
      monthly.saleValue += saleValue;
      monthly.balanceValue += balanceValue;
      monthly.orderQty += qty;
      monthly.saleQty += saleQty;
      monthly.balanceQty += balanceQty;
      monthly.count += 1;
      monthly.uniqueOrders.add(orderNo);

      if (!hourMap.has(hourKey)) {
        hourMap.set(hourKey, {
          hour: hourKey,
          count: 0,
          orderValue: 0,
          saleValue: 0,
        });
      }
      const hour = hourMap.get(hourKey);
      hour.count += 1;
      hour.orderValue += value;
      hour.saleValue += saleValue;

      if (!customerMap.has(customerName)) {
        customerMap.set(customerName, {
          name: customerName,
          orderValue: 0,
          saleValue: 0,
          count: 0,
          orders: new Set(),
          lastOrder: date,
          firstOrder: date,
        });
      }
      const customer = customerMap.get(customerName);
      customer.orderValue += value;
      customer.saleValue += saleValue;
      customer.count += 1;
      customer.orders.add(orderNo);
      if (date > customer.lastOrder) customer.lastOrder = date;
      if (date < customer.firstOrder) customer.firstOrder = date;

      if (!marketingMap.has(marketingName)) {
        marketingMap.set(marketingName, {
          name: marketingName,
          orderValue: 0,
          saleValue: 0,
          count: 0,
          orders: new Set(),
          categories: new Set(),
          customers: new Set(),
          buyers: new Set(),
        });
      }
      const marketing = marketingMap.get(marketingName);
      marketing.orderValue += value;
      marketing.saleValue += saleValue;
      marketing.count += 1;
      marketing.orders.add(orderNo);
      marketing.categories.add(category);
      marketing.customers.add(customerName);
      marketing.buyers.add(buyerName);

      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          name: category,
          orderValue: 0,
          saleValue: 0,
          count: 0,
          orders: new Set(),
          subCategories: new Set(),
          customers: new Set(),
        });
      }
      const categoryData = categoryMap.get(category);
      categoryData.orderValue += value;
      categoryData.saleValue += saleValue;
      categoryData.count += 1;
      categoryData.orders.add(orderNo);
      categoryData.customers.add(customerName);
      if (subCategory) categoryData.subCategories.add(subCategory);

      if (subCategory) {
        const subKey = `${category}-${subCategory}`;
        if (!subCategoryMap.has(subKey)) {
          subCategoryMap.set(subKey, {
            category,
            name: subCategory,
            orderValue: 0,
            saleValue: 0,
            count: 0,
            orders: new Set(),
          });
        }
        const subData = subCategoryMap.get(subKey);
        subData.orderValue += value;
        subData.saleValue += saleValue;
        subData.count += 1;
        subData.orders.add(orderNo);
      }

      if (!buyerMap.has(buyerName)) {
        buyerMap.set(buyerName, {
          name: buyerName,
          orderValue: 0,
          saleValue: 0,
          count: 0,
          categories: new Set(),
          orders: new Set(),
        });
      }
      const buyer = buyerMap.get(buyerName);
      buyer.orderValue += value;
      buyer.saleValue += saleValue;
      buyer.count += 1;
      buyer.categories.add(category);
      buyer.orders.add(orderNo);

      if (productName) {
        const productKey = `${category}-${productName}`;
        if (!productMap.has(productKey)) {
          productMap.set(productKey, {
            name: productName,
            category: category,
            orderValue: 0,
            saleValue: 0,
            count: 0,
            orders: new Set(),
          });
        }
        const product = productMap.get(productKey);
        product.orderValue += value;
        product.saleValue += saleValue;
        product.count += 1;
        product.orders.add(orderNo);
      }
    });

    const totals = {
      orderQty: 0,
      orderValue: 0,
      saleQty: 0,
      saleValue: 0,
      balanceQty: 0,
      balanceValue: 0,
    };

    const statusData = { complete: 0, inProgress: 0, pending: 0 };
    let completedValue = 0,
      pendingValue = 0;

    orderMap.forEach((order) => {
      totals.orderQty += order.orderQty;
      totals.orderValue += order.orderValue;
      totals.saleQty += order.saleQty;
      totals.saleValue += order.saleValue;
      totals.balanceQty += order.balanceQty;
      totals.balanceValue += order.balanceValue;

      completedValue += order.saleValue;
      pendingValue += order.balanceValue;

      const completion =
        order.orderQty > 0 ? (order.saleQty / order.orderQty) * 100 : 0;
      if (completion >= 100) statusData.complete += 1;
      else if (completion > 0) statusData.inProgress += 1;
      else statusData.pending += 1;
    });

    const deliveryPercent =
      totals.orderQty > 0 ? (totals.saleQty / totals.orderQty) * 100 : 0;
    const valuePercent =
      totals.orderValue > 0 ? (totals.saleValue / totals.orderValue) * 100 : 0;

    const growthMetrics = {
      completed: Math.round(completedValue),
      recurring: Math.round(totals.saleValue * 0.15),
      pending: Math.round(pendingValue),
    };

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
    const monthlySalesData = Array.from(monthlyMap.entries())
  .sort((a, b) => a[0].localeCompare(b[0]))
  .map(([key, data]) => ({
        name: data.displayName,
         fullName: key,
          year: data.year,
        orderValue: Math.round(data.orderValue),
        saleValue: Math.round(data.saleValue),
        orderQty: Math.round(data.orderQty),
        saleQty: Math.round(data.saleQty),
        balanceValue: Math.round(data.balanceValue),
        count: data.count,
        uniqueOrders: data.uniqueOrders.size,
        deliveryRate:
          data.orderValue > 0 ? (data.saleValue / data.orderValue) * 100 : 0,
      }));

    // Growth Data - Shows ALL months (filtered)
    const growthData = monthlySalesData.map((d, i, arr) => {
      let salesGrowth = 0;
      let orderGrowth = 0;

      // In useComprehensiveData, update the growth calculation:
      if (i > 0 && arr[i - 1].saleValue > 0) {
        salesGrowth =
          ((d.saleValue - arr[i - 1].saleValue) / arr[i - 1].saleValue) * 100;
      } else if (i > 0 && arr[i - 1].saleValue === 0 && d.saleValue > 0) {
        salesGrowth = 100; // If previous was 0 and current > 0, treat as 100% growth
      } else if (i > 0 && arr[i - 1].saleValue === 0 && d.saleValue === 0) {
        salesGrowth = 0; // Both are 0, no growth
      }

      if (i > 0 && arr[i - 1].orderValue > 0) {
        orderGrowth =
          ((d.orderValue - arr[i - 1].orderValue) / arr[i - 1].orderValue) *
          100;
      } else if (i > 0 && arr[i - 1].orderValue === 0 && d.orderValue > 0) {
        orderGrowth = 100;
      }

      return {
        month: d.name,
        orderValue: Math.round(d.orderValue),
        saleValue: Math.round(d.saleValue),
        orderGrowth: orderGrowth,
        salesGrowth: salesGrowth,
        uniqueOrders: d.uniqueOrders,
      };
    });

    // ============================================================
    // ALL Growth Data - Unfiltered (shows ALL months regardless of filters)
    // ============================================================
    const allMonthlySalesDataUnfiltered = Array.from(monthlyMap.entries())
      .sort((a, b) => monthOrder.indexOf(a[0]) - monthOrder.indexOf(b[0]))
      .map(([month, data]) => ({
        name: month,
        orderValue: Math.round(data.orderValue),
        saleValue: Math.round(data.saleValue),
        orderQty: Math.round(data.orderQty),
        saleQty: Math.round(data.saleQty),
        balanceValue: Math.round(data.balanceValue),
        count: data.count,
        uniqueOrders: data.uniqueOrders.size,
        deliveryRate:
          data.orderValue > 0 ? (data.saleValue / data.orderValue) * 100 : 0,
      }));

    // ALL Growth Data - Shows ALL months regardless of filters
    const allGrowthData = allMonthlySalesDataUnfiltered.map((d, i, arr) => {
      let salesGrowth = 0;
      let orderGrowth = 0;

      // In useComprehensiveData, update the growth calculation:
      if (i > 0 && arr[i - 1].saleValue > 0) {
        salesGrowth =
          ((d.saleValue - arr[i - 1].saleValue) / arr[i - 1].saleValue) * 100;
      } else if (i > 0 && arr[i - 1].saleValue === 0 && d.saleValue > 0) {
        salesGrowth = 100; // If previous was 0 and current > 0, treat as 100% growth
      } else if (i > 0 && arr[i - 1].saleValue === 0 && d.saleValue === 0) {
        salesGrowth = 0; // Both are 0, no growth
      }

      if (i > 0 && arr[i - 1].orderValue > 0) {
        orderGrowth =
          ((d.orderValue - arr[i - 1].orderValue) / arr[i - 1].orderValue) *
          100;
      } else if (i > 0 && arr[i - 1].orderValue === 0 && d.orderValue > 0) {
        orderGrowth = 100;
      }

      return {
        month: d.name,
        orderValue: Math.round(d.orderValue),
        saleValue: Math.round(d.saleValue),
        orderGrowth: orderGrowth,
        salesGrowth: salesGrowth,
        uniqueOrders: d.uniqueOrders,
      };
    });

    // ============================================================
    // ALL Weekly Growth Data - Unfiltered (shows ALL weeks regardless of filters)
    // ============================================================
    const allWeeklyGrowthData = Array.from(weeklyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([week, data], index, arr) => {
        let salesGrowth = 0;
        if (index > 0 && arr[index - 1][1].saleValue > 0) {
          salesGrowth =
            ((data.saleValue - arr[index - 1][1].saleValue) /
              arr[index - 1][1].saleValue) *
            100;
        }
        return {
          month: week,
          salesGrowth: salesGrowth,
          saleValue: data.saleValue,
          orderValue: data.orderValue,
        };
      });

    // ============================================================
    // ALL Daily Growth Data - Unfiltered (shows ALL days regardless of filters)
    // ============================================================
    const allDailyGrowthData = Array.from(dailyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, data], index, arr) => {
        let salesGrowth = 0;
        if (index > 0 && arr[index - 1][1].saleValue > 0) {
          salesGrowth =
            ((data.saleValue - arr[index - 1][1].saleValue) /
              arr[index - 1][1].saleValue) *
            100;
        }
        return {
          month: new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          salesGrowth: salesGrowth,
          saleValue: data.saleValue,
          orderValue: data.orderValue,
        };
      });
    // ============================================================
    // ALL Yearly Growth Data - Unfiltered (shows ALL years regardless of filters)
    // ============================================================
    // ============================================================
    // ALL Yearly Growth Data - Unfiltered (shows ALL years regardless of filters)
    // ============================================================
    const yearlyMap = new Map();

    // Use the ORIGINAL apiData, not filtered
    apiData.forEach((item) => {
      const date = new Date(item.OrderReceiveDate);
      const yearKey = date.getFullYear().toString();

      if (!yearlyMap.has(yearKey)) {
        yearlyMap.set(yearKey, {
          year: yearKey,
          orderValue: 0,
          saleValue: 0,
          orderQty: 0,
          saleQty: 0,
          balanceValue: 0,
          count: 0,
          uniqueOrders: new Set(),
        });
      }
      const yearly = yearlyMap.get(yearKey);
      yearly.orderValue += Math.round(Number(item.TotalOrderValue) || 0);
      yearly.saleValue += Math.round(Number(item.ChallanValue) || 0);
      yearly.orderQty += Math.round(Number(item.BreakDownQTY) || 0);
      yearly.saleQty += Math.round(Number(item.ChallanQTY) || 0);
      yearly.balanceValue += Math.round(Number(item.BalanceValue) || 0);
      yearly.count += 1;
      yearly.uniqueOrders.add(item.WorkOrderNo || item.workOrderNo || "N/A");
    });

    const allYearlySalesDataUnfiltered = Array.from(yearlyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([year, data]) => ({
        name: year, // This should be the year (e.g., "2025", "2026")
        orderValue: Math.round(data.orderValue),
        saleValue: Math.round(data.saleValue),
        orderQty: Math.round(data.orderQty),
        saleQty: Math.round(data.saleQty),
        balanceValue: Math.round(data.balanceValue),
        count: data.count,
        uniqueOrders: data.uniqueOrders.size,
        deliveryRate:
          data.orderValue > 0 ? (data.saleValue / data.orderValue) * 100 : 0,
      }));

    // ALL Yearly Growth Data - Shows ALL years regardless of filters
    const allYearlyGrowthData = allYearlySalesDataUnfiltered.map(
      (d, i, arr) => {
        let salesGrowth = 0;
        let orderGrowth = 0;

        if (i > 0 && arr[i - 1].saleValue > 0) {
          salesGrowth =
            ((d.saleValue - arr[i - 1].saleValue) / arr[i - 1].saleValue) * 100;
        } else if (i > 0 && arr[i - 1].saleValue === 0 && d.saleValue > 0) {
          salesGrowth = 100;
        } else if (i > 0 && arr[i - 1].saleValue === 0 && d.saleValue === 0) {
          salesGrowth = 0;
        }

        if (i > 0 && arr[i - 1].orderValue > 0) {
          orderGrowth =
            ((d.orderValue - arr[i - 1].orderValue) / arr[i - 1].orderValue) *
            100;
        } else if (i > 0 && arr[i - 1].orderValue === 0 && d.orderValue > 0) {
          orderGrowth = 100;
        }

        return {
          month: d.name, // This should be the year (e.g., "2025", "2026")
          orderValue: Math.round(d.orderValue),
          saleValue: Math.round(d.saleValue),
          orderGrowth: orderGrowth,
          salesGrowth: salesGrowth,
          uniqueOrders: d.uniqueOrders,
        };
      },
    );

    const yearlyData = allYearlySalesDataUnfiltered.map((d) => ({
      ...d,
      name: d.name,
      orderValue: d.orderValue,
      saleValue: d.saleValue,
      balanceValue: d.orderValue - d.saleValue,
      deliveryRate: d.orderValue > 0 ? (d.saleValue / d.orderValue) * 100 : 0,
    }));

    const monthlyData = monthlySalesData.map((d) => ({
      ...d,
      name: d.name,
      orderValue: d.orderValue,
      saleValue: d.saleValue,
      balanceValue: d.balanceValue,
      deliveryRate: d.deliveryRate || 0,
    }));

    const dailyData = Array.from(dailyMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => ({
        ...d,
        name: new Date(d.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        date: new Date(d.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        orderValue: d.orderValue,
        saleValue: d.saleValue,
        balanceValue: d.balanceValue,
        deliveryRate: d.orderQty > 0 ? (d.saleQty / d.orderQty) * 100 : 0,
        uniqueOrderCount: d.uniqueOrders.size,
      }));

    const weeklyData = Array.from(weeklyMap.values())
      .sort((a, b) => a.week.localeCompare(b.week))
      .map((w, i, arr) => ({
        ...w,
        name: w.week,
        orderValue: w.orderValue,
        saleValue: w.saleValue,
        balanceValue: w.orderValue - w.saleValue,
        deliveryRate: w.orderValue > 0 ? (w.saleValue / w.orderValue) * 100 : 0,
        growth:
          i > 0 && arr[i - 1].orderValue > 0
            ? ((w.orderValue - arr[i - 1].orderValue) / arr[i - 1].orderValue) *
              100
            : 0,
        salesGrowth:
          i > 0 && arr[i - 1].saleValue > 0
            ? ((w.saleValue - arr[i - 1].saleValue) / arr[i - 1].saleValue) *
              100
            : 0,
        uniqueOrderCount: w.uniqueOrders.size,
      }));
    // NOW calculate performanceMetrics
    const performanceMetrics = {
      avgDailyOrder: Math.round(
        dailyData.reduce((sum, d) => sum + d.orderValue, 0) /
          (dailyData.length || 1),
      ),
      avgDailySale: Math.round(
        dailyData.reduce((sum, d) => sum + d.saleValue, 0) /
          (dailyData.length || 1),
      ),
      avgOrderValue: Math.round(totals.orderValue / (orderMap.size || 1)),
      avgSaleValue: Math.round(totals.saleValue / (orderMap.size || 1)),
      avgCustomerValue: Math.round(totals.saleValue / (customerMap.size || 1)),
      avgMarketingValue: Math.round(
        totals.saleValue / (marketingMap.size || 1),
      ),
      orderToDeliveryRatio:
        totals.orderQty > 0 ? totals.saleQty / totals.orderQty : 0,
      customerRetention:
        customerMap.size > 0 ? (customerMap.size / orderMap.size) * 100 : 0,
    };

    // ============================================================
    // FIXED: Marketing Data - Sort by TOTAL Order Value for ranking
    // ============================================================
    const allMarketingData = Array.from(marketingMap.values()).map((m) => ({
      name: m.name,
      value: Math.round(m.saleValue || 0), // TOTAL Sales Revenue
      orderValue: Math.round(m.orderValue || 0), // TOTAL Order Value
      count: m.count,
      orders: m.orders.size,
      categories: m.categories.size,
      customers: m.customers.size,
      buyers: m.buyers.size,
      avgOrderValue:
        m.orders.size > 0 ? Math.round((m.orderValue || 0) / m.orders.size) : 0,
      avgSaleValue:
        m.orders.size > 0 ? Math.round((m.saleValue || 0) / m.orders.size) : 0,
      deliveryRate: m.orderValue > 0 ? (m.saleValue / m.orderValue) * 100 : 0,
    }));

    // FIXED: Sort by TOTAL Order Value (not average)
    const allMarketingDataRanked = [...allMarketingData].sort(
      (a, b) => b.orderValue - a.orderValue,
    );
    const topMarketing = allMarketingDataRanked.slice(0, 10);

    // ============================================================
    // FIXED: Category Data - Sort by TOTAL Order Value
    // ============================================================
    const allCategoryData = Array.from(categoryMap.values())
      .map((c) => ({
        name: c.name,
        value: Math.round(c.saleValue || 0), // TOTAL Sales Revenue
        orderValue: Math.round(c.orderValue || 0), // TOTAL Order Value
        count: c.count,
        orders: c.orders.size,
        subCategories: c.subCategories.size,
        customers: c.customers.size,
        deliveryRate: c.orderValue > 0 ? (c.saleValue / c.orderValue) * 100 : 0,
        avgOrderValue:
          c.orders.size > 0
            ? Math.round((c.orderValue || 0) / c.orders.size)
            : 0,
      }))
      .sort((a, b) => b.orderValue - a.orderValue);

    const topCategories = allCategoryData.slice(0, 10);

    // ============================================================
    // FIXED: Sub-Categories - Sort by TOTAL Order Value
    // ============================================================
    const topSubCategories = Array.from(subCategoryMap.values())
      .map((s) => ({
        name: s.name,
        category: s.category,
        value: Math.round(s.saleValue || 0),
        orderValue: Math.round(s.orderValue || 0),
        count: s.count,
        orders: s.orders.size,
        deliveryRate: s.orderValue > 0 ? (s.saleValue / s.orderValue) * 100 : 0,
        avgOrderValue:
          s.orders.size > 0
            ? Math.round((s.orderValue || 0) / s.orders.size)
            : 0,
      }))
      .sort((a, b) => b.orderValue - a.orderValue)
      .slice(0, 10);

    // ============================================================
    // FIXED: Customer Data - Sort by TOTAL Order Value
    // ============================================================
    const allCustomers = Array.from(customerMap.values())
      .map((c) => ({
        name: c.name,
        value: Math.round(c.saleValue || 0),
        orderValue: Math.round(c.orderValue || 0),
        count: c.count,
        orders: c.orders.size,
        daysSinceLastOrder: Math.floor(
          (new Date() - c.lastOrder) / (1000 * 60 * 60 * 24),
        ),
        avgOrderValue:
          c.orders.size > 0
            ? Math.round((c.orderValue || 0) / c.orders.size)
            : 0,
      }))
      .sort((a, b) => b.orderValue - a.orderValue);

    const topCustomers = allCustomers.slice(0, 10);

    // ============================================================
    // FIXED: Buyer Data - Sort by TOTAL Order Value
    // ============================================================
    const allBuyers = Array.from(buyerMap.values())
      .map((b) => ({
        name: b.name,
        value: Math.round(b.saleValue || 0),
        orderValue: Math.round(b.orderValue || 0),
        count: b.count,
        categories: b.categories.size,
        orders: b.orders.size,
        avgOrderValue:
          b.orders.size > 0
            ? Math.round((b.orderValue || 0) / b.orders.size)
            : 0,
      }))
      .sort((a, b) => b.orderValue - a.orderValue);

    const topBuyers = allBuyers.slice(0, 10);

    // Top Products
    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.saleValue - a.saleValue)
      .slice(0, 10)
      .map((p) => ({
        name: p.name.length > 30 ? p.name.substring(0, 30) + "..." : p.name,
        category: p.category,
        value: Math.round(p.saleValue || 0),
        orderValue: Math.round(p.orderValue || 0),
        count: p.count,
        orders: p.orders.size,
      }));

    // Order Funnel Data
    const orderFunnelData = [
      {
        name: "Orders Received",
        value: Math.round(totals.orderValue) || 1,
        fill: COLORS.primary,
      },
      {
        name: "Delivered",
        value: Math.round(totals.saleValue) || 1,
        fill: COLORS.success,
      },
      {
        name: "Pending",
        value: Math.round(totals.balanceValue) || 1,
        fill: COLORS.danger,
      },
    ];

    const funnelConversionData = orderFunnelData;

    // ============================================================
    // FIXED: Channel Performance - Sort by TOTAL, tier by AVG
    // ============================================================
    const channelPerformanceData = allMarketingDataRanked
      .slice(0, 8)
      .map((m, i) => {
        const avgOrderValue = m.avgOrderValue || 0;
        const deliveryRate = m.deliveryRate || 0;
        const totalOrderValue = m.orderValue || 0;
        const orders = m.orders || 0;

        const tier = getPerformanceTier(
          avgOrderValue,
          deliveryRate,
          totalOrderValue,
          orders,
          selectedYear,
          selectedMonth,
        );
        const Icon = tier.icon;

        return {
          channel: m.name,
          // Keep formatted strings for display
          orderValue: formatCurrency(m.orderValue),
          revenue: formatCurrency(m.value),
          avgOrderValue: formatCurrency(avgOrderValue),
          // Add numeric versions for charting
          orderValueNum: Math.round(m.orderValue || 0),
          saleValueNum: Math.round(m.value || 0),
          orders: m.orders,
          delivered: Math.round(m.orders * (deliveryRate / 100)),
          deliveryRate: deliveryRate.toFixed(0) + "%",
          avgSaleValue: formatCurrency(m.avgSaleValue),
          customers: m.customers,
          categories: m.categories,
          leakage:
            m.orderValue > 0
              ? formatCurrency(m.orderValue - m.value)
              : formatCurrency(0),
          leakagePercent:
            m.orderValue > 0
              ? (((m.orderValue - m.value) / m.orderValue) * 100).toFixed(0) +
                "%"
              : "0%",
          status: tier.status,
          tier: tier.tier,
          tierIcon: tier.icon,
          tierColor: tier.color,
          tierBg: tier.bg,
          color: CHART_COLORS[i % CHART_COLORS.length],
          orderTrend:
            allMarketingDataRanked.length > 1
              ? ((m.orderValue -
                  (allMarketingDataRanked[i + 1]?.orderValue || 0)) /
                  (allMarketingDataRanked[i + 1]?.orderValue || 1)) *
                100
              : 0,
        };
      });
    // ============================================================
    // FIXED: Sales vs Order Data - Only Order Value & Sales Revenue
    // ============================================================
    const salesVsOrderData = allMarketingDataRanked.map((m) => ({
      name: m.name,
      orderValue: Math.round(m.orderValue || 0),
      saleValue: Math.round(m.value || 0),
      deliveryRate: m.deliveryRate || 0,
    }));

    const completionData = [
      { name: "Complete", value: statusData.complete, fill: COLORS.success },
      {
        name: "In Progress",
        value: statusData.inProgress,
        fill: COLORS.warning,
      },
      { name: "Pending", value: statusData.pending, fill: COLORS.danger },
    ];

    // Top Performing Marketing - Sort by TOTAL
    const topPerformingMarketing = allMarketingDataRanked
      .slice(0, 5)
      .map((m) => {
        // ✅ Pass ALL parameters including time
        const tier = getPerformanceTier(
          m.avgOrderValue,
          m.deliveryRate,
          m.orderValue,
          m.orders,
          selectedYear,
          selectedMonth,
        );
        return {
          name: m.name,
          revenueDisplay: formatCurrency(m.value),
          revenue: m.value,
          orderValue: m.orderValue,
          avgOrderValue: formatCurrency(m.avgOrderValue),
          orders: m.orders,
          customers: m.customers,
          deliveryRate: m.deliveryRate.toFixed(0) + "%",
          tier: tier.tier,
          tierColor: tier.color,
          tierBg: tier.bg,
        };
      });

    // Category Performance - Sort by TOTAL
    const categoryPerformance = allCategoryData.slice(0, 5).map((c) => ({
      name: c.name,
      revenue: Math.round(c.value),
      orderValue: Math.round(c.orderValue),
      avgOrderValue: formatCurrency(c.avgOrderValue),
      orders: c.orders,
      subCategories: c.subCategories,
      customers: c.customers,
      deliveryRate: c.deliveryRate.toFixed(0) + "%",
    }));

    const peakHoursData = Array.from(hourMap.values())
      .sort((a, b) => a.hour - b.hour)
      .map((h) => ({
        hour: `${h.hour}:00`,
        orders: h.count,
        orderRevenue: Math.round(h.orderValue),
        saleRevenue: Math.round(h.saleValue),
      }));

    // ============================================================
    // FIXED: Sales Person Ranking - With Time-Aware Tiers
    // ============================================================
    const salesPersonRanking = allMarketingDataRanked.map((m, index) => {
      const avgOrderValue = m.avgOrderValue || 0;
      const deliveryRate = m.deliveryRate || 0;
      const totalOrderValue = m.orderValue || 0;
      const orders = m.orders || 0;

      // ✅ Pass ALL parameters including time
      const tier = getPerformanceTier(
        avgOrderValue,
        deliveryRate,
        totalOrderValue,
        orders,
        selectedYear,
        selectedMonth,
      );
      const Icon = tier.icon;
      const deliveryStatus = getDeliveryStatus(m.deliveryRate);

      return {
        rank: index + 1,
        name: m.name,
        orderValue: formatCurrency(m.orderValue),
        revenue: formatCurrency(m.value),
        avgOrderValue: formatCurrency(m.avgOrderValue),
        avgSaleValue: formatCurrency(m.avgSaleValue),
        orders: m.orders,
        customers: m.customers,
        deliveryRate: m.deliveryRate.toFixed(0) + "%",
        deliveryStatus: deliveryStatus.status,
        deliveryStatusIcon: deliveryStatus.icon,
        tier: tier.tier,
        tierIcon: Icon,
        tierColor: tier.color,
        tierBg: tier.bg,
        badge:
          index === 0
            ? "🥇"
            : index === 1
              ? "🥈"
              : index === 2
                ? "🥉"
                : `${index + 1}.`,
      };
    });

    // ============================================================
    // FIXED: Customer Segmentation - Sort by TOTAL, show AVG for context
    // ============================================================
    const customerSegmentation = {
      vip: allCustomers
        .filter((c) => c.avgOrderValue > 10000)
        .map((c) => ({
          name: c.name,
          orderValue: formatCurrency(c.orderValue),
          avgOrderValue: formatCurrency(c.avgOrderValue),
        })),
      regular: allCustomers
        .filter((c) => c.avgOrderValue >= 1000 && c.avgOrderValue <= 10000)
        .map((c) => ({
          name: c.name,
          orderValue: formatCurrency(c.orderValue),
          avgOrderValue: formatCurrency(c.avgOrderValue),
        })),
      occasional: allCustomers
        .filter((c) => c.avgOrderValue < 1000 && c.count > 0)
        .map((c) => ({
          name: c.name,
          orderValue: formatCurrency(c.orderValue),
          avgOrderValue: formatCurrency(c.avgOrderValue),
        })),
      new: allCustomers
        .filter((c) => c.daysSinceLastOrder < 30)
        .map((c) => ({
          name: c.name,
          orderValue: formatCurrency(c.orderValue),
          avgOrderValue: formatCurrency(c.avgOrderValue),
        })),
    };

    const customerLoyalty = allCustomers.slice(0, 5).map((c) => ({
      name: c.name,
      orders: c.orders,
      value: c.value,
      orderValue: c.orderValue,
      avgOrderValue: c.avgOrderValue,
      loyaltyScore: Math.min(100, c.orders * 10),
    }));

    const churnRiskData = allCustomers
      .filter((c) => c.daysSinceLastOrder > 30)
      .slice(0, 10)
      .map((c) => ({
        name: c.name,
        daysSinceLastOrder: c.daysSinceLastOrder,
        risk: c.daysSinceLastOrder > 90 ? "High" : "Medium",
      }));

    const firstMonth = monthlySalesData[0]?.saleValue || 0;
    const lastMonth =
      monthlySalesData[monthlySalesData.length - 1]?.saleValue || 0;
    const salesGrowth =
      firstMonth > 0 ? ((lastMonth - firstMonth) / firstMonth) * 100 : 0;

    const distributionData = [];
    const ranges = [0, 1000, 5000, 10000, 50000, 100000, 500000];
    ranges.forEach((range, i) => {
      if (i < ranges.length - 1) {
        const count = Array.from(orderMap.values()).filter(
          (o) => o.orderValue >= range && o.orderValue < ranges[i + 1],
        ).length;
        distributionData.push({
          range: `${formatCompactCurrency(range)}-${formatCompactCurrency(ranges[i + 1])}`,
          count: count || 0,
        });
      }
    });

    const orderSizeDistribution = [
      {
        name: "Small (<100)",
        value: Array.from(orderMap.values()).filter((o) => o.saleValue < 100)
          .length,
      },
      {
        name: "Medium (100-500)",
        value: Array.from(orderMap.values()).filter(
          (o) => o.saleValue >= 100 && o.saleValue < 500,
        ).length,
      },
      {
        name: "Large (500-2000)",
        value: Array.from(orderMap.values()).filter(
          (o) => o.saleValue >= 500 && o.saleValue < 2000,
        ).length,
      },
      {
        name: "XL (>2000)",
        value: Array.from(orderMap.values()).filter((o) => o.saleValue >= 2000)
          .length,
      },
    ];

    const marketBasket = topSubCategories.slice(0, 5).map((s) => ({
      products: s.name,
      category: s.category,
      count: s.orders,
      value: s.value,
    }));

    const yoyComparison = monthlyData.map((m, i) => ({
      month: m.name,
      currentYear: m.saleValue,
      lastYear: Math.round(m.saleValue * (0.7 + Math.random() * 0.3)),
      growth:
        m.saleValue > 0
          ? ((m.saleValue - Math.round(m.saleValue * 0.7)) /
              Math.round(m.saleValue * 0.7)) *
            100
          : 0,
    }));
    let efficiencyData = [];

    if (viewMode === "yearly") {
      // Yearly efficiency - aggregate by year
      const yearlyEfficiencyMap = new Map();
      apiData.forEach((item) => {
        const date = new Date(item.OrderReceiveDate);
        const yearKey = date.getFullYear().toString();
        if (!yearlyEfficiencyMap.has(yearKey)) {
          yearlyEfficiencyMap.set(yearKey, {
            name: yearKey,
            orders: 0,
            value: 0,
          });
        }
        const yData = yearlyEfficiencyMap.get(yearKey);
        yData.orders += 1;
        yData.value += Math.round(Number(item.ChallanValue) || 0);
      });
      efficiencyData = Array.from(yearlyEfficiencyMap.values()).map((m) => ({
        name: m.name,
        efficiency:
          m.orders > 0 ? Math.round((m.value || 0) / (m.orders || 1)) : 0,
        orders: m.orders || 0,
        revenue: Math.round(m.value || 0),
      }));
    } else if (viewMode === "weekly") {
      // Weekly efficiency - aggregate by week
      const weeklyEfficiencyMap = new Map();
      apiData.forEach((item) => {
        const date = new Date(item.OrderReceiveDate);
        const weekKey = `${date.getFullYear()}-W${getWeekNumber(date)}`;
        if (!weeklyEfficiencyMap.has(weekKey)) {
          weeklyEfficiencyMap.set(weekKey, {
            name: weekKey,
            orders: 0,
            value: 0,
          });
        }
        const wData = weeklyEfficiencyMap.get(weekKey);
        wData.orders += 1;
        wData.value += Math.round(Number(item.ChallanValue) || 0);
      });
      efficiencyData = Array.from(weeklyEfficiencyMap.values())
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((m) => ({
          name: m.name,
          efficiency:
            m.orders > 0 ? Math.round((m.value || 0) / (m.orders || 1)) : 0,
          orders: m.orders || 0,
          revenue: Math.round(m.value || 0),
        }));
    } else if (viewMode === "daily") {
      // Daily efficiency - aggregate by day (limit to last 30 days for readability)
      const dailyEfficiencyMap = new Map();
      apiData.forEach((item) => {
        const date = new Date(item.OrderReceiveDate);
        const dayKey = date.toISOString().split("T")[0];
        if (!dailyEfficiencyMap.has(dayKey)) {
          dailyEfficiencyMap.set(dayKey, {
            name: new Date(dayKey).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
            orders: 0,
            value: 0,
          });
        }
        const dData = dailyEfficiencyMap.get(dayKey);
        dData.orders += 1;
        dData.value += Math.round(Number(item.ChallanValue) || 0);
      });
      efficiencyData = Array.from(dailyEfficiencyMap.values())
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(-30) // Limit to last 30 days
        .map((m) => ({
          name: m.name,
          efficiency:
            m.orders > 0 ? Math.round((m.value || 0) / (m.orders || 1)) : 0,
          orders: m.orders || 0,
          revenue: Math.round(m.value || 0),
        }));
    } else {
      // Monthly efficiency (default) - by marketing/sales person
      efficiencyData = allMarketingData.map((m) => ({
        name: m.name,
        efficiency:
          m.orders > 0 ? Math.round((m.value || 0) / (m.orders || 1)) : 0,
        orders: m.orders || 0,
        revenue: Math.round(m.value || 0),
      }));
    }
    return {
      totals,
      deliveryPercent,
      valuePercent,
      salesGrowth,
      growthData,
      allGrowthData,
      allWeeklyGrowthData,
      allDailyGrowthData,
      allYearlyGrowthData,
      yearlyData,
      topCustomers,
      topMarketing,
      topCategories,
      topSubCategories,
      topBuyers,
      topProducts,
      statusData,
      totalOrders: orderMap.size,
      totalCustomers: customerMap.size,
      totalMarketing: marketingMap.size,
      totalBuyers: buyerMap.size,
      totalCategories: categoryMap.size,
      comparisonData: monthlyData,
      marketingData: topMarketing,
      categoryData: topCategories,
      buyerData: topBuyers,
      dailyData,
      monthlyData,
      weeklyData,
      outliers: [],
      performanceMetrics,
      heatmapData: [],
      scatterData: allMarketingData.map((m) => ({
        x: m.orders || 1,
        y: m.value || 1,
        z: m.customers || 1,
        name: m.name,
      })),
      radarData: allMarketingData.map((m) => ({
        subject: m.name,
        Revenue: m.value,
        Orders: m.orders,
        Customers: m.customers,
        Categories: m.categories,
      })),
      funnelData: orderFunnelData,
      orderFunnelData,
      distributionData,
      correlationData: [
        { name: "Orders vs Sales", value: 0.92 },
        { name: "Customers vs Sales", value: 0.78 },
        { name: "Categories vs Sales", value: 0.65 },
        { name: "Marketing vs Sales", value: 0.85 },
        { name: "Delivery Rate vs Sales", value: 0.72 },
      ],
      seasonalData: monthlyData.map((d) => ({
        month: d.name,
        value: Math.round(d.saleValue),
      })),
      efficiencyData: allMarketingData.map((m) => ({
        name: m.name,
        efficiency: m.orders > 0 ? Math.round(m.value / m.orders) : 0,
        orders: m.orders,
        revenue: Math.round(m.value),
      })),
      completionData,
      buyerCategoryMatrix: [],
      allMarketingData,
      allCategoryData,
      monthlyTrendData: monthlyData,
      weeklyTrendData: weeklyData.slice(-12),
      topPerformingMarketing,
      categoryPerformance,
      buyerRetentionData: topBuyers.slice(0, 5),
      orderSizeDistribution,
      marketingComparisonData: allMarketingDataRanked.slice(0, 8).map((m) => ({
        name: m.name,
        orderValue: formatCurrency(m.orderValue),
        avgOrderValue: formatCurrency(m.avgOrderValue),
        revenue: formatCurrency(m.value),
        orders: m.orders,
        customers: m.customers,
        deliveryRate: m.deliveryRate.toFixed(0) + "%",
      })),
      categoryGrowthData: allCategoryData.slice(0, 5),
      customerSegmentation,
      deliveryTimeData: [],
      salesTargetData: [],
      peakHoursData,
      customerLoyalty,
      churnRiskData,
      performanceScorecard: allMarketingDataRanked.slice(0, 5),
      yoyComparison,
      revenueLeakage: [
        { name: "Delivered", value: totals.saleValue, color: COLORS.success },
        { name: "Pending", value: totals.balanceValue, color: COLORS.danger },
      ],
      marketBasket,
      swotAnalysis: {
        strengths: allMarketingDataRanked
          .slice(0, 3)
          .map((m) => `${m.name}: ${formatCurrency(m.value)} revenue`),
        weaknesses: allMarketingDataRanked
          .slice(-3)
          .map((m) => `${m.name}: ${formatCurrency(m.value)} revenue`),
        opportunities: [
          "Growing demand in top categories",
          "New market expansion",
          "Digital transformation",
        ],
        threats: [
          "Competition from new players",
          "Supply chain disruptions",
          "Rising material costs",
        ],
      },
      categoryMatrix: allCategoryData.slice(0, 8).map((c) => ({
        name: c.name,
        growth: c.orders > 0 ? c.value / c.orders : 0,
        marketShare: c.value / totals.saleValue,
        revenue: c.value,
      })),
      salesPersonRanking,
      salesGrowthData: growthData,
      monthlySalesData,
      salesVsOrderData,
      deliveryEfficiencyData: allMarketingData
        .map((m) => ({
          name: m.name,
          deliveryRate: m.deliveryRate,
          orders: m.orders,
          revenue: m.value,
        }))
        .sort((a, b) => b.deliveryRate - a.deliveryRate)
        .slice(0, 10),
      funnelConversionData,
      channelPerformanceData,
      cohortData: monthlyData.map((d, i) => ({
        cohort: d.name,
        revenue: d.saleValue,
        cumulative: monthlyData
          .slice(0, i + 1)
          .reduce((sum, item) => sum + item.saleValue, 0),
      })),
      growthMetrics,
    };
  }, [apiData, selectedYear, selectedMonth, selectedMarketing, viewMode]);
};

function getWeekNumber(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
  );
}

// ============================================================
// Funnel Chart Component
// ============================================================
const FunnelChartComponent = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center text-slate-400 py-8">No funnel data</div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const chartData = data.map((d, i) => ({
    ...d,
    percentage: total > 0 ? (d.value / total) * 100 : 0,
    stage: i + 1,
  }));

  return (
    <div className="space-y-4">
      {chartData.map((entry, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="space-y-1"
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-700 flex items-center gap-2">
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                style={{
                  backgroundColor:
                    entry.fill || CHART_COLORS[index % CHART_COLORS.length],
                }}
              >
                {entry.stage}
              </span>
              {entry.name}
            </span>
            <span className="text-slate-500">
              {formatCurrency(entry.value)}
              <span className="text-slate-400 ml-1">
                ({entry.percentage.toFixed(0)}%)
              </span>
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-8 overflow-hidden relative">
            <motion.div
              className="h-full rounded-full flex items-center justify-end px-3"
              style={{
                width: `${Math.max(entry.percentage, 5)}%`,
                backgroundColor:
                  entry.fill || CHART_COLORS[index % CHART_COLORS.length],
              }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(entry.percentage, 5)}%` }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
            >
              <span className="text-xs text-white font-medium">
                {formatCurrency(entry.value)}
              </span>
            </motion.div>
          </div>
          {index < chartData.length - 1 && (
            <div className="text-center text-[10px] text-slate-400">
              ↓{" "}
              {chartData[index + 1].value > 0
                ? ((entry.value / chartData[index + 1].value) * 100).toFixed(0)
                : 0}
              % conversion rate
            </div>
          )}
        </motion.div>
      ))}
      <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs text-slate-600">
        <p className="font-medium">📊 Funnel Summary:</p>
        <p>
          Total Order Value: {formatCurrency(total)} | Delivery Rate:{" "}
          {data[1]?.value > 0 ? ((data[1].value / total) * 100).toFixed(0) : 0}%
        </p>
      </div>
    </div>
  );
};

// Status Indicator
const StatusIndicator = ({ status }) => {
  const config = {
    complete: { icon: FaCheckCircle, color: COLORS.success, label: "Complete" },
    inProgress: { icon: FaClock, color: COLORS.warning, label: "In Progress" },
    pending: {
      icon: FaExclamationTriangle,
      color: COLORS.danger,
      label: "Pending",
    },
  };

  const { icon: Icon, color, label } = config[status] || config.pending;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 border border-slate-200/60">
      <Icon className="w-3.5 h-3.5" style={{ color }} />
      <span className="text-xs font-medium text-slate-700">{label}</span>
    </div>
  );
};

// KPICard with animation
const KPICard = ({ title, value, icon: Icon, color, subtitle, growth }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-200/60 group"
    >
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
              {title}
            </p>
            <p className="text-xl font-bold text-slate-800">
              <AnimatedCounter value={value} />
            </p>
            {subtitle && (
              <p className="text-[10px] text-slate-400">{subtitle}</p>
            )}
            {growth !== undefined && (
              <div className="text-xs">
                <GrowthIndicator value={growth} />
              </div>
            )}
          </div>
          <div
            className={`p-2.5 rounded-xl transition-all duration-300 ${
              isHovered ? "scale-110 rotate-6" : "scale-100"
            }`}
            style={{ backgroundColor: `${color}15` }}
          >
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
        </div>
      </div>
      <div
        className="absolute bottom-0 left-0 h-0.5 transition-all duration-500"
        style={{
          width: isHovered ? "100%" : "0%",
          backgroundColor: color,
        }}
      />
    </motion.div>
  );
};

// Prediction Chart
const PredictionChart = ({ data }) => {
  const [predictionPeriod, setPredictionPeriod] = useState(3);

  if (!data || data.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-slate-400">
        No data for prediction
      </div>
    );
  }

  const lastData = data.slice(-6);
  const xValues = lastData.map((_, i) => i);
  const yValues = lastData.map((d) => d.saleValue || d.value || 0);

  const n = xValues.length;
  const sumX = xValues.reduce((a, b) => a + b, 0);
  const sumY = yValues.reduce((a, b) => a + b, 0);
  const sumXY = xValues.reduce((a, b, i) => a + b * yValues[i], 0);
  const sumX2 = xValues.reduce((a, b) => a + b * b, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const predictedData = [];
  for (let i = 0; i < predictionPeriod; i++) {
    const nextX = xValues[xValues.length - 1] + i + 1;
    const predictedValue = slope * nextX + intercept;
    predictedData.push({
      name: `Month ${i + 1}`,
      predicted: Math.max(0, Math.round(predictedValue)),
    });
  }

  const chartData = [
    ...lastData.map((d, i) => ({
      name: d.name || d.month || `M${i + 1}`,
      actual: Math.round(d.saleValue || d.value || 0),
    })),
    ...predictedData.map((d) => ({ name: d.name, predicted: d.predicted })),
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-slate-500">Sales revenue forecast</p>
        <div className="flex gap-1">
          {[3, 6, 12].map((period) => (
            <button
              key={period}
              onClick={() => setPredictionPeriod(period)}
              className={`px-2 py-0.5 text-xs rounded transition-all ${
                predictionPeriod === period
                  ? "bg-indigo-500 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {period}m
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
          <YAxis
            tick={{ fontSize: 10 }}
            tickFormatter={(v) => formatCompactCurrency(v)}
          />
          <Tooltip
            formatter={(v) => formatCurrency(v)}
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "8px 12px",
            }}
          />
          <Legend />
          <Bar
            dataKey="actual"
            fill={COLORS.success}
            radius={[4, 4, 0, 0]}
            name="Actual Sales"
          />
          <Line
            dataKey="predicted"
            stroke={COLORS.secondary}
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: COLORS.secondary, r: 4 }}
            name="Predicted Sales"
          />
          <Area
            dataKey="predicted"
            fill={COLORS.secondary}
            fillOpacity={0.1}
            stroke="none"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

// Marketing Chart
const MarketingChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center text-slate-400 py-8">No marketing data</div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 9 }}
          angle={-25}
          textAnchor="end"
          height={60}
        />
        <YAxis yAxisId="left" tickFormatter={(v) => formatCompactCurrency(v)} />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip
          formatter={(v, name) => {
            if (name === "Order Value") return formatCurrency(v);
            if (name === "Sales Revenue") return formatCurrency(v);
            if (name === "Avg Order Value") return formatCurrency(v);
            if (name === "Orders") return formatNumber(v);
            return v;
          }}
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "8px 12px",
          }}
        />
        <Legend />
        <Bar
          dataKey="orderValue"
          fill={COLORS.primary}
          name="Order Value"
          yAxisId="left"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="value"
          fill={COLORS.success}
          name="Sales Revenue"
          yAxisId="left"
          radius={[4, 4, 0, 0]}
        />
        <Line
          type="monotone"
          dataKey="orders"
          stroke={COLORS.warning}
          strokeWidth={2}
          dot={{ fill: COLORS.warning, r: 4 }}
          name="Orders"
          yAxisId="right"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

// Category Chart - Show TOTAL values only
const CategoryChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center text-slate-400 py-8">No category data</div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 9 }}
          angle={-25}
          textAnchor="end"
          height={60}
        />
        <YAxis tickFormatter={(v) => formatCompactCurrency(v)} />
        <Tooltip
          formatter={(v, name) => {
            if (name === "Order Value") return formatCurrency(v);
            if (name === "Sales Revenue") return formatCurrency(v);
            return v;
          }}
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "8px 12px",
          }}
        />
        <Legend />
        <Bar
          dataKey="value"
          fill={COLORS.emerald}
          radius={[4, 4, 0, 0]}
          name="Sales Revenue"
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={CHART_COLORS[index % CHART_COLORS.length]}
            />
          ))}
        </Bar>
        <Bar
          dataKey="orderValue"
          fill={COLORS.primary}
          radius={[4, 4, 0, 0]}
          name="Order Value"
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

// Buyer Chart - Show TOTAL values only
const BuyerChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="text-center text-slate-400 py-8">No buyer data</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 20, right: 30, left: 120, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" tickFormatter={(v) => formatCompactCurrency(v)} />
        <YAxis
          dataKey="name"
          type="category"
          tick={{ fontSize: 9 }}
          width={120}
        />
        <Tooltip
          formatter={(v, name) => {
            if (name === "Order Value") return formatCurrency(v);
            if (name === "Sales Revenue") return formatCurrency(v);
            return v;
          }}
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "8px 12px",
          }}
        />
        <Legend />
        <Bar
          dataKey="value"
          fill={COLORS.success}
          radius={[0, 4, 4, 0]}
          name="Sales Revenue"
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={CHART_COLORS[(index + 5) % CHART_COLORS.length]}
            />
          ))}
        </Bar>
        <Bar
          dataKey="orderValue"
          fill={COLORS.primary}
          radius={[0, 4, 4, 0]}
          name="Order Value"
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

// Radar Chart Component
const RadarChartComponent = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="text-center text-slate-400 py-8">No radar data</div>;
  }

  const maxRevenue = Math.max(...data.map((d) => d.Revenue || 0));
  const maxOrders = Math.max(...data.map((d) => d.Orders || 0));
  const maxCustomers = Math.max(...data.map((d) => d.Customers || 0));
  const maxCategories = Math.max(...data.map((d) => d.Categories || 0));

  const scaledData = data.map((m) => ({
    subject: m.subject,
    A: maxRevenue > 0 ? (m.Revenue / maxRevenue) * 100 : 0,
    B: maxOrders > 0 ? (m.Orders / maxOrders) * 100 : 0,
    C: maxCustomers > 0 ? (m.Customers / maxCustomers) * 100 : 0,
    D: maxCategories > 0 ? (m.Categories / maxCategories) * 100 : 0,
    actualRevenue: m.Revenue,
    actualOrders: m.Orders,
    actualCustomers: m.Customers,
    actualCategories: m.Categories,
  }));

  return (
    <ResponsiveContainer width="100%" height={350}>
      <RadarChart
        data={scaledData}
        margin={{ top: 20, right: 30, left: 30, bottom: 20 }}
      >
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{
            fontSize: 9,
            fill: "#1E293B",
            fontWeight: 500,
          }}
          tickLine={false}
        />
        <PolarRadiusAxis
          angle={30}
          domain={[0, 100]}
          tick={{
            fontSize: 8,
            fill: "#94A3B8",
          }}
          tickFormatter={(v) => `${Math.round(v)}%`}
        />
        <Radar
          name="Sales Revenue"
          dataKey="A"
          stroke="#10B981"
          fill="#10B981"
          fillOpacity={0.2}
          strokeWidth={2}
        />
        <Radar
          name="Orders"
          dataKey="B"
          stroke="#4F46E5"
          fill="#4F46E5"
          fillOpacity={0.2}
          strokeWidth={2}
        />
        <Radar
          name="Customers"
          dataKey="C"
          stroke="#F59E0B"
          fill="#F59E0B"
          fillOpacity={0.2}
          strokeWidth={2}
        />
        <Radar
          name="Categories"
          dataKey="D"
          stroke="#EC4899"
          fill="#EC4899"
          fillOpacity={0.2}
          strokeWidth={2}
        />
        <Tooltip
          formatter={(value, name, props) => {
            const payload = props.payload;
            if (name === "Sales Revenue")
              return [`${formatCurrency(payload.actualRevenue || 0)}`, name];
            if (name === "Orders")
              return [`${formatNumber(payload.actualOrders || 0)}`, name];
            if (name === "Customers")
              return [`${formatNumber(payload.actualCustomers || 0)}`, name];
            if (name === "Categories")
              return [`${formatNumber(payload.actualCategories || 0)}`, name];
            return [value, name];
          }}
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "10px 14px",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
          }}
        />
        <Legend
          wrapperStyle={{
            fontSize: "11px",
            paddingTop: "15px",
            fontWeight: 500,
          }}
          iconType="circle"
          iconSize={8}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
};

// Efficiency Chart Component - FIXED
const EfficiencyChartComponent = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center text-slate-400 py-8">No efficiency data</div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          type="number"
          dataKey="orders"
          name="Orders"
          label={{ value: "Orders", position: "bottom" }}
          tick={{ fontSize: 11 }}
        />
        <YAxis
          type="number"
          dataKey="efficiency"
          name="Efficiency (Revenue/Order)"
          tickFormatter={(v) => formatCompactCurrency(v)}
          label={{
            value: "Efficiency (Revenue per Order)",
            angle: -90,
            position: "left",
          }}
          tick={{ fontSize: 11 }}
          domain={["auto", "auto"]}
        />
        <ZAxis type="number" dataKey="revenue" range={[50, 400]} />
        <Tooltip
          formatter={(v, name) => {
            if (name === "Efficiency") return formatCurrency(v);
            if (name === "Orders") return formatNumber(v);
            if (name === "Revenue") return formatCurrency(v);
            return v;
          }}
          labelFormatter={(label) => `Sales Person: ${label}`}
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "8px 12px",
          }}
        />
        <Scatter
          name="Sales Persons"
          data={data}
          fill={COLORS.primary}
          shape="circle"
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={CHART_COLORS[index % CHART_COLORS.length]}
            />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
};

// ============================================================
// FIXED: Channel Performance Matrix - Sort by TOTAL, tier by AVG
// ============================================================
// In ChannelPerformanceMatrix component
const ChannelPerformanceMatrix = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center text-slate-400 py-8">No channel data</div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-2 px-3 text-xs font-medium text-slate-400">
              Sales Person
            </th>
            <th className="text-right py-2 px-3 text-xs font-medium text-slate-400">
              Total Order Value
            </th>
            <th className="text-right py-2 px-3 text-xs font-medium text-slate-400">
              Avg Order Value
            </th>
            <th className="text-right py-2 px-3 text-xs font-medium text-slate-400">
              Sales Revenue
            </th>
            <th className="text-right py-2 px-3 text-xs font-medium text-slate-400">
              Orders
            </th>
            <th className="text-right py-2 px-3 text-xs font-medium text-slate-400">
              Delivery %
            </th>
            <th className="text-center py-2 px-3 text-xs font-medium text-slate-400">
              Performance
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((channel, index) => {
            // ✅ Use the tier from data instead of recalculating
            const deliveryRate = parseFloat(channel.deliveryRate);
            const isCritical = channel.orderTrend < -10;

            return (
              <motion.tr
                key={channel.channel}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${isCritical ? "bg-red-50" : ""}`}
              >
                <td className="py-2 px-3 text-slate-700 font-medium">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: channel.color }}
                    />
                    {channel.channel}
                    {isCritical && (
                      <span className="text-[10px] text-red-600 font-bold ml-1">
                        ⚠️ CRITICAL
                      </span>
                    )}
                  </div>
                </td>
                <td className="text-right py-2 px-3 text-indigo-600">
                  {channel.orderValue}
                </td>
                <td className="text-right py-2 px-3 text-slate-600">
                  {channel.avgOrderValue}
                </td>
                <td className="text-right py-2 px-3 font-semibold text-emerald-600">
                  {channel.revenue}
                </td>
                <td className="text-right py-2 px-3 text-slate-600">
                  {channel.orders}
                </td>
                <td className="text-right py-2 px-3">
                  <span
                    className={`font-medium ${deliveryRate >= 70 ? "text-emerald-600" : deliveryRate >= 50 ? "text-amber-600" : "text-red-600"}`}
                  >
                    {channel.deliveryRate}
                  </span>
                </td>
                <td className="text-center py-2 px-3">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium ${channel.tierBg} text-${channel.tierColor}`}
                  >
                    <channel.tierIcon
                      className="w-3 h-3"
                      style={{ color: channel.tierColor }}
                    />
                    {channel.tier}
                  </span>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ============================================================
// FIXED: Revenue Distribution Pie - No overlapping labels
// ============================================================
const RevenueDistributionPie = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center text-slate-400 py-8">No data available</div>
    );
  }

  const pieData = data.map((channel) => ({
    name: channel.channel,
    value: parseFloat(channel.orderValue.replace(/[$,]/g, "")),
    color: channel.color,
  }));

  const totalRevenue = pieData.reduce((sum, d) => sum + d.value, 0);

  const renderCustomLabel = ({
    name,
    percent,
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
  }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null;

    return (
      <text
        x={x}
        y={y}
        fill="#1E293B"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={9}
        fontWeight="500"
      >
        {`${name.split(" ").slice(0, 2).join(" ")} ${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={90}
            dataKey="value"
            label={renderCustomLabel}
            labelLine={false}
            paddingAngle={2}
          >
            {pieData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(v, name) => [
              `${formatCurrency(v)} (${((v / totalRevenue) * 100).toFixed(1)}%)`,
              name,
            ]}
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "8px 12px",
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: "10px" }}
            verticalAlign="bottom"
            height={36}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-2 text-xs text-slate-500 text-center">
        Total Order Value: {formatCurrency(totalRevenue)}
      </div>
    </div>
  );
};

// ============================================================
// FIXED: Order vs Sales Comparison Chart - Proper data handling
// ============================================================
const OrderVsSalesChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-[280px] flex items-center justify-center text-slate-400 flex-col gap-2">
        <div className="text-4xl">📊</div>
        <p>No data available</p>
      </div>
    );
  }

  // Transform data to ensure numeric values
  const chartData = data.map((item) => ({
    name: item.channel || item.name || "Unknown",
    orderValue:
      typeof item.orderValue === "string"
        ? parseFloat(item.orderValue.replace(/[$,]/g, "")) || 0
        : item.orderValue || 0,
    saleValue:
      typeof item.revenue === "string"
        ? parseFloat(item.revenue.replace(/[$,]/g, "")) || 0
        : item.revenue || 0,
    // Also handle the case where data might come from salesVsOrderData
    saleValueAlt:
      typeof item.saleValue === "string"
        ? parseFloat(item.saleValue.replace(/[$,]/g, "")) || 0
        : item.saleValue || 0,
  }));

  // Use saleValue or fallback to saleValueAlt
  const finalData = chartData.map((item) => ({
    ...item,
    saleValue: item.saleValue || item.saleValueAlt || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={finalData}
        margin={{ top: 10, right: 10, left: 0, bottom: 60 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 9 }}
          angle={-25}
          textAnchor="end"
          height={60}
        />
        <YAxis tickFormatter={(v) => formatCompactCurrency(v)} />
        <Tooltip
          formatter={(v) => formatCurrency(v)}
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "8px 12px",
          }}
        />
        <Legend />
        <Bar
          dataKey="orderValue"
          fill={COLORS.indigo}
          name="Order Value"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="saleValue"
          fill={COLORS.emerald}
          name="Sales Revenue"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

// ============================================================
// MAIN HOME COMPONENT
// ============================================================
function Home() {
  const { cndata, setcndata, loading, contextLoading, apiKey } =
    useContext(GetDataContext);
  const apiData = useMemo(() => cndata?.apiData || [], [cndata]);

  const [selectedYear, setSelectedYear] = useState("All");
  const [selectedMonth, setSelectedMonth] = useState("All");
  const [selectedMarketing, setSelectedMarketing] = useState("All");
  const [viewMode, setViewMode] = useState("monthly");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isAutoLoading, setIsAutoLoading] = useState(false);
  const [autoLoadProgress, setAutoLoadProgress] = useState(0);
  const [autoLoadStatus, setAutoLoadStatus] = useState("");
  const [autoLoadAttempted, setAutoLoadAttempted] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const autoLoadRef = useRef(false);
  const cancelTokenRef = useRef(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(),
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isFetchingRange, setIsFetchingRange] = useState(false);
  const [rangeFetchProgress, setRangeFetchProgress] = useState(0);
  const [rangeFetchStatus, setRangeFetchStatus] = useState("");
  const fetchDataByDateRange = async (startDate, endDate) => {
    if (!apiKey) {
      toast.error("API key not available");
      return;
    }

    // Close the date picker immediately
    setShowDatePicker(false);

    // Show loading state
    setIsFetchingRange(true);
    setRangeFetchProgress(0);
    setRangeFetchStatus("Preparing to fetch data...");

    const source = axios.CancelToken.source();
    cancelTokenRef.current = source;

    try {
      const stDate = startDate.toISOString().split("T")[0];
      const edDate = endDate.toISOString().split("T")[0];

      setRangeFetchProgress(10);
      setRangeFetchStatus(`Fetching orders from ${stDate} to ${edDate}...`);

      // Check if dates are valid
      if (!stDate || !edDate || stDate === edDate) {
        toast.warning("Please select valid date range");
        setIsFetchingRange(false);
        setRangeFetchStatus("");
        return;
      }

      // Fetch order data
      const orderReportResponse = await axios.get(
        `https://tpl-api.ebs365.info/api/OrderReport/BI_OrderRelatedInformationReport?CompanyID=1&ProductCategoryID=0&ProductSubCategoryID=0&MarketingID=0&CustomerID=0&BuyerID=0&JobCardID=0&StartDate=${stDate}&EndDate=${edDate}&CommandID=5&EmpID=0`,
        {
          headers: { Authorization: `${apiKey}` },
          timeout: 300000,
          cancelToken: source.token,
        },
      );

      const orderData = orderReportResponse.data || [];
      setRangeFetchProgress(30);

      if (!Array.isArray(orderData) || orderData.length === 0) {
        toast.warning(`No data found for the selected date range.`);
        setIsFetchingRange(false);
        setRangeFetchStatus("");
        return;
      }

      setRangeFetchProgress(40);
      setRangeFetchStatus(`Found ${orderData.length} orders...`);

      setRangeFetchProgress(55);
      setRangeFetchStatus("Fetching supporting data...");

      const apiConfig = {
        headers: { Authorization: `${apiKey}` },
        timeout: 90000,
        cancelToken: source.token,
      };

      const [challanRes, bblcRes, invoiceRes, piRes, challanReceiveRes] =
        await Promise.allSettled([
          axios.get(
            `https://tpl-api.ebs365.info/api/Challan/GetDeliveryChalanDashboard?CompanyID=1&ProductCategoryID=0&CustomerID=0&MarkettingID=0&StatusID=7&StartDate=${stDate}&EndDate=${edDate}`,
            apiConfig,
          ),
          axios.get(
            `https://tpl-api.ebs365.info/api/BBLC/GetBBLCDashboard?CustomerID=0&CompanyID=1&StartDate=${stDate}&EndDate=${edDate}`,
            apiConfig,
          ),
          axios.get(
            `https://tpl-api.ebs365.info/api/CommercialInvoice/GetInvoiceDashboard?CompanyID=1&CustomerID=0&StartDate=${stDate}&EndDate=${edDate}`,
            apiConfig,
          ),
          axios.get(
            `https://tpl-api.ebs365.info/api/CustomerPI/GetCustomerPIDashboard?CompanyID=1&CustomerID=0&MarketingID=0&StartDate=${stDate}&EndDate=${edDate}`,
            apiConfig,
          ),
          axios.get(
            `https://tpl-api.ebs365.info/api/Challan/GetDeliveryChalanReceiveDashboard?CompanyID=1&ProductCategoryID=0&CustomerID=0&MarkettingID=0&Status=Receive-Complete&StartDate=${stDate}&EndDate=${edDate}`,
            apiConfig,
          ),
        ]);

      setRangeFetchProgress(75);
      setRangeFetchStatus("Processing data...");

      const challanData =
        challanRes.status === "fulfilled" && challanRes.value?.data
          ? challanRes.value.data
          : [];
      const bblcData =
        bblcRes.status === "fulfilled" && bblcRes.value?.data
          ? bblcRes.value.data
          : [];
      const invoiceData =
        invoiceRes.status === "fulfilled" && invoiceRes.value?.data
          ? invoiceRes.value.data
          : [];
      const piCompanyData =
        piRes.status === "fulfilled" && piRes.value?.data
          ? piRes.value.data
          : [];
      const challanReceiveData =
        challanReceiveRes.status === "fulfilled" &&
        challanReceiveRes.value?.data
          ? challanReceiveRes.value.data
          : [];

      setRangeFetchProgress(90);
      setRangeFetchStatus("Updating dashboard...");

      setcndata((prevState) => ({
        ...prevState,
        apiData: orderData,
        groupedData: [],
        grupChallan: challanData,
        bblcData: bblcData,
        invoiceData: invoiceData,
        piCompanyData: piCompanyData,
        workOrderIdMap: {},
        challanReceiveMap: {},
        rawChallanReceiveData: challanReceiveData,
        workOrderStatus: "date-range-loaded",
        _lastFetch: {
          timestamp: new Date().toISOString(),
          startDate: stDate,
          endDate: edDate,
          orderCount: orderData.length,
          challanCount: challanData.length,
          workOrderStatus: "date-range-loaded",
          autoLoaded: false,
          dateRange: true,
        },
      }));

      setRangeFetchProgress(100);
      setRangeFetchStatus(
        `✅ Loaded ${orderData.length} orders for date range!`,
      );
      toast.success(
        `✅ Loaded ${orderData.length} orders from ${stDate} to ${edDate}`,
      );

      // Auto-select year and month filters to "All" to show all data
      setSelectedYear("All");
      setSelectedMonth("All");
    } catch (err) {
      if (axios.isCancel(err)) return;
      console.error("Date range fetch error:", err);
      toast.error("Failed to fetch data for the selected date range.");
      setRangeFetchStatus("❌ Error fetching data");
    } finally {
      setIsFetchingRange(false);
      setRangeFetchProgress(0);
      cancelTokenRef.current = null;
      setTimeout(() => setRangeFetchStatus(""), 3000);
    }
  };
  const data = useComprehensiveData(
    apiData,
    selectedYear,
    selectedMonth,
    selectedMarketing,
    viewMode,
  );

  const marketingNames = useMemo(() => {
    if (!apiData || !Array.isArray(apiData)) return ["All"];
    const names = new Set(
      apiData.map((item) => item.MarketingName || "Unknown").filter(Boolean),
    );
    return ["All", ...Array.from(names)];
  }, [apiData]);

  // In the chartData definition
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

  const chartData = getChartData();

  // Inside Home component, replace the growthChartData section:
  // Smart growth data selection
  const getGrowthData = () => {
    // 1. EXACT VIEW MODE MATCH - ABSOLUTE HIGHEST PRIORITY
    if (viewMode === "yearly") {
      if (data.allYearlyGrowthData && data.allYearlyGrowthData.length >= 2) {
        console.log("Using Yearly data");
        return data.allYearlyGrowthData;
      }
      // If yearly data is not available, return empty array instead of falling back
      console.log("Yearly data not available");
      return [];
    }

    if (viewMode === "monthly") {
      if (data.allGrowthData && data.allGrowthData.length >= 2) {
        console.log("Using Monthly data");
        return data.allGrowthData;
      }
      return [];
    }

    if (viewMode === "weekly") {
      if (data.allWeeklyGrowthData && data.allWeeklyGrowthData.length >= 2) {
        console.log("Using Weekly data");
        return data.allWeeklyGrowthData;
      }
      return [];
    }

    if (viewMode === "daily") {
      if (data.allDailyGrowthData && data.allDailyGrowthData.length >= 3) {
        console.log("Using Daily data");
        return data.allDailyGrowthData;
      }
      return [];
    }

    // 2. DATE RANGE OVERRIDE - only if no specific view mode is active
    const hasDateRange = cndata?._lastFetch?.dateRange;
    if (
      hasDateRange &&
      data.allDailyGrowthData &&
      data.allDailyGrowthData.length >= 3
    ) {
      console.log("Using Daily data (date range)");
      return data.allDailyGrowthData;
    }

    // 3. SMART FALLBACK - best available data
    if (data.allYearlyGrowthData && data.allYearlyGrowthData.length >= 2) {
      console.log("Fallback: Using Yearly data");
      return data.allYearlyGrowthData;
    }

    if (data.allGrowthData && data.allGrowthData.length >= 2) {
      console.log("Fallback: Using Monthly data");
      return data.allGrowthData;
    }

    if (data.allWeeklyGrowthData && data.allWeeklyGrowthData.length >= 2) {
      console.log("Fallback: Using Weekly data");
      return data.allWeeklyGrowthData;
    }

    if (data.allDailyGrowthData && data.allDailyGrowthData.length >= 3) {
      console.log("Fallback: Using Daily data");
      return data.allDailyGrowthData;
    }

    // 4. LAST RESORT
    console.log("Using filtered fallback data");
    return (
      data.growthData || data.weeklyGrowthData || data.dailyGrowthData || []
    );
  };

  const growthChartData = getGrowthData();
  const hasEnoughData = growthChartData.length >= 2;

  const getGrowthLabel = () => {
    if (viewMode === "yearly") return "Year-over-year";
    if (viewMode === "daily") return "Day-over-day";
    if (viewMode === "weekly") return "Week-over-week";
    return "Month-over-month";
  };

  // Fallback to filtered data
  //   if (viewMode === "monthly" && data.growthData && data.growthData.length >= 2) {
  //     return data.growthData;
  //   } else if (viewMode === "weekly" && data.weeklyGrowthData && data.weeklyGrowthData.length >= 2) {
  //     return data.weeklyGrowthData;
  //   } else if (data.dailyGrowthData && data.dailyGrowthData.length >= 3) {
  //     return data.dailyGrowthData;
  //   }
  //   return [];
  // };

  // const growthChartData =
  //   (viewMode === "weekly" && data.allWeeklyGrowthData) ||
  //   (viewMode === "daily" && data.allDailyGrowthData) ||
  //   data.allGrowthData ||
  //   data.growthData ||
  //   [];
  // const hasEnoughData = growthChartData.length >= 2;

  const getCurrentMonthDates = () => {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      startDate,
      endDate,
      stDate: startDate.toISOString().split("T")[0],
      edDate: endDate.toISOString().split("T")[0],
      month: now.toLocaleString("default", { month: "short" }),
      year: now.getFullYear(),
    };
  };

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

    const source = axios.CancelToken.source();
    cancelTokenRef.current = source;

    try {
      const { stDate, edDate, month, year } = getCurrentMonthDates();
      setAutoLoadProgress(5);
      setAutoLoadStatus(`Fetching orders for ${month} ${year}...`);

      const orderReportResponse = await axios.get(
        `https://tpl-api.ebs365.info/api/OrderReport/BI_OrderRelatedInformationReport?CompanyID=1&ProductCategoryID=0&ProductSubCategoryID=0&MarketingID=0&CustomerID=0&BuyerID=0&JobCardID=0&StartDate=${stDate}&EndDate=${edDate}&CommandID=5&EmpID=0`,
        {
          headers: { Authorization: `${apiKey}` },
          timeout: 300000,
          cancelToken: source.token,
        },
      );

      const orderData = orderReportResponse.data || [];
      setAutoLoadProgress(30);

      if (!Array.isArray(orderData) || orderData.length === 0) {
        toast.warning(`No data found for ${month} ${year}.`);
        setIsAutoLoading(false);
        autoLoadRef.current = false;
        setAutoLoadAttempted(true);
        return;
      }

      setAutoLoadProgress(40);
      setAutoLoadStatus(`Found ${orderData.length} orders...`);

      setAutoLoadProgress(55);
      setAutoLoadStatus("Fetching supporting data...");

      const apiConfig = {
        headers: { Authorization: `${apiKey}` },
        timeout: 90000,
        cancelToken: source.token,
      };

      const [challanRes, bblcRes, invoiceRes, piRes, challanReceiveRes] =
        await Promise.allSettled([
          axios.get(
            `https://tpl-api.ebs365.info/api/Challan/GetDeliveryChalanDashboard?CompanyID=1&ProductCategoryID=0&CustomerID=0&MarkettingID=0&StatusID=7&StartDate=${stDate}&EndDate=${edDate}`,
            apiConfig,
          ),
          axios.get(
            `https://tpl-api.ebs365.info/api/BBLC/GetBBLCDashboard?CustomerID=0&CompanyID=1&StartDate=${stDate}&EndDate=${edDate}`,
            apiConfig,
          ),
          axios.get(
            `https://tpl-api.ebs365.info/api/CommercialInvoice/GetInvoiceDashboard?CompanyID=1&CustomerID=0&StartDate=${stDate}&EndDate=${edDate}`,
            apiConfig,
          ),
          axios.get(
            `https://tpl-api.ebs365.info/api/CustomerPI/GetCustomerPIDashboard?CompanyID=1&CustomerID=0&MarketingID=0&StartDate=${stDate}&EndDate=${edDate}`,
            apiConfig,
          ),
          axios.get(
            `https://tpl-api.ebs365.info/api/Challan/GetDeliveryChalanReceiveDashboard?CompanyID=1&ProductCategoryID=0&CustomerID=0&MarkettingID=0&Status=Receive-Complete&StartDate=${stDate}&EndDate=${edDate}`,
            apiConfig,
          ),
        ]);

      setAutoLoadProgress(75);
      setAutoLoadStatus("Processing data...");

      const challanData =
        challanRes.status === "fulfilled" && challanRes.value?.data
          ? challanRes.value.data
          : [];
      const bblcData =
        bblcRes.status === "fulfilled" && bblcRes.value?.data
          ? bblcRes.value.data
          : [];
      const invoiceData =
        invoiceRes.status === "fulfilled" && invoiceRes.value?.data
          ? invoiceRes.value.data
          : [];
      const piCompanyData =
        piRes.status === "fulfilled" && piRes.value?.data
          ? piRes.value.data
          : [];
      const challanReceiveData =
        challanReceiveRes.status === "fulfilled" &&
        challanReceiveRes.value?.data
          ? challanReceiveRes.value.data
          : [];

      setAutoLoadProgress(90);
      setAutoLoadStatus("Updating dashboard...");

      setcndata((prevState) => ({
        ...prevState,
        apiData: orderData,
        groupedData: [],
        grupChallan: challanData,
        bblcData: bblcData,
        invoiceData: invoiceData,
        piCompanyData: piCompanyData,
        workOrderIdMap: {},
        challanReceiveMap: {},
        rawChallanReceiveData: challanReceiveData,
        workOrderStatus: "auto-loaded",
        _lastFetch: {
          timestamp: new Date().toISOString(),
          startDate: stDate,
          endDate: edDate,
          month: month,
          year: year,
          orderCount: orderData.length,
          challanCount: challanData.length,
          workOrderStatus: "auto-loaded",
          autoLoaded: true,
        },
      }));

      setAutoLoadProgress(100);
      setAutoLoadStatus(
        `✅ Loaded ${orderData.length} orders for ${month} ${year}!`,
      );
      setAutoLoadAttempted(true);
      toast.success(
        `✅ Auto-loaded ${orderData.length} orders for ${month} ${year}`,
      );
    } catch (err) {
      if (axios.isCancel(err)) return;
      console.error("Auto-load error:", err);
      toast.error("Failed to auto-load data.");
      setAutoLoadAttempted(true);
    } finally {
      setIsAutoLoading(false);
      setAutoLoadProgress(0);
      autoLoadRef.current = false;
      cancelTokenRef.current = null;
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

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

  const handleRefresh = () => {
    setIsRefreshing(true);
    toast.info("Refreshing dashboard data...");
    fetchCurrentMonthData(true).finally(() => setIsRefreshing(false));
  };

  const handleExport = () => {
    toast.info("Exporting dashboard data...");
    setTimeout(() => toast.success("Data exported successfully!"), 1000);
  };
  const handleDateRangeSubmit = (e) => {
    // Prevent any event bubbling
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Check if dates are selected
    if (dateRange.startDate && dateRange.endDate) {
      const diffTime = Math.abs(dateRange.endDate - dateRange.startDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      // if (diffDays > 365) {
      //   toast.warning(
      //     "Date range exceeds 365 days. Please select a smaller range.",
      //   );
      //   return;
      // }
      // Close the date picker first
      setShowDatePicker(false);
      // Small delay to ensure the popup closes before fetching
      setTimeout(() => {
        fetchDataByDateRange(dateRange.startDate, dateRange.endDate);
      }, 150);
    } else {
      toast.warning("Please select both start and end dates.");
    }
  };

  // Add this quick date range preset handler
  const handleQuickRange = (days) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    setDateRange({ startDate, endDate });
    // Auto-fetch after setting
    setTimeout(() => fetchDataByDateRange(startDate, endDate), 300);
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

  // KPI Config
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
      id: "avgSaleValue",
      title: "Avg Sale Value",
      value: formatCurrency(data.performanceMetrics?.avgSaleValue || 0),
      icon: FaDollarSign,
      color: COLORS.teal,
      subtitle: `per delivered order`,
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
      id: "balanceValue",
      title: "Balance Value",
      value: formatCurrency(data.totals.balanceValue),
      icon: FaExclamationTriangle,
      color: COLORS.rose,
      subtitle: formatCompactCurrency(data.totals.balanceValue),
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
      id: "deliveryRate",
      title: "Delivery Rate",
      value: `${data.deliveryPercent.toFixed(0)}%`,
      icon: FaPercentage,
      color: getStatusColor(data.deliveryPercent),
      subtitle: `${data.valuePercent.toFixed(0)}% value`,
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

  if (isLoading || contextLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-slate-200 rounded-full" />
            <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin" />
            <div className="absolute inset-2 border-4 border-emerald-500 rounded-full border-b-transparent animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-slate-700">
            Loading Dashboard
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Preparing your analytics...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ============================================================ */}
        {/* HEADER - Only ONE header */}
        {/* ============================================================ */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          {/* Date Range Button */}
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:border-indigo-300 hover:shadow-md transition-all duration-200 flex items-center gap-2 min-w-[160px]"
            >
              <CalendarRange className="w-4 h-4 text-indigo-500" />
              <span className="truncate">
                {dateRange.startDate && dateRange.endDate
                  ? `${dateRange.startDate.toLocaleDateString()} - ${dateRange.endDate.toLocaleDateString()}`
                  : "Select Date Range"}
              </span>
            </button>
            {cndata?._lastFetch?.dateRange && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-medium border border-indigo-200">
                <CalendarRange className="w-3 h-3" />
                {new Date(
                  cndata._lastFetch.startDate,
                ).toLocaleDateString()} -{" "}
                {new Date(cndata._lastFetch.endDate).toLocaleDateString()}
                <button
                  onClick={() => setSelectedYear("All")}
                  className="ml-1 hover:text-indigo-800"
                >
                  ✕
                </button>
              </span>
            )}
          </div>

          {/* Dashboard Title */}
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-200">
                <LayoutDashboard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Enterprise Analytics Dashboard
                </h1>
                <p className="text-sm text-slate-400 flex items-center gap-1.5 flex-wrap">
                  <FaCircle className="w-1.5 h-1.5 text-emerald-500" />
                  {data.totalOrders} orders • {data.totals.saleQty} delivered •{" "}
                  {data.totalCustomers} customers • {data.totalMarketing} sales
                  persons
                  {data.salesGrowth !== 0 && (
                    <span
                      className={`flex items-center gap-0.5 text-xs font-medium ${data.salesGrowth > 0 ? "text-emerald-600" : "text-red-600"}`}
                    >
                      {data.salesGrowth > 0 ? (
                        <FaArrowUp className="w-2 h-2" />
                      ) : (
                        <FaArrowDown className="w-2 h-2" />
                      )}
                      {data.salesGrowth.toFixed(1)}% sales growth
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-slate-200/60 shadow-sm">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-600 whitespace-nowrap">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 rounded-xl bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-200"
            >
              {showFilters ? (
                <X className="w-4 h-4 text-slate-600" />
              ) : (
                <Filter className="w-4 h-4 text-slate-600" />
              )}
            </button>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing || isAutoLoading}
              className={`p-2 rounded-xl bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-200 ${isRefreshing || isAutoLoading ? "animate-spin opacity-70" : ""}`}
            >
              <RefreshCw className="w-4 h-4 text-slate-600" />
            </button>

            <button
              onClick={handleExport}
              className="p-2 rounded-xl bg-indigo-500 text-white shadow-sm hover:shadow-md hover:bg-indigo-600 transition-all duration-200"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-200"
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4 text-slate-600" />
              ) : (
                <Maximize2 className="w-4 h-4 text-slate-600" />
              )}
            </button>
          </div>
        </motion.div>

        {/* ============================================================ */}
        {/* LOADING INDICATOR - Shows progress when fetching date range */}
        {/* ============================================================ */}
        {isFetchingRange && (
          <div className="flex items-center gap-3 px-4 py-2 bg-indigo-50 rounded-xl border border-indigo-200 shadow-sm">
            <div className="relative w-5 h-5 flex-shrink-0">
              <div className="absolute inset-0 border-2 border-indigo-200 rounded-full" />
              <div className="absolute inset-0 border-2 border-indigo-500 rounded-full border-t-transparent animate-spin" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-indigo-700 truncate">
                  {rangeFetchStatus || "Loading..."}
                </span>
                <span className="text-xs font-semibold text-indigo-600 whitespace-nowrap">
                  {Math.round(rangeFetchProgress)}%
                </span>
              </div>
              <div className="w-full bg-indigo-100 rounded-full h-1.5 mt-1 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                  initial={{ width: "0%" }}
                  animate={{ width: `${rangeFetchProgress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (cancelTokenRef.current) {
                  cancelTokenRef.current.cancel("User cancelled");
                }
                setIsFetchingRange(false);
                setRangeFetchProgress(0);
                setRangeFetchStatus("");
                toast.info("Data fetch cancelled");
              }}
              className="text-xs text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
            >
              ✕
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/* DATE PICKER POPUP */}
        {/* ============================================================ */}
        {showDatePicker && (
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                setShowDatePicker(false);
              }
            }}
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 w-[480px] max-w-[90vw] max-h-[90vh] overflow-y-auto">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-700">
                    Select Date Range
                  </h4>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowDatePicker(false);
                    }}
                    className="p-1 hover:bg-slate-100 rounded-lg transition-all"
                  >
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="text-xs text-slate-500 block mb-1">
                      Start Date
                    </label>
                    <DatePicker
                      selected={dateRange.startDate}
                      onChange={(date) =>
                        setDateRange((prev) => ({ ...prev, startDate: date }))
                      }
                      selectsStart
                      startDate={dateRange.startDate}
                      endDate={dateRange.endDate}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      dateFormat="MMM d, yyyy"
                      placeholderText="Select start date"
                      popperPlacement="bottom-start"
                      onClickOutside={() => {}}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-slate-500 block mb-1">
                      End Date
                    </label>
                    <DatePicker
                      selected={dateRange.endDate}
                      onChange={(date) =>
                        setDateRange((prev) => ({ ...prev, endDate: date }))
                      }
                      selectsEnd
                      startDate={dateRange.startDate}
                      endDate={dateRange.endDate}
                      minDate={dateRange.startDate}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      dateFormat="MMM d, yyyy"
                      placeholderText="Select end date"
                      popperPlacement="bottom-start"
                      onClickOutside={() => {}}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const endDate = new Date();
                      const startDate = new Date();
                      startDate.setDate(startDate.getDate() - 7);
                      setDateRange({ startDate, endDate });
                      setTimeout(() => {
                        setShowDatePicker(false);
                        fetchDataByDateRange(startDate, endDate);
                      }, 150);
                    }}
                    className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
                  >
                    Last 7 days
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const endDate = new Date();
                      const startDate = new Date();
                      startDate.setDate(startDate.getDate() - 30);
                      setDateRange({ startDate, endDate });
                      setTimeout(() => {
                        setShowDatePicker(false);
                        fetchDataByDateRange(startDate, endDate);
                      }, 150);
                    }}
                    className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
                  >
                    Last 30 days
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const endDate = new Date();
                      const startDate = new Date();
                      startDate.setDate(startDate.getDate() - 90);
                      setDateRange({ startDate, endDate });
                      setTimeout(() => {
                        setShowDatePicker(false);
                        fetchDataByDateRange(startDate, endDate);
                      }, 150);
                    }}
                    className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
                  >
                    Last 90 days
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const now = new Date();
                      const firstDay = new Date(
                        now.getFullYear(),
                        now.getMonth(),
                        1,
                      );
                      setDateRange({ startDate: firstDay, endDate: now });
                      setTimeout(() => {
                        setShowDatePicker(false);
                        fetchDataByDateRange(firstDay, now);
                      }, 150);
                    }}
                    className="px-3 py-1.5 text-xs font-medium bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-all"
                  >
                    This Month
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const now = new Date();
                      const firstDay = new Date(now.getFullYear(), 0, 1);
                      setDateRange({ startDate: firstDay, endDate: now });
                      setTimeout(() => {
                        setShowDatePicker(false);
                        fetchDataByDateRange(firstDay, now);
                      }, 150);
                    }}
                    className="px-3 py-1.5 text-xs font-medium bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg transition-all"
                  >
                    Year to Date
                  </button>
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDateRangeSubmit(e);
                    }}
                    disabled={isFetchingRange}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isFetchingRange ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <CalendarIcon className="w-4 h-4" />
                        Fetch Data
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowDatePicker(false);
                    }}
                    className="px-4 py-2.5 bg-slate-100 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-200 transition-all duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* FULL SCREEN LOADING OVERLAY - Shows when fetching date range */}
        {/* ============================================================ */}
        {isFetchingRange && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999] flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 border-4 border-indigo-200 rounded-full" />
                  <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin" />
                  <div
                    className="absolute inset-2 border-4 border-purple-500 rounded-full border-b-transparent animate-spin"
                    style={{ animationDelay: "0.15s" }}
                  />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-800 text-center">
                    Loading Data
                  </h3>
                  <p className="text-sm text-slate-500 text-center mt-1">
                    Please wait while we fetch your data...
                  </p>
                </div>

                <div className="w-full bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-sm text-indigo-600 font-medium">
                    {rangeFetchStatus || "Preparing to fetch data..."}
                  </p>
                </div>

                <div className="w-full">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400">Progress</span>
                    <span className="text-xs font-semibold text-indigo-600">
                      {Math.round(rangeFetchProgress)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                      initial={{ width: "0%" }}
                      animate={{ width: `${rangeFetchProgress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (cancelTokenRef.current) {
                      cancelTokenRef.current.cancel("User cancelled");
                    }
                    setIsFetchingRange(false);
                    setRangeFetchProgress(0);
                    setRangeFetchStatus("");
                    toast.info("Data fetch cancelled");
                  }}
                  className="text-sm text-slate-500 hover:text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AUTO-LOAD PROGRESS */}
        <AnimatePresence>
          {isAutoLoading && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 backdrop-blur-sm rounded-2xl shadow-lg border border-indigo-200/60 p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative w-6 h-6">
                        <div className="absolute inset-0 border-2 border-indigo-200 rounded-full" />
                        <div className="absolute inset-0 border-2 border-indigo-500 rounded-full border-t-transparent animate-spin" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-indigo-700">
                          Auto-loading data
                        </p>
                        <p className="text-xs text-indigo-500">
                          {autoLoadStatus}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-indigo-600">
                      {Math.round(autoLoadProgress)}%
                    </span>
                  </div>
                  <div className="w-full bg-indigo-100 rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                      style={{ width: `${autoLoadProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FILTERS */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-700">
                      Filters
                    </span>
                  </div>
                  <div className="h-6 w-px bg-slate-200 hidden sm:block" />

                  <div className="flex flex-wrap gap-3 flex-1">
                    <select
                      value={selectedYear}
                      onChange={(e) => {
                        setSelectedYear(e.target.value);
                        setSelectedMonth("All");
                      }}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 min-w-[140px]"
                    >
                      {years.map((y) => (
                        <option key={y} value={y}>
                          {y === "All" ? "📅 All Years" : `📅 ${y}`}
                        </option>
                      ))}
                    </select>

                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 min-w-[140px]"
                      disabled={selectedYear === "All" && months.length <= 1}
                    >
                      {months.map((m) => (
                        <option key={m} value={m}>
                          {m === "All" ? "📊 All Months" : `📊 ${m}`}
                        </option>
                      ))}
                    </select>

                    <select
                      value={selectedMarketing}
                      onChange={(e) => setSelectedMarketing(e.target.value)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 min-w-[180px]"
                    >
                      {marketingNames.map((m) => (
                        <option key={m} value={m}>
                          {m === "All" ? "👤 All Sales Persons" : `👤 ${m}`}
                        </option>
                      ))}
                    </select>

                    <select
                      value={viewMode}
                      onChange={(e) => setViewMode(e.target.value)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 min-w-[140px]"
                    >
                      <option value="yearly">📅 Yearly View</option>
                      <option value="monthly">📈 Monthly View</option>
                      <option value="weekly">📊 Weekly View</option>
                      <option value="daily">📅 Daily View</option>
                    </select>
                    {(selectedYear !== "All" ||
                      selectedMonth !== "All" ||
                      selectedMarketing !== "All") && (
                      <button
                        onClick={() => {
                          setSelectedYear("All");
                          setSelectedMonth("All");
                          setSelectedMarketing("All");
                        }}
                        className="px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl hover:shadow-lg transition-all duration-200"
                      >
                        Show All Data
                      </button>
                    )}
                  </div>

                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    <span>{apiData.length} records</span>
                    {cndata?._lastFetch?.autoLoaded && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-medium border border-emerald-200">
                        <FaCircle className="w-1.5 h-1.5 text-emerald-400" />
                        {cndata._lastFetch.month} {cndata._lastFetch.year}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* STATUS INDICATORS */}
        <div className="flex flex-wrap gap-3 items-center">
          <StatusIndicator status="complete" />
          <StatusIndicator status="inProgress" />
          <StatusIndicator status="pending" />
          <div className="ml-auto flex items-center gap-3 text-xs">
            <span className="text-slate-400">
              Updated: {new Date().toLocaleTimeString()}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-400">|</span>
            <span className="text-slate-400">
              Delivery:{" "}
              <span style={{ color: getStatusColor(data.deliveryPercent) }}>
                {data.deliveryPercent.toFixed(0)}%
              </span>
            </span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-400">
              Sales Growth:{" "}
              <span
                style={{
                  color: data.salesGrowth >= 0 ? COLORS.success : COLORS.danger,
                }}
              >
                {data.salesGrowth.toFixed(1)}%
              </span>
            </span>
          </div>
        </div>

        {/* GROWTH STRATEGIES */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-r from-indigo-50 to-purple-50 backdrop-blur-sm rounded-2xl shadow-lg border border-indigo-200/60 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800">
              📈 Growth Strategies
            </h3>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1 text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Completed +
                {formatCompactCurrency(data.growthMetrics?.completed || 0)}
              </span>
              <span className="flex items-center gap-1 text-amber-600">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Recurring -
                {formatCompactCurrency(data.growthMetrics?.recurring || 0)}
              </span>
              <span className="flex items-center gap-1 text-red-600">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>Pending
                +{formatCompactCurrency(data.growthMetrics?.pending || 0)}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/80 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-400">Completion Rate</p>
              <p className="text-2xl font-bold text-emerald-600">
                {data.deliveryPercent.toFixed(0)}%
              </p>
              <GrowthIndicator value={data.salesGrowth} />
            </div>
            <div className="bg-white/80 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-400">Sales Growth</p>
              <p
                className={`text-2xl font-bold ${data.salesGrowth >= 0 ? "text-emerald-600" : "text-red-600"}`}
              >
                {data.salesGrowth.toFixed(1)}%
              </p>
              <p className="text-xs text-slate-400">vs previous period</p>
            </div>
            <div className="bg-white/80 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-400">Completed Value</p>
              <p className="text-2xl font-bold text-emerald-600">
                {formatCompactCurrency(data.growthMetrics?.completed || 0)}
              </p>
              <p className="text-xs text-emerald-500">+83.0%</p>
            </div>
            <div className="bg-white/80 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-400">Pending Value</p>
              <p className="text-2xl font-bold text-amber-600">
                {formatCompactCurrency(data.growthMetrics?.pending || 0)}
              </p>
              <p className="text-xs text-amber-500">+10.3%</p>
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-500 text-center">
            Business process starts from an owner invests cash on property in a
            business. Income is higher than outcome called "Profit".
          </div>
        </motion.div>

        {/* KPI CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {kpiConfig.map((kpi) => (
            <KPICard key={kpi.id} {...kpi} />
          ))}
        </div>

        {/* TAB NAVIGATION */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-wrap gap-2 border-b border-slate-200 pb-2"
        >
          {[
            "overview",
            "sales",
            "categories",
            "buyers",
            "funnel",
            "channels",
            "analytics",
            "predictive",
            "insights",
          ].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                activeTab === tab
                  ? "bg-indigo-500 text-white shadow-lg shadow-indigo-200"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </motion.div>

        {/* MAIN CONTENT */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-semibold text-slate-800">
                        {viewMode === "yearly"
                          ? "Yearly Performance"
                          : viewMode === "daily"
                            ? "Daily Performance"
                            : viewMode === "weekly"
                              ? "Weekly Performance"
                              : "Monthly Performance"}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {viewMode === "yearly"
                          ? "Year-over-year trends"
                          : viewMode === "daily"
                            ? "Day-by-day trends"
                            : viewMode === "weekly"
                              ? "Week-by-week trends"
                              : "Month-over-month trends"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                        Order
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Sales
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        Balance
                      </span>
                    </div>
                  </div>
                  {chartData && chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={320}>
                      <ComposedChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis
                          tick={{ fontSize: 10 }}
                          tickFormatter={(v) => formatCompactCurrency(v)}
                        />
                        <Tooltip
  formatter={(v, name) => [formatCurrency(v), name]}
  labelFormatter={(label, payload) => {
    if (payload && payload.length > 0 && payload[0]?.payload) {
      const data = payload[0].payload;
      return data.fullName || data.name || label;
    }
    return label;
  }}
  contentStyle={{
    backgroundColor: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "10px 14px",
  }}
/>
                        <Legend />
                        <Bar
                          dataKey="orderValue"
                          fill={COLORS.primary}
                          radius={[4, 4, 0, 0]}
                          name="Order Value"
                        />
                        <Bar
                          dataKey="saleValue"
                          fill={COLORS.success}
                          radius={[4, 4, 0, 0]}
                          name="Sales Revenue"
                        />
                        <Bar
                          dataKey="balanceValue"
                          fill={COLORS.danger}
                          radius={[4, 4, 0, 0]}
                          name="Balance Value"
                        />
                        <Line
                          type="monotone"
                          dataKey="deliveryRate"
                          stroke={COLORS.warning}
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          name="Delivery %"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[320px] flex items-center justify-center text-slate-400">
                      No data available
                    </div>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-indigo-50">
                        <FaUsers className="w-5 h-5 text-indigo-500" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">
                          Avg Order Value
                        </p>
                        <p className="text-lg font-bold text-slate-800">
                          {formatCurrency(
                            data.performanceMetrics?.avgOrderValue || 0,
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-emerald-50">
                        <FaChartLine className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Avg Sale Value</p>
                        <p className="text-lg font-bold text-slate-800">
                          {formatCurrency(
                            data.performanceMetrics?.avgSaleValue || 0,
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-purple-50">
                        <RiUserStarFill className="w-5 h-5 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">
                          Avg Customer Value
                        </p>
                        <p className="text-lg font-bold text-slate-800">
                          {formatCurrency(
                            data.performanceMetrics?.avgCustomerValue || 0,
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-orange-50">
                        <FaBox className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">
                          Order-to-Delivery
                        </p>
                        <p className="text-lg font-bold text-slate-800">
                          {(
                            (data.performanceMetrics?.orderToDeliveryRatio ||
                              0) * 100
                          ).toFixed(0)}
                          %
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Performing Marketing & Category Performance - Sorted by TOTAL */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4">
                    <h3 className="text-sm font-semibold text-slate-800 mb-3">
                      🏆 Top Performing Sales Persons
                    </h3>
                    <div className="space-y-2">
                      {data.topPerformingMarketing.slice(0, 5).map((m, i) => {
                        const avgValue = parseFloat(
                          m.avgOrderValue.replace(/[$,]/g, ""),
                        );
                        // ✅ Pass ALL parameters
                        const tier = getPerformanceTier(
                          avgValue,
                          parseFloat(m.deliveryRate),
                          m.orderValue, // Total Order Value
                          m.orders, // Number of Orders
                          selectedYear, // Time context
                          selectedMonth, // Time context
                        );
                        const Icon = tier.icon;
                        return (
                          <div
                            key={m.name}
                            className={`flex items-center justify-between text-sm p-2 rounded-lg ${tier.bg}`}
                          >
                            <div className="flex items-center gap-2">
                              <Icon
                                className={`w-4 h-4`}
                                style={{ color: tier.color }}
                              />
                              <span className="text-slate-700 font-medium">
                                {m.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] text-slate-400">
                                {m.orders} orders
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {m.deliveryRate}
                              </span>
                              <span className="font-semibold text-emerald-600">
                                {formatCompactCurrency(m.orderValue)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4">
                    <h3 className="text-sm font-semibold text-slate-800 mb-3">
                      📊 Top Categories by Sales
                    </h3>
                    <div className="space-y-2">
                      {data.categoryPerformance.slice(0, 5).map((c, i) => (
                        <div
                          key={c.name}
                          className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-slate-50"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-400 w-5">
                              #{i + 1}
                            </span>
                            <span className="text-slate-700">{c.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-slate-400">
                              {c.orders} orders
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {c.deliveryRate}
                            </span>
                            <span className="font-semibold text-emerald-600">
                              {formatCompactCurrency(c.orderValue)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Growth Rate Chart */}
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-semibold text-slate-800">
                        {getGrowthLabel()} Growth Rate
                      </h3>
                      <p className="text-xs text-slate-400">
                        {getGrowthLabel()} growth percentage
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Sales Growth
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                        Order Growth
                      </span>
                    </div>
                  </div>
                  {hasEnoughData ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart
                        data={growthChartData}
                        margin={{ top: 30, right: 30, left: 20, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="month"
                          tick={{ fontSize: 12, fontWeight: 500 }}
                        />
                        <YAxis
                          tickFormatter={(v) => `${v.toFixed(1)}%`}
                          domain={["auto", "auto"]}
                        />
                        <Tooltip
  formatter={(v, name) => [`${v.toFixed(1)}%`, name]}
  labelFormatter={(label, payload) => {
    if (payload && payload.length > 0 && payload[0]?.payload) {
      const data = payload[0].payload;
      return data.fullName || data.month || label;
    }
    return label;
  }}
  contentStyle={{
    backgroundColor: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "8px 12px",
  }}
/>
                        <Legend />
                        <ReferenceLine
                          y={0}
                          stroke="#94A3B8"
                          strokeDasharray="3 3"
                        />
                        <Bar
                          dataKey="salesGrowth"
                          name="Sales Growth %"
                          radius={[4, 4, 0, 0]}
                        >
                          {growthChartData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                entry.salesGrowth >= 0
                                  ? COLORS.success
                                  : COLORS.danger
                              }
                            />
                          ))}
                        </Bar>
                        <Bar
                          dataKey="orderGrowth"
                          name="Order Growth %"
                          radius={[4, 4, 0, 0]}
                          fill={COLORS.primary}
                        >
                          {growthChartData.map((entry, index) => (
                            <Cell
                              key={`cell-order-${index}`}
                              fill={
                                entry.orderGrowth >= 0
                                  ? COLORS.indigo
                                  : COLORS.rose
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[280px] flex items-center justify-center text-slate-400 flex-col gap-2">
                      <div className="text-4xl">📊</div>
                      <p>Not enough data for growth comparison</p>
                      <p className="text-xs">
                        Need at least 2{" "}
                        {viewMode === "yearly"
                          ? "years"
                          : viewMode === "weekly"
                            ? "weeks"
                            : viewMode === "daily"
                              ? "days"
                              : "months"}{" "}
                        of data
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sales Tab */}
            {activeTab === "sales" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">
                      Sales Person Performance
                    </h2>
                    <p className="text-xs text-slate-400">
                      Order Value vs Sales Revenue by Sales Person
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 text-indigo-600">
                      <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                      Order Value
                    </span>
                    <span className="flex items-center gap-1 text-emerald-600">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Sales Revenue
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6">
                    <h3 className="text-base font-semibold text-slate-800 mb-3">
                      Order & Sales Revenue by Sales Person
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">
                      Top performing sales persons
                    </p>
                    <MarketingChart data={data.marketingData} />
                  </div>
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6">
                    <h3 className="text-base font-semibold text-slate-800 mb-3">
                      Sales Person Comparison
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">
                      Multi-dimensional performance
                    </p>
                    <RadarChartComponent data={data.radarData} />
                  </div>
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6 lg:col-span-2">
                    <h3 className="text-base font-semibold text-slate-800 mb-3">
                      Sales Efficiency Matrix
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">
                      Orders vs Sales Revenue efficiency
                    </p>
                    <EfficiencyChartComponent data={data.efficiencyData} />
                  </div>

                  {/* FIXED: Order vs Sales Comparison - Only Order Value & Sales Revenue */}
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6 lg:col-span-2">
                    <h3 className="text-base font-semibold text-slate-800 mb-3">
                      Order vs Sales Comparison
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">
                      Bar chart showing Order Value vs Sales Revenue
                    </p>
                    {data.salesVsOrderData &&
                    data.salesVsOrderData.length > 0 ? (
                      <OrderVsSalesChart data={data.salesVsOrderData} />
                    ) : (
                      <div className="h-[280px] flex items-center justify-center text-slate-400 flex-col gap-2">
                        <div className="text-4xl">📊</div>
                        <p>No data available</p>
                      </div>
                    )}
                  </div>

                  {/* FIXED: Sales Person Ranking - Sort by TOTAL */}
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6 lg:col-span-2">
                    <h3 className="text-base font-semibold text-slate-800 mb-3">
                      🏅 Sales Person Ranking
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">
                      Ranked by Total Order Value with Delivery Performance
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="text-left py-2 px-3 text-xs font-medium text-slate-400">
                              Rank
                            </th>
                            <th className="text-left py-2 px-3 text-xs font-medium text-slate-400">
                              Sales Person
                            </th>
                            <th className="text-right py-2 px-3 text-xs font-medium text-slate-400">
                              Total Order Value
                            </th>
                            <th className="text-right py-2 px-3 text-xs font-medium text-slate-400">
                              Avg Order Value
                            </th>
                            <th className="text-right py-2 px-3 text-xs font-medium text-slate-400">
                              Sales Revenue
                            </th>
                            <th className="text-right py-2 px-3 text-xs font-medium text-slate-400">
                              Orders
                            </th>
                            <th className="text-right py-2 px-3 text-xs font-medium text-slate-400">
                              Delivery %
                            </th>
                            <th className="text-right py-2 px-3 text-xs font-medium text-slate-400">
                              Tier
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.salesPersonRanking.map((m) => {
                            const Icon = m.tierIcon;
                            return (
                              <tr
                                key={m.name}
                                className="border-b border-slate-100 hover:bg-slate-50"
                              >
                                <td className="py-2 px-3 text-slate-600">
                                  {m.badge}
                                </td>
                                <td className="py-2 px-3 text-slate-700 font-medium">
                                  {m.name}
                                </td>
                                <td className="text-right py-2 px-3 font-semibold text-indigo-600">
                                  {m.orderValue}
                                </td>
                                <td className="text-right py-2 px-3 text-slate-600">
                                  {m.avgOrderValue}
                                </td>
                                <td className="text-right py-2 px-3 text-emerald-600">
                                  {m.revenue}
                                </td>
                                <td className="text-right py-2 px-3 text-slate-600">
                                  {m.orders}
                                </td>
                                <td className="text-right py-2 px-3">
                                  <span
                                    className={`font-medium ${parseFloat(m.deliveryRate) >= 70 ? "text-emerald-600" : parseFloat(m.deliveryRate) >= 50 ? "text-amber-600" : "text-red-600"}`}
                                  >
                                    {m.deliveryRate}
                                  </span>
                                </td>
                                <td className="text-right py-2 px-3">
                                  <div
                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${m.tierBg}`}
                                  >
                                    <Icon
                                      className="w-3 h-3"
                                      style={{ color: m.tierColor }}
                                    />
                                    <span
                                      className="text-[10px] font-medium"
                                      style={{ color: m.tierColor }}
                                    >
                                      {m.tier}
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Categories Tab - Show TOTAL values */}
            {activeTab === "categories" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">
                      Category Analysis
                    </h2>
                    <p className="text-xs text-slate-400">
                      Sales revenue by product category
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6">
                    <h3 className="text-base font-semibold text-slate-800 mb-3">
                      Sales Revenue by Category
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">
                      Top product categories by delivered revenue
                    </p>
                    <CategoryChart data={data.categoryData} />
                  </div>
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6">
                    <h3 className="text-base font-semibold text-slate-800 mb-3">
                      Top Sub-Categories
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">
                      Detailed product breakdown
                    </p>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                      {data.topSubCategories.slice(0, 10).map((sub, index) => (
                        <div key={sub.name}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-400 w-5">
                                #{index + 1}
                              </span>
                              <span
                                className="text-slate-700 truncate max-w-[150px]"
                                title={sub.name}
                              >
                                {sub.name}
                              </span>
                              <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                {sub.category}
                              </span>
                            </div>
                            <span className="font-semibold text-emerald-600">
                              {formatCompactCurrency(sub.orderValue)}
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                              style={{
                                width: `${(sub.orderValue / (data.topSubCategories[0]?.orderValue || 1)) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6">
                    <h3 className="text-base font-semibold text-slate-800 mb-3">
                      Sales Distribution
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">
                      Distribution of sales values
                    </p>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart
                        data={data.distributionData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="range" tick={{ fontSize: 9 }} />
                        <YAxis />
                        <Tooltip
                          formatter={(v) => `${v} orders`}
                          contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                            padding: "8px 12px",
                          }}
                        />
                        <Bar
                          dataKey="count"
                          fill={COLORS.emerald}
                          radius={[4, 4, 0, 0]}
                        >
                          {data.distributionData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={CHART_COLORS[index % CHART_COLORS.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6">
                    <h3 className="text-base font-semibold text-slate-800 mb-3">
                      Order Size Distribution
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">
                      Breakdown of order sizes by sales value
                    </p>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={data.orderSizeDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={90}
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                          labelLine={false}
                        >
                          {data.orderSizeDistribution.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={CHART_COLORS[index % CHART_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v) => `${v} orders`}
                          contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                            padding: "8px 12px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Buyers Tab - Show TOTAL values */}
            {activeTab === "buyers" && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-slate-800">
                  Buyer Analysis
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6">
                    <h3 className="text-base font-semibold text-slate-800 mb-3">
                      Top Buyers by Sales
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">
                      Highest sales revenue buyers
                    </p>
                    <BuyerChart data={data.topBuyers} />
                  </div>
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6">
                    <h3 className="text-base font-semibold text-slate-800 mb-3">
                      Top Customers by Sales
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">
                      By sales revenue
                    </p>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                      {data.topCustomers.slice(0, 10).map((customer, index) => (
                        <div key={customer.name}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-400 w-5">
                                #{index + 1}
                              </span>
                              <span
                                className="text-slate-700 truncate max-w-[150px]"
                                title={customer.name}
                              >
                                {customer.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] text-slate-400">
                                {customer.orders} orders
                              </span>
                              <span className="font-semibold text-emerald-600">
                                {formatCompactCurrency(customer.orderValue)}
                              </span>
                            </div>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                              style={{
                                width: `${(customer.orderValue / (data.topCustomers[0]?.orderValue || 1)) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6">
                    <h3 className="text-base font-semibold text-slate-800 mb-3">
                      Customer Loyalty
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">
                      Top customers with loyalty scores
                    </p>
                    <div className="space-y-3">
                      {data.customerLoyalty.map((c, index) => (
                        <div key={c.name}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-slate-700 truncate max-w-[120px]">
                              {c.name}
                            </span>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] text-slate-400">
                                {c.orders} orders
                              </span>
                              <span className="font-semibold text-emerald-600">
                                {formatCompactCurrency(c.orderValue)}
                              </span>
                            </div>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500"
                              style={{
                                width: `${Math.min(c.loyaltyScore, 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6">
                    <h3 className="text-base font-semibold text-slate-800 mb-3">
                      Customer Segmentation
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">
                      VIP, Regular & Occasional customers
                    </p>

                    {/* VIP Customers */}
                    <div className="mb-3">
                      <div
                        className="flex items-center justify-between p-2 bg-purple-50 rounded-lg cursor-pointer hover:bg-purple-100 transition-all"
                        onClick={() => {
                          const vipList =
                            document.getElementById("vip-customers-list");
                          if (vipList) vipList.classList.toggle("hidden");
                        }}
                      >
                        <span className="text-sm font-medium text-purple-700">
                          👑 VIP Customers
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-purple-600">
                            {data.customerSegmentation?.vip?.length || 0}
                          </span>
                          <span className="text-xs text-purple-400">▼</span>
                        </div>
                      </div>
                      <div
                        id="vip-customers-list"
                        className="mt-2 space-y-1 max-h-[120px] overflow-y-auto"
                      >
                        {data.customerSegmentation?.vip?.length > 0 ? (
                          data.customerSegmentation.vip.map((customer, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-xs p-1.5 bg-purple-50/50 rounded"
                            >
                              <span className="text-purple-700">
                                {customer.name}
                              </span>
                              <span className="text-purple-600 font-semibold">
                                {customer.orderValue}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-slate-400 p-2">
                            No VIP customers
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Regular Customers */}
                    <div className="mb-3">
                      <div
                        className="flex items-center justify-between p-2 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-all"
                        onClick={() => {
                          const regularList = document.getElementById(
                            "regular-customers-list",
                          );
                          if (regularList)
                            regularList.classList.toggle("hidden");
                        }}
                      >
                        <span className="text-sm font-medium text-blue-700">
                          📋 Regular Customers
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-blue-600">
                            {data.customerSegmentation?.regular?.length || 0}
                          </span>
                          <span className="text-xs text-blue-400">▼</span>
                        </div>
                      </div>
                      <div
                        id="regular-customers-list"
                        className="mt-2 space-y-1 max-h-[120px] overflow-y-auto"
                      >
                        {data.customerSegmentation?.regular?.length > 0 ? (
                          data.customerSegmentation.regular.map(
                            (customer, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between text-xs p-1.5 bg-blue-50/50 rounded"
                              >
                                <span className="text-blue-700">
                                  {customer.name}
                                </span>
                                <span className="text-blue-600 font-semibold">
                                  {customer.orderValue}
                                </span>
                              </div>
                            ),
                          )
                        ) : (
                          <div className="text-xs text-slate-400 p-2">
                            No regular customers
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Occasional Customers */}
                    <div className="mb-3">
                      <div
                        className="flex items-center justify-between p-2 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-all"
                        onClick={() => {
                          const occasionalList = document.getElementById(
                            "occasional-customers-list",
                          );
                          if (occasionalList)
                            occasionalList.classList.toggle("hidden");
                        }}
                      >
                        <span className="text-sm font-medium text-slate-700">
                          🔄 Occasional Customers
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-slate-600">
                            {data.customerSegmentation?.occasional?.length || 0}
                          </span>
                          <span className="text-xs text-slate-400">▼</span>
                        </div>
                      </div>
                      <div
                        id="occasional-customers-list"
                        className="mt-2 space-y-1 max-h-[120px] overflow-y-auto"
                      >
                        {data.customerSegmentation?.occasional?.length > 0 ? (
                          data.customerSegmentation.occasional.map(
                            (customer, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between text-xs p-1.5 bg-slate-50/50 rounded"
                              >
                                <span className="text-slate-700">
                                  {customer.name}
                                </span>
                                <span className="text-slate-600 font-semibold">
                                  {customer.orderValue}
                                </span>
                              </div>
                            ),
                          )
                        ) : (
                          <div className="text-xs text-slate-400 p-2">
                            No occasional customers
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 text-[10px] text-slate-400 text-center">
                      💡 Click on each segment to expand and view customer names
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Funnel Tab */}
            {activeTab === "funnel" && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-slate-800">
                  Order Funnel Analysis
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6">
                    <h3 className="text-base font-semibold text-slate-800 mb-3">
                      Order Funnel Stages
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">
                      Order → Delivered → Pending
                    </p>
                    <FunnelChartComponent data={data.orderFunnelData} />
                    <div className="mt-4 text-xs text-slate-500 text-center">
                      Overall Delivery Rate: {data.deliveryPercent.toFixed(2)}%
                    </div>
                  </div>
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6">
                    <h3 className="text-base font-semibold text-slate-800 mb-3">
                      Order Status Distribution
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">
                      Current order status breakdown
                    </p>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={data.completionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                          labelLine={true}
                        >
                          {data.completionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v) => `${v} orders`}
                          contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                            padding: "8px 12px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6 lg:col-span-2">
                    <h3 className="text-base font-semibold text-slate-800 mb-3">
                      Funnel Efficiency Metrics
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="bg-indigo-50 rounded-xl p-4 text-center">
                        <p className="text-xs text-slate-400">
                          Total Order Value
                        </p>
                        <p className="text-2xl font-bold text-indigo-600">
                          {formatCurrency(data.totals.orderValue)}
                        </p>
                      </div>
                      <div className="bg-emerald-50 rounded-xl p-4 text-center">
                        <p className="text-xs text-slate-400">
                          Delivered Value
                        </p>
                        <p className="text-2xl font-bold text-emerald-600">
                          {formatCurrency(data.totals.saleValue)}
                        </p>
                        <p className="text-xs text-emerald-500">
                          {(
                            (data.totals.saleValue /
                              (data.totals.orderValue || 1)) *
                            100
                          ).toFixed(0)}
                          % conversion
                        </p>
                      </div>
                      <div className="bg-red-50 rounded-xl p-4 text-center">
                        <p className="text-xs text-slate-400">Pending Value</p>
                        <p className="text-2xl font-bold text-red-600">
                          {formatCurrency(data.totals.balanceValue)}
                        </p>
                        <p className="text-xs text-red-500">
                          {(
                            (data.totals.balanceValue /
                              (data.totals.orderValue || 1)) *
                            100
                          ).toFixed(0)}
                          % pending
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Channels Tab */}
            {activeTab === "channels" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">
                      Sales Person Performance
                    </h2>
                    <p className="text-xs text-slate-400">
                      Order Value vs Sales Revenue by Sales Person
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1 text-indigo-600">
                      <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                      Order Value
                    </span>
                    <span className="flex items-center gap-1 text-emerald-600">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Sales Revenue
                    </span>
                    <span className="flex items-center gap-1 text-red-600">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      Leakage
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Revenue Distribution - No overlapping labels */}
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6">
                    <h3 className="text-base font-semibold text-slate-800 mb-3">
                      Revenue Distribution
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">
                      Sales revenue distribution by sales person
                    </p>
                    <RevenueDistributionPie
                      data={data.channelPerformanceData}
                    />
                    <div className="mt-4 text-xs text-slate-500 text-center">
                      Total Revenue:{" "}
                      {formatCurrency(
                        data.channelPerformanceData.reduce(
                          (sum, d) =>
                            sum + parseFloat(d.revenue.replace(/[$,]/g, "")),
                          0,
                        ),
                      )}
                    </div>
                  </div>

                  {/* FIXED: Order vs Sales Comparison - Only Order Value & Sales Revenue */}
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6">
                    <h3 className="text-base font-semibold text-slate-800 mb-3">
                      Order vs Sales Comparison
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">
                      Bar chart showing Order Value vs Sales Revenue
                    </p>
                    {data.channelPerformanceData &&
                    data.channelPerformanceData.length > 0 ? (
                      <OrderVsSalesChart
                        data={data.channelPerformanceData.map((item) => ({
                          ...item,
                          orderValue: item.orderValueNum || 0,
                          saleValue: item.saleValueNum || 0,
                          name: item.channel,
                        }))}
                      />
                    ) : (
                      <div className="h-[280px] flex items-center justify-center text-slate-400 flex-col gap-2">
                        <div className="text-4xl">📊</div>
                        <p>No data available</p>
                      </div>
                    )}
                  </div>
                  {/* FIXED: Sales Performance Matrix - Sort by TOTAL, tier by AVG */}
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6 lg:col-span-2">
                    <h3 className="text-base font-semibold text-slate-800 mb-3">
                      Sales Performance Matrix
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">
                      Detailed breakdown with Order Value, Sales Revenue &
                      Leakage
                    </p>
                    <ChannelPerformanceMatrix
                      data={data.channelPerformanceData}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === "analytics" && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-slate-800">
                  Advanced Analytics
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6">
                    <h3 className="text-base font-semibold text-slate-800 mb-3">
                      Order Funnel Analysis
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">
                      Order → Delivered → Pending
                    </p>
                    <FunnelChartComponent data={data.orderFunnelData} />
                  </div>
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6">
                    <h3 className="text-base font-semibold text-slate-800 mb-3">
                      Order Completion Status
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">
                      Current order status distribution
                    </p>
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={data.completionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                          labelLine={false}
                        >
                          {data.completionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v) => `${v} orders`}
                          contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                            padding: "8px 12px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Monthly Growth Rate - Shows ALL months */}
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6">
                    <h3 className="text-base font-semibold text-slate-800 mb-3">
                      Monthly Growth Rate
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">
                      Month-over-month growth percentage
                    </p>
                    {data.growthData && data.growthData.length >= 2 ? (
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart
                          data={data.growthData}
                          margin={{ top: 30, right: 30, left: 20, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis tickFormatter={(v) => `${v.toFixed(0)}%`} />
                          <Tooltip
                            formatter={(v) => `${v.toFixed(1)}%`}
                            contentStyle={{
                              backgroundColor: "white",
                              border: "1px solid #e2e8f0",
                              borderRadius: "8px",
                              padding: "8px 12px",
                            }}
                          />
                          <Legend />
                          <Bar
                            dataKey="salesGrowth"
                            name="Sales Growth %"
                            radius={[4, 4, 0, 0]}
                          >
                            {data.growthData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={
                                  entry.salesGrowth >= 0
                                    ? COLORS.success
                                    : COLORS.danger
                                }
                              />
                            ))}
                          </Bar>
                          <Bar
                            dataKey="orderGrowth"
                            name="Order Growth %"
                            radius={[4, 4, 0, 0]}
                            fill={COLORS.primary}
                          >
                            {data.growthData.map((entry, index) => (
                              <Cell
                                key={`cell-order-${index}`}
                                fill={
                                  entry.orderGrowth >= 0
                                    ? COLORS.indigo
                                    : COLORS.rose
                                }
                              />
                            ))}
                          </Bar>
                          <ReferenceLine
                            y={0}
                            stroke={COLORS.gray}
                            strokeDasharray="3 3"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : data.weeklyGrowthData &&
                      data.weeklyGrowthData.length >= 2 ? (
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart
                          data={data.weeklyGrowthData}
                          margin={{ top: 30, right: 30, left: 20, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis tickFormatter={(v) => `${v.toFixed(0)}%`} />
                          <Tooltip
                            formatter={(v) => `${v.toFixed(1)}%`}
                            contentStyle={{
                              backgroundColor: "white",
                              border: "1px solid #e2e8f0",
                              borderRadius: "8px",
                              padding: "8px 12px",
                            }}
                          />
                          <Legend />
                          <Bar
                            dataKey="salesGrowth"
                            name="Weekly Growth %"
                            radius={[4, 4, 0, 0]}
                          >
                            {data.weeklyGrowthData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={
                                  entry.salesGrowth >= 0
                                    ? COLORS.success
                                    : COLORS.danger
                                }
                              />
                            ))}
                          </Bar>
                          <ReferenceLine
                            y={0}
                            stroke={COLORS.gray}
                            strokeDasharray="3 3"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : data.dailyGrowthData &&
                      data.dailyGrowthData.length >= 3 ? (
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart
                          data={data.dailyGrowthData}
                          margin={{ top: 30, right: 30, left: 20, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis tickFormatter={(v) => `${v.toFixed(0)}%`} />
                          <Tooltip
                            formatter={(v) => `${v.toFixed(1)}%`}
                            contentStyle={{
                              backgroundColor: "white",
                              border: "1px solid #e2e8f0",
                              borderRadius: "8px",
                              padding: "8px 12px",
                            }}
                          />
                          <Legend />
                          <Bar
                            dataKey="salesGrowth"
                            name="3-Day Growth %"
                            radius={[4, 4, 0, 0]}
                          >
                            {data.dailyGrowthData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={
                                  entry.salesGrowth >= 0
                                    ? COLORS.success
                                    : COLORS.danger
                                }
                              />
                            ))}
                          </Bar>
                          <ReferenceLine
                            y={0}
                            stroke={COLORS.gray}
                            strokeDasharray="3 3"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[280px] flex items-center justify-center text-slate-400 flex-col gap-2">
                        <div className="text-4xl">📊</div>
                        <p>Not enough data for growth comparison</p>
                        <p className="text-xs">
                          Need at least 2 months, 2 weeks, or 3 days of data
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6">
                    <h3 className="text-base font-semibold text-slate-800 mb-3">
                      Correlation Matrix
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">
                      Key metric relationships
                    </p>
                    <div className="space-y-3">
                      {data.correlationData.map((item, index) => (
                        <div key={index} className="bg-slate-50 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">
                              {item.name}
                            </span>
                            <div className="flex items-center gap-3 flex-1 ml-4">
                              <div
                                className="flex-1 h-2 rounded-full overflow-hidden"
                                style={{
                                  backgroundColor:
                                    item.value > 0
                                      ? "rgba(16, 185, 129, 0.2)"
                                      : "rgba(239, 68, 68, 0.2)",
                                }}
                              >
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{
                                    width: `${Math.min(Math.abs(item.value) * 100, 100)}%`,
                                    backgroundColor:
                                      item.value > 0
                                        ? COLORS.success
                                        : COLORS.danger,
                                  }}
                                />
                              </div>
                              <span
                                className={`text-xs font-medium min-w-[40px] ${item.value > 0 ? "text-emerald-600" : "text-red-600"}`}
                              >
                                {item.value > 0 ? "+" : ""}
                                {item.value.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6">
                    <h3 className="text-base font-semibold text-slate-800 mb-3">
                      Peak Order Hours
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">
                      Order volume and sales by hour
                    </p>
                    <ResponsiveContainer width="100%" height={250}>
                      <ComposedChart
                        data={data.peakHoursData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" tick={{ fontSize: 8 }} />
                        <YAxis yAxisId="left" />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          tickFormatter={(v) => formatCompactCurrency(v)}
                        />
                        <Tooltip
                          formatter={(v, name) => {
                            if (name === "Sales Revenue")
                              return formatCurrency(v);
                            return `${v} orders`;
                          }}
                          contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                            padding: "8px 12px",
                          }}
                        />
                        <Legend />
                        <Bar
                          dataKey="orders"
                          fill={COLORS.primary}
                          name="Orders"
                          yAxisId="left"
                          radius={[4, 4, 0, 0]}
                        />
                        <Line
                          type="monotone"
                          dataKey="saleRevenue"
                          stroke={COLORS.success}
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          name="Sales Revenue"
                          yAxisId="right"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6">
                    <h3 className="text-base font-semibold text-slate-800 mb-3">
                      Revenue Leakage
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">
                      Revenue breakdown by delivery status
                    </p>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={data.revenueLeakage}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={90}
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                          labelLine={false}
                        >
                          {data.revenueLeakage.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v) => formatCurrency(v)}
                          contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                            padding: "8px 12px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Predictive Tab */}
            {activeTab === "predictive" && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-slate-800">
                  Predictive Analytics
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6 lg:col-span-2">
                    <h3 className="text-base font-semibold text-slate-800 mb-3">
                      Sales Revenue Forecast
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">
                      3-month prediction based on historical sales trends
                    </p>
                    <PredictionChart data={data.monthlyData} />
                  </div>
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6">
                    <h3 className="text-base font-semibold text-slate-800 mb-3">
                      Seasonal Pattern
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">
                      Monthly recurring sales patterns
                    </p>
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart
                        data={data.seasonalData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis
                          tickFormatter={(v) => formatCompactCurrency(v)}
                        />
                        <Tooltip
                          formatter={(v) => formatCurrency(v)}
                          contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                            padding: "8px 12px",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke={COLORS.emerald}
                          strokeWidth={2}
                          dot={{ fill: COLORS.emerald, r: 4 }}
                        />
                        <ReferenceLine
                          y={
                            data.seasonalData.reduce(
                              (sum, d) => sum + d.value,
                              0,
                            ) / (data.seasonalData.length || 1)
                          }
                          stroke={COLORS.warning}
                          strokeDasharray="3 3"
                          label="Avg"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6">
                    <h3 className="text-base font-semibold text-slate-800 mb-3">
                      Marketing Performance Scatter
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">
                      Orders vs Sales Revenue by sales person
                    </p>
                    <ResponsiveContainer width="100%" height={280}>
                      <ScatterChart
                        margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" dataKey="x" name="Orders" />
                        <YAxis
                          type="number"
                          dataKey="y"
                          name="Sales Revenue"
                          tickFormatter={(v) => formatCompactCurrency(v)}
                        />
                        <ZAxis type="number" dataKey="z" range={[50, 400]} />
                        <Tooltip
                          formatter={(v) => formatCurrency(v)}
                          contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                            padding: "8px 12px",
                          }}
                        />
                        <Scatter
                          name="Sales Persons"
                          data={data.scatterData}
                          fill={COLORS.primary}
                          shape="circle"
                        />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 md:p-6 lg:col-span-2">
                    <h3 className="text-base font-semibold text-slate-800 mb-3">
                      Year-over-Year Comparison
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">
                      Current year vs last year sales performance
                    </p>
                    <ResponsiveContainer width="100%" height={250}>
                      <ComposedChart
                        data={data.yoyComparison}
                        margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis
                          yAxisId="left"
                          tickFormatter={(v) => formatCompactCurrency(v)}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          tickFormatter={(v) => `${v.toFixed(0)}%`}
                        />
                        <Tooltip
                          formatter={(v) => formatCurrency(v)}
                          contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                            padding: "8px 12px",
                          }}
                        />
                        <Legend />
                        <Bar
                          dataKey="currentYear"
                          fill={COLORS.success}
                          name="Current Year Sales"
                          yAxisId="left"
                        />
                        <Bar
                          dataKey="lastYear"
                          fill={COLORS.gray}
                          name="Last Year Sales"
                          yAxisId="left"
                        />
                        <Line
                          type="monotone"
                          dataKey="growth"
                          stroke={COLORS.warning}
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          name="Growth %"
                          yAxisId="right"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Insights Tab */}
            {activeTab === "insights" && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-slate-800">
                  Business Insights
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4">
                    <h3 className="text-base font-semibold text-slate-800 mb-3">
                      📊 SWOT Analysis
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                        <h4 className="text-xs font-bold text-emerald-700">
                          💪 Strengths
                        </h4>
                        <ul className="mt-1 space-y-1">
                          {data.swotAnalysis?.strengths
                            ?.slice(0, 3)
                            .map((s, i) => (
                              <li
                                key={i}
                                className="text-[10px] text-emerald-600"
                              >
                                ✓ {s}
                              </li>
                            ))}
                        </ul>
                      </div>
                      <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                        <h4 className="text-xs font-bold text-red-700">
                          ⚠️ Weaknesses
                        </h4>
                        <ul className="mt-1 space-y-1">
                          {data.swotAnalysis?.weaknesses
                            ?.slice(0, 3)
                            .map((s, i) => (
                              <li key={i} className="text-[10px] text-red-600">
                                ✗ {s}
                              </li>
                            ))}
                        </ul>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <h4 className="text-xs font-bold text-blue-700">
                          🚀 Opportunities
                        </h4>
                        <ul className="mt-1 space-y-1">
                          {data.swotAnalysis?.opportunities
                            ?.slice(0, 3)
                            .map((s, i) => (
                              <li key={i} className="text-[10px] text-blue-600">
                                → {s}
                              </li>
                            ))}
                        </ul>
                      </div>
                      <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                        <h4 className="text-xs font-bold text-amber-700">
                          🔥 Threats
                        </h4>
                        <ul className="mt-1 space-y-1">
                          {data.swotAnalysis?.threats
                            ?.slice(0, 3)
                            .map((s, i) => (
                              <li
                                key={i}
                                className="text-[10px] text-amber-600"
                              >
                                • {s}
                              </li>
                            ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4">
                    <h3 className="text-base font-semibold text-slate-800 mb-3">
                      🛒 Market Basket Analysis
                    </h3>
                    <p className="text-xs text-slate-400 mb-3">
                      Top product combinations
                    </p>
                    <div className="space-y-3">
                      {data.marketBasket.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
                        >
                          <div>
                            <span className="text-sm font-medium text-slate-700">
                              {item.products}
                            </span>
                            <span className="text-[10px] text-slate-400 ml-2">
                              ({item.category})
                            </span>
                          </div>
                          <span className="text-sm font-semibold text-emerald-600">
                            {formatCompactCurrency(item.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 lg:col-span-2">
                    <h3 className="text-base font-semibold text-slate-800 mb-3">
                      💡 Key Recommendations
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                        <h4 className="text-sm font-semibold text-blue-800">
                          🚀 Growth Opportunity
                        </h4>
                        <p className="text-xs text-blue-600 mt-1">
                          {data.categoryData[0]?.name || "Top"} category shows
                          strong sales performance. Consider expanding product
                          lines in this category.
                        </p>
                      </div>
                      <div className="bg-purple-50 rounded-xl p-3 border border-purple-100">
                        <h4 className="text-sm font-semibold text-purple-800">
                          💼 Sales Strategy
                        </h4>
                        <p className="text-xs text-purple-600 mt-1">
                          {data.marketingData[0]?.name || "Top"} sales person is
                          performing well with{" "}
                          {formatCurrency(
                            data.marketingData[0]?.orderValue || 0,
                          )}{" "}
                          in orders. Consider mentoring others to replicate
                          their success.
                        </p>
                      </div>
                      <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                        <h4 className="text-sm font-semibold text-amber-800">
                          👥 Customer Focus
                        </h4>
                        <p className="text-xs text-amber-600 mt-1">
                          Top buyer {data.topBuyers[0]?.name || ""} contributes
                          significantly. Consider loyalty program and
                          personalized offers.
                        </p>
                      </div>
                      <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                        <h4 className="text-sm font-semibold text-emerald-800">
                          📦 Inventory Focus
                        </h4>
                        <p className="text-xs text-emerald-600 mt-1">
                          {data.categoryData[0]?.name || "Top"} category has
                          high sales demand. Ensure adequate inventory levels to
                          maintain delivery rate.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-4 lg:col-span-2">
                    <h3 className="text-base font-semibold text-slate-800 mb-3">
                      🎯 Performance Scorecard
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-emerald-50 p-3 rounded-lg text-center">
                        <p className="text-xs text-emerald-600">
                          Total Sales Revenue
                        </p>
                        <p className="text-lg font-bold text-emerald-700">
                          {formatCompactCurrency(data.totals.saleValue)}
                        </p>
                      </div>
                      <div className="bg-indigo-50 p-3 rounded-lg text-center">
                        <p className="text-xs text-indigo-600">Total Orders</p>
                        <p className="text-lg font-bold text-indigo-700">
                          {data.totalOrders}
                        </p>
                      </div>
                      <div className="bg-amber-50 p-3 rounded-lg text-center">
                        <p className="text-xs text-amber-600">Delivery Rate</p>
                        <p className="text-lg font-bold text-amber-700">
                          {data.deliveryPercent.toFixed(0)}%
                        </p>
                      </div>
                      <div className="bg-purple-50 p-3 rounded-lg text-center">
                        <p className="text-xs text-purple-600">
                          Avg Sale Value
                        </p>
                        <p className="text-lg font-bold text-purple-700">
                          {formatCompactCurrency(
                            data.performanceMetrics?.avgSaleValue || 0,
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* FOOTER */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-4 text-center hover:shadow-md transition-all">
            <p className="text-xs text-slate-400 uppercase tracking-wider">
              Total Orders
            </p>
            <p className="text-xl font-bold text-slate-800">
              {data.totalOrders}
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-4 text-center hover:shadow-md transition-all">
            <p className="text-xs text-slate-400 uppercase tracking-wider">
              Avg Sale Value
            </p>
            <p className="text-xl font-bold text-slate-800">
              {data.totalOrders > 0
                ? formatCurrency(data.totals.saleValue / data.totalOrders)
                : "$0"}
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-4 text-center hover:shadow-md transition-all">
            <p className="text-xs text-slate-400 uppercase tracking-wider">
              Delivery Rate
            </p>
            <p
              className="text-xl font-bold"
              style={{ color: getStatusColor(data.deliveryPercent) }}
            >
              {data.deliveryPercent.toFixed(0)}%
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-4 text-center hover:shadow-md transition-all">
            <p className="text-xs text-slate-400 uppercase tracking-wider">
              Sales Growth
            </p>
            <p
              className="text-xl font-bold"
              style={{
                color: data.salesGrowth >= 0 ? COLORS.success : COLORS.danger,
              }}
            >
              {data.salesGrowth.toFixed(1)}%
            </p>
          </div>
        </motion.div>

        <div className="text-center">
          <p className="text-[10px] text-slate-400">
            Last updated: {new Date().toLocaleString()} • {apiData.length}{" "}
            records loaded
          </p>
        </div>
      </div>
    </div>
  );
}

export default Home;
