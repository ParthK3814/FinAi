"""FinAI API entry point.

Run from the backend/ folder:   uvicorn app.main:app --reload
Interactive docs:                http://localhost:8000/docs
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import OperationalError

from . import config
from .database import Base, SessionLocal, engine
from .routers import analytics, investments, transactions
from .seed import is_empty, seed_demo_data


@asynccontextmanager
async def lifespan(_: FastAPI):
    try:
        Base.metadata.create_all(engine)  # creates the tables on first run
    except OperationalError as error:
        raise RuntimeError(
            "Could not connect to PostgreSQL. Check DATABASE_URL in your .env file "
            "and make sure the database is running (see README: Database setup)."
        ) from error

    if config.AUTO_SEED:
        with SessionLocal() as db:
            if is_empty(db):
                seed_demo_data(db)
    yield


app = FastAPI(
    title="FinAI API",
    description="Rule-based personal finance analysis and Financial Logic Score.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(transactions.router, prefix="/api")
app.include_router(investments.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")


@app.get("/")
def root():
    return {"name": "FinAI API", "docs": "/docs", "health": "/api/health"}
