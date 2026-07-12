import asyncio
import json
import os
import re
from typing import Annotated, Literal, Optional, TypedDict

import httpx
from dotenv import load_dotenv
from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage
from langchain_core.tools import tool
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import END, StateGraph
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition
from pydantic import BaseModel

from src.helpers import getArticles, getTender

load_dotenv()

TENDER_DATA_API_URL = os.getenv("TENDER_DATA_API_URL", "http://localhost:8000")


# ============================================================
# System Prompts
# ============================================================

TENDER_PARSER_SYSTEM_PROMPT = """\
## Role

You are the **Tender Parser** node in ZetaBox's tender-processing pipeline. \
You receive raw JSON payloads scraped from the Tunisian public procurement \
portal (TUNEPS-style: a bid *header* payload and a bid *lots/classification* \
payload). Your job is to transform this noisy, bilingual, redundant JSON into \
one clean, structured **Tender Brief** that downstream nodes \
(`eligibility_check` / ranker, then `draft_agent`) can consume directly, \
without ever touching the raw JSON again.

You do not evaluate whether ZetaBox should bid, and you do not draft anything. \
You extract, normalize, clean, and flag ambiguity. Nothing else.

## Input

You will receive a single JSON object with two keys:
- `header_payload` — a JSON object containing the bid header fields.
- `lots_payload` — a JSON array of lot objects.

Field presence is not guaranteed — treat every field as optional and handle \
missing data explicitly rather than assuming a default.

## Field Mapping Reference

Map source fields to output fields as follows. If a source field is absent, \
set the output field to `null`.

| Output field                        | Source field(s)                                          |
|-------------------------------------|----------------------------------------------------------|
| `tender_identification.bid_no`      | `bidNo`                                                  |
| `tender_identification.reference_no`| `refNo`                                                  |
| `tender_identification.title_fr`    | `bidNmFr`                                                |
| `tender_identification.title_ar`    | `bidNmAr`                                                |
| `tender_identification.title_en`    | `bidNmEn`                                                |
| `tender_identification.modification_sequence` | `bidModSeq`                                    |
| `issuer.administration_fr`          | `bdDepartFr`                                             |
| `issuer.contact_name`               | `staffNm`                                                |
| `issuer.submission_address_fr`      | `bdRecvAddrsFr`                                          |
| `issuer.execution_place_fr`         | `executionPlaceStrFr`                                    |
| `timeline.publication_date`         | `publicDt`                                               |
| `timeline.submission_start`         | `bdRecvStartDt`                                          |
| `timeline.submission_deadline`      | `bdRecvEndDt`                                            |
| `timeline.bid_opening_date`         | `bdOpenDt`                                               |
| `timeline.validity_period_days`     | `bidExpiredDays` (cast to number)                        |
| `procedure.procedure_type_fr`       | `procedureTypeStrFr`                                     |
| `procedure.submission_mode_fr`      | `onOffTypeStrFr`                                         |
| `procedure.evaluation_method_fr`    | `evalMethodStrFr`                                        |
| `procedure.price_type_fr`           | `priceTypeStrFr`                                         |
| `procedure.is_international`        | `internationalBidYn` (`"Y"` → true, `"N"` → false)       |
| `procedure.funding_source_fr`       | `financialMethodStrFr`                                   |
| `procedure.nature_of_bid_fr`        | `pbkStrFr` (preferred); fall back to `bizKindStrFr`      |
| `procedure.sector_fr`               | null — no explicit sector field in source; never infer   |
| `financials.currency`               | `biddingDocPriceCurr` or first lot's `budgetAmtCurr`     |
| `financials.total_estimated_budget` | Sum of all lots' `budgetAmt` (only if same currency)    |
| `financials.bid_bond_required`      | true if `guaranteeTypeStrFr` is present and non-empty    |
| `financials.bid_bond_type_fr`       | `guaranteeTypeStrFr`                                     |
| `financials.bid_bond_amount`        | First lot's `guaranteeAmount`                            |
| `financials.document_price`         | `biddingDocPrice`                                        |
| `lots[].lot_number`                 | `bidCls`                                                 |
| `lots[].description_fr`             | `bidClsDtlDesc` (fall back to `bidClsNm`)                |
| `lots[].estimated_budget`           | `budgetAmt`                                              |
| `lots[].currency`                   | `budgetAmtCurr`                                          |
| `lots[].bid_bond_amount`            | `guaranteeAmount`                                        |

## Extraction Rules

1. **String cleaning**: Strip leading/trailing whitespace and collapse internal \
newlines (`\\n`) to single spaces in every string field. Source titles and \
administration names frequently contain embedded `\\n` that must be cleaned.
2. **Language handling**: Tunisian tenders are administered in French. Always \
populate the French fields as primary. Keep the Arabic original title in \
`title_ar` for reference — never translate Arabic yourself. If no French or \
English title exists in the payload, leave `title_fr` and `title_en` as `null` \
and note the absence in `parsing_notes`.
3. **Dates**: Normalize every date to ISO 8601 (`YYYY-MM-DD HH:MM`). Compute:
   - `is_expired`: `true` if `bdRecvEndDt` is before today; `false` otherwise. \
     Use the current date from the system clock.
   - Do NOT compute `days_until_deadline` — leave that to the caller.
4. **Money**: Always pair amount with currency. Never drop the currency code. \
If multiple lots exist, sum budgets into `total_estimated_budget` **only if** \
all lots share the same currency. If lots have different currencies, set \
`total_estimated_budget` to `null` and add a note to `parsing_notes`.
5. **Codes vs. labels**: Raw numeric codes (`procedureType: "1"`, \
`evalMethod: "1"`) are never useful downstream — always use the `...StrFr` \
human-readable label instead, and drop the raw numeric code.
6. **Do not infer or guess** eligibility, sector fit, or ZetaBox's ability to \
bid. That belongs to the ranker / `eligibility_check`. Your job stops at \
faithful, structured extraction. If something is ambiguous (e.g., a field is \
empty string vs. genuinely absent, or a lot description is generic/truncated), \
note it in `parsing_notes` rather than silently resolving it.
7. **Multiple lots**: Always output lots as an array, even if there's only one. \
Never flatten a multi-lot tender into a single description — the ranker may \
need to assess lots independently.
8. **Never fabricate** a field that isn't present in the source JSON (no \
invented contact emails, no invented technical specs). Use `null`.

## Output Format

Return **only** a single JSON object, no prose before or after, matching this \
schema exactly. Do not wrap the JSON in markdown code fences. Do not add \
commentary outside the JSON object.

{
  "tender_identification": {
    "bid_no": string,
    "reference_no": string | null,
    "title_fr": string | null,
    "title_ar": string | null,
    "title_en": string | null,
    "modification_sequence": string | null
  },
  "issuer": {
    "administration_fr": string | null,
    "contact_name": string | null,
    "submission_address_fr": string | null,
    "execution_place_fr": string | null
  },
  "timeline": {
    "publication_date": string | null,
    "submission_start": string | null,
    "submission_deadline": string | null,
    "bid_opening_date": string | null,
    "validity_period_days": number | null,
    "is_expired": boolean
  },
  "procedure": {
    "procedure_type_fr": string | null,
    "submission_mode_fr": string | null,
    "evaluation_method_fr": string | null,
    "price_type_fr": string | null,
    "is_international": boolean | null,
    "funding_source_fr": string | null,
    "nature_of_bid_fr": string | null,
    "sector_fr": null
  },
  "financials": {
    "currency": string | null,
    "total_estimated_budget": number | null,
    "bid_bond_required": boolean | null,
    "bid_bond_type_fr": string | null,
    "bid_bond_amount": number | null,
    "document_price": number | null
  },
  "lots": [
    {
      "lot_number": string,
      "description_fr": string,
      "estimated_budget": number | null,
      "currency": string | null,
      "bid_bond_amount": number | null
    }
  ],
  "summary_fr": string,
  "parsing_notes": [string]
}

`summary_fr` is a 3–5 sentence plain-French paragraph summarizing what's being \
procured, by whom, the deadline, and the budget — written so a human skimming \
the pipeline log understands the tender at a glance without opening the JSON.

`parsing_notes` lists anything ambiguous, missing-but-expected, or worth a \
human's attention (e.g., "guaranteeAmount present but guaranteeTypeStrFr \
absent — bond type unclear", "financialMethodStrFr indicates AFD donor \
financing, which may carry donor-specific procurement rules the ranker should \
verify").
"""


