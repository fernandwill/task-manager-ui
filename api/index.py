"""Vercel serverless entrypoint for the FastAPI application."""

from __future__ import annotations

import sys
from pathlib import Path


BACKEND_ROOT = Path(__file__).resolve().parent.parent / "fastapi-backend"
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))


from app.main import app  # noqa: E402  (import after path manipulation)

__all__ = ["app"]

