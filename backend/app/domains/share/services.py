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
        canvas = Image.new("RGBA", (canvas_size, canvas_size), (250, 248, 245, 255)) # Soft off-white background

        # Resize and paste product image
        # We want the product image to take up most of the center
        target_img_size = 1000
        img.thumbnail((target_img_size, target_img_size), Image.Resampling.LANCZOS)
        
        # Center the image on the canvas
        offset_x = (canvas_size - img.width) // 2
        offset_y = (canvas_size - img.height) // 2
        canvas.paste(img, (offset_x, offset_y), img if img.mode == 'RGBA' else None)

        # Draw elegant frame (Removed per user request)
        # We just leave the canvas as is with the fabric in the center
        draw = ImageDraw.Draw(canvas)

        # Paste the logo
        if LOGO_PATH.exists():
            logo = Image.open(LOGO_PATH).convert("RGBA")
            # Make logo a reasonable size (e.g., max width 300)
            logo.thumbnail((400, 200), Image.Resampling.LANCZOS)
            
            # Position logo at the top center
            logo_x = (canvas_size - logo.width) // 2
            logo_y = 50
            
            # Paste the logo with transparency mask
            canvas.paste(logo, (logo_x, logo_y), logo)

        # Convert back to RGB to save as WebP without alpha if needed, but webp supports alpha
        canvas.save(output_path, "WEBP", quality=90)
        
        return f"/uploads/{output_filename}"
        
    except Exception as e:
        import logging
        logging.error(f"Failed to generate share image: {e}")
        return original_image_url # Graceful fallback to original image

