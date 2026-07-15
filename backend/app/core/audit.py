from sqlalchemy.ext.asyncio import AsyncSession
from app.domains.admin.models import AuditLog

async def log_audit_action(
    db: AsyncSession,
    admin_id: int,
    action: str,
    entity_type: str = None,
    entity_id: int = None,
    changes: dict = None,
    endpoint: str = None,
    impersonated_user_id: int = None
):
    """
    Globally logs an action taken by an admin for tracking and accountability.
    """
    audit_log = AuditLog(
        admin_id=admin_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        changes=changes,
        endpoint=endpoint,
        impersonated_user_id=impersonated_user_id
    )
    db.add(audit_log)
    # We do NOT commit here. The commit should be handled by the caller's transaction
    # to ensure the audit log is saved atomically with the actual data change.

async def delete_old_audit_logs(days: int = 400, db: AsyncSession = None):
    """
    Deletes audit logs that are older than the specified number of days.
    """
    from datetime import datetime, timedelta
    from sqlalchemy import delete
    from app.db.database import async_session_maker
    
    threshold = datetime.utcnow() - timedelta(days=days)
    stmt = delete(AuditLog).where(AuditLog.timestamp < threshold)
    
    if db is not None:
        await db.execute(stmt)
        await db.commit()
    else:
        async with async_session_maker() as session:
            await session.execute(stmt)
            await session.commit()
