# 🎯 Employee Skill Gap Analyser & Learning Path Generator

**Division D Hackathon Submission — Team 11**

An AI-powered HR intelligence tool that bridges the gap between current employee capabilities and their future career aspirations. 

---

## 🚀 Overview

In today's rapidly evolving job market, organizations struggle to objectively measure employee skills against target roles. Furthermore, providing actionable, personalized learning resources for career advancement is often a manual and inefficient process. 

**Our Solution:**  
We built an end-to-end, AI-driven platform that evaluates an employee's current skill set against the requirements of their desired role. By leveraging industry-standard role definitions (inspired by O*NET), a comprehensive Udemy course dataset, and the powerful Groq LLM, our tool provides a detailed gap analysis, actionable career insights, and a highly personalized 6-month learning roadmap.

---

## ✨ Key Features

- **📊 Skill Gap Matrix:** Dynamically maps user-inputted skills against required competencies for target roles, categorizing them into *Met*, *Partial*, or *Missing* skills.
- **🧠 AI-Powered Career Insights:** Utilizes Groq's `llama-3.3-70b-versatile` model to generate encouraging, professional, and practical advice on how to bridge major skill gaps.
- **📚 Smart Course Recommendations:** Parses a comprehensive Udemy dataset to recommend highly-rated and relevant learning resources tailored precisely to the identified missing skills.
- **🗺️ Personalized Learning Roadmap:** Automatically generates a structured, month-by-month 6-month learning path to guide the employee's upskilling journey.
- **📥 One-Click Export:** Compiles the gap analysis, AI insights, and learning path into a professionally formatted, downloadable DOCX report.
- **🎨 Interactive Dashboard:** A seamless, responsive, and aesthetically pleasing Streamlit interface for HR professionals and employees alike.

---

## 🛠️ Technology Stack

- **Frontend:** [Streamlit](https://streamlit.io/) with Custom CSS for a dynamic, responsive UI.
- **Backend Logic:** Python, Pandas (Data Manipulation).
- **AI & LLM:** [Groq API](https://groq.com/) (Llama-3.3-70b-versatile) for natural language processing and roadmap generation.
- **Data Sources:** 
  - O*NET-inspired Role & Skill Definitions
  - Udemy Courses Dataset (`udemy_courses.csv`)
- **Document Generation:** `python-docx` for automated report creation.

---

## ⚙️ How It Works

1. **Employee Input:** The user inputs their current role, experience, and self-assessed skill levels.
2. **Target Selection:** The user selects their target role.
3. **Gap Computation:** The engine cross-references the inputs with standard job requirements to generate a visual gap matrix.
4. **AI Generation:** The LLM processes the gaps to generate career insights and a 6-month timeline.
5. **Resource Matching:** The recommendation engine finds the best matching Udemy courses for each gap.
6. **Export:** The entire analysis is bundled into a DOCX report for easy sharing.

---

## 💻 Setup & Installation

If you would like to run this project locally, follow these steps:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/GenAI-Hackathon2026/division-d.git
   cd division-d/teams/team-11
   ```

2. **Install dependencies:**
   Make sure you have Python installed, then run:
   ```bash
   pip install streamlit pandas groq python-docx
   ```

3. **Set up API Key:**
   Obtain a free API key from [Groq Console](https://console.groq.com/).

4. **Run the Application:**
   ```bash
   streamlit run app.py
   ```
   *Enter your Groq API key in the sidebar configuration section when the app launches.*

---

## 👥 Meet Team 11 (Domain 11 — HR & Workforce AI)

- **Maitri** 
- **Ria** 
- **Sagar** 
- **Puneet** 
