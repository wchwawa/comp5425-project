'use client';
import React, { useEffect, useRef, memo } from 'react';

interface Props {
  // 保持 stockSymbols prop 以便未来使用，但示例将使用硬编码的 symbols
  stockSymbols?: string[][];
}

// 重命名组件以匹配您的示例，尽管文件名保持不变
function TradingViewSymbolOverviewWidget({ stockSymbols }: Props) {
  const container = useRef<HTMLDivElement>(null);
  console.log(
    'Chart Widget rendering/receiving Props: stockSymbols=',
    stockSymbols
  );

  useEffect(() => {
    if (!container.current) {
      console.error('TradingViewWidget: Container ref is not assigned.');
      return;
    }

    // 清理旧的 widget 内容
    container.current.innerHTML = '';
    console.log('TradingViewWidget: Container cleared.');

    // 如果 stockSymbols 无效或为空，则不创建脚本
    if (!stockSymbols || stockSymbols.length === 0) {
      console.log(
        'TradingViewWidget: stockSymbols are empty or undefined, showing default content.'
      );

      // 显示默认内容
      const defaultContent = document.createElement('div');
      defaultContent.className =
        'flex items-center justify-center h-full flex-col text-center p-4';
      defaultContent.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-gray-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p class="text-gray-400 text-sm">No chart data available</p>
        <p class="text-xs text-gray-500">Search for a stock symbol to display chart</p>
      `;
      container.current.appendChild(defaultContent);
      return;
    }

    console.log(
      'TradingViewWidget: Preparing to create script with symbols:',
      stockSymbols
    );

    // 这里我们确保至少有一个默认符号供 widget 使用
    let formattedSymbolsForWidget = stockSymbols.map((symbolArray) => {
      const ticker = symbolArray[0];
      return [`${ticker}|1D`];
    });

    // 如果没有符号，添加一个默认符号
    if (formattedSymbolsForWidget.length === 0) {
      formattedSymbolsForWidget = [['AAPL|1D']];
    }

    console.log(
      'TradingViewWidget: Formatted symbols for widget:',
      formattedSymbolsForWidget
    );

    const script = document.createElement('script');
    script.src =
      'https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = `
      {
        "symbols": ${JSON.stringify(formattedSymbolsForWidget)},
        "chartOnly": false,
        "width": "100%",
        "height": "100%",
        "locale": "en",
        "colorTheme": "dark",
        "autosize": true,
        "showVolume": true,
        "showMA": false,
        "hideDateRanges": false,
        "hideMarketStatus": false,
        "hideSymbolLogo": false,
        "scalePosition": "right",
        "scaleMode": "Normal",
        "fontFamily": "-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif",
        "fontSize": "8",
        "noTimeScale": false,
        "valuesTracking": "1",
        "changeMode": "price-and-percent",
        "chartType": "bars",
        "maLineColor": "#2962FF",
        "maLineWidth": 1,
        "maLength": 9,
        "headerFontSize": "small",
        "lineWidth": 2,
        "lineType": 0,
        "dateRanges": [
          "1d|1",
          "1m|30",
          "3m|60",
          "12m|1D",
          "60m|1W",
          "all|1M"
        ]
      }`;

    container.current.appendChild(script);
    console.log('TradingViewWidget: Script appended.');

    // 清理函数
    return () => {
      if (container.current) {
        console.log(
          'TradingViewWidget: useEffect cleanup triggered for unmount or stockSymbols change.'
        );
      }
    };
  }, [stockSymbols]); // 依赖于 stockSymbols

  return (
    <div
      className="tradingview-widget-container w-full h-full min-h-[150px] lg:px-3"
      ref={container}
      style={{ height: '100%', width: '100%' }}
    >
      {/* TradingView 脚本会填充这个区域 */}
    </div>
  );
}

// 导出时使用 React.memo
export default memo(TradingViewSymbolOverviewWidget);
