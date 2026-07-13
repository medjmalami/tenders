from typing import Annotated, Literal, Optional, TypedDict

from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages
from pydantic import BaseModel


class TenderState(TypedDict):
    tender_raw: dict
    classification: Optional[Literal["acceptable", "rejected", "need_more_data"]]
    tender_brief: Optional[dict]
    enrichment_data: Optional[dict]
    augmented: bool
    messages: Annotated[list[BaseMessage], add_messages]


class TenderClassification(BaseModel):
    classification: Literal["acceptable", "rejected", "need_more_data"]
