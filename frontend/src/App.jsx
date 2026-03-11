import { useState } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";

function getToken() {
  return localStorage.getItem("token");
}

export default function App() {
  const [token, setToken] = useState(getToken());
  const [screen, setScreen] = useState("login");

  if (token) {
    return <Home setToken={setToken} />;
  }

  if (screen === "register") {
    return <Register goToLogin={() => setScreen("login")} />;
  }

  return <Login setToken={setToken} goToRegister={() => setScreen("register")} />;
}