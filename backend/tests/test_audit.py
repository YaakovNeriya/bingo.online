import pytest
import asyncio
from decimal import Decimal
from app.domains.admin.services import update_color_sku
from app.domains.products.models import ProductType, ProductModel, ColorSKU
from app.domains.users.models import User
from app.domains.admin.models import AuditLog
from sqlalchemy import select
from app.domains.admin.schemas import ColorSKUUpdate

@pytest.mark.asyncio
async def test_update_sku_audit_log(db_session):
    # 1. Create Admin User
    admin = User(email="admin@example.com", hashed_password="123", first_name="Admin", is_superuser=True)
    db_session.add(admin)
    await db_session.commit()

    # 2. Create Product Hierarchy
    pt = ProductType(name="Cotton Audit Test")
    db_session.add(pt)
    await db_session.commit()
    await db_session.refresh(pt)

    pm = ProductModel(name="Audit Cotton", product_type_id=pt.id, base_price=Decimal("10.00"), fabric_height=Decimal("1.5"))
    db_session.add(pm)
    await db_session.commit()
    await db_session.refresh(pm)

    sku = ColorSKU(sku="AUD-01", color_name="Red", product_model_id=pm.id, stock_meters=Decimal("100.00"))
    db_session.add(sku)
    await db_session.commit()
    await db_session.refresh(sku)

    # 3. Update the SKU via the service function
    update_data = ColorSKUUpdate(stock_meters=Decimal("50.00"))
    updated_sku = await update_color_sku(db_session, sku.id, update_data, admin_id=admin.id)

    # 4. Check the AuditLog table
    res = await db_session.execute(select(AuditLog).where(AuditLog.entity_id == sku.id))
    log = res.scalars().first()

    assert log is not None
    assert log.action == "UPDATE_PRODUCT_SKU"
    assert log.entity_type == "ColorSKU"
    assert log.admin_id == admin.id
    
    # Check that changes JSON tracked the old and new stock appropriately
    assert log.changes["old"]["stock_meters"] == "100.00"
    assert log.changes["new"]["stock_meters"] == "50.00"

@pytest.mark.asyncio
async def test_delete_old_audit_logs(db_session):
    from datetime import datetime, timedelta
    from app.core.audit import delete_old_audit_logs
    
    # Create an admin user
    admin = User(email="cron@example.com", hashed_password="123", first_name="Cron", is_superuser=True)
    db_session.add(admin)
    await db_session.commit()

    # Create an old log (401 days old)
    old_log = AuditLog(
        admin_id=admin.id,
        action="TEST_OLD",
        timestamp=datetime.utcnow() - timedelta(days=401)
    )
    
    # Create a new log (399 days old)
    new_log = AuditLog(
        admin_id=admin.id,
        action="TEST_NEW",
        timestamp=datetime.utcnow() - timedelta(days=399)
    )

    db_session.add(old_log)
    db_session.add(new_log)
    await db_session.commit()

    # Verify both exist
    res = await db_session.execute(select(AuditLog).where(AuditLog.admin_id == admin.id))
    logs = res.scalars().all()
    assert len(logs) == 2

    # Run the cleanup job
    await delete_old_audit_logs(days=400, db=db_session)

    # Verify only the new log remains
    res_after = await db_session.execute(select(AuditLog).where(AuditLog.admin_id == admin.id))
    logs_after = res_after.scalars().all()
    
    assert len(logs_after) == 1
    assert logs_after[0].action == "TEST_NEW"
