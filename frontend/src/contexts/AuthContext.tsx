import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface User {
    id: string;
    email: string;
    role: string;
}

interface AuthContextType {
    token: string | null;
    user: User | null;
    login: (token: string) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [token, setToken] = useState<string | null>(localStorage.getItem('access_token'));
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        if (token) {
            localStorage.setItem('access_token', token);
            // Decode JWT payload (Base64Url decode middle part)
            try {
                const payloadBase64 = token.split('.')[1];
                const decodedJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
                const decoded = JSON.parse(decodedJson);

                // Example JWT payload from FastAPI typically has 'sub' (subject/user id)
                setUser({
                    id: decoded.sub,
                    email: 'admin@digitalpsych.com', // In a real app, GET /me to fetch full profile
                    role: 'SuperAdmin'
                });

                // Set axios default header
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            } catch (e) {
                console.error("Failed to decode token", e);
                logout();
            }
        } else {
            localStorage.removeItem('access_token');
            setUser(null);
            delete axios.defaults.headers.common['Authorization'];
        }
    }, [token]);

    const login = (newToken: string) => {
        setToken(newToken);
    };

    const logout = () => {
        setToken(null);
    };

    return (
        <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
