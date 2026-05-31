# BMTC Delay Explainer & Route Advisor

## Overview

BMTC Delay Explainer & Route Advisor is a GenAI-powered smart transport communication system designed to improve passenger communication during public transport disruptions.

The system generates passenger-friendly delay announcements, provides Kannada translations, creates voice announcements, suggests alternate routes, and generates official incident reports for transport authorities.

---

## Features

* Gemini LLM-based Passenger Announcement Generation
* English Announcements
* Kannada Translation
* Voice Output (English & Kannada)
* Alternate Route Suggestion
* Incident Report Generation
* Dijkstra-based Route Demonstration
* Interactive Streamlit Dashboard

---

## Problem Statement

Commuters often face unexplained delays in public transportation with limited communication from transit authorities.

This project helps by:

* Explaining delays in simple language
* Generating multilingual announcements
* Providing alternate route suggestions
* Producing official incident reports
* Demonstrating route optimization concepts

---

## Tech Stack

* Python
* Streamlit
* Google Gemini API
* Pandas
* Deep Translator
* gTTS (Google Text-to-Speech)
* Dijkstra Algorithm
* BMTC Route Dataset

---

## Dataset Used

### BMTC Route Dataset

Used route information from:

* routes.csv

The dataset provides route identifiers and route names used within the dashboard.

---

## Project Structure

```text
D7-TransportAI/
│
├── app.py
├── config.py
├── requirements.txt
├── .env
│
├── data/
│   └── routes.csv
│
├── modules/
│   ├── ai_engine.py
│   ├── dataset_loader.py
│   ├── delay_processor.py
│   ├── dijkstra_route.py
│   ├── report_generator.py
│   ├── route_advisor.py
│   ├── translator.py
│   └── voice_generator.py
│
└── README.md
```

---

## Installation

Clone the repository:

```bash
git clone <repository-url>
cd D7-TransportAI
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Or install manually:

```bash
pip install streamlit pandas google-generativeai python-dotenv deep-translator gtts
```

---

## Environment Variables

Create a `.env` file in the project root:

```env
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

---

## Run the Project

```bash
streamlit run app.py
```

---

## System Architecture

```text
BMTC Route Dataset
        ↓
User Input
(Route, Cause, Delay)
        ↓
Delay Severity Processing
        ↓
Gemini LLM
        ↓
English Announcement
        ↓
Kannada Translation
        ↓
Voice Generation
        ↓
Alternate Route Suggestion
        ↓
Incident Report Generation
```

---

## Dependencies Used

| Package             | Purpose                         |
| ------------------- | ------------------------------- |
| streamlit           | Dashboard UI                    |
| pandas              | Dataset Handling                |
| google-generativeai | Gemini LLM Integration          |
| python-dotenv       | Environment Variable Management |
| deep-translator     | English to Kannada Translation  |
| gtts                | Text-to-Speech Conversion       |

---

## LLM Used

**Google Gemini 1.5 Flash**

Used for generating passenger-friendly transport delay announcements.

---

## Future Enhancements

* Real-time BMTC Transit Data Integration
* Dynamic Route Optimization using Live Traffic Data
* GTFS Dataset Integration
* Advanced Alternate Route Recommendations
* Enhanced Multilingual Support
* Mobile Application Deployment

---

## Team Contribution

This project was developed as part of a Smart Cities & Infrastructure GenAI Hackathon focused on improving public transport communication and passenger experience.
