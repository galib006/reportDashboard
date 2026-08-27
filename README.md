# 📊 Enterprise Analytics Dashboard

A comprehensive dashboard for enterprise analytics with order management, sales tracking, and advanced visualizations.

## 🚀 Features

- **Order Analytics**: Track order values, quantities, and delivery status
- **Sales Performance**: Monitor sales person performance and ranking
- **Category Analysis**: Product category and sub-category insights
- **Buyer Analysis**: Customer segmentation and loyalty tracking
- **Interactive Charts**: 10+ chart types with Recharts
- **Predictive Analytics**: Sales forecasting and trend analysis
- **Dynamic Date Range**: Filter data by custom date ranges
- **Multi-dimensional Filters**: Year, Month, Marketing Person filters

## 🛠️ Tech Stack

- **Frontend**: React 18 with Hooks
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Animations**: Framer Motion
- **HTTP Client**: Axios
- **Date Handling**: Day.js

## 📁 Project Structure
src/
├── assets/
│ └── components/
│ └── Home/
│ ├── index.jsx # Main component
│ ├── hooks/
│ │ └── useComprehensiveData.jsx
│ ├── utils/
│ │ ├── constants.js
│ │ ├── dateUtils.js
│ │ └── formatUtils.js
│ ├── charts/
│ │ ├── PerformanceChart.jsx
│ │ ├── OrderVsSalesChart.jsx
│ │ ├── MarketingChart.jsx
│ │ ├── CategoryChart.jsx
│ │ ├── BuyerChart.jsx
│ │ ├── RadarChart.jsx
│ │ ├── FunnelChart.jsx
│ │ ├── PredictionChart.jsx
│ │ ├── EfficiencyChart.jsx
│ │ ├── RevenueDistributionPie.jsx
│ │ └── ChannelPerformanceMatrix.jsx
│ ├── tabs/
│ │ ├── OverviewTab.jsx
│ │ ├── SalesTab.jsx
│ │ ├── CategoriesTab.jsx
│ │ ├── BuyersTab.jsx
│ │ ├── FunnelTab.jsx
│ │ ├── ChannelsTab.jsx
│ │ ├── AnalyticsTab.jsx
│ │ ├── PredictiveTab.jsx
│ │ └── InsightsTab.jsx
│ └── components/
│ ├── Header.jsx
│ ├── FilterBar.jsx
│ ├── KPICard.jsx
│ └── ...
└── components/
└── DataContext.jsx


## 🔌 API Integration

### Primary API (Order Data)
- **Endpoint**: `/api/OrderReport/BI_ORDERGetOrderReleatedInformationReport`
- **Fields**: `WorkOrderNo`, `OrderQTY`, `OrderValue`, `CustomerName`, `Marketing`

### Secondary API (Challan Data)
- **Endpoint**: `/api/OrderReport/BI_OrderRelatedInformationReport`
- **Fields**: `WorkOrderNo`, `ChallanQTY`, `ChallanValue`, `ProductCategoryName`

## 📊 Data Structure

```javascript
{
  orderNo: "SO-003279-2026",
  orderQty: 109520,      // Primary API
  orderValue: 1107.78,   // Primary API
  saleQty: 109520,       // Secondary API
  saleValue: 1107.78,    // Secondary API
  productDetails: [
    {
      productName: "oil tissue (08 × 10)",
      qty: 33000,
      value: 165,
      saleQty: 33000,
      saleValue: 165
    }
  ]
}