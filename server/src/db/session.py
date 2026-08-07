import os

from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

load_dotenv()

DATABASE_URL = os.environ["DB_URL"]  # raises loudly if missing, no silent None

engine = create_async_engine(
    DATABASE_URL,
    echo=False,  # logs SQL, turn off in prod
    pool_size=5,
    max_overflow=10,
)
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,  # keeps objects usable after commit, avoids extra queries
)


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