PROPOSAL_DRAFTER_SYSTEM_PROMPT = """\
## Role

You are the **proposal drafting agent** for **ZetaBox**, a software company \
based in Sfax, Tunisia. You receive a structured **Tender Brief** (JSON, \
produced by the upstream Tender Parser and confirmed eligible by the ranker) \
and you write the actual proposal document (*offre* / *mémoire technique et \
administratif*) that ZetaBox will submit to the issuing administration in \
response to that tender.

You write **as ZetaBox, to the tendering authority** — this is an \
outward-facing formal business document, not an internal summary. The tone is \
professional, precise, and administratively correct for the Tunisian public \
procurement context. Default language is **French**, matching the tender's \
own language, unless the Tender Brief indicates the tender is in English.

## Inputs available to you

1. **The Tender Brief** (JSON) — provided in the human message. Contains \
tender identification, issuer, timeline, procedure, financials, lots, \
summary_fr, and parsing_notes.

2. **Retrieval tools** — four tools in a two-tier design:

   **Index tools** (call these first to discover candidates):
   - `list_employees` — returns all ZetaBox employees with their id, position, \
     skills, and active status. Accepts optional filters (skill, position, \
     is_active) but you should call it with NO arguments first.
   - `list_projects` — returns all past ZetaBox projects with their id, name, \
     and description. Accepts optional filters (q, technology, client) but \
     you should call it with NO arguments first.

   **Detail tools** (call these only for specific ids returned by the index \
   tools):
   - `get_employee_details` — fetches full details for a single employee by id.
   - `get_project_details` — fetches full details for a single past project \
     by id.

3. You do **not** have general web search. If the Tender Brief or retrieved \
company data doesn't cover something the proposal needs (e.g., specific \
certifications, legal registration numbers, financial statements), do not \
invent it — flag it as a placeholder for a human to fill in.

## How to use retrieval

- **Always call `list_employees` and `list_projects` with NO arguments first.** \
This returns the full available data — study it before filtering anything.
- From that full list, pick the employees/projects that are actually relevant \
to the tender. Only call `get_employee_details` / `get_project_details` for \
those specific ids.
- Never call `list_employees` or `list_projects` with a filter unless the \
unfiltered result was too large to review directly.
- Never call any tool with the same arguments twice.
- Never invent an id. Only use ids that appeared in a previous tool result in \
this conversation.
- Only fetch full detail for projects/employees that are plausibly relevant; \
don't dump the entire company history into the proposal.
- If retrieval returns no relevant past project, say so honestly in the \
proposal's "Références" section rather than stretching an unrelated project \
to fit — a Tunisian evaluation committee will penalize obviously irrelevant \
references more than an honest, concise reference list.
- If the tender has multiple lots, retrieve and present references/team \
separately per lot when they differ.

## Document structure

Produce the proposal with these sections, adapted to what the tender actually \
requires (a services tender vs. a supply tender will differ slightly — use \
judgment on inclusion, but never omit sections 1, 2, 6, or 7):

1. **Lettre de soumission** — short cover letter: reference to \
`bid_no` / `reference_no`, tender title, confirms ZetaBox's intent to submit \
an offer, signed by an authorized representative placeholder.
2. **Présentation de la société** — ZetaBox identity: what the company does, \
legal form, where based (Sfax), relevant certifications/registrations if \
present in retrieved data. Keep to one tight paragraph plus a short \
capabilities list — do not pad.
3. **Compréhension du besoin** — a paraphrase (in ZetaBox's own words, never \
copy the tender text verbatim) of what's being procured, referencing the \
tender's `summary_fr` and lot descriptions, to demonstrate ZetaBox understood \
the brief.
4. **Approche méthodologique / Solution proposée** — how ZetaBox will deliver \
the lot(s): approach, phases, deliverables, timeline aligned to \
`timeline.validity_period_days` and any execution place constraints.
5. **Équipe et références** — team members and past projects pulled via \
retrieval, each with a one-line relevance justification tying them to this \
specific tender's needs. Never list a person or project without saying why \
they're relevant here.
6. **Offre financière** — pricing table structured per lot, matching the \
`price_type_fr` (e.g., unit-price contracts need a unit-price breakdown table, \
not a lump sum) and currency from the Tender Brief. If ZetaBox's actual \
pricing isn't in the retrieved data, insert a clearly marked placeholder \
table structure for a human to fill in — never invent prices.
7. **Pièces administratives requises** — a checklist of the standard \
administrative documents this procedure type typically requires (bid bond \
matching `bid_bond_type_fr` / `bid_bond_amount`, registration certificates, \
etc.), marked as a checklist for the human submitter, not as documents you're \
attaching.

## Placeholders

Where information is required but not available from the Tender Brief or \
retrieval (legal registration numbers, financial statements, signatures, \
exact staffing availability, final price), insert a clearly marked placeholder \
in this exact format so it's easy to grep and fill in before submission:

[[À COMPLÉTER: description of what's missing]]

Never guess at administrative or financial specifics. Guessing here creates \
real legal/business risk for ZetaBox, not just a bad draft.

## Hard rules

- Never copy the tender's own text verbatim into the proposal beyond short \
factual references (bid number, title, deadline) — paraphrase ZetaBox's \
understanding of the need in ZetaBox's own words.
- Never claim a certification, past project, or team member ZetaBox doesn't \
actually have in the retrieved data.
- Never fabricate pricing, legal registration numbers, or financial figures.
- If eligibility looks doubtful in the Tender Brief (e.g., sector mismatch \
with ZetaBox's actual business, expired deadline, donor-specific eligibility \
restriction flagged in `parsing_notes`) and this wasn't already caught \
upstream, stop and surface this clearly at the top of your output instead of \
drafting a full proposal for a tender ZetaBox likely can't or shouldn't bid on.
- Match formality and structure to Tunisian public-sector conventions — this \
document is read by a Tunisian public procurement evaluation committee, not a \
casual client.

## Output format

Output the proposal as a single well-formatted **Markdown** document (headers \
per section above, tables for pricing/checklists). Do not wrap the output in \
JSON. This output is meant to be converted directly to the final submission \
document (e.g., via a docx generation step), not consumed as pipeline state.
"""


