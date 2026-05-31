import streamlit as st
import pandas as pd
from datetime import datetime
from pathlib import Path

from utils.data_loader import load_data, validate_columns, prepare_timestamp
from utils.data_cleaner import clean_data, create_features, get_summary
from utils.breach_detector import detect_excursions, get_excursion_statistics
from utils.report_generator import generate_fda_report
from utils.insurance_generator import generate_insurance_claim
from utils.docx_generator import save_docx
from utils.visualizer import (
    temperature_graph,
    humidity_graph,
    health_index_graph,
    temperature_distribution,
    route_analysis,
    product_analysis,
)

st.set_page_config(
    page_title='Cold Chain Breach Alert & Insurance Claim Assistant',
    layout='wide',
)

st.markdown("""
# ❄️ Cold Chain Breach Alert & Insurance Claim Assistant

Upload an IoT healthcare shipment dataset and analyze:
- Temperature Breaches
- Excursion Severity
- Shipment Health
- Insurance Claim Recommendation
""")

uploaded_file = st.file_uploader(
    'Upload CSV Dataset',
    type=['csv'],
)

if uploaded_file is not None:
    st.success('File uploaded successfully. Click Analyze to begin breach and claim analysis.')
    analyze_clicked = st.button('Analyze Dataset')

    if analyze_clicked:
        try:
            df = load_data(uploaded_file)
            missing_columns = validate_columns(df)

            if missing_columns:
                st.error(
                    f'Missing required dataset columns: {", ".join(missing_columns)}'
                )
            else:
                df = prepare_timestamp(df)
                df = clean_data(df)
                df = create_features(df)

                summary = get_summary(df)
                excursions = detect_excursions(df)
                stats = get_excursion_statistics(excursions)
                excursion_df = pd.DataFrame(excursions)

                st.header('📊 Dataset Summary')
                c1, c2, c3, c4 = st.columns(4)
                c1.metric('Records', summary['records'])
                c2.metric('Average Temp', f"{summary['avg_temp']} °C")
                c3.metric('Average Humidity', f"{summary['avg_humidity']} %")
                c4.metric('Average Health Index', summary['avg_health'])

                st.header('🚨 Breach Dashboard')
                c1, c2, c3, c4 = st.columns(4)
                c1.metric('Total Excursions', stats['total_excursions'])
                c2.metric('Average Duration', f"{stats['avg_duration']} min")
                c3.metric('Longest Duration', f"{stats['longest_duration']} min")
                c4.metric('Maximum Temperature', f"{stats['max_temperature']} °C")

                st.header('📝 Insurance Claim Recommendation')
                if stats['max_temperature'] > 10:
                    st.error(
                        'Claim Recommended: Temperature exceeded critical cold-chain limits.'
                    )
                elif stats['max_temperature'] > 8:
                    st.warning(
                        'Moderate Risk Detected: Manual inspection recommended before claim decision.'
                    )
                else:
                    st.success('Low Risk Shipment: No insurance claim required.')

                st.header('📋 Excursion Details')
                if not excursion_df.empty:
                    st.dataframe(excursion_df, use_container_width=True)

                    report_dir = Path('reports')
                    report_dir.mkdir(exist_ok=True)

                    fda_report = '\n\n'.join(
                        generate_fda_report(excursion) for excursion in excursions
                    )
                    insurance_claim = '\n\n'.join(
                        generate_insurance_claim(excursion) for excursion in excursions
                    )

                    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                    fda_file = report_dir / f'FDA_Report_{timestamp}.docx'
                    claim_file = report_dir / f'Insurance_Claim_{timestamp}.docx'
                    
                    save_docx(fda_report, str(fda_file))
                    save_docx(insurance_claim, str(claim_file))

                    st.subheader('Download Reports')
                    col1, col2 = st.columns(2)
                    with col1:
                        with open(fda_file, 'rb') as f:
                            st.download_button(
                                'Download FDA Report',
                                f.read(),
                                file_name=fda_file.name,
                                mime='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                                use_container_width=True,
                            )
                    with col2:
                        with open(claim_file, 'rb') as f:
                            st.download_button(
                                'Download Insurance Claim',
                                f.read(),
                                file_name=claim_file.name,
                                mime='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                                use_container_width=True,
                            )

                    st.markdown(
                        f'Saved locally to `{fda_file.resolve()}` and `{claim_file.resolve()}`.'
                    )
                else:
                    st.success('No temperature excursions detected.')

                st.header('📈 Visual Analytics')
                st.plotly_chart(temperature_graph(df), use_container_width=True)
                st.plotly_chart(humidity_graph(df), use_container_width=True)
                st.plotly_chart(health_index_graph(df), use_container_width=True)
                st.plotly_chart(temperature_distribution(df), use_container_width=True)
                st.plotly_chart(route_analysis(df), use_container_width=True)
                st.plotly_chart(product_analysis(df), use_container_width=True)

        except Exception as e:
            st.error(f'Application Error: {e}')
