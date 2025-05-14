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
        'TradingViewWidget: stockSymbols are empty or undefined, skipping script creation.'
      );
      // 可选: 显示一些占位符或提示信息
      // container.current.innerHTML = '<p>No symbols to display.</p>';
      return;
    }

    console.log(
      'TradingViewWidget: Preparing to create script with symbols:',
      stockSymbols
    );

    const formattedSymbolsForWidget = stockSymbols.map((symbolArray) => {
      const ticker = symbolArray[0];
      return [`${ticker}|1D`];
    });
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
        "height": "500", 
        "locale": "en",
        "colorTheme": "dark",
        "autosize": true,
        "showVolume": false,
        "showMA": false,
        "hideDateRanges": false,
        "hideMarketStatus": false,
        "hideSymbolLogo": false,
        "scalePosition": "right",
        "scaleMode": "Normal",
        "fontFamily": "-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif",
        "fontSize": "10",
        "noTimeScale": false,
        "valuesTracking": "1",
        "changeMode": "price-and-percent",
        "chartType": "area",
        "maLineColor": "#2962FF",
        "maLineWidth": 1,
        "maLength": 9,
        "headerFontSize": "medium",
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

    // 清理函数：当组件卸载或 stockSymbols 变化导致 effect 重新运行时，此函数会先执行
    return () => {
      if (container.current) {
        // 移除脚本和由脚本创建的widget内容
        // container.current.innerHTML = ''; // 已经在 effect 开始时清理了
        console.log(
          'TradingViewWidget: useEffect cleanup triggered for unmount or stockSymbols change.'
        );
      }
    };
  }, [stockSymbols]); // <--- 将 stockSymbols 添加到依赖数组

  return (
    <div
      className="tradingview-widget-container"
      ref={container}
      style={{ height: '500px', width: '100%' }} // 明确设置容器尺寸
    >
      {/* TradingView 脚本会填充这个区域 */}
      {/* <div className="tradingview-widget-container__widget"></div> */}
      {/* <div className="tradingview-widget-copyright">
        <a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank">
          <span className="blue-text">Track all markets on TradingView</span>
        </a>
      </div> */}
    </div>
  );
}

// 导出时使用 React.memo
export default memo(TradingViewSymbolOverviewWidget);
