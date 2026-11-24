// Mock dataset fallback for standalone client-side deployments (e.g., Netlify preview)
export const mockSummary = {
  kpi: {
    total_patients: 6,
    active_prescriptions: 14,
    total_adrs: 7,
    pending_reviews: 2,
    under_reviews: 2,
    reviewed_count: 3,
    average_adherence_rate: 92.4
  },
  monthly_trend: [
    { month: "Jun", total_reports: 14, severe: 3, resolved: 11 },
    { month: "Jul", total_reports: 19, severe: 4, resolved: 15 },
    { month: "Aug", total_reports: 22, severe: 6, resolved: 16 },
    { month: "Sep", total_reports: 27, severe: 7, resolved: 20 },
    { month: "Oct", total_reports: 31, severe: 8, resolved: 23 },
    { month: "Nov", total_reports: 36, severe: 9, resolved: 27 }
  ],
  class_distribution: [
    { class_name: "ACE Inhibitors", count: 42 },
    { class_name: "ARBs", count: 35 },
    { class_name: "Beta Blockers", count: 28 },
    { class_name: "Biguanides", count: 38 },
    { class_name: "Statins", count: 31 },
    { class_name: "SGLT2 Inhibitors", count: 19 }
  ],
  severity_distribution: [
    { severity: "Mild", count: 12 },
    { severity: "Moderate", count: 16 },
    { severity: "Severe", count: 8 }
  ],
  activity_feed: [
    {
      id: 1,
      action: "CLINICAL_SAFETY_REVIEW",
      entity: "SafetyReview",
      details: "Completed WHO-UMC causality assessment for ADR-2024-00001 (Lisinopril-induced cough).",
      user_email: "doctor@pharmacare.ai",
      timestamp: "2026-11-24 14:15"
    },
    {
      id: 2,
      action: "SUBMIT_ADR",
      entity: "AdverseEventReport",
      details: "Reported Musculoskeletal reaction for Atorvastatin (severe).",
      user_email: "doctor@pharmacare.ai",
      timestamp: "2026-11-24 13:42"
    },
    {
      id: 3,
      action: "IOT_TELEMETRY",
      entity: "IoTDevice",
      details: "Morning scheduled dose dispensed on MedSmart-Pro (PAT-2024-0001).",
      user_email: "System Gateway",
      timestamp: "2026-11-24 08:05"
    }
  ]
};

