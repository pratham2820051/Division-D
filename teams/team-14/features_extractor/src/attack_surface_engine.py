"""
Attack Surface Engine
=====================
Analyzes extracted IoT device JSON (from the Feature Extractor) and identifies
all possible attack surfaces across 5 categories:

  1. Network Surface
  2. API Surface
  3. Physical Surface
  4. Wireless Surface
  5. Authentication Surface

Each identified surface is returned as a structured dict ready for
dashboard visualization and report generation.

Output format per surface entry:
{
    "surface_name": str,
    "surface_category": str,
    "evidence": str,
    "description": str,
    "risk_level": str   # "Critical" | "High" | "Medium" | "Low"
}
"""

from __future__ import annotations

import re
from typing import Any


# ─── Risk Level Priority (for sorting) ───────────────────────────────────────

RISK_ORDER: dict[str, int] = {
    "Critical": 0,
    "High":     1,
    "Medium":   2,
    "Low":      3,
}


# ─── Attack Surface Rule Database ────────────────────────────────────────────
#
# Each rule defines:
#   keywords        – list of lowercase tokens; ANY match triggers the rule.
#   exclude_keywords– optional list; if ANY appear alongside a keyword, skip.
#   name            – human-readable surface name (used in output).
#   category        – one of the 5 surface categories.
#   source_fields   – which JSON fields of the IoT spec to inspect.
#   description     – security risk description for the dashboard.
#   risk_level      – "Critical" | "High" | "Medium" | "Low"
#
# ─────────────────────────────────────────────────────────────────────────────

