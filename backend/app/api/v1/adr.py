from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from app.core.database import get_db
from app.models.models import AdverseEventReport, SafetyReview, Patient, Medication, User, Notification
from app.schemas.schemas import ADRCreate, ADRUpdate, ADROut, SafetyReviewCreate, SafetyReviewOut
from app.api.deps import get_current_user, require_roles
from app.services.audit_service import log_activity
from app.api.v1.websockets import ws_manager

router = APIRouter()

@router.get("/", response_model=List[ADROut])
def list_adr_reports(
    severity: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    reaction_category: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(AdverseEventReport)

    # Patient can only view their own reports
    if current_user.role == "patient":
        if not current_user.patient_profile:
            return []
        query = query.filter(AdverseEventReport.patient_id == current_user.patient_profile.id)

    if severity:
        query = query.filter(AdverseEventReport.severity == severity)
    if status_filter:
        query = query.filter(AdverseEventReport.status == status_filter)
    if reaction_category:
        query = query.filter(AdverseEventReport.reaction_category == reaction_category)

    if search:
        s = f"%{search.strip()}%"
        query = query.join(Patient).join(Medication).filter(
            or_(
                AdverseEventReport.report_number.ilike(s),
                AdverseEventReport.reaction_description.ilike(s),
                Patient.full_name.ilike(s),
                Patient.mrn.ilike(s),
                Medication.generic_name.ilike(s),
                Medication.brand_name.ilike(s)
            )
        )

    reports = query.order_by(desc(AdverseEventReport.created_at)).offset(skip).limit(limit).all()

    result = []
    for r in reports:
        reviews = []
        for sr in r.safety_reviews:
            reviews.append(SafetyReviewOut(
                id=sr.id,
                report_id=sr.report_id,
                reviewer_id=sr.reviewer_id,
                reviewer_name=sr.reviewer.full_name if sr.reviewer else "Clinical Reviewer",
                causality_assessment=sr.causality_assessment,
                action_taken=sr.action_taken,
                review_notes=sr.review_notes,
                reviewed_at=sr.reviewed_at
            ))

        result.append(ADROut(
            id=r.id,
            report_number=r.report_number,
            patient_id=r.patient_id,
            patient_name=r.patient.full_name if r.patient else "Unknown",
            patient_mrn=r.patient.mrn if r.patient else "N/A",
            suspected_medication_id=r.suspected_medication_id,
            suspected_medication_name=f"{r.suspected_medication.brand_name} ({r.suspected_medication.generic_name})" if r.suspected_medication else "Unknown",
            reporter_id=r.reporter_id,
            reporter_name=r.reporter.full_name if r.reporter else "Self/Patient",
            reporter_type=r.reporter_type,
            reaction_category=r.reaction_category,
            reaction_description=r.reaction_description,
            severity=r.severity,
            onset_date=r.onset_date,
            outcome=r.outcome,
            status=r.status,
            is_synthetic=r.is_synthetic,
            created_at=r.created_at,
            safety_reviews=reviews
        ))
    return result

@router.post("/", response_model=ADROut)
async def submit_adr_report(
    adr_in: ADRCreate,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Determine reporter type
    reporter_type = current_user.role if current_user.role in ["doctor", "pharmacist"] else "patient"
    patient_id = adr_in.patient_id

    # If patient role, enforce own patient_id
    if current_user.role == "patient":
        if not current_user.patient_profile:
            raise HTTPException(status_code=400, detail="User does not have an active patient record")
        patient_id = current_user.patient_profile.id

    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient record not found")

    med = db.query(Medication).filter(Medication.id == adr_in.suspected_medication_id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Suspected medication record not found")

    count = db.query(AdverseEventReport).count() + 1
    report_number = f"ADR-2024-{count:05d}"

    report = AdverseEventReport(
        report_number=report_number,
        patient_id=patient.id,
        suspected_medication_id=med.id,
        reporter_id=current_user.id,
        reporter_type=reporter_type,
        reaction_category=adr_in.reaction_category,
        reaction_description=adr_in.reaction_description,
        severity=adr_in.severity,
        onset_date=adr_in.onset_date,
        outcome=adr_in.outcome,
        status="pending",
        is_synthetic=False
    )
    db.add(report)

    # Create safety notification
    notif = Notification(
        title=f"New ADR Alert: {med.generic_name}",
        message=f"Severe/Adverse reaction ({adr_in.severity.upper()}) reported for patient {patient.mrn}: {adr_in.reaction_description[:80]}...",
        alert_type="danger" if adr_in.severity in ["severe", "life_threatening"] else "warning",
        link="/adr-monitoring"
    )
    db.add(notif)
    db.commit()
    db.refresh(report)

    log_activity(
        db,
        action="SUBMIT_ADR",
        entity_type="AdverseEventReport",
        entity_id=str(report.id),
        user_id=current_user.id,
        user_email=current_user.email,
        ip_address=request.client.host if request.client else None,
        details=f"Reported {report.reaction_category} for {med.generic_name} ({report.severity})"
    )

    # Real-time WebSocket broadcast
    ws_payload = {
        "type": "new_adr_report",
        "data": {
            "id": report.id,
            "report_number": report.report_number,
            "medication": med.generic_name,
            "patient_mrn": patient.mrn,
            "severity": report.severity,
            "reaction_category": report.reaction_category
        }
    }
    background_tasks.add_task(ws_manager.broadcast, ws_payload)

    return ADROut(
        id=report.id,
        report_number=report.report_number,
        patient_id=report.patient_id,
        patient_name=patient.full_name,
        patient_mrn=patient.mrn,
        suspected_medication_id=med.id,
        suspected_medication_name=f"{med.brand_name} ({med.generic_name})",
        reporter_id=current_user.id,
        reporter_name=current_user.full_name,
        reporter_type=report.reporter_type,
        reaction_category=report.reaction_category,
        reaction_description=report.reaction_description,
        severity=report.severity,
        onset_date=report.onset_date,
        outcome=report.outcome,
        status=report.status,
        is_synthetic=report.is_synthetic,
        created_at=report.created_at,
        safety_reviews=[]
    )

@router.post("/{report_id}/review", response_model=SafetyReviewOut)
async def submit_safety_review(
    report_id: int,
    review_in: SafetyReviewCreate,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "doctor", "pharmacist"))
):
    report = db.query(AdverseEventReport).filter(AdverseEventReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="ADR report not found")

    review = SafetyReview(
        report_id=report.id,
        reviewer_id=current_user.id,
        causality_assessment=review_in.causality_assessment,
        action_taken=review_in.action_taken,
        review_notes=review_in.review_notes
    )
    db.add(review)

    # Mark report status as reviewed
    report.status = "reviewed"
    db.commit()
    db.refresh(review)

    log_activity(
        db,
        action="REVIEW_SAFETY",
        entity_type="SafetyReview",
        entity_id=str(review.id),
        user_id=current_user.id,
        user_email=current_user.email,
        ip_address=request.client.host if request.client else None,
        details=f"Assessed causality as '{review.causality_assessment}', action: '{review.action_taken}'"
    )

    ws_payload = {
        "type": "safety_review_completed",
        "data": {
            "report_id": report.id,
            "report_number": report.report_number,
            "reviewer": current_user.full_name,
            "causality": review.causality_assessment
        }
    }
    background_tasks.add_task(ws_manager.broadcast, ws_payload)

    return SafetyReviewOut(
        id=review.id,
        report_id=review.report_id,
        reviewer_id=review.reviewer_id,
        reviewer_name=current_user.full_name,
        causality_assessment=review.causality_assessment,
        action_taken=review.action_taken,
        review_notes=review.review_notes,
        reviewed_at=review.reviewed_at
    )
