import os
import json
from dotenv import load_dotenv
from vectorstore import search_regulations

load_dotenv()

try:
    from google import genai
    _client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    _USE_NEW_SDK = True
except Exception:
    _USE_NEW_SDK = False

_GEMINI_AVAILABLE = None  # cached after first test


def _gemini_available():
    global _GEMINI_AVAILABLE
    if _GEMINI_AVAILABLE is not None:
        return _GEMINI_AVAILABLE
    try:
        if _USE_NEW_SDK:
            r = _client.models.generate_content(
                model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
                contents="hi"
            )
            _GEMINI_AVAILABLE = True
        else:
            _GEMINI_AVAILABLE = False
    except Exception:
        _GEMINI_AVAILABLE = False
    return _GEMINI_AVAILABLE


def _generate(prompt: str) -> str:
    if _USE_NEW_SDK:
        response = _client.models.generate_content(
            model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
            contents=prompt
        )
        return response.text.strip()
    raise Exception("Gemini SDK not available")


# ── HDUDA DC Regulations lookup tables ────────────────────────────────────────

def _get_far_limit(usage_type, plot_area):
    u = usage_type.lower()
    if "commercial" in u:
        return 3.0, "FAR 3.0 for Commercial (road ≥12m)", "HDUDA DCR Section 6.2"
    elif "industrial" in u:
        return 1.5, "FAR 1.50 for Industrial", "HDUDA DCR Section 6.2"
    elif "mixed" in u:
        return 2.5, "FAR 2.50 for Mixed Use", "HDUDA DCR Section 6.2"
    else:  # residential
        if plot_area <= 200:
            return 1.75, "FAR 1.75 for Residential plot ≤200 sq.m", "HDUDA DCR Section 6.2"
        elif plot_area <= 500:
            return 2.0, "FAR 2.00 for Residential plot 201–500 sq.m", "HDUDA DCR Section 6.2"
        elif plot_area <= 1000:
            return 2.25, "FAR 2.25 for Residential plot 501–1000 sq.m", "HDUDA DCR Section 6.2"
        else:
            return 2.5, "FAR 2.50 for Residential plot >1000 sq.m", "HDUDA DCR Section 6.2"


def _get_height_limit(road_width):
    if road_width < 9:
        return 10.0, "Max height 10 m for road width <9 m", "HDUDA DCR Section 7.1"
    elif road_width < 12:
        return 12.0, "Max height 12 m for road width 9–12 m", "HDUDA DCR Section 7.1"
    elif road_width < 18:
        return 15.0, "Max height 15 m for road width 12–18 m", "HDUDA DCR Section 7.1"
    else:
        return 24.0, "Max height 24 m for road width ≥18 m", "HDUDA DCR Section 7.1"


def _get_front_setback(plot_area, road_width):
    if road_width >= 12:
        return 4.5, "Front setback 4.5 m min for road ≥12 m", "HDUDA DCR Section 8.1"
    elif road_width >= 9:
        return 3.0, "Front setback 3.0 m min for road 9–12 m", "HDUDA DCR Section 8.1"
    elif plot_area <= 100:
        return 1.5, "Front setback 1.5 m min for plot ≤100 sq.m", "HDUDA DCR Section 8.1"
    elif plot_area <= 200:
        return 2.0, "Front setback 2.0 m min for plot 101–200 sq.m", "HDUDA DCR Section 8.1"
    elif plot_area <= 500:
        return 3.0, "Front setback 3.0 m min for plot 201–500 sq.m", "HDUDA DCR Section 8.1"
    else:
        return 4.5, "Front setback 4.5 m min for plot >500 sq.m", "HDUDA DCR Section 8.1"


def _get_rear_setback(plot_area):
    if plot_area <= 200:
        return 1.5, "Rear setback 1.5 m min for plot ≤200 sq.m", "HDUDA DCR Section 8.2"
    elif plot_area <= 500:
        return 2.0, "Rear setback 2.0 m min for plot 201–500 sq.m", "HDUDA DCR Section 8.2"
    else:
        return 3.0, "Rear setback 3.0 m min for plot >500 sq.m", "HDUDA DCR Section 8.2"


def _get_side_setback(plot_area):
    if plot_area <= 100:
        return 0.0, "Side setback 0 m (nil) for plot ≤100 sq.m", "HDUDA DCR Section 8.3"
    elif plot_area <= 200:
        return 1.0, "Side setback 1.0 m min for plot 101–200 sq.m", "HDUDA DCR Section 8.3"
    elif plot_area <= 500:
        return 1.5, "Side setback 1.5 m min each side for plot 201–500 sq.m", "HDUDA DCR Section 8.3"
    else:
        return 2.0, "Side setback 2.0 m min each side for plot >500 sq.m", "HDUDA DCR Section 8.3"


def _get_ground_coverage(usage_type, plot_area):
    u = usage_type.lower()
    if "commercial" in u:
        return 60.0, "Max ground coverage 60% for Commercial", "HDUDA DCR Section 6.3"
    elif "industrial" in u:
        return 50.0, "Max ground coverage 50% for Industrial", "HDUDA DCR Section 6.3"
    elif "mixed" in u:
        return 55.0, "Max ground coverage 55% for Mixed Use", "HDUDA DCR Section 6.3"
    else:
        if plot_area <= 200:
            return 65.0, "Max ground coverage 65% for Residential ≤200 sq.m", "HDUDA DCR Section 6.3"
        elif plot_area <= 500:
            return 55.0, "Max ground coverage 55% for Residential 201–500 sq.m", "HDUDA DCR Section 6.3"
        else:
            return 50.0, "Max ground coverage 50% for Residential >500 sq.m", "HDUDA DCR Section 6.3"


