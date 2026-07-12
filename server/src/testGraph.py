import asyncio
from pathlib import Path
from pprint import pprint

from src.graph import TenderState, graph

initial_state: TenderState = {
    "tender_raw": {
        "bdRecvEndDt": "2026-07-27 10:00:00.0",
        "bidInstNm": "Ministère de l’Environnement",
        "bidNmEn": "acquisition et mise en place d'un logiciel de gestion de workflow",
        "publicDt": "2026-06-24 10:13:59.585618",
        "publicYn": "Y",
        "bidModSeq": "00",
        "bidNo": "20260604972",
        "bidNmAr": "إقتناء وتركيز نظام إدارة المسارات",
        "bidNmFr": "acquisition et mise en place d'un logiciel de gestion de workflow",
        "epBidMasterId": 131204,
    },
    "tender_brief": None,
    "classification": None,
    "enrichment_data": None,
    "augmented": False,
    "messages": [],
}


async def main():
    final_response = None

    async for event in graph.astream(initial_state, stream_mode="updates"):
        print("=" * 80)
        pprint(event)

        # Capture the final drafter response
        if "drafter" in event:
            messages = event["drafter"].get("messages", [])

            if messages:
                final_response = messages[-1]

    if final_response:
        content = final_response.content

        # Gemini sometimes returns content as a list of blocks
        if isinstance(content, list):
            content = "".join(
                block.get("text", "") for block in content if isinstance(block, dict)
            )

        Path("response.md").write_text(
            content,
            encoding="utf-8",
        )

        print("\nSaved proposal to response.md")
    else:
        print("\nNo final response found")


asyncio.run(main())
