import json
import logging
from pathlib import Path as FilePath
from typing import Dict, List

from fastapi import FastAPI, HTTPException, Path
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError

from .schemas import Task, TaskCreate, TaskReorder, TaskUpdate

app = FastAPI(title="Task Manager API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_tasks: Dict[int, Task] = {}
_order: List[int] = []
_counter = 0
_logger = logging.getLogger(__name__)
_data_file = FilePath(__file__).resolve().parent / "tasks.json"


def _next_id() -> int:
    global _counter
    _counter += 1
    return _counter


def _persist_state() -> None:
    """Persist the current task state to disk."""

    data = {
        "tasks": [task.model_dump() for task in _tasks.values()],
        "order": list(_order),
        "counter": _counter,
    }

    try:
        _data_file.parent.mkdir(parents=True, exist_ok=True)
        with _data_file.open("w", encoding="utf-8") as file:
            json.dump(data, file, indent=2)
    except Exception as exc:
        _logger.exception("Failed to persist tasks to %s", _data_file)
        raise HTTPException(
            status_code=500,
            detail="Unable to persist tasks. Please try again later.",
        ) from exc


def _load_state() -> None:
    """Load persisted tasks from disk into memory."""

    global _tasks, _order, _counter

    if not _data_file.exists():
        return

    try:
        with _data_file.open("r", encoding="utf-8") as file:
            raw_data = json.load(file)
    except (OSError, json.JSONDecodeError):
        _logger.exception("Failed to load tasks from %s", _data_file)
        return

    tasks_data = raw_data.get("tasks", [])
    loaded_tasks: Dict[int, Task] = {}

    for item in tasks_data:
        try:
            task = Task(**item)
        except (TypeError, ValidationError):
            _logger.exception("Skipping invalid task entry in persisted data: %s", item)
            continue
        loaded_tasks[task.id] = task

    _tasks = loaded_tasks

    valid_ids = set(_tasks.keys())
    stored_order = [task_id for task_id in raw_data.get("order", []) if task_id in valid_ids]
    _order = stored_order + [task_id for task_id in valid_ids if task_id not in stored_order]

    counter_value = raw_data.get("counter")
    if isinstance(counter_value, int) and counter_value >= 0:
        _counter = max(counter_value, max(valid_ids, default=0))
    else:
        _counter = max(valid_ids, default=0)


@app.on_event("startup")
def startup_event() -> None:
    _load_state()


@app.get("/api/tasks/", response_model=list[Task])
def list_tasks() -> list[Task]:
    ordered_tasks = [_tasks[task_id] for task_id in _order if task_id in _tasks]

    if len(ordered_tasks) != len(_tasks):
        remaining_ids = [task_id for task_id in _tasks if task_id not in _order]
        ordered_tasks.extend(_tasks[task_id] for task_id in remaining_ids)

    return ordered_tasks


@app.post("/api/tasks/", response_model=Task, status_code=201)
def create_task(payload: TaskCreate) -> Task:
    task_id = _next_id()
    task = Task(id=task_id, completed=False, **payload.model_dump())
    _tasks[task_id] = task
    _order.append(task_id)
    try:
        _persist_state()
    except HTTPException:
        _tasks.pop(task_id, None)
        if task_id in _order:
            _order.remove(task_id)
        global _counter
        _counter -= 1
        raise
    return task


@app.patch("/api/tasks/{task_id}", response_model=Task)
def update_task(
    payload: TaskUpdate,
    task_id: int = Path(..., ge=1),
) -> Task:
    if task_id not in _tasks:
        raise HTTPException(status_code=404, detail="Task not found")

    stored = _tasks[task_id]
    update_data = payload.model_dump(exclude_unset=True)
    updated = stored.model_copy(update=update_data)
    _tasks[task_id] = updated
    try:
        _persist_state()
    except HTTPException:
        _tasks[task_id] = stored
        raise
    return updated


@app.delete("/api/tasks/{task_id}", status_code=204)
def delete_task(task_id: int = Path(..., ge=1)) -> None:
    if task_id not in _tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    stored_task = _tasks.pop(task_id)
    order_index = None
    if task_id in _order:
        order_index = _order.index(task_id)
        _order.pop(order_index)
    try:
        _persist_state()
    except HTTPException:
        _tasks[task_id] = stored_task
        if order_index is not None:
            _order.insert(order_index, task_id)
        raise


@app.post("/api/tasks/reorder", status_code=204)
def reorder_tasks(payload: TaskReorder) -> None:
    ids = payload.ids

    task_ids = set(_tasks.keys())
    provided_ids = list(ids)

    if len(provided_ids) != len(task_ids) or set(provided_ids) != task_ids:
        raise HTTPException(status_code=400, detail="Invalid task ordering supplied")

    previous_order = list(_order)
    _order.clear()
    _order.extend(provided_ids)
    try:
        _persist_state()
    except HTTPException:
        _order.clear()
        _order.extend(previous_order)
        raise
