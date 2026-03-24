import { useEffect, useState } from "react";
import { removeToken } from "../services/auth";
import {
  createTask,
  deleteTask,
  fetchDeletedTasks,
  fetchTasks,
  updateTask,
} from "../services/tasks";
import "../styles/home.css";

export default function Home({ setToken, goToDeletedTasks }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [dueDate, setDueDate] = useState("");

  const [tasks, setTasks] = useState([]);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [selectedTask, setSelectedTask] = useState(null);
  const [modalMode, setModalMode] = useState("view"); // view | edit

  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState("MEDIUM");
  const [editDueDate, setEditDueDate] = useState("");

  function handleLogout() {
    removeToken();
    setToken(null);
  }

  async function loadTasks() {
    try {
      setLoading(true);
      setError("");

      const activeData = await fetchTasks();
      setTasks(activeData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  async function handleCreateTask(event) {
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
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
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
    setEditDueDate(
      selectedTask.due_date
        ? new Date(selectedTask.due_date).toISOString().split("T")[0]
        : ""
    );

    setModalMode("edit");
  }

  function cancelEditMode() {
    setModalMode("view");
    resetEditForm();
  }

  async function handleDeleteTask(taskId) {
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
        due_date: editDueDate ? new Date(editDueDate).toISOString() : null,
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

  const visibleTasks = tasks;

  return (
    <div className="home-page">
      <header className="home-header">
        <div>
          <h1 className="home-logo">TodoMini</h1>
          <p className="home-subtitle">Управление задачами</p>
        </div>

      <div className="header-actions">
        <button
          type="button"
          className="toggle-button"
          onClick={goToDeletedTasks}
        >
          Удаленные задачи
        </button>

        <button onClick={handleLogout} className="logout-button">
          Выйти
        </button>
      </div>
    </header>

      <main className="home-main">
        <section className="home-left">
          <div className="card">
            <div className="tasks-header-row">
              <h2 className="section-title">
                Мои задачи
              </h2>
            </div>

            {loading ? (
              <p className="section-muted">Загрузка задач...</p>
            ) : visibleTasks.length === 0 ? (
              <p className="section-muted">
                {showDeleted
                  ? "Удаленных задач пока нет."
                  : "У вас пока нет активных задач."}
              </p>
            ) : (
              <div className="task-list">
                {visibleTasks.map((task) => (
                  <div
                    key={task.id}
                    className="task-item clickable-task"
                    onClick={() => openTaskModal(task)}
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
                        Срок:{" "}
                        {task.due_date
                          ? new Date(task.due_date).toLocaleDateString()
                          : "не указан"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="home-right">
          <div className="card">
            <h2 className="section-title">Создание задачи</h2>

            <form onSubmit={handleCreateTask} className="task-form">
              <div>
                <label className="form-label">Заголовок *</label>
                <input
                  type="text"
                  placeholder="Введите заголовок задачи"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Описание</label>
                <textarea
                  placeholder="Введите описание (необязательно)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="form-textarea"
                />
              </div>

              <div>
                <label className="form-label">Приоритет</label>
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
                <label className="form-label">Дата выполнения</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="form-input"
                />
              </div>

              <button type="submit" className="create-button">
                Создать задачу
              </button>
            </form>

            {error && <p className="error-text">{error}</p>}
          </div>
        </section>
      </main>

      {selectedTask && (
        <div className="modal-backdrop" onClick={closeTaskModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            {modalMode === "view" ? (
              <>
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

                {selectedTask.is_deleted && (
                  <p>
                    <strong>Deleted at:</strong>{" "}
                    {selectedTask.deleted_at
                      ? new Date(selectedTask.deleted_at).toLocaleString()
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
                        Редактировать
                      </button>

                      <button
                        type="button"
                        className="delete-button"
                        onClick={() => handleDeleteTask(selectedTask.id)}
                      >
                        Удалить
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    className="close-button"
                    onClick={closeTaskModal}
                  >
                    Закрыть
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="section-title">Редактирование задачи</h2>

                <form onSubmit={handleUpdateTask} className="task-form">
                  <div>
                    <label className="form-label">Заголовок *</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div>
                    <label className="form-label">Описание</label>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="form-textarea"
                    />
                  </div>

                  <div>
                    <label className="form-label">Приоритет</label>
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
                    <label className="form-label">Дата выполнения</label>
                    <input
                      type="date"
                      value={editDueDate}
                      onChange={(e) => setEditDueDate(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <p>
                    <strong>Created at:</strong>{" "}
                    {new Date(selectedTask.created_at).toLocaleString()}
                  </p>

                  <div className="modal-actions">
                    <button type="submit" className="edit-button">
                      Сохранить
                    </button>

                    <button
                      type="button"
                      className="close-button"
                      onClick={cancelEditMode}
                    >
                      Отмена
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