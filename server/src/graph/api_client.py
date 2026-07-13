import os
from typing import Optional

import httpx
from dotenv import load_dotenv

load_dotenv()

TENDER_DATA_API_URL = os.getenv("TENDER_DATA_API_URL", "http://localhost:8000")


async def get(path: str, params: Optional[dict] = None) -> dict | list | str:
    """GET against the internal Tender Data API, with uniform error handling."""
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
