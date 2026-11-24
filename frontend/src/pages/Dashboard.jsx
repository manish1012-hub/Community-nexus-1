import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  Pill, 
  ShieldAlert, 
  Clock, 
  Radio, 
  TrendingUp, 
  AlertTriangle,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  Calendar,
  Activity,
  PlusCircle,
  FileSearch,
  Sparkles
} from 'lucide-react';
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

export const Dashboard = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('6M');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports/summary');
      setSummary(res.data);
    } catch (err) {
      console.error('Failed to load dashboard summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#0891b2', '#0d9488', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-slate-500 font-medium">Aggregating pharmacovigilance signals & telemetry...</p>
        </div>
      </div>
    );
  }

  const kpi = summary?.kpi || {
    total_patients: 6,
    active_prescriptions: 14,
    total_adrs: 7,
    pending_reviews: 2,
    average_adherence_rate: 92.4
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Clinical Surveillance Dashboard
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200">
              Real-Time
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pharmacoepidemiology surveillance for hypertension, diabetes, and cardiovascular chronic care.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-sm text-xs">
            {['1M', '3M', '6M', '1Y'].map((d) => (
              <button
                key={d}
                onClick={() => setDateFilter(d)}
                className={`px-3 py-1 rounded-md font-medium transition ${
                  dateFilter === d
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          <button
            onClick={() => navigate('/adr-monitoring')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report ADR</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Registered Patients */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Registered Patients</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{kpi.total_patients}</span>
            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +100% active
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Chronic illness cohort</p>
        </div>

        {/* Card 2: Active Prescriptions */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Regimens</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <Pill className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{kpi.active_prescriptions}</span>
            <span className="text-[11px] text-cyan-700 font-medium">Formulary Monitored</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Polypharmacy tracking</p>
        </div>

        {/* Card 3: Reported ADRs */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Reported ADRs</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{kpi.total_adrs}</span>
            <span className="text-[11px] text-amber-600 font-medium">Signals Analyzed</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">WHO-UMC Criteria</p>
        </div>

        {/* Card 4: Pending Safety Reviews */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Reviews</span>
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-red-600">{kpi.pending_reviews}</span>
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-semibold">Action Required</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Clinician evaluation</p>
        </div>

        {/* Card 5: IoT Adherence Rate */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">IoT Adherence</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-teal-600">{kpi.average_adherence_rate}%</span>
            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-0.5">
              Optimal
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">MedSmart-4G Telemetry</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: ADR Trends Over Time */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Adverse Drug Reaction Incidence Trend</h2>
              <p className="text-xs text-slate-500">Monthly surveillance volume, severe reactions, and clinical resolutions</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-cyan-600"></span> Total Reports</span>
              <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-500"></span> Severe Events</span>
              <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-teal-500"></span> Reviewed</span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={summary?.monthly_trend || []}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0891b2" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#0891b2" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSevere" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="total_reports" stroke="#0891b2" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTotal)" name="Total Reports" />
                <Area type="monotone" dataKey="severe" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorSevere)" name="Severe ADRs" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Medication Distribution by Class */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900">Formulary Regimens by Drug Class</h2>
            <p className="text-xs text-slate-500">Hypertension & T2D therapeutic volume</p>
          </div>

          <div className="h-64 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary?.class_distribution || []} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis dataKey="class_name" type="category" width={110} tick={{ fontSize: 11, fill: '#334155' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '10px', color: '#fff', fontSize: '11px' }} />
                <Bar dataKey="count" fill="#0891b2" radius={[0, 6, 6, 0]}>
                  {(summary?.class_distribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Section: Quick Actions & Live Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Workflows */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-600" />
            <span>Clinical Action Center</span>
          </h2>
          <div className="space-y-2.5">
            <button
              onClick={() => navigate('/adr-monitoring')}
              className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-cyan-500/50 hover:bg-cyan-50/40 transition flex items-center justify-between group"
            >
              <div>
                <p className="text-xs font-semibold text-slate-800 group-hover:text-cyan-900">Submit Adverse Drug Reaction</p>
                <p className="text-[11px] text-slate-500">Record suspected medication side effects & severity</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-600 transition" />
            </button>

            <button
              onClick={() => navigate('/medications')}
              className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-cyan-500/50 hover:bg-cyan-50/40 transition flex items-center justify-between group"
            >
              <div>
                <p className="text-xs font-semibold text-slate-800 group-hover:text-cyan-900">Verify Drug-Drug Interactions</p>
                <p className="text-[11px] text-slate-500">Check pairwise contraindications & hyperkalemia risks</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-600 transition" />
            </button>

            <button
              onClick={() => navigate('/ml-analytics')}
              className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-cyan-500/50 hover:bg-cyan-50/40 transition flex items-center justify-between group"
            >
              <div>
                <p className="text-xs font-semibold text-slate-800 group-hover:text-cyan-900">AI Risk Scoring & PRR Signals</p>
                <p className="text-[11px] text-slate-500">Explainable Random Forest & disproportionality metrics</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-600 transition" />
            </button>

            <button
              onClick={() => navigate('/iot-simulator')}
              className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-teal-500/50 hover:bg-teal-50/40 transition flex items-center justify-between group"
            >
              <div>
                <p className="text-xs font-semibold text-slate-800 group-hover:text-teal-900">IoT Smart Dispenser Simulation</p>
                <p className="text-[11px] text-slate-500">Simulate dispensing events & adherence telemetry</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition" />
            </button>
          </div>
        </div>

        {/* Live Surveillance Audit Feed */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Surveillance & Audit Trail</h2>
              <p className="text-xs text-slate-500">Immutable logging of clinical reviews and data ingestion</p>
            </div>
            <button
              onClick={() => navigate('/admin')}
              className="text-xs text-cyan-600 font-semibold hover:underline"
            >
              View Full Logs
            </button>
          </div>

          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {(summary?.activity_feed || []).map((act) => (
              <div key={act.id} className="py-2.5 flex items-start justify-between text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-cyan-500 mt-1.5 flex-shrink-0"></div>
                  <div>
                    <p className="font-semibold text-slate-800">
                      {act.action.replace(/_/g, ' ')}
                      <span className="ml-2 text-[10px] text-slate-500 font-normal">({act.entity})</span>
                    </p>
                    <p className="text-slate-500 text-[11px] mt-0.5">{act.details}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <span className="text-[11px] text-slate-400 font-mono">{act.timestamp}</span>
                  <p className="text-[10px] text-slate-500 truncate max-w-[120px]">{act.user_email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
