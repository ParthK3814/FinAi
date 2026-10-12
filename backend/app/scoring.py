"""The Financial Logic Score.

A transparent, rule-based score out of 100. No machine learning, no live market
data: five rules, each worth a fixed number of points, each a simple straight
line between "no points" and "full points".

    Savings rate       25   save 20% of income or more for full points
    Spending balance   20   keep "wants" at 30% of income or less
    Emergency fund     20   hold 6 months of expenses in cash
    Diversification    20   spread money across asset types, avoid one big bet
    Debt burden        15   keep loan payments at 10% of income or less

Change a threshold below and the whole app (score, insights, score page) follows.
"""
from __future__ import annotations

from .analysis import Snapshot

# ---- Thresholds (edit these to change the rules) ---------------------------
SAVINGS_FULL, SAVINGS_ZERO = 0.20, 0.0  # savings rate
WANTS_FULL, WANTS_ZERO = 0.30, 0.50  # wants as a share of income
EMERGENCY_FULL_MONTHS = 6.0
DIVERSIFICATION_CLASSES_FULL, DIVERSIFICATION_CLASSES_ZERO = 4, 1
TOP_HOLDING_FULL, TOP_HOLDING_ZERO = 0.20, 0.60  # largest single holding's share
DEBT_FULL, DEBT_ZERO = 0.10, 0.40  # debt payments as a share of income

MAX_POINTS = {
    "savings_rate": 25,
    "spending_balance": 20,
    "emergency_fund": 20,
    "diversification": 20,
    "debt_burden": 15,
}

GRADE_BANDS = [
    {"min": 80, "grade": "Strong", "meaning": "Healthy habits across the board."},
    {"min": 60, "grade": "Stable", "meaning": "Solid base with a few clear gaps."},
    {"min": 40, "grade": "Developing", "meaning": "Some good habits, several weak spots."},
    {"min": 0, "grade": "At risk", "meaning": "Finances need attention soon."},
]


def clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
    return max(low, min(high, value))


def scale(value: float, zero_at: float, full_at: float) -> float:
    """Straight line from 0 (at `zero_at`) to 1 (at `full_at`), capped at both ends.

    Works whether higher or lower is better:
        scale(0.10, zero_at=0.0, full_at=0.20) -> 0.5     (higher is better)
        scale(0.40, zero_at=0.5, full_at=0.30) -> 0.5     (lower is better)
    """
    if full_at == zero_at:
        return 1.0 if value >= full_at else 0.0
    return clamp((value - zero_at) / (full_at - zero_at))


def _pct(value: float) -> str:
    return f"{value * 100:.1f}%"


def _component(
    key: str,
    label: str,
    fraction: float,
    value_display: str,
    target: str,
    rule: str,
    explanation: str,
) -> dict:
    max_points = MAX_POINTS[key]
    fraction = clamp(fraction)
    status = "good" if fraction >= 0.8 else "ok" if fraction >= 0.5 else "needs_work"
    return {
        "key": key,
        "label": label,
        "points": round(max_points * fraction, 1),
        "max_points": max_points,
        "value_display": value_display,
        "target": target,
        "rule": rule,
        "status": status,
        "explanation": explanation,
    }


# ---------------------------------------------------------------------------
# The five rules
# ---------------------------------------------------------------------------
def savings_rate_rule(s: Snapshot) -> dict:
    rate = s.savings_rate
    target = "Save 20% of income or more for full points."
    rule = "25 x (savings rate / 20%), between 0 and 25. Savings rate = (income - expenses) / income."
    if rate is None:
        return _component(
            "savings_rate", "Savings rate", 0.0, "No income recorded", target, rule,
            "Add income records so a savings rate can be calculated.",
        )
    fraction = scale(rate, SAVINGS_ZERO, SAVINGS_FULL)
    if rate < 0:
        why = "You are spending more than you earn, which scores zero here."
    elif rate >= SAVINGS_FULL:
        why = "You are saving at or above the 20% benchmark."
    else:
        why = f"Reaching 20% would earn the remaining {25 - round(25 * fraction, 1):.1f} points."
    return _component(
        "savings_rate", "Savings rate", fraction, f"{_pct(rate)} of income", target, rule, why
    )


def spending_balance_rule(s: Snapshot) -> dict:
    target = "Keep wants (dining, shopping, travel, ...) at 30% of income or less."
    rule = "20 at 30% or lower, falling in a straight line to 0 at 50% of income."
    if s.income_total <= 0:
        return _component(
            "spending_balance", "Spending balance", 0.0, "No income recorded", target, rule,
            "Add income records so spending can be compared to income.",
        )
    share = s.wants_total / s.income_total
    fraction = scale(share, WANTS_ZERO, WANTS_FULL)
    if share <= WANTS_FULL:
        why = "Discretionary spending is within the 30% guide."
    else:
        why = "Discretionary spending is above the 30% guide, so points are reduced."
    return _component(
        "spending_balance", "Spending balance", fraction,
        f"{_pct(share)} of income on wants", target, rule, why,
    )


