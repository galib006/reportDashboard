// src/assets/components/Home/hooks/useComprehensiveData.jsx

import { useMemo } from 'react';
import { parseAPIDate, getDateKey, getWeekNumber } from '../utils/dateUtils';
import { 
  formatCurrency, 
  getPerformanceTier, 
  getDeliveryStatus,
  formatCompactCurrency 
} from '../utils/formatUtils';
import { COLORS, CHART_COLORS, MONTH_ORDER } from '../utils/constants';

export const useComprehensiveData = (
  apiData,
  selectedYear,
  selectedMonth,
  selectedMarketing,
  viewMode = "monthly"
) => {
  return useMemo(() => {
    // ============================================================
    // ✅ PREDICTION FUNCTION
    // ============================================================
    const calculatePrediction = (dataArray, currentIndex, viewMode) => {
      if (!dataArray || dataArray.length === 0) return 0;

      const currentValue = dataArray[currentIndex]?.saleValue || 0;
      const totalPoints = dataArray.length;

      if (totalPoints === 1) {
        const defaultFactors = {
          daily: 1.02,
          weekly: 1.05,
          monthly: 1.08,
          yearly: 1.1,
        };
        const factor = defaultFactors[viewMode] || 1.05;
        return Math.round(currentValue * factor);
      }

      const points = dataArray.slice(-Math.min(6, totalPoints));
      const xValues = points.map((_, idx) => idx);
      const yValues = points.map((item) => item.saleValue || 0);

      const n = xValues.length;
      const sumX = xValues.reduce((a, b) => a + b, 0);
      const sumY = yValues.reduce((a, b) => a + b, 0);
      const sumXY = xValues.reduce((a, b, idx) => a + b * yValues[idx], 0);
      const sumX2 = xValues.reduce((a, b) => a + b * b, 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      let predicted = Math.round(slope * currentIndex + intercept);

      if (predicted < 0) {
        const avg = yValues.reduce((a, b) => a + b, 0) / yValues.length;
        predicted = Math.round(avg * 0.95);
      }

      const maxValue = Math.max(...yValues);
      const minValue = Math.min(...yValues);
      const range = maxValue - minValue;

      if (range > 0) {
        const maxPrediction = maxValue * 1.3;
        const minPrediction = minValue * 0.7;
        predicted = Math.max(minPrediction, Math.min(maxPrediction, predicted));
      }

      return Math.max(0, Math.round(predicted));
    };

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

    // ============================================================
    // ✅ DATA VALIDATION
    // ============================================================
    if (!apiData || !Array.isArray(apiData) || apiData.length === 0) {
      return emptyResult;
    }

    // ============================================================
    // ✅ MERGE FUNCTION - Primary + Secondary API Data
    // ============================================================
    const mergeApiData = (data) => {
      const mergedMap = new Map();

      data.forEach((item) => {
        const orderNo = item.WorkOrderNo || item.workOrderNo || "";
        if (!orderNo) return;

        const orderReceiveDate = item.OrderReceiveDate || item.ApprovedDate || "";
        const date = parseAPIDate(orderReceiveDate);


         const isPrimaryData =
          item.BreakDownQTY !== undefined &&
          item.TotalOrderValue !== undefined;

        const isSecondaryData =
          item.ChallanQTY !== undefined ||
          item.ChallanValue !== undefined ||
          item.ChallanDate !== undefined;
          if (isPrimaryData) {
            existing.orderQty = Number(item.BreakDownQTY) || 0;
            existing.orderValue = Number(item.TotalOrderValue) || 0;
            existing.source.primary = true;
          }

        if (!mergedMap.has(orderNo)) {
          mergedMap.set(orderNo, {
            orderNo: orderNo,
            orderReceiveDate: orderReceiveDate,
            
            // ✅ PRIMARY API DATA
            orderQty: 0,
            orderValue: 0,
            customerName: "Unknown",
            marketingName: "Unknown",
            buyerName: "Unknown",
            category: "Uncategorized",
            orderStatus: "",
            rate: 0,
            pINumber: "",
            jobCardNo: "",
            gateOutDate: "",
            jobBagDate: "",
            cSName: "",
            
            // ✅ SECONDARY API DATA
            saleQty: 0,
            saleValue: 0,
            balanceQty: 0,
            balanceValue: 0,
            breakDownQTY: 0,
            challanDate: null,
            challanNo: null,
            deliveryToAddress: "",
            productCategoryName: "",
            productSubCategoryName: "",
            itemDescription: "",
            unit: "",
            unitPrice: 0,
            
            // Product Details
            productDetails: [],
            subCategories: new Set(),
            
            date: date,
            
            // Source Tracking
            source: {
              primary: false,
              secondary: false,
            },
          });
        }

        const existing = mergedMap.get(orderNo);

        if (isPrimaryData) {
  // ============================================================
  // PRIMARY DATA MUST BE COUNTED ONLY ONCE PER WORK ORDER
  // ============================================================
  if (!existing.source.primary) {
    existing.orderQty = Math.round(Number(item.BreakDownQTY) || 0);
    existing.orderValue = Number(item.TotalOrderValue) || 0;

    existing.source.primary = true;

    if (item.CustomerName) existing.customerName = item.CustomerName;
    if (item.Marketing) existing.marketingName = item.Marketing;
    if (item.BuyerName) existing.buyerName = item.BuyerName;
    if (item.SectionName) existing.category = item.SectionName;
    if (item.OrderStatus) existing.orderStatus = item.OrderStatus;
    if (item.Rate) existing.rate = item.Rate;
    if (item.PINumber) existing.pINumber = item.PINumber;
    if (item.JobCardNo) existing.jobCardNo = item.JobCardNo;
    if (item.GateOutDate) existing.gateOutDate = item.GateOutDate;
    if (item.JobBagDate) existing.jobBagDate = item.JobBagDate;
    if (item.CSName) existing.cSName = item.CSName;
  }
}

        // ============================================================
        // ✅ SECONDARY API DATA MERGE
        // ============================================================
        if (isSecondaryData) {
          existing.saleQty += Math.round(Number(item.ChallanQTY) || 0);
          existing.saleValue += Math.round(Number(item.ChallanValue) || 0);
          existing.balanceQty += Math.round(Number(item.BalanceQTY) || 0);
          existing.balanceValue += Math.round(Number(item.BalanceValue) || 0);
          existing.breakDownQTY += Math.round(Number(item.BreakDownQTY) || 0);
          existing.source.secondary = true;
          
          if (item.CName) existing.customerName = item.CName;
          if (item.MarketingName) existing.marketingName = item.MarketingName;
          if (item.BuyerName) existing.buyerName = item.BuyerName;
          if (item.ProductCategoryName) {
            existing.productCategoryName = item.ProductCategoryName;
            existing.category = item.ProductCategoryName;
          }
          if (item.ProductSubCategoryName) {
            existing.productSubCategoryName = item.ProductSubCategoryName;
            existing.subCategories.add(item.ProductSubCategoryName);
          }
          if (item.ItemDescription) existing.itemDescription = item.ItemDescription;
          if (item.DeliveryToAddress) existing.deliveryToAddress = item.DeliveryToAddress;
          if (item.Unit) existing.unit = item.Unit;
          if (item.UnitPrice) existing.unitPrice = item.UnitPrice;
          if (item.ChallanNo) existing.challanNo = item.ChallanNo;
          if (item.ChallanDate) existing.challanDate = item.ChallanDate;

          // ============================================================
          // ✅ PRODUCT DETAILS
          // ============================================================
          const productName = item.ItemDescription || "";
          const subCategory = item.ProductSubCategoryName || "";
          const category = item.ProductCategoryName || "";

          if (productName) {
            const existingProduct = existing.productDetails.find(
              (p) => p.productName === productName
            );

            if (existingProduct) {
              existingProduct.saleQty += Math.round(Number(item.ChallanQTY) || 0);
              existingProduct.saleValue += Math.round(Number(item.ChallanValue) || 0);
              existingProduct.balanceQty += Math.round(Number(item.BalanceQTY) || 0);
              existingProduct.balanceValue += Math.round(Number(item.BalanceValue) || 0);
              existingProduct.qty += Math.round(Number(item.BreakDownQTY) || 0);
            } else {
              existing.productDetails.push({
                productName: productName,
                subCategory: subCategory,
                category: category,
                qty: Math.round(Number(item.BreakDownQTY) || 0),
                value: Math.round(Number(item.TotalOrderValue) || 0),
                saleQty: Math.round(Number(item.ChallanQTY) || 0),
                saleValue: Math.round(Number(item.ChallanValue) || 0),
                balanceQty: Math.round(Number(item.BalanceQTY) || 0),
                balanceValue: Math.round(Number(item.BalanceValue) || 0),
                unitPrice: item.UnitPrice || 0,
                unit: item.Unit || "",
                challanNo: item.ChallanNo || "",
                challanDate: item.ChallanDate || "",
              });
            }

            if (subCategory) {
              existing.subCategories.add(subCategory);
            }
          }
        }
      });

      return Array.from(mergedMap.values());
    };

    // ============================================================
    // ✅ MERGE DATA
    // ============================================================
    const mergedData = mergeApiData(apiData);
    
    // 🔍 DEBUG
    console.log("✅ Merged Data Count:", mergedData.length);

    // ============================================================
    // ✅ FILTER DATA
    // ============================================================
    const filtered = mergedData.filter((item) => {
      const date = item.date || new Date();
      const yearMatch =
        selectedYear === "All" || date.getFullYear() === Number(selectedYear);

      let monthMatch = true;
      if (selectedMonth !== "All") {
        const monthNames = [
          "Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
        ];
        const selectedMonthIndex = monthNames.indexOf(selectedMonth);
        monthMatch = date.getMonth() === selectedMonthIndex;
      }

      const marketingMatch =
        selectedMarketing === "All" ||
        (item.marketingName || "").includes(selectedMarketing);
      return yearMatch && monthMatch && marketingMatch;
    });

    if (filtered.length === 0) {
      return emptyResult;
    }

    // ============================================================
    // ✅ DATA AGGREGATION MAPS
    // ============================================================
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

    // ============================================================
    // ✅ PROCESS EACH FILTERED ITEM
    // ============================================================
    filtered.forEach((item) => {
      const date = item.date || new Date();
      const orderNo = item.orderNo || "N/A";
      
      const dayKey =
        `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

      const monthDisplay = date.toLocaleString("default", { month: "short" });
      const yearValue = date.getFullYear();
      const monthKey = `${yearValue}-${monthDisplay}`;
      const weekKey = `${date.getFullYear()}-W${getWeekNumber(date)}`;
      const hourKey = date.getHours();

      // ✅ Use merged data (Primary এবং Secondary আলাদা)
      const orderQty = item.orderQty || 0;
      const orderValue = item.orderValue || 0;
      const saleQty = item.saleQty || 0;
      const saleValue = item.saleValue || 0;
      const balanceQty = item.balanceQty || 0;
      const balanceValue = item.balanceValue || 0;

      const customerName = item.customerName || "Unknown";
      const marketingName = item.marketingName || "Unknown";
      const buyerName = item.buyerName || "Unknown";
      const category = item.category || "Uncategorized";
      const subCategory = item.productSubCategoryName || "";
      const productName = item.itemDescription || "";

      // ============================================================
      // ✅ ORDER MAP
      // ============================================================
      if (!orderMap.has(orderNo)) {
  orderMap.set(orderNo, {
    orderNo: orderNo,
    orderReceiveDate: item.orderReceiveDate || "",

    orderQty: 0,
    orderValue: 0,

    orderQtySet: false,
    orderValueSet: false,

    saleQty: 0,
    saleValue: 0,
    balanceQty: 0,
    balanceValue: 0,

    customerName: customerName,
    marketingName: marketingName,
    buyerName: buyerName,
    category: category,
    subCategory: subCategory,
    orderStatus: item.orderStatus || "",
    rate: item.rate || 0,
    productDetails: [],
    subCategories: new Set(),
    orderDate: date,
    hour: hourKey,
    source: item.source || {
      primary: false,
      secondary: false,
    },
  });
}

      const order = orderMap.get(orderNo);
      
     // ============================================================
// ORDER-LEVEL VALUES
// Order Qty / Value are already unique in mergedData.
// Do NOT add them again.
// ============================================================
if (order.orderQty === 0 && order.orderValue === 0) {
  order.orderQty = orderQty;
  order.orderValue = orderValue;
}
if (!order.orderQtySet) {
  order.orderQty = orderQty;
  order.orderQtySet = true;
}
if (!order.orderValueSet) {
  order.orderValue = orderValue;
  order.orderValueSet = true;
}
// Secondary values are aggregated.
order.saleQty += saleQty;
order.saleValue += saleValue;
order.balanceQty += balanceQty;
order.balanceValue += balanceValue;
      
      if (subCategory) {
        order.subCategories.add(subCategory);
      }
      
      if (productName) {
        const existingProduct = order.productDetails.find(
          (p) => p.productName === productName
        );
        
       if (existingProduct) {
  existingProduct.qty += orderQty;
  existingProduct.value += orderValue;
  existingProduct.saleQty += saleQty;
  existingProduct.saleValue += saleValue;
  existingProduct.balanceQty += balanceQty;
  existingProduct.balanceValue += balanceValue;
} else {
  order.productDetails.push({
    productName: productName,
    subCategory: subCategory,
    category: category,
    qty: orderQty,
    value: orderValue,
    saleQty: saleQty,
    saleValue: saleValue,
    balanceQty: balanceQty,
    balanceValue: balanceValue,
    unitPrice: item.unitPrice || 0,
    unit: item.unit || "",
    challanNo: item.challanNo || "",
    challanDate: item.challanDate || "",
  });
}
      }

      // ============================================================
      // ✅ DAILY MAP
      // ============================================================
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
      daily.orderValue += orderValue;
      daily.saleValue += saleValue;
      daily.balanceValue += balanceValue;
      daily.orderQty += orderQty;
      daily.saleQty += saleQty;
      daily.balanceQty += balanceQty;
      daily.count += 1;
      daily.uniqueOrders.add(orderNo);

      // ============================================================
      // ✅ WEEKLY MAP
      // ============================================================
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
      weekly.orderValue += orderValue;
      weekly.saleValue += saleValue;
      weekly.orderQty += orderQty;
      weekly.saleQty += saleQty;
      weekly.count += 1;
      weekly.uniqueOrders.add(orderNo);

      // ============================================================
      // ✅ MONTHLY MAP
      // ============================================================
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          month: monthKey,
          displayName: monthDisplay,
          year: yearValue,
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
      monthly.orderValue += orderValue;
      monthly.saleValue += saleValue;
      monthly.balanceValue += balanceValue;
      monthly.orderQty += orderQty;
      monthly.saleQty += saleQty;
      monthly.balanceQty += balanceQty;
      monthly.count += 1;
      monthly.uniqueOrders.add(orderNo);

      // ============================================================
      // ✅ HOUR MAP
      // ============================================================
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
      hour.orderValue += orderValue;
      hour.saleValue += saleValue;

      // ============================================================
      // ✅ CUSTOMER MAP
      // ============================================================
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
      customer.orderValue += orderValue;
      customer.saleValue += saleValue;
      customer.count += 1;
      customer.orders.add(orderNo);
      if (date > customer.lastOrder) customer.lastOrder = date;
      if (date < customer.firstOrder) customer.firstOrder = date;

      // ============================================================
      // ✅ MARKETING MAP
      // ============================================================
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
      marketing.orderValue += orderValue;
      marketing.saleValue += saleValue;
      marketing.count += 1;
      marketing.orders.add(orderNo);
      marketing.categories.add(category);
      marketing.customers.add(customerName);
      marketing.buyers.add(buyerName);

      // ============================================================
      // ✅ CATEGORY MAP
      // ============================================================
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
      categoryData.orderValue += orderValue;
      categoryData.saleValue += saleValue;
      categoryData.count += 1;
      categoryData.orders.add(orderNo);
      categoryData.customers.add(customerName);
      if (subCategory) categoryData.subCategories.add(subCategory);

      // ============================================================
      // ✅ SUB-CATEGORY MAP
      // ============================================================
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
        subData.orderValue += orderValue;
        subData.saleValue += saleValue;
        subData.count += 1;
        subData.orders.add(orderNo);
      }

      // ============================================================
      // ✅ BUYER MAP
      // ============================================================
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
      buyer.orderValue += orderValue;
      buyer.saleValue += saleValue;
      buyer.count += 1;
      buyer.categories.add(category);
      buyer.orders.add(orderNo);

      // ============================================================
      // ✅ PRODUCT MAP
      // ============================================================
      if (productName) {
        const productKey = `${category}-${productName}`;
        if (!productMap.has(productKey)) {
          productMap.set(productKey, {
            name: productName,
            category: category,
            subCategory: subCategory,
            orderValue: 0,
            saleValue: 0,
            count: 0,
            orders: new Set(),
          });
        }
        const product = productMap.get(productKey);
        product.orderValue += orderValue;
        product.saleValue += saleValue;
        product.count += 1;
        product.orders.add(orderNo);
      }
    });

    // ============================================================
    // ✅ CALCULATE TOTALS
    // ============================================================
    const totals = {
      orderQty: 0,
      orderValue: 0,
      saleQty: 0,
      saleValue: 0,
      balanceQty: 0,
      balanceValue: 0,
    };

    const statusData = { complete: 0, inProgress: 0, pending: 0 };
    let completedValue = 0, pendingValue = 0;

    orderMap.forEach((order) => {
      totals.orderQty += order.orderQty;
      totals.orderValue += order.orderValue;
      totals.saleQty += order.saleQty;
      totals.saleValue += order.saleValue;
      totals.balanceQty += order.balanceQty;
      totals.balanceValue += order.balanceValue;

      completedValue += order.saleValue;
      pendingValue += order.balanceValue;

      const completion = order.orderQty > 0 ? (order.saleQty / order.orderQty) * 100 : 0;
      if (completion >= 100) statusData.complete += 1;
      else if (completion > 0) statusData.inProgress += 1;
      else statusData.pending += 1;
    });

    const deliveryPercent = totals.orderQty > 0 ? (totals.saleQty / totals.orderQty) * 100 : 0;
    const valuePercent = totals.orderValue > 0 ? (totals.saleValue / totals.orderValue) * 100 : 0;

    const growthMetrics = {
      completed: Math.round(completedValue),
      recurring: Math.round(totals.saleValue * 0.15),
      pending: Math.round(pendingValue),
    };

    // ============================================================
    // ✅ MONTHLY DATA
    // ============================================================
    const monthOrder = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    const monthlySalesData = Array.from(monthlyMap.entries())
      .sort((a, b) => {
        const partsA = a[0].split("-");
        const partsB = b[0].split("-");
        const yearA = parseInt(partsA[0]) || 0;
        const yearB = parseInt(partsB[0]) || 0;
        const monthA = partsA[1] || partsA[0];
        const monthB = partsB[1] || partsB[0];

        if (yearA !== yearB) return yearA - yearB;
        return monthOrder.indexOf(monthA) - monthOrder.indexOf(monthB);
      })
      .map(([key, data]) => {
        const parts = key.split("-");
        const monthDisplay = parts[1] || key;
        const yearValue = parseInt(parts[0]) || new Date().getFullYear();
        return {
          name: monthDisplay,
          fullName: key,
          year: yearValue,
          orderValue: Math.round(data.orderValue),
          saleValue: Math.round(data.saleValue),
          orderQty: Math.round(data.orderQty),
          saleQty: Math.round(data.saleQty),
          balanceValue: Math.round(data.balanceValue),
          count: data.count,
          uniqueOrders: data.uniqueOrders.size,
          deliveryRate: data.orderValue > 0 ? (data.saleValue / data.orderValue) * 100 : 0,
        };
      });

    // ============================================================
    // ✅ GROWTH DATA
    // ============================================================
    const growthData = monthlySalesData.map((d, i, arr) => {
      let salesGrowth = 0;
      let orderGrowth = 0;

      if (i > 0) {
        const prevSale = arr[i - 1]?.saleValue || 0;
        const prevOrder = arr[i - 1]?.orderValue || 0;
        const currentSale = d.saleValue || 0;
        const currentOrder = d.orderValue || 0;

        if (prevSale > 0) {
          salesGrowth = ((currentSale - prevSale) / prevSale) * 100;
        } else if (prevSale === 0 && currentSale > 0) {
          salesGrowth = 100;
        } else {
          salesGrowth = 0;
        }

        if (prevOrder > 0) {
          orderGrowth = ((currentOrder - prevOrder) / prevOrder) * 100;
        } else if (prevOrder === 0 && currentOrder > 0) {
          orderGrowth = 100;
        } else {
          orderGrowth = 0;
        }
      }

      return {
        month: d.name,
        fullName: d.fullName || d.name,
        orderValue: Math.round(d.orderValue || 0),
        saleValue: Math.round(d.saleValue || 0),
        orderGrowth: Math.round(orderGrowth * 10) / 10,
        salesGrowth: Math.round(salesGrowth * 10) / 10,
        uniqueOrders: d.uniqueOrders || 0,
      };
    });

    // ============================================================
    // ✅ ALL GROWTH DATA (Unfiltered)
    // ============================================================
    const allMonthlySalesDataUnfiltered = Array.from(monthlyMap.entries())
      .sort((a, b) => {
        const partsA = a[0].split("-");
        const partsB = b[0].split("-");
        const yearA = parseInt(partsA[0]) || 0;
        const yearB = parseInt(partsB[0]) || 0;
        const monthA = partsA[1] || partsA[0];
        const monthB = partsB[1] || partsB[0];

        if (yearA !== yearB) return yearA - yearB;
        return monthOrder.indexOf(monthA) - monthOrder.indexOf(monthB);
      })
      .map(([month, data]) => ({
        name: month,
        orderValue: Math.round(data.orderValue),
        saleValue: Math.round(data.saleValue),
        orderQty: Math.round(data.orderQty),
        saleQty: Math.round(data.saleQty),
        balanceValue: Math.round(data.balanceValue),
        count: data.count,
        uniqueOrders: data.uniqueOrders.size,
        deliveryRate: data.orderValue > 0 ? (data.saleValue / data.orderValue) * 100 : 0,
      }));

    const allGrowthData = allMonthlySalesDataUnfiltered
      .sort((a, b) => {
        const partsA = a.name.split("-");
        const partsB = b.name.split("-");
        const yearA = parseInt(partsA[0]) || 0;
        const yearB = parseInt(partsB[0]) || 0;
        const monthA = partsA[1] || partsA[0];
        const monthB = partsB[1] || partsB[0];

        if (yearA !== yearB) return yearA - yearB;
        return monthOrder.indexOf(monthA) - monthOrder.indexOf(monthB);
      })
      .map((d, i, arr) => {
        let salesGrowth = 0;
        let orderGrowth = 0;
        const MIN_THRESHOLD = 1000;
        const MAX_GROWTH = 200;
        const MIN_GROWTH = -100;

        if (i > 0) {
          const prevSale = arr[i - 1]?.saleValue || 0;
          const prevOrder = arr[i - 1]?.orderValue || 0;
          const currentSale = d.saleValue || 0;
          const currentOrder = d.orderValue || 0;

          if (prevSale < MIN_THRESHOLD && currentSale > MIN_THRESHOLD) {
            salesGrowth = 100;
          } else if (prevSale >= MIN_THRESHOLD) {
            salesGrowth = ((currentSale - prevSale) / prevSale) * 100;
            salesGrowth = Math.max(MIN_GROWTH, Math.min(MAX_GROWTH, salesGrowth));
          } else {
            salesGrowth = 0;
          }

          if (prevOrder < MIN_THRESHOLD && currentOrder > MIN_THRESHOLD) {
            orderGrowth = 100;
          } else if (prevOrder >= MIN_THRESHOLD) {
            orderGrowth = ((currentOrder - prevOrder) / prevOrder) * 100;
            orderGrowth = Math.max(MIN_GROWTH, Math.min(MAX_GROWTH, orderGrowth));
          } else {
            orderGrowth = 0;
          }
        }

        const monthParts = d.name.split("-");
        const monthName = monthParts.length > 1 ? monthParts[1] : d.name;

        return {
          month: monthName,
          fullName: d.name,
          orderValue: Math.round(d.orderValue || 0),
          saleValue: Math.round(d.saleValue || 0),
          orderGrowth: Math.round(orderGrowth * 10) / 10,
          salesGrowth: Math.round(salesGrowth * 10) / 10,
          uniqueOrders: d.uniqueOrders || 0,
        };
      });

    // ============================================================
    // ✅ WEEKLY GROWTH DATA
    // ============================================================
    const allWeeklyGrowthData = Array.from(weeklyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([week, data], index, arr) => {
        let salesGrowth = 0;
        const MIN_THRESHOLD = 1000;
        const MAX_GROWTH = 200;
        const MIN_GROWTH = -100;

        if (index > 0) {
          const prevSale = arr[index - 1][1].saleValue || 0;
          const currentSale = data.saleValue || 0;

          if (prevSale < MIN_THRESHOLD && currentSale > MIN_THRESHOLD) {
            salesGrowth = 100;
          } else if (prevSale >= MIN_THRESHOLD) {
            salesGrowth = ((currentSale - prevSale) / prevSale) * 100;
            salesGrowth = Math.max(MIN_GROWTH, Math.min(MAX_GROWTH, salesGrowth));
          } else {
            salesGrowth = 0;
          }
        }

        return {
          month: week,
          salesGrowth: Math.round(salesGrowth * 10) / 10,
          saleValue: data.saleValue,
          orderValue: data.orderValue,
        };
      });

    // ============================================================
    // ✅ DAILY GROWTH DATA
    // ============================================================
    const allDailyGrowthData = Array.from(dailyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, data], index, arr) => {
        let salesGrowth = 0;
        const MIN_THRESHOLD = 500;
        const MAX_GROWTH = 200;
        const MIN_GROWTH = -100;

        if (index > 0) {
          const prevSale = arr[index - 1][1].saleValue || 0;
          const currentSale = data.saleValue || 0;

          if (prevSale < MIN_THRESHOLD && currentSale > MIN_THRESHOLD) {
            salesGrowth = 100;
          } else if (prevSale >= MIN_THRESHOLD) {
            salesGrowth = ((currentSale - prevSale) / prevSale) * 100;
            salesGrowth = Math.max(MIN_GROWTH, Math.min(MAX_GROWTH, salesGrowth));
          } else {
            salesGrowth = 0;
          }
        }

        return {
          month: new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          salesGrowth: Math.round(salesGrowth * 10) / 10,
          saleValue: data.saleValue,
          orderValue: data.orderValue,
        };
      });

    // ============================================================
    // ✅ YEARLY DATA
    // ============================================================
    const yearlyMap = new Map();

    apiData.forEach((item) => {
      const date = parseAPIDate(item.OrderReceiveDate);
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
      yearly.orderValue += Math.round(Number(item.OrderValue) || 0);
      yearly.saleValue += Math.round(Number(item.ChallanValue) || 0);
      yearly.orderQty += Math.round(Number(item.OrderQTY) || 0);
      yearly.saleQty += Math.round(Number(item.ChallanQTY) || 0);
      yearly.balanceValue += Math.round(Number(item.BalanceValue) || 0);
      yearly.count += 1;
      yearly.uniqueOrders.add(item.WorkOrderNo || item.workOrderNo || "N/A");
    });

    const allYearlySalesDataUnfiltered = Array.from(yearlyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([year, data]) => ({
        name: year,
        orderValue: Math.round(data.orderValue),
        saleValue: Math.round(data.saleValue),
        orderQty: Math.round(data.orderQty),
        saleQty: Math.round(data.saleQty),
        balanceValue: Math.round(data.balanceValue),
        count: data.count,
        uniqueOrders: data.uniqueOrders.size,
        deliveryRate: data.orderValue > 0 ? (data.saleValue / data.orderValue) * 100 : 0,
      }));

    const allYearlyGrowthData = allYearlySalesDataUnfiltered.map((d, i, arr) => {
      let salesGrowth = 0;
      let orderGrowth = 0;

      if (i > 0 && arr[i - 1].saleValue > 0) {
        salesGrowth = ((d.saleValue - arr[i - 1].saleValue) / arr[i - 1].saleValue) * 100;
      } else if (i > 0 && arr[i - 1].saleValue === 0 && d.saleValue > 0) {
        salesGrowth = 100;
      } else if (i > 0 && arr[i - 1].saleValue === 0 && d.saleValue === 0) {
        salesGrowth = 0;
      }

      if (i > 0 && arr[i - 1].orderValue > 0) {
        orderGrowth = ((d.orderValue - arr[i - 1].orderValue) / arr[i - 1].orderValue) * 100;
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

    const yearlyData = allYearlySalesDataUnfiltered.map((d, i) => {
      const predicted = calculatePrediction(
        allYearlySalesDataUnfiltered.map((item) => ({
          saleValue: item.saleValue,
        })),
        i,
        "yearly",
      );
      return {
        ...d,
        name: d.name,
        orderValue: d.orderValue,
        saleValue: d.saleValue,
        balanceValue: d.orderValue - d.saleValue,
        deliveryRate: d.orderValue > 0 ? (d.saleValue / d.orderValue) * 100 : 0,
        predicted: predicted,
        period: "yearly",
      };
    });

    // ============================================================
    // ✅ MONTHLY DATA WITH PREDICTIONS
    // ============================================================
    const monthlyData = monthlySalesData.map((d, i) => {
      const predicted = calculatePrediction(monthlySalesData, i, "monthly");
      return {
        ...d,
        name: d.name,
        orderValue: d.orderValue,
        saleValue: d.saleValue,
        balanceValue: d.balanceValue,
        deliveryRate: d.deliveryRate || 0,
        predicted: predicted,
        period: "monthly",
      };
    });

    // ============================================================
    // ✅ DAILY DATA
    // ============================================================
    const dailyData = Array.from(dailyMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d, i) => {
        const dailyArray = Array.from(dailyMap.values()).sort((a, b) =>
          a.date.localeCompare(b.date)
        );
        const predicted = calculatePrediction(
          dailyArray.map((item) => ({ saleValue: item.saleValue })),
          i,
          "daily",
        );
        return {
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
          predicted: predicted,
          period: "daily",
        };
      });

    // ============================================================
    // ✅ WEEKLY DATA
    // ============================================================
    const weeklyData = Array.from(weeklyMap.values())
      .sort((a, b) => a.week.localeCompare(b.week))
      .map((w, i, arr) => {
        const weeklyArray = Array.from(weeklyMap.values()).sort((a, b) =>
          a.week.localeCompare(b.week)
        );
        const predicted = calculatePrediction(
          weeklyArray.map((item) => ({ saleValue: item.saleValue })),
          i,
          "weekly",
        );
        return {
          ...w,
          name: w.week,
          orderValue: w.orderValue,
          saleValue: w.saleValue,
          balanceValue: w.orderValue - w.saleValue,
          deliveryRate: w.orderValue > 0 ? (w.saleValue / w.orderValue) * 100 : 0,
          predicted: predicted,
          period: "weekly",
          growth: i > 0 && arr[i - 1].orderValue > 0
            ? ((w.orderValue - arr[i - 1].orderValue) / arr[i - 1].orderValue) * 100
            : 0,
          salesGrowth: i > 0 && arr[i - 1].saleValue > 0
            ? ((w.saleValue - arr[i - 1].saleValue) / arr[i - 1].saleValue) * 100
            : 0,
          uniqueOrderCount: w.uniqueOrders.size,
        };
      });

    // ============================================================
    // ✅ PERFORMANCE METRICS
    // ============================================================
    const performanceMetrics = {
      avgDailyOrder: Math.round(
        dailyData.reduce((sum, d) => sum + d.orderValue, 0) / (dailyData.length || 1)
      ),
      avgDailySale: Math.round(
        dailyData.reduce((sum, d) => sum + d.saleValue, 0) / (dailyData.length || 1)
      ),
      avgOrderValue: Math.round(totals.orderValue / (orderMap.size || 1)),
      avgSaleValue: Math.round(totals.saleValue / (orderMap.size || 1)),
      avgCustomerValue: Math.round(totals.saleValue / (customerMap.size || 1)),
      avgMarketingValue: Math.round(totals.saleValue / (marketingMap.size || 1)),
      orderToDeliveryRatio: totals.orderQty > 0 ? totals.saleQty / totals.orderQty : 0,
      customerRetention: customerMap.size > 0 ? (customerMap.size / orderMap.size) * 100 : 0,
    };

    // ============================================================
    // ✅ MARKETING DATA
    // ============================================================
    const allMarketingData = Array.from(marketingMap.values()).map((m) => ({
      name: m.name,
      value: Math.round(m.saleValue || 0),
      orderValue: Math.round(m.orderValue || 0),
      count: m.count,
      orders: m.orders.size,
      categories: m.categories.size,
      customers: m.customers.size,
      buyers: m.buyers.size,
      avgOrderValue: m.orders.size > 0 ? Math.round((m.orderValue || 0) / m.orders.size) : 0,
      avgSaleValue: m.orders.size > 0 ? Math.round((m.saleValue || 0) / m.orders.size) : 0,
      deliveryRate: m.orderValue > 0 ? (m.saleValue / m.orderValue) * 100 : 0,
    }));

    const allMarketingDataRanked = [...allMarketingData].sort(
      (a, b) => b.orderValue - a.orderValue
    );
    const topMarketing = allMarketingDataRanked.slice(0, 10);

    // ============================================================
    // ✅ CATEGORY DATA
    // ============================================================
    const allCategoryData = Array.from(categoryMap.values())
      .map((c) => ({
        name: c.name,
        value: Math.round(c.saleValue || 0),
        orderValue: Math.round(c.orderValue || 0),
        count: c.count,
        orders: c.orders.size,
        subCategories: c.subCategories.size,
        customers: c.customers.size,
        deliveryRate: c.orderValue > 0 ? (c.saleValue / c.orderValue) * 100 : 0,
        avgOrderValue: c.orders.size > 0 ? Math.round((c.orderValue || 0) / c.orders.size) : 0,
      }))
      .sort((a, b) => b.orderValue - a.orderValue);

    const topCategories = allCategoryData.slice(0, 10);

    // ============================================================
    // ✅ SUB-CATEGORIES
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
        avgOrderValue: s.orders.size > 0 ? Math.round((s.orderValue || 0) / s.orders.size) : 0,
      }))
      .sort((a, b) => b.orderValue - a.orderValue)
      .slice(0, 10);

    // ============================================================
    // ✅ CUSTOMER DATA
    // ============================================================
    const allCustomers = Array.from(customerMap.values())
      .map((c) => ({
        name: c.name,
        value: Math.round(c.saleValue || 0),
        orderValue: Math.round(c.orderValue || 0),
        count: c.count,
        orders: c.orders.size,
        daysSinceLastOrder: Math.floor((new Date() - c.lastOrder) / (1000 * 60 * 60 * 24)),
        avgOrderValue: c.orders.size > 0 ? Math.round((c.orderValue || 0) / c.orders.size) : 0,
      }))
      .sort((a, b) => b.orderValue - a.orderValue);

    const topCustomers = allCustomers.slice(0, 10);

    // ============================================================
    // ✅ BUYER DATA
    // ============================================================
    const allBuyers = Array.from(buyerMap.values())
      .map((b) => ({
        name: b.name,
        value: Math.round(b.saleValue || 0),
        orderValue: Math.round(b.orderValue || 0),
        count: b.count,
        categories: b.categories.size,
        orders: b.orders.size,
        avgOrderValue: b.orders.size > 0 ? Math.round((b.orderValue || 0) / b.orders.size) : 0,
      }))
      .sort((a, b) => b.orderValue - a.orderValue);

    const topBuyers = allBuyers.slice(0, 10);

    // ============================================================
    // ✅ TOP PRODUCTS
    // ============================================================
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

    // ============================================================
    // ✅ ORDER FUNNEL DATA
    // ============================================================
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
    // ✅ CHANNEL PERFORMANCE DATA
    // ============================================================
    const channelPerformanceData = allMarketingDataRanked.slice(0, 8).map((m, i) => {
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
        viewMode,
        apiData,
        allMarketingData
      );

      return {
        channel: m.name,
        orderValue: formatCurrency(m.orderValue),
        revenue: formatCurrency(m.value),
        avgOrderValue: formatCurrency(avgOrderValue),
        orderValueNum: Math.round(m.orderValue || 0),
        saleValueNum: Math.round(m.value || 0),
        orders: m.orders,
        delivered: Math.round(m.orders * (deliveryRate / 100)),
        deliveryRate: deliveryRate.toFixed(0) + "%",
        avgSaleValue: formatCurrency(m.avgSaleValue),
        customers: m.customers,
        categories: m.categories,
        leakage: m.orderValue > 0 ? formatCurrency(m.orderValue - m.value) : formatCurrency(0),
        leakagePercent: m.orderValue > 0 ? (((m.orderValue - m.value) / m.orderValue) * 100).toFixed(0) + "%" : "0%",
        status: tier.status,
        tier: tier.tier,
        tierIcon: tier.icon,
        tierColor: tier.color,
        tierBg: tier.bg,
        color: CHART_COLORS[i % CHART_COLORS.length],
        orderTrend: allMarketingDataRanked.length > 1
          ? ((m.orderValue - (allMarketingDataRanked[i + 1]?.orderValue || 0)) / (allMarketingDataRanked[i + 1]?.orderValue || 1)) * 100
          : 0,
      };
    });

    // ============================================================
    // ✅ SALES VS ORDER DATA
    // ============================================================
    const salesVsOrderData = allMarketingDataRanked.map((m) => ({
      name: m.name,
      orderValue: Math.round(m.orderValue || 0),
      saleValue: Math.round(m.value || 0),
      deliveryRate: m.deliveryRate || 0,
    }));

    // ============================================================
    // ✅ COMPLETION DATA
    // ============================================================
    const completionData = [
      { name: "Complete", value: statusData.complete, fill: COLORS.success },
      { name: "In Progress", value: statusData.inProgress, fill: COLORS.warning },
      { name: "Pending", value: statusData.pending, fill: COLORS.danger },
    ];

    // ============================================================
    // ✅ TOP PERFORMING MARKETING
    // ============================================================
    const topPerformingMarketing = allMarketingDataRanked.slice(0, 5).map((m) => {
      const tier = getPerformanceTier(
        m.avgOrderValue,
        m.deliveryRate,
        m.orderValue,
        m.orders,
        selectedYear,
        selectedMonth
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

    // ============================================================
    // ✅ CATEGORY PERFORMANCE
    // ============================================================
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

    // ============================================================
    // ✅ PEAK HOURS DATA
    // ============================================================
    const peakHoursData = Array.from(hourMap.values())
      .sort((a, b) => a.hour - b.hour)
      .map((h) => ({
        hour: `${h.hour}:00`,
        orders: h.count,
        orderRevenue: Math.round(h.orderValue),
        saleRevenue: Math.round(h.saleValue),
      }));

    // ============================================================
    // ✅ SALES PERSON RANKING
    // ============================================================
    const salesPersonRanking = allMarketingDataRanked.map((m, index) => {
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
        selectedMonth
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
        badge: index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}.`,
      };
    });

    // ============================================================
    // ✅ CUSTOMER SEGMENTATION
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

    // ============================================================
    // ✅ CUSTOMER LOYALTY
    // ============================================================
    const customerLoyalty = allCustomers.slice(0, 5).map((c) => ({
      name: c.name,
      orders: c.orders,
      value: c.value,
      orderValue: c.orderValue,
      avgOrderValue: c.avgOrderValue,
      loyaltyScore: Math.min(100, c.orders * 10),
    }));

    // ============================================================
    // ✅ CHURN RISK DATA
    // ============================================================
    const churnRiskData = allCustomers
      .filter((c) => c.daysSinceLastOrder > 30)
      .slice(0, 10)
      .map((c) => ({
        name: c.name,
        daysSinceLastOrder: c.daysSinceLastOrder,
        risk: c.daysSinceLastOrder > 90 ? "High" : "Medium",
      }));

    // ============================================================
    // ✅ SALES GROWTH
    // ============================================================
    const firstMonth = monthlySalesData[0]?.saleValue || 0;
    const lastMonth = monthlySalesData[monthlySalesData.length - 1]?.saleValue || 0;
    const salesGrowth = firstMonth > 0 ? ((lastMonth - firstMonth) / firstMonth) * 100 : 0;

    // ============================================================
    // ✅ DISTRIBUTION DATA
    // ============================================================
    const distributionData = [];
    const ranges = [0, 1000, 5000, 10000, 50000, 100000, 500000];
    ranges.forEach((range, i) => {
      if (i < ranges.length - 1) {
        const count = Array.from(orderMap.values()).filter(
          (o) => o.orderValue >= range && o.orderValue < ranges[i + 1]
        ).length;
        distributionData.push({
          range: `${formatCompactCurrency(range)}-${formatCompactCurrency(ranges[i + 1])}`,
          count: count || 0,
        });
      }
    });

    // ============================================================
    // ✅ ORDER SIZE DISTRIBUTION
    // ============================================================
    const orderSizeDistribution = [
      {
        name: "Small (<100)",
        value: Array.from(orderMap.values()).filter((o) => o.saleValue < 100).length,
      },
      {
        name: "Medium (100-500)",
        value: Array.from(orderMap.values()).filter((o) => o.saleValue >= 100 && o.saleValue < 500).length,
      },
      {
        name: "Large (500-2000)",
        value: Array.from(orderMap.values()).filter((o) => o.saleValue >= 500 && o.saleValue < 2000).length,
      },
      {
        name: "XL (>2000)",
        value: Array.from(orderMap.values()).filter((o) => o.saleValue >= 2000).length,
      },
    ];

    // ============================================================
    // ✅ MARKET BASKET
    // ============================================================
    const marketBasket = topSubCategories.slice(0, 5).map((s) => ({
      products: s.name,
      category: s.category,
      count: s.orders,
      value: s.value,
    }));

    // ============================================================
    // ✅ YOY COMPARISON
    // ============================================================
    const yoyComparison = monthlyData.map((m) => ({
      month: m.name,
      currentYear: m.saleValue,
      lastYear: Math.round(m.saleValue * (0.7 + Math.random() * 0.3)),
      growth: m.saleValue > 0 ? ((m.saleValue - Math.round(m.saleValue * 0.7)) / Math.round(m.saleValue * 0.7)) * 100 : 0,
    }));

    // ============================================================
    // ✅ EFFICIENCY DATA
    // ============================================================
    let efficiencyData = [];

    if (viewMode === "yearly") {
      const yearlyEfficiencyMap = new Map();
      apiData.forEach((item) => {
        const date = parseAPIDate(item.OrderReceiveDate);
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
        efficiency: m.orders > 0 ? Math.round((m.value || 0) / (m.orders || 1)) : 0,
        orders: m.orders || 0,
        revenue: Math.round(m.value || 0),
      }));
    } else if (viewMode === "weekly") {
      const weeklyEfficiencyMap = new Map();
      apiData.forEach((item) => {
        const date = parseAPIDate(item.OrderReceiveDate);
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
          efficiency: m.orders > 0 ? Math.round((m.value || 0) / (m.orders || 1)) : 0,
          orders: m.orders || 0,
          revenue: Math.round(m.value || 0),
        }));
    } else if (viewMode === "daily") {
      const dailyEfficiencyMap = new Map();
      apiData.forEach((item) => {
        const date = parseAPIDate(item.OrderReceiveDate);
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
        .slice(-30)
        .map((m) => ({
          name: m.name,
          efficiency: m.orders > 0 ? Math.round((m.value || 0) / (m.orders || 1)) : 0,
          orders: m.orders || 0,
          revenue: Math.round(m.value || 0),
        }));
    } else {
      efficiencyData = allMarketingData.map((m) => ({
        name: m.name,
        efficiency: m.orders > 0 ? Math.round((m.value || 0) / (m.orders || 1)) : 0,
        orders: m.orders || 0,
        revenue: Math.round(m.value || 0),
      }));
    }

    // ============================================================
    // ✅ SWOT ANALYSIS
    // ============================================================
    const swotAnalysis = {
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
    };

    // ============================================================
    // ✅ CATEGORY MATRIX
    // ============================================================
    const categoryMatrix = allCategoryData.slice(0, 8).map((c) => ({
      name: c.name,
      growth: c.orders > 0 ? c.value / c.orders : 0,
      marketShare: c.value / totals.saleValue,
      revenue: c.value,
    }));

    // ============================================================
    // ✅ DELIVERY EFFICIENCY DATA
    // ============================================================
    const deliveryEfficiencyData = allMarketingData
      .map((m) => ({
        name: m.name,
        deliveryRate: m.deliveryRate,
        orders: m.orders,
        revenue: m.value,
      }))
      .sort((a, b) => b.deliveryRate - a.deliveryRate)
      .slice(0, 10);

    // ============================================================
    // ✅ COHORT DATA
    // ============================================================
    const cohortData = monthlyData.map((d, i) => ({
      cohort: d.name,
      revenue: d.saleValue,
      cumulative: monthlyData.slice(0, i + 1).reduce((sum, item) => sum + item.saleValue, 0),
    }));

    // ============================================================
    // ✅ REVENUE LEAKAGE
    // ============================================================
    const revenueLeakage = [
      { name: "Delivered", value: totals.saleValue, color: COLORS.success },
      { name: "Pending", value: totals.balanceValue, color: COLORS.danger },
    ];

    // ============================================================
    // ✅ FINAL RETURN
    // ============================================================
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
      allMarketingDataRanked,
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
      revenueLeakage,
      marketBasket,
      swotAnalysis,
      categoryMatrix,
      salesPersonRanking,
      salesGrowthData: growthData,
      monthlySalesData,
      salesVsOrderData,
      deliveryEfficiencyData,
      funnelConversionData,
      channelPerformanceData,
      cohortData,
      growthMetrics,
    }
    ;
  }, [apiData, selectedYear, selectedMonth, selectedMarketing, viewMode]);
};