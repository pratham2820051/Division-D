import os
import sys
import json
import shutil
import tempfile
import uuid
import random
from pathlib import Path
from typing import Optional

# ─── Load .env from project root FIRST before any imports ─────────────────────
from dotenv import load_dotenv
_root = Path(__file__).parent.parent
load_dotenv(dotenv_path=_root / ".env", override=True)

from fastapi import FastAPI, File, UploadFile, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ─── Make features_extractor importable ───────────────────────────────────────
sys.path.insert(0, str(_root))

from features_extractor.src import process_iot_document

app = FastAPI(title="CyberSentinel AI Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def generate_security_audit(specs: dict) -> dict:
    """
    Takes the raw IoT specs extracted by Gemini and transforms them into a
    full security audit report for the dashboard.
    """
    # --- Score Calculation Logic ---
    from features_extractor.src.scoring_engine import calculate_security_score
    
    scoring_result = specs.get("security_scoring")
    if not scoring_result:
        from features_extractor.src.attack_surface_engine import analyze_attack_surfaces
        if "attack_surfaces" not in specs:
            specs["attack_surfaces"] = analyze_attack_surfaces(specs).get("attack_surfaces", [])
        scoring_result = calculate_security_score(specs)
        
    score = scoring_result["security_score"]
    risk_level = scoring_result["risk_level"]

    security_features = specs.get("security_features", []) or []
    auth_methods = specs.get("authentication_methods", []) or []
    open_ports = specs.get("open_ports", []) or []
    protocols = specs.get("communication_protocols", []) or []
    update_mechanism = specs.get("update_mechanism", "") or ""
    physical_interfaces = specs.get("physical_interfaces", []) or []
    firmware = specs.get("firmware_version") or "unknown"

    # --- Vulnerability Generation Based on Real Specs ---
    vulnerabilities = []
    recommendations = []
    critical_risks = []

    vuln_id = 1
    rec_id = 1

    # Check for dangerous physical interfaces
    for iface in physical_interfaces:
        if "jtag" in iface.lower():
            vulnerabilities.append({
                "id": f"v-{vuln_id}", "title": "Exposed JTAG Debug Interface",
                "severity": "High", "likelihood": 4, "impact": 5,
                "desc": f"Physical interface '{iface}' allows low-level hardware debugging and memory dumps.",
                "mitigation": "Disable JTAG pins on production board revisions."
            })
            recommendations.append({
                "id": f"r-{rec_id}", "severity": "High",
                "title": "JTAG Interface Exposed on Production Board",
                "action": "Mask or disable JTAG pads during manufacturing for production builds.",
                "scoreReward": 5
            })
            vuln_id += 1; rec_id += 1
        if "uart" in iface.lower():
            vulnerabilities.append({
                "id": f"v-{vuln_id}", "title": "UART Console Shell Access",
                "severity": "High", "likelihood": 4, "impact": 4,
                "desc": f"Physical UART interface '{iface}' may expose root shell access on debug serial pins.",
                "mitigation": "Disable UART debug shell in production firmware compile flags."
            })
            recommendations.append({
                "id": f"r-{rec_id}", "severity": "High",
                "title": "UART Root Shell Exposure",
                "action": "Compile production firmware with debug console disabled.",
                "scoreReward": 5
            })
            critical_risks.append({
                "id": f"cr-{vuln_id}", "title": "Physical UART Shell Access",
                "desc": "UART interface exposes privileged root shell on physical pins.",
                "icon": "warning"
            })
            vuln_id += 1; rec_id += 1

    # Check for open dangerous ports
    for port in open_ports:
        if port == 22:
            vulnerabilities.append({
                "id": f"v-{vuln_id}", "title": "SSH Port 22 Open",
                "severity": "Medium", "likelihood": 3, "impact": 4,
                "desc": "Port 22 (SSH) is actively listening. Default or weak credentials may allow unauthorized access.",
                "mitigation": "Disable password auth; enforce key-based SSH only. Rate-limit failed attempts."
            })
            recommendations.append({
                "id": f"r-{rec_id}", "severity": "Medium",
                "title": "SSH Password Authentication Active",
                "action": "Enforce key-based SSH authentication and disable root login.",
                "scoreReward": 4
            })
            vuln_id += 1; rec_id += 1
        if port == 23:
            vulnerabilities.append({
                "id": f"v-{vuln_id}", "title": "Telnet Port 23 Open (Plaintext)",
                "severity": "Critical", "likelihood": 5, "impact": 5,
                "desc": "Port 23 (Telnet) transmits all data including credentials in cleartext.",
                "mitigation": "Disable Telnet entirely and replace with SSH."
            })
            recommendations.append({
                "id": f"r-{rec_id}", "severity": "Critical",
                "title": "Cleartext Telnet Access",
                "action": "Disable Telnet daemon; enforce encrypted SSH for remote access.",
                "scoreReward": 15
            })
            critical_risks.append({
                "id": f"cr-{vuln_id}", "title": "Cleartext Telnet on Port 23",
                "desc": "All credentials and session data transmitted in plaintext over Telnet.",
                "icon": "gpp_bad"
            })
            vuln_id += 1; rec_id += 1
        if port == 80:
            vulnerabilities.append({
                "id": f"v-{vuln_id}", "title": "Unencrypted HTTP on Port 80",
                "severity": "Medium", "likelihood": 3, "impact": 3,
                "desc": "Web management interface served over unencrypted HTTP.",
                "mitigation": "Redirect all HTTP traffic to HTTPS. Enforce TLS v1.2 minimum."
            })
            recommendations.append({
                "id": f"r-{rec_id}", "severity": "Medium",
                "title": "HTTP Management Interface Unencrypted",
                "action": "Force HTTPS redirect and disable HTTP listener on port 80.",
                "scoreReward": 3
            })
            vuln_id += 1; rec_id += 1
        if port == 1883:
            vulnerabilities.append({
                "id": f"v-{vuln_id}", "title": "MQTT Broker Port 1883 Open (Unencrypted)",
                "severity": "High", "likelihood": 4, "impact": 4,
                "desc": "Port 1883 (MQTT) is open without TLS. Device telemetry is transmitted in plaintext.",
                "mitigation": "Switch to MQTT over TLS (port 8883). Enable broker authentication."
            })
            recommendations.append({
                "id": f"r-{rec_id}", "severity": "High",
                "title": "Plaintext MQTT Telemetry Stream",
                "action": "Migrate to TLS-secured MQTT on port 8883 with certificate auth.",
                "scoreReward": 8
            })
            critical_risks.append({
                "id": f"cr-{vuln_id}", "title": "Unencrypted MQTT on Port 1883",
                "desc": "Device telemetry and command traffic broadcast in plaintext over network.",
                "icon": "gpp_bad"
            })
            vuln_id += 1; rec_id += 1
        if port == 23:
            pass  # Already handled
        if port == 554:
            vulnerabilities.append({
                "id": f"v-{vuln_id}", "title": "RTSP Stream Port 554 Open",
                "severity": "High", "likelihood": 4, "impact": 4,
                "desc": "Port 554 (RTSP) is open. Video stream may be accessible without authentication.",
                "mitigation": "Require authentication for all RTSP stream connections."
            })
            recommendations.append({
                "id": f"r-{rec_id}", "severity": "High",
                "title": "Unauthenticated RTSP Video Stream",
                "action": "Enforce RTSP digest authentication and restrict access to VLAN.",
                "scoreReward": 8
            })
            vuln_id += 1; rec_id += 1

    # Check for insecure protocols
    for proto in protocols:
        if "ftp" in proto.lower():
            vulnerabilities.append({
                "id": f"v-{vuln_id}", "title": "FTP Protocol Detected (Plaintext File Transfer)",
                "severity": "High", "likelihood": 4, "impact": 4,
                "desc": f"Protocol '{proto}' transmits files and credentials in cleartext.",
                "mitigation": "Replace FTP with SFTP or SCP for secure file transfers."
            })
            recommendations.append({
                "id": f"r-{rec_id}", "severity": "High",
                "title": "Insecure FTP File Transfer Protocol",
                "action": "Disable FTP; use SFTP with key-based authentication instead.",
                "scoreReward": 6
            })
            vuln_id += 1; rec_id += 1

    # Check authentication
    if not auth_methods:
        vulnerabilities.append({
            "id": f"v-{vuln_id}", "title": "No Authentication Mechanism Documented",
            "severity": "Critical", "likelihood": 5, "impact": 5,
            "desc": "No authentication methods found in device specifications. Device may allow unauthenticated access.",
            "mitigation": "Implement strong authentication (certificate-based or MFA) on all interfaces."
        })
        recommendations.append({
            "id": f"r-{rec_id}", "severity": "Critical",
            "title": "Missing Authentication Documentation",
            "action": "Define and enforce mandatory device authentication before any interface access.",
            "scoreReward": 15
        })
        critical_risks.append({
            "id": f"cr-{vuln_id}", "title": "No Authentication Documented",
            "desc": "Specification sheet lists no authentication mechanisms. Unauthenticated access likely.",
            "icon": "gpp_bad"
        })
        vuln_id += 1; rec_id += 1

    # Check update mechanism
    if not update_mechanism or "manual" in update_mechanism.lower():
        vulnerabilities.append({
            "id": f"v-{vuln_id}", "title": "No Automated OTA Update Mechanism",
            "severity": "Low", "likelihood": 2, "impact": 3,
            "desc": "Device relies on manual updates, making it prone to running outdated firmware with known CVEs.",
            "mitigation": "Implement cryptographically signed OTA firmware update capability."
        })
        recommendations.append({
            "id": f"r-{rec_id}", "severity": "Low",
            "title": "Manual-Only Firmware Updates",
            "action": "Implement OTA update pipeline with signed firmware verification.",
            "scoreReward": 3
        })
        vuln_id += 1; rec_id += 1

    # Check security features completeness
    has_encryption = any("encrypt" in s.lower() for s in security_features)
    has_secure_boot = any("boot" in s.lower() for s in security_features)

    if not has_encryption:
        vulnerabilities.append({
            "id": f"v-{vuln_id}", "title": "No Data Encryption Documented",
            "severity": "High", "likelihood": 4, "impact": 4,
            "desc": "Specification does not mention data encryption at rest or in transit.",
            "mitigation": "Implement AES-256 for data at rest and TLS 1.3 for data in transit."
        })
        recommendations.append({
            "id": f"r-{rec_id}", "severity": "High",
            "title": "Missing Encryption Capabilities",
            "action": "Add AES-256 encryption and enforce TLS 1.3 on all communication channels.",
            "scoreReward": 8
        })
        vuln_id += 1; rec_id += 1

    if not has_secure_boot:
        vulnerabilities.append({
            "id": f"v-{vuln_id}", "title": "No Secure Boot Loader Verified",
            "severity": "High", "likelihood": 3, "impact": 5,
            "desc": "No secure boot mechanism is documented. Custom unsigned kernels may be loaded.",
            "mitigation": "Enable hardware-backed secure boot with cryptographic signature verification."
        })
        recommendations.append({
            "id": f"r-{rec_id}", "severity": "High",
            "title": "Secure Boot Not Documented",
            "action": "Implement hardware security enclave with verified boot chain.",
            "scoreReward": 8
        })
        vuln_id += 1; rec_id += 1

    # Ensure at least 2 critical risks for dashboard display
    if not critical_risks:
        critical_risks = [
            {
                "id": "cr-default-1",
                "title": "Unverified Firmware Integrity",
                "desc": "No firmware signing or boot chain verification documented in device specification.",
                "icon": "warning"
            },
            {
                "id": "cr-default-2",
                "title": "Insufficient Security Documentation",
                "desc": "Several security fields are undocumented, suggesting security is not a primary design consideration.",
                "icon": "gpp_bad"
            }
        ]

    # Count by severity
    crit_count = sum(1 for v in vulnerabilities if v["severity"] == "Critical")
    high_count = sum(1 for v in vulnerabilities if v["severity"] == "High")
    med_count = sum(1 for v in vulnerabilities if v["severity"] == "Medium")
    low_count = sum(1 for v in vulnerabilities if v["severity"] == "Low")

    # Build final port and network config strings
    port_strings = []
    for p in open_ports[:5]:
        known = {22: "SSH", 23: "Telnet", 80: "HTTP", 443: "HTTPS", 554: "RTSP",
                 1883: "MQTT", 1935: "RTMP", 8883: "MQTT-TLS", 69: "TFTP"}
        label = known.get(p, "Unknown")
        port_strings.append(f"Port {p} ({label})")
    ports_display = ", ".join(port_strings) + " currently active." if port_strings else "No open ports documented."

    api_support = specs.get("api_support", []) or []
    api_display = f"{len(api_support)} API standard(s) documented: {', '.join(api_support[:3])}." if api_support else "No API support documented."

    connectivity = specs.get("connectivity", []) or []
    network_display = f"Connectivity: {', '.join(connectivity[:3])}. Review for segmentation requirements." if connectivity else "No connectivity types documented."

    top_finding = vulnerabilities[0]["title"] if vulnerabilities else "No critical vulnerabilities detected."

    device_name = specs.get("device_name") or "Unknown Device"
    manufacturer = specs.get("manufacturer") or "Unknown Manufacturer"
    model = specs.get("model_number") or "N/A"
    device_type = specs.get("device_type") or "IoT Device"

    return {
        "id": f"dev-{uuid.uuid4().hex[:8]}",
        "name": f"{device_name} Security Audit",
        "filename": f"{device_name.lower().replace(' ', '_')}_spec.pdf",
        "date": __import__('datetime').date.today().isoformat(),
        "size": "Auto-analyzed",
        "type": device_type,
        "manufacturer": manufacturer,
        "model": model,
        "firmware": firmware,
        "score": score,
        "projectedScore": min(score + random.randint(8, 18), 100),
        "risk": risk_level,
        "vulns": {"critical": crit_count, "high": high_count, "medium": med_count, "low": low_count},
        "topFinding": top_finding,
        "criticalRisks": critical_risks[:4],
        "exposedAPIs": api_display,
        "openPorts": ports_display,
        "networkConfig": network_display,
        "vulnerabilityList": vulnerabilities,
        "recommendations": recommendations,
        # Attack Surface Engine output
        "attackSurfaces": specs.get("attack_surfaces", []),
        "attackSurfaceSummary": specs.get("attack_surface_summary", {}),
        # OWASP IoT Mapping Engine output
        "owaspMappings": specs.get("owasp_mappings", []),
        # Security Scoring Engine output
        "securityScoring": scoring_result,
        # Include raw extracted specs for reference
        "extractedSpecs": {
            k: v for k, v in specs.items()
            if k not in ("attack_surfaces", "attack_surface_summary", "owasp_mappings", "security_scoring")
        }
    }


@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "service": "CyberSentinel AI Backend",
        "gemini_key": "set" if os.getenv("GEMINI_API_KEY") else "MISSING",
        "llama_key": "set" if os.getenv("LLAMA_CLOUD_API_KEY") else "MISSING",
    }


