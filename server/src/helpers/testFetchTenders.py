import asyncio
import json
from typing import Any

import httpx


async def fetch_tuneps_tenders_by_date(
    date: str,
    offset: int = 0,
    limit: int = 10,
) -> dict[str, Any]:
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


async def main():
    # Adjust this date to one you know has published tenders
    date = "2026-07-08"

    result = await fetch_tuneps_tenders_by_date(date=date, offset=0, limit=10)

    print("=== Raw response keys ===")
    print(list(result.keys()))

    print("\n=== Full response (pretty) ===")
    print(json.dumps(result, indent=2, ensure_ascii=False))  # truncate for readability

    # Try to locate the actual list of tenders - adjust key name once you see the shape above
    for key in ("data", "list", "content", "results"):
        if key in result:
            items = result[key]
            print(f"\n=== Found {len(items)} items under '{key}' ===")
            if items:
                print(json.dumps(items[0], indent=2, ensure_ascii=False))
            break


if __name__ == "__main__":
    asyncio.run(main())
