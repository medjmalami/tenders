from fastapi import FastAPI

from src.routes import mock_routes

app = FastAPI(
    title="Tender Data API",
    description="Static-data API for company projects and employees.",
    version="1.0.0",
)

app.include_router(mock_routes.router)
