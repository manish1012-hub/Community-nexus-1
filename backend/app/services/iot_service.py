from datetime import datetime
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from app.models.models import IoTDevice, DispensingEvent, Patient, Medication

class IoTService:
    @staticmethod
    def process_dispensing_event(
        db: Session,
        device_serial: str,
        patient_id: int,
        medication_id: Optional[int],
        scheduled_time: str,
        dispensed_time: Optional[str] = None,
        status: str = "dispensed",
        dose_taken: bool = True,
        compartment_number: int = 1,
        telemetry_notes: Optional[str] = None
    ) -> DispensingEvent:
        # Locate or register device
        device = db.query(IoTDevice).filter(IoTDevice.device_serial == device_serial).first()
        if not device:
            device = IoTDevice(
                device_serial=device_serial,
                patient_id=patient_id,
                status="online",
                battery_level=94,
                last_heartbeat=datetime.utcnow()
            )
            db.add(device)
            db.commit()
            db.refresh(device)
        else:
            device.last_heartbeat = datetime.utcnow()
            if status == "jammed" or status == "error":
                device.status = "error"
            else:
                device.status = "online"
            db.commit()

        event = DispensingEvent(
            device_id=device.id,
            patient_id=patient_id,
            medication_id=medication_id,
            scheduled_time=scheduled_time,
            dispensed_time=dispensed_time or datetime.utcnow().strftime("%Y-%m-%d %H:%M"),
            status=status,
            dose_taken=dose_taken,
            compartment_number=compartment_number,
            telemetry_notes=telemetry_notes or f"Temp: 21.4°C, Humidity: 42%, Battery: {device.battery_level}%"
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        return event

    @staticmethod
    def calculate_adherence(db: Session, patient_id: int) -> Dict[str, Any]:
        events = db.query(DispensingEvent).filter(DispensingEvent.patient_id == patient_id).all()
        if not events:
            return {"total_events": 0, "adherence_percentage": 100.0, "status": "No Events Recorded"}

        total = len(events)
        taken = sum(1 for e in events if e.status == "dispensed" and e.dose_taken)
        missed = sum(1 for e in events if e.status == "missed")
        late = sum(1 for e in events if e.status == "late")
        rate = round((taken / total) * 100, 1)

        return {
            "total_events": total,
            "taken_count": taken,
            "missed_count": missed,
            "late_count": late,
            "adherence_percentage": rate,
            "status": "Optimal (>90%)" if rate >= 90 else "Sub-optimal (<90%)"
        }

iot_service = IoTService()
