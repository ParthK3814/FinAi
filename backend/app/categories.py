"""Shared category and asset-type definitions.

Keeping them in one place means the API validation, the scoring rules and the
frontend forms (via GET /api/meta) can never drift apart.
"""
from typing import Literal, get_args

# --- Income -----------------------------------------------------------------
INCOME_CATEGORIES = ["Salary", "Freelance", "Dividends", "Interest", "Other Income"]

# --- Expenses: "needs" vs "wants" (used by the 50/30/20 style spending rule) --
NEED_CATEGORIES = [
    "Housing",
    "Groceries",
    "Utilities",
    "Transport",
    "Healthcare",
    "Insurance",
    "Education",
    "Debt Payment",
]
WANT_CATEGORIES = [
    "Dining Out",
    "Entertainment",
    "Shopping",
    "Travel",
    "Subscriptions",
    "Personal Care",
    "Other",
]
EXPENSE_CATEGORIES = NEED_CATEGORIES + WANT_CATEGORIES

# Loan / EMI / credit-card payments. Used by the debt-burden rule.
DEBT_CATEGORY = "Debt Payment"

# --- Investments --------------------------------------------------------------
AssetType = Literal[
    "stock",
    "mutual_fund",
    "etf",
    "bond",
    "gold",
    "crypto",
    "real_estate",
    "cash",
    "other",
]
ASSET_TYPES = list(get_args(AssetType))

ASSET_TYPE_LABELS = {
    "stock": "Stocks",
    "mutual_fund": "Mutual funds",
    "etf": "ETFs",
    "bond": "Bonds",
    "gold": "Gold",
    "crypto": "Crypto",
    "real_estate": "Real estate",
    "cash": "Cash & savings",
    "other": "Other",
}

# Cash is tracked as a holding so the emergency-fund rule can see it,
# but it is not counted as an "investment" for diversification.
CASH_ASSET_TYPE = "cash"
