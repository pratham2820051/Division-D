import os
import time
from dotenv import load_dotenv
from groq import Groq

# Load .env file if present
load_dotenv()

class BaseAgent:
    def __init__(self, name, role, goal, backstory):
        self.name = name
        self.role = role
        self.goal = goal
        self.backstory = backstory
        self.client = None
        self.model = "llama3-8b-8192" # standard fast groq model
        self.is_simulated = False
        
        self.init_client()

    def init_client(self, api_key=None):
        """Initializes the Groq client, looking in parameter, then st.session_state, then os.environ."""
        # Try to get from param
        key = api_key
        
        # Try to get from Streamlit session state (if imported inside streamlit app)
        if not key:
            try:
                import streamlit as st
                if "groq_api_key" in st.session_state and st.session_state["groq_api_key"]:
                    key = st.session_state["groq_api_key"]
            except ImportError:
                pass
                
        # Try to get from environment variable
        if not key:
            key = os.getenv("GROQ_API_KEY")
            
        if key and key.strip() and "your_groq_api_key" not in key.lower():
            try:
                self.client = Groq(api_key=key.strip())
                self.is_simulated = False
            except Exception as e:
                print(f"[{self.name}] Error creating Groq client: {e}. Falling back to simulation.")
                self.client = None
                self.is_simulated = True
        else:
            self.client = None
            self.is_simulated = True

    def query_llm(self, system_prompt, user_prompt, max_tokens=1500, temperature=0.7):
        """Helper to query the Groq LLM with retries, falling back to simulation if needed."""
        # Re-verify client just in case the key was added in Streamlit UI mid-session
        self.init_client()
        
        if self.is_simulated or not self.client:
            # Yield simulation message
            time.sleep(1.0) # Simulate thinking delay
            return self.get_simulation_response(user_prompt)

        # Groq actual query
        for attempt in range(3):
            try:
                chat_completion = self.client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    model=self.model,
                    max_tokens=max_tokens,
                    temperature=temperature
                )
                return chat_completion.choices[0].message.content
            except Exception as e:
                print(f"[{self.name}] Groq API Call failed (attempt {attempt+1}): {e}")
                time.sleep(2 ** attempt)
                
        print(f"[{self.name}] All LLM query attempts failed. Falling back to simulation.")
        return self.get_simulation_response(user_prompt)

    def get_simulation_response(self, user_prompt):
        """Fallback mock generator - to be overridden by subclasses with rich dynamic content."""
        return f"[{self.name} Simulation Response] for prompt details: {user_prompt[:100]}..."
