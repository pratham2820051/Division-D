def generate_insurance_claim(excursion):

    claim = f"""
INSURANCE CLAIM REQUEST
=======================

Bag ID: {excursion['bag_id']}

Temperature Excursion Details
-----------------------------

Start Time: {excursion['start_time']}
End Time: {excursion['end_time']}

Duration: {excursion['duration_minutes']} minutes

Maximum Temperature:
{excursion['max_temperature']} °C

Severity:
{excursion['severity']}

Claim Status:
Pending Assessment

Reason For Claim:
Cold-chain temperature breach detected
during transportation.

Potential product quality loss may
have occurred.

Recommended Action:
Investigate shipment and assess product loss.

We request compensation as per policy.

Regards,
Cold Chain Monitoring Team
"""

    return claim