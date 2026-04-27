"use client";
import React, { useEffect } from "react";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import FunnelGraph from 'funnel-graph-js';
import "funnel-graph-js/dist/css/main.min.css";
import "funnel-graph-js/dist/css/theme.min.css";

export type FunnelStage = { label: string; value: number };

interface Props {
  stages: FunnelStage[];
  width?: number;
  height?: number;
  gradient?: string[];
  isDarkMode?: boolean;
  title?: string;
}

export default function MetaAdsFunnel({
  stages,
  width,
  height = 260,
  gradient = ["#2e7bf6b0", "#8479fd"],
  isDarkMode = false,
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
      // Forçar horizontal para evitar que a "linha" aponte para baixo como o funil vertical
      const graph = new FunnelGraph({
        container: selector,
        direction: "horizontal",
        gradientDirection: "horizontal",
        width: containerWidth,
        height: height,
        data: {
          labels: stages.map((s) => s.label),
          values: stages.map((s) => s.value),
          // A biblioteca espera um array de cores para cada etapa. 
          // Se for gradiente, deve ser um array dentro do array: colors: [ ['#c1', '#c2'], ['#c1', '#c2'] ]
          colors: stages.map(() => gradient),
        },
        displayPercent: true,
      });

      graph.draw();

      // Forçar classe de tema da biblioteca se necessário
      if (isDarkMode) {
        el.classList.add("fg-dark");
      } else {
        el.classList.remove("fg-dark");
      }

      // Forçar atualização de cores via JS se o CSS falhar em alguns elementos
      try {
        const svg = el.querySelector("svg");
        if (svg) {
          const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
          const linear = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
          linear.setAttribute("id", "funnelGradient");

          linear.setAttribute("x1", "0%");
          linear.setAttribute("x2", "100%");
          linear.setAttribute("y1", "0%");
          linear.setAttribute("y2", "0%");

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
      } catch { }
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
  }, [stages, width, height, gradient, isDarkMode]);

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 overflow-hidden w-full shadow-sm">
      <style>
        {`
        /* Número Principal */
        #${elementId} .svg-funnel-js__label .label__value,
        #${elementId} .label__value {
          color: #18181b !important;
          fill: #18181b !important;
          font-family: var(--font-sans, ui-sans-serif, system-ui) !important;
          font-weight: 700 !important;
        }
        .dark #${elementId} .svg-funnel-js__label .label__value,
        .dark #${elementId} .label__value {
          color: #f4f4f5 !important;
          fill: #f4f4f5 !important;
        }

        /* Títulos das Etapas */
        #${elementId} .svg-funnel-js__label .label__title,
        #${elementId} .label__title {
          color: #9333ea !important;
          fill: #9333ea !important;
          font-family: var(--font-sans, ui-sans-serif, system-ui) !important;
          font-weight: 500 !important;
        }
        .dark #${elementId} .svg-funnel-js__label .label__title,
        .dark #${elementId} .label__title {
          color: #f97316 !important;
          fill: #f97316 !important;
        }

        /* Porcentagens (Sublabels / Percentage) */
        #${elementId} .svg-funnel-js__subLabel,
        #${elementId} .svg-funnel-js__subLabels .svg-funnel-js__subLabel,
        #${elementId} .label__percentage {
           color: #7c3aed !important; /* purple-600 */
           fill: #7c3aed !important;
           font-family: var(--font-sans, ui-sans-serif, system-ui) !important;
           font-weight: 600 !important;
           font-size: 11px !important;
        }
        .dark #${elementId} .svg-funnel-js__subLabel,
        .dark #${elementId} .svg-funnel-js__subLabels .svg-funnel-js__subLabel,
        .dark #${elementId} .label__percentage {
           color: #fb923c !important; /* orange-400 */
           fill: #fb923c !important;
        }
        `}
      </style>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
      </div>
      <div id={elementId} className="funnel-graph w-full" style={{ width: "100%", height, overflow: "hidden" }} />
    </div>
  );
}
