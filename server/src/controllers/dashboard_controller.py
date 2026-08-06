import datetime
from datetime import date, timedelta
from typing import Optional
from zoneinfo import ZoneInfo

from fastapi import Depends
from pydantic import BaseModel
from sqlalchemy import and_, case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.session import get_db
from src.models.tender import Tender, TenderStatus


class RecentTenderOut(BaseModel):
    id: int
    name: Optional[str]
    institution: Optional[str]
    deadline: Optional[date]
    status: TenderStatus

    class Config:
        from_attributes = True


class DashboardStatsOut(BaseModel):
    total_tenders: int
    accepted_tenders: int
    due_within_7_days: int
    recent_tenders: list[RecentTenderOut]


async def get_dashboard_stats(db: AsyncSession = Depends(get_db)) -> DashboardStatsOut:

    today = datetime.datetime.now(ZoneInfo("Africa/Tunis")).date()
    week_from_now = today + timedelta(days=7)

    # single round trip: total / accepted / due-within-7-days
    counts_stmt = select(
        func.count().label("total"),
        func.count().filter(Tender.status == TenderStatus.accepted).label("accepted"),
        func.count()
        .filter(
            and_(
                Tender.final_submission_date.isnot(None),
                Tender.final_submission_date.between(today, week_from_now),
            )
        )
        .label("due_soon"),
    )
    counts = (await db.execute(counts_stmt)).one()

    recent_stmt = (
        select(
            Tender.id,
            Tender.bid_name_fr,
            Tender.bid_name_en,
            Tender.bid_name_ar,
            Tender.institution,
            Tender.final_submission_date,
            Tender.status,
        )
        .order_by(
            case(
                (Tender.final_submission_date <= today, 1),
                else_=0,
            ),
            Tender.final_submission_date.asc().nullslast(),
            Tender.id,
        )
        .limit(10)
    )
    recent_rows = (await db.execute(recent_stmt)).all()

    recent_tenders = [
        RecentTenderOut(
            id=row.id,
            name=row.bid_name_fr or row.bid_name_en or row.bid_name_ar,
            institution=row.institution,
            deadline=row.final_submission_date,
            status=row.status,
        )
        for row in recent_rows
    ]

    return DashboardStatsOut(
        total_tenders=counts.total,
        accepted_tenders=counts.accepted,
        due_within_7_days=counts.due_soon,
        recent_tenders=recent_tenders,
    )
