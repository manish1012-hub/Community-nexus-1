import axios from 'axios';
import { 
  mockSummary, 
  mockPatients, 
  mockMedications, 
  mockADRs, 
  mockInteractions, 
  mockSignals, 
  mockDevices, 
  mockEvents 
} from './mockData';

const getBaseURL = () => {
  if (import.meta.env && import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined' && window.location.port === '5173') {
    return 'http://127.0.0.1:8000/api/v1';
  }
  return '/api/v1';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
});

export const getMockDataForUrl = (url = '', config = {}) => {
  // 1. Auth endpoints
  if (url.includes('/auth/login') || url.includes('/auth/register')) {
    const dummyUser = {
      id: 2,
      email: 'doctor@pharmacare.ai',
      full_name: 'Dr. Marcus Thorne, MD',
      role: 'doctor',
      specialty: 'Cardiology & Chronic Care'
    };
    return {
      access_token: 'demo-jwt-token-preview',
      refresh_token: 'demo-refresh-token-preview',
      token_type: 'bearer',
      user: dummyUser
    };
  }

  if (url.includes('/auth/me')) {
    try {
      const saved = localStorage.getItem('pharmacare_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      id: 2,
      email: 'doctor@pharmacare.ai',
      full_name: 'Dr. Marcus Thorne, MD',
      role: 'doctor',
      specialty: 'Cardiology & Chronic Care'
    };
  }

  // 2. Dashboard summary
  if (url.includes('/reports/summary')) {
    return mockSummary;
  }

  // 3. Patients
  if (url.includes('/patients') && url.includes('/timeline')) {
    return [
      {
        type: 'medication_started',
        date: '2023-01-15',
        title: 'Started Prinivil (Lisinopril)',
        description: 'Dosage: 20 mg, Frequency: Once Daily, Status: active',
        severity: 'info'
      },
      {
        type: 'adverse_reaction',
        date: '2023-02-15',
        title: 'Reported ADR: Respiratory (Moderate)',
        description: 'Intractable dry cough after 4 weeks of therapy.',
        severity: 'warning'
      },
      {
        type: 'iot_dispensed',
        date: '2026-11-24',
        title: 'IoT Smart Dispenser: Dispensed',
        description: 'Dose taken: true, Compartment: 1',
        severity: 'success'
      }
    ];
  }

  if (url.match(/\/patients\/\d+/)) {
    return {
      patient: mockPatients[0],
      medications: [
        {
          id: 1,
          medication_id: 1,
          generic_name: 'Lisinopril',
          brand_name: 'Prinivil',
          therapeutic_class: 'ACE Inhibitor',
          dosage: '20 mg',
          frequency: 'Once Daily',
          route: 'Oral',
          start_date: '2023-01-15',
          status: 'active'
        }
      ],
      adverse_reports: [mockADRs[0]],
      adherence: {
        total_events: 28,
        taken_count: 26,
        missed_count: 2,
        adherence_percentage: 92.8,
        status: 'Optimal (>90%)'
      }
    };
  }

  if (url.includes('/patients')) {
    return mockPatients;
  }

  // 4. Medications
  if (url.includes('/medications/interactions/check')) {
    return mockInteractions;
  }

  if (url.includes('/medications')) {
    return mockMedications;
  }

  // 5. ADR Monitoring
  if (url.includes('/adr')) {
    return mockADRs;
  }

  // 6. ML Analytics
  if (url.includes('/ml/predict-risk')) {
    return {
      risk_score: 0.724,
      risk_level: 'High',
      confidence: 0.88,
      feature_importance: {
        polypharmacy_count: 38.5,
        patient_age: 27.2,
        renal_impairment: 19.8,
        ace_inhibitor_class: 14.5
      },
      clinical_disclaimer: 'ACADEMIC DECISION-SUPPORT PROTOTYPE ONLY: Represents statistical correlation from synthetic observational cohort. Not a diagnosis.',
      model_version: 'RandomForest-v1.4.2-PharmacoRisk'
    };
  }

  if (url.includes('/ml/signals')) {
    return mockSignals;
  }

  if (url.includes('/ml/cohort-metrics')) {
    return {
      total_cohort_patients: 6,
      total_adrs_recorded: 7,
      category_distribution: [
        { category: 'Respiratory', count: 2, percentage: 28.5 },
        { category: 'Gastrointestinal', count: 2, percentage: 28.5 },
        { category: 'Cardiovascular', count: 1, percentage: 14.3 },
        { category: 'Musculoskeletal', count: 1, percentage: 14.3 },
        { category: 'Metabolic / Renal', count: 1, percentage: 14.3 }
      ],
      condition_distribution: [
        { condition: 'Hypertension', count: 3, percentage: 50.0 },
        { condition: 'Type 2 Diabetes', count: 2, percentage: 33.3 },
        { condition: 'Heart Failure', count: 1, percentage: 16.7 }
      ],
      polypharmacy_distribution: [
        { tier: '1-2 (Low)', patient_count: 2, percentage: 33.3 },
        { tier: '3-4 (Moderate)', patient_count: 3, percentage: 50.0 },
        { tier: '5+ (High/Polypharmacy)', patient_count: 1, percentage: 16.7 }
      ]
    };
  }

  // 7. IoT
  if (url.includes('/iot/devices')) {
    return mockDevices;
  }
  if (url.includes('/iot/events')) {
    return mockEvents;
  }
  if (url.includes('/iot/simulate')) {
    return { message: 'Simulated event broadcast across WebSocket surveillance nodes.' };
  }

  // 8. Admin
  if (url.includes('/admin/users')) {
    return [
      { id: 1, full_name: 'Dr. Eleanor Vance', email: 'admin@pharmacare.ai', role: 'admin', is_active: true, specialty: 'Health Informatics' },
      { id: 2, full_name: 'Dr. Marcus Thorne, MD', email: 'doctor@pharmacare.ai', role: 'doctor', is_active: true, specialty: 'Cardiology' },
      { id: 3, full_name: 'Sarah Jenkins, PharmD', email: 'pharmacist@pharmacare.ai', role: 'pharmacist', is_active: true, specialty: 'Pharmacotherapy' },
      { id: 4, full_name: 'Prof. David Chen', email: 'researcher@pharmacare.ai', role: 'researcher', is_active: true, specialty: 'Pharmacoepidemiology' },
      { id: 5, full_name: 'Robert Miller', email: 'patient@pharmacare.ai', role: 'patient', is_active: true, specialty: 'General' }
    ];
  }

  if (url.includes('/admin/audit-logs')) {
    return [
      { id: 1, timestamp: new Date().toISOString(), action: 'CLINICAL_SAFETY_REVIEW', entity_type: 'SafetyReview', user_email: 'doctor@pharmacare.ai', ip_address: '127.0.0.1', details: 'Completed WHO-UMC causality assessment' },
      { id: 2, timestamp: new Date().toISOString(), action: 'SUBMIT_ADR', entity_type: 'AdverseEventReport', user_email: 'doctor@pharmacare.ai', ip_address: '127.0.0.1', details: 'Reported severe myalgia for Atorvastatin' }
    ];
  }

  if (url.includes('/admin/system-stats')) {
    return {
      database_engine: 'PostgreSQL / SQLite Compatible',
      users_count: 5,
      audit_logs_count: 34,
      system_status: 'Healthy / Operational'
    };
  }

  return [];
};

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pharmacare_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    // If Netlify SPA host redirected the /api call and returned the HTML page with status 200:
    if (
      typeof response.data === 'string' &&
      (response.data.includes('<!doctype') || response.data.includes('<html'))
    ) {
      const url = response.config?.url || '';
      console.warn(`[PharmaCare AI] Static host returned HTML for API request to ${url}. Serving synthetic preview data.`);
      return { data: getMockDataForUrl(url, response.config) };
    }
    return response;
  },
  (error) => {
    const { config, response } = error;
    const url = config?.url || '';

    // Handle authentication error for non-login pages
    if (response && response.status === 401) {
      localStorage.removeItem('pharmacare_token');
      localStorage.removeItem('pharmacare_user');
      if (
        typeof window !== 'undefined' &&
        !window.location.pathname.includes('/login') &&
        !window.location.pathname.includes('/register')
      ) {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // If backend is unreachable or 404 (common on Netlify preview before remote backend is deployed):
    const isNetworkOr404 = !response || response.status === 404 || response.status === 502;
    if (isNetworkOr404) {
      console.warn(`[PharmaCare AI] Backend unreachable at ${url}. Serving synthetic preview dataset.`);
      return Promise.resolve({ data: getMockDataForUrl(url, config) });
    }

    return Promise.reject(error);
  }
);

export default api;
