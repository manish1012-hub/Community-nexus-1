import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Pill, 
  Search, 
  Filter, 
  AlertTriangle, 
  ShieldCheck, 
  Plus, 
  CheckSquare, 
  Square,
  Sparkles,
  Info,
  CheckCircle2,
  X
} from 'lucide-react';

export const Medications = () => {
  const { role, user } = useAuth();
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  // Drug Interaction Checker State
  const [selectedForInteraction, setSelectedForInteraction] = useState([]);
  const [interactions, setInteractions] = useState([]);
  const [checkingInteractions, setCheckingInteractions] = useState(false);

  // Prescribe Modal State
  const [showPrescribeModal, setShowPrescribeModal] = useState(false);
  const [patients, setPatients] = useState([]);
  const [prescribeForm, setPrescribeForm] = useState({
    patient_id: '',
    medication_id: '',
    dosage: '10 mg',
    frequency: 'Once Daily',
    route: 'Oral',
    start_date: new Date().toISOString().slice(0, 10),
    notes: ''
  });
  const [prescribeMsg, setPrescribeMsg] = useState('');

  useEffect(() => {
    fetchMedications();
    if (['admin', 'doctor', 'pharmacist'].includes(role)) {
      api.get('/patients/').then((res) => setPatients(res.data)).catch(() => {});
    }
  }, [searchTerm, selectedClass]);

  const fetchMedications = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (selectedClass) params.therapeutic_class = selectedClass;
      const res = await api.get('/medications/', { params });
      setMedications(res.data);
    } catch (err) {
      console.error('Failed to load medications:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectMed = (id) => {
    setSelectedForInteraction((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleCheckInteractions = async () => {
    if (selectedForInteraction.length < 2) return;
    try {
      setCheckingInteractions(true);
      const queryStr = selectedForInteraction.map((id) => `medication_ids=${id}`).join('&');
      const res = await api.get(`/medications/interactions/check?${queryStr}`);
      setInteractions(res.data);
    } catch (err) {
      console.error('Interaction check failed:', err);
    } finally {
      setCheckingInteractions(false);
    }
  };

  const handlePrescribe = async (e) => {
    e.preventDefault();
    setPrescribeMsg('');
    try {
      await api.post('/medications/prescribe', prescribeForm);
      setPrescribeMsg('Prescription registered successfully with clinical safety audit.');
      setTimeout(() => {
        setShowPrescribeModal(false);
        setPrescribeMsg('');
      }, 1500);
    } catch (err) {
      setPrescribeMsg(err.response?.data?.detail || 'Failed to prescribe.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Medications Formulary & Safety Checker
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200">
              RxNorm / NDC
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Clinical indications, contraindications, and pairwise drug-drug interaction surveillance.
          </p>
        </div>

        {['admin', 'doctor', 'pharmacist'].includes(role) && (
          <button
            onClick={() => setShowPrescribeModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white text-xs font-semibold rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Prescribe to Patient</span>
          </button>
        )}
      </div>

      {/* Drug Interaction Verification Tool */}
      <div className="bg-gradient-to-r from-slate-900 to-navy-800 text-white p-5 rounded-2xl border border-slate-700 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Multi-Drug Interaction Verification Engine</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select medications below and click evaluate to identify potential pharmacokinetic / pharmacodynamic conflicts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                // Quick preset: Lisinopril + Spironolactone
                const lis = medications.find(m => m.generic_name.includes('Lisinopril'))?.id;
                const spiro = medications.find(m => m.generic_name.includes('Spironolactone'))?.id;
                if (lis && spiro) {
                  setSelectedForInteraction([lis, spiro]);
                }
              }}
              className="text-[11px] text-cyan-300 hover:text-cyan-200 underline"
            >
              Load Demo Conflict (ACEI + Diuretic)
            </button>

            <button
              onClick={handleCheckInteractions}
              disabled={selectedForInteraction.length < 2 || checkingInteractions}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl transition shadow-md"
            >
              {checkingInteractions ? 'Evaluating...' : `Check ${selectedForInteraction.length} Selected Drugs`}
            </button>
          </div>
        </div>

        {/* Selected Drugs Chips */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-[11px] text-slate-400">Selected for analysis:</span>
          {selectedForInteraction.length === 0 ? (
            <span className="text-[11px] text-slate-500 italic">None selected. Check items in the table below.</span>
          ) : (
            selectedForInteraction.map((id) => {
              const med = medications.find((m) => m.id === id);
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 text-cyan-300 border border-slate-600 text-xs font-medium"
                >
                  <span>{med?.generic_name}</span>
                  <button onClick={() => toggleSelectMed(id)} className="text-slate-400 hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })
          )}
        </div>

        {/* Interaction Results Alert */}
        {interactions.length > 0 && (
          <div className="mt-4 space-y-2.5 border-t border-slate-700 pt-3">
            {interactions.map((inter) => (
              <div
                key={inter.id}
                className={`p-3 rounded-xl border text-xs ${
                  inter.severity_level === 'contraindicated' || inter.severity_level === 'major'
                    ? 'bg-red-950/70 border-red-700/80 text-red-200'
                    : 'bg-amber-950/70 border-amber-700/80 text-amber-200'
                }`}
              >
                <div className="flex items-center justify-between font-bold mb-1">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span>{inter.medication_a_name} + {inter.medication_b_name}</span>
                  </span>
                  <span className="uppercase text-[10px] px-2 py-0.5 rounded font-extrabold bg-red-900/80 border border-red-700 text-red-100">
                    {inter.severity_level} RISK
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed mb-1.5">
                  <strong className="text-white">Mechanism:</strong> {inter.interaction_mechanism}
                </p>
                <p className="text-[11px] text-cyan-200 leading-relaxed">
                  <strong className="text-cyan-300">Clinical Recommendation:</strong> {inter.clinical_recommendation}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Search and Table */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search generic/brand name or code..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="">All Therapeutic Classes</option>
            <option value="ACE Inhibitor">ACE Inhibitor</option>
            <option value="Angiotensin II Receptor Blocker (ARB)">ARB</option>
            <option value="Calcium Channel Blocker (Dihydropyridine)">Calcium Channel Blocker</option>
            <option value="Biguanide">Biguanide (Metformin)</option>
            <option value="SGLT2 Inhibitor">SGLT2 Inhibitor</option>
            <option value="HMG-CoA Reductase Inhibitor (Statin)">Statin</option>
            <option value="Aldosterone Antagonist / Potassium-Sparing Diuretic">Aldosterone Antagonist</option>
          </select>
        </div>
      </div>

      {/* Medications Catalog Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4 w-12 text-center">Compare</th>
                <th className="py-3 px-4">Medication Name</th>
                <th className="py-3 px-4">Therapeutic Class</th>
                <th className="py-3 px-4">Standard Dosage & Form</th>
                <th className="py-3 px-4">Key Safety Signals / Side Effects</th>
                <th className="py-3 px-4">Formulary Code</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {medications.map((m) => {
                const isSelected = selectedForInteraction.includes(m.id);
                return (
                  <tr key={m.id} className={`hover:bg-slate-50/60 transition ${isSelected ? 'bg-cyan-50/40' : ''}`}>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => toggleSelectMed(m.id)}
                        className="text-slate-400 hover:text-cyan-600 transition"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-cyan-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{m.brand_name}</div>
                      <div className="text-slate-500 text-[11px]">{m.generic_name}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md font-medium text-[11px] bg-slate-100 text-slate-700 border border-slate-200">
                        {m.therapeutic_class}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <div>{m.standard_dosage}</div>
                      <span className="text-[10px] text-slate-400">{m.dosage_form}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px] max-w-xs">
                      {m.common_side_effects}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                      {m.code}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Prescribe Modal */}
      {showPrescribeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Pill className="w-4 h-4 text-cyan-600" />
                <span>Prescribe Medication to Patient</span>
              </h2>
              <button onClick={() => setShowPrescribeModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {prescribeMsg && (
              <div className="mb-4 p-2.5 rounded-xl bg-cyan-50 border border-cyan-200 text-xs text-cyan-800">
                {prescribeMsg}
              </div>
            )}

            <form onSubmit={handlePrescribe} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Patient</label>
                <select
                  required
                  value={prescribeForm.patient_id}
                  onChange={(e) => setPrescribeForm({ ...prescribeForm, patient_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} ({p.mrn}) - {p.primary_condition}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Medication</label>
                <select
                  required
                  value={prescribeForm.medication_id}
                  onChange={(e) => setPrescribeForm({ ...prescribeForm, medication_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                >
                  <option value="">-- Choose Medication --</option>
                  {medications.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.brand_name} ({m.generic_name}) - {m.standard_dosage}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Dosage</label>
                  <input
                    type="text"
                    required
                    value={prescribeForm.dosage}
                    onChange={(e) => setPrescribeForm({ ...prescribeForm, dosage: e.target.value })}
                    placeholder="e.g. 20 mg"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Frequency</label>
                  <input
                    type="text"
                    required
                    value={prescribeForm.frequency}
                    onChange={(e) => setPrescribeForm({ ...prescribeForm, frequency: e.target.value })}
                    placeholder="e.g. Once Daily"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Clinical Instructions & Monitoring Notes</label>
                <textarea
                  rows={2}
                  value={prescribeForm.notes}
                  onChange={(e) => setPrescribeForm({ ...prescribeForm, notes: e.target.value })}
                  placeholder="Check serum potassium at 2 weeks..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPrescribeModal(false)}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl transition shadow-sm"
                >
                  Confirm Prescription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
