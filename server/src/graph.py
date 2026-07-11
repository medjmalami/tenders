import asyncio
from typing import Annotated, Literal, Optional, TypedDict

from langchain_core.messages import BaseMessage, HumanMessage
from langchain_core.tools import tool
from langchain_ollama import ChatOllama
from langgraph.graph import END, StateGraph
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition
from pydantic import BaseModel

from helpers import getArticles, getTender


class TenderState(TypedDict):
    tender_raw: dict
    classification: Optional[Literal["acceptable", "rejected", "need_more_data"]]
    tender_description: Optional[str]
    enrichment_data: Optional[dict]
    augmented: bool  # tracks whether augmentation has already run
    messages: Annotated[list[BaseMessage], add_messages]


class TenderClassification(BaseModel):
    classification: Literal["acceptable", "rejected", "need_more_data"]


# ---------- Ollama LLM ----------

llm = ChatOllama(
    model="qwen2.5:7b",
    temperature=0,
)


# ---------- Ranker ----------
def parse_classification(content: str) -> str:
    content = content.lower().strip()

    if "acceptable" in content:
        return "acceptable"

    if "rejected" in content:
        return "rejected"

    if "need_more_data" in content or "need more data" in content:
        return "need_more_data"

    raise ValueError(f"Could not parse classification: {content}")


def ranker_node(state: TenderState) -> dict:
    response = llm.invoke(
        f"Classify this tender as acceptable, rejected, or need_more_data:\n"
        f"{state['tender_raw']}\nDescription so far: {state.get('tender_description')}"
    )
    classification = parse_classification(str(response.content))
    return {"classification": classification}


def ranker_router(state: TenderState) -> str:
    c = state["classification"]
    augmented = state.get("augmented", False)

    if c == "rejected":
        return END
    if c == "acceptable":
        return "drafter" if augmented else "augmentation"
    if augmented:
        return END
    return "augmentation"


# ---------- Augmentation ----------


async def augmentation_node(state: TenderState) -> dict:
    tender_raw = state["tender_raw"]
    bid_master_id = tender_raw["epBidMasterId"]
    bid_no = tender_raw["bidNo"]

    tender_info, articles = await asyncio.gather(
        getTender.get_general_info(bid_master_id),
        getArticles.get_articles(bid_no),
    )

    description = llm.invoke(
        f"Combine these into a tender description:\n{tender_info}\n{articles}"
    ).content

    return {
        "tender_description": description,
        "enrichment_data": {"tender_info": tender_info, "articles": articles},
        "augmented": True,
    }


def augmentation_router(state: TenderState) -> str:
    if state["classification"] == "acceptable":
        return "drafter"
    return "ranker"


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
