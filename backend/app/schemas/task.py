from datetime import datetime
from pydantic import BaseModel, Field


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1)
    description: str | None = None
    priority: str = "MEDIUM"
    due_date: datetime | None = None


class TaskOut(BaseModel):
    id: int
    title: str
    description: str | None
    priority: str
    due_date: datetime | None
    created_at: datetime
    owner_id: int

    class Config:
        from_attributes = True