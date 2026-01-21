import os
import io
import re
import uuid
import requests  # For Job Search API
from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import fitz  # PyMuPDF
from groq import Groq

# --- RAG IMPORTS ---
import chromadb
from chromadb.utils import embedding_functions

# --- DATABASE IMPORTS ---
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models

# Create Tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# --- 1. CONFIGURATION ---

# ⚠️ PASTE YOUR GROQ API KEY HERE ⚠️
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

# Setup ChromaDB (Vector Database for RAG)
chroma_client = chromadb.Client()
embed_fn = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")

# Setup CORS (Allows Frontend to talk to Backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 2. HELPER FUNCTIONS ---

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def extract_text_from_pdf(file_content):
    try:
        doc = fitz.open(stream=file_content, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        return text
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return ""

def chunk_text(text, chunk_size=500):
    # Splits text into smaller pieces so AI can remember specific details
    return [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]

# --- 3. CORE ENDPOINTS ---

@app.post("/analyze_resume/")
async def analyze_resume(
    file: UploadFile = File(...), 
    job_description: str = Form(...),
    db: Session = Depends(get_db)
):
    content = await file.read()
    resume_text = extract_text_from_pdf(content)
    
    if not resume_text:
        raise HTTPException(status_code=400, detail="Error: Could not read PDF.")

    # A. RAG INDEXING (Store Resume in Vector DB)
    try:
        chroma_client.delete_collection("resume_data") # Reset for new analysis
    except:
        pass
    
    collection = chroma_client.get_or_create_collection(name="resume_data", embedding_function=embed_fn)
    chunks = chunk_text(resume_text)
    ids = [str(uuid.uuid4()) for _ in chunks]
    collection.add(documents=chunks, ids=ids)

    # B. AI ANALYSIS (Senior Recruiter Persona)
    prompt = f"""
    Act as a Senior Technical Recruiter & Career Coach at a FAANG company. 
    Analyze the RESUME against the JOB DESCRIPTION strictly.
    
    RESUME: {resume_text[:6000]}
    JOB DESCRIPTION: {job_description}
    
    output a professional markdown report with the following EXACT SECTIONS:

    ## 🎯 Match Score: [0-100]%
    *(Give a harsh, realistic score based on keyword matching)*

    ## 🚨 Critical Gaps & Missing Skills
    * **Technical Gaps:** (List specific tools/languages missing from the resume but required in the JD)
    * **Soft Skill Gaps:** (Leadership, Agile, Communication gaps)
    * **Experience Gaps:** (e.g., "Missing cloud deployment experience")

    ## 📚 Where to Learn (Action Plan)
    *(For every missing skill above, recommend a specific resource)*
    * **Skill Name:** [Coursera/Udemy/Documentation Link or Course Name]
    * **Project Idea:** (Suggest a mini-project to prove this skill quickly)

    ## ✍️ Resume Optimization (Recruiter Hooks)
    * **Power Keywords to Add:** (List 10-15 ATS keywords found in the JD)
    * **Bullet Point Rewrites:** (Take 2 weak sentences from the resume and rewrite them using the "Google XYZ Formula": Accomplished [X] as measured by [Y], by doing [Z])

    ## 🚀 Speed to Selection
    * **Immediate Fixes:** (3 things to change TODAY to get an interview)
    * **Interview Prep:** (1-2 likely technical interview questions for this specific role)

    ## 💼 Job Hunt Strategy
    * **Best Websites for this Role:** (List 3 specific niche job boards, e.g., Wellfound for startups, Dice for tech, etc.)
    * **Target Companies:** (List 5 companies known for hiring this specific role actively)
    
    Keep the tone professional, direct, and encouraging. Use formatting (bolding, lists) to make it readable.
    """
    
    try:
        completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            stream=False,
        )
        ai_reply = completion.choices[0].message.content
        
        # C. SAVE TO DATABASE
        score_match = re.search(r"Match Score:.*?(\d+)", ai_reply, re.IGNORECASE)
        score = int(score_match.group(1)) if score_match else 0

        db_record = models.AnalysisResult(
            filename=file.filename,
            job_role=job_description[:50] + "...",
            match_score=score,
            missing_skills="Check Report",
            ai_response=ai_reply
        )
        db.add(db_record)
        db.commit()
        
        return {
            "analysis": ai_reply,
            "resume_text": resume_text,
            "saved_id": db_record.id
        }

    except Exception as e:
        return {"error": str(e)}

