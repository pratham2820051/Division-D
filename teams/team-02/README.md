# 📚 Multilingual STEM Explainer

## Problem Statement

Many students, especially from rural and regional language backgrounds, struggle to understand STEM (Science, Technology, Engineering, and Mathematics) concepts because educational content is often available only in English.

This language barrier reduces comprehension, engagement, and interest in STEM subjects.

The goal of this project is to make STEM education more accessible by providing multilingual explanations, localized examples, and audio support.

---

## Project Overview

Multilingual STEM Explainer is an AI-powered educational platform that generates STEM concept explanations in multiple languages and difficulty levels.

The application uses Google's Gemini API to generate concept explanations and provides audio narration for improved accessibility.

The platform currently supports:

* English
* Kannada
* Hindi

along with localized Karnataka village analogies to improve concept understanding.

---

## Objectives

* Provide STEM concept explanations in multiple languages.
* Reduce language barriers in education.
* Improve conceptual understanding through local analogies.
* Support different learning levels.
* Provide audio-based learning assistance.
* Encourage self-learning among students.

---

## Key Features

### 🌍 Multilingual Learning

* English Explanation
* Kannada Explanation
* Hindi Explanation

### 🎓 Difficulty-Based Learning

* Primary Level
* Secondary Level
* Pre-University Level

### 🔊 Audio Support

* Text-to-Speech generation for explanations.
* Helps students learn through listening.

### 🌾 Localized Learning

* Karnataka village-based analogies.
* Real-world examples for easier understanding.

### ⚡ AI-Powered Content Generation

* Dynamic explanations generated using Gemini API.
* Supports a wide range of STEM concepts.

---

## Workflow

1. User selects a STEM subject.
2. User chooses a difficulty level.
3. User enters a concept.
4. Streamlit frontend sends the request.
5. Gemini API generates explanations.
6. Explanations are returned in:

   * English
   * Kannada
   * Hindi
7. Karnataka village analogy is generated.
8. Audio narration is created using gTTS.
9. Results are displayed to the user.

---

## System Architecture

User Input

↓

Streamlit Frontend

↓

Gemini API

↓

Explanation Generation

↓

Multilingual Output

↓

Audio Generation (gTTS)

↓

User Interface

---

## Technologies Used

### Frontend

* Streamlit

### Backend

* Python

### AI Model

* Gemini 2.5 Flash

### Audio Generation

* Google Text-to-Speech (gTTS)

### Environment Management

* Python Virtual Environment

---

## Project Structure

```text
team-02
│
├── app.py
├── README.md
├── requirements.txt
├── Multilingual_STEM_Explainer.pptx
└── .gitignore
```

---

## Installation

```bash
pip install -r requirements.txt
```

---

## Run the Application

```bash
streamlit run app.py
```

---

## Future Enhancements

* Additional Indian language support.
* Image and diagram generation.
* STEM quizzes and assessments.
* Voice-based interaction.
* Offline educational mode.
* Personalized learning recommendations.

---

## Team Members

* Spoorthi Hiremath
* Supritkumar RP
* Manish
* Prasad

---

## Conclusion

Multilingual STEM Explainer demonstrates how Generative AI can make education more inclusive and accessible. By combining multilingual explanations, localized analogies, and audio support, the platform helps students understand STEM concepts in a simple and engaging manner.

This project contributes toward bridging educational gaps and promoting accessible learning for all.
