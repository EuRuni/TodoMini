const DEFAULT_LOCALE = "es-ES"; // futuro: cambiar dinámicamente

function pad(value) {
  return String(value).padStart(2, "0");
}

export function formatDate(dateString, locale = DEFAULT_LOCALE) {
  if (!dateString) return "—";

  const date = new Date(dateString);

  // formato manual para control total
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

export function formatDateTime(dateString, locale = DEFAULT_LOCALE) {
  if (!dateString) return "—";

  const date = new Date(dateString);

  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();

  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

// para inputs tipo="date"
export function toInputDate(dateString) {
  if (!dateString) return "";
  return new Date(dateString).toISOString().split("T")[0];
}

// de input → backend
export function fromInputDate(inputDate) {
  if (!inputDate) return null;
  return new Date(`${inputDate}T00:00:00`).toISOString();
}