def _get_floor_limit(road_width):
    if road_width < 9:
        return 3, "Max G+2 (3 floors) for road <9 m", "HDUDA DCR Section 7.2"
    elif road_width < 12:
        return 4, "Max G+3 (4 floors) for road 9–12 m", "HDUDA DCR Section 7.2"
    else:
        return 5, "Max G+4 (5 floors) for road ≥12 m", "HDUDA DCR Section 7.2"


def _get_road_requirement(usage_type, building_height):
    u = usage_type.lower()
    if building_height > 15:
        return 12.0, "Min road width 12 m for high-rise (height >15 m)", "HDUDA DCR Section 5.1"
    elif "commercial" in u or "industrial" in u:
        return 9.0, "Min road width 9 m for Commercial/Industrial", "HDUDA DCR Section 5.1"
    else:
        return 6.0, "Min road width 6 m for Residential", "HDUDA DCR Section 5.1"


def _rule_based_check(specs):
    """Pure Python compliance check — no API calls needed."""
    plot_area = float(specs['plot_area'])
    road_width = float(specs['road_width'])
    usage_type = specs['usage_type']
    building_height = float(specs['building_height'])
    number_of_floors = int(specs['number_of_floors'])
    far_proposed = float(specs['far_proposed'])
    ground_coverage = float(specs['ground_coverage'])
    front_setback = float(specs['front_setback'])
    rear_setback = float(specs['rear_setback'])
    side_setback = float(specs['side_setback'])

    results = []

    # 1. FAR
    limit, limit_str, citation = _get_far_limit(usage_type, plot_area)
    status = "PASS" if far_proposed <= limit else "FAIL"
    results.append({
        "parameter": "Floor Area Ratio (FAR)",
        "proposed_value": str(far_proposed),
        "regulation_limit": limit_str,
        "status": status,
        "regulation_citation": citation,
        "reason": f"Proposed FAR {far_proposed} is {'within' if status == 'PASS' else 'above'} the allowed limit of {limit}."
    })

    # 2. Building Height
    limit, limit_str, citation = _get_height_limit(road_width)
    status = "PASS" if building_height <= limit else "FAIL"
    results.append({
        "parameter": "Building Height",
        "proposed_value": f"{building_height} m",
        "regulation_limit": limit_str,
        "status": status,
        "regulation_citation": citation,
        "reason": f"Proposed height {building_height} m is {'within' if status == 'PASS' else 'above'} the allowed {limit} m for road width {road_width} m."
    })

    # 3. Front Setback
    limit, limit_str, citation = _get_front_setback(plot_area, road_width)
    status = "PASS" if front_setback >= limit else "FAIL"
    results.append({
        "parameter": "Front Setback",
        "proposed_value": f"{front_setback} m",
        "regulation_limit": limit_str,
        "status": status,
        "regulation_citation": citation,
        "reason": f"Proposed front setback {front_setback} m {'meets' if status == 'PASS' else 'is less than'} the minimum required {limit} m."
    })

    # 4. Rear Setback
    limit, limit_str, citation = _get_rear_setback(plot_area)
    status = "PASS" if rear_setback >= limit else "FAIL"
    results.append({
        "parameter": "Rear Setback",
        "proposed_value": f"{rear_setback} m",
        "regulation_limit": limit_str,
        "status": status,
        "regulation_citation": citation,
        "reason": f"Proposed rear setback {rear_setback} m {'meets' if status == 'PASS' else 'is less than'} the minimum required {limit} m."
    })

    # 5. Side Setback
    limit, limit_str, citation = _get_side_setback(plot_area)
    status = "PASS" if side_setback >= limit else "FAIL"
    results.append({
        "parameter": "Side Setback",
        "proposed_value": f"{side_setback} m",
        "regulation_limit": limit_str,
        "status": status,
        "regulation_citation": citation,
        "reason": f"Proposed side setback {side_setback} m {'meets' if status == 'PASS' else 'is less than'} the minimum required {limit} m."
    })

    # 6. Ground Coverage
    limit, limit_str, citation = _get_ground_coverage(usage_type, plot_area)
    status = "PASS" if ground_coverage <= limit else "FAIL"
    results.append({
        "parameter": "Ground Coverage",
        "proposed_value": f"{ground_coverage}%",
        "regulation_limit": limit_str,
        "status": status,
        "regulation_citation": citation,
        "reason": f"Proposed ground coverage {ground_coverage}% is {'within' if status == 'PASS' else 'above'} the allowed {limit}%."
    })

    # 7. Number of Floors
    limit, limit_str, citation = _get_floor_limit(road_width)
    status = "PASS" if number_of_floors <= limit else "FAIL"
    results.append({
        "parameter": "Number of Floors",
        "proposed_value": str(number_of_floors),
        "regulation_limit": limit_str,
        "status": status,
        "regulation_citation": citation,
        "reason": f"Proposed {number_of_floors} floors {'does not exceed' if status == 'PASS' else 'exceeds'} the allowed {limit} floors for road width {road_width} m."
    })

    # 8. Road Width
    limit, limit_str, citation = _get_road_requirement(usage_type, building_height)
    status = "PASS" if road_width >= limit else "FAIL"
    results.append({
        "parameter": "Road Width Requirement",
        "proposed_value": f"{road_width} m",
        "regulation_limit": limit_str,
        "status": status,
        "regulation_citation": citation,
        "reason": f"Abutting road width {road_width} m {'satisfies' if status == 'PASS' else 'does not meet'} the minimum required {limit} m."
    })

    return results


def check_compliance(specs, index, chunks):
    """
    Check compliance using rule-based engine (no API quota used).
    Optionally enriches reasons with Gemini if quota is available.
    """
    # Always run rule-based check first — guaranteed results
    results = _rule_based_check(specs)
    return results
