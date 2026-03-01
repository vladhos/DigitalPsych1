from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.domain import Client, Assignment, Result, Synthesis, User, ClinicalNote
from sqlalchemy import desc, Integer
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from app.api.deps import get_current_user

class ClientCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    external_id: Optional[str] = None
    date_of_birth: Optional[str] = None # format YYYY-MM-DD
    gender: Optional[str] = None

class ClinicalNoteCreate(BaseModel):
    content: str

class ClinicalNoteResponse(BaseModel):
    id: str
    content: str
    created_at: str # Using str for simplicity or datetime
    author_name: str

    class Config:
        from_attributes = True

router = APIRouter()

@router.get("/")
def get_clients(db: Session = Depends(get_db)):
    """
    Returns a list of all clients with their latest assessment status and active alerts.
    """
    clients = db.query(Client).all()
    
    client_list = []
    for client in clients:
        # Pripravime si formatovane udaje o klientovi
        # Zistime posledny assignment klienta
        latest_assignment = db.query(Assignment).filter(Assignment.client_id == client.id)\
            .order_by(desc(Assignment.created_at)).first()
            
        last_active = "N/A"
        status = "No Assessments"
        active_alerts = 0
        
        if latest_assignment:
            last_active = latest_assignment.completed_at.strftime("%Y-%m-%d") if latest_assignment.completed_at else latest_assignment.created_at.strftime("%Y-%m-%d")
            status = latest_assignment.status.capitalize()
            
            # Zistime, ci k tomuto assignmentu existuju nejake kriticke alerty
            if latest_assignment.status == "completed":
                # Spocitame zistene kriticke priznaky v synteze
                critical_alerts_count = db.query(Synthesis).join(Result)\
                    .filter(Result.assignment_id == latest_assignment.id)\
                    .filter(Synthesis.deterministic_hits.op('->>')('max_severity').cast(Integer) >= 2).count()
                active_alerts = critical_alerts_count

        demographics = client.demographics or {}
        client_list.append({
            "id": client.id,
            "referenceId": client.reference_id,
            "firstName": demographics.get("first_name"),
            "lastName": demographics.get("last_name"),
            "email": demographics.get("email"),
            "lastActive": last_active,
            "status": status,
            "alerts": active_alerts
        })
        
    return client_list

@router.post("/", status_code=201)
def create_client(
    client_data: ClientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Creates a new client bound to the current doctor's organization.
    """
    # Zistujeme organizaciu prihlaseneho uzivatela
    org_id = current_user.organization_id
    if not org_id:
        raise HTTPException(status_code=400, detail="User does not belong to any organization.")
        
    # Check uniquely by email inside the same organization (demographics field parsing in JSON)
    # Because JSON filtering can be engine-specific, we'll do python-level check for prototype or simple JSON text match
    # A robust check checks DB. For simplicity, we skip full unique string path on JSON or check all.
    existing = db.query(Client).filter(
        Client.organization_id == org_id,
        Client.demographics.op("->>")("email") == client_data.email
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Klient s týmto emailom už v organizácii existuje.")
        
    reference_id = f"{client_data.last_name}, {client_data.first_name}"
    if client_data.external_id:
        reference_id = f"{client_data.external_id} - {reference_id}"
        
    demographics = {
        "first_name": client_data.first_name,
        "last_name": client_data.last_name,
        "email": client_data.email,
        "external_id": client_data.external_id
    }
    
    from datetime import datetime
    dob_parsed = None
    if client_data.date_of_birth:
        try:
            dob_parsed = datetime.strptime(client_data.date_of_birth, "%Y-%m-%d").date()
        except ValueError:
            pass

    new_client = Client(
        organization_id=org_id,
        reference_id=reference_id,
        date_of_birth=dob_parsed,
        gender=client_data.gender,
        demographics=demographics
    )
    
    db.add(new_client)
    db.commit()
    db.refresh(new_client)
    
    return {"id": new_client.id, "referenceId": new_client.reference_id, "message": "Client created successfully."}

@router.get("/{client_id}")
def get_client(client_id: str, db: Session = Depends(get_db)):
    """
    Returns specific client details.
    """
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
        
    return {
        "id": client.id,
        "referenceId": client.reference_id,
        "demographics": client.demographics,
        "dateOfBirth": client.date_of_birth.isoformat() if client.date_of_birth else None,
        "gender": client.gender,
        "createdAt": client.created_at.isoformat() if client.created_at else None
    }

@router.get("/{client_id}/assignments")
def get_client_assignments(client_id: str, db: Session = Depends(get_db)):
    """
    Returns full history of assessments for the client including scored results and feature vectors.
    """
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
        
    assignments = db.query(Assignment).filter(Assignment.client_id == client_id).order_by(Assignment.created_at).all()
    
    response_list = []
    for assgn in assignments:
        record = {
            "id": assgn.id,
            "status": assgn.status,
            "assignedAt": assgn.created_at.isoformat() if assgn.created_at else None,
            "completedAt": assgn.completed_at.isoformat() if assgn.completed_at else None,
            "versionId": assgn.version_id,
            "scores": {},
            "flags": {},
            "aiNarrative": None
        }
        
        # Ak bol test vyhodnoteny
        if assgn.result:
            for fv in assgn.result.feature_vectors:
                record["scores"][fv.feature_name] = fv.raw_score
                
            if assgn.result.synthesis:
                record["flags"] = assgn.result.synthesis.deterministic_hits
                record["aiNarrative"] = assgn.result.synthesis.ai_narrative
                
        response_list.append(record)
        
        
    return response_list

@router.post("/{client_id}/notes", response_model=ClinicalNoteResponse, status_code=201)
def create_clinical_note(
    client_id: str,
    note_in: ClinicalNoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Creates a new clinical note for the client.
    """
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
        
    new_note = ClinicalNote(
        client_id=client_id,
        author_id=current_user.id,
        content=note_in.content
    )
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    
    return {
        "id": new_note.id,
        "content": new_note.content,
        "created_at": new_note.created_at.isoformat(),
        "author_name": current_user.email
    }

@router.get("/{client_id}/notes", response_model=List[ClinicalNoteResponse])
def get_clinical_notes(
    client_id: str,
    db: Session = Depends(get_db)
):
    """
    Returns all clinical notes for the client, ordered by newest first.
    """
    notes = db.query(ClinicalNote).filter(ClinicalNote.client_id == client_id).order_by(desc(ClinicalNote.created_at)).all()
    
    response_list = []
    for note in notes:
        author_email = note.author.email if note.author else "Unknown Author"
        response_list.append({
            "id": note.id,
            "content": note.content,
            "created_at": note.created_at.isoformat() if note.created_at else "",
            "author_name": author_email
        })
    return response_list

@router.delete("/{client_id}", status_code=204)
def delete_client(
    client_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Deletes the client and all associated records (assignments, notes).
    """
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
        
    # Security check: Does this client belong to the user's organization?
    if client.organization_id != current_user.organization_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this client")

    # Manually delete dependent records to avoid Foreign Key constraint errors 
    # if cascades are not fully set up in the SQLite DB
    
    # Delete Notes
    db.query(ClinicalNote).filter(ClinicalNote.client_id == client_id).delete()
    
    # Delete Assignments and their Results/Syntheses
    assignments = db.query(Assignment).filter(Assignment.client_id == client_id).all()
    for assgn in assignments:
        if assgn.result:
            if assgn.result.synthesis:
                db.delete(assgn.result.synthesis)
            db.delete(assgn.result)
        db.delete(assgn)
        
    # Finally delete the client
    db.delete(client)
    db.commit()
    
    return None
