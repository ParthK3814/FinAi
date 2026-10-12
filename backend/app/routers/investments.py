"""CRUD endpoints for investment holdings (prices are entered manually)."""
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..categories import AssetType
from ..database import get_db
from ..models import Investment
from ..schemas import InvestmentIn, InvestmentOut

router = APIRouter(prefix="/investments", tags=["investments"])


def _get_or_404(db: Session, investment_id: int) -> Investment:
    investment = db.get(Investment, investment_id)
    if investment is None:
        raise HTTPException(status_code=404, detail="Investment not found.")
    return investment


@router.get("", response_model=list[InvestmentOut])
def list_investments(asset_type: Optional[AssetType] = None, db: Session = Depends(get_db)):
    stmt = select(Investment).order_by(Investment.asset_type, Investment.name)
    if asset_type:
        stmt = stmt.where(Investment.asset_type == asset_type)
    return db.scalars(stmt).all()


@router.post("", response_model=InvestmentOut, status_code=201)
def create_investment(payload: InvestmentIn, db: Session = Depends(get_db)):
    investment = Investment(**payload.model_dump())
    db.add(investment)
    db.commit()
    db.refresh(investment)
    return investment


@router.get("/{investment_id}", response_model=InvestmentOut)
def get_investment(investment_id: int, db: Session = Depends(get_db)):
    return _get_or_404(db, investment_id)


@router.put("/{investment_id}", response_model=InvestmentOut)
def update_investment(investment_id: int, payload: InvestmentIn, db: Session = Depends(get_db)):
    investment = _get_or_404(db, investment_id)
    for field, value in payload.model_dump().items():
        setattr(investment, field, value)
    db.commit()
    db.refresh(investment)
    return investment


@router.delete("/{investment_id}", status_code=204)
def delete_investment(investment_id: int, db: Session = Depends(get_db)):
    db.delete(_get_or_404(db, investment_id))
    db.commit()
    return Response(status_code=204)
