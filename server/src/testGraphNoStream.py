import asyncio
from pprint import pprint

from src.graph.graph import TenderState, graph

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
    final_state = await graph.ainvoke(initial_state)

    pprint(final_state)


asyncio.run(main())
