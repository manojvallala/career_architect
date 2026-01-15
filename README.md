# 🚀 Career Architect AI

A privacy-first, AI-powered resume analyzer built with **React**, **FastAPI**, and **Local LLMs (Llama 3 / Phi-3)**.

## 💡 Overview
Career Architect AI helps job seekers optimize their resumes by comparing them against specific job descriptions. Unlike standard tools that rely on cloud APIs, this project leverages **Local Inference (Ollama)** to ensure sensitive resume data never leaves the user's device.

## ✨ Key Features
* **📄 PDF Parsing:** Extracts text seamlessly from PDF resumes.
* **🧠 Local AI Intelligence:** Uses **Llama 3** (via Ollama) to analyze gaps, assign match scores, and generate interview questions.
* **🔒 Privacy-Centric:** Zero data leakage; all processing happens on `localhost`.
* **🎨 Markdown Rendering:** Beautifully formatted reports with bolding and bullet points.

## 🛠️ Tech Stack
* **Frontend:** React.js, Tailwind CSS, Vite
* **Backend:** Python, FastAPI, Uvicorn
* **AI Engine:** Ollama (Llama 3 / Phi-3)

## 🚀 How to Run Locally

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# Activate venv
pip install -r requirements.txt
uvicorn main:app --reload