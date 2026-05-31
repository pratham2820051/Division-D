def process_delay(duration):

    if duration == "Never":
        return "Critical"

    duration = int(duration)

    if duration < 10:
        severity = "Minor"

    elif duration < 30:
        severity = "Moderate"

    else:
        severity = "Critical"

    return severity