export const mockPatients = [
  {
    id: 1,
    mrn: "PAT-2024-0001",
    full_name: "Robert Miller",
    date_of_birth: "1962-04-18",
    gender: "Male",
    contact_phone: "+1 (555) 234-8901",
    email: "patient@pharmacare.ai",
    primary_condition: "Hypertension & Type 2 Diabetes",
    comorbidities: "Hyperlipidemia, Mild Chronic Kidney Disease (Stage 2)",
    allergies: "Penicillin (Hives)",
    medical_history: "Diagnosed with Stage 2 Hypertension in 2018. Type 2 Diabetes since 2020.",
    blood_group: "O+",
    assigned_doctor_name: "Dr. Marcus Thorne, MD",
    active_medications_count: 3,
    adverse_reports_count: 2,
    created_at: "2024-01-15T00:00:00"
  },
  {
    id: 2,
    mrn: "PAT-2024-0002",
    full_name: "Margaret Holloway",
    date_of_birth: "1955-11-09",
    gender: "Female",
    contact_phone: "+1 (555) 345-6712",
    email: "margaret.holloway@example.org",
    primary_condition: "Essential Hypertension",
    comorbidities: "Osteoarthritis, Mild Gastroesophageal Reflux",
    allergies: "Sulfa drugs",
    medical_history: "Hypertension managed for 12 years. Moderate peripheral edema reported in past with CCBs.",
    blood_group: "A+",
    assigned_doctor_name: "Dr. Marcus Thorne, MD",
    active_medications_count: 2,
    adverse_reports_count: 1,
    created_at: "2024-02-10T00:00:00"
  },
  {
    id: 3,
    mrn: "PAT-2024-0003",
    full_name: "Arthur Pendelton",
    date_of_birth: "1948-08-22",
    gender: "Male",
    contact_phone: "+1 (555) 890-1234",
    email: "arthur.pendelton@example.org",
    primary_condition: "Type 2 Diabetes Mellitus",
    comorbidities: "Coronary Artery Disease, Dyslipidemia, Polypharmacy",
    allergies: "None known",
    medical_history: "Prior myocardial infarction in 2016 with DES stent placement.",
    blood_group: "B+",
    assigned_doctor_name: "Dr. Marcus Thorne, MD",
    active_medications_count: 4,
    adverse_reports_count: 2,
    created_at: "2024-02-15T00:00:00"
  },
  {
    id: 4,
    mrn: "PAT-2024-0004",
    full_name: "Sonia Gutierrez",
    date_of_birth: "1973-02-14",
    gender: "Female",
    contact_phone: "+1 (555) 456-7890",
    email: "sonia.gutierrez@example.org",
    primary_condition: "Hypertension",
    comorbidities: "Migraine with aura",
    allergies: "Aspirin (Bronchospasm)",
    medical_history: "Uncontrolled blood pressure following lifestyle interventions.",
    blood_group: "AB+",
    assigned_doctor_name: "Dr. Marcus Thorne, MD",
    active_medications_count: 1,
    adverse_reports_count: 1,
    created_at: "2024-03-01T00:00:00"
  },
  {
    id: 5,
    mrn: "PAT-2024-0005",
    full_name: "Devin Washington",
    date_of_birth: "1967-09-30",
    gender: "Male",
    contact_phone: "+1 (555) 678-9012",
    email: "devin.washington@example.org",
    primary_condition: "Type 2 Diabetes & Dyslipidemia",
    comorbidities: "Obesity (BMI 33.2), Sleep Apnea",
    allergies: "Codeine (Nausea)",
    medical_history: "Metabolic syndrome. Elevated HbA1c at 8.4%.",
    blood_group: "O-",
    assigned_doctor_name: "Dr. Marcus Thorne, MD",
    active_medications_count: 2,
    adverse_reports_count: 0,
    created_at: "2024-03-12T00:00:00"
  },
  {
    id: 6,
    mrn: "PAT-2024-0006",
    full_name: "Clara Beauchamp",
    date_of_birth: "1959-12-03",
    gender: "Female",
    contact_phone: "+1 (555) 789-0123",
    email: "clara.beauchamp@example.org",
    primary_condition: "Congestive Heart Failure & Hypertension",
    comorbidities: "Hypertension, Atrial Fibrillation",
    allergies: "None known",
    medical_history: "Reduced ejection fraction (HFrEF 40%). High polypharmacy burden.",
    blood_group: "A-",
    assigned_doctor_name: "Dr. Marcus Thorne, MD",
    active_medications_count: 3,
    adverse_reports_count: 1,
    created_at: "2024-03-20T00:00:00"
  }
];

