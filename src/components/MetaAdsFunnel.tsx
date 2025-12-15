"use client";
import React, { useEffect } from "react";
// @ts-expect-error: funnel-graph-js has no TS types
import FunnelGraph from "funnel-graph-js";
import "funnel-graph-js/dist/css/main.min.css";
import "funnel-graph-js/dist/css/theme.min.css";

export type FunnelStage = { label: string; value: number };

interface Props {
  stages: FunnelStage[];
  width?: number;
  height?: number;
  gradient?: string[];
  dark?: boolean;
  title?: string;
}

export default function MetaAdsFunnel({
  stages,
  width,
  height = 260,
  gradient = ["#2e7bf6b0", "#8479fd"],
  dark = true,
  title = "Funil de Conversão",
}: Props) {
  const elementId = "meta-ads-funnel";

  useEffect(() => {
    const draw = () => {
      const selector = `#${elementId}`;
      const el = document.querySelector(selector) as HTMLElement | null;
      if (!el) return;

      el.innerHTML = "";

      // Use container width, fallback to width prop or 300
      const containerWidth = el.clientWidth || width || 320;
      const isMobile = containerWidth < 640; // Breakpoint mobile

      // FunnelGraph needs a specific width number
      const graph = new FunnelGraph({
        container: selector,
        direction: isMobile ? "vertical" : "horizontal",
        gradientDirection: isMobile ? "vertical" : "horizontal",
        width: containerWidth,
        height: isMobile ? 400 : height, // Altura maior no mobile para caber verticalmente
        data: {
          labels: stages.map((s) => s.label),
          values: stages.map((s) => s.value),
          colors: [gradient[0] || "#2e7cf6"],
        },
        displayPercent: true,
      });

      graph.draw();

      // Customização de Cores e Fontes das Labels via CSS Injection
      // A biblioteca funnel-graph-js usa classes específicas que podemos sobrescrever
      const style = document.createElement('style');
      style.innerHTML = `
        #${elementId} .svg-funnel-js__labels .svg-funnel-js__label .label__value {
          fill: ${dark ? '#e4e4e7' : '#18181b'} !important; /* zinc-200 / zinc-900 */
          font-family: var(--font-sans, ui-sans-serif, system-ui) !important;
          font-weight: 600 !important;
        }
        #${elementId} .svg-funnel-js__labels .svg-funnel-js__label .label__title {
          fill: ${dark ? '#a1a1aa' : '#52525b'} !important; /* zinc-400 / zinc-600 */
          font-family: var(--font-sans, ui-sans-serif, system-ui) !important;
        }
        #${elementId} .svg-funnel-js__subLabels .svg-funnel-js__subLabel {
           fill: ${dark ? '#71717a' : '#71717a'} !important;
           font-family: var(--font-sans, ui-sans-serif, system-ui) !important;
        }
      `;
      el.appendChild(style);

      if (dark) {
        el.classList.add("fg-dark");
      } else {
        el.classList.remove("fg-dark");
      }

      try {
        const svg = el.querySelector("svg");
        if (svg) {
          const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
          const linear = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
          linear.setAttribute("id", "funnelGradient");
          
          if (isMobile) {
            linear.setAttribute("x1", "0%");
            linear.setAttribute("x2", "0%");
            linear.setAttribute("y1", "0%");
            linear.setAttribute("y2", "100%");
          } else {
            linear.setAttribute("x1", "0%");
            linear.setAttribute("x2", "100%");
            linear.setAttribute("y1", "0%");
            linear.setAttribute("y2", "0%");
          }

          const stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
          stop1.setAttribute("offset", "0%");
          stop1.setAttribute("stop-color", gradient[0] || "#2e7cf6");
          const stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
          stop2.setAttribute("offset", "100%");
          stop2.setAttribute("stop-color", gradient[1] || "#8c82ff");

          linear.appendChild(stop1);
          linear.appendChild(stop2);
          defs.appendChild(linear);
          svg.prepend(defs);

          svg.querySelectorAll("path").forEach((p) => {
            (p as SVGPathElement).setAttribute("fill", "url(#funnelGradient)");
          });
        }
      } catch {} 
    };

    // Initial draw
    // Small delay to ensure container has size
    const timer = setTimeout(draw, 0);

    // Resize handler with ResizeObserver for better responsiveness
    const el = document.querySelector(`#${elementId}`);
    let resizeObserver: ResizeObserver | null = null;
    
    if (el) {
      resizeObserver = new ResizeObserver(() => {
        // Debounce slightly to avoid too many redraws
        requestAnimationFrame(draw);
      });
      resizeObserver.observe(el.parentElement || el);
    }
    
    // Fallback to window resize
    const handleWindowResize = () => {
      draw();
    };
    window.addEventListener('resize', handleWindowResize);

    return () => {
      clearTimeout(timer);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [stages, width, height, gradient, dark]);

  return (
    <div className="rounded-xl border border-zinc-800 bg-black p-4 overflow-hidden w-full">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
        <span className="text-xs text-zinc-400">i</span>
      </div>
      <div id={elementId} className="funnel-graph w-full" style={{ width: "100%", height, overflow: "hidden" }} />
    </div>
  );
}
