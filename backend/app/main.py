import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.endpoints import assessments, dashboard, auth, clients, admin

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Deterministic Psychological Screening Engine",
    version="1.0.0",
)

# CORS
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://digitalpsych-frontend.onrender.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=settings.API_V1_STR + "/auth", tags=["Authentication"])
app.include_router(assessments.router, prefix=settings.API_V1_STR, tags=["Assessments"])
app.include_router(dashboard.router, prefix=settings.API_V1_STR + "/dashboard", tags=["Dashboard"])
app.include_router(clients.router, prefix=settings.API_V1_STR + "/clients", tags=["Clients"])
app.include_router(admin.router, prefix=settings.API_V1_STR + "/admin", tags=["Admin"])

@app.get("/health")
def health_check():
    return {"status": "ok"}
