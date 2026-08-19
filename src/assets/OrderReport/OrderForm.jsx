// OrderForm.js - Clean Professional Design with API Selection
import React, { useContext, useState, useRef, useEffect } from "react";
import DateRangePicker from "../components/DatePickerData";
import axios from "axios";
import { GetDataContext } from "../components/DataContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// ============================================================
// NETWORK TOPOLOGY - Clean Node Visualization (No Headers)
// ============================================================
const NetworkTopology = ({ isActive }) => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let nodes = [];
    
    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width || 600;
      canvas.height = 160;
    };
    
    const createNodes = () => {
      const labels = ['Gateway', 'Orders', 'WorkOrder', 'Challan', 'Invoice', 'BBLC'];
      const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444'];
      
      nodes = labels.map((label, i) => ({
        label,
        color: colors[i % colors.length],
        x: 60 + (i / (labels.length - 1)) * (canvas.width - 120),
        y: canvas.height / 2 + (Math.random() - 0.5) * 35,
        radius: 13,
        pulse: Math.random() * Math.PI * 2,
        connections: [],
        status: Math.random() > 0.2 ? 'active' : 'idle'
      }));
      
      // Create connections
      nodes.forEach((node, i) => {
        for (let j = i + 1; j < nodes.length; j++) {
          if (Math.random() > 0.4) {
            node.connections.push(j);
          }
        }
      });
    };
    
    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      
      ctx.clearRect(0, 0, w, h);
      
      // Clean background
      ctx.fillStyle = '#f9fafb';
      ctx.fillRect(0, 0, w, h);
      
      if (!isActive) {
        ctx.fillStyle = '#d1d5db';
        ctx.font = '12px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('● System Ready', w/2, h/2 + 4);
        return;
      }
      
      // Draw connections
      nodes.forEach((node, i) => {
        node.connections.forEach(j => {
          const target = nodes[j];
          if (!target) return;
          
          const dx = target.x - node.x;
          const dy = target.y - node.y;
          
          // Connection line
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(target.x, target.y);
          ctx.strokeStyle = '#d1d5db';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          
          // Data packet animation
          const progress = (Date.now() * 0.0003 + i * 0.2 + j * 0.3) % 1;
          const px = node.x + dx * progress;
          const py = node.y + dy * progress;
          
          ctx.fillStyle = '#3b82f6';
          ctx.globalAlpha = 0.6;
          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        });
      });
      
      // Draw nodes
      nodes.forEach((node) => {
        // Node circle
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = node.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Status dot
        ctx.fillStyle = node.status === 'active' ? '#10b981' : '#9ca3af';
        ctx.beginPath();
        ctx.arc(node.x + node.radius * 0.5, node.y - node.radius * 0.5, 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Label
        ctx.fillStyle = '#1f2937';
        ctx.font = '8.5px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y + node.radius + 13);
        
        // Small data rate
        if (node.status === 'active') {
          ctx.fillStyle = '#9ca3af';
          ctx.font = '6.5px monospace';
          ctx.fillText(`${Math.floor(Math.random() * 40 + 10)}/s`, node.x, node.y + node.radius + 22);
        }
        
        node.pulse += 0.03;
      });
      
      animationId = requestAnimationFrame(draw);
    };
    
    resize();
    createNodes();
    draw();
    
    const handleResize = () => {
      resize();
      createNodes();
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isActive]);
  
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-[160px]" />
    </div>
  );
};

