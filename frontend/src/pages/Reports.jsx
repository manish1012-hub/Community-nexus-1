import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  FileText, 
  Download, 
  FileSpreadsheet, 
  Printer, 
  Filter, 
  Calendar, 
  ShieldAlert, 
  Pill, 
  CheckCircle2,
  Clock,
  ExternalLink
} from 'lucide-react';

export const Reports = () => {
  const { role } = useAuth();
  const [reportsData, setReportsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReportType, setSelectedReportType] = useState('adr_summary');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchReportPreview();
  }, [selectedReportType]);

  const fetchReportPreview = async () => {
    try {
      setLoading(true);
      if (selectedReportType === 'adr_summary') {
        const res = await api.get('/adr/');
        setReportsData(res.data);
      } else {
        const res = await api.get('/medications/');
        setReportsData(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    const token = localStorage.getItem('pharmacare_token');
    const endpoint = selectedReportType === 'adr_summary' ? '/reports/adr/csv' : '/reports/medications/csv';
    window.open(`/api/v1${endpoint}`, '_blank');
  };

  const handleDownloadPDF = () => {
    window.open(`/api/v1/reports/adr/pdf`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Clinical Reports & Export Center
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200">
              CSV & PDF Generation
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Produce certified pharmacovigilance reports, formulary manifests, and adverse event summaries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-sm transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-navy-800 hover:bg-navy-700 text-white font-semibold text-xs rounded-xl shadow-sm transition"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Generate PDF Report</span>
          </button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => setSelectedReportType('adr_summary')}
          className={`p-4 rounded-2xl border text-left transition flex items-start gap-3 ${
            selectedReportType === 'adr_summary'
              ? 'bg-cyan-50/60 border-cyan-500/80 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-xs">Adverse Drug Reactions Summary Report</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Comprehensive registry of reported reactions, severity tiers, patient MRNs, and WHO-UMC causality assessments.
            </p>
          </div>
        </button>

        <button
          onClick={() => setSelectedReportType('medications_manifest')}
          className={`p-4 rounded-2xl border text-left transition flex items-start gap-3 ${
            selectedReportType === 'medications_manifest'
              ? 'bg-cyan-50/60 border-cyan-500/80 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="w-9 h-9 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center flex-shrink-0">
            <Pill className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-xs">Formulary Catalog & Indications Manifest</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Approved chronic medication listings, therapeutic classes, standard dosages, and contraindications.
            </p>
          </div>
        </button>
      </div>

      {/* Preview Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Report Data Preview ({reportsData.length} Records)
            </h2>
            <p className="text-xs text-slate-500">Live preview of dataset exported via CSV and formatted PDF</p>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 border px-2.5 py-1 rounded-lg"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print View</span>
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading preview data...</div>
        ) : selectedReportType === 'adr_summary' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b text-slate-500 text-[10px] uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Report ID</th>
                  <th className="py-2.5 px-3">Patient MRN</th>
                  <th className="py-2.5 px-3">Medication</th>
                  <th className="py-2.5 px-3">Reaction</th>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportsData.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-medium">{r.report_number}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{r.patient_mrn}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">{r.suspected_medication_name}</td>
                    <td className="py-2.5 px-3 text-slate-600">{r.reaction_category}</td>
                    <td className="py-2.5 px-3 uppercase text-[10px] font-bold">{r.severity}</td>
                    <td className="py-2.5 px-3 capitalize">{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b text-slate-500 text-[10px] uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3">Generic Name</th>
                  <th className="py-2.5 px-3">Brand Name</th>
                  <th className="py-2.5 px-3">Therapeutic Class</th>
                  <th className="py-2.5 px-3">Dosage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportsData.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono text-slate-600">{m.code}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{m.generic_name}</td>
                    <td className="py-2.5 px-3 text-slate-700">{m.brand_name}</td>
                    <td className="py-2.5 px-3 text-slate-600">{m.therapeutic_class}</td>
                    <td className="py-2.5 px-3 text-slate-600">{m.standard_dosage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
