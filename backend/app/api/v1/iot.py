from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.database import get_db
from app.models.models import IoTDevice, DispensingEvent, Patient, Medication, User
from app.schemas.schemas import IoTDeviceCreate, IoTDeviceOut, DispensingEventCreate, DispensingEventOut
from app.services.iot_service import iot_service
from app.services.audit_service import log_activity
from app.api.deps import get_current_user, require_roles
from app.api.v1.websockets import ws_manager

router = APIRouter()

@router.get("/devices", response_model=List[IoTDeviceOut])
def list_devices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    devices = db.query(IoTDevice).order_by(desc(IoTDevice.last_heartbeat)).all()
    result = []
    for d in devices:
        p_name = d.patient.full_name if d.patient else "Unassigned"
        result.append(IoTDeviceOut(
            id=d.id,
            device_serial=d.device_serial,
            patient_id=d.patient_id,
            patient_name=p_name,
            model_name=d.model_name,
            status=d.status,
            battery_level=d.battery_level,
            firmware_version=d.firmware_version,
            compartment_count=d.compartment_count,
            last_heartbeat=d.last_heartbeat,
            created_at=d.created_at
        ))
    return result

@router.post("/devices", response_model=IoTDeviceOut)
def register_device(
    device_in: IoTDeviceCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "pharmacist", "doctor"))
):
    existing = db.query(IoTDevice).filter(IoTDevice.device_serial == device_in.device_serial).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Device serial '{device_in.device_serial}' already registered")

    device = IoTDevice(
        device_serial=device_in.device_serial,
        patient_id=device_in.patient_id,
        model_name=device_in.model_name,
        compartment_count=device_in.compartment_count
    )
    db.add(device)
    db.commit()
    db.refresh(device)

    log_activity(
        db,
        action="REGISTER_IOT_DEVICE",
        entity_type="IoTDevice",
        entity_id=str(device.id),
        user_id=current_user.id,
        user_email=current_user.email,
        ip_address=request.client.host if request.client else None,
        details=f"Registered device {device.device_serial}"
    )

    p_name = device.patient.full_name if device.patient else "Unassigned"
    return IoTDeviceOut(
        id=device.id,
        device_serial=device.device_serial,
        patient_id=device.patient_id,
        patient_name=p_name,
        model_name=device.model_name,
        status=device.status,
        battery_level=device.battery_level,
        firmware_version=device.firmware_version,
        compartment_count=device.compartment_count,
        last_heartbeat=device.last_heartbeat,
        created_at=device.created_at
    )

@router.post("/dispense", response_model=DispensingEventOut)
async def record_dispensing_event(
    event_in: DispensingEventCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    API endpoint for IoT smart dispensers to report dose events.
    """
    event = iot_service.process_dispensing_event(
        db=db,
        device_serial=event_in.device_serial,
        patient_id=event_in.patient_id,
        medication_id=event_in.medication_id,
        scheduled_time=event_in.scheduled_time,
        dispensed_time=event_in.dispensed_time,
        status=event_in.status,
        dose_taken=event_in.dose_taken,
        compartment_number=event_in.compartment_number,
        telemetry_notes=event_in.telemetry_notes
    )

    # Broadcast to real-time stream
    ws_payload = {
        "type": "iot_dispense_event",
        "data": {
            "event_id": event.id,
            "device_serial": event_in.device_serial,
            "patient_id": event.patient_id,
            "patient_name": event.patient.full_name if event.patient else "Patient",
            "medication": event.medication.brand_name if event.medication else "Scheduled Med",
            "status": event.status,
            "dose_taken": event.dose_taken,
            "timestamp": event.dispensed_time
        }
    }
    background_tasks.add_task(ws_manager.broadcast, ws_payload)

    return DispensingEventOut(
        id=event.id,
        device_id=event.device_id,
        patient_id=event.patient_id,
        patient_name=event.patient.full_name if event.patient else "Patient",
        medication_id=event.medication_id,
        medication_name=event.medication.generic_name if event.medication else "Medication",
        scheduled_time=event.scheduled_time,
        dispensed_time=event.dispensed_time,
        status=event.status,
        dose_taken=event.dose_taken,
        compartment_number=event.compartment_number,
        telemetry_notes=event.telemetry_notes,
        created_at=event.created_at
    )

@router.get("/events", response_model=List[DispensingEventOut])
def list_dispensing_events(
    patient_id: Optional[int] = None,
    device_id: Optional[int] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(DispensingEvent)
    if patient_id:
        query = query.filter(DispensingEvent.patient_id == patient_id)
    if device_id:
        query = query.filter(DispensingEvent.device_id == device_id)

    events = query.order_by(desc(DispensingEvent.created_at)).limit(limit).all()
    result = []
    for e in events:
        result.append(DispensingEventOut(
            id=e.id,
            device_id=e.device_id,
            patient_id=e.patient_id,
            patient_name=e.patient.full_name if e.patient else "Patient",
            medication_id=e.medication_id,
            medication_name=e.medication.generic_name if e.medication else "Medication",
            scheduled_time=e.scheduled_time,
            dispensed_time=e.dispensed_time,
            status=e.status,
            dose_taken=e.dose_taken,
            compartment_number=e.compartment_number,
            telemetry_notes=e.telemetry_notes,
            created_at=e.created_at
        ))
    return result

@router.post("/simulate")
async def simulate_iot_events(
    simulation_data: dict,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Simulation utility to generate realistic dispensing events on demand.
    """
    patient_id = simulation_data.get("patient_id", 1)
    status_type = simulation_data.get("status", "dispensed") # dispensed, missed, late, jammed
    dose_taken = simulation_data.get("dose_taken", True if status_type == "dispensed" else False)

    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        patient = db.query(Patient).first()
        if not patient:
            raise HTTPException(status_code=400, detail="No patients available for simulation")
        patient_id = patient.id

    device = db.query(IoTDevice).filter(IoTDevice.patient_id == patient_id).first()
    serial = device.device_serial if device else "IOT-DISP-SIM-01"

    med = db.query(Medication).first()
    med_id = med.id if med else None

    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M")

    event = iot_service.process_dispensing_event(
        db=db,
        device_serial=serial,
        patient_id=patient_id,
        medication_id=med_id,
        scheduled_time=now_str,
        dispensed_time=now_str if status_type != "missed" else None,
        status=status_type,
        dose_taken=dose_taken,
        compartment_number=1,
        telemetry_notes=f"Simulated Trigger: Temp: 22.1°C, Battery: 91%, Status: {status_type}"
    )

    ws_payload = {
        "type": "iot_dispense_event",
        "data": {
            "event_id": event.id,
            "device_serial": serial,
            "patient_id": patient_id,
            "patient_name": patient.full_name,
            "medication": med.brand_name if med else "Scheduled Med",
            "status": status_type,
            "dose_taken": dose_taken,
            "timestamp": now_str
        }
    }
    background_tasks.add_task(ws_manager.broadcast, ws_payload)

    return {
        "message": f"Simulated {status_type} event generated for patient {patient.full_name}",
        "event_id": event.id,
        "device_serial": serial
    }
