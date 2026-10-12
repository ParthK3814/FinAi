"""Pydantic models: request validation and response shapes."""
import datetime as dt
from typing import Annotated, Literal, Optional

from pydantic import (
    BaseModel,
    BeforeValidator,
    ConfigDict,
    Field,
    computed_field,
    field_validator,
    model_validator,
)

from .categories import EXPENSE_CATEGORIES, INCOME_CATEGORIES, AssetType

# SQLAlchemy returns Decimal for Numeric columns; the API speaks plain floats.
Number = Annotated[float, BeforeValidator(lambda v: float(v))]


def _not_in_future(value: Optional[dt.date]) -> Optional[dt.date]:
    if value is not None and value > dt.date.today():
        raise ValueError("Date cannot be in the future.")
    return value


# --------------------------------------------------------------------------
# Transactions
# --------------------------------------------------------------------------
class TransactionIn(BaseModel):
    type: Literal["income", "expense"]
    category: str = Field(min_length=1, max_length=50)
    description: str = Field(default="", max_length=200)
    amount: float = Field(gt=0, le=1_000_000_000)
    date: dt.date

    @field_validator("category", "description")
    @classmethod
    def _strip(cls, value: str) -> str:
        return value.strip()

    @field_validator("amount")
    @classmethod
    def _round_amount(cls, value: float) -> float:
        return round(value, 2)

    @field_validator("date")
    @classmethod
    def _date_not_future(cls, value: dt.date) -> dt.date:
        return _not_in_future(value)

    @model_validator(mode="after")
    def _category_matches_type(self):
        allowed = INCOME_CATEGORIES if self.type == "income" else EXPENSE_CATEGORIES
        if self.category not in allowed:
            raise ValueError(
                f"'{self.category}' is not a valid {self.type} category. "
                f"Choose one of: {', '.join(allowed)}."
            )
        return self


class TransactionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    type: str
    category: str
    description: str
    amount: Number
    date: dt.date
    created_at: Optional[dt.datetime] = None


# --------------------------------------------------------------------------
# Investments
# --------------------------------------------------------------------------
class InvestmentIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    symbol: Optional[str] = Field(default=None, max_length=20)
    asset_type: AssetType
    quantity: float = Field(gt=0, le=1_000_000_000)
    buy_price: float = Field(ge=0, le=1_000_000_000)
    current_price: float = Field(ge=0, le=1_000_000_000)
    purchase_date: Optional[dt.date] = None

    @field_validator("name")
    @classmethod
    def _strip_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Name cannot be blank.")
        return value

    @field_validator("symbol")
    @classmethod
    def _clean_symbol(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        value = value.strip().upper()
        return value or None

    @field_validator("quantity", "buy_price", "current_price")
    @classmethod
    def _round_numbers(cls, value: float) -> float:
        return round(value, 4)

    @field_validator("purchase_date")
    @classmethod
    def _purchase_not_future(cls, value: Optional[dt.date]) -> Optional[dt.date]:
        return _not_in_future(value)


class InvestmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    symbol: Optional[str] = None
    asset_type: str
    quantity: Number
    buy_price: Number
    current_price: Number
    purchase_date: Optional[dt.date] = None

    @computed_field
    @property
    def invested_amount(self) -> float:
        return round(self.quantity * self.buy_price, 2)

    @computed_field
    @property
    def current_value(self) -> float:
        return round(self.quantity * self.current_price, 2)

    @computed_field
    @property
    def gain(self) -> float:
        return round(self.current_value - self.invested_amount, 2)

    @computed_field
    @property
    def gain_pct(self) -> float:
        if self.invested_amount <= 0:
            return 0.0
        return round(self.gain / self.invested_amount * 100, 2)


class PortfolioHolding(InvestmentOut):
    """A holding plus its share of the (non-cash) portfolio, 0-1."""

    weight: float = 0.0
