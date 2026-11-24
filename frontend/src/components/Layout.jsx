import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { ClinicalSafetyBanner } from './ClinicalSafetyBanner';
import { LiveTicker } from './LiveTicker';

export const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Compliance Banner */}
      <ClinicalSafetyBanner />

      {/* Live WebSocket Telemetry Ticker */}
      <LiveTicker />

      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar />

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar />
          <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
