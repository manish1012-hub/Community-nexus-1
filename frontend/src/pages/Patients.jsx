import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  ChevronRight, 
  Pill, 
  ShieldAlert, 
  HeartPulse, 
  Activity,
  AlertCircle,
  X
} from 'lucide-react';

export const Patients = () => {
  const { role, user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New patient form state
  const [newPatient, setNewPatient] = useState({
    mrn: '',
    full_name: '',
    date_of_birth: '1970-01-01',
    gender: 'Female',
    contact_phone: '',
    email: '',
    primary_condition: 'Hypertension',
    comorbidities: 'None',
    allergies: 'None known',
    medical_history: 'Primary care intake.',
    blood_group: 'O+'
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchPatients();
  }, [searchTerm, selectedCondition]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (selectedCondition) params.condition = selectedCondition;
      const res = await api.get('/patients/', { params });
      setPatients(res.data);
    } catch (err) {
      console.error('Failed to load patients:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      // Auto generate MRN if empty
      const payload = { ...newPatient };
      if (!payload.mrn) {
        payload.mrn = `PAT-2024-${Math.floor(1000 + Math.random() * 9000)}`;
      }
      await api.post('/patients/', payload);
      setShowAddModal(false);
      fetchPatients();
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to create patient record.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Patient Registry
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {patients.length} Enrolled
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Electronic Health Records (EHRs) integrated with IoT medication telemetry & adverse event tracking.
          </p>
        </div>

        {['admin', 'doctor'].includes(role) && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white text-xs font-semibold rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Enroll New Patient</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Patient Name or MRN (e.g. PAT-2024-0001)..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedCondition}
            onChange={(e) => setSelectedCondition(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="">All Chronic Conditions</option>
            <option value="Hypertension">Hypertension</option>
            <option value="Type 2 Diabetes">Type 2 Diabetes</option>
            <option value="Hypertension & Type 2 Diabetes">Hypertension & Type 2 Diabetes</option>
            <option value="Congestive Heart Failure & Hypertension">Heart Failure & Hypertension</option>
          </select>
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">
            <div className="w-7 h-7 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading cohort records...
          </div>
        ) : patients.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No patient records match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Patient MRN & Name</th>
                  <th className="py-3 px-4">Demographics</th>
                  <th className="py-3 px-4">Primary Condition</th>
                  <th className="py-3 px-4">Active Meds</th>
                  <th className="py-3 px-4">Reported ADRs</th>
                  <th className="py-3 px-4">Assigned Doctor</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition group">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 group-hover:text-cyan-600 transition">
                        {p.full_name}
                      </div>
                      <span className="font-mono text-[11px] text-slate-400">{p.mrn}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <span>{p.gender}, Born {p.date_of_birth}</span>
                      <div className="text-[10px] text-slate-400">Blood: {p.blood_group || 'N/A'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-800 border border-blue-200/60">
                        <HeartPulse className="w-3 h-3 text-blue-600" />
                        {p.primary_condition}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-800 font-semibold text-[11px]">
                        <Pill className="w-3 h-3 text-cyan-600" />
                        {p.active_medications_count} Active
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {p.adverse_reports_count > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-semibold text-[11px]">
                          <ShieldAlert className="w-3 h-3 text-amber-600" />
                          {p.adverse_reports_count} Reported
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">None</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                      {p.assigned_doctor_name || 'Unassigned'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => navigate(`/patients/${p.id}`)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:text-cyan-600 hover:border-cyan-300 hover:bg-cyan-50/50 transition font-medium"
                      >
                        <span>Profile & Timeline</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Patient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-600" />
                <span>Enroll New Patient Record</span>
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 bg-red-50 border border-red-200 p-2.5 rounded-xl flex items-center gap-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreatePatient} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={newPatient.full_name}
                  onChange={(e) => setNewPatient({ ...newPatient, full_name: e.target.value })}
                  placeholder="e.g. Samuel Robinson"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={newPatient.date_of_birth}
                    onChange={(e) => setNewPatient({ ...newPatient, date_of_birth: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={newPatient.gender}
                    onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Primary Chronic Condition</label>
                  <select
                    value={newPatient.primary_condition}
                    onChange={(e) => setNewPatient({ ...newPatient, primary_condition: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  >
                    <option value="Hypertension">Hypertension</option>
                    <option value="Type 2 Diabetes">Type 2 Diabetes</option>
                    <option value="Hypertension & Type 2 Diabetes">Hypertension & Type 2 Diabetes</option>
                    <option value="Congestive Heart Failure">Congestive Heart Failure</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Blood Group</label>
                  <input
                    type="text"
                    value={newPatient.blood_group}
                    onChange={(e) => setNewPatient({ ...newPatient, blood_group: e.target.value })}
                    placeholder="e.g. O+, A+, B+"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Documented Allergies</label>
                <input
                  type="text"
                  value={newPatient.allergies}
                  onChange={(e) => setNewPatient({ ...newPatient, allergies: e.target.value })}
                  placeholder="e.g. Penicillin, Sulfa, None known"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl transition shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Enrolling...' : 'Save Patient Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
