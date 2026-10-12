"""CRUD endpoints for income and expense transactions."""
import datetime as dt
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..analysis import shift_month
from ..database import get_db
from ..models import Transaction
from ..schemas import TransactionIn, TransactionOut

router = APIRouter(prefix="/transactions", tags=["transactions"])


def _get_or_404(db: Session, transaction_id: int) -> Transaction:
    transaction = db.get(Transaction, transaction_id)
    if transaction is None:
        raise HTTPException(status_code=404, detail="Transaction not found.")
    return transaction


@router.get("", response_model=list[TransactionOut])
def list_transactions(
    type: Optional[Literal["income", "expense"]] = None,
    category: Optional[str] = None,
    month: Optional[str] = Query(None, pattern=r"^\d{4}-(0[1-9]|1[0-2])$", description="YYYY-MM"),
    limit: int = Query(500, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    stmt = select(Transaction)
    if type:
        stmt = stmt.where(Transaction.type == type)
    if category:
        stmt = stmt.where(Transaction.category == category)
    if month:
        year, mon = (int(part) for part in month.split("-"))
        first = dt.date(year, mon, 1)
        stmt = stmt.where(Transaction.date >= first, Transaction.date < shift_month(first, 1))
    stmt = stmt.order_by(Transaction.date.desc(), Transaction.id.desc()).limit(limit).offset(offset)
    return db.scalars(stmt).all()


@router.post("", response_model=TransactionOut, status_code=201)
def create_transaction(payload: TransactionIn, db: Session = Depends(get_db)):
    transaction = Transaction(**payload.model_dump())
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


@router.get("/{transaction_id}", response_model=TransactionOut)
def get_transaction(transaction_id: int, db: Session = Depends(get_db)):
    return _get_or_404(db, transaction_id)


@router.put("/{transaction_id}", response_model=TransactionOut)
def update_transaction(transaction_id: int, payload: TransactionIn, db: Session = Depends(get_db)):
    transaction = _get_or_404(db, transaction_id)
    for field, value in payload.model_dump().items():
        setattr(transaction, field, value)
    db.commit()
    db.refresh(transaction)
    return transaction


@router.delete("/{transaction_id}", status_code=204)
def delete_transaction(transaction_id: int, db: Session = Depends(get_db)):
    db.delete(_get_or_404(db, transaction_id))
    db.commit()
    return Response(status_code=204)
