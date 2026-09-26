// Normalizes axios/backend errors into something UI-friendly.
//
// Expected failure shape from the backend:
// { success: false, message: "...", data: null, errors?: [{ field, message }] }
//
// Usage in a catch block:
//   const { message, fieldErrors } = parseApiError(err);

const FALLBACK_MESSAGE = 'Something went wrong. Please try again.';

export function parseApiError(error) {
    const response = error?.response?.data;

    if (!response) {
        // Network failure, timeout, CORS, server unreachable, etc.
        return {
            message: 'Unable to reach the server. Check your connection and try again.',
            fieldErrors: {},
            status: null,
        };
    }

    const fieldErrors = {};
    if (Array.isArray(response.errors)) {
        response.errors.forEach(({ field, message }) => {
            if (field) fieldErrors[field] = message;
        });
    }

    return {
        message: response.message || FALLBACK_MESSAGE,
        fieldErrors,
        status: error.response.status,
    };
}