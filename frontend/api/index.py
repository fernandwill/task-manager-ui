import json
import logging
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List

from fastapi import APIRouter, FastAPI, HTTPException, Path as PathParam
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError

from .schemas import Task, TaskCreate, TaskReorder, TaskUpdate

default_prefix = "/api" if not os.environ.get("VERCEL") else ""
route_prefix = os.environ.get("TASKS_API_PREFIX", default_prefix)

app = FastAPI(title="Task Manager API")
router = APIRouter(prefix=route_prefix)

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

_package_data_file = Path(__file__).resolve().parent / "tasks.json"
_data_file = Path(os.environ.get("TASKS_DATA_FILE", "/tmp/task-manager-tasks.json"))


def _ensure_seed_file() -> None:
    """Ensure the server has a writable JSON file with initial seed data."""

    if _data_file.exists():
        return

    try:
        _data_file.parent.mkdir(parents=True, exist_ok=True)
        if _package_data_file.exists():
            _data_file.write_text(_package_data_file.read_text(encoding="utf-8"), encoding="utf-8")
        else:
            _data_file.write_text(
                json.dumps({"tasks": [], "order": [], "counter": 0}, indent=2),
                encoding="utf-8",
            )
    except Exception as exc:  # pragma: no cover - defensive guard for serverless fs issues
        _logger.exception("Unable to seed task storage at %s", _data_file)
        raise HTTPException(
            status_code=500,
            detail="Unable to initialise task storage. Please try again later.",
        ) from exc


def _next_id() -> int:
    global _counter
    _counter += 1
    return _counter


def _persist_state() -> None:
    """Persist the current task state to disk."""

    data = {
        "tasks": [task.model_dump(mode="json") for task in _tasks.values()],
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
    _ensure_seed_file()
    _load_state()


@router.get("/tasks/", response_model=list[Task])
def list_tasks() -> list[Task]:
    ordered_tasks = [_tasks[task_id] for task_id in _order if task_id in _tasks]

    if len(ordered_tasks) != len(_tasks):
        remaining_ids = [task_id for task_id in _tasks if task_id not in _order]
        ordered_tasks.extend(_tasks[task_id] for task_id in remaining_ids)

    return ordered_tasks


@router.post("/tasks/", response_model=Task, status_code=201)
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


@router.patch("/tasks/{task_id}", response_model=Task)
def update_task(
    payload: TaskUpdate,
    task_id: int = PathParam(..., ge=1),
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


@router.delete("/tasks/{task_id}", status_code=204)
def delete_task(task_id: int = PathParam(..., ge=1)) -> None:
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


@router.post("/tasks/reorder", status_code=204)
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


# Ensure state is loaded when the module is imported.
_ensure_seed_file()
_load_state()
app.include_router(router)
