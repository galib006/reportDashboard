import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

export const GetDataContext = createContext();

function DataContext({ children }) {
  const [cndata, setcndata] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    endDate: new Date(),
    apiData: [],
    groupedData: [],
    grupChallan: [],
    bblcData: [],
    invoiceData: [],
    piCompanyData: [],
    workOrderIdMap: {},
    challanReceiveMap: {},
    rawChallanReceiveData: [],
    workOrderStatus: 'pending',
    _lastFetch: null
  });
  
  const [loading, setLoading] = useState(false);
  
  // ===== API KEY STATE =====
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('apiKey') || '';
  });

  // ===== UPDATE API KEY =====
  const updateApiKey = (newKey) => {
    if (newKey && newKey.trim() !== '') {
      const trimmedKey = newKey.trim();
      localStorage.setItem('apiKey', trimmedKey);
      setApiKey(trimmedKey);
      // Dispatch event for other tabs/components
      window.dispatchEvent(new Event('apiKeyUpdated'));
      return true;
    }
    return false;
  };

  // ===== LISTEN FOR API KEY CHANGES =====
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'apiKey') {
        setApiKey(e.newValue || '');
      }
    };
    
    const handleApiKeyUpdate = () => {
      const newKey = localStorage.getItem('apiKey');
      setApiKey(newKey || '');
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('apiKeyUpdated', handleApiKeyUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('apiKeyUpdated', handleApiKeyUpdate);
    };
  }, []);

  return (
    <GetDataContext.Provider value={{
      cndata,
      setcndata,
      loading,
      setLoading,
      apiKey,
      setApiKey,
      updateApiKey
    }}>
      {children}
    </GetDataContext.Provider>
  );
}

export default DataContext;