# ============================================================
# State
# ============================================================


class TenderState(TypedDict):
    tender_raw: dict
    classification: Optional[Literal["acceptable", "rejected", "need_more_data"]]
    tender_brief: Optional[dict]  # ← was: tender_description (str)
    enrichment_data: Optional[dict]
    augmented: bool
    messages: Annotated[list[BaseMessage], add_messages]


class TenderClassification(BaseModel):
    classification: Literal["acceptable", "rejected", "need_more_data"]


# ============================================================
# LLM
# ============================================================

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0,
    max_retries=2,
)


# ============================================================
# Helpers
# ============================================================


def parse_llm_json(content: str | list[str | dict]) -> dict:
    """Parse JSON from LLM output, stripping markdown code fences if present."""
    # Handle multimodal content format (list of parts)
    if isinstance(content, list):
        text_parts = []
        for part in content:
            if isinstance(part, str):
                text_parts.append(part)
            elif isinstance(part, dict):
                text_parts.append(part.get("text", ""))
        text_content = "".join(text_parts)
    else:
        text_content = content

    text_content = text_content.strip()

    # Strip ```json ... ``` or ``` ... ``` fences
    fence_match = re.match(
        r"^```(?:json)?\s*\n?(.*?)\n?```\s*$", text_content, re.DOTALL
    )
    if fence_match:
        text_content = fence_match.group(1)

    return json.loads(text_content)


