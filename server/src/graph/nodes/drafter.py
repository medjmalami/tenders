import json

from langchain_core.messages import HumanMessage, SystemMessage

from src.graph.llm import llm
from src.graph.prompts import PROPOSAL_DRAFTER_SYSTEM_PROMPT
from src.graph.state import TenderState
from src.graph.tools import tools

llm_with_tools = llm.bind_tools(tools)


async def drafter_node(state: TenderState) -> dict:
    existing = state["messages"]

    if not existing:
        tender_brief = state.get("tender_brief")
        brief_json = (
            json.dumps(tender_brief, ensure_ascii=False, indent=2)
            if tender_brief
            else "N/A"
        )
        new_messages = [
            SystemMessage(content=PROPOSAL_DRAFTER_SYSTEM_PROMPT),
            HumanMessage(
                content=f"Draft a proposal for this tender. Here is the Tender Brief:\n\n{brief_json}"
            ),
        ]
        response = await llm_with_tools.ainvoke(new_messages)
        return {"messages": new_messages + [response]}

    response = await llm_with_tools.ainvoke(existing)
    return {"messages": [response]}  # only the new message
