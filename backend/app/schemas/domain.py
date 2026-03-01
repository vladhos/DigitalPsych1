from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    role_id: str
    organization_id: Optional[str] = None
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: str
    created_at: datetime
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class AssessmentVersionSchema(BaseModel):
    id: str
    template_id: str
    version_tag: str
    schema_def: Dict[str, Any]
    class Config:
        from_attributes = True

class ResponseSubmit(BaseModel):
    assignment_id: str
    answers: Dict[str, Any]

class FeatureVectorResponse(BaseModel):
    feature_name: str
    raw_score: float
    normalized_score: Optional[float] = None
    class Config:
        from_attributes = True

class SynthesisResponse(BaseModel):
    deterministic_hits: Dict[str, Any]
    ai_narrative: Optional[str] = None
    class Config:
        from_attributes = True

class ResultResponse(BaseModel):
    id: str
    assignment_id: str
    scored_at: datetime
    feature_vectors: List[FeatureVectorResponse] = []
    synthesis: Optional[SynthesisResponse] = None
    class Config:
        from_attributes = True

class TemplateMetadata(BaseModel):
    template_id: Optional[str] = None
    name: Optional[str] = None
    title: Optional[str] = None
    version: str
    author: Optional[str] = None
    authors: Optional[str] = None
    description: Optional[str] = None

class QuestionDef(BaseModel):
    id: Any
    text: str
    type: Optional[str] = "likert"

class InterpretationDef(BaseModel):
    min_score: float
    max_score: float
    flag: Optional[str] = None
    recommendation: Optional[str] = None

class ScoringLogic(BaseModel):
    scale: Any
    reverse_items: List[Any] = []
    dimensions: Dict[str, List[Any]] = {}
    interpretations: List[InterpretationDef] = []

class TemplateImportRequest(BaseModel):
    template_metadata: TemplateMetadata
    questions: List[QuestionDef]
    scoring_logic: ScoringLogic