# --- 4. CHAT ENDPOINT (RAG POWERED) ---

class ChatRequest(BaseModel):
    message: str
    chat_history: list = []

@app.post("/chat/")
async def chat_recruiter(request: ChatRequest):
    # Retrieve relevant resume parts from Vector DB
    collection = chroma_client.get_or_create_collection(name="resume_data", embedding_function=embed_fn)
    results = collection.query(query_texts=[request.message], n_results=3)
    context_text = "\n".join(results['documents'][0]) if results['documents'] else ""

    system_prompt = f"""
    You are an expert interviewer. Answer the user's question based strictly on the Resume Context below.
    
    RESUME CONTEXT:
    {context_text}
    
    User Question: {request.message}
    """
    
    messages = [{"role": "system", "content": system_prompt}]
    for msg in request.chat_history:
        messages.append(msg)
    messages.append({"role": "user", "content": request.message})
    
    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages
        )
        return {"reply": completion.choices[0].message.content}
    except Exception as e:
        return {"error": str(e)}

# --- 5. NEW FEATURES (Cover Letter, LinkedIn, Jobs) ---

class RewriteRequest(BaseModel):
    resume_text: str
    job_description: str

@app.post("/generate_cover_letter/")
async def generate_cover_letter(request: RewriteRequest):
    prompt = f"""
    Write a persuasive, professional cover letter for this Job Description based on the Resume.
    JOB DESCRIPTION: {request.job_description}
    RESUME CONTEXT: {request.resume_text[:4000]}
    """
    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}]
        )
        return {"cover_letter": completion.choices[0].message.content}
    except Exception as e:
        return {"error": str(e)}

@app.post("/optimize_linkedin/")
async def optimize_linkedin(request: RewriteRequest):
    prompt = f"""
    Rewrite the following Resume content specifically for a LinkedIn Profile.
    RESUME: {request.resume_text[:4000]}
    Output 2 sections: ## 👨‍💻 About Section (Storytelling) and ## 🚀 Experience Highlights (Punchy bullets).
    """
    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}]
        )
        return {"linkedin_content": completion.choices[0].message.content}
    except Exception as e:
        return {"error": str(e)}

@app.get("/search_jobs/")
def search_jobs(query: str):
    url = "https://jsearch.p.rapidapi.com/search"
    querystring = {"query": query, "page": "1", "num_pages": "10"}
    
    headers = {
        "X-RapidAPI-Key": "87268bf440mshc9b92a6228896aap132cc2jsn7f7843919749",  # <--- YOUR KEY
        "X-RapidAPI-Host": "jsearch.p.rapidapi.com"
    }

    try:
        response = requests.get(url, headers=headers, params=querystring, timeout=10)
        data = response.json()
        if data.get("data"):
            return {"jobs": data["data"]}
        else:
            # Fallback if API quota exceeded
            return {"jobs": []} 
    except Exception as e:
        print(e)
        return {"jobs": []}

# --- 6. UTILITIES ---

@app.get("/history/")
def get_history(db: Session = Depends(get_db)):
    return db.query(models.AnalysisResult).order_by(models.AnalysisResult.id.desc()).limit(10).all()

@app.post("/improve_summary/")
async def improve_summary(request: RewriteRequest):
    prompt = f"Write a professional summary for this job: {request.job_description}. Context: {request.resume_text[:2000]}."
    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}]
        )
        return {"improved_summary": completion.choices[0].message.content}
    except Exception as e:
        return {"error": str(e)}