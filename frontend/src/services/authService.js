// src/services/authService.js
import api from './api';
import { parseApiError } from '../utils/apiError';

// ASSUMPTION (unconfirmed with the Backend Authentication owner):
//   POST /api/auth/login -> data: { token, user }
//   GET  /api/auth/me    -> data: <user>
// Same response envelope as the rest of the API, but the actual auth
// contract hasn't been locked down the way the webhook contract was.
// Confirm before relying on this shape elsewhere.

export async function login({ email, password }) {
    try {
        const { data } = await api.post('/auth/login', { email, password });
        return data.data; // { token, user }
    } catch (error) {
        throw parseApiError(error);
    }
}

export async function getCurrentUser() {
    try {
        const { data } = await api.get('/auth/me');
        return data.data; // user
    } catch (error) {
        throw parseApiError(error);
    }
}

// ASSUMPTION: registration does NOT auto-login — the roadmap's own
// "Complete System Flow" shows Register -> Login as separate steps, so
// this returns whatever the backend sends (presumably the created user)
// without touching AUTH_TOKEN_KEY. Signup.jsx redirects to /login after.
export async function register({ name, email, password }) {
    try {
        const { data } = await api.post('/auth/register', { name, email, password });
        return data.data;
    } catch (error) {
        throw parseApiError(error);
    }
}