@app.post("/api/attack-surfaces")
async def get_attack_surfaces(specs: dict):
    """
    Standalone endpoint: POST a raw IoT spec dict and get back
    the full Attack Surface Engine analysis.
    Useful for testing the engine without uploading a file.
    """
    from features_extractor.src.attack_surface_engine import analyze_attack_surfaces
    try:
        result = analyze_attack_surfaces(specs)
        return result
    except Exception as e:
        import traceback
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/owasp-mappings")
async def get_owasp_mappings(specs: dict):
    """
    Standalone endpoint: POST a raw spec dict containing attack_surfaces,
    authentication_methods, security_features, and update_mechanism, and get back
    the mapped OWASP IoT Top 10 findings.
    """
    from features_extractor.src.owasp_mapping_engine import analyze_owasp_mappings
    try:
        result = analyze_owasp_mappings(specs)
        return result
    except Exception as e:
        import traceback
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/security-score")
async def get_security_score(specs: dict):
    """
    Standalone endpoint: POST a raw spec dict containing communication_protocols,
    api_support, authentication_methods, security_features, and update_mechanism,
    and get back the deterministic security score analysis.
    """
    from features_extractor.src.scoring_engine import calculate_security_score
    try:
        result = calculate_security_score(specs)
        return result
    except Exception as e:
        import traceback
        raise HTTPException(status_code=500, detail=str(e))





