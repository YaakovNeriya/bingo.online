import multiprocessing
import os

# Calculate optimal workers based on CPU cores (Formula: 2 * cores + 1)
cores = multiprocessing.cpu_count()
default_workers = (cores * 2) + 1

# Allow override via environment variable if needed
env_workers = os.environ.get("GUNICORN_WORKERS")
workers = int(env_workers) if env_workers and env_workers.strip().isdigit() else default_workers

# Gunicorn configuration
bind = "0.0.0.0:8000"
worker_class = "uvicorn.workers.UvicornWorker"
loglevel = "warning"
