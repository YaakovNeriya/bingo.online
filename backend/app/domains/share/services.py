from PIL import Image, ImageOps
from pathlib import Path

# Paths inside docker container
UPLOADS_DIR = Path("/app/uploads")
LOGO_PATH = Path("/app/app/bingo_logo.webp")

async def generate_share_image(model_id: int, original_image_url: str, is_square: bool = False) -> str:
    """
    Takes the original fabric image and crops/resizes it to fill:
    - 1200x1200 square for WhatsApp (is_square=True)
    - 1200x630 rectangle for Facebook/Twitter/Others (is_square=False)
    """
    aspect_tag = "sq" if is_square else "rect"
    output_filename = f"share_{model_id}_{aspect_tag}.webp"
    output_path = UPLOADS_DIR / output_filename
    
    # If it already exists, return the cached one
    if output_path.exists():
        return f"/uploads/{output_filename}"

    try:
        # Resolve the original image path
        if original_image_url.startswith("/uploads/"):
            filename = original_image_url.replace("/uploads/", "")
            input_path = UPLOADS_DIR / filename
            if not input_path.exists():
                return original_image_url # Fallback if local file missing
            img = Image.open(input_path).convert("RGBA")
        elif original_image_url.startswith("http"):
            return original_image_url
        else:
            return original_image_url # Unsupported format

        # Create aspect canvas
        if is_square:
            target_size = (1200, 1200) # WhatsApp square
        else:
            target_size = (1200, 630)  # Facebook rectangle

        canvas = ImageOps.fit(img, target_size, Image.Resampling.LANCZOS, centering=(0.5, 0.5))

        # Save as WebP
        canvas.save(output_path, "WEBP", quality=92)
        
        return f"/uploads/{output_filename}"
        
    except Exception as e:
        import logging
        logging.error(f"Failed to generate share image: {e}")
        return original_image_url # Graceful fallback to original image

