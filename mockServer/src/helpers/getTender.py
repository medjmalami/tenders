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
