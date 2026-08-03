from datetime import datetime, timedelta

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from src.graph import graph
from src.graph.state import TenderState
from src.helpers.fetchTenders import fetch_tuneps_tenders_by_date

scheduler = AsyncIOScheduler()


async def scrape_tenders_job():
    date = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
    res = await fetch_tuneps_tenders_by_date(date)

    tenders = res.get("payload", {}).get("data", [])
    print(f"Fetched {len(tenders)} tenders for {date}")

    for tender in tenders:
        initial_state: TenderState = {
            "tender_raw": tender,
            "classification": None,
            "tender_brief": None,
            "enrichment_data": None,
            "augmented": False,
            "messages": [],
        }
        try:
            result = await graph.ainvoke(initial_state)
            print(
                f"""
            Processed tender {tender.get("bidNo")}
            Classification: {result.get("classification")}

            =======================================================================
            {result}
            =======================================================================
            """
            )
        except Exception as e:
            print(f"Failed to process tender {tender.get('bidNo')}: {e}")


def start_scheduler():
    scheduler.add_job(
        scrape_tenders_job,
        trigger=IntervalTrigger(seconds=30),
        id="scrape_tenders",
        replace_existing=True,
        max_instances=1,
    )
    scheduler.start()
