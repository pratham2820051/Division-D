import json
import re
from langchain_core.prompts import PromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
import google.generativeai as genai
from data.consumer_protection_act import CPA_2019_KNOWLEDGE
from data.complaint_schemas import DOMAIN_SCHEMAS

def parse_json_markdown(text: str) -> dict:
    """
    Cleans up and parses JSON content from LLM output, handling markdown blocks or formatting issues.
    """
    text = text.strip()
    # Remove markdown code blocks if present
    if text.startswith("```"):
        match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text)
        if match:
            text = match.group(1).strip()
            
    # Find the outermost curly braces
    try:
        start_idx = text.index('{')
        end_idx = text.rindex('}') + 1
        text = text[start_idx:end_idx]
    except ValueError:
        pass
        
    return json.loads(text)

def get_available_models(api_key: str) -> list:
    """
    Fetches the list of models that support generateContent using the user's API key.
    Returns a fallback list if fetching fails.
    """
    fallback_models = [
        "gemini-2.5-flash", 
        "gemini-2.0-flash", 
        "gemini-1.5-flash-8b", 
        "gemini-1.5-flash",
        "gemini-1.5-pro"
    ]
    if not api_key:
        return fallback_models
    try:
        genai.configure(api_key=api_key)
        models = []
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                name = m.name.replace('models/', '')
                models.append(name)
        if models:
            return models
    except Exception as e:
        print(f"Error listing models: {e}")
    return fallback_models

# Fallback checking and initialization
def get_gemini_client(api_key: str, model_name: str = "gemini-2.5-flash"):
    """
    Initializes and returns a ChatGoogleGenerativeAI model.
    """
    if not api_key:
        raise ValueError("Google Gemini API Key is missing. Please provide it in the sidebar.")
    
    return ChatGoogleGenerativeAI(
        model=model_name,
        google_api_key=api_key,
        temperature=0.2
    )

def extract_entities_from_text(api_key: str, domain: str, text: str, current_entities: dict = None, model_name: str = "gemini-2.5-flash") -> dict:
    """
    Calls Gemini to extract entities for a given domain from the user's text or chat history.
    """
    schema = DOMAIN_SCHEMAS.get(domain, {})
    entities_desc = json.dumps(schema.get("required_entities", {}), indent=2)
    
    current_state_str = json.dumps(current_entities, indent=2) if current_entities else "{}"
    
    prompt = f"""
    You are an expert legal entity extractor specializing in Indian Consumer Law (Consumer Protection Act, 2019).
    Your task is to analyze the text provided by the consumer and extract relevant details for the "{domain}" domain.
    
    Here is the list of target fields and what they mean:
    {entities_desc}
    
    Current state of extracted details:
    {current_state_str}
    
    Instructions:
    1. Extract any NEW details that are currently missing (null, empty, or missing) in the current state based on the consumer text.
    2. If the consumer explicitly corrects a previously extracted detail in their text, extract the updated value.
    3. DO NOT output details that are already present and valid in the current state UNLESS the consumer is explicitly correcting them. For all other fields that don't need updating, output null.
    
    If a field is not mentioned or cannot be inferred, output null for that field.
    Ensure dates are in YYYY-MM-DD format if possible. Parse amounts as numbers.
    
    Output ONLY a valid JSON object matching the keys above. Do not include any markdown formatting like ```json or explanations. Only raw JSON.
    
    Consumer text:
    "{text}"
    
    JSON Output:
    """
    
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(model_name)
        response = model.generate_content(prompt)
        data = parse_json_markdown(response.text)
        return data
    except Exception as e:
        print(f"Error extracting entities using {model_name}: {e}")
        # Fallback empty structure
        return {k: None for k in schema.get("required_entities", {})}

def chat_respond(api_key: str, domain: str, chat_history: list, current_entities: dict, model_name: str = "gemini-2.5-flash") -> str:
    """
    Generates a conversational response to guide the user in completing the petition details.
    """
    schema = DOMAIN_SCHEMAS.get(domain, {})
    
    # Calculate missing entities - filter out empty strings and None
    missing_entities = [k.replace('_', ' ').title() for k, v in current_entities.items() if v is None or str(v).strip() == "" or str(v).lower() == "null" or str(v).lower() == "none"]
    
    chat_history_str = ""
    for msg in chat_history[-6:]:  # Keep recent history
        role = "Consumer" if msg["role"] == "user" else "Assistant"
        chat_history_str += f"{role}: {msg['content']}\n"
        
    # Programmatic strict instructions based on details state
    if missing_entities:
        instructions = f"""
        CRITICAL: The following details are STILL MISSING: {", ".join(missing_entities)}.
        You are strictly FORBIDDEN from stating that all information has been gathered.
        You are strictly FORBIDDEN from telling the user that the petition is ready to download.
        Instead, you MUST prompt the user to provide some of the missing details. Keep it conversational and ask for 1 or 2 at a time.
        For example, ask for: {", ".join(missing_entities[:2])}.
        """
    else:
        instructions = """
        SUCCESS: All details have been gathered!
        Let the user know that they can click the "Draft Legal Petition Content" button in the Live Petition Dashboard on the right to view, download, and review the compiled document.
        """

    prompt = f"""
    You are "Antigravity Legal Assistant", an expert AI assistant specializing in the Consumer Protection Act, 2019 of India.
    Your goal is to help the consumer draft a formal complaint petition to the District Consumer Dispute Redressal Commission (DCDRC).
    
    Domain: {schema.get('display_name', domain)}
    
    Current state of extracted details:
    {json.dumps(current_entities, indent=2)}
    
    Missing details we still need to collect:
    {", ".join(missing_entities) if missing_entities else "None (all collected!)"}
    
    Knowledge base of CPA 2019:
    - Defective Goods: Section 2(10)
    - Deficiency in Service: Section 2(11)
    - Unfair Trade Practice: Section 2(47)
    - Product Liability: Section 2(34)
    
    State Instructions:
    {instructions}
    
    Rules for your response:
    1. Be highly professional, empathetic, and encouraging.
    2. Review the chat history and the current extracted details.
    3. Do not overwhelm the user with all questions at once. Ask for 1 or 2 missing details at a time.
    4. If the user asks legal questions about their rights, give brief and accurate advice referencing the Consumer Protection Act 2019.
    
    Chat History:
    {chat_history_str}
    
    Generate your next response:
    """
    
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(model_name)
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        return f"Error in AI Chat response with model {model_name}: {str(e)}. Please check your API key or model selection in the sidebar."

