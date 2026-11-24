from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
from app.core.config import settings
from app.core.database import Base, engine
from app.api.v1 import auth, patients, medications, adr, ml, iot, reports, admin, websockets

# Initialize tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Real-Time Pharmacoepidemiology System for Improved Patient Care. Academic Healthcare Prototype.",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(patients.router, prefix=f"{settings.API_V1_STR}/patients", tags=["Patient Management"])
app.include_router(medications.router, prefix=f"{settings.API_V1_STR}/medications", tags=["Medications Formulary"])
app.include_router(adr.router, prefix=f"{settings.API_V1_STR}/adr", tags=["Adverse Drug Reaction Monitoring"])
app.include_router(ml.router, prefix=f"{settings.API_V1_STR}/ml", tags=["AI/ML Analytics & Pharmacovigilance"])
app.include_router(iot.router, prefix=f"{settings.API_V1_STR}/iot", tags=["IoT Smart Dispenser Integration"])
app.include_router(reports.router, prefix=f"{settings.API_V1_STR}/reports", tags=["Reports & Analytics"])
app.include_router(admin.router, prefix=f"{settings.API_V1_STR}/admin", tags=["Admin & Audit Logs"])
app.include_router(websockets.router, prefix="/ws", tags=["Real-Time WebSockets"])

@app.get("/health", tags=["System Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "mode": "Demonstration & Clinical Surveillance Research"
    }

# Check if frontend production dist directory exists
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../frontend/dist"))
if not os.path.exists(frontend_dist):
    frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/dist"))

if os.path.exists(frontend_dist):
    # Mount static assets
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_frontend(full_path: str):
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
else:
    @app.get("/", tags=["Root"])
    def root():
        return {
            "message": f"Welcome to {settings.PROJECT_NAME} API",
            "documentation": "/docs",
            "api_version": settings.VERSION,
            "safety_notice": "Academic Decision-Support Prototype. All medical records are synthetic for educational simulation."
        }
