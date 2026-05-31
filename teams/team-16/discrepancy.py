
import spacy

# Load spaCy model
nlp = spacy.load("en_core_web_sm")


def extract_entities(text):

    doc = nlp(text)

    entities = []

    for ent in doc.ents:

        if ent.label_ in [
            "PERSON",
            "GPE",
            "LOC",
            "ORG",
            "DATE",
            "TIME",
            "MONEY"
        ]:

            entities.append(
                (
                    ent.text.strip(),
                    ent.label_
                )
            )

    return entities


def check_discrepancy(
    complaint,
    fir_text
):

    complaint_entities = extract_entities(
        complaint
    )

    fir_entities = extract_entities(
        fir_text
    )

    fir_values = [
        item[0].lower()
        for item in fir_entities
    ]

    missing = []

    for value, label in complaint_entities:

        if value.lower() not in fir_values:

            missing.append(
                f"Missing {label}: {value}"
            )

    if missing:

        return "\n".join(missing)

    return "✅ No major discrepancies found."