SURFACE_RULES: list[dict] = [

    # ══════════════════════════════════════════════════════════════════════════
    # 1. NETWORK SURFACE
    # ══════════════════════════════════════════════════════════════════════════

    {
        "keywords": ["http"],
        "exclude_keywords": ["https"],
        "name": "HTTP",
        "category": "Network Surface",
        "source_fields": ["communication_protocols", "connectivity", "api_support"],
        "description": (
            "Unencrypted HTTP exposes web management interfaces and API endpoints "
            "to plaintext eavesdropping, credential theft, and man-in-the-middle "
            "attacks. Sessions tokens and passwords traversing HTTP are trivially "
            "captured by any network observer."
        ),
        "risk_level": "High",
    },
    {
        "keywords": ["https"],
        "name": "HTTPS",
        "category": "Network Surface",
        "source_fields": ["communication_protocols", "connectivity", "api_support"],
        "description": (
            "HTTPS secures transport with TLS, but weak cipher suites, expired "
            "or self-signed certificates, and improper hostname validation can "
            "still expose the interface to interception and downgrade attacks."
        ),
        "risk_level": "Low",
    },
    {
        "keywords": ["rtsp"],
        "name": "RTSP",
        "category": "Network Surface",
        "source_fields": ["communication_protocols", "connectivity"],
        "description": (
            "RTSP exposes live video and audio streaming services. Unauthenticated "
            "or weakly authenticated RTSP streams (commonly on port 554) can be "
            "accessed and recorded by any network-adjacent attacker without authorization."
        ),
        "risk_level": "High",
    },
    {
        "keywords": ["ftp"],
        "name": "FTP",
        "category": "Network Surface",
        "source_fields": ["communication_protocols", "connectivity"],
        "description": (
            "FTP transmits files and credentials entirely in cleartext. It is "
            "highly susceptible to packet sniffing, replay attacks, and unauthorized "
            "file access. Firmware upload via FTP allows unauthenticated firmware "
            "replacement by an attacker on the local network."
        ),
        "risk_level": "Critical",
    },
    {
        "keywords": ["smtp"],
        "name": "SMTP",
        "category": "Network Surface",
        "source_fields": ["communication_protocols", "connectivity"],
        "description": (
            "SMTP used for device alerts and notifications can be abused for email "
            "spoofing, credential harvesting from cleartext AUTH exchanges, or "
            "lateral movement if outbound SMTP credentials are exposed."
        ),
        "risk_level": "Medium",
    },
    {
        "keywords": ["dns"],
        "name": "DNS",
        "category": "Network Surface",
        "source_fields": ["communication_protocols", "connectivity"],
        "description": (
            "DNS dependency introduces DNS poisoning and spoofing risks. Devices "
            "that resolve command-and-control or update server hostnames without "
            "DNSSEC validation are vulnerable to traffic redirection attacks."
        ),
        "risk_level": "Medium",
    },
    {
        "keywords": ["dhcp"],
        "name": "DHCP",
        "category": "Network Surface",
        "source_fields": ["communication_protocols", "connectivity"],
        "description": (
            "DHCP reliance exposes the device to rogue DHCP server attacks that "
            "can assign malicious DNS resolvers or default gateways, redirecting "
            "all device traffic through attacker-controlled infrastructure."
        ),
        "risk_level": "Medium",
    },
    {
        "keywords": ["rtp", "rtcp"],
        "name": "RTP/RTCP",
        "category": "Network Surface",
        "source_fields": ["communication_protocols"],
        "description": (
            "RTP/RTCP media streams are typically transmitted without encryption. "
            "An attacker on the same network segment can capture, replay, or inject "
            "audio and video data into active streaming sessions."
        ),
        "risk_level": "High",
    },
    {
        "keywords": ["ipv4"],
        "name": "IPv4",
        "category": "Network Surface",
        "source_fields": ["communication_protocols", "connectivity"],
        "description": (
            "IPv4 networks lack mandatory encryption. Devices operating over IPv4 "
            "without IPSec are exposed to ARP spoofing, ICMP redirect attacks, "
            "and broad-spectrum port scanning from the internet."
        ),
        "risk_level": "Low",
    },
    {
        "keywords": ["ipv6"],
        "name": "IPv6",
        "category": "Network Surface",
        "source_fields": ["communication_protocols", "connectivity"],
        "description": (
            "IPv6 significantly expands the addressable attack surface. Misconfigured "
            "IPv6 stacks introduce neighbor discovery spoofing (NDP), router advertisement "
            "hijacking, and new lateral movement paths within dual-stack networks."
        ),
        "risk_level": "Low",
    },
    {
        "keywords": ["udp"],
        "name": "UDP",
        "category": "Network Surface",
        "source_fields": ["communication_protocols"],
        "description": (
            "UDP is connectionless and lacks inherent authentication or sequencing. "
            "It is frequently exploited for amplification-based DDoS attacks, UDP "
            "flood denial-of-service, and spoofed-source packet injection."
        ),
        "risk_level": "Medium",
    },
    {
        "keywords": ["tcp/ip", "tcp"],
        "name": "TCP/IP",
        "category": "Network Surface",
        "source_fields": ["communication_protocols", "connectivity"],
        "description": (
            "TCP/IP is the fundamental network stack. Misconfigurations or unpatched "
            "stack implementations expose devices to SYN flood attacks, port scanning, "
            "TCP session hijacking, and fragmentation-based exploits."
        ),
        "risk_level": "Low",
    },
    {
        "keywords": ["ntp"],
        "name": "NTP",
        "category": "Network Surface",
        "source_fields": ["communication_protocols"],
        "description": (
            "NTP time synchronization without authentication is vulnerable to NTP "
            "reflection amplification attacks and time-of-check/time-of-use (TOCTOU) "
            "exploits that can invalidate TLS certificates or bypass time-based controls."
        ),
        "risk_level": "Medium",
    },
    {
        "keywords": ["igmp"],
        "name": "IGMP",
        "category": "Network Surface",
        "source_fields": ["communication_protocols"],
        "description": (
            "IGMP multicast group management can be abused for membership spoofing, "
            "enabling attackers to join multicast groups and intercept multicast "
            "video or sensor data streams intended for authorized subscribers only."
        ),
        "risk_level": "Medium",
    },
    {
        "keywords": ["qos"],
        "name": "QoS",
        "category": "Network Surface",
        "source_fields": ["communication_protocols"],
        "description": (
            "Quality of Service (QoS) configurations can be manipulated by an "
            "attacker with network access to deprioritize legitimate device traffic, "
            "degrade streaming quality, or prioritize malicious command channels."
        ),
        "risk_level": "Low",
    },

    # ══════════════════════════════════════════════════════════════════════════
    # 2. API SURFACE
    # ══════════════════════════════════════════════════════════════════════════

    {
        "keywords": ["onvif"],
        "name": "ONVIF",
        "category": "API Surface",
        "source_fields": ["api_support", "communication_protocols"],
        "description": (
            "ONVIF exposes camera management, PTZ control, stream configuration, "
            "and device discovery. Unauthenticated ONVIF WS-Discovery broadcasts "
            "allow enumeration and unauthorized control of cameras on the network."
        ),
        "risk_level": "High",
    },
    {
        "keywords": ["isapi"],
        "name": "ISAPI",
        "category": "API Surface",
        "source_fields": ["api_support"],
        "description": (
            "ISAPI (Hikvision proprietary API) exposes device configuration, live "
            "video access, event management, and administrative controls. Multiple "
            "CVEs document unauthenticated ISAPI endpoints that allow full device takeover."
        ),
        "risk_level": "Critical",
    },
    {
        "keywords": ["rest api", "rest"],
        "name": "REST API",
        "category": "API Surface",
        "source_fields": ["api_support"],
        "description": (
            "REST APIs without proper authentication, rate limiting, or input "
            "validation expose device configuration and control endpoints to "
            "unauthorized access, injection attacks, and automated enumeration."
        ),
        "risk_level": "High",
    },
    {
        "keywords": ["soap api", "soap"],
        "name": "SOAP API",
        "category": "API Surface",
        "source_fields": ["api_support"],
        "description": (
            "SOAP APIs are vulnerable to XML injection, XML External Entity (XXE) "
            "attacks, and excessive data exposure if strict schema validation "
            "is not enforced on all incoming SOAP envelopes."
        ),
        "risk_level": "Medium",
    },
    {
        "keywords": ["mqtt api", "mqtt broker", "mqtt"],
        "name": "MQTT API",
        "category": "API Surface",
        "source_fields": ["api_support", "communication_protocols"],
        "description": (
            "Exposing MQTT as a public API surface without topic-level ACLs and "
            "client certificate authentication allows unauthorized clients to "
            "subscribe to sensitive telemetry or publish malicious device commands."
        ),
        "risk_level": "High",
    },

    # ══════════════════════════════════════════════════════════════════════════
    # 3. PHYSICAL SURFACE
    # ══════════════════════════════════════════════════════════════════════════

    {
        "keywords": ["rj45", "ethernet port"],
        "name": "RJ45 Ethernet Port",
        "category": "Physical Surface",
        "source_fields": ["physical_interfaces", "connectivity"],
        "description": (
            "Exposed RJ45 Ethernet ports allow direct network access without "
            "wireless-layer controls. A physically connected attacker can bypass "
            "network segmentation, perform MITM attacks, or sniff unencrypted traffic."
        ),
        "risk_level": "High",
    },
    {
        "keywords": ["usb"],
        "name": "USB Port",
        "category": "Physical Surface",
        "source_fields": ["physical_interfaces"],
        "description": (
            "USB ports can be exploited to load malicious firmware via storage "
            "devices, exfiltrate recorded data, or perform BadUSB/juice-jacking "
            "attacks using specially crafted charging accessories."
        ),
        "risk_level": "High",
    },
    {
        "keywords": ["serial port", "rs-232", "rs232", "rs-485", "rs485"],
        "name": "Serial Port",
        "category": "Physical Surface",
        "source_fields": ["physical_interfaces"],
        "description": (
            "Serial ports (RS-232 / RS-485) expose direct communication with "
            "industrial controllers and embedded modems. Attackers can replay "
            "industrial control commands or exfiltrate raw sensor data streams."
        ),
        "risk_level": "High",
    },
    {
        "keywords": ["console port"],
        "name": "Console Port",
        "category": "Physical Surface",
        "source_fields": ["physical_interfaces"],
        "description": (
            "Console ports provide privileged CLI access, often without "
            "authentication timeout or lockout mechanisms. Physical access via "
            "console port enables full device compromise including root shell access."
        ),
        "risk_level": "Critical",
    },
    {
        "keywords": ["sd card", "microsd", "memory card"],
        "name": "SD Card Slot",
        "category": "Physical Surface",
        "source_fields": ["physical_interfaces"],
        "description": (
            "SD card slots allow insertion of malicious storage media with auto-run "
            "payloads targeting the embedded OS, or physical extraction of sensitive "
            "recorded footage and configuration data stored on removable media."
        ),
        "risk_level": "Medium",
    },
    {
        "keywords": ["power connector", "dc jack", "poe", "power interface"],
        "name": "Power Interface",
        "category": "Physical Surface",
        "source_fields": ["physical_interfaces", "connectivity"],
        "description": (
            "Power interfaces (DC jack, PoE) can be abused for power line "
            "communication attacks, denial-of-service via controlled power cycling, "
            "or hardware voltage glitching to bypass secure boot verification."
        ),
        "risk_level": "Medium",
    },

    # ══════════════════════════════════════════════════════════════════════════
    # 4. WIRELESS SURFACE
    # ══════════════════════════════════════════════════════════════════════════

    {
        "keywords": ["wifi", "wi-fi", "wlan", "802.11"],
        "name": "Wi-Fi",
        "category": "Wireless Surface",
        "source_fields": ["connectivity", "communication_protocols"],
        "description": (
            "Wi-Fi exposes the device to deauthentication attacks (IEEE 802.11 "
            "management frame spoofing), WPA2/WPA3 handshake capture for offline "
            "cracking, evil twin access points, and credential theft via rogue APs."
        ),
        "risk_level": "High",
    },
    {
        "keywords": ["bluetooth", "ble", "bluetooth low energy"],
        "name": "Bluetooth / BLE",
        "category": "Wireless Surface",
        "source_fields": ["connectivity", "communication_protocols"],
        "description": (
            "Bluetooth and BLE expose the device to pairing bypass attacks, "
            "MITM attacks during key exchange, and passive sniffing of unencrypted "
            "telemetry or control packets within the 10–100 m proximity range."
        ),
        "risk_level": "High",
    },
    {
        "keywords": ["zigbee"],
        "name": "Zigbee",
        "category": "Wireless Surface",
        "source_fields": ["connectivity", "communication_protocols"],
        "description": (
            "Zigbee mesh networks can be compromised via rogue coordinator injection, "
            "replay attacks against unprotected frame counters, or network key "
            "extraction from unprotected trust center join procedures."
        ),
        "risk_level": "High",
    },
    {
        "keywords": ["lora", "lorawan"],
        "name": "LoRa / LoRaWAN",
        "category": "Wireless Surface",
        "source_fields": ["connectivity", "communication_protocols"],
        "description": (
            "LoRa / LoRaWAN long-range transmissions are susceptible to replay "
            "attacks, RF jamming, and ABP join mode session key extraction on "
            "devices deployed with low-security over-the-air activation settings."
        ),
        "risk_level": "Medium",
    },
    {
        "keywords": ["nb-iot", "nbiot", "nb iot"],
        "name": "NB-IoT",
        "category": "Wireless Surface",
        "source_fields": ["connectivity", "communication_protocols"],
        "description": (
            "NB-IoT cellular connectivity exposes devices to IMSI catcher (Stingray) "
            "attacks and rogue base station impersonation, especially in regions "
            "with weak cellular infrastructure and limited mutual authentication."
        ),
        "risk_level": "Medium",
    },
    {
        "keywords": ["4g", "lte", "4g/lte"],
        "name": "4G / LTE",
        "category": "Wireless Surface",
        "source_fields": ["connectivity", "communication_protocols"],
        "description": (
            "4G/LTE cellular connectivity can be intercepted by IMSI catchers. "
            "Misconfigured APN settings or default SIM credentials can redirect "
            "all device telemetry and command traffic through attacker infrastructure."
        ),
        "risk_level": "Medium",
    },
    {
        "keywords": ["5g"],
        "name": "5G",
        "category": "Wireless Surface",
        "source_fields": ["connectivity", "communication_protocols"],
        "description": (
            "5G connectivity introduces new protocol layers that expand the attack "
            "surface. Network slicing misconfigurations and gNB vulnerabilities can "
            "lead to cross-tenant data exposure and session interception."
        ),
        "risk_level": "Medium",
    },

    # ══════════════════════════════════════════════════════════════════════════
    # 5. AUTHENTICATION SURFACE
    # ══════════════════════════════════════════════════════════════════════════

    {
        "keywords": ["password", "passwd", "credentials", "password authentication"],
        "name": "Password Authentication",
        "category": "Authentication Surface",
        "source_fields": ["authentication_methods", "security_features"],
        "description": (
            "Password-based authentication is the most common attack vector on "
            "IoT devices. Default, weak, or reused passwords are vulnerable to "
            "brute-force, credential stuffing, and dictionary attacks at scale."
        ),
        "risk_level": "High",
    },
    {
        "keywords": ["user role", "rbac", "role-based", "roles", "user roles"],
        "name": "User Roles",
        "category": "Authentication Surface",
        "source_fields": ["authentication_methods", "security_features"],
        "description": (
            "Role-based access control misconfiguration or privilege escalation "
            "vulnerabilities can allow lower-privileged users to access and modify "
            "administrative device functions, configurations, or recorded media."
        ),
        "risk_level": "Medium",
    },
    {
        "keywords": ["remote login", "remote access", "remote management"],
        "name": "Remote Login",
        "category": "Authentication Surface",
        "source_fields": ["authentication_methods", "connectivity"],
        "description": (
            "Remote login interfaces exposed to untrusted networks are high-value "
            "targets for credential brute-force, session hijacking, and "
            "man-in-the-middle attacks if transport-layer encryption is not enforced."
        ),
        "risk_level": "Critical",
    },
    {
        "keywords": ["web login", "web ui", "web interface", "web console", "web management"],
        "name": "Web Login",
        "category": "Authentication Surface",
        "source_fields": ["authentication_methods", "api_support"],
        "description": (
            "Web-based login panels are susceptible to CSRF, reflected and stored "
            "XSS, credential brute-force automation, and session fixation if CSRF "
            "tokens, rate limiting, and account lockout policies are absent."
        ),
        "risk_level": "High",
    },
]


