from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Region(Base):
    __tablename__ = "regions"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    shipping_cost = Column(Numeric(10, 2), nullable=False)
    delivery_days = Column(Integer, nullable=False)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    region_id = Column(Integer, ForeignKey("regions.id", ondelete="SET NULL"), nullable=True)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)

    region = relationship("Region")
