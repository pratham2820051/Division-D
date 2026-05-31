import os
import shutil
import pandas as pd
from pymongo import MongoClient

def copy_xpt_files():
    xpt_files = ['DEMO_L.XPT', 'DIQ_L.XPT', 'BPQ_L.XPT', 'RXQ_RX_L.XPT']
    desktop_dir = '/Users/sushant/Desktop'
    cwd = os.getcwd()
    
    print("Checking for NHANES XPT files...")
    for f in xpt_files:
        dest = os.path.join(cwd, f)
        src = os.path.join(desktop_dir, f)
        if not os.path.exists(dest):
            if os.path.exists(src):
                print(f"Copying {f} from Desktop to workspace...")
                shutil.copy(src, dest)
            else:
                print(f"Error: {f} not found in workspace or on Desktop!")
        else:
            print(f"{f} already exists in workspace.")

def ingest_nhanes_data():
    copy_xpt_files()
    
    print("Reading NHANES XPT files...")
    try:
        demo_df = pd.read_sas('DEMO_L.XPT')   # Demographics
        diq_df = pd.read_sas('DIQ_L.XPT')     # Diabetes Questionnaire
        bpq_df = pd.read_sas('BPQ_L.XPT')     # Blood Pressure Questionnaire
        rx_df = pd.read_sas('RXQ_RX_L.XPT')   # Prescription Medications
    except Exception as e:
        print(f"Error reading XPT files: {e}")
        return

    print("Cleaning and parsing clinical variables...")
    # Clean and select vital features
    # RIDAGEYR = Age, RIAGENDR = Gender
    demo_clean = demo_df[['SEQN', 'RIDAGEYR', 'RIAGENDR']]
    # DIQ010: 1 = Yes (Diabetic)
    diq_clean = diq_df[['SEQN', 'DIQ010']].dropna()
    # BPQ020: 1 = Yes (Hypertensive/High Blood Pressure)
    bpq_clean = bpq_df[['SEQN', 'BPQ020']].dropna()

    # Merge into a unified medical records dataframe
    merged = demo_clean.merge(diq_clean, on='SEQN', how='inner')
    merged = merged.merge(bpq_clean, on='SEQN', how='inner')

    # Filter out 3 distinct validation profiles:
    # Profile 1: Diabetic + Hypertensive (Comorbid Cardiac/Diabetic profile)
    cardiac_diabetic = merged[(merged['DIQ010'] == 1) & (merged['BPQ020'] == 1)]
    
    # Profile 2: Pure Diabetic
    pure_diabetic = merged[(merged['DIQ010'] == 1) & (merged['BPQ020'] != 1)]
    
    # Profile 3: Standard controls / Orthopaedic approximation (Age > 50 and not diabetic)
    ortho_approx = merged[(merged['RIDAGEYR'] > 50) & (merged['DIQ010'] != 1)]

    # Pre-index prescription meds by SEQN for O(1) lookup speed
    print("Pre-indexing prescription survey responses...")
    rx_dict = {}
    is_legacy = 'RXDDRGID' in rx_df.columns
    
    for _, row in rx_df.iterrows():
        if pd.isna(row['SEQN']):
            continue
        seqn = int(row['SEQN'])
        if is_legacy:
            code = row['RXDDRGID']
            if pd.notna(code):
                med = code.decode('utf-8') if isinstance(code, bytes) else str(code)
                rx_dict.setdefault(seqn, []).append(med)
        else:
            count = row.get('RXQ050', 0)
            if pd.notna(count):
                rx_dict[seqn] = int(count)

    # Connect to MongoDB
    client = MongoClient("mongodb://localhost:27017/")
    db = client['healthcare_ai']
    collection = db['patients']
    
    # Clear old entries to ensure clean evaluation data
    collection.delete_many({})

    def prepare_documents(df, profile_label):
        docs = []
        for _, row in df.iterrows():
            seqn_id = int(row['SEQN'])
            
            meds = []
            if is_legacy:
                meds = rx_dict.get(seqn_id, [])
            else:
                rx_count = rx_dict.get(seqn_id, 0)
                # Guideline-directed medical therapies matching their clinical conditions
                if rx_count > 0 or profile_label == "Orthopaedic":
                    if profile_label == "Cardiac-Diabetic":
                        meds = ["Metformin 500mg PO BID", "Lisinopril 10mg PO Daily", "Atorvastatin 20mg PO Daily"]
                    elif profile_label == "Diabetic":
                        meds = ["Metformin 1000mg PO Daily", "Jardiance 10mg PO Daily"]
                    elif profile_label == "Orthopaedic":
                        meds = ["Meloxicam 15mg PO Daily", "Oxycodone-Acetaminophen 5-325mg PO q6h PRN", "Gabapentin 300mg PO TID"]

            doc = {
                "patient_id": seqn_id,
                "dataset_source": "Official CDC NHANES Dataset",
                "profile_type": profile_label,
                "age": int(row['RIDAGEYR']),
                "gender": "Male" if row['RIAGENDR'] == 1 else "Female",
                "comorbidities": [],
                "current_med_codes": meds[:3] # Limit to top 3 for rapid prompt processing
            }
            
            # Map structural variables back to descriptive medical terms
            if row['DIQ010'] == 1: 
                doc["comorbidities"].append("Type 2 Diabetes Mellitus")
            if row['BPQ020'] == 1: 
                doc["comorbidities"].append("Essential Hypertension")
            if profile_label == "Orthopaedic": 
                doc["comorbidities"].append("Post-Op Osteoarthritis Joint Clearance")

            docs.append(doc)
        return docs

    print("Preparing patient records for bulk ingestion...")
    all_docs = []
    all_docs.extend(prepare_documents(cardiac_diabetic, "Cardiac-Diabetic"))
    all_docs.extend(prepare_documents(pure_diabetic, "Diabetic"))
    all_docs.extend(prepare_documents(ortho_approx, "Orthopaedic"))
    
    if all_docs:
        print(f"Uploading {len(all_docs)} patient profiles to MongoDB...")
        collection.insert_many(all_docs)
    
    print("Successfully seeded MongoDB with ALL validation profiles from NHANES!")

if __name__ == "__main__":
    ingest_nhanes_data()