# ─── Extended / Additional Rules (beyond the core specification) ──────────────
# These cover protocols commonly seen in IoT device datasheets that are not
# in the primary spec but may appear in extracted fields.

EXTENDED_RULES: list[dict] = [
    {
        "keywords": ["uart"],
        "name": "UART Serial Interface",
        "category": "Physical Surface",
        "source_fields": ["physical_interfaces"],
        "description": (
            "UART pins on the PCB expose a root shell to an attacker with physical "
            "access and a TTL-USB adapter. This is one of the highest-impact hardware "
            "surfaces, enabling full OS access without any software-layer authentication."
        ),
        "risk_level": "Critical",
    },
    {
        "keywords": ["jtag"],
        "name": "JTAG Debug Interface",
        "category": "Physical Surface",
        "source_fields": ["physical_interfaces"],
        "description": (
            "JTAG provides low-level hardware debug access. An attacker with JTAG "
            "access can dump flash memory, extract cryptographic keys stored in "
            "OTP fuses, patch running firmware, and bypass secure boot entirely."
        ),
        "risk_level": "Critical",
    },
    {
        "keywords": ["rfid", "nfc"],
        "name": "RFID / NFC",
        "category": "Wireless Surface",
        "source_fields": ["connectivity", "physical_interfaces"],
        "description": (
            "RFID and NFC interfaces are vulnerable to relay attacks, card cloning, "
            "and passive sniffing at close proximity. Unauthenticated NFC reads "
            "can expose device identifiers or trigger unauthorized commands."
        ),
        "risk_level": "High",
    },
    {
        "keywords": ["telnet"],
        "name": "Telnet",
        "category": "Network Surface",
        "source_fields": ["communication_protocols", "connectivity"],
        "description": (
            "Telnet transmits all data, including login credentials and session "
            "commands, entirely in cleartext. It represents one of the most critical "
            "network attack surfaces on any internet-facing IoT device."
        ),
        "risk_level": "Critical",
    },
    {
        "keywords": ["ssh"],
        "name": "SSH",
        "category": "Network Surface",
        "source_fields": ["communication_protocols", "connectivity"],
        "description": (
            "SSH provides encrypted remote access but default credentials, weak "
            "host keys, and exposed port 22 make it a frequent target for brute-force "
            "campaigns and automated scanning at internet scale."
        ),
        "risk_level": "Medium",
    },
    {
        "keywords": ["mqtt"],
        "name": "MQTT",
        "category": "Network Surface",
        "source_fields": ["communication_protocols"],
        "description": (
            "MQTT broker connections without TLS (default port 1883) transmit "
            "device telemetry in cleartext. Topic subscription abuse can expose "
            "sensor readings and allow injection of unauthorized device commands."
        ),
        "risk_level": "High",
    },
    {
        "keywords": ["coap"],
        "name": "CoAP",
        "category": "Network Surface",
        "source_fields": ["communication_protocols"],
        "description": (
            "CoAP is a lightweight IoT protocol with no mandatory authentication "
            "in its base specification. Unauthenticated CoAP endpoints permit device "
            "enumeration, resource access, and command injection without credentials."
        ),
        "risk_level": "High",
    },
    {
        "keywords": ["modbus"],
        "name": "Modbus",
        "category": "Network Surface",
        "source_fields": ["communication_protocols", "api_support"],
        "description": (
            "Modbus has no built-in authentication or encryption. Industrial "
            "attackers can read sensor register values, write actuator controls, "
            "and halt industrial operations via unauthenticated Modbus commands."
        ),
        "risk_level": "Critical",
    },
    {
        "keywords": ["tftp"],
        "name": "TFTP",
        "category": "Network Surface",
        "source_fields": ["communication_protocols"],
        "description": (
            "TFTP has no authentication mechanism and is used for firmware updates "
            "in many embedded IoT devices. An attacker on the network can replace "
            "firmware images without any credentials or integrity verification."
        ),
        "risk_level": "Critical",
    },
    {
        "keywords": ["certificate", "x.509", "pki"],
        "name": "Certificate-Based Authentication",
        "category": "Authentication Surface",
        "source_fields": ["authentication_methods", "security_features"],
        "description": (
            "Certificate mismanagement — expired certificates, weak RSA key lengths, "
            "missing CRL/OCSP checks, or improper CA validation — can allow MITM "
            "attacks even in certificate-authenticated deployment scenarios."
        ),
        "risk_level": "Medium",
    },
    {
        "keywords": ["oauth", "oauth2", "api key", "api token", "bearer token"],
        "name": "Token / OAuth Authentication",
        "category": "Authentication Surface",
        "source_fields": ["authentication_methods", "api_support"],
        "description": (
            "Leaked or long-lived API tokens and OAuth access tokens can be replayed "
            "by attackers to gain persistent unauthorized access to device APIs "
            "without requiring re-authentication or multi-factor verification."
        ),
        "risk_level": "High",
    },
    {
        "keywords": ["sim", "sim card"],
        "name": "SIM Card Slot",
        "category": "Physical Surface",
        "source_fields": ["physical_interfaces"],
        "description": (
            "Accessible SIM card slots allow SIM swapping attacks, enabling "
            "adversaries to reroute cellular communications and intercept "
            "OTP-based authentication codes sent to device-associated numbers."
        ),
        "risk_level": "High",
    },
    {
        "keywords": ["z-wave", "zwave"],
        "name": "Z-Wave",
        "category": "Wireless Surface",
        "source_fields": ["connectivity", "communication_protocols"],
        "description": (
            "Z-Wave smart home devices are vulnerable to replay attacks, "
            "forced inclusion into attacker-controlled Z-Wave networks, and "
            "eavesdropping on unencrypted mesh communications."
        ),
        "risk_level": "High",
    },
    {
        "keywords": ["graphql"],
        "name": "GraphQL",
        "category": "API Surface",
        "source_fields": ["api_support"],
        "description": (
            "GraphQL without query depth limiting or disabled introspection enables "
            "schema discovery, data over-fetching, and denial-of-service attacks via "
            "deeply nested or computationally expensive query structures."
        ),
        "risk_level": "Medium",
    },
    {
        "keywords": ["cgi"],
        "name": "CGI Interface",
        "category": "API Surface",
        "source_fields": ["api_support"],
        "description": (
            "CGI-based interfaces have a well-documented history of command injection "
            "vulnerabilities. Improper input sanitization in CGI handlers can lead "
            "directly to remote code execution on the embedded device."
        ),
        "risk_level": "Critical",
    },
    {
        "keywords": ["rtmp"],
        "name": "RTMP",
        "category": "Network Surface",
        "source_fields": ["communication_protocols"],
        "description": (
            "RTMP video streaming without authentication exposes live feeds to "
            "unauthorized viewers. Stream keys transmitted in cleartext allow "
            "passive capture and unauthorized re-streaming of private feeds."
        ),
        "risk_level": "High",
    },
    {
        "keywords": ["opc-ua", "opcua", "opc ua"],
        "name": "OPC-UA",
        "category": "Network Surface",
        "source_fields": ["communication_protocols", "api_support"],
        "description": (
            "OPC-UA is widely used in industrial IoT environments. Unauthenticated "
            "OPC-UA endpoints or insecure security policy modes (None) can allow "
            "unauthorized reading and writing of industrial process variables."
        ),
        "risk_level": "High",
    },
    {
        "keywords": ["amqp"],
        "name": "AMQP",
        "category": "Network Surface",
        "source_fields": ["communication_protocols"],
        "description": (
            "AMQP message queuing without mutual TLS authentication allows injection "
            "of malicious messages into device command channels and telemetry "
            "pipelines, enabling remote command execution or data poisoning."
        ),
        "risk_level": "High",
    },
    {
        "keywords": ["no authentication", "unauthenticated", "open access"],
        "name": "No Authentication",
        "category": "Authentication Surface",
        "source_fields": ["authentication_methods", "security_features"],
        "description": (
            "The device exposes one or more interfaces with no authentication "
            "requirement documented. Any network-adjacent or physically present "
            "attacker can access, control, or exfiltrate all device data freely."
        ),
        "risk_level": "Critical",
    },
]