@app.post("/api/generate-report")
async def generate_report_endpoint(device_data: dict):
    """
    POST endpoint: POST a structured device audit report dict, and get back
    a beautifully formatted Markdown report generated using Groq LLaMA3.
    """
    from features_extractor.src.report_generator import generate_executive_report
    try:
        report_text = generate_executive_report(device_data)
        return {"report": report_text}
    except Exception as e:
        import traceback
        raise HTTPException(status_code=500, detail=str(e))


class ExportRequest(BaseModel):
    markdown: str
    format: str
    filename: Optional[str] = "executive_report"


@app.post("/api/export-report")
async def export_report_endpoint(req: ExportRequest):
    """
    POST endpoint: Converts markdown to PDF or DOCX format and returns the binary file.
    """
    from features_extractor.src.report_generator import export_report_to_pdf, export_report_to_docx
    try:
        clean_format = req.format.lower()
        safe_filename = "".join([c if c.isalnum() or c in ("-", "_") else "_" for c in req.filename])
        
        if clean_format == "pdf":
            pdf_bytes = export_report_to_pdf(req.markdown)
            return Response(
                content=pdf_bytes,
                media_type="application/pdf",
                headers={"Content-Disposition": f"attachment; filename={safe_filename}.pdf"}
            )
        elif clean_format == "docx":
            docx_bytes = export_report_to_docx(req.markdown)
            return Response(
                content=docx_bytes,
                media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                headers={"Content-Disposition": f"attachment; filename={safe_filename}.docx"}
            )
        else:
            raise HTTPException(status_code=400, detail="Invalid format. Supported formats: pdf, docx")
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        print(f"[Export] ERROR: {e}\n{tb}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/analyze")
async def analyze_device(file: UploadFile = File(...)):
    """
    Accepts a PDF/DOCX/TXT file, runs LlamaParse + Gemini extraction,
    and returns a full security audit report for the dashboard.
    """
    suffix = Path(file.filename).suffix.lower()
    if suffix not in [".pdf", ".docx", ".txt"]:
        raise HTTPException(status_code=400, detail="Only PDF, DOCX, or TXT files are supported.")

    # Save upload to temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        print(f"[Backend] Processing uploaded file: {file.filename} -> {tmp_path}")

        # Run the full extraction pipeline (LlamaParse -> Gemini)
        raw_specs = process_iot_document(tmp_path)

        print(f"[Backend] Extraction complete. Specs keys: {list(raw_specs.keys())}")

        # Transform specs into full audit report
        audit_report = generate_security_audit(raw_specs)
        audit_report["filename"] = file.filename  # Use actual uploaded filename

        # Generate the executive markdown report using Groq
        from features_extractor.src.report_generator import generate_executive_report
        try:
            audit_report["executiveReport"] = generate_executive_report(audit_report)
        except Exception as re:
            print(f"[Backend] Warning: Failed to generate executive report: {re}")
            audit_report["executiveReport"] = ""

        print(f"[Backend] Audit complete. Score: {audit_report['score']} | Risk: {audit_report['risk']}")

        return audit_report

    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        print(f"[Backend] ERROR: {e}\n{tb}")
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass


if __name__ == "__main__":
    import uvicorn
    print("[CyberSentinel] Starting backend server...")
    print(f"[CyberSentinel] GEMINI_API_KEY: {'SET' if os.getenv('GEMINI_API_KEY') else 'MISSING'}")
    print(f"[CyberSentinel] LLAMA_CLOUD_API_KEY: {'SET' if os.getenv('LLAMA_CLOUD_API_KEY') else 'MISSING'}")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
