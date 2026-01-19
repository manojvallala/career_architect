from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pypdf import PdfReader
import io
import ollama
import re
import datetime

# --- DATABASE IMPORTS ---
# Ensure database.py and models.py exist in the same folder
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models

# Create database tables automatically
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# --- CORS SETUP ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DATABASE DEPENDENCY ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- HELPER: PDF EXTRACTION ---
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

# --- ENDPOINT 1: ANALYZE RESUME ---
@app.post("/analyze_resume/")
async def analyze_resume(
    file: UploadFile = File(...), 
    job_description: str = Form(...),
    db: Session = Depends(get_db)
):
    # 1. Read File
    content = await file.read()
    resume_text = extract_text_from_pdf(content)
    
    if not resume_text:
        return {"error": "Could not read text from PDF."}
    
    # 2. Prepare Prompt
    prompt = f"""
    Act as a strict technical recruiter. Analyze this resume against the job description.
    
    RESUME: {resume_text[:3000]}
    JOB DESCRIPTION: {job_description}
    
    IMPORTANT: You must include a line at the very top that says exactly:
    "MATCH SCORE: XX" (where XX is the number).
    Then provide the detailed report with Markdown formatting (Bold, Bullets).
    """

    try:
        # 3. Call AI (Phi-3 or Llama-3)
        print("Analyzing with AI...")
        response = ollama.chat(model='phi3', messages=[{'role': 'user', 'content': prompt}])
        ai_reply = response['message']['content']
        
        # 4. Extract Score (Regex)
        score_match = re.search(r"MATCH SCORE:\s*(\d+)", ai_reply)
        score = int(score_match.group(1)) if score_match else 0

        # 5. Save to Database
        db_record = models.AnalysisResult(
            filename=file.filename,
            job_role=job_description[:50] + "...", 
            match_score=score,
            missing_skills="Check Report", 
            ai_response=ai_reply
        )
        db.add(db_record)
        db.commit()
        db.refresh(db_record)

        # 6. Return Data (Including resume_text for the rewriter)
        return {
            "analysis": ai_reply, 
            "resume_text": resume_text[:5000], # Send back text for frontend state
            "saved_id": db_record.id
        }

    except Exception as e:
        print(f"Error: {e}")
        return {"error": str(e)}

# --- ENDPOINT 2: HISTORY (DASHBOARD) ---
@app.get("/history/")
def get_history(db: Session = Depends(get_db)):
    return db.query(models.AnalysisResult).order_by(models.AnalysisResult.id.desc()).limit(10).all()

# --- ENDPOINT 3: AI REWRITER ---
class RewriteRequest(BaseModel):
    resume_text: str
    job_description: str

@app.post("/improve_summary/")
async def improve_summary(request: RewriteRequest):
    prompt = f"""
    Act as a professional resume writer.
    
    JOB DESCRIPTION: {request.job_description}
    CANDIDATE RESUME CONTEXT: {request.resume_text[:2000]}
    
    TASK: Write a powerful, 3-4 sentence professional summary for this candidate optimized for the job above.
    OUTPUT: Just the summary text. No intro.
    """
    try:
        response = ollama.chat(model='phi3', messages=[{'role': 'user', 'content': prompt}])
        return {"improved_summary": response['message']['content']}
    except Exception as e:
        return {"error": str(e)}