import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('auth_token'));
    const [loading, setLoading] = useState(true);

    const api = axios.create({
        baseURL: API_URL,
        headers: token ? { Authorization: `Bearer ${token}` } : {}
    });

    // Update axios headers when token changes
    useEffect(() => {
        if (token) {
            api.defaults.headers.Authorization = `Bearer ${token}`;
        } else {
            delete api.defaults.headers.Authorization;
        }
    }, [token]);

    const fetchUser = useCallback(async () => {
        if (!token) {
            setLoading(false);
            return;
        }
        try {
            const response = await api.get('/auth/me');
            setUser(response.data);
        } catch (error) {
            console.error('Failed to fetch user:', error);
            logout();
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const login = async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        const { access_token, user: userData } = response.data;
        localStorage.setItem('auth_token', access_token);
        setToken(access_token);
        setUser(userData);
        return userData;
    };

    const register = async (email, password, name) => {
        const response = await api.post('/auth/register', { email, password, name });
        const { access_token, user: userData } = response.data;
        localStorage.setItem('auth_token', access_token);
        setToken(access_token);
        setUser(userData);
        return userData;
    };

    const logout = () => {
        localStorage.removeItem('auth_token');
        setToken(null);
        setUser(null);
    };

    const updateUser = async (data) => {
        const response = await api.put('/auth/me', data);
        setUser(response.data);
        return response.data;
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            loading,
            login,
            register,
            logout,
            updateUser,
            api,
            isAuthenticated: !!user,
            isAdmin: user?.role === 'admin'
        }}>
            {children}
        </AuthContext.Provider>
    );
};
