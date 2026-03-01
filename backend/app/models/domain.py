from datetime import datetime
import uuid
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, JSON, Text, Float, Date
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from app.db.session import Base

def generate_uuid():
    return str(uuid.uuid4())

class Organization(Base):
    __tablename__ = "organizations"
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    name = Column(String, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    users = relationship("User", back_populates="organization")
    clients = relationship("Client", back_populates="organization")

class Role(Base):
    __tablename__ = "roles"
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    name = Column(String, unique=True, index=True, nullable=False) # SuperAdmin, OrgAdmin, Psychologist, Assistant
    description = Column(String)

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=True)
    role_id = Column(String, ForeignKey("roles.id"))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="users")
    role = relationship("Role")

class Client(Base):
    __tablename__ = "clients"
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=False)
    reference_id = Column(String, index=True) # E.g., internal patient ID
    date_of_birth = Column(Date, nullable=True) # DOB for norms calculation
    gender = Column(String, nullable=True) # Gender for norms
    demographics = Column(JSON, nullable=True) # Age, gender, etc. for norms
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="clients")
    assignments = relationship("Assignment", back_populates="client")
    notes = relationship("ClinicalNote", back_populates="client")

class ClinicalNote(Base):
    __tablename__ = "clinical_notes"
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    client_id = Column(String, ForeignKey("clients.id"), nullable=False)
    author_id = Column(String, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    client = relationship("Client", back_populates="notes")
    author = relationship("User")

class AssessmentTemplate(Base):
    __tablename__ = "assessment_templates"
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    name = Column(String, index=True, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    versions = relationship("AssessmentVersion", back_populates="template")

class AssessmentVersion(Base):
    __tablename__ = "assessment_versions"
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    template_id = Column(String, ForeignKey("assessment_templates.id"))
    version_tag = Column(String, nullable=False)
    schema_def = Column(JSON, nullable=False) # The structure: questions, scales, weights
    created_at = Column(DateTime, default=datetime.utcnow)
    
    template = relationship("AssessmentTemplate", back_populates="versions")

class Assignment(Base):
    __tablename__ = "assignments"
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    client_id = Column(String, ForeignKey("clients.id"))
    version_id = Column(String, ForeignKey("assessment_versions.id"))
    assigned_by_id = Column(String, ForeignKey("users.id"))
    status = Column(String, default="pending") # pending, completed, expired
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    client = relationship("Client", back_populates="assignments")
    result = relationship("Result", back_populates="assignment", uselist=False)

class Response(Base):
    # Raw answers
    __tablename__ = "responses"
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    assignment_id = Column(String, ForeignKey("assignments.id"))
    answers = Column(JSON, nullable=False) # e.g. {"q1": 4, "q2": 1}
    created_at = Column(DateTime, default=datetime.utcnow)

class Result(Base):
    __tablename__ = "results"
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    assignment_id = Column(String, ForeignKey("assignments.id"))
    scored_at = Column(DateTime, default=datetime.utcnow)
    
    assignment = relationship("Assignment", back_populates="result")
    feature_vectors = relationship("FeatureVector", back_populates="result")
    synthesis = relationship("Synthesis", back_populates="result", uselist=False)

class FeatureVector(Base):
    # E.g., "Depression Scale", score: 24.5
    __tablename__ = "feature_vectors"
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    result_id = Column(String, ForeignKey("results.id"))
    feature_name = Column(String, index=True)
    raw_score = Column(Float)
    normalized_score = Column(Float, nullable=True)
    
    result = relationship("Result", back_populates="feature_vectors")

class Rulepack(Base):
    __tablename__ = "rulepacks"
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    name = Column(String, nullable=False)
    version = Column(String, nullable=False)
    description = Column(Text)
    
    rules = relationship("Rule", back_populates="rulepack")

class Rule(Base):
    __tablename__ = "rules"
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    rulepack_id = Column(String, ForeignKey("rulepacks.id"))
    condition_expression = Column(String) # e.g., "Depression_Scale > 20 AND Anxiety_Scale > 15"
    hit_flag = Column(String) # "High Risk of Comorbidity"
    severity = Column(Integer) # 1-5
    recommendation = Column(Text)
    
    rulepack = relationship("Rulepack", back_populates="rules")

class Synthesis(Base):
    # Final Layer 1 and Layer 2 output
    __tablename__ = "syntheses"
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    result_id = Column(String, ForeignKey("results.id"))
    deterministic_hits = Column(JSON) # Extracted flags/hits from Layer 1
    ai_narrative = Column(Text, nullable=True) # Layer 2 expansion
    created_at = Column(DateTime, default=datetime.utcnow)
    
    result = relationship("Result", back_populates="synthesis")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    action = Column(String, nullable=False) # e.g. "VIEW_RESULT", "UPDATE_RULEPACK"
    entity_id = Column(String, nullable=True)
    entity_type = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    metadata_json = Column(JSON, nullable=True)
