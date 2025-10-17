Project: task-manager-ui

Objective
Build a task management dashboard using React.js + TypeScript that interacts with a FastAPI backend.
It must support:
● Viewing and managing tasks
● Creating tasks
● Marking tasks complete/incomplete
● Deleting tasks
● Generating a downloadable PDF report of all tasks

Tech Stack
● Frontend: React.js + TypeScript
● Styling: Material UI
● State Management: Zustand 
● API Client: Axios
● PDF Report: react-pdf
● Testing: React Testing Library
● Optional Routing: React Router DOM

Task Features
1. Task List Page
● Show all tasks (title, description, completed status)
● Indicate completed tasks visually
● Include buttons to:
○ Toggle complete
○ Delete task

2. Task Creation Form
● title (required), description (optional)
● Submit to backend with validation
● Show success/error message

3. PDF Report Generation
● Button: “Download Report”
● On click:
○ Generate a PDF with all current tasks (title, description, status)
○ Allow user to download it
○ Optional: Include timestamp and app name in header

4. Deploy the app to Vercel