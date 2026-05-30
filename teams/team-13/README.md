# D13 — Building Plan Compliance Checker

**College:** KLE Technological University, Belagavi  
**Domain:** Smart Cities & Infrastructure  
**Team:** Prajwal Karigoudar | Pratham P Honnappanavar | Abhishek Sonnahali | MD Waseem R Naikar

---

## Project Overview

A GenAI-powered web application that automatically checks building plans against
**HDUDA Master Plan 2031** Development Control Regulations for Hubballi-Dharwad.

## Features

- PDF regulation ingestion with FAISS semantic search
- 8-parameter compliance check (FAR, Height, Setbacks, Coverage, Floors, Road Width)
- Rule-based HDUDA DC Regulation engine (works without API quota)
- Professional PDF compliance report with PASS/FAIL table
- Non-conformity report with cited regulation clauses
- Streamlit web interface with demo building pre-fill

## Tech Stack

Python | Streamlit | LangChain | FAISS | Sentence Transformers | Google Gemini API | ReportLab

## Setup

```bash
pip install -r requirements.txt
# Add your Gemini API key to .env (see .env.example)
python -m streamlit run app.py
```

## Usage

1. Upload HDUDA Master Plan 2031 PDF → Click "Process Regulations"
2. Fill building specification form or click "Load Demo Building"
3. Click "CHECK COMPLIANCE"
4. View results and download PDF report
