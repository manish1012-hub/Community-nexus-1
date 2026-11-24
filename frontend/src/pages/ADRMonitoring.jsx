import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  FileText, 
  ChevronRight,
  UserCheck,
  Send,
  X
} from 'lucide-react';

export const ADRMonitoring = () => {
  const { role, user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Submit ADR Modal
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [patients, setPatients] = useState([]);
  const [medications, setMedications] = useState([]);
  const [submitForm, setSubmitForm] = useState({
    patient_id: '',
    suspected_medication_id: '',
    reaction_category: 'Cardiovascular',
    reaction_description: '',
    severity: 'moderate',
    onset_date: new Date().toISOString().slice(0, 10),
    outcome: 'ongoing'
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');

  // Safety Review Modal
  const [reviewReport, setReviewReport] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    causality_assessment: 'probable',
    action_taken: 'dose_adjusted',
    review_notes: ''
  });
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    fetchADRs();
    loadFormDependencies();
  }, [severityFilter, statusFilter, searchTerm]);

  const loadFormDependencies = async () => {
    try {
      const [pRes, mRes] = await Promise.all([
        api.get('/patients/'),
        api.get('/medications/')
      ]);
      setPatients(pRes.data);
      setMedications(mRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchADRs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (severityFilter) params.severity = severityFilter;
      if (statusFilter) params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;
      const res = await api.get('/adr/', { params });
      setReports(res.data);
    } catch (err) {
      console.error('Failed to load ADR reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitADR = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitMsg('');
    try {
      await api.post('/adr/', submitForm);
      setSubmitMsg('Adverse reaction reported. Live WebSocket broadcast sent to surveillance nodes.');
      setTimeout(() => {
        setShowSubmitModal(false);
        setSubmitMsg('');
        fetchADRs();
      }, 1500);
    } catch (err) {
      setSubmitMsg(err.response?.data?.detail || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteReview = async (e) => {
    e.preventDefault();
    if (!reviewReport) return;
    setReviewing(true);
    try {
      await api.post(`/adr/${reviewReport.id}/review`, {
        report_id: reviewReport.id,
        ...reviewForm
      });
      setReviewReport(null);
      fetchADRs();
    } catch (err) {
      alert('Review failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setReviewing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Adverse Drug Reaction (ADR) Surveillance
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
              WHO-UMC Workflow
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time pharmacovigilance incident reporting, severity classification, and clinician safety reviews.
          </p>
        </div>

        <button
          onClick={() => setShowSubmitModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white text-xs font-semibold rounded-xl shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Submit ADR Report</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search report ID, medication, or MRN..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="">All Review Statuses</option>
            <option value="pending">Pending Clinical Review</option>
            <option value="under_review">Under Review</option>
            <option value="reviewed">Reviewed & Closed</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="">All Severities</option>
            <option value="mild">Mild</option>
            <option value="moderate">Moderate</option>
            <option value="severe">Severe</option>
            <option value="life_threatening">Life Threatening</option>
          </select>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">
            <div className="w-7 h-7 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading adverse event reports...
          </div>
        ) : reports.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No adverse event reports found matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Report Number</th>
                  <th className="py-3 px-4">Patient MRN</th>
                  <th className="py-3 px-4">Suspected Medication</th>
                  <th className="py-3 px-4">Reaction Category & Details</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Status & Causality</th>
                  <th className="py-3 px-4 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((r) => {
                  const hasReview = r.safety_reviews && r.safety_reviews.length > 0;
                  const latestReview = hasReview ? r.safety_reviews[r.safety_reviews.length - 1] : null;

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                        {r.report_number}
                        <div className="text-[10px] text-slate-400 font-normal">Onset: {r.onset_date}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{r.patient_name}</div>
                        <span className="font-mono text-[10px] text-slate-400">{r.patient_mrn}</span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        {r.suspected_medication_name}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <span className="font-semibold text-slate-800">{r.reaction_category}: </span>
                        <span className="text-slate-500 text-[11px]">{r.reaction_description}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[10px] uppercase ${
                          r.severity === 'severe' || r.severity === 'life_threatening'
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : r.severity === 'moderate'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {r.severity}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            r.status === 'reviewed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : r.status === 'under_review'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {r.status.replace('_', ' ')}
                          </span>
                        </div>
                        {latestReview && (
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Causality: <strong className="capitalize text-slate-700">{latestReview.causality_assessment}</strong>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {['admin', 'doctor', 'pharmacist'].includes(role) ? (
                          <button
                            onClick={() => {
                              setReviewReport(r);
                              setReviewForm({
                                causality_assessment: 'probable',
                                action_taken: 'dose_adjusted',
                                review_notes: ''
                              });
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:text-cyan-600 hover:border-cyan-300 hover:bg-cyan-50/50 transition font-medium"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>{r.status === 'reviewed' ? 'Re-assess' : 'Perform Review'}</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">View Only</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Submit ADR Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Submit Adverse Drug Reaction Report</span>
              </h2>
              <button onClick={() => setShowSubmitModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {submitMsg && (
              <div className="mb-4 p-2.5 rounded-xl bg-cyan-50 border border-cyan-200 text-xs text-cyan-800">
                {submitMsg}
              </div>
            )}

            <form onSubmit={handleSubmitADR} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Affected Patient</label>
                <select
                  required
                  value={submitForm.patient_id}
                  onChange={(e) => setSubmitForm({ ...submitForm, patient_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                >
                  <option value="">-- Select Patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} ({p.mrn}) - {p.primary_condition}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Suspected Medication</label>
                <select
                  required
                  value={submitForm.suspected_medication_id}
                  onChange={(e) => setSubmitForm({ ...submitForm, suspected_medication_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                >
                  <option value="">-- Select Medication --</option>
                  {medications.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.brand_name} ({m.generic_name}) - {m.therapeutic_class}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reaction Organ System</label>
                  <select
                    value={submitForm.reaction_category}
                    onChange={(e) => setSubmitForm({ ...submitForm, reaction_category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  >
                    <option value="Cardiovascular">Cardiovascular</option>
                    <option value="Respiratory">Respiratory (e.g. Cough)</option>
                    <option value="Gastrointestinal">Gastrointestinal</option>
                    <option value="Dermatological">Dermatological / Rash</option>
                    <option value="Musculoskeletal">Musculoskeletal / Myalgia</option>
                    <option value="Metabolic / Renal">Metabolic / Renal</option>
                    <option value="Neurological">Neurological / Dizziness</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Severity Tier</label>
                  <select
                    value={submitForm.severity}
                    onChange={(e) => setSubmitForm({ ...submitForm, severity: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  >
                    <option value="mild">Mild (Self-limiting)</option>
                    <option value="moderate">Moderate (Interferes with activity)</option>
                    <option value="severe">Severe (Requires clinical intervention)</option>
                    <option value="life_threatening">Life-Threatening</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Onset Date</label>
                <input
                  type="date"
                  required
                  value={submitForm.onset_date}
                  onChange={(e) => setSubmitForm({ ...submitForm, onset_date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Clinical Description & Patient Symptoms</label>
                <textarea
                  required
                  rows={3}
                  value={submitForm.reaction_description}
                  onChange={(e) => setSubmitForm({ ...submitForm, reaction_description: e.target.value })}
                  placeholder="Detail symptoms, timing after dose, duration, and relieving factors..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl transition shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Transmitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Perform Safety Review Modal */}
      {reviewReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-cyan-600" />
                <span>Clinical Pharmacovigilance Safety Review</span>
              </h2>
              <button onClick={() => setReviewReport(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl mb-4 text-xs">
              <div className="font-semibold text-slate-800">{reviewReport.report_number} • {reviewReport.suspected_medication_name}</div>
              <p className="text-slate-500 text-[11px] mt-0.5">{reviewReport.reaction_description}</p>
            </div>

            <form onSubmit={handleCompleteReview} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">WHO-UMC Causality Assessment</label>
                <select
                  value={reviewForm.causality_assessment}
                  onChange={(e) => setReviewForm({ ...reviewForm, causality_assessment: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                >
                  <option value="certain">Certain (Confirmed by rechallenge / clear mechanism)</option>
                  <option value="probable">Probable (Consistent timing & dechallenge response)</option>
                  <option value="possible">Possible (Timing reasonable, but confounders present)</option>
                  <option value="unlikely">Unlikely (Temporal relationship improbable)</option>
                  <option value="unclassifiable">Unclassifiable</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Clinical Action Taken</label>
                <select
                  value={reviewForm.action_taken}
                  onChange={(e) => setReviewForm({ ...reviewForm, action_taken: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                >
                  <option value="medication_swapped">Medication Swapped to Alternative Class</option>
                  <option value="dose_adjusted">Dose Adjusted / Titrated Down</option>
                  <option value="discontinued">Medication Discontinued</option>
                  <option value="monitoring_continued">Monitoring Continued with Supportive Care</option>
                  <option value="none">No Action Required</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Clinical Reviewer Notes & Rationalization</label>
                <textarea
                  required
                  rows={3}
                  value={reviewForm.review_notes}
                  onChange={(e) => setReviewForm({ ...reviewForm, review_notes: e.target.value })}
                  placeholder="Detail causality evidence, lab correlations, and follow-up plan..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReviewReport(null)}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewing}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl transition shadow-sm disabled:opacity-50"
                >
                  {reviewing ? 'Submitting Review...' : 'Finalize Safety Assessment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
