// src/assets/components/Home/utils/constants.js

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


export const API_ENDPOINTS = {
  // CommandID = 1
  // ONLY ApprovedDate -> OrderReceiveDate
  primary: {
    url: "https://tpl-api.ebs365.info/api/OrderReport/BI_ORDERGetOrderReleatedInformationReport",
    commandId: 1,
  },

  // CommandID = 5
  // Challan / Balance / Product details
  secondary: {
    url: "https://tpl-api.ebs365.info/api/OrderReport/BI_OrderRelatedInformationReport",
    commandId: 5,
  },

  // CommandID = 15
  // Order master information
  orderMaster: {
    url: "https://tpl-api.ebs365.info/api/OrderReport/BI_OrderRelatedInformationReport",
    commandId: 15,
  },
  actualSales: {
  url: "https://tpl-api.ebs365.info/api/OrderReport/BI_OrderRelatedInformationReport",
  commandId: 3,
},
};

export const MONTH_ORDER = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];