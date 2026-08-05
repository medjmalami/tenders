import json

from langgraph.graph import END

from src.graph.llm import llm
from src.graph.state import TenderState
from src.graph.utils import parse_classification


def ranker_node(state: TenderState) -> dict:
    """
    Classify the tender. If a Tender Brief is already available (i.e. we're
    re-ranking after augmentation), use the structured brief for a more
    informed decision. Otherwise fall back to the raw JSON.
    """
    tender_brief = state.get("tender_brief")
    if tender_brief:
        context = json.dumps(tender_brief, ensure_ascii=False, indent=2)
        prompt = (
            "You are evaluating whether ZetaBox (a software company in Sfax, "
            "Tunisia) should bid on this tender.\n\n"
            "Use the structured Tender Brief below to classify the tender.\n\n"
            f"Tender Brief:\n{context}\n\n"
            "Classification criteria:\n"
            "- acceptable: the tender is about building software (development, "
            "integration, or implementation of software/IT systems, platforms, "
            "or applications).\n"
            "- rejected: the tender is clearly not about building software "
            "(e.g. construction, catering, medical supplies, hardware "
            "procurement, consulting unrelated to software development).\n"
            "Respond with exactly one word: acceptable or rejected"
        )
    else:
        context = json.dumps(state["tender_raw"], ensure_ascii=False, indent=2)
        prompt = (
            "You are evaluating whether ZetaBox (a software company in Sfax, "
            "Tunisia) should bid on this tender.\n\n"
            f"Raw tender data:\n{context}\n\n"
            "Classification criteria:\n"
            "- acceptable: the tender is about building software (development, "
            "integration, or implementation of software/IT systems, platforms, "
            "or applications).\n"
            "- rejected: the tender is clearly not about building software "
            "(e.g. construction, catering, medical supplies, hardware "
            "procurement, consulting unrelated to software development).\n"
            "- need_more_data: it is not clear or you are not sure whether "
            "the tender involves building software (ambiguous description, "
            "missing critical fields).\n\n"
            "Respond with exactly one word: acceptable, rejected, or "
            "need_more_data."
        )
    response = llm.invoke(prompt)
    classification = parse_classification(str(response.content))
    return {"classification": classification}


def ranker_router(state: TenderState) -> str:
    c = state["classification"]
    augmented = state.get("augmented", False)
    if c == "rejected":
        return END
    if c == "acceptable":
        return "drafter" if augmented else "augmentation"
    # need_more_data
    if augmented:
        return END  # already augmented and still insufficient → stop
    return "augmentation"
