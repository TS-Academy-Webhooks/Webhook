import api from "./api";
import { parseApiError } from "../utils/apiError";

let refreshPromise = null;

function unwrapUser(data) {
    return data?.user ?? data ?? null;
}

function sessionFrom(response) {
    const payload = response?.data ?? {};
    return {
        token: payload.accessToken ?? payload.token ?? null,
        user: payload.user ?? (payload.id || payload._id || payload.email ? payload : null),
    };
}

export async function login({ email, password }) {
    try {
        const { data } = await api.post("/auth/login", { email: email.trim(), password });
        return sessionFrom(data);
    } catch (error) {
        throw parseApiError(error);
    }
}

export async function register({ name, email, password }) {
    try {
        const { data } = await api.post("/auth/register", {
            name: name.trim(),
            email: email.trim(),
            password,
        });
        return sessionFrom(data);
    } catch (error) {
        throw parseApiError(error);
    }
}

export async function getCurrentUser() {
    try {
        const { data } = await api.get("/auth/me");
        return unwrapUser(data.data);
    } catch (error) {
        throw parseApiError(error);
    }
}

export function refreshSession() {
    if (!refreshPromise) {
        refreshPromise = (async () => {
            try {
                const { data } = await api.post("/auth/refresh");
                return sessionFrom(data);
            } catch (error) {
                throw parseApiError(error);
            }
        })().finally(() => {
            refreshPromise = null;
        });
    }

    return refreshPromise;
}

export async function changePassword({ currentPassword, newPassword }) {
    try {
        const { data } = await api.post("/auth/change-password", {
            currentPassword,
            newPassword,
        });
        return data.data;
    } catch (error) {
        throw parseApiError(error);
    }
}

export async function endSession() {
    try {
        await api.post("/auth/logout");
    } catch {
        // The local session is cleared even if the server is unavailable.
    }
}
