from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # App
    PROJECT_NAME: str = "Fabric Store"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DB_HOST: str
    DB_PORT: str
    DB_USER: str
    DB_PASSWORD: str
    DB_NAME: str
    
    # Redis
    REDIS_URL: str
    
    # Security
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    
    # Storage
    STORAGE_ENV: str
    
    # Google OAuth
    GOOGLE_CLIENT_ID: Optional[str] = None

    # Admin Credentials
    ADMIN_EMAIL: str
    ADMIN_PASSWORD: str
    
    # Mail
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: Optional[str] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASS: Optional[str] = None

    @property
    def ASYNC_DATABASE_URL(self) -> str:
        return f"mysql+asyncmy://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    class Config:
        case_sensitive = True
        env_file = ".env"
        env_file = ".env"

settings = Settings()
