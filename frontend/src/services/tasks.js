function getAuthHeaders() {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  };
}

export async function fetchTasks() {
  const response = await fetch("http://localhost:8000/api/v1/tasks", {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Error loading tasks");
  }

  return data;
}

export async function createTask(taskData) {
  const response = await fetch("http://localhost:8000/api/v1/tasks", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(taskData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Error creating task");
  }

  return data;
}