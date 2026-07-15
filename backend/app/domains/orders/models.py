from sqlalchemy import Column, Integer, String, ForeignKey, Numeric, DateTime, func
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Cart(Base):
    __tablename__ = "carts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    user = relationship("User")
    items = relationship("CartItem", back_populates="cart", cascade="all, delete-orphan", passive_deletes=True)

class CartItem(Base):
    __tablename__ = "cart_items"
    id = Column(Integer, primary_key=True, index=True)
    cart_id = Column(Integer, ForeignKey("carts.id", ondelete="CASCADE"), nullable=False)
    color_sku_id = Column(Integer, ForeignKey("color_skus.id", ondelete="CASCADE"), nullable=False)
    length_meters = Column(Numeric(10, 2), nullable=False)
    units = Column(Integer, nullable=False, default=1)

    cart = relationship("Cart", back_populates="items")
    color_sku = relationship("ColorSKU")

class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), default="order_unpaid", nullable=False)
    total_price = Column(Numeric(10, 2), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan", passive_deletes=True)

class OrderItem(Base):
    __tablename__ = "order_items"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    color_sku_id = Column(Integer, ForeignKey("color_skus.id", ondelete="SET NULL"), nullable=True)
    length_meters = Column(Numeric(10, 2), nullable=False)
    units = Column(Integer, nullable=False, default=1)
    price_at_purchase = Column(Numeric(10, 2), nullable=False)
    historical_product_name = Column(String(255), nullable=True)
    historical_color_name = Column(String(255), nullable=True)

    order = relationship("Order", back_populates="items")
    color_sku = relationship("ColorSKU")
