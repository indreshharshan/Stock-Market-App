"use client";

import React, { useEffect, useRef } from "react";

export default function MiniTrendChart({ symbol, color = "#0FEDBE" }: { symbol: string; color?: string }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;
    
    // Clear previous if any
    container.current.innerHTML = "";
    
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol: symbol,
      width: "100%",
      height: "100%",
      locale: "en",
      dateRange: "12M",
      colorTheme: "dark",
      isTransparent: true,
      autosize: true,
      largeChartUrl: "",
      chartOnly: true,
      noTimeScale: true,
    });
    
    container.current.appendChild(script);
  }, [symbol]);

  return (
    <div className="w-24 h-10 overflow-hidden pointer-events-none opacity-80" ref={container}>
      <div className="tradingview-widget-container__widget"></div>
    </div>
  );
}
