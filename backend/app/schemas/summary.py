from pydantic import BaseModel


class CategorySummary(BaseModel):
    name: str
    emoji: str
    total: float
    count: int


class DailySummary(BaseModel):
    date: str
    total: float


class MonthlySummaryResponse(BaseModel):
    year: int
    month: int
    total: float
    count: int
    by_category: list[CategorySummary]
    daily: list[DailySummary]
