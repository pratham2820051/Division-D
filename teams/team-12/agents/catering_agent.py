import re
from agents.base_agent import BaseAgent

class CateringAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Catering Planning Agent",
            role="Professional Corporate Hospitality & Culinary Planner",
            goal="Design tailored menu selections, estimate per-head catering budgets, and select options that fully respect attendee size, preferences, and dietary restrictions.",
            backstory="A hospitality consultant with 15 years in Michelin-starred restaurant groups and large scale corporate banqueting. You know how to design clean, elegant menus that satisfy food safety, allergen rules, and culinary prestige."
        )

    def run(self, expected_guests, dietary_prefs, budget_range):
        system_prompt = (
            f"You are the {self.name}, working as a {self.role}.\n"
            f"Your Goal: {self.goal}\n"
            f"Backstory: {self.backstory}\n"
            f"Ensure your output is structured in clean Markdown. Design exactly 3 menu options."
        )
        
        user_prompt = (
            f"Please plan the culinary menu requirements for a corporate/academic event with {expected_guests} guests. "
            f"The attendees' dietary preferences to respect are: {', '.join(dietary_prefs)}.\n"
            f"The current event budget tier is: {budget_range}.\n\n"
            f"Please structure your output to include:\n"
            f"1. **Catering Strategy Summary**: Brief review of how the menu handles the dietary preferences of '{', '.join(dietary_prefs)}' and keeps within the '{budget_range}' tier.\n"
            f"2. **Three Specialized Menu Options** (e.g. Standard Fusion Buffet, Vegan/Organic Harvest, Premium High-Tea/Cocktail Setup), each detailing:\n"
            f"   - **Menu Name**\n"
            f"   - **Estimated Cost Per Head (INR)**\n"
            f"   - **Appetizers & Starters**\n"
            f"   - **Main Course Items**\n"
            f"   - **Desserts & Beverages**\n"
            f"   - **Allergen Highlights** (explicitly listing gluten, dairy, or nuts status)\n"
            f"3. **Vendor Setup Recommendations**: Logistics guidelines for the servers (e.g. buffet vs pre-plated, layout spacing, live counters, waste handling)."
        )
        
        return self.query_llm(system_prompt, user_prompt)

    def get_simulation_response(self, user_prompt):
        """Simulation fallback with rich templates based on typical input values."""
        guests_match = re.search(r"with (\d+) guests", user_prompt)
        dietary_match = re.search(r"dietary preferences to respect are: ([^\.]+)", user_prompt)
        budget_match = re.search(r"budget tier is: (\S+)", user_prompt)
        
        guests = guests_match.group(1) if guests_match else "100"
        dietary = dietary_match.group(1) if dietary_match else "Veg, Gluten-Free"
        budget = budget_match.group(1) if budget_match else "1-5L"
        
        # Determine pricing based on budget
        cost_p_head_1 = 650
        cost_p_head_2 = 800
        cost_p_head_3 = 1200
        
        if "<1L" in budget:
            cost_p_head_1, cost_p_head_2, cost_p_head_3 = 350, 450, 600
        elif "5-10L" in budget:
            cost_p_head_1, cost_p_head_2, cost_p_head_3 = 900, 1100, 1500
        elif "10L+" in budget:
            cost_p_head_1, cost_p_head_2, cost_p_head_3 = 1200, 1600, 2200

        output = f"""### 🍽️ Catering Agent Report: Culinary Selections & Cost Sheet

*Catering Strategy Briefing: Designing a culinary layout for **{guests} guests** under a **{budget}** budget framework, with strict compliance for **{dietary}** dietary profiles. Our strategy prioritizes high-value local sourcing, clearly marked allergen labeling, and separate service lines to avoid cross-contamination.*

---

#### 🥇 Menu Option 1: The Executive Standard Buffet (Classic Fusion)
- **Estimated Cost:** INR {cost_p_head_1} per head (Total: INR {cost_p_head_1 * int(guests):,})
- **Appetizers:** Crispy Honey Chilli Potatoes, Paneer Tikka Skewers, Vegetable Spring Rolls.
- **Mains:** Paneer Butter Masala, Dal Makhani, Seasonal Veg Kadai, Jeera Rice, and Butter Naan / Tandoori Roti.
- **Desserts & Drinks:** Hot Gulab Jamun with Vanilla Ice Cream, Fresh Mint Lemonade, and Masala Chai.
- **Allergen Indicators:** Contains Gluten (Naan/Spring Rolls), Contains Dairy (Paneer/Butter Masala). *Vegetarian Friendly.*

#### 🥗 Menu Option 2: The Healthy Green & Organic Harvest (100% Veg & Gluten-Free)
- **Estimated Cost:** INR {cost_p_head_2} per head (Total: INR {cost_p_head_2 * int(guests):,})
- **Appetizers:** Sprouted Moong Salad Cups, Steamed Quinoa & Vegetable Dumplings, Tandoori Broccoli.
- **Mains:** Mushroom Methi Malai (Almond Milk based), Yellow Dal Tadka, Brown Rice, and Gluten-Free Millet Rotis.
- **Desserts & Drinks:** Organic Date & Nut Halwa (Dairy-Free), Coconut Water Infusions, and Green Tea.
- **Allergen Indicators:** Soy present (Dumplings), Nut trace (Mushroom Malai). *100% Gluten-Free, Dairy-Free & Vegan Friendly.*

#### 👑 Menu Option 3: Premium High-Tea & Networking Grazing Platter
- **Estimated Cost:** INR {cost_p_head_3} per head (Total: INR {cost_p_head_3 * int(guests):,})
- **Appetizers:** Assorted Finger Sandwiches (Cucumber-Dill, Cheese-Chutney), Cocktail Samosas, Baked Bruschetta.
- **Mains:** Pasta Bar Live Counter (Penne/Fusilli in Marinara and Pesto Sauce), Roasted Garlic Focaccia.
- **Desserts & Drinks:** Mini Fruit Tarts, Dark Chocolate Brownie Bites, Espresso Coffee Station, and Assorted Mocktails.
- **Allergen Indicators:** Contains Gluten (Sandwiches/Pasta/Focaccia), Nuts present (Pesto Sauce).

---

### 📌 Coordinator Recommendations
To suit the **{dietary}** preferences perfectly and maximize networking flexibility for a **{guests}-attendee** gathering, we recommend deploying **Menu Option 2 (Organic Harvest)** for lunch, coupled with an afternoon **Espresso & High-Tea Coffee Station** to keep energy and engagement high throughout the session.
"""
        return output
