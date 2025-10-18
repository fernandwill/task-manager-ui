import logging
from datetime import datetime, timezone
from typing import Dict, List

from fastapi import FastAPI, HTTPException, Path
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError

from .schemas import Task, TaskCreate, TaskReorder, TaskUpdate
from .storage import TaskStorage, TaskStorageError, create_storage

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
_storage: TaskStorage = create_storage()


def _next_id() -> int:
    global _counter
    _counter += 1
    return _counter


def _persist_state() -> None:
    """Persist the current task state to the configured storage backend."""

    data = {
        "tasks": [task.model_dump(mode="json") for task in _tasks.values()],
        "order": list(_order),
        "counter": _counter,
    }

    try:
        _storage.save(data)
    except TaskStorageError as exc:
        _logger.exception("Failed to persist tasks using %s", type(_storage).__name__)
        raise HTTPException(
            status_code=500,
            detail="Unable to persist tasks. Please try again later.",
        ) from exc


def _load_state() -> None:
    """Load persisted tasks from the configured storage backend."""

    global _tasks, _order, _counter

    try:
        raw_data = _storage.load()
    except TaskStorageError:
        _logger.exception(
            "Failed to load tasks using %s", type(_storage).__name__
        )
        return

    if not raw_data:
        return

    tasks_data = raw_data.get("tasks", [])
    loaded_tasks: Dict[int, Task] = {}

    for item in tasks_data:
        item_data = dict(item)
        if not item_data.get("created_at"):
            item_data["created_at"] = datetime.now(timezone.utc).isoformat()
        if item_data.get("completed"):
            item_data.setdefault("completed_at", item_data["created_at"])
        else:
            item_data["completed_at"] = None

        try:
            task = Task(**item_data)
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
    now = datetime.now(timezone.utc)
    task = Task(
        id=task_id,
        completed=False,
        created_at=now,
        completed_at=None,
        **payload.model_dump(),
    )
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
    completed_flag = update_data.get("completed")
    if completed_flag is not None:
        if completed_flag and not stored.completed:
            update_data["completed_at"] = datetime.now(timezone.utc)
        elif not completed_flag and stored.completed:
            update_data["completed_at"] = None
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
