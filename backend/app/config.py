"""Application settings, read from the project-level .env file."""
import os
from pathlib import Path

from dotenv import load_dotenv

# backend/app/config.py -> parents[2] is the FinAI/ project root
PROJECT_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(PROJECT_ROOT / ".env")


def _as_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql+psycopg2://finai:finai@localhost:5432/finai"
)
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]
# Load demo data on startup when the database is empty.
AUTO_SEED = _as_bool("AUTO_SEED", True)
# ISO 4217 code (USD, EUR, INR, ...). Sent to the frontend through /api/meta.
CURRENCY = os.getenv("CURRENCY", "USD").strip().upper() or "USD"
