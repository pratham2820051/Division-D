import re
from agents.base_agent import BaseAgent

class CommunicationsAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Communications Specialist Agent",
            role="Expert Corporate Copywriter & PR Strategist",
            goal="Draft high-converting invitations, persuasive speaker outreach, clear operational reminders, and engaging post-event appreciation letters.",
            backstory="A communications director with a background in corporate PR and journalism. You know how to strike the perfect tone - welcoming, professional, and clear."
        )

    def run(self, event_name, theme, location, date, expected_guests):
        system_prompt = (
            f"You are the {self.name}, working as a {self.role}.\n"
            f"Your Goal: {self.goal}\n"
            f"Backstory: {self.backstory}\n"
            f"Ensure your output is structured in clean Markdown. Present all 4 requested email drafts in full."
        )
        
        user_prompt = (
            f"Please draft a complete communications email pack for our upcoming event:\n"
            f"- Event Name: {event_name}\n"
            f"- Theme/Domain: {theme}\n"
            f"- Location: {location}\n"
            f"- Date: {date}\n"
            f"- Estimated Attendees: {expected_guests}\n\n"
            f"Please provide exactly 4 distinct templates, copy-paste ready, each including a professional Subject line and fully populated Body (no empty brackets except for variables like [Recipient Name]):\n"
            f"1. **Speaker Invitation Outreach**: Persuasive pitch to an expert to join as a speaker.\n"
            f"2. **Attendee Invitation Email**: Welcoming draft sent to target guests.\n"
            f"3. **Event Reminder Email**: Sent 48 hours prior containing date, venue, and arrival timing.\n"
            f"4. **Post-Event Thank-You Email**: Sent to attendees thanking them and offering a feedback link."
        )
        
        return self.query_llm(system_prompt, user_prompt)

    def get_simulation_response(self, user_prompt):
        """Simulation fallback with rich templates based on typical input values."""
        name_match = re.search(r"Event Name: ([^\n]+)", user_prompt)
        theme_match = re.search(r"Theme/Domain: ([^\n]+)", user_prompt)
        loc_match = re.search(r"Location: ([^\n]+)", user_prompt)
        date_match = re.search(r"Date: ([^\n]+)", user_prompt)
        guests_match = re.search(r"Attendees: ([^\n]+)", user_prompt)
        
        event_name = name_match.group(1) if name_match else "AI Developers Summit"
        theme = theme_match.group(1) if theme_match else "AI & Technology"
        location = loc_match.group(1) if loc_match else "Bangalore"
        date = date_match.group(1) if date_match else "2026-05-30"
        guests = guests_match.group(1) if guests_match else "100"

        output = f"""### 📧 Communications Agent Report: Ready-to-Send Email Templates

*Copywriting Strategy: Creating high-engagement templates for **{event_name}** ({theme} themed) scheduled on **{date}** in **{location}**. All drafts are tailored to be professional, clean, and copy-paste ready.*

---

#### 1. 🎤 Speaker Invitation Outreach Email
- **Subject:** Invitation to speak at {event_name} - {date} ({location})
- **Body:**
```text
Dear [Speaker Name],

I hope this email finds you well.

On behalf of the organizing committee, I am honored to invite you as an expert speaker for our upcoming {event_name}, taking place on {date} at the premium venues of {location}. 

Our theme this year is "{theme}", and we are expecting an audience of approximately {guests} senior industry practitioners, developers, and academics. Given your exceptional contributions and expertise in this space, we believe your insights would be incredibly valuable and inspiring to our audience.

We are specifically interested in having you deliver a 45-minute Keynote Presentation on a topic aligned with your recent work. We provide full travel accommodation, and a professional speaker honorarium.

Please let us know your availability for a brief 10-minute briefing call next week to discuss this opportunity further.

Warm regards,

[Your Name]
Organizing Chair, {event_name}
```

---

#### 2. 🎟️ Attendee Invitation Email
- **Subject:** Exclusive Invitation: Join us at the {event_name} on {date}!
- **Body:**
```text
Dear [Attendee Name],

We are thrilled to invite you to the {event_name}, an elite gathering focused on "{theme}", taking place in the heart of {location} on {date}.

This exclusive, curated event will bring together over {guests} passionate professionals, thought leaders, and innovators. 

Why you should attend:
• Learn from industry leading speaker keynotes and case studies.
• Participate in collaborative workshop sessions.
• Network with peer developers and executives during lunch.

Tickets are limited to ensure high-quality collaboration. Register today using the link below to reserve your complimentary delegate pass:
[Link: Register for {event_name}]

We look forward to welcoming you to an unforgettable day of learning and connection.

Best regards,

The {event_name} Organizing Team
```

---

#### 3. ⏰ Event Reminder Email (48 Hours Prior)
- **Subject:** Important: Joining Details for {event_name} this [Date]
- **Body:**
```text
Dear [Attendee Name],

We are excited to welcome you to the {event_name} in just 48 hours! 

Here are the essential logistics for your arrival:
• Date: {date}
• Registration & Welcome Drinks: 09:30 AM (Please arrive early to collect your attendee badge)
• Session Start: 10:00 AM sharp
• Venue: [Confirmed Venue Name, City]
• Dietary Preference: Custom options will be clearly labeled on the buffet.

We encourage you to bring your laptop for hands-on sessions. Please review the digital agenda here: [Link: Digital Agenda].

See you soon!

Warmly,

The {event_name} Operations Team
```

---

#### 4. 💌 Post-Event Thank-You Email
- **Subject:** Thank you for joining {event_name}! (Resource Pack & Feedback)
- **Body:**
```text
Dear [Attendee Name],

Thank you for attending the {event_name} on {date}! It was an absolute pleasure having you with us.

Thanks to your participation, insightful questions, and energy, our theme "{theme}" was explored in incredible depth. We hope you walked away with valuable connections and actionable knowledge.

Access Your Resources:
• Digital Slides & Presentation Pack: [Link: Download Slides]
• High-resolution Event Gallery: [Link: Photo Gallery]

Feedback Form:
To help us improve future meetups, please take 2 minutes to fill out our quick feedback form here: [Link: Share Your Feedback].

Thank you once again for making this event a grand success. Let's stay connected!

Best regards,

[Your Name]
Lead Orchestrator, {event_name}
```
"""
        return output