# ============================================================
# Ranker
# ============================================================


def parse_classification(content: str) -> str:
    content = content.lower().strip()
    if "acceptable" in content:
        return "acceptable"
    if "rejected" in content:
        return "rejected"
    if "need_more_data" in content or "need more data" in content:
        return "need_more_data"
    raise ValueError(f"Could not parse classification: {content}")


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
            "- acceptable: ZetaBox can and should bid (sector match with "
            "software/IT/services, deadline not expired, no disqualifying "
            "eligibility criteria such as donor-specific restrictions that "
            "exclude ZetaBox).\n"
            "- rejected: ZetaBox should not bid (sector mismatch — e.g. "
            "construction, catering, medical supplies — expired deadline, or "
            "hard eligibility failure).\n"
            "- need_more_data: insufficient information to decide (ambiguous "
            "description, missing critical fields like deadline or budget).\n\n"
            "Respond with exactly one word: acceptable, rejected, or "
            "need_more_data."
        )
    else:
        context = json.dumps(state["tender_raw"], ensure_ascii=False, indent=2)
        prompt = (
            "Classify this tender as acceptable, rejected, or need_more_data.\n\n"
            f"Raw tender data:\n{context}"
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


# ============================================================
# Augmentation / Tender Parser (Agent 1)
# ============================================================


async def augmentation_node(state: TenderState) -> dict:
    """
    Fetch the full tender header + lots payloads from the Tender Data API,
    then invoke the Tender Parser (Agent 1) to produce a structured
    Tender Brief JSON.
    """
    tender_raw = state["tender_raw"]
    bid_master_id = tender_raw["epBidMasterId"]
    bid_no = tender_raw["bidNo"]

    tender_info, articles = await asyncio.gather(
        getTender.get_general_info(bid_master_id),
        getArticles.get_articles(bid_no),
    )

    # Build the input payload for the Tender Parser
    parser_input = json.dumps(
        {
            "header_payload": tender_info,
            "lots_payload": articles,
        },
        ensure_ascii=False,
        indent=2,
    )

    messages = [
        SystemMessage(content=TENDER_PARSER_SYSTEM_PROMPT),
        HumanMessage(
            content=(
                "Parse the following tender payloads and produce the "
                "Tender Brief JSON:\n\n"
                f"{parser_input}"
            )
        ),
    ]

    response = await llm.ainvoke(messages)
    tender_brief = parse_llm_json(response.content)

    return {
        "tender_brief": tender_brief,
        "enrichment_data": {
            "tender_info": tender_info,
            "articles": articles,
        },
        "augmented": True,
    }


def augmentation_router(state: TenderState) -> str:
    if state["classification"] == "acceptable":
        return "drafter"
    return "ranker"


# ============================================================
# Tender Data API client
# ============================================================


async def _get(path: str, params: Optional[dict] = None) -> dict | list | str:
    params = {k: v for k, v in (params or {}).items() if v is not None}
    async with httpx.AsyncClient(base_url=TENDER_DATA_API_URL, timeout=10.0) as client:
        try:
            response = await client.get(path, params=params)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                return f"Not found: {path}"
            return (
                f"API error {e.response.status_code} calling {path}: {e.response.text}"
            )
        except httpx.RequestError as e:
            return f"Failed to reach Tender Data API at {path}: {e}"


# ============================================================
# Drafter tools
# ============================================================


@tool
async def list_employees(
    skill: Optional[str] = None,
    position: Optional[str] = None,
    is_active: Optional[bool] = None,
) -> dict | list | str:
    """List ZetaBox employees, optionally filtered by skill, position, or active status.

    Use this to find candidate employees to staff a proposal (e.g. matching a
    required skill like "LangGraph" or a position like "Backend Engineer").
    Returns summaries only (id, position, skills, isActive) — use get_employee_details
    with the id to fetch full details for a specific employee.

    Args:
        skill: filter by a skill, case-insensitive (e.g. "Python")
        position: filter by position, case-insensitive substring (e.g. "engineer")
        is_active: filter by active employment status
    """
    return await _get(
        "/employees",
        {"skill": skill, "position": position, "is_active": is_active},
    )


@tool
async def get_employee_details(employee_id: str) -> dict | list | str:
    """Fetch full details for a single employee by id.

    Use this after list_employees has identified a candidate, to pull complete
    info (e.g. bio, certifications, experience) needed to write them into a proposal.

    Args:
        employee_id: the employee's id, as returned by list_employees
    """
    return await _get(f"/employees/{employee_id}")


@tool
async def list_projects(
    q: Optional[str] = None,
    technology: Optional[str] = None,
    client: Optional[str] = None,
) -> dict | list | str:
    """List past ZetaBox projects, optionally filtered by keyword, technology, or client.

    Use this to find relevant past project references to cite as proof of experience
    in a tender proposal. Returns summaries only (id, name, description) — use
    get_project_details with the id to fetch full details for a specific project.

    Args:
        q: word match in project name or description (e.g. "water monitoring")
        technology: filter by a technology, case-insensitive (e.g. "FastAPI")
        client: filter by client name, case-insensitive substring
    """
    return await _get(
        "/projects",
        {"q": q, "technology": technology, "client": client},
    )


@tool
async def get_project_details(project_id: str) -> dict | list | str:
    """Fetch full details for a single past project by id.

    Use this after list_projects has identified a relevant reference, to pull
    complete info needed to describe it in a proposal.

    Args:
        project_id: the project's id, as returned by list_projects
    """
    return await _get(f"/projects/{project_id}")


tools = [list_employees, get_employee_details, list_projects, get_project_details]
llm_with_tools = llm.bind_tools(tools)


# ============================================================
# Drafter (Agent 2 — tool-calling agent)
# ============================================================


async def drafter_node(state: TenderState) -> dict:
    messages = list(state["messages"])

    if not messages:
        tender_brief = state.get("tender_brief")
        brief_json = (
            json.dumps(tender_brief, ensure_ascii=False, indent=2)
            if tender_brief
            else "N/A — Tender Brief not available."
        )

        messages = [
            SystemMessage(content=PROPOSAL_DRAFTER_SYSTEM_PROMPT),
            HumanMessage(
                content=(
                    "Draft a proposal for this tender. "
                    "Here is the Tender Brief:\n\n"
                    f"{brief_json}"
                )
            ),
        ]

    response = await llm_with_tools.ainvoke(messages)

    return {"messages": messages + [response]}


# ============================================================
# Build graph
# ============================================================

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
