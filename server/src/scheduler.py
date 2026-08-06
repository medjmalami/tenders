from datetime import datetime
from typing import Optional

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from langchain_core.messages import AIMessage
from sqlalchemy import func, select

from src.db.session import AsyncSessionLocal
from src.graph import graph
from src.graph.state import TenderState
from src.helpers.fetchTenders import fetch_tuneps_tenders_by_date
from src.models.batch import Batch
from src.models.tender import Tender, TenderStatus

scheduler = AsyncIOScheduler()

# TenderState.classification -> TenderStatus
CLASSIFICATION_TO_STATUS = {
    "acceptable": TenderStatus.accepted,
    "rejected": TenderStatus.rejected,
    "need_more_data": TenderStatus.needs_more_data,
}


def _parse_date(value: Optional[str]):
    """Tuneps dates look like '2026-06-24 10:13:59.585618' or '2026-07-27 10:00:00.0'."""
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.split(".")[0]).date()
    except (ValueError, AttributeError):
        return None


def _extract_proposal(messages: list) -> Optional[str]:
    """
    Pull the drafter's final proposal out of the graph's message list.
    Walk backwards and return the first AIMessage with non-empty string
    content (earlier AIMessages are typically tool-call steps with empty
    content; content can also arrive as a list of content blocks, which
    we don't expect here but guard against anyway).
    """
    for msg in reversed(messages or []):
        if isinstance(msg, AIMessage) and isinstance(msg.content, str) and msg.content:
            return msg.content
    return None


async def _next_run_number(session) -> int:
    result = await session.execute(select(func.max(Batch.run_number)))
    max_run = result.scalar()
    return (max_run or 0) + 1


async def _create_batch(target_date: datetime, tenders_found_count: int) -> Batch:
    async with AsyncSessionLocal() as session:
        run_number = await _next_run_number(session)
        batch = Batch(
            run_number=run_number,
            tenders_found_count=tenders_found_count,
            target_date=target_date,
        )
        session.add(batch)
        await session.commit()
        await session.refresh(batch)
        return batch


async def _save_tender(result: dict, batch_id: int) -> None:
    tender_raw = result["tender_raw"] or {}
    tender_brief = result["tender_brief"] or {}
    enrichment_data = result["enrichment_data"] or {}
    classification = result["classification"]
    messages = result["messages"] or []

    status = CLASSIFICATION_TO_STATUS.get(
        classification or "", TenderStatus.needs_more_data
    )

    llm_summary = tender_brief.get("summary_fr") if tender_brief else None
    llm_merged_object = (
        {k: v for k, v in tender_brief.items() if k != "summary_fr"}
        if tender_brief
        else None
    )

    tender = Tender(
        batch_id=batch_id,
        bid_num=tender_raw.get("bidNo"),
        bid_master_num=(
            str(tender_raw["epBidMasterId"])
            if tender_raw.get("epBidMasterId") is not None
            else None
        ),
        bid_name_ar=tender_raw.get("bidNmAr"),
        bid_name_fr=tender_raw.get("bidNmFr"),
        bid_name_en=tender_raw.get("bidNmEn"),
        scraped_data=tender_raw,
        status=status,
        date_published=_parse_date(tender_raw.get("publicDt")),
        final_submission_date=_parse_date(tender_raw.get("bdRecvEndDt")),
        institution=tender_raw.get("bidInstNm"),
        general_info=enrichment_data.get("tender_info") if enrichment_data else None,
        lots_info=enrichment_data.get("articles") if enrichment_data else None,
        llm_merged_object=llm_merged_object,
        llm_summary=llm_summary,
        proposal_ai_generated=_extract_proposal(messages),
    )

    async with AsyncSessionLocal() as session:
        session.add(tender)
        await session.commit()


async def scrape_tenders_job():
    date = "2026-06-24"
    # date = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
    res = await fetch_tuneps_tenders_by_date(date)
    tenders = res.get("payload", {}).get("data", [])
    print(f"Fetched {len(tenders)} tenders for {date}")

    target_date = datetime.strptime(date, "%Y-%m-%d")
    batch = await _create_batch(target_date, len(tenders))

    processed = 0
    saved = 0
    failed_processing = 0
    failed_saving = 0

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
            processed += 1
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
            failed_processing += 1
            print(f"Failed to process tender {tender.get('bidNo')}: {e}")
            continue

        try:
            await _save_tender(result, batch.id)
            saved += 1
        except Exception as e:
            failed_saving += 1
            print(f"Failed to save tender {tender.get('bidNo')} to DB: {e}")

    print(f"""
    ================================================================================
    ✅ BATCH COMPLETED

    Batch ID            : {batch.id}
    Run Number          : {batch.run_number}
    Target Date         : {date}

    Tenders Fetched     : {len(tenders)}
    Successfully Processed : {processed}
    Successfully Saved     : {saved}

    Processing Failures : {failed_processing}
    Database Failures   : {failed_saving}

    Finished At         : {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
    ================================================================================
    """)


def start_scheduler():
    scheduler.add_job(
        scrape_tenders_job,
        trigger=CronTrigger(hour=3, minute=0),
        id="scrape_tenders",
        replace_existing=True,
        max_instances=1,
    )
    scheduler.start()
