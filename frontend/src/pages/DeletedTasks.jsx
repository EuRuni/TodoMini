import { useEffect, useState } from "react";
import { removeToken } from "../services/auth";
import { fetchDeletedTasks } from "../services/tasks";
import "../styles/home.css";

export default function DeletedTasks({ setToken, goToHome }) {
  const [deletedTasks, setDeletedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTask, setSelectedTask] = useState(null);

  function handleLogout() {
    removeToken();
    setToken(null);
  }

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
      <header className="home-header">
        <div>
          <h1 className="home-logo">TodoMini</h1>
          <p className="home-subtitle">Удаленные задачи</p>
        </div>

        <div className="header-actions">
          <button type="button" className="toggle-button" onClick={goToHome}>
            Назад к задачам
          </button>

          <button onClick={handleLogout} className="logout-button">
            Выйти
          </button>
        </div>
      </header>

      <main className="home-main single-column">
        <section className="home-left full-width">
          <div className="card">
            <h2 className="section-title">Удаленные задачи</h2>

            {loading ? (
              <p className="section-muted">Загрузка задач...</p>
            ) : deletedTasks.length === 0 ? (
              <p className="section-muted">Удаленных задач пока нет.</p>
            ) : (
              <div className="task-list">
                {deletedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="task-item clickable-task"
                    onClick={() => setSelectedTask(task)}
                    >
                    <div className="task-header">
                      <h3 className="task-title">{task.title}</h3>
                      <span className={`priority-badge ${task.priority.toLowerCase()}`}>
                        {task.priority}
                      </span>
                    </div>

                    {task.description && (
                      <p className="task-description">{task.description}</p>
                    )}

                    <div className="task-meta">
                      <span>
                        Создано: {new Date(task.created_at).toLocaleString()}
                      </span>
                      <span>
                        Удалено:{" "}
                        {task.deleted_at
                          ? new Date(task.deleted_at).toLocaleString()
                          : "—"}
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


        {selectedTask && (
        <div className="modal-backdrop" onClick={() => setSelectedTask(null)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="section-title">Задача</h2>

            <p><strong>Title:</strong> {selectedTask.title}</p>
            <p><strong>Description:</strong> {selectedTask.description || "—"}</p>
            <p><strong>Priority:</strong> {selectedTask.priority}</p>

            <p>
                <strong>Due date:</strong>{" "}
                {selectedTask.due_date
                ? new Date(selectedTask.due_date).toLocaleDateString()
                : "—"}
            </p>

            <p>
                <strong>Created at:</strong>{" "}
                {new Date(selectedTask.created_at).toLocaleString()}
            </p>

            <p>
                <strong>Deleted at:</strong>{" "}
                {selectedTask.deleted_at
                ? new Date(selectedTask.deleted_at).toLocaleString()
                : "—"}
            </p>

            <div className="modal-actions">
                <button
                type="button"
                className="close-button"
                onClick={() => setSelectedTask(null)}
                >
                Закрыть
                </button>
            </div>
            </div>
        </div>
        )}
     </div>
    )
}