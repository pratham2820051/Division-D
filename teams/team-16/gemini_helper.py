import os
import google.generativeai as genai

API_KEY = os.getenv("GOOGLE_API_KEY")

genai.configure(
    api_key=API_KEY
)

model = genai.GenerativeModel(
    "gemini-2.5-flash"
)

# ----------------------------------
# FIR SUMMARY
# ----------------------------------

def generate_summary(fir_text):

    try:

        prompt = f"""
You are an expert legal assistant.

Read the FIR below and provide a citizen-friendly summary.

IMPORTANT:
- Do not write headings.
- Do not write 'AI Generated'.
- Explain in simple language.

FIR:
{fir_text}
"""

        response = model.generate_content(prompt)

        return response.text

    except Exception as e:

        return f"Summary Error: {str(e)}"


# ----------------------------------
# LEGAL EXPLANATION
# ----------------------------------

def generate_explanation(fir_text):

    try:

        prompt = f"""
You are a legal assistant.

Read the FIR and explain it to an ordinary citizen.

FIR:
{fir_text}

Explain:

1. What happened?
2. What type of crime is involved?
3. Important facts.
4. What police are doing.

Use simple language.
"""

        response = model.generate_content(prompt)

        return response.text

    except Exception as e:

        return f"Explanation Error: {str(e)}"


# ----------------------------------
# AI CRIME ANALYSIS
# ----------------------------------

def detect_crime_type(fir_text):

    try:

        prompt = f"""
Analyze the FIR.

Identify:

1. Crime Category
2. Likely IPC/BNS Sections
3. Reason

FIR:
{fir_text}

Give concise output.
"""

        response = model.generate_content(prompt)

        return response.text

    except Exception as e:

        return f"Crime Analysis Error: {str(e)}"


# ----------------------------------
# DISCREPANCY ANALYSIS
# ----------------------------------

def generate_discrepancy(
    complaint_text,
    fir_text
):

    try:

        prompt = f"""
Compare the Citizen Complaint and FIR.

Citizen Complaint:
{complaint_text}

FIR:
{fir_text}

Identify:

1. Missing information from FIR
2. Mismatched information
3. Additional information present in FIR

If there is no major issue, respond:

No major discrepancy found.

Keep the response short and clear.
"""

        response = model.generate_content(prompt)

        return response.text

    except Exception as e:

        return f"Discrepancy Error: {str(e)}"
