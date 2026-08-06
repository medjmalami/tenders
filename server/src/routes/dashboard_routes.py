from fastapi import APIRouter

from src.controllers import dashboard_controller

router = APIRouter()
router.add_api_route(
    "/stats", dashboard_controller.get_dashboard_stats, methods=["GET"]
)
