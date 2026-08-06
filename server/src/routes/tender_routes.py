from fastapi import APIRouter

from src.controllers import tender_controller

router = APIRouter()
router.add_api_route("/tenders", tender_controller.list_tenders, methods=["GET"])
router.add_api_route(
    "/tenders/{tender_id}", tender_controller.get_tender, methods=["GET"]
)
