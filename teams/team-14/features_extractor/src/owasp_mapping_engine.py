"""
OWASP IoT Mapping Engine
========================
Maps identified attack surfaces and extracted IoT device features to OWASP IoT Top 10 categories:

  I1 - Weak, Guessable, or Hardcoded Passwords
  I2 - Insecure Network Services
  I3 - Insecure Ecosystem Interfaces
  I4 - Lack of Secure Update Mechanism
  I5 - Use of Insecure or Outdated Components
  I6 - Insufficient Privacy Protection
  I7 - Insecure Data Transfer and Storage
  I8 - Lack of Device Management
  I9 - Insecure Default Settings
  I10 - Lack of Physical Hardening

Each mapping generates a structured finding:
{
    "owasp_category": str,
    "severity": str,        # "Critical" | "High" | "Medium" | "Low"
    "evidence": str,
    "reason": str,
    "affected_surfaces": list[str]
}
"""

from typing import Any, Dict, List, Optional


OWASP_CATEGORIES = {
    "I1": "I1 - Weak, Guessable, or Hardcoded Passwords",
    "I2": "I2 - Insecure Network Services",
    "I3": "I3 - Insecure Ecosystem Interfaces",
    "I4": "I4 - Lack of Secure Update Mechanism",
    "I5": "I5 - Use of Insecure or Outdated Components",
    "I6": "I6 - Insufficient Privacy Protection",
    "I7": "I7 - Insecure Data Transfer and Storage",
    "I8": "I8 - Lack of Device Management",
    "I9": "I9 - Insecure Default Settings",
    "I10": "I10 - Lack of Physical Hardening"
}


