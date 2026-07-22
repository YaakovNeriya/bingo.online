from PIL import Image, ImageDraw
from pathlib import Path

# Paths inside docker container
UPLOADS_DIR = Path("/app/uploads")
LOGO_PATH = Path("/app/app/bingo_logo.webp")

async def generate_share_image(model_id: int, original_image_url: str) -> str:
    """
    Returns the original clean fabric image URL directly without adding watermarks, logos, or frames.
    """
    return original_image_url

