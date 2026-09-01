// components/home/AutoLoadProgress.jsx

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AutoLoadProgress = ({ isAutoLoading, autoLoadProgress, autoLoadStatus }) => {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (isAutoLoading) {
      setShouldShow(true);
    } else {
      // Small delay before hiding to let the 100% state show briefly
      const timer = setTimeout(() => {
        setShouldShow(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isAutoLoading]);

  // ✅ Safety: auto-hide if progress reaches 100% and status shows success
  useEffect(() => {
    // ✅ Add null/undefined check for autoLoadStatus
    if (autoLoadProgress >= 100 && autoLoadStatus && autoLoadStatus.includes('✅')) {
      const timer = setTimeout(() => {
        setShouldShow(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [autoLoadProgress, autoLoadStatus]);

  // ✅ Also hide if status contains error and progress is 100
  useEffect(() => {
    if (autoLoadProgress >= 100 && autoLoadStatus && autoLoadStatus.includes('❌')) {
      const timer = setTimeout(() => {
        setShouldShow(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [autoLoadProgress, autoLoadStatus]);

  // ✅ If autoLoadStatus is empty and progress is 100, hide after a moment
  useEffect(() => {
    if (autoLoadProgress >= 100 && (!autoLoadStatus || autoLoadStatus === '')) {
      const timer = setTimeout(() => {
        setShouldShow(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [autoLoadProgress, autoLoadStatus]);

  return (
    <AnimatePresence>
      {shouldShow && (
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
                    {autoLoadProgress < 100 && (
                      <>
                        <div className="absolute inset-0 border-2 border-indigo-200 rounded-full" />
                        <div className="absolute inset-0 border-2 border-indigo-500 rounded-full border-t-transparent animate-spin" />
                      </>
                    )}
                    {autoLoadProgress >= 100 && (
                      <div className="absolute inset-0 flex items-center justify-center text-green-500 text-lg">
                        ✓
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-indigo-700">
                      {autoLoadProgress >= 100 ? '✅ Complete!' : 'Auto-loading data'}
                    </p>
                    <p className="text-xs text-indigo-500">
                      {autoLoadStatus || 'Loading...'}
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
                  style={{ width: `${Math.min(autoLoadProgress, 100)}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AutoLoadProgress;