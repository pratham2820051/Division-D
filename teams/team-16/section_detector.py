import json
import re

def load_ipc_data():
    with open("data/ipc.json", "r", encoding="utf-8") as file:
        return json.load(file)

def detect_sections(text):

    patterns = [
        r"IPC\s*Section\s*(\d+)",
        r"Section\s*(\d+)"
    ]

    sections = []

    for pattern in patterns:
        matches = re.findall(
            pattern,
            text,
            flags=re.IGNORECASE
        )

        sections.extend(matches)

    return list(set(sections))

def get_section_details(section_number):

    ipc_data = load_ipc_data()

    for section in ipc_data:

        if str(section["Section"]) == str(section_number):

            return {
                "title": section["section_title"],
                "description": section["section_desc"]
            }

    return None