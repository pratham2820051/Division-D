def generate_fda_report(excursion):

    report = f"""
FDA / WHO Cold Chain Breach Report
=================================

Bag ID: {excursion['bag_id']}

Start Time: {excursion['start_time']}
End Time: {excursion['end_time']}

Duration (minutes): {excursion['duration_minutes']}

Maximum Temperature: {excursion['max_temperature']} °C

Severity Level: {excursion['severity']}

Observation:
Temperature exceeded the safe cold-chain threshold.

Impact:
Product quality may be compromised.

Recommended Action:
Inspect shipment before distribution.

Status:
Breach Report Generated Successfully.
"""

    return report