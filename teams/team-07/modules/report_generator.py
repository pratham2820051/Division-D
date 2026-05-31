def generate_report(
    route,
    cause,
    duration,
    severity
):

    report = f"""
OFFICIAL BMTC INCIDENT REPORT

Route:
{route}

Cause:
{cause}

Delay Duration:
{duration}

Severity:
{severity}

Recommended Action:
Passenger advisory issued.
Alternative transport suggested.

Status:
Under Monitoring.
"""

    return report