# Combined rule set: core rules first, then extended rules
ALL_RULES: list[dict] = SURFACE_RULES + EXTENDED_RULES


# ─── Helper Functions ─────────────────────────────────────────────────────────

def _normalize(text: str) -> str:
    """Lowercase and collapse whitespace for consistent fuzzy matching."""
    return re.sub(r"\s+", " ", text.strip().lower())


def _matches_value(
    value: str,
    keywords: list[str],
    exclude_keywords: list[str] | None = None,
) -> str | None:
    """
    Attempt to match a single spec value against the rule's keyword list.

    Returns the first keyword that matched, or None if no match.
    Respects word-boundary matching and optional exclusion list.
    """
    norm = _normalize(value)

    # Apply exclusion check first
    if exclude_keywords:
        for ex in exclude_keywords:
            if re.search(r"(?<![a-z0-9])" + re.escape(ex) + r"(?![a-z0-9])", norm):
                return None

    for kw in keywords:
        pattern = r"(?<![a-z0-9])" + re.escape(kw) + r"(?![a-z0-9])"
        if re.search(pattern, norm):
            return kw

    return None


def _collect_field_values(
    specs: dict[str, Any],
    fields: list[str],
) -> list[tuple[str, str]]:
    """
    Extract all string values from the specified fields of the IoT spec dict.

    Returns a list of (field_name, value_string) tuples.
    Handles both list[str] and bare str field values gracefully.
    """
    pairs: list[tuple[str, str]] = []
    for field in fields:
        raw = specs.get(field)
        if raw is None:
            continue
        if isinstance(raw, list):
            for item in raw:
                if isinstance(item, str) and item.strip():
                    pairs.append((field, item.strip()))
        elif isinstance(raw, str) and raw.strip():
            pairs.append((field, raw.strip()))
    return pairs


