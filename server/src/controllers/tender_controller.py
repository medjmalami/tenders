from datetime import date
from typing import Optional

from fastapi import Depends, Query
from pydantic import BaseModel, ConfigDict
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.session import get_db
from src.models.tender import Tender, TenderStatus


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
