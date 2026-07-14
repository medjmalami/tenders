"""LLM client configuration.

Two backends are wired up: a local Ollama model (kept for offline/free
iteration) and Gemini 2.5 Flash via `langchain-google-genai`. `llm` is the
active model used throughout the pipeline — swap the assignment below to
switch backends.
"""

from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_ollama import ChatOllama

load_dotenv()


ollama_llm = ChatOllama(
    model="qwen2.5:7b",
    temperature=0,
)

google_llm = ChatGoogleGenerativeAI(
    model="gemini-3.1-flash-lite",
    temperature=0,
    max_retries=2,
)

# Active model for the pipeline. Swap to `ollama_llm` to run fully local.
llm = google_llm