export const mockMedications = [
  {
    id: 1,
    code: "RX-HYP-01",
    generic_name: "Lisinopril",
    brand_name: "Prinivil / Zestril",
    therapeutic_class: "ACE Inhibitor",
    dosage_form: "Oral Tablet",
    standard_dosage: "10 mg Once Daily",
    contraindications: "History of angioedema, pregnancy",
    common_side_effects: "Dry persistent cough, dizziness, hyperkalemia",
    description: "First-line antihypertensive indicated for essential hypertension and heart failure.",
    is_active: true
  },
  {
    id: 2,
    code: "RX-HYP-02",
    generic_name: "Losartan Potassium",
    brand_name: "Cozaar",
    therapeutic_class: "Angiotensin II Receptor Blocker (ARB)",
    dosage_form: "Oral Tablet",
    standard_dosage: "50 mg Once Daily",
    contraindications: "Pregnancy, bilateral renal artery stenosis",
    common_side_effects: "Dizziness, nasal congestion, fatigue",
    description: "Antihypertensive used when ACE inhibitors cause intolerable cough.",
    is_active: true
  },
  {
    id: 3,
    code: "RX-HYP-03",
    generic_name: "Amlodipine Besylate",
    brand_name: "Norvasc",
    therapeutic_class: "Calcium Channel Blocker (Dihydropyridine)",
    dosage_form: "Oral Tablet",
    standard_dosage: "5 mg Once Daily",
    contraindications: "Severe hypotension, cardiogenic shock",
    common_side_effects: "Peripheral pedal edema, flushing, palpitations",
    description: "Potent peripheral vasodilator indicated for hypertension.",
    is_active: true
  },
  {
    id: 4,
    code: "RX-DIA-01",
    generic_name: "Metformin Hydrochloride",
    brand_name: "Glucophage",
    therapeutic_class: "Biguanide",
    dosage_form: "Extended-Release Tablet",
    standard_dosage: "500 mg Twice Daily with Meals",
    contraindications: "Severe renal impairment (eGFR < 30)",
    common_side_effects: "Gastrointestinal distress, diarrhea, nausea",
    description: "Foundational first-line oral anti-hyperglycemic for Type 2 Diabetes.",
    is_active: true
  },
  {
    id: 5,
    code: "RX-LIP-01",
    generic_name: "Atorvastatin Calcium",
    brand_name: "Lipitor",
    therapeutic_class: "HMG-CoA Reductase Inhibitor (Statin)",
    dosage_form: "Oral Tablet",
    standard_dosage: "20 mg Once Daily at Bedtime",
    contraindications: "Active liver disease, pregnancy",
    common_side_effects: "Myalgia, arthralgia, elevated transaminases",
    description: "High-intensity lipid-lowering agent for ASCVD risk reduction.",
    is_active: true
  },
  {
    id: 6,
    code: "RX-DIA-02",
    generic_name: "Empagliflozin",
    brand_name: "Jardiance",
    therapeutic_class: "SGLT2 Inhibitor",
    dosage_form: "Oral Tablet",
    standard_dosage: "10 mg Once Daily in Morning",
    contraindications: "Dialysis, severe renal impairment",
    common_side_effects: "Urinary tract infections, mycotic genital infections",
    description: "Sodium-glucose co-transporter 2 inhibitor with cardiorenal protection.",
    is_active: true
  },
  {
    id: 7,
    code: "RX-DIU-02",
    generic_name: "Spironolactone",
    brand_name: "Aldactone",
    therapeutic_class: "Aldosterone Antagonist / Potassium-Sparing Diuretic",
    dosage_form: "Oral Tablet",
    standard_dosage: "25 mg Once Daily",
    contraindications: "Hyperkalemia (serum K+ > 5.0 mEq/L)",
    common_side_effects: "Hyperkalemia, gynecomastia, dizziness",
    description: "Potassium-sparing diuretic useful in resistant hypertension and heart failure.",
    is_active: true
  }
];

