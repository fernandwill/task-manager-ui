"""Storage backends for persisting task data."""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Protocol

import httpx


class TaskStorageError(RuntimeError):
    """Raised when a storage backend fails to load or save task state."""


class TaskStorage(Protocol):
    """Protocol describing the storage interface used by the API."""

    def load(self) -> Dict[str, Any]:
        """Return the persisted task state."""

    def save(self, data: Dict[str, Any]) -> None:
        """Persist the provided task state."""


@dataclass(slots=True)
class FileTaskStorage:
    """Store task data on the local filesystem."""

    path: Path

    def load(self) -> Dict[str, Any]:
        if not self.path.exists():
            return {}

        try:
            with self.path.open("r", encoding="utf-8") as file:
                return json.load(file)
        except (OSError, json.JSONDecodeError) as exc:
            raise TaskStorageError("Failed to read persisted task state") from exc

    def save(self, data: Dict[str, Any]) -> None:
        try:
            self.path.parent.mkdir(parents=True, exist_ok=True)
            with self.path.open("w", encoding="utf-8") as file:
                json.dump(data, file, indent=2)
        except OSError as exc:
            raise TaskStorageError("Failed to write persisted task state") from exc


@dataclass(slots=True)
class VercelKVTaskStorage:
    """Persist task data using the Vercel KV REST API."""

    base_url: str
    token: str
    key: str

    def load(self) -> Dict[str, Any]:
        response = self._request("GET", f"get/{self.key}")
        if response is None:
            return {}

        value = response.get("result")
        if value in (None, "null"):
            return {}

        if isinstance(value, str):
            try:
                return json.loads(value)
            except json.JSONDecodeError as exc:
                raise TaskStorageError("Received malformed data from Vercel KV") from exc

        if isinstance(value, dict):
            return value

        raise TaskStorageError("Unexpected payload received from Vercel KV")

    def save(self, data: Dict[str, Any]) -> None:
        payload = {"value": json.dumps(data)}
        self._request("PUT", f"set/{self.key}", json=payload)

    def _request(self, method: str, path: str, **kwargs: Any) -> Dict[str, Any] | None:
        url = f"{self.base_url.rstrip('/')}/{path}"
        headers = kwargs.pop("headers", {})
        headers["Authorization"] = f"Bearer {self.token}"
        if "json" in kwargs:
            headers.setdefault("Content-Type", "application/json")

        try:
            response = httpx.request(method, url, headers=headers, timeout=5.0, **kwargs)
        except httpx.HTTPError as exc:
            raise TaskStorageError("Unable to communicate with Vercel KV") from exc

        if response.status_code == 404:
            return None

        try:
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise TaskStorageError("Unexpected response from Vercel KV") from exc

        try:
            return response.json()
        except json.JSONDecodeError as exc:
            raise TaskStorageError("Invalid JSON received from Vercel KV") from exc


def create_storage() -> TaskStorage:
    """Create a storage backend based on the current environment."""

    base_url = os.getenv("VERCEL_KV_REST_API_URL")
    token = os.getenv("VERCEL_KV_REST_API_TOKEN")

    if base_url and token:
        key = os.getenv("TASK_MANAGER_KV_KEY", "task-manager-state")
        return VercelKVTaskStorage(base_url=base_url, token=token, key=key)

    data_file = os.getenv("TASK_MANAGER_DATA_FILE")
    if data_file:
        path = Path(data_file)
    else:
        path = Path(__file__).resolve().parent / "tasks.json"
    return FileTaskStorage(path=path)

