import google.generativeai as genai
import os

# --- PASTE YOUR KEY HERE ---
GOOGLE_API_KEY = "AIzaSyB22p60XP4MWaNISzE-fb-mcxKovgaYsmg"
genai.configure(api_key=GOOGLE_API_KEY)

print("Checking available models...")
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"- {m.name}")
except Exception as e:
    print(f"Error: {e}")