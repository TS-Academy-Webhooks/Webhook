import api from "./api";
import { parseApiError } from "../utils/apiError";

function normalizeShipment(shipment) {
    if (!shipment) return shipment;
    return {
        ...shipment,
        id: shipment.id ?? shipment._id,
        statusHistory: shipment.statusHistory ?? shipment.timeline ?? [],
        timeline: shipment.timeline ?? shipment.statusHistory ?? [],
    };
}

function normalizePage(result, params) {
    const items = result.items ?? result.shipments ?? [];
    const pagination = result.pagination ?? {};
    return {
        items: items.map(normalizeShipment),
        pagination: {
            page: pagination.page ?? Number(params.page ?? 1),
            limit: pagination.limit ?? Number(params.limit ?? 20),
            total: pagination.total ?? pagination.totalItems ?? items.length,
            totalPages: pagination.totalPages ?? 1,
        },
    };
}

export async function getShipments(params = {}) {
    try {
        const { data } = await api.get("/shipments", {
            params: {
                page: params.page ?? 1,
                limit: params.limit ?? 20,
                ...(params.search?.trim() ? { search: params.search.trim() } : {}),
                ...(params.status ? { status: params.status } : {}),
            },
        });
        return normalizePage(data.data ?? {}, params);
    } catch (error) {
        throw parseApiError(error);
    }
}

export async function getShipment(id) {
    try {
        const { data } = await api.get(`/shipments/${encodeURIComponent(id)}`);
        return normalizeShipment(data.data);
    } catch (error) {
        throw parseApiError(error);
    }
}

export async function createShipment(payload) {
    try {
        const { data } = await api.post("/shipments", payload);
        return normalizeShipment(data.data);
    } catch (error) {
        throw parseApiError(error);
    }
}

export async function updateShipmentStatus(id, { status, note }) {
    try {
        const { data } = await api.patch(
            `/shipments/${encodeURIComponent(id)}/status`,
            { status, ...(note?.trim() ? { note: note.trim() } : {}) },
        );
        return normalizeShipment(data.data);
    } catch (error) {
        throw parseApiError(error);
    }
}

export async function assignShipmentCustomer(id, customerId) {
    try {
        const { data } = await api.patch(
            `/shipments/${encodeURIComponent(id)}/customer`,
            { customerId: customerId.trim() },
        );
        return normalizeShipment(data.data);
    } catch (error) {
        throw parseApiError(error);
    }
}

export async function trackShipment(trackingNumber) {
    try {
        const { data } = await api.get(
            `/tracking/${encodeURIComponent(trackingNumber.trim())}`,
        );
        const shipment = data.data ?? {};
        const timeline = shipment.timeline ?? shipment.statusHistory ?? [];
        return {
            ...shipment,
            timeline: timeline.map((entry) => ({
                ...entry,
                at: entry.at ?? entry.timestamp,
            })),
        };
    } catch (error) {
        throw parseApiError(error);
    }
}
