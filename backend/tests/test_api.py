import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "PharmaCare AI" in data["service"]

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "safety_notice" in response.json()

def test_auth_login_all_roles():
    roles_credentials = [
        ("admin@pharmacare.ai", "Admin@12345", "admin"),
        ("doctor@pharmacare.ai", "Doctor@12345", "doctor"),
        ("pharmacist@pharmacare.ai", "Pharm@12345", "pharmacist"),
        ("researcher@pharmacare.ai", "Research@12345", "researcher"),
        ("patient@pharmacare.ai", "Patient@12345", "patient"),
    ]
    for email, password, expected_role in roles_credentials:
        response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
        assert response.status_code == 200, f"Login failed for {email}: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == expected_role

def test_auth_me():
    # Login as doctor
    res = client.post("/api/v1/auth/login", json={"email": "doctor@pharmacare.ai", "password": "Doctor@12345"})
    token = res.json()["access_token"]

    response = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    user_info = response.json()
    assert user_info["email"] == "doctor@pharmacare.ai"
    assert user_info["role"] == "doctor"

def test_patients_list_and_profile():
    # Login as doctor
    res = client.post("/api/v1/auth/login", json={"email": "doctor@pharmacare.ai", "password": "Doctor@12345"})
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # List
    response = client.get("/api/v1/patients/", headers=headers)
    assert response.status_code == 200
    patients = response.json()
    assert len(patients) >= 5
    p1 = patients[0]

    # Detail Profile
    prof_res = client.get(f"/api/v1/patients/{p1['id']}", headers=headers)
    assert prof_res.status_code == 200
    profile_data = prof_res.json()
    assert "patient" in profile_data
    assert "medications" in profile_data
    assert "adherence" in profile_data

    # Timeline
    tl_res = client.get(f"/api/v1/patients/{p1['id']}/timeline", headers=headers)
    assert tl_res.status_code == 200
    assert isinstance(tl_res.json(), list)

def test_medications_and_interactions():
    res = client.post("/api/v1/auth/login", json={"email": "pharmacist@pharmacare.ai", "password": "Pharm@12345"})
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # List
    meds_res = client.get("/api/v1/medications/", headers=headers)
    assert meds_res.status_code == 200
    meds = meds_res.json()
    assert len(meds) >= 8

    # Interaction check between Lisinopril and Spironolactone
    lisinopril = next((m for m in meds if "Lisinopril" in m["generic_name"]), None)
    spironolactone = next((m for m in meds if "Spironolactone" in m["generic_name"]), None)
    assert lisinopril is not None
    assert spironolactone is not None

    inter_res = client.get(
        f"/api/v1/medications/interactions/check?medication_ids={lisinopril['id']}&medication_ids={spironolactone['id']}",
        headers=headers
    )
    assert inter_res.status_code == 200
    interactions = inter_res.json()
    assert len(interactions) >= 1
    assert interactions[0]["severity_level"] == "major"
    assert "hyperkalemia" in interactions[0]["interaction_mechanism"].lower()

def test_adr_reporting_and_review():
    # Login as doctor
    res = client.post("/api/v1/auth/login", json={"email": "doctor@pharmacare.ai", "password": "Doctor@12345"})
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # List ADRs
    adr_res = client.get("/api/v1/adr/", headers=headers)
    assert adr_res.status_code == 200
    adrs = adr_res.json()
    assert len(adrs) >= 5

    # Submit new ADR
    new_adr_payload = {
        "patient_id": 1,
        "suspected_medication_id": 1,
        "reaction_category": "Dermatological",
        "reaction_description": "Urticarial rash appearing on bilateral forearms 2 hours post dose.",
        "severity": "mild",
        "onset_date": "2024-02-01",
        "outcome": "ongoing"
    }
    create_res = client.post("/api/v1/adr/", json=new_adr_payload, headers=headers)
    assert create_res.status_code == 200
    created_adr = create_res.json()
    assert created_adr["status"] == "pending"

    # Review the newly created ADR
    review_payload = {
        "report_id": created_adr["id"],
        "causality_assessment": "probable",
        "action_taken": "dose_adjusted",
        "review_notes": "Allergic cutaneous reaction. Antihistamine prescribed and dose temporarily withheld."
    }
    rev_res = client.post(f"/api/v1/adr/{created_adr['id']}/review", json=review_payload, headers=headers)
    assert rev_res.status_code == 200
    review_data = rev_res.json()
    assert review_data["causality_assessment"] == "probable"