def draft_petition_content(api_key: str, domain: str, entities: dict, calc_results: dict, model_name: str = "gemini-2.5-flash") -> str:
    """
    Drafts the structured petition text in Markdown format.
    """
    schema = DOMAIN_SCHEMAS.get(domain, {})
    cpa_kb = CPA_2019_KNOWLEDGE
    
    # Format entities and calculations for the model
    # Filter out any missing/empty entities so the model doesn't even see them, preventing placeholders
    invalid_values = ["", "none", "null", "n/a", "na", "not specified", "unknown", "not mentioned", "not provided", "not available", "undefined"]
    clean_entities = {k: v for k, v in entities.items() if v is not None and str(v).strip() != "" and str(v).lower() not in invalid_values}
    
    entities_str = json.dumps(clean_entities, indent=2)
    calc_str = json.dumps(calc_results, indent=2)
    
    prompt = f"""
    You are an expert legal draftsman specializing in Indian consumer courts (DCDRC/NCDRC).
    Your task is to write a formal, professional, and comprehensive COMPLAINT PETITION under the Consumer Protection Act, 2019.
    
    CRITICAL INSTRUCTION: I am passing you a JSON of ONLY the collected facts. 
    DO NOT invent, assume, or create placeholders (like [Name], ____, or (if available)) for any information that is not present in the JSON. If a piece of information is missing, structure your sentences so that the information is completely unnecessary.
    
    Use the following details:
    Domain: {domain} ({schema.get('display_name')})
    Collected Entities (ONLY use these, do not ask for or placeholder anything else):
    {entities_str}
    
    Calculations and Compensation Details:
    {calc_str}
    
    Strictly follow this standard legal petition structure. DO NOT print metadata headers like "1. COURT DESIGNATION". Just output the final formatted text using this template:
    
    BEFORE THE DISTRICT CONSUMER DISPUTES REDRESSAL COMMISSION AT [CITY/DISTRICT]
    (Or STATE/NATIONAL based on forum: {calc_results['pecuniary_forum']})
    
    COMPLAINT NO. __________ OF 2026
    
    IN THE MATTER OF:
    
    [Complainant Name]
    [Complainant Address]
    Contact: [Phone] | [Email]
    ... Complainant
    
    VERSUS
    
    [Respondent Name]
    [Respondent Address]
    ... Opposite Party
    
    COMPLAINT PETITION UNDER SECTION 35 OF THE CONSUMER PROTECTION ACT, 2019
    (Adjust section number if State/National Commission)
    
    MOST RESPECTFULLY SHOWETH:
    
    1. FACTS OF THE CASE:
    1.1. [Detailed chronological paragraph 1]
    1.2. [Detailed chronological paragraph 2]
    ...
    
    2. GROUNDS OF COMPLAINT:
    2.1. [Cite Section 2(11) for Deficiency in Service if applicable]
    2.2. [Cite Section 2(47) for Unfair Trade Practice if applicable]
    ...
    
    3. JURISDICTION:
    3.1. Territorial: [State how cause of action arose here under Section 34(2)]
    3.2. Pecuniary: {calc_results['pecuniary_clause']}
    
    4. LIMITATION:
    4.1. The complaint is within the 2-year limitation period under Section 69 of the Act.
    
    5. PRAYER:
    It is, therefore, respectfully prayed that this Hon'ble Commission may be pleased to:
    a) Direct the Opposite Party to [Refund / Replace / Repair]...
    b) Direct the Opposite Party to pay Compensation...
    ...
    
    VERIFICATION
    I, [Complainant Name], do hereby verify that the contents of paragraphs 1 to 5 are true and correct to the best of my knowledge...
    
    CRITICAL INSTRUCTION FOR MISSING DETAILS:
    - If any detail is not in the JSON (like email, phone, dates, or Father's Name/Age), DO NOT use placeholder text like [Missing], [Not Provided], (if available), or D/o [Unknown]. 
    - Simply omit the missing information completely. For example, if Father's Name is not provided, just write the Complainant's name and address. Do not write "S/o [Missing]".
    - If a whole sentence would look broken without the detail, omit the entire sentence.
        
    Ensure the tone is extremely formal, using legal terminology.
    Use bold text (**) for headers (e.g. **VERSUS**, **IN THE MATTER OF:**) and standard Markdown for structure.
    
    Do not include any chat conversations or introductory fluff. Start directly with the court header.
    
    Draft of Petition:
    """
    
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(model_name)
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        return f"Error drafting petition with model {model_name}: {str(e)}. Please check your API key or model selection in the sidebar."