def analyze_owasp_mappings(specs: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Analyzes specs (containing attack_surfaces, authentication_methods,
    security_features, update_mechanism, etc.) and maps them to OWASP IoT Top 10 categories.
    """
    findings: List[Dict[str, Any]] = []

    # Get features from input specs
    attack_surfaces = specs.get("attack_surfaces") or []
    # If attack_surfaces contains dicts or strings, normalize to dicts or search appropriately
    surface_names = []
    for s in attack_surfaces:
        if isinstance(s, dict):
            surface_names.append(s.get("surface_name", ""))
        elif isinstance(s, str):
            surface_names.append(s)

    # Convert to uppercase for easy comparison
    surface_names_upper = [s.upper() for s in surface_names if s]

    auth_methods = specs.get("authentication_methods") or []
    security_features = specs.get("security_features") or []
    update_mechanism = specs.get("update_mechanism")
    physical_interfaces = specs.get("physical_interfaces") or []
    communication_protocols = specs.get("communication_protocols") or []
    api_support = specs.get("api_support") or []

    # Normalize list features to uppercase
    auth_methods_upper = [a.upper() for a in auth_methods if isinstance(a, str)]
    security_features_upper = [f.upper() for f in security_features if isinstance(f, str)]
    physical_interfaces_upper = [p.upper() for p in physical_interfaces if isinstance(p, str)]
    communication_protocols_upper = [c.upper() for c in communication_protocols if isinstance(c, str)]
    api_support_upper = [a.upper() for a in api_support if isinstance(a, str)]

    # -------------------------------------------------------------------------
    # I1 - Weak, Guessable, or Hardcoded Passwords
    # Trigger: "No authentication methods" (empty/none/no auth methods)
    # -------------------------------------------------------------------------
    is_missing_auth = (
        not auth_methods or
        any("NO AUTH" in a or "NONE" == a for a in auth_methods_upper)
    )
    if is_missing_auth:
        findings.append({
            "owasp_category": OWASP_CATEGORIES["I1"],
            "severity": "Critical",
            "evidence": "No authentication methods documented in the device configuration.",
            "reason": "The device does not enforce authentication on interfaces, allowing unauthorized access with default or absent credentials.",
            "affected_surfaces": [s for s in ["Web Login", "Console Port", "REST API"] if s.upper() in surface_names_upper] or ["Default Access"]
        })

    # -------------------------------------------------------------------------
    # I2 - Insecure Network Services
    # Trigger: HTTP, FTP, RTSP
    # -------------------------------------------------------------------------
    i2_services = []
    if "HTTP" in communication_protocols_upper or "HTTP" in surface_names_upper:
        i2_services.append("HTTP")
    if "FTP" in communication_protocols_upper or "FTP" in surface_names_upper:
        i2_services.append("FTP")
    if "RTSP" in communication_protocols_upper or "RTSP" in surface_names_upper:
        i2_services.append("RTSP")

    if i2_services:
        # Determine severity based on protocol risk levels
        severity = "Medium"
        if "FTP" in i2_services:
            severity = "Critical"
        elif "RTSP" in i2_services or "HTTP" in i2_services:
            severity = "High"

        # Evidence text formatting
        if len(i2_services) == 1:
            evidence_text = f"{i2_services[0]} protocol detected"
        elif len(i2_services) == 2:
            evidence_text = f"{i2_services[0]} and {i2_services[1]} protocols detected"
        else:
            evidence_text = f"{', '.join(i2_services[:-1])} and {i2_services[-1]} protocols detected"

        findings.append({
            "owasp_category": OWASP_CATEGORIES["I2"],
            "severity": severity,
            "evidence": evidence_text,
            "reason": "Multiple remotely accessible network services increase the attack surface.",
            "affected_surfaces": i2_services
        })

    # -------------------------------------------------------------------------
    # I3 - Insecure Ecosystem Interfaces
    # Trigger: ONVIF, ISAPI
    # -------------------------------------------------------------------------
    i3_interfaces = []
    # Check both api_support and surface names
    for name in ["ONVIF", "ISAPI"]:
        if any(name in api for api in api_support_upper) or name in surface_names_upper:
            i3_interfaces.append(name)

    if i3_interfaces:
        severity = "High"
        if "ISAPI" in i3_interfaces:
            severity = "Critical"

        evidence_text = " and ".join(i3_interfaces) + " ecosystem interface" + ("s" if len(i3_interfaces) > 1 else "") + " detected"

        findings.append({
            "owasp_category": OWASP_CATEGORIES["I3"],
            "severity": severity,
            "evidence": evidence_text,
            "reason": "Insecure or poorly configured APIs and ecosystem interfaces can expose management functions to external compromise.",
            "affected_surfaces": i3_interfaces
        })

    # -------------------------------------------------------------------------
    # I4 - Lack of Secure Update Mechanism
    # Trigger: update_mechanism = null (None, empty, or "none"/"manual")
    # -------------------------------------------------------------------------
    is_missing_update = (
        not update_mechanism or
        str(update_mechanism).strip().lower() in ["null", "none", "", "manual"]
    )
    if is_missing_update:
        findings.append({
            "owasp_category": OWASP_CATEGORIES["I4"],
            "severity": "High",
            "evidence": "update_mechanism is null or manual only",
            "reason": "Lack of secure or automated update mechanisms prevents timely patching of discovered vulnerabilities, leaving the device exposed indefinitely.",
            "affected_surfaces": ["Firmware Update"]
        })

    # -------------------------------------------------------------------------
    # I8 - Lack of Device Management
    # Trigger: "No logging or monitoring"
    # -------------------------------------------------------------------------
    has_logging = any(
        any(kwd in f for kwd in ["LOG", "MONITOR", "SYSLOG", "AUDIT"])
        for f in security_features_upper
    )
    if not has_logging:
        findings.append({
            "owasp_category": OWASP_CATEGORIES["I8"],
            "severity": "Medium",
            "evidence": "No logging or monitoring features detected in security features config.",
            "reason": "Without active logging or system monitoring, security incidents, unauthorized access attempts, and anomalous behaviors cannot be detected, investigated, or audited.",
            "affected_surfaces": []
        })

    # -------------------------------------------------------------------------
    # I10 - Lack of Physical Hardening
    # Trigger: "Missing physical protection" (Exposed physical ports like UART,
    # JTAG, Console Port, Serial Port, SD Card without hardening features)
    # -------------------------------------------------------------------------
    exposed_physical = [
        p for p in ["UART", "JTAG", "CONSOLE PORT", "SERIAL PORT", "USB", "SD CARD SLOT"]
        if p in physical_interfaces_upper or p in surface_names_upper
    ]
    has_physical_hardening = any(
        any(kwd in f for kwd in ["TAMPER", "HARDEN", "LOCK", "SHIELD", "ENCLOSURE"])
        for f in security_features_upper
    )

    if exposed_physical and not has_physical_hardening:
        findings.append({
            "owasp_category": OWASP_CATEGORIES["I10"],
            "severity": "High",
            "evidence": f"Exposed physical interface(s): {', '.join(exposed_physical)} without documented physical protection/hardening.",
            "reason": "Exposed debugging and serial communication interfaces allow attackers with physical access to dump device memory, extract keys, or access privileged shells.",
            "affected_surfaces": [p.title() for p in exposed_physical]
        })

    return findings


if __name__ == "__main__":
    import json

    # Example test input
    sample_input = {
        "attack_surfaces": [
            {"surface_name": "HTTP"},
            {"surface_name": "FTP"},
            {"surface_name": "RTSP"},
            {"surface_name": "ONVIF"},
            {"surface_name": "ISAPI"},
            {"surface_name": "Console Port"},
            {"surface_name": "UART"}
        ],
        "authentication_methods": [],
        "security_features": ["IP Address Filtering"], # No logging or physical hardening mentioned
        "update_mechanism": None,
        "communication_protocols": ["HTTP", "FTP", "RTSP"],
        "api_support": ["ONVIF", "ISAPI"],
        "physical_interfaces": ["Console Port", "UART"]
    }

    result = analyze_owasp_mappings(sample_input)
    print(json.dumps(result, indent=2))
