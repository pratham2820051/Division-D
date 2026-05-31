import streamlit as st
import google.generativeai as genai
from dotenv import load_dotenv
from gtts import gTTS
import tempfile
import os
import json

# Load API Key
load_dotenv()

genai.configure(
    api_key=os.getenv("GEMINI_API_KEY")
)

model = genai.GenerativeModel("gemini-2.5-flash")

# Page Config
st.set_page_config(
    page_title="Multilingual STEM Explainer",
    page_icon="📚",
    layout="wide"
)

# Sidebar
st.sidebar.title("📚 Demo Concepts")

demo_concept = st.sidebar.selectbox(
    "Quick Demo",
    [
        "",
        "Photosynthesis",
        "Newton's Laws",
        "Pythagoras Theorem",
        "Acids and Bases",
        "Binary Numbers"
    ]
)

st.sidebar.markdown("---")

st.sidebar.success(
    """
    Supports:

    ✅ English
    ✅ Kannada
    ✅ Hindi
    ✅ STEM Concepts
    ✅ Local Analogies
    ✅ Difficulty Levels
    ✅ Audio Support
    """
)

# Header
st.title("📚 Multilingual STEM Explainer")

st.markdown("""
### 🎯 Features

✅ English Explanation  
✅ Kannada Explanation  
✅ Hindi Explanation  
✅ Difficulty-Based Learning  
✅ Karnataka Village Analogy  
✅ Audio Playback
""")

# Inputs
col1, col2 = st.columns(2)

with col1:
    subject = st.selectbox(
        "📖 Select Subject",
        [
            "Biology",
            "Physics",
            "Chemistry",
            "Mathematics",
            "Computer Science"
        ]
    )

with col2:
    grade = st.selectbox(
        "🎓 Select Difficulty Level",
        [
            "Primary",
            "Secondary",
            "Pre-University",
            "All Levels"
        ]
    )

concept = st.text_input(
    "💡 Enter Concept",
    value=demo_concept,
    placeholder="Example: Photosynthesis"
)

# Generate Button
if st.button("🚀 Generate Explanation", use_container_width=True):

    if concept:

        prompt = f"""
Return ONLY valid JSON.

{{
    "english": "",
    "kannada": "",
    "hindi": "",
    "analogy": ""
}}

Subject: {subject}
Concept: {concept}
Difficulty Level: {grade}

Generate:
1. English explanation
2. Kannada explanation
3. Hindi explanation
4. Karnataka village analogy

Rules:
- Keep explanations educational.
- Use simple language.
- Match the selected difficulty level.
- Return ONLY JSON.
"""

        with st.spinner("Generating explanation..."):

            try:

                response = model.generate_content(prompt)

                text = response.text.strip()

                if text.startswith("```json"):
                    text = text.replace("```json", "")
                    text = text.replace("```", "")
                    text = text.strip()

                data = json.loads(text)

                english = data["english"]
                kannada = data["kannada"]
                hindi = data["hindi"]
                analogy = data["analogy"]

                st.success("✅ Explanation Generated Successfully!")

                st.markdown("---")

                col1, col2, col3 = st.columns(3)

                # English Panel
                with col1:

                    st.subheader("English Explanation")
                    st.info(english)

                    try:
                        english_audio = gTTS(
                            text=english,
                            lang="en"
                        )

                        eng_file = tempfile.NamedTemporaryFile(
                            delete=False,
                            suffix=".mp3"
                        )

                        english_audio.save(eng_file.name)

                        st.audio(eng_file.name)

                    except:
                        st.warning("English audio unavailable")

                # Kannada Panel
                with col2:

                    st.subheader("Kannada Explanation")
                    st.info(kannada)

                    try:
                        kannada_audio = gTTS(
                            text=kannada,
                            lang="kn"
                        )

                        kn_file = tempfile.NamedTemporaryFile(
                            delete=False,
                            suffix=".mp3"
                        )

                        kannada_audio.save(kn_file.name)

                        st.audio(kn_file.name)

                    except:
                        st.warning("Kannada audio unavailable")

                # Hindi Panel
                with col3:

                    st.subheader("Hindi Explanation")
                    st.info(hindi)

                    try:
                        hindi_audio = gTTS(
                            text=hindi,
                            lang="hi"
                        )

                        hi_file = tempfile.NamedTemporaryFile(
                            delete=False,
                            suffix=".mp3"
                        )

                        hindi_audio.save(hi_file.name)

                        st.audio(hi_file.name)

                    except:
                        st.warning("Hindi audio unavailable")

                st.markdown("---")

                st.subheader("🌾 Karnataka Village Analogy")
                st.success(analogy)

            except Exception as e:
                st.error(f"Error: {e}")

    else:
        st.warning("⚠ Please enter a concept.")