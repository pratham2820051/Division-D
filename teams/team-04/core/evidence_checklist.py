# Evidence Checklist Generator
from data.complaint_schemas import DOMAIN_SCHEMAS

def generate_custom_checklist(domain: str, entities: dict) -> list:
    """
    Generates a dynamic checklist of evidence documents based on the domain and extracted entities.
    """
    schema = DOMAIN_SCHEMAS.get(domain, {})
    base_checklist = list(schema.get("evidence_checklist", []))
    
    # Custom items based on extracted data
    custom_items = []
    
    defect_details = str(entities.get("defect_details", "")).lower()
    
    # Check for specific keywords to add highly relevant evidence requirements
    if "unboxing" in defect_details or "package" in defect_details:
        custom_items.append("Unboxing video recording showing the sealed box and damaged product inside (highly recommended for online deliveries)")
    
    if "spurious" in defect_details or "fake" in defect_details:
        custom_items.append("Product manufacturer's confirmation email or brand authorization check verifying the counterfeit nature of the goods")
        
    if "hospital" in defect_details or "medical" in defect_details or "doctor" in defect_details:
        custom_items.append("Medical Discharge Summary and Hospitalization Certificate from the treated hospital")
        custom_items.append("Prescriptions and original pharmacy cash bills for medicines purchased")
        
    if "atm" in defect_details or "failed withdrawal" in defect_details:
        custom_items.append("Official ATM dispute form submitted to the bank within 30 days of the incident")
        custom_items.append("Request letter submitted to bank for preserving CCTV footage of the ATM booth for the transaction time")
        
    if "email" in defect_details or "chat" in defect_details or "customer support" in defect_details:
        custom_items.append("Printed copies of email trails and chat transcripts with the customer support team showing reference ticket numbers")
        
    if "notice" in defect_details or "legal notice" in defect_details:
        custom_items.append("Office copy of the legal notice sent to the respondent along with original speed post receipt and delivery report")

    # Combine lists, avoiding duplicates
    final_checklist = []
    seen = set()
    for item in base_checklist + custom_items:
        if item.lower() not in seen:
            seen.add(item.lower())
            final_checklist.append(item)
            
    return final_checklist
