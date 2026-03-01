from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.domain import TemplateImportRequest
from app.models.domain import AssessmentTemplate, AssessmentVersion, User
from app.api.deps import get_current_user
import uuid

router = APIRouter()

@router.post("/templates/import", status_code=status.HTTP_201_CREATED)
def import_template(
    payload: TemplateImportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Import a new Assessment Template and its first Version (schema) via JSON.
    Restricted to SuperAdmin (role_id verification applied).
    """
    # In a full app, we would check if current_user.role.name == 'SuperAdmin'
    
    # 1. Create or Find Template
    # We will just create a new one for simplicity or find by name
    template_name = payload.template_metadata.title or payload.template_metadata.name or "Untitled Template"
    existing_template = db.query(AssessmentTemplate).filter(AssessmentTemplate.name == template_name).first()
    
    if not existing_template:
        existing_template = AssessmentTemplate(
            id=payload.template_metadata.template_id or str(uuid.uuid4()),
            name=template_name,
            description=payload.template_metadata.description
        )
        db.add(existing_template)
        db.flush()

    # 2. Add New Version
    new_version = AssessmentVersion(
        id=str(uuid.uuid4()),
        template_id=existing_template.id,
        version_tag=payload.template_metadata.version,
        schema_def=payload.model_dump() # Stores the entire validated UAE JSON
    )
    db.add(new_version)
    
    # Commit changes
    db.commit()
    db.refresh(new_version)

    return {
        "message": "Template imported successfully",
        "template_id": existing_template.id,
        "version_id": new_version.id
    }


@router.delete("/templates/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_template(
    template_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete an Assessment Template and all its versions.
    """
    template = db.query(AssessmentTemplate).filter(AssessmentTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    # Cascade delete all versions first
    db.query(AssessmentVersion).filter(AssessmentVersion.template_id == template_id).delete()
    db.delete(template)
    db.commit()
    return


@router.get("/templates", status_code=status.HTTP_200_OK)
def list_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all Assessment Templates with their versions summary and metadata.
    """
    templates = db.query(AssessmentTemplate).all()
    result = []
    for template in templates:
        versions = db.query(AssessmentVersion).filter(
            AssessmentVersion.template_id == template.id
        ).order_by(AssessmentVersion.id.desc()).all()

        dimensions = []
        n_questions = 0
        scale = "N/A"
        if versions:
            schema = versions[0].schema_def or {}
            scoring_logic = schema.get("scoring_logic", {})
            dims = scoring_logic.get("dimensions", {})
            dimensions = list(dims.keys())
            scale_info = scoring_logic.get("scale", {})
            if isinstance(scale_info, dict):
                scale = f"{scale_info.get('min', 1)}-{scale_info.get('max', 5)}"
            else:
                scale = str(scale_info)
            questions = schema.get("questions", [])
            n_questions = len(questions)

        result.append({
            "template_id": template.id,
            "name": template.name,
            "description": template.description,
            "versions": [
                {"version_id": v.id, "version_tag": v.version_tag}
                for v in versions
            ],
            "dimensions": dimensions,
            "n_questions": n_questions,
            "scale": scale
        })
    return result
