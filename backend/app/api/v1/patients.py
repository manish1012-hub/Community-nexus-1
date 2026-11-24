from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from app.core.database import get_db
from app.models.models import Patient, PatientMedication, AdverseEventReport, User, DispensingEvent
from app.schemas.schemas import PatientCreate, PatientUpdate, PatientOut
from app.api.deps import get_current_user, require_roles
from app.services.audit_service import log_activity
from app.services.iot_service import iot_service

router = APIRouter()

@router.get("/", response_model=List[PatientOut])
def list_patients(
    search: Optional[str] = None,
    condition: Optional[str] = None,
    include_archived: bool = False,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Role-based restriction: Patient role can only see their own record
    if current_user.role == "patient":
        if not current_user.patient_profile:
            return []
        query = db.query(Patient).filter(Patient.id == current_user.patient_profile.id)
    else:
        query = db.query(Patient)
        if not include_archived:
            query = query.filter(Patient.is_archived == False)

        # Doctors see assigned patients first or can view all in primary care setting
        if current_user.role == "doctor" and False: # Optional filter if strict assignment
            query = query.filter(Patient.assigned_doctor_id == current_user.id)

        if search:
            search_clean = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Patient.full_name.ilike(search_clean),
                    Patient.mrn.ilike(search_clean),
                    Patient.primary_condition.ilike(search_clean)
                )
            )

        if condition:
            query = query.filter(Patient.primary_condition == condition)

    patients = query.order_by(desc(Patient.created_at)).offset(skip).limit(limit).all()

    result = []
    for p in patients:
        active_meds = db.query(PatientMedication).filter(
            PatientMedication.patient_id == p.id,
            PatientMedication.status == "active"
        ).count()
        adr_count = db.query(AdverseEventReport).filter(
            AdverseEventReport.patient_id == p.id
        ).count()
        
        doc_name = p.assigned_doctor.full_name if p.assigned_doctor else None

        result.append(PatientOut(
            id=p.id,
            user_id=p.user_id,
            mrn=p.mrn,
            full_name=p.full_name,
            date_of_birth=p.date_of_birth,
            gender=p.gender,
            contact_phone=p.contact_phone,
            email=p.email,
            primary_condition=p.primary_condition,
            comorbidities=p.comorbidities,
            allergies=p.allergies,
            medical_history=p.medical_history,
            blood_group=p.blood_group,
            assigned_doctor_id=p.assigned_doctor_id,
            assigned_doctor_name=doc_name,
            is_archived=p.is_archived,
            active_medications_count=active_meds,
            adverse_reports_count=adr_count,
            created_at=p.created_at,
            updated_at=p.updated_at
        ))
    return result

@router.post("/", response_model=PatientOut)
def create_patient(
    patient_in: PatientCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "doctor"))
):
    # Check duplicate MRN
    existing = db.query(Patient).filter(Patient.mrn == patient_in.mrn).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Patient with MRN '{patient_in.mrn}' already exists")

    new_patient = Patient(**patient_in.dict())
    if not new_patient.assigned_doctor_id and current_user.role == "doctor":
        new_patient.assigned_doctor_id = current_user.id

    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)

    log_activity(
        db,
        action="CREATE_PATIENT",
        entity_type="Patient",
        entity_id=str(new_patient.id),
        user_id=current_user.id,
        user_email=current_user.email,
        ip_address=request.client.host if request.client else None,
        details=f"Registered patient {new_patient.full_name} ({new_patient.mrn})"
    )

    return PatientOut(
        id=new_patient.id,
        user_id=new_patient.user_id,
        mrn=new_patient.mrn,
        full_name=new_patient.full_name,
        date_of_birth=new_patient.date_of_birth,
        gender=new_patient.gender,
        contact_phone=new_patient.contact_phone,
        email=new_patient.email,
        primary_condition=new_patient.primary_condition,
        comorbidities=new_patient.comorbidities,
        allergies=new_patient.allergies,
        medical_history=new_patient.medical_history,
        blood_group=new_patient.blood_group,
        assigned_doctor_id=new_patient.assigned_doctor_id,
        is_archived=new_patient.is_archived,
        active_medications_count=0,
        adverse_reports_count=0,
        created_at=new_patient.created_at,
        updated_at=new_patient.updated_at
    )

