from fastapi import APIRouter

from src.controllers import batch_controller

router = APIRouter()
router.add_api_route("/pipelines", batch_controller.list_batches, methods=["GET"])
