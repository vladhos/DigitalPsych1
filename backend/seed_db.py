import os
import sys

from app.db.session import SessionLocal, engine, Base
from app.models.domain import Organization, Client, AssessmentVersion, AssessmentTemplate, Rulepack, Rule, Assignment, Response, Result, FeatureVector, Synthesis, User, Role
from app.core.security import get_password_hash
import uuid
from datetime import datetime

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Check if already seeded
    if db.query(Organization).first():
        print("Database already seeded.")
        db.close()
        return

    print("Seeding database...")
    org = Organization(name="Default Clinic")
    db.add(org)
    db.commit()
    db.refresh(org)
    
    # Roles
    r_admin = Role(name="SuperAdmin", description="System Administrator")
    r_psych = Role(name="Psychologist", description="Standard App User")
    db.add(r_admin)
    db.add(r_psych)
    db.commit()
    db.refresh(r_admin)
    
    # User
    user = User(
        email="admin@digitalpsych.com",
        hashed_password=get_password_hash("admin123"),
        organization_id=org.id,
        role_id=r_admin.id,
        is_active=True
    )
    db.add(user)
    db.commit()
    
    # 2 Clients
    c1 = Client(organization_id=org.id, reference_id="Pat-001 (A.)")
    c2 = Client(organization_id=org.id, reference_id="Pat-002 (B.)")
    db.add(c1)
    db.add(c2)
    db.commit()
    
    # Assessment & Version
    template = AssessmentTemplate(name="PHQ-9", description="Patient Health Questionnaire (Depression)")
    db.add(template)
    db.commit()
    db.refresh(template)
    
    schema = {
        "items": [
            {"id": "q1", "text": "Little interest or pleasure in doing things?", "type": "likert", "scale_id": "DEP", "weight": 1.0, "options": [
                {"value": 0, "label": "Not at all"},
                {"value": 1, "label": "Several days"},
                {"value": 2, "label": "More than half the days"},
                {"value": 3, "label": "Nearly every day"}
            ]},
            {"id": "q2", "text": "Feeling down, depressed, or hopeless?", "type": "likert", "scale_id": "DEP", "weight": 1.0, "options": [
                 {"value": 0, "label": "Not at all"},
                 {"value": 1, "label": "Several days"},
                 {"value": 2, "label": "More than half the days"},
                 {"value": 3, "label": "Nearly every day"}
            ]}
        ],
        "scales": [
            {"id": "DEP", "name": "Depression Scale", "method": "sum"}
        ]
    }
    
    version = AssessmentVersion(template_id=template.id, version_tag="v1.0", schema_def=schema)
    db.add(version)
    
    # Rulepack
    rulepack = Rulepack(name="Standard Screening", version="1.0")
    db.add(rulepack)
    db.commit()
    db.refresh(rulepack)
    
    r1 = Rule(
        rulepack_id=rulepack.id,
        condition_expression="Depression_Scale >= 3",
        hit_flag="Mild Depression",
        severity=1,
        recommendation="Monitor symptoms."
    )
    r2 = Rule(
        rulepack_id=rulepack.id,
        condition_expression="Depression_Scale >= 5",
        hit_flag="Severe Depression Risk",
        severity=3,
        recommendation="Immediate clinical review required."
    )
    db.add(r1)
    db.add(r2)
    
    # Create one history assignment for client 2 (already completed)
    a_old = Assignment(client_id=c2.id, version_id=version.id, status="completed", completed_at=datetime.utcnow())
    db.add(a_old)
    db.commit()
    db.refresh(a_old)
    
    res = Result(assignment_id=a_old.id)
    db.add(res)
    db.commit()
    db.refresh(res)
    
    fv = FeatureVector(result_id=res.id, feature_name="Depression Scale", raw_score=6.0)
    db.add(fv)
    
    syn = Synthesis(result_id=res.id, deterministic_hits={
        "hits": ["Severe Depression Risk"],
        "max_severity": 3,
        "recommendations": ["Immediate clinical review required."],
        "summary": "High risk detected"
    }, ai_narrative=None)
    db.add(syn)
    
    # Create one pending assignment for client 1
    a_new = Assignment(client_id=c1.id, version_id=version.id, status="pending")
    db.add(a_new)
    
    db.commit()
    db.close()
    print("Seeding complete.")

if __name__ == "__main__":
    seed()
