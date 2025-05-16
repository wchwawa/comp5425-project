'use client';

import React, { useState } from 'react';
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';
import TradingViewSymbolOverviewChart from './TradingViewSimpleChartWidget';
import { motion } from 'framer-motion';

interface ResizableChartProps {
  stockSymbols: string[][];
  initialHeight: number;
}

const ResizableChart: React.FC<ResizableChartProps> = ({
  stockSymbols,
  initialHeight = 200
}) => {
  const [height, setHeight] = useState(initialHeight);
  const [isResizing, setIsResizing] = useState(false);

  const handleResize = (
    event: React.SyntheticEvent,
    { size }: { size: { width: number; height: number } }
  ) => {
    setHeight(size.height);
  };

  const handleResizeStart = () => {
    setIsResizing(true);
  };

  const handleResizeStop = () => {
    setIsResizing(false);
  };

  return (
    <div className="relative w-full">
      <div className="bg-gray-950/95 backdrop-blur-md pt-2 pb-3 px-2 border-b-0 border border-gray-800/50 rounded-t-xl shadow-md z-10">
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 mb-1 lg:ml-2 lg:mt-1"
        >
          Smart Chart
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="text-sm text-gray-400 lg:ml-2"
        >
          {stockSymbols && stockSymbols.length > 0
            ? `Getting ${stockSymbols.length} ${stockSymbols.length === 1 ? 'symbol' : 'symbols'} charts`
            : 'No symbols selected'} by analysing your query
        </motion.p>
      </div>

      <ResizableBox
        width={Infinity}
        height={height}
        minConstraints={[100, 150]}
        maxConstraints={[Infinity, 600]}
        resizeHandles={['s']}
        handle={
          <div className="custom-handle w-full h-6 absolute -bottom-1 cursor-row-resize z-10 flex items-center justify-center">
            <div
              className={`w-24 h-2 ${isResizing ? 'bg-indigo-400' : 'bg-gray-500'} rounded-full transition-colors flex items-center justify-center`}
            >
              <div className="drag-dots flex space-x-1">
                <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
              </div>
            </div>
          </div>
        }
        onResize={handleResize}
        onResizeStart={handleResizeStart}
        onResizeStop={handleResizeStop}
        className="bg-transparent rounded-b-xl overflow-hidden relative border border-gray-800/50 border-t-0"
      >
        <div
          className={`absolute inset-0 backdrop-blur-md bg-black/30 shadow-md transition-colors duration-200 overflow-hidden`}
        >
          <div className="absolute inset-0 p-0.5 pb-4">
            <TradingViewSymbolOverviewChart stockSymbols={stockSymbols} />
          </div>
        </div>
      </ResizableBox>
    </div>
  );
};

export default ResizableChart;
