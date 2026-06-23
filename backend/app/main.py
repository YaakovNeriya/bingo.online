from app import create_app

from fastapi.staticfiles import StaticFiles
import os

app = create_app()

os.makedirs("/app/uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="/app/uploads"), name="uploads")
