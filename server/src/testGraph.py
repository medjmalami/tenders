import asyncio
from pprint import pprint

from src.graph import TenderState, graph

initial_state: TenderState = {
    "tender_raw": {
        "bdRecvEndDt": "2026-08-03 12:00:00.0",
        "bidInstNm": "Ministère de l’Enseignement Supérieur et de la Recherche Scientifique",
        "bidNmEn": "Prestation de service d’hébergement et de restauration dans le\ncadre du projet de rénovation du réseau des ISETs PAR’ISET (CTN-1242)",
        "publicDt": "2026-07-08 14:44:53.690357",
        "publicYn": "Y",
        "bidModSeq": "00",
        "bidNo": "20260700854",
        "bidNmAr": "تقديم خدمات الإيواء والإطعام في إطار مشروع تجديد شبكة المعاهد العليا للدراسات التكنولوجية PAR’ISET (CTN-1242)",
        "bidNmFr": "Prestation de service d’hébergement et de restauration dans le\ncadre du projet de rénovation du réseau des ISETs PAR’ISET (CTN-1242)",
        "epBidMasterId": 131992,
    },
    "classification": None,
    "tender_description": None,
    "enrichment_data": None,
    "augmented": False,
    "messages": [],
}


async def main():
    async for event in graph.astream(initial_state, stream_mode="updates"):
        print("=" * 80)
        pprint(event)


asyncio.run(main())
