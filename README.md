# Task Manager UI
<img width="1000" height="1000" alt="{2E096C21-4834-44ED-9804-7583E7AEC16F}" src="https://github.com/user-attachments/assets/159b13d4-716b-45c6-ae37-d6de99c83eac" />

Task Manager UI is a small full-stack project that combines a FastAPI backend with a React + TypeScript frontend. Use it to capture daily work, track progress, and export summaries without relying on external services.

## Features at a Glance
- Create tasks with optional descriptions, edit them later, and delete what you no longer need.
- Toggle completion, drag and drop to reorder the list, and view separate queues for in-progress and finished work.
- Review daily stats, check upcoming items, and switch between light and dark themes with one click.
- Download a timestamped PDF report of every task and get automatic toast feedback for success, errors, and network status.
- Serve the API either from a local FastAPI process (with durable storage) or from the co-located Vercel Serverless Function (stateless between cold starts).

## Project Structure
- `fastapi-backend/` - FastAPI app for local development with on-disk persistence at `fastapi-backend/app/tasks.json`.
- `frontend/` - Vite-powered React app styled with Material UI, Zustand state management, and axios for API calls.
- `frontend/api/` - Vercel Serverless Function that bundles the FastAPI routes for production deployments on Vercel.

## Getting Started on Windows
### 1. Run the FastAPI Service (optional for local development)
```
cd fastapi-backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
The API listens on `http://localhost:8000`. A `tasks.json` file appears alongside the app module the first time you add a task.

### 2. Start the React Frontend
```
cd frontend
npm install
npm run dev
```
For local development against the FastAPI server, copy `.env.development` to `.env.development.local` and adjust the base URL if needed:
```
VITE_API_BASE_URL=http://localhost:8000/api
```
The development server runs on `http://localhost:5173` and proxies API requests to the FastAPI service when the base URL is set to `/api`.

## Deploying to Vercel
- Point the Vercel project root to the `frontend` directory.
- Do not define `VITE_API_BASE_URL` in the Vercel environment variables (or explicitly set it to `/api`) so the built client targets the serverless function.
- Deploy as usual. The build produces the static Vite assets and the Python Serverless Function at `api/index.py`, which runs on the Python 3.11 runtime and keeps transient state in `/tmp` between warm invocations.

## Available API Endpoints
| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/api/tasks/` | List tasks in the saved order. |
| POST | `/api/tasks/` | Create a task (`title`, optional `description`). |
| PATCH | `/api/tasks/{id}` | Update title, description, or completion flag. |
| DELETE | `/api/tasks/{id}` | Remove a task. |
| POST | `/api/tasks/reorder` | Persist a new order: `{"ids": [1, 3, 2]}`. |

## Running Tests
- Backend: run `pytest` from the `fastapi-backend` directory.
- Frontend: run `npm run test` from the `frontend` directory.
