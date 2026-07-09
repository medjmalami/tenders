import asyncio
import json
from typing import Any

import httpx


async def get_general_info(bid_id: int) -> dict[str, Any]:
    url = f"https://www.tuneps.tn/api2/portail/bid/master/{bid_id}"

    headers = {
        "Accept": "application/json, text/plain, */*",
    }

    async with httpx.AsyncClient(
        verify=False,  # equivalent to curl -k
        timeout=30.0,
    ) as client:
        response = await client.get(
            url,
            headers=headers,
        )

    response.raise_for_status()

    return response.json()


async def main():
    # Adjust this date to one you know has published tenders
    bid: int = 131754

    result = await get_general_info(bid)

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
