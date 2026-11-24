import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Settings, 
  Users, 
  ShieldCheck, 
  FileText, 
  Search, 
  Filter, 
  Server, 
  Database, 
  CheckCircle2, 
  XCircle,
  Activity,
  Lock
} from 'lucide-react';

export const AdminPanel = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [logSearch, setLogSearch] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, [userSearch, logSearch]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [uRes, logRes, statRes] = await Promise.all([
        api.get('/admin/users', { params: userSearch ? { search: userSearch } : {} }),
        api.get('/admin/audit-logs', { params: logSearch ? { search: logSearch } : {} }),
        api.get('/admin/system-stats')
      ]);
      setUsers(uRes.data);
      setAuditLogs(logRes.data);
      setStats(statRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/admin/users/${userId}`, { role: newRole });
      fetchAdminData();
    } catch (err) {
      alert('Failed to change role: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleToggleActive = async (userId, currentActive) => {
    try {
      await api.put(`/admin/users/${userId}`, { is_active: !currentActive });
      fetchAdminData();
    } catch (err) {
      alert('Failed to toggle status: ' + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            System Administration & Security Audit
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
              Admin Only
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage user permissions, review tamper-evident audit trails, and monitor system resources.
          </p>
        </div>
      </div>

      {/* System Health Status Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Database Engine</span>
            <div className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-cyan-600" />
              <span>{stats.database_engine}</span>
            </div>
            <p className="text-[11px] text-emerald-600 mt-1">Operational & Connected</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">ML Model Engine</span>
            <div className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-purple-600" />
              <span>Scikit-Learn Random Forest</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">AUC: 0.884 • 100 Trees</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Registered Accounts</span>
            <div className="text-xl font-bold text-slate-900 mt-1">
              {stats.users_count} Users
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Across 5 RBAC tiers</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Surveillance Logs</span>
            <div className="text-xl font-bold text-slate-900 mt-1">
              {stats.audit_logs_count} Entries
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Immutable audit stream</p>
          </div>
        </div>
      )}

      {/* User Accounts Management */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-600" />
              <span>User Accounts & RBAC Permissions</span>
            </h2>
            <p className="text-xs text-slate-500">Assign system roles, update clinical specialties, and activate/deactivate accounts</p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Filter user name or email..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b text-slate-500 text-[10px] uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role Tier</th>
                <th className="py-3 px-4">Specialty</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(Array.isArray(users) ? users : []).map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{u.full_name}</div>
                    <span className="text-[11px] text-slate-400">{u.email}</span>
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 capitalize"
                    >
                      <option value="admin">Admin</option>
                      <option value="doctor">Doctor</option>
                      <option value="pharmacist">Pharmacist</option>
                      <option value="researcher">Researcher</option>
                      <option value="patient">Patient</option>
                    </select>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{u.specialty || 'General'}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      u.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {u.is_active ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleToggleActive(u.id, u.is_active)}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition ${
                        u.is_active
                          ? 'border-red-200 text-red-600 hover:bg-red-50'
                          : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                      }`}
                    >
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-600" />
              <span>Immutable Audit Trail & System Events</span>
            </h2>
            <p className="text-xs text-slate-500">Every sensitive action, review decision, and login event is logged</p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
              placeholder="Search actions or IP address..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b text-slate-500 text-[10px] uppercase font-semibold sticky top-0">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Entity</th>
                <th className="py-2.5 px-3">User Email</th>
                <th className="py-2.5 px-3">IP Address</th>
                <th className="py-2.5 px-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(Array.isArray(auditLogs) ? auditLogs : []).map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">{log.action}</td>
                  <td className="py-2.5 px-3 text-slate-600">{log.entity_type}</td>
                  <td className="py-2.5 px-3 text-slate-600">{log.user_email || 'System'}</td>
                  <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400">{log.ip_address || '127.0.0.1'}</td>
                  <td className="py-2.5 px-3 text-slate-500 max-w-sm truncate text-[11px]">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
