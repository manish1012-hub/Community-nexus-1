"""
Seed script for PharmaCare AI
Populates realistic synthetic healthcare data:
- Pre-configured user roles (admin, doctor, pharmacist, researcher, patient)
- Essential chronic disease medications (hypertension, diabetes, cholesterol, heart disease)
- Known drug-drug interactions with clinical severity and mechanisms
- Chronic illness patients with complete demographics and medical histories
- Patient active prescriptions
- Historical and recent adverse drug reaction (ADR) reports with safety reviews
- IoT Smart Dispenser devices and telemetry events
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal, Base, engine
from app.models.models import (
    User, Patient, Medication, PatientMedication, AdverseEventReport,
    SafetyReview, IoTDevice, DispensingEvent, DrugInteraction, Notification, AuditLog, UserRole
)
from app.core.security import get_password_hash
from datetime import datetime, timedelta

def seed_database():
    print("Re-creating database schema...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        print("Seeding initial users for all 5 roles...")
        users = [
            User(
                email="admin@pharmacare.ai",
                hashed_password=get_password_hash("Admin@12345"),
                full_name="Dr. Eleanor Vance (System Admin)",
                role=UserRole.ADMIN,
                specialty="Health Informatics & Administration"
            ),
            User(
                email="doctor@pharmacare.ai",
                hashed_password=get_password_hash("Doctor@12345"),
                full_name="Dr. Marcus Thorne, MD",
                role=UserRole.DOCTOR,
                specialty="Cardiology & Chronic Care"
            ),
            User(
                email="pharmacist@pharmacare.ai",
                hashed_password=get_password_hash("Pharm@12345"),
                full_name="Sarah Jenkins, PharmD",
                role=UserRole.PHARMACIST,
                specialty="Clinical Pharmacotherapy"
            ),
            User(
                email="researcher@pharmacare.ai",
                hashed_password=get_password_hash("Research@12345"),
                full_name="Prof. David Chen, PhD",
                role=UserRole.RESEARCHER,
                specialty="Pharmacoepidemiology"
            ),
            User(
                email="patient@pharmacare.ai",
                hashed_password=get_password_hash("Patient@12345"),
                full_name="Robert Miller",
                role=UserRole.PATIENT,
                specialty=None
            ),
        ]
        db.add_all(users)
        db.commit()
        for u in users:
            db.refresh(u)

        admin_user, doctor_user, pharm_user, researcher_user, patient_user = users

        print("Seeding medications formulary...")
        meds_data = [
            {
                "code": "RX-HYP-01",
                "generic_name": "Lisinopril",
                "brand_name": "Prinivil / Zestril",
                "therapeutic_class": "ACE Inhibitor",
                "dosage_form": "Oral Tablet",
                "standard_dosage": "10 mg Once Daily",
                "contraindications": "History of angioedema, pregnancy, concomitant aliskiren in diabetes",
                "common_side_effects": "Dry persistent cough, dizziness, headache, hyperkalemia",
                "description": "First-line antihypertensive indicated for essential hypertension and heart failure."
            },
            {
                "code": "RX-HYP-02",
                "generic_name": "Losartan Potassium",
                "brand_name": "Cozaar",
                "therapeutic_class": "Angiotensin II Receptor Blocker (ARB)",
                "dosage_form": "Oral Tablet",
                "standard_dosage": "50 mg Once Daily",
                "contraindications": "Pregnancy, severe hepatic impairment, bilateral renal artery stenosis",
                "common_side_effects": "Upper respiratory tract infection, dizziness, nasal congestion",
                "description": "Antihypertensive used when ACE inhibitors cause intolerable persistent cough."
            },
            {
                "code": "RX-HYP-03",
                "generic_name": "Amlodipine Besylate",
                "brand_name": "Norvasc",
                "therapeutic_class": "Calcium Channel Blocker (Dihydropyridine)",
                "dosage_form": "Oral Tablet",
                "standard_dosage": "5 mg Once Daily",
                "contraindications": "Severe hypotension, cardiogenic shock",
                "common_side_effects": "Peripheral pedal edema, flushing, palpitations, fatigue",
                "description": "Potent peripheral vasodilator indicated for hypertension and chronic stable angina."
            },
            {
                "code": "RX-DIA-01",
                "generic_name": "Metformin Hydrochloride",
                "brand_name": "Glucophage",
                "therapeutic_class": "Biguanide",
                "dosage_form": "Extended-Release Tablet",
                "standard_dosage": "500 mg Twice Daily with Meals",
                "contraindications": "Severe renal impairment (eGFR < 30 mL/min), acute metabolic acidosis",
                "common_side_effects": "Gastrointestinal distress, nausea, diarrhea, abdominal cramping, lactic acidosis risk",
                "description": "Foundational first-line oral anti-hyperglycemic for Type 2 Diabetes Mellitus."
            },
            {
                "code": "RX-LIP-01",
                "generic_name": "Atorvastatin Calcium",
                "brand_name": "Lipitor",
                "therapeutic_class": "HMG-CoA Reductase Inhibitor (Statin)",
                "dosage_form": "Oral Tablet",
                "standard_dosage": "20 mg Once Daily at Bedtime",
                "contraindications": "Active liver disease, unexplained persistent elevation of serum transaminases, pregnancy",
                "common_side_effects": "Myalgia, arthralgia, elevated transaminases, rhabdomyolysis (rare)",
                "description": "High-intensity lipid-lowering agent for atherosclerotic cardiovascular risk reduction."
            },
            {
                "code": "RX-DIA-02",
                "generic_name": "Empagliflozin",
                "brand_name": "Jardiance",
                "therapeutic_class": "SGLT2 Inhibitor",
                "dosage_form": "Oral Tablet",
                "standard_dosage": "10 mg Once Daily in Morning",
                "contraindications": "Dialysis, severe renal impairment (eGFR < 20)",
                "common_side_effects": "Urinary tract infections, mycotic genital infections, hypotension, euglycemic DKA",
                "description": "Sodium-glucose co-transporter 2 inhibitor with proven cardiovascular and renal mortality benefits."
            },
            {
                "code": "RX-CRD-01",
                "generic_name": "Metoprolol Succinate",
                "brand_name": "Toprol-XL",
                "therapeutic_class": "Beta-1 Selective Blocker",
                "dosage_form": "Extended-Release Tablet",
                "standard_dosage": "50 mg Once Daily",
                "contraindications": "Sinus bradycardia, second- or third-degree heart block, cardiogenic shock",
                "common_side_effects": "Bradycardia, fatigue, dizziness, depression, cold extremities",
                "description": "Cardioselective beta-adrenergic blocker for hypertension, angina, and heart failure."
            },
            {
                "code": "RX-DIU-01",
                "generic_name": "Hydrochlorothiazide",
                "brand_name": "Microzide",
                "therapeutic_class": "Thiazide Diuretic",
                "dosage_form": "Oral Capsule",
                "standard_dosage": "25 mg Once Daily in Morning",
                "contraindications": "Anuria, hypersensitivity to sulfonamide-derived drugs",
                "common_side_effects": "Hypokalemia, hyperuricemia (gout flare), photosensitivity, orthostatic hypotension",
                "description": "Diuretic antihypertensive enhancing renal sodium and chloride excretion."
            },
            {
                "code": "RX-DIU-02",
                "generic_name": "Spironolactone",
                "brand_name": "Aldactone",
                "therapeutic_class": "Aldosterone Antagonist / Potassium-Sparing Diuretic",
                "dosage_form": "Oral Tablet",
                "standard_dosage": "25 mg Once Daily",
                "contraindications": "Hyperkalemia (serum K+ > 5.0 mEq/L), Addison's disease, concomitant eplerenone",
                "common_side_effects": "Hyperkalemia, gynecomastia in males, menstrual irregularities, dizziness",
                "description": "Potassium-sparing diuretic useful in resistant hypertension and heart failure."
            }
        ]

        created_meds = []
        for m in meds_data:
            med_obj = Medication(**m)
            db.add(med_obj)
            created_meds.append(med_obj)
        db.commit()
        for m in created_meds:
            db.refresh(m)

        lisinopril = created_meds[0]
        losartan = created_meds[1]
        amlodipine = created_meds[2]
        metformin = created_meds[3]
        atorvastatin = created_meds[4]
        empagliflozin = created_meds[5]
        metoprolol = created_meds[6]
        hctz = created_meds[7]
        spironolactone = created_meds[8]

        print("Seeding verified drug-drug interactions...")
        interactions_data = [
            DrugInteraction(
                medication_a_id=lisinopril.id,
                medication_b_id=spironolactone.id,
                severity_level="major",
                interaction_mechanism="Concomitant administration of ACE inhibitors and potassium-sparing diuretics significantly increases risk of severe hyperkalemia, cardiac arrhythmias, and renal dysfunction.",
                clinical_recommendation="Monitor serum potassium and renal function closely within 1-2 weeks of initiation. Advise patient against potassium supplements or salt substitutes containing potassium.",
                evidence_source="FDA Drug Labeling / Lexicomp Clinical Safety Signal"
            ),
            DrugInteraction(
                medication_a_id=lisinopril.id,
                medication_b_id=losartan.id,
                severity_level="contraindicated",
                interaction_mechanism="Dual blockade of the renin-angiotensin-aldosterone system (RAAS) with an ACE inhibitor and an ARB increases the risk of severe hypotension, syncope, hyperkalemia, and acute renal failure without incremental clinical benefit.",
                clinical_recommendation="Avoid combination therapy. Discontinue one agent and choose an alternate antihypertensive class (e.g., CCB or Thiazide).",
                evidence_source="ACC/AHA Hypertension Guidelines & ONTARGET Trial"
            ),
            DrugInteraction(
                medication_a_id=metformin.id,
                medication_b_id=empagliflozin.id,
                severity_level="minor",
                interaction_mechanism="Synergistic glucose-lowering effect with minimal pharmacokinetic interference.",
                clinical_recommendation="Standard combination therapy for T2D. Monitor for volume depletion, dehydration, and euglycemic DKA symptoms during acute illness.",
                evidence_source="ADA Standards of Medical Care in Diabetes"
            ),
            DrugInteraction(
                medication_a_id=amlodipine.id,
                medication_b_id=atorvastatin.id,
                severity_level="moderate",
                interaction_mechanism="Amlodipine inhibits CYP3A4, moderately elevating systemic plasma exposure of Atorvastatin, increasing risk of myopathy.",
                clinical_recommendation="Limit Atorvastatin dose to maximum 20-40 mg daily when co-administered with Amlodipine. Instruct patient to report unexplained muscle soreness.",
                evidence_source="FDA Drug Safety Communication / P-gp & CYP3A4 Interaction"
            ),
            DrugInteraction(
                medication_a_id=metoprolol.id,
                medication_b_id=metformin.id,
                severity_level="moderate",
                interaction_mechanism="Beta-blockers can mask autonomic warning signs of acute hypoglycemia (e.g., tachycardia, tremors, palpitations), although diaphoresis typically remains.",
                clinical_recommendation="Educate diabetic patients on recognizing subtle hypoglycemia symptoms (e.g., diaphoresis, hunger, confusion) and reinforce frequent capillary blood glucose monitoring.",
                evidence_source="Clinical Pharmacokinetics & Endocrine Society Guidance"
            )
        ]
        db.add_all(interactions_data)
        db.commit()

        print("Seeding patient profiles for chronic care cohort...")
        patients_data = [
            Patient(
                user_id=patient_user.id,
                mrn="PAT-2024-0001",
                full_name="Robert Miller",
                date_of_birth="1962-04-18",
                gender="Male",
                contact_phone="+1 (555) 234-8901",
                email="patient@pharmacare.ai",
                primary_condition="Hypertension & Type 2 Diabetes",
                comorbidities="Hyperlipidemia, Mild Chronic Kidney Disease (Stage 2)",
                allergies="Penicillin (Hives)",
                medical_history="Diagnosed with Stage 2 Hypertension in 2018. Type 2 Diabetes since 2020. Non-smoker.",
                blood_group="O+",
                assigned_doctor_id=doctor_user.id
            ),
            Patient(
                mrn="PAT-2024-0002",
                full_name="Margaret Holloway",
                date_of_birth="1955-11-09",
                gender="Female",
                contact_phone="+1 (555) 345-6712",
                email="margaret.holloway@example.org",
                primary_condition="Essential Hypertension",
                comorbidities="Osteoarthritis, Mild Gastroesophageal Reflux",
                allergies="Sulfa drugs",
                medical_history="Hypertension managed for 12 years. Moderate peripheral edema reported in past with high-dose CCBs.",
                blood_group="A+",
                assigned_doctor_id=doctor_user.id
            ),
            Patient(
                mrn="PAT-2024-0003",
                full_name="Arthur Pendelton",
                date_of_birth="1948-08-22",
                gender="Male",
                contact_phone="+1 (555) 890-1234",
                email="arthur.pendelton@example.org",
                primary_condition="Type 2 Diabetes Mellitus",
                comorbidities="Coronary Artery Disease, Dyslipidemia, Polypharmacy",
                allergies="None known",
                medical_history="Prior myocardial infarction in 2016 with DES stent placement. Strict medication compliance required.",
                blood_group="B+",
                assigned_doctor_id=doctor_user.id
            ),
            Patient(
                mrn="PAT-2024-0004",
                full_name="Sonia Gutierrez",
                date_of_birth="1973-02-14",
                gender="Female",
                contact_phone="+1 (555) 456-7890",
                email="sonia.gutierrez@example.org",
                primary_condition="Hypertension",
                comorbidities="Migraine with aura",
                allergies="Aspirin (Bronchospasm)",
                medical_history="Uncontrolled blood pressure following lifestyle interventions. Initiated on combination therapy.",
                blood_group="AB+",
                assigned_doctor_id=doctor_user.id
            ),
            Patient(
                mrn="PAT-2024-0005",
                full_name="Devin Washington",
                date_of_birth="1967-09-30",
                gender="Male",
                contact_phone="+1 (555) 678-9012",
                email="devin.washington@example.org",
                primary_condition="Type 2 Diabetes & Dyslipidemia",
                comorbidities="Obesity (BMI 33.2), Sleep Apnea",
                allergies="Codeine (Nausea)",
                medical_history="Metabolic syndrome. Elevated HbA1c at 8.4%. IoT dispenser deployed for adherence tracking.",
                blood_group="O-",
                assigned_doctor_id=doctor_user.id
            ),
            Patient(
                mrn="PAT-2024-0006",
                full_name="Clara Beauchamp",
                date_of_birth="1959-12-03",
                gender="Female",
                contact_phone="+1 (555) 789-0123",
                email="clara.beauchamp@example.org",
                primary_condition="Congestive Heart Failure & Hypertension",
                comorbidities="Hypertension, Atrial Fibrillation",
                allergies="None known",
                medical_history="Reduced ejection fraction (HFrEF 40%). High polypharmacy burden with 6 daily prescriptions.",
                blood_group="A-",
                assigned_doctor_id=doctor_user.id
            )
        ]
        db.add_all(patients_data)
        db.commit()
        for p in patients_data:
            db.refresh(p)

        p1, p2, p3, p4, p5, p6 = patients_data

        print("Seeding active patient prescriptions...")
        prescriptions_data = [
            # Patient 1 (Robert Miller)
            PatientMedication(
                patient_id=p1.id, medication_id=lisinopril.id, prescribed_by_id=doctor_user.id,
                dosage="20 mg", frequency="Once Daily in Morning", route="Oral",
                start_date="2023-01-15", status="active", notes="Maintain target BP < 130/80 mmHg."
            ),
            PatientMedication(
                patient_id=p1.id, medication_id=metformin.id, prescribed_by_id=doctor_user.id,
                dosage="500 mg", frequency="Twice Daily with Meals", route="Oral",
                start_date="2023-04-10", status="active", notes="Take with food to minimize GI upset."
            ),
            PatientMedication(
                patient_id=p1.id, medication_id=atorvastatin.id, prescribed_by_id=doctor_user.id,
                dosage="20 mg", frequency="Once Daily at Bedtime", route="Oral",
                start_date="2023-06-01", status="active", notes="Lipid panel check every 6 months."
            ),

            # Patient 2 (Margaret Holloway)
            PatientMedication(
                patient_id=p2.id, medication_id=losartan.id, prescribed_by_id=doctor_user.id,
                dosage="50 mg", frequency="Once Daily in Morning", route="Oral",
                start_date="2023-03-20", status="active", notes="Switched from Lisinopril due to dry cough."
            ),
            PatientMedication(
                patient_id=p2.id, medication_id=amlodipine.id, prescribed_by_id=doctor_user.id,
                dosage="5 mg", frequency="Once Daily", route="Oral",
                start_date="2023-05-12", status="active", notes="Watch for ankle swelling."
            ),

            # Patient 3 (Arthur Pendelton)
            PatientMedication(
                patient_id=p3.id, medication_id=metformin.id, prescribed_by_id=doctor_user.id,
                dosage="1000 mg", frequency="Twice Daily with Meals", route="Oral",
                start_date="2022-11-05", status="active", notes="Dose titrated up for glycemic control."
            ),
            PatientMedication(
                patient_id=p3.id, medication_id=empagliflozin.id, prescribed_by_id=doctor_user.id,
                dosage="10 mg", frequency="Once Daily in Morning", route="Oral",
                start_date="2023-02-14", status="active", notes="Cardiorenal risk reduction."
            ),
            PatientMedication(
                patient_id=p3.id, medication_id=metoprolol.id, prescribed_by_id=doctor_user.id,
                dosage="50 mg", frequency="Once Daily", route="Oral",
                start_date="2022-09-01", status="active", notes="Post-MI secondary prevention."
            ),
            PatientMedication(
                patient_id=p3.id, medication_id=atorvastatin.id, prescribed_by_id=doctor_user.id,
                dosage="40 mg", frequency="Once Daily at Bedtime", route="Oral",
                start_date="2022-09-01", status="active", notes="High-intensity statin regimen."
            ),

            # Patient 4 (Sonia Gutierrez)
            PatientMedication(
                patient_id=p4.id, medication_id=amlodipine.id, prescribed_by_id=doctor_user.id,
                dosage="10 mg", frequency="Once Daily in Morning", route="Oral",
                start_date="2023-08-10", status="active", notes="Titrated from 5mg due to persistent high SBP."
            ),

            # Patient 5 (Devin Washington)
            PatientMedication(
                patient_id=p5.id, medication_id=metformin.id, prescribed_by_id=doctor_user.id,
                dosage="850 mg", frequency="Twice Daily with Meals", route="Oral",
                start_date="2023-07-01", status="active", notes="Encourage lifestyle exercise."
            ),
            PatientMedication(
                patient_id=p5.id, medication_id=atorvastatin.id, prescribed_by_id=doctor_user.id,
                dosage="20 mg", frequency="Once Daily at Bedtime", route="Oral",
                start_date="2023-07-01", status="active", notes="Cardiovascular risk management."
            ),

            # Patient 6 (Clara Beauchamp)
            PatientMedication(
                patient_id=p6.id, medication_id=lisinopril.id, prescribed_by_id=doctor_user.id,
                dosage="10 mg", frequency="Once Daily", route="Oral",
                start_date="2023-01-10", status="active", notes="Monitor creatinine and potassium."
            ),
            PatientMedication(
                patient_id=p6.id, medication_id=spironolactone.id, prescribed_by_id=doctor_user.id,
                dosage="25 mg", frequency="Once Daily in Morning", route="Oral",
                start_date="2023-05-18", status="active", notes="Low dose aldosterone blockade for HFrEF."
            ),
            PatientMedication(
                patient_id=p6.id, medication_id=metoprolol.id, prescribed_by_id=doctor_user.id,
                dosage="25 mg", frequency="Once Daily", route="Oral",
                start_date="2023-01-10", status="active", notes="Heart failure beta-blocker titration."
            )
        ]
        db.add_all(prescriptions_data)
        db.commit()

        print("Seeding adverse drug reaction reports and clinical reviews...")
        adr_data = [
            AdverseEventReport(
                report_number="ADR-2024-00001",
                patient_id=p2.id,
                suspected_medication_id=lisinopril.id,
                reporter_id=doctor_user.id,
                reporter_type="doctor",
                reaction_category="Respiratory",
                reaction_description="Patient developed intractable non-productive hacking nocturnal dry cough after 4 weeks of therapy. Chest X-ray clear. Symptoms resolved upon switching to Losartan.",
                severity="moderate",
                onset_date="2023-02-15",
                outcome="recovered",
                status="reviewed",
                is_synthetic=True
            ),
            AdverseEventReport(
                report_number="ADR-2024-00002",
                patient_id=p4.id,
                suspected_medication_id=amlodipine.id,
                reporter_id=patient_user.id,
                reporter_type="patient",
                reaction_category="Cardiovascular / Peripheral",
                reaction_description="Severe bilateral ankle and pedal edema (+2 pitting) after increasing dose to 10 mg daily. Difficulty fitting into regular shoes.",
                severity="moderate",
                onset_date="2023-09-02",
                outcome="recovering",
                status="under_review",
                is_synthetic=True
            ),
            AdverseEventReport(
                report_number="ADR-2024-00003",
                patient_id=p1.id,
                suspected_medication_id=metformin.id,
                reporter_id=patient_user.id,
                reporter_type="patient",
                reaction_category="Gastrointestinal",
                reaction_description="Severe recurrent abdominal cramping, watery diarrhea, and morning nausea occurring within 45 minutes of dose ingestion.",
                severity="mild",
                onset_date="2023-04-20",
                outcome="recovering",
                status="reviewed",
                is_synthetic=True
            ),
            AdverseEventReport(
                report_number="ADR-2024-00004",
                patient_id=p3.id,
                suspected_medication_id=atorvastatin.id,
                reporter_id=doctor_user.id,
                reporter_type="doctor",
                reaction_category="Musculoskeletal",
                reaction_description="Bilateral proximal thigh weakness and severe myalgia. CK levels elevated at 480 U/L (2.5x ULN). Statin paused temporarily.",
                severity="severe",
                onset_date="2023-10-11",
                outcome="ongoing",
                status="under_review",
                is_synthetic=True
            ),
            AdverseEventReport(
                report_number="ADR-2024-00005",
                patient_id=p6.id,
                suspected_medication_id=spironolactone.id,
                reporter_id=doctor_user.id,
                reporter_type="doctor",
                reaction_category="Metabolic / Renal",
                reaction_description="Serum potassium surged to 5.8 mEq/L (hyperkalemia) following initiation alongside Lisinopril. Mild dizziness and ECG peaked T-waves noted.",
                severity="severe",
                onset_date="2023-06-04",
                outcome="recovered",
                status="reviewed",
                is_synthetic=True
            ),
            AdverseEventReport(
                report_number="ADR-2024-00006",
                patient_id=p3.id,
                suspected_medication_id=empagliflozin.id,
                reporter_id=pharm_user.id,
                reporter_type="pharmacist",
                reaction_category="Genitourinary",
                reaction_description="Recurrent mycotic candida balanitis and mild dysuria. Culture confirmed fungal overgrowth.",
                severity="mild",
                onset_date="2023-05-19",
                outcome="recovered",
                status="reviewed",
                is_synthetic=True
            ),
            AdverseEventReport(
                report_number="ADR-2024-00007",
                patient_id=p1.id,
                suspected_medication_id=lisinopril.id,
                reporter_id=patient_user.id,
                reporter_type="patient",
                reaction_category="Dermatological / Hypersensitivity",
                reaction_description="Mild perioral tingling and lip swelling reported early morning. Urgent medical evaluation advised.",
                severity="severe",
                onset_date="2024-01-08",
                outcome="ongoing",
                status="pending",
                is_synthetic=True
            )
        ]
        db.add_all(adr_data)
        db.commit()
        for a in adr_data:
            db.refresh(a)

        # Safety reviews for reviewed reports
        safety_reviews = [
            SafetyReview(
                report_id=adr_data[0].id,
                reviewer_id=doctor_user.id,
                causality_assessment="certain",
                action_taken="medication_swapped",
                review_notes="Classic bradykinin-mediated ACE-inhibitor dry cough. Dechallenge positive (complete resolution within 5 days of discontinuation). Switched patient successfully to ARB (Losartan 50mg) with good blood pressure control.",
                reviewed_at=datetime.utcnow() - timedelta(days=200)
            ),
            SafetyReview(
                report_id=adr_data[2].id,
                reviewer_id=pharm_user.id,
                causality_assessment="probable",
                action_taken="dose_adjusted",
                review_notes="Common initial Metformin GI adverse effect. Advised patient to transition to extended-release (ER) formulation taken strictly in middle of evening meal. Symptoms improved markedly.",
                reviewed_at=datetime.utcnow() - timedelta(days=150)
            ),
            SafetyReview(
                report_id=adr_data[4].id,
                reviewer_id=doctor_user.id,
                causality_assessment="probable",
                action_taken="discontinued",
                review_notes="Major drug interaction between ACE inhibitor and Aldosterone antagonist in stage 2 CKD. Spironolactone suspended, potassium normalized to 4.4 mEq/L within 72 hours. Blood pressure maintained with dosage adjustment of CCB.",
                reviewed_at=datetime.utcnow() - timedelta(days=90)
            ),
            SafetyReview(
                report_id=adr_data[5].id,
                reviewer_id=pharm_user.id,
                causality_assessment="probable",
                action_taken="monitoring_continued",
                review_notes="Class-effect SGLT2 inhibitor glycosuria-induced fungal infection. Resolved with topical clotrimazole and enhanced hygiene counseling. Patient opted to continue due to substantial cardiovascular protection.",
                reviewed_at=datetime.utcnow() - timedelta(days=110)
            )
        ]
        db.add_all(safety_reviews)
        db.commit()

        print("Seeding IoT smart dispenser devices and telemetry events...")
        iot_devices = [
            IoTDevice(
                device_serial="IOT-DISP-4081",
                patient_id=p1.id,
                model_name="MedSmart-Pro 4G Dispenser",
                status="online",
                battery_level=94,
                firmware_version="v2.4.1",
                compartment_count=4,
                last_heartbeat=datetime.utcnow()
            ),
            IoTDevice(
                device_serial="IOT-DISP-4082",
                patient_id=p3.id,
                model_name="MedSmart-Pro 4G Dispenser",
                status="online",
                battery_level=88,
                firmware_version="v2.4.1",
                compartment_count=4,
                last_heartbeat=datetime.utcnow() - timedelta(minutes=12)
            ),
            IoTDevice(
                device_serial="IOT-DISP-4083",
                patient_id=p5.id,
                model_name="MedSmart-Cellular Hub",
                status="online",
                battery_level=76,
                firmware_version="v2.3.9",
                compartment_count=2,
                last_heartbeat=datetime.utcnow() - timedelta(minutes=5)
            )
        ]
        db.add_all(iot_devices)
        db.commit()
        for d in iot_devices:
            db.refresh(d)

        # Seed realistic dispensing events over last 14 days
        dispensing_events = []
        base_time = datetime.utcnow()
        for day in range(14, 0, -1):
            date_str = (base_time - timedelta(days=day)).strftime("%Y-%m-%d")
            # Morning dose
            dispensing_events.append(DispensingEvent(
                device_id=iot_devices[0].id,
                patient_id=p1.id,
                medication_id=lisinopril.id,
                scheduled_time=f"{date_str} 08:00",
                dispensed_time=f"{date_str} 08:05",
                status="dispensed",
                dose_taken=True,
                compartment_number=1,
                telemetry_notes="Device Temp: 21.2°C, Humidity: 44%, Battery: 94%"
            ))
            # Evening dose (occasional late or missed)
            status_ev = "dispensed"
            dose_taken_ev = True
            if day == 3:
                status_ev = "missed"
                dose_taken_ev = False
            elif day == 7:
                status_ev = "late"

            dispensing_events.append(DispensingEvent(
                device_id=iot_devices[0].id,
                patient_id=p1.id,
                medication_id=metformin.id,
                scheduled_time=f"{date_str} 20:00",
                dispensed_time=f"{date_str} 20:45" if status_ev != "missed" else None,
                status=status_ev,
                dose_taken=dose_taken_ev,
                compartment_number=2,
                telemetry_notes="Door sensor verified. Tray open duration: 18s."
            ))

        db.add_all(dispensing_events)
        db.commit()

        print("Seeding initial notifications and audit logs...")
        notifications = [
            Notification(
                title="Potential Safety Signal Flagged",
                message="Disproportionality analysis detected PRR of 2.45 for Lisinopril and Angioedema/Swelling reports.",
                alert_type="danger",
                link="/ml-analytics"
            ),
            Notification(
                title="IoT Adherence Alert: PAT-2024-0001",
                message="Missed scheduled evening dose detected by MedSmart-Pro (Compartment 2).",
                alert_type="warning",
                link="/iot-simulator"
            ),
            Notification(
                title="Formulary Update: SGLT2 Inhibitor",
                message="Empagliflozin approved for expanded cardiorenal indications in chronic hypertension cohort.",
                alert_type="info",
                link="/medications"
            )
        ]
        db.add_all(notifications)

        audit_logs = [
            AuditLog(
                user_id=admin_user.id,
                user_email=admin_user.email,
                action="INITIALIZE_SYSTEM",
                entity_type="System",
                entity_id="1",
                ip_address="127.0.0.1",
                details="Seeded initial database models, drug interactions formulary, and synthetic chronic care patient cohort."
            ),
            AuditLog(
                user_id=doctor_user.id,
                user_email=doctor_user.email,
                action="CLINICAL_SAFETY_REVIEW",
                entity_type="SafetyReview",
                entity_id=str(safety_reviews[0].id),
                ip_address="127.0.0.1",
                details="Completed WHO-UMC causality assessment for ADR-2024-00001 (Lisinopril-induced cough)."
            )
        ]
        db.add_all(audit_logs)
        db.commit()

        print("Database seeded successfully with rich clinical demonstration data!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
