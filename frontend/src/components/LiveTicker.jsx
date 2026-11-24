import React from 'react';
import { Activity, Radio, BellRing } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LiveTicker = () => {
  const { liveAlerts } = useAuth();

  return (
    <div className="bg-navy-900 text-slate-300 px-4 py-1.5 text-xs flex items-center justify-between border-b border-slate-800">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="flex items-center gap-1.5 text-cyan-400 font-semibold uppercase tracking-wider text-[10px] bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/50">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          <span>Live WebSocket Feed</span>
        </div>
        <div className="truncate text-slate-300">
          {liveAlerts.length > 0 ? (
            <span className="inline-flex items-center gap-2">
              <span className="font-medium text-white">{liveAlerts[0].title}:</span>
              <span className="text-slate-400">{liveAlerts[0].desc}</span>
            </span>
          ) : (
            <span className="text-slate-400">
              Monitoring real-time telemetry from IoT dispensers (MedSmart-4G) and hospital adverse event streams...
            </span>
          )}
        </div>
      </div>
      <div className="hidden sm:flex items-center gap-2 text-slate-400 text-[11px]">
        <Activity className="w-3.5 h-3.5 text-teal-400" />
        <span>Surveillance Node: <strong>ONLINE (Port 8000)</strong></span>
      </div>
    </div>
  );
};
