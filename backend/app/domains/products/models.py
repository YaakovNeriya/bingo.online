from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Numeric, JSON
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class ProductType(Base):
    __tablename__ = "product_types"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    display_order = Column(Integer, default=0, index=True)
    
    product_models = relationship("ProductModel", back_populates="product_type", cascade="all, delete-orphan", passive_deletes=True, order_by="ProductModel.display_order.asc(), ProductModel.id.asc()")

class ProductModel(Base):
    __tablename__ = "product_models"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), index=True, nullable=False)
    product_type_id = Column(Integer, ForeignKey("product_types.id", ondelete="CASCADE"), nullable=False)
    base_price = Column(Numeric(10, 2), nullable=False)
    fabric_height = Column(Numeric(10, 2), default=1.5, nullable=False)
    is_active = Column(Boolean, default=True)
    display_order = Column(Integer, default=0, index=True)
    image_url = Column(String(500), nullable=True)
    video_url = Column(String(500), nullable=True)

    product_type = relationship("ProductType", back_populates="product_models")
    color_skus = relationship("ColorSKU", back_populates="product_model", cascade="all, delete-orphan", passive_deletes=True, order_by="ColorSKU.display_order.asc(), ColorSKU.id.asc()")

class ColorSKU(Base):
    __tablename__ = "color_skus"
    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String(50), unique=True, index=True, nullable=True)
    color_name = Column(String(50), nullable=False)
    product_model_id = Column(Integer, ForeignKey("product_models.id", ondelete="CASCADE"), nullable=False)
    stock_meters = Column(Numeric(10, 2), default=0)
    specific_price = Column(Numeric(10, 2), nullable=True)
    image_urls = Column(JSON, nullable=True, default=list)
    is_active = Column(Boolean, default=True)
    display_order = Column(Integer, default=0, index=True)

    product_model = relationship("ProductModel", back_populates="color_skus")

from datetime import datetime

class TrafficVisit(Base):
    __tablename__ = "traffic_visits"
    id = Column(Integer, primary_key=True, index=True)
    source = Column(String(100), index=True, nullable=False)
    created_at = Column(String(50), default=lambda: datetime.utcnow().isoformat())
