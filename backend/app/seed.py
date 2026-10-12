"""Load demo data into the database.

    python -m app.seed            # only if the tables are empty
    python -m app.seed --reset    # wipe both tables and reload the demo data
"""
import sys

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from .database import Base, SessionLocal, engine
from .demo_data import build_demo_investments, build_demo_transactions
from .models import Investment, Transaction


def is_empty(db: Session) -> bool:
    transactions = db.scalar(select(func.count()).select_from(Transaction))
    investments = db.scalar(select(func.count()).select_from(Investment))
    return transactions == 0 and investments == 0


def seed_demo_data(db: Session) -> dict:
    transactions = build_demo_transactions()
    investments = build_demo_investments()
    db.add_all(Transaction(**row) for row in transactions)
    db.add_all(Investment(**row) for row in investments)
    db.commit()
    return {"transactions": len(transactions), "investments": len(investments)}


def reset_demo_data(db: Session) -> dict:
    db.execute(delete(Transaction))
    db.execute(delete(Investment))
    db.commit()
    return seed_demo_data(db)


if __name__ == "__main__":
    Base.metadata.create_all(engine)
    with SessionLocal() as session:
        if "--reset" in sys.argv:
            print("Reset complete:", reset_demo_data(session))
        elif is_empty(session):
            print("Seeded:", seed_demo_data(session))
        else:
            print("Tables already contain data. Use --reset to replace it with demo data.")
