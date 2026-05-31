import os
import json
from agents.base_agent import BaseAgent

class CoordinatorAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Lead Event Coordinator & Architect",
            role="Chief Operations Officer & Orchestration Director",
            goal="Synthesize individual plans (venue, speakers, menu, logistics, comms) into a seamless, unified, and highly structured master event blueprint.",
            backstory="A premier operations designer who orchestrates large conventions and high-profile retreats. You have a vision of the event's overall architecture and ensure every puzzle piece fits together."
        )
        
        # Load checklist template
        self.checklist_template = {}
        self.load_checklist()

    def load_checklist(self):
        """Loads pre-built checklist from templates directory."""
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        checklist_path = os.path.join(base_dir, "templates", "event_checklist.json")
        if os.path.exists(checklist_path):
            try:
                with open(checklist_path, mode="r", encoding="utf-8") as f:
                    self.checklist_template = json.load(f)
            except Exception as e:
                print(f"Error loading checklist in CoordinatorAgent: {e}")
        else:
            print("Warning: Checklist template not found in CoordinatorAgent.")

    def run(self, event_info, venue_out, speaker_out, catering_out, logistics_out, comms_out):
        system_prompt = (
            f"You are the {self.name}, working as a {self.role}.\n"
            f"Your Goal: {self.goal}\n"
            f"Backstory: {self.backstory}\n"
            f"Synthesize the outputs of the 5 specialized planning agents into a single unified plan. "
            f"Incorporate the Asana task framework: {json.dumps(self.checklist_template)}"
        )
        
        user_prompt = (
            f"Please synthesize the complete master planning blueprint for:\n"
            f"- Event Name: {event_info.get('name')}\n"
            f"- Theme: {event_info.get('theme')}\n"
            f"- Location: {event_info.get('location')}\n"
            f"- Date: {event_info.get('date')}\n"
            f"- Guests: {event_info.get('guests')} pax\n"
            f"- Budget: {event_info.get('budget')}\n\n"
            f"Here are the inputs from your specialized planning network:\n\n"
            f"--- VENUE REPORT ---\n{venue_out}\n\n"
            f"--- SPEAKER REPORT ---\n{speaker_out}\n\n"
            f"--- CATERING REPORT ---\n{catering_out}\n\n"
            f"--- LOGISTICS REPORT ---\n{logistics_out}\n\n"
            f"--- COMMUNICATIONS PACK ---\n{comms_out}\n\n"
            f"Create a unified, styled Markdown report. Ensure you provide:\n"
            f"1. **Executive Strategy Summary**: Synthesis of event goals, themes, and how the selected options deliver success.\n"
            f"2. **Master Timeline**: Group by planning phases (Initiation, Booking, Logistics, Comms, Execution) and align with our Asana framework.\n"
            f"3. **Vendor Brief**: Consolidate venue choice, catering tier, and tech AV guidelines into a single brief.\n"
            f"4. **On-Site Operational Milestones**: High-level timeline table of event day."
        )
        
        return self.query_llm(system_prompt, user_prompt, max_tokens=2500)

    def get_simulation_response(self, user_prompt):
        """Simulation fallback that weaves all reports together with professional polish."""
        # Simple extraction
        import re
        name_match = re.search(r"Event Name: ([^\n]+)", user_prompt)
        theme_match = re.search(r"Theme: ([^\n]+)", user_prompt)
        loc_match = re.search(r"Location: ([^\n]+)", user_prompt)
        date_match = re.search(r"Date: ([^\n]+)", user_prompt)
        guests_match = re.search(r"Guests: ([^\n]+)", user_prompt)
        
        event_name = name_match.group(1) if name_match else "AI Developers Summit"
        theme = theme_match.group(1) if theme_match else "AI & Technology"
        location = loc_match.group(1) if loc_match else "Bangalore"
        date = date_match.group(1) if date_match else "2026-05-30"
        guests = guests_match.group(1) if guests_match else "100"

        output = f"""### 👑 Coordinator Agent Report: Master Orchestration Plan

*Executive Strategy Synthesis: We have successfully synthesized the strategic reports from our 5-agent planning network for the upcoming **{event_name}** scheduled on **{date}** in **{location}**. Our unified objective is to align a high-performance **{theme}** curriculum with premium hospitality for **{guests} attendees**.*

---

### 1. 📋 Consolidated Event Briefing
- **Event Name:** {event_name}
- **Strategic Domain:** {theme}
- **Date & Location:** {date} | {location}
- **Scale:** {guests} pax
- **Orchestration Model:** Multi-Agent Cooperative Protocol

---

### 2. 🗓️ Asana Milestone Project Checklist
*Based on our corporate templates, here is the operational progress dashboard for execution stages:*

#### **Phase 1: Initiation & Conception** *(Completed)*
- [x] Define event goals: Educate, network, and engage in '{theme}' domain.
- [x] Set expected scale: {guests} participants.
- [x] Draft target timeline structure.

#### **Phase 2: Booking & Sourcing** *(In Progress)*
- [/] Confirm final venue select from Venue Scouting report options.
- [/] Begin speaker outreach to proposed boards using Speaker templates.
- [/] Sign master catering contracts (Aligning with dietary preferences).

#### **Phase 3: Operational Logistics** *(Scheduled)*
- [ ] Configure AV rigging layouts ( UPS backup, laser projector setup).
- [ ] Coordinate guest local airport shuttles.
- [ ] Deliver directional standees to venue lobby.

#### **Phase 4: Public Communications** *(Scheduled)*
- [ ] Broadcast attendee invite campaign.
- [ ] Disseminate 48-hour event reminder mailers.
- [ ] Setup post-event thank-you automation flow.

---

### 3. 💼 Consolidated Vendor Service Brief
*An integrated guide for all hired service providers to ensure complete operational synchronization:*

| Hired Vendor | Core Scope & SLA | Technical / Menu Directives | Est. Budget (INR) |
| :--- | :--- | :--- | :--- |
| **Venue Partner** | High-capacity conference hall, air-conditioned seating | Fast Wi-Fi, dual display inputs, podium mics | ₹1,50,000 |
| **Culinary Partner** | Organic Buffet with live stations, separate Veg line | Gluten-Free millet rotis, nut-free alternatives, refreshments | ₹85,000 |
| **AV Rigging Vendor** | 5000-lumen projector, UHF wireless mics, backup generator | Active standby status, soundcheck completed by 08:30 AM | ₹35,000 |

---

### 4. 🚀 Day-Of Event Master Timeline
*The synchronized agenda representing speaker sessions, catering breaks, and setup checklists:*

| Time Slot | Scheduled Session | Lead Administrator / Speaker |
| :--- | :--- | :--- |
| **08:00 AM - 09:30 AM** | Technical AV Soundcheck & Banner Installation | Operations Director & AV Crew |
| **09:30 AM - 10:00 AM** | Registration, Badge Issuance & Networking Drinks | Welcome Volunteers & Ushers |
| **10:00 AM - 10:15 AM** | Welcome Address & Opening Ceremony | Host Master of Ceremonies |
| **10:15 AM - 11:30 AM** | Session 1: Opening Keynote Presentation | Invited Keynote Speaker |
| **11:30 AM - 12:00 PM** | Structured Coffee & High-Tea Networking Break | Catering Service Lead |
| **12:00 PM - 01:30 PM** | Session 2: Technical Deep Dive & Interactive Workshop | Subject Matter Experts |
| **01:30 PM - 02:30 PM** | Deluxe Networking Lunch Buffet | Catering Service Lead |
| **02:30 PM - 04:00 PM** | Collaborative Team Exercises & Panel Discussion | Panel Speakers & Moderator |
| **04:00 PM - 04:30 PM** | Closing Ceremony, Awards & Thank-Yous | Lead Host & Coordinator |
| **04:30 PM - 06:00 PM** | Venue Tear-down, Clearing & Settlement | Operations Director |

---

### 📌 Chief Operations Verdict
The planning framework is structurally complete, risk-mitigated, and ready for deployment. The next step is to download the generated **Master Strategy Plan Word Document (.docx)** to execute vendor contracts and speaker invitations.
"""
        return output
