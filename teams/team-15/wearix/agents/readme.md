Agentic Customer Support Escalation Handler
Problem Statement:
E-commerce customer support teams handle thousands of complaints with varying complexity.
Build an agentic GenAI system that triages incoming support tickets, autonomously resolves Tier-1
queries (order status, returns), escalates complex cases to appropriate Tier-2 departments with a
contextual brief, and tracks resolution status across a simulated queue.
Expected Deliverables:
• Support ticket queue simulation (10+ sample tickets)
• Tier classification and autonomous Tier-1 resolution
• Escalation brief generation for Tier-2 cases
• Customer response drafts for each ticket
• Resolution dashboard with status tracking (Streamlit)
Suggested Tech Stack:
LangChain Agents, LLM API, Python, Streamlit, pandas, SQLite
Datasets Available:
• Amazon Customer Reviews Dataset — 130 million customer reviews with product and
complaint categories (amazon.com/gp/browse.html?node=18444782011)
• Bitext Customer Support Intent Dataset — 27,000 customer support utterances across 11

domains with intent labels (huggingface.co/datasets/bitext/Bitext-customer-support-llm-
chatbot-training-dataset)

• CFPB Consumer Complaints Dataset — 3 million financial product complaints with narratives
and resolutions (consumerfinance.gov/data-research/consumer-complaints)
• Zendesk Ticket Classification Benchmark — Labelled IT and e-commerce support tickets for
escalation tier prediction (kaggle.com/datasets/tobiasbudig/zendesk-ticket)


My approach is: Hybrid Approach
                    Customer Ticket
                           |
                           v
                 Ticket Intake Agent
                           |
                           v
              ML Classification Model
         (trained on support ticket dataset)
                           |
             +-------------+-------------+
             |                           |
             v                           v
         Tier-1                     Tier-2
             |                           |
             v                           v
     Resolution Agent          Escalation Agent
        (Groq API)                (Groq API)
             |                           |
             +-------------+-------------+
                           |
                           v
                 Status Tracking Agent
                           |
                           v
                    SQLite Database
                           |
                           v
                  Streamlit Dashboard