@router.get("/{patient_id}")
def get_patient_profile(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Patient role can only view self
    if current_user.role == "patient":
        if not current_user.patient_profile or current_user.patient_profile.id != patient_id:
            raise HTTPException(status_code=403, detail="Unauthorized access to patient record")

    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Medications
    medications = db.query(PatientMedication).filter(
        PatientMedication.patient_id == patient.id
    ).order_by(desc(PatientMedication.created_at)).all()

    meds_list = []
    for m in medications:
        meds_list.append({
            "id": m.id,
            "medication_id": m.medication_id,
            "generic_name": m.medication.generic_name if m.medication else "",
            "brand_name": m.medication.brand_name if m.medication else "",
            "therapeutic_class": m.medication.therapeutic_class if m.medication else "",
            "dosage": m.dosage,
            "frequency": m.frequency,
            "route": m.route,
            "start_date": m.start_date,
            "end_date": m.end_date,
            "status": m.status,
            "notes": m.notes,
            "prescriber_name": m.prescriber.full_name if m.prescriber else None
        })

    # Adverse Reports
    adrs = db.query(AdverseEventReport).filter(
        AdverseEventReport.patient_id == patient.id
    ).order_by(desc(AdverseEventReport.created_at)).all()

    adr_list = []
    for a in adrs:
        adr_list.append({
            "id": a.id,
            "report_number": a.report_number,
            "suspected_medication": a.suspected_medication.generic_name if a.suspected_medication else "Unknown",
            "reaction_category": a.reaction_category,
            "reaction_description": a.reaction_description,
            "severity": a.severity,
            "onset_date": a.onset_date,
            "status": a.status,
            "outcome": a.outcome,
            "created_at": a.created_at
        })

    # IoT Adherence
    adherence = iot_service.calculate_adherence(db, patient.id)

    return {
        "patient": {
            "id": patient.id,
            "mrn": patient.mrn,
            "full_name": patient.full_name,
            "date_of_birth": patient.date_of_birth,
            "gender": patient.gender,
            "contact_phone": patient.contact_phone,
            "email": patient.email,
            "primary_condition": patient.primary_condition,
            "comorbidities": patient.comorbidities,
            "allergies": patient.allergies,
            "medical_history": patient.medical_history,
            "blood_group": patient.blood_group,
            "assigned_doctor_name": patient.assigned_doctor.full_name if patient.assigned_doctor else "Unassigned",
            "is_archived": patient.is_archived,
            "created_at": patient.created_at
        },
        "medications": meds_list,
        "adverse_reports": adr_list,
        "adherence": adherence
    }

@router.put("/{patient_id}")
def update_patient(
    patient_id: int,
    patient_update: PatientUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "doctor"))
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    update_data = patient_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(patient, field, value)

    db.commit()
    db.refresh(patient)

    log_activity(
        db,
        action="UPDATE_PATIENT",
        entity_type="Patient",
        entity_id=str(patient.id),
        user_id=current_user.id,
        user_email=current_user.email,
        ip_address=request.client.host if request.client else None,
        details=f"Updated patient data: {list(update_data.keys())}"
    )

    return {"message": "Patient profile updated successfully"}

@router.get("/{patient_id}/timeline")
def get_patient_timeline(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    events = []

    # Medication start events
    meds = db.query(PatientMedication).filter(PatientMedication.patient_id == patient_id).all()
    for m in meds:
        events.append({
            "type": "medication_started",
            "date": m.start_date,
            "title": f"Started {m.medication.brand_name} ({m.medication.generic_name})",
            "description": f"Dosage: {m.dosage}, Frequency: {m.frequency}, Status: {m.status}",
            "severity": "info"
        })

    # ADR events
    adrs = db.query(AdverseEventReport).filter(AdverseEventReport.patient_id == patient_id).all()
    for a in adrs:
        events.append({
            "type": "adverse_reaction",
            "date": a.onset_date,
            "title": f"Reported ADR: {a.reaction_category} ({a.severity.capitalize()})",
            "description": f"Suspected: {a.suspected_medication.generic_name if a.suspected_medication else 'Unknown'} — {a.reaction_description}",
            "severity": "danger" if a.severity in ["severe", "life_threatening"] else "warning"
        })

    # IoT events (latest 10)
    dispensing = db.query(DispensingEvent).filter(
        DispensingEvent.patient_id == patient_id
    ).order_by(desc(DispensingEvent.created_at)).limit(10).all()
    for d in dispensing:
        events.append({
            "type": "iot_dispensed",
            "date": d.scheduled_time[:10] if len(d.scheduled_time) >= 10 else "Recent",
            "title": f"IoT Smart Dispenser: {d.status.capitalize()}",
            "description": f"Dose taken: {d.dose_taken}, Compartment: {d.compartment_number}",
            "severity": "success" if d.status == "dispensed" else "danger"
        })

    # Sort events by date descending
    events.sort(key=lambda x: str(x["date"]), reverse=True)
    return events
