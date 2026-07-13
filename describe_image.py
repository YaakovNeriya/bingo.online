import os
import google.generativeai as genai
from PIL import Image

try:
    genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
    model = genai.GenerativeModel('gemini-1.5-pro')
    img = Image.open('/home/yaakov/.gemini/antigravity-ide/brain/ad385dce-8611-4653-95da-947db8febe54/media__1783413056653.png')
    response = model.generate_content(["Describe the UI design of the search bar in this image in detail. What shape is it? Where is the icon? What is the layout?", img])
    print(response.text)
except Exception as e:
    print("Error:", e)