// ============================================================
// API SELECTION TOGGLE COMPONENT
// ============================================================
const ApiSelectionPanel = ({ enabledApis, setEnabledApis }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const apiOptions = [
    { id: 'orders', label: 'Orders', default: true },
    { id: 'workOrder', label: 'Work Orders', default: true },
    { id: 'challan', label: 'Challan', default: true },
    { id: 'bblc', label: 'BBLC', default: true },
    { id: 'invoice', label: 'Invoice', default: true },
    { id: 'pi', label: 'Customer PI', default: true },
    { id: 'challanReceive', label: 'Challan Receive', default: true },
  ];
  
  const toggleApi = (apiId) => {
    setEnabledApis(prev => ({
      ...prev,
      [apiId]: !prev[apiId]
    }));
  };
  
  const getApiStatusColor = (apiId) => {
    return enabledApis[apiId] ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400';
  };
  
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span>APIs</span>
        <span className="text-xs">
          {Object.values(enabledApis).filter(v => v).length}/{Object.keys(enabledApis).length}
        </span>
      </button>
      
      {isOpen && (
        <div className="absolute top-full mt-2 left-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 z-50 min-w-[200px]">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Enable/Disable APIs</div>
          <div className="space-y-1.5">
            {apiOptions.map(api => (
              <label key={api.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 px-2 py-1 rounded transition-colors">
                <input
                  type="checkbox"
                  checked={enabledApis[api.id] !== false}
                  onChange={() => toggleApi(api.id)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className={`text-sm px-1.5 py-0.5 rounded ${getApiStatusColor(api.id)}`}>
                  {api.label}
                </span>
              </label>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => {
                const allEnabled = Object.keys(enabledApis).reduce((acc, key) => ({ ...acc, [key]: true }), {});
                setEnabledApis(allEnabled);
              }}
              className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 mr-3"
            >
              Enable All
            </button>
            <button
              type="button"
              onClick={() => {
                const allDisabled = Object.keys(enabledApis).reduce((acc, key) => ({ ...acc, [key]: false }), {});
                setEnabledApis(allDisabled);
              }}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400"
            >
              Disable All
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// MAIN ORDER FORM COMPONENT
// ============================================================
function OrderForm() {
  const { cndata, setcndata, setLoading } = useContext(GetDataContext);
  const apiKey = localStorage.getItem("apiKey");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Ready");
  const [workOrderStatus, setWorkOrderStatus] = useState("pending");
  const [apiTimings, setApiTimings] = useState({});
  const cancelTokenSourceRef = useRef(null);
  const [showAnimation, setShowAnimation] = useState(false);
  
  // API enabled states - stored in localStorage for persistence
  const [enabledApis, setEnabledApis] = useState(() => {
    const saved = localStorage.getItem('enabledApis');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fall through to default
      }
    }
    return {
      orders: true,
      workOrder: true,
      challan: true,
      bblc: true,
      invoice: true,
      pi: true,
      challanReceive: true,
    };
  });
  
  // Save enabled APIs to localStorage when changed
  useEffect(() => {
    localStorage.setItem('enabledApis', JSON.stringify(enabledApis));
  }, [enabledApis]);

  // ============================================================
  // FETCH FUNCTIONS
  // ============================================================
  const fetchWorkOrderData = async (stDate, edDate, apiKey, source, retryCount = 0) => {
    if (!enabledApis.workOrder) {
      setWorkOrderStatus("disabled");
      setStatusMessage("⏭️ WorkOrder API disabled");
      return [];
    }
    
    const maxRetries = 3;
    const timeout = 360000;

    try {
      setWorkOrderStatus("fetching");
      setStatusMessage(`Fetching WorkOrder data (attempt ${retryCount + 1}/${maxRetries})...`);

      const startTime = Date.now();

      const response = await axios.get(
        `https://tpl-api.ebs365.info/api/ORDER_WorkOrder/GetWorkOrderDashboard?CompanyID=1&BuyerID=0&ProductCategoryID=0&MarketingID=0&StatusID=-1&StartDate=${stDate}&EndDate=${edDate}`,
        {
          headers: {
            Authorization: `${apiKey}`,
            Accept: "application/json",
            "Accept-Encoding": "gzip, deflate, br",
          },
          timeout: timeout,
          cancelToken: source.token,
          onDownloadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              const baseProgress = 25;
              const additionalProgress = percentCompleted * 0.15;
              setProgress(Math.min(40, baseProgress + additionalProgress));
            }
          },
        },
      );

      const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
      const data = response.data || [];

      setApiTimings((prev) => ({
        ...prev,
        workOrder: { records: data.length, time: elapsedTime },
      }));

      if (Array.isArray(data) && data.length > 0) {
        setWorkOrderStatus("success");
        setStatusMessage(`✅ WorkOrder data loaded: ${data.length} records (${elapsedTime}s)`);
        return data;
      } else {
        if (retryCount < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 3000));
          return fetchWorkOrderData(stDate, edDate, apiKey, source, retryCount + 1);
        }
        setWorkOrderStatus("empty");
        setStatusMessage("⚠️ WorkOrder data empty");
        return [];
      }
    } catch (error) {
      if (axios.isCancel(error)) throw error;

      if (error.response?.status === 204) {
        setWorkOrderStatus("empty");
        setStatusMessage("📭 No data available");
        return [];
      }

      if (error.response?.status === 401) {
        setWorkOrderStatus("failed");
        setStatusMessage("❌ Unauthorized");
        toast.error("Session expired. Please login again.");
        return [];
      }

      if (retryCount < maxRetries) {
        const waitTime = (retryCount + 1) * 5000;
        setStatusMessage(`Retry ${retryCount + 2}/${maxRetries}...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        return fetchWorkOrderData(stDate, edDate, apiKey, source, retryCount + 1);
      }

      setWorkOrderStatus("failed");
      setStatusMessage("❌ WorkOrder unavailable");
      return [];
    }
  };

  const buildWorkOrderIdMap = (orderData, workOrderDashboardData) => {
    const workOrderIdMap = {};

    if (workOrderDashboardData && Array.isArray(workOrderDashboardData) && workOrderDashboardData.length > 0) {
      workOrderDashboardData.forEach(item => {
        if (item.workOrderNo && item.workOrderID) {
          const originalNo = item.workOrderNo.trim();
          workOrderIdMap[originalNo] = item.workOrderID;
          workOrderIdMap[originalNo.toUpperCase()] = item.workOrderID;
          workOrderIdMap[originalNo.toLowerCase()] = item.workOrderID;
          workOrderIdMap[originalNo.replace(/-/g, '')] = item.workOrderID;
        }
      });
      return workOrderIdMap;
    }
    return {};
  };

  const fetchWithRetry = async (url, config, retryCount = 0, maxRetries = 2) => {
    try {
      const response = await axios.get(url, config);
      return response;
    } catch (error) {
      if (axios.isCancel(error)) throw error;

      if (retryCount < maxRetries && error.code !== "ECONNABORTED") {
        await new Promise((resolve) => setTimeout(resolve, 2000 * (retryCount + 1)));
        return fetchWithRetry(url, config, retryCount + 1, maxRetries);
      }
      throw error;
    }
  };

  // Helper to safely fetch API data with error handling
  const safeFetchApi = async (url, config, apiName, fallbackData = []) => {
    if (!enabledApis[apiName]) {
      setApiTimings((prev) => ({
        ...prev,
        [apiName]: { records: 0, time: '0.0', disabled: true },
      }));
      return fallbackData;
    }
    
    try {
      const startTime = Date.now();
      const response = await fetchWithRetry(url, { ...config, _startTime: startTime }, 0, 2);
      const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
      const data = response?.data || fallbackData;
      
      setApiTimings((prev) => ({
        ...prev,
        [apiName]: { records: data.length, time: elapsedTime, disabled: false },
      }));
      
      return data;
    } catch (error) {
      if (axios.isCancel(error)) throw error;
      
      // Log error but don't crash
      console.warn(`API ${apiName} failed:`, error.message);
      
      setApiTimings((prev) => ({
        ...prev,
        [apiName]: { records: 0, time: '0.0', error: true, disabled: false },
      }));
      
      // Show warning toast for failed API
      if (apiName !== 'workOrder' && apiName !== 'orders') {
        toast.warning(`⚠️ ${apiName} API failed, continuing with available data`);
      }
      
      return fallbackData;
    }
  };

  // ============================================================
  // MAIN SUBMIT
  // ============================================================
  const dateSubmit = async (e) => {
    e.preventDefault();

    if (cancelTokenSourceRef.current) {
      cancelTokenSourceRef.current.cancel("New request initiated");
      cancelTokenSourceRef.current = null;
    }

    if (!cndata?.startDate || !cndata?.endDate) {
      toast.error("Please select start and end date!");
      return;
    }

    if (!apiKey) {
      toast.error("API Key not found! Please login again.");
      return;
    }

    setIsSubmitting(true);
    setLoading(true);
    setProgress(0);
    setStatusMessage("Initializing...");
    setWorkOrderStatus("pending");
    setApiTimings({});
    setShowAnimation(true);

    const stDate = cndata.startDate.toISOString().split("T")[0];
    const edDate = cndata.endDate.toISOString().split("T")[0];

    const source = axios.CancelToken.source();
    cancelTokenSourceRef.current = source;

    try {
      // STEP 1: Fetch Orders (Required - can't be disabled)
      setStatusMessage("Fetching orders...");
      setProgress(5);

      const startOrderTime = Date.now();
      const orderReportResponse = await fetchWithRetry(
        `https://tpl-api.ebs365.info/api/OrderReport/BI_OrderRelatedInformationReport?CompanyID=1&ProductCategoryID=0&ProductSubCategoryID=0&MarketingID=0&CustomerID=0&BuyerID=0&JobCardID=0&StartDate=${stDate}&EndDate=${edDate}&CommandID=5&EmpID=0`,
        { headers: { Authorization: `${apiKey}` }, timeout: 300000, cancelToken: source.token, _startTime: startOrderTime },
        0, 2
      );

      const orderData = orderReportResponse.data || [];
      const orderTime = ((Date.now() - startOrderTime) / 1000).toFixed(1);

      setApiTimings((prev) => ({
        ...prev,
        orders: { records: orderData.length, time: orderTime },
      }));

      if (!Array.isArray(orderData) || orderData.length === 0) {
        toast.warning("No orders found for the selected date range.");
        setLoading(false);
        setIsSubmitting(false);
        setShowAnimation(false);
        return;
      }

      setProgress(20);
      setStatusMessage(`Found ${orderData.length} orders`);

      // STEP 2: WorkOrder Dashboard (optional - can be disabled)
      setProgress(25);
      let workOrderDashboardData = [];

      if (enabledApis.workOrder) {
        try {
          workOrderDashboardData = await fetchWorkOrderData(stDate, edDate, apiKey, source);
        } catch (error) {
          if (axios.isCancel(error)) throw error;
          workOrderDashboardData = [];
          toast.warning("⚠️ WorkOrder API failed, continuing without work order IDs");
        }
      } else {
        setWorkOrderStatus("disabled");
        setStatusMessage("⏭️ WorkOrder API disabled");
      }

      // STEP 3: Build WorkOrderIdMap
      const workOrderIdMap = buildWorkOrderIdMap(orderData, workOrderDashboardData);

      setProgress(45);
      setStatusMessage(`Processing ${orderData.length} orders...`);

      // STEP 4: Supporting data - Only fetch enabled APIs
      setProgress(50);
      setStatusMessage("Fetching supporting data...");

      const apiConfig = {
        headers: { Authorization: `${apiKey}` },
        timeout: 90000,
        cancelToken: source.token,
      };

      // Define API mappings with their identifiers
      const apiEndpoints = [
        { 
          id: 'challan', 
          url: `https://tpl-api.ebs365.info/api/Challan/GetDeliveryChalanDashboard?CompanyID=1&ProductCategoryID=0&CustomerID=0&MarkettingID=0&StatusID=7&StartDate=${stDate}&EndDate=${edDate}`,
          fallback: []
        },
        { 
          id: 'bblc', 
          url: `https://tpl-api.ebs365.info/api/BBLC/GetBBLCDashboard?CustomerID=0&CompanyID=1&StartDate=${stDate}&EndDate=${edDate}`,
          fallback: []
        },
        { 
          id: 'invoice', 
          url: `https://tpl-api.ebs365.info/api/CommercialInvoice/GetInvoiceDashboard?CompanyID=1&CustomerID=0&StartDate=${stDate}&EndDate=${edDate}`,
          fallback: []
        },
        { 
          id: 'pi', 
          url: `https://tpl-api.ebs365.info/api/CustomerPI/GetCustomerPIDashboard?CompanyID=1&CustomerID=0&MarketingID=0&StartDate=${stDate}&EndDate=${edDate}`,
          fallback: []
        },
        { 
          id: 'challanReceive', 
          url: `https://tpl-api.ebs365.info/api/Challan/GetDeliveryChalanReceiveDashboard?CompanyID=1&ProductCategoryID=0&CustomerID=0&MarkettingID=0&Status=Receive-Complete&StartDate=${stDate}&EndDate=${edDate}`,
          fallback: []
        },
      ];

      // Filter out disabled APIs
      const activeEndpoints = apiEndpoints.filter(api => enabledApis[api.id] !== false);

      // Execute only active API calls
      const promiseResults = await Promise.allSettled(
        activeEndpoints.map((api) => safeFetchApi(api.url, apiConfig, api.id, api.fallback))
      );

      // Map results back to their respective variables
      const resultsMap = {};
      activeEndpoints.forEach((api, index) => {
        const result = promiseResults[index];
        if (result.status === 'fulfilled') {
          resultsMap[api.id] = result.value;
        } else {
          resultsMap[api.id] = api.fallback;
        }
      });

      // Get disabled APIs with empty data
      const disabledApis = apiEndpoints.filter(api => enabledApis[api.id] === false);
      disabledApis.forEach(api => {
        resultsMap[api.id] = api.fallback;
      });

      const challanData = resultsMap.challan || [];
      const bblcData = resultsMap.bblc || [];
      const invoiceData = resultsMap.invoice || [];
      const piCompanyData = resultsMap.pi || [];
      const challanReceiveData = resultsMap.challanReceive || [];

      setProgress(70);
      setStatusMessage("Processing supporting data...");

      // Build challan receive map (only if data exists)
      const orderChallanNumbers = new Set();
      orderData.forEach((item) => {
        if (item.ChallanNo) {
          item.ChallanNo.split(",").map((c) => c.trim()).filter(Boolean).forEach((ch) => orderChallanNumbers.add(ch));
        }
      });

      const challanReceiveMap = {};
      if (challanReceiveData && challanReceiveData.length > 0) {
        for (const item of challanReceiveData) {
          let challanNo = item.challanNo || item.ChallanNo || null;
          if (challanNo) {
            const challans = typeof challanNo === "string" ? challanNo.split(",").map((c) => c.trim()) : Array.isArray(challanNo) ? challanNo : [];
            for (const ch of challans) {
              if (ch && ch !== "" && orderChallanNumbers.has(ch)) {
                challanReceiveMap[ch] = {
                  status: item.statusDesc || "Challan Received",
                  deliveryChallanID: item.deliveryChallanID || null,
                  data: item,
                };
              }
            }
          }
        }
      }

      // STEP 5: Group data
      setProgress(80);
      setStatusMessage(`Grouping ${orderData.length} orders...`);

      const groupedMap = new Map();

      for (const item of orderData) {
        const workOrderNo = item.WorkOrderNo;
        if (!workOrderNo) continue;

        let workOrderID = workOrderIdMap[workOrderNo.trim()];
        if (!workOrderID) workOrderID = workOrderIdMap[workOrderNo.trim().toUpperCase()];
        if (!workOrderID) workOrderID = workOrderIdMap[workOrderNo.trim().toLowerCase()];
        if (!workOrderID) {
          const cleanNo = workOrderNo.trim().replace(/-/g, '');
          workOrderID = workOrderIdMap[cleanNo] || workOrderIdMap[cleanNo.toUpperCase()];
        }

        const formateDate = new Date(item.OrderReceiveDate).toLocaleDateString("en-GB");

        if (!groupedMap.has(workOrderNo)) {
          groupedMap.set(workOrderNo, {
            WorkOrderNo: workOrderNo,
            WorkOrderID: workOrderID || null,
            JobBag: item.JobCardNo || "",
            Buyer: item.BuyerName || "",
            Category: item.ProductCategoryName || "",
            challanqty: 0,
            BreakDownQTY: 0,
            TotalOrderValue: 0,
            ChallanValue: 0,
            BalanceQTY: 0,
            BalanceValue: 0,
            OrderReceiveDate: formateDate,
            CustomerName: item.CName || "",
            PINO: item.CustomerPINo || "",
          });
        }

        const acc = groupedMap.get(workOrderNo);
        acc.challanqty += Number(item.ChallanQTY) || 0;
        acc.BreakDownQTY += Number(item.BreakDownQTY) || 0;
        acc.TotalOrderValue += Number(item.TotalOrderValue) || 0;
        acc.ChallanValue += Number(item.ChallanValue) || 0;
        acc.BalanceQTY += Number(item.BalanceQTY) || 0;
        acc.BalanceValue += Number(item.BalanceValue) || 0;
      }

      const groupedData = Array.from(groupedMap.values());

      setProgress(90);
      setStatusMessage("Updating application state...");

      // STEP 6: Update context
      setcndata((prevState) => ({
        ...prevState,
        groupedData: groupedData,
        apiData: orderData,
        grupChallan: challanData,
        bblcData: bblcData,
        invoiceData: invoiceData,
        piCompanyData: piCompanyData,
        workOrderIdMap: workOrderIdMap,
        challanReceiveMap: challanReceiveMap,
        rawChallanReceiveData: challanReceiveData,
        workOrderStatus: workOrderStatus,
        enabledApis: enabledApis, // Store enabled APIs state
        _lastFetch: {
          timestamp: new Date().toISOString(),
          startDate: stDate,
          endDate: edDate,
          orderCount: orderData.length,
          challanCount: challanData.length,
          groupedCount: groupedData.length,
          workOrderIdCount: Object.keys(workOrderIdMap).length,
          workOrderStatus: workOrderStatus,
          apiTimings: apiTimings,
          enabledApis: enabledApis,
        },
      }));

      setProgress(100);
      setStatusMessage(`✅ Loaded ${orderData.length} orders, ${groupedData.length} groups`);

      const missingIds = groupedData.filter((g) => !g.WorkOrderID).length;
      if (missingIds > 0) {
        const percentage = ((missingIds / groupedData.length) * 100).toFixed(1);
        toast.warning(`⚠️ ${missingIds} (${percentage}%) orders missing WorkOrderID.`);
      }

      // Show disabled APIs warning
      const disabledCount = Object.values(enabledApis).filter(v => !v).length;
      if (disabledCount > 0) {
        toast.info(`ℹ️ ${disabledCount} API(s) disabled. Some data may be missing.`);
      }

      const totalTime = Object.values(apiTimings).reduce((sum, t) => sum + parseFloat(t.time || 0), 0).toFixed(1);
      toast.success(`✅ ${orderData.length} orders loaded (${groupedData.length} groups) in ${totalTime}s`);

      // Hide animation after 2 seconds
      setTimeout(() => {
        setShowAnimation(false);
      }, 2000);

    } catch (err) {
      if (axios.isCancel(err)) {
        toast.info("Data fetch was cancelled.");
        setShowAnimation(false);
        return;
      }

      if (err.code === "ECONNABORTED") {
        toast.error("Request timed out. Try reducing the date range.");
        setStatusMessage("⏱️ Request timed out");
      } else if (err.response?.status === 401) {
        toast.error("Unauthorized! Please login again.");
        setStatusMessage("❌ Unauthorized");
      } else if (err.response?.status === 500) {
        toast.error("Server error. Please try again later.");
        setStatusMessage("❌ Server error");
      } else if (err.response?.status === 204) {
        toast.warning("No data available for the selected range.");
        setStatusMessage("📭 No data available");
      } else {
        toast.error(err.message || "Something went wrong!");
        setStatusMessage(`❌ ${err.message?.substring(0, 50) || "Error"}`);
      }
      setShowAnimation(false);
    } finally {
      setLoading(false);
      setIsSubmitting(false);
      cancelTokenSourceRef.current = null;
    }
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <>
      <ToastContainer position="top-right" autoClose={5000} />
      
      {/* Topology Animation - No headers, clean */}
      {(isSubmitting || showAnimation) && (
        <div className="mb-4">
          <NetworkTopology isActive={isSubmitting} />
        </div>
      )}

      {/* Form with API Selection */}
      <form onSubmit={dateSubmit} className="flex gap-4 justify-center items-center flex-wrap bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <DateRangePicker />
        
        {/* API Selection Panel */}
        <ApiSelectionPanel enabledApis={enabledApis} setEnabledApis={setEnabledApis} />
        
        <input
          type="submit"
          value={isSubmitting ? "Loading..." : "Submit"}
          className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
            isSubmitting
              ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg'
          }`}
          disabled={isSubmitting}
        />

        {isSubmitting && (
          <div className="min-w-[240px]">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span className="truncate max-w-[180px]">{statusMessage}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {cndata?.apiData && cndata.apiData.length > 0 && !isSubmitting && (
          <span className="text-xs text-gray-600 dark:text-gray-400 font-mono">
            ✅ {cndata.apiData.length} orders
            {cndata._lastFetch?.workOrderIdCount !== undefined && (
              <span className="ml-1 text-gray-400">• {cndata._lastFetch.workOrderIdCount} IDs</span>
            )}
            {cndata._lastFetch?.groupedCount !== undefined && (
              <span className="ml-1 text-gray-400">• {cndata._lastFetch.groupedCount} groups</span>
            )}
            {cndata._lastFetch?.enabledApis && (
              <span className="ml-1 text-gray-400">
                • {Object.values(cndata._lastFetch.enabledApis).filter(v => v).length}/{Object.keys(cndata._lastFetch.enabledApis).length} APIs
              </span>
            )}
          </span>
        )}
      </form>
    </>
  );
}

export default OrderForm;