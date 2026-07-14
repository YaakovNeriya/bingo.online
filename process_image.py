from PIL import Image
import os

input_path = "/home/yaakov/.gemini/antigravity-ide/brain/647aad1b-bf98-48b8-95a5-d8da40170242/media__1784063091924.jpg"
output_path = "frontend/public/test.jpg"

with Image.open(input_path) as img:
    # Convert to RGB if it has transparency
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")
    
    # Resize to max 600x600 keeping aspect ratio
    img.thumbnail((600, 600), Image.Resampling.LANCZOS)
    
    # Save optimized JPG
    img.save(output_path, "JPEG", quality=85, optimize=True)

print(f"Saved optimized image to {output_path}. Size: {os.path.getsize(output_path)} bytes")
