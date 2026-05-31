# team 15

# Agentic Customer Support Escalation Handler

E-commerce customer support teams handle thousands of complaints with varying complexity. This project is an agentic GenAI system that triages incoming support tickets, autonomously resolves Tier-1 queries such as order status and returns, escalates complex cases to the correct Tier-2 department with a contextual brief, and tracks resolution status across a simulated queue.

## Problem statement

Build an agentic support workflow that can:

- Accept incoming customer complaints and support tickets
- Classify each ticket into Tier-1 or Tier-2
- Resolve simple Tier-1 issues automatically
- Escalate complex issues with a short, actionable brief
- Draft a customer-facing response for every ticket
- Track ticket progress in a simulated resolution queue
- Display resolution status in a dashboard

## Expected deliverables

- Support ticket queue simulation with 10+ sample tickets
- Tier classification and autonomous Tier-1 resolution
- Escalation brief generation for Tier-2 cases
- Customer response drafts for each ticket
- Resolution dashboard with status tracking

## Suggested tech stack

- LangChain Agents
- LLM API
- Python
- Streamlit
- pandas
- SQLite

## Datasets available

- Amazon Customer Reviews Dataset — 130 million customer reviews with product and complaint categories
- Bitext Customer Support Intent Dataset — 27,000 customer support utterances across 11 domains with intent labels
- CFPB Consumer Complaints Dataset — 3 million financial product complaints with narratives and resolutions
- Zendesk Ticket Classification Benchmark — labelled IT and e-commerce support tickets for escalation tier prediction

## Approach

The solution follows a hybrid workflow:

Customer Ticket → Ticket Intake Agent → ML Classification Model → Tier-1 / Tier-2

- Tier-1 tickets go to a Resolution Agent using Groq API
- Tier-2 tickets go to an Escalation Agent using Groq API
- Both paths feed into a Status Tracking Agent
- Ticket states are persisted in SQLite
- A Streamlit dashboard presents the queue and resolution progress

## Workflow overview

```text
Customer Ticket
	|
	v
Ticket Intake Agent
	|
	v
ML Classification Model
(trained on support ticket dataset)
	|
   +---+---+
   |       |
   v       v
 Tier-1   Tier-2
   |       |
   v       v
Resolution  Escalation
 Agent       Agent
(Groq API)  (Groq API)
   |       |
   +---+---+
	|
	v
Status Tracking Agent
	|
	v
SQLite Database
	|
	v
Dashboard
```

## Notes

- The queue simulation can be seeded with representative customer issues such as delivery delays, refunds, cancellations, product defects, and payment problems.
- The dashboard should show ticket status, priority, assigned department, and resolution outcome.
- The main focus is reliable triage, contextual escalation, and clear customer communication.