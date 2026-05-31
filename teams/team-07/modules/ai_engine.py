import google.generativeai as genai
from config import GEMINI_API_KEY

genai.configure(api_key=GEMINI_API_KEY)

model = genai.GenerativeModel("gemini-1.5-flash")

def generate_announcement(route,cause,duration,severity):

    prompt=f"""
You are an official BMTC Public Transport Communication Assistant.

Generate a professional passenger announcement.

Requirements:
- Mention route name.
- Mention delay duration.
- Mention delay cause.
- Apologize for inconvenience.
- Keep the message under 80 words.
- Use simple language suitable for daily commuters.

Route: {route}
Cause: {cause}
Delay: {duration}
Severity: {severity}
"""


    try:

        response = model.generate_content(prompt)

        return response.text

    except Exception:

        return f"""
Attention passengers.

BMTC Route {route} is experiencing a {duration}-minute delay due to {cause}.

Severity Level: {severity}

We regret the inconvenience caused.
"""