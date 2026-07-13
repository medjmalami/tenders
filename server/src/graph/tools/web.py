import asyncio

from langchain_core.tools import tool

try:
    from ddgs import DDGS
except ImportError:
    try:
        from duckduckgo_search import DDGS
    except ImportError:
        DDGS = None

try:
    from bs4 import BeautifulSoup
except ImportError:
    BeautifulSoup = None


def _ddg_search(query: str, max_results: int) -> list[dict]:
    """Synchronous DuckDuckGo text search — called via asyncio.to_thread."""
    if DDGS is None:
        raise ImportError(
            "Neither 'ddgs' nor 'duckduckgo_search' is installed. Run: pip install ddgs"
        )
    ddgs = DDGS()
    results: list[dict] = []
    for r in ddgs.text(query, max_results=max_results):
        results.append(
            {
                "title": r.get("title", ""),
                "url": r.get("href") or r.get("url", ""),
                "snippet": r.get("body") or r.get("snippet", ""),
            }
        )
    return results


@tool
async def web_search(query: str, max_results: int = 5) -> list[dict] | str:
    """Search the web using DuckDuckGo.

    Use this to research external context that ZetaBox's internal database
    cannot provide — e.g. background on the tendering administration, specific
    technical standards or regulations referenced in the tender, or
    domain-specific context that helps you write a more informed proposal.

    Do NOT use this to search for ZetaBox's own employees, projects, or
    capabilities — use list_employees / list_projects for those instead.

    Args:
        query: the search query string.
        max_results: maximum number of results to return (default 5, capped at 10).
    """
    max_results = min(max(int(max_results), 1), 10)
    try:
        results = await asyncio.to_thread(_ddg_search, query, max_results)
        if not results:
            return "No search results found."
        return results
    except ImportError as e:
        return str(e)
    except Exception as e:
        return f"Web search error: {e}"


@tool
async def fetch_webpage(url: str, max_chars: int = 8000) -> str:
    """Fetch a web page and return its text content.

    Use this after web_search has returned a relevant URL, to read the full
    page content. HTML pages are parsed to extract readable text (scripts,
    styles, navigation, and other non-content elements are removed).
    Non-HTML content is returned as raw text, truncated to max_chars.

    Always call web_search first to discover URLs — never guess a URL.

    Args:
        url: the full URL to fetch (must include scheme, e.g. https://...).
        max_chars: maximum characters of text to return (default 8000).
    """
    if BeautifulSoup is None:
        return "beautifulsoup4 is not installed. Run: pip install beautifulsoup4"

    import httpx

    try:
        async with httpx.AsyncClient(
            timeout=15.0,
            follow_redirects=True,
            headers={
                "User-Agent": (
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/120.0.0.0 Safari/537.36"
                ),
                "Accept": "text/html,application/xhtml+xml,"
                "application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.7",
                "Accept-Language": "fr,en;q=0.8",
            },
        ) as client:
            resp = await client.get(url)
            resp.raise_for_status()

            content_type = resp.headers.get("content-type", "").lower()

            if "html" in content_type or "<html" in resp.text[:500].lower():
                soup = BeautifulSoup(resp.text, "html.parser")

                for tag in soup(
                    [
                        "script",
                        "style",
                        "nav",
                        "footer",
                        "header",
                        "aside",
                        "noscript",
                        "iframe",
                        "form",
                        "svg",
                    ]
                ):
                    tag.decompose()

                text = soup.get_text(separator="\n", strip=True)

                lines = [line.strip() for line in text.splitlines() if line.strip()]
                text = "\n".join(lines)
            else:
                text = resp.text

            if len(text) > max_chars:
                text = text[:max_chars] + "\n\n...[content truncated]"
            return text

    except httpx.HTTPStatusError as e:
        return f"HTTP {e.response.status_code} error fetching {url}"
    except httpx.RequestError as e:
        return f"Failed to fetch {url}: {e}"
    except Exception as e:
        return f"Fetch error: {e}"
