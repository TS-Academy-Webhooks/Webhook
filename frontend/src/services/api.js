const BASE_URL =
  import.meta.env.VITE_BACKEND_API_URL || "http://localhost:5000/api";

export async function apiRequest(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = localStorage.getItem("token");
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => null);

  if (!res.ok || !json?.success) {
    const error = new Error(json?.message || "Something went wrong");
    error.status = res.status;
    throw error;
  }
  return json.data;
}