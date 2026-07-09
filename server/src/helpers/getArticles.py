from typing import Any

import httpx


async def get_articles(bid_no: int) -> dict[str, Any]:
    url = "https://www.tuneps.tn/api2/portail/vBidCls/lot"

    headers = {
        "Accept": "application/json, text/plain, */*",
    }

    async with httpx.AsyncClient(verify=False) as client:
        response = await client.get(
            url,
            params={"bidNo": bid_no},
            headers=headers,
        )
        response.raise_for_status()
        return response.json()