export const mockADRs = [
  {
    id: 1,
    report_number: "ADR-2024-00001",
    patient_id: 2,
    patient_name: "Margaret Holloway",
    patient_mrn: "PAT-2024-0002",
    suspected_medication_id: 1,
    suspected_medication_name: "Prinivil / Zestril (Lisinopril)",
    reporter_name: "Dr. Marcus Thorne, MD",
    reporter_type: "doctor",
    reaction_category: "Respiratory",
    reaction_description: "Patient developed intractable non-productive hacking nocturnal dry cough after 4 weeks of therapy. Symptoms resolved upon switching to Losartan.",
    severity: "moderate",
    onset_date: "2023-02-15",
    outcome: "recovered",
    status: "reviewed",
    is_synthetic: true,
    safety_reviews: [
      {
        id: 1,
        report_id: 1,
        reviewer_id: 2,
        reviewer_name: "Dr. Marcus Thorne, MD",
        causality_assessment: "certain",
        action_taken: "medication_swapped",
        review_notes: "Classic bradykinin-mediated ACE-inhibitor dry cough. Dechallenge positive. Switched successfully to ARB (Losartan 50mg).",
        reviewed_at: "2023-02-20T10:00:00"
      }
    ]
  },
  {
    id: 2,
    report_number: "ADR-2024-00002",
    patient_id: 4,
    patient_name: "Sonia Gutierrez",
    patient_mrn: "PAT-2024-0004",
    suspected_medication_id: 3,
    suspected_medication_name: "Norvasc (Amlodipine Besylate)",
    reporter_name: "Robert Miller",
    reporter_type: "patient",
    reaction_category: "Cardiovascular / Peripheral",
    reaction_description: "Severe bilateral ankle and pedal edema (+2 pitting) after increasing dose to 10 mg daily. Difficulty fitting into regular shoes.",
    severity: "moderate",
    onset_date: "2023-09-02",
    outcome: "recovering",
    status: "under_review",
    is_synthetic: true,
    safety_reviews: []
  },
  {
    id: 3,
    report_number: "ADR-2024-00003",
    patient_id: 1,
    patient_name: "Robert Miller",
    patient_mrn: "PAT-2024-0001",
    suspected_medication_id: 4,
    suspected_medication_name: "Glucophage (Metformin Hydrochloride)",
    reporter_name: "Robert Miller",
    reporter_type: "patient",
    reaction_category: "Gastrointestinal",
    reaction_description: "Severe recurrent abdominal cramping, watery diarrhea, and morning nausea occurring within 45 minutes of dose ingestion.",
    severity: "mild",
    onset_date: "2023-04-20",
    outcome: "recovering",
    status: "reviewed",
    is_synthetic: true,
    safety_reviews: [
      {
        id: 2,
        report_id: 3,
        reviewer_id: 3,
        reviewer_name: "Sarah Jenkins, PharmD",
        causality_assessment: "probable",
        action_taken: "dose_adjusted",
        review_notes: "Common Metformin GI adverse effect. Switched to extended-release formulation taken in middle of evening meal.",
        reviewed_at: "2023-04-25T11:00:00"
      }
    ]
  },
  {
    id: 4,
    report_number: "ADR-2024-00004",
    patient_id: 3,
    patient_name: "Arthur Pendelton",
    patient_mrn: "PAT-2024-0003",
    suspected_medication_id: 5,
    suspected_medication_name: "Lipitor (Atorvastatin Calcium)",
    reporter_name: "Dr. Marcus Thorne, MD",
    reporter_type: "doctor",
    reaction_category: "Musculoskeletal",
    reaction_description: "Bilateral proximal thigh weakness and severe myalgia. CK levels elevated at 480 U/L (2.5x ULN). Statin paused temporarily.",
    severity: "severe",
    onset_date: "2023-10-11",
    outcome: "ongoing",
    status: "under_review",
    is_synthetic: true,
    safety_reviews: []
  },
  {
    id: 5,
    report_number: "ADR-2024-00005",
    patient_id: 6,
    patient_name: "Clara Beauchamp",
    patient_mrn: "PAT-2024-0006",
    suspected_medication_id: 7,
    suspected_medication_name: "Aldactone (Spironolactone)",
    reporter_name: "Dr. Marcus Thorne, MD",
    reporter_type: "doctor",
    reaction_category: "Metabolic / Renal",
    reaction_description: "Serum potassium surged to 5.8 mEq/L (hyperkalemia) following initiation alongside Lisinopril. Peaked T-waves on ECG.",
    severity: "severe",
    onset_date: "2023-06-04",
    outcome: "recovered",
    status: "reviewed",
    is_synthetic: true,
    safety_reviews: [
      {
        id: 3,
        report_id: 5,
        reviewer_id: 2,
        reviewer_name: "Dr. Marcus Thorne, MD",
        causality_assessment: "probable",
        action_taken: "discontinued",
        review_notes: "Major drug interaction between ACE inhibitor and Aldosterone antagonist in stage 2 CKD. Spironolactone suspended, potassium normalized to 4.4 mEq/L.",
        reviewed_at: "2023-06-08T09:30:00"
      }
    ]
  }
];

