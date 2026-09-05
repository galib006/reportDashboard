// src/assets/components/Home/utils/constants.js

import commandId1 from "../../../api/command1.json";
import commandId2 from "../../../api/command2.json";
import commandId3 from "../../../api/command3.json";
import commandId15 from "../../../api/command15.json";

export const COLORS = {
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

export const CHART_COLORS = [
  "#4F46E5", "#7C3AED", "#10B981", "#F59E0B", "#EF4444",
  "#3B82F6", "#EC4899", "#14B8A6", "#F97316", "#6366F1",
  "#8B5CF6", "#34D399", "#F43F5E", "#06B6D4", "#FBBF24",
  "#84CC16", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981",
];


// ============================================================
// LOCAL JSON DATA
// ============================================================

export const LOCAL_API_DATA = {
  command1: commandId1,
  command2: commandId2,
  command3: commandId3,
  command15: commandId15,
};


// ============================================================
// DATA SOURCE MODE
// ============================================================

// true  = local JSON files
// false = live API
export const USE_LOCAL_DATA = true;


// ============================================================
// API ENDPOINTS
// ============================================================

export const API_ENDPOINTS = {
  primary: {
    url: "https://tpl-api.ebs365.info/api/OrderReport/BI_ORDERGetOrderReleatedInformationReport",
    commandId: 1,
  },

  secondary: {
    url: "https://tpl-api.ebs365.info/api/OrderReport/BI_OrderRelatedInformationReport",
    commandId: 5,
  },

  orderMaster: {
    url: "https://tpl-api.ebs365.info/api/OrderReport/BI_OrderRelatedInformationReport",
    commandId: 15,
  },

  actualSales: {
    url: "https://tpl-api.ebs365.info/api/OrderReport/BI_OrderRelatedInformationReport",
    commandId: 3,
  },
};


export const MONTH_ORDER = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];


// ============================================================
// COMMON API PARAMETERS
// ============================================================

export const DEFAULT_API_PARAMS = {
  CompanyID: 1,
  ProductCategoryID: 0,
  ProductSubCategoryID: 0,
  MarketingID: 0,
  CustomerID: 0,
  BuyerID: 0,
  JobCardID: 0,
  EmpID: 0,
};


// ============================================================
// ACTUAL SALES URL
// ============================================================

export const buildActualSalesUrl = (startDate, endDate) => {
  const baseUrl = API_ENDPOINTS.actualSales.url;
  const commandId = API_ENDPOINTS.actualSales.commandId;

  const formatDate = (date) => {
    if (typeof date === "string") return date;
    if (date instanceof Date) return date.toISOString();
    return new Date(date).toISOString();
  };

  const params = new URLSearchParams({
    CompanyID: DEFAULT_API_PARAMS.CompanyID,
    ProductCategoryID: DEFAULT_API_PARAMS.ProductCategoryID,
    ProductSubCategoryID: DEFAULT_API_PARAMS.ProductSubCategoryID,
    MarketingID: DEFAULT_API_PARAMS.MarketingID,
    CustomerID: DEFAULT_API_PARAMS.CustomerID,
    BuyerID: DEFAULT_API_PARAMS.BuyerID,
    JobCardID: DEFAULT_API_PARAMS.JobCardID,
    StartDate: formatDate(startDate),
    EndDate: formatDate(endDate),
    CommandID: commandId,
    EmpID: DEFAULT_API_PARAMS.EmpID,
  });

  return `${baseUrl}?${params.toString()}`;
};


// ============================================================
// ORDER API URL
// ============================================================

export const buildOrderApiUrl = (
  endpoint,
  commandId,
  startDate,
  endDate,
  additionalParams = {}
) => {
  const formatDate = (date) => {
    if (typeof date === "string") return date;
    if (date instanceof Date) return date.toISOString();
    return new Date(date).toISOString();
  };

  const params = new URLSearchParams({
    CompanyID: DEFAULT_API_PARAMS.CompanyID,
    ProductCategoryID: DEFAULT_API_PARAMS.ProductCategoryID,
    ProductSubCategoryID: DEFAULT_API_PARAMS.ProductSubCategoryID,
    MarketingID: DEFAULT_API_PARAMS.MarketingID,
    CustomerID: DEFAULT_API_PARAMS.CustomerID,
    BuyerID: DEFAULT_API_PARAMS.BuyerID,
    JobCardID: DEFAULT_API_PARAMS.JobCardID,
    StartDate: formatDate(startDate),
    EndDate: formatDate(endDate),
    CommandID: commandId,
    EmpID: DEFAULT_API_PARAMS.EmpID,
    ...additionalParams,
  });

  return `${endpoint}?${params.toString()}`;
};