from langgraph.graph import END, StateGraph
from langgraph.prebuilt import ToolNode, tools_condition

from src.graph.nodes import (
    augmentation_node,
    augmentation_router,
    drafter_node,
    ranker_node,
    ranker_router,
)
from src.graph.state import TenderState
from src.graph.tools import tools

builder = StateGraph(TenderState)
builder.add_node("ranker", ranker_node)
builder.add_node("augmentation", augmentation_node)
builder.add_node("drafter", drafter_node)
builder.add_node("drafter_tools", ToolNode(tools))

builder.set_entry_point("ranker")

builder.add_conditional_edges(
    "ranker",
    ranker_router,
    {END: END, "augmentation": "augmentation", "drafter": "drafter"},
)

builder.add_conditional_edges(
    "augmentation",
    augmentation_router,
    {"drafter": "drafter", "ranker": "ranker"},
)

builder.add_conditional_edges(
    "drafter",
    tools_condition,
    {"tools": "drafter_tools", END: END},
)
builder.add_edge("drafter_tools", "drafter")

graph = builder.compile()
