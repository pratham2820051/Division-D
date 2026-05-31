# Smart Podcast Generation from Academic Research Papers

## Overview

Smart Podcast Generation from Academic Research Papers is a Generative AI-powered system that transforms research papers into podcast-style content. The system analyzes research papers, identifies research gaps, generates conversational podcast scripts, and produces supporting content such as show notes, key terms, and timestamps.

The objective is to improve research accessibility and science communication by enabling users to consume research papers in an engaging and easy-to-understand format.

---

## Problem Statement

The growing volume of research publications makes it challenging to communicate scientific findings effectively. Research papers are often lengthy, highly technical, and difficult for non-specialists to understand.

This project addresses the problem by automatically converting research papers into podcast-style content, making scientific knowledge more accessible and easier to consume.

---

## Features

* Research Paper PDF Upload
* PDF Text Extraction
* Research Paper Analysis
* Research Gap Identification
* Dataset-Guided Content Simplification
* Podcast Script Generation
* Show Notes Generation
* Key Terms Extraction
* Timestamp Generation
* DOCX Export
* Multiple Podcast Styles

---

## System Workflow

Research Paper PDF

↓

PDF Text Extraction

↓

Research Paper Analysis

↓

Research Gap Detection

↓

Scientific Lay Summarisation Dataset Integration

↓

Podcast Script Generation

↓

Show Notes + Key Terms + Timestamps

↓

DOCX Export

↓

Audio Generation 

---

## Dataset Used

### Scientific Lay Summarisation Dataset

Source:

https://huggingface.co/datasets/pszemraj/scientific_lay_summarisation-plos-norm

Dataset Characteristics:

* 24,000+ Scientific Articles
* Human-Written Layman Summaries
* Designed for scientific content simplification

Purpose:

The dataset is used to provide examples of how complex scientific content can be transformed into simpler and more understandable explanations. These examples guide podcast generation and improve content accessibility.

---

## Technologies Used

| Technology            | Purpose                                |
| --------------------- | -------------------------------------- |
| Streamlit             | User Interface                         |
| PyPDF                 | PDF Text Extraction                    |
| Llama 3.3 70B         | Research Analysis & Podcast Generation |
| Groq API              | Model Inference                        |
| Hugging Face Datasets | Dataset Integration                    |
| python-docx           | DOCX Export                            |
| gTTS                  | Audio Generation                       |

---

## Model Used

### Llama 3.3 70B

Provider: Meta AI

Accessed Through: Groq API

Applications:

* Research Paper Analysis
* Research Gap Detection
* Podcast Script Generation
* Show Notes Generation
* Timestamp Creation
* Key Terms Extraction

---

## Project Structure

```text
project/
│
├── app.py
├── requirements.txt
├── README.md
├── generated_docs/
├── generated_audio/
├── sample_papers/
└── dataset/
```

---

## Installation

### Clone Repository

```bash
git clone https://github.com/your-username/repository-name.git
cd repository-name
```

### Create Virtual Environment

```bash
python -m venv venv
```

### Activate Environment

Windows:

```bash
venv\Scripts\activate
```

Linux / Mac:

```bash
source venv/bin/activate
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

---

## Environment Variables

Create a `.env` file:

```env
GROQ_API_KEY=your_api_key_here
```

---

## Run Application

```bash
streamlit run app.py
```

Application will be available at:

```text
http://localhost:8501
```

---

## Current Progress

### Completed

* PDF Upload
* PDF Text Extraction
* Research Paper Analysis
* Research Gap Detection
* Dataset Integration
* Podcast Script Generation
* Show Notes Generation
* Key Terms Extraction
* Timestamp Generation
* DOCX Export
* Audio Generation

---

## Future Enhancements

* MP3 Podcast Generation
* Advanced Dataset Retrieval
* Multi-Language Podcast Support
* Voice Customization
* Cloud Deployment
* User Authentication

---

## Expected Impact

The system aims to:

* Improve accessibility of scientific research
* Reduce time required to understand research papers
* Support science communication
* Enable audio-based research consumption
* Assist students, researchers, and professionals

---

## Team

Project Title:

**Smart Podcast Generation from Academic Research Papers**

Domain:

Generative AI | Natural Language Processing | Science Communication

---

## License

This project is developed for academic and hackathon purposes.
