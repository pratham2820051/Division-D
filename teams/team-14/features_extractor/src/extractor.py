import os
import json
from pathlib import Path
from dotenv import load_dotenv

# Load .env from project root (works regardless of where the script is run from)
_project_root = Path(__file__).resolve().parent.parent.parent
load_dotenv(dotenv_path=_project_root / ".env", override=True)

from .schemas import IoTSpecifications

def extract_audit_data(markdown_text: str) -> IoTSpecifications:
    """
    Uses Gemini API (google-genai SDK) to extract structured JSON data from
    the parsed markdown text based on the IoTSpecifications schema.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError(
            "GEMINI_API_KEY environment variable is not set. "
            "Check your .env file in the project root."
        )

    # Import here to give a clear error if google-genai is not installed
    try:
        from google import genai
        from google.genai import types
    except ImportError:
        raise ImportError(
            "google-genai package is not installed. "
            "Run: py -m pip install google-genai"
        )

    client = genai.Client(api_key=api_key)

    # Clean up control characters that PDF parsers sometimes introduce
    clean_markdown = (
        markdown_text
        .replace('\x08', '')
        .replace('\x00', '')
        .replace('\r', '\n')
    )

    # Truncate to avoid hitting token limits (keep first 30k chars)
    if len(clean_markdown) > 30000:
        clean_markdown = clean_markdown[:30000] + "\n\n[... document truncated for token limit ...]"

    prompt = f"""You are an expert IoT Security Data Extractor.
Analyze the following extracted text from an IoT device specification sheet and extract its technical features.

EXTRACT these fields precisely:
- manufacturer: company name that made the device
- device_name: product/marketing name
- model_number: specific model identifier
- device_type: category (e.g., IP Camera, Smart Meter, Industrial Gateway, Smart Thermostat)
- firmware_version: firmware/software version mentioned
- communication_protocols: list ALL protocols (MQTT, HTTP, HTTPS, CoAP, Zigbee, BLE, Z-Wave, AMQP, etc.)
- open_ports: list of port numbers mentioned as open/active (integers only, e.g., [22, 80, 443, 1883])
- connectivity: connection types (Wi-Fi, Ethernet, Cellular, PoE, 4G, 5G, etc.)
- physical_interfaces: physical ports/interfaces (USB, UART, JTAG, RS-232, RJ45, HDMI, etc.)
- authentication_methods: auth mechanisms (password, certificate, OAuth, API key, biometric, etc.)
- security_features: security capabilities (AES encryption, TLS, secure boot, firewall, VPN, etc.)
- api_support: API standards (REST API, ONVIF, ISAPI, Modbus, OPC-UA, etc.)
- update_mechanism: how firmware is updated (OTA, USB, web interface, manual, etc.)
- power_requirements: power specs (12V DC, PoE, battery, etc.)

SPECIFICATION TEXT:
---
{clean_markdown}
---

Return ONLY valid JSON matching the schema. If a field is not mentioned, use null for strings or [] for lists.
"""

    print("[Gemini] Sending extraction request to Gemini 2.5 Flash...")

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=IoTSpecifications,
            temperature=0.0,
        ),
    )

    print(f"[Gemini] Response received ({len(response.text)} chars)")

    # Parse the returned JSON into our Pydantic model
    try:
        raw_text = response.text.strip()
        # Strip markdown code fences if Gemini added them
        if raw_text.startswith("```"):
            raw_text = raw_text.split("```")[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:]
            raw_text = raw_text.strip()

        data = json.loads(raw_text)
        report = IoTSpecifications(**data)
        print(f"[Gemini] Parsed successfully. Device: {report.device_name}, Type: {report.device_type}")
        return report
    except json.JSONDecodeError as e:
        print(f"[Gemini] JSON parse error: {e}")
        print(f"[Gemini] Raw response: {response.text[:500]}")
        raise RuntimeError(f"Gemini returned invalid JSON: {e}")
    except Exception as e:
        print(f"[Gemini] Parse error: {e}")
        print(f"[Gemini] Raw response: {response.text[:500]}")
        raise
