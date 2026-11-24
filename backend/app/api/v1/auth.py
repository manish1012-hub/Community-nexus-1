from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token, decode_token
from app.models.models import User, Patient, UserRole
from app.schemas.schemas import UserCreate, UserLogin, Token, UserOut, UserUpdate
from app.api.deps import get_current_user
from app.services.audit_service import log_activity

router = APIRouter()

@router.post("/register", response_model=Token)
def register(user_in: UserCreate, request: Request, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists"
        )
    
    new_user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role,
        specialty=user_in.specialty
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # If registered as patient, automatically create matching patient record
    patient_id = None
    if new_user.role == UserRole.PATIENT:
        count = db.query(Patient).count() + 1
        mrn = f"PAT-2024-{count:04d}"
        new_patient = Patient(
            user_id=new_user.id,
            mrn=mrn,
            full_name=new_user.full_name,
            date_of_birth="1978-05-14",
            gender="Not Specified",
            email=new_user.email,
            primary_condition="Hypertension"
        )
        db.add(new_patient)
        db.commit()
        db.refresh(new_patient)
        patient_id = new_patient.id

    log_activity(
        db,
        action="USER_REGISTERED",
        entity_type="User",
        entity_id=str(new_user.id),
        user_id=new_user.id,
        user_email=new_user.email,
        ip_address=request.client.host if request.client else None,
        details=f"Registered with role {new_user.role}"
    )

    access_token = create_access_token(subject=new_user.id, role=new_user.role)
    refresh_token = create_refresh_token(subject=new_user.id)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "full_name": new_user.full_name,
            "role": new_user.role,
            "specialty": new_user.specialty,
            "patient_id": patient_id
        }
    }

@router.post("/login", response_model=Token)
def login(login_in: UserLogin, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_in.email).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is deactivated. Contact system administrator."
        )

    patient_id = user.patient_profile.id if user.patient_profile else None

    log_activity(
        db,
        action="USER_LOGIN",
        entity_type="User",
        entity_id=str(user.id),
        user_id=user.id,
        user_email=user.email,
        ip_address=request.client.host if request.client else None,
        details="Authentication successful"
    )

    access_token = create_access_token(subject=user.id, role=user.role)
    refresh_token = create_refresh_token(subject=user.id)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "specialty": user.specialty,
            "patient_id": patient_id
        }
    }

@router.post("/refresh", response_model=Token)
def refresh_token(token_data: dict, db: Session = Depends(get_db)):
    token = token_data.get("refresh_token")
    if not token:
        raise HTTPException(status_code=400, detail="Missing refresh token")
    
    payload = decode_token(token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User unavailable or deactivated")

    patient_id = user.patient_profile.id if user.patient_profile else None
    new_access = create_access_token(subject=user.id, role=user.role)
    new_refresh = create_refresh_token(subject=user.id)

    return {
        "access_token": new_access,
        "refresh_token": new_refresh,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "specialty": user.specialty,
            "patient_id": patient_id
        }
    }

@router.get("/me")
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    patient_id = current_user.patient_profile.id if current_user.patient_profile else None
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "specialty": current_user.specialty,
        "is_active": current_user.is_active,
        "patient_id": patient_id,
        "created_at": current_user.created_at
    }

@router.put("/me")
def update_profile(
    user_update: UserUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name
    if user_update.specialty is not None:
        current_user.specialty = user_update.specialty
    if user_update.password:
        current_user.hashed_password = get_password_hash(user_update.password)
    
    db.commit()
    db.refresh(current_user)

    log_activity(
        db,
        action="UPDATE_PROFILE",
        entity_type="User",
        entity_id=str(current_user.id),
        user_id=current_user.id,
        user_email=current_user.email,
        ip_address=request.client.host if request.client else None,
        details="User updated personal profile"
    )

    return {"message": "Profile updated successfully"}
