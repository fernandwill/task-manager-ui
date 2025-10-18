"""Tests for task timestamp handling in the Task Manager API."""

from datetime import datetime
from pathlib import Path
import sys

import pytest
from fastapi.testclient import TestClient

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
  sys.path.insert(0, str(BACKEND_ROOT))

from app import main
from app import storage as storage_module


@pytest.fixture(autouse=True)
def reset_state(tmp_path, monkeypatch):
  """Reset the in-memory and on-disk state before each test."""

  data_file = tmp_path / "tasks.json"
  monkeypatch.setattr(main, "_storage", storage_module.FileTaskStorage(path=data_file))
  main._tasks = {}
  main._order = []
  main._counter = 0
  yield
  if data_file.exists():
    data_file.unlink()


def _is_timezone_aware(timestamp: str) -> bool:
  dt = datetime.fromisoformat(timestamp)
  return dt.tzinfo is not None and dt.tzinfo.utcoffset(dt) is not None


def test_task_timestamps_persist_across_restart():
  with TestClient(main.app) as client:
    create_response = client.post(
        "/api/tasks/", json={"title": "Test", "description": "Check timestamps"}
    )
    assert create_response.status_code == 201
    created_task = create_response.json()

    created_at = created_task["created_at"]
    assert created_at is not None
    assert _is_timezone_aware(created_at)
    assert created_task["completed_at"] is None

    complete_response = client.patch(
        f"/api/tasks/{created_task['id']}", json={"completed": True}
    )
    assert complete_response.status_code == 200
    completed_task = complete_response.json()

    completed_at = completed_task["completed_at"]
    assert completed_at is not None
    assert _is_timezone_aware(completed_at)

    # Simulate server restart by clearing in-memory state and reloading from disk.
    main._tasks = {}
    main._order = []
    main._counter = 0
    main._load_state()

    list_response = client.get("/api/tasks/")
    assert list_response.status_code == 200
    tasks = list_response.json()
    assert len(tasks) == 1
    reloaded_task = tasks[0]

    assert reloaded_task["created_at"] == created_at
    assert reloaded_task["completed_at"] == completed_at


def test_toggle_completed_clears_timestamp():
  with TestClient(main.app) as client:
    create_response = client.post("/api/tasks/", json={"title": "Toggle"})
    assert create_response.status_code == 201
    task_id = create_response.json()["id"]

    complete_response = client.patch(f"/api/tasks/{task_id}", json={"completed": True})
    assert complete_response.status_code == 200
    assert complete_response.json()["completed_at"] is not None

    reopen_response = client.patch(f"/api/tasks/{task_id}", json={"completed": False})
    assert reopen_response.status_code == 200
    assert reopen_response.json()["completed_at"] is None

