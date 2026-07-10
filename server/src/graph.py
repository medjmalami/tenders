from typing import Annotated, Literal, Optional, TypedDict

import httpx
from langchain_core.messages import BaseMessage, HumanMessage
from langchain_core.tools import tool
from langchain_ollama import ChatOllama
from langgraph.graph import END, StateGraph
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition


class TenderState(TypedDict):
    tender_raw: dict
    classification: Optional[Literal["acceptable", "rejected", "need_more_data"]]
    tender_description: Optional[str]
    enrichment_data: Optional[dict]
    augmented: bool  # tracks whether augmentation has already run
    messages: Annotated[list[BaseMessage], add_messages]


# ---------- Ollama LLM ----------

llm = ChatOllama(
    model="qwen2.5:14b",
    temperature=0,
)

# ---------- Ranker ----------


def ranker_node(state: TenderState) -> dict:
    response = llm.invoke(
        f"Classify this tender as acceptable, rejected, or need_more_data:\n"
        f"{state['tender_raw']}\nDescription so far: {state.get('tender_description')}"
    )
    classification = parse_classification(
        response.content
    )  # your parser/structured output
    return {"classification": classification}


def ranker_router(state: TenderState) -> str:
    c = state["classification"]
    augmented = state.get("augmented", False)

    if c == "rejected":
        return END
    if c == "acceptable":
        # first pass: still needs enrichment before drafting
        # second pass (already augmented): go straight to drafter
        return "drafter" if augmented else "augmentation"
    # need_more_data
    if augmented:
        # already gathered extra data once, nothing left to fetch
        return END
    return "augmentation"


# ---------- Augmentation ----------


async def augmentation_node(state: TenderState) -> dict:
    async with httpx.AsyncClient() as client:
        resp1 = await client.get("https://api.example.com/endpoint1", timeout=10)
        resp2 = await client.get("https://api.example.com/endpoint2", timeout=10)

    description = llm.invoke(
        f"Combine these into a tender description:\n{resp1.json()}\n{resp2.json()}"
    ).content

    return {
        "tender_description": description,
        "enrichment_data": {"call1": resp1.json(), "call2": resp2.json()},
        "augmented": True,
    }


def augmentation_router(state: TenderState) -> str:
    # uses the classification the ranker stored before augmentation ran
    if state["classification"] == "acceptable":
        return "drafter"
    return "ranker"  # need_more_data -> re-classify with the enriched description


# ---------- Drafter (tool-calling agent) ----------


@tool
def get_employee_data(role: str) -> dict:
    """Fetch employee data matching a role for the proposal."""
    ...


@tool
def get_project_data(keywords: str) -> dict:
    """Fetch past ZetaBox project references matching keywords."""
    ...


tools = [get_employee_data, get_project_data]
llm_with_tools = llm.bind_tools(tools)


def drafter_node(state: TenderState) -> dict:
    messages = state["messages"]

    if not messages:
        messages = [
            HumanMessage(
                content=f"""
Draft a proposal for this tender:

{state["tender_description"]}
"""
            )
        ]

    response = llm_with_tools.invoke(messages)

    return {"messages": [response]}


# ---------- Build graph ----------

builder = StateGraph(TenderState)
builder.add_node("ranker", ranker_node)
builder.add_node("augmentation", augmentation_node)
builder.add_node("drafter", drafter_node)
builder.add_node("drafter_tools", ToolNode(tools))

builder.set_entry_point("ranker")

builder.add_conditional_edges(
    "ranker",
    ranker_router,
    {END: END, "augmentation": "augmentation", "drafter": "drafter"},
)

builder.add_conditional_edges(
    "augmentation",
    augmentation_router,
    {"drafter": "drafter", "ranker": "ranker"},
)

builder.add_conditional_edges(
    "drafter",
    tools_condition,
    {"tools": "drafter_tools", END: END},
)
builder.add_edge("drafter_tools", "drafter")

graph = builder.compile()
