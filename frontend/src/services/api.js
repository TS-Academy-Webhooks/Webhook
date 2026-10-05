import axios from "axios";

const apiBaseURL = "/api";
const api = axios.create({
    baseURL: apiBaseURL,
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
});

let accessToken = null;
let sessionVersion = 0;
let refreshPromise = null;
const sessionExpiredListeners = new Set();

export function setAccessToken(token) {
    accessToken = token || null;
    sessionVersion += 1;
}

export function clearAccessToken() {
    accessToken = null;
    sessionVersion += 1;
}

export function subscribeToSessionExpiry(listener) {
    sessionExpiredListeners.add(listener);
    return () => sessionExpiredListeners.delete(listener);
}

function notifySessionExpired() {
    sessionExpiredListeners.forEach((listener) => listener());
}

function isAuthEndpoint(url = "") {
    return /^\/?auth\/(login|register|refresh|logout)(?:[/?]|$)/.test(url);
}

async function refreshAccessToken() {
    if (refreshPromise) return refreshPromise;

    const versionAtStart = sessionVersion;
    refreshPromise = axios
        .post(`${apiBaseURL}/auth/refresh`, {}, { withCredentials: true })
        .then(({ data }) => {
            const payload = data?.data ?? {};
            const token = payload.accessToken ?? payload.token;
            if (!token) {
                throw new Error("The refresh response did not include an access token.");
            }

            if (sessionVersion === versionAtStart) setAccessToken(token);
            return accessToken;
        })
        .catch((error) => {
            if (sessionVersion === versionAtStart) {
                clearAccessToken();
                notifySessionExpired();
            }
            throw error;
        })
        .finally(() => {
            refreshPromise = null;
        });

    return refreshPromise;
}

api.interceptors.request.use((config) => {
    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const config = error.config;
        if (
            error.response?.status !== 401 ||
            !config ||
            config.__sessionRetry ||
            config.skipSessionRefresh ||
            isAuthEndpoint(config.url) ||
            !config.headers?.Authorization
        ) {
            return Promise.reject(error);
        }

        config.__sessionRetry = true;
        try {
            const token = await refreshAccessToken();
            if (!token) throw error;
            config.headers.Authorization = `Bearer ${token}`;
            return api(config);
        } catch {
            return Promise.reject(error);
        }
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
        normalized.fieldErrors = Object.fromEntries(
            (error.response?.data?.errors ?? [])
                .filter(({ field }) => field)
                .map(({ field, message }) => [field, message]),
        );
        normalized.response = error.response;
        throw normalized;
    }
}

export default api;
