"""Farmer language, ASR typo, and disease alias dictionaries."""

from __future__ import annotations

# Farmer colloquial phrases -> canonical symptom labels (knowledge-base aligned)
FARMER_PHRASE_TO_SYMPTOM: dict[str, str] = {
    "mouth water coming": "excessive salivation and drooling",
    "mouth watering": "drooling",
    "saliva coming": "drooling",
    "water from mouth": "drooling",
    "not eating": "reduced appetite",
    "not eating food": "reduced appetite",
    "won't eat": "reduced appetite",
    "wont eat": "reduced appetite",
    "off feed": "reduced appetite",
    "no appetite": "reduced appetite",
    "skin bumps": "firm skin nodules on neck and body",
    "skin bump": "firm skin nodules on neck and body",
    "lumps on body": "firm skin nodules on neck and body",
    "lumpy body": "firm skin nodules on neck and body",
    "milk reduced": "reduced milk yield",
    "less milk": "reduced milk yield",
    "low milk": "reduced milk yield",
    "milk less": "reduced milk yield",
    "walking problem": "lameness and reluctance to walk",
    "cannot walk": "lameness and reluctance to walk",
    "can't walk": "lameness and reluctance to walk",
    "leg problem": "lameness and reluctance to walk",
    "breathing problem": "difficulty breathing",
    "breathing hard": "difficulty breathing",
    "high temperature": "fever",
    "very hot": "high fever",
    "swollen udder": "swollen painful udder quarter",
    "udder pain": "swollen painful udder quarter",
    "blood from nose": "bloody discharge from natural openings",
    "bloody nose": "bloody discharge from natural openings",
    "found dead": "sudden death without warning",
    "died suddenly": "sudden death without warning",
    "animal weak": "weakness and lethargy",
    "looks weak": "weakness and lethargy",
    "very weak": "weakness and lethargy",
    "weak animal": "weakness and lethargy",
    "not standing": "unable to stand",
    "cannot stand": "unable to stand",
    "can't stand": "unable to stand",
    "swollen neck": "swelling of neck brisket or flanks",
    "neck swelling": "swelling of neck brisket or flanks",
    "swelling on neck": "swelling of neck brisket or flanks",
}

# Romanized Indic animal terms -> English animal keyword (for rule matching)
ROMANIZED_ANIMAL_TO_ENGLISH: dict[str, str] = {
    # Kannada (romanized)
    "hasu": "cow",
    "hasuvu": "cow",
    "hasuvige": "cow",
    "hasuvina": "cow",
    "hasugige": "cow",
    "nanna hasu": "cow",
    "nanna hasuvige": "cow",
    "emme": "buffalo",
    "emmegige": "buffalo",
    "emmena": "buffalo",
    "meke": "goat",
    "mekege": "goat",
    "mekey": "goat",
    "mekke": "goat",
    "nanna meke": "goat",
    "nanna mekege": "goat",
    "kurige": "sheep",
    "kurina": "sheep",
    "kuri": "sheep",
    # Hindi (romanized)
    "gai": "cow",
    "gaay": "cow",
    "gay": "cow",
    "meri gai": "cow",
    "gai ko": "cow",
    "bhains": "buffalo",
    "bhainsa": "buffalo",
    "bhains ko": "buffalo",
    "bakri": "goat",
    "bakri ko": "goat",
    "meri bakri": "goat",
}

# Kannada / Hindi script -> English animal keyword (longest phrases first in preprocessor)
NATIVE_SCRIPT_ANIMAL_TO_ENGLISH: dict[str, str] = {
    # Kannada cattle
    "ಹಸುವಿಗೆ": "cow",
    "ಹಸುವಿನ": "cow",
    "ಹಸುವು": "cow",
    "ಹಸು": "cow",
    # Kannada buffalo
    "ಎಮ್ಮೆಗೆ": "buffalo",
    "ಎಮ್ಮೆಯ": "buffalo",
    "ಎಮ್ಮೆ": "buffalo",
    # Kannada goat
    "ಮೇಕೆಗೆ": "goat",
    "ಮೇಕೆಯ": "goat",
    "ಮೇಕೆ": "goat",
    # Kannada sheep
    "ಕುರಿಗೆ": "sheep",
    "ಕುರಿಯ": "sheep",
    "ಕುರಿ": "sheep",
    # Hindi cattle
    "गाय को": "cow",
    "गाय की": "cow",
    "गाय": "cow",
    # Hindi buffalo
    "भैंस को": "buffalo",
    "भैंस की": "buffalo",
    "भैंस": "buffalo",
    # Hindi goat
    "बकरी को": "goat",
    "बकरी की": "goat",
    "बकरी": "goat",
    # Hindi sheep
    "भेड़ को": "sheep",
    "भेड़ की": "sheep",
    "भेड़": "sheep",
}

# Romanized symptom hints
ROMANIZED_SYMPTOM_TO_ENGLISH: dict[str, str] = {
    "jwara": "fever",
    "jvara": "fever",
    "jwara bandide": "fever",
    "bukhar": "fever",
    "bukhhar": "fever",
    "bukhar hai": "fever",
    "taap": "fever",
    "tapa": "fever",
}

# Kannada / Hindi script symptom hints
NATIVE_SCRIPT_SYMPTOM_TO_ENGLISH: dict[str, str] = {
    "ಜ್ವರ": "fever",
    "ज्वर": "fever",
    "बुखार": "fever",
    "ताप": "fever",
    "ज्वर है": "fever",
}

# Intake questions that must not repeat when animal is already known
ANIMAL_INTAKE_QUESTION_MARKERS: tuple[str, ...] = (
    "which animal is affected",
    "what animal is affected",
    "ಯಾವ ಪ್ರಾಣಿ",
    "कौन सा जानवर",
)

# ASR / speech-to-text animal misrecognitions
ASR_ANIMAL_CORRECTIONS: dict[str, str] = {
    "gold": "goat",
    "got": "goat",
    "goat's": "goat",
    "code": "goat",
    "coat": "goat",
    "calfs": "calf",
    "calves": "calf",
    "buffalow": "buffalo",
    "chicken's": "chicken",
}

# Common misspellings and ASR disease typos -> canonical disease token
DISEASE_TYPO_CORRECTIONS: dict[str, str] = {
    "antax": "anthrax",
    "antrax": "anthrax",
    "anthraks": "anthrax",
    "anthraxs": "anthrax",
    "mastitus": "mastitis",
    "mastaitis": "mastitis",
    "mastites": "mastitis",
    "mastitits": "mastitis",
    "lumpy skin": "lumpy skin disease",
    "lumpy disease": "lumpy skin disease",
    "lumpy": "lumpy skin disease",
    "lsd": "lumpy skin disease",
    "fmd": "foot and mouth disease",
    "foot mouth disease": "foot and mouth disease",
    "foot and mouth": "foot and mouth disease",
    "foot-mouth": "foot and mouth disease",
}

# Transliterated / romanized disease names (common farmer speech)
TRANSLITERATED_DISEASE_ALIASES: dict[str, str] = {
    "anthraks": "anthrax",
    "anthrakku": "anthrax",
    "mastitis": "mastitis",
    "mastit": "mastitis",
    "lumpy chami": "lumpy skin disease",
    "goli roga": "lumpy skin disease",
}
