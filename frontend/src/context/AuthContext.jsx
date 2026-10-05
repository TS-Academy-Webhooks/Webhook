// src/context/AuthContext.jsx
import { useCallback, useEffect, useState } from 'react';
import { AuthContext } from './auth-context';
import {
    endSession,
    getCurrentUser,
    login as loginRequest,
    refreshSession,
    register as registerRequest,
} from '../services/authService';
import {
    clearAccessToken,
    setAccessToken,
    subscribeToSessionExpiry,
} from '../services/api';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    // Wait for the HttpOnly refresh cookie to restore an in-memory session
    // before redirecting an unauthenticated visitor from a protected route.
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        const unsubscribe = subscribeToSessionExpiry(() => {
            if (!cancelled) setUser(null);
        });

        async function hydrate() {
            try {
                const session = await refreshSession();
                if (!session.token) {
                    throw new Error('Refresh response did not include an access token.');
                }
                setAccessToken(session.token);
                const currentUser = session.user ?? await getCurrentUser();
                if (!currentUser) {
                    throw new Error('Refresh response did not include a user.');
                }
                if (!cancelled) setUser(currentUser);
            } catch {
                clearAccessToken();
                if (!cancelled) setUser(null);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        hydrate();
        return () => {
            cancelled = true;
            unsubscribe();
        };
    }, []);

    const login = useCallback(async (credentials) => {
        const { token, user: loggedInUser } = await loginRequest(credentials);
        if (!token) throw new Error('Login response did not include a token.');
        setAccessToken(token);
        setUser(loggedInUser);
        return loggedInUser;
    }, []);

    const register = useCallback(async (details) => {
        const { token, user: registeredUser } = await registerRequest(details);
        if (!token) throw new Error('Registration response did not include a token.');
        setAccessToken(token);
        setUser(registeredUser);
        return registeredUser;
    }, []);

    const logout = useCallback(async () => {
        clearAccessToken();
        setUser(null);
        await endSession();
    }, []);

    const value = { user, isAuthenticated: Boolean(user), loading, login, register, logout };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
