import React, { useState, useEffect, useCallback, ReactNode, createContext, useContext } from 'react';
import { readMe, registerUser, updateMe } from '@directus/sdk';
import sdk from '../api/directus';
import { apiFetch } from '../api/elasticEmail';
import { DIRECTUS_URL } from '../api/config';

interface AuthContextType {
    user: any | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: (credentials: any) => Promise<void>;
    loginWithApiKey: (apiKey: string) => Promise<void>;
    register: (details: any) => Promise<any>;
    logout: () => void;
    updateUser: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    const getMe = useCallback(async () => {
        setLoading(true);
        try {
            // The Directus SDK will automatically use the stored token.
            // A failed `readMe` request is the canonical way to check for an invalid/expired session.
            const me = await sdk.request(readMe({ fields: [
                'id', 
                'first_name', 
                'last_name', 
                'email', 
                'panelkey',
                'last_access'
            ] }));
            setUser(me);
        } catch (directusError) {
            // This block correctly handles fallback logic when not logged in with Directus
            // or if the token is invalid. The console error is removed to reduce noise.
            try {
                const apiKey = localStorage.getItem('elastic_email_api_key');
                if (apiKey) {
                    const accountData = await apiFetch('/account/load', apiKey); // Validate key
                    setUser({
                        panelkey: apiKey,
                        first_name: accountData.firstname,
                        email: accountData.email,
                        isApiKeyUser: true,
                    });
                } else {
                    setUser(null); // No credentials found at all
                }
            } catch (apiKeyError) {
                console.error("Fallback API key authentication failed:", apiKeyError);
                setUser(null);
            }
        } finally {
            setLoading(false);
        }
    }, []);


    useEffect(() => {
        getMe();
    }, [getMe]);

    const login = async (credentials: any) => {
        // Use the SDK's login method, which handles token storage automatically.
        // It will throw a DirectusError on failure, which is caught by the AuthView.
        await sdk.login(credentials.email, credentials.password);
        await getMe();
    };
    
    const loginWithApiKey = async (apiKey: string) => {
        await apiFetch('/account/load', apiKey); // This will throw on failure
        localStorage.setItem('elastic_email_api_key', apiKey);
        await getMe(); // Re-check auth status which will now pick up the API key
    };

    const register = async (details: any) => {
        const { email, password, confirm_password, ...otherDetails } = details;
        // This will now return the created user object or throw on error.
        // The automatic login is removed to provide a better user experience,
        // especially if email verification is required.
        return await sdk.request(registerUser(email, password, otherDetails));
    };

    const logoutAsync = async () => {
        // Only attempt to log out from Directus if the user is not authenticated via API key.
        if (!user?.isApiKeyUser) {
            try {
                // The new SDK places logout at the top level
                await sdk.logout();
            } catch (error) {
                // It's possible for this to fail if the token is already expired or the server is unreachable.
                // We can log this, but it shouldn't block the user from being logged out on the client-side.
                console.warn("Directus SDK logout failed, proceeding with client-side logout:", error);
            }
        }
        // Always clear local credentials and reset user state.
        localStorage.removeItem('elastic_email_api_key');
        setUser(null);
    };

    const logout = () => {
        logoutAsync().catch(e => console.error("Logout process failed", e));
    }
    
    const updateUser = async (data: any) => {
        // Use `updateMe` for the currently authenticated user
        await sdk.request(updateMe(data));
        await getMe();
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