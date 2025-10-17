from typing import Optional

from pydantic import BaseModel, Field


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

  class Config:
    from_attributes = True
