'use client';
import { useEffect, useRef } from "react";

const useTradingViewWidget = (scriptUrl: string, config: Record<string, unknown>, height = 600) => {
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const currentRef = containerRef.current;
        if (!currentRef) return;
        if (currentRef.dataset.loaded) return;
        currentRef.innerHTML = `<div class="tradingview-widget-container__widget" style="width: 100%; height: ${height}px;"></div>`;

        const script = document.createElement("script");
        script.src = scriptUrl;
        script.async = true;
        script.innerHTML = JSON.stringify(config);

        currentRef.appendChild(script);
        currentRef.dataset.loaded = 'true';

        return () => {
            if(currentRef) {
                currentRef.innerHTML = '';
                delete currentRef.dataset.loaded;
            }
        }
    }, [scriptUrl, config, height])

    return containerRef;
}
export default useTradingViewWidget