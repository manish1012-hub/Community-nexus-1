from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
    type: Optional[str] = None

# --- User Schemas ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "patient"
    specialty: Optional[str] = None
    is_active: bool = True

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = "patient"
    specialty: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    specialty: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

class UserOut(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Patient Schemas ---
class PatientBase(BaseModel):
    mrn: str
    full_name: str
    date_of_birth: str
    gender: str
    contact_phone: Optional[str] = None
    email: Optional[EmailStr] = None
    primary_condition: str = "Hypertension"
    comorbidities: Optional[str] = None
    allergies: Optional[str] = None
    medical_history: Optional[str] = None
    blood_group: Optional[str] = None
    assigned_doctor_id: Optional[int] = None
    is_archived: bool = False

class PatientCreate(PatientBase):
    pass

class PatientUpdate(BaseModel):
    full_name: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    contact_phone: Optional[str] = None
    email: Optional[EmailStr] = None
    primary_condition: Optional[str] = None
    comorbidities: Optional[str] = None
    allergies: Optional[str] = None
    medical_history: Optional[str] = None
    blood_group: Optional[str] = None
    assigned_doctor_id: Optional[int] = None
    is_archived: Optional[bool] = None

class PatientOut(PatientBase):
    id: int
    user_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    assigned_doctor_name: Optional[str] = None
    active_medications_count: Optional[int] = 0
    adverse_reports_count: Optional[int] = 0

    class Config:
        from_attributes = True

# --- Medication Schemas ---
class MedicationBase(BaseModel):
    code: str
    generic_name: str
    brand_name: str
    therapeutic_class: str
    dosage_form: str
    standard_dosage: str
    contraindications: Optional[str] = None
    common_side_effects: Optional[str] = None
    description: Optional[str] = None
    is_active: bool = True

class MedicationCreate(MedicationBase):
    pass

class MedicationOut(MedicationBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Patient Medication Schemas ---
class PatientMedicationCreate(BaseModel):
    patient_id: int
    medication_id: int
    dosage: str
    frequency: str
    route: str = "Oral"
    start_date: str
    end_date: Optional[str] = None
    status: str = "active"
    notes: Optional[str] = None

class PatientMedicationUpdate(BaseModel):
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    route: Optional[str] = None
    end_date: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class PatientMedicationOut(BaseModel):
    id: int
    patient_id: int
    medication_id: int
    prescribed_by_id: Optional[int] = None
    dosage: str
    frequency: str
    route: str
    start_date: str
    end_date: Optional[str]
    status: str
    notes: Optional[str]
    created_at: datetime
    medication: Optional[MedicationOut] = None
    prescriber_name: Optional[str] = None

    class Config:
        from_attributes = True

# --- Adverse Event Report Schemas ---
class ADRCreate(BaseModel):
    patient_id: int
    suspected_medication_id: int
    reaction_category: str
    reaction_description: str
    severity: str # mild, moderate, severe, life_threatening
    onset_date: str
    outcome: str = "ongoing"

class ADRUpdate(BaseModel):
    reaction_category: Optional[str] = None
    reaction_description: Optional[str] = None
    severity: Optional[str] = None
    outcome: Optional[str] = None
    status: Optional[str] = None

class SafetyReviewCreate(BaseModel):
    report_id: int
    causality_assessment: str # certain, probable, possible, unlikely, unclassifiable
    action_taken: str # dose_adjusted, medication_swapped, discontinued, monitoring_continued, none
    review_notes: str

class SafetyReviewOut(BaseModel):
    id: int
    report_id: int
    reviewer_id: int
    reviewer_name: Optional[str] = None
    causality_assessment: str
    action_taken: str
    review_notes: str
    reviewed_at: datetime

    class Config:
        from_attributes = True

class ADROut(BaseModel):
    id: int
    report_number: str
    patient_id: int
    patient_name: Optional[str] = None
    patient_mrn: Optional[str] = None
    suspected_medication_id: int
    suspected_medication_name: Optional[str] = None
    reporter_id: Optional[int] = None
    reporter_name: Optional[str] = None
    reporter_type: str
    reaction_category: str
    reaction_description: str
    severity: str
    onset_date: str
    outcome: str
    status: str
    is_synthetic: bool
    created_at: datetime
    safety_reviews: List[SafetyReviewOut] = []

    class Config:
        from_attributes = True

# --- IoT Schemas ---
class IoTDeviceCreate(BaseModel):
    device_serial: str
    patient_id: Optional[int] = None
    model_name: str = "MedSmart-Pro 4G"
    compartment_count: int = 4

class IoTDeviceOut(BaseModel):
    id: int
    device_serial: str
    patient_id: Optional[int]
    patient_name: Optional[str] = None
    model_name: str
    status: str
    battery_level: int
    firmware_version: str
    compartment_count: int
    last_heartbeat: datetime
    created_at: datetime

    class Config:
        from_attributes = True

class DispensingEventCreate(BaseModel):
    device_serial: str
    patient_id: int
    medication_id: Optional[int] = None
    scheduled_time: str
    dispensed_time: Optional[str] = None
    status: str = "dispensed" # dispensed, missed, late, jammed
    dose_taken: bool = True
    compartment_number: int = 1
    telemetry_notes: Optional[str] = None

class DispensingEventOut(BaseModel):
    id: int
    device_id: int
    patient_id: int
    patient_name: Optional[str] = None
    medication_id: Optional[int] = None
    medication_name: Optional[str] = None
    scheduled_time: str
    dispensed_time: Optional[str]
    status: str
    dose_taken: bool
    compartment_number: int
    telemetry_notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# --- Drug Interaction Schemas ---
class DrugInteractionOut(BaseModel):
    id: int
    medication_a_id: int
    medication_a_name: str
    medication_b_id: int
    medication_b_name: str
    severity_level: str
    interaction_mechanism: str
    clinical_recommendation: str
    evidence_source: str

    class Config:
        from_attributes = True

# --- Audit & Notification ---
class AuditLogOut(BaseModel):
    id: int
    user_id: Optional[int]
    user_email: Optional[str]
    action: str
    entity_type: str
    entity_id: Optional[str]
    ip_address: Optional[str]
    details: Optional[str]
    timestamp: datetime

    class Config:
        from_attributes = True

class NotificationOut(BaseModel):
    id: int
    user_id: Optional[int]
    title: str
    message: str
    alert_type: str
    is_read: bool
    link: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# --- ML & Analytics Schemas ---
class MLPredictionRequest(BaseModel):
    age: int = Field(..., ge=18, le=120)
    gender: str = "Female"
    primary_condition: str = "Hypertension"
    medication_count: int = Field(..., ge=1, le=15)
    medication_class: str = "ACE Inhibitor"
    has_diabetes: bool = False
    has_renal_impairment: bool = False

class MLPredictionResponse(BaseModel):
    risk_score: float # 0.0 to 1.0
    risk_level: str # Low, Moderate, High, Critical
    confidence: float
    feature_importance: Dict[str, float]
    clinical_disclaimer: str
    model_version: str

class DisproportionalitySignal(BaseModel):
    medication_name: str
    reaction_category: str
    report_count: int
    prr: float # Proportional Reporting Ratio
    ror: float # Reporting Odds Ratio
    chi_square: float
    signal_detected: bool # PRR >= 2.0, count >= 3, chi_square >= 4.0
