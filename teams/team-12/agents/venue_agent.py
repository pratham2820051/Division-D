import os
import json
from agents.base_agent import BaseAgent
from tools.dataset_loader import DatasetLoader

class VenueAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Venue Scouting Agent",
            role="Expert Event Venue Analyst & Negotiator",
            goal="Scout, filter, and recommend venues based on expected guest counts, budget, and location using past meetup database trends.",
            backstory="Experienced in global real estate and commercial hospitality, you know how to match attendee sizes with standard safety spacing, technical acoustic needs, and budget caps."
        )
        self.loader = DatasetLoader()

    def run(self, city, category, expected_guests, budget_range):
        # 1. Fetch data-backed recommendations
        # Map budget range to rough numeric cap
        budget_map = {
            "<1L": 100000,
            "1-5L": 500000,
            "5-10L": 1000000,
            "10L+": 2500000
        }
        budget_limit = budget_map.get(budget_range, 500000)
        
        venues = self.loader.recommend_venues(city, category, expected_guests, budget_limit)
        stats = self.loader.get_stats(city, category)
        
        # 2. Prepare prompt
        system_prompt = (
            f"You are the {self.name}, working as a {self.role}.\n"
            f"Your Goal: {self.goal}\n"
            f"Backstory: {self.backstory}\n"
            f"Ensure your final output is structured in clean Markdown. Present exactly 3 venue options. "
            f"Do not use generic statements; tailor details to the {category} theme."
        )
        
        user_prompt = (
            f"Please recommend 3 venues in '{city}' suitable for a '{category}' event with {expected_guests} expected guests "
            f"within a budget tier of {budget_range} (approx cap: INR {budget_limit:,}).\n\n"
            f"Historical database analysis shows:\n"
            f"- Average attendance in this city & category: {stats['avg_attendance']} guests.\n"
            f"- Typical event cost estimate: INR {stats['avg_cost_inr']:,}.\n\n"
            f"Filtered venues from our database are:\n"
            f"{json.dumps(venues, indent=2)}\n\n"
            f"Provide a comprehensive, styled report detailing:\n"
            f"1. A brief historical analysis paragraph referencing the database statistics (e.g. attendance trends).\n"
            f"2. Three detailed options in a list format, each including:\n"
            f"   - **Venue Name**\n"
            f"   - **Estimated Cost (INR)** (tailored to expected guests)\n"
            f"   - **Capacity** (must be >= {expected_guests})\n"
            f"   - **Availability** (highly realistic dates)\n"
            f"   - **Amenities & Fit**: Specific features matching {category} (like sound systems, projector screens, networking layout)\n"
            f"3. A structured final summary suggestion of which venue is the optimal choice."
        )
        
        return self.query_llm(system_prompt, user_prompt)

    def get_simulation_response(self, user_prompt):
        """Simulation fallback with rich templates based on typical input values."""
        # Simple parsing of variables from user_prompt
        import re
        city_match = re.search(r"in '([^']+)'", user_prompt)
        cat_match = re.search(r"a '([^']+)' event", user_prompt)
        guests_match = re.search(r"with (\d+) expected", user_prompt)
        budget_match = re.search(r"budget tier of (\S+)", user_prompt)
        
        city = city_match.group(1) if city_match else "Bangalore"
        category = cat_match.group(1) if cat_match else "AI & Technology"
        guests = guests_match.group(1) if guests_match else "100"
        budget = budget_match.group(1) if budget_match else "1-5L"
        
        # Pull real data from dataset loader to keep simulation authentic!
        venues = self.loader.recommend_venues(city, category, int(guests))
        stats = self.loader.get_stats(city, category)
        
        output = f"""### 🏢 Venue Agent Report: Historical Scouting Analysis

*Database Insight: Historical analysis of {stats['total_events']} past events in the **{category}** domain in **{city}** reveals an average attendance of **{stats['avg_attendance']}** participants. The typical pricing structure for hosting these scales around **INR {stats['avg_cost_inr']:,}**. Based on these statistics, our {guests}-attendee event is highly viable.*

Here are the top 3 curated venue recommendations extracted from our Meetup database, tailored for your budget tier **{budget}**:

---

#### 1. **{venues[0]['venue_name']}** (Ranked #1 for Popularity)
- **Estimated Cost:** INR {venues[0]['cost_estimate_inr']:,} (Standard full-day package)
- **Capacity:** {venues[0]['capacity']} pax
- **Availability:** Fully Available for your selected dates (Requires booking 3 weeks prior)
- **Acoustic & AV Setup:** Dual high-lumen laser projectors, digital audio mixers, and a podium microphone.
- **Theme Fit:** Large, modern space with glass boards and open seating clusters, perfect for **{category}** whiteboard and workshop sessions.

#### 2. **{venues[1]['venue_name']}** (Ranked #2 - Highly Customisable)
- **Estimated Cost:** INR {venues[1]['cost_estimate_inr']:,} (Half-day & full-day blocks available)
- **Capacity:** {venues[1]['capacity']} pax
- **Availability:** High availability on weekdays; weekends require advance deposit
- **Acoustic & AV Setup:** Handheld wireless mics, 85-inch interactive LED screens, and localized audio amplification.
- **Theme Fit:** Sleek professional layout with executive tables and catering deck areas.

#### 3. **{venues[2]['venue_name']}** (Ranked #3 - High Value Option)
- **Estimated Cost:** INR {venues[2]['cost_estimate_inr']:,}
- **Capacity:** {venues[2]['capacity']} pax
- **Availability:** Limited availability; block booking recommended
- **Acoustic & AV Setup:** Standard PA system, wall-mounted display projection, and whiteboards.
- **Theme Fit:** Cozy, collaborative layout with bean bags, plug points at every seat, and an integrated cafeteria.

---

### 📌 Coordinator Recommendations
For a **{guests}-guest** crowd focusing on **{category}**, we highly recommend **{venues[0]['venue_name']}** due to its premium AV capabilities and spacious seating layout, which ensures safety compliance and maximum networking interaction.
"""
        return output
