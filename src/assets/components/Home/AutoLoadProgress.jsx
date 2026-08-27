// components/home/AutoLoadProgress.jsx

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AutoLoadProgress = ({ isAutoLoading, autoLoadProgress, autoLoadStatus }) => {
  return (
    <AnimatePresence>
      {isAutoLoading && (
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
                    <div className="absolute inset-0 border-2 border-indigo-200 rounded-full" />
                    <div className="absolute inset-0 border-2 border-indigo-500 rounded-full border-t-transparent animate-spin" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-indigo-700">
                      Auto-loading data
                    </p>
                    <p className="text-xs text-indigo-500">
                      {autoLoadStatus}
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
                  style={{ width: `${autoLoadProgress}%` }}
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