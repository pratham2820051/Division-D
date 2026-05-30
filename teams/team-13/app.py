import streamlit as st
import os
from ingestion import load_and_chunk_pdf
from vectorstore import build_vectorstore, load_vectorstore, vectorstore_exists
from compliance_engine import check_compliance
from report_generator import generate_report, generate_pdf_report

st.set_page_config(
    page_title="Building Plan Compliance Checker",
    page_icon="🏗️",
    layout="wide"
)

# Hide Streamlit default menu and footer
st.markdown("""
<style>
#MainMenu {visibility: hidden;}
footer {visibility: hidden;}
[data-testid="stToolbar"] {visibility: hidden;}
[data-testid="stDeployButton"] {display: none;}

.main-header {
    background: linear-gradient(90deg, #1a237e, #283593);
    color: white;
    padding: 20px;
    border-radius: 10px;
    text-align: center;
    margin-bottom: 20px;
}
.ready-box {
    background: #d4edda;
    border: 2px solid #28a745;
    border-radius: 10px;
    padding: 15px;
    margin-bottom: 20px;
    color: #155724;
    font-weight: bold;
    text-align: center;
    font-size: 18px;
}
.compliant-banner {
    background-color: #d4edda;
    color: #155724;
    padding: 20px;
    border-radius: 10px;
    text-align: center;
    font-size: 24px;
    font-weight: bold;
    margin: 10px 0;
}
.non-compliant-banner {
    background-color: #f8d7da;
    color: #721c24;
    padding: 20px;
    border-radius: 10px;
    text-align: center;
    font-size: 24px;
    font-weight: bold;
    margin: 10px 0;
}
</style>
""", unsafe_allow_html=True)

# ── Header ────────────────────────────────────────────────────────────────────
st.markdown("""
<div class="main-header">
    <h1>Building Plan Compliance Checker</h1>
</div>
""", unsafe_allow_html=True)

# ── Session state ─────────────────────────────────────────────────────────────
if 'vectorstore_ready' not in st.session_state:
    st.session_state.vectorstore_ready = False
if 'index' not in st.session_state:
    st.session_state.index = None
if 'chunks' not in st.session_state:
    st.session_state.chunks = None
if 'compliance_results' not in st.session_state:
    st.session_state.compliance_results = None
if 'specs' not in st.session_state:
    st.session_state.specs = None

# ── PDF Upload Section (always visible on main page) ──────────────────────────
if not st.session_state.vectorstore_ready:
    with st.container(border=True):
        st.markdown("### 📋 Step 1 — Upload Regulation PDF")
        st.markdown("Upload the **HDUDA Master Plan 2031** PDF to begin compliance checking.")

        uploaded_file = st.file_uploader(
            "Upload Regulation PDF",
            type=['pdf'],
            help="Upload HDUDA or BBMP regulation PDF"
        )

        if vectorstore_exists():
            if st.button("📂 Load Existing Index"):
                with st.spinner("Loading saved index..."):
                    index, chunks = load_vectorstore()
                    st.session_state.index = index
                    st.session_state.chunks = chunks
                    st.session_state.vectorstore_ready = True
                    st.rerun()

        if uploaded_file:
            pdf_path = f"regulations/{uploaded_file.name}"
            os.makedirs("regulations", exist_ok=True)
            with open(pdf_path, "wb") as f:
                f.write(uploaded_file.read())
            st.success(f"✅ PDF uploaded: {uploaded_file.name}")

            if st.button("⚙️ Process Regulations", type="primary"):
                with st.spinner("Reading and indexing regulation PDF... This takes 2-3 minutes..."):
                    try:
                        chunks = load_and_chunk_pdf(pdf_path)
                        st.info(f"Extracted {len(chunks)} regulation chunks")
                        index, chunks = build_vectorstore(chunks)
                        st.session_state.index = index
                        st.session_state.chunks = chunks
                        st.session_state.vectorstore_ready = True
                        st.rerun()
                    except Exception as e:
                        st.error(f"Error processing PDF: {str(e)}")

else:
    st.markdown('<div class="ready-box">✅ Regulations Indexed — System Ready for Compliance Checking</div>', unsafe_allow_html=True)
    if st.button("🔄 Re-upload PDF"):
        st.session_state.vectorstore_ready = False
        st.session_state.index = None
        st.session_state.chunks = None
        st.rerun()

# ── Main Tabs ─────────────────────────────────────────────────────────────────
tab1, tab2 = st.tabs(["📝 Building Specification", "📊 Compliance Report"])

