// components/home/utils/formatUtils.js

import { COLORS } from './constants';
import { parseAPIDate } from './dateUtils';
import { FaMedal, FaCrown, FaExclamationCircle } from 'react-icons/fa';

export const formatCurrency = (value) => {
  const num = Number(value) || 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(num));
};

export const formatNumber = (value) => {
  const num = Number(value) || 0;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(num));
};

export const formatCompactCurrency = (value) => {
  const num = Number(value) || 0;
  const rounded = Math.round(num);
  if (rounded >= 1e9) return `$${(rounded / 1e9).toFixed(1)}B`;
  if (rounded >= 1e6) return `$${(rounded / 1e6).toFixed(1)}M`;
  if (rounded >= 1e3) return `$${(rounded / 1e3).toFixed(1)}K`;
  return `$${rounded}`;
};

export const formatCompactNumber = (value) => {
  const num = Number(value) || 0;
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return formatNumber(num);
};

export const getStatusColor = (value) => {
  const num = Number(value) || 0;
  if (num >= 90) return COLORS.success;
  if (num >= 60) return COLORS.warning;
  return COLORS.danger;
};

export const getDeliveryStatus = (deliveryRate) => {
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

export const getPerformanceTier = (
  avgOrderValue,
  deliveryRate,
  totalOrderValue = 0,
  orders = 0,
  selectedYear,
  selectedMonth,
  viewMode = "monthly",
  apiData = [],
  salesRevenue = 0,
) => {
  const numericTotal =
    typeof totalOrderValue === "string"
      ? parseFloat(totalOrderValue.replace(/[$,]/g, ""))
      : totalOrderValue;

  const numericSales =
    typeof salesRevenue === "string"
      ? parseFloat(salesRevenue.replace(/[$,]/g, ""))
      : salesRevenue;

  const numericRate =
    typeof deliveryRate === "string"
      ? parseFloat(deliveryRate.replace(/[%,]/g, ""))
      : deliveryRate;

  // 🔥 COUNT MONTHS
  let monthsCount = 1;

  if (selectedYear !== "All" && selectedMonth !== "All") {
    monthsCount = 1;
  } else if (selectedYear !== "All" && selectedMonth === "All") {
    monthsCount = 12;
  } else if (selectedYear === "All" && selectedMonth === "All") {
    if (apiData && Array.isArray(apiData) && apiData.length > 0) {
      const uniqueMonths = new Set();
      apiData.forEach((item) => {
        const date = parseAPIDate(item.OrderReceiveDate);
        uniqueMonths.add(`${date.getFullYear()}-${date.getMonth()}`);
      });
      monthsCount = Math.max(uniqueMonths.size, 1);
    } else {
      monthsCount = 12;
    }
  }

  // 🔥 CALCULATE MONTHLY AVERAGES
  const monthlyOrderValue = numericTotal / monthsCount;
  const monthlySalesRevenue = numericSales / monthsCount;
  const monthlyOrders = Math.round(orders / monthsCount);

  // ============================================================
  // 🔥 DYNAMIC THRESHOLDS BASED ON TIME PERIOD
  // ============================================================

  let EXCELLENT_ORDER, GOOD_ORDER, AVERAGE_ORDER;
  let EXCELLENT_RATE, GOOD_RATE;

  // ---------- MONTHLY VIEW ----------
  if (viewMode === "monthly") {
    if (monthsCount <= 1) {
      // 1 Month
      EXCELLENT_ORDER = 60000;
      EXCELLENT_RATE = 50;
      GOOD_ORDER = 30000;
      GOOD_RATE = 40;
      AVERAGE_ORDER = 0; // 🔥 Below 30K = Average
    } else if (monthsCount <= 3) {
      // 2-3 Months
      EXCELLENT_ORDER = 50000;
      EXCELLENT_RATE = 50;
      GOOD_ORDER = 25000;
      GOOD_RATE = 40;
      AVERAGE_ORDER = 0;
    } else if (monthsCount <= 6) {
      // 4-6 Months
      EXCELLENT_ORDER = 40000;
      EXCELLENT_RATE = 50;
      GOOD_ORDER = 20000;
      GOOD_RATE = 40;
      AVERAGE_ORDER = 0;
    } else if (monthsCount <= 12) {
      // 7-12 Months (1 Year)
      EXCELLENT_ORDER = 35000;
      EXCELLENT_RATE = 50;
      GOOD_ORDER = 18000;
      GOOD_RATE = 40;
      AVERAGE_ORDER = 0;
    } else {
      // 13+ Months (1+ Years)
      EXCELLENT_ORDER = 25000;
      EXCELLENT_RATE = 50;
      GOOD_ORDER = 12000;
      GOOD_RATE = 40;
      AVERAGE_ORDER = 0;
    }
  }

  // ---------- WEEKLY VIEW ----------
  else if (viewMode === "weekly") {
    if (monthsCount <= 1) {
      EXCELLENT_ORDER = 15000;
      EXCELLENT_RATE = 50;
      GOOD_ORDER = 8000;
      GOOD_RATE = 40;
      AVERAGE_ORDER = 0;
    } else if (monthsCount <= 3) {
      EXCELLENT_ORDER = 12000;
      EXCELLENT_RATE = 50;
      GOOD_ORDER = 6000;
      GOOD_RATE = 40;
      AVERAGE_ORDER = 0;
    } else if (monthsCount <= 6) {
      EXCELLENT_ORDER = 10000;
      EXCELLENT_RATE = 50;
      GOOD_ORDER = 5000;
      GOOD_RATE = 40;
      AVERAGE_ORDER = 0;
    } else if (monthsCount <= 12) {
      EXCELLENT_ORDER = 8000;
      EXCELLENT_RATE = 50;
      GOOD_ORDER = 4000;
      GOOD_RATE = 40;
      AVERAGE_ORDER = 0;
    } else {
      EXCELLENT_ORDER = 6000;
      EXCELLENT_RATE = 50;
      GOOD_ORDER = 3000;
      GOOD_RATE = 40;
      AVERAGE_ORDER = 0;
    }
  }

  // ---------- DAILY VIEW ----------
  else if (viewMode === "daily") {
    if (monthsCount <= 1) {
      EXCELLENT_ORDER = 2000;
      EXCELLENT_RATE = 50;
      GOOD_ORDER = 1000;
      GOOD_RATE = 40;
      AVERAGE_ORDER = 0;
    } else if (monthsCount <= 3) {
      EXCELLENT_ORDER = 1500;
      EXCELLENT_RATE = 50;
      GOOD_ORDER = 800;
      GOOD_RATE = 40;
      AVERAGE_ORDER = 0;
    } else if (monthsCount <= 6) {
      EXCELLENT_ORDER = 1200;
      EXCELLENT_RATE = 50;
      GOOD_ORDER = 600;
      GOOD_RATE = 40;
      AVERAGE_ORDER = 0;
    } else if (monthsCount <= 12) {
      EXCELLENT_ORDER = 1000;
      EXCELLENT_RATE = 50;
      GOOD_ORDER = 500;
      GOOD_RATE = 40;
      AVERAGE_ORDER = 0;
    } else {
      EXCELLENT_ORDER = 800;
      EXCELLENT_RATE = 50;
      GOOD_ORDER = 400;
      GOOD_RATE = 40;
      AVERAGE_ORDER = 0;
    }
  }

  // ---------- YEARLY VIEW ----------
  else if (viewMode === "yearly") {
    if (monthsCount <= 1) {
      EXCELLENT_ORDER = 600000;
      EXCELLENT_RATE = 50;
      GOOD_ORDER = 300000;
      GOOD_RATE = 40;
      AVERAGE_ORDER = 0;
    } else if (monthsCount <= 3) {
      EXCELLENT_ORDER = 500000;
      EXCELLENT_RATE = 50;
      GOOD_ORDER = 250000;
      GOOD_RATE = 40;
      AVERAGE_ORDER = 0;
    } else if (monthsCount <= 6) {
      EXCELLENT_ORDER = 400000;
      EXCELLENT_RATE = 50;
      GOOD_ORDER = 200000;
      GOOD_RATE = 40;
      AVERAGE_ORDER = 0;
    } else if (monthsCount <= 12) {
      EXCELLENT_ORDER = 350000;
      EXCELLENT_RATE = 50;
      GOOD_ORDER = 180000;
      GOOD_RATE = 40;
      AVERAGE_ORDER = 0;
    } else {
      EXCELLENT_ORDER = 250000;
      EXCELLENT_RATE = 50;
      GOOD_ORDER = 120000;
      GOOD_RATE = 40;
      AVERAGE_ORDER = 0;
    }
  }

  // ---------- DEFAULT (Monthly) ----------
  else {
    EXCELLENT_ORDER = 60000;
    EXCELLENT_RATE = 50;
    GOOD_ORDER = 30000;
    GOOD_RATE = 40;
    AVERAGE_ORDER = 0;
  }

  // ============================================================
  // 🔥 APPLY TIERS
  // ============================================================

  // 🌟 EXCELLENT: $60K+ AND 50%+ delivery
  if (
    monthlyOrderValue >= EXCELLENT_ORDER &&
    numericRate >= EXCELLENT_RATE &&
    monthlyOrders >= 3
  ) {
    return {
      tier: "🌟 Excellent",
      icon: FaCrown,
      color: "#8B5CF6",
      bg: "bg-purple-100",
      status: "Excellent",
    };
  }

  // 📊 GOOD: $30K+ AND 40%+ delivery
  if (
    monthlyOrderValue >= GOOD_ORDER &&
    numericRate >= GOOD_RATE &&
    monthlyOrders >= 2
  ) {
    return {
      tier: "📊 Good",
      icon: FaMedal,
      color: "#3B82F6",
      bg: "bg-blue-100",
      status: "Good",
    };
  }

  // 📊 AVERAGE: Below $30K (or meets average threshold)
  if (monthlyOrderValue >= AVERAGE_ORDER && monthlyOrders >= 1) {
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
