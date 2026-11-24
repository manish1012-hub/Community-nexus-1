from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Float, Enum, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class UserRole(str):
    ADMIN = "admin"
    DOCTOR = "doctor"
    PHARMACIST = "pharmacist"
    RESEARCHER = "researcher"
    PATIENT = "patient"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default=UserRole.PATIENT, nullable=False)
    is_active = Column(Boolean, default=True)
    specialty = Column(String(100), nullable=True) # E.g., Cardiologist, Primary Care, Clinical Pharmacist
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    patient_profile = relationship("Patient", back_populates="user", uselist=False, foreign_keys="[Patient.user_id]")
    assigned_patients = relationship("Patient", back_populates="assigned_doctor", foreign_keys="[Patient.assigned_doctor_id]")
    adverse_reports = relationship("AdverseEventReport", back_populates="reporter")
    safety_reviews = relationship("SafetyReview", back_populates="reviewer")
    audit_logs = relationship("AuditLog", back_populates="user")
    notifications = relationship("Notification", back_populates="user")


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, unique=True)
    mrn = Column(String(50), unique=True, index=True, nullable=False) # Medical Record Number e.g. PAT-2024-001
    full_name = Column(String(255), nullable=False)
    date_of_birth = Column(String(20), nullable=False) # YYYY-MM-DD
    gender = Column(String(20), nullable=False)
    contact_phone = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    primary_condition = Column(String(150), nullable=False, default="Hypertension") # Chronic condition
    comorbidities = Column(Text, nullable=True) # JSON or comma-separated list
    allergies = Column(Text, nullable=True) # e.g., Penicillin, Sulfa
    medical_history = Column(Text, nullable=True)
    blood_group = Column(String(10), nullable=True)
    assigned_doctor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_archived = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="patient_profile", foreign_keys=[user_id])
    assigned_doctor = relationship("User", back_populates="assigned_patients", foreign_keys=[assigned_doctor_id])
    medications = relationship("PatientMedication", back_populates="patient", cascade="all, delete-orphan")
    adverse_reports = relationship("AdverseEventReport", back_populates="patient")
    iot_devices = relationship("IoTDevice", back_populates="patient")
    dispensing_events = relationship("DispensingEvent", back_populates="patient")


class Medication(Base):
    __tablename__ = "medications"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False) # e.g. RX-HYP-01
    generic_name = Column(String(255), index=True, nullable=False)
    brand_name = Column(String(255), nullable=False)
    therapeutic_class = Column(String(150), nullable=False) # e.g. ACE Inhibitor, Beta Blocker, Biguanide
    dosage_form = Column(String(100), nullable=False) # Tablet, Capsule, Solution
    standard_dosage = Column(String(100), nullable=False) # e.g. 10mg Once Daily
    contraindications = Column(Text, nullable=True)
    common_side_effects = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    prescriptions = relationship("PatientMedication", back_populates="medication")
    adverse_reports = relationship("AdverseEventReport", back_populates="suspected_medication")


class PatientMedication(Base):
    __tablename__ = "patient_medications"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    medication_id = Column(Integer, ForeignKey("medications.id"), nullable=False)
    prescribed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    dosage = Column(String(100), nullable=False)
    frequency = Column(String(100), nullable=False) # e.g., "Once Daily", "Twice Daily with Meals"
    route = Column(String(50), default="Oral")
    start_date = Column(String(20), nullable=False) # YYYY-MM-DD
    end_date = Column(String(20), nullable=True)
    status = Column(String(50), default="active") # active, completed, discontinued, paused
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    patient = relationship("Patient", back_populates="medications")
    medication = relationship("Medication", back_populates="prescriptions")
    prescriber = relationship("User", foreign_keys=[prescribed_by_id])


