from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.domain import Assignment, Result, Synthesis, Client, AssessmentVersion, AssessmentTemplate
from sqlalchemy import desc, Integer
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/overview")
def get_dashboard_overview(db: Session = Depends(get_db)):
    """
    Returns data for Psychologist Dashboard: Stats, Alerts, and Recent Activity.
    """
    # 1. Weekly Stats (Simplified: just total counts for demo, usually filtered by last 7 days)
    total_assignments = db.query(Assignment).count()
    completed = db.query(Assignment).filter(Assignment.status == "completed").count()
    
    # Critical alerts are Syntheses with severity >= 2
    critical_alerts_count = db.query(Synthesis).join(Result).join(Assignment)\
        .filter(Synthesis.deterministic_hits.op('->>')('max_severity').cast(Integer) >= 2).count()

    # 2. Active Clinical Alerts (Recent high severity)
    # Joining all necessary tables to get Client Reference, Flag, Date
    alerts_query = db.query(Synthesis, Assignment, Client)\
        .join(Result, Synthesis.result_id == Result.id)\
        .join(Assignment, Result.assignment_id == Assignment.id)\
        .join(Client, Assignment.client_id == Client.id)\
        .filter(Synthesis.deterministic_hits.op('->>')('max_severity').cast(Integer) >= 1)\
        .order_by(desc(Synthesis.created_at)).limit(5).all()

    alerts_data = []
    for syn, ass, client in alerts_query:
        flags = syn.deterministic_hits.get("hits", [])
        primary_flag = flags[0] if flags else "Unknown Alert"
        
        alerts_data.append({
            "id": syn.id,
            "client": f"Client (Ref: {client.reference_id})",
            "clientId": client.id,
            "flag": primary_flag,
            "date": syn.created_at.strftime("%Y-%m-%d %H:%M"),
            "severity": syn.deterministic_hits.get("max_severity", 1)
        })

    # 3. Recent Assessments
    recent_query = db.query(Assignment, Client, AssessmentVersion, AssessmentTemplate)\
        .join(Client, Assignment.client_id == Client.id)\
        .join(AssessmentVersion, Assignment.version_id == AssessmentVersion.id)\
        .join(AssessmentTemplate, AssessmentVersion.template_id == AssessmentTemplate.id)\
        .order_by(desc(Assignment.created_at)).limit(5).all()

    recent_data = []
    for ass, client, ver, tpl in recent_query:
        # e.g. "PHQ-9 v1"
        test_name = f"{tpl.name} {ver.version_tag}"
        date_str = ass.completed_at.strftime("%Y-%m-%d") if ass.completed_at else ass.created_at.strftime("%Y-%m-%d")
        
        recent_data.append({
            "id": ass.id,
            "clientId": client.id,
            "client": f"Client (Ref: {client.reference_id})",
            "assessment": test_name,
            "status": ass.status.capitalize(),
            "date": date_str
        })

    return {
        "stats": {
            "sent": total_assignments,
            "completed": completed,
            "critical": critical_alerts_count
        },
        "alerts": alerts_data,
        "recent": recent_data
    }
