import React, { useEffect, useRef, memo } from 'react';

/**
 * TradingView Chart Widget
 * @param {Object} props Component props
 * @param {string} props.symbol Trading pair symbol (e.g., 'BINANCE:BTCUSDT')
 * @param {string} props.interval Chart interval/timeframe (e.g., '1', '5', '15', '60', '240')
 * @param {string} props.theme Chart theme ('light' or 'dark')
 * @param {Array} props.studies Additional studies/indicators to add to the chart
 * @param {Function} props.onChartReady Callback when chart is ready
 */
function TradingViewWidget({ symbol = "BTCUSDT" }) {
  const container = useRef();

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = `
      {
        "autosize": true,
        "symbol": "BINANCE:${symbol}",
        "interval": "60",
        "timezone": "Etc/UTC",
        "theme": "light",
        "style": "1",
        "locale": "en",
        "hide_side_toolbar": false,
        "allow_symbol_change": false,
        "details": true,
        "support_host": "https://www.tradingview.com"
      }`;
    
    // Clear container before adding new script
    while (container.current?.firstChild) {
      container.current.removeChild(container.current.firstChild);
    }
    
    container.current?.appendChild(script);
    
    return () => {
      if (container.current) {
        while (container.current.firstChild) {
          container.current.removeChild(container.current.firstChild);
        }
      }
    };
  }, [symbol]);

  return (
    <div className="tradingview-widget-container" ref={container} style={{ height: "100%", width: "100%" }}>
      <div className="tradingview-widget-container__widget" style={{ height: "calc(100% - 32px)", width: "100%" }}></div>
      <div className="tradingview-widget-copyright"><a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank"><span className="blue-text">Track all markets on TradingView</span></a></div>
    </div>
  );
}

export default memo(TradingViewWidget); 