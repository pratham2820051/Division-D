import re
from agents.base_agent import BaseAgent

class LogisticsAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Logistics Operations Agent",
            role="Lead Event Operations & AV Production Director",
            goal="Establish robust equipment checklists, stage layouts, transportation timelines, and on-site staff schedules to ensure a smooth, risk-free event execution.",
            backstory="A battle-tested operations manager who has run production for corporate conventions and high-security technical symposiums. You have a backup plan for every projector cable and speaker microphone."
        )

    def run(self, location, expected_guests, theme, date):
        system_prompt = (
            f"You are the {self.name}, working as a {self.role}.\n"
            f"Your Goal: {self.goal}\n"
            f"Backstory: {self.backstory}\n"
            f"Ensure your output is structured in clean Markdown. Organize checklists with clear bullet categories."
        )
        
        user_prompt = (
            f"Please prepare an operational logistics and setup blueprint for an event in '{location}' "
            f"on '{date}'. The theme is '{theme}' with {expected_guests} expected guests.\n\n"
            f"Your plan must contain:\n"
            f"1. **Audio-Visual (AV) & Technical Checklist**: Microphones, backup power systems, slide display standards, and connectivity tailored for {theme}.\n"
            f"2. **On-Site Seating & Stage Layout**: Layout style (theater vs cluster seating) matching {expected_guests} participants.\n"
            f"3. **Speaker & VIP Transport Plan**: Airport pickup coordination, driver schedules, and local transit routes in {location}.\n"
            f"4. **On-Ground Setup Timeline**: Checklist of activities hour-by-hour on the day of the event, from initial vendor entry (e.g. 06:00 AM) to final pack-up."
        )
        
        return self.query_llm(system_prompt, user_prompt)

    def get_simulation_response(self, user_prompt):
        """Simulation fallback with rich templates based on typical input values."""
        loc_match = re.search(r"in '([^']+)'", user_prompt)
        date_match = re.search(r"on '([^']+)'", user_prompt)
        theme_match = re.search(r"theme is '([^']+)'", user_prompt)
        guests_match = re.search(r"with (\d+) expected", user_prompt)
        
        location = loc_match.group(1) if loc_match else "Bangalore"
        date = date_match.group(1) if date_match else "2026-05-30"
        theme = theme_match.group(1) if theme_match else "AI & Technology"
        guests = guests_match.group(1) if guests_match else "100"

        output = f"""### 📦 Logistics Agent Report: Technical AV & Setup Checklist

*Operations Briefing: Formulating high-availability logistics for a **{guests}-attendee** gathering in **{location}** on **{date}** focusing on **{theme}**. Our baseline operational target is zero-downtime, fully redundant AV distribution, and organized transportation protocols.*

---

#### 1. 🎤 Audio-Visual (AV) & Technical Checklist
- [ ] **Acoustics & Amplification:** 1x Podiums Mic (wired), 2x Cordless Handheld Mics (UHF range, distinct channels), and 1x Lapel Mic (backup).
- [ ] **Visual Displays:** Primary high-lumen laser projector (minimum 5000 lumens) + 1x 85-inch LCD Confidence Monitor for speakers. Dual HDMI inputs with seamless switcher.
- [ ] **Redundant Power:** 15kVA Online UPS backup system or active Diesel Generator backup on stand-by with <15 second transition.
- [ ] **Connectivity & Infrastructure:** Dedicated high-speed internet line (minimum 100 Mbps symmetric) with dedicated Wi-Fi SSID for live demos, speaker slide streaming, and organizers.

#### 2. 🪑 On-Site Seating & Stage Layout
- **Layout Style:** **Collaborative Cluster Seating** (Round tables of 6-8 seats each) for a capacity of {guests} people, which stimulates workshop-style group collaboration.
- **Stage Layout:** Elevated stage (12ft x 8ft x 1.5ft height) with dark blue backdrop drape, 1x wooden podium (left side), and 3x comfortable lounge chairs (center) for panel segments.
- **Directional signage:** 2x Roll-up standees at venue lobby entrance, 4x floor arrows to conference hall, and 1x Wi-Fi instruction card on every table.

#### 3. 🚗 Speaker & VIP Transport Plan (Location: {location})
- **Airport Shuttle:** Pre-booked premium sedans for outstation speakers, managed via real-time GPS tracking.
- **Transit Timeline:** Pickups scheduled precisely 3 hours prior to scheduled talks to accommodate local traffic conditions in {location}.
- **Host Ushering:** 2 dedicated volunteers assigned specifically for VIP welcoming at the venue drop-off zone.

#### 4. ⏰ Hour-by-Hour Setup Timeline (Event Day)
- **06:00 AM - 07:30 AM:** Vendor entry, AV gear setup, stage construction, and backdrop draping.
- **07:30 AM - 08:30 AM:** Rigorous Soundcheck, mic levels adjusted, projector alignment, and Wi-Fi dry run.
- **08:30 AM - 09:15 AM:** Seating alignment, table signage placement, and registration desk volunteer brief.
- **09:15 AM - 09:30 AM:** Tech system lock. Background ambient music enabled. Doors open.
- **04:30 PM - 05:30 PM (Post-Event):** Attendee departure, technical de-rigging, banner removal, and vendor sign-off.
"""
        return output
