"""
Severity Classification Module

Classifies temperature excursions based on
maximum recorded temperature.
"""


def classify_severity(max_temp):
    """
    Classify excursion severity.

    Parameters:
        max_temp (float): Maximum temperature recorded
                          during excursion.

    Returns:
        str: Severity level
    """

    if max_temp <= 6:
        return "Safe"

    elif max_temp <= 8:
        return "Low"

    elif max_temp <= 10:
        return "Medium"

    elif max_temp <= 12:
        return "High"

    else:
        return "Critical"
    
    print("severity_classifier.py loaded")