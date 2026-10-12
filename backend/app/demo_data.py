"""Realistic demo data, generated relative to today's date.

Pure Python (no database) so it can be inspected and tested on its own.
A fixed random seed makes the numbers identical on every run.
"""
from __future__ import annotations

import datetime as dt
import random

from .analysis import shift_month

MONTHS_BACK = 6  # six full months plus the current one


def build_demo_transactions(today: dt.date | None = None) -> list[dict]:
    today = today or dt.date.today()
    rng = random.Random(42)
    this_month = today.replace(day=1)
    rows: list[dict] = []

    def money(low: float, high: float) -> float:
        return round(rng.uniform(low, high), 2)

    for back in range(MONTHS_BACK, -1, -1):
        first = shift_month(this_month, -back)
        idx = MONTHS_BACK - back  # 0 = oldest month

        def add(day: int, type_: str, category: str, description: str, amount: float):
            when = first.replace(day=day)  # days stay <= 28, valid in every month
            if when > today:  # the current month is only partly "lived" so far
                return
            rows.append(
                {"type": type_, "category": category, "description": description,
                 "amount": round(amount, 2), "date": when}
            )

        # ---- Income ----
        add(1, "income", "Salary", "Monthly salary", 5200 if idx < 3 else 5400)
        if idx in (1, 3, 5):
            add(18, "income", "Freelance", "Freelance project payment", money(350, 720))
        add(15, "income", "Dividends", "Dividend payout", money(38, 55))

        # ---- Needs ----
        add(2, "expense", "Housing", "Apartment rent", 1700)
        add(5, "expense", "Debt Payment", "Student loan EMI", 420)
        add(6, "expense", "Utilities", "Electricity", money(70, 115))
        add(7, "expense", "Utilities", "Internet & phone", 79)
        add(10, "expense", "Insurance", "Health & auto insurance", 160)
        for day, label in zip((4, 11, 18, 25), ("Supermarket", "Weekly groceries", "Farmers market", "Supermarket")):
            add(day, "expense", "Groceries", label, money(110, 185))
        for day in (8, 22):
            add(day, "expense", "Transport", "Fuel & transit pass", money(80, 140))
        if idx in (2, 5):
            add(14, "expense", "Healthcare", "Pharmacy & check-up", money(55, 140))
        if idx == 2:
            add(16, "expense", "Education", "Online certification course", 120)

        # ---- Wants ----
        dining_days = sorted(rng.sample(range(3, 28), 9))
        for day in dining_days:
            label = rng.choice(["Restaurant dinner", "Coffee & takeout", "Lunch with friends"])
            add(day, "expense", "Dining Out", label, money(26, 95))
        for day in (9, 20, 26, 27):
            add(day, "expense", "Entertainment", rng.choice(["Cinema & events", "Games", "Concert tickets"]), money(30, 95))
        for day, label in zip((13, 19, 27), ("Clothing", "Online shopping", "Home & gadgets")):
            add(day, "expense", "Shopping", label, money(80, 300))
        add(12, "expense", "Subscriptions", "Streaming bundle", 17.99)
        add(12, "expense", "Subscriptions", "Music", 10.99)
        add(12, "expense", "Subscriptions", "Cloud storage", 2.99)
        add(12, "expense", "Subscriptions", "Fitness app", 14.99)
        add(3, "expense", "Personal Care", "Gym membership", 34)
        if idx % 2 == 0:
            add(21, "expense", "Personal Care", "Haircut", 28)
        if idx == 1:
            add(17, "expense", "Travel", "Long weekend - train tickets", 130)
        if idx == 3:
            add(15, "expense", "Travel", "Weekend trip - flights & stay", 560)
        if idx == 5:
            add(24, "expense", "Travel", "Day trip & tickets", 240)
        if idx == 4:
            add(23, "expense", "Other", "Birthday gift", 85)

    return rows


def build_demo_investments(today: dt.date | None = None) -> list[dict]:
    """Demo holdings. Prices are made up and typed in by hand - not live data."""
    today = today or dt.date.today()

    def ago(days: int) -> dt.date:
        return today - dt.timedelta(days=days)

    return [
        {"name": "Apple Inc.", "symbol": "AAPL", "asset_type": "stock",
         "quantity": 18, "buy_price": 162.40, "current_price": 231.10, "purchase_date": ago(620)},
        {"name": "Microsoft Corp.", "symbol": "MSFT", "asset_type": "stock",
         "quantity": 8, "buy_price": 318.00, "current_price": 412.50, "purchase_date": ago(540)},
        {"name": "NVIDIA Corp.", "symbol": "NVDA", "asset_type": "stock",
         "quantity": 12, "buy_price": 88.00, "current_price": 134.20, "purchase_date": ago(400)},
        {"name": "S&P 500 Index ETF", "symbol": "VOO", "asset_type": "etf",
         "quantity": 14, "buy_price": 402.00, "current_price": 468.00, "purchase_date": ago(700)},
        {"name": "Total Market Index Fund", "symbol": "VTSAX", "asset_type": "mutual_fund",
         "quantity": 22, "buy_price": 118.00, "current_price": 139.00, "purchase_date": ago(480)},
        {"name": "Total Bond Market Fund", "symbol": "BND", "asset_type": "bond",
         "quantity": 30, "buy_price": 74.50, "current_price": 72.90, "purchase_date": ago(350)},
        {"name": "Gold ETF", "symbol": "GLD", "asset_type": "gold",
         "quantity": 5, "buy_price": 188.00, "current_price": 242.00, "purchase_date": ago(300)},
        {"name": "Bitcoin", "symbol": "BTC", "asset_type": "crypto",
         "quantity": 0.045, "buy_price": 41000.00, "current_price": 64000.00, "purchase_date": ago(450)},
        {"name": "High-yield savings account", "symbol": None, "asset_type": "cash",
         "quantity": 1, "buy_price": 7200.00, "current_price": 7200.00, "purchase_date": None},
    ]
