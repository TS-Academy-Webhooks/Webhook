import api from "./api";
import { parseApiError } from "../utils/apiError";

function normalizePage(result, params) {
    const items = result.items ?? result.requests ?? [];
    const pagination = result.pagination ?? {};
    return {
        items,
        pagination: {
            page: pagination.page ?? Number(params.page ?? 1),
            limit: pagination.limit ?? Number(params.limit ?? 20),
            total: pagination.total ?? pagination.totalItems ?? items.length,
            totalPages: pagination.totalPages ?? 1,
        },
    };
}

export async function getDemoReceiverHistory(params = {}) {
    try {
        const { data } = await api.get("/demo-receiver", {
            params: {
                page: params.page ?? 1,
                limit: params.limit ?? 20,
                ...(params.event?.trim() ? { event: params.event.trim() } : {}),
                ...(params.signatureValid ? { signatureValid: params.signatureValid } : {}),
            },
        });
        return normalizePage(data.data ?? {}, params);
    } catch (error) {
        throw parseApiError(error);
    }
}

export async function clearDemoReceiverHistory() {
    try {
        const { data } = await api.delete("/demo-receiver");
        return data.data;
    } catch (error) {
        throw parseApiError(error);
    }
}

export async function getDemoReceiverConfiguration() {
    try {
        const { data } = await api.get("/demo-receiver/config");
        return data.data;
    } catch (error) {
        throw parseApiError(error);
    }
}

export async function updateDemoReceiverConfiguration(configuration) {
    try {
        const { data } = await api.patch("/demo-receiver/config", configuration);
        return data.data;
    } catch (error) {
        throw parseApiError(error);
    }
}

export async function resetDemoReceiverConfiguration() {
    try {
        const { data } = await api.delete("/demo-receiver/config");
        return data.data;
    } catch (error) {
        throw parseApiError(error);
    }
}
