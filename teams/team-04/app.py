import streamlit as st
import os
import json
from dotenv import load_dotenv

# Load environments
load_dotenv()

# App imports
from data.complaint_schemas import DOMAIN_SCHEMAS, DEMO_SCENARIOS
from data.consumer_protection_act import CPA_2019_KNOWLEDGE
from core.conversation import extract_entities_from_text, chat_respond, draft_petition_content, get_available_models
from core.prayer_calculator import calculate_compensation, generate_prayer_text
from core.evidence_checklist import generate_custom_checklist
from core.docx_generator import build_docx_from_markdown

# Page Config
st.set_page_config(
    page_title="⚖️ Consumer Complaint Auto-Drafter",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Premium Styling
st.markdown("""
<style>
    /* Premium Font and Color Styling */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=Playfair+Display:ital,wght@0,600;1,400&display=swap');
    
    html, body, [class*="css"] {
        font-family: 'Inter', sans-serif;
    }
    
    .legal-title {
        font-family: 'Playfair Display', serif;
        font-weight: 700;
        font-size: 2.8rem;
        color: #1E293B;
        margin-bottom: 0.2rem;
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .legal-subtitle {
        font-size: 1.1rem;
        color: #64748B;
        margin-bottom: 2rem;
    }
    
    /* Card Styles */
    .metric-card {
        background-color: #F8FAFC;
        border: 1px solid #E2E8F0;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
        margin-bottom: 1rem;
        transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .metric-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
        border-color: #CBD5E1;
    }
    
    .metric-value {
        font-size: 1.8rem;
        font-weight: 700;
        color: #2563EB;
    }
    
    .metric-label {
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #64748B;
        font-weight: 600;
    }
    
    /* Glassmorphism sidebar elements */
    .sidebar-card {
        background: rgba(255, 255, 255, 0.7);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(226, 232, 240, 0.8);
        border-radius: 8px;
        padding: 1rem;
        margin-bottom: 1rem;
    }
    
    /* Entity badges */
    .entity-badge {
        display: inline-block;
        padding: 0.25rem 0.6rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 600;
        margin: 0.2rem;
    }
    .badge-filled {
        background-color: #DCFCE7;
        color: #166534;
        border: 1px solid #BBF7D0;
    }
    .badge-missing {
        background-color: #FEE2E2;
        color: #991B1B;
        border: 1px solid #FECACA;
    }
    
    /* Live Preview Section */
    .preview-box {
        background-color: #FFFFFF;
        border: 2px dashed #E2E8F0;
        border-radius: 12px;
        padding: 2rem;
        font-family: 'Times New Roman', Times, serif;
        color: #000000;
        line-height: 1.6;
        height: 600px;
        overflow-y: auto;
        box-shadow: inset 0 2px 4px 0 rgb(0 0 0 / 0.06);
    }
</style>
""", unsafe_allow_html=True)

# Main title header
st.markdown('<div class="legal-title">⚖️ Consumer Complaint Auto-Drafter</div>', unsafe_allow_html=True)
st.markdown('<div class="legal-subtitle">Build submission-ready, legally structured DCDRC petitions based on the Consumer Protection Act, 2019</div>', unsafe_allow_html=True)

# API Key setup in sidebar
st.sidebar.image("assets/logo.png", use_container_width=True)
st.sidebar.title("⚖️ Legal Assistant")
st.sidebar.markdown("---")

api_key = os.environ.get("GEMINI_API_KEY", "")

if not api_key:
    st.sidebar.error("⚠️ GEMINI_API_KEY not set in .env file.")
    available_models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash-8b", "gemini-1.5-pro"]
else:
    st.sidebar.success("✅ AI Engine Ready")
    available_models = get_available_models(api_key)

selected_model = st.sidebar.selectbox(
    "Select Gemini Model",
    options=available_models,
    index=0 if "gemini-2.5-flash" not in available_models else available_models.index("gemini-2.5-flash"),
    help="Choose the model to query. Defaults to gemini-2.5-flash."
)

# Active Domain state
if "active_domain" not in st.session_state:
    st.session_state.active_domain = "e-commerce"

# Persistent source of truth for extracted details (does not get garbage-collected by Streamlit)
if "entities" not in st.session_state:
    st.session_state.entities = {}

# Initialize empty dictionary values
for dom in DOMAIN_SCHEMAS.values():
    for k in dom["required_entities"]:
        if k not in st.session_state.entities:
            st.session_state.entities[k] = ""

# SYNCHRONIZE WIDGET INPUTS BACK TO OUR PERSISTENT SOURCE OF TRUTH
# This loop runs at the start of every script execution, capturing the user's manual keyboard inputs
for dom in DOMAIN_SCHEMAS.values():
    for k in dom["required_entities"]:
        widget_key = f"widget_{k}"
        if widget_key in st.session_state:
            # Sync value from widget input back to standard session dictionary
            st.session_state.entities[k] = st.session_state[widget_key]

# Sector selection and Demo Scenario launcher
st.sidebar.markdown("---")
st.sidebar.subheader("Quick Launch / Presets")

preset_option = st.sidebar.selectbox(
    "Load Demo Grievance Scenario",
    options=["-- None --"] + [demo["title"] for demo in DEMO_SCENARIOS],
    key="preset_selectbox"
)

# Load demo scenario if selected and not already loaded
if preset_option != "-- None --" and ("loaded_preset" not in st.session_state or st.session_state.loaded_preset != preset_option):
    selected_demo = next(d for d in DEMO_SCENARIOS if d["title"] == preset_option)
    st.session_state.active_domain = selected_demo["domain"]
    
    # Reset all entity keys first
    for k in st.session_state.entities:
        st.session_state.entities[k] = ""
        if f"widget_{k}" in st.session_state:
            st.session_state[f"widget_{k}"] = ""
            
    # Set preset values in source of truth
    for k, v in selected_demo["data"].items():
        st.session_state.entities[k] = str(v) if v is not None else ""
        # Also pre-populate widget state directly to prevent visual lag
        st.session_state[f"widget_{k}"] = str(v) if v is not None else ""
        
    st.session_state.loaded_preset = preset_option
    st.session_state.interest_rate = 12.0
    if selected_demo["domain"] == "food":
        st.session_state.severity = "Severe"
        st.session_state.custom_mental_agony = 50000.0
    elif selected_demo["domain"] == "banking":
        st.session_state.severity = "Severe"
        st.session_state.custom_mental_agony = 75000.0
    else:
        st.session_state.severity = "Moderate"
        st.session_state.custom_mental_agony = 25000.0
        
    # Clear any previous petition drafts
    if "drafted_petition" in st.session_state:
        del st.session_state.drafted_petition
    st.sidebar.info(f"Loaded preset for: {selected_demo['domain'].upper()}")

# Reset loaded preset if user clears selection
if preset_option == "-- None --" and "loaded_preset" in st.session_state:
    del st.session_state.loaded_preset

if "chat_history" not in st.session_state:
    st.session_state.chat_history = [
        {"role": "assistant", "content": "Hello! I am your AI Consumer Legal Assistant. I can help you draft a formal complaint petition to the consumer court. To begin, please select a sector or describe your grievance in plain words."}
    ]

if "interest_rate" not in st.session_state:
    st.session_state.interest_rate = 12.0
if "severity" not in st.session_state:
    st.session_state.severity = "Moderate"
if "litigation_cost" not in st.session_state:
    st.session_state.litigation_cost = 10000.0
if "custom_mental_agony" not in st.session_state:
    st.session_state.custom_mental_agony = 25000.0

# Initialize domain entities helper
def reset_domain(new_domain):
    st.session_state.active_domain = new_domain
    for k in DOMAIN_SCHEMAS[new_domain]["required_entities"]:
        st.session_state.entities[k] = ""
        if f"widget_{k}" in st.session_state:
            st.session_state[f"widget_{k}"] = ""
    st.session_state.chat_history = [
        {"role": "assistant", "content": f"Hello! Let's draft a petition for {DOMAIN_SCHEMAS[new_domain]['display_name']}. Please tell me your name and briefly describe what happened."}
    ]
    if "drafted_petition" in st.session_state:
        del st.session_state.drafted_petition
    if "loaded_preset" in st.session_state:
        del st.session_state.loaded_preset
    st.session_state.preset_selectbox = "-- None --"

# Main navigation tabs
tab_guided, tab_express, tab_knowledge = st.tabs([
    "💬 Guided Legal Assistant (Interactive)",
    "⚡ Express Auto-Drafter (Form/Text)",
    "📚 Consumer Rights & Knowledge Base"
])

# ----------------- TAB 1: GUIDED LEGAL INTERVIEW -----------------
with tab_guided:
    st.markdown("### Interactive Interview")
    
    # Domain selector buttons
    cols_domains = st.columns(4)
    for index, (dom_key, dom_val) in enumerate(DOMAIN_SCHEMAS.items()):
        cols_domains[index].button(
            dom_val["display_name"], 
            key=f"btn_dom_{dom_key}", 
            type="primary" if st.session_state.active_domain == dom_key else "secondary", 
            use_container_width=True,
            on_click=reset_domain,
            args=(dom_key,)
        )

    st.markdown("---")
    
    # Split screen for chat and live dashboard
    col_chat, col_preview = st.columns([1, 1])
    
    with col_chat:
        st.subheader("Chat Assistant")
        
        # Display chat messages
        for msg in st.session_state.chat_history:
            with st.chat_message(msg["role"]):
                st.write(msg["content"])
                
        # Chat input
        user_msg = st.chat_input("Describe your grievance, provide details, or ask legal questions...")
        if user_msg:
            # Append user message
            st.session_state.chat_history.append({"role": "user", "content": user_msg})
            
            # Show spinner and query AI
            with st.chat_message("user"):
                st.write(user_msg)
                
            with st.chat_message("assistant"):
                with st.spinner("AI is analyzing and preparing response..."):
                    if api_key:
                        # Compile the whole conversation history for context-rich extraction
                        chat_context = ""
                        for msg in st.session_state.chat_history:
                            role = "Consumer" if msg["role"] == "user" else "Assistant"
                            chat_context += f"{role}: {msg['content']}\n"
                            
                        # Compile current entity values to inform extraction
                        schema = DOMAIN_SCHEMAS[st.session_state.active_domain]
                        current_entities_for_ext = {k: st.session_state.entities.get(k, "") for k in schema["required_entities"]}
                        
                        # Extract entities from the conversation context and update session state
                        extracted = extract_entities_from_text(api_key, st.session_state.active_domain, chat_context, current_entities=current_entities_for_ext, model_name=selected_model)
                        
                        invalid_values = ["", "none", "null", "n/a", "na", "not specified", "unknown", "not mentioned", "not provided", "not available", "undefined"]
                        for k, v in extracted.items():
                            if v is not None:
                                v_str = str(v).strip()
                                if v_str.lower() not in invalid_values:
                                    # Update source of truth
                                    st.session_state.entities[k] = v_str
                                    # Update widget visual value
                                    st.session_state[f"widget_{k}"] = v_str
                                
                        # Compile current entity values
                        schema = DOMAIN_SCHEMAS[st.session_state.active_domain]
                        current_entities = {k: st.session_state.entities.get(k, "") for k in schema["required_entities"]}
                        
                        # Get conversational response
                        ai_response = chat_respond(
                            api_key=api_key,
                            domain=st.session_state.active_domain,
                            chat_history=st.session_state.chat_history,
                            current_entities=current_entities,
                            model_name=selected_model
                        )
                    else:
                        ai_response = "⚠️ Please enter a Google Gemini API Key in the sidebar to enable live AI responses."
                    
                    st.write(ai_response)
                    st.session_state.chat_history.append({"role": "assistant", "content": ai_response})
            st.rerun()

    with col_preview:
        st.subheader("Live Petition Dashboard")
        
        # Entity extraction completion metric
        schema = DOMAIN_SCHEMAS[st.session_state.active_domain]
        total_entities = len(schema["required_entities"])
        
        # Compile current entity values from session state source of truth
        current_entities = {k: st.session_state.entities.get(k, "") for k in schema["required_entities"]}
        
        invalid_values = ["", "none", "null", "n/a", "na", "not specified", "unknown", "not mentioned", "not provided", "not available", "undefined"]
        filled_entities = sum(1 for v in current_entities.values() if v is not None and str(v).strip() != "" and str(v).strip().lower() not in invalid_values)
        completion_rate = filled_entities / total_entities
        
        st.progress(completion_rate, text=f"Data Completion: {filled_entities}/{total_entities} details collected")
        
        # Display extracted fields as editable form controls
        st.markdown("### Collected Case Facts *(Click to edit or fill)*")
        
        with st.expander("Show/Edit Extracted Details", expanded=True):
            ent_cols = st.columns(2)
            for idx, (ent_key, ent_label) in enumerate(schema["required_entities"].items()):
                col_i = idx % 2
                widget_key = f"widget_{ent_key}"
                label_formatted = ent_key.replace('_', ' ').title()
                
                # Fetch default value from source of truth
                default_val = st.session_state.entities.get(ent_key, "")
                if default_val is None or default_val == "null":
                    default_val = ""
                    
                # Bind widget to widget_key and feed it the default value
                ent_cols[col_i].text_input(
                    f"{label_formatted} ({ent_label})",
                    value=str(default_val),
                    key=widget_key
                )
                
        # Compensation calculator inside dashboard
        st.markdown("### Interactive Compensation Calculator")
        cc1, cc2 = st.columns(2)
        
        # Extract details for calculation
        amt_val = st.session_state.entities.get("transaction_amount", "") or st.session_state.entities.get("disputed_amount", "") or "0"
        try:
            default_amount = float(amt_val)
        except Exception:
            default_amount = 0.0
            
        g_date = st.session_state.entities.get("grievance_date", "") or st.session_state.entities.get("order_date", "") or st.session_state.entities.get("transaction_date", "") or st.session_state.entities.get("purchase_date", "") or ""
        
        st.session_state.interest_rate = cc1.number_input("Interest Rate (% p.a.)", min_value=0.0, max_value=24.0, value=st.session_state.interest_rate, step=0.5)
        st.session_state.severity = cc2.selectbox("Grievance Severity Level", options=["Mild", "Moderate", "Severe"], index=["Mild", "Moderate", "Severe"].index(st.session_state.severity))
        
        cc3, cc4 = st.columns(2)
        st.session_state.litigation_cost = cc3.number_input("Litigation & Filing Cost (₹)", min_value=0.0, max_value=100000.0, value=st.session_state.litigation_cost, step=1000.0)
        st.session_state.custom_mental_agony = cc4.number_input("Mental Agony Compensation (₹)", min_value=0.0, max_value=500000.0, value=st.session_state.custom_mental_agony, step=5000.0)

        # Run calculations
        calc_res = calculate_compensation(
            transaction_amount=default_amount,
            grievance_date_str=g_date,
            interest_rate_pct=st.session_state.interest_rate,
            severity=st.session_state.severity,
            custom_litigation_cost=st.session_state.litigation_cost,
            custom_mental_agony=st.session_state.custom_mental_agony
        )
        
        # Display calculation metrics
        m1, m2, m3 = st.columns(3)
        m1.markdown(f"""
        <div class="metric-card">
            <div class="metric-label">Principal + Interest</div>
            <div class="metric-value">₹{calc_res['transaction_amount'] + calc_res['interest_amount']:,.2f}</div>
            <div style="font-size:0.75rem; color:#64748B;">Interest p.a. for {calc_res['days_elapsed']} days</div>
        </div>
        """, unsafe_allow_html=True)
        m2.markdown(f"""
        <div class="metric-card">
            <div class="metric-label">Compensation + Costs</div>
            <div class="metric-value">₹{calc_res['mental_agony_amount'] + calc_res['litigation_cost']:,.2f}</div>
            <div style="font-size:0.75rem; color:#64748B;">Agony claim & litigation expenses</div>
        </div>
        """, unsafe_allow_html=True)
        m3.markdown(f"""
        <div class="metric-card">
            <div class="metric-label">Total Claim Value</div>
            <div class="metric-value">₹{calc_res['total_claim']:,.2f}</div>
            <div style="font-size:0.75rem; color:#64748B;">Forum: {calc_res['pecuniary_forum'].split()[0]} Comm.</div>
        </div>
        """, unsafe_allow_html=True)

        # Evidence Checklist Section
        st.markdown("### Tailored Evidence Checklist")
        checklist_items = generate_custom_checklist(st.session_state.active_domain, current_entities)
        for item in checklist_items:
            st.checkbox(item, value=False, key=f"check_item_{hash(item)}")

        # Draft petition button
        st.markdown("---")
        if st.button("📝 Draft Legal Petition Content", type="primary", use_container_width=True):
            if not api_key:
                st.error("Please provide your Google Gemini API Key in the sidebar.")
            else:
                with st.spinner("Drafting full legal petition based on your inputs and CPA 2019 rules..."):
                    drafted_markdown = draft_petition_content(
                        api_key=api_key,
                        domain=st.session_state.active_domain,
                        entities=current_entities,
                        calc_results=calc_res,
                        model_name=selected_model
                    )
                    st.session_state.drafted_petition = drafted_markdown
                    
        # Render the petition preview if it exists
        if "drafted_petition" in st.session_state:
            st.markdown("### Draft Petition Preview")
            st.text_area("Copy Markdown Text", value=st.session_state.drafted_petition, height=250)
            
            # DOCX Builder and Downloader
            docx_data = build_docx_from_markdown(st.session_state.drafted_petition)
            st.download_button(
                label="📥 Download Submission-Ready Document (.docx)",
                data=docx_data,
                file_name=f"DCDRC_Petition_{st.session_state.active_domain}.docx",
                mime="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                use_container_width=True
            )

# ----------------- TAB 2: EXPRESS AUTO-DRAFTER -----------------
with tab_express:
    st.markdown("### Quick Petition Generator")
    st.write("If you already have your transaction details and narrative written down, paste them here to generate your structured court petition instantly.")
    
    exp_cols = st.columns([1, 1])
    
    with exp_cols[0]:
        st.markdown("#### Step 1: Input Grievance & Parties Details")
        
        express_domain = st.selectbox(
            "Select Complaint Sector",
            options=list(DOMAIN_SCHEMAS.keys()),
            format_func=lambda x: DOMAIN_SCHEMAS[x]["display_name"]
        )
        
        raw_grievance = st.text_area(
            "Describe the event details (Include order number, dates, payments, defects, and responses)",
            height=250,
            placeholder="Example: I ordered an iPhone 15 from Amazon India on 2026-04-12 for Rs. 79,999. The package arrived on 2026-04-15 with a smashed screen. I called customer support, but they refused to help, claiming it was transit damage that was my fault..."
        )
        
        exp_complainant = st.text_input("Complainant's Full Name & Address", placeholder="e.g. Rajesh Kumar, House No. 42, Sector 15, Faridabad, Haryana")
        exp_respondent = st.text_input("Respondent's Company Name & Address", placeholder="e.g. Amazon Seller Services Private Limited, Registered Office: Nehru Place, New Delhi")
        
        col_amt, col_dt = st.columns(2)
        exp_amount = col_amt.number_input("Total Transaction Amount (₹)", min_value=0.0, step=100.0)
        exp_date = col_dt.text_input("Grievance / Incident Date (YYYY-MM-DD)", placeholder="e.g. 2026-04-15")

        exp_interest = st.number_input("Interest Claimed (% p.a.)", min_value=0.0, max_value=24.0, value=12.0, step=0.5, key="exp_int")
        exp_severity = st.selectbox("Severity Level", options=["Mild", "Moderate", "Severe"], index=1, key="exp_sev")

    with exp_cols[1]:
        st.markdown("#### Step 2: Generate & Preview Petition")
        
        if st.button("⚡ Generate Structured Petition Now", type="primary", use_container_width=True):
            if not api_key:
                st.error("Please enter a Google Gemini API Key in the sidebar.")
            elif not raw_grievance:
                st.error("Please describe your grievance in the text area.")
            else:
                with st.spinner("Extracting entities and drafting legal document..."):
                    # Construct a full prompt combining raw user input with metadata
                    combined_text = f"""
                    Complainant Name/Address: {exp_complainant}
                    Respondent Name/Address: {exp_respondent}
                    Transaction Amount: {exp_amount}
                    Incident Date: {exp_date}
                    Grievance Description: {raw_grievance}
                    """
                    
                    # Extract entities using LLM
                    extracted = extract_entities_from_text(api_key, express_domain, combined_text, model_name=selected_model)
                    
                    # Ensure explicitly provided entities take precedence
                    if exp_complainant:
                        extracted["complainant_name"] = exp_complainant
                    if exp_respondent:
                        extracted["respondent_name"] = exp_respondent
                    if exp_amount > 0:
                        extracted["transaction_amount"] = exp_amount
                    if exp_date:
                        extracted["grievance_date"] = exp_date
                        
                    # Calculate compensation
                    calc_res = calculate_compensation(
                        transaction_amount=extracted.get("transaction_amount") or exp_amount,
                        grievance_date_str=extracted.get("grievance_date") or exp_date,
                        interest_rate_pct=exp_interest,
                        severity=exp_severity
                    )
                    
                    # Draft petition content
                    drafted_markdown = draft_petition_content(
                        api_key=api_key,
                        domain=express_domain,
                        entities=extracted,
                        calc_results=calc_res,
                        model_name=selected_model
                    )
                    
                    st.session_state.express_draft = drafted_markdown
                    st.session_state.express_calc = calc_res
                    st.session_state.express_checklist = generate_custom_checklist(express_domain, extracted)
        
        # Display the output
        if "express_draft" in st.session_state:
            st.success("Draft Generated Successfully!")
            st.markdown(f"**Pecuniary Jurisdiction:** {st.session_state.express_calc['pecuniary_forum']}")
            st.markdown(f"**Total Claimed:** ₹{st.session_state.express_calc['total_claim']:,.2f}")
            
            st.text_area("Generated Petition Markdown", value=st.session_state.express_draft, height=300)
            
            # DOCX Builder and Downloader
            docx_data = build_docx_from_markdown(st.session_state.express_draft)
            st.download_button(
                label="📥 Download Formatted Document (.docx)",
                data=docx_data,
                file_name=f"Express_DCDRC_Petition_{express_domain}.docx",
                mime="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                use_container_width=True,
                key="exp_download"
            )
            
            # Evidence Checklist
            st.markdown("##### Suggested Attachments:")
            for item in st.session_state.express_checklist:
                st.markdown(f"- 📄 {item}")

# ----------------- TAB 3: KNOWLEDGE BASE -----------------
with tab_knowledge:
    st.markdown("### Indian Consumer Protection Act, 2019 Reference Guide")
    st.write("Understand consumer rights, how compensation is calculated, and what jurisdiction you fall under.")
    
    col_k1, col_k2 = st.columns(2)
    
    with col_k1:
        st.markdown("#### Key Statutory Rights under CPA 2019")
        for key, value in CPA_2019_KNOWLEDGE["key_sections"].items():
            st.markdown(f"##### **{key} ({value['section']})**")
            st.info(value["definition"])
            st.write(f"*Standard Grounds Clause:*")
            st.caption(value["grounds_text"])
            st.markdown("<br>", unsafe_allow_html=True)
            
    with col_k2:
        st.markdown("#### Pecuniary & Territorial Jurisdiction Rules")
        st.write(CPA_2019_KNOWLEDGE["pecuniary_jurisdiction"]["rules"])
        
        st.markdown("**Pecuniary Limits (value of goods/services paid + compensation):**")
        st.table([
            {"Forum": "District Commission", "Limit": "Up to ₹50 Lakhs", "Section": "Section 34(1)"},
            {"Forum": "State Commission", "Limit": "₹50 Lakhs to ₹2 Crores", "Section": "Section 47(1)"},
            {"Forum": "National Commission", "Limit": "Above ₹2 Crores", "Section": "Section 58(1)"}
        ])
        
        st.markdown("**Territorial Jurisdiction (Section 34(2)):**")
        for clause in CPA_2019_KNOWLEDGE["territorial_jurisdiction"]["clauses"]:
            st.markdown(f"- {clause}")
            
        st.markdown("**Limitation Period (Section 69):**")
        st.warning("⚠️ Any complaint must be filed within **2 years** from the date on which the cause of action (the dispute or defect) arose. Delay condonation applications are required if filed after 2 years.")
        
        st.markdown("#### Step-by-Step Filing Checklist")
        st.markdown("""
        1. **Drafting**: Use this tool to generate the complaint petition and the verification statement.
        2. **Affidavit**: Print the petition and get the Verification Affidavit notarized (signed before a Notary Public / Oath Commissioner).
        3. **Evidence**: Arrange all documents from the *Evidence Checklist* as Annexures (e.g. Annexure A-1, A-2).
        4. **Index and Synopsis**: Create a index of documents and a brief chronological synopsis of events.
        5. **Filing**: File the complaint in the corresponding DCDRC/SCDRC. Files can also be submitted online via the national portal [E-Daakhil](https://edaakhil.nic.in/).
        """)

# Footer credits
st.markdown("---")
st.markdown("<div style='text-align: center; color: #64748B; font-size: 0.85rem;'>D4 Consumer Complaint Auto-Drafter | Powered by Gemini GenAI | Hackathon 2026 Submission</div>", unsafe_allow_html=True)
