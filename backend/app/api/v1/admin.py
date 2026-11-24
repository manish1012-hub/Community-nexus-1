from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from app.core.database import get_db
from app.models.models import User, AuditLog, Patient, Medication, AdverseEventReport, IoTDevice, DispensingEvent
from app.schemas.schemas import UserOut, UserUpdate, AuditLogOut
from app.api.deps import require_roles, get_current_user
from app.services.audit_service import log_activity

router = APIRouter()

@router.get("/users", response_model=List[UserOut])
def list_users(
    search: Optional[str] = None,
    role: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin"))
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                User.email.ilike(s),
                User.full_name.ilike(s),
                User.specialty.ilike(s)
            )
        )
    return query.order_by(desc(User.created_at)).offset(skip).limit(limit).all()

@router.put("/users/{user_id}")
def update_user_status(
    user_id: int,
    user_update: UserUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin"))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == current_user.id and user_update.is_active is False:
        raise HTTPException(status_code=400, detail="Cannot deactivate own admin account")

    if user_update.role is not None:
        user.role = user_update.role
    if user_update.is_active is not None:
        user.is_active = user_update.is_active
    if user_update.specialty is not None:
        user.specialty = user_update.specialty
    if user_update.full_name is not None:
        user.full_name = user_update.full_name

    db.commit()
    db.refresh(user)

    log_activity(
        db,
        action="ADMIN_UPDATE_USER",
        entity_type="User",
        entity_id=str(user.id),
        user_id=current_user.id,
        user_email=current_user.email,
        ip_address=request.client.host if request.client else None,
        details=f"Admin updated user {user.email} (Role: {user.role}, Active: {user.is_active})"
    )

    return {"message": "User updated successfully"}

@router.get("/audit-logs", response_model=List[AuditLogOut])
def get_audit_logs(
    search: Optional[str] = None,
    action: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin"))
):
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action == action)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                AuditLog.action.ilike(s),
                AuditLog.user_email.ilike(s),
                AuditLog.entity_type.ilike(s),
                AuditLog.details.ilike(s)
            )
        )
    return query.order_by(desc(AuditLog.timestamp)).offset(skip).limit(limit).all()

@router.get("/system-stats")
def get_system_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin"))
):
    stats = {
        "users_count": db.query(User).count(),
        "patients_count": db.query(Patient).count(),
        "medications_count": db.query(Medication).count(),
        "adverse_reports_count": db.query(AdverseEventReport).count(),
        "iot_devices_count": db.query(IoTDevice).count(),
        "dispensing_events_count": db.query(DispensingEvent).count(),
        "audit_logs_count": db.query(AuditLog).count(),
        "database_engine": "SQLite / PostgreSQL Compatible",
        "system_status": "Healthy / Operational",
        "ml_engine_status": "Loaded (Scikit-Learn Random Forest)",
        "iot_gateway": "Active (HTTP & WebSocket Streaming)"
    }
    return stats
