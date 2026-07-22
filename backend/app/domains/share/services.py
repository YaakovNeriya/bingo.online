from PIL import Image, ImageDraw
from pathlib import Path

# Paths inside docker container
UPLOADS_DIR = Path("/app/uploads")
LOGO_PATH = Path("/app/app/bingo_logo.webp")

async def generate_share_image(model_id: int, original_image_url: str) -> str:
    """
    Takes the original image and returns a URL to a watermarked, framed image.
    """
    output_filename = f"share_{model_id}.webp"
    output_path = UPLOADS_DIR / output_filename
    
    # If it already exists, return the cached one (cache invalidation will be handled later)
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
            # If it's an external URL (which shouldn't happen for our fabrics),
            # just skip watermarking and return the original to avoid hanging
            return original_image_url
        else:
            return original_image_url # Unsupported format

        # Create 1200x1200 square canvas for WhatsApp/Facebook
        canvas_size = 1200
        canvas = Image.new("RGBA", (canvas_size, canvas_size), (255, 255, 255, 255)) # Clean white background

        # Resize and paste product image
        target_img_size = 1100
        img.thumbnail((target_img_size, target_img_size), Image.Resampling.LANCZOS)
        
        # Center the fabric image cleanly on the canvas
        offset_x = (canvas_size - img.width) // 2
        offset_y = (canvas_size - img.height) // 2
        canvas.paste(img, (offset_x, offset_y), img if img.mode == 'RGBA' else None)

        # Save as WebP
        canvas.save(output_path, "WEBP", quality=92)
        
        return f"/uploads/{output_filename}"
        
    except Exception as e:
        import logging
        logging.error(f"Failed to generate share image: {e}")
        return original_image_url # Graceful fallback to original image

