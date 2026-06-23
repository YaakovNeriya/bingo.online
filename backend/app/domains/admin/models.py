from sqlalchemy import Column, String, Text
from app.db.base_class import Base

class SiteSetting(Base):
    __tablename__ = "site_settings"
    key = Column(String(50), primary_key=True, index=True)
    value = Column(Text, nullable=False)
    description = Column(String(255), nullable=True)
