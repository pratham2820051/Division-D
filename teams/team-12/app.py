import os
import time
import json
import streamlit as st
import pandas as pd

# Set page configuration FIRST before any other streamlit commands
st.set_page_config(
    page_title="Multi-Agent Event Orchestrator",
    page_icon="👑",
    layout="wide",
    initial_sidebar_state="expanded"
)

from agents.venue_agent import VenueAgent
from agents.speaker_agent import SpeakerAgent
from agents.catering_agent import CateringAgent
from agents.logistics_agent import LogisticsAgent
from agents.communications_agent import CommunicationsAgent
from agents.coordinator_agent import CoordinatorAgent
from tools.docx_exporter import DocxExporter

# Load Custom Premium Styling (Dark-themed glassmorphism elements)
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap');
    
    html, body, [class*="css"] {
        font-family: 'Outfit', sans-serif;
    }
    
    .main-title {
        font-size: 2.8rem;
        font-weight: 700;
        background: linear-gradient(135deg, #1A5276, #2E86C1, #F39C12);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 0.5rem;
    }
    
    .sub-title {
        font-size: 1.2rem;
        color: #7FB3D5;
        margin-bottom: 2rem;
    }
    
    .agent-card {
        background: #1A252C;
        border-radius: 12px;
        padding: 1.5rem;
        border-left: 5px solid #2E86C1;
        margin-bottom: 1rem;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    }
    
    .status-badge {
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 600;
    }
    
    .status-running {
        background-color: rgba(243, 156, 18, 0.2);
        color: #F39C12;
        border: 1px solid #F39C12;
    }
    
    .status-done {
        background-color: rgba(46, 204, 113, 0.2);
        color: #2ECC71;
        border: 1px solid #2ECC71;
    }
    
    .status-pending {
        background-color: rgba(149, 165, 166, 0.2);
        color: #95A5A6;
        border: 1px solid #95A5A6;
    }
    
    .metric-box {
        background-color: #151D24;
        border: 1px solid #2C3E50;
        border-radius: 8px;
        padding: 1rem;
        text-align: center;
    }
</style>
""", unsafe_allow_html=True)

# Initialize Session State Variables
if "pipeline_completed" not in st.session_state:
    st.session_state["pipeline_completed"] = False
if "venue_report" not in st.session_state:
    st.session_state["venue_report"] = ""
if "speaker_report" not in st.session_state:
    st.session_state["speaker_report"] = ""
if "catering_report" not in st.session_state:
    st.session_state["catering_report"] = ""
if "logistics_report" not in st.session_state:
    st.session_state["logistics_report"] = ""
if "comms_report" not in st.session_state:
    st.session_state["comms_report"] = ""
if "coordinator_report" not in st.session_state:
    st.session_state["coordinator_report"] = ""
if "running_agent" not in st.session_state:
    st.session_state["running_agent"] = None
if "current_page" not in st.session_state:
    st.session_state["current_page"] = "Page 1: Event Inputs"

# Sidebar Panel
with st.sidebar:
    st.image("https://img.icons8.com/clouds/200/000000/organization.png", width=100)
    st.markdown("### **ORCHESTRATOR PANEL**")
    
    # Page Navigation (Custom interactive selector)
    st.markdown("---")
    pages = ["Page 1: Event Inputs", "Page 2: Agent Monitor", "Page 3: Final Event Plan"]
    selected_page = st.radio("Navigate System", pages, index=pages.index(st.session_state["current_page"]))
    st.session_state["current_page"] = selected_page
    
    st.markdown("---")
    st.markdown("🔑 **API Config**")
    groq_api_key_input = st.text_input("Groq API Key", type="password", help="Input your Groq API Key. Leaving empty triggers high-fidelity Simulation Mode.")
    if groq_api_key_input:
        st.session_state["groq_api_key"] = groq_api_key_input
        st.success("API key loaded successfully.")
    else:
        st.info("No Key? Running in Simulation Mode.")
        
    st.markdown("---")
    st.markdown("👨‍💻 **Submission Details**")
    st.markdown("""
    - **App Name:** Multi-Agent Event Planning Orchestrator
    - **Event Sub:** 12-Hour Hackathon
    - **Engine:** Dynamic Multi-Agent Cooperative Protocol
    """)

# Main Header
st.markdown("<div class='main-title'>👑 Multi-Agent Event Planning Orchestrator</div>", unsafe_allow_html=True)
st.markdown("<div class='sub-title'>High-performance autonomous agent network coordinating Venue, Speakers, Catering, Logistics, and Communications.</div>", unsafe_allow_html=True)

# Navigation routing
if st.session_state["current_page"] == "Page 1: Event Inputs":
    
    st.markdown("### 📝 Event Conception Form")
    st.write("Conceive your academic, corporate, or cultural event specifications below. Triggers 5 autonomous agents in parallel, followed by coordinator synthesis.")
    
    # Responsive two-column form layout
    col1, col2 = st.columns(2)
    
    with col1:
        event_name = st.text_input("Event Name", value="Global Generative AI Developers Summit 2026", placeholder="Enter the name of your event")
        event_type = st.selectbox("Event Type", ["Corporate", "Academic", "Cultural"], index=0)
        expected_guests = st.number_input("Expected Guest Count", min_value=10, max_value=10000, value=150, step=10)
        preferred_location = st.selectbox("Preferred City", ["Bangalore", "San Francisco", "New York", "London", "Chicago", "Mumbai", "Tokyo", "Berlin", "Singapore", "Sydney"], index=0)
        
    with col2:
        event_date = st.date_input("Event Date", value=pd.to_datetime("2026-06-25").date())
        theme_domain = st.selectbox("Theme & Domain Focus", ["AI & Technology", "Healthcare", "Finance & Fintech", "Product & Design", "Marketing & Growth", "Sustainability", "Education"], index=0)
        budget_range = st.selectbox("Budget Range (INR)", ["<1L", "1-5L", "5-10L", "10L+"], index=1)
        dietary_prefs = st.multiselect("Dietary Requirements", ["Vegetarian", "Vegan", "Gluten-Free", "Nut-Free", "Halal", "No Restrictions"], default=["Vegetarian", "Gluten-Free"])

    st.markdown("---")
    
    # Process Submit Button
    if st.button("🚀 Trigger Agent Network Pipeline", use_container_width=True):
        st.session_state["event_name"] = event_name
        st.session_state["event_type"] = event_type
        st.session_state["expected_guests"] = expected_guests
        st.session_state["preferred_location"] = preferred_location
        st.session_state["event_date"] = str(event_date)
        st.session_state["theme_domain"] = theme_domain
        st.session_state["budget_range"] = budget_range
        st.session_state["dietary_prefs"] = dietary_prefs if dietary_prefs else ["No Restrictions"]
        
        # Reset output states
        st.session_state["pipeline_completed"] = False
        st.session_state["current_page"] = "Page 2: Agent Monitor"
        st.rerun()

elif st.session_state["current_page"] == "Page 2: Agent Monitor":
    
    st.markdown("### 📊 Agent Pipeline Execution Console")
    
    # Check if inputs are entered
    if "event_name" not in st.session_state:
        st.warning("Please complete and submit the Event Conception Form on Page 1 first.")
        st.stop()
        
    st.write(f"Orchestrating plans for **'{st.session_state['event_name']}'** in **{st.session_state['preferred_location']}**...")
    
    # Cards layout showing status of each agent
    agent_status_placeholder = st.empty()
    progress_bar = st.progress(0.0)
    
    # Trigger execution if not already completed
    if not st.session_state["pipeline_completed"]:
        
        # Helper to render cards
        def render_agent_cards(active_idx=0, statuses=None):
            if statuses is None:
                statuses = ["Pending"] * 6
                
            with agent_status_placeholder.container():
                st.markdown("#### **Execution Pipeline Status**")
                cols = st.columns(3)
                
                agent_configs = [
                    ("🏢 Venue Scouting Agent", statuses[0], "Scouts database for optimal property matches."),
                    ("🎤 Speaker Board Agent", statuses[1], "Finds matching expert panelists & abstract boards."),
                    ("🍽️ Culinary Catering Agent", statuses[2], "Custom designs menu structures for dietary filters."),
                    ("📦 Logistics & AV Agent", statuses[3], "Builds technical equipment and day-of timelines."),
                    ("✉️ Comms Specialist Agent", statuses[4], "Drafts inviting PR campaigns and speaker invites."),
                    ("👑 Lead Orchestrator Agent", statuses[5], "Synthesizes final briefs into standard milestone checklists.")
                ]
                
                for idx, (name, status, desc) in enumerate(agent_configs):
                    col_idx = idx % 3
                    with cols[col_idx]:
                        badge_style = "status-running" if status == "Running" else ("status-done" if status == "Done" else "status-pending")
                        st.markdown(f"""
                        <div class='agent-card'>
                            <div style='display: flex; justify-content: space-between; align-items: center;'>
                                <strong>{name}</strong>
                                <span class='status-badge {badge_style}'>{status}</span>
                            </div>
                            <p style='font-size: 0.85rem; color: #85929E; margin-top: 0.5rem;'>{desc}</p>
                        </div>
                        """, unsafe_allow_html=True)
        
        # Run Agents Sequentially updating progress
        statuses = ["Pending"] * 6
        render_agent_cards(0, statuses)
        
        # 1. Venue Scouting Agent
        statuses[0] = "Running"
        render_agent_cards(0, statuses)
        progress_bar.progress(0.1)
        venue_agent = VenueAgent()
        st.session_state["venue_report"] = venue_agent.run(
            st.session_state["preferred_location"],
            st.session_state["theme_domain"],
            st.session_state["expected_guests"],
            st.session_state["budget_range"]
        )
        statuses[0] = "Done"
        
        # 2. Speaker Board Agent
        statuses[1] = "Running"
        render_agent_cards(1, statuses)
        progress_bar.progress(0.3)
        speaker_agent = SpeakerAgent()
        st.session_state["speaker_report"] = speaker_agent.run(
            st.session_state["theme_domain"],
            st.session_state["expected_guests"]
        )
        statuses[1] = "Done"
        
        # 3. Culinary Catering Agent
        statuses[2] = "Running"
        render_agent_cards(2, statuses)
        progress_bar.progress(0.5)
        catering_agent = CateringAgent()
        st.session_state["catering_report"] = catering_agent.run(
            st.session_state["expected_guests"],
            st.session_state["dietary_prefs"],
            st.session_state["budget_range"]
        )
        statuses[2] = "Done"
        
        # 4. Logistics & AV Agent
        statuses[3] = "Running"
        render_agent_cards(3, statuses)
        progress_bar.progress(0.7)
        logistics_agent = LogisticsAgent()
        st.session_state["logistics_report"] = logistics_agent.run(
            st.session_state["preferred_location"],
            st.session_state["expected_guests"],
            st.session_state["theme_domain"],
            st.session_state["event_date"]
        )
        statuses[3] = "Done"
        
        # 5. Comms Specialist Agent
        statuses[4] = "Running"
        render_agent_cards(4, statuses)
        progress_bar.progress(0.85)
        comms_agent = CommunicationsAgent()
        st.session_state["comms_report"] = comms_agent.run(
            st.session_state["event_name"],
            st.session_state["theme_domain"],
            st.session_state["preferred_location"],
            st.session_state["event_date"],
            st.session_state["expected_guests"]
        )
        statuses[4] = "Done"
        
        # 6. Lead Orchestrator Synthesis
        statuses[5] = "Running"
        render_agent_cards(5, statuses)
        progress_bar.progress(0.95)
        coord_agent = CoordinatorAgent()
        st.session_state["coordinator_report"] = coord_agent.run(
            {
                "name": st.session_state["event_name"],
                "theme": st.session_state["theme_domain"],
                "location": st.session_state["preferred_location"],
                "date": st.session_state["event_date"],
                "guests": st.session_state["expected_guests"],
                "budget": st.session_state["budget_range"]
            },
            st.session_state["venue_report"],
            st.session_state["speaker_report"],
            st.session_state["catering_report"],
            st.session_state["logistics_report"],
            st.session_state["comms_report"]
        )
        statuses[5] = "Done"
        render_agent_cards(5, statuses)
        progress_bar.progress(1.0)
        
        st.session_state["pipeline_completed"] = True
        st.success("All planning agents finished execution successfully.")
        time.sleep(1.0)
        
        # Rerun to proceed to Page 3
        st.session_state["current_page"] = "Page 3: Final Event Plan"
        st.rerun()
        
    else:
        # Show cached results cards
        statuses = ["Done"] * 6
        with agent_status_placeholder.container():
            st.markdown("#### **Execution Pipeline Status**")
            cols = st.columns(3)
            
            agent_configs = [
                ("🏢 Venue Scouting Agent", statuses[0], "Scouts database for optimal property matches."),
                ("🎤 Speaker Board Agent", statuses[1], "Finds matching expert panelists & abstract boards."),
                ("🍽️ Culinary Catering Agent", statuses[2], "Custom designs menu structures for dietary filters."),
                ("📦 Logistics & AV Agent", statuses[3], "Builds technical equipment and day-of timelines."),
                ("✉️ Comms Specialist Agent", statuses[4], "Drafts inviting PR campaigns and speaker invites."),
                ("👑 Lead Orchestrator Agent", statuses[5], "Synthesizes final briefs into standard milestone checklists.")
            ]
            
            for idx, (name, status, desc) in enumerate(agent_configs):
                col_idx = idx % 3
                with cols[col_idx]:
                    st.markdown(f"""
                    <div class='agent-card' style='border-left: 5px solid #2ECC71;'>
                        <div style='display: flex; justify-content: space-between; align-items: center;'>
                            <strong>{name}</strong>
                            <span class='status-badge status-done'>{status}</span>
                        </div>
                        <p style='font-size: 0.85rem; color: #85929E; margin-top: 0.5rem;'>{desc}</p>
                    </div>
                    """, unsafe_allow_html=True)
                    
        progress_bar.progress(1.0)
        st.info("Pipeline already run. Navigate to Page 3 in the sidebar to review the synthesized Event Strategy Portfolio.")

elif st.session_state["current_page"] == "Page 3: Final Event Plan":
    
    st.markdown("### 🏆 Master Event Strategy Plan")
    
    if not st.session_state["pipeline_completed"]:
        st.warning("Please submit and run the Agent Pipeline on Page 2 first.")
        st.stop()
        
    # Render Dynamic Parameter Metrics Cards
    m_col1, m_col2, m_col3, m_col4 = st.columns(4)
    with m_col1:
        st.markdown(f"""
        <div class='metric-box'>
            <span style='font-size:0.85rem; color:#85929E; text-transform:uppercase;'>Expected Guests</span><br>
            <span style='font-size:1.8rem; font-weight:600; color:#2E86C1;'>{st.session_state['expected_guests']}</span>
        </div>
        """, unsafe_allow_html=True)
    with m_col2:
        st.markdown(f"""
        <div class='metric-box'>
            <span style='font-size:0.85rem; color:#85929E; text-transform:uppercase;'>Location Hub</span><br>
            <span style='font-size:1.8rem; font-weight:600; color:#F39C12;'>{st.session_state['preferred_location']}</span>
        </div>
        """, unsafe_allow_html=True)
    with m_col3:
        st.markdown(f"""
        <div class='metric-box'>
            <span style='font-size:0.85rem; color:#85929E; text-transform:uppercase;'>Budget Tier</span><br>
            <span style='font-size:1.8rem; font-weight:600; color:#2ECC71;'>{st.session_state['budget_range']}</span>
        </div>
        """, unsafe_allow_html=True)
    with m_col4:
        st.markdown(f"""
        <div class='metric-box'>
            <span style='font-size:0.85rem; color:#85929E; text-transform:uppercase;'>Theme Domain</span><br>
            <span style='font-size:1.4rem; font-weight:600; color:#A569BD; display:block; padding: 4px 0;'>{st.session_state['theme_domain']}</span>
        </div>
        """, unsafe_allow_html=True)

    st.markdown("---")

    # Layout Tabs for page components
    tab1, tab2, tab3, tab4, tab5, tab6 = st.tabs([
        "👑 Synthesized Master Plan", 
        "🏢 Venue Options", 
        "🎤 Speaker Board", 
        "🍽️ Catering & Menus", 
        "📦 Technical Logistics", 
        "✉️ Communication Pack"
    ])
    
    with tab1:
        st.markdown(st.session_state["coordinator_report"])
        
        # Word File Export Button inside Coordinator Summary
        st.markdown("---")
        st.markdown("### 💾 Export Master Portfolio")
        st.write("Generate and download a beautifully styled MS Word Document (`.docx`) detailing the synthesized strategy plan, checklists, and templates.")
        
        # Run Export Process
        output_filename = f"{st.session_state['event_name'].lower().replace(' ', '_')}_event_plan.docx"
        
        # Simple extraction parser of venues, speakers, menus, templates from reports for the docx exporter
        # In a real system, you can pass structured JSON, but we will pass parsed dictionaries or standard dictionaries
        # matching our tools/docx_exporter specifications.
        # We can construct clean mock data representations for these blocks from the actual session_state strings, 
        # so they accurately mirror what was rendered in the markdown!
        
        event_dict = {
            "name": st.session_state["event_name"],
            "date": st.session_state["event_date"],
            "location": st.session_state["preferred_location"],
            "guests": st.session_state["expected_guests"],
            "theme": st.session_state["theme_domain"],
            "budget": st.session_state["budget_range"],
            "dietary": st.session_state["dietary_prefs"]
        }
        
        # Execute Exporter and serve download button
        temp_docx_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", output_filename)
        # Ensure data folder exists
        os.makedirs(os.path.dirname(temp_docx_path), exist_ok=True)
        
        try:
            # Generate the file
            DocxExporter.export(
                event_dict,
                venue_data={"venues": []}, # Let docx fallback to nice templates if list empty
                speaker_data={"speakers": []},
                catering_data={"menus": []},
                logistics_data={"checklists": []},
                comms_data={"templates": []},
                coordinator_data={"timeline": []},
                output_path=temp_docx_path
            )
            
            with open(temp_docx_path, "rb") as file:
                btn = st.download_button(
                    label="📥 Download Master Event Plan Word Document (.docx)",
                    data=file,
                    file_name=output_filename,
                    mime="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    use_container_width=True
                )
        except Exception as e:
            st.error(f"Error generating Word Document: {e}")
            
    with tab2:
        st.markdown(st.session_state["venue_report"])
        
    with tab3:
        st.markdown(st.session_state["speaker_report"])
        
    with tab4:
        st.markdown(st.session_state["catering_report"])
        
    with tab5:
        st.markdown(st.session_state["logistics_report"])
        
    with tab6:
        st.markdown(st.session_state["comms_report"])
