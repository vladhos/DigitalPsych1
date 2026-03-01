import os
os.environ["POSTGRES_SERVER"] = ""
os.environ["SQLALCHEMY_DATABASE_URI"] = "sqlite:///./test.db"

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.db.session import SessionLocal, engine, Base
from app.models.domain import Organization, Client, AssessmentVersion, AssessmentTemplate, Rulepack, Rule, Assignment

# Remove old test DB if it exists
if os.path.exists("./test.db"):
    os.remove("./test.db")

Base.metadata.create_all(bind=engine)

def seed_db():
    db = SessionLocal()
    org = Organization(name="Test Org")
    db.add(org)
    db.commit()
    db.refresh(org)
    
    client = Client(organization_id=org.id, reference_id="Pat-001")
    db.add(client)
    
    template = AssessmentTemplate(name="PHQ-9", description="Depression")
    db.add(template)
    db.commit()
    db.refresh(template)
    
    version = AssessmentVersion(
        template_id=template.id, 
        version_tag="v1", 
        schema_def={
            "items": [
                {"id": "q1", "type": "likert", "scale_id": "DEP", "weight": 1.0},
                {"id": "q2", "type": "likert", "scale_id": "DEP", "reverse": True, "max_val": 5, "weight": 1.0}
            ],
            "scales": [
                {"id": "DEP", "name": "Depression Scale", "method": "sum"}
            ]
        }
    )
    db.add(version)
    
    rulepack = Rulepack(name="Standard Psych", version="1.0")
    db.add(rulepack)
    db.commit()
    db.refresh(rulepack)
    
    rule = Rule(
        rulepack_id=rulepack.id,
        condition_expression="Depression_Scale > 5",
        hit_flag="Mild Depression",
        severity=2,
        recommendation="Consider follow-up"
    )
    db.add(rule)
    
    assignment = Assignment(
        client_id=client.id,
        version_id=version.id,
        status="pending"
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    
    db.close()
    return assignment.id

print("Seeding database and creating test data...")
assignment_id = seed_db()
print(f"Assignment ID: {assignment_id}")

print("Initializing TestClient...")
client = TestClient(app)

print("Submitting assessment answers...")
# q1 answer = 4, q2 = 1. q2 is reversed so 6-1=5. Total DEP = 9. Should trigger the rule > 5.
payload = {
    "assignment_id": assignment_id,
    "answers": {
        "q1": 4,
        "q2": 1
    }
}

response = client.post(f"/api/v1/assignments/{assignment_id}/submit", json=payload)
print(f"Status Code: {response.status_code}")
print("Response JSON:")
import json
print(json.dumps(response.json(), indent=2))
