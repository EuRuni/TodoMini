import { useEffect, useState } from "react";
import { removeToken } from "../services/auth";
import { fetchDeletedTasks } from "../services/tasks";
import { formatDateTime } from "../utils/date";
import "../styles/home.css";

export default function DeletedTasks({ setToken, goToHome }) {
  // Deleted task list state
  const [deletedTasks, setDeletedTasks] = useState([]);

  // General UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Read-only modal state
  const [selectedTask, setSelectedTask] = useState(null);

  function handleLogout() {
    removeToken();
    setToken(null);
  }

  // Loads deleted tasks for the current authenticated user
  async function loadDeletedTasks() {
    try {
      setLoading(true);
      setError("");
      const data = await fetchDeletedTasks();
      setDeletedTasks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDeletedTasks();
  }, []);

  return (
    <div className="home-page">
      {/* Top bar */}
      <header className="home-header">
        <h1 className="home-logo">TodoMini</h1>
      </header>

      {/* Main shell: sidebar + deleted task list */}
      <main className="home-shell without-right-panel">
        {/* Left sidebar */}
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
                <button
                  type="button"
                  className="sidebar-nav-item"
                  onClick={goToHome}
                >
                  Back to tasks
                </button>

                <button
                  type="button"
                  className="sidebar-nav-item sidebar-nav-item-active"
                >
                  Deleted tasks
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

        {/* Center content */}
        <section className="home-center">
          <div className="card">
            <h2 className="section-title">Deleted tasks</h2>

            {loading ? (
              <p className="section-muted">Loading deleted tasks...</p>
            ) : deletedTasks.length === 0 ? (
              <p className="section-muted">There are no deleted tasks yet.</p>
            ) : (
              <div className="task-list">
                {deletedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="task-item clickable-task completed"
                    onClick={() => setSelectedTask(task)}
                  >
                    <div className="task-row">
                      <div className="task-circle done" />

                      <div className="task-content">
                        <h3 className="task-title">{task.title}</h3>
                        <p className="task-due">
                          Deleted: {formatDateTime(task.deleted_at)}
                        </p>
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

            {error && <p className="error-text">{error}</p>}
          </div>
        </section>
      </main>

      {/* Read-only deleted task modal */}
      {selectedTask && (
        <div className="modal-backdrop" onClick={() => setSelectedTask(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="section-title">Task</h2>

            <p><strong>Title:</strong> {selectedTask.title}</p>
            <p><strong>Description:</strong> {selectedTask.description || "—"}</p>
            <p><strong>Priority:</strong> {selectedTask.priority}</p>

            <p>
              <strong>Created at:</strong>{" "}
              {formatDateTime(selectedTask.created_at)}
            </p>

            <p>
              <strong>Deleted at:</strong>{" "}
              {selectedTask.deleted_at
                ? formatDateTime(selectedTask.deleted_at)
                : "—"}
            </p>

            <div className="modal-actions">
              <button
                type="button"
                className="close-button"
                onClick={() => setSelectedTask(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}