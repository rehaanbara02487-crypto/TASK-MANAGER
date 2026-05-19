My first GitHub project
# Task Manager App

A beginner-friendly full stack Task Manager built with React + Vite on the frontend and Node.js + Express on the backend. Tasks are stored in a local JSON file, and the browser also keeps a localStorage backup.

## Project Structure

```text
DSE/
|-- backend/
|   |-- data/
|   |   `-- tasks.json
|   |-- package.json
|   `-- server.js
|-- frontend/
|   |-- src/
|   |   |-- App.css
|   |   |-- App.jsx
|   |   |-- index.css
|   |   `-- main.jsx
|   |-- index.html
|   |-- package.json
|   `-- vite.config.js
|-- .gitignore
`-- README.md
```

## Main Features

- Add, edit, complete, and delete tasks
- Task fields: title, description, priority, status, due date, created time
- Search tasks by title
- Filter tasks by completed or pending state
- Filter tasks by priority
- Sort tasks by date or priority
- Dashboard summary cards for total, completed, and pending tasks
- Responsive layout for desktop and mobile
- Priority color highlights
- Modal form for adding and editing tasks
- Delete confirmation before removing a task
- Browser localStorage backup with backend sync
- Friendly validation and error messages

## Task Fields

Each task now uses this structure:

```json
{
  "id": "unique-id",
  "title": "Finish frontend layout",
  "description": "Update filters and summary cards",
  "priority": "High",
  "dueDate": "2026-04-06",
  "createdAt": "2026-04-01T10:00:00.000Z",
  "status": "In Progress",
  "completed": false
}
```

## Backend API

### `GET /tasks`

Returns all tasks.

### `POST /tasks`

Creates a new task.

Example request body:

```json
{
  "title": "Learn Express",
  "description": "Practice REST API basics",
  "priority": "Medium",
  "status": "To Do",
  "dueDate": "2026-04-10"
}
```

### `PUT /tasks/:id`

Updates an existing task. You can send one field or multiple fields.

Example request body:

```json
{
  "title": "Learn Express deeply",
  "priority": "High",
  "status": "Done"
}
```

### `DELETE /tasks/:id`

Deletes a task by ID.

## Validation Rules

- `title` is required
- `description` must be text
- `priority` must be `Low`, `Medium`, or `High`
- `status` must be `To Do`, `In Progress`, or `Done`
- `dueDate` must be a valid date if provided

## Frontend Highlights

- Uses `fetch()` to connect to the local backend
- Shows loading and empty states
- Falls back to localStorage when the backend is unavailable
- Saves the latest task list to localStorage after changes
- Uses a modal for add and edit forms

## Step-by-Step Setup in VS Code

1. Open the `DSE` folder in VS Code.
2. Open the integrated terminal for the backend.
3. Run:

```bash
cd backend
npm install
npm start
```

4. Open a second terminal for the frontend.
5. Run:

```bash
cd frontend
npm install
npm run dev
```

6. Open the Vite URL shown in the terminal. It is usually `http://localhost:5173`.
7. Keep the backend running on `http://localhost:5000`.

## Files Updated

- `backend/server.js` for validation, advanced fields, and upgrade-safe task handling
- `backend/data/tasks.json` with richer sample tasks
- `frontend/src/App.jsx` for dashboard, modal, filters, sorting, backup, and error handling
- `frontend/src/App.css` for responsive styling and priority colors
- `frontend/src/index.css` for page-level styling

## Beginner Notes

- This project runs fully on localhost only.
- No database is used. Tasks are stored in `backend/data/tasks.json`.
- If the backend is not available, the frontend can still show the last saved localStorage backup.
- You can edit the design by changing `frontend/src/App.css`.