def test_ai_ml_endpoints():
    res = client.post("/api/v1/auth/login", json={"email": "researcher@pharmacare.ai", "password": "Research@12345"})
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Predict Risk
    pred_payload = {
        "age": 72,
        "gender": "Male",
        "primary_condition": "Hypertension & T2D",
        "medication_count": 6,
        "medication_class": "ACE Inhibitor",
        "has_diabetes": True,
        "has_renal_impairment": True
    }
    pred_res = client.post("/api/v1/ml/predict-risk", json=pred_payload, headers=headers)
    assert pred_res.status_code == 200
    pred = pred_res.json()
    assert "risk_score" in pred
    assert "risk_level" in pred
    assert "feature_importance" in pred
    assert "ACADEMIC DECISION-SUPPORT PROTOTYPE ONLY" in pred["clinical_disclaimer"]

    # Safety signals
    signals_res = client.get("/api/v1/ml/signals", headers=headers)
    assert signals_res.status_code == 200
    signals = signals_res.json()
    assert isinstance(signals, list)

    # Cohort metrics
    metrics_res = client.get("/api/v1/ml/cohort-metrics", headers=headers)
    assert metrics_res.status_code == 200
    metrics = metrics_res.json()
    assert "total_cohort_patients" in metrics
    assert "category_distribution" in metrics
    assert "polypharmacy_distribution" in metrics

def test_iot_endpoints():
    res = client.post("/api/v1/auth/login", json={"email": "doctor@pharmacare.ai", "password": "Doctor@12345"})
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Devices
    dev_res = client.get("/api/v1/iot/devices", headers=headers)
    assert dev_res.status_code == 200
    devices = dev_res.json()
    assert len(devices) >= 2

    # Ingest dispensing event
    dispense_payload = {
        "device_serial": devices[0]["device_serial"],
        "patient_id": 1,
        "medication_id": 1,
        "scheduled_time": "2024-02-15 08:00",
        "dispensed_time": "2024-02-15 08:02",
        "status": "dispensed",
        "dose_taken": True,
        "compartment_number": 1,
        "telemetry_notes": "Auto test event"
    }
    ev_res = client.post("/api/v1/iot/dispense", json=dispense_payload)
    assert ev_res.status_code == 200
    assert ev_res.json()["status"] == "dispensed"

    # Simulate
    sim_res = client.post("/api/v1/iot/simulate", json={"patient_id": 1, "status": "dispensed"}, headers=headers)
    assert sim_res.status_code == 200

def test_reports_and_admin():
    res = client.post("/api/v1/auth/login", json={"email": "admin@pharmacare.ai", "password": "Admin@12345"})
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Summary
    summary_res = client.get("/api/v1/reports/summary", headers=headers)
    assert summary_res.status_code == 200
    summary = summary_res.json()
    assert "kpi" in summary
    assert "monthly_trend" in summary

    # CSV Export
    csv_res = client.get("/api/v1/reports/adr/csv", headers=headers)
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.headers["content-type"]
    assert "Report Number,Patient MRN" in csv_res.text

    # PDF Export
    pdf_res = client.get("/api/v1/reports/adr/pdf", headers=headers)
    assert pdf_res.status_code == 200
    assert "application/pdf" in pdf_res.headers["content-type"]
    assert len(pdf_res.content) > 1000

    # Admin Users
    users_res = client.get("/api/v1/admin/users", headers=headers)
    assert users_res.status_code == 200
    assert len(users_res.json()) >= 5

    # Admin System Stats
    stats_res = client.get("/api/v1/admin/system-stats", headers=headers)
    assert stats_res.status_code == 200
    assert stats_res.json()["system_status"] == "Healthy / Operational"
