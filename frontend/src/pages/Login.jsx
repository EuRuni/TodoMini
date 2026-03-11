import { useState } from "react";
import { loginRequest, saveToken } from "../services/auth";
import "../styles/login.css";

export default function Login({ setToken, goToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleLogin(event) {
    event.preventDefault();
    setError("");

    try {
      const data = await loginRequest(email, password);
      saveToken(data.access_token);
      setToken(data.access_token);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="title">TodoMini</h1>
        <p className="subtitle">Вход в систему</p>

        <form onSubmit={handleLogin} className="form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
          />

          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
          />

          <button type="submit" className="button">
            Войти
          </button>
        </form>

        {error && <p className="error">{error}</p>}

        <p className="footer-text">
          Нет аккаунта?{" "}
          <button
            type="button"
            onClick={goToRegister}
            className="link-button"
          >
            Зарегистрироваться
          </button>
        </p>
      </div>
    </div>
  );
}