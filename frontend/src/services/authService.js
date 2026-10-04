import api from "./api";
import { parseApiError } from "../utils/apiError";

function unwrapUser(data) {
    return data.user ?? data;
}

export async function login({ email, password }) {
    try {
        const { data } = await api.post("/auth/login", { email, password });
        return { token: data.data.accessToken, user: unwrapUser(data.data) };
    } catch (error) {
        throw parseApiError(error);
    }
}

export async function register({ name, email, password }) {
    try {
        const { data } = await api.post("/auth/register", { name, email, password });
        return { token: data.data.accessToken, user: unwrapUser(data.data) };
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

export async function refreshSession() {
    try {
        const { data } = await api.post("/auth/refresh");
        return { token: data.data.accessToken, user: unwrapUser(data.data) };
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
