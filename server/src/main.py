from contextlib import asynccontextmanager

from fastapi import FastAPI

from src.routes import dashboard_routes, mock_routes, tender_routes
from src.scheduler import scheduler, start_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup
    start_scheduler()
    yield
    # shutdown
    scheduler.shutdown(wait=False)


app = FastAPI(
    title="Tender Data API",
    description="Static-data API for company projects and employees.",
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(mock_routes.router)
app.include_router(dashboard_routes.router)
app.include_router(tender_routes.router)
