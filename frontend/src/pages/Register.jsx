import { useState } from "react";
import { registerRequest } from "../services/auth";
import "../styles/register.css";
import "../styles/login.css";

export default function Register({ goToLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleRegister(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError("Все поля обязательны");
      return;
    }

    if (password !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    try {
      await registerRequest(email, password);
      setSuccess("Регистрация прошла успешно. Теперь можно войти.");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="register-page">
      <div className="register-card">
        <h1 className="title">TodoMini</h1>
        <p className="subtitle">Регистрация</p>

        <form onSubmit={handleRegister} className="form">
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

          <input
            type="password"
            placeholder="Подтвердите пароль"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input"
          />

          <button type="submit" className="button">
            Зарегистрироваться
          </button>
        </form>

        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}

        <p className="footer-text">
          Уже есть аккаунт?{" "}
          <button
            type="button"
            onClick={goToLogin}
            className="link-button"
          >
            Войти
          </button>
        </p>
      </div>
    </div>
  );
}