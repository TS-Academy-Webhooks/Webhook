// src/context/AuthContext.jsx
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
    endSession,
    getCurrentUser,
    login as loginRequest,
    refreshSession,
    register as registerRequest,
} from '../services/authService';
import { AUTH_TOKEN_KEY } from '../services/api';

const AuthContext = createContext(undefined);

function saveToken(token) {
    try {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
    } catch {
        throw new Error('Unable to save your sign-in. Check your browser storage settings.');
    }
}

function clearToken() {
    try {
        localStorage.removeItem(AUTH_TOKEN_KEY);
    } catch {
        // Continue clearing in-memory authentication when storage is unavailable.
    }
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    // Starts true: on first load we don't yet know if a stored token is
    // valid. ProtectedRoute waits for this before redirecting an unauthenticated
    // visitor away from protected pages.
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function hydrate() {
            try {
                let currentUser;
                try {
                    currentUser = await getCurrentUser();
                } catch {
                    const session = await refreshSession();
                    saveToken(session.token);
                    currentUser = session.user;
                }
                if (!cancelled) setUser(currentUser);
            } catch {
                clearToken();
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
        saveToken(token);
        setUser(loggedInUser);
        return loggedInUser;
    }, []);

    const register = useCallback(async (details) => {
        const { token, user: registeredUser } = await registerRequest(details);
        saveToken(token);
        setUser(registeredUser);
        return registeredUser;
    }, []);

    const logout = useCallback(() => {
        void endSession();
        clearToken();
        setUser(null);
    }, []);

    const value = { user, isAuthenticated: Boolean(user), loading, login, register, logout };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- keep the existing auth context hook beside its provider.
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
