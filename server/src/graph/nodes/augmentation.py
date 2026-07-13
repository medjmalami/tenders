import asyncio
import json

from langchain_core.messages import HumanMessage, SystemMessage

from src.graph.llm import llm
from src.graph.prompts import TENDER_PARSER_SYSTEM_PROMPT
from src.graph.state import TenderState
from src.graph.utils import parse_llm_json
from src.helpers import getArticles, getTender


async def augmentation_node(state: TenderState) -> dict:
    """
    Fetch the full tender header + lots payloads from the Tender Data API,
    then invoke the Tender Parser (Agent 1) to produce a structured
    Tender Brief JSON.
    """
    tender_raw = state["tender_raw"]
    bid_master_id = tender_raw["epBidMasterId"]
    bid_no = tender_raw["bidNo"]

    tender_info, articles = await asyncio.gather(
        getTender.get_general_info(bid_master_id),
        getArticles.get_articles(bid_no),
    )

    parser_input = json.dumps(
        {
            "header_payload": tender_info,
            "lots_payload": articles,
        },
        ensure_ascii=False,
        indent=2,
    )

    messages = [
        SystemMessage(content=TENDER_PARSER_SYSTEM_PROMPT),
        HumanMessage(
            content=(
                "Parse the following tender payloads and produce the "
                "Tender Brief JSON:\n\n"
                f"{parser_input}"
            )
        ),
    ]

    response = await llm.ainvoke(messages)
    tender_brief = parse_llm_json(response.content)

    return {
        "tender_brief": tender_brief,
        "enrichment_data": {
            "tender_info": tender_info,
            "articles": articles,
        },
        "augmented": True,
    }


def augmentation_router(state: TenderState) -> str:
    if state["classification"] == "acceptable":
        return "drafter"
    return "ranker"
