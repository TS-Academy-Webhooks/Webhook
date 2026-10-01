// src/context/AuthContext.jsx
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { login as loginRequest, register as registerRequest, getCurrentUser } from '../services/authService';
import { AUTH_TOKEN_KEY } from '../services/api';

export const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    // Starts true: on first load we don't yet know if a stored token is
    // valid. ProtectedRoute waits for this before deciding to bounce to
    // /login, so a refresh on an authenticated page doesn't flash-redirect.
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function hydrate() {
            const token = localStorage.getItem(AUTH_TOKEN_KEY);
            if (!token) {
                setLoading(false);
                return;
            }
            try {
                const currentUser = await getCurrentUser();
                if (!cancelled) setUser(currentUser);
            } catch {
                // Stored token is invalid/expired — api.js's 401 interceptor may
                // also fire here, but clear it locally too so state stays honest.
                localStorage.removeItem(AUTH_TOKEN_KEY);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        hydrate();
        return () => {
            cancelled = true;
        };
    }, []);

    const login = useCallback(async (credentials) => {
        const { token, user: loggedInUser } = await loginRequest(credentials);
        localStorage.setItem(AUTH_TOKEN_KEY, token);
        setUser(loggedInUser);
        return loggedInUser;
    }, []);

    const register = useCallback(async (userData) => {
    return await registerRequest(userData);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        setUser(null);
    }, []);

    const value = { user, isAuthenticated: Boolean(user), loading, login, register, logout };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

