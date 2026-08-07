import enum
from datetime import date, datetime
from typing import Optional

from sqlalchemy import (
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy import (
    Enum as SAEnum,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db.base import Base

from .batch import Batch


class TenderStatus(str, enum.Enum):
    accepted = "accepted"
    rejected = "rejected"
    needs_more_data = "needs_more_data"


class Tender(Base):
    __tablename__ = "tenders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    batch_id: Mapped[int] = mapped_column(ForeignKey("batches.id"), nullable=False)

    bid_num: Mapped[str] = mapped_column(String, nullable=False)
    bid_master_num: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    bid_name_ar: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    bid_name_fr: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    bid_name_en: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    scraped_data: Mapped[dict] = mapped_column(JSONB, nullable=False)

    status: Mapped[TenderStatus] = mapped_column(
        SAEnum(TenderStatus, name="tender_status"),
        nullable=False,
        default=TenderStatus.needs_more_data,
        server_default=TenderStatus.needs_more_data.value,
    )

    date_published: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    final_submission_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    institution: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    general_info: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    lots_info: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    llm_merged_object: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    llm_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    proposal_ai_generated: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    batch: Mapped["Batch"] = relationship("Batch", back_populates="tenders")

    def __repr__(self) -> str:
        return f"<Tender id={self.id} bid_num={self.bid_num} status={self.status}>"
