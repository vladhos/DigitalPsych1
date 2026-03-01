from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.domain import ResponseSubmit, ResultResponse
from app.models.domain import Assignment, Response, Result, FeatureVector, Synthesis, AssessmentVersion, Rulepack, Client, AssessmentTemplate
from app.services.scoring_engine import ScoringEngine
from app.services.rule_engine import RuleEngine
from app.services.ai_synthesis import AISynthesisService
from datetime import datetime
import uuid

router = APIRouter()

@router.get("/available_templates")
def get_available_templates(db: Session = Depends(get_db)):
    """
    Returns latest versions of all available assessment templates.
    """
    templates = db.query(AssessmentTemplate).all()
    result = []
    
    for template in templates:
        # Get latest version
        latest_version = db.query(AssessmentVersion).filter(
            AssessmentVersion.template_id == template.id
        ).order_by(AssessmentVersion.id.desc()).first()
        
        if latest_version:
            result.append({
                "template_id": template.id,
                "version_id": latest_version.id,
                "name": template.name,
                "description": template.description,
                "version_tag": latest_version.version_tag
            })
            
    return result

@router.post("/assignments")
def create_client_assignment(client_id: str, version_id: str = "default", db: Session = Depends(get_db)):
    """
    Creates a new assessment assignment for a specific client.
    """
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
        
    if version_id == "default":
        version = db.query(AssessmentVersion).first()
    else:
        version = db.query(AssessmentVersion).filter(AssessmentVersion.id == version_id).first()
        
    if not version:
        raise HTTPException(status_code=404, detail="Assessment Version not found")
        
    assignment = Assignment(
        id=str(uuid.uuid4()),
        client_id=client.id,
        version_id=version.id,
        status="pending"
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    
    return {"assignment_id": assignment.id, "status": assignment.status}

@router.get("/assignments/{assignment_id}")
def get_assignment_details(assignment_id: str, db: Session = Depends(get_db)):
    """
    Gets details and schema necessary to render the assessment form for a specific assignment.
    """
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
        
    version = db.query(AssessmentVersion).filter(AssessmentVersion.id == assignment.version_id).first()
    template = db.query(AssessmentTemplate).filter(AssessmentTemplate.id == version.template_id).first()
    
    return {
        "assignment_id": assignment.id,
        "title": f"{template.name} ({version.version_tag})",
        "description": template.description,
        "description": template.description,
        "schema": version.schema_def,
        "status": assignment.status
    }

@router.get("/assignments/{assignment_id}/detail")
def get_assignment_completed_detail(assignment_id: str, db: Session = Depends(get_db)):
    """
    Returns full details of a completed assessment including raw answers, schema, scores, and synthesis.
    """
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
        
    version = db.query(AssessmentVersion).filter(AssessmentVersion.id == assignment.version_id).first()
    template = db.query(AssessmentTemplate).filter(AssessmentTemplate.id == version.template_id).first()
    
    response_record = db.query(Response).filter(Response.assignment_id == assignment_id).first()
    
    scores = {}
    flags = {}
    ai_narrative = None
    
    if assignment.result:
        for fv in assignment.result.feature_vectors:
            scores[fv.feature_name] = fv.raw_score
        if assignment.result.synthesis:
            flags = assignment.result.synthesis.deterministic_hits
            ai_narrative = assignment.result.synthesis.ai_narrative
            
    return {
        "assignment_id": assignment.id,
        "title": f"{template.name} ({version.version_tag})",
        "status": assignment.status,
        "assigned_at": assignment.created_at.isoformat() if assignment.created_at else None,
        "completed_at": assignment.completed_at.isoformat() if assignment.completed_at else None,
        "schema": version.schema_def,
        "answers": response_record.answers if response_record else {},
        "scores": scores,
        "flags": flags,
        "ai_narrative": ai_narrative
    }


@router.post("/assignments/{assignment_id}/submit", response_model=ResultResponse)
async def submit_assessment(
    assignment_id: str,
    payload: ResponseSubmit,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Core pipeline endpoint:
    1. Stores raw response securely.
    2. Runs Deterministic Scoring Engine to create Feature Vectors.
    3. Runs Deterministic Rule Engine (Layer 1) for precise hits and recommendations.
    4. Queues or runs AI Augmentation (Layer 2) if configured.
    """
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
        
    if assignment.status == "completed":
        raise HTTPException(status_code=400, detail="Assignment already completed")
        
    # Store raw response
    response_record = Response(assignment_id=assignment.id, answers=payload.answers)
    db.add(response_record)
    
    # Needs Assessment Version schema for scoring
    version = db.query(AssessmentVersion).filter(AssessmentVersion.id == assignment.version_id).first()
    if not version:
        raise HTTPException(status_code=500, detail="Assessment schema missing")
        
    # Step 1: Scoring Engine
    feature_dicts = ScoringEngine.process_responses(version.schema_def, payload.answers)
    
    # Create Result Record
    result = Result(assignment_id=assignment.id)
    db.add(result)
    db.flush() # get result.id
    
    for fd in feature_dicts:
        fv = FeatureVector(
            result_id=result.id,
            feature_name=fd["feature_name"],
            raw_score=fd["raw_score"],
            normalized_score=fd["normalized_score"]
        )
        db.add(fv)
        
    # Step 2: Deterministic Rule Engine (Layer 1)
    scoring_logic = version.schema_def.get("scoring_logic", {})
    interpretations = scoring_logic.get("interpretations", [])
    
    if interpretations:
        # UAE Formatted JSON triggers
        deterministic_synthesis = RuleEngine.evaluate_schema_interpretations(feature_dicts, interpretations)
    else:
        # Legacy fallback
        rulepack = db.query(Rulepack).first() # In production, linked by org/assessment
        rules = rulepack.rules if rulepack else []
        deterministic_synthesis = RuleEngine.evaluate_rules(feature_dicts, rules)
    
    synthesis_record = Synthesis(
        result_id=result.id,
        deterministic_hits=deterministic_synthesis,
        ai_narrative=None
    )
    db.add(synthesis_record)
    
    # Updating Assignment
    assignment.status = "completed"
    assignment.completed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(result)
    
    # Step 3: AI Augmentation (Layer 2)
    # Offload to background task to avoid blocking the client request
    background_tasks.add_task(
        run_ai_synthesis,
        synthesis_id=synthesis_record.id,
        deterministic_hits=deterministic_synthesis,
        feature_vectors={fd["feature_name"]: fd["raw_score"] for fd in feature_dicts},
        db=db
    )
    
    return result

async def run_ai_synthesis(synthesis_id: str, deterministic_hits: dict, feature_vectors: dict, db: Session):
    try:
        narrative = await AISynthesisService.generate_narrative(deterministic_hits, feature_vectors)
        if narrative:
            synthesis = db.query(Synthesis).filter(Synthesis.id == synthesis_id).first()
            if synthesis:
                synthesis.ai_narrative = narrative
                db.commit()
    except Exception as e:
        # AI failure should not block determinism
        pass
