import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Pill, 
  ShieldAlert, 
  BrainCircuit, 
  Radio, 
  FileText, 
  Settings,
  HeartPulse,
  UserCheck
} from 'lucide-react';

export const Sidebar = () => {
  const { role, user } = useAuth();

  const navItems = [
    { 
      to: '/', 
      label: 'Main Dashboard', 
      icon: LayoutDashboard, 
      roles: ['admin', 'doctor', 'pharmacist', 'researcher', 'patient'] 
    },
    { 
      to: '/patients', 
      label: role === 'patient' ? 'My Medical Record' : 'Patient Management', 
      icon: Users, 
      roles: ['admin', 'doctor', 'pharmacist', 'researcher', 'patient'] 
    },
    { 
      to: '/medications', 
      label: 'Medications Formulary', 
      icon: Pill, 
      roles: ['admin', 'doctor', 'pharmacist', 'researcher', 'patient'] 
    },
    { 
      to: '/adr-monitoring', 
      label: 'ADR Monitoring & Safety', 
      icon: ShieldAlert, 
      roles: ['admin', 'doctor', 'pharmacist', 'researcher', 'patient'] 
    },
    { 
      to: '/ml-analytics', 
      label: 'AI/ML Safety Analytics', 
      icon: BrainCircuit, 
      roles: ['admin', 'doctor', 'pharmacist', 'researcher'] 
    },
    { 
      to: '/iot-simulator', 
      label: 'IoT Smart Dispenser', 
      icon: Radio, 
      roles: ['admin', 'doctor', 'pharmacist', 'researcher', 'patient'] 
    },
    { 
      to: '/reports', 
      label: 'Clinical Reports & Export', 
      icon: FileText, 
      roles: ['admin', 'doctor', 'pharmacist', 'researcher'] 
    },
    { 
      to: '/admin', 
      label: 'Admin & Audit Logs', 
      icon: Settings, 
      roles: ['admin'] 
    },
  ];

  const currentRole = role || 'doctor';
  const filteredNav = navItems.filter((item) => item.roles.includes(currentRole));

  return (
    <aside className="w-64 bg-navy-800 text-slate-300 flex flex-col border-r border-navy-700 min-h-screen flex-shrink-0">
      {/* Clinician badge */}
      <div className="p-4 border-b border-navy-700/80 bg-navy-900/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center font-bold text-sm">
            {user?.full_name?.charAt(0) || 'D'}
          </div>
          <div className="overflow-hidden">
            <h2 className="text-xs font-bold text-white truncate">{user?.full_name || 'Dr. Marcus Thorne'}</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
              <p className="text-[11px] text-slate-400 capitalize truncate">
                {currentRole} {user?.specialty ? `• ${user.specialty}` : '• Cardiology'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Clinical Modules
        </div>
        {filteredNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition duration-150 ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-600 to-cyan-700 text-white shadow-md shadow-cyan-600/30'
                    : 'text-slate-300 hover:bg-navy-700/60 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Primary Care Chronic Cohort Info Card */}
      <div className="p-4 border-t border-navy-700/80 m-3 bg-navy-900/70 rounded-xl border">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold mb-1">
          <HeartPulse className="w-3.5 h-3.5" />
          <span>Surveillance Cohort</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Hypertension & T2D Primary Care Cohort. Tracking polypharmacy adverse signals with Scikit-Learn.
        </p>
      </div>
    </aside>
  );
};
