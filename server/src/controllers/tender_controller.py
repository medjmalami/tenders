from datetime import date, datetime
from typing import Optional

from fastapi import Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.session import get_db
from src.models.tender import Tender, TenderStatus


class TenderRead(BaseModel):
    id: int
    batch_id: int
    bid_num: str
    bid_master_num: Optional[str]
    bid_name_ar: Optional[str]
    bid_name_fr: Optional[str]
    bid_name_en: Optional[str]
    scraped_data: dict
    status: TenderStatus
    date_published: Optional[date]
    final_submission_date: Optional[date]
    institution: Optional[str]
    general_info: Optional[dict]
    lots_info: Optional[dict]
    llm_merged_object: Optional[dict]
    llm_summary: Optional[str]
    proposal_ai_generated: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
    # updated_at and proposal_final intentionally excluded


class TenderListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: Optional[str]
    institution: Optional[str]
    deadline: Optional[date]
    status: TenderStatus


class TenderListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    tenders: list[TenderListItem]


PAGE_SIZE = 10


async def list_tenders(
    limit: int = Query(
        PAGE_SIZE, ge=1, le=PAGE_SIZE, description="Capped at page size (10)"
    ),
    offset: int = Query(0, ge=0),
    statuses: Optional[list[TenderStatus]] = Query(None),
    institution: Optional[str] = Query(None),
    deadline_from: Optional[date] = Query(None),
    deadline_to: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db),
) -> TenderListResponse:
    filters = []

    if statuses:
        filters.append(Tender.status.in_(statuses))
    if institution:
        filters.append(Tender.institution.ilike(f"%{institution}%"))
    if deadline_from:
        filters.append(Tender.final_submission_date >= deadline_from)
    if deadline_to:
        filters.append(Tender.final_submission_date <= deadline_to)

    count_stmt = select(func.count()).select_from(Tender)
    if filters:
        count_stmt = count_stmt.where(*filters)
    total = (await db.execute(count_stmt)).scalar_one()

    stmt = (
        select(Tender)
        .where(*filters)
        .order_by(
            case(
                (Tender.final_submission_date <= date.today(), 1),
                else_=0,
            ),
            Tender.final_submission_date.asc().nullslast(),
            Tender.id,
        )
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(stmt)
    tenders = result.scalars().all()

    items = [
        TenderListItem(
            id=t.id,
            name=t.bid_name_fr or t.bid_name_en or t.bid_name_ar or t.bid_num,
            institution=t.institution,
            deadline=t.final_submission_date,
            status=t.status,
        )
        for t in tenders
    ]

    return TenderListResponse(
        total=total,
        page=(offset // PAGE_SIZE) + 1,
        page_size=PAGE_SIZE,
        tenders=items,
    )


async def get_tender(tender_id: int, db: AsyncSession = Depends(get_db)) -> TenderRead:
    result = await db.execute(
        select(
            Tender.id,
            Tender.batch_id,
            Tender.bid_num,
            Tender.bid_master_num,
            Tender.bid_name_ar,
            Tender.bid_name_fr,
            Tender.bid_name_en,
            Tender.scraped_data,
            Tender.status,
            Tender.date_published,
            Tender.final_submission_date,
            Tender.institution,
            Tender.general_info,
            Tender.lots_info,
            Tender.llm_merged_object,
            Tender.llm_summary,
            Tender.proposal_ai_generated,
            Tender.created_at,
        ).where(Tender.id == tender_id)
    )

    tender = result.one_or_none()

    if tender is None:
        raise HTTPException(status_code=404, detail=f"Tender {tender_id} not found")

    return TenderRead(
        id=tender.id,
        batch_id=tender.batch_id,
        bid_num=tender.bid_num,
        bid_master_num=tender.bid_master_num,
        bid_name_ar=tender.bid_name_ar,
        bid_name_fr=tender.bid_name_fr,
        bid_name_en=tender.bid_name_en,
        scraped_data=tender.scraped_data,
        status=tender.status,
        date_published=tender.date_published,
        final_submission_date=tender.final_submission_date,
        institution=tender.institution,
        general_info=tender.general_info,
        lots_info=tender.lots_info,
        llm_merged_object=tender.llm_merged_object,
        llm_summary=tender.llm_summary,
        proposal_ai_generated=tender.proposal_ai_generated,
        created_at=tender.created_at,
    )
