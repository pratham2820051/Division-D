import re

def simplify_fir(text):

    summary = []

    # Theft detection
    if "stolen" in text.lower() or "theft" in text.lower():
        summary.append(
            "A theft-related complaint has been reported."
        )

    # Vehicle detection
    if (
        "motorcycle" in text.lower()
        or "vehicle" in text.lower()
        or "bike" in text.lower()
    ):
        summary.append(
            "The complainant reported that a vehicle is missing."
        )

    # IPC Section detection
    sections = re.findall(
        r"IPC\s*Section\s*(\d+)",
        text,
        flags=re.IGNORECASE
    )

    if sections:
        summary.append(
            f"Police have registered the case under IPC Section {', '.join(sections)}."
        )

    # Investigation
    if "investigation" in text.lower():
        summary.append(
            "Police investigation is currently in progress."
        )

    if not summary:
        summary.append(
            "The FIR has been processed successfully."
        )

    return "\n".join(summary)


def explain_case(text, sections):

    explanation = []

    if "379" in sections:

        explanation.append(
            "This case involves an alleged theft of property."
        )

        explanation.append(
            "The complainant reported that a motorcycle was stolen from a public location."
        )

        explanation.append(
            "Police have registered a theft case under IPC Section 379."
        )

        explanation.append(
            "If the accused is found guilty, punishment may include imprisonment, a fine, or both."
        )

        explanation.append(
            "The investigation is being carried out to identify the offender and recover the stolen vehicle."
        )

    else:

        explanation.append(
            "The FIR has been analyzed successfully."
        )

    return "\n".join(explanation)