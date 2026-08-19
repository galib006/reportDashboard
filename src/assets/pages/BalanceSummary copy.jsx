// /* PI Summary - Enterprise Edition with Advanced Features */

// import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
// import { GetDataContext } from "../components/DataContext";
// import { FourSquare } from "react-loading-indicators";
// import OrderForm from "../OrderReport/OrderForm";
// import * as XLSX from "xlsx-js-style";
// import ReactPaginate from "react-paginate";
// import { toast } from "react-toastify";
// import PropTypes from "prop-types";

// // ============================================================
// // CONSTANTS & CONFIGURATION
// // ============================================================

// const CONFIG = {
//   ITEMS_PER_PAGE: 50,
//   MAX_EXCEL_ROWS: 10000,
//   DEBOUNCE_DELAY: 300,
//   MAX_CHALLAN_DISPLAY: 5,
//   DATE_FORMAT: "en-GB",
//   CURRENCY_SYMBOL: "$",
//   EXCEL_MAX_WIDTH: 25,
//   AUTO_REFRESH_INTERVAL: 60000, // 1 minute
// };

// const COLUMN_CONFIG = {
//   defaultVisible: [
//     "Order", "Date", "Customer", "Delivery", "Buyer", "PI", 
//     "LC", "Invoice", "Section", "OrderQty", "ChallanQty", 
//     "BalanceQty", "OrderValue", "ChallanValue", "BalanceValue", "Challan"
//   ],
//   allColumns: [
//     { id: "Order", label: "Order No", required: true },
//     { id: "Date", label: "Date", required: true },
//     { id: "Customer", label: "Customer", required: true },
//     { id: "Delivery", label: "Delivery", required: true },
//     { id: "Buyer", label: "Buyer", required: true },
//     { id: "PI", label: "PI No", required: false },
//     { id: "LC", label: "LC No", required: false },
//     { id: "Invoice", label: "Invoice No", required: false },
//     { id: "Section", label: "Section", required: true },
//     { id: "OrderQty", label: "Order Qty", required: true },
//     { id: "ChallanQty", label: "Challan Qty", required: true },
//     { id: "BalanceQty", label: "Balance Qty", required: true },
//     { id: "OrderValue", label: "Order Value", required: true },
//     { id: "ChallanValue", label: "Challan Value", required: true },
//     { id: "BalanceValue", label: "Balance Value", required: true },
//     { id: "Challan", label: "Challan", required: false },
//   ]
// };

// // ============================================================
// // CUSTOM HOOKS
// // ============================================================

// const useDebounce = (value, delay = CONFIG.DEBOUNCE_DELAY) => {
//   const [debouncedValue, setDebouncedValue] = useState(value);

//   useEffect(() => {
//     const handler = setTimeout(() => {
//       setDebouncedValue(value);
//     }, delay);

//     return () => clearTimeout(handler);
//   }, [value, delay]);

//   return debouncedValue;
// };

// const useLocalStorage = (key, initialValue) => {
//   const [storedValue, setStoredValue] = useState(() => {
//     try {
//       const item = window.localStorage.getItem(key);
//       return item ? JSON.parse(item) : initialValue;
//     } catch (error) {
//       console.error("Error reading localStorage:", error);
//       return initialValue;
//     }
//   });

//   const setValue = useCallback((value) => {
//     try {
//       const valueToStore = value instanceof Function ? value(storedValue) : value;
//       setStoredValue(valueToStore);
//       window.localStorage.setItem(key, JSON.stringify(valueToStore));
//     } catch (error) {
//       console.error("Error saving to localStorage:", error);
//     }
//   }, [key, storedValue]);

//   return [storedValue, setValue];
// };

// const useDataMaps = (cndata) => {
//   return useMemo(() => {
//     const challanMap = new Map();
//     const lcMap = new Map();
//     const invoiceMap = new Map();

//     try {
//       (cndata?.grupChallan ?? []).forEach((c) => {
//         challanMap.set(`${c.workOrderNo}-${c.challanNo}`, c.statusDesc);
//       });

//       (cndata?.bblcData ?? []).forEach((item) => {
//         const pi = item.customerPINo?.trim();
//         if (!pi) return;
//         if (!lcMap.has(pi)) lcMap.set(pi, []);
//         lcMap.get(pi).push({
//           lcNo: item.lcNo,
//           lcDate: item.lcDate,
//           totalLCValue: item.totalLCValue,
//         });
//       });

//       (cndata?.invoiceData ?? []).forEach((item) => {
//         if (!item.lcNo) return;
//         if (!invoiceMap.has(item.lcNo)) invoiceMap.set(item.lcNo, []);
//         invoiceMap.get(item.lcNo).push({
//           invoiceNo: item.invoiceNo,
//           invoiceDate: item.invoiceDate,
//           totalInvoiceValue: item.totalInvoiceValue,
//         });
//       });
//     } catch (error) {
//       console.error("Error building data maps:", error);
//     }

//     return { challanMap, lcMap, invoiceMap };
//   }, [cndata]);
// };

// const useSummarizedData = (cndata, maps) => {
//   return useMemo(() => {
//     const apidata = cndata?.apiData ?? [];
//     const { challanMap, lcMap, invoiceMap } = maps;

//     try {
//       const grouped = new Map();

//       apidata.forEach((item) => {
//         const key = `${item.WorkOrderNo}-${item.CustomerPINo}`;
        
//         if (!grouped.has(key)) {
//           grouped.set(key, {
//             WorkOrderNo: item.WorkOrderNo,
//             OrderReceiveDate: item.OrderReceiveDate,
//             DeliverName: item.FName,
//             CustomerName: item.CName,
//             PINO: item.CustomerPINo || "No PI",
//             Section: item.ProductCategoryName,
//             Buyer: item.BuyerName,
//             TotalQty: 0,
//             TotalValue: 0,
//             ChallanQTY: 0,
//             ChallanValue: 0,
//             BalanceQty: 0,
//             BalanceValue: 0,
//             ChallanNo: [],
//             itemCount: 0,
//           });
//         }

//         const row = grouped.get(key);
//         row.TotalQty += Number(item.BreakDownQTY) || 0;
//         row.ChallanQTY += Number(item.ChallanQTY) || 0;
//         row.BalanceQty += Number(item.BalanceQTY) || 0;
//         row.TotalValue += Number(item.TotalOrderValue) || 0;
//         row.ChallanValue += Number(item.ChallanValue) || 0;
//         row.BalanceValue += Number(item.BalanceValue) || 0;
//         row.itemCount += 1;

//         if (item.ChallanNo) {
//           item.ChallanNo.split(",")
//             .map((c) => c.trim())
//             .filter(Boolean)
//             .forEach((cn) => {
//               const status = challanMap.get(`${item.WorkOrderNo}-${cn}`) || "Unknown";
//               const exists = row.ChallanNo.some((c) => c.challanNo === cn);
//               if (!exists) {
//                 row.ChallanNo.push({ challanNo: cn, status });
//               }
//             });
//         }
//       });

//       return Array.from(grouped.values()).map((item) => {
//         const lcInfoList = (lcMap.get(item.PINO) || []).filter((lc) => lc.lcNo);
//         const invoiceInfoList = lcInfoList
//           .flatMap((lc) => invoiceMap.get(lc.lcNo) || [])
//           .filter((inv) => inv.invoiceNo);

//         return {
//           ...item,
//           LCList: lcInfoList,
//           InvoiceList: invoiceInfoList,
//           completionRate: item.TotalQty > 0 
//             ? ((item.ChallanQTY / item.TotalQty) * 100).toFixed(1) 
//             : 0,
//         };
//       });
//     } catch (error) {
//       console.error("Error summarizing data:", error);
//       return [];
//     }
//   }, [cndata, maps]);
// };

// const useFilters = (summarizedData, filters, search) => {
//   const normalize = useCallback((v) => String(v || "").trim().toLowerCase(), []);

//   return useMemo(() => {
//     const searchValue = normalize(search);
//     const { 
//       selectedPI, selectedOrder, selectedLC, selectedInvoice,
//       dateRange, minValue, maxValue, statusFilter, sectionFilter 
//     } = filters;

//     const selectedPISet = new Set(selectedPI.map(normalize));
//     const selectedOrderSet = new Set(selectedOrder.map(normalize));
//     const selectedLCSet = new Set(selectedLC.map(normalize));
//     const selectedInvoiceSet = new Set(selectedInvoice.map(normalize));

//     try {
//       return summarizedData
//         .filter((item) => {
//           const workOrder = normalize(item.WorkOrderNo);
//           const customer = normalize(item.CustomerName);
//           const delivery = normalize(item.DeliverName);
//           const buyer = normalize(item.Buyer);
//           const pi = normalize(item.PINO || "No PI");
//           const lc = normalize(
//             (item.LCList || []).map((l) => l.lcNo).join(",") || "No LC"
//           );
//           const invoice = normalize(
//             (item.InvoiceList || []).map((i) => i.invoiceNo).join(",") || "No Invoice"
//           );

//           const searchMatch =
//             !searchValue ||
//             workOrder.includes(searchValue) ||
//             customer.includes(searchValue) ||
//             delivery.includes(searchValue) ||
//             pi.includes(searchValue) ||
//             buyer.includes(searchValue) ||
//             lc.includes(searchValue) ||
//             invoice.includes(searchValue);

//           const piMatch =
//             selectedPISet.size === 0 || selectedPISet.has(normalize(item.PINO || "No PI"));
//           const lcMatch =
//             selectedLCSet.size === 0 ||
//             (item.LCList || []).some((l) => selectedLCSet.has(normalize(l.lcNo)));
//           const invoiceMatch =
//             selectedInvoiceSet.size === 0 ||
//             (item.InvoiceList || []).some((i) => selectedInvoiceSet.has(normalize(i.invoiceNo)));
//           const orderMatch =
//             selectedOrderSet.size === 0 || selectedOrderSet.has(workOrder);

//           let dateMatch = true;
//           if (dateRange?.start && dateRange?.end) {
//             const orderDate = new Date(item.OrderReceiveDate);
//             const start = new Date(dateRange.start);
//             const end = new Date(dateRange.end);
//             start.setHours(0, 0, 0, 0);
//             end.setHours(23, 59, 59, 999);
//             dateMatch = orderDate >= start && orderDate <= end;
//           }

//           let valueMatch = true;
//           if (minValue || maxValue) {
//             const totalValue = Number(item.TotalValue) || 0;
//             if (minValue && totalValue < Number(minValue)) valueMatch = false;
//             if (maxValue && totalValue > Number(maxValue)) valueMatch = false;
//           }

//           let statusMatch = true;
//           if (statusFilter) {
//             const completion = parseFloat(item.completionRate);
//             if (statusFilter === 'complete' && completion < 100) statusMatch = false;
//             if (statusFilter === 'in-progress' && (completion >= 100 || completion <= 0)) statusMatch = false;
//             if (statusFilter === 'pending' && completion > 0) statusMatch = false;
//           }

//           let sectionMatch = true;
//           if (sectionFilter) {
//             sectionMatch = normalize(item.Section) === normalize(sectionFilter);
//           }

//           return searchMatch && piMatch && orderMatch && lcMatch && 
//                  invoiceMatch && dateMatch && valueMatch && statusMatch && sectionMatch;
//         })
//         .sort((a, b) => {
//           const getParts = (val = "") => {
//             const parts = val.split("-");
//             return {
//               num: Number(parts[1]) || 0,
//               year: Number(parts[2]) || 0,
//             };
//           };
//           const A = getParts(a.WorkOrderNo);
//           const B = getParts(b.WorkOrderNo);
//           return B.year !== A.year ? B.year - A.year : B.num - A.num;
//         });
//     } catch (error) {
//       console.error("Error filtering data:", error);
//       return [];
//     }
//   }, [summarizedData, search, filters, normalize]);
// };

// const usePagination = (filteredData, itemsPerPage = CONFIG.ITEMS_PER_PAGE) => {
//   const [currentPage, setCurrentPage] = useState(0);

//   const pageCount = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
//   const displayedData = filteredData.slice(
//     currentPage * itemsPerPage,
//     currentPage * itemsPerPage + itemsPerPage
//   );

//   const totalData = useMemo(() => {
//     return displayedData.reduce(
//       (acc, item) => {
//         acc.TotalQty += Number(item.TotalQty || 0);
//         acc.ChallanQTY += Number(item.ChallanQTY || 0);
//         acc.BalanceQty += Number(item.BalanceQty || 0);
//         acc.TotalValue += Number(item.TotalValue || 0);
//         acc.ChallanValue += Number(item.ChallanValue || 0);
//         acc.BalanceValue += Number(item.BalanceValue || 0);
//         acc.itemCount += 1;
//         return acc;
//       },
//       {
//         TotalQty: 0,
//         ChallanQTY: 0,
//         BalanceQty: 0,
//         TotalValue: 0,
//         ChallanValue: 0,
//         BalanceValue: 0,
//         itemCount: 0,
//       }
//     );
//   }, [displayedData]);

//   const grandTotal = useMemo(() => {
//     return filteredData.reduce(
//       (acc, item) => {
//         acc.TotalQty += Number(item.TotalQty || 0);
//         acc.ChallanQTY += Number(item.ChallanQTY || 0);
//         acc.BalanceQty += Number(item.BalanceQty || 0);
//         acc.TotalValue += Number(item.TotalValue || 0);
//         acc.ChallanValue += Number(item.ChallanValue || 0);
//         acc.BalanceValue += Number(item.BalanceValue || 0);
//         return acc;
//       },
//       {
//         TotalQty: 0,
//         ChallanQTY: 0,
//         BalanceQty: 0,
//         TotalValue: 0,
//         ChallanValue: 0,
//         BalanceValue: 0,
//       }
//     );
//   }, [filteredData]);

//   useEffect(() => {
//     setCurrentPage(0);
//   }, [filteredData.length]);

//   return { 
//     currentPage, 
//     setCurrentPage, 
//     pageCount, 
//     displayedData, 
//     totalData, 
//     grandTotal,
//     totalItems: filteredData.length 
//   };
// };

// // ============================================================
// // ADVANCED UI COMPONENTS
// // ============================================================

// // 1. ANALYTICS DASHBOARD
// const AnalyticsDashboard = React.memo(({ data, grandTotal }) => {
//   const metrics = useMemo(() => {
//     const totalOrders = data.length;
//     const totalValue = data.reduce((sum, d) => sum + Number(d.TotalValue || 0), 0);
//     const avgOrderValue = totalOrders > 0 ? totalValue / totalOrders : 0;
//     const completedOrders = data.filter(d => parseFloat(d.completionRate) === 100).length;
//     const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
    
//     const customerMap = new Map();
//     data.forEach(d => {
//       customerMap.set(d.CustomerName, (customerMap.get(d.CustomerName) || 0) + Number(d.TotalValue));
//     });
//     const topCustomer = [...customerMap.entries()].sort((a, b) => b[1] - a[1])[0];

//     const sectionMap = new Map();
//     data.forEach(d => {
//       sectionMap.set(d.Section, (sectionMap.get(d.Section) || 0) + Number(d.TotalQty));
//     });
//     const topSection = [...sectionMap.entries()].sort((a, b) => b[1] - a[1])[0];

//     return { totalOrders, totalValue, avgOrderValue, completionRate, topCustomer, topSection };
//   }, [data]);

//   return (
//     <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
//       <div className="stat bg-base-100 rounded-lg shadow-sm p-3 border-l-4 border-blue-500">
//         <div className="stat-title text-xs text-gray-500">Total Orders</div>
//         <div className="stat-value text-lg font-bold text-blue-600">{metrics.totalOrders}</div>
//         <div className="stat-desc text-xs">Active orders</div>
//       </div>
//       <div className="stat bg-base-100 rounded-lg shadow-sm p-3 border-l-4 border-green-500">
//         <div className="stat-title text-xs text-gray-500">Total Value</div>
//         <div className="stat-value text-lg font-bold text-green-600">${metrics.totalValue.toFixed(2)}</div>
//         <div className="stat-desc text-xs">Overall order value</div>
//       </div>
//       <div className="stat bg-base-100 rounded-lg shadow-sm p-3 border-l-4 border-purple-500">
//         <div className="stat-title text-xs text-gray-500">Avg Order Value</div>
//         <div className="stat-value text-lg font-bold text-purple-600">${metrics.avgOrderValue.toFixed(2)}</div>
//         <div className="stat-desc text-xs">Per order average</div>
//       </div>
//       <div className="stat bg-base-100 rounded-lg shadow-sm p-3 border-l-4 border-orange-500">
//         <div className="stat-title text-xs text-gray-500">Completion Rate</div>
//         <div className="stat-value text-lg font-bold text-orange-600">{metrics.completionRate.toFixed(1)}%</div>
//         <div className="stat-desc text-xs">{metrics.completedOrders} orders completed</div>
//       </div>
//       {metrics.topCustomer && (
//         <div className="stat bg-base-100 rounded-lg shadow-sm p-3 border-l-4 border-indigo-500">
//           <div className="stat-title text-xs text-gray-500">Top Customer</div>
//           <div className="stat-value text-sm font-bold text-indigo-600 truncate">{metrics.topCustomer[0]}</div>
//           <div className="stat-desc text-xs">${metrics.topCustomer[1].toFixed(2)} value</div>
//         </div>
//       )}
//       {metrics.topSection && (
//         <div className="stat bg-base-100 rounded-lg shadow-sm p-3 border-l-4 border-pink-500">
//           <div className="stat-title text-xs text-gray-500">Top Section</div>
//           <div className="stat-value text-sm font-bold text-pink-600 truncate">{metrics.topSection[0]}</div>
//           <div className="stat-desc text-xs">{metrics.topSection[1].toFixed(0)} units</div>
//         </div>
//       )}
//     </div>
//   );
// });

// AnalyticsDashboard.displayName = "AnalyticsDashboard";

// // 2. SMART SEARCH WITH AUTOCOMPLETE
// const SmartSearch = React.memo(({ data, onSearch, onClear }) => {
//   const [query, setQuery] = useState('');
//   const [suggestions, setSuggestions] = useState([]);
//   const [showSuggestions, setShowSuggestions] = useState(false);
//   const [recentSearches, setRecentSearches] = useLocalStorage('recentSearches', []);

//   useEffect(() => {
//     if (query.length > 1) {
//       const matches = data
//         .filter(item => 
//           item.WorkOrderNo?.toLowerCase().includes(query.toLowerCase()) ||
//           item.CustomerName?.toLowerCase().includes(query.toLowerCase()) ||
//           item.PINO?.toLowerCase().includes(query.toLowerCase()) ||
//           item.Buyer?.toLowerCase().includes(query.toLowerCase())
//         )
//         .slice(0, 8)
//         .map(item => ({
//           label: `${item.WorkOrderNo} - ${item.CustomerName}`,
//           value: item.WorkOrderNo,
//           type: 'order'
//         }));

//       // Add recent searches
//       const recentMatches = recentSearches
//         .filter(s => s.toLowerCase().includes(query.toLowerCase()))
//         .map(s => ({ label: `🔍 ${s}`, value: s, type: 'search' }));

//       setSuggestions([...recentMatches, ...matches]);
//       setShowSuggestions(true);
//     } else {
//       setShowSuggestions(false);
//     }
//   }, [query, data, recentSearches]);

//   const handleSearch = (value) => {
//     setQuery(value);
//     onSearch(value);
//     setShowSuggestions(false);
//     if (value && !recentSearches.includes(value)) {
//       setRecentSearches(prev => [value, ...prev].slice(0, 10));
//     }
//   };

//   return (
//     <div className="relative flex-1 min-w-[200px]">
//       <div className="relative">
//         <input
//           type="text"
//           placeholder="Smart Search (Order, Customer, PI, Buyer)..."
//           className="input input-bordered w-full pl-4 pr-24"
//           value={query}
//           onChange={(e) => setQuery(e.target.value)}
//           onFocus={() => query.length > 1 && setShowSuggestions(true)}
//           onKeyDown={(e) => {
//             if (e.key === 'Enter') handleSearch(query);
//             if (e.key === 'Escape') { setShowSuggestions(false); setQuery(''); onClear(); }
//           }}
//         />
//         <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex gap-1">
//           {query && (
//             <button
//               className="btn btn-ghost btn-xs"
//               onClick={() => { setQuery(''); onClear(); setShowSuggestions(false); }}
//             >
//               ✕
//             </button>
//           )}
//           <button
//             className="btn btn-primary btn-xs text-white"
//             onClick={() => handleSearch(query)}
//           >
//             Search
//           </button>
//         </div>
//       </div>
      
//       {showSuggestions && suggestions.length > 0 && (
//         <div className="absolute w-full bg-white shadow-xl rounded-lg mt-1 z-50 border border-gray-200">
//           {suggestions.map((suggestion, index) => (
//             <div
//               key={index}
//               className="px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors flex items-center justify-between border-b last:border-b-0"
//               onClick={() => {
//                 if (suggestion.type === 'search') {
//                   handleSearch(suggestion.value);
//                 } else {
//                   handleSearch(suggestion.value);
//                 }
//               }}
//             >
//               <span className="text-sm">{suggestion.label}</span>
//               {suggestion.type === 'order' && (
//                 <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Order</span>
//               )}
//               {suggestion.type === 'search' && (
//                 <span className="text-xs text-blue-400">Recent</span>
//               )}
//             </div>
//           ))}
//           {recentSearches.length > 0 && (
//             <div className="px-4 py-2 text-xs text-gray-400 border-t">
//               <button 
//                 className="hover:text-red-500"
//                 onClick={() => { setRecentSearches([]); toast.info('Recent searches cleared'); }}
//               >
//                 Clear Recent Searches
//               </button>
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// });

// SmartSearch.displayName = "SmartSearch";

// // 3. BULK OPERATIONS
// const BulkOperations = React.memo(({ selectedRows, data, onBulkAction }) => {
//   const [isOpen, setIsOpen] = useState(false);

//   if (selectedRows.length === 0) return null;

//   return (
//     <div className="flex items-center gap-2">
//       <div className="bg-blue-50 px-3 py-1 rounded-lg flex items-center gap-2">
//         <span className="text-sm font-medium text-blue-700">
//           {selectedRows.length} selected
//         </span>
//         <div className="relative">
//           <button
//             className="btn btn-ghost btn-xs gap-1"
//             onClick={() => setIsOpen(!isOpen)}
//           >
//             Actions ▾
//           </button>
//           {isOpen && (
//             <div className="absolute right-0 mt-1 bg-white shadow-xl rounded-lg p-2 min-w-[200px] z-50 border border-gray-200">
//               <button 
//                 className="btn btn-ghost btn-xs w-full text-left gap-2 hover:bg-blue-50"
//                 onClick={() => { onBulkAction('export', selectedRows); setIsOpen(false); }}
//               >
//                 📊 Export Selected
//               </button>
//               <button 
//                 className="btn btn-ghost btn-xs w-full text-left gap-2 hover:bg-blue-50"
//                 onClick={() => { onBulkAction('copy', selectedRows); setIsOpen(false); }}
//               >
//                 📋 Copy to Clipboard
//               </button>
//               <button 
//                 className="btn btn-ghost btn-xs w-full text-left gap-2 hover:bg-blue-50"
//                 onClick={() => { onBulkAction('analyze', selectedRows); setIsOpen(false); }}
//               >
//                 📈 Analyze Selected
//               </button>
//               <div className="divider my-1"></div>
//               <button 
//                 className="btn btn-ghost btn-xs w-full text-left gap-2 text-red-600 hover:bg-red-50"
//                 onClick={() => { 
//                   if (window.confirm(`Are you sure you want to clear ${selectedRows.length} items?`)) {
//                     onBulkAction('clear', selectedRows);
//                   }
//                   setIsOpen(false);
//                 }}
//               >
//                 🗑️ Clear Selection
//               </button>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// });

// BulkOperations.displayName = "BulkOperations";

// // 4. EXPORT OPTIONS
// const ExportOptions = React.memo(({ onExport, totalItems, disabled }) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const [format, setFormat] = useState('excel');
//   const [includeSummary, setIncludeSummary] = useState(true);
//   const [emailReport, setEmailReport] = useState(false);

//   const handleExport = () => {
//     onExport({ format, includeSummary, emailReport });
//     setIsOpen(false);
//   };

//   return (
//     <div className="relative">
//       <button
//         className="btn btn-success btn-sm gap-2 text-white"
//         onClick={() => setIsOpen(!isOpen)}
//         disabled={disabled}
//       >
//         <span>⬇</span>
//         Export
//         <span>▾</span>
//       </button>

//       {isOpen && (
//         <div className="absolute right-0 mt-2 bg-white shadow-xl rounded-lg p-4 w-64 z-50 border border-gray-200">
//           <h4 className="font-semibold text-sm mb-3">Export Options</h4>
          
//           <div className="space-y-2">
//             <div className="flex items-center gap-2">
//               <input
//                 type="radio"
//                 name="format"
//                 value="excel"
//                 checked={format === 'excel'}
//                 onChange={() => setFormat('excel')}
//                 className="radio radio-sm"
//               />
//               <span className="text-sm">Excel (.xlsx)</span>
//             </div>
//             <div className="flex items-center gap-2">
//               <input
//                 type="radio"
//                 name="format"
//                 value="csv"
//                 checked={format === 'csv'}
//                 onChange={() => setFormat('csv')}
//                 className="radio radio-sm"
//               />
//               <span className="text-sm">CSV (.csv)</span>
//             </div>
//             <div className="flex items-center gap-2">
//               <input
//                 type="radio"
//                 name="format"
//                 value="json"
//                 checked={format === 'json'}
//                 onChange={() => setFormat('json')}
//                 className="radio radio-sm"
//               />
//               <span className="text-sm">JSON (.json)</span>
//             </div>
            
//             <div className="divider my-1"></div>
            
//             <label className="flex items-center gap-2 cursor-pointer">
//               <input
//                 type="checkbox"
//                 checked={includeSummary}
//                 onChange={() => setIncludeSummary(!includeSummary)}
//                 className="checkbox checkbox-sm"
//               />
//               <span className="text-sm">Include Summary</span>
//             </label>
            
//             <label className="flex items-center gap-2 cursor-pointer">
//               <input
//                 type="checkbox"
//                 checked={emailReport}
//                 onChange={() => setEmailReport(!emailReport)}
//                 className="checkbox checkbox-sm"
//               />
//               <span className="text-sm">Email Report</span>
//             </label>
//           </div>

//           <div className="mt-3 flex gap-2">
//             <button
//               className="btn btn-primary btn-sm flex-1 text-white"
//               onClick={handleExport}
//             >
//               Export Now
//             </button>
//             <button
//               className="btn btn-ghost btn-sm"
//               onClick={() => setIsOpen(false)}
//             >
//               Cancel
//             </button>
//           </div>

//           <div className="mt-2 text-xs text-gray-400 text-center">
//             {totalItems} items to export
//           </div>
//         </div>
//       )}
//     </div>
//   );
// });

// ExportOptions.displayName = "ExportOptions";

// // 5. NOTIFICATION CENTER
// const NotificationCenter = React.memo(({ data }) => {
//   const [notifications, setNotifications] = useState([]);
//   const [isOpen, setIsOpen] = useState(false);
//   const [dismissed, setDismissed] = useState(new Set());

//   useEffect(() => {
//     const alerts = [];
    
//     const zeroBalance = data.filter(d => d.BalanceQty === 0 && d.ChallanQTY > 0);
//     if (zeroBalance.length > 0) {
//       alerts.push({
//         id: 'complete',
//         type: 'success',
//         icon: '✅',
//         message: `${zeroBalance.length} orders fully completed`,
//         details: zeroBalance.slice(0, 3).map(d => d.WorkOrderNo).join(', '),
//         timestamp: new Date()
//       });
//     }

//     const highPending = data.filter(d => Number(d.BalanceValue) > 10000);
//     if (highPending.length > 0) {
//       alerts.push({
//         id: 'high-pending',
//         type: 'warning',
//         icon: '⚠️',
//         message: `${highPending.length} orders with high pending value (>$10,000)`,
//         details: highPending.slice(0, 3).map(d => `${d.WorkOrderNo} ($${d.BalanceValue})`).join(', '),
//         timestamp: new Date()
//       });
//     }

//     const noChallan = data.filter(d => d.ChallanNo.length === 0);
//     if (noChallan.length > 0) {
//       alerts.push({
//         id: 'no-challan',
//         type: 'error',
//         icon: '🔴',
//         message: `${noChallan.length} orders with no challan`,
//         details: noChallan.slice(0, 3).map(d => d.WorkOrderNo).join(', '),
//         timestamp: new Date()
//       });
//     }

//     const highBalance = data.filter(d => Number(d.BalanceQty) > 1000);
//     if (highBalance.length > 0) {
//       alerts.push({
//         id: 'high-balance',
//         type: 'info',
//         icon: 'ℹ️',
//         message: `${highBalance.length} orders with high balance (>1000 units)`,
//         details: highBalance.slice(0, 3).map(d => `${d.WorkOrderNo} (${d.BalanceQty})`).join(', '),
//         timestamp: new Date()
//       });
//     }

//     setNotifications(alerts);
//   }, [data]);

//   const dismissNotification = (id) => {
//     setDismissed(prev => new Set([...prev, id]));
//   };

//   const visibleNotifications = notifications.filter(n => !dismissed.has(n.id));

//   if (visibleNotifications.length === 0) return null;

//   return (
//     <div className="relative">
//       <button
//         className="btn btn-ghost btn-sm gap-1 relative"
//         onClick={() => setIsOpen(!isOpen)}
//       >
//         <span>🔔</span>
//         <span className="badge badge-error badge-sm absolute -top-1 -right-1">
//           {visibleNotifications.length}
//         </span>
//       </button>

//       {isOpen && (
//         <div className="absolute right-0 mt-2 w-96 bg-white shadow-xl rounded-lg p-3 z-50 border border-gray-200 max-h-96 overflow-y-auto">
//           <div className="flex justify-between items-center mb-2">
//             <h4 className="font-semibold text-sm">Notifications</h4>
//             <button
//               className="text-xs text-gray-400 hover:text-gray-600"
//               onClick={() => setDismissed(new Set(notifications.map(n => n.id)))}
//             >
//               Dismiss All
//             </button>
//           </div>
//           <div className="space-y-2">
//             {visibleNotifications.map((notif) => (
//               <div
//                 key={notif.id}
//                 className={`p-3 rounded-lg flex items-start gap-2 ${
//                   notif.type === 'success' ? 'bg-green-50 border border-green-200' :
//                   notif.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
//                   notif.type === 'error' ? 'bg-red-50 border border-red-200' :
//                   'bg-blue-50 border border-blue-200'
//                 }`}
//               >
//                 <span className="text-lg">{notif.icon}</span>
//                 <div className="flex-1">
//                   <div className="text-sm font-medium">{notif.message}</div>
//                   {notif.details && (
//                     <div className="text-xs opacity-70 mt-0.5">{notif.details}</div>
//                   )}
//                   <div className="text-[10px] opacity-50 mt-1">
//                     {new Date(notif.timestamp).toLocaleTimeString()}
//                   </div>
//                 </div>
//                 <button
//                   className="text-xs opacity-50 hover:opacity-100"
//                   onClick={() => dismissNotification(notif.id)}
//                 >
//                   ✕
//                 </button>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// });

// NotificationCenter.displayName = "NotificationCenter";

// // 6. DATA HISTORY
// const DataHistory = React.memo(() => {
//   const [history, setHistory] = useLocalStorage('dataHistory', []);
//   const [isOpen, setIsOpen] = useState(false);

//   const clearHistory = () => {
//     setHistory([]);
//     toast.info('History cleared');
//   };

//   return (
//     <div className="relative">
//       <button
//         className="btn btn-ghost btn-sm gap-1"
//         onClick={() => setIsOpen(!isOpen)}
//       >
//         <span>📜</span>
//         History
//         {history.length > 0 && (
//           <span className="badge badge-sm">{history.length}</span>
//         )}
//       </button>

//       {isOpen && (
//         <div className="absolute right-0 mt-2 w-80 bg-white shadow-xl rounded-lg p-3 z-50 border border-gray-200 max-h-80 overflow-y-auto">
//           <div className="flex justify-between items-center mb-2">
//             <h4 className="font-semibold text-sm">Recent Actions</h4>
//             <button
//               className="text-xs text-red-500 hover:text-red-700"
//               onClick={clearHistory}
//             >
//               Clear All
//             </button>
//           </div>
//           {history.length === 0 ? (
//             <div className="text-center text-gray-400 text-sm py-4">No history yet</div>
//           ) : (
//             <div className="space-y-2">
//               {history.slice(0, 20).map((entry, index) => (
//                 <div key={index} className="text-xs border-b pb-2 last:border-b-0">
//                   <div className="flex justify-between">
//                     <span className="font-medium">{entry.action}</span>
//                     <span className="text-gray-400">
//                       {new Date(entry.timestamp).toLocaleTimeString()}
//                     </span>
//                   </div>
//                   <div className="text-gray-500 truncate">
//                     {entry.data && typeof entry.data === 'string' 
//                       ? entry.data 
//                       : JSON.stringify(entry.data || '').substring(0, 50)}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// });

// DataHistory.displayName = "DataHistory";

// // 7. PROFESSIONAL FILTER DROPDOWN
// const ProfessionalFilterDropdown = React.memo(({
//   label,
//   open,
//   setOpen,
//   items,
//   selectedItems,
//   onToggle,
//   searchValue,
//   setSearchValue,
//   ref,
//   placeholder = "Search...",
//   color = "blue",
//   showCount = true,
// }) => {
//   const [selectAll, setSelectAll] = useState(false);

//   useEffect(() => {
//     setSelectAll(selectedItems.length === items.length && items.length > 0);
//   }, [selectedItems, items]);

//   const handleSelectAll = useCallback(() => {
//     if (selectAll) {
//       onToggle([]);
//     } else {
//       onToggle(items);
//     }
//   }, [selectAll, items, onToggle]);

//   return (
//     <div className="relative" ref={ref}>
//       <button
//         className={`btn btn-outline btn-sm gap-2 transition-all duration-200 hover:shadow-md ${
//           selectedItems.length > 0 ? `border-${color}-500 bg-${color}-50` : ''
//         }`}
//         onClick={() => setOpen(!open)}
//         aria-expanded={open}
//         aria-haspopup="listbox"
//       >
//         <span>{label}</span>
//         {showCount && selectedItems.length > 0 && (
//           <span className={`badge badge-${color} badge-sm`}>
//             {selectedItems.length}
//           </span>
//         )}
//         <span>{open ? '▲' : '▼'}</span>
//       </button>

//       {open && (
//         <div className="absolute bg-base-100 shadow-xl p-3 rounded-lg w-72 max-h-80 overflow-y-auto z-50 mt-2 border border-gray-200">
//           <div className="flex justify-between items-center mb-3">
//             <span className="font-semibold text-sm">{label} Filter</span>
//             <div className="flex gap-2">
//               <button
//                 className="text-xs text-blue-600 hover:text-blue-800 font-medium"
//                 onClick={handleSelectAll}
//               >
//                 {selectAll ? 'Deselect All' : 'Select All'}
//               </button>
//               <button
//                 className="text-xs text-red-600 hover:text-red-800 font-medium"
//                 onClick={() => onToggle([])}
//               >
//                 Clear
//               </button>
//             </div>
//           </div>

//           <div className="relative mb-3">
//             <input
//               type="text"
//               placeholder={placeholder}
//               className="input input-sm w-full pl-8"
//               value={searchValue}
//               onChange={(e) => setSearchValue(e.target.value)}
//             />
//           </div>

//           <div className="space-y-1">
//             {items.length === 0 ? (
//               <div className="text-gray-400 text-sm text-center py-4">No items found</div>
//             ) : (
//               items.map((item) => (
//                 <label
//                   key={item}
//                   className="flex gap-2 py-1.5 px-2 items-center hover:bg-gray-100 rounded cursor-pointer transition-colors"
//                 >
//                   <input
//                     type="checkbox"
//                     checked={selectedItems.includes(item)}
//                     onChange={() => onToggle(item)}
//                     className="checkbox checkbox-sm"
//                   />
//                   <span className="text-sm select-none truncate">{item}</span>
//                 </label>
//               ))
//             )}
//           </div>

//           <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
//             {selectedItems.length} selected
//           </div>
//         </div>
//       )}
//     </div>
//   );
// });

// ProfessionalFilterDropdown.displayName = "ProfessionalFilterDropdown";

// // 8. ENHANCED CHALLAN CELL
// const EnhancedChallanCell = React.memo(({ challanNo }) => {
//   const [expanded, setExpanded] = useState(false);
//   const displayedChallans = expanded ? challanNo : challanNo.slice(0, CONFIG.MAX_CHALLAN_DISPLAY);
//   const hasMore = challanNo.length > CONFIG.MAX_CHALLAN_DISPLAY;

//   const handleCopy = useCallback(() => {
//     const text = challanNo.map((ch) => `${ch.challanNo} (${ch.status})`).join("\n");
//     navigator.clipboard.writeText(text).then(() => {
//       toast.success("Challans copied!");
//     }).catch(() => {
//       toast.error("Failed to copy");
//     });
//   }, [challanNo]);

//   if (!challanNo || challanNo.length === 0) {
//     return (
//       <div className="text-gray-400 text-sm text-center py-2">
//         <span className="opacity-50">No Challan</span>
//       </div>
//     );
//   }

//   return (
//     <div className="border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
//       <div className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-t-lg border-b">
//         <span className="text-xs font-semibold text-gray-600">
//           📋 Challans ({challanNo.length})
//         </span>
//         <div className="flex gap-1">
//           {hasMore && (
//             <button
//               className="text-xs text-blue-600 hover:text-blue-800 px-2 py-0.5 rounded hover:bg-blue-50 transition-colors"
//               onClick={() => setExpanded(!expanded)}
//             >
//               {expanded ? 'Show Less' : `+${challanNo.length - CONFIG.MAX_CHALLAN_DISPLAY} more`}
//             </button>
//           )}
//           <button
//             className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-0.5 rounded transition-colors flex items-center gap-1"
//             onClick={handleCopy}
//           >
//             Copy
//           </button>
//         </div>
//       </div>
//       <div 
//         className="overflow-y-auto p-2 space-y-1"
//         style={{ maxHeight: expanded ? "200px" : "120px" }}
//       >
//         {displayedChallans.map((ch, i) => (
//           <div
//             key={i}
//             className={`flex justify-between items-center text-xs px-2 py-1 rounded transition-colors ${
//               ch.status === "Challan Received"
//                 ? "bg-green-50 text-green-700 hover:bg-green-100"
//                 : ch.status === "Send to Gate"
//                 ? "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
//                 : ch.status === "Delivered"
//                 ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
//                 : ch.status === "Gate Out"
//                 ? "bg-red-50 text-red-700 hover:bg-red-100"
//                 : "bg-gray-50 text-gray-600 hover:bg-gray-100"
//             }`}
//           >
//             <span className="font-medium">
//               {i + 1}. {ch.challanNo}
//             </span>
//             <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
//               ch.status === "Challan Received"
//                 ? "bg-green-200 text-green-800"
//                 : ch.status === "Send to Gate"
//                 ? "bg-yellow-200 text-yellow-800"
//                 : ch.status === "Delivered"
//                 ? "bg-blue-200 text-blue-800"
//                 : ch.status === "Gate Out"
//                 ? "bg-red-200 text-red-800"
//                 : "bg-gray-200 text-gray-800"
//             }`}>
//               {ch.status}
//             </span>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// });

// EnhancedChallanCell.displayName = "EnhancedChallanCell";

// // 9. PROFESSIONAL SUMMARY TABLE
// const ProfessionalSummaryTable = React.memo(({ 
//   data, 
//   columns, 
//   totalData, 
//   onRowClick,
//   onRowSelect,
//   selectedRows,
//   loading 
// }) => {
//   const formatDate = useCallback((dateStr) => {
//     if (!dateStr) return "-";
//     try {
//       return new Date(dateStr).toLocaleDateString(CONFIG.DATE_FORMAT, {
//         day: '2-digit',
//         month: 'short',
//         year: 'numeric'
//       });
//     } catch {
//       return "-";
//     }
//   }, []);

//   const formatCurrency = useCallback((value) => {
//     return `${CONFIG.CURRENCY_SYMBOL}${Number(value).toFixed(2)}`;
//   }, []);

//   const getStatusBadge = useCallback((item) => {
//     const completion = parseFloat(item.completionRate);
//     if (completion === 100) {
//       return <span className="badge badge-success badge-sm">Complete</span>;
//     } else if (completion > 50) {
//       return <span className="badge badge-warning badge-sm">In Progress</span>;
//     } else {
//       return <span className="badge badge-error badge-sm">Pending</span>;
//     }
//   }, []);

//   const handleRowCheck = (item, checked) => {
//     if (checked) {
//       onRowSelect([...selectedRows, item.WorkOrderNo]);
//     } else {
//       onRowSelect(selectedRows.filter(id => id !== item.WorkOrderNo));
//     }
//   };

//   const handleSelectAll = (checked) => {
//     if (checked) {
//       onRowSelect(data.map(d => d.WorkOrderNo));
//     } else {
//       onRowSelect([]);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-64">
//         <div className="loading loading-spinner loading-lg text-primary"></div>
//       </div>
//     );
//   }

//   if (data.length === 0) {
//     return (
//       <div className="text-center py-12">
//         <div className="text-gray-400 text-lg">No data to display</div>
//         <div className="text-gray-300 text-sm mt-2">Try adjusting your filters</div>
//       </div>
//     );
//   }

//   const totalColSpan = 10 + 
//     (columns.includes("PI") ? 1 : 0) +
//     (columns.includes("LC") ? 1 : 0) +
//     (columns.includes("Invoice") ? 1 : 0);

//   return (
//     <div className="max-h-[650px] overflow-y-auto border rounded-xl shadow-sm">
//       <table className="table table-sm table-zebra min-w-[1400px]">
//         <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white sticky top-0 z-10">
//           <tr className="text-center text-xs uppercase tracking-wider">
//             <th className="py-3 w-10">
//               <input
//                 type="checkbox"
//                 className="checkbox checkbox-xs"
//                 checked={data.length > 0 && selectedRows.length === data.length}
//                 onChange={(e) => handleSelectAll(e.target.checked)}
//               />
//             </th>
//             {columns.includes("Order") && <th className="py-3">Order</th>}
//             <th className="py-3">Date</th>
//             <th className="py-3">Customer</th>
//             <th className="py-3">Delivery</th>
//             <th className="py-3">Buyer</th>
//             {columns.includes("PI") && <th className="py-3">PI</th>}
//             {columns.includes("LC") && <th className="py-3">LC No</th>}
//             {columns.includes("Invoice") && <th className="py-3">Invoice</th>}
//             <th className="py-3">Section</th>
//             <th className="py-3 text-right">Order Qty</th>
//             <th className="py-3 text-right">Challan Qty</th>
//             <th className="py-3 text-right">Balance Qty</th>
//             <th className="py-3 text-right">Order Value</th>
//             <th className="py-3 text-right">Challan Value</th>
//             <th className="py-3 text-right">Balance Value</th>
//             <th className="py-3 text-center">Challan</th>
//             <th className="py-3 text-center">Status</th>
//           </tr>
//         </thead>

//         <tbody>
//           {data.map((item) => (
//             <tr 
//               key={`${item.WorkOrderNo}-${item.PINO}-${item.CustomerName}`}
//               className={`hover:bg-blue-50 transition-colors cursor-pointer ${
//                 selectedRows.includes(item.WorkOrderNo) ? 'bg-blue-100' : ''
//               }`}
//               onClick={() => onRowClick?.(item)}
//             >
//               <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
//                 <input
//                   type="checkbox"
//                   className="checkbox checkbox-xs"
//                   checked={selectedRows.includes(item.WorkOrderNo)}
//                   onChange={(e) => handleRowCheck(item, e.target.checked)}
//                 />
//               </td>
//               {columns.includes("Order") && (
//                 <td className="px-3 py-2 whitespace-nowrap font-medium">
//                   {item.WorkOrderNo}
//                 </td>
//               )}
//               <td className="px-3 py-2 whitespace-nowrap text-sm">
//                 {formatDate(item.OrderReceiveDate)}
//               </td>
//               <td className="px-3 py-2 whitespace-nowrap font-medium">
//                 {item.CustomerName}
//               </td>
//               <td className="px-3 py-2 whitespace-nowrap">{item.DeliverName}</td>
//               <td className="px-3 py-2 whitespace-nowrap">{item.Buyer}</td>
//               {columns.includes("PI") && (
//                 <td className="px-3 py-2 whitespace-nowrap text-sm font-mono">
//                   {item.PINO}
//                 </td>
//               )}
//               {columns.includes("LC") && (
//                 <td className="px-3 py-2 whitespace-nowrap text-sm font-mono">
//                   {(item.LCList || []).map((l) => l.lcNo).join(", ") || "-"}
//                 </td>
//               )}
//               {columns.includes("Invoice") && (
//                 <td className="px-3 py-2 whitespace-nowrap text-sm font-mono">
//                   {(item.InvoiceList || []).map((i) => i.invoiceNo).join(", ") || "-"}
//                 </td>
//               )}
//               <td className="px-3 py-2 whitespace-nowrap text-sm">{item.Section}</td>
//               <td className="px-3 py-2 whitespace-nowrap text-right font-medium">
//                 {item.TotalQty.toFixed(2)}
//               </td>
//               <td className="px-3 py-2 whitespace-nowrap text-right text-green-600 font-medium">
//                 {item.ChallanQTY.toFixed(2)}
//               </td>
//               <td className="px-3 py-2 whitespace-nowrap text-right text-red-600 font-medium">
//                 {item.BalanceQty.toFixed(2)}
//               </td>
//               <td className="px-3 py-2 whitespace-nowrap text-right text-blue-600 font-semibold">
//                 {formatCurrency(item.TotalValue)}
//               </td>
//               <td className="px-3 py-2 whitespace-nowrap text-right text-green-600 font-semibold">
//                 {formatCurrency(item.ChallanValue)}
//               </td>
//               <td className="px-3 py-2 whitespace-nowrap text-right text-red-600 font-semibold">
//                 {formatCurrency(item.BalanceValue)}
//               </td>
//               <td className="px-3 py-2 text-left min-w-[200px]">
//                 <EnhancedChallanCell challanNo={item.ChallanNo} />
//               </td>
//               <td className="px-3 py-2 text-center">
//                 {getStatusBadge(item)}
//               </td>
//             </tr>
//           ))}
//         </tbody>

//         <tfoot className="sticky bottom-0 bg-blue-100 z-10 border-t-2 border-blue-300">
//           <tr className="font-bold text-sm">
//             <td className="text-right pr-4" colSpan={totalColSpan}>
//               Totals:
//             </td>
//             <td className="text-right">{totalData.TotalQty.toFixed(2)}</td>
//             <td className="text-right text-green-700">{totalData.ChallanQTY.toFixed(2)}</td>
//             <td className="text-right text-red-700">{totalData.BalanceQty.toFixed(2)}</td>
//             <td className="text-right text-blue-700">{formatCurrency(totalData.TotalValue)}</td>
//             <td className="text-right text-green-700">{formatCurrency(totalData.ChallanValue)}</td>
//             <td className="text-right text-red-700">{formatCurrency(totalData.BalanceValue)}</td>
//             <td></td>
//             <td></td>
//           </tr>
//         </tfoot>
//       </table>
//     </div>
//   );
// });

// ProfessionalSummaryTable.displayName = "ProfessionalSummaryTable";

// // 10. ADVANCED FILTERS PANEL
// const AdvancedFiltersPanel = React.memo(({ 
//   filters, 
//   onFilterChange,
//   onExport,
//   onReset,
//   totalItems,
//   loading,
//   sections 
// }) => {
//   const [isExpanded, setIsExpanded] = useState(false);

//   return (
//     <div className="bg-base-200 rounded-xl p-4 shadow-sm">
//       <div className="flex flex-wrap justify-between items-center gap-2">
//         <div className="flex items-center gap-4">
//           <button
//             className="btn btn-ghost btn-sm gap-2"
//             onClick={() => setIsExpanded(!isExpanded)}
//           >
//             <span>🔍</span>
//             Advanced Filters
//             <span>{isExpanded ? '▲' : '▼'}</span>
//           </button>
//           <span className="text-sm text-gray-500">
//             {loading ? 'Loading...' : `${totalItems} items found`}
//           </span>
//         </div>
//         <div className="flex gap-2 flex-wrap">
//           <button
//             className="btn btn-ghost btn-sm"
//             onClick={onReset}
//             disabled={loading}
//           >
//             Reset Filters
//           </button>
//         </div>
//       </div>

//       {isExpanded && (
//         <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
//           <div className="form-control">
//             <label className="label">
//               <span className="label-text">Date Range</span>
//             </label>
//             <div className="flex gap-2">
//               <input
//                 type="date"
//                 className="input input-bordered input-sm flex-1"
//                 value={filters.dateRange?.start || ''}
//                 onChange={(e) => onFilterChange('dateRange', { ...filters.dateRange, start: e.target.value })}
//               />
//               <input
//                 type="date"
//                 className="input input-bordered input-sm flex-1"
//                 value={filters.dateRange?.end || ''}
//                 onChange={(e) => onFilterChange('dateRange', { ...filters.dateRange, end: e.target.value })}
//               />
//             </div>
//           </div>

//           <div className="form-control">
//             <label className="label">
//               <span className="label-text">Value Range</span>
//             </label>
//             <div className="flex gap-2">
//               <input
//                 type="number"
//                 className="input input-bordered input-sm flex-1"
//                 placeholder="Min"
//                 value={filters.minValue || ''}
//                 onChange={(e) => onFilterChange('minValue', e.target.value)}
//               />
//               <input
//                 type="number"
//                 className="input input-bordered input-sm flex-1"
//                 placeholder="Max"
//                 value={filters.maxValue || ''}
//                 onChange={(e) => onFilterChange('maxValue', e.target.value)}
//               />
//             </div>
//           </div>

//           <div className="form-control">
//             <label className="label">
//               <span className="label-text">Status</span>
//             </label>
//             <select
//               className="select select-bordered select-sm"
//               value={filters.statusFilter || ''}
//               onChange={(e) => onFilterChange('statusFilter', e.target.value)}
//             >
//               <option value="">All Status</option>
//               <option value="complete">Complete</option>
//               <option value="in-progress">In Progress</option>
//               <option value="pending">Pending</option>
//             </select>
//           </div>

//           <div className="form-control">
//             <label className="label">
//               <span className="label-text">Section</span>
//             </label>
//             <select
//               className="select select-bordered select-sm"
//               value={filters.sectionFilter || ''}
//               onChange={(e) => onFilterChange('sectionFilter', e.target.value)}
//             >
//               <option value="">All Sections</option>
//               {sections.map(section => (
//                 <option key={section} value={section}>{section}</option>
//               ))}
//             </select>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// });

// AdvancedFiltersPanel.displayName = "AdvancedFiltersPanel";

// // 11. COLUMN VISIBILITY MANAGER
// const ColumnVisibilityManager = React.memo(({ columns, visibleColumns, onToggle }) => {
//   const [isOpen, setIsOpen] = useState(false);

//   return (
//     <div className="relative">
//       <button
//         className="btn btn-ghost btn-sm gap-2"
//         onClick={() => setIsOpen(!isOpen)}
//       >
//         <span>⚙️</span>
//         Columns
//         <span>{isOpen ? '▲' : '▼'}</span>
//       </button>

//       {isOpen && (
//         <div className="absolute right-0 mt-2 bg-base-100 shadow-xl p-3 rounded-lg w-56 z-50 border border-gray-200">
//           <div className="font-semibold text-sm mb-2">Toggle Columns</div>
//           <div className="space-y-1">
//             {columns.map((col) => (
//               <label
//                 key={col.id}
//                 className="flex gap-2 py-1 px-2 items-center hover:bg-gray-100 rounded cursor-pointer"
//               >
//                 <input
//                   type="checkbox"
//                   checked={visibleColumns.includes(col.id)}
//                   onChange={() => onToggle(col.id)}
//                   disabled={col.required}
//                   className="checkbox checkbox-sm"
//                 />
//                 <span className="text-sm">{col.label}</span>
//                 {col.required && (
//                   <span className="text-xs text-gray-400 ml-auto">(required)</span>
//                 )}
//               </label>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// });

// ColumnVisibilityManager.displayName = "ColumnVisibilityManager";

// // ============================================================
// // MAIN COMPONENT
// // ============================================================

// function BalanceSummary() {
//   const { cndata, loading } = useContext(GetDataContext);
//   const [error, setError] = useState(null);

//   // State management with localStorage persistence
//   const [selectedPI, setSelectedPI] = useLocalStorage('balanceSummary_selectedPI', []);
//   const [selectedOrder, setSelectedOrder] = useLocalStorage('balanceSummary_selectedOrder', []);
//   const [selectedLC, setSelectedLC] = useLocalStorage('balanceSummary_selectedLC', []);
//   const [selectedInvoice, setSelectedInvoice] = useLocalStorage('balanceSummary_selectedInvoice', []);
//   const [selectedColumns, setSelectedColumns] = useLocalStorage('balanceSummary_columns', COLUMN_CONFIG.defaultVisible);
//   const [selectedRows, setSelectedRows] = useLocalStorage('balanceSummary_selectedRows', []);

//   // UI State
//   const [search, setSearch] = useState("");
//   const [piSearch, setPiSearch] = useState("");
//   const [orderSearch, setOrderSearch] = useState("");
//   const [lcSearch, setLcSearch] = useState("");
//   const [invoiceSearch, setInvoiceSearch] = useState("");
//   const [piOpen, setPiOpen] = useState(false);
//   const [orderOpen, setOrderOpen] = useState(false);
//   const [lcOpen, setLcOpen] = useState(false);
//   const [invoiceOpen, setInvoiceOpen] = useState(false);
  
//   // Advanced filters state
//   const [dateRange, setDateRange] = useState({ start: "", end: "" });
//   const [minValue, setMinValue] = useState("");
//   const [maxValue, setMaxValue] = useState("");
//   const [statusFilter, setStatusFilter] = useState("");
//   const [sectionFilter, setSectionFilter] = useState("");

//   // Refs
//   const piRef = useRef(null);
//   const orderRef = useRef(null);
//   const lcRef = useRef(null);
//   const invoiceRef = useRef(null);

//   // Debounced search
//   const debouncedSearch = useDebounce(search);

//   // Data processing
//   const maps = useDataMaps(cndata);
//   const summarizedData = useSummarizedData(cndata, maps);

//   // Get unique sections
//   const uniqueSections = useMemo(() => {
//     return [...new Set(summarizedData.map(d => d.Section).filter(Boolean))];
//   }, [summarizedData]);

//   // Unique values for filters
//   const uniquePI = useMemo(() => {
//     return [...new Set(summarizedData.map((d) => d.PINO || "No PI"))];
//   }, [summarizedData]);

//   const uniqueOrder = useMemo(() => {
//     return [
//       ...new Set(
//         summarizedData.map((d) => String(d.WorkOrderNo).trim()).filter(Boolean)
//       ),
//     ];
//   }, [summarizedData]);

//   const uniqueLC = useMemo(() => {
//     return [
//       ...new Set(
//         summarizedData.flatMap((d) => d.LCList.map((l) => l.lcNo || "No LC"))
//       ),
//     ];
//   }, [summarizedData]);

//   const uniqueInvoice = useMemo(() => {
//     return [
//       ...new Set(
//         summarizedData.flatMap((d) =>
//           d.InvoiceList.map((i) => i.invoiceNo || "No Invoice")
//         )
//       ),
//     ];
//   }, [summarizedData]);

//   // Filtered options
//   const filteredPI = useMemo(
//     () => uniquePI.filter((pi) => pi.toLowerCase().includes(piSearch.toLowerCase())),
//     [uniquePI, piSearch]
//   );

//   const filteredOrder = useMemo(
//     () => uniqueOrder.filter((order) => order.toString().includes(orderSearch)),
//     [uniqueOrder, orderSearch]
//   );

//   const filteredLC = useMemo(
//     () => uniqueLC.filter((lc) => lc.toLowerCase().includes(lcSearch.toLowerCase())),
//     [uniqueLC, lcSearch]
//   );

//   const filteredInvoice = useMemo(
//     () => uniqueInvoice.filter((inv) => inv.toLowerCase().includes(invoiceSearch.toLowerCase())),
//     [uniqueInvoice, invoiceSearch]
//   );

//   // Prepare filters object
//   const filters = useMemo(() => ({
//     selectedPI,
//     selectedOrder,
//     selectedLC,
//     selectedInvoice,
//     dateRange,
//     minValue,
//     maxValue,
//     statusFilter,
//     sectionFilter
//   }), [selectedPI, selectedOrder, selectedLC, selectedInvoice, dateRange, minValue, maxValue, statusFilter, sectionFilter]);

//   // Apply all filters
//   const filteredData = useFilters(
//     summarizedData,
//     filters,
//     debouncedSearch
//   );

//   // Pagination
//   const { 
//     currentPage, 
//     setCurrentPage, 
//     pageCount, 
//     displayedData, 
//     totalData, 
//     grandTotal,
//     totalItems 
//   } = usePagination(filteredData);

//   // Toggle handlers
//   const togglePI = useCallback((value) => {
//     if (Array.isArray(value)) {
//       setSelectedPI(value);
//     } else {
//       setSelectedPI(prev => 
//         prev.includes(value) ? prev.filter(p => p !== value) : [...prev, value]
//       );
//     }
//     setCurrentPage(0);
//   }, [setSelectedPI, setCurrentPage]);

//   const toggleOrder = useCallback((value) => {
//     const val = String(value).trim();
//     if (Array.isArray(value)) {
//       setSelectedOrder(value.map(v => String(v).trim()));
//     } else {
//       setSelectedOrder(prev => 
//         prev.includes(val) ? prev.filter(o => o !== val) : [...prev, val]
//       );
//     }
//     setCurrentPage(0);
//   }, [setSelectedOrder, setCurrentPage]);

//   const toggleLC = useCallback((value) => {
//     if (Array.isArray(value)) {
//       setSelectedLC(value);
//     } else {
//       setSelectedLC(prev => 
//         prev.includes(value) ? prev.filter(x => x !== value) : [...prev, value]
//       );
//     }
//     setCurrentPage(0);
//   }, [setSelectedLC, setCurrentPage]);

//   const toggleInvoice = useCallback((value) => {
//     if (Array.isArray(value)) {
//       setSelectedInvoice(value);
//     } else {
//       setSelectedInvoice(prev => 
//         prev.includes(value) ? prev.filter(x => x !== value) : [...prev, value]
//       );
//     }
//     setCurrentPage(0);
//   }, [setSelectedInvoice, setCurrentPage]);

//   const toggleColumn = useCallback((column) => {
//     setSelectedColumns(prev =>
//       prev.includes(column) ? prev.filter(c => c !== column) : [...prev, column]
//     );
//   }, [setSelectedColumns]);

//   // Reset all filters
//   const resetFilters = useCallback(() => {
//     setSelectedPI([]);
//     setSelectedOrder([]);
//     setSelectedLC([]);
//     setSelectedInvoice([]);
//     setSearch("");
//     setDateRange({ start: "", end: "" });
//     setMinValue("");
//     setMaxValue("");
//     setStatusFilter("");
//     setSectionFilter("");
//     setPiSearch("");
//     setOrderSearch("");
//     setLcSearch("");
//     setInvoiceSearch("");
//     setCurrentPage(0);
//     toast.info("All filters have been reset");
//   }, [setSelectedPI, setSelectedOrder, setSelectedLC, setSelectedInvoice, setCurrentPage]);

//   // Handle filter changes
//   const handleFilterChange = useCallback((key, value) => {
//     const setters = {
//       dateRange: setDateRange,
//       minValue: setMinValue,
//       maxValue: setMaxValue,
//       statusFilter: setStatusFilter,
//       sectionFilter: setSectionFilter
//     };
//     if (setters[key]) {
//       setters[key](value);
//     }
//     setCurrentPage(0);
//   }, [setCurrentPage]);

//   // Click outside handler
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (piRef.current && !piRef.current.contains(event.target)) setPiOpen(false);
//       if (orderRef.current && !orderRef.current.contains(event.target)) setOrderOpen(false);
//       if (lcRef.current && !lcRef.current.contains(event.target)) setLcOpen(false);
//       if (invoiceRef.current && !invoiceRef.current.contains(event.target)) setInvoiceOpen(false);
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   // Keyboard shortcuts
//   useEffect(() => {
//     const handleKeyDown = (e) => {
//       if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
//         e.preventDefault();
//         document.getElementById('global-search')?.focus();
//       }
//       if (e.key === 'Escape') {
//         setSearch('');
//       }
//       if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
//         e.preventDefault();
//         if (displayedData.length > 0) {
//           setSelectedRows(displayedData.map(d => d.WorkOrderNo));
//           toast.info(`Selected ${displayedData.length} items`);
//         }
//       }
//     };

//     document.addEventListener('keydown', handleKeyDown);
//     return () => document.removeEventListener('keydown', handleKeyDown);
//   }, [displayedData, setSelectedRows]);

//   // Auto-refresh
//   useEffect(() => {
//     const interval = setInterval(() => {
//       // Refresh data logic here
//       toast.info("Data refreshed automatically");
//     }, CONFIG.AUTO_REFRESH_INTERVAL);

//     return () => clearInterval(interval);
//   }, []);

//   // ============================================================
//   // ENHANCED EXCEL EXPORT
//   // ============================================================
  
//   const exportToExcel = useCallback((options = {}) => {
//     const { format = 'excel', includeSummary = true } = options;
    
//     try {
//       if (filteredData.length === 0) {
//         toast.warning("No data to export");
//         return;
//       }

//       toast.info(`Preparing export of ${filteredData.length} rows...`);

//       const dataToExport = filteredData;
//       const safeCell = (value) => {
//         const text = String(value ?? "");
//         if (text.length > 32000) {
//           return text.substring(0, 32000) + " ...[TRUNCATED]";
//         }
//         return text;
//       };

//       const wb = XLSX.utils.book_new();

//       // Group data by PI
//       const groupedByPI = {};
//       dataToExport.forEach((item) => {
//         const key = item.PINO || "No PI";
//         if (!groupedByPI[key]) groupedByPI[key] = [];
//         groupedByPI[key].push(item);
//       });

//       let data = [];

//       // Build data array with PI grouping
//       for (const [pi, items] of Object.entries(groupedByPI)) {
//         data.push([`PI: ${pi}`]);
//         data.push([]);

//         data.push([
//           "Order No", "Order Date", "Customer", "Delivery", "PI No",
//           "LC No", "Invoice No", "Section", "Order Qty", "Challan Qty",
//           "Balance Qty", "Order Value", "Challan Value", "Balance Value", "Challan No"
//         ]);

//         items.forEach((item) => {
//           const challans = item.ChallanNo || [];
//           let challanText = challans
//             .map((ch, i) => `${i + 1}. ${ch.challanNo} (${ch.status})`)
//             .join("\n");

//           if (challanText.length > 32767) {
//             challanText = challanText.slice(0, 32000) + "\n...[TRUNCATED]";
//           }

//           data.push([
//             item.WorkOrderNo,
//             item.OrderReceiveDate
//               ? new Date(item.OrderReceiveDate).toLocaleDateString(CONFIG.DATE_FORMAT)
//               : "",
//             item.CustomerName,
//             item.DeliverName,
//             item.PINO,
//             (item.LCList || []).map(l => l.lcNo).join(", "),
//             (item.InvoiceList || []).map(i => i.invoiceNo).join(", "),
//             item.Section,
//             item.TotalQty,
//             item.ChallanQTY,
//             item.BalanceQty,
//             item.TotalValue,
//             item.ChallanValue,
//             item.BalanceValue,
//             safeCell(challanText),
//           ]);
//         });

//         // Subtotal for this PI group
//         data.push([
//           "Subtotal",
//           "", "", "", "", "", "", "",
//           items.reduce((a, b) => a + Number(b.TotalQty), 0),
//           items.reduce((a, b) => a + Number(b.ChallanQTY), 0),
//           items.reduce((a, b) => a + Number(b.BalanceQty), 0),
//           items.reduce((a, b) => a + Number(b.TotalValue), 0),
//           items.reduce((a, b) => a + Number(b.ChallanValue), 0),
//           items.reduce((a, b) => a + Number(b.BalanceValue), 0),
//           ""
//         ]);

//         data.push([]);
//       }

//       // Sheet 2 - RAW FLAT DATA
//       const rawData = [];
//       rawData.push([
//         "Order No", "Order Date", "Customer", "Delivery", "PI No",
//         "LC No", "Invoice No", "Section", "Order Qty", "Challan Qty",
//         "Balance Qty", "Order Value", "Challan Value", "Balance Value", "Challan Info"
//       ]);

//       dataToExport.forEach((item) => {
//         const lcNos = (item.LCList || [])
//           .map(l => l.lcNo)
//           .filter(Boolean)
//           .join(", ");

//         const invoiceNos = (item.InvoiceList || [])
//           .map(i => i.invoiceNo)
//           .filter(Boolean)
//           .join(", ");

//         const challanInfo = (item.ChallanNo || [])
//           .map(ch => `${ch.challanNo} (${ch.status})`)
//           .join(", ");

//         rawData.push([
//           item.WorkOrderNo,
//           item.OrderReceiveDate
//             ? new Date(item.OrderReceiveDate).toLocaleDateString(CONFIG.DATE_FORMAT)
//             : "",
//           item.CustomerName,
//           item.DeliverName,
//           item.PINO,
//           lcNos,
//           invoiceNos,
//           item.Section,
//           item.TotalQty,
//           item.ChallanQTY,
//           item.BalanceQty,
//           item.TotalValue,
//           item.ChallanValue,
//           item.BalanceValue,
//           challanInfo
//         ]);
//       });

//       // Create sheets
//       const ws = XLSX.utils.aoa_to_sheet(data);
//       const ws2 = XLSX.utils.aoa_to_sheet(rawData);
//       XLSX.utils.book_append_sheet(wb, ws, "Order Summary");
//       XLSX.utils.book_append_sheet(wb, ws2, "All Data");

//       // PI TITLE MERGE
//       let rowPointer = 0;
//       for (const items of Object.values(groupedByPI)) {
//         if (!ws["!merges"]) ws["!merges"] = [];
//         const lastCol = 14;
//         ws["!merges"].push({
//           s: { r: rowPointer, c: 0 },
//           e: { r: rowPointer, c: lastCol },
//         });
//         const headerRows = 3;
//         const subtotalRows = 2;
//         rowPointer += headerRows + items.length + subtotalRows;
//       }

//       // Column widths
//       const colWidths = [];
//       const MAX_WIDTH = CONFIG.EXCEL_MAX_WIDTH;
      
//       for (let c = 0; c < 15; c++) {
//         let maxLength = 10;
//         for (let r = 0; r < data.length; r++) {
//           const cellValue = data[r][c];
//           if (cellValue) {
//             const len = cellValue.toString().length;
//             if (len > maxLength) maxLength = len + 2;
//           }
//         }
//         if (maxLength > MAX_WIDTH) maxLength = MAX_WIDTH;
//         colWidths.push({ wch: maxLength });
//       }
//       ws["!cols"] = colWidths;

//       // Row heights
//       ws["!rows"] = data.map((row) => {
//         let maxLines = 1;
//         row.forEach((cell) => {
//           if (!cell) return;
//           const lines = cell.toString().split("\n").length;
//           if (lines > maxLines) maxLines = lines;
//         });
//         return { hpt: maxLines * 20 };
//       });

//       // Styling
//       data.forEach((row, r) => {
//         row.forEach((_, c) => {
//           const cell = XLSX.utils.encode_cell({ r, c });
//           if (!ws[cell]) return;

//           ws[cell].s = {
//             font: { sz: 18, name: "Calibri" },
//             alignment: {
//               horizontal: c === 14 ? "left" : "center",
//               vertical: "center",
//               wrapText: true,
//             },
//             border: {
//               top: { style: "thin", color: { rgb: "000000" } },
//               bottom: { style: "thin", color: { rgb: "000000" } },
//               left: { style: "thin", color: { rgb: "000000" } },
//               right: { style: "thin", color: { rgb: "000000" } },
//             },
//           };

//           if (ws["!merges"]?.some((m) => m.s.r === r)) {
//             ws[cell].s.font = {
//               bold: true,
//               sz: 26,
//               color: { rgb: "FFFFFF" },
//             };
//             ws[cell].s.fill = { fgColor: { rgb: "2F75B5" } };
//             ws[cell].s.alignment = {
//               horizontal: "center",
//               vertical: "center",
//             };
//           }

//           if (c === 9 || c === 10 || c === 11) {
//             ws[cell].s.numFmt = '"$"#,##0';
//             ws[cell].s.alignment.horizontal = "right";
//           }

//           if (row[0] === "Subtotal") {
//             ws[cell].s.fill = { fgColor: { rgb: "D9E1F2" } };
//             ws[cell].s.font.bold = true;
//           }
//         });
//       });

//       // Add summary sheet if requested
//       if (includeSummary) {
//         const summaryData = [
//           ['Order Summary Report'],
//           ['Generated:', new Date().toLocaleString()],
//           ['Total Orders:', filteredData.length],
//           ['Total Quantity:', grandTotal.TotalQty.toFixed(2)],
//           ['Total Challan Qty:', grandTotal.ChallanQTY.toFixed(2)],
//           ['Total Balance Qty:', grandTotal.BalanceQty.toFixed(2)],
//           ['Total Value:', `$${grandTotal.TotalValue.toFixed(2)}`],
//           ['Total Challan Value:', `$${grandTotal.ChallanValue.toFixed(2)}`],
//           ['Total Balance Value:', `$${grandTotal.BalanceValue.toFixed(2)}`],
//           ['Completion Rate:', `${((grandTotal.ChallanQTY / grandTotal.TotalQty) * 100 || 0).toFixed(1)}%`]
//         ];
//         const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
//         wsSummary['!cols'] = [{ wch: 20 }, { wch: 30 }];
//         XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");
//       }

//       // Save file
//       const fileName = `OrderSummaryReport_${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : format === 'json' ? 'json' : 'xlsx'}`;
      
//       if (format === 'csv') {
//         XLSX.writeFile(wb, fileName, { bookType: 'csv' });
//       } else if (format === 'json') {
//         XLSX.writeFile(wb, fileName, { bookType: 'json' });
//       } else {
//         XLSX.writeFile(wb, fileName);
//       }
      
//       toast.success(`Successfully exported ${filteredData.length} rows!`);
      
//     } catch (error) {
//       console.error("Export error:", error);
//       toast.error(`Failed to export: ${error.message}`);
//     }
//   }, [filteredData, grandTotal]);

//   // Bulk actions handler
//   const handleBulkAction = useCallback((action, rows) => {
//     const selectedData = filteredData.filter(d => rows.includes(d.WorkOrderNo));
    
//     switch(action) {
//       case 'export':
//         exportToExcel({ format: 'excel', includeSummary: true });
//         break;
//       case 'copy':
//         const text = selectedData.map(d => 
//           `${d.WorkOrderNo}\t${d.CustomerName}\t${d.PINO}\t${d.TotalValue}`
//         ).join('\n');
//         navigator.clipboard.writeText(text).then(() => {
//           toast.success(`Copied ${selectedData.length} items to clipboard`);
//         }).catch(() => {
//           toast.error('Failed to copy');
//         });
//         break;
//       case 'analyze':
//         const totalValue = selectedData.reduce((sum, d) => sum + Number(d.TotalValue), 0);
//         const avgValue = totalValue / selectedData.length;
//         toast.info(
//           `Analysis: ${selectedData.length} orders, ` +
//           `Total: $${totalValue.toFixed(2)}, ` +
//           `Average: $${avgValue.toFixed(2)}`
//         );
//         break;
//       case 'clear':
//         setSelectedRows([]);
//         toast.info('Selection cleared');
//         break;
//       default:
//         break;
//     }
//   }, [filteredData, exportToExcel, setSelectedRows]);

//   // Handle row click
//   const handleRowClick = useCallback((item) => {
//     const details = [
//       `Order: ${item.WorkOrderNo}`,
//       `Customer: ${item.CustomerName}`,
//       `PI: ${item.PINO}`,
//       `Value: $${item.TotalValue}`,
//       `Status: ${item.completionRate}% complete`
//     ];
//     toast.info(details.join(' • '));
//   }, []);

//   // Handle row select
//   const handleRowSelect = useCallback((rows) => {
//     setSelectedRows(rows);
//   }, [setSelectedRows]);

//   // Error handling
//   useEffect(() => {
//     if (error) {
//       toast.error(error);
//     }
//   }, [error]);

//   // Loading state
//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-64">
//         <FourSquare color="#32cd32" size="large" />
//       </div>
//     );
//   }

//   return (
//     <div className="container mx-auto px-4 py-6">
//       <OrderForm />

//       {/* Header */}
//       <div className="flex flex-wrap justify-between items-center mb-6 gap-2">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-800">Order Balance Summary</h1>
//           <p className="text-sm text-gray-500">
//             {totalItems} orders • {summarizedData.length} total items
//           </p>
//         </div>
//         <div className="flex gap-2 flex-wrap">
//           <NotificationCenter data={filteredData} />
//           <DataHistory />
//           <ColumnVisibilityManager
//             columns={COLUMN_CONFIG.allColumns}
//             visibleColumns={selectedColumns}
//             onToggle={toggleColumn}
//           />
//           <ExportOptions 
//             onExport={exportToExcel} 
//             totalItems={totalItems}
//             disabled={totalItems === 0}
//           />
//         </div>
//       </div>

//       {/* Analytics Dashboard */}
//       <AnalyticsDashboard data={filteredData} grandTotal={grandTotal} />

//       {/* Quick Stats */}
//       {grandTotal.TotalQty > 0 && (
//         <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
//           <div className="stat bg-base-100 rounded-lg shadow-sm p-3">
//             <div className="stat-title text-xs">Total Orders</div>
//             <div className="stat-value text-lg">{totalItems}</div>
//           </div>
//           <div className="stat bg-base-100 rounded-lg shadow-sm p-3">
//             <div className="stat-title text-xs">Total Qty</div>
//             <div className="stat-value text-lg text-primary">{Math.ceil(grandTotal.TotalQty)}</div>
//           </div>
//           <div className="stat bg-base-100 rounded-lg shadow-sm p-3">
//             <div className="stat-title text-xs">Challan Qty</div>
//             <div className="stat-value text-lg text-success">{Math.ceil(grandTotal.ChallanQTY)}</div>
//           </div>
//           <div className="stat bg-base-100 rounded-lg shadow-sm p-3">
//             <div className="stat-title text-xs">Balance Qty</div>
//             <div className="stat-value text-lg text-error">{Math.ceil(grandTotal.BalanceQty)}</div>
//           </div>
//           <div className="stat bg-base-100 rounded-lg shadow-sm p-3">
//             <div className="stat-title text-xs">Total Value</div>
//             <div className="stat-value text-lg text-info">${Math.ceil(grandTotal.TotalValue)}</div>
//           </div>
//           <div className="stat bg-base-100 rounded-lg shadow-sm p-3">
//             <div className="stat-title text-xs">Completion</div>
//             <div className="stat-value text-lg">
//               {grandTotal.TotalQty > 0 
//                 ? Math.round((grandTotal.ChallanQTY / grandTotal.TotalQty) * 100)
//                 : 0}%
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Advanced Filters */}
//       <div className="mb-4">
//         <AdvancedFiltersPanel
//           filters={{ dateRange, minValue, maxValue, statusFilter, sectionFilter }}
//           onFilterChange={handleFilterChange}
//           onReset={resetFilters}
//           totalItems={totalItems}
//           loading={loading}
//           sections={uniqueSections}
//         />
//       </div>

//       {/* Search and Quick Filters */}
//       <div className="flex flex-wrap gap-2 mb-4 items-center">
//         <SmartSearch 
//           data={summarizedData}
//           onSearch={(value) => { setSearch(value); setCurrentPage(0); }}
//           onClear={() => { setSearch(''); setCurrentPage(0); }}
//         />

//         <BulkOperations 
//           selectedRows={selectedRows}
//           data={filteredData}
//           onBulkAction={handleBulkAction}
//         />

//         <ProfessionalFilterDropdown
//           label="Order"
//           open={orderOpen}
//           setOpen={setOrderOpen}
//           items={filteredOrder}
//           selectedItems={selectedOrder}
//           onToggle={toggleOrder}
//           searchValue={orderSearch}
//           setSearchValue={setOrderSearch}
//           ref={orderRef}
//           placeholder="Search Order"
//           color="primary"
//         />

//         <ProfessionalFilterDropdown
//           label="PI"
//           open={piOpen}
//           setOpen={setPiOpen}
//           items={filteredPI}
//           selectedItems={selectedPI}
//           onToggle={togglePI}
//           searchValue={piSearch}
//           setSearchValue={setPiSearch}
//           ref={piRef}
//           placeholder="Search PI"
//           color="secondary"
//         />

//         <ProfessionalFilterDropdown
//           label="LC"
//           open={lcOpen}
//           setOpen={setLcOpen}
//           items={filteredLC}
//           selectedItems={selectedLC}
//           onToggle={toggleLC}
//           searchValue={lcSearch}
//           setSearchValue={setLcSearch}
//           ref={lcRef}
//           placeholder="Search LC"
//           color="info"
//         />

//         <ProfessionalFilterDropdown
//           label="Invoice"
//           open={invoiceOpen}
//           setOpen={setInvoiceOpen}
//           items={filteredInvoice}
//           selectedItems={selectedInvoice}
//           onToggle={toggleInvoice}
//           searchValue={invoiceSearch}
//           setSearchValue={setInvoiceSearch}
//           ref={invoiceRef}
//           placeholder="Search Invoice"
//           color="success"
//         />

//         {(selectedPI.length > 0 || selectedOrder.length > 0 || 
//           selectedLC.length > 0 || selectedInvoice.length > 0 || search ||
//           dateRange.start || dateRange.end || minValue || maxValue ||
//           statusFilter || sectionFilter) && (
//           <button
//             className="btn btn-ghost btn-sm"
//             onClick={resetFilters}
//           >
//             Clear All Filters
//           </button>
//         )}
//       </div>

//       {/* Table */}
//       <ProfessionalSummaryTable
//         data={displayedData}
//         columns={selectedColumns}
//         totalData={totalData}
//         onRowClick={handleRowClick}
//         onRowSelect={handleRowSelect}
//         selectedRows={selectedRows}
//         loading={loading}
//       />

//       {/* Pagination */}
//       {pageCount > 1 && (
//         <div className="flex flex-wrap justify-between items-center mt-4 gap-2">
//           <div className="text-sm text-gray-500">
//             Showing {currentPage * CONFIG.ITEMS_PER_PAGE + 1} to{' '}
//             {Math.min((currentPage + 1) * CONFIG.ITEMS_PER_PAGE, totalItems)} of{' '}
//             {totalItems} entries
//           </div>
//           <ReactPaginate
//             breakLabel="..."
//             nextLabel="Next →"
//             previousLabel="← Previous"
//             pageCount={pageCount}
//             onPageChange={({ selected }) => setCurrentPage(selected)}
//             containerClassName="flex gap-1"
//             pageLinkClassName="px-3 py-1.5 border rounded-lg hover:bg-gray-100 transition-colors text-sm"
//             activeLinkClassName="bg-primary text-white hover:bg-primary"
//             previousLinkClassName="px-3 py-1.5 border rounded-lg hover:bg-gray-100 transition-colors text-sm"
//             nextLinkClassName="px-3 py-1.5 border rounded-lg hover:bg-gray-100 transition-colors text-sm"
//             disabledClassName="opacity-50 cursor-not-allowed"
//             renderOnZeroPageCount={null}
//           />
//         </div>
//       )}

//       {/* Footer */}
//       <div className="mt-6 text-center text-xs text-gray-400 border-t pt-4">
//         <p>
//           {totalItems} orders loaded • Last updated: {new Date().toLocaleString(CONFIG.DATE_FORMAT)}
//         </p>
//         <div className="flex justify-center gap-4 mt-1">
//           <span>💡 Press Ctrl+F to search</span>
//           <span>•</span>
//           <span>⌨️ Press Ctrl+A to select all</span>
//           <span>•</span>
//           <span>📋 Click rows for details</span>
//         </div>
//       </div>
//     </div>
//   );
// }

// BalanceSummary.propTypes = {};

// export default BalanceSummary;





///////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////



/* PI Summary - Enterprise Edition with Advanced Analytics */

// import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
// import { GetDataContext } from "../components/DataContext";
// import { FourSquare } from "react-loading-indicators";
// import OrderForm from "../OrderReport/OrderForm";
// import * as XLSX from "xlsx-js-style";
// import ReactPaginate from "react-paginate";
// import { toast } from "react-toastify";
// import PropTypes from "prop-types";

// // ============================================================
// // CONSTANTS & CONFIGURATION
// // ============================================================

// const CONFIG = {
//   ITEMS_PER_PAGE: 50,
//   MAX_EXCEL_ROWS: 10000,
//   DEBOUNCE_DELAY: 300,
//   MAX_CHALLAN_DISPLAY: 5,
//   DATE_FORMAT: "en-GB",
//   CURRENCY_SYMBOL: "$",
//   EXCEL_MAX_WIDTH: 25,
//   AUTO_REFRESH_INTERVAL: 60000,
//   TOP_ITEMS_COUNT: 4,
// };

// const COLUMN_CONFIG = {
//   defaultVisible: [
//     "Order", "Date", "Customer", "Delivery", "Buyer", "PI", 
//     "LC", "Invoice", "Section", "OrderQty", "ChallanQty", 
//     "BalanceQty", "OrderValue", "ChallanValue", "BalanceValue", "Challan"
//   ],
//   allColumns: [
//     { id: "Order", label: "Order No", required: true },
//     { id: "Date", label: "Date", required: true },
//     { id: "Customer", label: "Customer", required: true },
//     { id: "Delivery", label: "Delivery", required: true },
//     { id: "Buyer", label: "Buyer", required: true },
//     { id: "PI", label: "PI No", required: false },
//     { id: "LC", label: "LC No", required: false },
//     { id: "Invoice", label: "Invoice No", required: false },
//     { id: "Section", label: "Section", required: true },
//     { id: "OrderQty", label: "Order Qty", required: true },
//     { id: "ChallanQty", label: "Challan Qty", required: true },
//     { id: "BalanceQty", label: "Balance Qty", required: true },
//     { id: "OrderValue", label: "Order Value", required: true },
//     { id: "ChallanValue", label: "Challan Value", required: true },
//     { id: "BalanceValue", label: "Balance Value", required: true },
//     { id: "Challan", label: "Challan", required: false },
//   ]
// };

// // ============================================================
// // CUSTOM HOOKS
// // ============================================================

// const useDebounce = (value, delay = CONFIG.DEBOUNCE_DELAY) => {
//   const [debouncedValue, setDebouncedValue] = useState(value);

//   useEffect(() => {
//     const handler = setTimeout(() => {
//       setDebouncedValue(value);
//     }, delay);

//     return () => clearTimeout(handler);
//   }, [value, delay]);

//   return debouncedValue;
// };

// const useLocalStorage = (key, initialValue) => {
//   const [storedValue, setStoredValue] = useState(() => {
//     try {
//       const item = window.localStorage.getItem(key);
//       return item ? JSON.parse(item) : initialValue;
//     } catch (error) {
//       console.error("Error reading localStorage:", error);
//       return initialValue;
//     }
//   });

//   const setValue = useCallback((value) => {
//     try {
//       const valueToStore = value instanceof Function ? value(storedValue) : value;
//       setStoredValue(valueToStore);
//       window.localStorage.setItem(key, JSON.stringify(valueToStore));
//     } catch (error) {
//       console.error("Error saving to localStorage:", error);
//     }
//   }, [key, storedValue]);

//   return [storedValue, setValue];
// };

// const useDataMaps = (cndata) => {
//   return useMemo(() => {
//     const challanMap = new Map();
//     const lcMap = new Map();
//     const invoiceMap = new Map();

//     try {
//       (cndata?.grupChallan ?? []).forEach((c) => {
//         challanMap.set(`${c.workOrderNo}-${c.challanNo}`, c.statusDesc);
//       });

//       (cndata?.bblcData ?? []).forEach((item) => {
//         const pi = item.customerPINo?.trim();
//         if (!pi) return;
//         if (!lcMap.has(pi)) lcMap.set(pi, []);
//         lcMap.get(pi).push({
//           lcNo: item.lcNo,
//           lcDate: item.lcDate,
//           totalLCValue: item.totalLCValue,
//         });
//       });

//       (cndata?.invoiceData ?? []).forEach((item) => {
//         if (!item.lcNo) return;
//         if (!invoiceMap.has(item.lcNo)) invoiceMap.set(item.lcNo, []);
//         invoiceMap.get(item.lcNo).push({
//           invoiceNo: item.invoiceNo,
//           invoiceDate: item.invoiceDate,
//           totalInvoiceValue: item.totalInvoiceValue,
//         });
//       });
//     } catch (error) {
//       console.error("Error building data maps:", error);
//     }

//     return { challanMap, lcMap, invoiceMap };
//   }, [cndata]);
// };

// const useSummarizedData = (cndata, maps) => {
//   return useMemo(() => {
//     const apidata = cndata?.apiData ?? [];
//     const { challanMap, lcMap, invoiceMap } = maps;

//     try {
//       const grouped = new Map();

//       apidata.forEach((item) => {
//         const key = `${item.WorkOrderNo}-${item.CustomerPINo}`;
        
//         if (!grouped.has(key)) {
//           grouped.set(key, {
//             WorkOrderNo: item.WorkOrderNo,
//             OrderReceiveDate: item.OrderReceiveDate,
//             DeliverName: item.FName,
//             CustomerName: item.CName,
//             PINO: item.CustomerPINo || "No PI",
//             Section: item.ProductCategoryName,
//             Buyer: item.BuyerName,
//             TotalQty: 0,
//             TotalValue: 0,
//             ChallanQTY: 0,
//             ChallanValue: 0,
//             BalanceQty: 0,
//             BalanceValue: 0,
//             ChallanNo: [],
//             itemCount: 0,
//           });
//         }

//         const row = grouped.get(key);
//         row.TotalQty += Number(item.BreakDownQTY) || 0;
//         row.ChallanQTY += Number(item.ChallanQTY) || 0;
//         row.BalanceQty += Number(item.BalanceQTY) || 0;
//         row.TotalValue += Number(item.TotalOrderValue) || 0;
//         row.ChallanValue += Number(item.ChallanValue) || 0;
//         row.BalanceValue += Number(item.BalanceValue) || 0;
//         row.itemCount += 1;

//         if (item.ChallanNo) {
//           item.ChallanNo.split(",")
//             .map((c) => c.trim())
//             .filter(Boolean)
//             .forEach((cn) => {
//               const status = challanMap.get(`${item.WorkOrderNo}-${cn}`) || "Unknown";
//               const exists = row.ChallanNo.some((c) => c.challanNo === cn);
//               if (!exists) {
//                 row.ChallanNo.push({ challanNo: cn, status });
//               }
//             });
//         }
//       });

//       return Array.from(grouped.values()).map((item) => {
//         const lcInfoList = (lcMap.get(item.PINO) || []).filter((lc) => lc.lcNo);
//         const invoiceInfoList = lcInfoList
//           .flatMap((lc) => invoiceMap.get(lc.lcNo) || [])
//           .filter((inv) => inv.invoiceNo);

//         return {
//           ...item,
//           LCList: lcInfoList,
//           InvoiceList: invoiceInfoList,
//           completionRate: item.TotalQty > 0 
//             ? ((item.ChallanQTY / item.TotalQty) * 100).toFixed(1) 
//             : 0,
//         };
//       });
//     } catch (error) {
//       console.error("Error summarizing data:", error);
//       return [];
//     }
//   }, [cndata, maps]);
// };

// const useFilters = (summarizedData, filters, search) => {
//   const normalize = useCallback((v) => String(v || "").trim().toLowerCase(), []);

//   return useMemo(() => {
//     const searchValue = normalize(search);
//     const { 
//       selectedPI, selectedOrder, selectedLC, selectedInvoice,
//       selectedCustomer, selectedMarketing, selectedBuyer,
//       dateRange, minValue, maxValue, statusFilter, sectionFilter 
//     } = filters;

//     const selectedPISet = new Set(selectedPI.map(normalize));
//     const selectedOrderSet = new Set(selectedOrder.map(normalize));
//     const selectedLCSet = new Set(selectedLC.map(normalize));
//     const selectedInvoiceSet = new Set(selectedInvoice.map(normalize));
//     const selectedCustomerSet = new Set(selectedCustomer.map(normalize));
//     const selectedMarketingSet = new Set(selectedMarketing.map(normalize));
//     const selectedBuyerSet = new Set(selectedBuyer.map(normalize));

//     try {
//       return summarizedData
//         .filter((item) => {
//           const workOrder = normalize(item.WorkOrderNo);
//           const customer = normalize(item.CustomerName);
//           const delivery = normalize(item.DeliverName);
//           const buyer = normalize(item.Buyer);
//           const pi = normalize(item.PINO || "No PI");
//           const lc = normalize(
//             (item.LCList || []).map((l) => l.lcNo).join(",") || "No LC"
//           );
//           const invoice = normalize(
//             (item.InvoiceList || []).map((i) => i.invoiceNo).join(",") || "No Invoice"
//           );

//           const searchMatch =
//             !searchValue ||
//             workOrder.includes(searchValue) ||
//             customer.includes(searchValue) ||
//             delivery.includes(searchValue) ||
//             pi.includes(searchValue) ||
//             buyer.includes(searchValue) ||
//             lc.includes(searchValue) ||
//             invoice.includes(searchValue);

//           const piMatch =
//             selectedPISet.size === 0 || selectedPISet.has(normalize(item.PINO || "No PI"));
//           const lcMatch =
//             selectedLCSet.size === 0 ||
//             (item.LCList || []).some((l) => selectedLCSet.has(normalize(l.lcNo)));
//           const invoiceMatch =
//             selectedInvoiceSet.size === 0 ||
//             (item.InvoiceList || []).some((i) => selectedInvoiceSet.has(normalize(i.invoiceNo)));
//           const orderMatch =
//             selectedOrderSet.size === 0 || selectedOrderSet.has(workOrder);
//           const customerMatch =
//             selectedCustomerSet.size === 0 || selectedCustomerSet.has(customer);
//           const marketingMatch =
//             selectedMarketingSet.size === 0 || selectedMarketingSet.has(delivery);
//           const buyerMatch =
//             selectedBuyerSet.size === 0 || selectedBuyerSet.has(buyer);

//           let dateMatch = true;
//           if (dateRange?.start && dateRange?.end) {
//             const orderDate = new Date(item.OrderReceiveDate);
//             const start = new Date(dateRange.start);
//             const end = new Date(dateRange.end);
//             start.setHours(0, 0, 0, 0);
//             end.setHours(23, 59, 59, 999);
//             dateMatch = orderDate >= start && orderDate <= end;
//           }

//           let valueMatch = true;
//           if (minValue || maxValue) {
//             const totalValue = Number(item.TotalValue) || 0;
//             if (minValue && totalValue < Number(minValue)) valueMatch = false;
//             if (maxValue && totalValue > Number(maxValue)) valueMatch = false;
//           }

//           let statusMatch = true;
//           if (statusFilter) {
//             const completion = parseFloat(item.completionRate);
//             if (statusFilter === 'complete' && completion < 100) statusMatch = false;
//             if (statusFilter === 'in-progress' && (completion >= 100 || completion <= 0)) statusMatch = false;
//             if (statusFilter === 'pending' && completion > 0) statusMatch = false;
//           }

//           let sectionMatch = true;
//           if (sectionFilter) {
//             sectionMatch = normalize(item.Section) === normalize(sectionFilter);
//           }

//           return searchMatch && piMatch && orderMatch && lcMatch && 
//                  invoiceMatch && customerMatch && marketingMatch && buyerMatch &&
//                  dateMatch && valueMatch && statusMatch && sectionMatch;
//         })
//         .sort((a, b) => {
//           const getParts = (val = "") => {
//             const parts = val.split("-");
//             return {
//               num: Number(parts[1]) || 0,
//               year: Number(parts[2]) || 0,
//             };
//           };
//           const A = getParts(a.WorkOrderNo);
//           const B = getParts(b.WorkOrderNo);
//           return B.year !== A.year ? B.year - A.year : B.num - A.num;
//         });
//     } catch (error) {
//       console.error("Error filtering data:", error);
//       return [];
//     }
//   }, [summarizedData, search, filters, normalize]);
// };

// const usePagination = (filteredData, itemsPerPage = CONFIG.ITEMS_PER_PAGE) => {
//   const [currentPage, setCurrentPage] = useState(0);

//   const pageCount = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
//   const displayedData = filteredData.slice(
//     currentPage * itemsPerPage,
//     currentPage * itemsPerPage + itemsPerPage
//   );

//   const totalData = useMemo(() => {
//     return displayedData.reduce(
//       (acc, item) => {
//         acc.TotalQty += Number(item.TotalQty || 0);
//         acc.ChallanQTY += Number(item.ChallanQTY || 0);
//         acc.BalanceQty += Number(item.BalanceQty || 0);
//         acc.TotalValue += Number(item.TotalValue || 0);
//         acc.ChallanValue += Number(item.ChallanValue || 0);
//         acc.BalanceValue += Number(item.BalanceValue || 0);
//         acc.itemCount += 1;
//         return acc;
//       },
//       {
//         TotalQty: 0,
//         ChallanQTY: 0,
//         BalanceQty: 0,
//         TotalValue: 0,
//         ChallanValue: 0,
//         BalanceValue: 0,
//         itemCount: 0,
//       }
//     );
//   }, [displayedData]);

//   const grandTotal = useMemo(() => {
//     return filteredData.reduce(
//       (acc, item) => {
//         acc.TotalQty += Number(item.TotalQty || 0);
//         acc.ChallanQTY += Number(item.ChallanQTY || 0);
//         acc.BalanceQty += Number(item.BalanceQty || 0);
//         acc.TotalValue += Number(item.TotalValue || 0);
//         acc.ChallanValue += Number(item.ChallanValue || 0);
//         acc.BalanceValue += Number(item.BalanceValue || 0);
//         return acc;
//       },
//       {
//         TotalQty: 0,
//         ChallanQTY: 0,
//         BalanceQty: 0,
//         TotalValue: 0,
//         ChallanValue: 0,
//         BalanceValue: 0,
//       }
//     );
//   }, [filteredData]);

//   useEffect(() => {
//     setCurrentPage(0);
//   }, [filteredData.length]);

//   return { 
//     currentPage, 
//     setCurrentPage, 
//     pageCount, 
//     displayedData, 
//     totalData, 
//     grandTotal,
//     totalItems: filteredData.length 
//   };
// };

// // ============================================================
// // TOP 4 ANALYTICS COMPONENT
// // ============================================================

// const TopItemsAnalytics = React.memo(({ data }) => {
//   const topItems = useMemo(() => {
//     // Top 4 Customers by Value
//     const customerMap = new Map();
//     data.forEach(d => {
//       const name = d.CustomerName || "Unknown";
//       customerMap.set(name, {
//         value: (customerMap.get(name)?.value || 0) + Number(d.TotalValue || 0),
//         orders: (customerMap.get(name)?.orders || 0) + 1,
//         qty: (customerMap.get(name)?.qty || 0) + Number(d.TotalQty || 0),
//       });
//     });
//     const topCustomers = [...customerMap.entries()]
//       .sort((a, b) => b[1].value - a[1].value)
//       .slice(0, CONFIG.TOP_ITEMS_COUNT)
//       .map(([name, data]) => ({ name, ...data }));

//     // Top 4 Marketing (Delivery) by Value
//     const marketingMap = new Map();
//     data.forEach(d => {
//       const name = d.DeliverName || "Unknown";
//       marketingMap.set(name, {
//         value: (marketingMap.get(name)?.value || 0) + Number(d.TotalValue || 0),
//         orders: (marketingMap.get(name)?.orders || 0) + 1,
//         qty: (marketingMap.get(name)?.qty || 0) + Number(d.TotalQty || 0),
//       });
//     });
//     const topMarketing = [...marketingMap.entries()]
//       .sort((a, b) => b[1].value - a[1].value)
//       .slice(0, CONFIG.TOP_ITEMS_COUNT)
//       .map(([name, data]) => ({ name, ...data }));

//     // Top 4 Buyer by Value
//     const buyerMap = new Map();
//     data.forEach(d => {
//       const name = d.Buyer || "Unknown";
//       buyerMap.set(name, {
//         value: (buyerMap.get(name)?.value || 0) + Number(d.TotalValue || 0),
//         orders: (buyerMap.get(name)?.orders || 0) + 1,
//         qty: (buyerMap.get(name)?.qty || 0) + Number(d.TotalQty || 0),
//       });
//     });
//     const topBuyers = [...buyerMap.entries()]
//       .sort((a, b) => b[1].value - a[1].value)
//       .slice(0, CONFIG.TOP_ITEMS_COUNT)
//       .map(([name, data]) => ({ name, ...data }));

//     // Top 4 Orders by Value
//     const orderMap = new Map();
//     data.forEach(d => {
//       const name = d.WorkOrderNo || "Unknown";
//       orderMap.set(name, {
//         value: Number(d.TotalValue || 0),
//         customer: d.CustomerName || "Unknown",
//         qty: Number(d.TotalQty || 0),
//         completion: d.completionRate || 0,
//       });
//     });
//     const topOrders = [...orderMap.entries()]
//       .sort((a, b) => b[1].value - a[1].value)
//       .slice(0, CONFIG.TOP_ITEMS_COUNT)
//       .map(([name, data]) => ({ name, ...data }));

//     return { topCustomers, topMarketing, topBuyers, topOrders };
//   }, [data]);

//   const renderTopCard = (title, items, valueLabel = "Value", showCompletion = false) => {
//     if (!items || items.length === 0) {
//       return (
//         <div className="bg-base-100 rounded-lg shadow-sm p-3 border">
//           <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{title}</h4>
//           <div className="text-gray-400 text-sm text-center py-4">No data available</div>
//         </div>
//       );
//     }

//     return (
//       <div className="bg-base-100 rounded-lg shadow-sm p-3 border">
//         <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{title}</h4>
//         <div className="space-y-2">
//           {items.map((item, index) => (
//             <div key={index} className="flex items-center justify-between group">
//               <div className="flex items-center gap-2 flex-1 min-w-0">
//                 <span className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full ${
//                   index === 0 ? 'bg-yellow-400 text-yellow-900' :
//                   index === 1 ? 'bg-gray-300 text-gray-700' :
//                   index === 2 ? 'bg-orange-300 text-orange-900' :
//                   'bg-blue-100 text-blue-700'
//                 }`}>
//                   {index + 1}
//                 </span>
//                 <span className="text-sm truncate" title={item.name}>
//                   {item.name}
//                 </span>
//               </div>
//               <div className="flex items-center gap-3 text-xs">
//                 <span className="font-semibold text-blue-600">
//                   ${Number(item.value).toFixed(2)}
//                 </span>
//                 {showCompletion && (
//                   <span className={`px-1.5 py-0.5 rounded ${
//                     item.completion >= 100 ? 'bg-green-100 text-green-700' :
//                     item.completion > 50 ? 'bg-yellow-100 text-yellow-700' :
//                     'bg-red-100 text-red-700'
//                   }`}>
//                     {item.completion}%
//                   </span>
//                 )}
//                 <span className="text-gray-400 text-[10px]">
//                   {item.orders || item.qty || 0} {item.orders ? 'orders' : 'qty'}
//                 </span>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     );
//   };

//   if (data.length === 0) return null;

//   return (
//     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
//       {renderTopCard("🏆 Top Customers", topItems.topCustomers)}
//       {renderTopCard("📊 Top Marketing", topItems.topMarketing)}
//       {renderTopCard("👤 Top Buyers", topItems.topBuyers)}
//       {renderTopCard("📋 Top Orders", topItems.topOrders, "Value", true)}
//     </div>
//   );
// });

// TopItemsAnalytics.displayName = "TopItemsAnalytics";

// // ============================================================
// // ADVANCED UI COMPONENTS
// // ============================================================

// // Professional Filter Dropdown
// const ProfessionalFilterDropdown = React.memo(({
//   label,
//   open,
//   setOpen,
//   items,
//   selectedItems,
//   onToggle,
//   searchValue,
//   setSearchValue,
//   ref,
//   placeholder = "Search...",
//   color = "blue",
//   showCount = true,
//   icon = null,
// }) => {
//   const [selectAll, setSelectAll] = useState(false);

//   useEffect(() => {
//     setSelectAll(selectedItems.length === items.length && items.length > 0);
//   }, [selectedItems, items]);

//   const handleSelectAll = useCallback(() => {
//     if (selectAll) {
//       onToggle([]);
//     } else {
//       onToggle(items);
//     }
//   }, [selectAll, items, onToggle]);

//   return (
//     <div className="relative" ref={ref}>
//       <button
//         className={`btn btn-outline btn-sm gap-1 transition-all duration-200 hover:shadow-md ${
//           selectedItems.length > 0 ? `border-${color}-500 bg-${color}-50` : ''
//         }`}
//         onClick={() => setOpen(!open)}
//         aria-expanded={open}
//         aria-haspopup="listbox"
//       >
//         {icon && <span>{icon}</span>}
//         <span className="text-xs">{label}</span>
//         {showCount && selectedItems.length > 0 && (
//           <span className={`badge badge-${color} badge-xs`}>
//             {selectedItems.length}
//           </span>
//         )}
//         <span className="text-xs">{open ? '▲' : '▼'}</span>
//       </button>

//       {open && (
//         <div className="absolute bg-base-100 shadow-xl p-3 rounded-lg w-64 max-h-80 overflow-y-auto z-50 mt-2 border border-gray-200">
//           <div className="flex justify-between items-center mb-2">
//             <span className="font-semibold text-xs">{label} Filter</span>
//             <div className="flex gap-2">
//               <button
//                 className="text-xs text-blue-600 hover:text-blue-800 font-medium"
//                 onClick={handleSelectAll}
//               >
//                 {selectAll ? 'Deselect All' : 'Select All'}
//               </button>
//               <button
//                 className="text-xs text-red-600 hover:text-red-800 font-medium"
//                 onClick={() => onToggle([])}
//               >
//                 Clear
//               </button>
//             </div>
//           </div>

//           <div className="relative mb-2">
//             <input
//               type="text"
//               placeholder={placeholder}
//               className="input input-xs w-full pl-7"
//               value={searchValue}
//               onChange={(e) => setSearchValue(e.target.value)}
//             />
//           </div>

//           <div className="space-y-0.5">
//             {items.length === 0 ? (
//               <div className="text-gray-400 text-xs text-center py-2">No items found</div>
//             ) : (
//               items.map((item) => (
//                 <label
//                   key={item}
//                   className="flex gap-2 py-1 px-2 items-center hover:bg-gray-100 rounded cursor-pointer transition-colors"
//                 >
//                   <input
//                     type="checkbox"
//                     checked={selectedItems.includes(item)}
//                     onChange={() => onToggle(item)}
//                     className="checkbox checkbox-xs"
//                   />
//                   <span className="text-xs select-none truncate">{item}</span>
//                 </label>
//               ))
//             )}
//           </div>

//           <div className="mt-2 pt-2 border-t border-gray-200 text-[10px] text-gray-500">
//             {selectedItems.length} selected
//           </div>
//         </div>
//       )}
//     </div>
//   );
// });

// ProfessionalFilterDropdown.displayName = "ProfessionalFilterDropdown";

// // Enhanced Challan Cell
// const EnhancedChallanCell = React.memo(({ challanNo }) => {
//   const [expanded, setExpanded] = useState(false);
//   const displayedChallans = expanded ? challanNo : challanNo.slice(0, CONFIG.MAX_CHALLAN_DISPLAY);
//   const hasMore = challanNo.length > CONFIG.MAX_CHALLAN_DISPLAY;

//   const handleCopy = useCallback(() => {
//     const text = challanNo.map((ch) => `${ch.challanNo} (${ch.status})`).join("\n");
//     navigator.clipboard.writeText(text).then(() => {
//       toast.success("Challans copied!");
//     }).catch(() => {
//       toast.error("Failed to copy");
//     });
//   }, [challanNo]);

//   if (!challanNo || challanNo.length === 0) {
//     return (
//       <div className="text-gray-400 text-xs text-center py-2">
//         <span className="opacity-50">No Challan</span>
//       </div>
//     );
//   }

//   return (
//     <div className="border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
//       <div className="flex justify-between items-center bg-gray-50 px-2 py-1.5 rounded-t-lg border-b">
//         <span className="text-[10px] font-semibold text-gray-600">
//           📋 Challans ({challanNo.length})
//         </span>
//         <div className="flex gap-1">
//           {hasMore && (
//             <button
//               className="text-[10px] text-blue-600 hover:text-blue-800 px-1.5 py-0.5 rounded hover:bg-blue-50 transition-colors"
//               onClick={() => setExpanded(!expanded)}
//             >
//               {expanded ? 'Show Less' : `+${challanNo.length - CONFIG.MAX_CHALLAN_DISPLAY}`}
//             </button>
//           )}
//           <button
//             className="text-[10px] bg-blue-500 hover:bg-blue-600 text-white px-1.5 py-0.5 rounded transition-colors"
//             onClick={handleCopy}
//           >
//             Copy
//           </button>
//         </div>
//       </div>
//       <div 
//         className="overflow-y-auto p-1.5 space-y-0.5"
//         style={{ maxHeight: expanded ? "200px" : "100px" }}
//       >
//         {displayedChallans.map((ch, i) => (
//           <div
//             key={i}
//             className={`flex justify-between items-center text-[10px] px-2 py-0.5 rounded transition-colors ${
//               ch.status === "Challan Received"
//                 ? "bg-green-50 text-green-700 hover:bg-green-100"
//                 : ch.status === "Send to Gate"
//                 ? "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
//                 : ch.status === "Delivered"
//                 ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
//                 : ch.status === "Gate Out"
//                 ? "bg-red-50 text-red-700 hover:bg-red-100"
//                 : "bg-gray-50 text-gray-600 hover:bg-gray-100"
//             }`}
//           >
//             <span className="font-medium">
//               {i + 1}. {ch.challanNo}
//             </span>
//             <span className={`px-1 py-0.5 rounded text-[8px] font-medium ${
//               ch.status === "Challan Received"
//                 ? "bg-green-200 text-green-800"
//                 : ch.status === "Send to Gate"
//                 ? "bg-yellow-200 text-yellow-800"
//                 : ch.status === "Delivered"
//                 ? "bg-blue-200 text-blue-800"
//                 : ch.status === "Gate Out"
//                 ? "bg-red-200 text-red-800"
//                 : "bg-gray-200 text-gray-800"
//             }`}>
//               {ch.status}
//             </span>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// });

// EnhancedChallanCell.displayName = "EnhancedChallanCell";

// // Professional Summary Table
// const ProfessionalSummaryTable = React.memo(({ 
//   data, 
//   columns, 
//   totalData, 
//   onRowClick,
//   onRowSelect,
//   selectedRows,
//   loading 
// }) => {
//   const formatDate = useCallback((dateStr) => {
//     if (!dateStr) return "-";
//     try {
//       return new Date(dateStr).toLocaleDateString(CONFIG.DATE_FORMAT, {
//         day: '2-digit',
//         month: 'short',
//         year: 'numeric'
//       });
//     } catch {
//       return "-";
//     }
//   }, []);

//   const formatCurrency = useCallback((value) => {
//     return `${CONFIG.CURRENCY_SYMBOL}${Number(value).toFixed(2)}`;
//   }, []);

//   const getStatusBadge = useCallback((item) => {
//     const completion = parseFloat(item.completionRate);
//     if (completion === 100) {
//       return <span className="badge badge-success badge-xs">Complete</span>;
//     } else if (completion > 50) {
//       return <span className="badge badge-warning badge-xs">In Progress</span>;
//     } else {
//       return <span className="badge badge-error badge-xs">Pending</span>;
//     }
//   }, []);

//   const handleRowCheck = (item, checked) => {
//     if (checked) {
//       onRowSelect([...selectedRows, item.WorkOrderNo]);
//     } else {
//       onRowSelect(selectedRows.filter(id => id !== item.WorkOrderNo));
//     }
//   };

//   const handleSelectAll = (checked) => {
//     if (checked) {
//       onRowSelect(data.map(d => d.WorkOrderNo));
//     } else {
//       onRowSelect([]);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-64">
//         <div className="loading loading-spinner loading-lg text-primary"></div>
//       </div>
//     );
//   }

//   if (data.length === 0) {
//     return (
//       <div className="text-center py-12">
//         <div className="text-gray-400 text-lg">No data to display</div>
//         <div className="text-gray-300 text-sm mt-2">Try adjusting your filters</div>
//       </div>
//     );
//   }

//   const totalColSpan = 10 + 
//     (columns.includes("PI") ? 1 : 0) +
//     (columns.includes("LC") ? 1 : 0) +
//     (columns.includes("Invoice") ? 1 : 0);

//   return (
//     <div className="max-h-[650px] overflow-y-auto border rounded-xl shadow-sm">
//       <table className="table table-xs table-zebra min-w-[1400px]">
//         <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white sticky top-0 z-10">
//           <tr className="text-center text-[10px] uppercase tracking-wider">
//             <th className="py-2 w-8">
//               <input
//                 type="checkbox"
//                 className="checkbox checkbox-xs"
//                 checked={data.length > 0 && selectedRows.length === data.length}
//                 onChange={(e) => handleSelectAll(e.target.checked)}
//               />
//             </th>
//             {columns.includes("Order") && <th className="py-2">Order</th>}
//             <th className="py-2">Date</th>
//             <th className="py-2">Customer</th>
//             <th className="py-2">Delivery</th>
//             <th className="py-2">Buyer</th>
//             {columns.includes("PI") && <th className="py-2">PI</th>}
//             {columns.includes("LC") && <th className="py-2">LC No</th>}
//             {columns.includes("Invoice") && <th className="py-2">Invoice</th>}
//             <th className="py-2">Section</th>
//             <th className="py-2 text-right">Order Qty</th>
//             <th className="py-2 text-right">Challan Qty</th>
//             <th className="py-2 text-right">Balance Qty</th>
//             <th className="py-2 text-right">Order Value</th>
//             <th className="py-2 text-right">Challan Value</th>
//             <th className="py-2 text-right">Balance Value</th>
//             <th className="py-2 text-center">Challan</th>
//             <th className="py-2 text-center">Status</th>
//           </tr>
//         </thead>

//         <tbody>
//           {data.map((item) => (
//             <tr 
//               key={`${item.WorkOrderNo}-${item.PINO}-${item.CustomerName}`}
//               className={`hover:bg-blue-50 transition-colors cursor-pointer ${
//                 selectedRows.includes(item.WorkOrderNo) ? 'bg-blue-100' : ''
//               }`}
//               onClick={() => onRowClick?.(item)}
//             >
//               <td className="px-2 py-1" onClick={(e) => e.stopPropagation()}>
//                 <input
//                   type="checkbox"
//                   className="checkbox checkbox-xs"
//                   checked={selectedRows.includes(item.WorkOrderNo)}
//                   onChange={(e) => handleRowCheck(item, e.target.checked)}
//                 />
//               </td>
//               {columns.includes("Order") && (
//                 <td className="px-2 py-1 whitespace-nowrap font-medium text-xs">
//                   {item.WorkOrderNo}
//                 </td>
//               )}
//               <td className="px-2 py-1 whitespace-nowrap text-[11px]">
//                 {formatDate(item.OrderReceiveDate)}
//               </td>
//               <td className="px-2 py-1 whitespace-nowrap font-medium text-xs">
//                 {item.CustomerName}
//               </td>
//               <td className="px-2 py-1 whitespace-nowrap text-xs">{item.DeliverName}</td>
//               <td className="px-2 py-1 whitespace-nowrap text-xs">{item.Buyer}</td>
//               {columns.includes("PI") && (
//                 <td className="px-2 py-1 whitespace-nowrap text-[11px] font-mono">
//                   {item.PINO}
//                 </td>
//               )}
//               {columns.includes("LC") && (
//                 <td className="px-2 py-1 whitespace-nowrap text-[11px] font-mono">
//                   {(item.LCList || []).map((l) => l.lcNo).join(", ") || "-"}
//                 </td>
//               )}
//               {columns.includes("Invoice") && (
//                 <td className="px-2 py-1 whitespace-nowrap text-[11px] font-mono">
//                   {(item.InvoiceList || []).map((i) => i.invoiceNo).join(", ") || "-"}
//                 </td>
//               )}
//               <td className="px-2 py-1 whitespace-nowrap text-xs">{item.Section}</td>
//               <td className="px-2 py-1 whitespace-nowrap text-right font-medium text-xs">
//                 {item.TotalQty.toFixed(2)}
//               </td>
//               <td className="px-2 py-1 whitespace-nowrap text-right text-green-600 font-medium text-xs">
//                 {item.ChallanQTY.toFixed(2)}
//               </td>
//               <td className="px-2 py-1 whitespace-nowrap text-right text-red-600 font-medium text-xs">
//                 {item.BalanceQty.toFixed(2)}
//               </td>
//               <td className="px-2 py-1 whitespace-nowrap text-right text-blue-600 font-semibold text-xs">
//                 {formatCurrency(item.TotalValue)}
//               </td>
//               <td className="px-2 py-1 whitespace-nowrap text-right text-green-600 font-semibold text-xs">
//                 {formatCurrency(item.ChallanValue)}
//               </td>
//               <td className="px-2 py-1 whitespace-nowrap text-right text-red-600 font-semibold text-xs">
//                 {formatCurrency(item.BalanceValue)}
//               </td>
//               <td className="px-2 py-1 text-left min-w-[180px]">
//                 <EnhancedChallanCell challanNo={item.ChallanNo} />
//               </td>
//               <td className="px-2 py-1 text-center">
//                 {getStatusBadge(item)}
//               </td>
//             </tr>
//           ))}
//         </tbody>

//         <tfoot className="sticky bottom-0 bg-blue-100 z-10 border-t-2 border-blue-300">
//           <tr className="font-bold text-xs">
//             <td className="text-right pr-2" colSpan={totalColSpan}>
//               Totals:
//             </td>
//             <td className="text-right">{totalData.TotalQty.toFixed(2)}</td>
//             <td className="text-right text-green-700">{totalData.ChallanQTY.toFixed(2)}</td>
//             <td className="text-right text-red-700">{totalData.BalanceQty.toFixed(2)}</td>
//             <td className="text-right text-blue-700">{formatCurrency(totalData.TotalValue)}</td>
//             <td className="text-right text-green-700">{formatCurrency(totalData.ChallanValue)}</td>
//             <td className="text-right text-red-700">{formatCurrency(totalData.BalanceValue)}</td>
//             <td></td>
//             <td></td>
//           </tr>
//         </tfoot>
//       </table>
//     </div>
//   );
// });

// ProfessionalSummaryTable.displayName = "ProfessionalSummaryTable";

// // Advanced Filters Panel
// const AdvancedFiltersPanel = React.memo(({ 
//   filters, 
//   onFilterChange,
//   onReset,
//   totalItems,
//   loading,
//   sections 
// }) => {
//   const [isExpanded, setIsExpanded] = useState(false);

//   return (
//     <div className="bg-base-200 rounded-xl p-3 shadow-sm">
//       <div className="flex flex-wrap justify-between items-center gap-2">
//         <div className="flex items-center gap-3">
//           <button
//             className="btn btn-ghost btn-xs gap-1"
//             onClick={() => setIsExpanded(!isExpanded)}
//           >
//             <span>🔍</span>
//             Advanced Filters
//             <span>{isExpanded ? '▲' : '▼'}</span>
//           </button>
//           <span className="text-xs text-gray-500">
//             {loading ? 'Loading...' : `${totalItems} items found`}
//           </span>
//         </div>
//         <button
//           className="btn btn-ghost btn-xs"
//           onClick={onReset}
//           disabled={loading}
//         >
//           Reset Filters
//         </button>
//       </div>

//       {isExpanded && (
//         <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3">
//           <div className="form-control">
//             <label className="label">
//               <span className="label-text text-xs">Date Range</span>
//             </label>
//             <div className="flex gap-1">
//               <input
//                 type="date"
//                 className="input input-bordered input-xs flex-1"
//                 value={filters.dateRange?.start || ''}
//                 onChange={(e) => onFilterChange('dateRange', { ...filters.dateRange, start: e.target.value })}
//               />
//               <input
//                 type="date"
//                 className="input input-bordered input-xs flex-1"
//                 value={filters.dateRange?.end || ''}
//                 onChange={(e) => onFilterChange('dateRange', { ...filters.dateRange, end: e.target.value })}
//               />
//             </div>
//           </div>

//           <div className="form-control">
//             <label className="label">
//               <span className="label-text text-xs">Value Range</span>
//             </label>
//             <div className="flex gap-1">
//               <input
//                 type="number"
//                 className="input input-bordered input-xs flex-1"
//                 placeholder="Min"
//                 value={filters.minValue || ''}
//                 onChange={(e) => onFilterChange('minValue', e.target.value)}
//               />
//               <input
//                 type="number"
//                 className="input input-bordered input-xs flex-1"
//                 placeholder="Max"
//                 value={filters.maxValue || ''}
//                 onChange={(e) => onFilterChange('maxValue', e.target.value)}
//               />
//             </div>
//           </div>

//           <div className="form-control">
//             <label className="label">
//               <span className="label-text text-xs">Status</span>
//             </label>
//             <select
//               className="select select-bordered select-xs"
//               value={filters.statusFilter || ''}
//               onChange={(e) => onFilterChange('statusFilter', e.target.value)}
//             >
//               <option value="">All Status</option>
//               <option value="complete">Complete</option>
//               <option value="in-progress">In Progress</option>
//               <option value="pending">Pending</option>
//             </select>
//           </div>

//           <div className="form-control">
//             <label className="label">
//               <span className="label-text text-xs">Section</span>
//             </label>
//             <select
//               className="select select-bordered select-xs"
//               value={filters.sectionFilter || ''}
//               onChange={(e) => onFilterChange('sectionFilter', e.target.value)}
//             >
//               <option value="">All Sections</option>
//               {sections.map(section => (
//                 <option key={section} value={section}>{section}</option>
//               ))}
//             </select>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// });

// AdvancedFiltersPanel.displayName = "AdvancedFiltersPanel";

// // Column Visibility Manager
// const ColumnVisibilityManager = React.memo(({ columns, visibleColumns, onToggle }) => {
//   const [isOpen, setIsOpen] = useState(false);

//   return (
//     <div className="relative">
//       <button
//         className="btn btn-ghost btn-xs gap-1"
//         onClick={() => setIsOpen(!isOpen)}
//       >
//         <span>⚙️</span>
//         Columns
//         <span>{isOpen ? '▲' : '▼'}</span>
//       </button>

//       {isOpen && (
//         <div className="absolute right-0 mt-2 bg-base-100 shadow-xl p-3 rounded-lg w-52 z-50 border border-gray-200">
//           <div className="font-semibold text-xs mb-2">Toggle Columns</div>
//           <div className="space-y-0.5">
//             {columns.map((col) => (
//               <label
//                 key={col.id}
//                 className="flex gap-2 py-1 px-2 items-center hover:bg-gray-100 rounded cursor-pointer"
//               >
//                 <input
//                   type="checkbox"
//                   checked={visibleColumns.includes(col.id)}
//                   onChange={() => onToggle(col.id)}
//                   disabled={col.required}
//                   className="checkbox checkbox-xs"
//                 />
//                 <span className="text-xs">{col.label}</span>
//                 {col.required && (
//                   <span className="text-[10px] text-gray-400 ml-auto">(req)</span>
//                 )}
//               </label>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// });

// ColumnVisibilityManager.displayName = "ColumnVisibilityManager";

// // ============================================================
// // MAIN COMPONENT
// // ============================================================

// function BalanceSummary() {
//   const { cndata, loading } = useContext(GetDataContext);
//   const [error, setError] = useState(null);

//   // State management with localStorage persistence
//   const [selectedPI, setSelectedPI] = useLocalStorage('balanceSummary_selectedPI', []);
//   const [selectedOrder, setSelectedOrder] = useLocalStorage('balanceSummary_selectedOrder', []);
//   const [selectedLC, setSelectedLC] = useLocalStorage('balanceSummary_selectedLC', []);
//   const [selectedInvoice, setSelectedInvoice] = useLocalStorage('balanceSummary_selectedInvoice', []);
//   const [selectedCustomer, setSelectedCustomer] = useLocalStorage('balanceSummary_selectedCustomer', []);
//   const [selectedMarketing, setSelectedMarketing] = useLocalStorage('balanceSummary_selectedMarketing', []);
//   const [selectedBuyer, setSelectedBuyer] = useLocalStorage('balanceSummary_selectedBuyer', []);
//   const [selectedColumns, setSelectedColumns] = useLocalStorage('balanceSummary_columns', COLUMN_CONFIG.defaultVisible);
//   const [selectedRows, setSelectedRows] = useLocalStorage('balanceSummary_selectedRows', []);

//   // UI State
//   const [search, setSearch] = useState("");
//   const [piSearch, setPiSearch] = useState("");
//   const [orderSearch, setOrderSearch] = useState("");
//   const [lcSearch, setLcSearch] = useState("");
//   const [invoiceSearch, setInvoiceSearch] = useState("");
//   const [customerSearch, setCustomerSearch] = useState("");
//   const [marketingSearch, setMarketingSearch] = useState("");
//   const [buyerSearch, setBuyerSearch] = useState("");
//   const [piOpen, setPiOpen] = useState(false);
//   const [orderOpen, setOrderOpen] = useState(false);
//   const [lcOpen, setLcOpen] = useState(false);
//   const [invoiceOpen, setInvoiceOpen] = useState(false);
//   const [customerOpen, setCustomerOpen] = useState(false);
//   const [marketingOpen, setMarketingOpen] = useState(false);
//   const [buyerOpen, setBuyerOpen] = useState(false);
  
//   // Advanced filters state
//   const [dateRange, setDateRange] = useState({ start: "", end: "" });
//   const [minValue, setMinValue] = useState("");
//   const [maxValue, setMaxValue] = useState("");
//   const [statusFilter, setStatusFilter] = useState("");
//   const [sectionFilter, setSectionFilter] = useState("");

//   // Refs
//   const piRef = useRef(null);
//   const orderRef = useRef(null);
//   const lcRef = useRef(null);
//   const invoiceRef = useRef(null);
//   const customerRef = useRef(null);
//   const marketingRef = useRef(null);
//   const buyerRef = useRef(null);

//   // Debounced search
//   const debouncedSearch = useDebounce(search);

//   // Data processing
//   const maps = useDataMaps(cndata);
//   const summarizedData = useSummarizedData(cndata, maps);

//   // Get unique values for filters
//   const uniqueSections = useMemo(() => {
//     return [...new Set(summarizedData.map(d => d.Section).filter(Boolean))];
//   }, [summarizedData]);

//   const uniquePI = useMemo(() => {
//     return [...new Set(summarizedData.map((d) => d.PINO || "No PI"))];
//   }, [summarizedData]);

//   const uniqueOrder = useMemo(() => {
//     return [
//       ...new Set(
//         summarizedData.map((d) => String(d.WorkOrderNo).trim()).filter(Boolean)
//       ),
//     ];
//   }, [summarizedData]);

//   const uniqueLC = useMemo(() => {
//     return [
//       ...new Set(
//         summarizedData.flatMap((d) => d.LCList.map((l) => l.lcNo || "No LC"))
//       ),
//     ];
//   }, [summarizedData]);

//   const uniqueInvoice = useMemo(() => {
//     return [
//       ...new Set(
//         summarizedData.flatMap((d) =>
//           d.InvoiceList.map((i) => i.invoiceNo || "No Invoice")
//         )
//       ),
//     ];
//   }, [summarizedData]);

//   const uniqueCustomers = useMemo(() => {
//     return [...new Set(summarizedData.map((d) => d.CustomerName || "Unknown"))];
//   }, [summarizedData]);

//   const uniqueMarketing = useMemo(() => {
//     return [...new Set(summarizedData.map((d) => d.DeliverName || "Unknown"))];
//   }, [summarizedData]);

//   const uniqueBuyers = useMemo(() => {
//     return [...new Set(summarizedData.map((d) => d.Buyer || "Unknown"))];
//   }, [summarizedData]);

//   // Filtered options
//   const filteredPI = useMemo(
//     () => uniquePI.filter((pi) => pi.toLowerCase().includes(piSearch.toLowerCase())),
//     [uniquePI, piSearch]
//   );

//   const filteredOrder = useMemo(
//     () => uniqueOrder.filter((order) => order.toString().includes(orderSearch)),
//     [uniqueOrder, orderSearch]
//   );

//   const filteredLC = useMemo(
//     () => uniqueLC.filter((lc) => lc.toLowerCase().includes(lcSearch.toLowerCase())),
//     [uniqueLC, lcSearch]
//   );

//   const filteredInvoice = useMemo(
//     () => uniqueInvoice.filter((inv) => inv.toLowerCase().includes(invoiceSearch.toLowerCase())),
//     [uniqueInvoice, invoiceSearch]
//   );

//   const filteredCustomers = useMemo(
//     () => uniqueCustomers.filter((c) => c.toLowerCase().includes(customerSearch.toLowerCase())),
//     [uniqueCustomers, customerSearch]
//   );

//   const filteredMarketing = useMemo(
//     () => uniqueMarketing.filter((m) => m.toLowerCase().includes(marketingSearch.toLowerCase())),
//     [uniqueMarketing, marketingSearch]
//   );

//   const filteredBuyers = useMemo(
//     () => uniqueBuyers.filter((b) => b.toLowerCase().includes(buyerSearch.toLowerCase())),
//     [uniqueBuyers, buyerSearch]
//   );

//   // Prepare filters object
//   const filters = useMemo(() => ({
//     selectedPI,
//     selectedOrder,
//     selectedLC,
//     selectedInvoice,
//     selectedCustomer,
//     selectedMarketing,
//     selectedBuyer,
//     dateRange,
//     minValue,
//     maxValue,
//     statusFilter,
//     sectionFilter
//   }), [selectedPI, selectedOrder, selectedLC, selectedInvoice, selectedCustomer, selectedMarketing, selectedBuyer, dateRange, minValue, maxValue, statusFilter, sectionFilter]);

//   // Apply all filters
//   const filteredData = useFilters(
//     summarizedData,
//     filters,
//     debouncedSearch
//   );

//   // Pagination
//   const { 
//     currentPage, 
//     setCurrentPage, 
//     pageCount, 
//     displayedData, 
//     totalData, 
//     grandTotal,
//     totalItems 
//   } = usePagination(filteredData);

//   // Toggle handlers
//   const togglePI = useCallback((value) => {
//     if (Array.isArray(value)) {
//       setSelectedPI(value);
//     } else {
//       setSelectedPI(prev => 
//         prev.includes(value) ? prev.filter(p => p !== value) : [...prev, value]
//       );
//     }
//     setCurrentPage(0);
//   }, [setSelectedPI, setCurrentPage]);

//   const toggleOrder = useCallback((value) => {
//     const val = String(value).trim();
//     if (Array.isArray(value)) {
//       setSelectedOrder(value.map(v => String(v).trim()));
//     } else {
//       setSelectedOrder(prev => 
//         prev.includes(val) ? prev.filter(o => o !== val) : [...prev, val]
//       );
//     }
//     setCurrentPage(0);
//   }, [setSelectedOrder, setCurrentPage]);

//   const toggleLC = useCallback((value) => {
//     if (Array.isArray(value)) {
//       setSelectedLC(value);
//     } else {
//       setSelectedLC(prev => 
//         prev.includes(value) ? prev.filter(x => x !== value) : [...prev, value]
//       );
//     }
//     setCurrentPage(0);
//   }, [setSelectedLC, setCurrentPage]);

//   const toggleInvoice = useCallback((value) => {
//     if (Array.isArray(value)) {
//       setSelectedInvoice(value);
//     } else {
//       setSelectedInvoice(prev => 
//         prev.includes(value) ? prev.filter(x => x !== value) : [...prev, value]
//       );
//     }
//     setCurrentPage(0);
//   }, [setSelectedInvoice, setCurrentPage]);

//   const toggleCustomer = useCallback((value) => {
//     if (Array.isArray(value)) {
//       setSelectedCustomer(value);
//     } else {
//       setSelectedCustomer(prev => 
//         prev.includes(value) ? prev.filter(x => x !== value) : [...prev, value]
//       );
//     }
//     setCurrentPage(0);
//   }, [setSelectedCustomer, setCurrentPage]);

//   const toggleMarketing = useCallback((value) => {
//     if (Array.isArray(value)) {
//       setSelectedMarketing(value);
//     } else {
//       setSelectedMarketing(prev => 
//         prev.includes(value) ? prev.filter(x => x !== value) : [...prev, value]
//       );
//     }
//     setCurrentPage(0);
//   }, [setSelectedMarketing, setCurrentPage]);

//   const toggleBuyer = useCallback((value) => {
//     if (Array.isArray(value)) {
//       setSelectedBuyer(value);
//     } else {
//       setSelectedBuyer(prev => 
//         prev.includes(value) ? prev.filter(x => x !== value) : [...prev, value]
//       );
//     }
//     setCurrentPage(0);
//   }, [setSelectedBuyer, setCurrentPage]);

//   const toggleColumn = useCallback((column) => {
//     setSelectedColumns(prev =>
//       prev.includes(column) ? prev.filter(c => c !== column) : [...prev, column]
//     );
//   }, [setSelectedColumns]);

//   // Reset all filters
//   const resetFilters = useCallback(() => {
//     setSelectedPI([]);
//     setSelectedOrder([]);
//     setSelectedLC([]);
//     setSelectedInvoice([]);
//     setSelectedCustomer([]);
//     setSelectedMarketing([]);
//     setSelectedBuyer([]);
//     setSearch("");
//     setDateRange({ start: "", end: "" });
//     setMinValue("");
//     setMaxValue("");
//     setStatusFilter("");
//     setSectionFilter("");
//     setPiSearch("");
//     setOrderSearch("");
//     setLcSearch("");
//     setInvoiceSearch("");
//     setCustomerSearch("");
//     setMarketingSearch("");
//     setBuyerSearch("");
//     setCurrentPage(0);
//     toast.info("All filters have been reset");
//   }, [setSelectedPI, setSelectedOrder, setSelectedLC, setSelectedInvoice, setSelectedCustomer, setSelectedMarketing, setSelectedBuyer, setCurrentPage]);

//   // Handle filter changes
//   const handleFilterChange = useCallback((key, value) => {
//     const setters = {
//       dateRange: setDateRange,
//       minValue: setMinValue,
//       maxValue: setMaxValue,
//       statusFilter: setStatusFilter,
//       sectionFilter: setSectionFilter
//     };
//     if (setters[key]) {
//       setters[key](value);
//     }
//     setCurrentPage(0);
//   }, [setCurrentPage]);

//   // Click outside handler
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (piRef.current && !piRef.current.contains(event.target)) setPiOpen(false);
//       if (orderRef.current && !orderRef.current.contains(event.target)) setOrderOpen(false);
//       if (lcRef.current && !lcRef.current.contains(event.target)) setLcOpen(false);
//       if (invoiceRef.current && !invoiceRef.current.contains(event.target)) setInvoiceOpen(false);
//       if (customerRef.current && !customerRef.current.contains(event.target)) setCustomerOpen(false);
//       if (marketingRef.current && !marketingRef.current.contains(event.target)) setMarketingOpen(false);
//       if (buyerRef.current && !buyerRef.current.contains(event.target)) setBuyerOpen(false);
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   // Keyboard shortcuts
//   useEffect(() => {
//     const handleKeyDown = (e) => {
//       if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
//         e.preventDefault();
//         document.getElementById('global-search')?.focus();
//       }
//       if (e.key === 'Escape') {
//         setSearch('');
//       }
//       if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
//         e.preventDefault();
//         if (displayedData.length > 0) {
//           setSelectedRows(displayedData.map(d => d.WorkOrderNo));
//           toast.info(`Selected ${displayedData.length} items`);
//         }
//       }
//     };

//     document.addEventListener('keydown', handleKeyDown);
//     return () => document.removeEventListener('keydown', handleKeyDown);
//   }, [displayedData, setSelectedRows]);

//   // Handle row click
//   const handleRowClick = useCallback((item) => {
//     const details = [
//       `Order: ${item.WorkOrderNo}`,
//       `Customer: ${item.CustomerName}`,
//       `PI: ${item.PINO}`,
//       `Value: $${item.TotalValue}`,
//       `Status: ${item.completionRate}% complete`
//     ];
//     toast.info(details.join(' • '));
//   }, []);

//   // Handle row select
//   const handleRowSelect = useCallback((rows) => {
//     setSelectedRows(rows);
//   }, [setSelectedRows]);

//   // Error handling
//   useEffect(() => {
//     if (error) {
//       toast.error(error);
//     }
//   }, [error]);

//   // Loading state
//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-64">
//         <FourSquare color="#32cd32" size="large" />
//       </div>
//     );
//   }

//   return (
//     <div className="container mx-auto px-3 py-4">
//       <OrderForm />

//       {/* Header */}
//       <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
//         <div>
//           <h1 className="text-xl font-bold text-gray-800">Order Balance Summary</h1>
//           <p className="text-xs text-gray-500">
//             {totalItems} orders • {summarizedData.length} total items
//           </p>
//         </div>
//         <div className="flex gap-1 flex-wrap">
//           <ColumnVisibilityManager
//             columns={COLUMN_CONFIG.allColumns}
//             visibleColumns={selectedColumns}
//             onToggle={toggleColumn}
//           />
//         </div>
//       </div>

//       {/* Top 4 Analytics */}
//       <TopItemsAnalytics data={filteredData} />

//       {/* Quick Stats */}
//       {grandTotal.TotalQty > 0 && (
//         <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
//           <div className="stat bg-base-100 rounded-lg shadow-sm p-2">
//             <div className="stat-title text-[10px]">Total Orders</div>
//             <div className="stat-value text-base">{totalItems}</div>
//           </div>
//           <div className="stat bg-base-100 rounded-lg shadow-sm p-2">
//             <div className="stat-title text-[10px]">Total Qty</div>
//             <div className="stat-value text-base text-primary">{Math.ceil(grandTotal.TotalQty)}</div>
//           </div>
//           <div className="stat bg-base-100 rounded-lg shadow-sm p-2">
//             <div className="stat-title text-[10px]">Challan Qty</div>
//             <div className="stat-value text-base text-success">{Math.ceil(grandTotal.ChallanQTY)}</div>
//           </div>
//           <div className="stat bg-base-100 rounded-lg shadow-sm p-2">
//             <div className="stat-title text-[10px]">Balance Qty</div>
//             <div className="stat-value text-base text-error">{Math.ceil(grandTotal.BalanceQty)}</div>
//           </div>
//           <div className="stat bg-base-100 rounded-lg shadow-sm p-2">
//             <div className="stat-title text-[10px]">Total Value</div>
//             <div className="stat-value text-base text-info">${Math.ceil(grandTotal.TotalValue)}</div>
//           </div>
//           <div className="stat bg-base-100 rounded-lg shadow-sm p-2">
//             <div className="stat-title text-[10px]">Completion</div>
//             <div className="stat-value text-base">
//               {grandTotal.TotalQty > 0 
//                 ? Math.round((grandTotal.ChallanQTY / grandTotal.TotalQty) * 100)
//                 : 0}%
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Advanced Filters */}
//       <div className="mb-3">
//         <AdvancedFiltersPanel
//           filters={{ dateRange, minValue, maxValue, statusFilter, sectionFilter }}
//           onFilterChange={handleFilterChange}
//           onReset={resetFilters}
//           totalItems={totalItems}
//           loading={loading}
//           sections={uniqueSections}
//         />
//       </div>

//       {/* Search and Quick Filters */}
//       <div className="flex flex-wrap gap-1 mb-3 items-center">
//         <div className="flex-1 min-w-[150px]">
//           <input
//             id="global-search"
//             type="text"
//             placeholder="Search orders, customers, PI..."
//             className="input input-bordered input-xs w-full"
//             value={search}
//             onChange={(e) => { setSearch(e.target.value); setCurrentPage(0); }}
//           />
//         </div>

//         <ProfessionalFilterDropdown
//           label="Order"
//           open={orderOpen}
//           setOpen={setOrderOpen}
//           items={filteredOrder}
//           selectedItems={selectedOrder}
//           onToggle={toggleOrder}
//           searchValue={orderSearch}
//           setSearchValue={setOrderSearch}
//           ref={orderRef}
//           placeholder="Search Order"
//           color="primary"
//         />

//         <ProfessionalFilterDropdown
//           label="PI"
//           open={piOpen}
//           setOpen={setPiOpen}
//           items={filteredPI}
//           selectedItems={selectedPI}
//           onToggle={togglePI}
//           searchValue={piSearch}
//           setSearchValue={setPiSearch}
//           ref={piRef}
//           placeholder="Search PI"
//           color="secondary"
//         />

//         <ProfessionalFilterDropdown
//           label="LC"
//           open={lcOpen}
//           setOpen={setLcOpen}
//           items={filteredLC}
//           selectedItems={selectedLC}
//           onToggle={toggleLC}
//           searchValue={lcSearch}
//           setSearchValue={setLcSearch}
//           ref={lcRef}
//           placeholder="Search LC"
//           color="info"
//         />

//         <ProfessionalFilterDropdown
//           label="Invoice"
//           open={invoiceOpen}
//           setOpen={setInvoiceOpen}
//           items={filteredInvoice}
//           selectedItems={selectedInvoice}
//           onToggle={toggleInvoice}
//           searchValue={invoiceSearch}
//           setSearchValue={setInvoiceSearch}
//           ref={invoiceRef}
//           placeholder="Search Invoice"
//           color="success"
//         />

//         <ProfessionalFilterDropdown
//           label="Customer"
//           open={customerOpen}
//           setOpen={setCustomerOpen}
//           items={filteredCustomers}
//           selectedItems={selectedCustomer}
//           onToggle={toggleCustomer}
//           searchValue={customerSearch}
//           setSearchValue={setCustomerSearch}
//           ref={customerRef}
//           placeholder="Search Customer"
//           color="purple"
//           icon="👤"
//         />

//         <ProfessionalFilterDropdown
//           label="Marketing"
//           open={marketingOpen}
//           setOpen={setMarketingOpen}
//           items={filteredMarketing}
//           selectedItems={selectedMarketing}
//           onToggle={toggleMarketing}
//           searchValue={marketingSearch}
//           setSearchValue={setMarketingSearch}
//           ref={marketingRef}
//           placeholder="Search Marketing"
//           color="orange"
//           icon="📊"
//         />

//         <ProfessionalFilterDropdown
//           label="Buyer"
//           open={buyerOpen}
//           setOpen={setBuyerOpen}
//           items={filteredBuyers}
//           selectedItems={selectedBuyer}
//           onToggle={toggleBuyer}
//           searchValue={buyerSearch}
//           setSearchValue={setBuyerSearch}
//           ref={buyerRef}
//           placeholder="Search Buyer"
//           color="pink"
//           icon="👤"
//         />

//         {(selectedPI.length > 0 || selectedOrder.length > 0 || 
//           selectedLC.length > 0 || selectedInvoice.length > 0 || 
//           selectedCustomer.length > 0 || selectedMarketing.length > 0 ||
//           selectedBuyer.length > 0 || search ||
//           dateRange.start || dateRange.end || minValue || maxValue ||
//           statusFilter || sectionFilter) && (
//           <button
//             className="btn btn-ghost btn-xs"
//             onClick={resetFilters}
//           >
//             Clear All
//           </button>
//         )}
//       </div>

//       {/* Table */}
//       <ProfessionalSummaryTable
//         data={displayedData}
//         columns={selectedColumns}
//         totalData={totalData}
//         onRowClick={handleRowClick}
//         onRowSelect={handleRowSelect}
//         selectedRows={selectedRows}
//         loading={loading}
//       />

//       {/* Pagination */}
//       {pageCount > 1 && (
//         <div className="flex flex-wrap justify-between items-center mt-3 gap-2">
//           <div className="text-xs text-gray-500">
//             Showing {currentPage * CONFIG.ITEMS_PER_PAGE + 1} to{' '}
//             {Math.min((currentPage + 1) * CONFIG.ITEMS_PER_PAGE, totalItems)} of{' '}
//             {totalItems} entries
//           </div>
//           <ReactPaginate
//             breakLabel="..."
//             nextLabel="Next →"
//             previousLabel="← Previous"
//             pageCount={pageCount}
//             onPageChange={({ selected }) => setCurrentPage(selected)}
//             containerClassName="flex gap-0.5"
//             pageLinkClassName="px-2 py-1 border rounded text-xs hover:bg-gray-100 transition-colors"
//             activeLinkClassName="bg-primary text-white hover:bg-primary"
//             previousLinkClassName="px-2 py-1 border rounded text-xs hover:bg-gray-100 transition-colors"
//             nextLinkClassName="px-2 py-1 border rounded text-xs hover:bg-gray-100 transition-colors"
//             disabledClassName="opacity-50 cursor-not-allowed"
//             renderOnZeroPageCount={null}
//           />
//         </div>
//       )}

//       {/* Footer */}
//       <div className="mt-4 text-center text-[10px] text-gray-400 border-t pt-3">
//         <p>
//           {totalItems} orders loaded • Last updated: {new Date().toLocaleString(CONFIG.DATE_FORMAT)}
//         </p>
//         <div className="flex justify-center gap-3 mt-1">
//           <span>💡 Ctrl+F to search</span>
//           <span>•</span>
//           <span>⌨️ Ctrl+A select all</span>
//           <span>•</span>
//           <span>📋 Click rows for details</span>
//         </div>
//       </div>
//     </div>
//   );
// }

// BalanceSummary.propTypes = {};

// export default BalanceSummary;





//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// /* PI Summary - Ultimate Enterprise Edition with ALL Features */

// import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
// import { GetDataContext } from "../components/DataContext";
// import { FourSquare } from "react-loading-indicators";
// import OrderForm from "../OrderReport/OrderForm";
// import * as XLSX from "xlsx-js-style";
// import ReactPaginate from "react-paginate";
// import { toast } from "react-toastify";
// import PropTypes from "prop-types";

// // ============================================================
// // CONSTANTS & CONFIGURATION
// // ============================================================

// const CONFIG = {
//   ITEMS_PER_PAGE: 50,
//   MAX_EXCEL_ROWS: 10000,
//   DEBOUNCE_DELAY: 300,
//   MAX_CHALLAN_DISPLAY: 5,
//   DATE_FORMAT: "en-GB",
//   CURRENCY_SYMBOL: "$",
//   EXCEL_MAX_WIDTH: 25,
//   AUTO_REFRESH_INTERVAL: 60000,
//   TOP_ITEMS_COUNT: 4,
//   MAX_HISTORY_ITEMS: 50,
//   CACHE_DURATION: 300000,
// };

// const COLUMN_CONFIG = {
//   defaultVisible: [
//     "Order", "Date", "Customer", "Delivery", "Buyer", "PI", 
//     "LC", "Invoice", "Section", "OrderQty", "ChallanQty", 
//     "BalanceQty", "OrderValue", "ChallanValue", "BalanceValue", "Challan"
//   ],
//   allColumns: [
//     { id: "Order", label: "Order No", required: true },
//     { id: "Date", label: "Date", required: true },
//     { id: "Customer", label: "Customer", required: true },
//     { id: "Delivery", label: "Delivery", required: true },
//     { id: "Buyer", label: "Buyer", required: true },
//     { id: "PI", label: "PI No", required: false },
//     { id: "LC", label: "LC No", required: false },
//     { id: "Invoice", label: "Invoice No", required: false },
//     { id: "Section", label: "Section", required: true },
//     { id: "OrderQty", label: "Order Qty", required: true },
//     { id: "ChallanQty", label: "Challan Qty", required: true },
//     { id: "BalanceQty", label: "Balance Qty", required: true },
//     { id: "OrderValue", label: "Order Value", required: true },
//     { id: "ChallanValue", label: "Challan Value", required: true },
//     { id: "BalanceValue", label: "Balance Value", required: true },
//     { id: "Challan", label: "Challan", required: false },
//   ]
// };

// // Random Light Weight Backgrounds
// const BACKGROUNDS = [
//   { gradient: 'bg-gradient-to-br from-blue-50 to-indigo-100', pattern: 'pattern-dots' },
//   { gradient: 'bg-gradient-to-tr from-purple-50 to-pink-100', pattern: 'pattern-grid' },
//   { gradient: 'bg-gradient-to-bl from-green-50 to-teal-100', pattern: 'pattern-cross' },
//   { gradient: 'bg-gradient-to-tl from-yellow-50 to-orange-100', pattern: 'pattern-diamond' },
//   { gradient: 'bg-gradient-to-r from-red-50 to-pink-100', pattern: 'pattern-stripe' },
//   { gradient: 'bg-gradient-to-l from-indigo-50 to-blue-100', pattern: 'pattern-wave' },
//   { gradient: 'bg-gradient-to-b from-emerald-50 to-cyan-100', pattern: 'pattern-circle' },
//   { gradient: 'bg-gradient-to-t from-rose-50 to-red-100', pattern: 'pattern-hex' },
//   { gradient: 'bg-gradient-to-br from-amber-50 to-yellow-100', pattern: 'pattern-triangle' },
//   { gradient: 'bg-gradient-to-bl from-violet-50 to-purple-100', pattern: 'pattern-square' },
// ];

// // ============================================================
// // CUSTOM HOOKS
// // ============================================================

// const useDebounce = (value, delay = CONFIG.DEBOUNCE_DELAY) => {
//   const [debouncedValue, setDebouncedValue] = useState(value);

//   useEffect(() => {
//     const handler = setTimeout(() => {
//       setDebouncedValue(value);
//     }, delay);

//     return () => clearTimeout(handler);
//   }, [value, delay]);

//   return debouncedValue;
// };

// const useLocalStorage = (key, initialValue) => {
//   const [storedValue, setStoredValue] = useState(() => {
//     try {
//       const item = window.localStorage.getItem(key);
//       return item ? JSON.parse(item) : initialValue;
//     } catch (error) {
//       console.error("Error reading localStorage:", error);
//       return initialValue;
//     }
//   });

//   const setValue = useCallback((value) => {
//     try {
//       const valueToStore = value instanceof Function ? value(storedValue) : value;
//       setStoredValue(valueToStore);
//       window.localStorage.setItem(key, JSON.stringify(valueToStore));
//     } catch (error) {
//       console.error("Error saving to localStorage:", error);
//     }
//   }, [key, storedValue]);

//   return [storedValue, setValue];
// };

// const useDataMaps = (cndata) => {
//   return useMemo(() => {
//     const challanMap = new Map();
//     const lcMap = new Map();
//     const invoiceMap = new Map();

//     try {
//       (cndata?.grupChallan ?? []).forEach((c) => {
//         challanMap.set(`${c.workOrderNo}-${c.challanNo}`, c.statusDesc);
//       });

//       (cndata?.bblcData ?? []).forEach((item) => {
//         const pi = item.customerPINo?.trim();
//         if (!pi) return;
//         if (!lcMap.has(pi)) lcMap.set(pi, []);
//         lcMap.get(pi).push({
//           lcNo: item.lcNo,
//           lcDate: item.lcDate,
//           totalLCValue: item.totalLCValue,
//         });
//       });

//       (cndata?.invoiceData ?? []).forEach((item) => {
//         if (!item.lcNo) return;
//         if (!invoiceMap.has(item.lcNo)) invoiceMap.set(item.lcNo, []);
//         invoiceMap.get(item.lcNo).push({
//           invoiceNo: item.invoiceNo,
//           invoiceDate: item.invoiceDate,
//           totalInvoiceValue: item.totalInvoiceValue,
//         });
//       });
//     } catch (error) {
//       console.error("Error building data maps:", error);
//     }

//     return { challanMap, lcMap, invoiceMap };
//   }, [cndata]);
// };

// const useSummarizedData = (cndata, maps) => {
//   return useMemo(() => {
//     const apidata = cndata?.apiData ?? [];
//     const { challanMap, lcMap, invoiceMap } = maps;

//     try {
//       const grouped = new Map();

//       apidata.forEach((item) => {
//         const key = `${item.WorkOrderNo}-${item.CustomerPINo}`;
        
//         if (!grouped.has(key)) {
//           grouped.set(key, {
//             WorkOrderNo: item.WorkOrderNo,
//             OrderReceiveDate: item.OrderReceiveDate,
//             DeliverName: item.FName,
//             CustomerName: item.CName,
//             PINO: item.CustomerPINo || "No PI",
//             Section: item.ProductCategoryName,
//             Buyer: item.BuyerName,
//             TotalQty: 0,
//             TotalValue: 0,
//             ChallanQTY: 0,
//             ChallanValue: 0,
//             BalanceQty: 0,
//             BalanceValue: 0,
//             ChallanNo: [],
//             itemCount: 0,
//           });
//         }

//         const row = grouped.get(key);
//         row.TotalQty += Number(item.BreakDownQTY) || 0;
//         row.ChallanQTY += Number(item.ChallanQTY) || 0;
//         row.BalanceQty += Number(item.BalanceQTY) || 0;
//         row.TotalValue += Number(item.TotalOrderValue) || 0;
//         row.ChallanValue += Number(item.ChallanValue) || 0;
//         row.BalanceValue += Number(item.BalanceValue) || 0;
//         row.itemCount += 1;

//         if (item.ChallanNo) {
//           item.ChallanNo.split(",")
//             .map((c) => c.trim())
//             .filter(Boolean)
//             .forEach((cn) => {
//               const status = challanMap.get(`${item.WorkOrderNo}-${cn}`) || "Unknown";
//               const exists = row.ChallanNo.some((c) => c.challanNo === cn);
//               if (!exists) {
//                 row.ChallanNo.push({ challanNo: cn, status });
//               }
//             });
//         }
//       });

//       return Array.from(grouped.values()).map((item) => {
//         const lcInfoList = (lcMap.get(item.PINO) || []).filter((lc) => lc.lcNo);
//         const invoiceInfoList = lcInfoList
//           .flatMap((lc) => invoiceMap.get(lc.lcNo) || [])
//           .filter((inv) => inv.invoiceNo);

//         return {
//           ...item,
//           LCList: lcInfoList,
//           InvoiceList: invoiceInfoList,
//           completionRate: item.TotalQty > 0 
//             ? ((item.ChallanQTY / item.TotalQty) * 100).toFixed(1) 
//             : 0,
//         };
//       });
//     } catch (error) {
//       console.error("Error summarizing data:", error);
//       return [];
//     }
//   }, [cndata, maps]);
// };

// const useFilters = (summarizedData, filters, search) => {
//   const normalize = useCallback((v) => String(v || "").trim().toLowerCase(), []);

//   return useMemo(() => {
//     const searchValue = normalize(search);
//     const { 
//       selectedPI, selectedOrder, selectedLC, selectedInvoice,
//       selectedCustomer, selectedBuyer,
//       dateRange, minValue, maxValue, statusFilter, sectionFilter,
//       favorites, showFavoritesOnly
//     } = filters;

//     const selectedPISet = new Set(selectedPI.map(normalize));
//     const selectedOrderSet = new Set(selectedOrder.map(normalize));
//     const selectedLCSet = new Set(selectedLC.map(normalize));
//     const selectedInvoiceSet = new Set(selectedInvoice.map(normalize));
//     const selectedCustomerSet = new Set(selectedCustomer.map(normalize));
//     const selectedBuyerSet = new Set(selectedBuyer.map(normalize));
//     const favoritesSet = new Set(favorites);

//     try {
//       return summarizedData
//         .filter((item) => {
//           const workOrder = normalize(item.WorkOrderNo);
//           const customer = normalize(item.CustomerName);
//           const delivery = normalize(item.DeliverName);
//           const buyer = normalize(item.Buyer);
//           const pi = normalize(item.PINO || "No PI");
//           const lc = normalize(
//             (item.LCList || []).map((l) => l.lcNo).join(",") || "No LC"
//           );
//           const invoice = normalize(
//             (item.InvoiceList || []).map((i) => i.invoiceNo).join(",") || "No Invoice"
//           );

//           const searchMatch =
//             !searchValue ||
//             workOrder.includes(searchValue) ||
//             customer.includes(searchValue) ||
//             delivery.includes(searchValue) ||
//             pi.includes(searchValue) ||
//             buyer.includes(searchValue) ||
//             lc.includes(searchValue) ||
//             invoice.includes(searchValue);

//           const piMatch =
//             selectedPISet.size === 0 || selectedPISet.has(normalize(item.PINO || "No PI"));
//           const lcMatch =
//             selectedLCSet.size === 0 ||
//             (item.LCList || []).some((l) => selectedLCSet.has(normalize(l.lcNo)));
//           const invoiceMatch =
//             selectedInvoiceSet.size === 0 ||
//             (item.InvoiceList || []).some((i) => selectedInvoiceSet.has(normalize(i.invoiceNo)));
//           const orderMatch =
//             selectedOrderSet.size === 0 || selectedOrderSet.has(workOrder);
//           const customerMatch =
//             selectedCustomerSet.size === 0 || selectedCustomerSet.has(customer);
//           const buyerMatch =
//             selectedBuyerSet.size === 0 || selectedBuyerSet.has(buyer);

//           const favoriteMatch = !showFavoritesOnly || favoritesSet.has(item.WorkOrderNo);

//           let dateMatch = true;
//           if (dateRange?.start && dateRange?.end) {
//             const orderDate = new Date(item.OrderReceiveDate);
//             const start = new Date(dateRange.start);
//             const end = new Date(dateRange.end);
//             start.setHours(0, 0, 0, 0);
//             end.setHours(23, 59, 59, 999);
//             dateMatch = orderDate >= start && orderDate <= end;
//           }

//           let valueMatch = true;
//           if (minValue || maxValue) {
//             const totalValue = Number(item.TotalValue) || 0;
//             if (minValue && totalValue < Number(minValue)) valueMatch = false;
//             if (maxValue && totalValue > Number(maxValue)) valueMatch = false;
//           }

//           let statusMatch = true;
//           if (statusFilter) {
//             const completion = parseFloat(item.completionRate);
//             if (statusFilter === 'complete' && completion < 100) statusMatch = false;
//             if (statusFilter === 'in-progress' && (completion >= 100 || completion <= 0)) statusMatch = false;
//             if (statusFilter === 'pending' && completion > 0) statusMatch = false;
//           }

//           let sectionMatch = true;
//           if (sectionFilter) {
//             sectionMatch = normalize(item.Section) === normalize(sectionFilter);
//           }

//           return searchMatch && piMatch && orderMatch && lcMatch && 
//                  invoiceMatch && customerMatch && buyerMatch &&
//                  favoriteMatch && dateMatch && valueMatch && statusMatch && sectionMatch;
//         })
//         .sort((a, b) => {
//           const getParts = (val = "") => {
//             const parts = val.split("-");
//             return {
//               num: Number(parts[1]) || 0,
//               year: Number(parts[2]) || 0,
//             };
//           };
//           const A = getParts(a.WorkOrderNo);
//           const B = getParts(b.WorkOrderNo);
//           return B.year !== A.year ? B.year - A.year : B.num - A.num;
//         });
//     } catch (error) {
//       console.error("Error filtering data:", error);
//       return [];
//     }
//   }, [summarizedData, search, filters, normalize]);
// };

// const usePagination = (filteredData, itemsPerPage = CONFIG.ITEMS_PER_PAGE) => {
//   const [currentPage, setCurrentPage] = useState(0);

//   const pageCount = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
//   const displayedData = filteredData.slice(
//     currentPage * itemsPerPage,
//     currentPage * itemsPerPage + itemsPerPage
//   );

//   const totalData = useMemo(() => {
//     return displayedData.reduce(
//       (acc, item) => {
//         acc.TotalQty += Number(item.TotalQty || 0);
//         acc.ChallanQTY += Number(item.ChallanQTY || 0);
//         acc.BalanceQty += Number(item.BalanceQty || 0);
//         acc.TotalValue += Number(item.TotalValue || 0);
//         acc.ChallanValue += Number(item.ChallanValue || 0);
//         acc.BalanceValue += Number(item.BalanceValue || 0);
//         acc.itemCount += 1;
//         return acc;
//       },
//       {
//         TotalQty: 0,
//         ChallanQTY: 0,
//         BalanceQty: 0,
//         TotalValue: 0,
//         ChallanValue: 0,
//         BalanceValue: 0,
//         itemCount: 0,
//       }
//     );
//   }, [displayedData]);

//   const grandTotal = useMemo(() => {
//     return filteredData.reduce(
//       (acc, item) => {
//         acc.TotalQty += Number(item.TotalQty || 0);
//         acc.ChallanQTY += Number(item.ChallanQTY || 0);
//         acc.BalanceQty += Number(item.BalanceQty || 0);
//         acc.TotalValue += Number(item.TotalValue || 0);
//         acc.ChallanValue += Number(item.ChallanValue || 0);
//         acc.BalanceValue += Number(item.BalanceValue || 0);
//         return acc;
//       },
//       {
//         TotalQty: 0,
//         ChallanQTY: 0,
//         BalanceQty: 0,
//         TotalValue: 0,
//         ChallanValue: 0,
//         BalanceValue: 0,
//       }
//     );
//   }, [filteredData]);

//   useEffect(() => {
//     setCurrentPage(0);
//   }, [filteredData.length]);

//   return { 
//     currentPage, 
//     setCurrentPage, 
//     pageCount, 
//     displayedData, 
//     totalData, 
//     grandTotal,
//     totalItems: filteredData.length 
//   };
// };

// // ============================================================
// // ADVANCED COMPONENTS
// // ============================================================

// // 1. RANDOM BACKGROUND GENERATOR
// const BackgroundGenerator = React.memo(({ children, onBackgroundChange }) => {
//   const [currentBg, setCurrentBg] = useState(() => {
//     const randomIndex = Math.floor(Math.random() * BACKGROUNDS.length);
//     return BACKGROUNDS[randomIndex];
//   });
//   const [isHovering, setIsHovering] = useState(false);

//   const changeBackground = useCallback(() => {
//     let newBg;
//     do {
//       const randomIndex = Math.floor(Math.random() * BACKGROUNDS.length);
//       newBg = BACKGROUNDS[randomIndex];
//     } while (newBg === currentBg && BACKGROUNDS.length > 1);
    
//     setCurrentBg(newBg);
//     onBackgroundChange?.(newBg);
//     toast.info('Background theme changed!');
//   }, [currentBg, onBackgroundChange]);

//   return (
//     <div 
//       className={`relative min-h-screen transition-all duration-1000 ${currentBg.gradient}`}
//       onMouseEnter={() => setIsHovering(true)}
//       onMouseLeave={() => setIsHovering(false)}
//     >
//       {/* Background Pattern Overlay */}
//       <div className={`absolute inset-0 opacity-5 pointer-events-none ${
//         currentBg.pattern === 'pattern-dots' ? 'bg-[radial-gradient(#000_1px,transparent_1px)] bg-[length:20px_20px]' :
//         currentBg.pattern === 'pattern-grid' ? 'bg-[linear-gradient(#000_1px,transparent_1px),linear-gradient(90deg,#000_1px,transparent_1px)] bg-[length:20px_20px]' :
//         currentBg.pattern === 'pattern-cross' ? 'bg-[linear-gradient(45deg,#000_2px,transparent_2px),linear-gradient(-45deg,#000_2px,transparent_2px)] bg-[length:20px_20px]' :
//         currentBg.pattern === 'pattern-diamond' ? 'bg-[linear-gradient(45deg,#000_2px,transparent_2px)] bg-[length:20px_20px]' :
//         currentBg.pattern === 'pattern-stripe' ? 'bg-[linear-gradient(45deg,#000_2px,transparent_2px,transparent_4px)] bg-[length:20px_20px]' :
//         currentBg.pattern === 'pattern-wave' ? 'bg-[radial-gradient(circle_at_20px_20px,#000_2px,transparent_2px)] bg-[length:40px_40px]' :
//         currentBg.pattern === 'pattern-circle' ? 'bg-[radial-gradient(#000_2px,transparent_2px)] bg-[length:20px_20px]' :
//         currentBg.pattern === 'pattern-hex' ? 'bg-[linear-gradient(30deg,#000_2px,transparent_2px),linear-gradient(-30deg,#000_2px,transparent_2px)] bg-[length:20px_20px]' :
//         currentBg.pattern === 'pattern-triangle' ? 'bg-[linear-gradient(45deg,#000_2px,transparent_2px,transparent_4px),linear-gradient(-45deg,#000_2px,transparent_2px,transparent_4px)] bg-[length:20px_20px]' :
//         'bg-[linear-gradient(90deg,#000_1px,transparent_1px),linear-gradient(0deg,#000_1px,transparent_1px)] bg-[length:20px_20px]'
//       }`}></div>

//       {/* Background Controls */}
//       <div className={`fixed bottom-4 right-4 z-50 transition-opacity duration-300 ${isHovering ? 'opacity-100' : 'opacity-0'}`}>
//         <button
//           className="btn btn-sm btn-primary text-white shadow-lg rounded-full w-12 h-12 flex items-center justify-center hover:scale-110 transition-transform"
//           onClick={changeBackground}
//           title="Change Background"
//         >
//           <span className="text-xl">🎨</span>
//         </button>
//       </div>

//       {/* Floating Background Indicator */}
//       <div className="fixed bottom-4 left-4 z-50 opacity-20 hover:opacity-100 transition-opacity">
//         <div className="text-xs text-gray-500 bg-white/50 px-2 py-1 rounded-full backdrop-blur-sm">
//           {currentBg.gradient.replace('bg-gradient-to-', '').replace(/from-|to-|br|tr|bl|tl|r|l|b|t/g, '').trim() || 'Default'}
//         </div>
//       </div>

//       {children}
//     </div>
//   );
// });

// BackgroundGenerator.displayName = "BackgroundGenerator";

// // 2. DEEP THINKING FEATURE
// const DeepThinking = React.memo(({ data, onInsight }) => {
//   const [isThinking, setIsThinking] = useState(false);
//   const [thoughts, setThoughts] = useState([]);
//   const [insights, setInsights] = useState([]);
//   const [isExpanded, setIsExpanded] = useState(false);

//   const generateInsights = useCallback(() => {
//     setIsThinking(true);
//     setThoughts([]);
    
//     const thoughtProcess = [
//       { emoji: '🧠', text: 'Analyzing data patterns...', delay: 500 },
//       { emoji: '📊', text: 'Processing order metrics...', delay: 1000 },
//       { emoji: '🔍', text: 'Identifying key trends...', delay: 1500 },
//       { emoji: '💡', text: 'Generating insights...', delay: 2000 },
//       { emoji: '✨', text: 'Finalizing recommendations...', delay: 2500 },
//     ];

//     let currentThought = 0;
//     const interval = setInterval(() => {
//       if (currentThought < thoughtProcess.length) {
//         setThoughts(prev => [...prev, thoughtProcess[currentThought]]);
//         currentThought++;
//       } else {
//         clearInterval(interval);
//         // Generate final insights
//         const newInsights = generateFinalInsights(data);
//         setInsights(newInsights);
//         setIsThinking(false);
//         onInsight?.(newInsights);
//         toast.success('Deep thinking complete! New insights available.');
//       }
//     }, 500);
//   }, [data, onInsight]);

//   const generateFinalInsights = (data) => {
//     const insights = [];
    
//     // Analyze completion rates
//     const completeOrders = data.filter(d => d.completionRate == 100);
//     const inProgressOrders = data.filter(d => d.completionRate > 0 && d.completionRate < 100);
//     const pendingOrders = data.filter(d => d.completionRate == 0);
    
//     insights.push({
//       icon: '📈',
//       title: 'Overall Health',
//       description: `${completeOrders.length} orders complete (${(completeOrders.length/data.length*100||0).toFixed(1)}%)`,
//       priority: 'high'
//     });

//     // Find top customer
//     const customerMap = new Map();
//     data.forEach(d => {
//       customerMap.set(d.CustomerName, (customerMap.get(d.CustomerName) || 0) + Number(d.TotalValue));
//     });
//     const topCustomer = [...customerMap.entries()].sort((a,b) => b[1] - a[1])[0];
//     if (topCustomer) {
//       insights.push({
//         icon: '👤',
//         title: 'Top Customer',
//         description: `${topCustomer[0]} - $${topCustomer[1].toFixed(2)}`,
//         priority: 'medium'
//       });
//     }

//     // Find most active section
//     const sectionMap = new Map();
//     data.forEach(d => {
//       sectionMap.set(d.Section, (sectionMap.get(d.Section) || 0) + Number(d.TotalQty));
//     });
//     const topSection = [...sectionMap.entries()].sort((a,b) => b[1] - a[1])[0];
//     if (topSection) {
//       insights.push({
//         icon: '📦',
//         title: 'Top Section',
//         description: `${topSection[0]} - ${topSection[1].toFixed(0)} units`,
//         priority: 'medium'
//       });
//     }

//     // Check for potential issues
//     const highPending = data.filter(d => Number(d.BalanceValue) > 10000);
//     if (highPending.length > 0) {
//       insights.push({
//         icon: '⚠️',
//         title: 'High Pending Alert',
//         description: `${highPending.length} orders with pending value > $10,000`,
//         priority: 'high'
//       });
//     }

//     const noChallan = data.filter(d => d.ChallanNo.length === 0);
//     if (noChallan.length > 0) {
//       insights.push({
//         icon: '🔴',
//         title: 'No Challan Orders',
//         description: `${noChallan.length} orders without challan`,
//         priority: 'critical'
//       });
//     }

//     // Calculate average order value
//     const avgValue = data.length > 0 ? data.reduce((s,d) => s + Number(d.TotalValue), 0) / data.length : 0;
//     insights.push({
//       icon: '💰',
//       title: 'Average Order Value',
//       description: `$${avgValue.toFixed(2)}`,
//       priority: 'low'
//     });

//     return insights;
//   };

//   const getPriorityColor = (priority) => {
//     switch(priority) {
//       case 'critical': return 'bg-red-100 border-red-300 text-red-700';
//       case 'high': return 'bg-orange-100 border-orange-300 text-orange-700';
//       case 'medium': return 'bg-yellow-100 border-yellow-300 text-yellow-700';
//       default: return 'bg-blue-100 border-blue-300 text-blue-700';
//     }
//   };

//   return (
//     <div className="relative">
//       <button
//         className={`btn ${isThinking ? 'btn-warning' : 'btn-primary'} btn-xs gap-1 text-white transition-all duration-300 ${isThinking ? 'animate-pulse' : ''}`}
//         onClick={generateInsights}
//         disabled={isThinking || data.length === 0}
//         title="Deep Think - AI Analysis"
//       >
//         {isThinking ? '🧠 Thinking...' : '🤔 Deep Think'}
//       </button>

//       {(thoughts.length > 0 || insights.length > 0) && (
//         <button
//           className="btn btn-ghost btn-xs gap-1 ml-1"
//           onClick={() => setIsExpanded(!isExpanded)}
//         >
//           {isExpanded ? '▲' : '▼'}
//           <span className="badge badge-xs badge-info">{insights.length}</span>
//         </button>
//       )}

//       {isExpanded && (thoughts.length > 0 || insights.length > 0) && (
//         <div className="absolute right-0 mt-2 w-96 bg-white shadow-2xl rounded-xl p-4 z-50 border border-gray-200 max-h-96 overflow-y-auto">
//           {isThinking && (
//             <div className="space-y-2 mb-3">
//               <div className="text-xs font-semibold text-gray-500">🧠 Thinking Process</div>
//               {thoughts.map((thought, index) => (
//                 <div key={index} className="flex items-center gap-2 text-sm animate-fadeIn">
//                   <span>{thought.emoji}</span>
//                   <span className="text-gray-700">{thought.text}</span>
//                 </div>
//               ))}
//             </div>
//           )}

//           {insights.length > 0 && (
//             <div className="space-y-2">
//               <div className="text-xs font-semibold text-gray-500">💡 Insights</div>
//               {insights.map((insight, index) => (
//                 <div
//                   key={index}
//                   className={`p-3 rounded-lg border ${getPriorityColor(insight.priority)} animate-slideIn`}
//                   style={{ animationDelay: `${index * 100}ms` }}
//                 >
//                   <div className="flex items-center gap-2">
//                     <span className="text-lg">{insight.icon}</span>
//                     <div className="flex-1">
//                       <div className="font-semibold text-sm">{insight.title}</div>
//                       <div className="text-xs opacity-90">{insight.description}</div>
//                     </div>
//                     {insight.priority === 'critical' && (
//                       <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full animate-pulse">!</span>
//                     )}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}

//           <button
//             className="btn btn-ghost btn-xs w-full mt-3 text-gray-400"
//             onClick={() => { setThoughts([]); setInsights([]); setIsExpanded(false); }}
//           >
//             Close
//           </button>
//         </div>
//       )}
//     </div>
//   );
// });

// DeepThinking.displayName = "DeepThinking";

// // 3. QUICK VIEW BUTTON
// const QuickViewButton = React.memo(({ item, onQuickView }) => {
//   return (
//     <button
//       className="btn btn-ghost btn-xs text-gray-400 hover:text-blue-500 transition-colors"
//       onClick={(e) => {
//         e.stopPropagation();
//         onQuickView(item);
//       }}
//       title="Quick View"
//     >
//       👁️
//     </button>
//   );
// });

// QuickViewButton.displayName = "QuickViewButton";

// // 4. QUICK VIEW MODAL
// const QuickViewModal = React.memo(({ item, isOpen, onClose }) => {
//   if (!isOpen || !item) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
//       <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 shadow-2xl">
//         <div className="flex justify-between items-start mb-4">
//           <h2 className="text-xl font-bold text-gray-800">Order Details</h2>
//           <button 
//             className="btn btn-ghost btn-sm btn-circle hover:bg-gray-100"
//             onClick={onClose}
//           >
//             ✕
//           </button>
//         </div>
//         <div className="space-y-4">
//           <div className="grid grid-cols-2 gap-3">
//             <div className="bg-gray-50 p-3 rounded-lg">
//               <div className="text-xs text-gray-500">Order No</div>
//               <div className="font-semibold">{item.WorkOrderNo}</div>
//             </div>
//             <div className="bg-gray-50 p-3 rounded-lg">
//               <div className="text-xs text-gray-500">Date</div>
//               <div className="font-semibold">{new Date(item.OrderReceiveDate).toLocaleDateString()}</div>
//             </div>
//             <div className="bg-gray-50 p-3 rounded-lg">
//               <div className="text-xs text-gray-500">Customer</div>
//               <div className="font-semibold">{item.CustomerName}</div>
//             </div>
//             <div className="bg-gray-50 p-3 rounded-lg">
//               <div className="text-xs text-gray-500">Delivery</div>
//               <div className="font-semibold">{item.DeliverName}</div>
//             </div>
//             <div className="bg-gray-50 p-3 rounded-lg">
//               <div className="text-xs text-gray-500">Buyer</div>
//               <div className="font-semibold">{item.Buyer}</div>
//             </div>
//             <div className="bg-gray-50 p-3 rounded-lg">
//               <div className="text-xs text-gray-500">PI</div>
//               <div className="font-semibold">{item.PINO}</div>
//             </div>
//             <div className="bg-gray-50 p-3 rounded-lg">
//               <div className="text-xs text-gray-500">Section</div>
//               <div className="font-semibold">{item.Section}</div>
//             </div>
//             <div className="bg-gray-50 p-3 rounded-lg">
//               <div className="text-xs text-gray-500">Status</div>
//               <div className={`font-semibold ${
//                 item.completionRate >= 100 ? 'text-green-600' :
//                 item.completionRate > 50 ? 'text-yellow-600' :
//                 'text-red-600'
//               }`}>
//                 {item.completionRate}% complete
//               </div>
//             </div>
//           </div>

//           <div className="border-t pt-4">
//             <div className="grid grid-cols-3 gap-4 text-center">
//               <div className="bg-blue-50 p-3 rounded-lg">
//                 <div className="text-xs text-gray-500">Order Qty</div>
//                 <div className="font-bold text-blue-600">{item.TotalQty}</div>
//               </div>
//               <div className="bg-green-50 p-3 rounded-lg">
//                 <div className="text-xs text-gray-500">Challan Qty</div>
//                 <div className="font-bold text-green-600">{item.ChallanQTY}</div>
//               </div>
//               <div className="bg-red-50 p-3 rounded-lg">
//                 <div className="text-xs text-gray-500">Balance Qty</div>
//                 <div className="font-bold text-red-600">{item.BalanceQty}</div>
//               </div>
//             </div>
//           </div>

//           <div className="border-t pt-4">
//             <div className="grid grid-cols-3 gap-4 text-center">
//               <div className="bg-indigo-50 p-3 rounded-lg">
//                 <div className="text-xs text-gray-500">Order Value</div>
//                 <div className="font-bold text-indigo-600">${item.TotalValue}</div>
//               </div>
//               <div className="bg-emerald-50 p-3 rounded-lg">
//                 <div className="text-xs text-gray-500">Challan Value</div>
//                 <div className="font-bold text-emerald-600">${item.ChallanValue}</div>
//               </div>
//               <div className="bg-rose-50 p-3 rounded-lg">
//                 <div className="text-xs text-gray-500">Balance Value</div>
//                 <div className="font-bold text-rose-600">${item.BalanceValue}</div>
//               </div>
//             </div>
//           </div>

//           {item.ChallanNo.length > 0 && (
//             <div className="border-t pt-4">
//               <div className="text-xs text-gray-500 mb-2">Challans</div>
//               <div className="space-y-1 max-h-32 overflow-y-auto">
//                 {item.ChallanNo.map((ch, i) => (
//                   <div key={i} className="flex justify-between items-center text-sm border-b pb-1">
//                     <span className="font-mono">{ch.challanNo}</span>
//                     <span className={`text-xs font-medium px-2 py-0.5 rounded ${
//                       ch.status === "Challan Received" ? 'bg-green-100 text-green-700' :
//                       ch.status === "Send to Gate" ? 'bg-yellow-100 text-yellow-700' :
//                       ch.status === "Delivered" ? 'bg-blue-100 text-blue-700' :
//                       ch.status === "Gate Out" ? 'bg-red-100 text-red-700' :
//                       'bg-gray-100 text-gray-700'
//                     }`}>
//                       {ch.status}
//                     </span>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}

//           {/* LC and Invoice Info */}
//           {item.LCList && item.LCList.length > 0 && (
//             <div className="border-t pt-4">
//               <div className="text-xs text-gray-500 mb-2">LC Details</div>
//               <div className="space-y-1">
//                 {item.LCList.map((lc, i) => (
//                   <div key={i} className="text-sm bg-gray-50 p-2 rounded">
//                     <span className="font-mono">{lc.lcNo}</span>
//                     {lc.totalLCValue && (
//                       <span className="ml-2 text-gray-500">${lc.totalLCValue}</span>
//                     )}
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}

//           {item.InvoiceList && item.InvoiceList.length > 0 && (
//             <div className="border-t pt-4">
//               <div className="text-xs text-gray-500 mb-2">Invoice Details</div>
//               <div className="space-y-1">
//                 {item.InvoiceList.map((inv, i) => (
//                   <div key={i} className="text-sm bg-gray-50 p-2 rounded">
//                     <span className="font-mono">{inv.invoiceNo}</span>
//                     {inv.totalInvoiceValue && (
//                       <span className="ml-2 text-gray-500">${inv.totalInvoiceValue}</span>
//                     )}
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// });

// QuickViewModal.displayName = "QuickViewModal";

// // 5. TOP ITEMS ANALYTICS (Without Marketing)
// const TopItemsAnalytics = React.memo(({ data }) => {
//   const topItems = useMemo(() => {
//     // Top 4 Customers by Value
//     const customerMap = new Map();
//     data.forEach(d => {
//       const name = d.CustomerName || "Unknown";
//       customerMap.set(name, {
//         value: (customerMap.get(name)?.value || 0) + Number(d.TotalValue || 0),
//         orders: (customerMap.get(name)?.orders || 0) + 1,
//         qty: (customerMap.get(name)?.qty || 0) + Number(d.TotalQty || 0),
//       });
//     });
//     const topCustomers = [...customerMap.entries()]
//       .sort((a, b) => b[1].value - a[1].value)
//       .slice(0, CONFIG.TOP_ITEMS_COUNT)
//       .map(([name, data]) => ({ name, ...data }));

//     // Top 4 Buyers by Value
//     const buyerMap = new Map();
//     data.forEach(d => {
//       const name = d.Buyer || "Unknown";
//       buyerMap.set(name, {
//         value: (buyerMap.get(name)?.value || 0) + Number(d.TotalValue || 0),
//         orders: (buyerMap.get(name)?.orders || 0) + 1,
//         qty: (buyerMap.get(name)?.qty || 0) + Number(d.TotalQty || 0),
//       });
//     });
//     const topBuyers = [...buyerMap.entries()]
//       .sort((a, b) => b[1].value - a[1].value)
//       .slice(0, CONFIG.TOP_ITEMS_COUNT)
//       .map(([name, data]) => ({ name, ...data }));

//     // Top 4 Orders by Value
//     const orderMap = new Map();
//     data.forEach(d => {
//       const name = d.WorkOrderNo || "Unknown";
//       orderMap.set(name, {
//         value: Number(d.TotalValue || 0),
//         customer: d.CustomerName || "Unknown",
//         qty: Number(d.TotalQty || 0),
//         completion: d.completionRate || 0,
//       });
//     });
//     const topOrders = [...orderMap.entries()]
//       .sort((a, b) => b[1].value - a[1].value)
//       .slice(0, CONFIG.TOP_ITEMS_COUNT)
//       .map(([name, data]) => ({ name, ...data }));

//     // Top 4 Sections by Value
//     const sectionMap = new Map();
//     data.forEach(d => {
//       const name = d.Section || "Unknown";
//       sectionMap.set(name, {
//         value: (sectionMap.get(name)?.value || 0) + Number(d.TotalValue || 0),
//         orders: (sectionMap.get(name)?.orders || 0) + 1,
//         qty: (sectionMap.get(name)?.qty || 0) + Number(d.TotalQty || 0),
//       });
//     });
//     const topSections = [...sectionMap.entries()]
//       .sort((a, b) => b[1].value - a[1].value)
//       .slice(0, CONFIG.TOP_ITEMS_COUNT)
//       .map(([name, data]) => ({ name, ...data }));

//     return { topCustomers, topBuyers, topOrders, topSections };
//   }, [data]);

//   const renderTopCard = (title, items, valueLabel = "Value", showCompletion = false, icon = "🏆") => {
//     if (!items || items.length === 0) {
//       return (
//         <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm p-3 border">
//           <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{icon} {title}</h4>
//           <div className="text-gray-400 text-sm text-center py-4">No data available</div>
//         </div>
//       );
//     }

//     return (
//       <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm p-3 border hover:shadow-md transition-all hover:scale-105">
//         <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{icon} {title}</h4>
//         <div className="space-y-2">
//           {items.map((item, index) => (
//             <div key={index} className="flex items-center justify-between group">
//               <div className="flex items-center gap-2 flex-1 min-w-0">
//                 <span className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full ${
//                   index === 0 ? 'bg-yellow-400 text-yellow-900' :
//                   index === 1 ? 'bg-gray-300 text-gray-700' :
//                   index === 2 ? 'bg-orange-300 text-orange-900' :
//                   'bg-blue-100 text-blue-700'
//                 }`}>
//                   {index + 1}
//                 </span>
//                 <span className="text-sm truncate" title={item.name}>
//                   {item.name}
//                 </span>
//               </div>
//               <div className="flex items-center gap-3 text-xs">
//                 <span className="font-semibold text-blue-600">
//                   ${Number(item.value).toFixed(2)}
//                 </span>
//                 {showCompletion && (
//                   <span className={`px-1.5 py-0.5 rounded ${
//                     item.completion >= 100 ? 'bg-green-100 text-green-700' :
//                     item.completion > 50 ? 'bg-yellow-100 text-yellow-700' :
//                     'bg-red-100 text-red-700'
//                   }`}>
//                     {item.completion}%
//                   </span>
//                 )}
//                 <span className="text-gray-400 text-[10px]">
//                   {item.orders || item.qty || 0} {item.orders ? 'orders' : 'qty'}
//                 </span>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     );
//   };

//   if (data.length === 0) return null;

//   return (
//     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
//       {renderTopCard("Top Customers", topItems.topCustomers, "Value", false, "👤")}
//       {renderTopCard("Top Buyers", topItems.topBuyers, "Value", false, "💼")}
//       {renderTopCard("Top Orders", topItems.topOrders, "Value", true, "📋")}
//       {renderTopCard("Top Sections", topItems.topSections, "Value", false, "📦")}
//     </div>
//   );
// });

// TopItemsAnalytics.displayName = "TopItemsAnalytics";

// // 6. PROFESSIONAL FILTER DROPDOWN (Without Marketing)
// const ProfessionalFilterDropdown = React.memo(({
//   label,
//   open,
//   setOpen,
//   items,
//   selectedItems,
//   onToggle,
//   searchValue,
//   setSearchValue,
//   ref,
//   placeholder = "Search...",
//   color = "blue",
//   showCount = true,
//   icon = null,
// }) => {
//   const [selectAll, setSelectAll] = useState(false);

//   useEffect(() => {
//     setSelectAll(selectedItems.length === items.length && items.length > 0);
//   }, [selectedItems, items]);

//   const handleSelectAll = useCallback(() => {
//     if (selectAll) {
//       onToggle([]);
//     } else {
//       onToggle(items);
//     }
//   }, [selectAll, items, onToggle]);

//   return (
//     <div className="relative" ref={ref}>
//       <button
//         className={`btn btn-outline btn-xs gap-1 transition-all duration-200 hover:shadow-md ${
//           selectedItems.length > 0 ? `border-${color}-500 bg-${color}-50` : ''
//         }`}
//         onClick={() => setOpen(!open)}
//         aria-expanded={open}
//         aria-haspopup="listbox"
//       >
//         {icon && <span className="text-xs">{icon}</span>}
//         <span className="text-[10px]">{label}</span>
//         {showCount && selectedItems.length > 0 && (
//           <span className={`badge badge-${color} badge-xs`}>
//             {selectedItems.length}
//           </span>
//         )}
//         <span className="text-[10px]">{open ? '▲' : '▼'}</span>
//       </button>

//       {open && (
//         <div className="absolute bg-base-100 shadow-xl p-2 rounded-lg w-56 max-h-72 overflow-y-auto z-50 mt-1 border border-gray-200">
//           <div className="flex justify-between items-center mb-2">
//             <span className="font-semibold text-[10px]">{label} Filter</span>
//             <div className="flex gap-2">
//               <button
//                 className="text-[10px] text-blue-600 hover:text-blue-800 font-medium"
//                 onClick={handleSelectAll}
//               >
//                 {selectAll ? 'Deselect All' : 'Select All'}
//               </button>
//               <button
//                 className="text-[10px] text-red-600 hover:text-red-800 font-medium"
//                 onClick={() => onToggle([])}
//               >
//                 Clear
//               </button>
//             </div>
//           </div>

//           <div className="relative mb-2">
//             <input
//               type="text"
//               placeholder={placeholder}
//               className="input input-xs w-full pl-6"
//               value={searchValue}
//               onChange={(e) => setSearchValue(e.target.value)}
//             />
//           </div>

//           <div className="space-y-0.5 max-h-40 overflow-y-auto">
//             {items.length === 0 ? (
//               <div className="text-gray-400 text-[10px] text-center py-2">No items found</div>
//             ) : (
//               items.map((item) => (
//                 <label
//                   key={item}
//                   className="flex gap-2 py-1 px-2 items-center hover:bg-gray-100 rounded cursor-pointer transition-colors"
//                 >
//                   <input
//                     type="checkbox"
//                     checked={selectedItems.includes(item)}
//                     onChange={() => onToggle(item)}
//                     className="checkbox checkbox-xs"
//                   />
//                   <span className="text-[11px] select-none truncate">{item}</span>
//                 </label>
//               ))
//             )}
//           </div>

//           <div className="mt-2 pt-2 border-t border-gray-200 text-[10px] text-gray-500">
//             {selectedItems.length} selected
//           </div>
//         </div>
//       )}
//     </div>
//   );
// });

// ProfessionalFilterDropdown.displayName = "ProfessionalFilterDropdown";

// // 7. ENHANCED CHALLAN CELL
// const EnhancedChallanCell = React.memo(({ challanNo }) => {
//   const [expanded, setExpanded] = useState(false);
//   const displayedChallans = expanded ? challanNo : challanNo.slice(0, CONFIG.MAX_CHALLAN_DISPLAY);
//   const hasMore = challanNo.length > CONFIG.MAX_CHALLAN_DISPLAY;

//   const handleCopy = useCallback(() => {
//     const text = challanNo.map((ch) => `${ch.challanNo} (${ch.status})`).join("\n");
//     navigator.clipboard.writeText(text).then(() => {
//       toast.success("Challans copied!");
//     }).catch(() => {
//       toast.error("Failed to copy");
//     });
//   }, [challanNo]);

//   if (!challanNo || challanNo.length === 0) {
//     return (
//       <div className="text-gray-400 text-[10px] text-center py-2">
//         <span className="opacity-50">No Challan</span>
//       </div>
//     );
//   }

//   return (
//     <div className="border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
//       <div className="flex justify-between items-center bg-gray-50 px-2 py-1 rounded-t-lg border-b">
//         <span className="text-[10px] font-semibold text-gray-600">
//           📋 Challans ({challanNo.length})
//         </span>
//         <div className="flex gap-1">
//           {hasMore && (
//             <button
//               className="text-[10px] text-blue-600 hover:text-blue-800 px-1 py-0.5 rounded hover:bg-blue-50 transition-colors"
//               onClick={() => setExpanded(!expanded)}
//             >
//               {expanded ? 'Show Less' : `+${challanNo.length - CONFIG.MAX_CHALLAN_DISPLAY}`}
//             </button>
//           )}
//           <button
//             className="text-[10px] bg-blue-500 hover:bg-blue-600 text-white px-1.5 py-0.5 rounded transition-colors"
//             onClick={handleCopy}
//           >
//             Copy
//           </button>
//         </div>
//       </div>
//       <div 
//         className="overflow-y-auto p-1.5 space-y-0.5"
//         style={{ maxHeight: expanded ? "200px" : "100px" }}
//       >
//         {displayedChallans.map((ch, i) => (
//           <div
//             key={i}
//             className={`flex justify-between items-center text-[10px] px-2 py-0.5 rounded transition-colors ${
//               ch.status === "Challan Received"
//                 ? "bg-green-50 text-green-700 hover:bg-green-100"
//                 : ch.status === "Send to Gate"
//                 ? "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
//                 : ch.status === "Delivered"
//                 ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
//                 : ch.status === "Gate Out"
//                 ? "bg-red-50 text-red-700 hover:bg-red-100"
//                 : "bg-gray-50 text-gray-600 hover:bg-gray-100"
//             }`}
//           >
//             <span className="font-medium">
//               {i + 1}. {ch.challanNo}
//             </span>
//             <span className={`px-1 py-0.5 rounded text-[8px] font-medium ${
//               ch.status === "Challan Received"
//                 ? "bg-green-200 text-green-800"
//                 : ch.status === "Send to Gate"
//                 ? "bg-yellow-200 text-yellow-800"
//                 : ch.status === "Delivered"
//                 ? "bg-blue-200 text-blue-800"
//                 : ch.status === "Gate Out"
//                 ? "bg-red-200 text-red-800"
//                 : "bg-gray-200 text-gray-800"
//             }`}>
//               {ch.status}
//             </span>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// });

// EnhancedChallanCell.displayName = "EnhancedChallanCell";

// // 8. PROFESSIONAL SUMMARY TABLE (With Quick View at Front)
// const ProfessionalSummaryTable = React.memo(({ 
//   data, 
//   columns, 
//   totalData, 
//   onRowClick,
//   onRowSelect,
//   onQuickView,
//   onFavoriteToggle,
//   selectedRows,
//   favorites,
//   loading,
// }) => {
//   const formatDate = useCallback((dateStr) => {
//     if (!dateStr) return "-";
//     try {
//       return new Date(dateStr).toLocaleDateString(CONFIG.DATE_FORMAT, {
//         day: '2-digit',
//         month: 'short',
//         year: 'numeric'
//       });
//     } catch {
//       return "-";
//     }
//   }, []);

//   const formatCurrency = useCallback((value) => {
//     return `${CONFIG.CURRENCY_SYMBOL}${Number(value).toFixed(2)}`;
//   }, []);

//   const getStatusBadge = useCallback((item) => {
//     const completion = parseFloat(item.completionRate);
//     if (completion === 100) {
//       return <span className="badge badge-success badge-xs">Complete</span>;
//     } else if (completion > 50) {
//       return <span className="badge badge-warning badge-xs">In Progress</span>;
//     } else {
//       return <span className="badge badge-error badge-xs">Pending</span>;
//     }
//   }, []);

//   const handleRowCheck = (item, checked) => {
//     if (checked) {
//       onRowSelect([...selectedRows, item.WorkOrderNo]);
//     } else {
//       onRowSelect(selectedRows.filter(id => id !== item.WorkOrderNo));
//     }
//   };

//   const handleSelectAll = (checked) => {
//     if (checked) {
//       onRowSelect(data.map(d => d.WorkOrderNo));
//     } else {
//       onRowSelect([]);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-64">
//         <div className="loading loading-spinner loading-lg text-primary"></div>
//       </div>
//     );
//   }

//   if (data.length === 0) {
//     return (
//       <div className="text-center py-12">
//         <div className="text-gray-400 text-lg">No data to display</div>
//         <div className="text-gray-300 text-sm mt-2">Try adjusting your filters</div>
//       </div>
//     );
//   }

//   const totalColSpan = 11 + 
//     (columns.includes("PI") ? 1 : 0) +
//     (columns.includes("LC") ? 1 : 0) +
//     (columns.includes("Invoice") ? 1 : 0);

//   return (
//     <div className="max-h-[650px] overflow-y-auto border rounded-xl shadow-sm bg-white/95 backdrop-blur-sm">
//       <table className="table table-xs table-zebra min-w-[1400px]">
//         <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white sticky top-0 z-10">
//           <tr className="text-center text-[10px] uppercase tracking-wider">
//             <th className="py-2 w-8">👁️</th>
//             <th className="py-2 w-8">
//               <input
//                 type="checkbox"
//                 className="checkbox checkbox-xs"
//                 checked={data.length > 0 && selectedRows.length === data.length}
//                 onChange={(e) => handleSelectAll(e.target.checked)}
//               />
//             </th>
//             <th className="py-2 w-8">⭐</th>
//             {columns.includes("Order") && <th className="py-2">Order</th>}
//             <th className="py-2">Date</th>
//             <th className="py-2">Customer</th>
//             <th className="py-2">Delivery</th>
//             <th className="py-2">Buyer</th>
//             {columns.includes("PI") && <th className="py-2">PI</th>}
//             {columns.includes("LC") && <th className="py-2">LC No</th>}
//             {columns.includes("Invoice") && <th className="py-2">Invoice</th>}
//             <th className="py-2">Section</th>
//             <th className="py-2 text-right">Order Qty</th>
//             <th className="py-2 text-right">Challan Qty</th>
//             <th className="py-2 text-right">Balance Qty</th>
//             <th className="py-2 text-right">Order Value</th>
//             <th className="py-2 text-right">Challan Value</th>
//             <th className="py-2 text-right">Balance Value</th>
//             <th className="py-2 text-center">Challan</th>
//             <th className="py-2 text-center">Status</th>
//           </tr>
//         </thead>

//         <tbody>
//           {data.map((item) => (
//             <tr 
//               key={`${item.WorkOrderNo}-${item.PINO}-${item.CustomerName}`}
//               className={`hover:bg-blue-50 transition-colors cursor-pointer ${
//                 selectedRows.includes(item.WorkOrderNo) ? 'bg-blue-100' : ''
//               }`}
//               onClick={() => onRowClick?.(item)}
//             >
//               <td className="px-2 py-1 text-center" onClick={(e) => e.stopPropagation()}>
//                 <QuickViewButton item={item} onQuickView={onQuickView} />
//               </td>
//               <td className="px-2 py-1" onClick={(e) => e.stopPropagation()}>
//                 <input
//                   type="checkbox"
//                   className="checkbox checkbox-xs"
//                   checked={selectedRows.includes(item.WorkOrderNo)}
//                   onChange={(e) => handleRowCheck(item, e.target.checked)}
//                 />
//               </td>
//               <td className="px-2 py-1" onClick={(e) => e.stopPropagation()}>
//                 <button
//                   className={`btn btn-ghost btn-xs ${favorites.includes(item.WorkOrderNo) ? 'text-yellow-500' : 'text-gray-300'}`}
//                   onClick={() => onFavoriteToggle(item.WorkOrderNo)}
//                   title={favorites.includes(item.WorkOrderNo) ? 'Remove from favorites' : 'Add to favorites'}
//                 >
//                   {favorites.includes(item.WorkOrderNo) ? '⭐' : '☆'}
//                 </button>
//               </td>
//               {columns.includes("Order") && (
//                 <td className="px-2 py-1 whitespace-nowrap font-medium text-xs">
//                   {item.WorkOrderNo}
//                 </td>
//               )}
//               <td className="px-2 py-1 whitespace-nowrap text-[11px]">
//                 {formatDate(item.OrderReceiveDate)}
//               </td>
//               <td className="px-2 py-1 whitespace-nowrap font-medium text-xs">
//                 {item.CustomerName}
//               </td>
//               <td className="px-2 py-1 whitespace-nowrap text-xs">{item.DeliverName}</td>
//               <td className="px-2 py-1 whitespace-nowrap text-xs">{item.Buyer}</td>
//               {columns.includes("PI") && (
//                 <td className="px-2 py-1 whitespace-nowrap text-[11px] font-mono">
//                   {item.PINO}
//                 </td>
//               )}
//               {columns.includes("LC") && (
//                 <td className="px-2 py-1 whitespace-nowrap text-[11px] font-mono">
//                   {(item.LCList || []).map((l) => l.lcNo).join(", ") || "-"}
//                 </td>
//               )}
//               {columns.includes("Invoice") && (
//                 <td className="px-2 py-1 whitespace-nowrap text-[11px] font-mono">
//                   {(item.InvoiceList || []).map((i) => i.invoiceNo).join(", ") || "-"}
//                 </td>
//               )}
//               <td className="px-2 py-1 whitespace-nowrap text-xs">{item.Section}</td>
//               <td className="px-2 py-1 whitespace-nowrap text-right font-medium text-xs">
//                 {item.TotalQty.toFixed(2)}
//               </td>
//               <td className="px-2 py-1 whitespace-nowrap text-right text-green-600 font-medium text-xs">
//                 {item.ChallanQTY.toFixed(2)}
//               </td>
//               <td className="px-2 py-1 whitespace-nowrap text-right text-red-600 font-medium text-xs">
//                 {item.BalanceQty.toFixed(2)}
//               </td>
//               <td className="px-2 py-1 whitespace-nowrap text-right text-blue-600 font-semibold text-xs">
//                 {formatCurrency(item.TotalValue)}
//               </td>
//               <td className="px-2 py-1 whitespace-nowrap text-right text-green-600 font-semibold text-xs">
//                 {formatCurrency(item.ChallanValue)}
//               </td>
//               <td className="px-2 py-1 whitespace-nowrap text-right text-red-600 font-semibold text-xs">
//                 {formatCurrency(item.BalanceValue)}
//               </td>
//               <td className="px-2 py-1 text-left min-w-[180px]">
//                 <EnhancedChallanCell challanNo={item.ChallanNo} />
//               </td>
//               <td className="px-2 py-1 text-center">
//                 {getStatusBadge(item)}
//               </td>
//             </tr>
//           ))}
//         </tbody>

//         <tfoot className="sticky bottom-0 bg-blue-100 z-10 border-t-2 border-blue-300">
//           <tr className="font-bold text-xs">
//             <td className="text-right pr-2" colSpan={totalColSpan}>
//               Totals:
//             </td>
//             <td className="text-right">{totalData.TotalQty.toFixed(2)}</td>
//             <td className="text-right text-green-700">{totalData.ChallanQTY.toFixed(2)}</td>
//             <td className="text-right text-red-700">{totalData.BalanceQty.toFixed(2)}</td>
//             <td className="text-right text-blue-700">{formatCurrency(totalData.TotalValue)}</td>
//             <td className="text-right text-green-700">{formatCurrency(totalData.ChallanValue)}</td>
//             <td className="text-right text-red-700">{formatCurrency(totalData.BalanceValue)}</td>
//             <td></td>
//             <td></td>
//           </tr>
//         </tfoot>
//       </table>
//     </div>
//   );
// });

// ProfessionalSummaryTable.displayName = "ProfessionalSummaryTable";

// // 9. ADVANCED FILTERS PANEL
// const AdvancedFiltersPanel = React.memo(({ 
//   filters, 
//   onFilterChange,
//   onReset,
//   totalItems,
//   loading,
//   sections,
//   onExport,
//   onSaveFilter,
//   savedFilters,
//   onLoadFilter,
//   onDeleteFilter,
//   onDeepThink
// }) => {
//   const [isExpanded, setIsExpanded] = useState(false);
//   const [filterName, setFilterName] = useState('');
//   const [showSaveDialog, setShowSaveDialog] = useState(false);

//   const handleSaveFilter = () => {
//     if (!filterName.trim()) {
//       toast.warning('Please enter a filter name');
//       return;
//     }
//     onSaveFilter(filterName);
//     setFilterName('');
//     setShowSaveDialog(false);
//     toast.success(`Filter "${filterName}" saved`);
//   };

//   return (
//     <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-sm border">
//       <div className="flex flex-wrap justify-between items-center gap-2">
//         <div className="flex items-center gap-3">
//           <button
//             className="btn btn-ghost btn-xs gap-1"
//             onClick={() => setIsExpanded(!isExpanded)}
//           >
//             <span>🔍</span>
//             Advanced Filters
//             <span>{isExpanded ? '▲' : '▼'}</span>
//           </button>
//           <span className="text-xs text-gray-500">
//             {loading ? 'Loading...' : `${totalItems} items found`}
//           </span>
//         </div>
//         <div className="flex gap-1 flex-wrap">
//           <DeepThinking data={[]} onInsight={onDeepThink} />
//           {savedFilters && savedFilters.length > 0 && (
//             <div className="dropdown dropdown-end">
//               <button className="btn btn-ghost btn-xs gap-1">
//                 💾 Saved
//                 <span className="badge badge-xs">{savedFilters.length}</span>
//               </button>
//               <div className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-48">
//                 {savedFilters.map((filter, index) => (
//                   <div key={index} className="flex items-center gap-1">
//                     <button
//                       className="btn btn-ghost btn-xs flex-1 text-left"
//                       onClick={() => onLoadFilter(filter)}
//                     >
//                       {filter.name}
//                     </button>
//                     <button
//                       className="btn btn-ghost btn-xs text-red-400"
//                       onClick={() => onDeleteFilter(filter.id)}
//                     >
//                       ✕
//                     </button>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}
//           <button
//             className="btn btn-ghost btn-xs gap-1"
//             onClick={() => setShowSaveDialog(true)}
//           >
//             💾 Save Filter
//           </button>
//           <button
//             className="btn btn-ghost btn-xs"
//             onClick={onReset}
//             disabled={loading}
//           >
//             Reset Filters
//           </button>
//         </div>
//       </div>

//       {isExpanded && (
//         <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3">
//           <div className="form-control">
//             <label className="label">
//               <span className="label-text text-xs">Date Range</span>
//             </label>
//             <div className="flex gap-1">
//               <input
//                 type="date"
//                 className="input input-bordered input-xs flex-1"
//                 value={filters.dateRange?.start || ''}
//                 onChange={(e) => onFilterChange('dateRange', { ...filters.dateRange, start: e.target.value })}
//               />
//               <input
//                 type="date"
//                 className="input input-bordered input-xs flex-1"
//                 value={filters.dateRange?.end || ''}
//                 onChange={(e) => onFilterChange('dateRange', { ...filters.dateRange, end: e.target.value })}
//               />
//             </div>
//           </div>

//           <div className="form-control">
//             <label className="label">
//               <span className="label-text text-xs">Value Range</span>
//             </label>
//             <div className="flex gap-1">
//               <input
//                 type="number"
//                 className="input input-bordered input-xs flex-1"
//                 placeholder="Min"
//                 value={filters.minValue || ''}
//                 onChange={(e) => onFilterChange('minValue', e.target.value)}
//               />
//               <input
//                 type="number"
//                 className="input input-bordered input-xs flex-1"
//                 placeholder="Max"
//                 value={filters.maxValue || ''}
//                 onChange={(e) => onFilterChange('maxValue', e.target.value)}
//               />
//             </div>
//           </div>

//           <div className="form-control">
//             <label className="label">
//               <span className="label-text text-xs">Status</span>
//             </label>
//             <select
//               className="select select-bordered select-xs"
//               value={filters.statusFilter || ''}
//               onChange={(e) => onFilterChange('statusFilter', e.target.value)}
//             >
//               <option value="">All Status</option>
//               <option value="complete">Complete</option>
//               <option value="in-progress">In Progress</option>
//               <option value="pending">Pending</option>
//             </select>
//           </div>

//           <div className="form-control">
//             <label className="label">
//               <span className="label-text text-xs">Section</span>
//             </label>
//             <select
//               className="select select-bordered select-xs"
//               value={filters.sectionFilter || ''}
//               onChange={(e) => onFilterChange('sectionFilter', e.target.value)}
//             >
//               <option value="">All Sections</option>
//               {sections.map(section => (
//                 <option key={section} value={section}>{section}</option>
//               ))}
//             </select>
//           </div>

//           <div className="form-control">
//             <label className="label">
//               <span className="label-text text-xs">Favorites</span>
//             </label>
//             <label className="flex items-center gap-2 cursor-pointer">
//               <input
//                 type="checkbox"
//                 className="checkbox checkbox-xs"
//                 checked={filters.showFavoritesOnly || false}
//                 onChange={(e) => onFilterChange('showFavoritesOnly', e.target.checked)}
//               />
//               <span className="text-xs">Show Favorites Only</span>
//             </label>
//           </div>
//         </div>
//       )}

//       {/* Save Filter Dialog */}
//       {showSaveDialog && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
//           <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl">
//             <h3 className="font-bold text-lg mb-4">💾 Save Filter</h3>
//             <input
//               type="text"
//               className="input input-bordered w-full mb-4"
//               placeholder="Filter name"
//               value={filterName}
//               onChange={(e) => setFilterName(e.target.value)}
//               onKeyDown={(e) => e.key === 'Enter' && handleSaveFilter()}
//               autoFocus
//             />
//             <div className="flex gap-2 justify-end">
//               <button
//                 className="btn btn-ghost btn-sm"
//                 onClick={() => setShowSaveDialog(false)}
//               >
//                 Cancel
//               </button>
//               <button
//                 className="btn btn-primary btn-sm text-white"
//                 onClick={handleSaveFilter}
//               >
//                 Save
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// });

// AdvancedFiltersPanel.displayName = "AdvancedFiltersPanel";

// // 10. COLUMN VISIBILITY MANAGER
// const ColumnVisibilityManager = React.memo(({ columns, visibleColumns, onToggle }) => {
//   const [isOpen, setIsOpen] = useState(false);

//   return (
//     <div className="relative">
//       <button
//         className="btn btn-ghost btn-xs gap-1"
//         onClick={() => setIsOpen(!isOpen)}
//       >
//         <span>⚙️</span>
//         Columns
//         <span>{isOpen ? '▲' : '▼'}</span>
//       </button>

//       {isOpen && (
//         <div className="absolute right-0 mt-2 bg-base-100 shadow-xl p-2 rounded-lg w-48 z-50 border border-gray-200">
//           <div className="font-semibold text-xs mb-2">Toggle Columns</div>
//           <div className="space-y-0.5">
//             {columns.map((col) => (
//               <label
//                 key={col.id}
//                 className="flex gap-2 py-1 px-2 items-center hover:bg-gray-100 rounded cursor-pointer"
//               >
//                 <input
//                   type="checkbox"
//                   checked={visibleColumns.includes(col.id)}
//                   onChange={() => onToggle(col.id)}
//                   disabled={col.required}
//                   className="checkbox checkbox-xs"
//                 />
//                 <span className="text-xs">{col.label}</span>
//                 {col.required && (
//                   <span className="text-[10px] text-gray-400 ml-auto">(req)</span>
//                 )}
//               </label>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// });

// ColumnVisibilityManager.displayName = "ColumnVisibilityManager";

// // 11. NOTIFICATION CENTER
// const NotificationCenter = React.memo(({ data }) => {
//   const [notifications, setNotifications] = useState([]);
//   const [isOpen, setIsOpen] = useState(false);
//   const [dismissed, setDismissed] = useState(new Set());

//   useEffect(() => {
//     const alerts = [];
    
//     const zeroBalance = data.filter(d => d.BalanceQty === 0 && d.ChallanQTY > 0);
//     if (zeroBalance.length > 0) {
//       alerts.push({
//         id: 'complete',
//         type: 'success',
//         icon: '✅',
//         message: `${zeroBalance.length} orders fully completed`,
//         details: zeroBalance.slice(0, 3).map(d => d.WorkOrderNo).join(', '),
//         timestamp: new Date()
//       });
//     }

//     const highPending = data.filter(d => Number(d.BalanceValue) > 10000);
//     if (highPending.length > 0) {
//       alerts.push({
//         id: 'high-pending',
//         type: 'warning',
//         icon: '⚠️',
//         message: `${highPending.length} orders with high pending value (>$10,000)`,
//         details: highPending.slice(0, 3).map(d => `${d.WorkOrderNo} ($${d.BalanceValue})`).join(', '),
//         timestamp: new Date()
//       });
//     }

//     const noChallan = data.filter(d => d.ChallanNo.length === 0);
//     if (noChallan.length > 0) {
//       alerts.push({
//         id: 'no-challan',
//         type: 'error',
//         icon: '🔴',
//         message: `${noChallan.length} orders with no challan`,
//         details: noChallan.slice(0, 3).map(d => d.WorkOrderNo).join(', '),
//         timestamp: new Date()
//       });
//     }

//     const highBalance = data.filter(d => Number(d.BalanceQty) > 1000);
//     if (highBalance.length > 0) {
//       alerts.push({
//         id: 'high-balance',
//         type: 'info',
//         icon: 'ℹ️',
//         message: `${highBalance.length} orders with high balance (>1000 units)`,
//         details: highBalance.slice(0, 3).map(d => `${d.WorkOrderNo} (${d.BalanceQty})`).join(', '),
//         timestamp: new Date()
//       });
//     }

//     setNotifications(alerts);
//   }, [data]);

//   const dismissNotification = (id) => {
//     setDismissed(prev => new Set([...prev, id]));
//   };

//   const visibleNotifications = notifications.filter(n => !dismissed.has(n.id));

//   if (visibleNotifications.length === 0) return null;

//   return (
//     <div className="relative">
//       <button
//         className="btn btn-ghost btn-xs gap-1 relative"
//         onClick={() => setIsOpen(!isOpen)}
//       >
//         <span>🔔</span>
//         <span className="badge badge-error badge-xs absolute -top-1 -right-1">
//           {visibleNotifications.length}
//         </span>
//       </button>

//       {isOpen && (
//         <div className="absolute right-0 mt-2 w-80 bg-white shadow-xl rounded-xl p-3 z-50 border border-gray-200 max-h-80 overflow-y-auto">
//           <div className="flex justify-between items-center mb-2">
//             <h4 className="font-semibold text-sm">Notifications</h4>
//             <button
//               className="text-xs text-gray-400 hover:text-gray-600"
//               onClick={() => setDismissed(new Set(notifications.map(n => n.id)))}
//             >
//               Dismiss All
//             </button>
//           </div>
//           <div className="space-y-2">
//             {visibleNotifications.map((notif) => (
//               <div
//                 key={notif.id}
//                 className={`p-3 rounded-lg flex items-start gap-2 ${
//                   notif.type === 'success' ? 'bg-green-50 border border-green-200' :
//                   notif.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
//                   notif.type === 'error' ? 'bg-red-50 border border-red-200' :
//                   'bg-blue-50 border border-blue-200'
//                 }`}
//               >
//                 <span className="text-lg">{notif.icon}</span>
//                 <div className="flex-1">
//                   <div className="text-sm font-medium">{notif.message}</div>
//                   {notif.details && (
//                     <div className="text-xs opacity-70 mt-0.5">{notif.details}</div>
//                   )}
//                   <div className="text-[10px] opacity-50 mt-1">
//                     {new Date(notif.timestamp).toLocaleTimeString()}
//                   </div>
//                 </div>
//                 <button
//                   className="text-xs opacity-50 hover:opacity-100"
//                   onClick={() => dismissNotification(notif.id)}
//                 >
//                   ✕
//                 </button>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// });

// NotificationCenter.displayName = "NotificationCenter";

// // 12. DATA HISTORY
// const DataHistory = React.memo(() => {
//   const [history, setHistory] = useLocalStorage('dataHistory', []);
//   const [isOpen, setIsOpen] = useState(false);

//   const clearHistory = () => {
//     setHistory([]);
//     toast.info('History cleared');
//   };

//   return (
//     <div className="relative">
//       <button
//         className="btn btn-ghost btn-xs gap-1"
//         onClick={() => setIsOpen(!isOpen)}
//       >
//         <span>📜</span>
//         History
//         {history.length > 0 && (
//           <span className="badge badge-xs">{history.length}</span>
//         )}
//       </button>

//       {isOpen && (
//         <div className="absolute right-0 mt-2 w-72 bg-white shadow-xl rounded-xl p-3 z-50 border border-gray-200 max-h-72 overflow-y-auto">
//           <div className="flex justify-between items-center mb-2">
//             <h4 className="font-semibold text-sm">Recent Actions</h4>
//             <button
//               className="text-xs text-red-500 hover:text-red-700"
//               onClick={clearHistory}
//             >
//               Clear All
//             </button>
//           </div>
//           {history.length === 0 ? (
//             <div className="text-center text-gray-400 text-sm py-4">No history yet</div>
//           ) : (
//             <div className="space-y-2">
//               {history.slice(0, 20).map((entry, index) => (
//                 <div key={index} className="text-xs border-b pb-2 last:border-b-0">
//                   <div className="flex justify-between">
//                     <span className="font-medium">{entry.action}</span>
//                     <span className="text-gray-400">
//                       {new Date(entry.timestamp).toLocaleTimeString()}
//                     </span>
//                   </div>
//                   <div className="text-gray-500 truncate">
//                     {entry.data && typeof entry.data === 'string' 
//                       ? entry.data 
//                       : JSON.stringify(entry.data || '').substring(0, 50)}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// });

// DataHistory.displayName = "DataHistory";

// // 13. EXPORT OPTIONS
// const ExportOptions = React.memo(({ onExport, totalItems, disabled }) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const [format, setFormat] = useState('excel');
//   const [includeSummary, setIncludeSummary] = useState(true);
//   const [includeCharts, setIncludeCharts] = useState(false);
//   const [emailReport, setEmailReport] = useState(false);
//   const [scheduleExport, setScheduleExport] = useState(false);

//   const handleExport = () => {
//     onExport({ format, includeSummary, includeCharts, emailReport, scheduleExport });
//     setIsOpen(false);
//   };

//   return (
//     <div className="relative">
//       <button
//         className="btn btn-success btn-xs gap-1 text-white"
//         onClick={() => setIsOpen(!isOpen)}
//         disabled={disabled}
//       >
//         <span>⬇</span>
//         Export
//         <span>▾</span>
//       </button>

//       {isOpen && (
//         <div className="absolute right-0 mt-2 bg-white shadow-xl rounded-xl p-4 w-64 z-50 border border-gray-200">
//           <h4 className="font-semibold text-sm mb-3">Export Options</h4>
          
//           <div className="space-y-2">
//             <div className="flex items-center gap-2">
//               <input
//                 type="radio"
//                 name="format"
//                 value="excel"
//                 checked={format === 'excel'}
//                 onChange={() => setFormat('excel')}
//                 className="radio radio-xs"
//               />
//               <span className="text-sm">Excel (.xlsx)</span>
//             </div>
//             <div className="flex items-center gap-2">
//               <input
//                 type="radio"
//                 name="format"
//                 value="csv"
//                 checked={format === 'csv'}
//                 onChange={() => setFormat('csv')}
//                 className="radio radio-xs"
//               />
//               <span className="text-sm">CSV (.csv)</span>
//             </div>
//             <div className="flex items-center gap-2">
//               <input
//                 type="radio"
//                 name="format"
//                 value="json"
//                 checked={format === 'json'}
//                 onChange={() => setFormat('json')}
//                 className="radio radio-xs"
//               />
//               <span className="text-sm">JSON (.json)</span>
//             </div>
            
//             <div className="divider my-1"></div>
            
//             <label className="flex items-center gap-2 cursor-pointer">
//               <input
//                 type="checkbox"
//                 checked={includeSummary}
//                 onChange={() => setIncludeSummary(!includeSummary)}
//                 className="checkbox checkbox-xs"
//               />
//               <span className="text-sm">Include Summary</span>
//             </label>
            
//             <label className="flex items-center gap-2 cursor-pointer">
//               <input
//                 type="checkbox"
//                 checked={includeCharts}
//                 onChange={() => setIncludeCharts(!includeCharts)}
//                 className="checkbox checkbox-xs"
//               />
//               <span className="text-sm">Include Charts</span>
//             </label>
            
//             <label className="flex items-center gap-2 cursor-pointer">
//               <input
//                 type="checkbox"
//                 checked={emailReport}
//                 onChange={() => setEmailReport(!emailReport)}
//                 className="checkbox checkbox-xs"
//               />
//               <span className="text-sm">Email Report</span>
//             </label>

//             <label className="flex items-center gap-2 cursor-pointer">
//               <input
//                 type="checkbox"
//                 checked={scheduleExport}
//                 onChange={() => setScheduleExport(!scheduleExport)}
//                 className="checkbox checkbox-xs"
//               />
//               <span className="text-sm">Schedule Export</span>
//             </label>
//           </div>

//           <div className="mt-3 flex gap-2">
//             <button
//               className="btn btn-primary btn-xs flex-1 text-white"
//               onClick={handleExport}
//             >
//               Export Now
//             </button>
//             <button
//               className="btn btn-ghost btn-xs"
//               onClick={() => setIsOpen(false)}
//             >
//               Cancel
//             </button>
//           </div>

//           <div className="mt-2 text-[10px] text-gray-400 text-center">
//             {totalItems} items to export
//           </div>
//         </div>
//       )}
//     </div>
//   );
// });

// ExportOptions.displayName = "ExportOptions";

// // ============================================================
// // MAIN COMPONENT
// // ============================================================

// // Find this section in the code (around line 3628) and replace with:

// // ============================================================
// // MAIN COMPONENT
// // ============================================================

// // ============================================================
// // MAIN COMPONENT
// // ============================================================

// function BalanceSummary() {
//   const { cndata, loading } = useContext(GetDataContext);
//   const [error, setError] = useState(null);

//   // State management with localStorage persistence
//   const [selectedPI, setSelectedPI] = useLocalStorage('balanceSummary_selectedPI', []);
//   const [selectedOrder, setSelectedOrder] = useLocalStorage('balanceSummary_selectedOrder', []);
//   const [selectedLC, setSelectedLC] = useLocalStorage('balanceSummary_selectedLC', []);
//   const [selectedInvoice, setSelectedInvoice] = useLocalStorage('balanceSummary_selectedInvoice', []);
//   const [selectedCustomer, setSelectedCustomer] = useLocalStorage('balanceSummary_selectedCustomer', []);
//   const [selectedBuyer, setSelectedBuyer] = useLocalStorage('balanceSummary_selectedBuyer', []);
//   const [selectedColumns, setSelectedColumns] = useLocalStorage('balanceSummary_columns', COLUMN_CONFIG.defaultVisible);
//   const [selectedRows, setSelectedRows] = useLocalStorage('balanceSummary_selectedRows', []);
//   const [favorites, setFavorites] = useLocalStorage('balanceSummary_favorites', []);
//   const [savedFilters, setSavedFilters] = useLocalStorage('balanceSummary_savedFilters', []);

//   // UI State
//   const [search, setSearch] = useState("");
//   const [piSearch, setPiSearch] = useState("");
//   const [orderSearch, setOrderSearch] = useState("");
//   const [lcSearch, setLcSearch] = useState("");
//   const [invoiceSearch, setInvoiceSearch] = useState("");
//   const [customerSearch, setCustomerSearch] = useState("");
//   const [buyerSearch, setBuyerSearch] = useState("");
//   const [piOpen, setPiOpen] = useState(false);
//   const [orderOpen, setOrderOpen] = useState(false);
//   const [lcOpen, setLcOpen] = useState(false);
//   const [invoiceOpen, setInvoiceOpen] = useState(false);
//   const [customerOpen, setCustomerOpen] = useState(false);
//   const [buyerOpen, setBuyerOpen] = useState(false);
//   const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  
//   // Advanced filters state
//   const [dateRange, setDateRange] = useState({ start: "", end: "" });
//   const [minValue, setMinValue] = useState("");
//   const [maxValue, setMaxValue] = useState("");
//   const [statusFilter, setStatusFilter] = useState("");
//   const [sectionFilter, setSectionFilter] = useState("");

//   // Quick view modal
//   const [quickViewItem, setQuickViewItem] = useState(null);
//   const [showQuickView, setShowQuickView] = useState(false);

//   // Background state
//   const [currentBg, setCurrentBg] = useState(null);

//   // Deep thinking insights
//   const [deepInsights, setDeepInsights] = useState([]);

//   // Refs
//   const piRef = useRef(null);
//   const orderRef = useRef(null);
//   const lcRef = useRef(null);
//   const invoiceRef = useRef(null);
//   const customerRef = useRef(null);
//   const buyerRef = useRef(null);

//   // Debounced search
//   const debouncedSearch = useDebounce(search);

//   // Data processing
//   const maps = useDataMaps(cndata);
//   const summarizedData = useSummarizedData(cndata, maps);

//   // Get unique values for filters
//   const uniqueSections = useMemo(() => {
//     return [...new Set(summarizedData.map(d => d.Section).filter(Boolean))];
//   }, [summarizedData]);

//   const uniquePI = useMemo(() => {
//     return [...new Set(summarizedData.map((d) => d.PINO || "No PI"))];
//   }, [summarizedData]);

//   const uniqueOrder = useMemo(() => {
//     return [
//       ...new Set(
//         summarizedData.map((d) => String(d.WorkOrderNo).trim()).filter(Boolean)
//       ),
//     ];
//   }, [summarizedData]);

//   const uniqueLC = useMemo(() => {
//     return [
//       ...new Set(
//         summarizedData.flatMap((d) => d.LCList.map((l) => l.lcNo || "No LC"))
//       ),
//     ];
//   }, [summarizedData]);

//   const uniqueInvoice = useMemo(() => {
//     return [
//       ...new Set(
//         summarizedData.flatMap((d) =>
//           d.InvoiceList.map((i) => i.invoiceNo || "No Invoice")
//         )
//       ),
//     ];
//   }, [summarizedData]);

//   const uniqueCustomers = useMemo(() => {
//     return [...new Set(summarizedData.map((d) => d.CustomerName || "Unknown"))];
//   }, [summarizedData]);

//   const uniqueBuyers = useMemo(() => {
//     return [...new Set(summarizedData.map((d) => d.Buyer || "Unknown"))];
//   }, [summarizedData]);

//   // Filtered options
//   const filteredPI = useMemo(
//     () => uniquePI.filter((pi) => pi.toLowerCase().includes(piSearch.toLowerCase())),
//     [uniquePI, piSearch]
//   );

//   const filteredOrder = useMemo(
//     () => uniqueOrder.filter((order) => order.toString().includes(orderSearch)),
//     [uniqueOrder, orderSearch]
//   );

//   const filteredLC = useMemo(
//     () => uniqueLC.filter((lc) => lc.toLowerCase().includes(lcSearch.toLowerCase())),
//     [uniqueLC, lcSearch]
//   );

//   const filteredInvoice = useMemo(
//     () => uniqueInvoice.filter((inv) => inv.toLowerCase().includes(invoiceSearch.toLowerCase())),
//     [uniqueInvoice, invoiceSearch]
//   );

//   const filteredCustomers = useMemo(
//     () => uniqueCustomers.filter((c) => c.toLowerCase().includes(customerSearch.toLowerCase())),
//     [uniqueCustomers, customerSearch]
//   );

//   const filteredBuyers = useMemo(
//     () => uniqueBuyers.filter((b) => b.toLowerCase().includes(buyerSearch.toLowerCase())),
//     [uniqueBuyers, buyerSearch]
//   );

//   // Prepare filters object
//   const filters = useMemo(() => ({
//     selectedPI,
//     selectedOrder,
//     selectedLC,
//     selectedInvoice,
//     selectedCustomer,
//     selectedBuyer,
//     dateRange,
//     minValue,
//     maxValue,
//     statusFilter,
//     sectionFilter,
//     favorites,
//     showFavoritesOnly
//   }), [selectedPI, selectedOrder, selectedLC, selectedInvoice, selectedCustomer, selectedBuyer, dateRange, minValue, maxValue, statusFilter, sectionFilter, favorites, showFavoritesOnly]);

//   // Apply all filters
//   const filteredData = useFilters(
//     summarizedData,
//     filters,
//     debouncedSearch
//   );

//   // Pagination
//   const { 
//     currentPage, 
//     setCurrentPage, 
//     pageCount, 
//     displayedData, 
//     totalData, 
//     grandTotal,
//     totalItems 
//   } = usePagination(filteredData);

//   // ============================================================
//   // HISTORY LOGGING
//   // ============================================================
//   const logHistory = useCallback((action, data) => {
//     try {
//       const history = JSON.parse(localStorage.getItem('dataHistory') || '[]');
//       const newHistory = [{
//         timestamp: new Date().toISOString(),
//         action,
//         data: typeof data === 'string' ? data : JSON.stringify(data)
//       }, ...history].slice(0, CONFIG.MAX_HISTORY_ITEMS);
//       localStorage.setItem('dataHistory', JSON.stringify(newHistory));
//     } catch (error) {
//       console.error('Error logging history:', error);
//     }
//   }, []);

//   // ============================================================
//   // DEEP THINK FUNCTION - DEFINED BEFORE USE
//   // ============================================================
//   const handleDeepThink = useCallback(() => {
//     toast.info('🧠 Starting Deep Think analysis...');
    
//     // Simulate thinking process with steps
//     const thinkingSteps = [
//       'Analyzing data patterns...',
//       'Processing order metrics...',
//       'Identifying key trends...',
//       'Generating insights...',
//       'Finalizing recommendations...'
//     ];
    
//     thinkingSteps.forEach((step, index) => {
//       setTimeout(() => {
//         toast.info(`🧠 ${step}`, { autoClose: 1500 });
//       }, (index + 1) * 800);
//     });

//     // Generate insights after thinking
//     setTimeout(() => {
//       const insights = [];
      
//       const completeOrders = filteredData.filter(d => d.completionRate == 100);
//       const inProgressOrders = filteredData.filter(d => d.completionRate > 0 && d.completionRate < 100);
//       const pendingOrders = filteredData.filter(d => d.completionRate == 0);
      
//       insights.push({
//         icon: '📈',
//         title: 'Order Health',
//         description: `${completeOrders.length} complete, ${inProgressOrders.length} in progress, ${pendingOrders.length} pending`,
//         priority: 'high'
//       });

//       const customerMap = new Map();
//       filteredData.forEach(d => {
//         customerMap.set(d.CustomerName, (customerMap.get(d.CustomerName) || 0) + Number(d.TotalValue));
//       });
//       const topCustomer = [...customerMap.entries()].sort((a,b) => b[1] - a[1])[0];
//       if (topCustomer) {
//         insights.push({
//           icon: '👤',
//           title: 'Top Customer',
//           description: `${topCustomer[0]} - $${topCustomer[1].toFixed(2)}`,
//           priority: 'medium'
//         });
//       }

//       const sectionMap = new Map();
//       filteredData.forEach(d => {
//         sectionMap.set(d.Section, (sectionMap.get(d.Section) || 0) + Number(d.TotalQty));
//       });
//       const topSection = [...sectionMap.entries()].sort((a,b) => b[1] - a[1])[0];
//       if (topSection) {
//         insights.push({
//           icon: '📦',
//           title: 'Top Section',
//           description: `${topSection[0]} - ${topSection[1].toFixed(0)} units`,
//           priority: 'medium'
//         });
//       }

//       const highPending = filteredData.filter(d => Number(d.BalanceValue) > 10000);
//       if (highPending.length > 0) {
//         insights.push({
//           icon: '⚠️',
//           title: 'High Pending Alert',
//           description: `${highPending.length} orders with pending value > $10,000`,
//           priority: 'high'
//         });
//       }

//       const noChallan = filteredData.filter(d => d.ChallanNo.length === 0);
//       if (noChallan.length > 0) {
//         insights.push({
//           icon: '🔴',
//           title: 'No Challan Orders',
//           description: `${noChallan.length} orders without challan`,
//           priority: 'critical'
//         });
//       }

//       const avgValue = filteredData.length > 0 ? filteredData.reduce((s,d) => s + Number(d.TotalValue), 0) / filteredData.length : 0;
//       insights.push({
//         icon: '💰',
//         title: 'Average Order Value',
//         description: `$${avgValue.toFixed(2)}`,
//         priority: 'low'
//       });

//       // Add trend insight
//       if (filteredData.length > 1) {
//         const sorted = [...filteredData].sort((a,b) => new Date(a.OrderReceiveDate) - new Date(b.OrderReceiveDate));
//         const recent = sorted.slice(-5);
//         const recentAvg = recent.reduce((s,d) => s + Number(d.TotalValue), 0) / recent.length;
//         const overallAvg = filteredData.reduce((s,d) => s + Number(d.TotalValue), 0) / filteredData.length;
//         if (recentAvg > overallAvg) {
//           insights.push({
//             icon: '📊',
//             title: 'Trend Up',
//             description: `Recent orders are ${((recentAvg/overallAvg - 1) * 100).toFixed(1)}% higher than average`,
//             priority: 'medium'
//           });
//         } else if (recentAvg < overallAvg) {
//           insights.push({
//             icon: '📉',
//             title: 'Trend Down',
//             description: `Recent orders are ${((1 - recentAvg/overallAvg) * 100).toFixed(1)}% lower than average`,
//             priority: 'medium'
//           });
//         }
//       }

//       setDeepInsights(insights);
//       toast.success(`🧠 Deep Think complete! ${insights.length} insights generated.`);
//       logHistory('Deep Think', `${insights.length} insights`);
//     }, (thinkingSteps.length + 1) * 800);
//   }, [filteredData, logHistory]);

//   // ============================================================
//   // TOGGLE HANDLERS
//   // ============================================================
//   const togglePI = useCallback((value) => {
//     if (Array.isArray(value)) {
//       setSelectedPI(value);
//     } else {
//       setSelectedPI(prev => 
//         prev.includes(value) ? prev.filter(p => p !== value) : [...prev, value]
//       );
//     }
//     setCurrentPage(0);
//   }, [setSelectedPI, setCurrentPage]);

//   const toggleOrder = useCallback((value) => {
//     const val = String(value).trim();
//     if (Array.isArray(value)) {
//       setSelectedOrder(value.map(v => String(v).trim()));
//     } else {
//       setSelectedOrder(prev => 
//         prev.includes(val) ? prev.filter(o => o !== val) : [...prev, val]
//       );
//     }
//     setCurrentPage(0);
//   }, [setSelectedOrder, setCurrentPage]);

//   const toggleLC = useCallback((value) => {
//     if (Array.isArray(value)) {
//       setSelectedLC(value);
//     } else {
//       setSelectedLC(prev => 
//         prev.includes(value) ? prev.filter(x => x !== value) : [...prev, value]
//       );
//     }
//     setCurrentPage(0);
//   }, [setSelectedLC, setCurrentPage]);

//   const toggleInvoice = useCallback((value) => {
//     if (Array.isArray(value)) {
//       setSelectedInvoice(value);
//     } else {
//       setSelectedInvoice(prev => 
//         prev.includes(value) ? prev.filter(x => x !== value) : [...prev, value]
//       );
//     }
//     setCurrentPage(0);
//   }, [setSelectedInvoice, setCurrentPage]);

//   const toggleCustomer = useCallback((value) => {
//     if (Array.isArray(value)) {
//       setSelectedCustomer(value);
//     } else {
//       setSelectedCustomer(prev => 
//         prev.includes(value) ? prev.filter(x => x !== value) : [...prev, value]
//       );
//     }
//     setCurrentPage(0);
//   }, [setSelectedCustomer, setCurrentPage]);

//   const toggleBuyer = useCallback((value) => {
//     if (Array.isArray(value)) {
//       setSelectedBuyer(value);
//     } else {
//       setSelectedBuyer(prev => 
//         prev.includes(value) ? prev.filter(x => x !== value) : [...prev, value]
//       );
//     }
//     setCurrentPage(0);
//   }, [setSelectedBuyer, setCurrentPage]);

//   const toggleColumn = useCallback((column) => {
//     setSelectedColumns(prev =>
//       prev.includes(column) ? prev.filter(c => c !== column) : [...prev, column]
//     );
//   }, [setSelectedColumns]);

//   const toggleFavorite = useCallback((orderId) => {
//     setFavorites(prev => 
//       prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
//     );
//     const isFavorite = favorites.includes(orderId);
//     logHistory(isFavorite ? 'Removed from favorites' : 'Added to favorites', orderId);
//   }, [favorites, setFavorites, logHistory]);

//   // Reset all filters
//   const resetFilters = useCallback(() => {
//     setSelectedPI([]);
//     setSelectedOrder([]);
//     setSelectedLC([]);
//     setSelectedInvoice([]);
//     setSelectedCustomer([]);
//     setSelectedBuyer([]);
//     setSearch("");
//     setDateRange({ start: "", end: "" });
//     setMinValue("");
//     setMaxValue("");
//     setStatusFilter("");
//     setSectionFilter("");
//     setShowFavoritesOnly(false);
//     setPiSearch("");
//     setOrderSearch("");
//     setLcSearch("");
//     setInvoiceSearch("");
//     setCustomerSearch("");
//     setBuyerSearch("");
//     setCurrentPage(0);
//     toast.info("All filters have been reset");
//   }, [setSelectedPI, setSelectedOrder, setSelectedLC, setSelectedInvoice, setSelectedCustomer, setSelectedBuyer, setCurrentPage]);

//   // Handle filter changes
//   const handleFilterChange = useCallback((key, value) => {
//     const setters = {
//       dateRange: setDateRange,
//       minValue: setMinValue,
//       maxValue: setMaxValue,
//       statusFilter: setStatusFilter,
//       sectionFilter: setSectionFilter,
//       showFavoritesOnly: setShowFavoritesOnly
//     };
//     if (setters[key]) {
//       setters[key](value);
//     }
//     setCurrentPage(0);
//   }, [setCurrentPage]);

//   // Save filter
//   const saveFilter = useCallback((name) => {
//     const filterData = {
//       id: Date.now().toString(),
//       name,
//       filters: {
//         selectedPI,
//         selectedOrder,
//         selectedLC,
//         selectedInvoice,
//         selectedCustomer,
//         selectedBuyer,
//         dateRange,
//         minValue,
//         maxValue,
//         statusFilter,
//         sectionFilter,
//         showFavoritesOnly
//       },
//       created: new Date().toISOString()
//     };
//     setSavedFilters(prev => [...prev, filterData]);
//     logHistory('Saved filter', name);
//     toast.success(`Filter "${name}" saved!`);
//   }, [selectedPI, selectedOrder, selectedLC, selectedInvoice, selectedCustomer, selectedBuyer, dateRange, minValue, maxValue, statusFilter, sectionFilter, showFavoritesOnly, setSavedFilters, logHistory]);

//   // Load filter
//   const loadFilter = useCallback((filter) => {
//     const f = filter.filters;
//     setSelectedPI(f.selectedPI || []);
//     setSelectedOrder(f.selectedOrder || []);
//     setSelectedLC(f.selectedLC || []);
//     setSelectedInvoice(f.selectedInvoice || []);
//     setSelectedCustomer(f.selectedCustomer || []);
//     setSelectedBuyer(f.selectedBuyer || []);
//     setDateRange(f.dateRange || { start: "", end: "" });
//     setMinValue(f.minValue || "");
//     setMaxValue(f.maxValue || "");
//     setStatusFilter(f.statusFilter || "");
//     setSectionFilter(f.sectionFilter || "");
//     setShowFavoritesOnly(f.showFavoritesOnly || false);
//     setCurrentPage(0);
//     toast.success(`Loaded filter: ${filter.name}`);
//     logHistory('Loaded filter', filter.name);
//   }, [setSelectedPI, setSelectedOrder, setSelectedLC, setSelectedInvoice, setSelectedCustomer, setSelectedBuyer, setCurrentPage, logHistory]);

//   // Delete filter
//   const deleteFilter = useCallback((id) => {
//     setSavedFilters(prev => prev.filter(f => f.id !== id));
//     toast.info('Filter deleted');
//   }, [setSavedFilters]);

//   // Handle row click
//   const handleRowClick = useCallback((item) => {
//     const details = [
//       `Order: ${item.WorkOrderNo}`,
//       `Customer: ${item.CustomerName}`,
//       `PI: ${item.PINO}`,
//       `Value: $${item.TotalValue}`,
//       `Status: ${item.completionRate}% complete`
//     ];
//     toast.info(details.join(' • '));
//     logHistory('Viewed order', item.WorkOrderNo);
//   }, [logHistory]);

//   // Handle row select
//   const handleRowSelect = useCallback((rows) => {
//     setSelectedRows(rows);
//   }, [setSelectedRows]);

//   // Handle quick view
//   const handleQuickView = useCallback((item) => {
//     setQuickViewItem(item);
//     setShowQuickView(true);
//     logHistory('Quick view', item.WorkOrderNo);
//   }, [logHistory]);

//   // Handle background change
//   const handleBackgroundChange = useCallback((bg) => {
//     setCurrentBg(bg);
//     logHistory('Background changed', bg.gradient);
//   }, [logHistory]);

//   // Click outside handler
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (piRef.current && !piRef.current.contains(event.target)) setPiOpen(false);
//       if (orderRef.current && !orderRef.current.contains(event.target)) setOrderOpen(false);
//       if (lcRef.current && !lcRef.current.contains(event.target)) setLcOpen(false);
//       if (invoiceRef.current && !invoiceRef.current.contains(event.target)) setInvoiceOpen(false);
//       if (customerRef.current && !customerRef.current.contains(event.target)) setCustomerOpen(false);
//       if (buyerRef.current && !buyerRef.current.contains(event.target)) setBuyerOpen(false);
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   // Keyboard shortcuts - NOW handleDeepThink is defined
//   useEffect(() => {
//     const handleKeyDown = (e) => {
//       if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
//         e.preventDefault();
//         document.getElementById('global-search')?.focus();
//       }
//       if (e.key === 'Escape') {
//         setSearch('');
//         setShowQuickView(false);
//       }
//       if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
//         e.preventDefault();
//         if (displayedData.length > 0) {
//           setSelectedRows(displayedData.map(d => d.WorkOrderNo));
//           toast.info(`Selected ${displayedData.length} items`);
//         }
//       }
//       if ((e.ctrlKey || e.metaKey) && e.key === 't') {
//         e.preventDefault();
//         handleDeepThink();
//       }
//     };

//     document.addEventListener('keydown', handleKeyDown);
//     return () => document.removeEventListener('keydown', handleKeyDown);
//   }, [displayedData, setSelectedRows, handleDeepThink]);

//   // ... rest of the export function and return statement remains the same

//   // Handle row click
//   const handleRowClick = useCallback((item) => {
//     const details = [
//       `Order: ${item.WorkOrderNo}`,
//       `Customer: ${item.CustomerName}`,
//       `PI: ${item.PINO}`,
//       `Value: $${item.TotalValue}`,
//       `Status: ${item.completionRate}% complete`
//     ];
//     toast.info(details.join(' • '));
//     logHistory('Viewed order', item.WorkOrderNo);
//   }, [logHistory]);

//   // Handle row select
//   const handleRowSelect = useCallback((rows) => {
//     setSelectedRows(rows);
//   }, [setSelectedRows]);

//   // Handle quick view
//   const handleQuickView = useCallback((item) => {
//     setQuickViewItem(item);
//     setShowQuickView(true);
//     logHistory('Quick view', item.WorkOrderNo);
//   }, [logHistory]);

//   // Handle deep think
//   const handleDeepThink = useCallback(() => {
//     toast.info('🧠 Starting Deep Think analysis...');
//     // Generate insights
//     const insights = [];
    
//     const completeOrders = filteredData.filter(d => d.completionRate == 100);
//     const inProgressOrders = filteredData.filter(d => d.completionRate > 0 && d.completionRate < 100);
//     const pendingOrders = filteredData.filter(d => d.completionRate == 0);
    
//     insights.push({
//       icon: '📈',
//       title: 'Order Health',
//       description: `${completeOrders.length} complete, ${inProgressOrders.length} in progress, ${pendingOrders.length} pending`,
//       priority: 'high'
//     });

//     const customerMap = new Map();
//     filteredData.forEach(d => {
//       customerMap.set(d.CustomerName, (customerMap.get(d.CustomerName) || 0) + Number(d.TotalValue));
//     });
//     const topCustomer = [...customerMap.entries()].sort((a,b) => b[1] - a[1])[0];
//     if (topCustomer) {
//       insights.push({
//         icon: '👤',
//         title: 'Top Customer',
//         description: `${topCustomer[0]} - $${topCustomer[1].toFixed(2)}`,
//         priority: 'medium'
//       });
//     }

//     const sectionMap = new Map();
//     filteredData.forEach(d => {
//       sectionMap.set(d.Section, (sectionMap.get(d.Section) || 0) + Number(d.TotalQty));
//     });
//     const topSection = [...sectionMap.entries()].sort((a,b) => b[1] - a[1])[0];
//     if (topSection) {
//       insights.push({
//         icon: '📦',
//         title: 'Top Section',
//         description: `${topSection[0]} - ${topSection[1].toFixed(0)} units`,
//         priority: 'medium'
//       });
//     }

//     const highPending = filteredData.filter(d => Number(d.BalanceValue) > 10000);
//     if (highPending.length > 0) {
//       insights.push({
//         icon: '⚠️',
//         title: 'High Pending Alert',
//         description: `${highPending.length} orders with pending value > $10,000`,
//         priority: 'high'
//       });
//     }

//     const noChallan = filteredData.filter(d => d.ChallanNo.length === 0);
//     if (noChallan.length > 0) {
//       insights.push({
//         icon: '🔴',
//         title: 'No Challan Orders',
//         description: `${noChallan.length} orders without challan`,
//         priority: 'critical'
//       });
//     }

//     const avgValue = filteredData.length > 0 ? filteredData.reduce((s,d) => s + Number(d.TotalValue), 0) / filteredData.length : 0;
//     insights.push({
//       icon: '💰',
//       title: 'Average Order Value',
//       description: `$${avgValue.toFixed(2)}`,
//       priority: 'low'
//     });

//     setDeepInsights(insights);
//     toast.success(`🧠 Deep Think complete! ${insights.length} insights generated.`);
//     logHistory('Deep Think', `${insights.length} insights`);
//   }, [filteredData, logHistory]);

//   // Handle background change
//   const handleBackgroundChange = useCallback((bg) => {
//     setCurrentBg(bg);
//     logHistory('Background changed', bg.gradient);
//   }, [logHistory]);

//   // ... rest of the export function and return statement remains the same

//   // ============================================================
//   // ENHANCED EXPORT FUNCTION
//   // ============================================================
  
//   const exportToExcel = useCallback((options = {}) => {
//     const { format = 'excel', includeSummary = true, includeCharts = false, emailReport = false, scheduleExport = false } = options;
    
//     try {
//       if (filteredData.length === 0) {
//         toast.warning("No data to export");
//         return;
//       }

//       toast.info(`Preparing export of ${filteredData.length} rows...`);

//       const dataToExport = filteredData;
//       const safeCell = (value) => {
//         const text = String(value ?? "");
//         if (text.length > 32000) {
//           return text.substring(0, 32000) + " ...[TRUNCATED]";
//         }
//         return text;
//       };

//       const wb = XLSX.utils.book_new();

//       // Group data by PI
//       const groupedByPI = {};
//       dataToExport.forEach((item) => {
//         const key = item.PINO || "No PI";
//         if (!groupedByPI[key]) groupedByPI[key] = [];
//         groupedByPI[key].push(item);
//       });

//       let data = [];

//       // Build data array with PI grouping
//       for (const [pi, items] of Object.entries(groupedByPI)) {
//         data.push([`PI: ${pi}`]);
//         data.push([]);

//         data.push([
//           "Order No", "Order Date", "Customer", "Delivery", "PI No",
//           "LC No", "Invoice No", "Section", "Order Qty", "Challan Qty",
//           "Balance Qty", "Order Value", "Challan Value", "Balance Value", "Challan No"
//         ]);

//         items.forEach((item) => {
//           const challans = item.ChallanNo || [];
//           let challanText = challans
//             .map((ch, i) => `${i + 1}. ${ch.challanNo} (${ch.status})`)
//             .join("\n");

//           if (challanText.length > 32767) {
//             challanText = challanText.slice(0, 32000) + "\n...[TRUNCATED]";
//           }

//           data.push([
//             item.WorkOrderNo,
//             item.OrderReceiveDate
//               ? new Date(item.OrderReceiveDate).toLocaleDateString(CONFIG.DATE_FORMAT)
//               : "",
//             item.CustomerName,
//             item.DeliverName,
//             item.PINO,
//             (item.LCList || []).map(l => l.lcNo).join(", "),
//             (item.InvoiceList || []).map(i => i.invoiceNo).join(", "),
//             item.Section,
//             item.TotalQty,
//             item.ChallanQTY,
//             item.BalanceQty,
//             item.TotalValue,
//             item.ChallanValue,
//             item.BalanceValue,
//             safeCell(challanText),
//           ]);
//         });

//         // Subtotal for this PI group
//         data.push([
//           "Subtotal",
//           "", "", "", "", "", "", "",
//           items.reduce((a, b) => a + Number(b.TotalQty), 0),
//           items.reduce((a, b) => a + Number(b.ChallanQTY), 0),
//           items.reduce((a, b) => a + Number(b.BalanceQty), 0),
//           items.reduce((a, b) => a + Number(b.TotalValue), 0),
//           items.reduce((a, b) => a + Number(b.ChallanValue), 0),
//           items.reduce((a, b) => a + Number(b.BalanceValue), 0),
//           ""
//         ]);

//         data.push([]);
//       }

//       // Sheet 2 - RAW FLAT DATA
//       const rawData = [];
//       rawData.push([
//         "Order No", "Order Date", "Customer", "Delivery", "PI No",
//         "LC No", "Invoice No", "Section", "Order Qty", "Challan Qty",
//         "Balance Qty", "Order Value", "Challan Value", "Balance Value", "Challan Info"
//       ]);

//       dataToExport.forEach((item) => {
//         const lcNos = (item.LCList || [])
//           .map(l => l.lcNo)
//           .filter(Boolean)
//           .join(", ");

//         const invoiceNos = (item.InvoiceList || [])
//           .map(i => i.invoiceNo)
//           .filter(Boolean)
//           .join(", ");

//         const challanInfo = (item.ChallanNo || [])
//           .map(ch => `${ch.challanNo} (${ch.status})`)
//           .join(", ");

//         rawData.push([
//           item.WorkOrderNo,
//           item.OrderReceiveDate
//             ? new Date(item.OrderReceiveDate).toLocaleDateString(CONFIG.DATE_FORMAT)
//             : "",
//           item.CustomerName,
//           item.DeliverName,
//           item.PINO,
//           lcNos,
//           invoiceNos,
//           item.Section,
//           item.TotalQty,
//           item.ChallanQTY,
//           item.BalanceQty,
//           item.TotalValue,
//           item.ChallanValue,
//           item.BalanceValue,
//           challanInfo
//         ]);
//       });

//       // Create sheets
//       const ws = XLSX.utils.aoa_to_sheet(data);
//       const ws2 = XLSX.utils.aoa_to_sheet(rawData);
//       XLSX.utils.book_append_sheet(wb, ws, "Order Summary");
//       XLSX.utils.book_append_sheet(wb, ws2, "All Data");

//       // PI TITLE MERGE
//       let rowPointer = 0;
//       for (const items of Object.values(groupedByPI)) {
//         if (!ws["!merges"]) ws["!merges"] = [];
//         const lastCol = 14;
//         ws["!merges"].push({
//           s: { r: rowPointer, c: 0 },
//           e: { r: rowPointer, c: lastCol },
//         });
//         const headerRows = 3;
//         const subtotalRows = 2;
//         rowPointer += headerRows + items.length + subtotalRows;
//       }

//       // Column widths
//       const colWidths = [];
//       const MAX_WIDTH = CONFIG.EXCEL_MAX_WIDTH;
      
//       for (let c = 0; c < 15; c++) {
//         let maxLength = 10;
//         for (let r = 0; r < data.length; r++) {
//           const cellValue = data[r][c];
//           if (cellValue) {
//             const len = cellValue.toString().length;
//             if (len > maxLength) maxLength = len + 2;
//           }
//         }
//         if (maxLength > MAX_WIDTH) maxLength = MAX_WIDTH;
//         colWidths.push({ wch: maxLength });
//       }
//       ws["!cols"] = colWidths;

//       // Row heights
//       ws["!rows"] = data.map((row) => {
//         let maxLines = 1;
//         row.forEach((cell) => {
//           if (!cell) return;
//           const lines = cell.toString().split("\n").length;
//           if (lines > maxLines) maxLines = lines;
//         });
//         return { hpt: maxLines * 20 };
//       });

//       // Styling
//       data.forEach((row, r) => {
//         row.forEach((_, c) => {
//           const cell = XLSX.utils.encode_cell({ r, c });
//           if (!ws[cell]) return;

//           ws[cell].s = {
//             font: { sz: 18, name: "Calibri" },
//             alignment: {
//               horizontal: c === 14 ? "left" : "center",
//               vertical: "center",
//               wrapText: true,
//             },
//             border: {
//               top: { style: "thin", color: { rgb: "000000" } },
//               bottom: { style: "thin", color: { rgb: "000000" } },
//               left: { style: "thin", color: { rgb: "000000" } },
//               right: { style: "thin", color: { rgb: "000000" } },
//             },
//           };

//           if (ws["!merges"]?.some((m) => m.s.r === r)) {
//             ws[cell].s.font = {
//               bold: true,
//               sz: 26,
//               color: { rgb: "FFFFFF" },
//             };
//             ws[cell].s.fill = { fgColor: { rgb: "2F75B5" } };
//             ws[cell].s.alignment = {
//               horizontal: "center",
//               vertical: "center",
//             };
//           }

//           if (c === 9 || c === 10 || c === 11) {
//             ws[cell].s.numFmt = '"$"#,##0';
//             ws[cell].s.alignment.horizontal = "right";
//           }

//           if (row[0] === "Subtotal") {
//             ws[cell].s.fill = { fgColor: { rgb: "D9E1F2" } };
//             ws[cell].s.font.bold = true;
//           }
//         });
//       });

//       // Add summary sheet if requested
//       if (includeSummary) {
//         const summaryData = [
//           ['Order Summary Report'],
//           ['Generated:', new Date().toLocaleString()],
//           ['Total Orders:', filteredData.length],
//           ['Total Quantity:', grandTotal.TotalQty.toFixed(2)],
//           ['Total Challan Qty:', grandTotal.ChallanQTY.toFixed(2)],
//           ['Total Balance Qty:', grandTotal.BalanceQty.toFixed(2)],
//           ['Total Value:', `$${grandTotal.TotalValue.toFixed(2)}`],
//           ['Total Challan Value:', `$${grandTotal.ChallanValue.toFixed(2)}`],
//           ['Total Balance Value:', `$${grandTotal.BalanceValue.toFixed(2)}`],
//           ['Completion Rate:', `${((grandTotal.ChallanQTY / grandTotal.TotalQty) * 100 || 0).toFixed(1)}%`],
//           ['Favorites:', favorites.length],
//           ['Filtered Items:', filteredData.length],
//         ];
//         const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
//         wsSummary['!cols'] = [{ wch: 20 }, { wch: 30 }];
//         XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");
//       }

//       // Save file
//       const fileName = `OrderSummaryReport_${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : format === 'json' ? 'json' : 'xlsx'}`;
      
//       if (format === 'csv') {
//         XLSX.writeFile(wb, fileName, { bookType: 'csv' });
//       } else if (format === 'json') {
//         XLSX.writeFile(wb, fileName, { bookType: 'json' });
//       } else {
//         XLSX.writeFile(wb, fileName);
//       }
      
//       toast.success(`Successfully exported ${filteredData.length} rows!`);
      
//       if (emailReport) {
//         toast.info('Report will be emailed to your registered email');
//       }

//       if (scheduleExport) {
//         toast.info('Export scheduled for daily delivery');
//       }

//       logHistory('Exported data', { format, count: filteredData.length });
      
//     } catch (error) {
//       console.error("Export error:", error);
//       toast.error(`Failed to export: ${error.message}`);
//     }
//   }, [filteredData, grandTotal, favorites, logHistory]);

//   // Error handling
//   useEffect(() => {
//     if (error) {
//       toast.error(error);
//     }
//   }, [error]);

//   // Loading state
//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-64">
//         <FourSquare color="#32cd32" size="large" />
//       </div>
//     );
//   }

//   return (
//     <BackgroundGenerator onBackgroundChange={handleBackgroundChange}>
//       <div className="container mx-auto px-3 py-4 relative z-10">
//         <OrderForm />

//         {/* Header */}
//         <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
//           <div>
//             <h1 className="text-xl font-bold text-gray-800">Order Balance Summary</h1>
//             <p className="text-xs text-gray-600">
//               {totalItems} orders • {summarizedData.length} total items
//               {favorites.length > 0 && ` • ⭐ ${favorites.length} favorites`}
//             </p>
//           </div>
//           <div className="flex gap-1 flex-wrap items-center">
//             <NotificationCenter data={filteredData} />
//             <DataHistory />
//             <ColumnVisibilityManager
//               columns={COLUMN_CONFIG.allColumns}
//               visibleColumns={selectedColumns}
//               onToggle={toggleColumn}
//             />
//             <ExportOptions 
//               onExport={exportToExcel} 
//               totalItems={totalItems}
//               disabled={totalItems === 0}
//             />
//           </div>
//         </div>

//         {/* Top 4 Analytics */}
//         <TopItemsAnalytics data={filteredData} />

//         {/* Quick Stats */}
//         {grandTotal.TotalQty > 0 && (
//           <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
//             <div className="stat bg-white/80 backdrop-blur-sm rounded-lg shadow-sm p-2">
//               <div className="stat-title text-[10px]">Total Orders</div>
//               <div className="stat-value text-base">{totalItems}</div>
//             </div>
//             <div className="stat bg-white/80 backdrop-blur-sm rounded-lg shadow-sm p-2">
//               <div className="stat-title text-[10px]">Total Qty</div>
//               <div className="stat-value text-base text-primary">{Math.ceil(grandTotal.TotalQty)}</div>
//             </div>
//             <div className="stat bg-white/80 backdrop-blur-sm rounded-lg shadow-sm p-2">
//               <div className="stat-title text-[10px]">Challan Qty</div>
//               <div className="stat-value text-base text-success">{Math.ceil(grandTotal.ChallanQTY)}</div>
//             </div>
//             <div className="stat bg-white/80 backdrop-blur-sm rounded-lg shadow-sm p-2">
//               <div className="stat-title text-[10px]">Balance Qty</div>
//               <div className="stat-value text-base text-error">{Math.ceil(grandTotal.BalanceQty)}</div>
//             </div>
//             <div className="stat bg-white/80 backdrop-blur-sm rounded-lg shadow-sm p-2">
//               <div className="stat-title text-[10px]">Total Value</div>
//               <div className="stat-value text-base text-info">${Math.ceil(grandTotal.TotalValue)}</div>
//             </div>
//             <div className="stat bg-white/80 backdrop-blur-sm rounded-lg shadow-sm p-2">
//               <div className="stat-title text-[10px]">Completion</div>
//               <div className="stat-value text-base">
//                 {grandTotal.TotalQty > 0 
//                   ? Math.round((grandTotal.ChallanQTY / grandTotal.TotalQty) * 100)
//                   : 0}%
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Advanced Filters */}
//         <div className="mb-3">
//           <AdvancedFiltersPanel
//             filters={{ dateRange, minValue, maxValue, statusFilter, sectionFilter, showFavoritesOnly }}
//             onFilterChange={handleFilterChange}
//             onReset={resetFilters}
//             totalItems={totalItems}
//             loading={loading}
//             sections={uniqueSections}
//             onExport={exportToExcel}
//             onSaveFilter={saveFilter}
//             savedFilters={savedFilters}
//             onLoadFilter={loadFilter}
//             onDeleteFilter={deleteFilter}
//             onDeepThink={handleDeepThink}
//           />
//         </div>

//         {/* Search and Quick Filters */}
//         <div className="flex flex-wrap gap-1 mb-3 items-center">
//           <div className="flex-1 min-w-[150px]">
//             <input
//               id="global-search"
//               type="text"
//               placeholder="Search orders, customers, PI... (Ctrl+F)"
//               className="input input-bordered input-xs w-full bg-white/90 backdrop-blur-sm"
//               value={search}
//               onChange={(e) => { setSearch(e.target.value); setCurrentPage(0); }}
//             />
//           </div>

//           <ProfessionalFilterDropdown
//             label="Order"
//             open={orderOpen}
//             setOpen={setOrderOpen}
//             items={filteredOrder}
//             selectedItems={selectedOrder}
//             onToggle={toggleOrder}
//             searchValue={orderSearch}
//             setSearchValue={setOrderSearch}
//             ref={orderRef}
//             placeholder="Search Order"
//             color="primary"
//           />

//           <ProfessionalFilterDropdown
//             label="PI"
//             open={piOpen}
//             setOpen={setPiOpen}
//             items={filteredPI}
//             selectedItems={selectedPI}
//             onToggle={togglePI}
//             searchValue={piSearch}
//             setSearchValue={setPiSearch}
//             ref={piRef}
//             placeholder="Search PI"
//             color="secondary"
//           />

//           <ProfessionalFilterDropdown
//             label="LC"
//             open={lcOpen}
//             setOpen={setLcOpen}
//             items={filteredLC}
//             selectedItems={selectedLC}
//             onToggle={toggleLC}
//             searchValue={lcSearch}
//             setSearchValue={setLcSearch}
//             ref={lcRef}
//             placeholder="Search LC"
//             color="info"
//           />

//           <ProfessionalFilterDropdown
//             label="Invoice"
//             open={invoiceOpen}
//             setOpen={setInvoiceOpen}
//             items={filteredInvoice}
//             selectedItems={selectedInvoice}
//             onToggle={toggleInvoice}
//             searchValue={invoiceSearch}
//             setSearchValue={setInvoiceSearch}
//             ref={invoiceRef}
//             placeholder="Search Invoice"
//             color="success"
//           />

//           <ProfessionalFilterDropdown
//             label="Customer"
//             open={customerOpen}
//             setOpen={setCustomerOpen}
//             items={filteredCustomers}
//             selectedItems={selectedCustomer}
//             onToggle={toggleCustomer}
//             searchValue={customerSearch}
//             setSearchValue={setCustomerSearch}
//             ref={customerRef}
//             placeholder="Search Customer"
//             color="purple"
//             icon="👤"
//           />

//           <ProfessionalFilterDropdown
//             label="Buyer"
//             open={buyerOpen}
//             setOpen={setBuyerOpen}
//             items={filteredBuyers}
//             selectedItems={selectedBuyer}
//             onToggle={toggleBuyer}
//             searchValue={buyerSearch}
//             setSearchValue={setBuyerSearch}
//             ref={buyerRef}
//             placeholder="Search Buyer"
//             color="pink"
//             icon="💼"
//           />

//           <button
//             className={`btn btn-xs gap-1 ${showFavoritesOnly ? 'btn-warning' : 'btn-ghost'} bg-white/80 backdrop-blur-sm`}
//             onClick={() => setShowFavoritesOnly(prev => !prev)}
//             title="Toggle favorites (Ctrl+F)"
//           >
//             {showFavoritesOnly ? '⭐' : '☆'}
//           </button>

//           {(selectedPI.length > 0 || selectedOrder.length > 0 || 
//             selectedLC.length > 0 || selectedInvoice.length > 0 || 
//             selectedCustomer.length > 0 || selectedBuyer.length > 0 || search ||
//             dateRange.start || dateRange.end || minValue || maxValue ||
//             statusFilter || sectionFilter || showFavoritesOnly) && (
//             <button
//               className="btn btn-ghost btn-xs bg-white/80 backdrop-blur-sm"
//               onClick={resetFilters}
//             >
//               Clear All
//             </button>
//           )}
//         </div>

//         {/* Table */}
//         <ProfessionalSummaryTable
//           data={displayedData}
//           columns={selectedColumns}
//           totalData={totalData}
//           onRowClick={handleRowClick}
//           onRowSelect={handleRowSelect}
//           onQuickView={handleQuickView}
//           onFavoriteToggle={toggleFavorite}
//           selectedRows={selectedRows}
//           favorites={favorites}
//           loading={loading}
//         />

//         {/* Pagination */}
//         {pageCount > 1 && (
//           <div className="flex flex-wrap justify-between items-center mt-3 gap-2">
//             <div className="text-xs text-gray-600">
//               Showing {currentPage * CONFIG.ITEMS_PER_PAGE + 1} to{' '}
//               {Math.min((currentPage + 1) * CONFIG.ITEMS_PER_PAGE, totalItems)} of{' '}
//               {totalItems} entries
//               {selectedRows.length > 0 && ` • ${selectedRows.length} selected`}
//             </div>
//             <ReactPaginate
//               breakLabel="..."
//               nextLabel="Next →"
//               previousLabel="← Previous"
//               pageCount={pageCount}
//               onPageChange={({ selected }) => setCurrentPage(selected)}
//               containerClassName="flex gap-0.5"
//               pageLinkClassName="px-2 py-1 border rounded text-xs hover:bg-gray-100 transition-colors bg-white/80 backdrop-blur-sm"
//               activeLinkClassName="bg-primary text-white hover:bg-primary"
//               previousLinkClassName="px-2 py-1 border rounded text-xs hover:bg-gray-100 transition-colors bg-white/80 backdrop-blur-sm"
//               nextLinkClassName="px-2 py-1 border rounded text-xs hover:bg-gray-100 transition-colors bg-white/80 backdrop-blur-sm"
//               disabledClassName="opacity-50 cursor-not-allowed"
//               renderOnZeroPageCount={null}
//             />
//           </div>
//         )}

//         {/* Quick View Modal */}
//         <QuickViewModal
//           item={quickViewItem}
//           isOpen={showQuickView}
//           onClose={() => setShowQuickView(false)}
//         />

//         {/* Deep Insights Banner */}
//         {deepInsights.length > 0 && (
//           <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 backdrop-blur-sm rounded-xl p-4 border border-blue-200 animate-slideIn">
//             <div className="flex justify-between items-start">
//               <div>
//                 <h4 className="font-semibold text-sm text-blue-800">🧠 Deep Think Insights</h4>
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
//                   {deepInsights.map((insight, index) => (
//                     <div
//                       key={index}
//                       className={`p-2 rounded-lg text-xs ${
//                         insight.priority === 'critical' ? 'bg-red-100 text-red-700' :
//                         insight.priority === 'high' ? 'bg-orange-100 text-orange-700' :
//                         insight.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
//                         'bg-blue-100 text-blue-700'
//                       }`}
//                     >
//                       <span className="mr-1">{insight.icon}</span>
//                       <span className="font-medium">{insight.title}:</span>
//                       <span className="ml-1">{insight.description}</span>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//               <button
//                 className="btn btn-ghost btn-xs text-gray-400 hover:text-gray-600"
//                 onClick={() => setDeepInsights([])}
//               >
//                 ✕
//               </button>
//             </div>
//           </div>
//         )}

//         {/* Footer */}
//         <div className="mt-4 text-center text-[10px] text-gray-500 border-t pt-3">
//           <p>
//             {totalItems} orders loaded • Last updated: {new Date().toLocaleString(CONFIG.DATE_FORMAT)}
//             {favorites.length > 0 && ` • ⭐ ${favorites.length} favorites`}
//           </p>
//           <div className="flex flex-wrap justify-center gap-3 mt-1">
//             <span>💡 Ctrl+F: Search</span>
//             <span>•</span>
//             <span>⌨️ Ctrl+A: Select All</span>
//             <span>•</span>
//             <span>⭐ Toggle Favorites</span>
//             <span>•</span>
//             <span>🧠 Ctrl+T: Deep Think</span>
//             <span>•</span>
//             <span>📋 Click rows for details</span>
//             <span>•</span>
//             <span>👁️ Quick view icons</span>
//           </div>
//         </div>
//       </div>
//     </BackgroundGenerator>
//   );
// }

// BalanceSummary.propTypes = {};

// export default BalanceSummary;



////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////
/* PI Summary - Ultimate Enterprise Edition with ALL Features */

// import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
// import { GetDataContext } from "../components/DataContext";
// import { FourSquare } from "react-loading-indicators";
// import OrderForm from "../OrderReport/OrderForm";
// import * as XLSX from "xlsx-js-style";
// import ReactPaginate from "react-paginate";
// import { toast } from "react-toastify";

// // ============================================================
// // CONSTANTS & CONFIGURATION
// // ============================================================

// const CONFIG = {
//   ITEMS_PER_PAGE: 50,
//   MAX_EXCEL_ROWS: 10000,
//   DEBOUNCE_DELAY: 300,
//   MAX_CHALLAN_DISPLAY: 5,
//   DATE_FORMAT: "en-GB",
//   CURRENCY_SYMBOL: "$",
//   EXCEL_MAX_WIDTH: 25,
//   AUTO_REFRESH_INTERVAL: 60000,
//   TOP_ITEMS_COUNT: 5,
//   MAX_HISTORY_ITEMS: 50,
//   CACHE_DURATION: 300000,
// };

// const COLUMN_CONFIG = {
//   defaultVisible: [
//     "Order", "Date", "Customer", "Delivery", "Buyer", "PI", 
//     "LC", "Invoice", "Section", "OrderQty", "ChallanQty", 
//     "BalanceQty", "OrderValue", "ChallanValue", "BalanceValue", "Challan"
//   ],
//   allColumns: [
//     { id: "Order", label: "Order No", required: true },
//     { id: "Date", label: "Date", required: true },
//     { id: "Customer", label: "Customer", required: true },
//     { id: "Delivery", label: "Delivery", required: true },
//     { id: "Buyer", label: "Buyer", required: true },
//     { id: "PI", label: "PI No", required: false },
//     { id: "LC", label: "LC No", required: false },
//     { id: "Invoice", label: "Invoice No", required: false },
//     { id: "Section", label: "Section", required: true },
//     { id: "OrderQty", label: "Order Qty", required: true },
//     { id: "ChallanQty", label: "Challan Qty", required: true },
//     { id: "BalanceQty", label: "Balance Qty", required: true },
//     { id: "OrderValue", label: "Order Value", required: true },
//     { id: "ChallanValue", label: "Challan Value", required: true },
//     { id: "BalanceValue", label: "Balance Value", required: true },
//     { id: "Challan", label: "Challan", required: false },
//   ]
// };

// // Random Light Weight Backgrounds
// const BACKGROUNDS = [
//   { gradient: 'bg-gradient-to-br from-blue-50 to-indigo-100', pattern: 'pattern-dots' },
//   { gradient: 'bg-gradient-to-tr from-purple-50 to-pink-100', pattern: 'pattern-grid' },
//   { gradient: 'bg-gradient-to-bl from-green-50 to-teal-100', pattern: 'pattern-cross' },
//   { gradient: 'bg-gradient-to-tl from-yellow-50 to-orange-100', pattern: 'pattern-diamond' },
//   { gradient: 'bg-gradient-to-r from-red-50 to-pink-100', pattern: 'pattern-stripe' },
//   { gradient: 'bg-gradient-to-l from-indigo-50 to-blue-100', pattern: 'pattern-wave' },
//   { gradient: 'bg-gradient-to-b from-emerald-50 to-cyan-100', pattern: 'pattern-circle' },
//   { gradient: 'bg-gradient-to-t from-rose-50 to-red-100', pattern: 'pattern-hex' },
//   { gradient: 'bg-gradient-to-br from-amber-50 to-yellow-100', pattern: 'pattern-triangle' },
//   { gradient: 'bg-gradient-to-bl from-violet-50 to-purple-100', pattern: 'pattern-square' },
// ];

// // ============================================================
// // CUSTOM HOOKS
// // ============================================================

// const useDropdown = () => {
//   const [isOpen, setIsOpen] = useState(false);
//   const dropdownRef = useRef(null);
//   const buttonRef = useRef(null);

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       const isClickInsideDropdown = dropdownRef.current?.contains(event.target);
//       const isClickOnButton = buttonRef.current?.contains(event.target);
      
//       if (!isClickInsideDropdown && !isClickOnButton) {
//         setIsOpen(false);
//       }
//     };

//     const handleEsc = (event) => {
//       if (event.key === 'Escape') {
//         setIsOpen(false);
//       }
//     };

//     document.addEventListener('mousedown', handleClickOutside);
//     document.addEventListener('keydown', handleEsc);
    
//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside);
//       document.removeEventListener('keydown', handleEsc);
//     };
//   }, []);

//   const toggle = () => setIsOpen(!isOpen);
//   const close = () => setIsOpen(false);
//   const open = () => setIsOpen(true);

//   return { isOpen, toggle, close, open, dropdownRef, buttonRef };
// };

// const useDebounce = (value, delay = CONFIG.DEBOUNCE_DELAY) => {
//   const [debouncedValue, setDebouncedValue] = useState(value);

//   useEffect(() => {
//     const handler = setTimeout(() => {
//       setDebouncedValue(value);
//     }, delay);

//     return () => clearTimeout(handler);
//   }, [value, delay]);

//   return debouncedValue;
// };

// const useLocalStorage = (key, initialValue) => {
//   const [storedValue, setStoredValue] = useState(() => {
//     try {
//       const item = window.localStorage.getItem(key);
//       return item ? JSON.parse(item) : initialValue;
//     } catch (error) {
//       console.error("Error reading localStorage:", error);
//       return initialValue;
//     }
//   });

//   const setValue = useCallback((value) => {
//     try {
//       const valueToStore = value instanceof Function ? value(storedValue) : value;
//       setStoredValue(valueToStore);
//       window.localStorage.setItem(key, JSON.stringify(valueToStore));
//     } catch (error) {
//       console.error("Error saving to localStorage:", error);
//     }
//   }, [key, storedValue]);

//   return [storedValue, setValue];
// };

// const useDataMaps = (cndata) => {
//   return useMemo(() => {
//     const challanMap = new Map();
//     const lcMap = new Map();
//     const invoiceMap = new Map();

//     try {
//       (cndata?.grupChallan ?? []).forEach((c) => {
//         challanMap.set(`${c.workOrderNo}-${c.challanNo}`, c.statusDesc);
//       });

//       (cndata?.bblcData ?? []).forEach((item) => {
//         const pi = item.customerPINo?.trim();
//         if (!pi) return;
//         if (!lcMap.has(pi)) lcMap.set(pi, []);
//         lcMap.get(pi).push({
//           lcNo: item.lcNo,
//           lcDate: item.lcDate,
//           totalLCValue: item.totalLCValue,
//         });
//       });

//       (cndata?.invoiceData ?? []).forEach((item) => {
//         if (!item.lcNo) return;
//         if (!invoiceMap.has(item.lcNo)) invoiceMap.set(item.lcNo, []);
//         invoiceMap.get(item.lcNo).push({
//           invoiceNo: item.invoiceNo,
//           invoiceDate: item.invoiceDate,
//           totalInvoiceValue: item.totalInvoiceValue,
//         });
//       });
//     } catch (error) {
//       console.error("Error building data maps:", error);
//     }

//     return { challanMap, lcMap, invoiceMap };
//   }, [cndata]);
// };

// const useSummarizedData = (cndata, maps) => {
//   return useMemo(() => {
//     const apidata = cndata?.apiData ?? [];
//     const { challanMap, lcMap, invoiceMap } = maps;

//     try {
//       const grouped = new Map();

//       apidata.forEach((item) => {
//         const key = `${item.WorkOrderNo}-${item.CustomerPINo}`;
        
//         if (!grouped.has(key)) {
//           grouped.set(key, {
//             WorkOrderNo: item.WorkOrderNo,
//             OrderReceiveDate: item.OrderReceiveDate,
//             DeliverName: item.FName,
//             CustomerName: item.CName,
//             PINO: item.CustomerPINo || "No PI",
//             Section: item.ProductCategoryName,
//             Buyer: item.BuyerName,
//             TotalQty: 0,
//             TotalValue: 0,
//             ChallanQTY: 0,
//             ChallanValue: 0,
//             BalanceQty: 0,
//             BalanceValue: 0,
//             ChallanNo: [],
//             itemCount: 0,
//           });
//         }

//         const row = grouped.get(key);
//         row.TotalQty += Number(item.BreakDownQTY) || 0;
//         row.ChallanQTY += Number(item.ChallanQTY) || 0;
//         row.BalanceQty += Number(item.BalanceQTY) || 0;
//         row.TotalValue += Number(item.TotalOrderValue) || 0;
//         row.ChallanValue += Number(item.ChallanValue) || 0;
//         row.BalanceValue += Number(item.BalanceValue) || 0;
//         row.itemCount += 1;

//         if (item.ChallanNo) {
//           item.ChallanNo.split(",")
//             .map((c) => c.trim())
//             .filter(Boolean)
//             .forEach((cn) => {
//               const status = challanMap.get(`${item.WorkOrderNo}-${cn}`) || "Unknown";
//               const exists = row.ChallanNo.some((c) => c.challanNo === cn);
//               if (!exists) {
//                 row.ChallanNo.push({ challanNo: cn, status });
//               }
//             });
//         }
//       });

//       return Array.from(grouped.values()).map((item) => {
//         const lcInfoList = (lcMap.get(item.PINO) || []).filter((lc) => lc.lcNo);
//         const invoiceInfoList = lcInfoList
//           .flatMap((lc) => invoiceMap.get(lc.lcNo) || [])
//           .filter((inv) => inv.invoiceNo);

//         return {
//           ...item,
//           LCList: lcInfoList,
//           InvoiceList: invoiceInfoList,
//           completionRate: item.TotalQty > 0 
//             ? ((item.ChallanQTY / item.TotalQty) * 100).toFixed(1) 
//             : 0,
//         };
//       });
//     } catch (error) {
//       console.error("Error summarizing data:", error);
//       return [];
//     }
//   }, [cndata, maps]);
// };

// const useFilters = (summarizedData, filters, search) => {
//   const normalize = useCallback((v) => String(v || "").trim().toLowerCase(), []);

//   // Parse multi-search input - moved outside useMemo to avoid conditional hooks
//   const getMultiSearchItems = useCallback((multiSearch) => {
//     if (!multiSearch || !multiSearch.trim()) return [];
//     return multiSearch
//       .split(/[\n,;|]+/)
//       .map(item => item.trim())
//       .filter(item => item.length > 0);
//   }, []);

//   return useMemo(() => {
//     const searchValue = normalize(search);
//     const { 
//       selectedPI, selectedOrder, selectedLC, selectedInvoice,
//       selectedCustomer, selectedBuyer, selectedDelivery,
//       dateRange, minValue, maxValue, statusFilter, sectionFilter,
//       favorites, showFavoritesOnly, multiSearch
//     } = filters;

//     const selectedPISet = new Set(selectedPI.map(normalize));
//     const selectedOrderSet = new Set(selectedOrder.map(normalize));
//     const selectedLCSet = new Set(selectedLC.map(normalize));
//     const selectedInvoiceSet = new Set(selectedInvoice.map(normalize));
//     const selectedCustomerSet = new Set(selectedCustomer.map(normalize));
//     const selectedBuyerSet = new Set(selectedBuyer.map(normalize));
//     const selectedDeliverySet = new Set(selectedDelivery.map(normalize));
//     const favoritesSet = new Set(favorites);
    
//     // Get multi-search items
//     const multiSearchItems = getMultiSearchItems(multiSearch);

//     try {
//       return summarizedData
//         .filter((item) => {
//           const workOrder = normalize(item.WorkOrderNo);
//           const customer = normalize(item.CustomerName);
//           const delivery = normalize(item.DeliverName);
//           const buyer = normalize(item.Buyer);
//           const pi = normalize(item.PINO || "No PI");
//           const lc = normalize(
//             (item.LCList || []).map((l) => l.lcNo).join(",") || "No LC"
//           );
//           const invoice = normalize(
//             (item.InvoiceList || []).map((i) => i.invoiceNo).join(",") || "No Invoice"
//           );

//           // Regular search match
//           const searchMatch =
//             !searchValue ||
//             workOrder.includes(searchValue) ||
//             customer.includes(searchValue) ||
//             delivery.includes(searchValue) ||
//             pi.includes(searchValue) ||
//             buyer.includes(searchValue) ||
//             lc.includes(searchValue) ||
//             invoice.includes(searchValue);

//           // Multi-search match - order numbers
//           let multiSearchMatch = true;
//           if (multiSearchItems.length > 0) {
//             // Check if ANY of the multi-search items match
//             multiSearchMatch = multiSearchItems.some(item => {
//               const normalizedItem = normalize(item);
//               return workOrder.includes(normalizedItem) || 
//                      customer.includes(normalizedItem) ||
//                      delivery.includes(normalizedItem) ||
//                      pi.includes(normalizedItem) ||
//                      buyer.includes(normalizedItem) ||
//                      lc.includes(normalizedItem) ||
//                      invoice.includes(normalizedItem);
//             });
//           }

//           const piMatch =
//             selectedPISet.size === 0 || selectedPISet.has(normalize(item.PINO || "No PI"));
//           const lcMatch =
//             selectedLCSet.size === 0 ||
//             (item.LCList || []).some((l) => selectedLCSet.has(normalize(l.lcNo)));
//           const invoiceMatch =
//             selectedInvoiceSet.size === 0 ||
//             (item.InvoiceList || []).some((i) => selectedInvoiceSet.has(normalize(i.invoiceNo)));
//           const orderMatch =
//             selectedOrderSet.size === 0 || selectedOrderSet.has(workOrder);
//           const customerMatch =
//             selectedCustomerSet.size === 0 || selectedCustomerSet.has(customer);
//           const buyerMatch =
//             selectedBuyerSet.size === 0 || selectedBuyerSet.has(buyer);
//           const deliveryMatch =
//             selectedDeliverySet.size === 0 || selectedDeliverySet.has(delivery);

//           const favoriteMatch = !showFavoritesOnly || favoritesSet.has(item.WorkOrderNo);

//           let dateMatch = true;
//           if (dateRange?.start && dateRange?.end) {
//             const orderDate = new Date(item.OrderReceiveDate);
//             const start = new Date(dateRange.start);
//             const end = new Date(dateRange.end);
//             start.setHours(0, 0, 0, 0);
//             end.setHours(23, 59, 59, 999);
//             dateMatch = orderDate >= start && orderDate <= end;
//           }

//           let valueMatch = true;
//           if (minValue || maxValue) {
//             const totalValue = Number(item.TotalValue) || 0;
//             if (minValue && totalValue < Number(minValue)) valueMatch = false;
//             if (maxValue && totalValue > Number(maxValue)) valueMatch = false;
//           }

//           let statusMatch = true;
//           if (statusFilter) {
//             const completion = parseFloat(item.completionRate);
//             if (statusFilter === 'complete' && completion < 100) statusMatch = false;
//             if (statusFilter === 'in-progress' && (completion >= 100 || completion <= 0)) statusMatch = false;
//             if (statusFilter === 'pending' && completion > 0) statusMatch = false;
//           }

//           let sectionMatch = true;
//           if (sectionFilter) {
//             sectionMatch = normalize(item.Section) === normalize(sectionFilter);
//           }

//           return searchMatch && multiSearchMatch && piMatch && orderMatch && lcMatch && 
//                  invoiceMatch && customerMatch && buyerMatch && deliveryMatch &&
//                  favoriteMatch && dateMatch && valueMatch && statusMatch && sectionMatch;
//         })
//         .sort((a, b) => {
//           const getParts = (val = "") => {
//             const parts = val.split("-");
//             return {
//               num: Number(parts[1]) || 0,
//               year: Number(parts[2]) || 0,
//             };
//           };
//           const A = getParts(a.WorkOrderNo);
//           const B = getParts(b.WorkOrderNo);
//           return B.year !== A.year ? B.year - A.year : B.num - A.num;
//         });
//     } catch (error) {
//       console.error("Error filtering data:", error);
//       return [];
//     }
//   }, [summarizedData, search, filters, normalize, getMultiSearchItems]);
// };

// const usePagination = (filteredData, itemsPerPage = CONFIG.ITEMS_PER_PAGE) => {
//   const [currentPage, setCurrentPage] = useState(0);

//   const pageCount = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
//   const displayedData = filteredData.slice(
//     currentPage * itemsPerPage,
//     currentPage * itemsPerPage + itemsPerPage
//   );

//   const totalData = useMemo(() => {
//     return displayedData.reduce(
//       (acc, item) => {
//         acc.TotalQty += Number(item.TotalQty || 0);
//         acc.ChallanQTY += Number(item.ChallanQTY || 0);
//         acc.BalanceQty += Number(item.BalanceQty || 0);
//         acc.TotalValue += Number(item.TotalValue || 0);
//         acc.ChallanValue += Number(item.ChallanValue || 0);
//         acc.BalanceValue += Number(item.BalanceValue || 0);
//         acc.itemCount += 1;
//         return acc;
//       },
//       {
//         TotalQty: 0,
//         ChallanQTY: 0,
//         BalanceQty: 0,
//         TotalValue: 0,
//         ChallanValue: 0,
//         BalanceValue: 0,
//         itemCount: 0,
//       }
//     );
//   }, [displayedData]);

//   const grandTotal = useMemo(() => {
//     return filteredData.reduce(
//       (acc, item) => {
//         acc.TotalQty += Number(item.TotalQty || 0);
//         acc.ChallanQTY += Number(item.ChallanQTY || 0);
//         acc.BalanceQty += Number(item.BalanceQty || 0);
//         acc.TotalValue += Number(item.TotalValue || 0);
//         acc.ChallanValue += Number(item.ChallanValue || 0);
//         acc.BalanceValue += Number(item.BalanceValue || 0);
//         return acc;
//       },
//       {
//         TotalQty: 0,
//         ChallanQTY: 0,
//         BalanceQty: 0,
//         TotalValue: 0,
//         ChallanValue: 0,
//         BalanceValue: 0,
//       }
//     );
//   }, [filteredData]);

//   useEffect(() => {
//     setCurrentPage(0);
//   }, [filteredData.length]);

//   return { 
//     currentPage, 
//     setCurrentPage, 
//     pageCount, 
//     displayedData, 
//     totalData, 
//     grandTotal,
//     totalItems: filteredData.length 
//   };
// };

// // ============================================================
// // COMPONENT: BACKGROUND GENERATOR
// // ============================================================

// const BackgroundGenerator = React.memo(({ children, onBackgroundChange }) => {
//   const [currentBg, setCurrentBg] = useState(() => {
//     const randomIndex = Math.floor(Math.random() * BACKGROUNDS.length);
//     return BACKGROUNDS[randomIndex];
//   });
//   const [isHovering, setIsHovering] = useState(false);

//   const changeBackground = useCallback(() => {
//     let newBg;
//     do {
//       const randomIndex = Math.floor(Math.random() * BACKGROUNDS.length);
//       newBg = BACKGROUNDS[randomIndex];
//     } while (newBg === currentBg && BACKGROUNDS.length > 1);
    
//     setCurrentBg(newBg);
//     onBackgroundChange?.(newBg);
//     toast.info('Background theme changed!');
//   }, [currentBg, onBackgroundChange]);

//   return (
//     <div 
//       className={`relative min-h-screen transition-all duration-1000 ${currentBg.gradient}`}
//       onMouseEnter={() => setIsHovering(true)}
//       onMouseLeave={() => setIsHovering(false)}
//     >
//       <div className={`absolute inset-0 opacity-5 pointer-events-none ${
//         currentBg.pattern === 'pattern-dots' ? 'bg-[radial-gradient(#000_1px,transparent_1px)] bg-[length:20px_20px]' :
//         currentBg.pattern === 'pattern-grid' ? 'bg-[linear-gradient(#000_1px,transparent_1px),linear-gradient(90deg,#000_1px,transparent_1px)] bg-[length:20px_20px]' :
//         currentBg.pattern === 'pattern-cross' ? 'bg-[linear-gradient(45deg,#000_2px,transparent_2px),linear-gradient(-45deg,#000_2px,transparent_2px)] bg-[length:20px_20px]' :
//         currentBg.pattern === 'pattern-diamond' ? 'bg-[linear-gradient(45deg,#000_2px,transparent_2px)] bg-[length:20px_20px]' :
//         currentBg.pattern === 'pattern-stripe' ? 'bg-[linear-gradient(45deg,#000_2px,transparent_2px,transparent_4px)] bg-[length:20px_20px]' :
//         currentBg.pattern === 'pattern-wave' ? 'bg-[radial-gradient(circle_at_20px_20px,#000_2px,transparent_2px)] bg-[length:40px_40px]' :
//         currentBg.pattern === 'pattern-circle' ? 'bg-[radial-gradient(#000_2px,transparent_2px)] bg-[length:20px_20px]' :
//         currentBg.pattern === 'pattern-hex' ? 'bg-[linear-gradient(30deg,#000_2px,transparent_2px),linear-gradient(-30deg,#000_2px,transparent_2px)] bg-[length:20px_20px]' :
//         currentBg.pattern === 'pattern-triangle' ? 'bg-[linear-gradient(45deg,#000_2px,transparent_2px,transparent_4px),linear-gradient(-45deg,#000_2px,transparent_2px,transparent_4px)] bg-[length:20px_20px]' :
//         'bg-[linear-gradient(90deg,#000_1px,transparent_1px),linear-gradient(0deg,#000_1px,transparent_1px)] bg-[length:20px_20px]'
//       }`}></div>

//       <div className={`fixed bottom-4 right-4 z-50 transition-opacity duration-300 ${isHovering ? 'opacity-100' : 'opacity-0'}`}>
//         <button
//           className="btn btn-sm btn-primary text-white shadow-lg rounded-full w-12 h-12 flex items-center justify-center hover:scale-110 transition-transform"
//           onClick={changeBackground}
//           title="Change Background"
//         >
//           <span className="text-xl">🎨</span>
//         </button>
//       </div>

//       <div className="fixed bottom-4 left-4 z-50 opacity-20 hover:opacity-100 transition-opacity">
//         <div className="text-xs text-gray-500 bg-white/50 px-2 py-1 rounded-full backdrop-blur-sm">
//           {currentBg.gradient.replace('bg-gradient-to-', '').replace(/from-|to-|br|tr|bl|tl|r|l|b|t/g, '').trim() || 'Default'}
//         </div>
//       </div>

//       {children}
//     </div>
//   );
// });

// BackgroundGenerator.displayName = "BackgroundGenerator";

// // ============================================================
// // COMPONENT: MULTI-SEARCH DROPDOWN
// // ============================================================

// const MultiSearchDropdown = React.memo(({ 
//   value, 
//   onChange, 
//   onClear,
//   onSearch,
//   placeholder = "Paste order numbers (one per line)...",
//   totalMatches = 0,
//   isActive = false
// }) => {
//   const [isExpanded, setIsExpanded] = useState(false);
//   const textareaRef = useRef(null);

//   const handleKeyDown = (e) => {
//     if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
//       e.preventDefault();
//       onSearch();
//     }
//   };

//   const getMatchCount = () => {
//     if (!value || !value.trim()) return 0;
//     const items = value.split(/[\n,;|]+/).filter(item => item.trim().length > 0);
//     return items.length;
//   };

//   const matchCount = getMatchCount();

//   return (
//     <div className="relative">
//       <button
//         className={`btn btn-xs gap-1 transition-all duration-200 ${
//           isActive || matchCount > 0 
//             ? 'btn-warning text-white' 
//             : 'btn-ghost bg-white/80 backdrop-blur-sm'
//         }`}
//         onClick={() => setIsExpanded(!isExpanded)}
//         title="Multi-search orders"
//       >
//         <span>🔍</span>
//         Multi-Search
//         {matchCount > 0 && (
//           <span className="badge badge-xs badge-info">
//             {matchCount}
//           </span>
//         )}
//         <span>{isExpanded ? '▲' : '▼'}</span>
//       </button>

//       {isExpanded && (
//         <div className="absolute left-0 mt-1 bg-white shadow-xl rounded-xl p-3 w-80 z-50 border border-gray-200">
//           <div className="flex justify-between items-center mb-2">
//             <span className="font-semibold text-xs">📋 Multi-Order Search</span>
//             <div className="flex gap-1">
//               {value && value.trim() && (
//                 <button
//                   className="text-[10px] text-red-500 hover:text-red-700 px-2 py-0.5 rounded hover:bg-red-50 transition-colors"
//                   onClick={() => {
//                     onChange('');
//                     onClear?.();
//                   }}
//                 >
//                   Clear
//                 </button>
//               )}
//               <button
//                 className="text-[10px] text-gray-400 hover:text-gray-600 px-2 py-0.5 rounded hover:bg-gray-50 transition-colors"
//                 onClick={() => setIsExpanded(false)}
//               >
//                 ✕
//               </button>
//             </div>
//           </div>

//           <div className="relative">
//             <textarea
//               ref={textareaRef}
//               value={value}
//               onChange={(e) => onChange(e.target.value)}
//               onKeyDown={handleKeyDown}
//               placeholder={placeholder}
//               className="textarea textarea-bordered w-full text-xs font-mono min-h-[120px] max-h-[200px] resize-y"
//               style={{ lineHeight: '1.5' }}
//               autoFocus
//             />
            
//             <div className="flex justify-between items-center mt-2 text-[10px] text-gray-400">
//               <span>
//                 {matchCount > 0 ? `${matchCount} items entered` : 'Paste order numbers'}
//               </span>
//               <span>
//                 {value && value.trim() && (
//                   <span className="text-gray-600">
//                     {matchCount > 0 && `Press Ctrl+Enter to search`}
//                   </span>
//                 )}
//               </span>
//             </div>

//             {matchCount > 0 && (
//               <div className="mt-2 flex gap-2">
//                 <button
//                   className="btn btn-primary btn-xs flex-1 text-white"
//                   onClick={() => {
//                     onSearch();
//                     setIsExpanded(false);
//                   }}
//                 >
//                   🔍 Search {matchCount} Orders
//                 </button>
//                 <button
//                   className="btn btn-ghost btn-xs"
//                   onClick={() => setIsExpanded(false)}
//                 >
//                   Cancel
//                 </button>
//               </div>
//             )}

//             <div className="mt-2 p-2 bg-gray-50 rounded text-[10px] text-gray-500 border border-gray-100">
//               <span className="font-medium">💡 Quick Tips:</span>
//               <ul className="list-disc list-inside mt-1 space-y-0.5">
//                 <li>Paste one order number per line</li>
//                 <li>Or separate with commas: SO-001, SO-002</li>
//                 <li>Press Ctrl+Enter to search quickly</li>
//                 <li>{totalMatches > 0 ? `✅ Found ${totalMatches} matching orders` : '🔍 Will match any order number'}</li>
//               </ul>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// });

// MultiSearchDropdown.displayName = "MultiSearchDropdown";

// // ============================================================
// // COMPONENT: DEEP THINKING - FIXED
// // ============================================================

// const DeepThinking = React.memo(({ data, onInsight }) => {
//   const [isThinking, setIsThinking] = useState(false);
//   const [thoughts, setThoughts] = useState([]);
//   const [insights, setInsights] = useState([]);
//   const { isOpen, toggle, close, dropdownRef, buttonRef } = useDropdown();

//   const hasData = data && data.length > 0;

//   const getPriorityColor = (priority) => {
//     switch(priority) {
//       case 'critical': return 'border-red-500 bg-red-50';
//       case 'high': return 'border-orange-500 bg-orange-50';
//       case 'medium': return 'border-yellow-500 bg-yellow-50';
//       default: return 'border-blue-500 bg-blue-50';
//     }
//   };

//   const generateFinalInsights = useCallback((data) => {
//     const insights = [];
//     const totalOrders = data.length;
//     const totalValue = data.reduce((sum, d) => sum + Number(d.TotalValue || 0), 0);
//     const totalQty = data.reduce((sum, d) => sum + Number(d.TotalQty || 0), 0);
//     const totalChallanQty = data.reduce((sum, d) => sum + Number(d.ChallanQTY || 0), 0);
//     const completionRate = totalQty > 0 ? (totalChallanQty / totalQty) * 100 : 0;

//     if (completionRate < 50) {
//       insights.push({
//         icon: '⚠️',
//         title: 'Low Overall Completion',
//         description: `Only ${completionRate.toFixed(1)}% of total quantity has been delivered. Consider prioritizing these orders.`,
//         priority: 'critical'
//       });
//     } else if (completionRate < 80) {
//       insights.push({
//         icon: '📊',
//         title: 'Moderate Completion Rate',
//         description: `${completionRate.toFixed(1)}% completion. Focus on pending orders to improve delivery metrics.`,
//         priority: 'high'
//       });
//     } else {
//       insights.push({
//         icon: '✅',
//         title: 'High Completion Rate',
//         description: `${completionRate.toFixed(1)}% completion achieved. Great job on deliveries!`,
//         priority: 'low'
//       });
//     }

//     const customerMap = new Map();
//     data.forEach(d => {
//       const name = d.CustomerName || "Unknown";
//       customerMap.set(name, {
//         value: (customerMap.get(name)?.value || 0) + Number(d.TotalValue || 0),
//         count: (customerMap.get(name)?.count || 0) + 1,
//         completion: (customerMap.get(name)?.completion || 0) + Number(d.completionRate || 0)
//       });
//     });
//     const topCustomer = [...customerMap.entries()]
//       .sort((a, b) => b[1].value - a[1].value)[0];
//     if (topCustomer) {
//       insights.push({
//         icon: '🏆',
//         title: 'Top Customer',
//         description: `${topCustomer[0]} has ${topCustomer[1].count} orders totaling $${topCustomer[1].value.toFixed(2)}.`,
//         priority: 'medium'
//       });
//     }

//     const pendingOrders = data.filter(d => parseFloat(d.completionRate) < 50);
//     if (pendingOrders.length > 0) {
//       insights.push({
//         icon: '📋',
//         title: 'Pending Orders',
//         description: `${pendingOrders.length} orders have less than 50% completion. Average completion: ${(pendingOrders.reduce((sum, d) => sum + parseFloat(d.completionRate), 0) / pendingOrders.length).toFixed(1)}%`,
//         priority: 'high'
//       });
//     }

//     if (totalValue > 1000000) {
//       insights.push({
//         icon: '💰',
//         title: 'High Value Orders',
//         description: `Total order value exceeds $1M ($${totalValue.toFixed(2)}). Ensure proper documentation and tracking.`,
//         priority: 'high'
//       });
//     }

//     const sectionMap = new Map();
//     data.forEach(d => {
//       const section = d.Section || "Unknown";
//       sectionMap.set(section, {
//         value: (sectionMap.get(section)?.value || 0) + Number(d.TotalValue || 0),
//         count: (sectionMap.get(section)?.count || 0) + 1
//       });
//     });
//     const topSection = [...sectionMap.entries()]
//       .sort((a, b) => b[1].value - a[1].value)[0];
//     if (topSection) {
//       insights.push({
//         icon: '📦',
//         title: 'Top Section',
//         description: `${topSection[0]} has ${topSection[1].count} orders worth $${topSection[1].value.toFixed(2)}.`,
//         priority: 'medium'
//       });
//     }

//     return insights;
//   }, []);

//   const generateInsights = useCallback(() => {
//     setIsThinking(true);
//     setThoughts(['Analyzing data structure...', 'Processing metrics...', 'Generating insights...']);
//     setInsights([]);

//     setTimeout(() => {
//       const newInsights = generateFinalInsights(data);
//       setInsights(newInsights);
//       setIsThinking(false);
//       if (onInsight) {
//         onInsight(newInsights);
//       }
//       setThoughts([]);
//     }, 2000);
//   }, [data, generateFinalInsights, onInsight]);

//   const getButtonStatus = () => {
//     if (isThinking) return { text: '🧠 Thinking...', color: 'btn-warning', disabled: true };
//     if (!hasData) return { text: '🔒 No Data', color: 'btn-disabled', disabled: true };
//     return { text: '🤔 Deep Think', color: 'btn-primary', disabled: false };
//   };

//   const status = getButtonStatus();

//   return (
//     <>
//       <button
//         ref={buttonRef}
//         className={`btn ${status.color} btn-xs gap-1 text-white transition-all duration-300 ${isThinking ? 'animate-pulse' : ''}`}
//         onClick={() => {
//           if (!isThinking && hasData) {
//             generateInsights();
//             toggle();
//           }
//         }}
//         disabled={status.disabled}
//         title={!hasData ? "No data available to analyze. Add some orders first!" : "Deep Think - AI Analysis"}
//         data-deep-think
//       >
//         {status.text}
//         {hasData && !isThinking && (
//           <span className="badge badge-xs badge-success ml-1">{data.length}</span>
//         )}
//       </button>
//     </>
//   );
// });

// DeepThinking.displayName = "DeepThinking";

// // ============================================================
// // COMPONENT: QUICK VIEW BUTTON
// // ============================================================

// const QuickViewButton = React.memo(({ item, onQuickView }) => {
//   return (
//     <button
//       className="btn btn-ghost btn-xs text-gray-400 hover:text-blue-500 transition-colors"
//       onClick={(e) => {
//         e.stopPropagation();
//         onQuickView(item);
//       }}
//       title="Quick View"
//     >
//       👁️
//     </button>
//   );
// });

// QuickViewButton.displayName = "QuickViewButton";

// // ============================================================
// // COMPONENT: QUICK VIEW MODAL
// // ============================================================

// const QuickViewModal = React.memo(({ item, isOpen, onClose }) => {
//   if (!isOpen || !item) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999] p-4 animate-fadeIn">
//       <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 shadow-2xl">
//         <div className="flex justify-between items-start mb-4">
//           <h2 className="text-xl font-bold text-gray-800">Order Details</h2>
//           <button 
//             className="btn btn-ghost btn-sm btn-circle hover:bg-gray-100"
//             onClick={onClose}
//           >
//             ✕
//           </button>
//         </div>
//         <div className="space-y-4">
//           <div className="grid grid-cols-2 gap-3">
//             <div className="bg-gray-50 p-3 rounded-lg">
//               <div className="text-xs text-gray-500">Order No</div>
//               <div className="font-semibold">{item.WorkOrderNo}</div>
//             </div>
//             <div className="bg-gray-50 p-3 rounded-lg">
//               <div className="text-xs text-gray-500">Date</div>
//               <div className="font-semibold">{new Date(item.OrderReceiveDate).toLocaleDateString()}</div>
//             </div>
//             <div className="bg-gray-50 p-3 rounded-lg">
//               <div className="text-xs text-gray-500">Customer</div>
//               <div className="font-semibold">{item.CustomerName}</div>
//             </div>
//             <div className="bg-gray-50 p-3 rounded-lg">
//               <div className="text-xs text-gray-500">Delivery</div>
//               <div className="font-semibold">{item.DeliverName}</div>
//             </div>
//             <div className="bg-gray-50 p-3 rounded-lg">
//               <div className="text-xs text-gray-500">Buyer</div>
//               <div className="font-semibold">{item.Buyer}</div>
//             </div>
//             <div className="bg-gray-50 p-3 rounded-lg">
//               <div className="text-xs text-gray-500">PI</div>
//               <div className="font-semibold">{item.PINO}</div>
//             </div>
//             <div className="bg-gray-50 p-3 rounded-lg">
//               <div className="text-xs text-gray-500">Section</div>
//               <div className="font-semibold">{item.Section}</div>
//             </div>
//             <div className="bg-gray-50 p-3 rounded-lg">
//               <div className="text-xs text-gray-500">Status</div>
//               <div className={`font-semibold ${
//                 item.completionRate >= 100 ? 'text-green-600' :
//                 item.completionRate > 50 ? 'text-yellow-600' :
//                 'text-red-600'
//               }`}>
//                 {item.completionRate}% complete
//               </div>
//             </div>
//           </div>

//           <div className="border-t pt-4">
//             <div className="grid grid-cols-3 gap-4 text-center">
//               <div className="bg-blue-50 p-3 rounded-lg">
//                 <div className="text-xs text-gray-500">Order Qty</div>
//                 <div className="font-bold text-blue-600">{item.TotalQty}</div>
//               </div>
//               <div className="bg-green-50 p-3 rounded-lg">
//                 <div className="text-xs text-gray-500">Challan Qty</div>
//                 <div className="font-bold text-green-600">{item.ChallanQTY}</div>
//               </div>
//               <div className="bg-red-50 p-3 rounded-lg">
//                 <div className="text-xs text-gray-500">Balance Qty</div>
//                 <div className="font-bold text-red-600">{item.BalanceQty}</div>
//               </div>
//             </div>
//           </div>

//           <div className="border-t pt-4">
//             <div className="grid grid-cols-3 gap-4 text-center">
//               <div className="bg-indigo-50 p-3 rounded-lg">
//                 <div className="text-xs text-gray-500">Order Value</div>
//                 <div className="font-bold text-indigo-600">${item.TotalValue}</div>
//               </div>
//               <div className="bg-emerald-50 p-3 rounded-lg">
//                 <div className="text-xs text-gray-500">Challan Value</div>
//                 <div className="font-bold text-emerald-600">${item.ChallanValue}</div>
//               </div>
//               <div className="bg-rose-50 p-3 rounded-lg">
//                 <div className="text-xs text-gray-500">Balance Value</div>
//                 <div className="font-bold text-rose-600">${item.BalanceValue}</div>
//               </div>
//             </div>
//           </div>

//           {item.ChallanNo && item.ChallanNo.length > 0 && (
//             <div className="border-t pt-4">
//               <div className="text-xs text-gray-500 mb-2">Challans</div>
//               <div className="space-y-1 max-h-32 overflow-y-auto">
//                 {item.ChallanNo.map((ch, i) => (
//                   <div key={i} className="flex justify-between items-center text-sm border-b pb-1">
//                     <span className="font-mono">{ch.challanNo}</span>
//                     <span className={`text-xs font-medium px-2 py-0.5 rounded ${
//                       ch.status === "Challan Received" ? 'bg-green-100 text-green-700' :
//                       ch.status === "Send to Gate" ? 'bg-yellow-100 text-yellow-700' :
//                       ch.status === "Delivered" ? 'bg-blue-100 text-blue-700' :
//                       ch.status === "Gate Out" ? 'bg-red-100 text-red-700' :
//                       'bg-gray-100 text-gray-700'
//                     }`}>
//                       {ch.status}
//                     </span>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// });

// QuickViewModal.displayName = "QuickViewModal";

// // ============================================================
// // COMPONENT: TOP ITEMS ANALYTICS
// // ============================================================

// const TopItemsAnalytics = React.memo(({ data }) => {
//   const topItems = useMemo(() => {
//     const customerMap = new Map();
//     data.forEach(d => {
//       const name = d.CustomerName || "Unknown";
//       customerMap.set(name, {
//         value: (customerMap.get(name)?.value || 0) + Number(d.TotalValue || 0),
//         orders: (customerMap.get(name)?.orders || 0) + 1,
//         qty: (customerMap.get(name)?.qty || 0) + Number(d.TotalQty || 0),
//       });
//     });
//     const topCustomers = [...customerMap.entries()]
//       .sort((a, b) => b[1].value - a[1].value)
//       .slice(0, CONFIG.TOP_ITEMS_COUNT)
//       .map(([name, data]) => ({ name, ...data }));

//     const buyerMap = new Map();
//     data.forEach(d => {
//       const name = d.Buyer || "Unknown";
//       buyerMap.set(name, {
//         value: (buyerMap.get(name)?.value || 0) + Number(d.TotalValue || 0),
//         orders: (buyerMap.get(name)?.orders || 0) + 1,
//         qty: (buyerMap.get(name)?.qty || 0) + Number(d.TotalQty || 0),
//       });
//     });
//     const topBuyers = [...buyerMap.entries()]
//       .sort((a, b) => b[1].value - a[1].value)
//       .slice(0, CONFIG.TOP_ITEMS_COUNT)
//       .map(([name, data]) => ({ name, ...data }));

//     const deliveryMap = new Map();
//     data.forEach(d => {
//       const name = d.DeliverName || "Unknown";
//       deliveryMap.set(name, {
//         value: (deliveryMap.get(name)?.value || 0) + Number(d.TotalValue || 0),
//         orders: (deliveryMap.get(name)?.orders || 0) + 1,
//         qty: (deliveryMap.get(name)?.qty || 0) + Number(d.TotalQty || 0),
//         completion: (deliveryMap.get(name)?.completion || 0) + Number(d.completionRate || 0)
//       });
//     });
//     const topDeliveries = [...deliveryMap.entries()]
//       .sort((a, b) => b[1].value - a[1].value)
//       .slice(0, CONFIG.TOP_ITEMS_COUNT)
//       .map(([name, data]) => ({ 
//         name, 
//         ...data,
//         completion: data.orders > 0 ? (data.completion / data.orders).toFixed(1) : 0
//       }));

//     const orderMap = new Map();
//     data.forEach(d => {
//       const name = d.WorkOrderNo || "Unknown";
//       orderMap.set(name, {
//         value: Number(d.TotalValue || 0),
//         customer: d.CustomerName || "Unknown",
//         qty: Number(d.TotalQty || 0),
//         completion: d.completionRate || 0,
//       });
//     });
//     const topOrders = [...orderMap.entries()]
//       .sort((a, b) => b[1].value - a[1].value)
//       .slice(0, CONFIG.TOP_ITEMS_COUNT)
//       .map(([name, data]) => ({ name, ...data }));

//     const sectionMap = new Map();
//     data.forEach(d => {
//       const name = d.Section || "Unknown";
//       sectionMap.set(name, {
//         value: (sectionMap.get(name)?.value || 0) + Number(d.TotalValue || 0),
//         orders: (sectionMap.get(name)?.orders || 0) + 1,
//         qty: (sectionMap.get(name)?.qty || 0) + Number(d.TotalQty || 0),
//       });
//     });
//     const topSections = [...sectionMap.entries()]
//       .sort((a, b) => b[1].value - a[1].value)
//       .slice(0, CONFIG.TOP_ITEMS_COUNT)
//       .map(([name, data]) => ({ name, ...data }));

//     return { topCustomers, topBuyers, topOrders, topSections, topDeliveries };
//   }, [data]);

//   const renderTopCard = (title, items, showCompletion = false, icon = "🏆") => {
//     if (!items || items.length === 0) {
//       return (
//         <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm p-3 border">
//           <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{icon} {title}</h4>
//           <div className="text-gray-400 text-sm text-center py-4">No data available</div>
//         </div>
//       );
//     }

//     return (
//       <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm p-3 border hover:shadow-md transition-all hover:scale-105">
//         <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{icon} {title}</h4>
//         <div className="space-y-2">
//           {items.map((item, index) => (
//             <div key={index} className="flex items-center justify-between group">
//               <div className="flex items-center gap-2 flex-1 min-w-0">
//                 <span className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full ${
//                   index === 0 ? 'bg-yellow-400 text-yellow-900' :
//                   index === 1 ? 'bg-gray-300 text-gray-700' :
//                   index === 2 ? 'bg-orange-300 text-orange-900' :
//                   index === 3 ? 'bg-violet-300 text-violet-900' :
//                   'bg-blue-100 text-blue-700'
//                 }`}>
//                   {index + 1}
//                 </span>
//                 <span className="text-sm truncate" title={item.name}>
//                   {item.name}
//                 </span>
//               </div>
//               <div className="flex items-center gap-3 text-xs">
//                 <span className="font-semibold text-blue-600">
//                   ${Number(item.value).toFixed(2)}
//                 </span>
//                 {showCompletion && (
//                   <span className={`px-1.5 py-0.5 rounded ${
//                     item.completion >= 100 ? 'bg-green-100 text-green-700' :
//                     item.completion > 50 ? 'bg-yellow-100 text-yellow-700' :
//                     'bg-red-100 text-red-700'
//                   }`}>
//                     {item.completion}%
//                   </span>
//                 )}
//                 <span className="text-gray-400 text-[10px]">
//                   {(item.orders || item.qty || 0).toFixed(0)} {item.orders ? 'orders' : 'qty'}
//                 </span>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     );
//   };

//   if (data.length === 0) return null;

//   return (
//     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
//       {renderTopCard("Top Customers", topItems.topCustomers, false, "👤")}
//       {renderTopCard("Top Buyers", topItems.topBuyers, false, "💼")}
//       {renderTopCard("Top Deliveries", topItems.topDeliveries, true, "🚚")}
//       {renderTopCard("Top Orders", topItems.topOrders, true, "📋")}
//       {renderTopCard("Top Sections", topItems.topSections, false, "📦")}
//     </div>
//   );
// });

// TopItemsAnalytics.displayName = "TopItemsAnalytics";

// // ============================================================
// // COMPONENT: PROFESSIONAL FILTER DROPDOWN
// // ============================================================

// const ProfessionalFilterDropdown = React.memo(({
//   label,
//   open,
//   setOpen,
//   items,
//   selectedItems,
//   onToggle,
//   searchValue,
//   setSearchValue,
//   ref,
//   placeholder = "Search...",
//   color = "blue",
//   showCount = true,
//   icon = null,
// }) => {
//   const [selectAll, setSelectAll] = useState(false);

//   useEffect(() => {
//     setSelectAll(selectedItems.length === items.length && items.length > 0);
//   }, [selectedItems, items]);

//   const handleSelectAll = useCallback(() => {
//     if (selectAll) {
//       onToggle([]);
//     } else {
//       onToggle(items);
//     }
//   }, [selectAll, items, onToggle]);

//   return (
//     <div className="relative" ref={ref}>
//       <button
//         className={`btn btn-outline btn-xs gap-1 transition-all duration-200 hover:shadow-md ${
//           selectedItems.length > 0 ? `border-${color}-500 bg-${color}-50` : ''
//         }`}
//         onClick={() => setOpen(!open)}
//         aria-expanded={open}
//         aria-haspopup="listbox"
//       >
//         {icon && <span className="text-xs">{icon}</span>}
//         <span className="text-[10px]">{label}</span>
//         {showCount && selectedItems.length > 0 && (
//           <span className={`badge badge-${color} badge-xs`}>
//             {selectedItems.length}
//           </span>
//         )}
//         <span className="text-[10px]">{open ? '▲' : '▼'}</span>
//       </button>

//       {open && (
//         <div className="absolute bg-base-100 shadow-xl p-2 rounded-lg w-56 max-h-72 overflow-y-auto z-50 mt-1 border border-gray-200">
//           <div className="flex justify-between items-center mb-2">
//             <span className="font-semibold text-[10px]">{label} Filter</span>
//             <div className="flex gap-2">
//               <button
//                 className="text-[15px] text-blue-600 hover:text-blue-800 font-medium bg-gray-300 px-2 py-0.5 rounded transition-colors"
//                 onClick={handleSelectAll}
//               >
//                 {selectAll ? 'Deselect All' : 'Select All'}
//               </button>
//               <button
//                 className="text-[15px] text-red-600 hover:text-red-800 font-medium bg-gray-300 px-2 py-0.5 rounded transition-colors"
//                 onClick={() => onToggle([])}
//               >
//                 Clear
//               </button>
//             </div>
//           </div>

//           <div className="relative mb-2">
//             <input
//               type="text"
//               placeholder={placeholder}
//               className="input input-xs w-full pl-6"
//               value={searchValue}
//               onChange={(e) => setSearchValue(e.target.value)}
//             />
//           </div>

//           <div className="space-y-0.5 max-h-40 overflow-y-auto">
//             {items.length === 0 ? (
//               <div className="text-gray-400 text-[10px] text-center py-2">No items found</div>
//             ) : (
//               items.map((item) => (
//                 <label
//                   key={item}
//                   className="flex gap-2 py-1 px-2 items-center hover:bg-gray-100 rounded cursor-pointer transition-colors"
//                 >
//                   <input
//                     type="checkbox"
//                     checked={selectedItems.includes(item)}
//                     onChange={() => onToggle(item)}
//                     className="checkbox checkbox-xs"
//                   />
//                   <span className="text-[11px] select-none truncate">{item}</span>
//                 </label>
//               ))
//             )}
//           </div>

//           <div className="mt-2 pt-2 border-t border-gray-200 text-[10px] text-gray-500">
//             {selectedItems.length} selected
//           </div>
//         </div>
//       )}
//     </div>
//   );
// });

// ProfessionalFilterDropdown.displayName = "ProfessionalFilterDropdown";

// // ============================================================
// // COMPONENT: ENHANCED CHALLAN CELL
// // ============================================================

// const EnhancedChallanCell = React.memo(({ challanNo }) => {
//   const [expanded, setExpanded] = useState(false);
//   const displayedChallans = expanded ? challanNo : challanNo.slice(0, CONFIG.MAX_CHALLAN_DISPLAY);
//   const hasMore = challanNo.length > CONFIG.MAX_CHALLAN_DISPLAY;

//   const handleCopy = useCallback(() => {
//     const text = challanNo.map((ch) => `${ch.challanNo} (${ch.status})`).join("\n");
//     navigator.clipboard.writeText(text).then(() => {
//       toast.success("Challans copied!");
//     }).catch(() => {
//       toast.error("Failed to copy");
//     });
//   }, [challanNo]);

//   if (!challanNo || challanNo.length === 0) {
//     return (
//       <div className="text-gray-400 text-[10px] text-center py-2">
//         <span className="opacity-50">No Challan</span>
//       </div>
//     );
//   }

//   return (
//     <div className="border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
//       <div className="flex justify-between items-center bg-gray-50 px-2 py-1 rounded-t-lg border-b">
//         <span className="text-[10px] font-semibold text-gray-600">
//           📋 Challans ({challanNo.length})
//         </span>
//         <div className="flex gap-1">
//           {hasMore && (
//             <button
//               className="text-[10px] text-blue-600 hover:text-blue-800 px-1 py-0.5 rounded hover:bg-blue-50 transition-colors"
//               onClick={() => setExpanded(!expanded)}
//             >
//               {expanded ? 'Show Less' : `+${challanNo.length - CONFIG.MAX_CHALLAN_DISPLAY}`}
//             </button>
//           )}
//           <button
//             className="text-[10px] bg-blue-500 hover:bg-blue-600 text-white px-1.5 py-0.5 rounded transition-colors"
//             onClick={handleCopy}
//           >
//             Copy
//           </button>
//         </div>
//       </div>
//       <div 
//         className="overflow-y-auto p-1.5 space-y-0.5"
//         style={{ maxHeight: expanded ? "200px" : "100px" }}
//       >
//         {displayedChallans.map((ch, i) => (
//           <div
//             key={i}
//             className={`flex justify-between items-center text-[10px] px-2 py-0.5 rounded transition-colors ${
//               ch.status === "Challan Received"
//                 ? "bg-green-50 text-green-700 hover:bg-green-100"
//                 : ch.status === "Send to Gate"
//                 ? "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
//                 : ch.status === "Delivered"
//                 ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
//                 : ch.status === "Gate Out"
//                 ? "bg-red-50 text-red-700 hover:bg-red-100"
//                 : "bg-gray-50 text-gray-600 hover:bg-gray-100"
//             }`}
//           >
//             <span className="font-medium">
//               {i + 1}. {ch.challanNo}
//             </span>
//             <span className={`px-1 py-0.5 rounded text-[8px] font-medium ${
//               ch.status === "Challan Received"
//                 ? "bg-green-200 text-green-800"
//                 : ch.status === "Send to Gate"
//                 ? "bg-yellow-200 text-yellow-800"
//                 : ch.status === "Delivered"
//                 ? "bg-blue-200 text-blue-800"
//                 : ch.status === "Gate Out"
//                 ? "bg-red-200 text-red-800"
//                 : "bg-gray-200 text-gray-800"
//             }`}>
//               {ch.status}
//             </span>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// });

// EnhancedChallanCell.displayName = "EnhancedChallanCell";

// // ============================================================
// // COMPONENT: PROFESSIONAL SUMMARY TABLE
// // ============================================================

// const ProfessionalSummaryTable = React.memo(({ 
//   data, 
//   columns, 
//   totalData, 
//   onRowClick,
//   onRowSelect,
//   onQuickView,
//   onFavoriteToggle,
//   selectedRows,
//   favorites,
//   loading,
// }) => {
//   const formatDate = useCallback((dateStr) => {
//     if (!dateStr) return "-";
//     try {
//       return new Date(dateStr).toLocaleDateString(CONFIG.DATE_FORMAT, {
//         day: '2-digit',
//         month: 'short',
//         year: 'numeric'
//       });
//     } catch {
//       return "-";
//     }
//   }, []);

//   const formatCurrency = useCallback((value) => {
//     return `${CONFIG.CURRENCY_SYMBOL}${Number(value).toFixed(2)}`;
//   }, []);

//   const getStatusBadge = useCallback((item) => {
//     const completion = parseFloat(item.completionRate);
//     if (completion === 100) {
//       return <span className="badge badge-success badge-xs">Complete</span>;
//     } else if (completion > 50) {
//       return <span className="badge badge-warning badge-xs">In Progress</span>;
//     } else {
//       return <span className="badge badge-error badge-xs">Pending</span>;
//     }
//   }, []);

//   const handleRowCheck = (item, checked) => {
//     if (checked) {
//       onRowSelect([...selectedRows, item.WorkOrderNo]);
//     } else {
//       onRowSelect(selectedRows.filter(id => id !== item.WorkOrderNo));
//     }
//   };

//   const handleSelectAll = (checked) => {
//     if (checked) {
//       onRowSelect(data.map(d => d.WorkOrderNo));
//     } else {
//       onRowSelect([]);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-64">
//         <FourSquare color="#32cd32" size="large" />
//       </div>
//     );
//   }

//   if (data.length === 0) {
//     return (
//       <div className="text-center py-12">
//         <div className="text-gray-400 text-lg">No data to display</div>
//         <div className="text-gray-300 text-sm mt-2">Try adjusting your filters</div>
//       </div>
//     );
//   }

//   const totalColSpan = 9 + 
//     (columns.includes("PI") ? 1 : 0) +
//     (columns.includes("LC") ? 1 : 0) +
//     (columns.includes("Invoice") ? 1 : 0);

//   return (
//     <div className="max-h-[650px] overflow-y-auto border rounded-xl shadow-sm bg-white/95 backdrop-blur-sm">
//       <table className="table table-xs table-zebra min-w-[1400px]">
//         <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white sticky top-0 z-10">
//           <tr className="text-center text-[10px] uppercase tracking-wider">
//             <th className="py-2 w-8">👁️</th>
//             <th className="py-2 w-8">
//               <input
//                 type="checkbox"
//                 className="checkbox checkbox-xs"
//                 checked={data.length > 0 && selectedRows.length === data.length}
//                 onChange={(e) => handleSelectAll(e.target.checked)}
//               />
//             </th>
//             <th className="py-2 w-8">⭐</th>
//             {columns.includes("Order") && <th className="py-2">Order</th>}
//             <th className="py-2">Date</th>
//             <th className="py-2">Customer</th>
//             <th className="py-2">Delivery</th>
//             <th className="py-2">Buyer</th>
//             {columns.includes("PI") && <th className="py-2">PI</th>}
//             {columns.includes("LC") && <th className="py-2">LC No</th>}
//             {columns.includes("Invoice") && <th className="py-2">Invoice</th>}
//             <th className="py-2">Section</th>
//             <th className="py-2 text-right">Order Qty</th>
//             <th className="py-2 text-right">Challan Qty</th>
//             <th className="py-2 text-right">Balance Qty</th>
//             <th className="py-2 text-right">Order Value</th>
//             <th className="py-2 text-right">Challan Value</th>
//             <th className="py-2 text-right">Balance Value</th>
//             <th className="py-2 text-center">Challan</th>
//             <th className="py-2 text-center">Status</th>
//           </tr>
//         </thead>

//         <tbody>
//           {data.map((item) => (
//             <tr 
//               key={`${item.WorkOrderNo}-${item.PINO}-${item.CustomerName}`}
//               className={`hover:bg-blue-50 transition-colors cursor-pointer ${
//                 selectedRows.includes(item.WorkOrderNo) ? 'bg-blue-100' : ''
//               }`}
//               onClick={() => onRowClick?.(item)}
//             >
//               <td className="px-2 py-1 text-center" onClick={(e) => e.stopPropagation()}>
//                 <QuickViewButton item={item} onQuickView={onQuickView} />
//               </td>
//               <td className="px-2 py-1" onClick={(e) => e.stopPropagation()}>
//                 <input
//                   type="checkbox"
//                   className="checkbox checkbox-xs"
//                   checked={selectedRows.includes(item.WorkOrderNo)}
//                   onChange={(e) => handleRowCheck(item, e.target.checked)}
//                 />
//               </td>
//               <td className="px-2 py-1" onClick={(e) => e.stopPropagation()}>
//                 <button
//                   className={`btn btn-ghost btn-xs ${favorites.includes(item.WorkOrderNo) ? 'text-yellow-500' : 'text-gray-300'}`}
//                   onClick={() => onFavoriteToggle(item.WorkOrderNo)}
//                   title={favorites.includes(item.WorkOrderNo) ? 'Remove from favorites' : 'Add to favorites'}
//                 >
//                   {favorites.includes(item.WorkOrderNo) ? '⭐' : '☆'}
//                 </button>
//               </td>
//               {columns.includes("Order") && (
//                 <td className="px-2 py-1 whitespace-nowrap font-medium text-xs">
//                   {item.WorkOrderNo}
//                 </td>
//               )}
//               <td className="px-2 py-1 whitespace-nowrap text-[11px]">
//                 {formatDate(item.OrderReceiveDate)}
//               </td>
//               <td className="px-2 py-1 whitespace-nowrap font-medium text-xs">
//                 {item.CustomerName}
//               </td>
//               <td className="px-2 py-1 whitespace-nowrap text-xs">{item.DeliverName}</td>
//               <td className="px-2 py-1 whitespace-nowrap text-xs">{item.Buyer}</td>
//               {columns.includes("PI") && (
//                 <td className="px-2 py-1 whitespace-nowrap text-[11px] font-mono">
//                   {item.PINO}
//                 </td>
//               )}
//               {columns.includes("LC") && (
//                 <td className="px-2 py-1 whitespace-nowrap text-[11px] font-mono">
//                   {(item.LCList || []).map((l) => l.lcNo).join(", ") || "-"}
//                 </td>
//               )}
//               {columns.includes("Invoice") && (
//                 <td className="px-2 py-1 whitespace-nowrap text-[11px] font-mono">
//                   {(item.InvoiceList || []).map((i) => i.invoiceNo).join(", ") || "-"}
//                 </td>
//               )}
//               <td className="px-2 py-1 whitespace-nowrap text-xs">{item.Section}</td>
//               <td className="px-2 py-1 whitespace-nowrap text-right font-medium text-xs">
//                 {item.TotalQty.toFixed(2)}
//               </td>
//               <td className="px-2 py-1 whitespace-nowrap text-right font-medium text-xs">
//                 {item.ChallanQTY.toFixed(2)}
//               </td>
//               <td className="px-2 py-1 whitespace-nowrap text-right text-red-600 font-medium text-xs">
//                 {item.BalanceQty.toFixed(2)}
//               </td>
//               <td className="px-2 py-1 whitespace-nowrap text-right text-blue-600 font-semibold text-xs">
//                 {formatCurrency(item.TotalValue)}
//               </td>
//               <td className="px-2 py-1 whitespace-nowrap text-right text-green-600 font-semibold text-xs">
//                 {formatCurrency(item.ChallanValue)}
//               </td>
//               <td className="px-2 py-1 whitespace-nowrap text-right text-red-600 font-semibold text-xs">
//                 {formatCurrency(item.BalanceValue)}
//               </td>
//               <td className="px-2 py-1 text-left min-w-[180px]">
//                 <EnhancedChallanCell challanNo={item.ChallanNo} />
//               </td>
//               <td className="px-2 py-1 text-center">
//                 {getStatusBadge(item)}
//               </td>
//             </tr>
//           ))}
//         </tbody>

//         <tfoot className="sticky bottom-0 bg-blue-100 z-10 border-t-2 border-blue-300">
//           <tr className="font-bold text-xs">
//             <td className="text-right pr-2" colSpan={totalColSpan}>
//               Totals:
//             </td>
//             <td className="text-right">{totalData.TotalQty.toFixed(2)}</td>
//             <td className="text-right">{totalData.ChallanQTY.toFixed(2)}</td>
//             <td className="text-right text-red-700">{totalData.BalanceQty.toFixed(2)}</td>
//             <td className="text-right text-blue-700">{formatCurrency(totalData.TotalValue)}</td>
//             <td className="text-right text-green-700">{formatCurrency(totalData.ChallanValue)}</td>
//             <td className="text-right text-red-700">{formatCurrency(totalData.BalanceValue)}</td>
//             <td></td>
//             <td></td>
//           </tr>
//         </tfoot>
//       </table>
//     </div>
//   );
// });

// ProfessionalSummaryTable.displayName = "ProfessionalSummaryTable";

// // ============================================================
// // COMPONENT: ADVANCED FILTERS PANEL
// // ============================================================

// const AdvancedFiltersPanel = React.memo(({ 
//   filters, 
//   onFilterChange,
//   onReset,
//   totalItems,
//   loading,
//   sections,
//   onExport,
//   onSaveFilter,
//   savedFilters,
//   onLoadFilter,
//   onDeleteFilter,
//   onDeepThink,
//   data = []
// }) => {
//   const [isExpanded, setIsExpanded] = useState(false);
//   const [filterName, setFilterName] = useState('');
//   const [showSaveDialog, setShowSaveDialog] = useState(false);

//   const handleSaveFilter = () => {
//     if (!filterName.trim()) {
//       toast.warning('Please enter a filter name');
//       return;
//     }
//     onSaveFilter(filterName);
//     setFilterName('');
//     setShowSaveDialog(false);
//     toast.success(`Filter "${filterName}" saved`);
//   };

//   return (
//     <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-sm border relative">
//       <div className="flex flex-wrap justify-between items-center gap-2">
//         <div className="flex items-center gap-3">
//           <button
//             className="btn btn-ghost btn-xs gap-1"
//             onClick={() => setIsExpanded(!isExpanded)}
//           >
//             <span>🔍</span>
//             Advanced Filters
//             <span>{isExpanded ? '▲' : '▼'}</span>
//           </button>
//           <span className="text-xs text-gray-500">
//             {loading ? 'Loading...' : `${totalItems} items found`}
//           </span>
//         </div>
//         <div className="flex gap-1 flex-wrap items-center">
//           <DeepThinking 
//             data={data} 
//             onInsight={onDeepThink} 
//           />
//           {savedFilters && savedFilters.length > 0 && (
//             <div className="dropdown dropdown-end">
//               <button className="btn btn-ghost btn-xs gap-1">
//                 💾 Saved
//                 <span className="badge badge-xs">{savedFilters.length}</span>
//               </button>
//               <div className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-48">
//                 {savedFilters.map((filter, index) => (
//                   <div key={index} className="flex items-center gap-1">
//                     <button
//                       className="btn btn-ghost btn-xs flex-1 text-left"
//                       onClick={() => onLoadFilter(filter)}
//                     >
//                       {filter.name}
//                     </button>
//                     <button
//                       className="btn btn-ghost btn-xs text-red-400"
//                       onClick={() => onDeleteFilter(filter.id)}
//                     >
//                       ✕
//                     </button>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}
//           <button
//             className="btn btn-ghost btn-xs gap-1"
//             onClick={() => setShowSaveDialog(true)}
//           >
//             💾 Save Filter
//           </button>
//           <button
//             className="btn btn-ghost btn-xs"
//             onClick={onReset}
//             disabled={loading}
//           >
//             Reset Filters
//           </button>
//         </div>
//       </div>

//       {isExpanded && (
//         <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3">
//           <div className="form-control">
//             <label className="label">
//               <span className="label-text text-xs">Date Range</span>
//             </label>
//             <div className="flex gap-1">
//               <input
//                 type="date"
//                 className="input input-bordered input-xs flex-1"
//                 value={filters.dateRange?.start || ''}
//                 onChange={(e) => onFilterChange('dateRange', { ...filters.dateRange, start: e.target.value })}
//               />
//               <input
//                 type="date"
//                 className="input input-bordered input-xs flex-1"
//                 value={filters.dateRange?.end || ''}
//                 onChange={(e) => onFilterChange('dateRange', { ...filters.dateRange, end: e.target.value })}
//               />
//             </div>
//           </div>

//           <div className="form-control">
//             <label className="label">
//               <span className="label-text text-xs">Value Range</span>
//             </label>
//             <div className="flex gap-1">
//               <input
//                 type="number"
//                 className="input input-bordered input-xs flex-1"
//                 placeholder="Min"
//                 value={filters.minValue || ''}
//                 onChange={(e) => onFilterChange('minValue', e.target.value)}
//               />
//               <input
//                 type="number"
//                 className="input input-bordered input-xs flex-1"
//                 placeholder="Max"
//                 value={filters.maxValue || ''}
//                 onChange={(e) => onFilterChange('maxValue', e.target.value)}
//               />
//             </div>
//           </div>

//           <div className="form-control">
//             <label className="label">
//               <span className="label-text text-xs">Status</span>
//             </label>
//             <select
//               className="select select-bordered select-xs"
//               value={filters.statusFilter || ''}
//               onChange={(e) => onFilterChange('statusFilter', e.target.value)}
//             >
//               <option value="">All Status</option>
//               <option value="complete">Complete</option>
//               <option value="in-progress">In Progress</option>
//               <option value="pending">Pending</option>
//             </select>
//           </div>

//           <div className="form-control">
//             <label className="label">
//               <span className="label-text text-xs">Section</span>
//             </label>
//             <select
//               className="select select-bordered select-xs"
//               value={filters.sectionFilter || ''}
//               onChange={(e) => onFilterChange('sectionFilter', e.target.value)}
//             >
//               <option value="">All Sections</option>
//               {sections.map(section => (
//                 <option key={section} value={section}>{section}</option>
//               ))}
//             </select>
//           </div>

//           <div className="form-control">
//             <label className="label">
//               <span className="label-text text-xs">Favorites</span>
//             </label>
//             <label className="flex items-center gap-2 cursor-pointer">
//               <input
//                 type="checkbox"
//                 className="checkbox checkbox-xs"
//                 checked={filters.showFavoritesOnly || false}
//                 onChange={(e) => onFilterChange('showFavoritesOnly', e.target.checked)}
//               />
//               <span className="text-xs">Show Favorites Only</span>
//             </label>
//           </div>
//         </div>
//       )}

//       {showSaveDialog && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999] animate-fadeIn">
//           <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl">
//             <h3 className="font-bold text-lg mb-4">💾 Save Filter</h3>
//             <input
//               type="text"
//               className="input input-bordered w-full mb-4"
//               placeholder="Filter name"
//               value={filterName}
//               onChange={(e) => setFilterName(e.target.value)}
//               onKeyDown={(e) => e.key === 'Enter' && handleSaveFilter()}
//               autoFocus
//             />
//             <div className="flex gap-2 justify-end">
//               <button
//                 className="btn btn-ghost btn-sm"
//                 onClick={() => setShowSaveDialog(false)}
//               >
//                 Cancel
//               </button>
//               <button
//                 className="btn btn-primary btn-sm text-white"
//                 onClick={handleSaveFilter}
//               >
//                 Save
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// });

// AdvancedFiltersPanel.displayName = "AdvancedFiltersPanel";

// // ============================================================
// // COMPONENT: COLUMN VISIBILITY MANAGER
// // ============================================================

// const ColumnVisibilityManager = React.memo(({ columns, visibleColumns, onToggle }) => {
//   const [isOpen, setIsOpen] = useState(false);

//   return (
//     <div className="relative">
//       <button
//         className="btn btn-ghost btn-xs gap-1"
//         onClick={() => setIsOpen(!isOpen)}
//       >
//         <span>⚙️</span>
//         Columns
//         <span>{isOpen ? '▲' : '▼'}</span>
//       </button>

//       {isOpen && (
//         <div className="absolute right-0 mt-2 bg-base-100 shadow-xl p-2 rounded-lg w-48 z-50 border border-gray-200">
//           <div className="font-semibold text-xs mb-2">Toggle Columns</div>
//           <div className="space-y-0.5">
//             {columns.map((col) => (
//               <label
//                 key={col.id}
//                 className="flex gap-2 py-1 px-2 items-center hover:bg-gray-100 rounded cursor-pointer"
//               >
//                 <input
//                   type="checkbox"
//                   checked={visibleColumns.includes(col.id)}
//                   onChange={() => onToggle(col.id)}
//                   disabled={col.required}
//                   className="checkbox checkbox-xs"
//                 />
//                 <span className="text-xs">{col.label}</span>
//                 {col.required && (
//                   <span className="text-[10px] text-gray-400 ml-auto">(req)</span>
//                 )}
//               </label>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// });

// ColumnVisibilityManager.displayName = "ColumnVisibilityManager";

// // ============================================================
// // COMPONENT: NOTIFICATION CENTER
// // ============================================================

// const NotificationCenter = React.memo(({ data }) => {
//   const [notifications, setNotifications] = useState([]);
//   const [dismissed, setDismissed] = useState(new Set());
//   const { isOpen, toggle, close, dropdownRef, buttonRef } = useDropdown();

//   useEffect(() => {
//     const newNotifications = [];
    
//     if (data && data.length > 0) {
//       const criticalOrders = data.filter(d => parseFloat(d.completionRate) < 30);
//       if (criticalOrders.length > 0) {
//         newNotifications.push({
//           id: Date.now(),
//           type: 'error',
//           icon: '⚠️',
//           message: `${criticalOrders.length} orders critically low`,
//           details: `Orders with less than 30% completion`,
//           timestamp: new Date().toISOString()
//         });
//       }

//       const highValueOrders = data.filter(d => Number(d.TotalValue) > 100000);
//       if (highValueOrders.length > 0) {
//         newNotifications.push({
//           id: Date.now() + 1,
//           type: 'warning',
//           icon: '💰',
//           message: `${highValueOrders.length} high value orders`,
//           details: `Orders exceeding $100,000`,
//           timestamp: new Date().toISOString()
//         });
//       }

//       const completedOrders = data.filter(d => parseFloat(d.completionRate) === 100);
//       if (completedOrders.length > 0 && completedOrders.length === data.length) {
//         newNotifications.push({
//           id: Date.now() + 2,
//           type: 'success',
//           icon: '✅',
//           message: 'All orders complete!',
//           details: `All ${data.length} orders have been delivered`,
//           timestamp: new Date().toISOString()
//         });
//       } else if (completedOrders.length > 0) {
//         newNotifications.push({
//           id: Date.now() + 3,
//           type: 'info',
//           icon: '📊',
//           message: `${completedOrders.length} orders complete`,
//           details: `${(completedOrders.length / data.length * 100).toFixed(1)}% completion rate`,
//           timestamp: new Date().toISOString()
//         });
//       }
//     }

//     setNotifications(prev => {
//       const prevIds = new Set(prev.map(n => n.id));
//       const newIds = new Set(newNotifications.map(n => n.id));
//       const combined = [
//         ...prev.filter(n => !newIds.has(n.id) && !dismissed.has(n.id)),
//         ...newNotifications.filter(n => !dismissed.has(n.id))
//       ];
//       return combined.slice(0, 10);
//     });
//   }, [data, dismissed]);

//   const dismissNotification = (id) => {
//     setDismissed(prev => new Set([...prev, id]));
//   };

//   const visibleNotifications = notifications.filter(n => !dismissed.has(n.id));

//   if (visibleNotifications.length === 0) return null;

//   return (
//     <div className="relative">
//       <button
//         ref={buttonRef}
//         className="btn btn-ghost btn-xs gap-1 relative"
//         onClick={toggle}
//       >
//         <span>🔔</span>
//         <span className="badge badge-error badge-xs absolute -top-1 -right-1">
//           {visibleNotifications.length}
//         </span>
//       </button>

//       {isOpen && (
//         <div 
//           ref={dropdownRef}
//           className="absolute right-0 mt-2 w-80 bg-white shadow-xl rounded-xl p-3 z-50 border border-gray-200 max-h-80 overflow-y-auto"
//         >
//           <div className="flex justify-between items-center mb-2">
//             <h4 className="font-semibold text-sm">Notifications</h4>
//             <button
//               className="text-xs text-gray-400 hover:text-gray-600"
//               onClick={() => {
//                 setDismissed(new Set(notifications.map(n => n.id)));
//                 close();
//               }}
//             >
//               Dismiss All
//             </button>
//           </div>
//           <div className="space-y-2">
//             {visibleNotifications.map((notif) => (
//               <div
//                 key={notif.id}
//                 className={`p-3 rounded-lg flex items-start gap-2 ${
//                   notif.type === 'success' ? 'bg-green-50 border border-green-200' :
//                   notif.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
//                   notif.type === 'error' ? 'bg-red-50 border border-red-200' :
//                   'bg-blue-50 border border-blue-200'
//                 }`}
//               >
//                 <span className="text-lg">{notif.icon}</span>
//                 <div className="flex-1">
//                   <div className="text-sm font-medium">{notif.message}</div>
//                   {notif.details && (
//                     <div className="text-xs opacity-70 mt-0.5">{notif.details}</div>
//                   )}
//                   <div className="text-[10px] opacity-50 mt-1">
//                     {new Date(notif.timestamp).toLocaleTimeString()}
//                   </div>
//                 </div>
//                 <button
//                   className="text-xs opacity-50 hover:opacity-100"
//                   onClick={(e) => {
//                     e.stopPropagation();
//                     dismissNotification(notif.id);
//                   }}
//                 >
//                   ✕
//                 </button>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// });

// NotificationCenter.displayName = "NotificationCenter";

// // ============================================================
// // COMPONENT: DATA HISTORY
// // ============================================================

// const DataHistory = React.memo(() => {
//   const [history, setHistory] = useLocalStorage('dataHistory', []);
//   const { isOpen, toggle, close, dropdownRef, buttonRef } = useDropdown();

//   const clearHistory = () => {
//     setHistory([]);
//     toast.info('History cleared');
//     close();
//   };

//   return (
//     <div className="relative">
//       <button
//         ref={buttonRef}
//         className="btn btn-ghost btn-xs gap-1"
//         onClick={toggle}
//       >
//         <span>📜</span>
//         History
//         {history.length > 0 && (
//           <span className="badge badge-xs">{history.length}</span>
//         )}
//       </button>

//       {isOpen && (
//         <div 
//           ref={dropdownRef}
//           className="absolute right-0 mt-2 w-72 bg-white shadow-xl rounded-xl p-3 z-50 border border-gray-200 max-h-72 overflow-y-auto"
//         >
//           <div className="flex justify-between items-center mb-2">
//             <h4 className="font-semibold text-sm">Recent Actions</h4>
//             <button
//               className="text-xs text-red-500 hover:text-red-700"
//               onClick={clearHistory}
//             >
//               Clear All
//             </button>
//           </div>
//           {history.length === 0 ? (
//             <div className="text-center text-gray-400 text-sm py-4">No history yet</div>
//           ) : (
//             <div className="space-y-2">
//               {history.slice(0, 20).map((entry, index) => (
//                 <div key={index} className="text-xs border-b pb-2 last:border-b-0">
//                   <div className="flex justify-between">
//                     <span className="font-medium">{entry.action}</span>
//                     <span className="text-gray-400">
//                       {new Date(entry.timestamp).toLocaleTimeString()}
//                     </span>
//                   </div>
//                   <div className="text-gray-500 truncate">
//                     {entry.data && typeof entry.data === 'string' 
//                       ? entry.data 
//                       : JSON.stringify(entry.data || '').substring(0, 50)}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// });

// DataHistory.displayName = "DataHistory";

// // ============================================================
// // COMPONENT: EXPORT OPTIONS
// // ============================================================

// const ExportOptions = React.memo(({ onExport, totalItems, disabled }) => {
//   const [format, setFormat] = useState('excel');
//   const [includeSummary, setIncludeSummary] = useState(true);
//   const [includeCharts, setIncludeCharts] = useState(false);
//   const [emailReport, setEmailReport] = useState(false);
//   const [scheduleExport, setScheduleExport] = useState(false);
//   const [scheduleTime, setScheduleTime] = useState('');
//   const [scheduleFrequency, setScheduleFrequency] = useState('daily');
//   const { isOpen, toggle, close, dropdownRef, buttonRef } = useDropdown();

//   const handleExport = () => {
//     onExport({ 
//       format, 
//       includeSummary, 
//       includeCharts, 
//       emailReport, 
//       scheduleExport,
//       scheduleTime,
//       scheduleFrequency 
//     });
//     close();
//   };

//   return (
//     <div className="relative">
//       <button
//         ref={buttonRef}
//         className="btn btn-success btn-xs gap-1 text-white"
//         onClick={toggle}
//         disabled={disabled}
//       >
//         <span>⬇</span>
//         Export
//         <span>▾</span>
//       </button>

//       {isOpen && (
//         <div 
//           ref={dropdownRef}
//           className="absolute right-0 mt-2 bg-white shadow-xl rounded-xl p-4 w-72 z-50 border border-gray-200 max-h-[90vh] overflow-y-auto"
//         >
//           <h4 className="font-semibold text-sm mb-3">Export Options</h4>
          
//           <div className="space-y-2">
//             <div className="flex items-center gap-2">
//               <input
//                 type="radio"
//                 name="format"
//                 value="excel"
//                 checked={format === 'excel'}
//                 onChange={() => setFormat('excel')}
//                 className="radio radio-xs"
//               />
//               <span className="text-sm">Excel (.xlsx)</span>
//             </div>
//             <div className="flex items-center gap-2">
//               <input
//                 type="radio"
//                 name="format"
//                 value="csv"
//                 checked={format === 'csv'}
//                 onChange={() => setFormat('csv')}
//                 className="radio radio-xs"
//               />
//               <span className="text-sm">CSV (.csv)</span>
//             </div>
//             <div className="flex items-center gap-2">
//               <input
//                 type="radio"
//                 name="format"
//                 value="json"
//                 checked={format === 'json'}
//                 onChange={() => setFormat('json')}
//                 className="radio radio-xs"
//               />
//               <span className="text-sm">JSON (.json)</span>
//             </div>
            
//             <div className="divider my-1"></div>
            
//             <label className="flex items-center gap-2 cursor-pointer">
//               <input
//                 type="checkbox"
//                 checked={includeSummary}
//                 onChange={() => setIncludeSummary(!includeSummary)}
//                 className="checkbox checkbox-xs"
//               />
//               <span className="text-sm">Include Summary</span>
//             </label>
            
//             <label className="flex items-center gap-2 cursor-pointer">
//               <input
//                 type="checkbox"
//                 checked={includeCharts}
//                 onChange={() => setIncludeCharts(!includeCharts)}
//                 className="checkbox checkbox-xs"
//               />
//               <span className="text-sm">Include Charts</span>
//             </label>
            
//             <label className="flex items-center gap-2 cursor-pointer">
//               <input
//                 type="checkbox"
//                 checked={emailReport}
//                 onChange={() => setEmailReport(!emailReport)}
//                 className="checkbox checkbox-xs"
//               />
//               <span className="text-sm">Email Report</span>
//             </label>

//             <label className="flex items-center gap-2 cursor-pointer">
//               <input
//                 type="checkbox"
//                 checked={scheduleExport}
//                 onChange={() => setScheduleExport(!scheduleExport)}
//                 className="checkbox checkbox-xs"
//               />
//               <span className="text-sm">Schedule Export</span>
//             </label>

//             {scheduleExport && (
//               <div className="ml-6 space-y-2">
//                 <div>
//                   <label className="text-[10px] text-gray-500">Time</label>
//                   <input
//                     type="time"
//                     className="input input-bordered input-xs w-full"
//                     value={scheduleTime}
//                     onChange={(e) => setScheduleTime(e.target.value)}
//                   />
//                 </div>
//                 <div>
//                   <label className="text-[10px] text-gray-500">Frequency</label>
//                   <select
//                     className="select select-bordered select-xs w-full"
//                     value={scheduleFrequency}
//                     onChange={(e) => setScheduleFrequency(e.target.value)}
//                   >
//                     <option value="daily">Daily</option>
//                     <option value="weekly">Weekly</option>
//                     <option value="monthly">Monthly</option>
//                   </select>
//                 </div>
//               </div>
//             )}
//           </div>

//           <div className="mt-3 flex gap-2">
//             <button
//               className="btn btn-primary btn-xs flex-1 text-white"
//               onClick={handleExport}
//             >
//               Export Now
//             </button>
//             <button
//               className="btn btn-ghost btn-xs"
//               onClick={close}
//             >
//               Cancel
//             </button>
//           </div>

//           <div className="mt-2 text-[10px] text-gray-400 text-center">
//             {totalItems} items to export
//             {scheduleExport && scheduleTime && ` • Scheduled for ${scheduleTime}`}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// });

// ExportOptions.displayName = "ExportOptions";

// // ============================================================
// // MAIN COMPONENT: BalanceSummary
// // ============================================================

// function BalanceSummary() {
//   const { cndata, loading } = useContext(GetDataContext);
//   const [error, setError] = useState(null);

//   // State management with localStorage persistence
//   const [selectedPI, setSelectedPI] = useLocalStorage('balanceSummary_selectedPI', []);
//   const [selectedOrder, setSelectedOrder] = useLocalStorage('balanceSummary_selectedOrder', []);
//   const [selectedLC, setSelectedLC] = useLocalStorage('balanceSummary_selectedLC', []);
//   const [selectedInvoice, setSelectedInvoice] = useLocalStorage('balanceSummary_selectedInvoice', []);
//   const [selectedCustomer, setSelectedCustomer] = useLocalStorage('balanceSummary_selectedCustomer', []);
//   const [selectedBuyer, setSelectedBuyer] = useLocalStorage('balanceSummary_selectedBuyer', []);
//   const [selectedDelivery, setSelectedDelivery] = useLocalStorage('balanceSummary_selectedDelivery', []);
//   const [selectedColumns, setSelectedColumns] = useLocalStorage('balanceSummary_columns', COLUMN_CONFIG.defaultVisible);
//   const [selectedRows, setSelectedRows] = useLocalStorage('balanceSummary_selectedRows', []);
//   const [favorites, setFavorites] = useLocalStorage('balanceSummary_favorites', []);
//   const [savedFilters, setSavedFilters] = useLocalStorage('balanceSummary_savedFilters', []);

//   // UI State
//   const [search, setSearch] = useState("");
//   const [multiSearch, setMultiSearch] = useState("");
//   const [piSearch, setPiSearch] = useState("");
//   const [orderSearch, setOrderSearch] = useState("");
//   const [lcSearch, setLcSearch] = useState("");
//   const [invoiceSearch, setInvoiceSearch] = useState("");
//   const [customerSearch, setCustomerSearch] = useState("");
//   const [buyerSearch, setBuyerSearch] = useState("");
//   const [deliverySearch, setDeliverySearch] = useState("");
//   const [piOpen, setPiOpen] = useState(false);
//   const [orderOpen, setOrderOpen] = useState(false);
//   const [lcOpen, setLcOpen] = useState(false);
//   const [invoiceOpen, setInvoiceOpen] = useState(false);
//   const [customerOpen, setCustomerOpen] = useState(false);
//   const [buyerOpen, setBuyerOpen] = useState(false);
//   const [deliveryOpen, setDeliveryOpen] = useState(false);
//   const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  
//   // Advanced filters state
//   const [dateRange, setDateRange] = useState({ start: "", end: "" });
//   const [minValue, setMinValue] = useState("");
//   const [maxValue, setMaxValue] = useState("");
//   const [statusFilter, setStatusFilter] = useState("");
//   const [sectionFilter, setSectionFilter] = useState("");

//   // Quick view modal
//   const [quickViewItem, setQuickViewItem] = useState(null);
//   const [showQuickView, setShowQuickView] = useState(false);

//   // Background state
//   const [currentBg, setCurrentBg] = useState(null);

//   // Deep thinking insights
//   const [deepInsights, setDeepInsights] = useState([]);

//   // Refs
//   const piRef = useRef(null);
//   const orderRef = useRef(null);
//   const lcRef = useRef(null);
//   const invoiceRef = useRef(null);
//   const customerRef = useRef(null);
//   const buyerRef = useRef(null);
//   const deliveryRef = useRef(null);

//   // Debounced search
//   const debouncedSearch = useDebounce(search);

//   // Data processing
//   const maps = useDataMaps(cndata);
//   const summarizedData = useSummarizedData(cndata, maps);

//   // Get unique values for filters
//   const uniqueSections = useMemo(() => {
//     return [...new Set(summarizedData.map(d => d.Section).filter(Boolean))];
//   }, [summarizedData]);

//   const uniquePI = useMemo(() => {
//     return [...new Set(summarizedData.map((d) => d.PINO || "No PI"))];
//   }, [summarizedData]);

//   const uniqueOrder = useMemo(() => {
//     return [
//       ...new Set(
//         summarizedData.map((d) => String(d.WorkOrderNo).trim()).filter(Boolean)
//       ),
//     ];
//   }, [summarizedData]);

//   const uniqueLC = useMemo(() => {
//     return [
//       ...new Set(
//         summarizedData.flatMap((d) => d.LCList.map((l) => l.lcNo || "No LC"))
//       ),
//     ];
//   }, [summarizedData]);

//   const uniqueInvoice = useMemo(() => {
//     return [
//       ...new Set(
//         summarizedData.flatMap((d) =>
//           d.InvoiceList.map((i) => i.invoiceNo || "No Invoice")
//         )
//       ),
//     ];
//   }, [summarizedData]);

//   const uniqueCustomers = useMemo(() => {
//     return [...new Set(summarizedData.map((d) => d.CustomerName || "Unknown"))];
//   }, [summarizedData]);

//   const uniqueBuyers = useMemo(() => {
//     return [...new Set(summarizedData.map((d) => d.Buyer || "Unknown"))];
//   }, [summarizedData]);

//   const uniqueDeliveries = useMemo(() => {
//     return [...new Set(summarizedData.map((d) => d.DeliverName || "Unknown"))];
//   }, [summarizedData]);

//   // Filtered options
//   const filteredPI = useMemo(
//     () => uniquePI.filter((pi) => pi.toLowerCase().includes(piSearch.toLowerCase())),
//     [uniquePI, piSearch]
//   );

//   const filteredOrder = useMemo(
//     () => uniqueOrder.filter((order) => order.toString().includes(orderSearch)),
//     [uniqueOrder, orderSearch]
//   );

//   const filteredLC = useMemo(
//     () => uniqueLC.filter((lc) => lc.toLowerCase().includes(lcSearch.toLowerCase())),
//     [uniqueLC, lcSearch]
//   );

//   const filteredInvoice = useMemo(
//     () => uniqueInvoice.filter((inv) => inv.toLowerCase().includes(invoiceSearch.toLowerCase())),
//     [uniqueInvoice, invoiceSearch]
//   );

//   const filteredCustomers = useMemo(
//     () => uniqueCustomers.filter((c) => c.toLowerCase().includes(customerSearch.toLowerCase())),
//     [uniqueCustomers, customerSearch]
//   );

//   const filteredBuyers = useMemo(
//     () => uniqueBuyers.filter((b) => b.toLowerCase().includes(buyerSearch.toLowerCase())),
//     [uniqueBuyers, buyerSearch]
//   );

//   const filteredDeliveries = useMemo(
//     () => uniqueDeliveries.filter((d) => d.toLowerCase().includes(deliverySearch.toLowerCase())),
//     [uniqueDeliveries, deliverySearch]
//   );

//   // Prepare filters object
//   const filters = useMemo(() => ({
//     selectedPI,
//     selectedOrder,
//     selectedLC,
//     selectedInvoice,
//     selectedCustomer,
//     selectedBuyer,
//     selectedDelivery,
//     dateRange,
//     minValue,
//     maxValue,
//     statusFilter,
//     sectionFilter,
//     favorites,
//     showFavoritesOnly,
//     multiSearch
//   }), [selectedPI, selectedOrder, selectedLC, selectedInvoice, selectedCustomer, selectedBuyer, selectedDelivery, dateRange, minValue, maxValue, statusFilter, sectionFilter, favorites, showFavoritesOnly, multiSearch]);

//   // Apply all filters
//   const filteredData = useFilters(
//     summarizedData,
//     filters,
//     debouncedSearch
//   );

//   // Pagination
//   const { 
//     currentPage, 
//     setCurrentPage, 
//     pageCount, 
//     displayedData, 
//     totalData, 
//     grandTotal,
//     totalItems 
//   } = usePagination(filteredData);

//   // ============================================================
//   // HISTORY LOGGING
//   // ============================================================
//   const logHistory = useCallback((action, data) => {
//     try {
//       const history = JSON.parse(localStorage.getItem('dataHistory') || '[]');
//       const newHistory = [{
//         timestamp: new Date().toISOString(),
//         action,
//         data: typeof data === 'string' ? data : JSON.stringify(data)
//       }, ...history].slice(0, CONFIG.MAX_HISTORY_ITEMS);
//       localStorage.setItem('dataHistory', JSON.stringify(newHistory));
//     } catch (error) {
//       console.error('Error logging history:', error);
//     }
//   }, []);

//   // ============================================================
//   // DEEP THINK HANDLER
//   // ============================================================
//   const handleDeepThink = useCallback((insights) => {
//     if (insights && insights.length > 0) {
//       setDeepInsights(insights);
//       toast.success(`🧠 ${insights.length} insights received!`);
//     } else {
//       setDeepInsights([]);
//       toast.info('No insights generated. Try adjusting your data.');
//     }
//   }, []);

//   // ============================================================
//   // TOGGLE HANDLERS
//   // ============================================================
//   const togglePI = useCallback((value) => {
//     if (Array.isArray(value)) {
//       setSelectedPI(value);
//     } else {
//       setSelectedPI(prev => 
//         prev.includes(value) ? prev.filter(p => p !== value) : [...prev, value]
//       );
//     }
//     setCurrentPage(0);
//   }, [setSelectedPI, setCurrentPage]);

//   const toggleOrder = useCallback((value) => {
//     const val = String(value).trim();
//     if (Array.isArray(value)) {
//       setSelectedOrder(value.map(v => String(v).trim()));
//     } else {
//       setSelectedOrder(prev => 
//         prev.includes(val) ? prev.filter(o => o !== val) : [...prev, val]
//       );
//     }
//     setCurrentPage(0);
//   }, [setSelectedOrder, setCurrentPage]);

//   const toggleLC = useCallback((value) => {
//     if (Array.isArray(value)) {
//       setSelectedLC(value);
//     } else {
//       setSelectedLC(prev => 
//         prev.includes(value) ? prev.filter(x => x !== value) : [...prev, value]
//       );
//     }
//     setCurrentPage(0);
//   }, [setSelectedLC, setCurrentPage]);

//   const toggleInvoice = useCallback((value) => {
//     if (Array.isArray(value)) {
//       setSelectedInvoice(value);
//     } else {
//       setSelectedInvoice(prev => 
//         prev.includes(value) ? prev.filter(x => x !== value) : [...prev, value]
//       );
//     }
//     setCurrentPage(0);
//   }, [setSelectedInvoice, setCurrentPage]);

//   const toggleCustomer = useCallback((value) => {
//     if (Array.isArray(value)) {
//       setSelectedCustomer(value);
//     } else {
//       setSelectedCustomer(prev => 
//         prev.includes(value) ? prev.filter(x => x !== value) : [...prev, value]
//       );
//     }
//     setCurrentPage(0);
//   }, [setSelectedCustomer, setCurrentPage]);

//   const toggleBuyer = useCallback((value) => {
//     if (Array.isArray(value)) {
//       setSelectedBuyer(value);
//     } else {
//       setSelectedBuyer(prev => 
//         prev.includes(value) ? prev.filter(x => x !== value) : [...prev, value]
//       );
//     }
//     setCurrentPage(0);
//   }, [setSelectedBuyer, setCurrentPage]);

//   const toggleDelivery = useCallback((value) => {
//     if (Array.isArray(value)) {
//       setSelectedDelivery(value);
//     } else {
//       setSelectedDelivery(prev => 
//         prev.includes(value) ? prev.filter(x => x !== value) : [...prev, value]
//       );
//     }
//     setCurrentPage(0);
//   }, [setSelectedDelivery, setCurrentPage]);

//   const toggleColumn = useCallback((column) => {
//     setSelectedColumns(prev =>
//       prev.includes(column) ? prev.filter(c => c !== column) : [...prev, column]
//     );
//   }, [setSelectedColumns]);

//   const toggleFavorite = useCallback((orderId) => {
//     setFavorites(prev => 
//       prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
//     );
//     const isFavorite = favorites.includes(orderId);
//     logHistory(isFavorite ? 'Removed from favorites' : 'Added to favorites', orderId);
//   }, [favorites, setFavorites, logHistory]);

//   // Reset all filters
//   const resetFilters = useCallback(() => {
//     setSelectedPI([]);
//     setSelectedOrder([]);
//     setSelectedLC([]);
//     setSelectedInvoice([]);
//     setSelectedCustomer([]);
//     setSelectedBuyer([]);
//     setSelectedDelivery([]);
//     setSearch("");
//     setMultiSearch("");
//     setDateRange({ start: "", end: "" });
//     setMinValue("");
//     setMaxValue("");
//     setStatusFilter("");
//     setSectionFilter("");
//     setShowFavoritesOnly(false);
//     setPiSearch("");
//     setOrderSearch("");
//     setLcSearch("");
//     setInvoiceSearch("");
//     setCustomerSearch("");
//     setBuyerSearch("");
//     setDeliverySearch("");
//     setCurrentPage(0);
//     toast.info("All filters have been reset");
//   }, [setSelectedPI, setSelectedOrder, setSelectedLC, setSelectedInvoice, setSelectedCustomer, setSelectedBuyer, setSelectedDelivery, setCurrentPage]);

//   // Handle filter changes
//   const handleFilterChange = useCallback((key, value) => {
//     const setters = {
//       dateRange: setDateRange,
//       minValue: setMinValue,
//       maxValue: setMaxValue,
//       statusFilter: setStatusFilter,
//       sectionFilter: setSectionFilter,
//       showFavoritesOnly: setShowFavoritesOnly
//     };
//     if (setters[key]) {
//       setters[key](value);
//     }
//     setCurrentPage(0);
//   }, [setCurrentPage]);

//   // Save filter
//   const saveFilter = useCallback((name) => {
//     const filterData = {
//       id: Date.now().toString(),
//       name,
//       filters: {
//         selectedPI,
//         selectedOrder,
//         selectedLC,
//         selectedInvoice,
//         selectedCustomer,
//         selectedBuyer,
//         selectedDelivery,
//         dateRange,
//         minValue,
//         maxValue,
//         statusFilter,
//         sectionFilter,
//         showFavoritesOnly,
//         multiSearch
//       },
//       created: new Date().toISOString()
//     };
//     setSavedFilters(prev => [...prev, filterData]);
//     logHistory('Saved filter', name);
//     toast.success(`Filter "${name}" saved!`);
//   }, [selectedPI, selectedOrder, selectedLC, selectedInvoice, selectedCustomer, selectedBuyer, selectedDelivery, dateRange, minValue, maxValue, statusFilter, sectionFilter, showFavoritesOnly, multiSearch, setSavedFilters, logHistory]);

//   // Load filter
//   const loadFilter = useCallback((filter) => {
//     const f = filter.filters;
//     setSelectedPI(f.selectedPI || []);
//     setSelectedOrder(f.selectedOrder || []);
//     setSelectedLC(f.selectedLC || []);
//     setSelectedInvoice(f.selectedInvoice || []);
//     setSelectedCustomer(f.selectedCustomer || []);
//     setSelectedBuyer(f.selectedBuyer || []);
//     setSelectedDelivery(f.selectedDelivery || []);
//     setDateRange(f.dateRange || { start: "", end: "" });
//     setMinValue(f.minValue || "");
//     setMaxValue(f.maxValue || "");
//     setStatusFilter(f.statusFilter || "");
//     setSectionFilter(f.sectionFilter || "");
//     setShowFavoritesOnly(f.showFavoritesOnly || false);
//     setMultiSearch(f.multiSearch || "");
//     setCurrentPage(0);
//     toast.success(`Loaded filter: ${filter.name}`);
//     logHistory('Loaded filter', filter.name);
//   }, [setSelectedPI, setSelectedOrder, setSelectedLC, setSelectedInvoice, setSelectedCustomer, setSelectedBuyer, setSelectedDelivery, setCurrentPage, logHistory]);

//   // Delete filter
//   const deleteFilter = useCallback((id) => {
//     setSavedFilters(prev => prev.filter(f => f.id !== id));
//     toast.info('Filter deleted');
//   }, [setSavedFilters]);

//   // Handle row click
//   const handleRowClick = useCallback((item) => {
//     const details = [
//       `Order: ${item.WorkOrderNo}`,
//       `Customer: ${item.CustomerName}`,
//       `Delivery: ${item.DeliverName}`,
//       `PI: ${item.PINO}`,
//       `Value: $${item.TotalValue}`,
//       `Status: ${item.completionRate}% complete`
//     ];
//     toast.info(details.join(' • '));
//     logHistory('Viewed order', item.WorkOrderNo);
//   }, [logHistory]);

//   // Handle row select
//   const handleRowSelect = useCallback((rows) => {
//     setSelectedRows(rows);
//   }, [setSelectedRows]);

//   // Handle quick view
//   const handleQuickView = useCallback((item) => {
//     setQuickViewItem(item);
//     setShowQuickView(true);
//     logHistory('Quick view', item.WorkOrderNo);
//   }, [logHistory]);

//   // Handle background change
//   const handleBackgroundChange = useCallback((bg) => {
//     setCurrentBg(bg);
//     logHistory('Background changed', bg.gradient);
//   }, [logHistory]);

//   // Click outside handler
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (piRef.current && !piRef.current.contains(event.target)) setPiOpen(false);
//       if (orderRef.current && !orderRef.current.contains(event.target)) setOrderOpen(false);
//       if (lcRef.current && !lcRef.current.contains(event.target)) setLcOpen(false);
//       if (invoiceRef.current && !invoiceRef.current.contains(event.target)) setInvoiceOpen(false);
//       if (customerRef.current && !customerRef.current.contains(event.target)) setCustomerOpen(false);
//       if (buyerRef.current && !buyerRef.current.contains(event.target)) setBuyerOpen(false);
//       if (deliveryRef.current && !deliveryRef.current.contains(event.target)) setDeliveryOpen(false);
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   // Keyboard shortcuts
//   useEffect(() => {
//     const handleKeyDown = (e) => {
//       if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
//         e.preventDefault();
//         document.getElementById('global-search')?.focus();
//       }
//       if (e.key === 'Escape') {
//         setSearch('');
//         setShowQuickView(false);
//       }
//       if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
//         e.preventDefault();
//         if (displayedData.length > 0) {
//           setSelectedRows(displayedData.map(d => d.WorkOrderNo));
//           toast.info(`Selected ${displayedData.length} items`);
//         }
//       }
//       if ((e.ctrlKey || e.metaKey) && e.key === 't') {
//         e.preventDefault();
//         const deepThinkBtn = document.querySelector('[data-deep-think]');
//         if (deepThinkBtn) {
//           deepThinkBtn.click();
//         } else {
//           toast.info('🧠 Deep Think is not available');
//         }
//       }
//     };

//     document.addEventListener('keydown', handleKeyDown);
//     return () => document.removeEventListener('keydown', handleKeyDown);
//   }, [displayedData, setSelectedRows]);

//   // ============================================================
//   // EXPORT FUNCTION - FIXED (Auto width/height, no wrap, $ sign for values)
//   // ============================================================
//   const exportToExcel = useCallback((options = {}) => {
//     const { 
//       format = 'excel', 
//       includeSummary = true,
//       includeCharts = false,
//       emailReport = false,
//       scheduleExport = false,
//       scheduleTime = '',
//       scheduleFrequency = 'daily'
//     } = options;
    
//     try {
//       if (filteredData.length === 0) {
//         toast.warning("No data to export");
//         return;
//       }

//       // Handle scheduled export
//       if (scheduleExport && scheduleTime) {
//         toast.info(`📅 Export scheduled for ${scheduleTime} ${scheduleFrequency}ly`);
//         const scheduledExports = JSON.parse(localStorage.getItem('scheduledExports') || '[]');
//         scheduledExports.push({
//           id: Date.now(),
//           time: scheduleTime,
//           frequency: scheduleFrequency,
//           filters: {
//             selectedPI,
//             selectedOrder,
//             selectedLC,
//             selectedInvoice,
//             selectedCustomer,
//             selectedBuyer,
//             selectedDelivery,
//             dateRange,
//             minValue,
//             maxValue,
//             statusFilter,
//             sectionFilter,
//             showFavoritesOnly,
//             multiSearch
//           },
//           format,
//           includeSummary,
//           includeCharts,
//           emailReport,
//           created: new Date().toISOString()
//         });
//         localStorage.setItem('scheduledExports', JSON.stringify(scheduledExports));
//         toast.success('Export scheduled successfully!');
//         return;
//       }

//       toast.info(`Preparing export of ${filteredData.length} rows...`);

//       const dataToExport = filteredData;
//       const safeCell = (value) => {
//         const text = String(value ?? "");
//         if (text.length > 32000) {
//           return text.substring(0, 32000) + " ...[TRUNCATED]";
//         }
//         return text;
//       };

//       const wb = XLSX.utils.book_new();
//       const groupedByPI = {};
//       dataToExport.forEach((item) => {
//         const key = item.PINO || "No PI";
//         if (!groupedByPI[key]) groupedByPI[key] = [];
//         groupedByPI[key].push(item);
//       });

//       let data = [];

//       for (const [pi, items] of Object.entries(groupedByPI)) {
//         data.push([`PI: ${pi}`]);
//         data.push([]);

//         data.push([
//           "Order No", "Order Date", "Customer", "Delivery", "PI No",
//           "LC No", "Invoice No", "Section", "Order Qty", "Challan Qty",
//           "Balance Qty", "Order Value", "Challan Value", "Balance Value", "Challan No"
//         ]);

//         items.forEach((item) => {
//           const challans = item.ChallanNo || [];
//           let challanText = challans
//             .map((ch, i) => `${i + 1}. ${ch.challanNo} (${ch.status})`)
//             .join("\n");

//           if (challanText.length > 32767) {
//             challanText = challanText.slice(0, 32000) + "\n...[TRUNCATED]";
//           }

//           data.push([
//             item.WorkOrderNo,
//             item.OrderReceiveDate
//               ? new Date(item.OrderReceiveDate).toLocaleDateString(CONFIG.DATE_FORMAT)
//               : "",
//             item.CustomerName,
//             item.DeliverName,
//             item.PINO,
//             (item.LCList || []).map(l => l.lcNo).join(", "),
//             (item.InvoiceList || []).map(i => i.invoiceNo).join(", "),
//             item.Section,
//             Number(item.TotalQty).toFixed(2),
//             Number(item.ChallanQTY).toFixed(2),
//             Number(item.BalanceQty).toFixed(2),
//             Number(item.TotalValue).toFixed(2),
//             Number(item.ChallanValue).toFixed(2),
//             Number(item.BalanceValue).toFixed(2),
//             safeCell(challanText),
//           ]);
//         });

//         data.push([
//           "Subtotal",
//           "", "", "", "", "", "", "",
//           items.reduce((a, b) => a + Number(b.TotalQty), 0).toFixed(2),
//           items.reduce((a, b) => a + Number(b.ChallanQTY), 0).toFixed(2),
//           items.reduce((a, b) => a + Number(b.BalanceQty), 0).toFixed(2),
//           items.reduce((a, b) => a + Number(b.TotalValue), 0).toFixed(2),
//           items.reduce((a, b) => a + Number(b.ChallanValue), 0).toFixed(2),
//           items.reduce((a, b) => a + Number(b.BalanceValue), 0).toFixed(2),
//           ""
//         ]);

//         data.push([]);
//       }

//       const rawData = [];
//       rawData.push([
//         "Order No", "Order Date", "Customer", "Delivery", "PI No",
//         "LC No", "Invoice No", "Section", "Order Qty", "Challan Qty",
//         "Balance Qty", "Order Value", "Challan Value", "Balance Value", "Challan Info"
//       ]);

//       dataToExport.forEach((item) => {
//         const lcNos = (item.LCList || []).map(l => l.lcNo).filter(Boolean).join(", ");
//         const invoiceNos = (item.InvoiceList || []).map(i => i.invoiceNo).filter(Boolean).join(", ");
//         const challanInfo = (item.ChallanNo || []).map(ch => `${ch.challanNo} (${ch.status})`).join(", ");

//         rawData.push([
//           item.WorkOrderNo,
//           item.OrderReceiveDate ? new Date(item.OrderReceiveDate).toLocaleDateString(CONFIG.DATE_FORMAT) : "",
//           item.CustomerName,
//           item.DeliverName,
//           item.PINO,
//           lcNos,
//           invoiceNos,
//           item.Section,
//           Number(item.TotalQty).toFixed(2),
//           Number(item.ChallanQTY).toFixed(2),
//           Number(item.BalanceQty).toFixed(2),
//           Number(item.TotalValue).toFixed(2),
//           Number(item.ChallanValue).toFixed(2),
//           Number(item.BalanceValue).toFixed(2),
//           challanInfo
//         ]);
//       });

//       const ws = XLSX.utils.aoa_to_sheet(data);
//       const ws2 = XLSX.utils.aoa_to_sheet(rawData);
//       XLSX.utils.book_append_sheet(wb, ws, "Order Summary");
//       XLSX.utils.book_append_sheet(wb, ws2, "All Data");

//       // Merges for PI headers
//       let rowPointer = 0;
//       for (const items of Object.values(groupedByPI)) {
//         if (!ws["!merges"]) ws["!merges"] = [];
//         const lastCol = 14;
//         ws["!merges"].push({
//           s: { r: rowPointer, c: 0 },
//           e: { r: rowPointer, c: lastCol },
//         });
//         const headerRows = 3;
//         const subtotalRows = 2;
//         rowPointer += headerRows + items.length + subtotalRows;
//       }

//       // AUTO WIDTH - calculate based on content
//       const colWidths = [];
//       for (let c = 0; c < 15; c++) {
//         let maxLength = 10;
//         for (let r = 0; r < data.length; r++) {
//           const cellValue = data[r][c];
//           if (cellValue) {
//             const lines = cellValue.toString().split("\n");
//             for (const line of lines) {
//               const len = line.length;
//               if (len > maxLength) maxLength = len + 2;
//             }
//           }
//         }
//         // For challan column (index 14), allow more width
//         if (c === 14) {
//           maxLength = Math.min(maxLength + 10, 60);
//         } else {
//           maxLength = Math.min(maxLength, 30);
//         }
//         colWidths.push({ wch: maxLength });
//       }
//       ws["!cols"] = colWidths;

//       // AUTO HEIGHT - based on content
//       ws["!rows"] = data.map((row) => {
//         let maxLines = 1;
//         row.forEach((cell) => {
//           if (!cell) return;
//           const lines = cell.toString().split("\n").length;
//           if (lines > maxLines) maxLines = lines;
//         });
//         return { hpt: Math.max(20, maxLines * 18) };
//       });

//       // Apply styling
//       data.forEach((row, r) => {
//         row.forEach((_, c) => {
//           const cell = XLSX.utils.encode_cell({ r, c });
//           if (!ws[cell]) return;

//           ws[cell].s = {
//             font: { sz: 11, name: "Calibri" },
//             alignment: {
//               horizontal: c === 14 ? "left" : "center",
//               vertical: "center",
//               wrapText: false, // NO WRAP
//             },
//             border: {
//               top: { style: "thin", color: { rgb: "000000" } },
//               bottom: { style: "thin", color: { rgb: "000000" } },
//               left: { style: "thin", color: { rgb: "000000" } },
//               right: { style: "thin", color: { rgb: "000000" } },
//             },
//           };

//           // PI Header styling
//           if (ws["!merges"]?.some((m) => m.s.r === r)) {
//             ws[cell].s.font = {
//               bold: true,
//               sz: 14,
//               color: { rgb: "FFFFFF" },
//             };
//             ws[cell].s.fill = { fgColor: { rgb: "2F75B5" } };
//             ws[cell].s.alignment = {
//               horizontal: "center",
//               vertical: "center",
//             };
//           }

//           // Currency format for value columns (11, 12, 13)
//           if (c === 11 || c === 12 || c === 13) {
//             ws[cell].s.numFmt = '"$"#,##0.00';
//             ws[cell].s.alignment.horizontal = "right";
//           }

//           // Subtotal row styling
//           if (row[0] === "Subtotal") {
//             ws[cell].s.fill = { fgColor: { rgb: "D9E1F2" } };
//             ws[cell].s.font.bold = true;
//           }

//           // Header row styling
//           if (r === 2) {
//             ws[cell].s.fill = { fgColor: { rgb: "4472C4" } };
//             ws[cell].s.font = { bold: true, sz: 11, color: { rgb: "FFFFFF" } };
//             ws[cell].s.alignment.horizontal = "center";
//             ws[cell].s.alignment.vertical = "center";
//           }
//         });
//       });

//       if (includeSummary) {
//         const summaryData = [
//           ['Order Summary Report'],
//           ['Generated:', new Date().toLocaleString()],
//           ['Total Orders:', filteredData.length],
//           ['Total Quantity:', grandTotal.TotalQty.toFixed(2)],
//           ['Total Challan Qty:', grandTotal.ChallanQTY.toFixed(2)],
//           ['Total Balance Qty:', grandTotal.BalanceQty.toFixed(2)],
//           ['Total Value:', `$${grandTotal.TotalValue.toFixed(2)}`],
//           ['Total Challan Value:', `$${grandTotal.ChallanValue.toFixed(2)}`],
//           ['Total Balance Value:', `$${grandTotal.BalanceValue.toFixed(2)}`],
//           ['Completion Rate:', `${((grandTotal.ChallanQTY / grandTotal.TotalQty) * 100 || 0).toFixed(1)}%`],
//           ['Favorites:', favorites.length],
//           ['Filtered Items:', filteredData.length],
//         ];
//         const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
//         wsSummary['!cols'] = [{ wch: 22 }, { wch: 30 }];
//         XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");
//       }

//       if (includeCharts) {
//         const chartData = [
//           ['Chart Data'],
//           ['Metric', 'Value'],
//           ['Total Orders', filteredData.length],
//           ['Total Quantity', grandTotal.TotalQty],
//           ['Total Challan Qty', grandTotal.ChallanQTY],
//           ['Total Balance Qty', grandTotal.BalanceQty],
//           ['Total Value', grandTotal.TotalValue],
//           ['Total Challan Value', grandTotal.ChallanValue],
//           ['Total Balance Value', grandTotal.BalanceValue],
//         ];
//         const wsChart = XLSX.utils.aoa_to_sheet(chartData);
//         wsChart['!cols'] = [{ wch: 22 }, { wch: 18 }];
//         XLSX.utils.book_append_sheet(wb, wsChart, "Charts Data");
//         toast.info('📊 Chart data included in export');
//       }

//       const fileName = `OrderSummaryReport_${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xlsx'}`;
//       XLSX.writeFile(wb, fileName);
      
//       toast.success(`Successfully exported ${filteredData.length} rows!`);
      
//       if (emailReport) {
//         toast.info('📧 Report will be sent to your email');
//         localStorage.setItem('lastEmailReport', JSON.stringify({
//           fileName,
//           timestamp: new Date().toISOString(),
//           count: filteredData.length
//         }));
//       }
      
//       logHistory('Exported data', { format, count: filteredData.length, includeCharts, emailReport });
      
//     } catch (error) {
//       console.error("Export error:", error);
//       toast.error(`Failed to export: ${error.message}`);
//     }
//   }, [filteredData, grandTotal, favorites, logHistory, selectedPI, selectedOrder, selectedLC, selectedInvoice, selectedCustomer, selectedBuyer, selectedDelivery, dateRange, minValue, maxValue, statusFilter, sectionFilter, showFavoritesOnly, multiSearch]);

//   // Error handling
//   useEffect(() => {
//     if (error) {
//       toast.error(error);
//     }
//   }, [error]);

//   // Get match count for multi-search
//   const getMultiSearchCount = useCallback(() => {
//     if (!multiSearch || !multiSearch.trim()) return 0;
//     const items = multiSearch.split(/[\n,;|]+/).filter(item => item.trim().length > 0);
//     return items.length;
//   }, [multiSearch]);

//   return (
//     <BackgroundGenerator onBackgroundChange={handleBackgroundChange}>
//       <div className="container mx-auto px-3 py-4 relative z-10">
//         <OrderForm />

//         {/* Header */}
//         <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
//           <div>
//             <h1 className="text-xl font-bold text-gray-800">Order Balance Summary</h1>
//             <p className="text-xs text-gray-600">
//               {totalItems} orders • {summarizedData.length} total items
//               {favorites.length > 0 && ` • ⭐ ${favorites.length} favorites`}
//               {multiSearch && multiSearch.trim() && (
//                 <span className="ml-2 text-warning"> • 🔍 Multi-search: {getMultiSearchCount()} items</span>
//               )}
//             </p>
//           </div>
//           <div className="flex gap-1 flex-wrap items-center">
//             <NotificationCenter data={filteredData} />
//             <DataHistory />
//             <ColumnVisibilityManager
//               columns={COLUMN_CONFIG.allColumns}
//               visibleColumns={selectedColumns}
//               onToggle={toggleColumn}
//             />
//             <ExportOptions 
//               onExport={exportToExcel} 
//               totalItems={totalItems}
//               disabled={totalItems === 0}
//             />
//           </div>
//         </div>

//         {/* Top 5 Analytics */}
//         <TopItemsAnalytics data={filteredData} />

//         {/* Quick Stats */}
//         {grandTotal.TotalQty > 0 && (
//           <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
//             <div className="stat bg-white/80 backdrop-blur-sm rounded-lg shadow-sm p-2">
//               <div className="stat-title text-[10px]">Total Orders</div>
//               <div className="stat-value text-base">{totalItems}</div>
//             </div>
//             <div className="stat bg-white/80 backdrop-blur-sm rounded-lg shadow-sm p-2">
//               <div className="stat-title text-[10px]">Total Qty</div>
//               <div className="stat-value text-base text-primary">{Math.ceil(grandTotal.TotalQty)}</div>
//             </div>
//             <div className="stat bg-white/80 backdrop-blur-sm rounded-lg shadow-sm p-2">
//               <div className="stat-title text-[10px]">Challan Qty</div>
//               <div className="stat-value text-base text-success">{Math.ceil(grandTotal.ChallanQTY)}</div>
//             </div>
//             <div className="stat bg-white/80 backdrop-blur-sm rounded-lg shadow-sm p-2">
//               <div className="stat-title text-[10px]">Balance Qty</div>
//               <div className="stat-value text-base text-error">{Math.ceil(grandTotal.BalanceQty)}</div>
//             </div>
//             <div className="stat bg-white/80 backdrop-blur-sm rounded-lg shadow-sm p-2">
//               <div className="stat-title text-[10px]">Total Value</div>
//               <div className="stat-value text-base text-info">${Math.ceil(grandTotal.TotalValue)}</div>
//             </div>
//             <div className="stat bg-white/80 backdrop-blur-sm rounded-lg shadow-sm p-2">
//               <div className="stat-title text-[10px]">Completion</div>
//               <div className="stat-value text-base">
//                 {grandTotal.TotalQty > 0 
//                   ? Math.round((grandTotal.ChallanQTY / grandTotal.TotalQty) * 100)
//                   : 0}%
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Advanced Filters */}
//         <div className="mb-3">
//           <AdvancedFiltersPanel
//             filters={{ dateRange, minValue, maxValue, statusFilter, sectionFilter, showFavoritesOnly }}
//             onFilterChange={handleFilterChange}
//             onReset={resetFilters}
//             totalItems={totalItems}
//             loading={loading}
//             sections={uniqueSections}
//             onExport={exportToExcel}
//             onSaveFilter={saveFilter}
//             savedFilters={savedFilters}
//             onLoadFilter={loadFilter}
//             onDeleteFilter={deleteFilter}
//             onDeepThink={handleDeepThink}
//             data={filteredData}
//           />
//         </div>

//         {/* Search and Quick Filters */}
//         <div className="flex flex-wrap gap-1 mb-3 items-center">
//           <div className="flex-1 min-w-[150px]">
//             <input
//               id="global-search"
//               type="text"
//               placeholder="Search orders, customers, PI... (Ctrl+F)"
//               className="input input-bordered input-xs w-full bg-white/90 backdrop-blur-sm"
//               value={search}
//               onChange={(e) => { setSearch(e.target.value); setCurrentPage(0); }}
//             />
//           </div>

//           <MultiSearchDropdown
//             value={multiSearch}
//             onChange={setMultiSearch}
//             onClear={() => setMultiSearch('')}
//             onSearch={() => {
//               if (multiSearch && multiSearch.trim()) {
//                 const count = getMultiSearchCount();
//                 toast.info(`🔍 Searching for ${count} order numbers...`);
//                 setCurrentPage(0);
//               }
//             }}
//             totalMatches={filteredData.length}
//             isActive={multiSearch && multiSearch.trim().length > 0}
//           />

//           <ProfessionalFilterDropdown
//             label="Order"
//             open={orderOpen}
//             setOpen={setOrderOpen}
//             items={filteredOrder}
//             selectedItems={selectedOrder}
//             onToggle={toggleOrder}
//             searchValue={orderSearch}
//             setSearchValue={setOrderSearch}
//             ref={orderRef}
//             placeholder="Search Order"
//             color="primary"
//           />

//           <ProfessionalFilterDropdown
//             label="PI"
//             open={piOpen}
//             setOpen={setPiOpen}
//             items={filteredPI}
//             selectedItems={selectedPI}
//             onToggle={togglePI}
//             searchValue={piSearch}
//             setSearchValue={setPiSearch}
//             ref={piRef}
//             placeholder="Search PI"
//             color="secondary"
//           />

//           <ProfessionalFilterDropdown
//             label="LC"
//             open={lcOpen}
//             setOpen={setLcOpen}
//             items={filteredLC}
//             selectedItems={selectedLC}
//             onToggle={toggleLC}
//             searchValue={lcSearch}
//             setSearchValue={setLcSearch}
//             ref={lcRef}
//             placeholder="Search LC"
//             color="info"
//           />

//           <ProfessionalFilterDropdown
//             label="Invoice"
//             open={invoiceOpen}
//             setOpen={setInvoiceOpen}
//             items={filteredInvoice}
//             selectedItems={selectedInvoice}
//             onToggle={toggleInvoice}
//             searchValue={invoiceSearch}
//             setSearchValue={setInvoiceSearch}
//             ref={invoiceRef}
//             placeholder="Search Invoice"
//             color="success"
//           />

//           <ProfessionalFilterDropdown
//             label="Customer"
//             open={customerOpen}
//             setOpen={setCustomerOpen}
//             items={filteredCustomers}
//             selectedItems={selectedCustomer}
//             onToggle={toggleCustomer}
//             searchValue={customerSearch}
//             setSearchValue={setCustomerSearch}
//             ref={customerRef}
//             placeholder="Search Customer"
//             color="purple"
//             icon="👤"
//           />

//           <ProfessionalFilterDropdown
//             label="Buyer"
//             open={buyerOpen}
//             setOpen={setBuyerOpen}
//             items={filteredBuyers}
//             selectedItems={selectedBuyer}
//             onToggle={toggleBuyer}
//             searchValue={buyerSearch}
//             setSearchValue={setBuyerSearch}
//             ref={buyerRef}
//             placeholder="Search Buyer"
//             color="pink"
//             icon="💼"
//           />

//           <ProfessionalFilterDropdown
//             label="Delivery"
//             open={deliveryOpen}
//             setOpen={setDeliveryOpen}
//             items={filteredDeliveries}
//             selectedItems={selectedDelivery}
//             onToggle={toggleDelivery}
//             searchValue={deliverySearch}
//             setSearchValue={setDeliverySearch}
//             ref={deliveryRef}
//             placeholder="Search Delivery"
//             color="orange"
//             icon="🚚"
//           />

//           <button
//             className={`btn btn-xs gap-1 ${showFavoritesOnly ? 'btn-warning' : 'btn-ghost'} bg-white/80 backdrop-blur-sm`}
//             onClick={() => setShowFavoritesOnly(prev => !prev)}
//             title="Toggle favorites (Ctrl+F)"
//           >
//             {showFavoritesOnly ? '⭐' : '☆'}
//           </button>

//           {(selectedPI.length > 0 || selectedOrder.length > 0 || 
//             selectedLC.length > 0 || selectedInvoice.length > 0 || 
//             selectedCustomer.length > 0 || selectedBuyer.length > 0 ||
//             selectedDelivery.length > 0 || search || multiSearch ||
//             dateRange.start || dateRange.end || minValue || maxValue ||
//             statusFilter || sectionFilter || showFavoritesOnly) && (
//             <button
//               className="btn btn-ghost btn-xs bg-white/80 backdrop-blur-sm"
//               onClick={resetFilters}
//             >
//               Clear All
//             </button>
//           )}
//         </div>

//         {/* Table - Loader only shows here */}
//         <ProfessionalSummaryTable
//           data={displayedData}
//           columns={selectedColumns}
//           totalData={totalData}
//           onRowClick={handleRowClick}
//           onRowSelect={handleRowSelect}
//           onQuickView={handleQuickView}
//           onFavoriteToggle={toggleFavorite}
//           selectedRows={selectedRows}
//           favorites={favorites}
//           loading={loading}
//         />

//         {/* Pagination */}
//         {pageCount > 1 && (
//           <div className="flex flex-wrap justify-between items-center mt-3 gap-2">
//             <div className="text-xs text-gray-600">
//               Showing {currentPage * CONFIG.ITEMS_PER_PAGE + 1} to{' '}
//               {Math.min((currentPage + 1) * CONFIG.ITEMS_PER_PAGE, totalItems)} of{' '}
//               {totalItems} entries
//               {selectedRows.length > 0 && ` • ${selectedRows.length} selected`}
//             </div>
//             <ReactPaginate
//               breakLabel="..."
//               nextLabel="Next →"
//               previousLabel="← Previous"
//               pageCount={pageCount}
//               onPageChange={({ selected }) => setCurrentPage(selected)}
//               containerClassName="flex gap-0.5"
//               pageLinkClassName="px-2 py-1 border rounded text-xs hover:bg-gray-100 transition-colors bg-white/80 backdrop-blur-sm"
//               activeLinkClassName="bg-primary text-white hover:bg-primary"
//               previousLinkClassName="px-2 py-1 border rounded text-xs hover:bg-gray-100 transition-colors bg-white/80 backdrop-blur-sm"
//               nextLinkClassName="px-2 py-1 border rounded text-xs hover:bg-gray-100 transition-colors bg-white/80 backdrop-blur-sm"
//               disabledClassName="opacity-50 cursor-not-allowed"
//               renderOnZeroPageCount={null}
//             />
//           </div>
//         )}

//         {/* Quick View Modal */}
//         <QuickViewModal
//           item={quickViewItem}
//           isOpen={showQuickView}
//           onClose={() => setShowQuickView(false)}
//         />

//         {/* Deep Insights Banner */}
//         {deepInsights.length > 0 && (
//           <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 backdrop-blur-sm rounded-xl p-4 border border-blue-200 animate-slideIn absolute top-[325px] z-20 w-full ">
//             <div className="flex justify-between items-start">
//               <div>
//                 <h4 className="font-semibold text-sm text-blue-800">🧠 Deep Think Insights</h4>
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
//                   {deepInsights.map((insight, index) => (
//                     <div
//                       key={index}
//                       className={`p-2 rounded-lg text-xs ${
//                         insight.priority === 'critical' ? 'bg-red-100 text-red-700' :
//                         insight.priority === 'high' ? 'bg-orange-100 text-orange-700' :
//                         insight.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
//                         'bg-blue-100 text-blue-700'
//                       }`}
//                     >
//                       <span className="mr-1">{insight.icon}</span>
//                       <span className="font-medium">{insight.title}:</span>
//                       <span className="ml-1">{insight.description}</span>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//               <button
//                 className="btn btn-ghost btn-xs text-gray-400 hover:text-gray-600"
//                 onClick={() => setDeepInsights([])}
//               >
//                 ✕
//               </button>
//             </div>
//           </div>
//         )}

//         {/* Footer */}
//         <div className="mt-4 text-center text-[10px] text-gray-500 border-t pt-3">
//           <p>
//             {totalItems} orders loaded • Last updated: {new Date().toLocaleString(CONFIG.DATE_FORMAT)}
//             {favorites.length > 0 && ` • ⭐ ${favorites.length} favorites`}
//           </p>
//           <div className="flex flex-wrap justify-center gap-3 mt-1">
//             <span>💡 Ctrl+F: Search</span>
//             <span>•</span>
//             <span>⌨️ Ctrl+A: Select All</span>
//             <span>•</span>
//             <span>⭐ Toggle Favorites</span>
//             <span>•</span>
//             <span>🧠 Ctrl+T: Deep Think</span>
//             <span>•</span>
//             <span>📋 Click rows for details</span>
//             <span>•</span>
//             <span>👁️ Quick view icons</span>
//           </div>
//         </div>
//       </div>
//     </BackgroundGenerator>
//   );
// }

// export default BalanceSummary;






////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////




/* PI Summary - Ultimate Enterprise Edition v2.0 with ALL Advanced Features */

import React, { useCallback, useContext, useEffect, useMemo, useRef, useState, useReducer } from "react";
import { GetDataContext } from "../components/DataContext";
import { FourSquare } from "react-loading-indicators";
import OrderForm from "../OrderReport/OrderForm";
import * as XLSX from "xlsx-js-style";
import ReactPaginate from "react-paginate";
import { toast } from "react-toastify";

// ============================================================
// CONSTANTS & CONFIGURATION
// ============================================================

const CONFIG = {
  ITEMS_PER_PAGE: 50,
  MAX_EXCEL_ROWS: 10000,
  DEBOUNCE_DELAY: 300,
  MAX_CHALLAN_DISPLAY: 5,
  DATE_FORMAT: "en-GB",
  CURRENCY_SYMBOL: "$",
  EXCEL_MAX_WIDTH: 25,
  AUTO_REFRESH_INTERVAL: 60000,
  TOP_ITEMS_COUNT: 5,
  MAX_HISTORY_ITEMS: 50,
  CACHE_DURATION: 300000,
  ANIMATION_DURATION: 300,
  SPARKLINE_WIDTH: 80,
  SPARKLINE_HEIGHT: 24,
};

const COLUMN_CONFIG = {
  defaultVisible: [
    "Order", "Date", "Customer", "Delivery", "Buyer", "PI",
    "LC", "Invoice", "Section", "OrderQty", "ChallanQty",
    "BalanceQty", "OrderValue", "ChallanValue", "BalanceValue", "Challan", "Progress"
  ],
  allColumns: [
    { id: "Order", label: "Order No", required: true, pinned: false, width: 120 },
    { id: "Date", label: "Date", required: true, pinned: false, width: 100 },
    { id: "Customer", label: "Customer", required: true, pinned: false, width: 150 },
    { id: "Delivery", label: "Delivery", required: true, pinned: false, width: 150 },
    { id: "Buyer", label: "Buyer", required: true, pinned: false, width: 120 },
    { id: "PI", label: "PI No", required: false, pinned: false, width: 100 },
    { id: "LC", label: "LC No", required: false, pinned: false, width: 100 },
    { id: "Invoice", label: "Invoice No", required: false, pinned: false, width: 100 },
    { id: "Section", label: "Section", required: true, pinned: false, width: 100 },
    { id: "OrderQty", label: "Order Qty", required: true, pinned: false, width: 100 },
    { id: "ChallanQty", label: "Challan Qty", required: true, pinned: false, width: 100 },
    { id: "BalanceQty", label: "Balance Qty", required: true, pinned: false, width: 100 },
    { id: "OrderValue", label: "Order Value", required: true, pinned: false, width: 120 },
    { id: "ChallanValue", label: "Challan Value", required: true, pinned: false, width: 120 },
    { id: "BalanceValue", label: "Balance Value", required: true, pinned: false, width: 120 },
    { id: "Challan", label: "Challan", required: false, pinned: false, width: 200 },
    { id: "Progress", label: "Progress", required: false, pinned: false, width: 120 },
  ]
};

const BACKGROUNDS = [
  { gradient: 'from-blue-50 to-indigo-100', pattern: 'dots', name: 'Ocean Blue' },
  { gradient: 'from-purple-50 to-pink-100', pattern: 'grid', name: 'Purple Haze' },
  { gradient: 'from-green-50 to-teal-100', pattern: 'cross', name: 'Forest Green' },
  { gradient: 'from-yellow-50 to-orange-100', pattern: 'diamond', name: 'Sunset' },
  { gradient: 'from-red-50 to-pink-100', pattern: 'stripe', name: 'Rose Garden' },
  { gradient: 'from-indigo-50 to-blue-100', pattern: 'wave', name: 'Midnight' },
  { gradient: 'from-emerald-50 to-cyan-100', pattern: 'circle', name: 'Emerald' },
  { gradient: 'from-rose-50 to-red-100', pattern: 'hex', name: 'Crimson' },
];

const DARK_BACKGROUNDS = [
  { gradient: 'from-gray-900 to-blue-950', pattern: 'dots', name: 'Midnight Blue' },
  { gradient: 'from-gray-900 to-purple-950', pattern: 'grid', name: 'Deep Purple' },
  { gradient: 'from-gray-900 to-green-950', pattern: 'cross', name: 'Dark Forest' },
  { gradient: 'from-gray-900 to-red-950', pattern: 'hex', name: 'Dark Crimson' },
];

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

const formatCurrency = (value) => `${CONFIG.CURRENCY_SYMBOL}${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatNumber = (value) => Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString(CONFIG.DATE_FORMAT, {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  } catch { return "-"; }
};

const cn = (...classes) => classes.filter(Boolean).join(' ');

// ============================================================
// CUSTOM HOOKS
// ============================================================

const useDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current?.contains(event.target) || buttonRef.current?.contains(event.target)) return;
      setIsOpen(false);
    };
    const handleEsc = (e) => e.key === 'Escape' && setIsOpen(false);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  return { isOpen, toggle: () => setIsOpen(!isOpen), close: () => setIsOpen(false), open: () => setIsOpen(true), dropdownRef, buttonRef };
};

const useDebounce = (value, delay = CONFIG.DEBOUNCE_DELAY) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch { return initialValue; }
  });
  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) { console.error("localStorage error:", error); }
  }, [key, storedValue]);
  return [storedValue, setValue];
};

const useTheme = () => {
  const [theme, setTheme] = useLocalStorage('app-theme', 'light');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
  return { theme, toggleTheme: () => setTheme(t => t === 'light' ? 'dark' : 'light'), setTheme };
};

const useDataMaps = (cndata) => useMemo(() => {
  const challanMap = new Map();
  const lcMap = new Map();
  const invoiceMap = new Map();
  try {
    (cndata?.grupChallan ?? []).forEach(c => challanMap.set(`${c.workOrderNo}-${c.challanNo}`, c.statusDesc));
    (cndata?.bblcData ?? []).forEach(item => {
      const pi = item.customerPINo?.trim();
      if (!pi) return;
      if (!lcMap.has(pi)) lcMap.set(pi, []);
      lcMap.get(pi).push({ lcNo: item.lcNo, lcDate: item.lcDate, totalLCValue: item.totalLCValue });
    });
    (cndata?.invoiceData ?? []).forEach(item => {
      if (!item.lcNo) return;
      if (!invoiceMap.has(item.lcNo)) invoiceMap.set(item.lcNo, []);
      invoiceMap.get(item.lcNo).push({ invoiceNo: item.invoiceNo, invoiceDate: item.invoiceDate, totalInvoiceValue: item.totalInvoiceValue });
    });
  } catch (e) { console.error("Data map error:", e); }
  return { challanMap, lcMap, invoiceMap };
}, [cndata]);

const useSummarizedData = (cndata, maps) => useMemo(() => {
  const apidata = cndata?.apiData ?? [];
  const { challanMap, lcMap, invoiceMap } = maps;
  try {
    const grouped = new Map();
    apidata.forEach(item => {
      const key = `${item.WorkOrderNo}-${item.CustomerPINo}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          WorkOrderNo: item.WorkOrderNo, OrderReceiveDate: item.OrderReceiveDate,
          DeliverName: item.FName, CustomerName: item.CName,
          PINO: item.CustomerPINo || "No PI", Section: item.ProductCategoryName,
          Buyer: item.BuyerName, TotalQty: 0, TotalValue: 0, ChallanQTY: 0,
          ChallanValue: 0, BalanceQty: 0, BalanceValue: 0, ChallanNo: [], itemCount: 0,
          history: [Number(item.BreakDownQTY) || 0]
        });
      }
      const row = grouped.get(key);
      row.TotalQty += Number(item.BreakDownQTY) || 0;
      row.ChallanQTY += Number(item.ChallanQTY) || 0;
      row.BalanceQty += Number(item.BalanceQTY) || 0;
      row.TotalValue += Number(item.TotalOrderValue) || 0;
      row.ChallanValue += Number(item.ChallanValue) || 0;
      row.BalanceValue += Number(item.BalanceValue) || 0;
      row.itemCount += 1;
      row.history.push(Number(item.ChallanQTY) || 0);
      if (item.ChallanNo) {
        item.ChallanNo.split(",").map(c => c.trim()).filter(Boolean).forEach(cn => {
          const status = challanMap.get(`${item.WorkOrderNo}-${cn}`) || "Unknown";
          if (!row.ChallanNo.some(c => c.challanNo === cn)) row.ChallanNo.push({ challanNo: cn, status });
        });
      }
    });
    return Array.from(grouped.values()).map(item => {
      const lcInfoList = (lcMap.get(item.PINO) || []).filter(lc => lc.lcNo);
      const invoiceInfoList = lcInfoList.flatMap(lc => invoiceMap.get(lc.lcNo) || []).filter(inv => inv.invoiceNo);
      return {
        ...item, LCList: lcInfoList, InvoiceList: invoiceInfoList,
        completionRate: item.TotalQty > 0 ? ((item.ChallanQTY / item.TotalQty) * 100).toFixed(1) : 0,
        avgOrderValue: item.itemCount > 0 ? item.TotalValue / item.itemCount : 0,
      };
    });
  } catch (e) { console.error("Summarize error:", e); return []; }
}, [cndata, maps]);

const useFilters = (summarizedData, filters, search) => {
  const normalize = useCallback(v => String(v || "").trim().toLowerCase(), []);
  const getMultiSearchItems = useCallback(ms => {
    if (!ms?.trim()) return [];
    return ms.split(/[\n,;|]+/).map(s => s.trim()).filter(Boolean);
  }, []);
  return useMemo(() => {
    const sv = normalize(search);
    const { selectedPI, selectedOrder, selectedLC, selectedInvoice, selectedCustomer, selectedBuyer,
      selectedDelivery, dateRange, minValue, maxValue, statusFilter, sectionFilter,
      favorites, showFavoritesOnly, multiSearch } = filters;
    const piSet = new Set(selectedPI.map(normalize));
    const orderSet = new Set(selectedOrder.map(normalize));
    const lcSet = new Set(selectedLC.map(normalize));
    const invSet = new Set(selectedInvoice.map(normalize));
    const custSet = new Set(selectedCustomer.map(normalize));
    const buyerSet = new Set(selectedBuyer.map(normalize));
    const delSet = new Set(selectedDelivery.map(normalize));
    const favSet = new Set(favorites);
    const msItems = getMultiSearchItems(multiSearch);
    try {
      return summarizedData.filter(item => {
        const wo = normalize(item.WorkOrderNo), cust = normalize(item.CustomerName),
          del = normalize(item.DeliverName), buy = normalize(item.Buyer),
          pi = normalize(item.PINO || "No PI"),
          lc = normalize((item.LCList || []).map(l => l.lcNo).join(",") || "No LC"),
          inv = normalize((item.InvoiceList || []).map(i => i.invoiceNo).join(",") || "No Invoice");
        const searchMatch = !sv || [wo, cust, del, pi, buy, lc, inv].some(v => v.includes(sv));
        const msMatch = msItems.length === 0 || msItems.some(msi => {
          const n = normalize(msi);
          return [wo, cust, del, pi, buy, lc, inv].some(v => v.includes(n));
        });
        const piMatch = piSet.size === 0 || piSet.has(normalize(item.PINO || "No PI"));
        const lcMatch = lcSet.size === 0 || (item.LCList || []).some(l => lcSet.has(normalize(l.lcNo)));
        const invMatch = invSet.size === 0 || (item.InvoiceList || []).some(i => invSet.has(normalize(i.invoiceNo)));
        const orderMatch = orderSet.size === 0 || orderSet.has(wo);
        const custMatch = custSet.size === 0 || custSet.has(cust);
        const buyerMatch = buyerSet.size === 0 || buyerSet.has(buy);
        const delMatch = delSet.size === 0 || delSet.has(del);
        const favMatch = !showFavoritesOnly || favSet.has(item.WorkOrderNo);
        let dateMatch = true;
        if (dateRange?.start && dateRange?.end) {
          const od = new Date(item.OrderReceiveDate), s = new Date(dateRange.start), e = new Date(dateRange.end);
          s.setHours(0,0,0,0); e.setHours(23,59,59,999);
          dateMatch = od >= s && od <= e;
        }
        let valueMatch = true;
        if (minValue || maxValue) {
          const tv = Number(item.TotalValue) || 0;
          if (minValue && tv < Number(minValue)) valueMatch = false;
          if (maxValue && tv > Number(maxValue)) valueMatch = false;
        }
        let statusMatch = true;
        if (statusFilter) {
          const c = parseFloat(item.completionRate);
          if (statusFilter === 'complete' && c < 100) statusMatch = false;
          if (statusFilter === 'in-progress' && (c >= 100 || c <= 0)) statusMatch = false;
          if (statusFilter === 'pending' && c > 0) statusMatch = false;
        }
        const sectionMatch = !sectionFilter || normalize(item.Section) === normalize(sectionFilter);
        return searchMatch && msMatch && piMatch && orderMatch && lcMatch && invMatch && custMatch && buyerMatch && delMatch && favMatch && dateMatch && valueMatch && statusMatch && sectionMatch;
      }).sort((a, b) => {
        const gp = v => { const p = (v || "").split("-"); return { num: Number(p[1]) || 0, year: Number(p[2]) || 0 }; };
        const A = gp(a.WorkOrderNo), B = gp(b.WorkOrderNo);
        return B.year !== A.year ? B.year - A.year : B.num - A.num;
      });
    } catch (e) { console.error("Filter error:", e); return []; }
  }, [summarizedData, search, filters, normalize, getMultiSearchItems]);
};

const usePagination = (filteredData, itemsPerPage = CONFIG.ITEMS_PER_PAGE) => {
  const [currentPage, setCurrentPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const displayedData = filteredData.slice(currentPage * itemsPerPage, currentPage * itemsPerPage + itemsPerPage);
  const totalData = useMemo(() => displayedData.reduce((a, i) => {
    a.TotalQty += +i.TotalQty || 0; a.ChallanQTY += +i.ChallanQTY || 0;
    a.BalanceQty += +i.BalanceQty || 0; a.TotalValue += +i.TotalValue || 0;
    a.ChallanValue += +i.ChallanValue || 0; a.BalanceValue += +i.BalanceValue || 0;
    a.itemCount += 1; return a;
  }, { TotalQty: 0, ChallanQTY: 0, BalanceQty: 0, TotalValue: 0, ChallanValue: 0, BalanceValue: 0, itemCount: 0 }), [displayedData]);
  const grandTotal = useMemo(() => filteredData.reduce((a, i) => {
    a.TotalQty += +i.TotalQty || 0; a.ChallanQTY += +i.ChallanQTY || 0;
    a.BalanceQty += +i.BalanceQty || 0; a.TotalValue += +i.TotalValue || 0;
    a.ChallanValue += +i.ChallanValue || 0; a.BalanceValue += +i.BalanceValue || 0;
    return a;
  }, { TotalQty: 0, ChallanQTY: 0, BalanceQty: 0, TotalValue: 0, ChallanValue: 0, BalanceValue: 0 }), [filteredData]);
  useEffect(() => setCurrentPage(0), [filteredData.length]);
  return { currentPage, setCurrentPage, pageCount, displayedData, totalData, grandTotal, totalItems: filteredData.length };
};

// ============================================================
// COMPONENT: SVG CHARTS (No external deps)
// ============================================================

const Sparkline = React.memo(({ data, width = CONFIG.SPARKLINE_WIDTH, height = CONFIG.SPARKLINE_HEIGHT, color = "#3b82f6" }) => {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1 || 1)) * width;
    const y = height - ((d - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  const areaPoints = `0,${height} ${points} ${width},${height}`;
  return (
    <svg width={width} height={height} className="inline-block">
      <defs>
        <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#spark-${color.replace('#', '')})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={width} cy={height - ((data[data.length-1] - min) / range) * height} r="2" fill={color} />
    </svg>
  );
});
Sparkline.displayName = "Sparkline";

const ProgressBar = React.memo(({ value, color, height = 6, showLabel = false, animated = true }) => {
  const v = Math.min(100, Math.max(0, parseFloat(value) || 0));
  const barColor = color || (v >= 100 ? '#10b981' : v > 50 ? '#f59e0b' : '#ef4444');
  return (
    <div className="w-full">
      <div className="w-full bg-gray-200 rounded-full overflow-hidden" style={{ height }}>
        <div
          className={cn('h-full rounded-full transition-all duration-700', animated && 'relative overflow-hidden')}
          style={{ width: `${v}%`, background: `linear-gradient(90deg, ${barColor}, ${barColor}dd)` }}
        >
          {animated && <div className="absolute inset-0 bg-white/30 animate-shimmer" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)', animation: 'shimmer 2s infinite' }} />}
        </div>
      </div>
      {showLabel && <div className="text-[10px] text-gray-500 mt-0.5 text-center">{v}%</div>}
    </div>
  );
});
ProgressBar.displayName = "ProgressBar";

const ProgressRing = React.memo(({ value, size = 60, strokeWidth = 6, color, label }) => {
  const v = Math.min(100, Math.max(0, parseFloat(value) || 0));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (v / 100) * circumference;
  const ringColor = color || (v >= 100 ? '#10b981' : v > 50 ? '#f59e0b' : '#ef4444');
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} stroke="#e5e7eb" strokeWidth={strokeWidth} fill="none" />
        <circle cx={size/2} cy={size/2} r={radius} stroke={ringColor} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.7s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs font-bold" style={{ color: ringColor }}>{v}%</span>
        {label && <span className="text-[8px] text-gray-500">{label}</span>}
      </div>
    </div>
  );
});
ProgressRing.displayName = "ProgressRing";

const DonutChart = React.memo(({ data, size = 200, thickness = 30 }) => {
  if (!data || data.length === 0) return null;
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
  return (
    <div className="flex items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size/2} cy={size/2} r={radius} stroke="#e5e7eb" strokeWidth={thickness} fill="none" />
          {data.map((d, i) => {
            const pct = d.value / total;
            const dash = pct * circumference;
            const seg = (
              <circle key={i} cx={size/2} cy={size/2} r={radius}
                stroke={colors[i % colors.length]} strokeWidth={thickness} fill="none"
                strokeDasharray={`${dash} ${circumference - dash}`} strokeDashoffset={-offset}
                style={{ transition: 'stroke-dasharray 0.5s ease' }} />
            );
            offset += dash;
            return seg;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-800">{total}</span>
          <span className="text-xs text-gray-500">Total</span>
        </div>
      </div>
      <div className="space-y-1">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 rounded-sm" style={{ background: colors[i % colors.length] }} />
            <span className="font-medium truncate max-w-[120px]" title={d.label}>{d.label}</span>
            <span className="text-gray-500">({((d.value/total)*100).toFixed(1)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
});
DonutChart.displayName = "DonutChart";

const BarChartMini = React.memo(({ data, width = 300, height = 150 }) => {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.value)) || 1;
  const barWidth = (width - 20) / data.length - 4;
  return (
    <svg width={width} height={height} className="overflow-visible">
      {data.map((d, i) => {
        const h = (d.value / max) * (height - 30);
        const x = 10 + i * (barWidth + 4);
        const y = height - h - 20;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barWidth} height={h} fill="url(#barGrad)" rx="2"
              style={{ transition: 'all 0.5s ease' }}>
              <title>{d.label}: {d.value}</title>
            </rect>
            <text x={x + barWidth/2} y={height - 8} textAnchor="middle" className="text-[9px] fill-gray-500">
              {d.label.length > 8 ? d.label.slice(0, 8) + '…' : d.label}
            </text>
            <text x={x + barWidth/2} y={y - 4} textAnchor="middle" className="text-[8px] fill-gray-700 font-bold">
              {d.value > 999 ? `${(d.value/1000).toFixed(1)}k` : d.value}
            </text>
          </g>
        );
      })}
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
    </svg>
  );
});
BarChartMini.displayName = "BarChartMini";

const HeatMap = React.memo({ data, maxValue } = () => {
  if (!data || data.length === 0) return null;
  const max = maxValue || Math.max(...data.map(d => d.value)) || 1;
  return (
    <div className="grid grid-cols-7 gap-1">
      {data.map((d, i) => {
        const intensity = d.value / max;
        const bg = d.value === 0 ? '#f3f4f6' : `rgba(59, 130, 246, ${0.2 + intensity * 0.8})`;
        return (
          <div key={i} className="aspect-square rounded relative group cursor-pointer" style={{ background: bg }}
            title={`${d.label}: ${d.value}`}>
            <div className="absolute inset-0 flex items-center justify-center text-[8px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              {d.value}
            </div>
          </div>
        );
      })}
    </div>
  );
});
HeatMap.displayName = "HeatMap";

// ============================================================
// COMPONENT: BACKGROUND GENERATOR (Enhanced with theme support)
// ============================================================

const BackgroundGenerator = React.memo(({ children, theme, onBackgroundChange }) => {
  const backgrounds = theme === 'dark' ? DARK_BACKGROUNDS : BACKGROUNDS;
  const [currentBg, setCurrentBg] = useState(() => backgrounds[Math.floor(Math.random() * backgrounds.length)]);
  const [isHovering, setIsHovering] = useState(false);

  const changeBackground = useCallback(() => {
    let newBg;
    do { newBg = backgrounds[Math.floor(Math.random() * backgrounds.length)]; }
    while (newBg === currentBg && backgrounds.length > 1);
    setCurrentBg(newBg);
    onBackgroundChange?.(newBg);
    toast.info(`Theme: ${newBg.name}`, { autoClose: 1500 });
  }, [currentBg, backgrounds, onBackgroundChange]);

  const patternClass = useMemo(() => {
    const patterns = {
      dots: 'bg-[radial-gradient(currentColor_1px,transparent_1px)] bg-[length:20px_20px]',
      grid: 'bg-[linear-gradient(currentColor_1px,transparent_1px),linear-gradient(90deg,currentColor_1px,transparent_1px)] bg-[length:20px_20px]',
      cross: 'bg-[linear-gradient(45deg,currentColor_2px,transparent_2px),linear-gradient(-45deg,currentColor_2px,transparent_2px)] bg-[length:20px_20px]',
      diamond: 'bg-[linear-gradient(45deg,currentColor_2px,transparent_2px)] bg-[length:20px_20px]',
      stripe: 'bg-[linear-gradient(45deg,currentColor_2px,transparent_2px,transparent_4px)] bg-[length:20px_20px]',
      wave: 'bg-[radial-gradient(circle_at_20px_20px,currentColor_2px,transparent_2px)] bg-[length:40px_40px]',
      circle: 'bg-[radial-gradient(currentColor_2px,transparent_2px)] bg-[length:20px_20px]',
      hex: 'bg-[linear-gradient(30deg,currentColor_2px,transparent_2px),linear-gradient(-30deg,currentColor_2px,transparent_2px)] bg-[length:20px_20px]',
    };
    return patterns[currentBg.pattern] || patterns.dots;
  }, [currentBg]);

  return (
    <div className={cn('relative min-h-screen transition-all duration-1000 bg-gradient-to-br', currentBg.gradient, theme === 'dark' ? 'text-gray-100' : 'text-gray-800')}
      onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
      <div className={cn('absolute inset-0 opacity-5 pointer-events-none', patternClass)} />
      <div className={cn('fixed bottom-4 right-4 z-50 transition-opacity duration-300', isHovering ? 'opacity-100' : 'opacity-0')}>
        <button className="btn btn-sm btn-primary text-white shadow-lg rounded-full w-12 h-12 flex items-center justify-center hover:scale-110 transition-transform"
          onClick={changeBackground} title="Change Background">🎨</button>
      </div>
      <div className={cn('fixed bottom-4 left-4 z-50 opacity-20 hover:opacity-100 transition-opacity')}>
        <div className={cn('text-xs px-2 py-1 rounded-full backdrop-blur-sm', theme === 'dark' ? 'bg-white/10 text-gray-300' : 'bg-white/50 text-gray-600')}>
          {currentBg.name}
        </div>
      </div>
      {children}
    </div>
  );
});
BackgroundGenerator.displayName = "BackgroundGenerator";

// ============================================================
// COMPONENT: SKELETON LOADER
// ============================================================

const SkeletonRow = () => (
  <tr>
    {Array.from({ length: 12 }).map((_, i) => (
      <td key={i} className="px-2 py-2">
        <div className="h-3 bg-gray-200 rounded animate-pulse" style={{ width: `${50 + Math.random() * 50}%` }} />
      </td>
    ))}
  </tr>
);

const TableSkeleton = () => (
  <div className="border rounded-xl overflow-hidden bg-white/95">
    <div className="h-10 bg-gradient-to-r from-blue-600 to-blue-700" />
    <table className="table table-xs w-full">
      <tbody>
        {Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} />)}
      </tbody>
    </table>
  </div>
);

// ============================================================
// COMPONENT: COMMAND PALETTE (Ctrl+K)
// ============================================================

const CommandPalette = React.memo(({ isOpen, onClose, commands }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery(''); setSelectedIndex(0);
    }
  }, [isOpen]);

  const filteredCommands = useMemo(() => {
    if (!query) return commands;
    return commands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()) || c.category.toLowerCase().includes(query.toLowerCase()));
  }, [commands, query]);

  useEffect(() => setSelectedIndex(0), [query]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && filteredCommands[selectedIndex]) { e.preventDefault(); filteredCommands[selectedIndex].action(); onClose(); }
    if (e.key === 'Escape') onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-[99999] pt-20 px-4 animate-fadeIn" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          <span className="text-gray-400">🔍</span>
          <input ref={inputRef} type="text" placeholder="Type a command or search..." value={query}
            onChange={e => setQuery(e.target.value)} onKeyDown={handleKeyDown}
            className="flex-1 outline-none text-sm bg-transparent" />
          <kbd className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">ESC</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No commands found</div>
          ) : (
            filteredCommands.map((cmd, i) => (
              <button key={i} className={cn('w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors',
                i === selectedIndex && 'bg-blue-50 border-l-4 border-blue-500')}
                onClick={() => { cmd.action(); onClose(); }}
                onMouseEnter={() => setSelectedIndex(i)}>
                <span className="text-lg">{cmd.icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium">{cmd.label}</div>
                  <div className="text-[10px] text-gray-400">{cmd.category}</div>
                </div>
                {cmd.shortcut && <kbd className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{cmd.shortcut}</kbd>}
              </button>
            ))
          )}
        </div>
        <div className="px-4 py-2 border-t bg-gray-50 text-[10px] text-gray-400 flex justify-between">
          <span>↑↓ Navigate • Enter Select • ESC Close</span>
          <span>{filteredCommands.length} commands</span>
        </div>
      </div>
    </div>
  );
});
CommandPalette.displayName = "CommandPalette";

// ============================================================
// COMPONENT: KEYBOARD SHORTCUTS OVERLAY
// ============================================================

const KeyboardShortcutsOverlay = React.memo(({ isOpen, onClose }) => {
  if (!isOpen) return null;
  const shortcuts = [
    { keys: 'Ctrl+F', desc: 'Focus search bar' },
    { keys: 'Ctrl+K', desc: 'Open command palette' },
    { keys: 'Ctrl+A', desc: 'Select all rows on page' },
    { keys: 'Ctrl+T', desc: 'Run Deep Think analysis' },
    { keys: 'Ctrl+D', desc: 'Toggle dark mode' },
    { keys: 'Ctrl+E', desc: 'Export data' },
    { keys: 'Ctrl+\\', desc: 'Toggle view mode (Table/Dashboard)' },
    { keys: 'ESC', desc: 'Close dialogs / Clear search' },
    { keys: '?', desc: 'Show this help' },
  ];
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999] p-4 animate-fadeIn" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">⌨️ Keyboard Shortcuts</h2>
          <button className="btn btn-ghost btn-sm btn-circle" onClick={onClose}>✕</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {shortcuts.map((s, i) => (
            <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">{s.desc}</span>
              <kbd className="text-xs bg-white border px-2 py-1 rounded shadow-sm font-mono">{s.keys}</kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
KeyboardShortcutsOverlay.displayName = "KeyboardShortcutsOverlay";

// ============================================================
// COMPONENT: BULK ACTIONS TOOLBAR
// ============================================================

const BulkActionsToolbar = React.memo(({ selectedCount, onClear, onExport, onFavorite, onDelete, onAssign }) => (
  <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 animate-slideUp">
    <div className="bg-gray-900 text-white rounded-full shadow-2xl px-4 py-2 flex items-center gap-3">
      <span className="text-sm font-medium">{selectedCount} selected</span>
      <div className="h-4 w-px bg-gray-700" />
      <button className="btn btn-ghost btn-xs text-white hover:bg-gray-800" onClick={onExport} title="Export selected">⬇ Export</button>
      <button className="btn btn-ghost btn-xs text-white hover:bg-gray-800" onClick={onFavorite} title="Add to favorites">⭐ Favorite</button>
      <button className="btn btn-ghost btn-xs text-white hover:bg-gray-800" onClick={onAssign} title="Assign tag">🏷️ Tag</button>
      <button className="btn btn-ghost btn-xs text-red-400 hover:bg-red-900/30" onClick={onDelete} title="Clear selection">✕ Clear</button>
    </div>
  </div>
));
BulkActionsToolbar.displayName = "BulkActionsToolbar";

// ============================================================
// COMPONENT: MULTI-SEARCH DROPDOWN (Enhanced)
// ============================================================

const MultiSearchDropdown = React.memo(({ value, onChange, onClear, onSearch, totalMatches, isActive }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef(null);
  const handleKeyDown = e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); onSearch(); } };
  const matchCount = value ? value.split(/[\n,;|]+/).filter(s => s.trim()).length : 0;

  return (
    <div className="relative">
      <button className={cn('btn btn-xs gap-1 transition-all', isActive || matchCount > 0 ? 'btn-warning text-white' : 'btn-ghost bg-white/80 backdrop-blur-sm')}
        onClick={() => setIsExpanded(!isExpanded)} title="Multi-search orders">
        🔍 Multi-Search
        {matchCount > 0 && <span className="badge badge-xs badge-info">{matchCount}</span>}
        <span>{isExpanded ? '▲' : '▼'}</span>
      </button>
      {isExpanded && (
        <div className="absolute left-0 mt-1 bg-white shadow-xl rounded-xl p-3 w-80 z-50 border border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-xs">📋 Multi-Order Search</span>
            <div className="flex gap-1">
              {value?.trim() && <button className="text-[10px] text-red-500 hover:text-red-700 px-2 py-0.5 rounded hover:bg-red-50" onClick={() => { onChange(''); onClear?.(); }}>Clear</button>}
              <button className="text-[10px] text-gray-400 hover:text-gray-600 px-2 py-0.5 rounded hover:bg-gray-50" onClick={() => setIsExpanded(false)}>✕</button>
            </div>
          </div>
          <textarea ref={textareaRef} value={value} onChange={e => onChange(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="Paste order numbers (one per line)..." className="textarea textarea-bordered w-full text-xs font-mono min-h-[120px] max-h-[200px] resize-y" autoFocus />
          <div className="flex justify-between items-center mt-2 text-[10px] text-gray-400">
            <span>{matchCount > 0 ? `${matchCount} items entered` : 'Paste order numbers'}</span>
            {matchCount > 0 && <span className="text-gray-600">Press Ctrl+Enter</span>}
          </div>
          {matchCount > 0 && (
            <button className="btn btn-primary btn-xs w-full text-white mt-2" onClick={() => { onSearch(); setIsExpanded(false); }}>
              🔍 Search {matchCount} Orders
            </button>
          )}
          {totalMatches > 0 && matchCount > 0 && (
            <div className="mt-2 p-2 bg-green-50 rounded text-[10px] text-green-700 border border-green-200">
              ✅ Found {totalMatches} matching orders
            </div>
          )}
        </div>
      )}
    </div>
  );
});
MultiSearchDropdown.displayName = "MultiSearchDropdown";

// ============================================================
// COMPONENT: DEEP THINKING (Enhanced with streaming insights)
// ============================================================

const DeepThinking = React.memo(({ data, onInsight }) => {
  const [isThinking, setIsThinking] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toggle, buttonRef } = useDropdown();
  const hasData = data && data.length > 0;

  const generateInsights = useCallback(() => {
    setIsThinking(true); setProgress(0);
    const steps = ['Analyzing data structure...', 'Processing metrics...', 'Identifying patterns...', 'Generating insights...'];
    let stepIdx = 0;
    const interval = setInterval(() => {
      stepIdx++;
      setProgress((stepIdx / steps.length) * 100);
      if (stepIdx >= steps.length) {
        clearInterval(interval);
        const insights = [];
        const totalOrders = data.length;
        const totalValue = data.reduce((s, d) => s + Number(d.TotalValue || 0), 0);
        const totalQty = data.reduce((s, d) => s + Number(d.TotalQty || 0), 0);
        const totalChallanQty = data.reduce((s, d) => s + Number(d.ChallanQTY || 0), 0);
        const completionRate = totalQty > 0 ? (totalChallanQty / totalQty) * 100 : 0;
        if (completionRate < 50) insights.push({ icon: '⚠️', title: 'Low Overall Completion', description: `Only ${completionRate.toFixed(1)}% delivered. Prioritize pending orders.`, priority: 'critical' });
        else if (completionRate < 80) insights.push({ icon: '📊', title: 'Moderate Completion', description: `${completionRate.toFixed(1)}% completion. Focus on pending orders.`, priority: 'high' });
        else insights.push({ icon: '✅', title: 'High Completion Rate', description: `${completionRate.toFixed(1)}% achieved. Excellent!`, priority: 'low' });

        const customerMap = new Map();
        data.forEach(d => { const n = d.CustomerName || "Unknown"; customerMap.set(n, { value: (customerMap.get(n)?.value || 0) + Number(d.TotalValue || 0), count: (customerMap.get(n)?.count || 0) + 1 }); });
        const topCustomer = [...customerMap.entries()].sort((a, b) => b[1].value - a[1].value)[0];
        if (topCustomer) insights.push({ icon: '🏆', title: 'Top Customer', description: `${topCustomer[0]}: ${topCustomer[1].count} orders, $${topCustomer[1].value.toFixed(2)}.`, priority: 'medium' });

        const pendingOrders = data.filter(d => parseFloat(d.completionRate) < 50);
        if (pendingOrders.length > 0) insights.push({ icon: '📋', title: 'Pending Orders', description: `${pendingOrders.length} orders <50% completion.`, priority: 'high' });

        if (totalValue > 1000000) insights.push({ icon: '💰', title: 'High Value Volume', description: `Total exceeds $1M ($${totalValue.toFixed(2)}).`, priority: 'high' });

        onInsight?.(insights);
        setIsThinking(false);
        toast.success(`🧠 ${insights.length} insights generated!`);
      }
    }, 500);
  }, [data, onInsight]);

  const status = isThinking ? { text: '🧠 Thinking...', color: 'btn-warning', disabled: true }
    : !hasData ? { text: '🔒 No Data', color: 'btn-disabled', disabled: true }
    : { text: '🤔 Deep Think', color: 'btn-primary', disabled: false };

  return (
    <button ref={buttonRef} className={cn('btn btn-xs gap-1 text-white transition-all', status.color, isThinking && 'animate-pulse')}
      onClick={() => { if (!isThinking && hasData) { generateInsights(); toggle(); } }}
      disabled={status.disabled} title={!hasData ? "No data" : "Deep Think - AI Analysis"} data-deep-think>
      {status.text}
      {isThinking && <span className="badge badge-xs badge-info">{Math.round(progress)}%</span>}
      {hasData && !isThinking && <span className="badge badge-xs badge-success ml-1">{data.length}</span>}
    </button>
  );
});
DeepThinking.displayName = "DeepThinking";

// ============================================================
// COMPONENT: QUICK VIEW MODAL (Enhanced with tabs)
// ============================================================

const QuickViewModal = React.memo(({ item, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  useEffect(() => setActiveTab('overview'), [item]);

  if (!isOpen || !item) return null;
  const tabs = [
    { id: 'overview', label: '📋 Overview', icon: '📋' },
    { id: 'quantities', label: '📊 Quantities', icon: '📊' },
    { id: 'financials', label: '💰 Financials', icon: '💰' },
    { id: 'challans', label: '🚚 Challans', icon: '🚚' },
    { id: 'documents', label: '📄 Documents', icon: '📄' },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-4 animate-fadeIn" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start p-5 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{item.WorkOrderNo}</h2>
            <p className="text-xs text-gray-600">{item.CustomerName} • {formatDate(item.OrderReceiveDate)}</p>
          </div>
          <button className="btn btn-ghost btn-sm btn-circle hover:bg-gray-200" onClick={onClose}>✕</button>
        </div>
        <div className="flex border-b bg-gray-50">
          {tabs.map(tab => (
            <button key={tab.id} className={cn('px-4 py-2 text-xs font-medium border-b-2 transition-colors',
              activeTab === tab.id ? 'border-blue-500 text-blue-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700')}
              onClick={() => setActiveTab(tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Order No', item.WorkOrderNo], ['Date', formatDate(item.OrderReceiveDate)],
                ['Customer', item.CustomerName], ['Delivery', item.DeliverName],
                ['Buyer', item.Buyer], ['PI', item.PINO],
                ['Section', item.Section], ['Items', item.itemCount],
              ].map(([label, val]) => (
                <div key={label} className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-500">{label}</div>
                  <div className="font-semibold text-sm">{val}</div>
                </div>
              ))}
              <div className="col-span-2 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg flex items-center justify-around">
                <ProgressRing value={item.completionRate} size={80} label="Complete" />
                <div>
                  <div className="text-xs text-gray-500">Status</div>
                  <div className={cn('font-bold', parseFloat(item.completionRate) >= 100 ? 'text-green-600' : parseFloat(item.completionRate) > 50 ? 'text-yellow-600' : 'text-red-600')}>
                    {parseFloat(item.completionRate) >= 100 ? '✅ Complete' : parseFloat(item.completionRate) > 50 ? '⏳ In Progress' : '⏸️ Pending'}
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'quantities' && (
            <div className="grid grid-cols-3 gap-4">
              {[['Order Qty', item.TotalQty, 'blue', '📦'],
                ['Challan Qty', item.ChallanQTY, 'green', '✅'],
                ['Balance Qty', item.BalanceQty, 'red', '⏳']].map(([label, val, color, icon]) => (
                <div key={label} className={cn('p-4 rounded-xl text-center', `bg-${color}-50`)}>
                  <div className="text-3xl mb-1">{icon}</div>
                  <div className="text-xs text-gray-500">{label}</div>
                  <div className={cn('text-2xl font-bold', `text-${color}-600`)}>{formatNumber(val)}</div>
                </div>
              ))}
              <div className="col-span-3">
                <div className="text-xs text-gray-500 mb-2">Progress Over Time</div>
                <div className="bg-white p-3 rounded-lg border">
                  <Sparkline data={item.history || [item.TotalQty, item.ChallanQTY]} width={400} height={60} color="#3b82f6" />
                </div>
              </div>
            </div>
          )}
          {activeTab === 'financials' && (
            <div className="grid grid-cols-3 gap-4">
              {[['Order Value', item.TotalValue, 'indigo'],
                ['Challan Value', item.ChallanValue, 'emerald'],
                ['Balance Value', item.BalanceValue, 'rose']].map(([label, val, color]) => (
                <div key={label} className={cn('p-4 rounded-xl text-center', `bg-${color}-50`)}>
                  <div className="text-xs text-gray-500">{label}</div>
                  <div className={cn('text-xl font-bold', `text-${color}-600`)}>{formatCurrency(val)}</div>
                </div>
              ))}
              <div className="col-span-3 bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl">
                <div className="text-xs text-gray-500 mb-2">Value Distribution</div>
                <ProgressBar value={(item.ChallanValue / (item.TotalValue || 1)) * 100} color="#10b981" height={10} showLabel />
              </div>
            </div>
          )}
          {activeTab === 'challans' && (
            <div>
              {item.ChallanNo && item.ChallanNo.length > 0 ? (
                <div className="space-y-2">
                  {item.ChallanNo.map((ch, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">{i+1}</span>
                        <span className="font-mono text-sm">{ch.challanNo}</span>
                      </div>
                      <span className={cn('text-xs font-medium px-2 py-1 rounded',
                        ch.status === 'Challan Received' ? 'bg-green-100 text-green-700' :
                        ch.status === 'Send to Gate' ? 'bg-yellow-100 text-yellow-700' :
                        ch.status === 'Delivered' ? 'bg-blue-100 text-blue-700' :
                        ch.status === 'Gate Out' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700')}>
                        {ch.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : <div className="text-center py-8 text-gray-400">No challans available</div>}
            </div>
          )}
          {activeTab === 'documents' && (
            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">LC Documents</h4>
                {(item.LCList || []).length > 0 ? (
                  <div className="space-y-1">
                    {item.LCList.map((lc, i) => (
                      <div key={i} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                        <span className="font-mono">{lc.lcNo}</span>
                        <span className="text-xs text-gray-500">{formatDate(lc.lcDate)} • {formatCurrency(lc.totalLCValue)}</span>
                      </div>
                    ))}
                  </div>
                ) : <div className="text-xs text-gray-400">No LC documents</div>}
              </div>
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Invoices</h4>
                {(item.InvoiceList || []).length > 0 ? (
                  <div className="space-y-1">
                    {item.InvoiceList.map((inv, i) => (
                      <div key={i} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                        <span className="font-mono">{inv.invoiceNo}</span>
                        <span className="text-xs text-gray-500">{formatDate(inv.invoiceDate)} • {formatCurrency(inv.totalInvoiceValue)}</span>
                      </div>
                    ))}
                  </div>
                ) : <div className="text-xs text-gray-400">No invoices</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
QuickViewModal.displayName = "QuickViewModal";

// ============================================================
// COMPONENT: DASHBOARD VIEW (New!)
// ============================================================

const DashboardView = React.memo(({ data, grandTotal, onQuickView, onFavoriteToggle, favorites }) => {
  const customerStats = useMemo(() => {
    const m = new Map();
    data.forEach(d => {
      const n = d.CustomerName || "Unknown";
      if (!m.has(n)) m.set(n, { value: 0, orders: 0, qty: 0 });
      m.get(n).value += +d.TotalValue || 0;
      m.get(n).orders += 1;
      m.get(n).qty += +d.TotalQty || 0;
    });
    return [...m.entries()].map(([name, v]) => ({ name, ...v })).sort((a,b) => b.value - a.value).slice(0, 7);
  }, [data]);

  const sectionStats = useMemo(() => {
    const m = new Map();
    data.forEach(d => {
      const n = d.Section || "Unknown";
      m.set(n, (m.get(n) || 0) + 1);
    });
    return [...m.entries()].map(([label, value]) => ({ label, value }));
  }, [data]);

  const statusStats = useMemo(() => {
    const complete = data.filter(d => parseFloat(d.completionRate) >= 100).length;
    const progress = data.filter(d => parseFloat(d.completionRate) > 0 && parseFloat(d.completionRate) < 100).length;
    const pending = data.filter(d => parseFloat(d.completionRate) === 0).length;
    return [
      { label: 'Complete', value: complete },
      { label: 'In Progress', value: progress },
      { label: 'Pending', value: pending },
    ];
  }, [data]);

  if (data.length === 0) {
    return <div className="text-center py-12 text-gray-400">No data available for dashboard view</div>;
  }

  return (
    <div className="space-y-4">
      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-4 shadow-lg">
          <div className="text-xs opacity-80">Total Orders</div>
          <div className="text-3xl font-bold mt-1">{data.length}</div>
          <div className="text-xs opacity-80 mt-1">across {customerStats.length} customers</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl p-4 shadow-lg">
          <div className="text-xs opacity-80">Total Value</div>
          <div className="text-2xl font-bold mt-1">{formatCurrency(grandTotal.TotalValue)}</div>
          <div className="text-xs opacity-80 mt-1">Avg: {formatCurrency(grandTotal.TotalValue / (data.length || 1))}</div>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-xl p-4 shadow-lg">
          <div className="text-xs opacity-80">Completion Rate</div>
          <div className="text-3xl font-bold mt-1">{grandTotal.TotalQty > 0 ? Math.round((grandTotal.ChallanQTY / grandTotal.TotalQty) * 100) : 0}%</div>
          <ProgressBar value={grandTotal.TotalQty > 0 ? (grandTotal.ChallanQTY / grandTotal.TotalQty) * 100 : 0} color="#fff" height={4} animated={false} />
        </div>
        <div className="bg-gradient-to-br from-rose-500 to-pink-600 text-white rounded-xl p-4 shadow-lg">
          <div className="text-xs opacity-80">Balance Value</div>
          <div className="text-2xl font-bold mt-1">{formatCurrency(grandTotal.BalanceValue)}</div>
          <div className="text-xs opacity-80 mt-1">Pending delivery</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-sm border">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">📊 Top Customers by Value</h3>
          <BarChartMini data={customerStats.map(c => ({ label: c.name, value: Math.round(c.value) }))} width={400} height={180} />
        </div>
        <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-sm border">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">🥧 Order Status Distribution</h3>
          <DonutChart data={statusStats} size={160} thickness={25} />
        </div>
      </div>

      {/* Section Distribution & Recent Orders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-sm border">
          <h3 className="text-sm font-semibold mb-3">📦 Section Distribution</h3>
          <div className="space-y-2">
            {sectionStats.map((s, i) => {
              const max = Math.max(...sectionStats.map(x => x.value));
              return (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs w-24 truncate">{s.label}</span>
                  <div className="flex-1"><ProgressBar value={(s.value / max) * 100} height={8} animated={false} /></div>
                  <span className="text-xs font-medium w-8 text-right">{s.value}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-sm border">
          <h3 className="text-sm font-semibold mb-3">⚡ Top Value Orders</h3>
          <div className="space-y-2">
            {[...data].sort((a,b) => b.TotalValue - a.TotalValue).slice(0, 5).map((item, i) => (
              <div key={i} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors"
                onClick={() => onQuickView(item)}>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                    i === 0 ? 'bg-yellow-400 text-yellow-900' : i === 1 ? 'bg-gray-300' : i === 2 ? 'bg-orange-300' : 'bg-blue-100')}>{i+1}</span>
                  <div className="min-w-0">
                    <div className="text-xs font-medium truncate">{item.WorkOrderNo}</div>
                    <div className="text-[10px] text-gray-500 truncate">{item.CustomerName}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-blue-600">{formatCurrency(item.TotalValue)}</div>
                  <div className="text-[10px] text-gray-500">{item.completionRate}%</div>
                </div>
                <button className="ml-1" onClick={e => { e.stopPropagation(); onFavoriteToggle(item.WorkOrderNo); }}>
                  {favorites.includes(item.WorkOrderNo) ? '⭐' : '☆'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});
DashboardView.displayName = "DashboardView";

// ============================================================
// COMPONENT: TIMELINE VIEW (New!)
// ============================================================

const TimelineView = React.memo(({ data, onQuickView }) => {
  const sorted = useMemo(() => [...data].sort((a,b) => new Date(b.OrderReceiveDate) - new Date(a.OrderReceiveDate)).slice(0, 30), [data]);
  if (sorted.length === 0) return <div className="text-center py-12 text-gray-400">No timeline data</div>;
  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-sm border">
      <h3 className="text-sm font-semibold mb-4">📅 Order Timeline (Last 30)</h3>
      <div className="relative pl-8">
        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 to-purple-500" />
        {sorted.map((item, i) => (
          <div key={i} className="relative mb-4 cursor-pointer group" onClick={() => onQuickView(item)}>
            <div className={cn('absolute -left-6 w-3 h-3 rounded-full border-2 border-white shadow',
              parseFloat(item.completionRate) >= 100 ? 'bg-green-500' : parseFloat(item.completionRate) > 50 ? 'bg-yellow-500' : 'bg-red-500')} />
            <div className="bg-gray-50 hover:bg-blue-50 rounded-lg p-3 transition-colors border-l-4 border-blue-300">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm font-semibold">{item.WorkOrderNo}</div>
                  <div className="text-xs text-gray-500">{item.CustomerName} • {formatDate(item.OrderReceiveDate)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-blue-600">{formatCurrency(item.TotalValue)}</div>
                  <div className="text-[10px] text-gray-500">{item.completionRate}% complete</div>
                </div>
              </div>
              <div className="mt-2"><ProgressBar value={item.completionRate} height={4} animated={false} /></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
TimelineView.displayName = "TimelineView";

// ============================================================
// COMPONENT: TOP ITEMS ANALYTICS (Enhanced)
// ============================================================

const TopItemsAnalytics = React.memo(({ data }) => {
  const topItems = useMemo(() => {
    const groupBy = (field) => {
      const m = new Map();
      data.forEach(d => {
        const n = d[field] || "Unknown";
        if (!m.has(n)) m.set(n, { value: 0, orders: 0, qty: 0, completion: 0 });
        const e = m.get(n);
        e.value += +d.TotalValue || 0; e.orders += 1; e.qty += +d.TotalQty || 0;
        e.completion += +d.completionRate || 0;
      });
      return [...m.entries()].sort((a,b) => b[1].value - a[1].value).slice(0, CONFIG.TOP_ITEMS_COUNT)
        .map(([name, v]) => ({ name, ...v, avgCompletion: v.orders > 0 ? (v.completion / v.orders).toFixed(1) : 0 }));
    };
    return {
      topCustomers: groupBy('CustomerName'),
      topBuyers: groupBy('Buyer'),
      topDeliveries: groupBy('DeliverName'),
      topSections: groupBy('Section'),
    };
  }, [data]);

  const renderCard = (title, items, icon, showCompletion = false) => {
    if (!items?.length) return null;
    return (
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm p-3 border hover:shadow-md transition-all hover:scale-[1.02]">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{icon} {title}</h4>
        <div className="space-y-1.5">
          {items.map((item, i) => (
            <div key={i} className="flex items-center justify-between group">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className={cn('text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full',
                  i === 0 ? 'bg-yellow-400 text-yellow-900' : i === 1 ? 'bg-gray-300' : i === 2 ? 'bg-orange-300' : 'bg-blue-100 text-blue-700')}>{i+1}</span>
                <span className="text-xs truncate" title={item.name}>{item.name}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <span className="font-semibold text-blue-600">{formatCurrency(item.value)}</span>
                {showCompletion && (
                  <span className={cn('px-1.5 py-0.5 rounded',
                    item.avgCompletion >= 100 ? 'bg-green-100 text-green-700' :
                    item.avgCompletion > 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700')}>{item.avgCompletion}%</span>
                )}
                <span className="text-gray-400">{item.orders} ord</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (data.length === 0) return null;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      {renderCard("Top Customers", topItems.topCustomers, "👤")}
      {renderCard("Top Buyers", topItems.topBuyers, "💼")}
      {renderCard("Top Deliveries", topItems.topDeliveries, "🚚", true)}
      {renderCard("Top Sections", topItems.topSections, "📦")}
    </div>
  );
});
TopItemsAnalytics.displayName = "TopItemsAnalytics";

// ============================================================
// COMPONENT: PROFESSIONAL FILTER DROPDOWN (Enhanced)
// ============================================================

const ProfessionalFilterDropdown = React.memo(({ label, open, setOpen, items, selectedItems, onToggle, searchValue, setSearchValue, ref, placeholder, color = "blue", icon }) => {
  const [selectAll, setSelectAll] = useState(false);
  useEffect(() => setSelectAll(selectedItems.length === items.length && items.length > 0), [selectedItems, items]);
  const handleSelectAll = () => onToggle(selectAll ? [] : items);
  return (
    <div className="relative" ref={ref}>
      <button className={cn('btn btn-outline btn-xs gap-1 transition-all hover:shadow-md', selectedItems.length > 0 && `border-${color}-500 bg-${color}-50`)}
        onClick={() => setOpen(!open)} aria-expanded={open}>
        {icon && <span className="text-xs">{icon}</span>}
        <span className="text-[10px]">{label}</span>
        {selectedItems.length > 0 && <span className={cn('badge badge-xs', `badge-${color}`)}>{selectedItems.length}</span>}
        <span className="text-[10px]">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="absolute bg-base-100 shadow-xl p-2 rounded-lg w-56 max-h-72 overflow-y-auto z-50 mt-1 border border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-[10px]">{label} Filter</span>
            <div className="flex gap-1">
              <button className="text-[10px] text-blue-600 hover:text-blue-800 font-medium bg-gray-100 px-2 py-0.5 rounded" onClick={handleSelectAll}>{selectAll ? 'Deselect' : 'All'}</button>
              <button className="text-[10px] text-red-600 hover:text-red-800 font-medium bg-gray-100 px-2 py-0.5 rounded" onClick={() => onToggle([])}>Clear</button>
            </div>
          </div>
          <input type="text" placeholder={placeholder} className="input input-xs w-full mb-2" value={searchValue} onChange={e => setSearchValue(e.target.value)} />
          <div className="space-y-0.5 max-h-40 overflow-y-auto">
            {items.length === 0 ? <div className="text-gray-400 text-[10px] text-center py-2">No items</div> :
              items.map(item => (
                <label key={item} className="flex gap-2 py-1 px-2 items-center hover:bg-gray-100 rounded cursor-pointer">
                  <input type="checkbox" checked={selectedItems.includes(item)} onChange={() => onToggle(item)} className="checkbox checkbox-xs" />
                  <span className="text-[11px] select-none truncate">{item}</span>
                </label>
              ))}
          </div>
          <div className="mt-2 pt-2 border-t text-[10px] text-gray-500">{selectedItems.length} selected</div>
        </div>
      )}
    </div>
  );
});
ProfessionalFilterDropdown.displayName = "ProfessionalFilterDropdown";

// ============================================================
// COMPONENT: ENHANCED CHALLAN CELL
// ============================================================

const EnhancedChallanCell = React.memo(({ challanNo }) => {
  const [expanded, setExpanded] = useState(false);
  const displayed = expanded ? challanNo : challanNo.slice(0, CONFIG.MAX_CHALLAN_DISPLAY);
  const hasMore = challanNo.length > CONFIG.MAX_CHALLAN_DISPLAY;
  const handleCopy = () => {
    navigator.clipboard.writeText(challanNo.map(c => `${c.challanNo} (${c.status})`).join("\n"))
      .then(() => toast.success("Challans copied!")).catch(() => toast.error("Copy failed"));
  };
  if (!challanNo?.length) return <div className="text-gray-400 text-[10px] text-center py-2 opacity-50">No Challan</div>;
  return (
    <div className="border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center bg-gray-50 px-2 py-1 rounded-t-lg border-b">
        <span className="text-[10px] font-semibold text-gray-600">📋 Challans ({challanNo.length})</span>
        <div className="flex gap-1">
          {hasMore && <button className="text-[10px] text-blue-600 hover:text-blue-800 px-1 py-0.5 rounded hover:bg-blue-50" onClick={() => setExpanded(!expanded)}>{expanded ? 'Less' : `+${challanNo.length - CONFIG.MAX_CHALLAN_DISPLAY}`}</button>}
          <button className="text-[10px] bg-blue-500 hover:bg-blue-600 text-white px-1.5 py-0.5 rounded" onClick={handleCopy}>Copy</button>
        </div>
      </div>
      <div className="overflow-y-auto p-1.5 space-y-0.5" style={{ maxHeight: expanded ? "200px" : "100px" }}>
        {displayed.map((ch, i) => (
          <div key={i} className={cn('flex justify-between items-center text-[10px] px-2 py-0.5 rounded',
            ch.status === 'Challan Received' ? 'bg-green-50 text-green-700' :
            ch.status === 'Send to Gate' ? 'bg-yellow-50 text-yellow-700' :
            ch.status === 'Delivered' ? 'bg-blue-50 text-blue-700' :
            ch.status === 'Gate Out' ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-600')}>
            <span className="font-medium">{i+1}. {ch.challanNo}</span>
            <span className={cn('px-1 py-0.5 rounded text-[8px] font-medium',
              ch.status === 'Challan Received' ? 'bg-green-200 text-green-800' :
              ch.status === 'Send to Gate' ? 'bg-yellow-200 text-yellow-800' :
              ch.status === 'Delivered' ? 'bg-blue-200 text-blue-800' :
              ch.status === 'Gate Out' ? 'bg-red-200 text-red-800' : 'bg-gray-200')}>{ch.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
});
EnhancedChallanCell.displayName = "EnhancedChallanCell";

// ============================================================
// COMPONENT: PROFESSIONAL SUMMARY TABLE (Enhanced with sparklines & progress)
// ============================================================

const ProfessionalSummaryTable = React.memo(({ data, columns, totalData, onRowClick, onRowSelect, onQuickView, onFavoriteToggle, selectedRows, favorites, loading }) => {
  const handleRowCheck = (item, checked) => onRowSelect(checked ? [...selectedRows, item.WorkOrderNo] : selectedRows.filter(id => id !== item.WorkOrderNo));
  const handleSelectAll = (checked) => onRowSelect(checked ? data.map(d => d.WorkOrderNo) : []);
  const getStatusBadge = (item) => {
    const c = parseFloat(item.completionRate);
    if (c >= 100) return <span className="badge badge-success badge-xs gap-0.5">✓ Complete</span>;
    if (c > 50) return <span className="badge badge-warning badge-xs gap-0.5">⏳ In Progress</span>;
    return <span className="badge badge-error badge-xs gap-0.5">⏸ Pending</span>;
  };

  if (loading) return <TableSkeleton />;
  if (data.length === 0) return (
    <div className="text-center py-16 bg-white/80 rounded-xl">
      <div className="text-6xl mb-3 opacity-30">📭</div>
      <div className="text-gray-500 text-lg">No data to display</div>
      <div className="text-gray-400 text-sm mt-2">Try adjusting your filters or search criteria</div>
    </div>
  );

  const totalColSpan = 9 + (columns.includes("PI") ? 1 : 0) + (columns.includes("LC") ? 1 : 0) + (columns.includes("Invoice") ? 1 : 0);
  return (
    <div className="max-h-[650px] overflow-auto border rounded-xl shadow-sm bg-white/95 backdrop-blur-sm">
      <table className="table table-xs table-zebra min-w-[1600px]">
        <thead className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white sticky top-0 z-10">
          <tr className="text-center text-[10px] uppercase tracking-wider">
            <th className="py-2 w-8">👁️</th>
            <th className="py-2 w-8"><input type="checkbox" className="checkbox checkbox-xs" checked={data.length > 0 && selectedRows.length === data.length} onChange={e => handleSelectAll(e.target.checked)} /></th>
            <th className="py-2 w-8">⭐</th>
            {columns.includes("Order") && <th className="py-2">Order</th>}
            <th className="py-2">Date</th>
            <th className="py-2">Customer</th>
            <th className="py-2">Delivery</th>
            <th className="py-2">Buyer</th>
            {columns.includes("PI") && <th className="py-2">PI</th>}
            {columns.includes("LC") && <th className="py-2">LC</th>}
            {columns.includes("Invoice") && <th className="py-2">Invoice</th>}
            <th className="py-2">Section</th>
            <th className="py-2 text-right">Order Qty</th>
            <th className="py-2 text-right">Challan Qty</th>
            <th className="py-2 text-right">Balance Qty</th>
            <th className="py-2 text-right">Order Value</th>
            <th className="py-2 text-right">Challan Value</th>
            <th className="py-2 text-right">Balance Value</th>
            <th className="py-2 text-center">Progress</th>
            <th className="py-2 text-center">Trend</th>
            <th className="py-2 text-center">Challan</th>
            <th className="py-2 text-center">Status</th>
          </tr>
        </thead>
        <tbody>
          {data.map(item => (
            <tr key={`${item.WorkOrderNo}-${item.PINO}`} className={cn('hover:bg-blue-50 transition-colors cursor-pointer', selectedRows.includes(item.WorkOrderNo) && 'bg-blue-100')} onClick={() => onRowClick?.(item)}>
              <td className="px-2 py-1 text-center" onClick={e => e.stopPropagation()}>
                <button className="btn btn-ghost btn-xs text-gray-400 hover:text-blue-500" onClick={() => onQuickView(item)} title="Quick View">👁️</button>
              </td>
              <td className="px-2 py-1" onClick={e => e.stopPropagation()}>
                <input type="checkbox" className="checkbox checkbox-xs" checked={selectedRows.includes(item.WorkOrderNo)} onChange={e => handleRowCheck(item, e.target.checked)} />
              </td>
              <td className="px-2 py-1" onClick={e => e.stopPropagation()}>
                <button className={cn('btn btn-ghost btn-xs', favorites.includes(item.WorkOrderNo) ? 'text-yellow-500' : 'text-gray-300')} onClick={() => onFavoriteToggle(item.WorkOrderNo)}>
                  {favorites.includes(item.WorkOrderNo) ? '⭐' : '☆'}
                </button>
              </td>
              {columns.includes("Order") && <td className="px-2 py-1 whitespace-nowrap font-medium text-xs">{item.WorkOrderNo}</td>}
              <td className="px-2 py-1 whitespace-nowrap text-[11px]">{formatDate(item.OrderReceiveDate)}</td>
              <td className="px-2 py-1 whitespace-nowrap font-medium text-xs">{item.CustomerName}</td>
              <td className="px-2 py-1 whitespace-nowrap text-xs">{item.DeliverName}</td>
              <td className="px-2 py-1 whitespace-nowrap text-xs">{item.Buyer}</td>
              {columns.includes("PI") && <td className="px-2 py-1 whitespace-nowrap text-[11px] font-mono">{item.PINO}</td>}
              {columns.includes("LC") && <td className="px-2 py-1 whitespace-nowrap text-[11px] font-mono">{(item.LCList || []).map(l => l.lcNo).join(", ") || "-"}</td>}
              {columns.includes("Invoice") && <td className="px-2 py-1 whitespace-nowrap text-[11px] font-mono">{(item.InvoiceList || []).map(i => i.invoiceNo).join(", ") || "-"}</td>}
              <td className="px-2 py-1 whitespace-nowrap text-xs">{item.Section}</td>
              <td className="px-2 py-1 whitespace-nowrap text-right font-medium text-xs">{formatNumber(item.TotalQty)}</td>
              <td className="px-2 py-1 whitespace-nowrap text-right font-medium text-xs">{formatNumber(item.ChallanQTY)}</td>
              <td className="px-2 py-1 whitespace-nowrap text-right text-red-600 font-medium text-xs">{formatNumber(item.BalanceQty)}</td>
              <td className="px-2 py-1 whitespace-nowrap text-right text-blue-600 font-semibold text-xs">{formatCurrency(item.TotalValue)}</td>
              <td className="px-2 py-1 whitespace-nowrap text-right text-green-600 font-semibold text-xs">{formatCurrency(item.ChallanValue)}</td>
              <td className="px-2 py-1 whitespace-nowrap text-right text-red-600 font-semibold text-xs">{formatCurrency(item.BalanceValue)}</td>
              <td className="px-2 py-1 min-w-[100px]"><ProgressBar value={item.completionRate} showLabel /></td>
              <td className="px-2 py-1"><Sparkline data={item.history || [item.TotalQty, item.ChallanQTY]} /></td>
              <td className="px-2 py-1 min-w-[180px]"><EnhancedChallanCell challanNo={item.ChallanNo} /></td>
              <td className="px-2 py-1 text-center">{getStatusBadge(item)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="sticky bottom-0 bg-blue-100 z-10 border-t-2 border-blue-300">
          <tr className="font-bold text-xs">
            <td className="text-right pr-2" colSpan={totalColSpan}>Totals:</td>
            <td className="text-right">{formatNumber(totalData.TotalQty)}</td>
            <td className="text-right">{formatNumber(totalData.ChallanQTY)}</td>
            <td className="text-right text-red-700">{formatNumber(totalData.BalanceQty)}</td>
            <td className="text-right text-blue-700">{formatCurrency(totalData.TotalValue)}</td>
            <td className="text-right text-green-700">{formatCurrency(totalData.ChallanValue)}</td>
            <td className="text-right text-red-700">{formatCurrency(totalData.BalanceValue)}</td>
            <td colSpan={3}></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
});
ProfessionalSummaryTable.displayName = "ProfessionalSummaryTable";

// ============================================================
// COMPONENT: ADVANCED FILTERS PANEL
// ============================================================

const AdvancedFiltersPanel = React.memo(({ filters, onFilterChange, onReset, totalItems, loading, sections, onSaveFilter, savedFilters, onLoadFilter, onDeleteFilter, onDeepThink, data }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const handleSaveFilter = () => {
    if (!filterName.trim()) { toast.warning('Please enter a filter name'); return; }
    onSaveFilter(filterName); setFilterName(''); setShowSaveDialog(false);
  };
  return (
    <div className="bg-white/85 backdrop-blur-sm rounded-xl p-3 shadow-sm border">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-3">
          <button className="btn btn-ghost btn-xs gap-1" onClick={() => setIsExpanded(!isExpanded)}>🔍 Advanced <span>{isExpanded ? '▲' : '▼'}</span></button>
          <span className="text-xs text-gray-500">{loading ? 'Loading...' : `${totalItems} items found`}</span>
        </div>
        <div className="flex gap-1 flex-wrap items-center">
          <DeepThinking data={data} onInsight={onDeepThink} />
          {savedFilters?.length > 0 && (
            <div className="dropdown dropdown-end">
              <button className="btn btn-ghost btn-xs gap-1">💾 Saved <span className="badge badge-xs">{savedFilters.length}</span></button>
              <div className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-48 z-50">
                {savedFilters.map((f, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <button className="btn btn-ghost btn-xs flex-1 text-left" onClick={() => onLoadFilter(f)}>{f.name}</button>
                    <button className="btn btn-ghost btn-xs text-red-400" onClick={() => onDeleteFilter(f.id)}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <button className="btn btn-ghost btn-xs gap-1" onClick={() => setShowSaveDialog(true)}>💾 Save Filter</button>
          <button className="btn btn-ghost btn-xs" onClick={onReset} disabled={loading}>Reset</button>
        </div>
      </div>
      {isExpanded && (
        <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="form-control">
            <label className="label"><span className="label-text text-xs">📅 Date Range</span></label>
            <div className="flex gap-1">
              <input type="date" className="input input-bordered input-xs flex-1" value={filters.dateRange?.start || ''} onChange={e => onFilterChange('dateRange', { ...filters.dateRange, start: e.target.value })} />
              <input type="date" className="input input-bordered input-xs flex-1" value={filters.dateRange?.end || ''} onChange={e => onFilterChange('dateRange', { ...filters.dateRange, end: e.target.value })} />
            </div>
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text text-xs">💵 Value Range</span></label>
            <div className="flex gap-1">
              <input type="number" className="input input-bordered input-xs flex-1" placeholder="Min" value={filters.minValue || ''} onChange={e => onFilterChange('minValue', e.target.value)} />
              <input type="number" className="input input-bordered input-xs flex-1" placeholder="Max" value={filters.maxValue || ''} onChange={e => onFilterChange('maxValue', e.target.value)} />
            </div>
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text text-xs">📊 Status</span></label>
            <select className="select select-bordered select-xs" value={filters.statusFilter || ''} onChange={e => onFilterChange('statusFilter', e.target.value)}>
              <option value="">All Status</option>
              <option value="complete">Complete</option>
              <option value="in-progress">In Progress</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text text-xs">📦 Section</span></label>
            <select className="select select-bordered select-xs" value={filters.sectionFilter || ''} onChange={e => onFilterChange('sectionFilter', e.target.value)}>
              <option value="">All Sections</option>
              {sections.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text text-xs">⭐ Favorites</span></label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="checkbox checkbox-xs" checked={filters.showFavoritesOnly || false} onChange={e => onFilterChange('showFavoritesOnly', e.target.checked)} />
              <span className="text-xs">Show Favorites Only</span>
            </label>
          </div>
        </div>
      )}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999]">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-bold text-lg mb-4">💾 Save Filter</h3>
            <input type="text" className="input input-bordered w-full mb-4" placeholder="Filter name" value={filterName} onChange={e => setFilterName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSaveFilter()} autoFocus />
            <div className="flex gap-2 justify-end">
              <button className="btn btn-ghost btn-sm" onClick={() => setShowSaveDialog(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm text-white" onClick={handleSaveFilter}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
AdvancedFiltersPanel.displayName = "AdvancedFiltersPanel";

// ============================================================
// COMPONENT: COLUMN VISIBILITY MANAGER
// ============================================================

const ColumnVisibilityManager = React.memo(({ columns, visibleColumns, onToggle }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative">
      <button className="btn btn-ghost btn-xs gap-1" onClick={() => setIsOpen(!isOpen)}>⚙️ Columns <span>{isOpen ? '▲' : '▼'}</span></button>
      {isOpen && (
        <div className="absolute right-0 mt-2 bg-base-100 shadow-xl p-2 rounded-lg w-48 z-50 border">
          <div className="font-semibold text-xs mb-2">Toggle Columns</div>
          <div className="space-y-0.5 max-h-60 overflow-y-auto">
            {columns.map(col => (
              <label key={col.id} className="flex gap-2 py-1 px-2 items-center hover:bg-gray-100 rounded cursor-pointer">
                <input type="checkbox" checked={visibleColumns.includes(col.id)} onChange={() => onToggle(col.id)} disabled={col.required} className="checkbox checkbox-xs" />
                <span className="text-xs">{col.label}</span>
                {col.required && <span className="text-[10px] text-gray-400 ml-auto">(req)</span>}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
ColumnVisibilityManager.displayName = "ColumnVisibilityManager";

// ============================================================
// COMPONENT: NOTIFICATION CENTER
// ============================================================

const NotificationCenter = React.memo(({ data }) => {
  const [dismissed, setDismissed] = useState(new Set());
  const { isOpen, toggle, close, dropdownRef, buttonRef } = useDropdown();
  const notifications = useMemo(() => {
    if (!data?.length) return [];
    const n = [];
    const critical = data.filter(d => parseFloat(d.completionRate) < 30);
    if (critical.length) n.push({ id: 1, type: 'error', icon: '⚠️', message: `${critical.length} critically low orders`, details: 'Less than 30% completion' });
    const highValue = data.filter(d => Number(d.TotalValue) > 100000);
    if (highValue.length) n.push({ id: 2, type: 'warning', icon: '💰', message: `${highValue.length} high-value orders`, details: 'Exceeding $100,000' });
    const complete = data.filter(d => parseFloat(d.completionRate) === 100);
    if (complete.length === data.length && data.length > 0) n.push({ id: 3, type: 'success', icon: '✅', message: 'All orders complete!', details: `${data.length} delivered` });
    else if (complete.length) n.push({ id: 4, type: 'info', icon: '📊', message: `${complete.length} orders complete`, details: `${((complete.length / data.length) * 100).toFixed(1)}% rate` });
    return n;
  }, [data]);
  const visible = notifications.filter(n => !dismissed.has(n.id));
  if (visible.length === 0) return null;
  return (
    <div className="relative">
      <button ref={buttonRef} className="btn btn-ghost btn-xs gap-1 relative" onClick={toggle}>
        🔔<span className="badge badge-error badge-xs absolute -top-1 -right-1 animate-pulse">{visible.length}</span>
      </button>
      {isOpen && (
        <div ref={dropdownRef} className="absolute right-0 mt-2 w-80 bg-white shadow-xl rounded-xl p-3 z-50 border max-h-80 overflow-y-auto">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold text-sm">Notifications</h4>
            <button className="text-xs text-gray-400 hover:text-gray-600" onClick={() => { setDismissed(new Set(notifications.map(n => n.id))); close(); }}>Dismiss All</button>
          </div>
          <div className="space-y-2">
            {visible.map(n => (
              <div key={n.id} className={cn('p-3 rounded-lg flex items-start gap-2',
                n.type === 'success' ? 'bg-green-50 border-green-200' :
                n.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                n.type === 'error' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200')} style={{ border: '1px solid' }}>
                <span className="text-lg">{n.icon}</span>
                <div className="flex-1"><div className="text-sm font-medium">{n.message}</div>{n.details && <div className="text-xs opacity-70 mt-0.5">{n.details}</div>}</div>
                <button className="text-xs opacity-50 hover:opacity-100" onClick={e => { e.stopPropagation(); setDismissed(p => new Set([...p, n.id])); }}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
NotificationCenter.displayName = "NotificationCenter";

// ============================================================
// COMPONENT: DATA HISTORY
// ============================================================

const DataHistory = React.memo(() => {
  const [history, setHistory] = useLocalStorage('dataHistory', []);
  const { isOpen, toggle, close, dropdownRef, buttonRef } = useDropdown();
  return (
    <div className="relative">
      <button ref={buttonRef} className="btn btn-ghost btn-xs gap-1" onClick={toggle}>📜 History{history.length > 0 && <span className="badge badge-xs">{history.length}</span>}</button>
      {isOpen && (
        <div ref={dropdownRef} className="absolute right-0 mt-2 w-72 bg-white shadow-xl rounded-xl p-3 z-50 border max-h-72 overflow-y-auto">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold text-sm">Recent Actions</h4>
            <button className="text-xs text-red-500 hover:text-red-700" onClick={() => { setHistory([]); close(); }}>Clear All</button>
          </div>
          {history.length === 0 ? <div className="text-center text-gray-400 text-sm py-4">No history yet</div> : (
            <div className="space-y-2">
              {history.slice(0, 20).map((e, i) => (
                <div key={i} className="text-xs border-b pb-2 last:border-b-0">
                  <div className="flex justify-between"><span className="font-medium">{e.action}</span><span className="text-gray-400">{new Date(e.timestamp).toLocaleTimeString()}</span></div>
                  <div className="text-gray-500 truncate">{typeof e.data === 'string' ? e.data : JSON.stringify(e.data || '').substring(0, 50)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
DataHistory.displayName = "DataHistory";

// ============================================================
// COMPONENT: EXPORT OPTIONS (Enhanced with PDF)
// ============================================================

const ExportOptions = React.memo(({ onExport, totalItems, disabled }) => {
  const [format, setFormat] = useState('excel');
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeCharts, setIncludeCharts] = useState(false);
  const [emailReport, setEmailReport] = useState(false);
  const { isOpen, toggle, close, dropdownRef, buttonRef } = useDropdown();
  return (
    <div className="relative">
      <button ref={buttonRef} className="btn btn-success btn-xs gap-1 text-white" onClick={toggle} disabled={disabled}>⬇ Export ▾</button>
      {isOpen && (
        <div ref={dropdownRef} className="absolute right-0 mt-2 bg-white shadow-xl rounded-xl p-4 w-72 z-50 border max-h-[90vh] overflow-y-auto">
          <h4 className="font-semibold text-sm mb-3">Export Options</h4>
          <div className="space-y-2">
            {[['excel', 'Excel (.xlsx)'], ['csv', 'CSV (.csv)'], ['json', 'JSON (.json)'], ['pdf', 'PDF (.pdf)']].map(([v, l]) => (
              <label key={v} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="format" value={v} checked={format === v} onChange={() => setFormat(v)} className="radio radio-xs" />
                <span className="text-sm">{l}</span>
              </label>
            ))}
            <div className="divider my-1" />
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={includeSummary} onChange={() => setIncludeSummary(!includeSummary)} className="checkbox checkbox-xs" /><span className="text-sm">Include Summary</span></label>
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={includeCharts} onChange={() => setIncludeCharts(!includeCharts)} className="checkbox checkbox-xs" /><span className="text-sm">Include Charts</span></label>
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={emailReport} onChange={() => setEmailReport(!emailReport)} className="checkbox checkbox-xs" /><span className="text-sm">📧 Email Report</span></label>
          </div>
          <div className="mt-3 flex gap-2">
            <button className="btn btn-primary btn-xs flex-1 text-white" onClick={() => { onExport({ format, includeSummary, includeCharts, emailReport }); close(); }}>Export Now</button>
            <button className="btn btn-ghost btn-xs" onClick={close}>Cancel</button>
          </div>
          <div className="mt-2 text-[10px] text-gray-400 text-center">{totalItems} items to export</div>
        </div>
      )}
    </div>
  );
});
ExportOptions.displayName = "ExportOptions";

// ============================================================
// MAIN COMPONENT: BalanceSummary
// ============================================================

function BalanceSummary() {
  const { cndata, loading } = useContext(GetDataContext);
  const { theme, toggleTheme } = useTheme();

  // State
  const [selectedPI, setSelectedPI] = useLocalStorage('bs_pi', []);
  const [selectedOrder, setSelectedOrder] = useLocalStorage('bs_order', []);
  const [selectedLC, setSelectedLC] = useLocalStorage('bs_lc', []);
  const [selectedInvoice, setSelectedInvoice] = useLocalStorage('bs_inv', []);
  const [selectedCustomer, setSelectedCustomer] = useLocalStorage('bs_cust', []);
  const [selectedBuyer, setSelectedBuyer] = useLocalStorage('bs_buyer', []);
  const [selectedDelivery, setSelectedDelivery] = useLocalStorage('bs_del', []);
  const [selectedColumns, setSelectedColumns] = useLocalStorage('bs_cols', COLUMN_CONFIG.defaultVisible);
  const [selectedRows, setSelectedRows] = useLocalStorage('bs_rows', []);
  const [favorites, setFavorites] = useLocalStorage('bs_fav', []);
  const [savedFilters, setSavedFilters] = useLocalStorage('bs_saved', []);

  // UI State
  const [search, setSearch] = useState("");
  const [multiSearch, setMultiSearch] = useState("");
  const [viewMode, setViewMode] = useLocalStorage('bs_view', 'table'); // table | dashboard | timeline
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [quickViewItem, setQuickViewItem] = useState(null);
  const [showQuickView, setShowQuickView] = useState(false);
  const [deepInsights, setDeepInsights] = useState([]);
  const [currentBg, setCurrentBg] = useState(null);

  // Filter states
  const [piSearch, setPiSearch] = useState(""); const [orderSearch, setOrderSearch] = useState("");
  const [lcSearch, setLcSearch] = useState(""); const [invoiceSearch, setInvoiceSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState(""); const [buyerSearch, setBuyerSearch] = useState("");
  const [deliverySearch, setDeliverySearch] = useState("");
  const [piOpen, setPiOpen] = useState(false); const [orderOpen, setOrderOpen] = useState(false);
  const [lcOpen, setLcOpen] = useState(false); const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false); const [buyerOpen, setBuyerOpen] = useState(false);
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [minValue, setMinValue] = useState(""); const [maxValue, setMaxValue] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); const [sectionFilter, setSectionFilter] = useState("");

  // Refs
  const piRef = useRef(null); const orderRef = useRef(null); const lcRef = useRef(null);
  const invoiceRef = useRef(null); const customerRef = useRef(null); const buyerRef = useRef(null);
  const deliveryRef = useRef(null);

  const debouncedSearch = useDebounce(search);
  const maps = useDataMaps(cndata);
  const summarizedData = useSummarizedData(cndata, maps);

  const uniqueSections = useMemo(() => [...new Set(summarizedData.map(d => d.Section).filter(Boolean))], [summarizedData]);
  const uniquePI = useMemo(() => [...new Set(summarizedData.map(d => d.PINO || "No PI"))], [summarizedData]);
  const uniqueOrder = useMemo(() => [...new Set(summarizedData.map(d => String(d.WorkOrderNo).trim()).filter(Boolean))], [summarizedData]);
  const uniqueLC = useMemo(() => [...new Set(summarizedData.flatMap(d => d.LCList.map(l => l.lcNo || "No LC")))], [summarizedData]);
  const uniqueInvoice = useMemo(() => [...new Set(summarizedData.flatMap(d => d.InvoiceList.map(i => i.invoiceNo || "No Invoice")))], [summarizedData]);
  const uniqueCustomers = useMemo(() => [...new Set(summarizedData.map(d => d.CustomerName || "Unknown"))], [summarizedData]);
  const uniqueBuyers = useMemo(() => [...new Set(summarizedData.map(d => d.Buyer || "Unknown"))], [summarizedData]);
  const uniqueDeliveries = useMemo(() => [...new Set(summarizedData.map(d => d.DeliverName || "Unknown"))], [summarizedData]);

  const filteredPI = useMemo(() => uniquePI.filter(p => p.toLowerCase().includes(piSearch.toLowerCase())), [uniquePI, piSearch]);
  const filteredOrder = useMemo(() => uniqueOrder.filter(o => o.includes(orderSearch)), [uniqueOrder, orderSearch]);
  const filteredLC = useMemo(() => uniqueLC.filter(l => l.toLowerCase().includes(lcSearch.toLowerCase())), [uniqueLC, lcSearch]);
  const filteredInvoice = useMemo(() => uniqueInvoice.filter(i => i.toLowerCase().includes(invoiceSearch.toLowerCase())), [uniqueInvoice, invoiceSearch]);
  const filteredCustomers = useMemo(() => uniqueCustomers.filter(c => c.toLowerCase().includes(customerSearch.toLowerCase())), [uniqueCustomers, customerSearch]);
  const filteredBuyers = useMemo(() => uniqueBuyers.filter(b => b.toLowerCase().includes(buyerSearch.toLowerCase())), [uniqueBuyers, buyerSearch]);
  const filteredDeliveries = useMemo(() => uniqueDeliveries.filter(d => d.toLowerCase().includes(deliverySearch.toLowerCase())), [uniqueDeliveries, deliverySearch]);

  const filters = useMemo(() => ({
    selectedPI, selectedOrder, selectedLC, selectedInvoice, selectedCustomer, selectedBuyer, selectedDelivery,
    dateRange, minValue, maxValue, statusFilter, sectionFilter, favorites, showFavoritesOnly, multiSearch
  }), [selectedPI, selectedOrder, selectedLC, selectedInvoice, selectedCustomer, selectedBuyer, selectedDelivery, dateRange, minValue, maxValue, statusFilter, sectionFilter, favorites, showFavoritesOnly, multiSearch]);

  const filteredData = useFilters(summarizedData, filters, debouncedSearch);
  const { currentPage, setCurrentPage, pageCount, displayedData, totalData, grandTotal, totalItems } = usePagination(filteredData);

  const logHistory = useCallback((action, data) => {
    try {
      const h = JSON.parse(localStorage.getItem('dataHistory') || '[]');
      const newH = [{ timestamp: new Date().toISOString(), action, data: typeof data === 'string' ? data : JSON.stringify(data) }, ...h].slice(0, CONFIG.MAX_HISTORY_ITEMS);
      localStorage.setItem('dataHistory', JSON.stringify(newH));
    } catch {}
  }, []);

  const handleDeepThink = useCallback((insights) => {
    setDeepInsights(insights || []);
    if (insights?.length) toast.success(`🧠 ${insights.length} insights generated!`);
  }, []);

  const makeToggle = (setter) => useCallback((value) => {
    if (Array.isArray(value)) setter(value);
    else setter(prev => prev.includes(value) ? prev.filter(x => x !== value) : [...prev, value]);
    setCurrentPage(0);
  }, [setter, setCurrentPage]);

  const togglePI = makeToggle(setSelectedPI), toggleOrder = makeToggle(setSelectedOrder);
  const toggleLC = makeToggle(setSelectedLC), toggleInvoice = makeToggle(setSelectedInvoice);
  const toggleCustomer = makeToggle(setSelectedCustomer), toggleBuyer = makeToggle(setSelectedBuyer);
  const toggleDelivery = makeToggle(setSelectedDelivery);

  const toggleColumn = useCallback(c => setSelectedColumns(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]), [setSelectedColumns]);
  const toggleFavorite = useCallback(id => { setFavorites(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]); logHistory(favorites.includes(id) ? 'Removed favorite' : 'Added favorite', id); }, [favorites, setFavorites, logHistory]);

  const resetFilters = useCallback(() => {
    setSelectedPI([]); setSelectedOrder([]); setSelectedLC([]); setSelectedInvoice([]);
    setSelectedCustomer([]); setSelectedBuyer([]); setSelectedDelivery([]);
    setSearch(""); setMultiSearch(""); setDateRange({ start: "", end: "" });
    setMinValue(""); setMaxValue(""); setStatusFilter(""); setSectionFilter("");
    setShowFavoritesOnly(false); setCurrentPage(0);
    toast.info("All filters reset");
  }, [setSelectedPI, setSelectedOrder, setSelectedLC, setSelectedInvoice, setSelectedCustomer, setSelectedBuyer, setSelectedDelivery, setCurrentPage]);

  const handleFilterChange = useCallback((key, value) => {
    const setters = { dateRange: setDateRange, minValue: setMinValue, maxValue: setMaxValue, statusFilter: setStatusFilter, sectionFilter: setSectionFilter, showFavoritesOnly: setShowFavoritesOnly };
    setters[key]?.(value); setCurrentPage(0);
  }, [setCurrentPage]);

  const saveFilter = useCallback((name) => {
    setSavedFilters(prev => [...prev, { id: Date.now().toString(), name, filters, created: new Date().toISOString() }]);
    logHistory('Saved filter', name); toast.success(`Filter "${name}" saved!`);
  }, [filters, setSavedFilters, logHistory]);

  const loadFilter = useCallback((f) => {
    const d = f.filters;
    setSelectedPI(d.selectedPI || []); setSelectedOrder(d.selectedOrder || []);
    setSelectedLC(d.selectedLC || []); setSelectedInvoice(d.selectedInvoice || []);
    setSelectedCustomer(d.selectedCustomer || []); setSelectedBuyer(d.selectedBuyer || []);
    setSelectedDelivery(d.selectedDelivery || []); setDateRange(d.dateRange || { start: "", end: "" });
    setMinValue(d.minValue || ""); setMaxValue(d.maxValue || "");
    setStatusFilter(d.statusFilter || ""); setSectionFilter(d.sectionFilter || "");
    setShowFavoritesOnly(d.showFavoritesOnly || false); setMultiSearch(d.multiSearch || "");
    setCurrentPage(0); toast.success(`Loaded: ${f.name}`);
  }, [setSelectedPI, setSelectedOrder, setSelectedLC, setSelectedInvoice, setSelectedCustomer, setSelectedBuyer, setSelectedDelivery, setCurrentPage]);

  const deleteFilter = useCallback(id => { setSavedFilters(prev => prev.filter(f => f.id !== id)); toast.info('Filter deleted'); }, [setSavedFilters]);

  const handleRowClick = useCallback(item => {
    toast.info(`Order: ${item.WorkOrderNo} • ${item.CustomerName} • ${item.completionRate}%`);
    logHistory('Viewed order', item.WorkOrderNo);
  }, [logHistory]);

  const handleQuickView = useCallback(item => { setQuickViewItem(item); setShowQuickView(true); logHistory('Quick view', item.WorkOrderNo); }, [logHistory]);

  const handleBackgroundChange = useCallback(bg => { setCurrentBg(bg); logHistory('Background changed', bg.name); }, [logHistory]);

  // Click outside
  useEffect(() => {
    const h = e => {
      if (piRef.current && !piRef.current.contains(e.target)) setPiOpen(false);
      if (orderRef.current && !orderRef.current.contains(e.target)) setOrderOpen(false);
      if (lcRef.current && !lcRef.current.contains(e.target)) setLcOpen(false);
      if (invoiceRef.current && !invoiceRef.current.contains(e.target)) setInvoiceOpen(false);
      if (customerRef.current && !customerRef.current.contains(e.target)) setCustomerOpen(false);
      if (buyerRef.current && !buyerRef.current.contains(e.target)) setBuyerOpen(false);
      if (deliveryRef.current && !deliveryRef.current.contains(e.target)) setDeliveryOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const h = e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') { e.preventDefault(); document.getElementById('global-search')?.focus(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setShowCommandPalette(true); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') { e.preventDefault(); toggleTheme(); }
      if ((e.ctrlKey || e.metaKey) && e.key === '\\') { e.preventDefault(); setViewMode(v => v === 'table' ? 'dashboard' : 'table'); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') { e.preventDefault(); if (displayedData.length) { setSelectedRows(displayedData.map(d => d.WorkOrderNo)); toast.info(`Selected ${displayedData.length} items`); } }
      if ((e.ctrlKey || e.metaKey) && e.key === 't') { e.preventDefault(); document.querySelector('[data-deep-think]')?.click(); }
      if (e.key === 'Escape') { setSearch(''); setShowQuickView(false); setShowCommandPalette(false); setShowShortcuts(false); }
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') { e.preventDefault(); setShowShortcuts(true); }
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [displayedData, setSelectedRows, toggleTheme, setViewMode]);

  // Command palette commands
  const commands = useMemo(() => [
    { icon: '🌙', label: 'Toggle Dark Mode', category: 'Theme', shortcut: 'Ctrl+D', action: toggleTheme },
    { icon: '📊', label: 'Switch to Dashboard View', category: 'View', action: () => setViewMode('dashboard') },
    { icon: '📋', label: 'Switch to Table View', category: 'View', action: () => setViewMode('table') },
    { icon: '📅', label: 'Switch to Timeline View', category: 'View', action: () => setViewMode('timeline') },
    { icon: '🔄', label: 'Reset All Filters', category: 'Actions', action: resetFilters },
    { icon: '⭐', label: 'Toggle Favorites Only', category: 'Filters', action: () => setShowFavoritesOnly(p => !p) },
    { icon: '🧠', label: 'Run Deep Think Analysis', category: 'AI', shortcut: 'Ctrl+T', action: () => document.querySelector('[data-deep-think]')?.click() },
    { icon: '⬇', label: 'Export Data', category: 'Export', action: () => document.querySelector('[data-export]')?.click() },
    { icon: '❓', label: 'Show Keyboard Shortcuts', category: 'Help', shortcut: '?', action: () => setShowShortcuts(true) },
  ], [toggleTheme, setViewMode, resetFilters]);

  // Export
  const exportToExcel = useCallback((options = {}) => {
    const { format = 'excel', includeSummary = true, includeCharts = false, emailReport = false } = options;
    try {
      if (filteredData.length === 0) { toast.warning("No data to export"); return; }
      toast.info(`Preparing ${format.toUpperCase()} export...`);

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(filteredData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `OrderSummary_${Date.now()}.json`; a.click();
        URL.revokeObjectURL(url); toast.success("JSON exported!"); return;
      }
      if (format === 'csv') {
        const headers = ["Order No","Date","Customer","Delivery","PI","LC","Invoice","Section","Order Qty","Challan Qty","Balance Qty","Order Value","Challan Value","Balance Value","Challans"];
        const rows = filteredData.map(item => [
          item.WorkOrderNo, formatDate(item.OrderReceiveDate), item.CustomerName, item.DeliverName, item.PINO,
          (item.LCList||[]).map(l=>l.lcNo).join(";"), (item.InvoiceList||[]).map(i=>i.invoiceNo).join(";"),
          item.Section, item.TotalQty, item.ChallanQTY, item.BalanceQty, item.TotalValue, item.ChallanValue, item.BalanceValue,
          (item.ChallanNo||[]).map(c=>`${c.challanNo}(${c.status})`).join(";")
        ]);
        const csv = [headers, ...rows].map(r => r.map(c => `"${String(c||'').replace(/"/g,'""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `OrderSummary_${Date.now()}.csv`; a.click();
        URL.revokeObjectURL(url); toast.success("CSV exported!"); return;
      }
      if (format === 'pdf') {
        const win = window.open('', '_blank');
        win.document.write(`<html><head><title>Order Summary Report</title><style>
          body{font-family:Arial;padding:20px} h1{color:#1d4ed8} table{width:100%;border-collapse:collapse;font-size:10px}
          th{background:#3b82f6;color:white;padding:5px} td{border:1px solid #ddd;padding:4px;text-align:center}
          .total{font-weight:bold;background:#dbeafe}.header{text-align:center;margin-bottom:20px}
        </style></head><body><div class="header"><h1>Order Summary Report</h1>
        <p>Generated: ${new Date().toLocaleString()} • Total Orders: ${filteredData.length}</p></div>
        <table><thead><tr><th>Order</th><th>Date</th><th>Customer</th><th>Section</th><th>Qty</th><th>Challan</th><th>Balance</th><th>Value</th><th>Status</th></tr></thead><tbody>
        ${filteredData.map(i => `<tr><td>${i.WorkOrderNo}</td><td>${formatDate(i.OrderReceiveDate)}</td><td>${i.CustomerName}</td><td>${i.Section}</td><td>${formatNumber(i.TotalQty)}</td><td>${formatNumber(i.ChallanQTY)}</td><td>${formatNumber(i.BalanceQty)}</td><td>${formatCurrency(i.TotalValue)}</td><td>${i.completionRate}%</td></tr>`).join('')}
        <tr class="total"><td colspan="4">GRAND TOTAL</td><td>${formatNumber(grandTotal.TotalQty)}</td><td>${formatNumber(grandTotal.ChallanQTY)}</td><td>${formatNumber(grandTotal.BalanceQty)}</td><td>${formatCurrency(grandTotal.TotalValue)}</td><td></td></tr>
        </tbody></table></body></html>`);
        win.document.close(); setTimeout(() => win.print(), 500);
        toast.success("PDF opened for print!"); return;
      }

      // Excel export
      const wb = XLSX.utils.book_new();
      const groupedByPI = {};
      filteredData.forEach(item => { const k = item.PINO || "No PI"; if (!groupedByPI[k]) groupedByPI[k] = []; groupedByPI[k].push(item); });
      let data = [];
      for (const [pi, items] of Object.entries(groupedByPI)) {
        data.push([`PI: ${pi}`], []);
        data.push(["Order No","Order Date","Customer","Delivery","PI No","LC No","Invoice No","Section","Order Qty","Challan Qty","Balance Qty","Order Value","Challan Value","Balance Value","Challan No"]);
        items.forEach(item => data.push([
          item.WorkOrderNo, item.OrderReceiveDate ? formatDate(item.OrderReceiveDate) : "",
          item.CustomerName, item.DeliverName, item.PINO,
          (item.LCList||[]).map(l=>l.lcNo).join(", "), (item.InvoiceList||[]).map(i=>i.invoiceNo).join(", "),
          item.Section, +item.TotalQty?.toFixed(2), +item.ChallanQTY?.toFixed(2), +item.BalanceQty?.toFixed(2),
          +item.TotalValue?.toFixed(2), +item.ChallanValue?.toFixed(2), +item.BalanceValue?.toFixed(2),
          (item.ChallanNo||[]).map((c,i)=>`${i+1}. ${c.challanNo} (${c.status})`).join("\n")
        ]));
        data.push(["Subtotal","","","","","","","", items.reduce((a,b)=>a+ +b.TotalQty,0).toFixed(2), items.reduce((a,b)=>a+ +b.ChallanQTY,0).toFixed(2), items.reduce((a,b)=>a+ +b.BalanceQty,0).toFixed(2), items.reduce((a,b)=>a+ +b.TotalValue,0).toFixed(2), items.reduce((a,b)=>a+ +b.ChallanValue,0).toFixed(2), items.reduce((a,b)=>a+ +b.BalanceValue,0).toFixed(2), ""]);
        data.push([]);
      }
      const ws = XLSX.utils.aoa_to_sheet(data);
      let rp = 0;
      for (const items of Object.values(groupedByPI)) {
        if (!ws["!merges"]) ws["!merges"] = [];
        ws["!merges"].push({ s: { r: rp, c: 0 }, e: { r: rp, c: 14 } });
        rp += 3 + items.length + 2;
      }
      const colWidths = [];
      for (let c = 0; c < 15; c++) {
        let max = 10;
        for (let r = 0; r < data.length; r++) {
          const v = data[r][c];
          if (v) { const lines = v.toString().split("\n"); for (const l of lines) if (l.length > max) max = l.length + 2; }
        }
        colWidths.push({ wch: c === 14 ? Math.min(max + 10, 60) : Math.min(max, 30) });
      }
      ws["!cols"] = colWidths;
      ws["!rows"] = data.map(row => { let max = 1; row.forEach(c => { if (c) { const l = c.toString().split("\n").length; if (l > max) max = l; } }); return { hpt: Math.max(20, max * 18) }; });

      data.forEach((row, r) => row.forEach((_, c) => {
        const cell = XLSX.utils.encode_cell({ r, c }); if (!ws[cell]) return;
        ws[cell].s = {
          font: { sz: 11, name: "Calibri" },
          alignment: { horizontal: c === 14 ? "left" : "center", vertical: "center", wrapText: false },
          border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }
        };
        if (ws["!merges"]?.some(m => m.s.r === r)) { ws[cell].s.font = { bold: true, sz: 14, color: { rgb: "FFFFFF" } }; ws[cell].s.fill = { fgColor: { rgb: "2F75B5" } }; }
        if (c === 11 || c === 12 || c === 13) { ws[cell].s.numFmt = '"$"#,##0.00'; ws[cell].s.alignment.horizontal = "right"; }
        if (row[0] === "Subtotal") { ws[cell].s.fill = { fgColor: { rgb: "D9E1F2" } }; ws[cell].s.font.bold = true; }
        if (r === 2) { ws[cell].s.fill = { fgColor: { rgb: "4472C4" } }; ws[cell].s.font = { bold: true, color: { rgb: "FFFFFF" } }; }
      }));

      XLSX.utils.book_append_sheet(wb, ws, "Order Summary");

      if (includeSummary) {
        const sd = [['Order Summary Report'], ['Generated:', new Date().toLocaleString()], ['Total Orders:', filteredData.length], ['Total Quantity:', grandTotal.TotalQty.toFixed(2)], ['Total Challan Qty:', grandTotal.ChallanQTY.toFixed(2)], ['Total Balance Qty:', grandTotal.BalanceQty.toFixed(2)], ['Total Value:', `$${grandTotal.TotalValue.toFixed(2)}`], ['Total Challan Value:', `$${grandTotal.ChallanValue.toFixed(2)}`], ['Total Balance Value:', `$${grandTotal.BalanceValue.toFixed(2)}`], ['Completion Rate:', `${((grandTotal.ChallanQTY/grandTotal.TotalQty)*100||0).toFixed(1)}%`]];
        const wsS = XLSX.utils.aoa_to_sheet(sd); wsS['!cols'] = [{ wch: 22 }, { wch: 30 }];
        XLSX.utils.book_append_sheet(wb, wsS, "Summary");
      }

      XLSX.writeFile(wb, `OrderSummaryReport_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success(`Exported ${filteredData.length} rows!`);
      if (emailReport) toast.info('📧 Report scheduled for email');
      logHistory('Exported data', { format, count: filteredData.length });
    } catch (error) { console.error("Export error:", error); toast.error(`Export failed: ${error.message}`); }
  }, [filteredData, grandTotal, logHistory]);

  const getMultiSearchCount = useCallback(() => multiSearch?.trim() ? multiSearch.split(/[\n,;|]+/).filter(s => s.trim()).length : 0, [multiSearch]);

  return (
    <BackgroundGenerator theme={theme} onBackgroundChange={handleBackgroundChange}>
      <style>{`
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{transform:translate(-50%,100%);opacity:0} to{transform:translate(-50%,0);opacity:1} }
        @keyframes slideIn { from{transform:translateY(-20px);opacity:0} to{transform:translateY(0);opacity:1} }
        .animate-fadeIn{animation:fadeIn .2s ease} .animate-slideUp{animation:slideUp .3s ease}
        .animate-slideIn{animation:slideIn .3s ease} .animate-shimmer{animation:shimmer 2s infinite}
      `}</style>
      <div className="container mx-auto px-3 py-4 relative z-10">
        <OrderForm />

        {/* Header */}
        <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Order Balance Summary</h1>
            <p className="text-xs text-gray-600 mt-0.5">
              {totalItems} orders • {summarizedData.length} total
              {favorites.length > 0 && ` • ⭐ ${favorites.length}`}
              {multiSearch?.trim() && <span className="ml-2 text-warning">• 🔍 Multi: {getMultiSearchCount()}</span>}
            </p>
          </div>
          <div className="flex gap-1 flex-wrap items-center">
            {/* View Mode Switcher */}
            <div className="join">
              <button className={cn('join-item btn btn-xs', viewMode === 'table' ? 'btn-primary text-white' : 'btn-ghost bg-white/80')} onClick={() => setViewMode('table')} title="Table View (Ctrl+\\)">📋</button>
              <button className={cn('join-item btn btn-xs', viewMode === 'dashboard' ? 'btn-primary text-white' : 'btn-ghost bg-white/80')} onClick={() => setViewMode('dashboard')} title="Dashboard View">📊</button>
              <button className={cn('join-item btn btn-xs', viewMode === 'timeline' ? 'btn-primary text-white' : 'btn-ghost bg-white/80')} onClick={() => setViewMode('timeline')} title="Timeline View">📅</button>
            </div>
            {/* Theme Toggle */}
            <button className="btn btn-ghost btn-xs bg-white/80 backdrop-blur-sm" onClick={toggleTheme} title="Toggle Theme (Ctrl+D)">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button className="btn btn-ghost btn-xs bg-white/80 backdrop-blur-sm" onClick={() => setShowShortcuts(true)} title="Keyboard Shortcuts (?)">⌨️</button>
            <button className="btn btn-ghost btn-xs bg-white/80 backdrop-blur-sm" onClick={() => setShowCommandPalette(true)} title="Command Palette (Ctrl+K)">⚡</button>
            <NotificationCenter data={filteredData} />
            <DataHistory />
            <ColumnVisibilityManager columns={COLUMN_CONFIG.allColumns} visibleColumns={selectedColumns} onToggle={toggleColumn} />
            <div data-export><ExportOptions onExport={exportToExcel} totalItems={totalItems} disabled={totalItems === 0} /></div>
          </div>
        </div>

        {/* Top Analytics */}
        <TopItemsAnalytics data={filteredData} />

        {/* Quick Stats */}
        {grandTotal.TotalQty > 0 && (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
            {[
              { label: 'Total Orders', value: totalItems, color: 'text-gray-800' },
              { label: 'Total Qty', value: Math.ceil(grandTotal.TotalQty), color: 'text-blue-600' },
              { label: 'Challan Qty', value: Math.ceil(grandTotal.ChallanQTY), color: 'text-green-600' },
              { label: 'Balance Qty', value: Math.ceil(grandTotal.BalanceQty), color: 'text-red-600' },
              { label: 'Total Value', value: formatCurrency(grandTotal.TotalValue), color: 'text-indigo-600' },
              { label: 'Completion', value: `${grandTotal.TotalQty > 0 ? Math.round((grandTotal.ChallanQTY / grandTotal.TotalQty) * 100) : 0}%`, color: 'text-purple-600' },
            ].map((stat, i) => (
              <div key={i} className="bg-white/85 backdrop-blur-sm rounded-lg shadow-sm p-2 border hover:shadow-md transition-shadow">
                <div className="text-[10px] text-gray-500">{stat.label}</div>
                <div className={cn('text-base font-bold', stat.color)}>{stat.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Advanced Filters */}
        <div className="mb-3">
          <AdvancedFiltersPanel
            filters={{ dateRange, minValue, maxValue, statusFilter, sectionFilter, showFavoritesOnly }}
            onFilterChange={handleFilterChange} onReset={resetFilters} totalItems={totalItems} loading={loading}
            sections={uniqueSections} onSaveFilter={saveFilter} savedFilters={savedFilters}
            onLoadFilter={loadFilter} onDeleteFilter={deleteFilter} onDeepThink={handleDeepThink} data={filteredData}
          />
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap gap-1 mb-3 items-center">
          <div className="flex-1 min-w-[150px]">
            <input id="global-search" type="text" placeholder="🔍 Search... (Ctrl+F)" className="input input-bordered input-xs w-full bg-white/90 backdrop-blur-sm" value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(0); }} />
          </div>
          <MultiSearchDropdown value={multiSearch} onChange={setMultiSearch} onClear={() => setMultiSearch('')} onSearch={() => { if (multiSearch?.trim()) { toast.info(`🔍 Searching ${getMultiSearchCount()} items...`); setCurrentPage(0); } }} totalMatches={filteredData.length} isActive={multiSearch?.trim()?.length > 0} />
          <ProfessionalFilterDropdown label="Order" open={orderOpen} setOpen={setOrderOpen} items={filteredOrder} selectedItems={selectedOrder} onToggle={toggleOrder} searchValue={orderSearch} setSearchValue={setOrderSearch} ref={orderRef} color="primary" />
          <ProfessionalFilterDropdown label="PI" open={piOpen} setOpen={setPiOpen} items={filteredPI} selectedItems={selectedPI} onToggle={togglePI} searchValue={piSearch} setSearchValue={setPiSearch} ref={piRef} color="secondary" />
          <ProfessionalFilterDropdown label="LC" open={lcOpen} setOpen={setLcOpen} items={filteredLC} selectedItems={selectedLC} onToggle={toggleLC} searchValue={lcSearch} setSearchValue={setLcSearch} ref={lcRef} color="info" />
          <ProfessionalFilterDropdown label="Invoice" open={invoiceOpen} setOpen={setInvoiceOpen} items={filteredInvoice} selectedItems={selectedInvoice} onToggle={toggleInvoice} searchValue={invoiceSearch} setSearchValue={setInvoiceSearch} ref={invoiceRef} color="success" />
          <ProfessionalFilterDropdown label="Customer" open={customerOpen} setOpen={setCustomerOpen} items={filteredCustomers} selectedItems={selectedCustomer} onToggle={toggleCustomer} searchValue={customerSearch} setSearchValue={setCustomerSearch} ref={customerRef} color="purple" icon="👤" />
          <ProfessionalFilterDropdown label="Buyer" open={buyerOpen} setOpen={setBuyerOpen} items={filteredBuyers} selectedItems={selectedBuyer} onToggle={toggleBuyer} searchValue={buyerSearch} setSearchValue={setBuyerSearch} ref={buyerRef} color="pink" icon="💼" />
          <ProfessionalFilterDropdown label="Delivery" open={deliveryOpen} setOpen={setDeliveryOpen} items={filteredDeliveries} selectedItems={selectedDelivery} onToggle={toggleDelivery} searchValue={deliverySearch} setSearchValue={setDeliverySearch} ref={deliveryRef} color="orange" icon="🚚" />
          <button className={cn('btn btn-xs', showFavoritesOnly ? 'btn-warning' : 'btn-ghost bg-white/80')} onClick={() => setShowFavoritesOnly(p => !p)} title="Toggle Favorites">{showFavoritesOnly ? '⭐' : '☆'}</button>
          {(selectedPI.length || selectedOrder.length || selectedLC.length || selectedInvoice.length || selectedCustomer.length || selectedBuyer.length || selectedDelivery.length || search || multiSearch || dateRange.start || dateRange.end || minValue || maxValue || statusFilter || sectionFilter || showFavoritesOnly) ? (
            <button className="btn btn-ghost btn-xs bg-white/80" onClick={resetFilters}>Clear All</button>
          ) : null}
        </div>

        {/* View Content */}
        {viewMode === 'dashboard' ? (
          <DashboardView data={filteredData} grandTotal={grandTotal} onQuickView={handleQuickView} onFavoriteToggle={toggleFavorite} favorites={favorites} />
        ) : viewMode === 'timeline' ? (
          <TimelineView data={filteredData} onQuickView={handleQuickView} />
        ) : (
          <ProfessionalSummaryTable
            data={displayedData} columns={selectedColumns} totalData={totalData}
            onRowClick={handleRowClick} onRowSelect={setSelectedRows} onQuickView={handleQuickView}
            onFavoriteToggle={toggleFavorite} selectedRows={selectedRows} favorites={favorites} loading={loading}
          />
        )}

        {/* Pagination */}
        {pageCount > 1 && viewMode === 'table' && (
          <div className="flex flex-wrap justify-between items-center mt-3 gap-2">
            <div className="text-xs text-gray-600">
              Showing {currentPage * CONFIG.ITEMS_PER_PAGE + 1} to {Math.min((currentPage + 1) * CONFIG.ITEMS_PER_PAGE, totalItems)} of {totalItems}
              {selectedRows.length > 0 && ` • ${selectedRows.length} selected`}
            </div>
            <ReactPaginate
              breakLabel="..." nextLabel="Next →" previousLabel="← Previous" pageCount={pageCount}
              onPageChange={({ selected }) => setCurrentPage(selected)} containerClassName="flex gap-0.5"
              pageLinkClassName="px-2 py-1 border rounded text-xs hover:bg-gray-100 bg-white/80"
              activeLinkClassName="bg-primary text-white" previousLinkClassName="px-2 py-1 border rounded text-xs bg-white/80"
              nextLinkClassName="px-2 py-1 border rounded text-xs bg-white/80" disabledClassName="opacity-50"
              renderOnZeroPageCount={null}
            />
          </div>
        )}

        {/* Bulk Actions Toolbar */}
        {selectedRows.length > 0 && (
          <BulkActionsToolbar
            selectedCount={selectedRows.length}
            onClear={() => setSelectedRows([])}
            onExport={() => exportToExcel({ format: 'excel' })}
            onFavorite={() => { selectedRows.forEach(id => !favorites.includes(id) && toggleFavorite(id)); toast.success('Added to favorites!'); }}
            onDelete={() => setSelectedRows([])}
            onAssign={() => toast.info('Tag assignment coming soon!')}
          />
        )}

        {/* Quick View Modal */}
        <QuickViewModal item={quickViewItem} isOpen={showQuickView} onClose={() => setShowQuickView(false)} />

        {/* Command Palette */}
        <CommandPalette isOpen={showCommandPalette} onClose={() => setShowCommandPalette(false)} commands={commands} />

        {/* Keyboard Shortcuts */}
        <KeyboardShortcutsOverlay isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />

        {/* Deep Insights */}
        {deepInsights.length > 0 && (
          <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 backdrop-blur-sm rounded-xl p-4 border border-blue-200 animate-slideIn">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-semibold text-sm text-blue-800">🧠 Deep Think Insights</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                  {deepInsights.map((insight, i) => (
                    <div key={i} className={cn('p-2 rounded-lg text-xs',
                      insight.priority === 'critical' ? 'bg-red-100 text-red-700' :
                      insight.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                      insight.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700')}>
                      <span className="mr-1">{insight.icon}</span>
                      <span className="font-medium">{insight.title}:</span>
                      <span className="ml-1">{insight.description}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button className="btn btn-ghost btn-xs" onClick={() => setDeepInsights([])}>✕</button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 text-center text-[10px] text-gray-500 border-t pt-3">
          <p>{totalItems} orders • Updated: {new Date().toLocaleString(CONFIG.DATE_FORMAT)}{favorites.length > 0 && ` • ⭐ ${favorites.length} favorites`}</p>
          <div className="flex flex-wrap justify-center gap-2 mt-1">
            <span>💡 Ctrl+F: Search</span><span>•</span><span>⚡ Ctrl+K: Commands</span><span>•</span>
            <span>🌙 Ctrl+D: Theme</span><span>•</span><span>🔄 Ctrl+\\: View</span><span>•</span>
            <span>🧠 Ctrl+T: AI</span><span>•</span><span>❓ ?: Help</span>
          </div>
        </div>
      </div>
    </BackgroundGenerator>
  );
}

export default BalanceSummary;