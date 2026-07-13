from sqlalchemy import Column, String, Text, Integer, ForeignKey, DateTime, JSON
from app.db.base_class import Base
from datetime import datetime

class SiteSetting(Base):
    __tablename__ = "site_settings"
    key = Column(String(50), primary_key=True, index=True)
    value = Column(Text, nullable=False)
    description = Column(String(255), nullable=True)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    impersonated_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    endpoint = Column(String(255), nullable=True) # Optional for non-request actions
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    action = Column(String(255), nullable=False)
    entity_type = Column(String(50), nullable=True)
    entity_id = Column(Integer, nullable=True)
    changes = Column(JSON, nullable=True)

from sqlalchemy import Column, String, Text, Integer, ForeignKey, DateTime, JSON

class SeasonArchive(Base):
    __tablename__ = "season_archives"
    id = Column(Integer, primary_key=True, index=True)
    season_name = Column(String(255), nullable=False)
    archive_data = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
