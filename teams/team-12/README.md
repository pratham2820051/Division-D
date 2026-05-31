# 👑 Multi-Agent Event Planning Orchestrator

A complete, production-ready cooperative multi-agent application developed for a 12-hour hackathon submission. The system leverages autonomous, domain-specialized agents acting in parallel to plan large academic or corporate events, synthesized by a central coordinator agent into a unified, styled master timeline, vendor brief, and communications pack.

---

## 🎯 System Architecture Diagram

The system employs a cooperative, data-grounded multi-agent network that runs parallel domain workers and maps outputs into structured corporate timelines:

```
                      +--------------------------------+
                      |   Streamlit UI Event Inputs    |
                      +--------------------------------+
                                       |
                                       v (Parallel Execution Thread)
            +--------------------------+--------------------------+
            |                          |                          |
            v                          v                          v
   +-----------------+        +-----------------+        +-----------------+
   |   Venue Agent   |        |  Speaker Agent  |        | Catering Agent  |
   | (Queries Meetup |        | (Invited Bios & |        | (Culinary Board |
   | Events CSV Data)|        | Session Topics) |        | & Cost Sheets)  |
   +-----------------+        +-----------------+        +-----------------+
            |                          |                          |
            +--------------------------+--------------------------+
            v                          v                          
   +-----------------+        +-----------------+
   | Logistics Agent |        |  Comms Agent    |
   | (AV technical & |        | (Attendee & VIP |
   | Setup Schedule) |        | Invite Mailers) |
   +-----------------+        +-----------------+
            |                          |
            +--------------------------+
                                       |
                                       v
                      +--------------------------------+
                      |  Coordinator Synthesis Engine  |
                      | (Incorporates Asana Checklist) |
                      +--------------------------------+
                                       |
                                       v
                      +--------------------------------+
                      |  Interactive UI / Word Export  |
                      +--------------------------------+
```

---

## 💻 Tech Stack & Dependencies

* **Python 3.10+**
* **Groq Python SDK & LangChain Core**: Fast LLM processing utilizing free-tier Llama 3 models (`llama3-8b-8192`) with sub-second execution latency.
* **Streamlit**: Full-featured interactive frontend user interface.
* **python-docx**: Programmatically builds professional MS Word strategies with shaded table borders, lists, callout boxes, and cover pages.
* **pandas & standard csv**: Queries and aggregates statistics from the Meetup dataset.
* **python-dotenv**: Handles environmental parameters and API configurations securely.

---

## 📦 Dataset Sourcing & Grounding

To provide highly realistic, data-backed planning recommendations, the orchestrator integrates two primary datasets:
1. **Kaggle Tech Meetup Dataset (`data/meetup_events.csv`)**: Contains over 150 realistic meetup records in 10 global cities. The Venue Agent queries this CSV to compute historical average attendance sizes and pricing ranges, ensuring recommended venue capacities strictly accommodate expected guest counts.
2. **Asana Event Template (`templates/event_checklist.json`)**: Pre-populates five phase milestones (Initiation, Sourcing, Logistics, Comms, Execution) inside the Coordinator Synthesis engine.
3. **AgentBench Benchmark Schemas**: Guides task coordinate quality, latency tracking, and budget safety constraints.

---

## 🖥️ Streamlit Interactive UI Pages

* **Page 1 — Event Input Form**:
  * Event Name, Type (Academic / Corporate / Cultural), expected guest counts, city location, date, theme domain, budget tiers, and dietary requirements.
* **Page 2 — Agent Dashboard**:
  * Shows each agent's name, active running status, dynamic progress loading bar, and individual Markdown log cards updating in real-time.
* **Page 3 — Final Event Plan**:
  * Unified Strategy metrics cards, master timelines table, vendor service briefs (venue, catering, AV), speaker lists, email copy tab panels (Attendee, Speaker, Reminders, Thank You), and a download button to export the finished MS Word strategy.

---

## 📄 Word Strategy Export Layout

The generated `.docx` file is built programmatically using professional corporate styling:
1. **Cover Page**: Large colored title, subtitle, and structured metadata block (Date, Location, Guests, Budget, Theme).
2. **Executive Summary**: Synthesized strategy parameters andcallout box.
3. **Master Timeline Table**: Formatted table with distinct borders and alternate shaded rows showing times, activities, and designated coordinators.
4. **Vendor Service Brief**: Consolidates venue recommendations, organic catering menus, and technical AV requirements.
5. **Speaker Profiles**: Detailed bio summaries, abstracts, and estimated honorarium costs.
6. **Logistics Checklist**: Operational bullet points for technical AV setup and transportation rules.
7. **Communication Pack**: Copy-paste ready drafts for all 4 emails formatted inside highlighted console containers.
8. **Footer**: Custom bottom margin tracker reading *"Generated by Multi-Agent Event Planning Orchestrator"*.

---

## 🚀 Setup & Installation Instructions

Follow these simple steps to run the application locally on Windows:

### 1. Prerequisites
Ensure you have Python 3.10 or higher installed. Open your terminal or PowerShell and navigate to the project directory:

```powershell
cd teams/team-12
```

### 2. Install Package Dependencies
Install all required libraries using the standard requirements file:

```powershell
pip install -r requirements.txt
```

### 3. Configure API Key
Create a `.env` file in the project folder and insert your Groq API Key:

```text
GROQ_API_KEY=gsk_your_actual_key_here
```

> 💡 **Built-in Simulation Backup**
> If no API Key is provided, the application automatically triggers **Simulation Mode**, utilizing high-fidelity local procedural engines to generate realistic, theme-matched plans. 

### 4. Run the Streamlit Dashboard
Launch the interface locally:

```powershell
python -m streamlit run app.py
```
This opens the local web page in your default browser at `http://localhost:8501`.
