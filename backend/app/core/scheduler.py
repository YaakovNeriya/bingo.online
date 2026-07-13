from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.core.audit import delete_old_audit_logs

scheduler = AsyncIOScheduler()

def start_scheduler():
    # Add a job to run every week (7 days)
    scheduler.add_job(
        delete_old_audit_logs,
        'interval',
        weeks=1,
        kwargs={'days': 400},
        id='delete_old_audit_logs_job',
        replace_existing=True
    )
    scheduler.start()

def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
