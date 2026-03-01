import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "DigitalPsych"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev_secret")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8 # 8 days
    
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "digitalpsych")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "secret")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "digitalpsych")
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "localhost")
    
    SQLALCHEMY_DATABASE_URI: str | None = None
    
    OPENAI_API_KEY: str | None = os.getenv("OPENAI_API_KEY", None)

    class Config:
        case_sensitive = True

settings = Settings()
