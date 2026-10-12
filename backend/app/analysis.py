"""Turn raw records into the numbers the score and insights are built on.

Everything here is plain Python (no database, no web framework), so it is easy
to read and to unit-test.
"""
from __future__ import annotations

import datetime as dt
from collections import defaultdict
from dataclasses import dataclass, field

from .categories import CASH_ASSET_TYPE, DEBT_CATEGORY, NEED_CATEGORIES


@dataclass(frozen=True)
class Txn:
    type: str  # "income" | "expense"
    category: str
    amount: float
    date: dt.date


@dataclass(frozen=True)
class Holding:
    id: int
    name: str
    symbol: str | None
    asset_type: str
    invested: float  # quantity x buy price
    value: float  # quantity x current price (entered manually)


# ---------------------------------------------------------------------------
# Dates and the analysis window
# ---------------------------------------------------------------------------
def month_key(day: dt.date) -> str:
    return day.strftime("%Y-%m")


def shift_month(first_of_month: dt.date, delta: int) -> dt.date:
    """Return the first day of the month `delta` months away."""
    index = first_of_month.year * 12 + (first_of_month.month - 1) + delta
    return dt.date(index // 12, index % 12 + 1, 1)


@dataclass
class Window:
    months: int  # number of months that actually contain data
    label: str
    fallback: bool  # True when no complete month was available
    start: dt.date | None = None
    end: dt.date | None = None


def select_window(
    txns: list[Txn], months: int, today: dt.date
) -> tuple[Window, list[Txn]]:
    """Pick the transactions the score is calculated from.

    Rule: the last `months` COMPLETE calendar months. The current month is left
    out because a half-finished month makes savings look better than they are
    (the salary has arrived, the bills have not). If there is no complete month
    yet, fall back to everything recorded so far.
    """
    this_month = today.replace(day=1)
    start = shift_month(this_month, -months)
    in_range = [t for t in txns if start <= t.date < this_month]

    if in_range:
        n = len({month_key(t.date) for t in in_range})
        label = f"Last {n} complete month{'s' if n != 1 else ''}"
        return Window(n, label, False, start, this_month), in_range

    if txns:
        n = len({month_key(t.date) for t in txns})
        label = f"All recorded data ({n} month{'s' if n != 1 else ''})"
        return Window(n, label, True), list(txns)

    return Window(0, "No data yet", True), []


# ---------------------------------------------------------------------------
# Snapshot: the numbers the score and insights share
# ---------------------------------------------------------------------------
@dataclass
class Snapshot:
    months: int
    income_total: float = 0.0
    expense_total: float = 0.0
    needs_total: float = 0.0
    wants_total: float = 0.0
    debt_total: float = 0.0
    expense_by_category: dict[str, float] = field(default_factory=dict)
    monthly_expenses: list[tuple[str, float]] = field(default_factory=list)
    cash_value: float = 0.0
    investments: list[Holding] = field(default_factory=list)  # non-cash only

    @property
    def avg_income(self) -> float:
        return self.income_total / self.months if self.months else 0.0

    @property
    def avg_expenses(self) -> float:
        return self.expense_total / self.months if self.months else 0.0

    @property
    def avg_savings(self) -> float:
        return self.avg_income - self.avg_expenses

    @property
    def savings_rate(self) -> float | None:
        """Share of income that is left over (0.15 = 15%). None without income."""
        if self.income_total <= 0:
            return None
        return (self.income_total - self.expense_total) / self.income_total

    @property
    def investment_value(self) -> float:
        return sum(h.value for h in self.investments)


def build_snapshot(
    window_txns: list[Txn], holdings: list[Holding], months: int
) -> Snapshot:
    snap = Snapshot(months=months)
    by_category: dict[str, float] = defaultdict(float)
    by_month: dict[str, float] = defaultdict(float)

    for t in window_txns:
        if t.type == "income":
            snap.income_total += t.amount
        elif t.type == "expense":
            snap.expense_total += t.amount
            by_category[t.category] += t.amount
            by_month[month_key(t.date)] += t.amount
            if t.category in NEED_CATEGORIES:
                snap.needs_total += t.amount
            else:  # anything that is not a need is treated as a want
                snap.wants_total += t.amount
            if t.category == DEBT_CATEGORY:
                snap.debt_total += t.amount

    snap.expense_by_category = dict(by_category)
    snap.monthly_expenses = sorted(by_month.items())
    snap.cash_value = sum(h.value for h in holdings if h.asset_type == CASH_ASSET_TYPE)
    snap.investments = [h for h in holdings if h.asset_type != CASH_ASSET_TYPE]
    return snap


def category_breakdown(snap: Snapshot) -> list[dict]:
    """Expense categories, biggest first, as monthly averages."""
    rows = []
    for category, total in sorted(
        snap.expense_by_category.items(), key=lambda kv: kv[1], reverse=True
    ):
        rows.append(
            {
                "category": category,
                "total": round(total, 2),
                "monthly_avg": round(total / snap.months, 2) if snap.months else 0.0,
                "share": round(total / snap.expense_total, 4) if snap.expense_total else 0.0,
                "kind": "need" if category in NEED_CATEGORIES else "want",
            }
        )
    return rows


def monthly_trend(txns: list[Txn], today: dt.date, count: int = 6) -> list[dict]:
    """Income / expenses / savings for the last `count` months, including this one."""
    this_month = today.replace(day=1)
    keys = [shift_month(this_month, -i) for i in range(count - 1, -1, -1)]
    income: dict[str, float] = defaultdict(float)
    expenses: dict[str, float] = defaultdict(float)
    for t in txns:
        target = income if t.type == "income" else expenses
        target[month_key(t.date)] += t.amount

    rows = []
    for first in keys:
        key = month_key(first)
        rows.append(
            {
                "month": key,
                "label": first.strftime("%b"),
                "income": round(income[key], 2),
                "expenses": round(expenses[key], 2),
                "savings": round(income[key] - expenses[key], 2),
                "partial": first == this_month,
            }
        )
    return rows


# ---------------------------------------------------------------------------
# Portfolio
# ---------------------------------------------------------------------------
def portfolio_summary(holdings: list[Holding]) -> dict:
    """Totals and allocation for non-cash investments. Cash is reported separately."""
    investments = [h for h in holdings if h.asset_type != CASH_ASSET_TYPE]
    cash_value = sum(h.value for h in holdings if h.asset_type == CASH_ASSET_TYPE)
    cost = sum(h.invested for h in investments)
    value = sum(h.value for h in investments)
    gain = value - cost

    by_type: dict[str, float] = defaultdict(float)
    for h in investments:
        by_type[h.asset_type] += h.value

    allocation = [
        {
            "asset_type": asset_type,
            "value": round(v, 2),
            "weight": round(v / value, 4) if value else 0.0,
        }
        for asset_type, v in sorted(by_type.items(), key=lambda kv: kv[1], reverse=True)
    ]
    weights = {h.id: (h.value / value if value else 0.0) for h in investments}

    return {
        "invested_cost": round(cost, 2),
        "current_value": round(value, 2),
        "gain": round(gain, 2),
        "gain_pct": round(gain / cost * 100, 2) if cost else 0.0,
        "cash_value": round(cash_value, 2),
        "holding_count": len(investments),
        "allocation": allocation,
        "weights": weights,
    }
