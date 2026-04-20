'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';

interface HealthStatus {
  status: 'success' | 'error' | 'loading';
  latency?: number;
  message?: string;
  timestamp: string;
}

export function SerproHealthMonitor() {
  const [data, setData] = useState<HealthStatus>({
    status: 'loading',
    timestamp: new Date().toISOString()
  });

  const checkHealth = useCallback(async () => {
    try {
      const startTime = Date.now();
      const res = await fetch('/api/serpro/health');
      const result = await res.json();
      
      if (res.ok) {
        setData({
          status: 'success',
          latency: result.latency || (Date.now() - startTime),
          timestamp: result.timestamp
        });
      } else {
        setData({
          status: 'error',
          message: result.message || 'Falha',
          timestamp: new Date().toISOString()
        });
      }
    } catch {
      setData({
        status: 'error',
        message: 'Offline',
        timestamp: new Date().toISOString()
      });
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  return (
    <div className="flex justify-end">
      <button 
        onClick={checkHealth}
        title={data.status === 'error' ? data.message : `Atualizar (Última: ${new Date(data.timestamp).toLocaleTimeString()})`}
        className="group flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
      >
        <div className="relative flex h-2 w-2 items-center justify-center shrink-0">
          <span className={`absolute inline-flex h-full w-full rounded-full opacity-40 transition-colors duration-500 ${data.status === 'success' ? 'bg-emerald-500' : data.status === 'error' ? 'animate-ping bg-red-500' : 'animate-pulse bg-blue-500'}`} />
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 transition-colors duration-500 ${data.status === 'success' ? 'bg-emerald-500' : data.status === 'error' ? 'bg-red-500' : 'bg-blue-500'}`} />
        </div>
        
        <span>Serpro</span>
        
        {data.status === 'success' && data.latency && (
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono transition-opacity group-hover:opacity-100 opacity-60">
            {data.latency}ms
          </span>
        )}

        {data.status === 'error' && (
          <span className="text-[10px] text-red-500 dark:text-red-400">
            Offline
          </span>
        )}

        <RefreshCw className="w-3 h-3 ml-0.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
      </button>
    </div>
  );
}
