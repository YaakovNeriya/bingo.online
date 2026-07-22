from PIL import Image
from pathlib import Path
import logging

UPLOADS_DIR = Path("/app/uploads")

async def generate_share_image(model_id: int, original_image_url: str) -> str:
    """
    Converts fabric image to a clean 1200x1200 JPEG image (image/jpeg) for WhatsApp & Facebook preview compatibility.
    No logo, no watermark, no frame.
    """
    output_filename = f"share_{model_id}.jpg"
    output_path = UPLOADS_DIR / output_filename

    # Return existing cached share JPG if present
    if output_path.exists():
        return f"/uploads/{output_filename}"

    try:
        if original_image_url.startswith("/uploads/"):
            filename = original_image_url.replace("/uploads/", "")
            input_path = UPLOADS_DIR / filename
            if not input_path.exists():
                return original_image_url
            img = Image.open(input_path).convert("RGB")
        else:
            return original_image_url

        # Create 1200x1200 square canvas with clean white background for WhatsApp
        canvas_size = 1200
        canvas = Image.new("RGB", (canvas_size, canvas_size), (255, 255, 255))

        # Center fabric image cleanly on canvas
        img.thumbnail((canvas_size, canvas_size), Image.Resampling.LANCZOS)
        offset_x = (canvas_size - img.width) // 2
        offset_y = (canvas_size - img.height) // 2
        canvas.paste(img, (offset_x, offset_y))

        # Save as JPEG for WhatsApp compatibility
        canvas.save(output_path, "JPEG", quality=92)
        return f"/uploads/{output_filename}"

    except Exception as e:
        logging.error(f"Failed to generate WhatsApp share JPG: {e}")
        return original_image_url

