
import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

import {
  FaShoppingCart,
  FaMoneyBillWave,
  FaBoxOpen,
  FaPercentage,
  FaArrowUp,
  FaArrowDown,
  FaChartLine,
  FaUserTie,
} from "react-icons/fa";

import { TbTruckDelivery } from "react-icons/tb";

import {
  formatCurrency,
  formatNumber,
  formatCompactCurrency,
} from "../utils/formatUtils";

const COLORS = {
  order: "#3b82f6",
  sale: "#10b981",
  balance: "#ef4444",
  delivery: "#8b5cf6",
  grid: "#e2e8f0",
  text: "#64748b",
};

const MONTHS = [
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

const OverviewTab = ({
  data,
  apiData = [],
  viewMode,
  chartData,
  growthChartData,
  getGrowthLabel,
  selectedYear = "All",
  selectedMonth = "All",
  selectedMarketing = "All",
   dateRange,
}) => {
  // ============================================================
  // DATE HELPERS
  // ============================================================

  const getDateKey = (value) => {
    if (!value) return null;

    // YYYY-MM-DD / YYYY-MM-DDTHH:mm:ss
    if (typeof value === "string") {
      const match = value.match(
        /^(\d{4})-(\d{2})-(\d{2})/
      );

      if (match) {
        return `${match[1]}-${match[2]}-${match[3]}`;
      }
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
  };

  const formatDate = (dateKey) => {
    if (!dateKey) return "";

    const [year, month, day] = dateKey
      .split("-")
      .map(Number);

    const date = new Date(
      year,
      month - 1,
      day
    );

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const dateMatchesFilter = (dateKey) => {
    if (!dateKey) return false;

    const [year, month, day] = dateKey
      .split("-")
      .map(Number);
     if (dateRange?.startDate && dateRange?.endDate) {
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      
      // Reset time to compare only dates
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      
      const checkDate = new Date(year, month - 1, day);
      
      // Return true ONLY if the date is within the selected range
      return checkDate >= start && checkDate <= end;
    }

    const yearMatches =
      selectedYear === "All" ||
      year === Number(selectedYear);

    const monthIndex =
      selectedMonth === "All"
        ? -1
        : MONTHS.indexOf(selectedMonth);

    const monthMatches =
      selectedMonth === "All" ||
      month - 1 === monthIndex;

    return yearMatches && monthMatches;
  };

  // ============================================================
  // MARKETING MATCH
  //
  // API may contain either:
  // MarketingName
  // Marketing
  // ============================================================

  const marketingMatches = (item) => {
    if (
      !selectedMarketing ||
      selectedMarketing === "All"
    ) {
      return true;
    }

    const marketing =
      item.MarketingName ||
      item.Marketing ||
      item.marketingName ||
      "";

    return String(marketing)
      .trim()
      .toLowerCase()
      .includes(
        String(selectedMarketing)
          .trim()
          .toLowerCase()
      );
  };

  // ============================================================
  // RAW API DATA
  //
  // IMPORTANT:
  // Daily SALES are calculated from ChallanDate.
  //
  // We do NOT use dailyData.saleValue here because
  // dailyData is based on orderReceiveDate in the hook.
  // ============================================================

  

  const filteredApiData = useMemo(() => {
    if (!Array.isArray(apiData)) {
      return [];
    }

    return apiData.filter((item) => {
      const orderDate =
        getDateKey(
          item.OrderReceiveDate ||
            item.ApprovedDate
        );

      const challanDate =
        getDateKey(item.ChallanDate);

      // An item belongs to the selected report if
      // either its order date OR its challan date
      // falls into the selected period.

      const orderDateMatch =
        orderDate &&
        dateMatchesFilter(orderDate);

      const challanDateMatch =
        challanDate &&
        dateMatchesFilter(challanDate);

      return (
        marketingMatches(item) &&
        (orderDateMatch || challanDateMatch)
      );
    });
  }, [
    apiData,
    selectedYear,
    selectedMonth,
    selectedMarketing,
  ]);
  console.log("apiData", apiData);

  // ============================================================
  // DAILY ORDERS
  //
  // Order Date = OrderReceiveDate / ApprovedDate
  // ============================================================

  const dailyOrderMap = useMemo(() => {
    const map = new Map();

    filteredApiData.forEach((item) => {
      const dateKey = getDateKey(
        item.OrderReceiveDate ||
          item.ApprovedDate
      );

      if (
        !dateKey ||
        !dateMatchesFilter(dateKey)
      ) {
        return;
      }

      if (!map.has(dateKey)) {
        map.set(dateKey, {
          orderQty: 0,
          orderValue: 0,
          orders: new Set(),
        });
      }

      const daily = map.get(dateKey);
      console.log("daily", daily);

      const orderNo =
        item.WorkOrderNo ||
        item.workOrderNo ||
        "";

      /*
       * Primary API fields:
       *
       * BreakDownQTY
       * TotalOrderValue
       *
       * Some API versions may expose:
       * TotalBreakDownQTY
       */

      const orderQty =
        Number(
          item.OrderQTY ??
            item.OrderQTY ??
            0
        ) || 0;

      const orderValue =
        Number(
          item.OrderValue ??
            item.OrderValue ??
            0
        ) || 0;

      daily.orderQty += orderQty;
      daily.orderValue += orderValue;

      if (orderNo) {
        daily.orders.add(orderNo);
      }
    });

    return map;
  }, [
    filteredApiData,
    selectedYear,
    selectedMonth,
  ]);

  console.log("filterdata", filteredApiData);
  // ============================================================
  // DAILY SALES
  //
  // SALE DATE = ChallanDate
  //
  // This is the most important part.
  //
  // Example:
  //
  // OrderReceiveDate = 28-Aug
  // ChallanDate      = 01-Sep
  //
  // Sale will appear on 01-Sep.
  // ============================================================

  const dailySaleMap = useMemo(() => {
    const map = new Map();

    filteredApiData.forEach((item) => {
      const challanDate =
        getDateKey(item.ChallanDate);

      if (
        !challanDate ||
        !dateMatchesFilter(challanDate)
      ) {
        return;
      }

      const saleQty =
        Number(item.ChallanQTY) || 0;

      const saleValue =
        Number(item.ChallanValue) || 0;

      /*
       * Ignore rows without actual challan.
       */
      if (
        saleQty === 0 &&
        saleValue === 0
      ) {
        return;
      }

      if (!map.has(challanDate)) {
        map.set(challanDate, {
          saleQty: 0,
          saleValue: 0,
          challans: new Set(),
          orders: new Set(),
        });
      }

      const daily = map.get(challanDate);

      daily.saleQty += saleQty;
      daily.saleValue += saleValue;

      if (item.ChallanNo) {
        daily.challans.add(
          String(item.ChallanNo)
        );
      }

      if (item.WorkOrderNo) {
        daily.orders.add(
          String(item.WorkOrderNo)
        );
      }
    });

    return map;
  }, [
    filteredApiData,
    selectedYear,
    selectedMonth,
  ]);

  // ============================================================
  // COMBINED DAILY REPORT
  //
  // Union of:
  //   Order dates
  //   Challan dates
  //
  // This prevents a sale from disappearing when its
  // order date is different.
  // ============================================================

// In OverviewTab.jsx, after creating dailyReport (around line 180)
const dailyReport = useMemo(() => {
  const dates = new Set();

  dailyOrderMap.forEach((_, date) => {
    dates.add(date);
  });

  dailySaleMap.forEach((_, date) => {
    dates.add(date);
  });

  const sortedDates = Array.from(dates).sort();

  let cumulativeOrderQty = 0;
  let cumulativeOrderValue = 0;
  let cumulativeSaleQty = 0;
  let cumulativeSaleValue = 0;

  const report = sortedDates.map((date) => {
    const order = dailyOrderMap.get(date) || { orderQty: 0, orderValue: 0 };
    const sale = dailySaleMap.get(date) || { saleQty: 0, saleValue: 0 };

    cumulativeOrderQty += order.orderQty;
    cumulativeOrderValue += order.orderValue;
    cumulativeSaleQty += sale.saleQty;
    cumulativeSaleValue += sale.saleValue;

    const balanceQty = Math.max(0, cumulativeOrderQty - cumulativeSaleQty);
    const balanceValue = Math.max(0, cumulativeOrderValue - cumulativeSaleValue);
    const deliveryRate = cumulativeOrderQty > 0 
      ? Math.min(100, (cumulativeSaleQty / cumulativeOrderQty) * 100) 
      : 0;

    return {
      date,
      name: formatDate(date),
      orderQty: order.orderQty,
      orderValue: order.orderValue,
      saleQty: sale.saleQty,
      saleValue: sale.saleValue,
      balanceQty,
      balanceValue,
      deliveryRate,
      cumulativeOrderQty,
      cumulativeOrderValue,
      cumulativeSaleQty,
      cumulativeSaleValue,
    };
  });

  // 🔥 NEW: Filter the report to only include dates in the selected range
  if (dateRange?.startDate && dateRange?.endDate) {
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return report.filter((item) => {
      const [year, month, day] = item.date.split("-").map(Number);
      const checkDate = new Date(year, month - 1, day);
      return checkDate >= start && checkDate <= end;
    });
  }

  return report;
}, [dailyOrderMap, dailySaleMap, dateRange]); 
  console.log("dailyReport", dailyReport);

  // ============================================================
  // TOTAL ACTUAL SALES FROM CHALLAN DATE
  // ============================================================

  const actualSaleTotals = useMemo(() => {
    return dailyReport.reduce(
      (result, item) => {
        result.qty +=
          Number(item.saleQty) || 0;

        result.value +=
          Number(item.saleValue) || 0;

        return result;
      },
      {
        qty: 0,
        value: 0,
      }
    );
  }, [dailyReport]);

  // ============================================================
  // DAILY SALES GROWTH
  // ============================================================

  const salesGrowthData = useMemo(() => {
    let previousSale = null;

    return dailyReport.map((item) => {
      let growth = 0;

      if (
        previousSale !== null
      ) {
        if (previousSale > 0) {
          growth =
            ((item.saleValue -
              previousSale) /
              previousSale) *
            100;
        } else if (
          previousSale === 0 &&
          item.saleValue > 0
        ) {
          growth = 100;
        }
      }

      if (item.saleValue > 0) {
        previousSale =
          item.saleValue;
      }

      return {
        ...item,
        salesGrowth:
          Math.round(growth * 10) /
          10,
      };
    });
  }, [dailyReport]);

  // ============================================================
  // CURRENT GROWTH
  // ============================================================

  const currentSalesGrowth =
    salesGrowthData.length > 1
      ? salesGrowthData[
          salesGrowthData.length - 1
        ].salesGrowth
      : 0;

  // ============================================================
  // QUICK STATS
  // ============================================================

  const orderValue =
    Number(data?.totals?.orderValue) ||
    0;

  const orderQty =
    Number(data?.totals?.orderQty) ||
    0;

  const balanceQty =
    Number(data?.totals?.balanceQty) ||
    0;

  const balanceValue =
    Number(data?.totals?.balanceValue) ||
    0;

  const deliveryPercent =
    orderQty > 0
      ? (actualSaleTotals.qty /
          orderQty) *
        100
      : 0;

  const valuePercent =
    orderValue > 0
      ? (actualSaleTotals.value /
          orderValue) *
        100
      : 0;

  const stats = [
    {
      title: "Total Orders",
      value:
        data?.totalOrders || 0,
      icon: FaShoppingCart,
      bg: "bg-blue-50",
      color: "text-blue-600",
      formatter: (value) =>
        formatNumber(value),
    },

    {
      title: "Order Value",
      value: orderValue,
      icon: FaMoneyBillWave,
      bg: "bg-indigo-50",
      color: "text-indigo-600",
      formatter: (value) =>
        formatCurrency(value),
    },

    {
      title: "Actual Sales",
      value:
        actualSaleTotals.value,
      icon: TbTruckDelivery,
      bg: "bg-emerald-50",
      color: "text-emerald-600",
      formatter: (value) =>
        formatCurrency(value),
    },

    {
      title: "Balance Value",
      value: balanceValue,
      icon: FaBoxOpen,
      bg: "bg-red-50",
      color: "text-red-600",
      formatter: (value) =>
        formatCurrency(value),
    },
  ];

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="space-y-6">

      {/* ========================================================
          DAILY PERFORMANCE
      ======================================================== */}

      <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-5">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">

          <div>
            <h3 className="text-base font-semibold text-slate-800">
              Daily Performance
            </h3>

            <p className="text-xs text-slate-400 mt-1">
              Orders by Order Date and Sales by Challan Date
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">

            <span className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-sm"
                style={{
                  background:
                    COLORS.order,
                }}
              />
              Order
            </span>

            <span className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-sm"
                style={{
                  background:
                    COLORS.sale,
                }}
              />
              Actual Sale
            </span>

            <span className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-full"
                style={{
                  background:
                    COLORS.balance,
                }}
              />
              Balance
            </span>

          </div>

        </div>

        {dailyReport.length > 0 ? (

          <ResponsiveContainer
            width="100%"
            height={350}
          >

            <ComposedChart
              data={dailyReport}
              margin={{
                top: 10,
                right: 15,
                left: 10,
                bottom: 5,
              }}
            >

              <CartesianGrid
                strokeDasharray="3 3"
                stroke={COLORS.grid}
              />

              <XAxis
                dataKey="name"
                tick={{
                  fontSize: 10,
                  fill: COLORS.text,
                }}
              />

              <YAxis
                yAxisId="value"
                tick={{
                  fontSize: 10,
                  fill: COLORS.text,
                }}
                tickFormatter={(value) =>
                  formatCompactCurrency(
                    value
                  )
                }
              />

              <YAxis
                yAxisId="percent"
                orientation="right"
                domain={[0, 100]}
                tick={{
                  fontSize: 10,
                  fill: COLORS.text,
                }}
                tickFormatter={(value) =>
                  `${value}%`
                }
              />

              <Tooltip
                labelFormatter={(label) =>
                  `Date: ${label}`
                }
                formatter={(
                  value,
                  name
                ) => {

                  if (
                    name ===
                    "Order Value"
                  ) {
                    return [
                      formatCurrency(
                        value
                      ),
                      name,
                    ];
                  }

                  if (
                    name ===
                    "Actual Sale"
                  ) {
                    return [
                      formatCurrency(
                        value
                      ),
                      name,
                    ];
                  }

                  if (
                    name ===
                    "Balance Value"
                  ) {
                    return [
                      formatCurrency(
                        value
                      ),
                      name,
                    ];
                  }

                  if (
                    name ===
                    "Delivery Rate"
                  ) {
                    return [
                      `${Number(
                        value
                      ).toFixed(1)}%`,
                      name,
                    ];
                  }

                  return [
                    formatNumber(
                      value
                    ),
                    name,
                  ];
                }}
              />

              <Legend />

              <Bar
                yAxisId="value"
                dataKey="orderValue"
                name="Order Value"
                fill={COLORS.order}
                radius={[
                  4,
                  4,
                  0,
                  0,
                ]}
                barSize={22}
              />

              <Bar
                yAxisId="value"
                dataKey="saleValue"
                name="Actual Sale"
                fill={COLORS.sale}
                radius={[
                  4,
                  4,
                  0,
                  0,
                ]}
                barSize={22}
              />

              <Line
                yAxisId="value"
                type="monotone"
                dataKey="balanceValue"
                name="Balance Value"
                stroke={
                  COLORS.balance
                }
                strokeWidth={2}
                dot={{
                  r: 3,
                }}
              />

              <Line
                yAxisId="percent"
                type="monotone"
                dataKey="deliveryRate"
                name="Delivery Rate"
                stroke={
                  COLORS.delivery
                }
                strokeWidth={2}
                dot={{
                  r: 3,
                }}
              />

            </ComposedChart>

          </ResponsiveContainer>

        ) : (

          <div className="py-12 text-center text-slate-400">
            No daily data available
          </div>

        )}

      </div>

      {/* ========================================================
          KPI CARDS
      ======================================================== */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {stats.map((stat) => {

          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-4"
            >

              <div className="flex items-center gap-3">

                <div
                  className={`p-3 rounded-xl ${stat.bg}`}
                >
                  <Icon
                    className={`w-5 h-5 ${stat.color}`}
                  />
                </div>

                <div className="min-w-0">

                  <p className="text-xs text-slate-400">
                    {stat.title}
                  </p>

                  <p className="text-lg font-bold text-slate-800 truncate">
                    {stat.formatter(
                      stat.value
                    )}
                  </p>

                </div>

              </div>

            </div>
          );
        })}

      </div>

      {/* ========================================================
          SALES SUMMARY
      ======================================================== */}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-4">
          <p className="text-xs text-slate-400">
            Sale Qty
          </p>

          <p className="text-xl font-bold text-emerald-600 mt-1">
            {formatNumber(
              actualSaleTotals.qty
            )}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-4">
          <p className="text-xs text-slate-400">
            Sale Value
          </p>

          <p className="text-xl font-bold text-emerald-600 mt-1">
            {formatCurrency(
              actualSaleTotals.value
            )}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-4">
          <p className="text-xs text-slate-400">
            Delivery Rate
          </p>

          <p className="text-xl font-bold text-purple-600 mt-1">
            {deliveryPercent.toFixed(
              1
            )}
            %
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-4">
          <p className="text-xs text-slate-400">
            Value Delivery
          </p>

          <p className="text-xl font-bold text-indigo-600 mt-1">
            {valuePercent.toFixed(
              1
            )}
            %
          </p>
        </div>

      </div>

      {/* ========================================================
          SALES GROWTH
      ======================================================== */}

      <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-5">

        <div className="flex items-center justify-between mb-4">

          <div>
            <h3 className="text-base font-semibold text-slate-800">
              Daily Sales Growth
            </h3>

            <p className="text-xs text-slate-400 mt-1">
              Actual Challan Date based sales growth
            </p>
          </div>

          <div
            className={`flex items-center gap-1 text-sm font-semibold ${
              currentSalesGrowth >=
              0
                ? "text-emerald-600"
                : "text-red-600"
            }`}
          >
            {currentSalesGrowth >=
            0 ? (
              <FaArrowUp />
            ) : (
              <FaArrowDown />
            )}

            {Math.abs(
              currentSalesGrowth
            ).toFixed(1)}
            %
          </div>

        </div>

        {salesGrowthData.length > 1 ? (

          <ResponsiveContainer
            width="100%"
            height={260}
          >

            <ComposedChart
              data={
                salesGrowthData
              }
            >

              <CartesianGrid
                strokeDasharray="3 3"
                stroke={COLORS.grid}
              />

              <XAxis
                dataKey="name"
                tick={{
                  fontSize: 10,
                }}
              />

              <YAxis
                tickFormatter={(
                  value
                ) =>
                  `${value}%`
                }
                tick={{
                  fontSize: 10,
                }}
              />

              <Tooltip
                formatter={(
                  value
                ) =>
                  `${Number(
                    value
                  ).toFixed(1)}%`
                }
                labelFormatter={(
                  label
                ) =>
                  `Date: ${label}`
                }
              />

              <Line
                type="monotone"
                dataKey="salesGrowth"
                name="Sales Growth"
                stroke={
                  COLORS.sale
                }
                strokeWidth={3}
                dot={{
                  r: 3,
                }}
              />

            </ComposedChart>

          </ResponsiveContainer>

        ) : (

          <div className="py-10 text-center text-slate-400 text-sm">
            Not enough data for growth analysis
          </div>

        )}

      </div>

      {/* ========================================================
          TOP MARKETING
      ======================================================== */}

      <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-5">

        <div className="flex items-center gap-2 mb-4">

          <FaUserTie className="text-violet-500" />

          <h3 className="text-base font-semibold text-slate-800">
            Top Sales Persons
          </h3>

        </div>

        <div className="space-y-2">

          {(data?.topMarketing ||
            data?.marketingData ||
            [])
            .slice(0, 5)
            .map((item, index) => (

              <div
                key={
                  item.name ||
                  index
                }
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50"
              >

                <div className="flex items-center gap-3">

                  <span className="text-xs font-bold text-slate-400">
                    #{index + 1}
                  </span>

                  <span className="text-sm font-medium text-slate-700">
                    {item.name ||
                      "Unknown"}
                  </span>

                </div>

                <div className="text-sm font-semibold text-emerald-600">
                  {formatCompactCurrency(
                    item.value ||
                      item.saleValue ||
                      0
                  )}
                </div>

              </div>

            ))}

        </div>

      </div>

      {/* ========================================================
          REPORT INFO
      ======================================================== */}

      <div className="bg-slate-50 rounded-xl p-3 text-center">

        <p className="text-xs text-slate-400">

          Daily Order Date:
          <span className="font-medium text-blue-600 ml-1">
            OrderReceiveDate /
            ApprovedDate
          </span>

          <span className="mx-2">
            •
          </span>

          Daily Sale Date:
          <span className="font-medium text-emerald-600 ml-1">
            ChallanDate
          </span>

          <span className="mx-2">
            •
          </span>

          Sale Qty:
          <span className="font-medium text-slate-600 ml-1">
            {formatNumber(
              actualSaleTotals.qty
            )}
          </span>

          <span className="mx-2">
            •
          </span>

          Sale Value:
          <span className="font-medium text-slate-600 ml-1">
            {formatCurrency(
              actualSaleTotals.value
            )}
          </span>

        </p>

      </div>

    </div>
  );
};

export default OverviewTab;

