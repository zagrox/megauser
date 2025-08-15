

import React, { useState, useEffect, useCallback, ReactNode, createContext, useContext } from 'react';
import { readMe, registerUser, updateMe, updateUser as sdkUpdateUser, createItem, readItems, updateItem } from '@directus/sdk';
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
    changePassword: (passwords: { old: string; new: string }) => Promise<void>;
    requestPasswordReset: (email: string) => Promise<void>;
    resetPassword: (token: string, password: string) => Promise<void>;
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
                'location',
                'avatar',
                'language',
                'status',
                'role.*', // Fetch the entire role object
                'last_access',
                'email_notifications',
                'theme_dark',
                'theme_light',
                'text_direction',
                'nationalCode',
                'birthDate',
                'joindate'
            ] }));
            
            // After successfully fetching the user, try to fetch or create their associated profile.
            try {
                const profiles = await sdk.request(readItems('profiles', {
                    filter: { user_created: { _eq: me.id } },
                    limit: 1
                }));
                
                let mergedUser;
                
                if (profiles && profiles.length > 0) {
                    const profile = profiles[0];
                    mergedUser = { ...me, ...profile, profileId: profile.id };
                } else {
                    // If no profile exists (e.g., for a user who registered before this change), create one.
                    const newProfile = await sdk.request(createItem('profiles', {}));
                    mergedUser = { ...me, ...newProfile, profileId: newProfile.id };
                }
    
                setUser(mergedUser);

            } catch (profileError) {
                // If profile operations fail, log the error but still log the user in.
                // This prevents a login loop. The app can handle the missing profile data.
                console.error("Failed to fetch or create user profile. Logging in with base user data.", profileError);
                setUser(me);
            }

        } catch (directusError) {
            // This catch block now correctly handles only primary auth failures
            // and falls back to checking for a locally stored API key.
            try {
                const apiKey = localStorage.getItem('elastic_email_api_key');
                if (apiKey) {
                    const accountData = await apiFetch('/account/load', apiKey); // Validate key
                    setUser({
                        elastickey: apiKey,
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
        // The user's profile will be created on their first login via getMe.
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
        if (!user || !user.id || user.isApiKeyUser) throw new Error("User not authenticated or is an API key user.");

        const userFields = ['first_name', 'last_name', 'location', 'avatar', 'language', 'theme_dark', 'theme_light', 'email_notifications', 'text_direction', 'nationalCode', 'birthDate'];
        const profileFields = ['company', 'website', 'mobile', 'elastickey', 'elasticid'];

        const userPayload: any = {};
        const profilePayload: any = {};

        Object.keys(data).forEach(key => {
            if (userFields.includes(key)) {
                userPayload[key] = data[key];
            } else if (profileFields.includes(key)) {
                profilePayload[key] = data[key];
            }
        });
        
        const promises = [];
        if (Object.keys(userPayload).length > 0) {
            promises.push(sdk.request(updateMe(userPayload)));
        }
        if (Object.keys(profilePayload).length > 0 && user.profileId) {
            promises.push(sdk.request(updateItem('profiles', user.profileId, profilePayload)));
        }
        
        await Promise.all(promises);
        
        // Optimistically update the user state instead of re-fetching to avoid cache issues.
        // This ensures the UI reflects the change immediately and breaks the onboarding loop.
        setUser(currentUser => ({ ...currentUser, ...data }));
    }

    const changePassword = async (passwords: { old: string; new: string }) => {
        if (!user?.id) {
            throw new Error('User not authenticated or ID is missing.');
        }

        // Per user request, using PATCH /users/:id to update the password.
        const payload = {
            password: passwords.new,
        };

        // The Directus SDK's `updateUser` function handles PATCH /users/:id.
        await sdk.request(sdkUpdateUser(user.id, payload));
    };

    const requestPasswordReset = async (email: string) => {
        const payload = {
            email,
            reset_url: 'https://my.mailzila.com/#/reset-password',
        };
        // Explicitly stringify the body and set the Content-Type header
        // to prevent the SDK from incorrectly formatting the request payload.
        await sdk.request(() => ({
            method: 'POST',
            path: '/auth/password/request',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json',
            },
        }));
    };

    const resetPassword = async (token: string, password: string) => {
        const payload = {
            token,
            password,
        };
        // Explicitly stringify the body and set the Content-Type header
        // to prevent the SDK from incorrectly formatting the request payload.
        await sdk.request(() => ({
            method: 'POST',
            path: '/auth/password/reset',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json',
            },
        }));
    };

    const value = {
        user,
        isAuthenticated: !!user,
        loading,
        login,
        loginWithApiKey,
        register,
        logout,
        updateUser,
        changePassword,
        requestPasswordReset,
        resetPassword,
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