def emergency_fund_rule(s: Snapshot) -> dict:
    target = "Hold 6 months of expenses in cash or savings."
    rule = "20 x (months covered / 6), between 0 and 20. Months covered = cash / average monthly expenses."
    monthly = s.avg_expenses
    if monthly <= 0:
        if s.cash_value > 0:
            return _component(
                "emergency_fund", "Emergency fund", 1.0, "Cash held, no expenses recorded",
                target, rule, "No expenses are recorded, so the cash you hold counts as fully covered.",
            )
        return _component(
            "emergency_fund", "Emergency fund", 0.0, "No cash or expenses recorded",
            target, rule, "Add a cash holding in the portfolio to track your emergency fund.",
        )
    months_covered = s.cash_value / monthly
    fraction = months_covered / EMERGENCY_FULL_MONTHS
    if months_covered >= EMERGENCY_FULL_MONTHS:
        why = "Your cash covers six months or more of expenses."
    elif months_covered >= 3:
        why = "A reasonable cushion; six months earns full points."
    else:
        why = "Under three months of cover is thin. This is usually the quickest rule to improve."
    return _component(
        "emergency_fund", "Emergency fund", fraction,
        f"{months_covered:.1f} months covered", target, rule, why,
    )


def diversification_rule(s: Snapshot) -> dict:
    target = "Hold 4 or more asset types and keep any single holding under 20% of investments."
    rule = (
        "20 x average of two parts: (asset types - 1) / 3, and "
        "(60% - largest holding share) / 40%. Each part is capped between 0 and 1. Cash is excluded."
    )
    total = s.investment_value
    if total <= 0 or not s.investments:
        return _component(
            "diversification", "Diversification", 0.0, "No investments recorded",
            target, rule, "Add investment holdings to measure diversification.",
        )
    classes = len({h.asset_type for h in s.investments})
    top = max(s.investments, key=lambda h: h.value)
    top_share = top.value / total
    class_part = scale(classes, DIVERSIFICATION_CLASSES_ZERO, DIVERSIFICATION_CLASSES_FULL)
    holding_part = scale(top_share, TOP_HOLDING_ZERO, TOP_HOLDING_FULL)
    fraction = 0.5 * class_part + 0.5 * holding_part
    if fraction >= 0.8:
        why = "Money is spread across several asset types with no dominant holding."
    elif top_share > 0.35:
        why = f"{top.name} makes up {_pct(top_share)} of your investments, which drags the score down."
    else:
        why = "Adding another asset type would improve the spread."
    return _component(
        "diversification", "Diversification", fraction,
        f"{classes} asset type{'s' if classes != 1 else ''}, largest holding {_pct(top_share)}",
        target, rule, why,
    )


def debt_burden_rule(s: Snapshot) -> dict:
    target = "Keep loan and EMI payments at 10% of income or less."
    rule = "15 at 10% or lower, falling in a straight line to 0 at 40% of income."
    if s.income_total <= 0:
        return _component(
            "debt_burden", "Debt burden", 0.0, "No income recorded", target, rule,
            "Add income records so debt payments can be compared to income.",
        )
    ratio = s.debt_total / s.income_total
    fraction = scale(ratio, DEBT_ZERO, DEBT_FULL)
    if s.debt_total == 0:
        why = "No debt payments recorded in this period."
    elif ratio <= DEBT_FULL:
        why = "Debt payments are comfortably small compared to income."
    else:
        why = "Debt payments take a large share of income."
    return _component(
        "debt_burden", "Debt burden", fraction, f"{_pct(ratio)} of income", target, rule, why
    )


# ---------------------------------------------------------------------------
# Total
# ---------------------------------------------------------------------------
def grade_for(score: int) -> dict:
    for band in GRADE_BANDS:
        if score >= band["min"]:
            return band
    return GRADE_BANDS[-1]


def calculate_score(s: Snapshot) -> dict:
    components = [
        savings_rate_rule(s),
        spending_balance_rule(s),
        emergency_fund_rule(s),
        diversification_rule(s),
        debt_burden_rule(s),
    ]
    total = int(round(sum(c["points"] for c in components)))
    band = grade_for(total)
    return {
        "score": total,
        "max_score": 100,
        "grade": band["grade"],
        "summary": band["meaning"],
        "components": components,
        "grade_bands": GRADE_BANDS,
        "method": "Rule-based. Each rule is a straight line between 0 and its maximum points. "
        "No AI model and no live market data are used.",
    }
