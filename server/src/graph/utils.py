import json
import re


def parse_llm_json(content: str | list[str | dict]) -> dict:
    """Parse JSON from LLM output, tolerating inconsistent markdown fencing.

    LLMs don't reliably wrap JSON in clean, fully-matched ```json ... ```
    fences — sometimes the opening fence is missing, sometimes there's a
    trailing note or stray closing fence after the object. This strips
    fence markers wherever they appear (not just as a full-string match),
    then falls back to `raw_decode`, which parses the first valid JSON
    value and ignores any trailing garbage instead of raising
    `JSONDecodeError: Extra data`.
    """
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

    # Strip a leading ```json / ``` fence if present, regardless of what
    # (if anything) follows the matching closing fence.
    text_content = re.sub(r"^```(?:json)?\s*\n?", "", text_content)
    # Strip a trailing fence if present.
    text_content = re.sub(r"\n?```\s*$", "", text_content)
    text_content = text_content.strip()

    try:
        return json.loads(text_content)
    except json.JSONDecodeError:
        # Fall back to parsing just the first valid JSON value and
        # ignoring any trailing content (extra prose, stray fences, etc.)
        obj, _end_index = json.JSONDecoder().raw_decode(text_content)
        return obj


def parse_classification(content: str) -> str:
    content = content.lower().strip()
    if "acceptable" in content:
        return "acceptable"
    if "rejected" in content:
        return "rejected"
    if "need_more_data" in content or "need more data" in content:
        return "need_more_data"
    raise ValueError(f"Could not parse classification: {content}")
