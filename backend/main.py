from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pypdf import PdfReader
import io
import ollama  # <--- NEW LIBRARY
import json

app = FastAPI()

# --- CORS MIDDLEWARE ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- HELPER: Extract Text ---
def extract_text_from_pdf(file_content):
    try:
        pdf_reader = PdfReader(io.BytesIO(file_content))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() or ""
        return text
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return ""

@app.post("/analyze_resume/")
async def analyze_resume(
    file: UploadFile = File(...), 
    job_description: str = Form(...)
):
    # 1. Read the PDF
    content = await file.read()
    resume_text = extract_text_from_pdf(content)
    
    if not resume_text:
        return {"error": "Could not read text from PDF."}
    
    # 2. Prepare Prompt for Llama 3
    # We ask for JSON specifically so your frontend can read it easily
    prompt = f"""
    You are an expert technical recruiter. Analyze this resume against the job description.
    
    RESUME:
    {resume_text[:2000]}  # Truncate to avoid context limits if needed
    
    JOB DESCRIPTION:
    {job_description}
    
    Provide a professional response. 
    Strictly format your answer as clean text (not JSON) with these sections:
    
    1. MATCH SCORE: (Give a score out of 100)
    2. MISSING SKILLS: (List key missing skills)
    3. INTERVIEW QUESTIONS: (List 3 specific questions)
    4. ADVICE: (One paragraph of advice)
    """

    print("Sending to Llama 3...") # Debug log

    try:
        # 3. Call Local Ollama Model
        response = ollama.chat(model='llama3', messages=[
            {
                'role': 'user',
                'content': prompt,
            },
        ])
        
        # 4. Extract the answer
        ai_reply = response['message']['content']
        return {"analysis": ai_reply}

    except Exception as e:
        print(f"Llama Error: {e}")
        return {"error": f"AI Engine Error: {str(e)}"}

@app.get("/")
def read_root():
    return {"message": "Career Architect (Llama 3 Edition) is Running!"}