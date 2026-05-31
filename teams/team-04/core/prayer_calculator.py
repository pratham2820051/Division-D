# Compensation and Prayer Calculator
from datetime import datetime

def calculate_compensation(
    transaction_amount: float,
    grievance_date_str: str,
    interest_rate_pct: float = 12.0,
    severity: str = "Moderate",
    custom_litigation_cost: float = 10000.0,
    custom_mental_agony: float = None
) -> dict:
    """
    Calculates the breakdown of compensation for the prayer clause.
    """
    try:
        transaction_amount = float(transaction_amount)
    except ValueError:
        transaction_amount = 0.0

    # Parse grievance date
    try:
        grievance_date = datetime.strptime(grievance_date_str, "%Y-%m-%d")
    except Exception:
        grievance_date = datetime.now()

    # Calculate duration and interest
    today = datetime.now()
    days_elapsed = (today - grievance_date).days
    if days_elapsed < 0:
        days_elapsed = 0

    years_elapsed = days_elapsed / 365.25
    interest_amount = transaction_amount * (interest_rate_pct / 100.0) * years_elapsed
    interest_amount = round(interest_amount, 2)

    # Determine mental agony compensation based on severity if not customized
    if custom_mental_agony is not None:
        mental_agony_amount = float(custom_mental_agony)
    else:
        if severity == "Mild":
            mental_agony_amount = 10000.0
        elif severity == "Moderate":
            mental_agony_amount = 25000.0
        elif severity == "Severe":
            # Scale severe compensation slightly with the transaction amount if it's huge,
            # but keep it within reasonable standards (max of 1,00,000 or 15% of value)
            base = 50000.0
            scale = min(50000.0, transaction_amount * 0.10)
            mental_agony_amount = base + scale
        else:
            mental_agony_amount = 25000.0

    litigation_cost = float(custom_litigation_cost)
    total_claim = transaction_amount + interest_amount + mental_agony_amount + litigation_cost

    # Determine Pecuniary Jurisdiction
    if total_claim <= 5000000:
        pecuniary_forum = "District Consumer Disputes Redressal Commission"
        pecuniary_clause = "The value of the goods or services paid as consideration and the compensation claimed does not exceed fifty lakh rupees (₹50,00,000), hence this Hon'ble District Commission has the pecuniary jurisdiction under Section 34(1) of the Act."
    elif total_claim <= 20000000:
        pecuniary_forum = "State Consumer Disputes Redressal Commission"
        pecuniary_clause = "The value of the goods or services paid as consideration and the compensation claimed exceeds fifty lakh rupees but does not exceed two crore rupees (₹2,00,00,000), hence the Hon'ble State Commission has the pecuniary jurisdiction under Section 47(1)(a)(i) of the Act."
    else:
        pecuniary_forum = "National Consumer Disputes Redressal Commission"
        pecuniary_clause = "The value of the goods or services paid as consideration and the compensation claimed exceeds two crore rupees (₹2,00,00,000), hence the Hon'ble National Commission has the pecuniary jurisdiction under Section 58(1)(a)(i) of the Act."

    return {
        "transaction_amount": transaction_amount,
        "days_elapsed": days_elapsed,
        "years_elapsed": round(years_elapsed, 3),
        "interest_rate_pct": interest_rate_pct,
        "interest_amount": interest_amount,
        "mental_agony_amount": mental_agony_amount,
        "litigation_cost": litigation_cost,
        "total_claim": round(total_claim, 2),
        "pecuniary_forum": pecuniary_forum,
        "pecuniary_clause": pecuniary_clause
    }

def generate_prayer_text(calc_results: dict, currency_symbol: str = "₹") -> str:
    """
    Generates the formal legal text for the Prayer Clause of a consumer petition.
    """
    ta = calc_results["transaction_amount"]
    ia = calc_results["interest_amount"]
    rate = calc_results["interest_rate_pct"]
    ma = calc_results["mental_agony_amount"]
    lc = calc_results["litigation_cost"]
    tc = calc_results["total_claim"]

    prayer_text = (
        "In the light of the facts and circumstances mentioned hereinabove, the Complainant most respectfully prays "
        "that this Hon'ble Commission may be pleased to:\n\n"
        f"1. Direct the Respondent to refund the principal amount of {currency_symbol}{ta:,.2f} paid by the Complainant "
        f"along with pendent-lite and future interest @ {rate}% per annum from the date of payment till its actual realization;\n"
        f"2. Direct the Respondent to pay a sum of {currency_symbol}{ma:,.2f} as compensation for the severe mental agony, "
        f"harassment, and emotional distress caused to the Complainant due to the Respondent's gross deficiency in service "
        f"and unfair trade practices;\n"
        f"3. Direct the Respondent to pay a sum of {currency_symbol}{lc:,.2f} towards the cost of litigation and other legal expenses incurred by the Complainant;\n"
        "4. Pass any other or further order(s) as this Hon'ble Commission may deem fit and proper in the interest of justice and equity."
    )
    return prayer_text
