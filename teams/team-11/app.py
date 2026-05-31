import streamlit as st
import pandas as pd

from gap_analyser import (
    get_all_job_titles,
    compute_gap_matrix,
    PROFICIENCY_LEVELS,
    CUSTOM_SKILL_MAPPING
)

from llm_handler import (
    generate_learning_path,
    generate_gap_insights
)

from course_recommender import get_course_recommendations
from docx_exporter import export_to_docx


# ─────────────────────────────────────────────
# PAGE CONFIG
# ─────────────────────────────────────────────

st.set_page_config(
    page_title="Employee Skill Gap Analyser",
    page_icon="🎯",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ─────────────────────────────────────────────
# CUSTOM CSS
# ─────────────────────────────────────────────

st.markdown("""
<style>

    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

    html, body, [class*="css"] {
        font-family: 'Inter', sans-serif;
    }

    .main-header {
        background: linear-gradient(
            135deg,
            #00529B 0%,
            #0077CC 50%,
            #00A8E8 100%
        );

        padding: 2rem 2.5rem;
        border-radius: 16px;
        margin-bottom: 2rem;
        color: white;

        box-shadow: 0 8px 32px rgba(0,82,155,0.3);
    }

    .main-header h1 {
        font-size: 2.2rem;
        font-weight: 700;
        margin: 0;
    }

    .main-header p {
        font-size: 1rem;
        opacity: 0.9;
        margin-top: 0.5rem;
    }

    .metric-card {
        background: white;
        border-radius: 12px;
        padding: 1.2rem 1.5rem;
        box-shadow: 0 2px 12px rgba(0,0,0,0.08);
        margin-bottom: 1rem;
        border-left: 5px solid #00529B;
    }

    .metric-card h3 {
        margin: 0;
        font-size: 2rem;
        font-weight: 700;
        color: #00529B;
    }

    .metric-card p {
        margin: 0;
        font-size: 0.9rem;
        color: #666;
    }

    .section-header {
        font-size: 1.4rem;
        font-weight: 700;
        color: #00529B;
        border-bottom: 3px solid #00A8E8;
        padding-bottom: 0.5rem;
        margin: 1.5rem 0 1rem 0;
    }

    .course-card {
        background: #f8f9fa;
        border-radius: 10px;
        padding: 0.8rem 1rem;
        margin: 0.5rem 0;
        border-left: 4px solid #0077CC;
    }

    .stButton > button {
        background: linear-gradient(135deg, #00529B, #0077CC);
        color: white;
        border: none;
        border-radius: 8px;
        padding: 0.7rem 2rem;
        font-weight: 600;
        width: 100%;
    }

</style>
""", unsafe_allow_html=True)

# ─────────────────────────────────────────────
# HEADER
# ─────────────────────────────────────────────

st.markdown("""
<div class="main-header">
    <h1>🎯 Employee Skill Gap Analyser</h1>
    <p>
        Powered by O*NET Database · Udemy Courses · Groq LLM
        | Domain 11 — HR & Workforce AI
    </p>
</div>
""", unsafe_allow_html=True)

# ─────────────────────────────────────────────
# SIDEBAR
# ─────────────────────────────────────────────

with st.sidebar:

    st.image(
        "https://img.icons8.com/color/96/000000/training.png",
        width=80
    )

    st.markdown("## ⚙️ Configuration")

    api_key = st.text_input(
        "🔑 Groq API Key",
        type="password",
        placeholder="gsk_xxxxxxxxxxxxxxxxx",
        help="Get your API key from console.groq.com"
    )

    st.markdown("---")

    st.markdown("### 📋 How It Works")

    st.markdown("""
    1. Enter employee details  
    2. Select current skills & levels  
    3. Choose target role  
    4. Analyse skill gaps  
    5. Generate AI learning path  
    6. Download DOCX report  
    """)

    st.markdown("---")

    st.markdown("### 📊 Data Sources")

    st.markdown("""
    - 🗄️ O*NET Inspired Role Mapping  
    - 📚 Udemy Courses Dataset  
    - 🤖 Groq LLM (Llama 3)  
    """)

    st.markdown("---")

    st.caption("D11 | Maitri · Ria · Sagar · Puneet")

# ─────────────────────────────────────────────
# TABS
# ─────────────────────────────────────────────

tab1, tab2, tab3, tab4 = st.tabs([
    "📝 Employee Input",
    "📊 Skill Gap Matrix",
    "🗺️ Learning Path",
    "📥 Export Report"
])

# ─────────────────────────────────────────────
# TAB 1
# ─────────────────────────────────────────────

with tab1:

    st.markdown(
        '<div class="section-header">Employee Information</div>',
        unsafe_allow_html=True
    )

    col1, col2 = st.columns(2)

    with col1:

        employee_name = st.text_input(
            "👤 Employee Name",
            placeholder="e.g. Priya Sharma"
        )

        current_role = st.text_input(
            "💼 Current Role",
            placeholder="e.g. Junior Developer"
        )

        experience_years = st.slider(
            "📅 Years of Experience",
            0,
            20,
            2
        )

    with col2:

        all_titles = get_all_job_titles()

        target_role = st.selectbox(
            "🎯 Target Role",
            options=all_titles
        )

        education = st.selectbox(
            "🎓 Education Level",
            [
                "High School",
                "Diploma",
                "Bachelor's",
                "Master's",
                "PhD"
            ]
        )

    st.markdown(
        '<div class="section-header">Current Skills Assessment</div>',
        unsafe_allow_html=True
    )

    available_skills = sorted(
        list(CUSTOM_SKILL_MAPPING.keys())
    )

    num_skills = st.number_input(
        "How many skills do you want to add?",
        min_value=1,
        max_value=15,
        value=5
    )

    current_skills = {}

    cols = st.columns(2)

    for i in range(int(num_skills)):

        col_idx = i % 2

        with cols[col_idx]:

            skill_col, level_col = st.columns([2, 1])

            with skill_col:

                skill_name = st.selectbox(
                    f"Skill {i+1}",
                    options=available_skills,
                    key=f"skill_{i}"
                )

            with level_col:

                skill_level = st.selectbox(
                    "Level",
                    options=list(PROFICIENCY_LEVELS.keys()),
                    key=f"level_{i}",
                    index=2
                )

            current_skills[skill_name] = skill_level

    st.markdown("---")

    analyse_btn = st.button(
        "🔍 Analyse Skill Gaps",
        use_container_width=True
    )

    if analyse_btn:

        if not employee_name:

            st.error("Please enter employee name!")

        else:

            with st.spinner(
                "Analysing skill gaps..."
            ):

                try:

                    gap_df = compute_gap_matrix(
                        current_skills,
                        target_role
                    )

                    st.session_state["gap_df"] = gap_df
                    st.session_state["employee_name"] = employee_name
                    st.session_state["current_role"] = current_role
                    st.session_state["target_role"] = target_role
                    st.session_state["current_skills"] = current_skills

                    st.success(
                        "✅ Gap analysis completed successfully!"
                    )

                except Exception as e:

                    st.error(f"Error: {e}")

# ─────────────────────────────────────────────
# TAB 2
# ─────────────────────────────────────────────

with tab2:

    if "gap_df" not in st.session_state:

        st.info(
            "Please complete Employee Input first."
        )

    else:

        gap_df = st.session_state["gap_df"]

        emp_name = st.session_state["employee_name"]

        tgt_role = st.session_state["target_role"]

        st.markdown(
            f'<div class="section-header">'
            f'Skill Gap Matrix — {emp_name} → {tgt_role}'
            f'</div>',
            unsafe_allow_html=True
        )

        total = len(gap_df)

        met = len(gap_df[gap_df["Gap Score"] == 0])

        partial = len(gap_df[gap_df["Gap Score"] == 1])

        missing = len(gap_df[gap_df["Gap Score"] > 1])

        c1, c2, c3, c4 = st.columns(4)

        with c1:
            st.markdown(
                f'''
                <div class="metric-card">
                    <h3>{total}</h3>
                    <p>Total Skills</p>
                </div>
                ''',
                unsafe_allow_html=True
            )

        with c2:
            st.markdown(
                f'''
                <div class="metric-card">
                    <h3 style="color:#28a745">{met}</h3>
                    <p>✅ Skills Met</p>
                </div>
                ''',
                unsafe_allow_html=True
            )

        with c3:
            st.markdown(
                f'''
                <div class="metric-card">
                    <h3 style="color:#ffc107">{partial}</h3>
                    <p>⚠️ Partial Gaps</p>
                </div>
                ''',
                unsafe_allow_html=True
            )

        with c4:
            st.markdown(
                f'''
                <div class="metric-card">
                    <h3 style="color:#dc3545">{missing}</h3>
                    <p>❌ Missing Skills</p>
                </div>
                ''',
                unsafe_allow_html=True
            )

        st.markdown("---")

        st.markdown("### 📋 Detailed Skill Gap Matrix")

        display_df = gap_df[
            [
                "Skill",
                "Category",
                "Current Level",
                "Required Level",
                "Gap Score",
                "Status"
            ]
        ]

        st.dataframe(
            display_df,
            use_container_width=True,
            height=420
        )

        st.markdown("---")

        st.markdown("### 📊 Skill Gap Visualisation")

        chart_data = gap_df[
            gap_df["Gap Score"] > 0
        ][["Skill", "Gap Score"]]

        if not chart_data.empty:

            chart_data = chart_data.sort_values(
                by="Gap Score",
                ascending=False
            )

            chart_data = chart_data.set_index("Skill")

            st.bar_chart(
                chart_data,
                use_container_width=True
            )

        else:

            st.success(
                "🎉 No major skill gaps found!"
            )

        st.markdown("---")

        st.markdown("### 🤖 AI Career Insights")

        if api_key:

            if st.button(
                "🧠 Generate AI Insights",
                use_container_width=True
            ):

                with st.spinner(
                    "Groq AI is analysing your profile..."
                ):

                    insights = generate_gap_insights(
                        tgt_role,
                        gap_df,
                        api_key
                    )

                    st.session_state["insights"] = insights

            if "insights" in st.session_state:

                st.success(
                    "✅ AI Analysis Generated Successfully"
                )

                st.markdown(f"""
                <div style="
                    background-color:#102542;
                    padding:20px;
                    border-radius:12px;
                    border-left:5px solid #00A8E8;
                    font-size:17px;
                    line-height:1.8;
                    color:white;
                ">
                    🧠 {st.session_state["insights"]}
                </div>
                """, unsafe_allow_html=True)

        else:

            st.warning(
                "⚠️ Enter Groq API key in sidebar."
            )

# ─────────────────────────────────────────────
# TAB 3
# ─────────────────────────────────────────────

with tab3:

    if "gap_df" not in st.session_state:

        st.info(
            "Please complete Employee Input first."
        )

    else:

        gap_df = st.session_state["gap_df"]

        emp_name = st.session_state["employee_name"]

        tgt_role = st.session_state["target_role"]

        st.markdown(
            f'<div class="section-header">'
            f'6-Month Learning Path — {emp_name}'
            f'</div>',
            unsafe_allow_html=True
        )

        st.markdown(
            "#### 📚 Course Recommendations"
        )

        try:

            course_recs = get_course_recommendations(
                gap_df
            )

            st.session_state["course_recs"] = course_recs

        except Exception:

            course_recs = {}

        if course_recs:

            for skill, courses in list(course_recs.items())[:8]:

                if courses:

                    with st.expander(f"📌 {skill}"):

                        for course in courses:

                            st.markdown(f"""
                            <div class="course-card">
                                <strong>
                                📚 {course['title']}
                                </strong><br>

                                <small>
                                Level:
                                {course.get('level','All Levels')}
                                </small>
                            </div>
                            """, unsafe_allow_html=True)

        st.markdown("---")

        if not api_key:

            st.warning(
                "Enter Groq API key to generate learning path."
            )

        else:

            if st.button(
                "✨ Generate 6-Month Learning Path",
                use_container_width=True
            ):

                with st.spinner(
                    "Generating personalised roadmap..."
                ):

                    learning_path = generate_learning_path(
                        emp_name,
                        tgt_role,
                        gap_df,
                        course_recs,
                        api_key
                    )

                    st.session_state["learning_path"] = learning_path

            if "learning_path" in st.session_state:

                st.markdown(
                    st.session_state["learning_path"]
                )

# ─────────────────────────────────────────────
# TAB 4
# ─────────────────────────────────────────────

with tab4:

    st.markdown(
        '<div class="section-header">'
        '📥 Export DOCX Report'
        '</div>',
        unsafe_allow_html=True
    )

    if "gap_df" not in st.session_state:

        st.info("Please complete analysis first.")

    else:

        emp_name = st.session_state["employee_name"]

        cur_role = st.session_state["current_role"]

        tgt_role = st.session_state["target_role"]

        gap_df = st.session_state["gap_df"]

        learning_path = st.session_state.get(
            "learning_path",
            "Learning path not generated yet."
        )

        course_recs = st.session_state.get(
            "course_recs",
            {}
        )

        if st.button(
            "📄 Generate DOCX Report",
            use_container_width=True
        ):

            with st.spinner(
                "Generating report..."
            ):

                try:

                    docx_buffer = export_to_docx(
                        emp_name,
                        cur_role,
                        tgt_role,
                        gap_df,
                        learning_path,
                        course_recs
                    )

                    st.download_button(
                        label="⬇️ Download Report",
                        data=docx_buffer,
                        file_name=(
                            f"{emp_name.replace(' ','_')}"
                            "_SkillGap_Report.docx"
                        ),
                        mime=(
                            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        ),
                        use_container_width=True
                    )

                    st.success(
                        "✅ Report generated successfully!"
                    )

                except Exception as e:

                    st.error(f"Error: {e}")