from datetime import datetime
from pydantic import BaseModel, Field


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1)
    description: str | None = None
    priority: str = "MEDIUM"
    due_date: datetime | None = None


class TaskUpdate(BaseModel):
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
    updated_at: datetime | None
    completed_at: datetime | None
    is_deleted: bool
    deleted_at: datetime | None
    owner_id: int

    class Config:
        from_attributes = True