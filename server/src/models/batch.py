from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Integer, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db.base import Base

if TYPE_CHECKING:
    from .tender import Tender


class Batch(Base):
    __tablename__ = "batches"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    run_number: Mapped[int] = mapped_column(Integer, nullable=False)
    tenders_found_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )

    # run date is the date the batch was run
    run_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    # target date is the date the batch fetches tenders for
    target_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    tenders: Mapped[list["Tender"]] = relationship(
        "Tender", back_populates="batch", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Batch id={self.id} run_number={self.run_number}>"
