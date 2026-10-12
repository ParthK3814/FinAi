"""Database tables."""
import datetime as dt
from decimal import Decimal
from typing import Optional

from sqlalchemy import Date, DateTime, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class Transaction(Base):
    """One income or expense entry."""

    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(primary_key=True)
    type: Mapped[str] = mapped_column(String(10), index=True)  # "income" | "expense"
    category: Mapped[str] = mapped_column(String(50), index=True)
    description: Mapped[str] = mapped_column(String(200), default="")
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    date: Mapped[dt.date] = mapped_column(Date, index=True)
    created_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class Investment(Base):
    """One holding. Prices are entered by hand - there is no live market feed."""

    __tablename__ = "investments"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    symbol: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    asset_type: Mapped[str] = mapped_column(String(20), index=True)
    quantity: Mapped[Decimal] = mapped_column(Numeric(18, 4))
    buy_price: Mapped[Decimal] = mapped_column(Numeric(14, 4))
    current_price: Mapped[Decimal] = mapped_column(Numeric(14, 4))
    purchase_date: Mapped[Optional[dt.date]] = mapped_column(Date, nullable=True)
    created_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
