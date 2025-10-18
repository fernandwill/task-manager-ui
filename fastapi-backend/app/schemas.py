from datetime import datetime, timezone
from typing import Optional

from pydantic import BaseModel, Field


def _utc_now() -> datetime:
  """Return the current UTC time with timezone information."""

  return datetime.now(timezone.utc)


class TaskBase(BaseModel):
  title: str = Field(..., min_length=1, max_length=200)
  description: Optional[str] = Field(default=None, max_length=1000)


class TaskCreate(TaskBase):
  pass


class TaskUpdate(BaseModel):
  title: Optional[str] = Field(default=None, min_length=1, max_length=200)
  description: Optional[str] = Field(default=None, max_length=1000)
  completed: Optional[bool] = None


class Task(TaskBase):
  id: int
  completed: bool = False
  created_at: datetime = Field(default_factory=_utc_now)
  completed_at: Optional[datetime] = None

  class Config:
    from_attributes = True


class TaskReorder(BaseModel):
  ids: list[int] = Field(..., min_length=0)
