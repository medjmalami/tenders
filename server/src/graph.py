import asyncio
import os
from typing import Annotated, Literal, Optional, TypedDict

import httpx
from langchain_core.messages import BaseMessage, HumanMessage
from langchain_core.tools import tool
from langchain_ollama import ChatOllama
from langgraph.graph import END, StateGraph
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition
from pydantic import BaseModel

from helpers import getArticles, getTender

TENDER_DATA_API_URL = os.getenv("TENDER_DATA_API_URL", "http://localhost:8000")


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


# ---------- Tender Data API client ----------


async def _get(path: str, params: Optional[dict] = None) -> dict | list | str:
    params = {k: v for k, v in (params or {}).items() if v is not None}
    async with httpx.AsyncClient(base_url=TENDER_DATA_API_URL, timeout=10.0) as client:
        try:
            response = await client.get(path, params=params)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                return f"Not found: {path}"
            return (
                f"API error {e.response.status_code} calling {path}: {e.response.text}"
            )
        except httpx.RequestError as e:
            return f"Failed to reach Tender Data API at {path}: {e}"


# ---------- Drafter tools ----------


@tool
async def list_employees(
    skill: Optional[str] = None,
    position: Optional[str] = None,
    is_active: Optional[bool] = None,
) -> dict | list | str:
    """List ZetaBox employees, optionally filtered by skill, position, or active status.

    Use this to find candidate employees to staff a proposal (e.g. matching a
    required skill like "LangGraph" or a position like "Backend Engineer").
    Returns summaries only (id, position, skills, isActive) — use get_employee_details
    with the id to fetch full details for a specific employee.

    Args:
        skill: filter by a skill, case-insensitive (e.g. "Python")
        position: filter by position, case-insensitive substring (e.g. "engineer")
        is_active: filter by active employment status
    """
    return await _get(
        "/employees",
        {"skill": skill, "position": position, "is_active": is_active},
    )


@tool
async def get_employee_details(employee_id: str) -> dict | list | str:
    """Fetch full details for a single employee by id.

    Use this after list_employees has identified a candidate, to pull complete
    info (e.g. bio, certifications, experience) needed to write them into a proposal.

    Args:
        employee_id: the employee's id, as returned by list_employees
    """
    return await _get(f"/employees/{employee_id}")


@tool
async def list_projects(
    q: Optional[str] = None,
    technology: Optional[str] = None,
    client: Optional[str] = None,
) -> dict | list | str:
    """List past ZetaBox projects, optionally filtered by keyword, technology, or client.

    Use this to find relevant past project references to cite as proof of experience
    in a tender proposal. Returns summaries only (id, name, description) — use
    get_project_details with the id to fetch full details for a specific project.

    Args:
        q: word match in project name or description (e.g. "water monitoring")
        technology: filter by a technology, case-insensitive (e.g. "FastAPI")
        client: filter by client name, case-insensitive substring
    """
    return await _get(
        "/projects",
        {"q": q, "technology": technology, "client": client},
    )


@tool
async def get_project_details(project_id: str) -> dict | list | str:
    """Fetch full details for a single past project by id.

    Use this after list_projects has identified a relevant reference, to pull
    complete info needed to describe it in a proposal.

    Args:
        project_id: the project's id, as returned by list_projects
    """
    return await _get(f"/projects/{project_id}")


tools = [list_employees, get_employee_details, list_projects, get_project_details]
llm_with_tools = llm.bind_tools(tools)


# ---------- Drafter (tool-calling agent) ----------


async def drafter_node(state: TenderState) -> dict:
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

    response = await llm_with_tools.ainvoke(messages)

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
