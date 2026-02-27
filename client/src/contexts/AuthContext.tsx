import React, { createContext, useState, useEffect, useContext } from 'react';
import { storage } from '../lib/storage';

// Define types locally if not available globally (assuming User is global or I need to import it)
// Checking previous files, User might be global or needing import. 
// I will assume User is defined in types or I will use 'any' for now to be safe and fix later if needed, 
// but better to import if possible. I'll use 'any' for user type to avoid breaking if global type is missing, 
// BUT the original code used 'User', so it must be available.
// I will keep 'User' usage.

// Define User interface locally
export interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    companyId?: string;
    avatar?: string;
    level?: number;
}

interface AuthContextData {
    user: User | null;
    login: (userData: User, token: string) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);

    const login = (userData: User, token: string) => {
        storage.set('token', token);
        storage.set('user', userData);
        setUser(userData);
        if (userData.companyId) {
            storage.set('selectedCompanyId', userData.companyId);
        }
    };

    const logout = () => {
        storage.remove('token');
        storage.remove('user');
        storage.remove('selectedCompanyId');
        setUser(null);
    };

    useEffect(() => {
        const storedUser = storage.get('user');
        if (storedUser) {
            setUser(storedUser);
        }

        // Listen for force logout events from api.ts
        const handleLogoutEvent = () => logout();
        window.addEventListener('auth:logout', handleLogoutEvent);

        return () => window.removeEventListener('auth:logout', handleLogoutEvent);
    }, [logout]);

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
