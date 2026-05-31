import re
from agents.base_agent import BaseAgent

class SpeakerAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Speaker Selection Agent",
            role="Professional Academic/Corporate Talent Scout",
            goal="Identify and suggest relevant speakers, panelists, and subject-matter experts aligned perfectly with the event theme, and calculate typical honorarium brackets.",
            backstory="A seasoned talent agent who has curated speakers for top-tier TEDx events, global tech summits, and international academic symposia. You understand who will captivate the target audience."
        )

    def run(self, theme, expected_guests):
        system_prompt = (
            f"You are the {self.name}, working as a {self.role}.\n"
            f"Your Goal: {self.goal}\n"
            f"Backstory: {self.backstory}\n"
            f"Ensure your output is structured in clean Markdown. Recommend exactly 3 high-quality speakers/panelists."
        )
        
        user_prompt = (
            f"Please suggest 3 industry speakers or academic experts to invite for a '{theme}' themed event. "
            f"The expected guest count is {expected_guests} attendees.\n\n"
            f"For each speaker, provide:\n"
            f"1. **Speaker Name & Current Role**\n"
            f"2. **Brief Biography & Background** (academic research, books, or industry achievements)\n"
            f"3. **Proposed Session Title & Format** (e.g., Keynote Talk, Panel Discussion, Hands-on Workshop)\n"
            f"4. **Short Session Abstract**: (1-2 sentences outlining what the talk covers)\n"
            f"5. **Estimated Honorarium / Fee Range (INR)**: Realistic amount in INR for a {expected_guests} audience size."
        )
        
        return self.query_llm(system_prompt, user_prompt)

    def get_simulation_response(self, user_prompt):
        """Simulation fallback with rich templates based on typical input values."""
        theme_match = re.search(r"for a '([^']+)' themed event", user_prompt)
        guests_match = re.search(r"count is (\d+)", user_prompt)
        
        theme = theme_match.group(1) if theme_match else "AI & Technology"
        guests = guests_match.group(1) if guests_match else "100"
        
        # Customize suggestions based on theme
        if "ai" in theme.lower() or "tech" in theme.lower():
            speakers = [
                {
                    "name": "Dr. Aarav Mehta",
                    "role": "Lead Research Scientist, AI Research Institute",
                    "bio": "PhD in Computer Science from IISc Bangalore. Author of 20+ peer-reviewed papers on neural network acceleration and transformer models.",
                    "topic": "Keynote: Demystifying Large Language Models for the Modern Enterprise",
                    "abstract": "A non-technical explanation of how LLMs function under the hood, followed by a guide on implementing scalable Retrieval-Augmented Generation (RAG) pipelines in production ecosystems.",
                    "fee": "INR 45,000 - 65,000"
                },
                {
                    "name": "Ms. Rhea Sharma",
                    "role": "VP of Developer Relations, CloudScale Tech",
                    "bio": "Tech evangelist, community organizer, and open-source contributor. Former software engineer at Meta with a decadelong history in scalable infrastructure.",
                    "topic": "Interactive Panel: Building Autonomous Agent Networks at Scale",
                    "abstract": "Explores how to coordinate multiple autonomous agents to complete complex end-to-end tasks, detailing API communication standards, loop safety, and cost control.",
                    "fee": "INR 30,000 - 45,000"
                },
                {
                    "name": "Dr. Sandeep Patel",
                    "role": "Associate Professor, Department of AI Systems",
                    "bio": "Focuses on AI ethics, explainability, and bias mitigations. Advisor to several national regulatory agencies on algorithmic governance.",
                    "topic": "Fireside Chat: Ethical AI and Governance Frameworks",
                    "abstract": "An investigation of AI safety, copyright standards, and developer responsibilities, providing actionable ethical design frameworks for developer teams.",
                    "fee": "INR 25,000 - 35,000"
                }
            ]
        elif "health" in theme.lower() or "medical" in theme.lower():
            speakers = [
                {
                    "name": "Dr. Ananya Reddy",
                    "role": "Director of Medical Informatics, MedLife Systems",
                    "bio": "MD and PhD in Health Informatics. Pioneer in integrating machine learning diagnostics in rural healthcare networks.",
                    "topic": "Keynote: AI-Driven Diagnostics: Bridging the Rural-Urban Health Gap",
                    "abstract": "A review of how deep learning classifiers are deployed in low-bandwidth environments to analyze medical scans, saving lives in remote communities.",
                    "fee": "INR 40,000 - 60,000"
                },
                {
                    "name": "Mr. Rohan Joshi",
                    "role": "Chief Product Officer, CureTech Labs",
                    "bio": "Healthcare product veteran. Built patient management suites used by over 5 million users globally.",
                    "topic": "Interactive Seminar: Designing Patient-First Digital Health Journeys",
                    "abstract": "Details design requirements for healthcare apps, focusing heavily on patient security, HIPAA compliance, and frictionless telemedicine UI.",
                    "fee": "INR 30,000 - 40,000"
                },
                {
                    "name": "Dr. Meera Sen",
                    "role": "Professor of Bioethics, National Health University",
                    "bio": "Leading academic on the legal and bioethical guidelines surrounding gene editing and synthetic patient data generation.",
                    "topic": "Panel Discussion: Privacy Safeguards in the Era of Genomic Databases",
                    "abstract": "Discusses secure federated learning models and differential privacy standards to protect patient identity in large-scale bioinformatics research.",
                    "fee": "INR 25,000 - 35,000"
                }
            ]
        else:
            # General corporate / academic speakers
            speakers = [
                {
                    "name": "Dr. Priya Gopal",
                    "role": "Dean of Executive Education, Apex Business School",
                    "bio": "Author of 'The Agile Orchestrator'. Advisor to Fortune 100 executives on digital restructuring and cultural transition pipelines.",
                    "topic": "Keynote: Corporate Resilience and Agile Workflows in 2026",
                    "abstract": "Presents structured agile leadership principles to navigate disruptive market fluctuations and build high-performance distributed work teams.",
                    "fee": "INR 50,000 - 70,000"
                },
                {
                    "name": "Mr. Vikram Malhotra",
                    "role": "Managing Partner, GrowthScale Capital",
                    "bio": "Venture capitalist and former founder. Invested in 15+ high-growth scale-ups across fintech, SaaS, and retail logistics.",
                    "topic": "Panel Discussion: Securing Venture Funding in a Muted Market",
                    "abstract": "A transparent look at VC priorities, pitch metrics that matter, and building robust, cash-positive business models that attract institutional funding.",
                    "fee": "INR 40,000 - 55,000"
                },
                {
                    "name": "Ms. Kiara Fernandez",
                    "role": "Founder, GreenWorks Solutions",
                    "bio": "Environmental activist turned entrepreneur. Builds commercial circular waste recycling networks for major industrial parks.",
                    "topic": "Case Study: Scaling Sustainability metrics from Cost to Revenue",
                    "abstract": "Highlights how recycling initiatives and ESG alignment can drive commercial efficiency and positive brand capital for growth companies.",
                    "fee": "INR 25,000 - 35,000"
                }
            ]

        output = f"### 🎤 Speaker Agent Report: Tailored Invites & Panels\n\n"
        output += f"Selected Speaker Board for the event theme **'{theme}'** with **{guests} attendees**:\n\n"
        output += "---\n\n"
        for i, s in enumerate(speakers):
            output += f"#### {i+1}. **{s['name']}**\n"
            output += f"- **Role:** {s['role']}\n"
            output += f"- **Biography:** {s['bio']}\n"
            output += f"- **Proposed Session:** *{s['topic']}*\n"
            output += f"- **Abstract:** {s['abstract']}\n"
            output += f"- **Estimated Honorarium:** {s['fee']} (Inclusive of standard travel coverage)\n\n"
            
        output += "---\n### 📌 Coordinator Notes\n"
        output += f"All three profiles have strong background alignment in the **{theme}** space. We recommend beginning outreach with **{speakers[0]['name']}** for the opening keynote to maximize ticket traction and agenda momentum."
        return output
