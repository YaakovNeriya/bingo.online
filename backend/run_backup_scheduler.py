from apscheduler.schedulers.blocking import BlockingScheduler
import sys
import subprocess
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def run_backup():
    logger.info("Running scheduled backup...")
    try:
        # Run the backup script
        result = subprocess.run([sys.executable, "backup_to_drive.py"], check=True)
        logger.info("Scheduled backup completed successfully.")
    except subprocess.CalledProcessError as e:
        logger.error(f"Scheduled backup failed with exit code {e.returncode}")
    except Exception as e:
        logger.error(f"Unexpected error during backup: {e}")

if __name__ == "__main__":
    logger.info("Starting Backup Scheduler... Backup will run daily at 03:00 (Asia/Jerusalem time)")
    
    scheduler = BlockingScheduler(timezone="Asia/Jerusalem")
    scheduler.add_job(run_backup, 'cron', hour=3, minute=0, misfire_grace_time=3600)
    
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        pass
