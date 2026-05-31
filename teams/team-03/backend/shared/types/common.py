from enum import Enum


class Severity(str, Enum):
    SELF_TREATABLE = "self_treatable"
    URGENT = "urgent"
    CRITICAL = "critical"


class LanguageCode(str, Enum):
    EN = "en"
    HI = "hi"
    MR = "mr"
    KN = "kn"
    TA = "ta"
    TE = "te"