def _build_evidence(field: str, value: str, matched_keyword: str) -> str:
    """
    Construct a human-readable evidence string for the dashboard.

    Example:
        'RTSP' detected in Communication Protocols: "RTSP"
    """
    field_label = field.replace("_", " ").title()
    return (
        f"'{matched_keyword.upper()}' detected in "
        f"{field_label}: \"{value}\""
    )


# ─── Core Engine ─────────────────────────────────────────────────────────────

def analyze_attack_surfaces(specs: dict[str, Any]) -> dict:
    """
    Main entry point for the Attack Surface Engine.

    Scans the provided IoT device specification dictionary against the full
    rule database and returns all identified attack surfaces as structured
    JSON, sorted by risk severity (Critical → High → Medium → Low).

    Parameters
    ----------
    specs : dict
        IoT specification dictionary produced by the Feature Extractor.
        Expected keys (all optional — missing keys are handled gracefully):

            communication_protocols : list[str]
            api_support             : list[str]
            physical_interfaces     : list[str]
            connectivity            : list[str]
            authentication_methods  : list[str]
            security_features       : list[str]

    Returns
    -------
    dict with the following top-level keys:

        attack_surfaces : list[dict]
            Each entry contains:
                surface_name     : str
                surface_category : str
                evidence         : str
                description      : str
                risk_level       : str

        summary : dict
            total      : int
            by_category: dict[str, int]
            by_risk    : dict[str, int]

        total_surfaces : int
    """
    found: list[dict] = []
    seen_names: set[str] = set()  # Prevent duplicate entries per rule name

    for rule in ALL_RULES:
        name: str = rule["name"]
        if name in seen_names:
            continue  # Already captured by a previous matching field

        category: str = rule["category"]
        keywords: list[str] = rule["keywords"]
        exclude_kws: list[str] | None = rule.get("exclude_keywords")
        source_fields: list[str] = rule["source_fields"]

        field_values = _collect_field_values(specs, source_fields)

        for field, value in field_values:
            matched_kw = _matches_value(value, keywords, exclude_kws)
            if matched_kw:
                seen_names.add(name)
                found.append({
                    "surface_name":     name,
                    "surface_category": category,
                    "evidence":         _build_evidence(field, value, matched_kw),
                    "description":      rule["description"],
                    "risk_level":       rule["risk_level"],
                })
                break  # First matching field value is sufficient evidence

    # Sort surfaces: Critical → High → Medium → Low
    found.sort(key=lambda s: RISK_ORDER.get(s["risk_level"], 99))

    # Build summary counts
    category_counts: dict[str, int] = {}
    risk_counts: dict[str, int] = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}

    for surface in found:
        cat = surface["surface_category"]
        category_counts[cat] = category_counts.get(cat, 0) + 1
        risk = surface["risk_level"]
        if risk in risk_counts:
            risk_counts[risk] += 1

    return {
        "attack_surfaces": found,
        "summary": {
            "total":       len(found),
            "by_category": category_counts,
            "by_risk":     risk_counts,
        },
        "total_surfaces": len(found),
    }


