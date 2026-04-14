function getAuthHeaders() {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
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

export async function fetchDeletedTasks() {
  const response = await fetch("http://localhost:8000/api/v1/tasks/deleted", {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Error loading deleted tasks");
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

export async function updateTask(taskId, taskData) {
  const response = await fetch(`http://localhost:8000/api/v1/tasks/${taskId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(taskData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Error updating task");
  }

  return data;
}

export async function deleteTask(taskId) {
  const response = await fetch(`http://localhost:8000/api/v1/tasks/${taskId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Error deleting task");
  }

  return data;
}

export async function fetchCompletedTasks() {
  const response = await fetch("http://localhost:8000/api/v1/tasks/completed", {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Error loading completed tasks");
  }

  return data;
}

export async function toggleTaskComplete(taskId) {
  const response = await fetch(
    `http://localhost:8000/api/v1/tasks/${taskId}/toggle-complete`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Error toggling task");
  }

  return data;
}