export const mockInteractions = [
  {
    id: 1,
    medication_a_id: 1,
    medication_a_name: "Lisinopril",
    medication_b_id: 7,
    medication_b_name: "Spironolactone",
    severity_level: "major",
    interaction_mechanism: "Concomitant administration of ACE inhibitors and potassium-sparing diuretics significantly increases risk of severe hyperkalemia, cardiac arrhythmias, and renal dysfunction.",
    clinical_recommendation: "Monitor serum potassium and renal function closely within 1-2 weeks. Advise against potassium supplements.",
    evidence_source: "FDA Drug Labeling / Lexicomp Safety Signal"
  }
];

export const mockSignals = [
  {
    medication_name: "Lisinopril",
    reaction_category: "Respiratory",
    report_count: 5,
    prr: 3.12,
    ror: 3.84,
    chi_square: 6.82,
    signal_detected: true
  },
  {
    medication_name: "Spironolactone",
    reaction_category: "Metabolic / Renal",
    report_count: 4,
    prr: 2.85,
    ror: 3.20,
    chi_square: 5.41,
    signal_detected: true
  },
  {
    medication_name: "Atorvastatin",
    reaction_category: "Musculoskeletal",
    report_count: 3,
    prr: 2.15,
    ror: 2.40,
    chi_square: 4.12,
    signal_detected: true
  },
  {
    medication_name: "Amlodipine",
    reaction_category: "Cardiovascular / Peripheral",
    report_count: 3,
    prr: 1.80,
    ror: 1.95,
    chi_square: 2.90,
    signal_detected: false
  }
];

export const mockDevices = [
  {
    id: 1,
    device_serial: "IOT-DISP-4081",
    patient_id: 1,
    patient_name: "Robert Miller",
    model_name: "MedSmart-Pro 4G Dispenser",
    status: "online",
    battery_level: 94,
    firmware_version: "v2.4.1",
    compartment_count: 4,
    last_heartbeat: new Date().toISOString(),
    created_at: "2024-01-01T00:00:00"
  },
  {
    id: 2,
    device_serial: "IOT-DISP-4082",
    patient_id: 3,
    patient_name: "Arthur Pendelton",
    model_name: "MedSmart-Pro 4G Dispenser",
    status: "online",
    battery_level: 88,
    firmware_version: "v2.4.1",
    compartment_count: 4,
    last_heartbeat: new Date().toISOString(),
    created_at: "2024-01-01T00:00:00"
  }
];

export const mockEvents = [
  {
    id: 1,
    device_id: 1,
    patient_id: 1,
    patient_name: "Robert Miller",
    medication_id: 1,
    medication_name: "Lisinopril",
    scheduled_time: "2026-11-24 08:00",
    dispensed_time: "2026-11-24 08:03",
    status: "dispensed",
    dose_taken: true,
    compartment_number: 1,
    telemetry_notes: "Temp: 21.4°C, Humidity: 42%, Battery: 94%",
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    device_id: 1,
    patient_id: 1,
    patient_name: "Robert Miller",
    medication_id: 4,
    medication_name: "Metformin Hydrochloride",
    scheduled_time: "2026-11-23 20:00",
    dispensed_time: "2026-11-23 20:45",
    status: "dispensed",
    dose_taken: true,
    compartment_number: 2,
    telemetry_notes: "Door sensor verified. Tray open duration: 18s.",
    created_at: new Date().toISOString()
  }
];