with tab1:
    st.markdown("## Enter Building Plan Details")

    if st.button("🏠 Load Demo Building (Surya Residency)"):
        st.session_state.demo = True

    demo = st.session_state.get('demo', False)

    col1, col2 = st.columns(2)

    with col1:
        st.markdown("### 🏢 Basic Information")
        building_name = st.text_input(
            "Building / Project Name",
            value="Surya Residency" if demo else ""
        )
        usage_type = st.selectbox(
            "Usage Type",
            ["Residential", "Commercial", "Industrial", "Mixed Use"],
            index=0
        )
        plot_area = st.number_input(
            "Plot Area (sq meters)",
            min_value=50.0,
            max_value=50000.0,
            value=300.0 if demo else 200.0,
            step=10.0
        )
        number_of_floors = st.number_input(
            "Number of Floors",
            min_value=1,
            max_value=50,
            value=4 if demo else 2
        )
        building_height = st.number_input(
            "Building Height (meters)",
            min_value=3.0,
            max_value=150.0,
            value=13.5 if demo else 7.0,
            step=0.5
        )
        far_proposed = st.number_input(
            "Proposed FAR (Floor Area Ratio)",
            min_value=0.1,
            max_value=10.0,
            value=2.2 if demo else 1.5,
            step=0.1
        )

    with col2:
        st.markdown("### 📐 Setbacks & Coverage")
        ground_coverage = st.number_input(
            "Ground Coverage (%)",
            min_value=10.0,
            max_value=80.0,
            value=45.0 if demo else 40.0,
            step=1.0
        )
        front_setback = st.number_input(
            "Front Setback (meters)",
            min_value=0.0,
            max_value=20.0,
            value=2.5 if demo else 3.0,
            step=0.5
        )
        rear_setback = st.number_input(
            "Rear Setback (meters)",
            min_value=0.0,
            max_value=20.0,
            value=2.0 if demo else 3.0,
            step=0.5
        )
        side_setback = st.number_input(
            "Side Setback (meters)",
            min_value=0.0,
            max_value=20.0,
            value=1.2 if demo else 1.5,
            step=0.5
        )
        road_width = st.number_input(
            "Abutting Road Width (meters)",
            min_value=3.0,
            max_value=60.0,
            value=9.0 if demo else 12.0,
            step=1.0
        )

    st.markdown("---")
    check_button = st.button(
        "🔍 CHECK COMPLIANCE",
        type="primary",
        use_container_width=True
    )

    if check_button:
        if not st.session_state.vectorstore_ready:
            st.warning("⚠️ Please upload and process the regulation PDF first (Step 1 above)!")
        elif not building_name:
            st.warning("⚠️ Please enter a building name!")
        else:
            specs = {
                'building_name': building_name,
                'usage_type': usage_type,
                'plot_area': plot_area,
                'number_of_floors': int(number_of_floors),
                'building_height': building_height,
                'far_proposed': far_proposed,
                'ground_coverage': ground_coverage,
                'front_setback': front_setback,
                'rear_setback': rear_setback,
                'side_setback': side_setback,
                'road_width': road_width
            }
            with st.spinner("🔍 Checking compliance against HDUDA Master Plan 2031 regulations..."):
                results = check_compliance(
                    specs,
                    st.session_state.index,
                    st.session_state.chunks
                )
                st.session_state.compliance_results = results
                st.session_state.specs = specs
            st.success("✅ Compliance check complete! Go to Compliance Report tab.")

# ── Report Tab ────────────────────────────────────────────────────────────────
with tab2:
    st.markdown("## 📊 Compliance Assessment Report")

    if st.session_state.compliance_results is None:
        st.info("👆 Please fill the building specification form and click CHECK COMPLIANCE first.")
    else:
        results = st.session_state.compliance_results
        specs = st.session_state.specs
        report_text, df = generate_report(results, specs)

        total = len(results)
        passed = sum(1 for r in results if r['status'] == 'PASS')
        failed = sum(1 for r in results if r['status'] == 'FAIL')
        overall = "✅ COMPLIANT" if failed == 0 else "❌ NON-COMPLIANT"

        if failed == 0:
            st.markdown(f'<div class="compliant-banner">{overall}</div>', unsafe_allow_html=True)
        else:
            st.markdown(f'<div class="non-compliant-banner">{overall}</div>', unsafe_allow_html=True)

        col1, col2, col3 = st.columns(3)
        col1.metric("Total Checks", total)
        col2.metric("✅ Passed", passed)
        col3.metric("❌ Failed", failed)

        st.markdown("### 📋 Detailed Compliance Table")
        for _, row in df.iterrows():
            cols = st.columns([2, 1.5, 1.5, 1, 3, 3])
            cols[0].write(f"**{row['parameter']}**")
            cols[1].write(row['proposed_value'])
            cols[2].write(row['regulation_limit'])
            if row['status'] == 'PASS':
                cols[3].markdown(
                    '<span style="color:#155724;background:#d4edda;padding:3px 8px;'
                    'border-radius:4px;font-weight:bold">✅ PASS</span>',
                    unsafe_allow_html=True
                )
            else:
                cols[3].markdown(
                    '<span style="color:#721c24;background:#f8d7da;padding:3px 8px;'
                    'border-radius:4px;font-weight:bold">❌ FAIL</span>',
                    unsafe_allow_html=True
                )
            cols[4].write(row['regulation_citation'])
            cols[5].write(row['reason'])
            st.divider()

        if failed > 0:
            st.markdown("### ⚠️ Non-Conformity Report")
            st.markdown("The following parameters do not comply with HDUDA regulations:")
            for r in results:
                if r['status'] == 'FAIL':
                    with st.expander(f"❌ {r['parameter']}"):
                        st.markdown(f"**Proposed Value:** {r['proposed_value']}")
                        st.markdown(f"**Regulation Limit:** {r['regulation_limit']}")
                        st.markdown(f"**Regulation Citation:** {r['regulation_citation']}")
                        st.markdown(f"**Reason:** {r['reason']}")

        st.markdown("### 📥 Download Report")
        pdf_bytes = generate_pdf_report(results, specs)
        st.download_button(
            label="📄 Download Compliance Report as PDF",
            data=pdf_bytes,
            file_name=f"compliance_report_{specs['building_name'].replace(' ', '_')}.pdf",
            mime="application/pdf",
            use_container_width=True,
            type="primary"
        )
