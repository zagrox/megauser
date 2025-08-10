import React, { useState, useEffect, useCallback, ReactNode, createContext, useContext } from 'react';
import { directusFetch } from '../api/directus';
import { apiFetch } from '../api/elasticEmail';

interface AuthContextType {
    user: any | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: (credentials: any) => Promise<void>;
    loginWithApiKey: (apiKey: string) => Promise<void>;
    register: (details: any) => Promise<void>;
    logout: () => void;
    updateUser: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    const getMe = useCallback(async () => {
        setLoading(true);
        const token = localStorage.getItem('directus_access_token');
        if (token) {
            try {
                const { data } = await directusFetch('/users/me?fields=*.*');
                setUser(data);
            } catch (error) {
                console.error("Failed to fetch user:", error);
                localStorage.removeItem('directus_access_token');
                setUser(null);
            } finally {
                setLoading(false);
            }
            return;
        }

        const apiKey = localStorage.getItem('elastic_email_api_key');
        if (apiKey) {
            try {
                const accountData = await apiFetch('/account/load', apiKey); // Validate key and get data
                setUser({
                    elastic_email_api_key: apiKey,
                    first_name: accountData.firstname,
                    email: accountData.email,
                    isApiKeyUser: true,
                });
            } catch (error) {
                console.error("Stored API key is invalid, removing.", error);
                localStorage.removeItem('elastic_email_api_key');
                setUser(null);
            } finally {
                setLoading(false);
            }
            return;
        }

        setLoading(false);
    }, []);


    useEffect(() => {
        getMe();
    }, [getMe]);

    const login = async (credentials: any) => {
        const { data } = await directusFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });
        localStorage.setItem('directus_access_token', data.access_token);
        await getMe();
    };
    
    const loginWithApiKey = async (apiKey: string) => {
        const accountData = await apiFetch('/account/load', apiKey); // This will throw on failure
        localStorage.setItem('elastic_email_api_key', apiKey);
        setUser({
            elastic_email_api_key: apiKey,
            first_name: accountData.firstname,
            email: accountData.email,
            isApiKeyUser: true,
        });
    };

    const register = async (details: any) => {
        await directusFetch('/users', {
            method: 'POST',
            body: JSON.stringify(details),
        });
        await login({ email: details.email, password: details.password });
    };

    const logout = () => {
        localStorage.removeItem('directus_access_token');
        localStorage.removeItem('elastic_email_api_key');
        setUser(null);
    };
    
    const updateUser = async (data: any) => {
        const { data: updatedUser } = await directusFetch('/users/me', {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
        setUser(updatedUser);
    }

    const value = {
        user,
        isAuthenticated: !!user,
        loading,
        login,
        loginWithApiKey,
        register,
        logout,
        updateUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};