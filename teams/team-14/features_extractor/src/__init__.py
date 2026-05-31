from .parser import parse_document
from .extractor import extract_audit_data
from .attack_surface_engine import analyze_attack_surfaces
from .owasp_mapping_engine import analyze_owasp_mappings
from .scoring_engine import calculate_security_score

def process_iot_document(file_path: str):
    """
    End-to-end function to parse a document, extract IoT features,
    and run the Attack Surface Engine, OWASP IoT Mapping Engine, and Security Scoring Engine.
    Returns a combined dict ready for the dashboard.
    """
    print(f"Processing: {file_path}")

    # Step 1: Parse document → Markdown
    markdown_text = parse_document(file_path)

    # Step 2: Gemini extracts structured IoT specs
    extracted_data = extract_audit_data(markdown_text)
    specs = extracted_data.model_dump()

    # Step 3: Attack Surface Engine classifies surfaces from specs
    print("[AttackSurface] Running Attack Surface Engine...")
    attack_surface_result = analyze_attack_surfaces(specs)
    print(f"[AttackSurface] Found {attack_surface_result['total_surfaces']} attack surfaces.")

    # Merge attack surfaces back into specs for the OWASP mapper and scoring engine
    specs_enriched = {
        **specs,
        "attack_surfaces": attack_surface_result["attack_surfaces"]
    }

    # Step 4: OWASP Mapping Engine maps features to OWASP Top 10
    print("[OWASPMapper] Running OWASP IoT Mapping Engine...")
    owasp_result = analyze_owasp_mappings(specs_enriched)
    print(f"[OWASPMapper] Generated {len(owasp_result)} OWASP mapping findings.")

    # Step 5: Security Scoring Engine calculates deterministic score
    print("[ScoringEngine] Running Security Scoring Engine...")
    scoring_result = calculate_security_score(specs_enriched)
    print(f"[ScoringEngine] Computed Score: {scoring_result['security_score']} ({scoring_result['risk_level']})")

    # Merge everything into one dict
    return {
        **specs,
        "attack_surfaces": attack_surface_result["attack_surfaces"],
        "attack_surface_summary": attack_surface_result["summary"],
        "owasp_mappings": owasp_result,
        "security_scoring": scoring_result
    }


