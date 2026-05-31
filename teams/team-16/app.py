
from gemini_helper import (
    generate_summary,
    generate_explanation,
    generate_discrepancy,
    detect_crime_type
)

import streamlit as st
from pypdf import PdfReader

from section_detector import (
    detect_sections,
    get_section_details
)

from translator import translate_text

# -----------------------------
# PAGE CONFIG
# -----------------------------

st.set_page_config(
    page_title="NyayaSetu",
    page_icon="⚖️",
    layout="wide"
)

# -----------------------------
# SIDEBAR
# -----------------------------

with st.sidebar:

    st.title("⚖️ NyayaSetu")

    st.success(
        "AI-Powered FIR Analysis"
    )

    st.markdown("""
### Features

📄 FIR Extraction

⚖️ IPC/BNS Detection

🤖 AI Legal Analysis

👨‍⚖️ Legal Explanation

🌐 Kannada Translation

🌐 Hindi Translation

🔍 Discrepancy Analysis
""")

# -----------------------------
# HEADER
# -----------------------------

st.markdown("""
<div style='text-align:center;
padding:20px;
background:linear-gradient(90deg,#1e3c72,#2a5298);
border-radius:12px;
color:white;'>

<h1>⚖️ NyayaSetu</h1>

<h4>Bridging Citizens and Legal Understanding</h4>

</div>
""", unsafe_allow_html=True)

st.write("")

# -----------------------------
# DASHBOARD CARDS
# -----------------------------

col1, col2, col3, col4 = st.columns(4)

with col1:
    st.info("📄 FIR Upload")

with col2:
    st.info("⚖️ IPC Detection")

with col3:
    st.info("🌐 Translation")

with col4:
    st.info("🔍 Analysis")

st.write("")

# -----------------------------
# INPUTS
# -----------------------------

uploaded_file = st.file_uploader(
    "📄 Upload FIR PDF",
    type=["pdf"]
)

complaint = st.text_area(
    "📝 Enter Citizen Complaint"
)

# -----------------------------
# ANALYSIS BUTTON
# -----------------------------

if st.button("🚀 Analyze FIR"):

    if uploaded_file is not None:

        try:

            reader = PdfReader(uploaded_file)

            extracted_text = ""

            for page in reader.pages:

                text = page.extract_text()

                if text:
                    extracted_text += text + "\n"

            st.success(
                "✅ FIR PDF Processed Successfully"
            )

            # -----------------------------
            # FIR CONTENT
            # -----------------------------

            with st.expander(
                "📄 Extracted FIR Content",
                expanded=False
            ):

                st.text_area(
                    "FIR Text",
                    extracted_text,
                    height=250
                )

            # -----------------------------
            # IPC DETECTION
            # -----------------------------

            st.subheader(
                "⚖️ Detected IPC/BNS Sections"
            )

            sections = detect_sections(
                extracted_text
            )

            if sections:

                for sec in sections:

                    details = get_section_details(
                        sec
                    )

                    if details:

                        st.success(
                            f"IPC Section {sec}"
                        )

                        st.write(
                            f"Title: {details['title']}"
                        )

                        st.write(
                            f"Description: {details['description']}"
                        )

            else:

                st.info(
                    "No sections detected"
                )

            # -----------------------------
            # AI LEGAL ANALYSIS
            # -----------------------------

            st.subheader(
                "🤖 AI Legal Analysis"
            )

            legal_analysis = detect_crime_type(
                extracted_text
            )

            st.info(
                legal_analysis
            )

            # -----------------------------
            # SUMMARY
            # -----------------------------

            st.subheader(
                "📄 Citizen-Friendly FIR Summary"
            )

            simple_text = generate_summary(
                extracted_text
            )

            st.write(
                simple_text
            )

            # -----------------------------
            # LEGAL EXPLANATION
            # -----------------------------

            st.subheader(
                "👨‍⚖️ Legal Explanation"
            )

            citizen_explanation = (
                generate_explanation(
                    extracted_text
                )
            )

            st.info(
                citizen_explanation
            )

            # -----------------------------
            # TRANSLATIONS
            # -----------------------------

            translations = translate_text(
                citizen_explanation
            )

            col1, col2 = st.columns(2)

            with col1:

                st.subheader(
                    "🌐 Kannada Translation"
                )

                st.write(
                    translations["kannada"]
                )

            with col2:

                st.subheader(
                    "🌐 Hindi Translation"
                )

                st.write(
                    translations["hindi"]
                )

            # -----------------------------
            # DISCREPANCY
            # -----------------------------

            st.subheader(
                "🔍 Discrepancy Analysis"
            )

            result = (
                generate_discrepancy(
                    complaint,
                    extracted_text
                )
            )

            st.write(
                result
            )

        except Exception as e:

            st.error(
                f"Error reading PDF: {e}"
            )

    else:

        st.warning(
            "⚠️ Please upload a FIR PDF"
        )

# -----------------------------
# FOOTER
# -----------------------------

st.markdown("---")

st.caption(
    "⚖️ NyayaSetu © 2026 | AI-Powered Legal Assistance Platform"
)
