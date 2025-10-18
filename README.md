# Task Manager UI
<img width="1000" height="1000" alt="{2E096C21-4834-44ED-9804-7583E7AEC16F}" src="https://github.com/user-attachments/assets/159b13d4-716b-45c6-ae37-d6de99c83eac" />

Task Manager UI is a small full-stack project that combines a FastAPI backend with a React + TypeScript frontend. Use it to capture daily work, track progress, and export summaries without relying on external services.

## Features at a glance
- Create tasks with optional descriptions, edit them later, and delete what you no longer need.
- Toggle completion, drag and drop to reorder the list, and view separate queues for in-progress and finished work.
- Review daily stats, check upcoming items, and switch between light and dark themes with one click.
- Download a timestamped PDF report of every task and get automatic toast feedback for success, errors, and network status.
- All data is stored in `fastapi-backend/app/tasks.json`, so restarts keep your tasks intact.

## Project structure
- `fastapi-backend/` – FastAPI app that exposes REST endpoints under `/api/tasks/` and persists task data to disk.
- `frontend/` – Vite-powered React app styled with Material UI, Zustand state management, and axios for API calls.

## Getting started on Windows
### 1. Run the FastAPI service
```
cd fastapi-backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
The API listens on `http://localhost:8000`. A `tasks.json` file appears alongside the app module the first time you add a task.

### 2. Start the React frontend
```
cd frontend
npm install
npm run dev
```
Create a `.env.local` (or `.env`) file if you need to point the UI at a different backend:
```
VITE_API_BASE_URL=http://localhost:8000/api
```
The development server runs on `http://localhost:5173` and proxies API requests to the FastAPI service when the base URL is set to `/api`.

## Available API endpoints
| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/api/tasks/` | List tasks in the saved order. |
| POST | `/api/tasks/` | Create a task (`title`, optional `description`). |
| PATCH | `/api/tasks/{id}` | Update title, description, or completion flag. |
| DELETE | `/api/tasks/{id}` | Remove a task. |
| POST | `/api/tasks/reorder` | Persist a new order: `{"ids": [1, 3, 2]}`. |

## Running tests
- Backend: run `pytest` from the `fastapi-backend` directory.
- Frontend: run `npm run test` from the `frontend` directory.
