import axios from "axios";

export const AUTH_TOKEN_KEY = "auth_token";

const api = axios.create({
    baseURL:
        import.meta.env.VITE_API_BASE_URL ||
        import.meta.env.VITE_BACKEND_API_URL ||
        "http://localhost:5000/api",
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
});

function readToken() {
    try {
        return localStorage.getItem(AUTH_TOKEN_KEY);
    } catch {
        return null;
    }
}

api.interceptors.request.use((config) => {
    const token = readToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            try {
                localStorage.removeItem(AUTH_TOKEN_KEY);
            } catch {
                // Storage may be unavailable in restricted browser contexts.
            }
        }
        return Promise.reject(error);
    },
);

export async function apiRequest(path, { method = "GET", body, params } = {}) {
    try {
        const response = await api.request({ url: path, method, data: body, params });
        return response.data.data;
    } catch (error) {
        const normalized = new Error(
            error.response?.data?.message || error.message || "Something went wrong",
        );
        normalized.status = error.response?.status ?? null;
        normalized.response = error.response;
        throw normalized;
    }
}

export default api;
