import { useEffect, useState } from "react";
import { removeToken } from "../services/auth";
import { createTask, fetchTasks } from "../services/tasks";
import "../styles/home.css";

export default function Home({ setToken }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [dueDate, setDueDate] = useState("");

  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  function handleLogout() {
    removeToken();
    setToken(null);
  }

  async function loadTasks() {
    try {
      setLoading(true);
      setError("");
      const data = await fetchTasks();
      setTasks(data);
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

  return (
    <div className="home-page">
      <header className="home-header">
        <div>
          <h1 className="home-logo">TodoMini</h1>
          <p className="home-subtitle">Управление задачами</p>
        </div>

        <button onClick={handleLogout} className="logout-button">
          Выйти
        </button>
      </header>

      <main className="home-main">
        <section className="home-left">
          <div className="card">
            <h2 className="section-title">Главная</h2>
            <p className="section-text">
              Добро пожаловать в систему TodoMini. На этой странице пользователь
              может создавать новые задачи и просматривать свои текущие задачи.
            </p>
          </div>

          <div className="card">
            <h2 className="section-title">Мои задачи</h2>

            {loading ? (
              <p className="section-muted">Загрузка задач...</p>
            ) : tasks.length === 0 ? (
              <p className="section-muted">У вас пока нет задач.</p>
            ) : (
              <div className="task-list">
                {tasks.map((task) => (
                  <div key={task.id} className="task-item">
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
    </div>
  );
}