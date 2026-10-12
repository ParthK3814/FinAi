"""Read-only endpoints: dashboard, score, insights, portfolio, metadata."""
import datetime as dt

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import config
from ..analysis import (
    Holding,
    Txn,
    build_snapshot,
    category_breakdown,
    monthly_trend,
    portfolio_summary,
    select_window,
)
from ..categories import (
    ASSET_TYPE_LABELS,
    ASSET_TYPES,
    EXPENSE_CATEGORIES,
    INCOME_CATEGORIES,
    NEED_CATEGORIES,
    WANT_CATEGORIES,
)
from ..database import get_db
from ..insights import generate_insights
from ..models import Investment, Transaction
from ..schemas import PortfolioHolding
from ..scoring import calculate_score
from ..seed import reset_demo_data

router = APIRouter(tags=["analytics"])

MonthsParam = Query(3, ge=1, le=12, description="How many recent complete months to analyse.")


def _load_rows(db: Session):
    txns = [
        Txn(t.type, t.category, float(t.amount), t.date)
        for t in db.scalars(select(Transaction))
    ]
    investments = list(db.scalars(select(Investment)))
    holdings = [
        Holding(
            i.id, i.name, i.symbol, i.asset_type,
            float(i.quantity * i.buy_price), float(i.quantity * i.current_price),
        )
        for i in investments
    ]
    return txns, investments, holdings


def _analyse(db: Session, months: int):
    today = dt.date.today()
    txns, investments, holdings = _load_rows(db)
    window, window_txns = select_window(txns, months, today)
    snapshot = build_snapshot(window_txns, holdings, window.months)
    portfolio = portfolio_summary(holdings)
    return today, txns, investments, window, snapshot, portfolio


@router.get("/health")
def health():
    return {"status": "ok"}


@router.get("/meta")
def meta():
    """Categories, asset types and currency, so the frontend forms stay in sync."""
    return {
        "currency": config.CURRENCY,
        "income_categories": INCOME_CATEGORIES,
        "expense_categories": EXPENSE_CATEGORIES,
        "need_categories": NEED_CATEGORIES,
        "want_categories": WANT_CATEGORIES,
        "asset_types": [{"value": v, "label": ASSET_TYPE_LABELS[v]} for v in ASSET_TYPES],
    }


@router.get("/dashboard")
def dashboard(months: int = MonthsParam, db: Session = Depends(get_db)):
    today, txns, _, window, snap, portfolio = _analyse(db, months)
    public_portfolio = {k: v for k, v in portfolio.items() if k != "weights"}
    return {
        "period": {
            "label": window.label,
            "months": window.months,
            "fallback": window.fallback,
            "start": window.start,
            "end": window.end,
        },
        "summary": {
            "avg_monthly_income": round(snap.avg_income, 2),
            "avg_monthly_expenses": round(snap.avg_expenses, 2),
            "avg_monthly_savings": round(snap.avg_savings, 2),
            "savings_rate": None if snap.savings_rate is None else round(snap.savings_rate, 4),
            "investment_value": public_portfolio["current_value"],
            "investment_gain": public_portfolio["gain"],
            "investment_gain_pct": public_portfolio["gain_pct"],
            "cash_value": public_portfolio["cash_value"],
        },
        "monthly_trend": monthly_trend(txns, today, 6),
        "expense_by_category": category_breakdown(snap),
        "portfolio": public_portfolio,
        "score": calculate_score(snap),
        "insights": generate_insights(snap, portfolio, config.CURRENCY),
    }


@router.get("/score")
def score(months: int = MonthsParam, db: Session = Depends(get_db)):
    _, _, _, window, snap, _ = _analyse(db, months)
    result = calculate_score(snap)
    result["period"] = {"label": window.label, "months": window.months}
    return result


@router.get("/insights")
def insights(months: int = MonthsParam, db: Session = Depends(get_db)):
    _, _, _, _, snap, portfolio = _analyse(db, months)
    return generate_insights(snap, portfolio, config.CURRENCY)


@router.get("/portfolio")
def portfolio_view(db: Session = Depends(get_db)):
    _, investments, holdings = _load_rows(db)
    summary = portfolio_summary(holdings)
    weights = summary.pop("weights")
    rows = []
    for inv in investments:
        holding = PortfolioHolding.model_validate(inv)
        holding.weight = round(weights.get(inv.id, 0.0), 4)
        rows.append(holding)
    rows.sort(key=lambda h: h.current_value, reverse=True)
    return {"summary": summary, "holdings": rows}


@router.post("/demo/reset")
def reset_demo(db: Session = Depends(get_db)):
    """Delete everything and reload the demo data."""
    counts = reset_demo_data(db)
    return {"status": "reset", **counts}
