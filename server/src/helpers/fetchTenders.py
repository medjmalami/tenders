from datetime import datetime, timedelta
from typing import Any

import httpx


async def fetch_tuneps_tenders_by_date(
    date: str | None = None,
    offset: int = 0,
    limit: int = 10,
) -> dict[str, Any]:
    if date is None:
        date = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")

    url = "https://www.tuneps.tn/api2/portail/bid/master/data"

    payload = {
        "dataSearch": [
            {"key": "publicDt", "value": date, "specificSearch": ">="},
            {"key": "publicDt", "value": date, "specificSearch": "<="},
        ],
        "pagination": {"offSet": offset, "limit": limit},
        "sort": {"nameCol": "publicDt", "direction": "DESC nulls last"},
    }

    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json, text/plain, */*",
        "Origin": "https://www.tuneps.tn",
        "Referer": "https://www.tuneps.tn/portail/offres",
    }

    async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
        response = await client.post(url, json=payload, headers=headers)
        response.raise_for_status()
        return response.json()
