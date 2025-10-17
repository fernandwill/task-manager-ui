from typing import Dict, List

from fastapi import FastAPI, HTTPException, Path
from fastapi.middleware.cors import CORSMiddleware

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


def _next_id() -> int:
    global _counter
    _counter += 1
    return _counter


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
    return updated


@app.delete("/api/tasks/{task_id}", status_code=204)
def delete_task(task_id: int = Path(..., ge=1)) -> None:
    if task_id not in _tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    _tasks.pop(task_id)
    if task_id in _order:
        _order.remove(task_id)


@app.post("/api/tasks/reorder", status_code=204)
def reorder_tasks(payload: TaskReorder) -> None:
    ids = payload.ids

    task_ids = set(_tasks.keys())
    provided_ids = list(ids)

    if len(provided_ids) != len(task_ids) or set(provided_ids) != task_ids:
        raise HTTPException(status_code=400, detail="Invalid task ordering supplied")

    _order.clear()
    _order.extend(provided_ids)
