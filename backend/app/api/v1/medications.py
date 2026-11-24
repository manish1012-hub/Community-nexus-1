from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from app.core.database import get_db
from app.models.models import Medication, PatientMedication, DrugInteraction, Patient, User
from app.schemas.schemas import MedicationCreate, MedicationOut, PatientMedicationCreate, PatientMedicationOut, DrugInteractionOut
from app.api.deps import get_current_user, require_roles
from app.services.audit_service import log_activity

router = APIRouter()

@router.get("/", response_model=List[MedicationOut])
def list_medications(
    search: Optional[str] = None,
    therapeutic_class: Optional[str] = None,
    is_active: Optional[bool] = True,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(Medication)
    if is_active is not None:
        query = query.filter(Medication.is_active == is_active)
    if therapeutic_class:
        query = query.filter(Medication.therapeutic_class == therapeutic_class)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Medication.generic_name.ilike(s),
                Medication.brand_name.ilike(s),
                Medication.code.ilike(s),
                Medication.therapeutic_class.ilike(s)
            )
        )
    return query.order_by(Medication.generic_name).offset(skip).limit(limit).all()

@router.post("/", response_model=MedicationOut)
def create_medication(
    med_in: MedicationCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "pharmacist"))
):
    existing = db.query(Medication).filter(Medication.code == med_in.code).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Medication code '{med_in.code}' already exists")

    new_med = Medication(**med_in.dict())
    db.add(new_med)
    db.commit()
    db.refresh(new_med)

    log_activity(
        db,
        action="CREATE_MEDICATION",
        entity_type="Medication",
        entity_id=str(new_med.id),
        user_id=current_user.id,
        user_email=current_user.email,
        ip_address=request.client.host if request.client else None,
        details=f"Added {new_med.generic_name} ({new_med.brand_name}) to formulary"
    )

    return new_med

@router.get("/interactions/check", response_model=List[DrugInteractionOut])
def check_drug_interactions(
    medication_ids: List[int] = Query(..., description="List of medication IDs to check for pairwise interactions"),
    db: Session = Depends(get_db)
):
    if len(medication_ids) < 2:
        return []

    interactions = db.query(DrugInteraction).filter(
        or_(
            DrugInteraction.medication_a_id.in_(medication_ids) & DrugInteraction.medication_b_id.in_(medication_ids)
        )
    ).all()

    result = []
    for inter in interactions:
        result.append(DrugInteractionOut(
            id=inter.id,
            medication_a_id=inter.medication_a_id,
            medication_a_name=inter.medication_a.generic_name if inter.medication_a else "Drug A",
            medication_b_id=inter.medication_b_id,
            medication_b_name=inter.medication_b.generic_name if inter.medication_b else "Drug B",
            severity_level=inter.severity_level,
            interaction_mechanism=inter.interaction_mechanism,
            clinical_recommendation=inter.clinical_recommendation,
            evidence_source=inter.evidence_source
        ))
    return result

@router.post("/prescribe", response_model=PatientMedicationOut)
def prescribe_medication(
    presc_in: PatientMedicationCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "doctor", "pharmacist"))
):
    patient = db.query(Patient).filter(Patient.id == presc_in.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    med = db.query(Medication).filter(Medication.id == presc_in.medication_id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found")

    # Check for active interactions with patient's existing active medications
    active_med_ids = [
        pm.medication_id for pm in db.query(PatientMedication).filter(
            PatientMedication.patient_id == patient.id,
            PatientMedication.status == "active"
        ).all()
    ]
    if active_med_ids:
        # Check if new med clashes with any active
        conflict = db.query(DrugInteraction).filter(
            or_(
                (DrugInteraction.medication_a_id == med.id) & (DrugInteraction.medication_b_id.in_(active_med_ids)),
                (DrugInteraction.medication_b_id == med.id) & (DrugInteraction.medication_a_id.in_(active_med_ids))
            )
        ).first()
        # We record prescription, but can annotate notes if serious conflict exists
        if conflict and conflict.severity_level in ["major", "contraindicated"]:
            warning_note = f"[ALERT: Documented {conflict.severity_level.upper()} interaction with current regimen: {conflict.clinical_recommendation}]"
            presc_in.notes = f"{presc_in.notes or ''} {warning_note}".strip()

    prescription = PatientMedication(
        patient_id=presc_in.patient_id,
        medication_id=presc_in.medication_id,
        prescribed_by_id=current_user.id,
        dosage=presc_in.dosage,
        frequency=presc_in.frequency,
        route=presc_in.route,
        start_date=presc_in.start_date,
        end_date=presc_in.end_date,
        status=presc_in.status,
        notes=presc_in.notes
    )
    db.add(prescription)
    db.commit()
    db.refresh(prescription)

    log_activity(
        db,
        action="PRESCRIBE_MEDICATION",
        entity_type="PatientMedication",
        entity_id=str(prescription.id),
        user_id=current_user.id,
        user_email=current_user.email,
        ip_address=request.client.host if request.client else None,
        details=f"Prescribed {med.generic_name} to patient {patient.mrn}"
    )

    return PatientMedicationOut(
        id=prescription.id,
        patient_id=prescription.patient_id,
        medication_id=prescription.medication_id,
        prescribed_by_id=prescription.prescribed_by_id,
        dosage=prescription.dosage,
        frequency=prescription.frequency,
        route=prescription.route,
        start_date=prescription.start_date,
        end_date=prescription.end_date,
        status=prescription.status,
        notes=prescription.notes,
        created_at=prescription.created_at,
        medication=MedicationOut.from_orm(med),
        prescriber_name=current_user.full_name
    )

@router.put("/prescriptions/{prescription_id}/status")
def update_prescription_status(
    prescription_id: int,
    status_update: dict,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "doctor", "pharmacist"))
):
    presc = db.query(PatientMedication).filter(PatientMedication.id == prescription_id).first()
    if not presc:
        raise HTTPException(status_code=404, detail="Prescription not found")

    new_status = status_update.get("status")
    if new_status:
        presc.status = new_status
    if "notes" in status_update:
        presc.notes = status_update["notes"]
    
    db.commit()

    log_activity(
        db,
        action="UPDATE_PRESCRIPTION",
        entity_type="PatientMedication",
        entity_id=str(presc.id),
        user_id=current_user.id,
        user_email=current_user.email,
        ip_address=request.client.host if request.client else None,
        details=f"Status set to {new_status}"
    )

    return {"message": "Prescription status updated"}
