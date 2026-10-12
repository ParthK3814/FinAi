"""Unit tests for the score, insights and window logic (no database needed).

Run from backend/:   python -m pytest
"""
import datetime as dt

from app.analysis import (
    Holding, Txn, build_snapshot, monthly_trend, portfolio_summary, select_window, shift_month,
)
from app.demo_data import build_demo_investments, build_demo_transactions
from app.insights import generate_insights
from app.scoring import calculate_score, scale

TODAY = dt.date(2026, 10, 12)


def _snapshot(txns, holdings=(), months=3):
    return build_snapshot(txns, list(holdings), months)


def _demo(today=TODAY):
    txns = [Txn(r["type"], r["category"], r["amount"], r["date"]) for r in build_demo_transactions(today)]
    holdings = [
        Holding(i + 1, r["name"], r["symbol"], r["asset_type"],
                r["quantity"] * r["buy_price"], r["quantity"] * r["current_price"])
        for i, r in enumerate(build_demo_investments(today))
    ]
    return txns, holdings


def test_scale_works_in_both_directions():
    assert abs(scale(0.10, 0.0, 0.20) - 0.5) < 1e-9
    assert abs(scale(0.40, 0.5, 0.30) - 0.5) < 1e-9
    assert scale(-1, 0.0, 0.20) == 0.0
    assert scale(9, 0.0, 0.20) == 1.0


def test_shift_month_crosses_year_boundaries():
    assert shift_month(dt.date(2026, 1, 1), -1) == dt.date(2025, 12, 1)
    assert shift_month(dt.date(2026, 12, 1), 1) == dt.date(2027, 1, 1)


def test_empty_data_scores_zero_without_crashing():
    window, rows = select_window([], 3, TODAY)
    result = calculate_score(_snapshot(rows, months=window.months))
    assert result["score"] == 0
    assert result["grade"] == "At risk"
    assert len(result["components"]) == 5


def test_savings_rate_full_points_at_20_percent():
    txns = [Txn("income", "Salary", 1000, dt.date(2026, 9, 1)),
            Txn("expense", "Housing", 800, dt.date(2026, 9, 2))]
    result = calculate_score(_snapshot(txns, months=1))
    savings = next(c for c in result["components"] if c["key"] == "savings_rate")
    assert savings["points"] == 25


def test_overspending_gets_zero_savings_points_and_a_critical_insight():
    txns = [Txn("income", "Salary", 1000, dt.date(2026, 9, 1)),
            Txn("expense", "Housing", 1200, dt.date(2026, 9, 2))]
    snap = _snapshot(txns, months=1)
    savings = next(c for c in calculate_score(snap)["components"] if c["key"] == "savings_rate")
    assert savings["points"] == 0
    assert any(i["severity"] == "critical" for i in generate_insights(snap, portfolio_summary([])))


def test_single_holding_scores_zero_diversification():
    holdings = [Holding(1, "Only stock", "X", "stock", 100, 100)]
    result = calculate_score(_snapshot([], holdings))
    div = next(c for c in result["components"] if c["key"] == "diversification")
    assert div["points"] == 0


def test_current_month_is_excluded_from_the_window():
    txns = [Txn("income", "Salary", 5000, dt.date(2026, 10, 1)),   # current month
            Txn("income", "Salary", 4000, dt.date(2026, 9, 1))]    # complete month
    window, rows = select_window(txns, 3, TODAY)
    assert window.months == 1 and not window.fallback
    assert sum(t.amount for t in rows) == 4000


def test_falls_back_to_current_month_when_nothing_else_exists():
    txns = [Txn("income", "Salary", 5000, dt.date(2026, 10, 1))]
    window, rows = select_window(txns, 3, TODAY)
    assert window.fallback and len(rows) == 1


def test_demo_data_gives_a_realistic_score_that_is_stable_across_dates():
    scores = set()
    for today in (TODAY, dt.date(2026, 1, 31), dt.date(2026, 3, 1)):
        txns, holdings = _demo(today)
        window, rows = select_window(txns, 3, today)
        scores.add(calculate_score(build_snapshot(rows, holdings, window.months))["score"])
    assert len(scores) == 1
    assert 60 <= scores.pop() <= 90


def test_component_points_add_up_to_the_total():
    txns, holdings = _demo()
    window, rows = select_window(txns, 3, TODAY)
    result = calculate_score(build_snapshot(rows, holdings, window.months))
    assert abs(sum(c["points"] for c in result["components"]) - result["score"]) <= 0.5
    assert sum(c["max_points"] for c in result["components"]) == 100


def test_monthly_trend_marks_current_month_as_partial():
    txns, _ = _demo()
    trend = monthly_trend(txns, TODAY, 6)
    assert len(trend) == 6 and trend[-1]["partial"] and not trend[0]["partial"]
