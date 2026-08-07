from datetime import datetime

from fastapi import Depends, Query
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.session import get_db
from src.models.batch import Batch


class LatestBatchOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    run_number: int
    run_date: datetime
    tenders_found_count: int
    tenders_failed_count: int


class BatchListItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    run_number: int
    tenders_found_count: int
    tenders_failed_count: int
    run_date: datetime
    target_date: datetime


class BatchesPageOut(BaseModel):
    latest: LatestBatchOut | None
    batches: list[BatchListItemOut]
    page: int
    limit: int


PAGE_SIZE = 10


async def list_batches(
    page: int = Query(1, ge=1, description="Page number, 1-indexed"),
    db: AsyncSession = Depends(get_db),
):
    # Latest batch — most recent run
    latest_stmt = select(Batch).order_by(Batch.run_date.desc()).limit(1)
    latest_result = await db.execute(latest_stmt)
    latest_batch = latest_result.scalar_one_or_none()

    # Paginated batches
    offset = (page - 1) * PAGE_SIZE
    batches_stmt = (
        select(Batch).order_by(Batch.run_date.desc()).offset(offset).limit(PAGE_SIZE)
    )
    batches_result = await db.execute(batches_stmt)
    batches = batches_result.scalars().all()

    return BatchesPageOut(
        latest=LatestBatchOut.model_validate(latest_batch) if latest_batch else None,
        batches=[BatchListItemOut.model_validate(b) for b in batches],
        page=page,
        limit=PAGE_SIZE,
    )
