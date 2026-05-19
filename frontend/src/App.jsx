import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000/tasks";
const LOCAL_STORAGE_KEY = "task-manager-backup";

const defaultFormData = {
  title: "",
  description: "",
  priority: "Medium",
  status: "To Do",
  dueDate: ""
};

const priorityOrder = {
  High: 3,
  Medium: 2,
  Low: 1
};

function getErrorMessage(error, fallbackMessage) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}

function formatDate(dateString) {
  if (!dateString) {
    return "No due date";
  }

  return new Date(dateString).toLocaleDateString();
}

function formatDateTime(dateString) {
  if (!dateString) {
    return "Not available";
  }

  return new Date(dateString).toLocaleString();
}

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [sortBy, setSortBy] = useState("date");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState(defaultFormData);

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    if (!successMessage) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setSuccessMessage("");
    }, 2500);

    return () => window.clearTimeout(timeoutId);
  }, [successMessage]);

  async function fetchTasks() {
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Could not load tasks from the server.");
      }

      const data = await response.json();
      setTasks(data);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      const backupTasks = localStorage.getItem(LOCAL_STORAGE_KEY);

      if (backupTasks) {
        setTasks(JSON.parse(backupTasks));
        setErrorMessage("Server not available. Showing your saved browser backup.");
      } else {
        setErrorMessage(getErrorMessage(error, "Could not load tasks."));
      }
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setEditingTask(null);
    setFormData(defaultFormData);
    setErrorMessage("");
    setSuccessMessage("");
    setIsModalOpen(true);
  }

  function openEditModal(task) {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      priority: task.priority || "Medium",
      status: task.status || "To Do",
      dueDate: task.dueDate || ""
    });
    setErrorMessage("");
    setSuccessMessage("");
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingTask(null);
    setFormData(defaultFormData);
  }

  function handleFormChange(event) {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value
    }));
  }

  function validateForm() {
    if (!formData.title.trim()) {
      return "Please enter a task title.";
    }

    if (formData.dueDate && Number.isNaN(Date.parse(formData.dueDate))) {
      return "Please choose a valid due date.";
    }

    return "";
  }

  async function handleSaveTask(event) {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setSaving(true);
    setErrorMessage("");

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      priority: formData.priority,
      status: formData.status,
      dueDate: formData.dueDate
    };

    try {
      const url = editingTask ? `${API_URL}/${editingTask.id}` : API_URL;
      const method = editingTask ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not save the task.");
      }

      if (editingTask) {
        setTasks((currentTasks) =>
          currentTasks.map((task) => (task.id === data.id ? data : task))
        );
        setSuccessMessage("Task updated successfully.");
      } else {
        setTasks((currentTasks) => [data, ...currentTasks]);
        setSuccessMessage("Task added successfully.");
      }

      closeModal();
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Could not save the task."));
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(task, newStatus) {
    setErrorMessage("");

    try {
      const response = await fetch(`${API_URL}/${task.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status: newStatus
        })
      });

      const updatedTask = await response.json();

      if (!response.ok) {
        throw new Error(updatedTask.message || "Could not update the task status.");
      }

      setTasks((currentTasks) =>
        currentTasks.map((currentTask) =>
          currentTask.id === updatedTask.id ? updatedTask : currentTask
        )
      );
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Could not update the task status."));
    }
  }

  async function handleToggleComplete(task) {
    const nextStatus = task.completed ? "To Do" : "Done";
    await handleStatusChange(task, nextStatus);
  }

  async function handleDeleteTask(task) {
    const shouldDelete = window.confirm(`Delete "${task.title}"?`);

    if (!shouldDelete) {
      return;
    }

    setErrorMessage("");

    try {
      const response = await fetch(`${API_URL}/${task.id}`, {
        method: "DELETE"
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not delete the task.");
      }

      setTasks((currentTasks) =>
        currentTasks.filter((currentTask) => currentTask.id !== task.id)
      );
      setSuccessMessage("Task deleted successfully.");
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Could not delete the task."));
    }
  }

  const filteredTasks = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const visibleTasks = tasks.filter((task) => {
      const matchesSearch = task.title.toLowerCase().includes(normalizedSearch);
      const matchesStatus =
        statusFilter === "All"
        || (statusFilter === "Completed" && task.completed)
        || (statusFilter === "Pending" && !task.completed)
        || task.status === statusFilter;
      const matchesPriority =
        priorityFilter === "All" || task.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });

    return visibleTasks.sort((firstTask, secondTask) => {
      if (sortBy === "priority") {
        return priorityOrder[secondTask.priority] - priorityOrder[firstTask.priority];
      }

      const firstDate = new Date(firstTask.dueDate || firstTask.createdAt).getTime();
      const secondDate = new Date(secondTask.dueDate || secondTask.createdAt).getTime();
      return firstDate - secondDate;
    });
  }, [priorityFilter, searchTerm, sortBy, statusFilter, tasks]);

  const stats = useMemo(() => {
    const completedTasks = tasks.filter((task) => task.completed).length;
    const pendingTasks = tasks.length - completedTasks;

    return [
      {
        label: "Total Tasks",
        value: tasks.length
      },
      {
        label: "Completed",
        value: completedTasks
      },
      {
        label: "Pending",
        value: pendingTasks
      }
    ];
  }, [tasks]);

  return (
    <div className="app-shell">
      <div className="app-container">
        <header className="hero-section">
          <div>
            <p className="eyebrow">Task Manager Dashboard</p>
            <h1>Stay on top of work with simple planning tools.</h1>
            <p className="subtitle">
              Add, edit, search, sort, and track tasks from one local full stack app.
            </p>
          </div>
          <button className="primary-btn" onClick={openAddModal}>
            Add New Task
          </button>
        </header>

        <section className="stats-grid">
          {stats.map((stat) => (
            <div key={stat.label} className="stat-card">
              <p>{stat.label}</p>
              <strong>{stat.value}</strong>
            </div>
          ))}
        </section>

        <section className="toolbar">
          <input
            className="search-input"
            type="text"
            placeholder="Search by task title"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />

          <div className="filter-grid">
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="All">All Tasks</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
            </select>

            <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
              <option value="All">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>

            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="date">Sort by Date</option>
              <option value="priority">Sort by Priority</option>
            </select>
          </div>
        </section>

        {errorMessage && <p className="feedback error-message">{errorMessage}</p>}
        {successMessage && <p className="feedback success-message">{successMessage}</p>}

        <section className="task-section">
          {loading ? (
            <p className="state-message">Loading tasks...</p>
          ) : filteredTasks.length === 0 ? (
            <p className="state-message">
              No tasks match your search or filters. Try adding a new task.
            </p>
          ) : (
            <div className="task-grid">
              {filteredTasks.map((task) => (
                <article
                  key={task.id}
                  className={`task-card priority-${task.priority.toLowerCase()}`}
                >
                  <div className="task-top">
                    <div>
                      <div className="task-meta">
                        <span className="badge">{task.priority}</span>
                        <span className="badge badge-status">{task.status}</span>
                      </div>
                      <h2 className={task.completed ? "task-title completed" : "task-title"}>
                        {task.title}
                      </h2>
                      <p className="task-description">
                        {task.description || "No description added."}
                      </p>
                    </div>

                    <select
                      className="status-select"
                      value={task.status}
                      onChange={(event) => handleStatusChange(task, event.target.value)}
                    >
                      <option value="To Do">To Do</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Done">Done</option>
                    </select>
                  </div>

                  <div className="task-details">
                    <span>Due: {formatDate(task.dueDate)}</span>
                    <span>Created: {formatDateTime(task.createdAt)}</span>
                  </div>

                  <div className="task-actions">
                    <button className="secondary-btn" onClick={() => openEditModal(task)}>
                      Edit
                    </button>
                    <button className="complete-btn" onClick={() => handleToggleComplete(task)}>
                      {task.completed ? "Mark Pending" : "Mark Done"}
                    </button>
                    <button className="delete-btn" onClick={() => handleDeleteTask(task)}>
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="eyebrow">{editingTask ? "Edit Task" : "Add Task"}</p>
                <h2>{editingTask ? "Update task details" : "Create a new task"}</h2>
              </div>
              <button className="icon-btn" onClick={closeModal}>
                Close
              </button>
            </div>

            <form className="task-form" onSubmit={handleSaveTask}>
              {errorMessage && <p className="feedback error-message modal-feedback">{errorMessage}</p>}

              <label>
                Title
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  placeholder="Enter task title"
                />
              </label>

              <label>
                Description
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="Enter a short description"
                  rows="4"
                />
              </label>

              <div className="form-row">
                <label>
                  Priority
                  <select name="priority" value={formData.priority} onChange={handleFormChange}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </label>

                <label>
                  Status
                  <select name="status" value={formData.status} onChange={handleFormChange}>
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </label>
              </div>

              <label>
                Due Date
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleFormChange}
                />
              </label>

              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="primary-btn" disabled={saving}>
                  {saving ? "Saving..." : editingTask ? "Save Changes" : "Add Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
