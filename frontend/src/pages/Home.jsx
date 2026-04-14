import { useEffect, useRef, useState } from "react";
import { removeToken } from "../services/auth";
import {
  createTask,
  deleteTask,
  fetchTasks,
  fetchCompletedTasks,
  updateTask,
  toggleTaskComplete,
} from "../services/tasks";
import {
  formatDate,
  formatDateTime,
  toInputDate,
  fromInputDate,
} from "../utils/date";
import "../styles/home.css";

export default function Home({ setToken, goToDeletedTasks }) {
  // Create-task form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [dueDate, setDueDate] = useState("");

  // Task collections
  const [tasks, setTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);

  // General UI state
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(true);

  // Right panel UI state
  const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false);
  const [isCreatePanelPinned, setIsCreatePanelPinned] = useState(false);

  // Modal state
  const [selectedTask, setSelectedTask] = useState(null);
  const [modalMode, setModalMode] = useState("view"); // view | edit

  // Edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState("MEDIUM");
  const [editDueDate, setEditDueDate] = useState("");

  // IDs of active tasks that were just completed and are waiting
  // to move to the completed section after a short delay
  const [pendingCompletedIds, setPendingCompletedIds] = useState([]);

  // Stores pending completion timers by task id
  const completionTimersRef = useRef({});

  function handleLogout() {
    removeToken();
    setToken(null);
  }

  function openCreatePanel() {
    setIsCreatePanelOpen(true);
  }

  function closeCreatePanel() {
    setIsCreatePanelOpen(false);
  }

  function toggleCreatePanelPinned() {
    setIsCreatePanelPinned((prev) => !prev);
    setIsCreatePanelOpen(true);
  }

  async function loadTasks() { 
    // Loads both active and completed tasks for the home view.
    try {
      setLoading(true);
      setError("");

      const [activeData, completedData] = await Promise.all([
        fetchTasks(),
        fetchCompletedTasks(),
      ]);

      setTasks(activeData);
      setCompletedTasks(completedData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    return () => {
      Object.values(completionTimersRef.current).forEach((timerId) => {
        clearTimeout(timerId);
      });
    };
  }, []);

  async function handleCreateTask(event) { 
    // Creates a new task from the right-side form and inserts it into the active list.
    event.preventDefault();

    if (!title.trim()) {
      alert("Заголовок задачи обязателен");
      return;
    }

    try {
      setError("");

      const newTask = {
        title: title.trim(),
        description: description.trim() || null,
        priority,
        due_date: fromInputDate(dueDate),
      };

      const createdTask = await createTask(newTask);
      setTasks((prev) => [createdTask, ...prev]);

      setTitle("");
      setDescription("");
      setPriority("MEDIUM");
      setDueDate("");
    } catch (err) {
      setError(err.message);
    }
  }

  function openTaskModal(task) {
    setSelectedTask(task);
    setModalMode("view");
  }

  function closeTaskModal() {
    setSelectedTask(null);
    setModalMode("view");
    resetEditForm();
  }

  function resetEditForm() {
    setEditTitle("");
    setEditDescription("");
    setEditPriority("MEDIUM");
    setEditDueDate("");
  }

  function enterEditMode() {
    if (!selectedTask) return;

    setEditTitle(selectedTask.title || "");
    setEditDescription(selectedTask.description || "");
    setEditPriority(selectedTask.priority || "MEDIUM");
    setEditDueDate(toInputDate(selectedTask.due_date));

    setModalMode("edit");
  }

  function cancelEditMode() {
    setModalMode("view");
    resetEditForm();
  }

  async function handleToggleComplete(taskId) {
    const isCompletedTask = completedTasks.some((task) => task.id === taskId);
    const isPendingCompleted = pendingCompletedIds.includes(taskId);

    try {
      setError("");

      // Case 1: task is already completed or is waiting to move to completed
      if (isCompletedTask || isPendingCompleted) {
        // cancel pending move if it exists
        if (completionTimersRef.current[taskId]) {
          clearTimeout(completionTimersRef.current[taskId]);
          delete completionTimersRef.current[taskId];
        }

        setPendingCompletedIds((prev) => prev.filter((id) => id !== taskId));

        const completedVersion = completedTasks.find((task) => task.id === taskId);

        if (completedVersion) {
          setCompletedTasks((prev) => prev.filter((task) => task.id !== taskId));
        }

        setTasks((prev) => {
          const exists = prev.some((task) => task.id === taskId);

          if (exists) {
            return prev.map((task) =>
              task.id === taskId
                ? { ...task, completed_at: null }
                : task
            );
          }

          const sourceTask =
            completedVersion ||
            tasks.find((task) => task.id === taskId);

          if (sourceTask) {
            return [{ ...sourceTask, completed_at: null }, ...prev];
          }

          return prev;
        });

        const updated = await toggleTaskComplete(taskId);

        setTasks((prev) =>
          prev.map((task) => (task.id === taskId ? updated : task))
        );

        return;
      }

      // Case 2: active task becomes completed
      setPendingCompletedIds((prev) => [...prev, taskId]);

      // immediate visual update
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? { ...task, completed_at: new Date().toISOString() }
            : task
        )
      );

      const updated = await toggleTaskComplete(taskId);

      const timerId = setTimeout(() => {
        setTasks((prev) => prev.filter((task) => task.id !== taskId));
        setCompletedTasks((prev) => {
          const exists = prev.some((task) => task.id === taskId);
          if (exists) {
            return prev.map((task) => (task.id === taskId ? updated : task));
          }
          return [updated, ...prev];
        });
        setPendingCompletedIds((prev) => prev.filter((id) => id !== taskId));
        delete completionTimersRef.current[taskId];
      }, 2000);

      completionTimersRef.current[taskId] = timerId;
    } catch (err) {
      setError(err.message);

      if (completionTimersRef.current[taskId]) {
        clearTimeout(completionTimersRef.current[taskId]);
        delete completionTimersRef.current[taskId];
      }

      setPendingCompletedIds((prev) => prev.filter((id) => id !== taskId));

      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, completed_at: null } : task
        )
      );
    }
  }

  async function handleDeleteTask(taskId) {
    // Soft-deletes the selected task and removes it from the active list.
    const confirmed = window.confirm("Вы уверены, что хотите удалить задачу?");
    if (!confirmed) return;

    try {
      setError("");
      const deletedTask = await deleteTask(taskId);

      setTasks((prev) => prev.filter((task) => task.id !== taskId));

      closeTaskModal();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUpdateTask(event) {
    // Updates the currently selected task from the edit modal.
    event.preventDefault();

    if (!selectedTask) return;

    if (!editTitle.trim()) {
      alert("Заголовок задачи обязателен");
      return;
    }

    try {
      setError("");

      const updatedData = {
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        priority: editPriority,
        due_date: fromInputDate(editDueDate),
      };

      const updatedTask = await updateTask(selectedTask.id, updatedData);

      setTasks((prev) =>
        prev.map((task) => (task.id === selectedTask.id ? updatedTask : task))
      );

      setSelectedTask(updatedTask);
      setModalMode("view");
      resetEditForm();
    } catch (err) {
      setError(err.message);
    }
  }

  tasks;

return (
  <div className="home-page">
    {/* Header: app title, deleted tasks access, and logout action */}
    <header className="home-header">
      <h1 className="home-logo">TodoMini</h1>
    </header>

    {/* Main shell: sidebar + center content + right panel */}
    <main
      className={`home-shell ${
        isCreatePanelOpen ? "with-right-panel" : "without-right-panel"
      }`}
      onClick={() => {
        if (isCreatePanelOpen && !isCreatePanelPinned) {
          closeCreatePanel();
        }
      }}
    >
      {/* Left sidebar: base navigation structure for future features */}
      <aside className="home-sidebar">
        <div className="sidebar-content">
          <div className="sidebar-top">
            <div className="sidebar-user">
              <div className="sidebar-avatar" />
              <div className="sidebar-user-info">
                <p className="sidebar-user-name">User</p>
                <p className="sidebar-user-email">user@example.com</p>
              </div>
            </div>

            <nav className="sidebar-nav">
              <button type="button" className="sidebar-nav-item sidebar-nav-item-active">
                Tasks
              </button>

              <button
                type="button"
                className="sidebar-nav-item"
                onClick={() => {
                  const completedSection = document.getElementById("completed-tasks-section");
                  if (completedSection) {
                    completedSection.scrollIntoView({ behavior: "smooth" });
                  }
                }}
              >
                Completed tasks
              </button>
            </nav>
          </div>

          <div className="sidebar-bottom">
            <button onClick={handleLogout} className="sidebar-logout-button">
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Center content: active and completed task lists */}
      <section className="home-center">
        <div className="card"> {/* Active tasks section */}
          <h2 className="section-title">My tasks</h2>

          {loading ? (
            <p className="section-muted">Loading tasks...</p>
          ) : tasks.length === 0 ? (
            <p className="section-muted">You do not have any active tasks</p>
          ) : (
            <div className="task-list">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`task-item clickable-task ${
                    pendingCompletedIds.includes(task.id) ? "completed" : ""
                  }`}
                >
                  <div className="task-row">
                    <div
                      className={`task-circle ${
                        pendingCompletedIds.includes(task.id) ? "done" : ""
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleComplete(task.id);
                      }}
                    />

                    <div
                      className="task-content"
                      onClick={() => openTaskModal(task)}
                    >
                      <h3 className="task-title">{task.title}</h3>
                      <p className="task-due">{formatDate(task.due_date)}</p>
                    </div>

                    <span
                      className={`priority-badge ${task.priority.toLowerCase()}`}
                    >
                      {task.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          className="card"
          id="completed-tasks-section"
        > {/* Completed tasks section (collapsible) */}
          <div
            className="tasks-header-row clickable-task"
            onClick={() => setShowCompleted((prev) => !prev)}
          >
            <h2 className="section-title">
              Completed tasks ({completedTasks.length})
            </h2>
          </div>

          {showCompleted && (
            <>
              {completedTasks.length === 0 ? (
                <p className="section-muted">No completed tasks</p>
              ) : (
                <div className="task-list">
                  {completedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="task-item completed clickable-task"
                    >
                      <div className="task-row">
                        <div
                          className="task-circle done"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleComplete(task.id);
                          }}
                        />

                        <div
                          className="task-content"
                          onClick={() => openTaskModal(task)}
                        >
                          <h3 className="task-title">{task.title}</h3>
                          <p className="task-due">{formatDate(task.due_date)}</p>
                        </div>

                        <span
                          className={`priority-badge ${task.priority.toLowerCase()}`}
                        >
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Right panel: create-task form */}
      {isCreatePanelOpen && (
        <aside
          className="home-right"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="card">
            <div className="panel-header">
              <h2 className="section-title">Create task</h2>

              <div className="panel-actions">
                  <button
                    type="button"
                    className="panel-icon-button"
                    onClick={toggleCreatePanelPinned}
                    title={isCreatePanelPinned ? "Unpin panel" : "Pin panel"}
                  >
                    {isCreatePanelPinned ? "✕📌" : "📌"}
                  </button>

                  <button
                    type="button"
                    className="panel-icon-button"
                    onClick={closeCreatePanel}
                    title="Close panel"
                  >
                    ×
                  </button>
                </div>
          </div>

            <form onSubmit={handleCreateTask} className="task-form">
              <div>
                <label className="form-label">Title *</label>
                <input
                  type="text"
                  placeholder="Enter task title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Description</label>
                <textarea
                  placeholder="Enter description (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="form-textarea"
                />
              </div>

              <div>
                <label className="form-label">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="form-input"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                </select>
              </div>

              <div>
                <label className="form-label">Due date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="form-input"
                />
              </div>

              <button type="submit" className="create-button">
                Create task
              </button>
            </form>

            {error && <p className="error-text">{error}</p>}
          </div>
        </aside>
      )}
    </main>

      <div
        className={`create-panel-handle ${isCreatePanelOpen ? "hidden-handle" : ""}`}
        onClick={openCreatePanel}
      >
        Create task
      </div>

      <button
        type="button"
        className="floating-trash-button"
        onClick={goToDeletedTasks}
        title="Deleted tasks"
      >
        🗑️
      </button>

    {/* Task modal: view mode and edit mode */}
    {selectedTask && (
      <div className="modal-backdrop" onClick={closeTaskModal}>
        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
          {modalMode === "view" ? (
            <>
              <h2 className="section-title">Task</h2>

              <p><strong>Title:</strong> {selectedTask.title}</p>
              <p><strong>Description:</strong> {selectedTask.description || "—"}</p>
              <p><strong>Priority:</strong> {selectedTask.priority}</p>
              <p>
                <strong>Due date:</strong>{" "}
                {selectedTask.due_date ? formatDate(selectedTask.due_date) : "—"}
              </p>
              <p>
                <strong>Created at:</strong>{" "}
                {formatDateTime(selectedTask.created_at)}
              </p>

              {selectedTask.is_deleted && (
                <p>
                  <strong>Deleted at:</strong>{" "}
                  {selectedTask.deleted_at
                    ? formatDateTime(selectedTask.deleted_at)
                    : "—"}
                </p>
              )}

              <div className="modal-actions">
                {!selectedTask.is_deleted && (
                  <>
                    <button
                      type="button"
                      className="edit-button"
                      onClick={enterEditMode}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="delete-button"
                      onClick={() => handleDeleteTask(selectedTask.id)}
                    >
                      Delete
                    </button>
                  </>
                )}

                <button
                  type="button"
                  className="close-button"
                  onClick={closeTaskModal}
                >
                  Close
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="section-title">Edit task</h2>

              <form onSubmit={handleUpdateTask} className="task-form">
                <div>
                  <label className="form-label">Title *</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">Description</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="form-textarea"
                  />
                </div>

                <div>
                  <label className="form-label">Priority</label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                    className="form-input"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Due date</label>
                  <input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="form-input"
                  />
                </div>

                <p>
                  <strong>Created at:</strong>{" "}
                  {formatDateTime(selectedTask.created_at)}
                </p>

                <div className="modal-actions">
                  <button type="submit" className="edit-button">
                    Save
                  </button>

                  <button
                    type="button"
                    className="close-button"
                    onClick={cancelEditMode}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    )}
  </div>
);
}