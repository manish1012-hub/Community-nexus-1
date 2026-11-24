import React, { useState } from 'react';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext';
import { 
  Bell, 
  UserCircle, 
  LogOut, 
  Users, 
  ShieldAlert, 
  CheckCircle2, 
  ChevronDown,
  Sparkles,
  Stethoscope
} from 'lucide-react';

export const Navbar = () => {
  const { user, role, logout, switchRole, liveAlerts } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showAlertMenu, setShowAlertMenu] = useState(false);

  const currentRole = role || 'doctor';

  const roleColors = {
    admin: 'bg-purple-100 text-purple-800 border-purple-200',
    doctor: 'bg-blue-100 text-blue-800 border-blue-200',
    pharmacist: 'bg-teal-100 text-teal-800 border-teal-200',
    researcher: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    patient: 'bg-amber-100 text-amber-800 border-amber-200',
  };

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-navy-800 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
            <Stethoscope className="w-5 h-5 text-cyan-300" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-lg leading-tight tracking-tight flex items-center gap-1.5">
              PharmaCare <span className="text-cyan-600 font-extrabold">AI</span>
            </h1>
            <p className="text-[10px] text-slate-500 tracking-wide font-medium uppercase">
              Pharmacoepidemiology Platform
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Quick Role Switcher Button */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition text-xs font-medium text-slate-700 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
            <span>Switch Role:</span>
            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${roleColors[currentRole] || 'bg-slate-100 text-slate-700'}`}>
              {currentRole.toUpperCase()}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <p className="text-xs font-semibold text-slate-900">Switch Demo Role (1-Click)</p>
                <p className="text-[11px] text-slate-500">Test different RBAC views instantly</p>
              </div>
              <div className="space-y-1">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.role}
                    onClick={() => {
                      switchRole(acc.role);
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition flex flex-col ${
                      role === acc.role
                        ? 'bg-cyan-50 border border-cyan-200 text-cyan-900 font-semibold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-900">{acc.label}</span>
                      {role === acc.role && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600" />}
                    </div>
                    <span className="text-[11px] text-slate-500">{acc.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Live Alerts Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowAlertMenu(!showAlertMenu)}
            className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition"
          >
            <Bell className="w-5 h-5" />
            {liveAlerts.length > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse"></span>
            )}
          </button>

          {showAlertMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50">
              <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900">Live Surveillance Feed</span>
                <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">
                  {liveAlerts.length} events
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                {liveAlerts.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-slate-400">
                    No new adverse alerts received on websocket.
                  </div>
                ) : (
                  liveAlerts.map((a) => (
                    <div key={a.id} className="p-2.5 hover:bg-slate-50 transition text-xs">
                      <div className="flex items-center justify-between font-semibold text-slate-800">
                        <span>{a.title}</span>
                        <span className="text-[10px] text-slate-400 font-normal">{a.time}</span>
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5">{a.desc}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Logout */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-slate-900 leading-none">{user?.full_name}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            title="Log Out"
            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
