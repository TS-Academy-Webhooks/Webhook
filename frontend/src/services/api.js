import axios from 'axios';

// --- Token storage convention -------------------------------------------
// Whoever builds the auth pages (login/register) should store the JWT
// under this exact key on success, and clear it on logout:
//   localStorage.setItem(AUTH_TOKEN_KEY, token)
// If the team prefers a different storage strategy (httpOnly cookie,
// a context/state manager instead of localStorage, etc.), this is the
// only place that needs to change — every service imports `api` from here.
export const AUTH_TOKEN_KEY = 'auth_token';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
});

// Attach the JWT to every outgoing request, if one is stored.
api.interceptors.request.use((config) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Global 401 handling: an expired/invalid token clears itself and sends
// the user back to login, rather than every page having to check for this.
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem(AUTH_TOKEN_KEY);
            // Avoid an import cycle with react-router here; a hard redirect is
            // fine for a 401 since app state is invalid anyway.
            // TODO: once the login page exists, uncomment this redirect. For now, just log the 401 so we can see it in the console.
            console.warn('Unauthorized (401) response received. Redirecting to login.');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;