# ─── CLI / Standalone Test ────────────────────────────────────────────────────

if __name__ == "__main__":
    import json

    # ── Test Case 1: Standard IoT Camera (matches all 5 surface categories) ──
    sample_specs = {
        "communication_protocols": [
            "HTTP", "HTTPS", "RTSP", "RTP", "RTCP",
            "FTP", "SMTP", "DNS", "DHCP",
            "TCP/IP", "IPv4", "IPv6", "UDP",
            "NTP", "IGMP", "QoS",
        ],
        "api_support": [
            "ONVIF Profile S",
            "ISAPI",
            "REST API",
            "SOAP API",
            "MQTT API",
        ],
        "physical_interfaces": [
            "RJ45 Ethernet",
            "USB 2.0",
            "Serial Port",
            "Console Port",
            "MicroSD Card Slot",
            "Power Connector (DC 12V)",
        ],
        "connectivity": [
            "WiFi 802.11 b/g/n",
            "Bluetooth Low Energy",
            "Zigbee",
            "LoRa",
            "NB-IoT",
            "4G/LTE",
            "5G",
        ],
        "authentication_methods": [
            "Password Authentication",
            "User Roles",
            "Remote Login",
            "Web Login",
        ],
        "security_features": [
            "AES-256 Encryption",
            "TLS 1.3",
            "Secure Boot",
            "IP Filtering",
        ],
    }

    print("=" * 70)
    print("  Attack Surface Engine — Standalone Test")
    print("=" * 70)

    result = analyze_attack_surfaces(sample_specs)

    print(f"\n[OK] Total attack surfaces identified: {result['total_surfaces']}\n")
    print("[*] Summary by category:")
    for cat, count in result["summary"]["by_category"].items():
        print(f"   {cat:<25} {count} surface(s)")

    print("\n[!] Summary by risk level:")
    for risk, count in result["summary"]["by_risk"].items():
        print(f"   {risk:<10} {count}")

    print("\n--- Full Attack Surface Output ---\n")
    print(json.dumps(result["attack_surfaces"], indent=2))
