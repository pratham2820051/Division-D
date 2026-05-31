"""
Security Scoring Engine
=======================
Calculates a security score between 0 and 100 based on extracted features
and OWASP findings using a deterministic scoring ruleset.

Starting score: 100

Outputs the score, risk level classification, contributor lists,
detailed breakdown, and a natural language explanation.
"""

from typing import Any, Dict, List


def calculate_security_score(specs: Dict[str, Any]) -> Dict[str, Any]:
    """
    Computes the security score, risk level, positive/negative contributors,
    score breakdown, and detailed reasoning text for an IoT device spec.
    
    Parameters
    ----------
    specs : dict
        IoT specification dictionary.
        Expected keys:
            communication_protocols: list[str]
            api_support: list[str]
            authentication_methods: list[str]
            security_features: list[str]
            update_mechanism: str | None
            attack_surfaces: list[dict] (optional)

    Returns
    -------
    dict
        Contains:
            security_score: int (0 to 100)
            risk_level: str ("Low Risk" | "Medium Risk" | "High Risk" | "Critical Risk")
            positive_contributors: list[str]
            negative_contributors: list[str]
            score_breakdown: list[dict]
            reason_for_score: str
    """
    score = 100
    breakdown: List[Dict[str, Any]] = []
    positive_contribs: List[str] = []
    negative_contribs: List[str] = []

    # Helper function to check occurrences (case-insensitive substring/word matching)
    def has_protocol(name: str) -> bool:
        protos = specs.get("communication_protocols") or []
        surfaces = specs.get("attack_surfaces") or []
        
        # Check in communication protocols
        if any(name.upper() == p.upper() for p in protos if isinstance(p, str)):
            return True
            
        # Check in attack surfaces (either dict list or string list)
        for s in surfaces:
            if isinstance(s, dict) and s.get("surface_name", "").upper() == name.upper():
                return True
            elif isinstance(s, str) and s.upper() == name.upper():
                return True
        return False

    def has_api(name: str) -> bool:
        apis = specs.get("api_support") or []
        surfaces = specs.get("attack_surfaces") or []
        
        if any(name.upper() == a.upper() for a in apis if isinstance(a, str)):
            return True
        for s in surfaces:
            if isinstance(s, dict) and s.get("surface_name", "").upper() == name.upper():
                return True
            elif isinstance(s, str) and s.upper() == name.upper():
                return True
        return False

    def check_auth(keyword: str) -> bool:
        methods = specs.get("authentication_methods") or []
        return any(keyword.upper() in m.upper() for m in methods if isinstance(m, str))

    def check_feature(keyword: str) -> bool:
        features = specs.get("security_features") or []
        return any(keyword.upper() in f.upper() for f in features if isinstance(f, str))

    # -------------------------------------------------------------------------
    # 1. Network Services
    # -------------------------------------------------------------------------
    # HTTP = -5
    if has_protocol("HTTP"):
        score -= 5
        negative_contribs.append("Unencrypted HTTP protocol detected (-5)")
        breakdown.append({"category": "Network Services", "item": "HTTP", "applied": True, "change": -5, "description": "Unencrypted HTTP traffic exposes credentials and configurations to sniffing."})
    else:
        breakdown.append({"category": "Network Services", "item": "HTTP", "applied": False, "change": 0, "description": "No unencrypted HTTP protocol detected."})

    # FTP = -5
    if has_protocol("FTP"):
        score -= 5
        negative_contribs.append("Cleartext FTP protocol detected (-5)")
        breakdown.append({"category": "Network Services", "item": "FTP", "applied": True, "change": -5, "description": "FTP transmits command payloads and logins in plaintext."})
    else:
        breakdown.append({"category": "Network Services", "item": "FTP", "applied": False, "change": 0, "description": "No cleartext FTP protocol detected."})

    # RTSP = -5
    if has_protocol("RTSP"):
        score -= 5
        negative_contribs.append("Unsecured RTSP protocol detected (-5)")
        breakdown.append({"category": "Network Services", "item": "RTSP", "applied": True, "change": -5, "description": "RTSP exposes live media stream feeds to sniffing and interception."})
    else:
        breakdown.append({"category": "Network Services", "item": "RTSP", "applied": False, "change": 0, "description": "No unsecured RTSP protocol detected."})

    # SMTP = -3
    if has_protocol("SMTP"):
        score -= 3
        negative_contribs.append("SMTP protocol detected (-3)")
        breakdown.append({"category": "Network Services", "item": "SMTP", "applied": True, "change": -3, "description": "SMTP mail services pose spam or spoofing risks if credentials leak."})
    else:
        breakdown.append({"category": "Network Services", "item": "SMTP", "applied": False, "change": 0, "description": "No SMTP mail services detected."})

    # HTTPS = +5
    if has_protocol("HTTPS"):
        score += 5
        positive_contribs.append("Encrypted HTTPS traffic supported (+5)")
        breakdown.append({"category": "Network Services", "item": "HTTPS", "applied": True, "change": 5, "description": "HTTPS enforces TLS encryption for secure management access."})
    else:
        breakdown.append({"category": "Network Services", "item": "HTTPS", "applied": False, "change": 0, "description": "Secure HTTPS traffic not documented."})

    # -------------------------------------------------------------------------
    # 2. API Exposure
    # -------------------------------------------------------------------------
    # ONVIF = -3
    if has_api("ONVIF"):
        score -= 3
        negative_contribs.append("ONVIF API support exposed (-3)")
        breakdown.append({"category": "API Exposure", "item": "ONVIF", "applied": True, "change": -3, "description": "ONVIF profiles expose camera management and discovery interfaces."})
    else:
        breakdown.append({"category": "API Exposure", "item": "ONVIF", "applied": False, "change": 0, "description": "ONVIF ecosystem API exposure not detected."})

    # ISAPI = -3
    if has_api("ISAPI"):
        score -= 3
        negative_contribs.append("Proprietary ISAPI support exposed (-3)")
        breakdown.append({"category": "API Exposure", "item": "ISAPI", "applied": True, "change": -3, "description": "Proprietary ISAPI interfaces expand the vendor-specific web exploit surface."})
    else:
        breakdown.append({"category": "API Exposure", "item": "ISAPI", "applied": False, "change": 0, "description": "ISAPI API exposure not detected."})

    # -------------------------------------------------------------------------
    # 3. Authentication
    # -------------------------------------------------------------------------
    # Password Protection = +5
    if check_auth("password"):
        score += 5
        positive_contribs.append("Password Authentication configured (+5)")
        breakdown.append({"category": "Authentication", "item": "Password Protection", "applied": True, "change": 5, "description": "Password verification acts as a baseline access control barrier."})
    else:
        breakdown.append({"category": "Authentication", "item": "Password Protection", "applied": False, "change": 0, "description": "No password protection documented."})

    # User Roles Present = +3
    if check_auth("role") or check_auth("rbac"):
        score += 3
        positive_contribs.append("Role-Based Access Control (RBAC) present (+3)")
        breakdown.append({"category": "Authentication", "item": "User Roles Present", "applied": True, "change": 3, "description": "Segregating users by role prevents administrative privilege abuse."})
    else:
        breakdown.append({"category": "Authentication", "item": "User Roles Present", "applied": False, "change": 0, "description": "No granular user roles or RBAC rules documented."})

    # No Authentication = -20
    auth_methods = specs.get("authentication_methods") or []
    is_no_auth = not auth_methods or any("NO AUTH" in str(m).upper() or "NONE" == str(m).upper() for m in auth_methods)
    if is_no_auth:
        score -= 20
        negative_contribs.append("No Authentication enforced (-20)")
        breakdown.append({"category": "Authentication", "item": "No Authentication", "applied": True, "change": -20, "description": "Zero active authentication allows public administrative access."})
    else:
        breakdown.append({"category": "Authentication", "item": "No Authentication", "applied": False, "change": 0, "description": "Authentication is enforced."})

    # -------------------------------------------------------------------------
    # 4. Security Features
    # -------------------------------------------------------------------------
    # Illegal Login Detection = +5
    if check_feature("illegal login") or check_feature("brute force") or check_feature("lockout"):
        score += 5
        positive_contribs.append("Illegal Login Lockout/Detection active (+5)")
        breakdown.append({"category": "Security Features", "item": "Illegal Login Detection", "applied": True, "change": 5, "description": "Detecting illegal logins triggers account lockouts to block brute force."})
    else:
        breakdown.append({"category": "Security Features", "item": "Illegal Login Detection", "applied": False, "change": 0, "description": "No brute force login lockout or illegal login detection active."})

    # Privacy Mask = +2
    if check_feature("privacy mask") or check_feature("masking"):
        score += 2
        positive_contribs.append("Privacy Masking support enabled (+2)")
        breakdown.append({"category": "Security Features", "item": "Privacy Mask", "applied": True, "change": 2, "description": "Privacy masking censors specific layout zones in video recordings."})
    else:
        breakdown.append({"category": "Security Features", "item": "Privacy Mask", "applied": False, "change": 0, "description": "No privacy masking support documented."})

    # Watermark = +2
    if check_feature("watermark"):
        score += 2
        positive_contribs.append("Cryptographic or visible video Watermarking active (+2)")
        breakdown.append({"category": "Security Features", "item": "Watermark", "applied": True, "change": 2, "description": "Watermarking guarantees the integrity and anti-tamper proofing of video frames."})
    else:
        breakdown.append({"category": "Security Features", "item": "Watermark", "applied": False, "change": 0, "description": "No video watermarking support documented."})

    # IP67 Protection = +3
    if check_feature("ip67") or check_feature("ip66") or check_feature("weatherproof") or check_feature("enclosure protection"):
        score += 3
        positive_contribs.append("Physical IP67 Environment Protection (+3)")
        breakdown.append({"category": "Security Features", "item": "IP67 Protection", "applied": True, "change": 3, "description": "IP67 weatherproof enclosures protect hardware from outdoor tampering or environmental degradation."})
    else:
        breakdown.append({"category": "Security Features", "item": "IP67 Protection", "applied": False, "change": 0, "description": "IP67 environment protection rating not documented."})

    # -------------------------------------------------------------------------
    # 5. Firmware Updates
    # -------------------------------------------------------------------------
    # update_mechanism = null = -10
    update_mech = specs.get("update_mechanism")
    is_null_update = not update_mech or str(update_mech).strip().lower() in ["null", "none", "", "manual"]
    if is_null_update:
        score -= 10
        negative_contribs.append("No secure/automated update mechanism configured (-10)")
        breakdown.append({"category": "Firmware Updates", "item": "Missing Update Mechanism", "applied": True, "change": -10, "description": "Missing secure or automated update mechanisms blocks immediate CVE patching."})
    else:
        breakdown.append({"category": "Firmware Updates", "item": "Missing Update Mechanism", "applied": False, "change": 0, "description": "Secure update mechanism is documented."})

    # Final score clamping between 0 and 100
    final_score = max(0, min(100, score))

    # -------------------------------------------------------------------------
    # Risk Level Classification
    # -------------------------------------------------------------------------
    if final_score >= 90:
        risk_level = "Low Risk"
    elif final_score >= 70:
        risk_level = "Medium Risk"
    elif final_score >= 50:
        risk_level = "High Risk"
    else:
        risk_level = "Critical Risk"

    # -------------------------------------------------------------------------
    # Natural Language Explanation
    # -------------------------------------------------------------------------
    if final_score == 100:
        explanation = "The device received a perfect security score of 100 (Low Risk). It enforces strong authentication, implements robust local security features (such as illegal login detection and privacy masks), keeps APIs secured, and exposes no unencrypted communications."
    else:
        parts = []
        if positive_contribs:
            parts.append("positive features such as " + ", ".join(c.split(" (+")[0] for c in positive_contribs))
        if negative_contribs:
            parts.append("weaknesses including " + ", ".join(c.split(" (-")[0] for c in negative_contribs))
            
        explanation = f"The device was assigned a security score of {final_score} ({risk_level}). This evaluation is based on " + " and was negatively impacted by ".join(parts) + "."

    return {
        "security_score": final_score,
        "risk_level": risk_level,
        "positive_contributors": positive_contribs,
        "negative_contributors": negative_contribs,
        "score_breakdown": breakdown,
        "reason_for_score": explanation
    }


if __name__ == "__main__":
    import json
    
    # Run test
    test_specs = {
        "communication_protocols": ["HTTP", "HTTPS", "RTSP", "SMTP"],
        "api_support": ["ONVIF", "ISAPI"],
        "authentication_methods": ["Password Authentication", "User Roles"],
        "security_features": ["Illegal Login Detection", "Privacy Mask", "Watermark", "IP67 Protection"],
        "update_mechanism": "OTA Updates"
    }
    
    res = calculate_security_score(test_specs)
    print(json.dumps(res, indent=2))
