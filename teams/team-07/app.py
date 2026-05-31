import streamlit as st

from modules.dataset_loader import load_routes
from modules.delay_processor import process_delay
from modules.ai_engine import generate_announcement
from modules.translator import translate_to_kannada
from modules.route_advisor import suggest_route
from modules.report_generator import generate_report
from modules.voice_generator import generate_voice
from modules.dijkstra_route import dijkstra, graph


# PAGE CONFIG
st.set_page_config(
    page_title="BMTC Delay Explainer",
    layout="wide"
)

# LIGHT PURPLE THEME
st.markdown("""
<style>

/* HEADINGS */

h1{
    color:#8b5cf6 !important;
    font-weight:700;
}

h2,h3{
    color:#a78bfa !important;
}

/* BUTTONS */

.stButton > button{
    background:#8b5cf6;
    color:white;
    border:none;
    border-radius:12px;
    padding:10px 20px;
    font-weight:600;
}

.stButton > button:hover{
    background:#7c3aed;
}

/* METRIC CARDS */

div[data-testid="stMetric"]{
    background:#1f2937;
    padding:15px;
    border-radius:15px;
    border:1px solid #8b5cf6;
}

div[data-testid="stMetricLabel"]{
    color:white !important;
    font-weight:600 !important;
}

div[data-testid="stMetricValue"]{
    color:white !important;
    font-weight:700 !important;
}

/* SUCCESS BOXES */

.stSuccess{
    border-radius:12px !important;
}

/* INFO BOXES */

.stInfo{
    border-radius:12px !important;
}

/* SELECT BOXES */

div[data-baseweb="select"] > div{
    border-radius:12px !important;
}

/* CODE BLOCKS */

pre{
    border-radius:12px !important;
}

/* AUDIO PLAYERS */

audio{
    width:100%;
}

</style>
""", unsafe_allow_html=True)


# TITLE
st.title("BMTC Delay Explainer & Route Advisor")

# LOAD DATASET
df = load_routes()


# USER INPUTS
route = st.selectbox(
    "Select Route",
    df['route_long_name']
)

# DELAY CAUSE

cause = st.selectbox(
    "Select Delay Cause",
    [
        "Heavy Rain",
        "Traffic",
        "Vehicle Breakdown",
        "Construction",
        "Accident",
        "Technical Issue",
        "Road Block",
        "Other"
    ]
)

# CUSTOM CAUSE INPUT

if cause == "Other":

    custom_reason = st.text_input(
        "Enter Custom Delay Reason"
    )

    if custom_reason.strip() != "":
        cause = custom_reason

# DELAY DURATION
# DELAY DURATION

delay_option = st.selectbox(
    "Select Delay Duration",
    [
        "15 mins",
        "30 mins",
        "45 mins",
        "60 mins",
        "3 Hours",
        "1 Day",
        "1 Week",
        "1 Month",
        "Never"
    ]
)

delay_map = {

    "15 mins":15,
    "30 mins":30,
    "45 mins":45,
    "60 mins":60,

    "3 Hours":180,

    "1 Day":1440,

    "1 Week":10080,

    "1 Month":43200,

    "Never":"999999"
}

duration = delay_map[delay_option]

# PROCESS SEVERITY

severity = process_delay(duration)

# DIJKSTRA INPUTS
colA,colB = st.columns(2)

with colA:

    source = st.selectbox(
        "Source Stop",
        list(graph.keys())
    )

with colB:

    destination = st.selectbox(
        "Destination Stop",
        list(graph.keys())
    )

# PROCESS SEVERITY
severity = process_delay(duration)

# INFO CARDS
st.subheader("Delay Information")

c1,c2,c3,c4 = st.columns(4)

with c1:

    route_display = (
        route[:20] + "..."
        if len(route) > 20
        else route
    )

    st.metric(
        "Route",
        route_display
    )

with c2:
    st.metric("Cause", cause)

with c3:
    st.metric("Delay", delay_option)

with c4:
    st.metric("Severity", severity)


# BUTTON
if st.button("Generate AI Announcement"):

    # ANNOUNCEMENT
    announcement = generate_announcement(
        route,
        cause,
        delay_option,
        severity
    )

    # TRANSLATION
    kannada = translate_to_kannada(
        announcement
    )

    # AUDIO
    english_audio = generate_voice(
        announcement,
        'en',
        'english.mp3'
    )

    kannada_audio = generate_voice(
        kannada,
        'kn',
        'kannada.mp3'
    )

    # RULE ROUTE ADVISOR
    alt_route, extra_time = suggest_route(
        cause,
        duration
    )

    # DIJKSTRA ROUTE
    cost, path = dijkstra(
        graph,
        source,
        destination
    )

    # REPORT
    report = generate_report(
        route,
        cause,
        delay_option,
        severity
    )

    # 2 COLUMN DASHBOARD
    left,right = st.columns([1.4,1])

    # LEFT COLUMN
    with left:

        st.subheader("🇬🇧 English Announcement")

        st.success(announcement)

        st.audio(english_audio)

        st.subheader("🇮🇳 Kannada Announcement")

        st.info(kannada)

        st.audio(kannada_audio)

    # RIGHT COLUMN
    with right:

        st.subheader("Alternate Route")

        st.success(
            f"Recommended Route: {alt_route}"
        )

        st.write(
            f"Estimated Extra Time: {extra_time}"
        )

        st.subheader("Dijkstra Route")

        if path:

            st.success(
                " ➜ ".join(path)
            )

            st.write(
                f"Shortest Travel Time: {cost} mins"
            )

        else:

            st.error(
                "No route found."
            )

        st.subheader(
            "Incident Report"
        )

        st.code(report)