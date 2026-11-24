import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  BrainCircuit, 
  Sparkles, 
  AlertTriangle, 
  TrendingUp, 
  Activity, 
  ShieldCheck, 
  BarChart3, 
  Download,
  Info,
  CheckCircle2,
  FileCode2
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';

export const MLAnalytics = () => {
  const { role } = useAuth();
  const [modelResult, setModelResult] = useState(null);
  const [evaluating, setEvaluating] = useState(false);
  const [signals, setSignals] = useState([]);
  const [cohortMetrics, setCohortMetrics] = useState(null);
  const [loadingSignals, setLoadingSignals] = useState(true);

  // Risk prediction form
  const [predForm, setPredForm] = useState({
    age: 71,
    gender: 'Male',
    primary_condition: 'Hypertension & T2D',
    medication_count: 6,
    medication_class: 'ACE Inhibitor',
    has_diabetes: true,
    has_renal_impairment: true
  });

  useEffect(() => {
    fetchSignalsAndMetrics();
    // Run initial prediction on default values
    runRiskPrediction();
  }, []);

  const fetchSignalsAndMetrics = async () => {
    try {
      setLoadingSignals(true);
      const [sigRes, metRes] = await Promise.all([
        api.get('/ml/signals'),
        api.get('/ml/cohort-metrics')
      ]);
      setSignals(sigRes.data);
      setCohortMetrics(metRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSignals(false);
    }
  };

  const runRiskPrediction = async (e) => {
    if (e) e.preventDefault();
    try {
      setEvaluating(true);
      const res = await api.post('/ml/predict-risk', predForm);
      setModelResult(res.data);
    } catch (err) {
      console.error('Prediction failed:', err);
    } finally {
      setEvaluating(false);
    }
  };

  const handleExportAnonymized = async () => {
    try {
      const res = await api.get('/ml/anonymized-dataset');
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'pharmacare_deidentified_research_cohort.json';
      a.click();
    } catch (err) {
      alert('Export failed: ' + (err.response?.data?.detail || err.message));
    }
  };

  const featureChartData = (modelResult && modelResult.feature_importance)
    ? Object.entries(modelResult.feature_importance).map(([key, val]) => ({
        feature: (key || '').replace(/_/g, ' '),
        weight: val
      }))
    : [];

  const COLORS = ['#0891b2', '#0d9488', '#3b82f6', '#8b5cf6', '#f59e0b'];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            AI/ML Pharmacovigilance & Safety Analytics
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200">
              Scikit-Learn Model
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Explainable Random Forest model evaluating severe adverse event risks alongside WHO-UMC PRR/ROR statistical signals.
          </p>
        </div>

        {['admin', 'researcher'].includes(role) && (
          <button
            onClick={handleExportAnonymized}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-sm transition"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Export Anonymized Research Cohort</span>
          </button>
        )}
      </div>

      {/* Interactive Predictor & Explainability Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Parameter input */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-cyan-600" />
                <span>Patient Risk Parameter Predictor</span>
              </h2>
              <span className="text-[10px] font-mono text-slate-400">RandomForest v1.4.2</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Enter demographic and clinical polypharmacy factors to evaluate statistical probability of severe drug reactions.
            </p>

            <form onSubmit={runRiskPrediction} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Patient Age: {predForm.age} yrs</label>
                  <input
                    type="range"
                    min="25"
                    max="95"
                    value={predForm.age}
                    onChange={(e) => setPredForm({ ...predForm, age: parseInt(e.target.value) })}
                    className="w-full accent-cyan-600 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Biological Gender</label>
                  <select
                    value={predForm.gender}
                    onChange={(e) => setPredForm({ ...predForm, gender: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Active Medications Count (Polypharmacy): <strong>{predForm.medication_count} drugs</strong>
                </label>
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={predForm.medication_count}
                  onChange={(e) => setPredForm({ ...predForm, medication_count: parseInt(e.target.value) })}
                  className="w-full accent-cyan-600 cursor-pointer"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Primary Chronic Condition</label>
                <select
                  value={predForm.primary_condition}
                  onChange={(e) => setPredForm({ ...predForm, primary_condition: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="Hypertension">Essential Hypertension</option>
                  <option value="Type 2 Diabetes">Type 2 Diabetes</option>
                  <option value="Hypertension & T2D">Hypertension & Type 2 Diabetes</option>
                  <option value="Cardiovascular Disease">Cardiovascular Disease</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Medication Class</label>
                <select
                  value={predForm.medication_class}
                  onChange={(e) => setPredForm({ ...predForm, medication_class: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="ACE Inhibitor">ACE Inhibitor (e.g. Lisinopril)</option>
                  <option value="ARB">Angiotensin Receptor Blocker (Losartan)</option>
                  <option value="Calcium Channel Blocker">Calcium Channel Blocker (Amlodipine)</option>
                  <option value="Biguanide (Metformin)">Biguanide (Metformin)</option>
                  <option value="Statin">HMG-CoA Reductase Inhibitor (Atorvastatin)</option>
                  <option value="Diuretic">Diuretic (Spironolactone / HCTZ)</option>
                  <option value="SGLT2 Inhibitor">SGLT2 Inhibitor (Empagliflozin)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={predForm.has_diabetes}
                    onChange={(e) => setPredForm({ ...predForm, has_diabetes: e.target.checked })}
                    className="rounded text-cyan-600 focus:ring-cyan-500 w-4 h-4"
                  />
                  <span>Comorbid Diabetes</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={predForm.has_renal_impairment}
                    onChange={(e) => setPredForm({ ...predForm, has_renal_impairment: e.target.checked })}
                    className="rounded text-cyan-600 focus:ring-cyan-500 w-4 h-4"
                  />
                  <span>Renal Impairment (CKD)</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={evaluating}
                className="w-full mt-3 py-2 px-4 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50"
              >
                {evaluating ? 'Evaluating Model Inference...' : 'Calculate Severe ADR Risk'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Card: Result, Explainability & Attribution Bar */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Explainable Model Inference Output</h2>
                <p className="text-xs text-slate-500">Supervised classification based on chronic patient feature vectors</p>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                Validation ROC-AUC: 0.884
              </span>
            </div>

            {modelResult && (
              <div className="space-y-4">
                {/* Score Banner */}
                <div className={`p-4 rounded-xl border flex items-center justify-between ${
                  modelResult.risk_level === 'Critical' || modelResult.risk_level === 'High'
                    ? 'bg-red-50 border-red-200 text-red-900'
                    : modelResult.risk_level === 'Moderate'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}>
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider">Estimated Severe Reaction Probability</span>
                    <div className="text-2xl font-black mt-0.5">
                      {(modelResult.risk_score * 100).toFixed(1)}%
                      <span className="text-xs font-bold uppercase ml-2 px-2 py-0.5 rounded bg-white/80 border">
                        {modelResult.risk_level} Risk Tier
                      </span>
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <span className="text-[11px] text-slate-500 block">Model Confidence</span>
                    <strong className="text-sm">{(modelResult.confidence * 100).toFixed(0)}%</strong>
                  </div>
                </div>

                {/* Explainable Feature Importance Chart */}
                <div>
                  <h3 className="text-xs font-bold text-slate-800 mb-2">
                    Key Risk Attribution Factors (Gini Feature Importance)
                  </h3>
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={featureChartData} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" unit="%" tick={{ fontSize: 11, fill: '#64748b' }} />
                        <YAxis dataKey="feature" type="category" width={110} tick={{ fontSize: 11, fill: '#334155' }} />
                        <Tooltip 
                          formatter={(value) => [`${value}% impact`, 'Weight']}
                          contentStyle={{ backgroundColor: '#0f172a', borderRadius: '10px', color: '#fff', fontSize: '11px' }} 
                        />
                        <Bar dataKey="weight" fill="#0891b2" radius={[0, 6, 6, 0]}>
                          {featureChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Healthcare Warning Note */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
                  <Info className="w-4 h-4 text-cyan-600 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Statistical Association vs. Clinical Causality:</strong> {modelResult.clinical_disclaimer}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Disproportionality Safety Signals Table (PRR / ROR) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-600" />
              <span>Statistical Pharmacovigilance Disproportionality Signals</span>
            </h2>
            <p className="text-xs text-slate-500">
              Proportional Reporting Ratio (PRR) and Reporting Odds Ratio (ROR) with Yates' Chi-Square test (WHO-UMC & FDA FAERS standard).
            </p>
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-3">
            <span className="flex items-center gap-1 font-semibold text-red-600">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
              Signal Flagged (PRR ≥ 2.0 & χ² ≥ 3.84)
            </span>
          </div>
        </div>

        {(Array.isArray(signals) ? signals : []).length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Insufficient report volume for disproportionality calculations. At least 4 diverse reports required.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Suspected Medication</th>
                  <th className="py-3 px-4">Adverse Reaction Category</th>
                  <th className="py-3 px-4">Observed Reports</th>
                  <th className="py-3 px-4">PRR (Ratio)</th>
                  <th className="py-3 px-4">ROR (Odds Ratio)</th>
                  <th className="py-3 px-4">Chi-Square (χ²)</th>
                  <th className="py-3 px-4 text-right">Surveillance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(Array.isArray(signals) ? signals : []).map((sig, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{sig.medication_name}</td>
                    <td className="py-3.5 px-4 text-slate-700">{sig.reaction_category}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{sig.report_count} cases</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-700">{sig.prr.toFixed(2)}x</td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">{sig.ror.toFixed(2)}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{sig.chi_square.toFixed(2)}</td>
                    <td className="py-3.5 px-4 text-right">
                      {sig.signal_detected ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 font-bold text-[10px] uppercase border border-red-200">
                          <AlertTriangle className="w-3 h-3 text-red-600" />
                          Safety Signal
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium text-[10px]">
                          Below Threshold
                        </span>
                      )}
                    </td>
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