class AdverseEventReport(Base):
    __tablename__ = "adverse_event_reports"

    id = Column(Integer, primary_key=True, index=True)
    report_number = Column(String(50), unique=True, index=True, nullable=False) # ADR-2024-001
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    suspected_medication_id = Column(Integer, ForeignKey("medications.id"), nullable=False)
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    reporter_type = Column(String(50), nullable=False) # doctor, pharmacist, patient
    reaction_category = Column(String(100), nullable=False) # Cardiovascular, Dermatological, Gastrointestinal, etc.
    reaction_description = Column(Text, nullable=False)
    severity = Column(String(50), nullable=False) # mild, moderate, severe, life_threatening
    onset_date = Column(String(20), nullable=False) # YYYY-MM-DD
    outcome = Column(String(50), default="ongoing") # recovered, recovering, ongoing, fatal, unknown
    status = Column(String(50), default="pending") # pending, under_review, reviewed
    is_synthetic = Column(Boolean, default=True) # Always flags synthetic training demo data
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    patient = relationship("Patient", back_populates="adverse_reports")
    suspected_medication = relationship("Medication", back_populates="adverse_reports")
    reporter = relationship("User", back_populates="adverse_reports", foreign_keys=[reporter_id])
    safety_reviews = relationship("SafetyReview", back_populates="report", cascade="all, delete-orphan")


class SafetyReview(Base):
    __tablename__ = "safety_reviews"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("adverse_event_reports.id"), nullable=False)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    causality_assessment = Column(String(50), nullable=False) # certain, probable, possible, unlikely, unclassifiable
    action_taken = Column(String(100), nullable=False) # dose_adjusted, medication_swapped, discontinued, monitoring_continued, none
    review_notes = Column(Text, nullable=False)
    reviewed_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    report = relationship("AdverseEventReport", back_populates="safety_reviews")
    reviewer = relationship("User", back_populates="safety_reviews")


class IoTDevice(Base):
    __tablename__ = "iot_devices"

    id = Column(Integer, primary_key=True, index=True)
    device_serial = Column(String(100), unique=True, index=True, nullable=False) # IOT-DISP-4081
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=True)
    model_name = Column(String(100), default="MedSmart-Pro 4G")
    status = Column(String(50), default="online") # online, offline, low_battery, error
    battery_level = Column(Integer, default=95) # 0-100%
    firmware_version = Column(String(50), default="v2.4.1")
    compartment_count = Column(Integer, default=4)
    last_heartbeat = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    patient = relationship("Patient", back_populates="iot_devices")
    events = relationship("DispensingEvent", back_populates="device", cascade="all, delete-orphan")


class DispensingEvent(Base):
    __tablename__ = "dispensing_events"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("iot_devices.id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    medication_id = Column(Integer, ForeignKey("medications.id"), nullable=True)
    scheduled_time = Column(String(30), nullable=False) # YYYY-MM-DD HH:MM
    dispensed_time = Column(String(30), nullable=True)
    status = Column(String(50), default="dispensed") # dispensed, missed, late, jammed
    dose_taken = Column(Boolean, default=True)
    compartment_number = Column(Integer, default=1)
    telemetry_notes = Column(String(255), nullable=True) # Temperature, door sensor, battery level
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    device = relationship("IoTDevice", back_populates="events")
    patient = relationship("Patient", back_populates="dispensing_events")
    medication = relationship("Medication")


class DrugInteraction(Base):
    __tablename__ = "drug_interactions"

    id = Column(Integer, primary_key=True, index=True)
    medication_a_id = Column(Integer, ForeignKey("medications.id"), nullable=False)
    medication_b_id = Column(Integer, ForeignKey("medications.id"), nullable=False)
    severity_level = Column(String(50), nullable=False) # minor, moderate, major, contraindicated
    interaction_mechanism = Column(Text, nullable=False)
    clinical_recommendation = Column(Text, nullable=False)
    evidence_source = Column(String(100), default="FDA Package Insert / Lexicomp Demo")

    # Relationships
    medication_a = relationship("Medication", foreign_keys=[medication_a_id])
    medication_b = relationship("Medication", foreign_keys=[medication_b_id])


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Nullable for system-wide / role notifications
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    alert_type = Column(String(50), default="info") # info, warning, danger, success
    is_read = Column(Boolean, default=False)
    link = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="notifications")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user_email = Column(String(255), nullable=True)
    action = Column(String(100), nullable=False) # LOGIN, CREATE_PATIENT, SUBMIT_ADR, REVIEW_SAFETY, etc.
    entity_type = Column(String(100), nullable=False) # Patient, AdverseEventReport, User, Medication
    entity_id = Column(String(50), nullable=True)
    ip_address = Column(String(100), nullable=True)
    details = Column(Text, nullable=True) # JSON or descriptive string
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="audit_logs")
