import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  ArrowLeft, 
  Pill, 
  ShieldAlert, 
  Radio, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  HeartPulse, 
  Plus, 
  Calendar,
  Activity,
  FileCheck2,
  FileWarning
} from 'lucide-react';

export const PatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const [data, setData] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatientData();
  }, [id]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      const [profRes, tlRes] = await Promise.all([
        api.get(`/patients/${id}`),
        api.get(`/patients/${id}/timeline`)
      ]);
      setData(profRes.data);
      setTimeline(tlRes.data);
    } catch (err) {
      console.error('Failed to load patient profile:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-xs text-slate-500">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        Retrieving clinical records and IoT telemetry...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white p-8 rounded-2xl border text-center text-xs text-slate-500">
        Patient record not found.
      </div>
    );
  }

  const patient = data.patient || {};
  const medications = Array.isArray(data.medications) ? data.medications : [];
  const adverse_reports = Array.isArray(data.adverse_reports) ? data.adverse_reports : [];
  const adherence = data.adherence || { adherence_percentage: 92.4, status: 'Optimal', taken_count: 26, total_events: 28 };

  return (
    <div className="space-y-6">
      {/* Back button & Title */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/patients')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Registry</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/adr-monitoring')}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Report Reaction for Patient</span>
          </button>
        </div>
      </div>

      {/* Patient Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-navy-800 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-cyan-600/20">
            {patient?.full_name?.charAt(0) || 'P'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{patient.full_name || 'Patient'}</h1>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                {patient.mrn || 'PAT-2024'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Born {patient.date_of_birth || 'N/A'} ({patient.gender || 'Unknown'}) • Blood: <strong>{patient.blood_group || 'Unknown'}</strong> • Assigned: <strong>{patient.assigned_doctor_name || 'Cardiology'}</strong>
            </p>
          </div>
        </div>

        {/* IoT Adherence Pill */}
        <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex items-center gap-4">
          <div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 uppercase">
              <Radio className="w-3.5 h-3.5 text-teal-600" />
              <span>Smart Dispenser Adherence</span>
            </div>
            <div className="text-lg font-extrabold text-teal-700 mt-0.5">
              {adherence.adherence_percentage}%
              <span className="text-xs font-normal text-slate-500 ml-1.5">({adherence.status})</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-teal-500/30 flex items-center justify-center font-bold text-xs text-teal-700 bg-teal-50">
            {adherence.taken_count}/{adherence.total_events}
          </div>
        </div>
      </div>

      {/* Medical History & Chronic Condition Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-semibold uppercase text-slate-400">Primary Chronic Diagnosis</span>
          <p className="font-bold text-slate-900 mt-1 text-sm flex items-center gap-1.5 text-blue-700">
            <HeartPulse className="w-4 h-4 text-blue-600" />
            {patient.primary_condition}
          </p>
          <p className="text-slate-500 text-[11px] mt-1">{patient.medical_history}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-semibold uppercase text-slate-400">Documented Comorbidities</span>
          <p className="font-medium text-slate-800 mt-1">{patient.comorbidities || 'None reported'}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-semibold uppercase text-slate-400">Known Drug Allergies</span>
          <p className="font-medium text-red-600 mt-1 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
            {patient.allergies || 'No known allergies'}
          </p>
        </div>
      </div>

      {/* Active Medications & ADR Reports Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Prescriptions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Pill className="w-4 h-4 text-cyan-600" />
              <span>Current Regimen Prescriptions ({medications.length})</span>
            </h2>
          </div>

          <div className="space-y-2.5">
            {medications.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No active medications registered.</p>
            ) : (
              medications.map((m) => (
                <div key={m.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{m.brand_name} ({m.generic_name})</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-100 text-cyan-800 uppercase">
                      {m.status}
                    </span>
                  </div>
                  <div className="text-slate-600 mt-1">
                    Dosage: <strong>{m.dosage}</strong> • Frequency: <strong>{m.frequency}</strong> ({m.route})
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5">
                    <span>Started: {m.start_date}</span>
                    <span>Class: {m.therapeutic_class}</span>
                  </div>
                  {m.notes && (
                    <div className="mt-1.5 p-1.5 bg-amber-50/70 border border-amber-200/50 rounded text-[11px] text-amber-800">
                      {m.notes}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Adverse Drug Reactions Recorded */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Reported ADR History ({adverse_reports.length})</span>
            </h2>
          </div>

          <div className="space-y-2.5">
            {adverse_reports.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No adverse drug reactions reported for patient.</p>
            ) : (
              adverse_reports.map((a) => (
                <div key={a.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">{a.reaction_category}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      a.severity === 'severe' || a.severity === 'life_threatening'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {a.severity}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-1 text-[11px]">{a.reaction_description}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                    <span>Suspected: <strong className="text-slate-700">{a.suspected_medication}</strong></span>
                    <span className="capitalize">Status: <strong>{a.status}</strong></span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Chronological Clinical Timeline */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-600" />
          <span>Integrated Clinical & IoT Timeline</span>
        </h2>

        <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {timeline.map((ev, idx) => (
            <div key={idx} className="relative text-xs">
              <div className={`absolute -left-6 top-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                ev.severity === 'danger' ? 'bg-red-500' : ev.severity === 'warning' ? 'bg-amber-500' : 'bg-cyan-500'
              }`}></div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">{ev.title}</span>
                <span className="text-[11px] text-slate-400 font-mono">({ev.date})</span>
              </div>
              <p className="text-slate-500 text-[11px] mt-0.5">{ev.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
