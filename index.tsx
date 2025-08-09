
import React, { useState, useEffect, useCallback, ReactNode, createContext, useContext, useMemo, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { useTranslation, I18nextProvider } from 'react-i18next';
import i18n from './i18n';

// --- CONFIGURATION ---
// TODO: Replace with your public Directus instance URL
const DIRECTUS_URL = 'https://accounting.mailzila.com'; 
const ELASTIC_EMAIL_API_BASE = 'https://api.elasticemail.com/v2';
const ELASTIC_EMAIL_API_V4_BASE = 'https://api.elasticemail.com/v4';

// --- Icon Components ---
const Icon = ({ path, className = '', style }: { path: string; className?: string; style?: React.CSSProperties }) => (
  <svg className={`icon ${className}`} style={style} width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
    <path d={path} />
  </svg>
);

const ICONS = {
    DOWNLOAD: "M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 11l5 5 5-5M12 4v12",
    DASHBOARD: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
    ACCOUNT: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    BOUNCED: "M9 10l-5 5 5 5M20 4v7a4 4 0 01-4 4H4",
    CALENDAR: "M8 2v4M16 2v4M3 10h18M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
    CAMPAIGNS: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0",
    CHEVRON_DOWN: "M6 9l6 6 6-6",
    CLICK: "M9 11.3l3.71 2.7-1.42 1.42a.5.5 0 01-.71 0l-1.58-1.58a1 1 0 00-1.42 0l-1.42 1.42a1 1 0 000 1.42l4.24 4.24a.5.5 0 00.71 0l7.07-7.07",
    COMPLAINT: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v10zM12 9v2m0 4h.01",
    CONTACTS: "M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zM21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    BUY_CREDITS: "M22 8a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8zM6 14h4v-2H6v2z",
    STAR: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    DELETE: "M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2",
    DOMAINS: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    EMAIL_LISTS: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
    EYE: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
    EYE_OFF: "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22",
    KEY: "M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4",
    LOGOUT: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
    MAIL: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6",
    MENU: "M3 12h18M3 6h18M3 18h18",
    PENCIL: "M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z",
    PLUS: "M12 5v14m-7-7h14",
    PRICE_TAG: "M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7H7.01",
    SEGMENTS: "M20.5 11H19v-2.14a2.5 2.5 0 0 0-2.5-2.5H14V4.5a2.5 2.5 0 0 0-2.5-2.5h-3A2.5 2.5 0 0 0 6 4.5V6H3.5a2.5 2.5 0 0 0-2.5 2.5V11H2.5a2.5 2.5 0 0 1 0 5H1v2.14a2.5 2.5 0 0 0 2.5 2.5H6V23.5a2.5 2.5 0 0 0 2.5 2.5h3A2.5 2.5 0 0 0 14 23.5V22h2.5a2.5 2.5 0 0 0 2.5-2.5V17h1.5a2.5 2.5 0 0 1 0-5z",
    SEND_EMAIL: "m22 2-7 20-4-9-9-4 20-7Zm0 0L11 13 2 9l20-7Z",
    SMTP: "M5 2h14a2 2 0 012 2v16a2 2 0 01-2 2H5a2 2 0 01-2-2V4a2 2 0 012-2zM9 6h6m-6 4h6m-6 4h6M9 18h.01",
    STATISTICS: "M23 6l-9.5 9.5-5-5L1 18",
    TRENDING_UP: "M23 6l-9.5 9.5-5-5L1 18",
    UPLOAD: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m14-7l-5-5-5 5m5-5v12",
    USER_PLUS: "M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M8.5 3a4 4 0 1 0 0 8 4 4 0 0 0 0 8zM20 8v6M23 11h-6",
    VERIFY: "M22 11.08V12a10 10 0 1 1-5.93-9.14",
    CHECK: "M20 6L9 17l-5-5",
    X_CIRCLE: "M10 10l4 4m0-4l-4 4M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    LOADING_SPINNER: "M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83",
    SEARCH: "M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35",
    SUN: "M12 1v2M4.93 4.93l1.41 1.41M1 12h2M4.93 19.07l1.41-1.41M12 23v-2M19.07 19.07l-1.41-1.41M23 12h-2M19.07 4.93l-1.41-1.41M12 6a6 6 0 100 12 6 6 0 000-12z",
    MOON: "M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z",
    DESKTOP: "M9 17v2m6-2v2M9 15h6M4 3h16a1 1 0 011 1v8a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z",
    LANGUAGE: "M20 12a8 8 0 10-16 0 8 8 0 0016 0zM2 12h2M10 2v2M10 20v2M14 4.5l-1.8-1.8M14 19.5l-1.8 1.8M4.5 14l-1.8 1.8M19.5 14l1.8 1.8"
};

// --- API Types ---
type Contact = {
    Email: string;
    FirstName: string;
    LastName: string;
    Status: 'Active' | 'Transactional' | 'Engaged' | 'Inactive' | 'Abuse' | 'Bounced' | 'Unsubscribed';
    Source: string;
    DateAdded: string;
    DateUpdated?: string;
    StatusChangeDate?: string;
    Activity?: {
        TotalSent?: number;
        TotalOpened?: number;
        TotalClicked?: number;
        TotalFailed?: number;
        LastSent?: string;
        LastOpened?: string;
        LastClicked?: string;
        LastFailed?: string;
    };
    CustomFields?: Record<string, any>;
};
type List = {
    ListName: string;
    DateAdded: string;
};
type Segment = {
    Name: string;
    Rule: string;
    ContactsCount: number;
    DateAdded: string;
};

// --- API Helpers ---
const directusFetch = async (endpoint: string, options: RequestInit = {}) => {
    const url = `${DIRECTUS_URL}${endpoint}`;
    const token = localStorage.getItem('directus_access_token');
    
    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    try {
        const response = await fetch(url, { ...options, headers });

        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                // If the error response is not JSON, use the status text.
                throw new Error(`HTTP error! Status: ${response.status} - ${response.statusText}`);
            }
            // Try to get a specific error message from Directus's error structure.
            const errorMessage = errorData?.errors?.[0]?.message || 'An unknown API error occurred.';
            throw new Error(errorMessage);
        }

        if (response.status === 204) { // No Content
            return null;
        }
        
        // Handle potentially empty responses
        const text = await response.text();
        return text ? JSON.parse(text) : null;

    } catch (error) {
        // This 'catch' block will handle network errors (like DNS, offline, etc.)
        // and errors thrown from the !response.ok block.
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
             throw new Error(`Network error: Could not connect to the API at ${DIRECTUS_URL}. Please check the URL and your network connection.`);
        }
        // Re-throw other errors (like the ones we created from bad responses)
        throw error;
    }
};


// --- API Helper for v2 ---
const apiFetch = async (endpoint: string, apiKey: string, options: { method?: 'GET' | 'POST', params?: Record<string, any> } = {}) => {
  const { method = 'GET', params = {} } = options;
  
  const allParams = new URLSearchParams({
    apikey: apiKey,
    ...params
  });

  const url = `${ELASTIC_EMAIL_API_BASE}${endpoint}`;
  let response;

  if (method === 'POST') {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
      },
      body: allParams
    });
  } else { // GET
    response = await fetch(`${url}?${allParams.toString()}`);
  }

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || `HTTP error! status: ${response.status}`);
  }
  
  return data.data;
};

// --- API Helper for v4 ---
const apiFetchV4 = async (endpoint: string, apiKey: string, options: { method?: 'GET' | 'POST' | 'PUT' | 'DELETE', params?: Record<string, any>, body?: any } = {}) => {
    const { method = 'GET', params = {}, body = null } = options;
    const queryParams = new URLSearchParams(params).toString();
    const url = `${ELASTIC_EMAIL_API_V4_BASE}${endpoint}${queryParams ? `?${queryParams}` : ''}`;

    const fetchOptions: RequestInit = {
        method,
        headers: {
            'X-ElasticEmail-ApiKey': apiKey,
        }
    };
    
    if (body && (method === 'POST' || method === 'PUT')) {
        fetchOptions.headers['Content-Type'] = 'application/json';
        fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
            const errorData = await response.json();
            errorMessage = errorData.Error || 'An unknown API error occurred.';
        } catch (e) {
            // response was not json, use default message
        }
        throw new Error(errorMessage);
    }
    
    if (response.status === 204) {
        return {};
    }

    const text = await response.text();
    if (!text) {
        return {};
    }

    try {
        return JSON.parse(text);
    } catch (e) {
        console.warn(`API for endpoint ${endpoint} returned a non-JSON success response. Text: "${text}"`);
        // This handles cases where a success response (like 200 OK for DELETE) has a non-JSON body like "OK".
        // Returning a success-like object prevents the caller's try/catch from failing.
        return { success: true, nonJsonText: text };
    }
};

const apiUploadV4 = async (endpoint: string, apiKey: string, formData: FormData) => {
    const url = `${ELASTIC_EMAIL_API_V4_BASE}${endpoint}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'X-ElasticEmail-ApiKey': apiKey
        },
        body: formData
    });

    if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
            const errorData = await response.json();
            errorMessage = errorData.Error || 'An unknown API error occurred.';
        } catch (e) { /* no-op */ }
        throw new Error(errorMessage);
    }

    if (response.status === 202) { // Import returns 202 Accepted
        return {};
    }

    const text = await response.text();
    return text ? JSON.parse(text) : {};
};

// --- Authentication Context ---
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


// --- Theme Context ---
type Theme = 'light' | 'dark' | 'auto';
interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    effectiveTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [theme, _setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'auto');
    const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light');

    const setTheme = (newTheme: Theme) => {
        localStorage.setItem('theme', newTheme);
        _setTheme(newTheme);
    };

    useEffect(() => {
        const applyTheme = (t: Theme) => {
            if (t === 'auto') {
                const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
                const newEffectiveTheme = mediaQuery.matches ? 'dark' : 'light';
                setEffectiveTheme(newEffectiveTheme);
                document.documentElement.setAttribute('data-theme', newEffectiveTheme);
            } else {
                setEffectiveTheme(t);
                document.documentElement.setAttribute('data-theme', t);
            }
        };

        applyTheme(theme);
        
        if (theme === 'auto') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = (e: MediaQueryListEvent) => {
                const newEffectiveTheme = e.matches ? 'dark' : 'light';
                setEffectiveTheme(newEffectiveTheme);
                document.documentElement.setAttribute('data-theme', newEffectiveTheme);
            };
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, [theme]);

    const value = { theme, setTheme, effectiveTheme };

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

// --- Custom Hook for API calls (v2) ---
const useApi = (endpoint: string, apiKey: string, params: Record<string, any> = {}, refetchIndex = 0) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{message: string, endpoint: string} | null>(null);
  
  const paramsString = JSON.stringify(params);

  useEffect(() => {
    if (!apiKey || !endpoint) {
        setLoading(false);
        return;
    };

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiFetch(endpoint, apiKey, { params: JSON.parse(paramsString) });
        setData(result);
      } catch (err: any) {
        setError({message: err.message, endpoint});
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [endpoint, apiKey, paramsString, refetchIndex]);

  return { data, loading, error };
};

// --- Custom Hook for API calls (v4) ---
const useApiV4 = (endpoint: string, apiKey: string, params: Record<string, any> = {}, refetchIndex = 0) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{message: string, endpoint: string} | null>(null);

  const paramsString = JSON.stringify(params);

  useEffect(() => {
    if (!apiKey || !endpoint) {
        setLoading(false);
        setData(null);
        return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiFetchV4(endpoint, apiKey, { params: JSON.parse(paramsString) });
        setData(result);
      } catch (err: any) {
        setError({ message: err.message, endpoint });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [endpoint, apiKey, paramsString, refetchIndex]);

  return { data, loading, error };
};

// --- Reusable Components ---
const Loader = () => <div className="loader"></div>;

const ActionStatus = ({ status, onDismiss }: { status: {type: 'success' | 'error', message: string} | null, onDismiss?: () => void }) => {
    useEffect(() => {
        if (status && status.type === 'success' && onDismiss) {
            const timer = setTimeout(() => {
                onDismiss();
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [status, onDismiss]);

    if (!status?.message) return null;
    return (
        <div className={`action-status ${status.type}`}>
            {status.message}
            {onDismiss && <button onClick={onDismiss} className="dismiss-btn">&times;</button>}
        </div>
    );
};

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: ReactNode }) => {
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{title}</h3>
                    <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
                        &times;
                    </button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
};


const ErrorMessage = ({ error }: {error: {endpoint: string, message: string}}) => {
  const { t } = useTranslation();
  return (
    <div className="error-message">
        <strong>{t('apiErrorOn', { endpoint: error.endpoint })}</strong> {error.message}
    </div>
  );
}

const CenteredMessage = ({ children, style }: { children?: ReactNode, style?: React.CSSProperties }) => (
    <div className="centered-container" style={{height: '200px', ...style}}>
        {children}
    </div>
);

const Badge = ({ text, type = 'default' }: {text: string, type?: string}) => (
    <span className={`badge badge-${type}`}>{text}</span>
);

const AccountDataCard = React.memo(({ iconPath, title, children }: { iconPath: string; title: string; children?: ReactNode }) => (
    <div className="card account-card">
        <div className="card-icon-wrapper">
            <Icon path={iconPath} />
        </div>
        <div className="card-details">
            <div className="card-title">{title}</div>
            <div className="card-content">{children}</div>
        </div>
    </div>
));

const ThemeSwitcher = () => {
    const { t } = useTranslation();
    const { theme, setTheme } = useTheme();
    const options: { value: Theme; label: string; icon: string; }[] = [
        { value: 'light', label: t('themeLight'), icon: ICONS.SUN },
        { value: 'dark', label: t('themeDark'), icon: ICONS.MOON },
        { value: 'auto', label: t('themeSystem'), icon: ICONS.DESKTOP },
    ];

    return (
        <div className="theme-switcher">
            {options.map(option => (
                <button
                    key={option.value}
                    className={`theme-btn ${theme === option.value ? 'active' : ''}`}
                    onClick={() => setTheme(option.value)}
                    aria-label={t('switchToTheme', { theme: option.label })}
                >
                    <Icon path={option.icon} />
                    <span>{option.label}</span>
                </button>
            ))}
        </div>
    );
};

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();
    const options = [
        { value: 'en', label: 'English' },
        { value: 'fa', label: 'فارسی' },
    ];

    return (
        <div className="language-switcher">
            {options.map(option => (
                <button
                    key={option.value}
                    className={`language-btn ${i18n.language === option.value ? 'active' : ''}`}
                    onClick={() => i18n.changeLanguage(option.value)}
                >
                    <span>{option.label}</span>
                </button>
            ))}
        </div>
    );
};


// --- Helper Functions ---
const getPastDateByDays = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
}
const getPastDateByMonths = (months: number) => {
    const date = new Date();
    date.setMonth(date.getMonth() - months);
    return date;
};
const formatDateForApiV4 = (date: Date) => {
    return date.toISOString().slice(0, 19);
};
const getPastDateByYears = (years: number) => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - years);
    return date;
};
const formatDateForDisplay = (dateString: string | undefined, locale = 'en-US') => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (e) {
        return 'Invalid Date';
    }
}

// --- View Components ---

const StatsChart = ({ data }: { data: any[] }) => {
    const { t, i18n } = useTranslation();
    const { effectiveTheme } = useTheme();
    const [tooltip, setTooltip] = useState<any>(null);
    const svgRef = React.useRef<SVGSVGElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 350 });
    
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const resizeObserver = new ResizeObserver(() => {
            if (container) {
                setDimensions({ width: container.clientWidth, height: 350 });
            }
        });

        resizeObserver.observe(container);
        setDimensions({ width: container.clientWidth, height: 350 });
        
        return () => {
            if (container) {
               resizeObserver.unobserve(container);
            }
        }
    }, []);

    const chartData = useMemo(() => data.map(d => ({ ...d, date: new Date(d.date) })), [data]);
    const metrics = useMemo(() => [
        { key: 'Delivered', label: t('delivered'), color: 'var(--info-color)' },
        { key: 'Opened', label: t('opened'), color: 'var(--success-color)' },
        { key: 'Clicked', label: t('clicked'), color: 'var(--warning-color)' },
    ], [t]);

    const { width, height } = dimensions;

    const { margin, chartWidth, chartHeight, xScale, yScale, lineGenerators, areaGenerator, yAxisTicks, xAxisTicks } = useMemo(() => {
        const margin = { top: 20, right: i18n.dir() === 'rtl' ? 60 : 20, bottom: 50, left: i18n.dir() === 'rtl' ? 20 : 60 };
        
        if (width <= 0 || chartData.length < 2) {
            return { margin, chartWidth: 0, chartHeight: 0, xScale: null, yScale: null, lineGenerators: {}, areaGenerator: '', yAxisTicks: [], xAxisTicks: [] };
        }

        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        const timeDomain = [chartData[0].date.getTime(), chartData[chartData.length - 1].date.getTime()];
        const timeDiff = timeDomain[1] - timeDomain[0];
        const xScale = (val: Date) => ((val.getTime() - timeDomain[0]) / (timeDiff > 0 ? timeDiff : 1)) * chartWidth;
        
        const yMaxSource = Math.max(...chartData.map(d => Math.max(d.Delivered || 0, d.Opened || 0, d.Clicked || 0)));
        const yMax = yMaxSource > 0 ? yMaxSource : 10;
        
        const magnitude = Math.pow(10, Math.floor(Math.log10(yMax - 0.01))); // -0.01 to handle powers of 10 correctly
        const niceYMax = Math.ceil(yMax / magnitude) * magnitude;
        
        const yScale = (val: number) => chartHeight - (val / niceYMax) * chartHeight;

        const lineGenerators = metrics.reduce((acc, metric) => {
            acc[metric.key] = chartData.map(d => `${xScale(d.date)},${yScale(d[metric.key] || 0)}`).join(' ');
            return acc;
        }, {} as Record<string, string>);
        
        const areaPoints = chartData.map(d => `${xScale(d.date)},${yScale(d.Delivered || 0)}`).join(' ');
        const areaGenerator = `M${xScale(chartData[0].date)},${chartHeight} L${areaPoints} L${xScale(chartData[chartData.length - 1].date)},${chartHeight} Z`;

        const yAxisTicks = Array.from({ length: 5 }, (_, i) => {
            const value = (niceYMax / 4) * i;
            return { value, y: yScale(value) };
        });

        const maxXTicks = Math.floor(chartWidth / 80);
        const tickIncrement = Math.max(1, Math.ceil(chartData.length / maxXTicks));
        const xAxisTicks = chartData.filter((_, i) => i % tickIncrement === 0);

        return { margin, chartWidth, chartHeight, xScale, yScale, lineGenerators, areaGenerator, yAxisTicks, xAxisTicks };
    }, [chartData, width, height, metrics, i18n.language]);
    
    const handleMouseMove = (event: React.MouseEvent<SVGRectElement>) => {
        if (!svgRef.current || !xScale || !chartWidth || chartData.length === 0) return;
        
        const svgRect = svgRef.current.getBoundingClientRect();
        const mouseX = event.clientX - svgRect.left - margin.left;
        
        if (mouseX < 0 || mouseX > chartWidth) {
            setTooltip(null);
            return;
        }

        const dateRatio = mouseX / chartWidth;
        const minTime = chartData[0].date.getTime();
        const maxTime = chartData[chartData.length - 1].date.getTime();
        const timeDiff = maxTime - minTime;
        const hoverTime = minTime + dateRatio * (timeDiff > 0 ? timeDiff : 0);

        let closestIndex = 0;
        let minDistance = Infinity;
        chartData.forEach((d, i) => {
            const distance = Math.abs(d.date.getTime() - hoverTime);
            if (distance < minDistance) {
                minDistance = distance;
                closestIndex = i;
            }
        });
        
        const pointData = chartData[closestIndex];
        const pointX = xScale(pointData.date);

        setTooltip({
            data: pointData,
            x: pointX + margin.left,
            y: margin.top, 
        });
    };
    
    if (chartData.length < 2) {
        return (
            <div ref={containerRef} style={{ height: dimensions.height, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                <div className="info-message" style={{maxWidth: 'none', alignItems: 'flex-start'}}>
                    <Icon path={ICONS.STATISTICS} style={{flexShrink: 0, marginTop: '0.2rem'}} />
                    <div>
                        <strong>{t('notEnoughData')}</strong>
                        <p style={{color: 'var(--subtle-text-color)', margin: '0.25rem 0 0', padding: 0}}>
                           {t('notEnoughDataSubtitle')}
                        </p>
                    </div>
                </div>
            </div>
        );
    }
    
    const tooltipTransform = useMemo(() => {
        if (!tooltip) return 'translateX(10%)';
        if (i18n.dir() === 'rtl') {
            return tooltip.x > width / 2 ? 'translateX(10%)' : 'translateX(-110%)';
        }
        return tooltip.x > width / 2 ? 'translateX(-110%)' : 'translateX(10%)';
    }, [tooltip, width, i18n.language]);


    return (
        <div className="stats-chart-container" ref={containerRef}>
            {width > 0 && (
                <>
                <svg ref={svgRef} width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="stats-chart-svg">
                    <defs>
                        <linearGradient id="area-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style={{ stopColor: 'var(--info-color)', stopOpacity: 0.3 }} />
                            <stop offset="100%" style={{ stopColor: 'var(--info-color)', stopOpacity: 0 }} />
                        </linearGradient>
                    </defs>
                    <g transform={`translate(${margin.left}, ${margin.top})`}>
                        {/* Y-axis grid lines and labels */}
                        {yScale && yAxisTicks.map(tick => (
                            <g key={tick.value}>
                                <line className="grid-line" x1={0} x2={chartWidth} y1={tick.y} y2={tick.y} />
                                <text className="axis-label" x={i18n.dir() === 'rtl' ? chartWidth + 10 : -10} y={tick.y} dy="0.32em" textAnchor={i18n.dir() === 'rtl' ? "start" : "end"}>
                                    {tick.value >= 1000 ? `${(tick.value / 1000).toFixed(tick.value % 1000 !== 0 ? 1 : 0)}k` : tick.value}
                                </text>
                            </g>
                        ))}
                        {/* X-axis labels */}
                        {xScale && xAxisTicks.map(d => (
                            <text className="axis-label" key={d.date.toISOString()} x={xScale(d.date)} y={chartHeight + 20} textAnchor="middle">
                                {d.date.toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' })}
                            </text>
                        ))}
                        
                        {/* Area Gradient for Delivered */}
                        <path d={areaGenerator} fill="url(#area-gradient)" />

                        {/* Lines */}
                        {metrics.map(metric => (
                            lineGenerators[metric.key] && <polyline key={metric.key} className={`plot-line ${metric.key.toLowerCase()}`} points={lineGenerators[metric.key]} style={{ stroke: metric.color }} />
                        ))}
                        
                        {/* Tooltip line and dots */}
                        {tooltip && yScale && (
                            <g>
                                <line className="tooltip-line" x1={tooltip.x - margin.left} y1={0} x2={tooltip.x - margin.left} y2={chartHeight} />
                                {metrics.map(metric => {
                                    const yPos = yScale(tooltip.data[metric.key] || 0);
                                    return (yPos !== undefined && !isNaN(yPos)) && (
                                    <circle key={metric.key} className="chart-tooltip-dot" cx={tooltip.x - margin.left} cy={yPos} r={5} style={{ fill: metric.color }}/>
                                    );
                                })}
                            </g>
                        )}

                        <rect className="mouse-overlay" width={chartWidth} height={chartHeight} onMouseMove={handleMouseMove} onMouseLeave={() => setTooltip(null)} />
                    </g>
                </svg>
                {tooltip && (
                    <div className="chart-tooltip" style={{ left: tooltip.x, top: tooltip.y, transform: tooltipTransform }}>
                        <div className="tooltip-date">{new Date(tooltip.data.date).toLocaleDateString(i18n.language, { weekday: 'long', month: 'short', day: 'numeric' })}</div>
                        {metrics.map(metric => (
                            <div key={metric.key} className="tooltip-item">
                                <span className="color-swatch" style={{ backgroundColor: metric.color }}></span>
                                <span className="label">{metric.label}:</span>
                                <span className="value">{(tooltip.data[metric.key] || 0).toLocaleString(i18n.language)}</span>
                            </div>
                        ))}
                    </div>
                )}
                <div className="chart-legend">
                    {metrics.map(metric => (
                        <div key={metric.key} className="legend-item">
                            <span className="color-swatch" style={{ backgroundColor: metric.color }}></span>
                            <span>{metric.label}</span>
                        </div>
                    ))}
                </div>
                </>
            )}
        </div>
    );
};

const OverallActivityChart = ({ stats, loading, error }: { stats: any, loading: boolean, error: any }) => {
    const { t, i18n } = useTranslation();
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 450 });
    const [tooltip, setTooltip] = useState<{ label: string, value: number, x: number, y: number, color: string } | null>(null);

    useEffect(() => {
        if (loading) return;

        const container = containerRef.current;
        if (!container) return;
        
        const resizeObserver = new ResizeObserver(() => {
            if (containerRef.current) {
                setDimensions({ width: containerRef.current.clientWidth, height: 450 });
            }
        });
        resizeObserver.observe(container);
        
        if (container.clientWidth > 0) {
            setDimensions({ width: container.clientWidth, height: 450 });
        }
        
        return () => { 
            if(containerRef.current) {
                resizeObserver.unobserve(containerRef.current);
            }
        };
    }, [loading]);


    const chartMetrics = useMemo(() => {
        if (!stats) return [];
        return [
            { label: t('delivered'), value: stats.Delivered || 0, color: 'var(--info-color)' },
            { label: t('opened'), value: stats.Opened || 0, color: 'var(--success-color)' },
            { label: t('clicked'), value: stats.Clicked || 0, color: 'var(--warning-color)' },
            { label: t('unsubscribed'), value: stats.Unsubscribed || 0, color: '#64748B' },
            { label: t('complaints'), value: stats.Complaints || 0, color: 'var(--danger-color)' },
            { label: t('bounced'), value: stats.Bounced || 0, color: '#94A3B8' },
        ].filter(d => d.value > 0).sort((a, b) => b.value - a.value);
    }, [stats, t]);

    const { width, height } = dimensions;
    const { margin, chartWidth, chartHeight, bandWidth, yScale, yAxisTicks } = useMemo(() => {
        const leftMargin = i18n.dir() === 'rtl' ? 20 : 70;
        const rightMargin = i18n.dir() === 'rtl' ? 70 : 20;
        const tempChartWidth = width - leftMargin - rightMargin;
        const shouldRotateLabels = chartMetrics.length > 0 && tempChartWidth > 0 && (tempChartWidth / chartMetrics.length < 80);
    
        const margin = { top: 20, right: rightMargin, bottom: shouldRotateLabels ? 80 : 50, left: leftMargin };
        if (width <= 0 || chartMetrics.length === 0) return { margin, chartWidth: 0, chartHeight: 0, bandWidth: 0, yScale: null, yAxisTicks: [] };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;
        const yMax = Math.max(...chartMetrics.map(d => d.value));
        const magnitude = Math.pow(10, Math.floor(Math.log10(yMax > 0 ? yMax : 1)));
        const niceYMax = yMax > 0 ? Math.ceil(yMax / magnitude) * magnitude : 10;
        const yScale = (val: number) => chartHeight - (val / niceYMax) * chartHeight;
        const bandWidth = chartWidth / chartMetrics.length;
        const yAxisTicks = Array.from({ length: 6 }, (_, i) => ({ value: (niceYMax / 5) * i, y: yScale((niceYMax / 5) * i) }));
        return { margin, chartWidth, chartHeight, bandWidth, yScale, yAxisTicks };
    }, [chartMetrics, width, height, i18n.language]);
    
    const containerStyle = { height: `${height}px`, display: 'flex', alignItems: 'center', justifyContent: 'center' };

    if (loading) return <div style={containerStyle}><Loader /></div>
    if (error) return <div style={containerStyle}><ErrorMessage error={error} /></div>;
    if (!stats || chartMetrics.length === 0) {
        return (
            <div ref={containerRef} style={containerStyle}>
                <div className="info-message">
                    <strong>{t('noOverallActivity')}</strong>
                </div>
            </div>
        );
    }

    return (
        <div className="stats-chart-container" ref={containerRef} style={{height: height}}>
            {width > 0 ? (
                <>
                    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
                        <g transform={`translate(${margin.left}, ${margin.top})`}>
                            {yScale && yAxisTicks.map(tick => (
                                <g key={tick.value}>
                                    <line className="grid-line" x1={0} x2={chartWidth} y1={tick.y} y2={tick.y} />
                                    <text className="axis-label" x={i18n.dir() === 'rtl' ? chartWidth + 10 : -10} y={tick.y} dy="0.32em" textAnchor={i18n.dir() === 'rtl' ? 'start' : 'end'}>
                                        {tick.value >= 1000 ? `${(tick.value / 1000).toLocaleString(i18n.language)}k` : tick.value.toLocaleString(i18n.language)}
                                    </text>
                                </g>
                            ))}
                            {yScale && chartMetrics.map((d, i) => {
                                const barWidth = bandWidth * 0.6;
                                const barX = i * bandWidth + (bandWidth - barWidth) / 2;
                                const barY = yScale(d.value);
                                const barHeight = chartHeight - barY;
                                return (
                                    <g key={d.label}>
                                        <rect
                                            x={barX} y={barY} width={barWidth} height={barHeight} fill={d.color} rx={3} ry={3}
                                            style={{ opacity: tooltip && tooltip.label !== d.label ? 0.6 : 1, transition: 'opacity 0.2s' }}
                                            onMouseMove={() => setTooltip({ label: d.label, value: d.value, x: margin.left + barX + barWidth / 2, y: margin.top + barY, color: d.color })}
                                            onMouseLeave={() => setTooltip(null)}
                                        />
                                        <text 
                                            className="axis-label" 
                                            x={barX + barWidth / 2} 
                                            y={chartHeight + 20} 
                                            textAnchor={bandWidth < 80 ? 'end' : 'middle'} 
                                            transform={bandWidth < 80 ? `rotate(-45, ${barX + barWidth / 2}, ${chartHeight + 20})` : 'none'}
                                        >
                                            {d.label}
                                        </text>
                                    </g>
                                );
                            })}
                        </g>
                    </svg>
                    {tooltip && (
                        <div className="chart-tooltip" style={{ left: tooltip.x, top: tooltip.y, transform: 'translate(-50%, -110%)' }}>
                            <div className="tooltip-item">
                                <span className="color-swatch" style={{ backgroundColor: tooltip.color }}></span>
                                <span className="label">{tooltip.label}:</span>
                                <span className="value">{tooltip.value.toLocaleString(i18n.language)}</span>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                 <div style={containerStyle}><Loader /></div>
            )}
        </div>
    );
};

const ChannelStatsTable = ({ apiKey }: { apiKey: string }) => {
    const { t, i18n } = useTranslation();
    const { data: channelsData, loading, error } = useApiV4('/statistics/channels', apiKey, {}, apiKey ? 1 : 0);
    const [selectedChannel, setSelectedChannel] = useState('');

    const channels = useMemo(() => Array.isArray(channelsData) ? channelsData : [], [channelsData]);

    useEffect(() => {
        if (channels.length > 0 && !selectedChannel) {
            setSelectedChannel(channels[0].ChannelName);
        }
    }, [channels, selectedChannel]);

    const containerStyle = { minHeight: '450px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' };

    if (loading) return <div style={{...containerStyle, minHeight: '450px'}}><Loader /></div>;
    
    if (error && error.message.toLowerCase().includes('http error! status: 404')) {
        return (
             <div style={containerStyle}>
                <div className="info-message warning" style={{maxWidth: 'none', alignItems: 'flex-start'}}>
                    <Icon path={ICONS.COMPLAINT} style={{flexShrink: 0, marginTop: '0.2rem'}} />
                    <div>
                        <strong>{t('channelsNotAvailable')}</strong>
                        <p style={{color: 'var(--subtle-text-color)', margin: '0.25rem 0 0', padding: 0}}>
                           {t('channelsNotAvailableSubtitle')}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) return <div style={containerStyle}><ErrorMessage error={error} /></div>;

    if (channels.length === 0) {
        return (
            <div style={containerStyle}>
                <div className="info-message">
                    <strong>{t('noChannelData')}</strong>
                </div>
            </div>
        );
    }

    const selectedData = channels.find(c => c.ChannelName === selectedChannel);

    const statsToDisplay = selectedData ? [
        { label: t('recipients'), value: selectedData.Recipients },
        { label: t('emailsSent'), value: selectedData.EmailTotal },
        { label: t('delivered'), value: selectedData.Delivered },
        { label: t('opened'), value: selectedData.Opened },
        { label: t('clicked'), value: selectedData.Clicked },
        { label: t('bounced'), value: selectedData.Bounced },
        { label: t('unsubscribed'), value: selectedData.Unsubscribed },
        { label: t('complaints'), value: selectedData.Complaints },
    ].filter(item => Number(item.value) > 0) : [];


    return (
        <div className="channel-stats-container">
            <div className="channel-selector-header">
                <h4>{t('sendChannels')}</h4>
                <select value={selectedChannel} onChange={e => setSelectedChannel(e.target.value)} disabled={channels.length <= 1}>
                    {channels.map((channel: any) => (
                        <option key={channel.ChannelName} value={channel.ChannelName}>
                            {channel.ChannelName}
                        </option>
                    ))}
                </select>
            </div>
            {selectedData && (
                <div className="table-container-simple">
                    <table>
                        <tbody>
                            {statsToDisplay.map(stat => (
                                <tr key={stat.label}>
                                    <td>{stat.label}</td>
                                    <td>{Number(stat.value || 0).toLocaleString(i18n.language)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};


const StatisticsView = ({ apiKey }: { apiKey: string }) => {
    const { t, i18n } = useTranslation();
    const [duration, setDuration] = useState('3months');
    const [dailyData, setDailyData] = useState<any[]>([]);
    const [isChartLoading, setIsChartLoading] = useState(true);

    const durationOptions: {[key: string]: {label: string, from: () => Date}} = useMemo(() => ({
        '7days': { label: t('last7Days'), from: () => getPastDateByDays(7) },
        '14days': { label: t('last14Days'), from: () => getPastDateByDays(14) },
        '30days': { label: t('last30Days'), from: () => getPastDateByDays(30) },
        '3months': { label: t('last3Months'), from: () => getPastDateByMonths(3) },
        '6months': { label: t('last6Months'), from: () => getPastDateByMonths(6) },
        '1year': { label: t('lastYear'), from: () => getPastDateByYears(1) },
    }), [t]);

    const apiParams = useMemo(() => ({
        from: formatDateForApiV4(durationOptions[duration].from()),
    }), [duration, durationOptions]);

    const { data: aggregateStats, loading: aggregateLoading, error: aggregateError } = useApiV4(`/statistics`, apiKey, apiParams);
    const { data: overallStats, loading: overallLoading, error: overallError } = useApiV4(
        `/statistics`, 
        apiKey, 
        { from: formatDateForApiV4(getPastDateByYears(20)) }
    );
    
    useEffect(() => {
        const fetchDailyData = async () => {
            if (!apiKey) return;
            setIsChartLoading(true);
            
            const fromDate = durationOptions[duration].from();
            const toDate = new Date();
            const promises = [];

            const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            let intervalDays = 1; // Daily
            if (diffDays > 180) { // More than ~6 months
                intervalDays = 30; // Monthly
            } else if (diffDays > 30) { // More than 1 month
                intervalDays = 7; // Weekly
            }

            for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + intervalDays)) {
                const startOfPeriod = new Date(d);
                const endOfPeriod = new Date(startOfPeriod);
                endOfPeriod.setDate(endOfPeriod.getDate() + intervalDays - 1);
                
                // Ensure the last period doesn't go beyond today
                const finalEndOfPeriod = endOfPeriod > toDate ? toDate : endOfPeriod;

                const from = formatDateForApiV4(new Date(startOfPeriod.setHours(0,0,0,0))) + 'Z';
                const to = formatDateForApiV4(new Date(finalEndOfPeriod.setHours(23,59,59,999))) + 'Z';
                
                promises.push(
                    apiFetchV4(`/statistics`, apiKey, { params: { from, to } })
                        .then(res => ({ ...res, date: startOfPeriod.toISOString().split('T')[0] }))
                        .catch(() => ({ Delivered: 0, Opened: 0, Clicked: 0, date: startOfPeriod.toISOString().split('T')[0] }))
                );
            }
            
            try {
                const results = await Promise.all(promises);
                setDailyData(results.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
            } catch (err) {
                console.error("Failed to fetch daily chart data", err);
                setDailyData([]);
            } finally {
                setIsChartLoading(false);
            }
        };
        
        fetchDailyData();
    }, [apiKey, duration, durationOptions]);

    const filterControl = (
        <div className="view-controls">
            <label htmlFor="duration-select">{t('dateRange')}:</label>
            <select id="duration-select" value={duration} onChange={(e) => setDuration(e.target.value)}>
                {Object.entries(durationOptions).map(([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                ))}
            </select>
        </div>
    );

    if (aggregateError) return (
        <>
            {filterControl}
            <ErrorMessage error={aggregateError} />
        </>
    );

    return (
        <>
            {filterControl}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                {isChartLoading ? (
                    <div style={{height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Loader /></div>
                ) : (
                    <div className="stats-chart-wrapper">
                      <StatsChart data={dailyData} />
                    </div>
                )}
            </div>
            
            {aggregateLoading ? (
                <CenteredMessage><Loader /></CenteredMessage>
            ) : (!aggregateStats || Object.keys(aggregateStats).length === 0) ? (
                <CenteredMessage>{t('noStatsForPeriod', { period: durationOptions[duration].label.toLowerCase() })}</CenteredMessage>
            ) : (
                <div className="card-grid account-grid">
                    <AccountDataCard title={t('totalEmails')} iconPath={ICONS.MAIL}>
                        {aggregateStats.EmailTotal?.toLocaleString(i18n.language) ?? '0'}
                    </AccountDataCard>
                    <AccountDataCard title={t('recipients')} iconPath={ICONS.CONTACTS}>
                        {aggregateStats.Recipients?.toLocaleString(i18n.language) ?? '0'}
                    </AccountDataCard>
                    <AccountDataCard title={t('delivered')} iconPath={ICONS.VERIFY}>
                        {aggregateStats.Delivered?.toLocaleString(i18n.language) ?? '0'}
                    </AccountDataCard>
                    <AccountDataCard title={t('opened')} iconPath={ICONS.EYE}>
                        {aggregateStats.Opened?.toLocaleString(i18n.language) ?? '0'}
                    </AccountDataCard>
                    <AccountDataCard title={t('clicked')} iconPath={ICONS.CLICK}>
                        {aggregateStats.Clicked?.toLocaleString(i18n.language) ?? '0'}
                    </AccountDataCard>
                    <AccountDataCard title={t('unsubscribed')} iconPath={ICONS.LOGOUT}>
                        {aggregateStats.Unsubscribed?.toLocaleString(i18n.language) ?? '0'}
                    </AccountDataCard>
                    <AccountDataCard title={t('complaints')} iconPath={ICONS.COMPLAINT}>
                        {aggregateStats.Complaints?.toLocaleString(i18n.language) ?? '0'}
                    </AccountDataCard>
                     <AccountDataCard title={t('bounced')} iconPath={ICONS.BOUNCED}>
                        {aggregateStats.Bounced?.toLocaleString(i18n.language) ?? '0'}
                    </AccountDataCard>
                </div>
            )}
            
            <div className="overall-snapshot-grid" style={{borderTop: '1px solid var(--border-color)', marginTop: '2.5rem', paddingTop: '2.5rem'}}>
                <div className="card">
                    <div className="channel-selector-header">
                        <h4>{t('activityOverview')}</h4>
                    </div>
                    <OverallActivityChart stats={overallStats} loading={overallLoading} error={overallError} />
                </div>
                <div className="card">
                     <ChannelStatsTable apiKey={apiKey} />
                </div>
            </div>
        </>
    );
};

const AccountView = ({ apiKey, user }: { apiKey: string, user: any }) => {
    const { t, i18n } = useTranslation();
    const { updateUser, logout } = useAuth();
    const { data, loading, error } = useApi('/account/load', apiKey, {}, apiKey ? 1 : 0);
    const { data: contactsCountData, loading: contactsCountLoading } = useApi('/contact/count', apiKey, { allContacts: true }, apiKey ? 1 : 0);
    const [newApiKey, setNewApiKey] = useState(user.elastic_email_api_key || '');
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);
    const [installPrompt, setInstallPrompt] = useState<any>(null);

    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            console.log('`beforeinstallprompt` event fired.');
            setInstallPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);
    
    const handleInstallClick = () => {
        if (!installPrompt) return;
        
        installPrompt.prompt();
        installPrompt.userChoice.then((choiceResult: { outcome: string }) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the A2HS prompt');
            } else {
                console.log('User dismissed the A2HS prompt');
            }
            setInstallPrompt(null);
        });
    };

    const handleSaveKey = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setStatus(null);
        try {
            await apiFetch('/account/load', newApiKey);
            await updateUser({ elastic_email_api_key: newApiKey });
            setStatus({ type: 'success', message: t('apiKeyUpdateSuccess') });
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message || t('apiKeyUpdateError') });
        } finally {
            setIsSaving(false);
        }
    };
    
    if (!apiKey) return (
        <CenteredMessage>
            <div className="info-message">
                <strong>{t('noApiKeyFound')}</strong>
                <p>{t('addKeyToViewAccount')}</p>
            </div>
        </CenteredMessage>
    );
    if (loading) return <CenteredMessage><Loader /></CenteredMessage>;
    if (error) return <ErrorMessage error={error} />;
    if (!data) return <CenteredMessage>{t('noAccountData')}</CenteredMessage>;

    const getStatusType = (status: string) => {
        const cleanStatus = String(status || '').toLowerCase().replace(/\s/g, '');
        if (cleanStatus.includes('active')) return 'success';
        if (cleanStatus.includes('disabled') || cleanStatus.includes('abuse')) return 'danger';
        if (cleanStatus.includes('review') || cleanStatus.includes('verification')) return 'warning';
        return 'default';
    }

    const getReputationInfo = (reputation: number) => {
        const score = Number(reputation || 0);
        if (score >= 80) return { text: t('reputationExcellent'), className: 'good' };
        if (score >= 60) return { text: t('reputationGood'), className: 'good' };
        if (score >= 40) return { text: t('reputationAverage'), className: 'medium' };
        if (score >= 20) return { text: t('reputationPoor'), className: 'bad' };
        return { text: t('reputationVeryPoor'), className: 'bad' };
    };
    
    const accountStatus = data.status || 'Active';
    const statusType = getStatusType(accountStatus);
    const reputation = getReputationInfo(data.reputation);
    const fullName = [data.firstname, data.lastname].filter(Boolean).join(' ') || user.first_name;
    const isApiKeyUser = user?.isApiKeyUser;

    return (
        <div className="profile-view-container">
            {!isApiKeyUser && (
                <div className="profile-hero">
                    <div className="profile-avatar">
                        <Icon path={ICONS.ACCOUNT} />
                    </div>
                    <div className="profile-info">
                        <h3>{fullName || t('userProfile')}</h3>
                        <p className="profile-email">{data.email}</p>
                        <div className="profile-meta">
                            <div className="meta-item">
                                <label>{t('publicId')}</label>
                                <span>{data.publicaccountid || 'N/A'}</span>
                            </div>
                            <div className="meta-item">
                                <label>{t('joined')}</label>
                                <span>{formatDateForDisplay(data.datecreated, i18n.language)}</span>
                            </div>
                            <div className="meta-item">
                                <label>{t('lastActivity')}</label>
                                <span>{formatDateForDisplay(data.lastactivity, i18n.language)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="card">
                <div className="card-header" style={{padding: '1.25rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem'}}>
                    <h3 style={{margin:0, fontSize: '1.25rem'}}>{t('settings')}</h3>
                </div>
                <div className="card-body" style={{padding: '0 1.25rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '2.5rem'}}>
                    <div>
                        <h4 style={{fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem'}}>{t('displayMode')}</h4>
                        <p style={{color: 'var(--subtle-text-color)', marginTop: 0, marginBottom: '1rem', fontSize: '0.9rem'}}>{t('displayModeSubtitle')}</p>
                        <ThemeSwitcher />
                    </div>
                    
                    <div>
                        <h4 style={{fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem'}}>{t('language')}</h4>
                        <p style={{color: 'var(--subtle-text-color)', marginTop: 0, marginBottom: '1rem', fontSize: '0.9rem'}}>{t('languageSubtitle')}</p>
                        <LanguageSwitcher />
                    </div>

                    {installPrompt && (
                        <div>
                            <h4 style={{fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem'}}>{t('installApp')}</h4>
                            <p style={{color: 'var(--subtle-text-color)', marginTop: 0, marginBottom: '1rem', fontSize: '0.9rem'}}>{t('installAppSubtitle')}</p>
                            <button className="btn btn-secondary" onClick={handleInstallClick} style={{width: '100%'}}>
                                <Icon path={ICONS.DOWNLOAD} /> {t('installMegaMail')}
                            </button>
                        </div>
                    )}
                    
                    {!isApiKeyUser && (
                        <div>
                             <h4 style={{fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem'}}>{t('apiKey')}</h4>
                             <form onSubmit={handleSaveKey} style={{padding: 0}}>
                                <div className="form-group">
                                    <label htmlFor="api-key-input">{t('yourApiKey')}</label>
                                    <input
                                        id="api-key-input"
                                        type="password"
                                        value={newApiKey}
                                        onChange={(e) => setNewApiKey(e.target.value)}
                                        placeholder={t('enterYourApiKey')}
                                        required
                                    />
                                </div>
                                {status && <ActionStatus status={status} onDismiss={() => setStatus(null)}/>}
                                <div className="form-actions" style={{justifyContent: 'flex-end', marginTop: '1rem', padding: 0}}>
                                    <button type="submit" className="btn btn-primary" disabled={isSaving}>
                                        {isSaving ? <Loader /> : t('saveAndVerifyKey')}
                                    </button>
                                </div>
                             </form>
                        </div>
                    )}
                </div>
            </div>

            {isApiKeyUser && (
                 <div className="info-message" style={{textAlign: 'left'}}>
                    <p>
                        {t('apiKeySignInMessage')} <button className="link-button" onClick={logout}>{t('logOut')}</button> {t('andRegister')}
                    </p>
                </div>
            )}

            <div className="card-grid account-grid">
                <AccountDataCard title={t('accountStatus')} iconPath={ICONS.VERIFY}>
                    <Badge text={accountStatus} type={statusType} />
                </AccountDataCard>
                <AccountDataCard title={t('reputation')} iconPath={ICONS.TRENDING_UP}>
                    <span className={`reputation-score ${reputation.className}`}>{data.reputation ?? 0}%</span>
                    <span className="reputation-text">{reputation.text}</span>
                </AccountDataCard>
                <AccountDataCard title={t('dailySendLimit')} iconPath={ICONS.SEND_EMAIL}>
                    {(data.dailysendlimit ?? 0).toLocaleString(i18n.language)}
                </AccountDataCard>
                 <AccountDataCard title={t('remainingCredits')} iconPath={ICONS.BUY_CREDITS}>
                    {(data?.emailcredits === undefined) ? 'N/A' : Number(data.emailcredits).toLocaleString(i18n.language)}
                </AccountDataCard>
                <AccountDataCard title={t('totalContacts')} iconPath={ICONS.CONTACTS}>
                    {contactsCountLoading ? '...' : (contactsCountData?.toLocaleString(i18n.language) ?? '0')}
                </AccountDataCard>
            </div>
        </div>
    );
};

const PURCHASE_WEBHOOK_URL = 'https://auto.zagrox.com/webhook-test/emailpack'; // As requested, URL is here for easy changes.

const CreditHistoryModal = ({ isOpen, onClose, apiKey }: { isOpen: boolean, onClose: () => void, apiKey: string }) => {
    const { t, i18n } = useTranslation();
    const refetchIndex = isOpen ? 1 : 0;
    const { data: history, loading, error } = useApi('/account/loadsubaccountsemailcreditshistory', apiKey, {}, refetchIndex);
    
    const isAccessDenied = error && error.message.toLowerCase().includes('access denied');
    
    // The v2 API is inconsistent. This handles if the data is a direct array or nested in `historyitems`
    const historyItems = useMemo(() => {
        if (!history) return [];
        if (Array.isArray(history)) return history;
        if (history && Array.isArray(history.historyitems)) return history.historyitems;
        if (history && Array.isArray(history.HistoryItems)) return history.HistoryItems;
        return [];
    }, [history]);


    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('creditHistoryTitle')}>
            {loading && <CenteredMessage><Loader /></CenteredMessage>}
            {error && (
                isAccessDenied ? (
                    <div className="info-message warning" style={{maxWidth: 'none', alignItems: 'flex-start'}}>
                        <Icon path={ICONS.COMPLAINT} style={{flexShrink: 0, marginTop: '0.2rem'}} />
                        <div>
                            <strong>{t('featureNotAvailable')}</strong>
                            <p style={{color: 'var(--subtle-text-color)', margin: '0.25rem 0 0', padding: 0}}>
                                {t('creditHistoryNotAvailable')}
                            </p>
                        </div>
                    </div>
                ) : (
                    <ErrorMessage error={error} />
                )
            )}
            {!loading && !error && (
                <div className="table-container">
                    <table className="credit-history-table">
                        <thead>
                            <tr>
                                <th>{t('date')}</th>
                                <th>{t('description')}</th>
                                <th style={{ textAlign: i18n.dir() === 'rtl' ? 'left' : 'right' }}>{t('amount')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {historyItems.length > 0 ? (
                                historyItems.map((item: any, index: number) => (
                                    <tr key={index}>
                                        <td>{formatDateForDisplay(item.Date || item.historydate, i18n.language)}</td>
                                        <td>{item.Notes || item.notes}</td>
                                        <td className="credit-history-amount">
                                            +{(item.Amount?.toLocaleString(i18n.language) ?? item.amount?.toLocaleString(i18n.language) ?? '0')}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3} style={{ textAlign: 'center', padding: '2rem' }}>
                                        {t('noCreditHistory')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </Modal>
    );
};


const BuyCreditsView = ({ apiKey, user }: { apiKey: string, user: any }) => {
    const { t, i18n } = useTranslation();
    const [isSubmitting, setIsSubmitting] = useState<number | null>(null);
    const [modalState, setModalState] = useState({ isOpen: false, title: '', message: '' });
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    
    const [packages, setPackages] = useState<any[]>([]);
    const [packagesLoading, setPackagesLoading] = useState(true);
    const [packagesError, setPackagesError] = useState<string | null>(null);

    const { data: accountData, loading: creditLoading, error: creditError } = useApi('/account/load', apiKey, {}, apiKey ? 1 : 0);
    
    useEffect(() => {
        const fetchPackages = async () => {
            setPackagesLoading(true);
            setPackagesError(null);
            try {
                // Using native fetch to call the public endpoint directly without auth headers.
                const response = await fetch('https://accounting.mailzila.com/items/credits');
                if (!response.ok) {
                    throw new Error(`Failed to fetch packages: ${response.status} ${response.statusText}`);
                }
                const responseData = await response.json();

                if (responseData && Array.isArray(responseData.data)) {
                    setPackages(responseData.data);
                } else {
                    throw new Error('Invalid response structure from credits endpoint.');
                }
            } catch (err: any) {
                // Craft a more user-friendly error message for network issues.
                if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
                    setPackagesError(`Network error: Could not connect to the API at https://accounting.mailzila.com. Please check the URL and your network connection.`);
                } else {
                    setPackagesError(err.message || 'Failed to load credit packages.');
                }
                console.error(err);
            } finally {
                setPackagesLoading(false);
            }
        };

        fetchPackages();
    }, []);

    const handlePurchase = async (pkg: any) => {
        if (!user || !user.email) {
            setModalState({ isOpen: true, title: t('error'), message: t('userInfoUnavailable') });
            return;
        }

        setIsSubmitting(pkg.id);

        const params = new URLSearchParams({
            userapikey: apiKey,
            useremail: user.email,
            amount: pkg.creditnumber.toString(),
            totalprice: pkg.creditamount.toString(),
        });
        
        const requestUrl = `${PURCHASE_WEBHOOK_URL}?${params.toString()}`;

        try {
            const response = await fetch(requestUrl, {
                method: 'GET',
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Webhook failed with status: ${response.status}. ${errorText}`);
            }

            setModalState({
                isOpen: true,
                title: t('purchaseInitiated'),
                message: t('purchaseInitiatedMessage', { count: pkg.creditnumber.toLocaleString(i18n.language) })
            });

        } catch (error: any) {
            console.error('Purchase webhook error:', error);
            setModalState({
                isOpen: true,
                title: t('purchaseFailed'),
                message: t('purchaseFailedMessage', { error: error.message })
            });
        } finally {
            setIsSubmitting(null);
        }
    };
    
    const closeModal = () => setModalState({ isOpen: false, title: '', message: '' });

    return (
        <div className="buy-credits-view">
            <div className="account-card current-balance-card">
                <div className="card-icon-wrapper">
                    <Icon path={ICONS.BUY_CREDITS} />
                </div>
                <div className="card-details">
                    <div className="card-title">{t('yourCurrentBalance')}</div>
                    <div className="card-content">
                        {creditLoading ? <Loader /> : (creditError || accountData?.emailcredits === undefined) ? 'N/A' : Number(accountData.emailcredits).toLocaleString(i18n.language)}
                    </div>
                </div>
            </div>
            
            <div className="view-header">
                <h3>{t('choosePackage')}</h3>
                <button className="btn" onClick={() => setIsHistoryOpen(true)}>
                    <Icon path={ICONS.CALENDAR} />
                    {t('viewHistory')}
                </button>
            </div>
            <CreditHistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} apiKey={apiKey} />

            <Modal isOpen={modalState.isOpen} onClose={closeModal} title={modalState.title}>
                <p style={{whiteSpace: "pre-wrap"}}>{modalState.message}</p>
                 {modalState.title === t('purchaseInitiated') && (
                    <small style={{display: 'block', marginTop: '1rem', color: 'var(--subtle-text-color)'}}>
                        {t('testEnvironmentNotice')}
                    </small>
                )}
            </Modal>
            
            {packagesLoading && <CenteredMessage><Loader/></CenteredMessage>}
            {packagesError && <ErrorMessage error={{endpoint: '/items/credits', message: packagesError}} />}
            
            {!packagesLoading && !packagesError && (
                 <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>{t('package')}</th>
                                <th>{t('credits')}</th>
                                <th>{t('priceIRT')}</th>
                                <th>{t('pricePerCreditIRT')}</th>
                                <th style={{ textAlign: i18n.dir() === 'rtl' ? 'left' : 'right' }}>{t('action')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {packages.map((pkg: any) => (
                                <tr key={pkg.id}>
                                    <td><strong>{pkg.creditpack}</strong></td>
                                    <td>{pkg.creditnumber.toLocaleString(i18n.language)}</td>
                                    <td>{pkg.creditamount.toLocaleString(i18n.language)}</td>
                                    <td>{pkg.creditrate}</td>
                                    <td style={{ textAlign: i18n.dir() === 'rtl' ? 'left' : 'right' }}>
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => handlePurchase(pkg)}
                                            disabled={isSubmitting !== null}
                                            style={{ margin: 0 }}
                                        >
                                            {isSubmitting === pkg.id ? <Loader /> : t('order')}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="webhook-info">
                <p>
                    <strong>{t('developerNote')}:</strong> {t('webhookInfoText')} <code>PURCHASE_WEBHOOK_URL</code> {t('inComponent')} <code>BuyCreditsView</code> {t('in')} <code>index.tsx</code>.
                </p>
            </div>
        </div>
    );
};

const DashboardView = ({ setView, apiKey, user }: { setView: (view: string) => void, apiKey: string, user: any }) => {
    const { t, i18n } = useTranslation();
    const apiParams = useMemo(() => ({ from: formatDateForApiV4(getPastDateByDays(365)) }), []);
    const { data: statsData, loading: statsLoading, error: statsError } = useApiV4(`/statistics`, apiKey, apiParams);
    const { data: accountData, loading: accountLoading } = useApi('/account/load', apiKey, {}, apiKey ? 1 : 0);
    const { data: contactsCountData, loading: contactsCountLoading } = useApi('/contact/count', apiKey, { allContacts: true }, apiKey ? 1 : 0);

    const navItems = [
        { name: t('statistics'), icon: ICONS.STATISTICS, desc: t('statisticsDesc'), view: 'Statistics' },
        { name: t('contacts'), icon: ICONS.CONTACTS, desc: t('contactsDesc'), view: 'Contacts' },
        { name: t('emailLists'), icon: ICONS.EMAIL_LISTS, desc: t('emailListsDesc'), view: 'Email Lists' },
        { name: t('segments'), icon: ICONS.SEGMENTS, desc: t('segmentsDesc'), view: 'Segments' },
        { name: t('sendEmail'), icon: ICONS.SEND_EMAIL, desc: t('sendEmailDesc'), view: 'Send Email' },
        { name: t('campaigns'), icon: ICONS.CAMPAIGNS, desc: t('campaignsDesc'), view: 'Campaigns' },
        { name: t('domains'), icon: ICONS.DOMAINS, desc: t('domainsDesc'), view: 'Domains' },
        { name: t('smtp'), icon: ICONS.SMTP, desc: t('smtpDesc'), view: 'SMTP' },
    ];
    
    if (!user) return <CenteredMessage><Loader /></CenteredMessage>;
    if (statsError) console.warn("Could not load dashboard stats:", statsError);

    const welcomeName = user?.first_name || t('user');

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h2>{t('welcomeMessage', { name: welcomeName })}</h2>
                    <p>{t('dashboardSubtitle')}</p>
                </div>
                <div className="dashboard-actions">
                    <button className="btn btn-credits" onClick={() => setView('Buy Credits')}>
                        <Icon path={ICONS.BUY_CREDITS} />
                        {accountLoading ? t('loadingCredits') : `${t('credits')}: ${Number(accountData?.emailcredits ?? 0).toLocaleString(i18n.language)}`}
                    </button>
                    <button className="btn btn-primary" onClick={() => setView('Send Email')}><Icon path={ICONS.SEND_EMAIL} /> {t('sendAnEmail')}</button>
                </div>
            </div>

            <div className="dashboard-stats-grid">
                 <AccountDataCard title={t('sendingReputation')} iconPath={ICONS.TRENDING_UP}>
                    {accountLoading ? '...' : (accountData?.reputation ? `${accountData.reputation}%` : 'N/A')}
                </AccountDataCard>
                <AccountDataCard title={t('emailsSent365d')} iconPath={ICONS.MAIL}>
                    {statsLoading ? '...' : (statsData?.EmailTotal?.toLocaleString(i18n.language) ?? '0')}
                </AccountDataCard>
                 <AccountDataCard title={t('totalContacts')} iconPath={ICONS.CONTACTS}>
                    {contactsCountLoading ? '...' : (contactsCountData?.toLocaleString(i18n.language) ?? '0')}
                </AccountDataCard>
            </div>

            <div className="dashboard-section">
                <div className="dashboard-section-header">
                    <h3>{t('exploreYourTools')}</h3>
                    <p>{t('exploreYourToolsSubtitle')}</p>
                </div>
                <div className="dashboard-nav-grid">
                    {navItems.map(item => (
                        <div key={item.name} className="card nav-card clickable" onClick={() => setView(item.view)}>
                            <Icon path={item.icon} className="nav-card-icon" />
                            <div className="nav-card-title">{item.name}</div>
                            <div className="nav-card-description">{item.desc}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="dashboard-branding-footer">
                <p>Mailzila App by <strong>ZAGROX.com</strong></p>
            </div>
        </div>
    );
};

// --- START OF IMPLEMENTED VIEWS ---

const ContactDetailModal = ({ isOpen, onClose, contactData, isLoading, error }: { isOpen: boolean; onClose: () => void; contactData: Contact | null; isLoading: boolean; error: string | null; }) => {
    const { t, i18n } = useTranslation();
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isLoading ? t('loading') : contactData?.Email || t('contactDetails')}>
            {isLoading && <CenteredMessage><Loader /></CenteredMessage>}
            {error && <ErrorMessage error={{ endpoint: 'GET /contacts/{email}', message: error || t('unknownError') }} />}
            {contactData && (
                <div className="contact-details-grid">
                    <dt>{t('email')}</dt><dd>{contactData.Email}</dd>
                    <dt>{t('status')}</dt><dd><Badge text={contactData.Status} type={contactData.Status === 'Active' ? 'success' : 'default'}/></dd>
                    <dt>{t('firstName')}</dt><dd>{contactData.FirstName || '-'}</dd>
                    <dt>{t('lastName')}</dt><dd>{contactData.LastName || '-'}</dd>
                    <dt>{t('source')}</dt><dd>{contactData.Source || '-'}</dd>
                    <dt>{t('dateAdded')}</dt><dd>{formatDateForDisplay(contactData.DateAdded, i18n.language)}</dd>
                    <dt>{t('dateUpdated')}</dt><dd>{formatDateForDisplay(contactData.DateUpdated, i18n.language)}</dd>
                    <dt>{t('statusChangeDate')}</dt><dd>{formatDateForDisplay(contactData.StatusChangeDate, i18n.language)}</dd>
                    
                    <div className="grid-separator"><h4>{t('activity')}</h4></div>
                    
                    <dt>{t('totalSent')}</dt><dd>{contactData.Activity?.TotalSent?.toLocaleString(i18n.language) ?? '0'}</dd>
                    <dt>{t('totalOpened')}</dt><dd>{contactData.Activity?.TotalOpened?.toLocaleString(i18n.language) ?? '0'}</dd>
                    <dt>{t('totalClicked')}</dt><dd>{contactData.Activity?.TotalClicked?.toLocaleString(i18n.language) ?? '0'}</dd>
                    <dt>{t('totalFailed')}</dt><dd>{contactData.Activity?.TotalFailed?.toLocaleString(i18n.language) ?? '0'}</dd>
                    <dt>{t('lastSent')}</dt><dd>{formatDateForDisplay(contactData.Activity?.LastSent, i18n.language)}</dd>
                    <dt>{t('lastOpened')}</dt><dd>{formatDateForDisplay(contactData.Activity?.LastOpened, i18n.language)}</dd>
                    <dt>{t('lastClicked')}</dt><dd>{formatDateForDisplay(contactData.Activity?.LastClicked, i18n.language)}</dd>
                    <dt>{t('lastFailed')}</dt><dd>{formatDateForDisplay(contactData.Activity?.LastFailed, i18n.language)}</dd>

                    <div className="grid-separator"><h4>{t('customFields')}</h4></div>
                    
                    {contactData.CustomFields && Object.keys(contactData.CustomFields).length > 0 ? (
                         Object.entries(contactData.CustomFields).map(([key, value]) => (
                             <React.Fragment key={key}>
                                 <dt>{key}</dt>
                                 <dd>{String(value) || '-'}</dd>
                             </React.Fragment>
                         ))
                    ) : (
                        <dd className="full-width-dd">{t('noCustomFields')}</dd>
                    )}
                </div>
            )}
        </Modal>
    );
};

const ImportContactsModal = ({ isOpen, onClose, apiKey, onSuccess, onError }: { isOpen: boolean; onClose: () => void; apiKey: string; onSuccess: () => void; onError: (msg: string) => void; }) => {
    const { t } = useTranslation();
    const [file, setFile] = useState<File | null>(null);
    const [listName, setListName] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const { data: lists, loading: listsLoading } = useApiV4('/lists', apiKey, {}, isOpen ? 1 : 0);

    const handleFileChange = (files: FileList | null) => {
        if (files && files.length > 0) {
            if (files[0].type === 'text/csv' || files[0].name.endsWith('.csv')) {
                setFile(files[0]);
            } else {
                onError(t('invalidFileType'));
            }
        }
    };

    const handleDragEvents = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };
    const handleDragEnter = (e: React.DragEvent) => { handleDragEvents(e); setDragOver(true); };
    const handleDragLeave = (e: React.DragEvent) => { handleDragEvents(e); setDragOver(false); };
    const handleDrop = (e: React.DragEvent) => {
        handleDragEvents(e);
        setDragOver(false);
        handleFileChange(e.dataTransfer.files);
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        if (listName) {
            formData.append('listName', listName);
        }

        try {
            await apiUploadV4('/contacts/import', apiKey, formData);
            onSuccess();
        } catch (err: any) {
            onError(err.message);
        } finally {
            setIsUploading(false);
        }
    };
    
    useEffect(() => {
        if (!isOpen) {
            setFile(null);
            setListName('');
            setIsUploading(false);
            setDragOver(false);
        }
    }, [isOpen]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('importContactsTitle')}>
            <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-group">
                    <label>{t('uploadCsvFile')}</label>
                    <div
                        className={`file-dropzone ${dragOver ? 'drag-over' : ''}`}
                        onClick={() => document.getElementById('csv-input')?.click()}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragEvents}
                        onDrop={handleDrop}
                    >
                        <input
                            type="file" id="csv-input" accept=".csv, text/csv"
                            onChange={(e) => handleFileChange(e.target.files)}
                            style={{ display: 'none' }}
                        />
                         {file ? (
                            <p className="file-name">{t('selectedFile', { fileName: file.name })}</p>
                        ) : (
                            <p><strong>{t('clickToBrowse')}</strong> {t('orDragAndDrop')}</p>
                        )}
                    </div>
                </div>

                <div className="form-group">
                     <label htmlFor="listName">{t('addToListOptional')}</label>
                     <select id="listName" value={listName} onChange={e => setListName(e.target.value)} disabled={listsLoading}>
                         <option value="">{t('dontAddToList')}</option>
                         {lists?.map((l: List) => <option key={l.ListName} value={l.ListName}>{l.ListName}</option>)}
                     </select>
                </div>
                <div className="form-actions" style={{marginTop: '1rem'}}>
                     <button type="submit" className="btn btn-primary full-width" disabled={!file || isUploading}>
                        {isUploading ? <Loader /> : t('startImport')}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

const ContactCard = React.memo(({ contact, onView, onDelete }: { contact: Contact; onView: (email: string) => void; onDelete: (email: string) => void; }) => {
    const { t, i18n } = useTranslation();
    return (
        <div className="card contact-card">
            <div className="contact-card-main">
                <div className="contact-card-info">
                    <h4 className="contact-card-name">{contact.FirstName || contact.LastName ? `${contact.FirstName || ''} ${contact.LastName || ''}`.trim() : contact.Email}</h4>
                    <p className="contact-card-email">{contact.Email}</p>
                </div>
                <div className="contact-card-status">
                    <Badge text={contact.Status} type={contact.Status === 'Active' ? 'success' : 'default'} />
                </div>
            </div>
            <div className="contact-card-footer">
                <small>{t('added')}: {formatDateForDisplay(contact.DateAdded, i18n.language)}</small>
                <div className="action-buttons">
                    <button className="btn-icon" onClick={() => onView(contact.Email)} aria-label={t('viewContactDetails')}>
                        <Icon path={ICONS.EYE} />
                    </button>
                    <button className="btn-icon btn-icon-danger" onClick={() => onDelete(contact.Email)} aria-label={t('deleteContact')}>
                        <Icon path={ICONS.DELETE} />
                    </button>
                </div>
            </div>
        </div>
    );
});

const ContactsView = ({ apiKey }: { apiKey: string }) => {
    const { t } = useTranslation();
    const [refetchIndex, setRefetchIndex] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [offset, setOffset] = useState(0);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [actionStatus, setActionStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedContactDetails, setSelectedContactDetails] = useState<Contact | null>(null);
    const [isDetailLoading, setIsDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);

    const CONTACTS_PER_PAGE = 20;

    const { data: contacts, loading, error } = useApiV4('/contacts', apiKey, { limit: CONTACTS_PER_PAGE, offset, search: searchQuery }, refetchIndex);
    const refetch = () => setRefetchIndex(i => i + 1);

    const handleAddContact = async (contactData: {Email: string, FirstName: string, LastName: string}) => {
        try {
            await apiFetchV4('/contacts', apiKey, { method: 'POST', body: [contactData] });
            setActionStatus({ type: 'success', message: t('contactAddedSuccess', { email: contactData.Email }) });
            setIsAddModalOpen(false);
            refetch();
        } catch (err: any) {
            setActionStatus({ type: 'error', message: t('contactAddedError', { error: err.message }) });
        }
    };
    
    const handleDeleteContact = useCallback(async (email: string) => {
        if (!window.confirm(t('confirmDeleteContact', { email }))) return;
        try {
            await apiFetchV4(`/contacts/${encodeURIComponent(email)}`, apiKey, { method: 'DELETE' });
            setActionStatus({ type: 'success', message: t('contactDeletedSuccess', { email }) });
            refetch();
        } catch (err: any) {
            setActionStatus({ type: 'error', message: t('contactDeletedError', { error: err.message }) });
        }
    }, [apiKey, t]);

    const handleViewContact = useCallback(async (email: string) => {
        setIsDetailModalOpen(true);
        setIsDetailLoading(true);
        setDetailError(null);
        setSelectedContactDetails(null);
        try {
            const details = await apiFetchV4(`/contacts/${encodeURIComponent(email)}`, apiKey);
            setSelectedContactDetails(details);
        } catch (err: any) {
            setDetailError(err.message || t('contactDetailsError'));
        } finally {
            setIsDetailLoading(false);
        }
    }, [apiKey, t]);

    return (
        <div>
            <ActionStatus status={actionStatus} onDismiss={() => setActionStatus(null)} />
            <div className="view-header contacts-header">
                <div className="search-bar">
                    <input
                        type="search"
                        placeholder={t('searchContactsPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setOffset(0);
                        }}
                    />
                </div>
                <div className="header-actions">
                    <button className="btn" onClick={() => setIsImportModalOpen(true)}>
                        <Icon path={ICONS.UPLOAD} /> {t('importContacts')}
                    </button>
                    <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
                        <Icon path={ICONS.USER_PLUS} /> {t('addContact')}
                    </button>
                </div>
            </div>

            <ImportContactsModal 
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                apiKey={apiKey}
                onSuccess={() => {
                    setIsImportModalOpen(false);
                    setActionStatus({ type: 'success', message: t('importSuccessMessage') });
                    setTimeout(refetch, 2000); // Refetch after a small delay
                }}
                onError={(message) => {
                    setActionStatus({ type: 'error', message: t('importFailedError', { error: message }) });
                }}
            />

            <Modal title={t('addNewContact')} isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)}>
                <AddContactForm onSubmit={handleAddContact} />
            </Modal>

            <ContactDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => { setIsDetailModalOpen(false); setSelectedContactDetails(null); }}
                contactData={selectedContactDetails}
                isLoading={isDetailLoading}
                error={detailError}
            />

            {loading && !contacts && <CenteredMessage><Loader /></CenteredMessage>}
            {error && <ErrorMessage error={error} />}

            {!loading && !error && (
                <>
                    {contacts?.length > 0 ? (
                        <div className="contacts-grid">
                            {contacts.map((contact: Contact) => (
                                <ContactCard 
                                    key={contact.Email} 
                                    contact={contact} 
                                    onView={handleViewContact} 
                                    onDelete={handleDeleteContact} 
                                />
                            ))}
                        </div>
                    ) : (
                        <CenteredMessage>
                           {searchQuery ? t('noContactsForQuery', { query: searchQuery }) : t('noContactsFound')}
                        </CenteredMessage>
                    )}

                    {contacts && contacts.length > 0 && (
                        <div className="pagination-controls">
                            <button onClick={() => setOffset(o => Math.max(0, o - CONTACTS_PER_PAGE))} disabled={offset === 0 || loading}>
                                {t('previous')}
                            </button>
                            <span>{t('page', { page: offset / CONTACTS_PER_PAGE + 1 })}</span>
                            <button onClick={() => setOffset(o => o + CONTACTS_PER_PAGE)} disabled={contacts.length < CONTACTS_PER_PAGE || loading}>
                                {t('next')}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

const AddContactForm = ({ onSubmit }: { onSubmit: (data: {Email: string, FirstName: string, LastName: string}) => void }) => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ Email: email, FirstName: firstName, LastName: lastName });
    };

    return (
        <form onSubmit={handleSubmit} className="modal-form">
            <div className="form-group">
                <label htmlFor="email">{t('emailAddress')}</label>
                <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="form-grid">
                 <div className="form-group">
                    <label htmlFor="firstName">{t('firstName')}</label>
                    <input id="firstName" type="text" value={firstName} onChange={e => setFirstName(e.target.value)} />
                </div>
                 <div className="form-group">
                    <label htmlFor="lastName">{t('lastName')}</label>
                    <input id="lastName" type="text" value={lastName} onChange={e => setLastName(e.target.value)} />
                </div>
            </div>
            <button type="submit" className="btn btn-primary full-width">{t('addContact')}</button>
        </form>
    );
};

const RenameModal = ({ isOpen, onClose, entityName, entityType, onSubmit }: { isOpen: boolean, onClose: () => void, entityName: string, entityType: string, onSubmit: (newName: string) => Promise<void> }) => {
    const { t } = useTranslation();
    const [newName, setNewName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setNewName(entityName);
        }
    }, [isOpen, entityName]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName || newName === entityName) return;
        setIsSubmitting(true);
        await onSubmit(newName);
        setIsSubmitting(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('renameEntityType', { type: entityType, name: entityName })}>
            <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-group">
                    <label htmlFor="new-entity-name">{t('newEntityName', { type: entityType })}</label>
                    <input id="new-entity-name" type="text" value={newName} onChange={e => setNewName(e.target.value)} required disabled={isSubmitting} />
                </div>
                <div className="form-actions" style={{ marginTop: '1rem' }}>
                    <button type="button" className="btn" onClick={onClose} disabled={isSubmitting}>{t('cancel')}</button>
                    <button type="submit" className="btn btn-primary" disabled={isSubmitting || !newName || newName === entityName}>
                        {isSubmitting ? <Loader /> : t('saveChanges')}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

const ListContactsModal = ({ isOpen, onClose, listName, apiKey }: { isOpen: boolean, onClose: () => void, listName: string, apiKey: string }) => {
    const { t } = useTranslation();
    const [offset, setOffset] = useState(0);
    const [refetchIndex, setRefetchIndex] = useState(0);
    const CONTACTS_PER_PAGE = 15;
    
    useEffect(() => {
        if (isOpen) {
            setOffset(0);
            setRefetchIndex(i => i + 1);
        }
    }, [isOpen]);

    const { data: contacts, loading, error } = useApiV4(
        isOpen ? `/lists/${encodeURIComponent(listName)}/contacts` : '', 
        apiKey, 
        { limit: CONTACTS_PER_PAGE, offset },
        refetchIndex
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('contactsInList', { listName })}>
            {loading && <CenteredMessage><Loader /></CenteredMessage>}
            {error && <ErrorMessage error={error} />}
            {!loading && !error && (
                <>
                    <div className="table-container">
                        <table className="simple-table">
                            <thead>
                                <tr>
                                    <th>{t('email')}</th>
                                    <th>{t('name')}</th>
                                    <th>{t('status')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {contacts && contacts.length > 0 ? (
                                    contacts.map((c: Contact) => (
                                        <tr key={c.Email}>
                                            <td>{c.Email}</td>
                                            <td>{`${c.FirstName || ''} ${c.LastName || ''}`.trim() || '-'}</td>
                                            <td><Badge text={c.Status} type={c.Status === 'Active' ? 'success' : 'default'} /></td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} style={{ textAlign: 'center', padding: '2rem' }}>{t('listHasNoContacts')}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {contacts && (contacts.length > 0 || offset > 0) && (
                         <div className="pagination-controls" style={{borderTop: 'none', marginTop: '1rem'}}>
                            <button onClick={() => setOffset(o => Math.max(0, o - CONTACTS_PER_PAGE))} disabled={offset === 0 || loading}>
                                {t('previous')}
                            </button>
                            <span>{t('page', { page: offset / CONTACTS_PER_PAGE + 1 })}</span>
                            <button onClick={() => setOffset(o => o + CONTACTS_PER_PAGE)} disabled={contacts.length < CONTACTS_PER_PAGE || loading}>
                                {t('next')}
                            </button>
                        </div>
                    )}
                </>
            )}
        </Modal>
    );
};


const EmailListView = ({ apiKey }: { apiKey: string }) => {
    const { t, i18n } = useTranslation();
    const [refetchIndex, setRefetchIndex] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [actionStatus, setActionStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);
    const [newListName, setNewListName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [listToRename, setListToRename] = useState<List | null>(null);
    const [listToView, setListToView] = useState<List | null>(null);

    const { data: lists, loading, error } = useApiV4('/lists', apiKey, {}, refetchIndex);
    const refetch = () => setRefetchIndex(i => i + 1);

    const handleCreateList = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newListName) return;
        setIsSubmitting(true);
        try {
            await apiFetchV4('/lists', apiKey, { method: 'POST', body: { ListName: newListName } });
            setActionStatus({ type: 'success', message: t('listCreatedSuccess', { listName: newListName }) });
            setNewListName('');
            refetch();
        } catch (err: any) {
            setActionStatus({ type: 'error', message: t('listCreatedError', { error: err.message }) });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleDeleteList = async (listName: string) => {
        if (!window.confirm(t('confirmDeleteList', { listName }))) return;
        try {
            await apiFetchV4(`/lists/${encodeURIComponent(listName)}`, apiKey, { method: 'DELETE' });
            setActionStatus({ type: 'success', message: t('listDeletedSuccess', { listName }) });
            refetch();
        } catch (err: any) {
            setActionStatus({ type: 'error', message: t('listDeletedError', { error: err.message }) });
        }
    };

    const handleRenameList = async (newName: string) => {
        if (!listToRename) return;
        try {
            await apiFetchV4(`/lists/${encodeURIComponent(listToRename.ListName)}`, apiKey, {
                method: 'PUT',
                body: { ListName: newName }
            });
            setActionStatus({ type: 'success', message: t('listRenamedSuccess', { newName }) });
            setListToRename(null);
            setTimeout(() => refetch(), 1000); // Wait for API to propagate change
        } catch (err: any) {
            setActionStatus({ type: 'error', message: t('listRenamedError', { error: err.message }) });
        }
    };

    const filteredLists: List[] = lists?.filter((list: List) => 
        list.ListName.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    return (
        <div>
            <ActionStatus status={actionStatus} onDismiss={() => setActionStatus(null)} />

            {listToRename && (
                <RenameModal 
                    isOpen={!!listToRename}
                    onClose={() => setListToRename(null)}
                    entityName={listToRename.ListName}
                    entityType={t('list')}
                    onSubmit={handleRenameList}
                />
            )}
            
            {listToView && (
                <ListContactsModal
                    isOpen={!!listToView}
                    onClose={() => setListToView(null)}
                    listName={listToView.ListName}
                    apiKey={apiKey}
                />
            )}


            <div className="view-header">
                 <div className="search-bar">
                    <Icon path={ICONS.SEARCH} />
                    <input
                        type="search"
                        placeholder={t('searchListsPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <form className="create-list-form" onSubmit={handleCreateList}>
                    <input
                        type="text"
                        placeholder={t('newListNamePlaceholder')}
                        value={newListName}
                        onChange={e => setNewListName(e.target.value)}
                        disabled={isSubmitting}
                    />
                    <button type="submit" className="btn btn-primary" disabled={!newListName || isSubmitting}>
                        {isSubmitting ? <Loader /> : <><Icon path={ICONS.PLUS}/> {t('createList')}</>}
                    </button>
                </form>
            </div>
            {loading && <CenteredMessage><Loader /></CenteredMessage>}
            {error && <ErrorMessage error={error} />}
            {!loading && filteredLists.length === 0 && (
                 <CenteredMessage>
                    {searchQuery ? t('noListsForQuery', { query: searchQuery }) : t('noListsFound')}
                </CenteredMessage>
            )}
            <div className="card-grid list-grid">
                {filteredLists.map((list: List) => (
                    <div key={list.ListName} className="card list-card">
                        <div className="list-card-header">
                            <h3>{list.ListName}</h3>
                        </div>
                        <div className="list-card-body">
                             <p>{t('dateAdded')}: {formatDateForDisplay(list.DateAdded, i18n.language)}</p>
                        </div>
                        <div className="list-card-footer">
                           <div className="action-buttons">
                                <button className="btn-icon" onClick={() => setListToRename(list)} aria-label={t('renameList')}>
                                    <Icon path={ICONS.PENCIL} />
                                </button>
                                <button className="btn-icon" onClick={() => setListToView(list)} aria-label={t('viewContactsInList')}>
                                    <Icon path={ICONS.CONTACTS} />
                                </button>
                                <button className="btn-icon btn-icon-danger" onClick={() => handleDeleteList(list.ListName)} aria-label={t('deleteList')}>
                                    <Icon path={ICONS.DELETE} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const SegmentContactsModal = ({ isOpen, onClose, listName, apiKey }: { isOpen: boolean, onClose: () => void, listName: string, apiKey: string }) => {
    const { t } = useTranslation();
    const [offset, setOffset] = useState(0);
    const [refetchIndex, setRefetchIndex] = useState(0);
    const CONTACTS_PER_PAGE = 15;
    
    useEffect(() => {
        if (isOpen) {
            setOffset(0);
            setRefetchIndex(i => i + 1);
        }
    }, [isOpen]);

    const { data: contacts, loading, error } = useApiV4(
        isOpen ? `/segments/${encodeURIComponent(listName)}/contacts` : '', 
        apiKey, 
        { limit: CONTACTS_PER_PAGE, offset },
        refetchIndex
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('contactsInSegment', { segmentName: listName })}>
            {loading && <CenteredMessage><Loader /></CenteredMessage>}
            {error && <ErrorMessage error={error} />}
            {!loading && !error && (
                <>
                    <div className="table-container">
                        <table className="simple-table">
                            <thead>
                                <tr>
                                    <th>{t('email')}</th>
                                    <th>{t('name')}</th>
                                    <th>{t('status')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {contacts && contacts.length > 0 ? (
                                    contacts.map((c: Contact) => (
                                        <tr key={c.Email}>
                                            <td>{c.Email}</td>
                                            <td>{`${c.FirstName || ''} ${c.LastName || ''}`.trim() || '-'}</td>
                                            <td><Badge text={c.Status} type={c.Status === 'Active' ? 'success' : 'default'} /></td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} style={{ textAlign: 'center', padding: '2rem' }}>{t('segmentHasNoContacts')}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {contacts && (contacts.length > 0 || offset > 0) && (
                         <div className="pagination-controls" style={{borderTop: 'none', marginTop: '1rem'}}>
                            <button onClick={() => setOffset(o => Math.max(0, o - CONTACTS_PER_PAGE))} disabled={offset === 0 || loading}>
                                {t('previous')}
                            </button>
                            <span>{t('page', { page: offset / CONTACTS_PER_PAGE + 1 })}</span>
                            <button onClick={() => setOffset(o => o + CONTACTS_PER_PAGE)} disabled={contacts.length < CONTACTS_PER_PAGE || loading}>
                                {t('next')}
                            </button>
                        </div>
                    )}
                </>
            )}
        </Modal>
    );
};

const SegmentsView = ({ apiKey }: { apiKey: string }) => {
    const { t } = useTranslation();
    const [refetchIndex, setRefetchIndex] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [actionStatus, setActionStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    
    const [segmentToRename, setSegmentToRename] = useState<Segment | null>(null);
    const [segmentToView, setSegmentToView] = useState<Segment | null>(null);

    const { data: segments, loading, error } = useApiV4('/segments', apiKey, {}, refetchIndex);
    const refetch = () => setRefetchIndex(i => i + 1);

    const handleCreateSegment = async (segmentData: {Name: string, Rule: string}) => {
        try {
            await apiFetchV4('/segments', apiKey, { method: 'POST', body: segmentData });
            setActionStatus({ type: 'success', message: t('segmentCreatedSuccess', { name: segmentData.Name }) });
            setIsCreateModalOpen(false);
            refetch();
        } catch (err: any) {
            // Let the modal handle showing the error
            throw err;
        }
    };
    
    const handleDeleteSegment = async (segmentName: string) => {
        if (!window.confirm(t('confirmDeleteSegment', { segmentName }))) return;
        try {
            await apiFetchV4(`/segments/${encodeURIComponent(segmentName)}`, apiKey, { method: 'DELETE' });
            setActionStatus({ type: 'success', message: t('segmentDeletedSuccess', { segmentName }) });
            setTimeout(() => refetch(), 1000);
        } catch (err: any) {
            setActionStatus({ type: 'error', message: t('segmentDeletedError', { error: err.message }) });
        }
    };
    
    const handleRenameSegment = async (newName: string) => {
        if (!segmentToRename) return;
        try {
            await apiFetchV4(`/segments/${encodeURIComponent(segmentToRename.Name)}`, apiKey, {
                method: 'PUT',
                body: { Name: newName }
            });
            setActionStatus({ type: 'success', message: t('segmentRenamedSuccess', { newName }) });
            setSegmentToRename(null);
            setTimeout(() => refetch(), 1000);
        } catch (err: any) {
             setActionStatus({ type: 'error', message: t('segmentRenamedError', { error: err.message }) });
        }
    };

    const filteredSegments: Segment[] = segments?.filter((segment: Segment) =>
        segment.Name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    return (
        <div>
            <ActionStatus status={actionStatus} onDismiss={() => setActionStatus(null)} />
            <div className="view-header">
                <div className="search-bar">
                    <Icon path={ICONS.SEARCH} />
                    <input
                        type="search"
                        placeholder={t('searchSegmentsPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
                    <Icon path={ICONS.PLUS} /> {t('createSegment')}
                </button>
            </div>
            
            <Modal title={t('createNewSegment')} isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)}>
                <CreateSegmentRuleBuilder onSubmit={handleCreateSegment} />
            </Modal>
            
            {segmentToRename && (
                <RenameModal 
                    isOpen={!!segmentToRename}
                    onClose={() => setSegmentToRename(null)}
                    entityName={segmentToRename.Name}
                    entityType={t('segment')}
                    onSubmit={handleRenameSegment}
                />
            )}
            
            {segmentToView && (
                <SegmentContactsModal
                    isOpen={!!segmentToView}
                    onClose={() => setSegmentToView(null)}
                    listName={segmentToView.Name}
                    apiKey={apiKey}
                />
            )}

            {loading && <CenteredMessage><Loader /></CenteredMessage>}
            {error && <ErrorMessage error={error} />}
            {!loading && filteredSegments.length === 0 && (
                 <CenteredMessage>
                    {searchQuery ? t('noSegmentsForQuery', { query: searchQuery }) : t('noSegmentsFound')}
                </CenteredMessage>
            )}
            <div className="card-grid">
                {filteredSegments.map((segment: Segment) => (
                    <div key={segment.Name} className="card segment-card">
                        <div className="segment-card-header">
                            <h3>{segment.Name}</h3>
                             <div className="action-buttons">
                                <button className="btn-icon" onClick={() => setSegmentToRename(segment)} aria-label={t('renameSegment')}>
                                    <Icon path={ICONS.PENCIL} />
                                </button>
                                <button className="btn-icon" onClick={() => setSegmentToView(segment)} aria-label={t('viewContactsInSegment')}>
                                    <Icon path={ICONS.EYE} />
                                </button>
                                <button className="btn-icon btn-icon-danger" onClick={() => handleDeleteSegment(segment.Name)} aria-label={t('deleteSegment')}>
                                    <Icon path={ICONS.DELETE} />
                                </button>
                            </div>
                        </div>
                        <div className="segment-card-body">
                             <label>{t('rule')}</label>
                             <div className="segment-rule">{segment.Rule}</div>
                        </div>
                        <div className="segment-card-footer">
                           <span>{t('contacts')}</span>
                           <strong>{segment.ContactsCount?.toLocaleString() ?? 'N/A'}</strong>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Segment Rule Builder ---
type FieldDef = { name: string; apiName: string; type: 'text' | 'number' | 'date'; };
type OperatorDef = { name: string; apiOp: string; noValue?: boolean; };
type Rule = { id: number; field: string; op: string; value: string; };

const SEGMENT_FIELDS_CONFIG: Record<string, FieldDef[]> = {
    "General": [
        { name: 'Firstname', apiName: 'Firstname', type: 'text' }, { name: 'Lastname', apiName: 'Lastname', type: 'text' },
        { name: 'List Name', apiName: 'ListName', type: 'text' }, { name: 'Status', apiName: 'Status', type: 'text' },
        { name: 'Source', apiName: 'Source', type: 'text' }, { name: 'Unsubscribe Reason', apiName: 'UnsubscribeReason', type: 'text' },
        { name: 'Email', apiName: 'Email', type: 'text' }, { name: 'Date Added', apiName: 'DateAdded', type: 'date' },
        { name: 'Date Updated', apiName: 'DateUpdated', type: 'date' }, { name: 'Status Change Date', apiName: 'StatusChangeDate', type: 'date' },
        { name: 'Consent Date', apiName: 'ConsentDate', type: 'date' }, { name: 'Consent IP', apiName: 'ConsentIp', type: 'text' },
        { name: 'Consent Tracking', apiName: 'ConsentTracking', type: 'text' }, { name: 'Days Since Date Added', apiName: 'DaysSinceDateAdded', type: 'number' },
        { name: 'Days Since Date Updated', apiName: 'DaysSinceDateUpdated', type: 'number' }, { name: 'Days Since Consent Date', apiName: 'DaysSinceConsentDate', type: 'number' },
        { name: 'Created From IP', apiName: 'CreatedFromIp', type: 'text' }, { name: 'Last Error', apiName: 'LastError', type: 'text' },
    ],
    "Statistics": [
        { name: 'Total Sent', apiName: 'TotalSent', type: 'number' }, { name: 'Total Opens', apiName: 'TotalOpens', type: 'number' },
        { name: 'Total Clicks', apiName: 'TotalClicks', type: 'number' }, { name: 'Total Bounces', apiName: 'TotalBounces', type: 'number' },
        { name: 'Last Sent', apiName: 'LastSent', type: 'date' }, { name: 'Last Opened', apiName: 'LastOpened', type: 'date' },
        { name: 'Last Clicked', apiName: 'LastClicked', type: 'date' }, { name: 'Last Bounced', apiName: 'LastBounced', type: 'date' },
        { name: 'Days Since Last Sent', apiName: 'DaysSinceLastSent', type: 'number' }, { name: 'Days Since Last Opened', apiName: 'DaysSinceLastOpened', type: 'number' },
        { name: 'Days Since Last Clicked', apiName: 'DaysSinceLastClicked', type: 'number' }, { name: 'Days Since Last Bounced', apiName: 'DaysSinceLastBounced', type: 'number' },
    ],
    "Custom": [
        { name: 'Country', apiName: 'Country', type: 'text' }, { name: 'Mobile', apiName: 'Mobile', type: 'text' },
        { name: 'Phone', apiName: 'Phone', type: 'text' }, { name: 'Company', apiName: 'Company', type: 'text' },
    ]
};

const OPERATORS_CONFIG: Record<'text' | 'number' | 'date', OperatorDef[]> = {
    text: [ { name: 'Is', apiOp: '=' }, { name: 'Contains', apiOp: 'CONTAINS' }, { name: 'Does Not Contain', apiOp: 'NOTCONTAINS' }, { name: 'Starts With', apiOp: 'STARTSWITH' }, { name: 'Ends With', apiOp: 'ENDSWITH' }, { name: 'Is Empty', apiOp: 'IS EMPTY', noValue: true }, { name: 'Is Not Empty', apiOp: 'IS NOT EMPTY', noValue: true } ],
    number: [ { name: 'Equals', apiOp: '=' }, { name: 'Greater Than', apiOp: '>' }, { name: 'Less Than', apiOp: '<' }, { name: 'Greater Than or Equals', apiOp: '>=' }, { name: 'Less Than or Equals', apiOp: '<=' } ],
    date: [ { name: 'On', apiOp: '=' }, { name: 'Before', apiOp: '<' }, { name: 'After', apiOp: '>' } ]
};

const ALL_FIELDS = Object.values(SEGMENT_FIELDS_CONFIG).flat();

const CreateSegmentRuleBuilder = ({ onSubmit }: { onSubmit: (data: { Name: string, Rule: string }) => Promise<any> }) => {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [conjunction, setConjunction] = useState('AND');
    const [rules, setRules] = useState<Rule[]>([{ id: Date.now(), field: 'Firstname', op: 'Is', value: '' }]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const addRule = () => {
        setRules([...rules, { id: Date.now(), field: 'Firstname', op: 'Is', value: '' }]);
    };
    
    const removeRule = (id: number) => {
        setRules(rules.filter(r => r.id !== id));
    };
    
    const updateRule = (id: number, newValues: Partial<Omit<Rule, 'id'>>) => {
        setRules(rules.map(r => r.id === id ? { ...r, ...newValues } : r));
    };

    const handleFieldChange = (id: number, newField: string) => {
        const fieldDef = ALL_FIELDS.find(f => f.name === newField);
        if (fieldDef) {
            const newOp = OPERATORS_CONFIG[fieldDef.type][0].name;
            updateRule(id, { field: newField, op: newOp, value: '' });
        }
    };
    
    const buildQuery = () => {
        return rules.map(rule => {
            const fieldDef = ALL_FIELDS.find(f => f.name === rule.field);
            const opDef = OPERATORS_CONFIG[fieldDef?.type || 'text'].find(o => o.name === rule.op);
            if (!fieldDef || !opDef) return null;

            if (opDef.noValue) return `${fieldDef.apiName} ${opDef.apiOp}`;
            
            let value = rule.value;
            if(fieldDef.type === 'text' || fieldDef.type === 'date') {
                 value = `'${value.replace(/'/g, "''")}'`; // Quote and escape single quotes
            }
            if (value === "''") value = "''"; // Keep empty string literal
            
            return `${fieldDef.apiName} ${opDef.apiOp} ${value}`;
        }).filter(Boolean).join(` ${conjunction} `);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const ruleString = buildQuery();
        if (!name || !ruleString) {
            setError(t('segmentRuleValidationError'));
            return;
        }
        setIsSubmitting(true);
        try {
            await onSubmit({ Name: name, Rule: ruleString });
        } catch(err: any) {
            setError(err.message || t('unknownError'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="rule-builder-form">
            <div className="info-message" style={{textAlign: 'left', display: 'flex', alignItems: 'center', gap: '1rem'}}>
               <Icon path={ICONS.COMPLAINT} style={{flexShrink: 0}} />
                <span>{t('segmentRuleSubRuleNotice')}</span>
            </div>
            <div className="form-group">
                <label htmlFor="segmentName">{t('segmentName')}</label>
                <input id="segmentName" type="text" value={name} onChange={e => setName(e.target.value)} required disabled={isSubmitting} />
            </div>
            <div className="rule-builder">
                <div className="rule-conjunction-toggle">
                    <label>{t('match')}</label>
                    <button type="button" className={conjunction === 'AND' ? 'active' : ''} onClick={() => setConjunction('AND')}>{t('allAnd')}</button>
                    <label>{t('ofTheFollowing')}:</label>
                </div>
                <div className="rule-list">
                    {rules.map((rule, index) => {
                        const fieldDef = ALL_FIELDS.find(f => f.name === rule.field);
                        const operators = OPERATORS_CONFIG[fieldDef?.type || 'text'];
                        const opDef = operators.find(o => o.name === rule.op);

                        return (
                            <div key={rule.id} className="rule-row">
                                <select value={rule.field} onChange={e => handleFieldChange(rule.id, e.target.value)} disabled={isSubmitting}>
                                    {Object.entries(SEGMENT_FIELDS_CONFIG).map(([category, fields]) => (
                                        <optgroup key={category} label={t(`segmentFieldCategory_${category.toLowerCase()}`)}>
                                            {fields.map(f => <option key={f.name} value={f.name}>{t(`segmentField_${f.apiName}`)}</option>)}
                                        </optgroup>
                                    ))}
                                </select>
                                <select value={rule.op} onChange={e => updateRule(rule.id, { op: e.target.value })} disabled={isSubmitting}>
                                    {operators.map(o => <option key={o.name} value={o.name}>{t(`segmentOperator_${o.apiOp.replace(/\s/g, '')}`)}</option>)}
                                </select>
                                <input
                                    type={fieldDef?.type === 'date' ? 'date' : fieldDef?.type === 'number' ? 'number' : 'text'}
                                    value={rule.value}
                                    onChange={e => updateRule(rule.id, { value: e.target.value })}
                                    disabled={isSubmitting || opDef?.noValue}
                                    placeholder={opDef?.noValue ? t('noValueNeeded') : t('enterValue')}
                                />
                                <button type="button" className="btn-icon btn-icon-danger remove-rule-btn" onClick={() => removeRule(rule.id)} disabled={rules.length <= 1 || isSubmitting}>
                                    <Icon path={ICONS.DELETE} />
                                </button>
                            </div>
                        );
                    })}
                </div>
                <div className="add-rule-btn-container">
                    <button type="button" className="btn add-rule-btn" onClick={addRule} disabled={isSubmitting}>
                        <Icon path={ICONS.PLUS}/> {t('addAnotherRule')}
                    </button>
                </div>
            </div>
            {error && <ActionStatus status={{ type: 'error', message: error }} onDismiss={() => setError('')} />}
            <button type="submit" className="btn btn-primary full-width" disabled={isSubmitting}>
                {isSubmitting ? <Loader /> : t('createSegment')}
            </button>
        </form>
    );
}

const SendEmailView = ({ apiKey, user }: { apiKey: string, user: any }) => {
    const { t } = useTranslation();
    const [isSending, setIsSending] = useState(false);
    const [sendStatus, setSendStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);
    const [formData, setFormData] = useState({
        subject: '',
        from: user?.email || '',
        fromName: '',
        bodyHtml: '',
        target: 'all', // all, list, segment
        targetName: ''
    });

    const { data: lists } = useApiV4('/lists', apiKey);
    const { data: segments } = useApiV4('/segments', apiKey);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSending(true);
        setSendStatus(null);
        
        const params: Record<string, any> = {
            subject: formData.subject,
            from: formData.from,
            fromName: formData.fromName,
            bodyHtml: formData.bodyHtml,
        };

        if(formData.target === 'all') {
            params.to = 'All Contacts';
        } else if (formData.target === 'list') {
            params.listName = formData.targetName;
        } else if (formData.target === 'segment') {
            params.segmentName = formData.targetName;
        }

        try {
            await apiFetch('/email/send', apiKey, { method: 'POST', params });
            setSendStatus({ type: 'success', message: t('emailSentSuccess') });
        } catch (err: any) {
            setSendStatus({ type: 'error', message: t('emailSentError', { error: err.message }) });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <form className="form-container" onSubmit={handleSubmit}>
            <div className="form-grid">
                <div className="form-group full-width">
                    <label htmlFor="subject">{t('subject')}</label>
                    <input id="subject" name="subject" type="text" value={formData.subject} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="from">{t('fromEmail')}</label>
                    <input id="from" name="from" type="email" value={formData.from} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="fromName">{t('fromName')}</label>
                    <input id="fromName" name="fromName" type="text" value={formData.fromName} onChange={handleChange} />
                </div>

                <div className="form-group">
                    <label htmlFor="target">{t('sendTo')}</label>
                    <select id="target" name="target" value={formData.target} onChange={handleChange}>
                        <option value="all">{t('allContacts')}</option>
                        <option value="list">{t('aList')}</option>
                        <option value="segment">{t('aSegment')}</option>
                    </select>
                </div>

                <div className="form-group">
                    {formData.target === 'list' && (
                        <>
                         <label htmlFor="targetName">{t('selectList')}</label>
                         <select id="targetName" name="targetName" value={formData.targetName} onChange={handleChange} required>
                             <option value="">{t('chooseList')}</option>
                             {lists?.map((l: List) => <option key={l.ListName} value={l.ListName}>{l.ListName}</option>)}
                         </select>
                        </>
                    )}
                    {formData.target === 'segment' && (
                        <>
                        <label htmlFor="targetName">{t('selectSegment')}</label>
                        <select id="targetName" name="targetName" value={formData.targetName} onChange={handleChange} required>
                            <option value="">{t('chooseSegment')}</option>
                             {segments?.map((s: Segment) => <option key={s.Name} value={s.Name}>{s.Name}</option>)}
                        </select>
                        </>
                    )}
                </div>

                <div className="form-group full-width">
                    <label htmlFor="bodyHtml">{t('emailBodyHtml')}</label>
                    <textarea id="bodyHtml" name="bodyHtml" value={formData.bodyHtml} onChange={handleChange} required></textarea>
                </div>
                <div className="form-actions">
                    {sendStatus && <div className={`send-status-message ${sendStatus.type}`}>{sendStatus.message}</div>}
                    <button type="submit" className="btn btn-primary" disabled={isSending}>
                        {isSending ? <Loader /> : t('sendEmail')}
                    </button>
                </div>
            </div>
        </form>
    );
};

const CampaignStatsModal = ({ isOpen, onClose, campaignName, apiKey }: { isOpen: boolean; onClose: () => void; campaignName: string | null; apiKey: string; }) => {
    const { t, i18n } = useTranslation();
    // Only fetch if the modal is open and has a campaign name
    const shouldFetch = isOpen && !!campaignName;
    const { data: stats, loading, error } = useApiV4(
        shouldFetch ? `/statistics/campaigns/${encodeURIComponent(campaignName!)}` : '',
        apiKey
    );
    
    const statItems = stats ? [
        { title: t('recipients'), value: stats.Recipients, icon: ICONS.CONTACTS },
        { title: t('totalEmails'), value: stats.EmailTotal, icon: ICONS.MAIL },
        { title: t('totalSms'), value: stats.SmsTotal, icon: ICONS.COMPLAINT },
        { title: t('delivered'), value: stats.Delivered, icon: ICONS.VERIFY },
        { title: t('bounced'), value: stats.Bounced, icon: ICONS.BOUNCED },
        { title: t('inProgress'), value: stats.InProgress, icon: ICONS.LOADING_SPINNER },
        { title: t('opened'), value: stats.Opened, icon: ICONS.EYE },
        { title: t('clicked'), value: stats.Clicked, icon: ICONS.CLICK },
        { title: t('unsubscribed'), value: stats.Unsubscribed, icon: ICONS.LOGOUT },
        { title: t('complaints'), value: stats.Complaints, icon: ICONS.COMPLAINT },
        { title: t('manualCancel'), value: stats.ManualCancel, icon: ICONS.X_CIRCLE },
        { title: t('notDelivered'), value: stats.NotDelivered, icon: ICONS.BOUNCED },
    ].filter(item => item.title !== t('totalSms') || Number(item.value) > 0)
    : [];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('statsForCampaign', { campaignName: campaignName || '...' })}>
            {loading && <CenteredMessage><Loader /></CenteredMessage>}
            {error && <ErrorMessage error={error} />}
            {!loading && !error && (
                stats && Object.keys(stats).length > 0 ? (
                    <div className="card-grid account-grid">
                        {statItems.map(item => (
                            <AccountDataCard key={item.title} title={item.title} iconPath={item.icon}>
                                {(Number(item.value) || 0).toLocaleString(i18n.language)}
                            </AccountDataCard>
                        ))}
                    </div>
                ) : (
                     <CenteredMessage>{t('noStatsForCampaign')}</CenteredMessage>
                )
            )}
        </Modal>
    );
};

const CampaignsView = ({ apiKey }: { apiKey: string }) => {
    const { t } = useTranslation();
    const { data: campaigns, loading, error } = useApiV4('/campaigns', apiKey);
    const [searchQuery, setSearchQuery] = useState('');
    const [campaignNameToViewStats, setCampaignNameToViewStats] = useState<string | null>(null);

    const getBadgeTypeForStatus = (statusName: string | undefined) => {
        const lowerStatus = (statusName || '').toLowerCase();
        if (lowerStatus === 'sent' || lowerStatus === 'complete' || lowerStatus === 'completed') return 'success';
        if (lowerStatus === 'draft') return 'default';
        if (lowerStatus === 'processing' || lowerStatus === 'sending' || lowerStatus === 'inprogress' || lowerStatus === 'scheduled') return 'info';
        if (lowerStatus === 'cancelled') return 'warning';
        return 'default';
    }

    const filteredCampaigns = useMemo(() => {
        if (!Array.isArray(campaigns)) return [];
        return campaigns.filter((c: any) => 
            c.Name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            (c.Content?.[0]?.Subject && c.Content[0].Subject.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [campaigns, searchQuery]);

    return (
        <div>
            <CampaignStatsModal 
                isOpen={!!campaignNameToViewStats}
                onClose={() => setCampaignNameToViewStats(null)}
                campaignName={campaignNameToViewStats}
                apiKey={apiKey}
            />
            <div className="view-header">
                <div className="search-bar">
                    <Icon path={ICONS.SEARCH} />
                    <input
                        type="search"
                        placeholder={t('searchCampaignsPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        disabled={loading}
                    />
                </div>
            </div>

            {loading && <CenteredMessage><Loader /></CenteredMessage>}
            {error && <ErrorMessage error={error} />}

            {!loading && !error && (
                 (!Array.isArray(campaigns) || campaigns.length === 0) ? (
                    <CenteredMessage>{t('noCampaignsFound')}</CenteredMessage>
                ) : filteredCampaigns.length === 0 ? (
                    <CenteredMessage>
                        {searchQuery ? t('noCampaignsForQuery', { query: searchQuery }) : t('noCampaignsSent')}
                    </CenteredMessage>
                ) : (
                    <div className="campaign-grid">
                        {filteredCampaigns.map((campaign: any) => (
                            <div key={campaign.Name} className="campaign-card">
                                <div className="campaign-card-header">
                                    <h3>{campaign.Name}</h3>
                                    <div className="action-buttons">
                                        <button className="btn-icon" onClick={() => setCampaignNameToViewStats(campaign.Name)} aria-label={t('viewCampaignStats')}>
                                            <Icon path={ICONS.TRENDING_UP} />
                                        </button>
                                        <Badge text={campaign.Status ?? t('unknown')} type={getBadgeTypeForStatus(campaign.Status)} />
                                    </div>
                                </div>
                                <div className="campaign-card-body">
                                    <p className="campaign-subject">
                                        {campaign.Content?.[0]?.Subject || t('noSubject')}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}
        </div>
    );
};

const DNS_RECORDS_CONFIG = {
    SPF: {
        type: 'TXT',
        name: (domain: string) => domain,
        expectedValue: 'v=spf1 a mx include:mailzila.com ~all',
        check: (data: string) => data.includes('v=spf1') && data.includes('include:mailzila.com'),
        host: '@ or your domain',
    },
    DKIM: {
        type: 'TXT',
        name: (domain: string) => `api._domainkey.${domain}`,
        expectedValue: 'k=rsa;t=s;p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCbmGbQMzYeMvxwtNQoXN0waGYaciuKx8mtMh5czguT4EZlJXuCt6V+l56mmt3t68FEX5JJ0q4ijG71BGoFRkl87uJi7LrQt1ZZmZCvrEII0YO4mp8sDLXC8g1aUAoi8TJgxq2MJqCaMyj5kAm3Fdy2tzftPCV/lbdiJqmBnWKjtwIDAQAB',
        check: (data: string) => data.includes('k=rsa;') && data.includes('p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCbmGbQMzYeMvxwtNQoXN0waGYaciuKx8mtMh5czguT4EZlJXuCt6V+l56mmt3t68FEX5JJ0q4ijG71BGoFRkl87uJi7LrQt1ZZmZCvrEII0YO4mp8sDLXC8g1aUAoi8TJgxq2MJqCaMyj5kAm3Fdy2tzftPCV/lbdiJqmBnWKjtwIDAQAB'),
        host: 'api._domainkey',
    },
    Tracking: {
        type: 'CNAME',
        name: (domain: string) => `tracking.${domain}`,
        expectedValue: 'app.mailzila.com',
        check: (data: string) => data.includes('app.mailzila.com'),
        host: 'tracking',
    },
    DMARC: {
        type: 'TXT',
        name: (domain: string) => `_dmarc.${domain}`,
        expectedValue: 'v=DMARC1;p=none;pct=10;aspf=r;adkim=r;',
        check: (data: string) => data.includes('v=DMARC1'),
        host: '_dmarc',
    },
};

type VerificationStatus = 'idle' | 'checking' | 'verified' | 'failed';

const VerificationStatusIndicator = ({ status }: { status: VerificationStatus }) => {
    const { t } = useTranslation();
    switch (status) {
        case 'checking':
            return <span className="verification-status status-checking"><Icon path={ICONS.LOADING_SPINNER} className="icon-spinner" /> {t('checking')}</span>;
        case 'verified':
            return <span className="verification-status status-verified"><Icon path={ICONS.CHECK} className="icon-success" /> {t('verified')}</span>;
        case 'failed':
            return <span className="verification-status status-failed"><Icon path={ICONS.X_CIRCLE} className="icon-danger" /> {t('notVerified')}</span>;
        default:
            return null;
    }
};

const DomainVerificationChecker = ({ domainName }: { domainName: string }) => {
    const { t } = useTranslation();
    const [statuses, setStatuses] = useState<Record<string, { status: VerificationStatus }>>(
      Object.keys(DNS_RECORDS_CONFIG).reduce((acc, key) => ({ ...acc, [key]: { status: 'idle' } }), {})
    );
    const [isChecking, setIsChecking] = useState(false);

    const checkAllDns = async () => {
        setIsChecking(true);
        setStatuses(prev => Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: { status: 'checking' } }), {}));

        for (const [key, config] of Object.entries(DNS_RECORDS_CONFIG)) {
            try {
                const response = await fetch(`https://dns.google/resolve?name=${config.name(domainName)}&type=${config.type}`);
                if (!response.ok) {
                    throw new Error(`DNS lookup failed with status ${response.status}`);
                }
                const result = await response.json();
                
                let isVerified = false;
                if (result.Status === 0 && result.Answer) {
                    const foundRecord = result.Answer.find((ans: any) => config.check(ans.data.replace(/"/g, '')));
                    if (foundRecord) {
                        isVerified = true;
                    }
                }
                setStatuses(prev => ({ ...prev, [key]: { status: isVerified ? 'verified' : 'failed' } }));

            } catch (error) {
                console.error(`Error checking ${key}:`, error);
                setStatuses(prev => ({ ...prev, [key]: { status: 'failed' } }));
            }
        }
        setIsChecking(false);
    };

    return (
        <div className="domain-verification-checker">
            <button className="btn check-all-btn" onClick={checkAllDns} disabled={isChecking}>
                {isChecking ? <Loader /> : <Icon path={ICONS.VERIFY} />}
                {isChecking ? t('checkingDns') : t('checkDnsStatus')}
            </button>
            <div className="dns-records-list">
                {Object.entries(DNS_RECORDS_CONFIG).map(([key, config]) => (
                    <div className="dns-record-item" key={key}>
                        <div className="dns-record-item-header">
                            <h4>{t('recordType', { type: key })}</h4>
                            <VerificationStatusIndicator status={statuses[key]?.status} />
                        </div>
                        <div className="dns-record-details">
                            <div className="detail"><strong>{t('host')}:</strong> <code>{config.host}</code></div>
                            <div className="detail"><strong>{t('type')}:</strong> <code>{config.type}</code></div>
                            <div className="detail"><strong>{t('value')}:</strong> <code>{config.expectedValue}</code></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const DomainsView = ({ apiKey }: { apiKey: string }) => {
    const { t } = useTranslation();
    const [refetchIndex, setRefetchIndex] = useState(0);
    const [actionStatus, setActionStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);
    const [newDomain, setNewDomain] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [expandedDomain, setExpandedDomain] = useState<string | null>(null);

    const { data, loading, error } = useApiV4('/domains', apiKey, {}, refetchIndex);
    const refetch = () => {
        setExpandedDomain(null);
        setRefetchIndex(i => i + 1);
    }

    const handleAddDomain = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDomain) return;
        setIsSubmitting(true);
        try {
            await apiFetchV4('/domains', apiKey, { method: 'POST', body: { Domain: newDomain } });
            setActionStatus({ type: 'success', message: t('domainAddedSuccess', { domain: newDomain }) });
            setNewDomain('');
            refetch();
        } catch (err: any) {
            setActionStatus({ type: 'error', message: t('domainAddedError', { error: err.message }) });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleDeleteDomain = async (domainName: string) => {
        if (!window.confirm(t('confirmDeleteDomain', { domainName }))) return;
        try {
            await apiFetchV4(`/domains/${encodeURIComponent(domainName)}`, apiKey, { method: 'DELETE' });
            setActionStatus({ type: 'success', message: t('domainDeletedSuccess', { domainName }) });
            refetch();
        } catch (err: any) {
            setActionStatus({ type: 'error', message: t('domainDeletedError', { error: err.message }) });
        }
    };
    
    const domainsList = Array.isArray(data) ? data : (data && Array.isArray(data.Data)) ? data.Data : [];
    const isNotFoundError = error && (error.message.includes('Not Found') || error.message.includes('not found'));
    const showNoDomainsMessage = !loading && !error && domainsList.length === 0;

    return (
        <div>
            <ActionStatus status={actionStatus} onDismiss={() => setActionStatus(null)} />
             <div className="view-header">
                <form className="add-domain-form" onSubmit={handleAddDomain}>
                    <input
                        type="text"
                        placeholder="example.com"
                        value={newDomain}
                        onChange={e => setNewDomain(e.target.value)}
                        disabled={isSubmitting}
                    />
                    <button type="submit" className="btn btn-primary" disabled={!newDomain || isSubmitting}>
                        {isSubmitting ? <Loader /> : <><Icon path={ICONS.PLUS}/> {t('addDomain')}</>}
                    </button>
                </form>
            </div>
            {loading && <CenteredMessage><Loader /></CenteredMessage>}
            {error && !isNotFoundError && <ErrorMessage error={error} />}
            {showNoDomainsMessage && <CenteredMessage>{t('noDomainsFound')}</CenteredMessage>}
            
            {domainsList.length > 0 && <div className="card-grid domain-grid">
                {domainsList.map((domain: any) => {
                    const domainName = domain.Domain || domain.domain;
                    if (!domainName) return null;
                    
                    const isSpfVerified = String(domain.Spf || domain.spf).toLowerCase() === 'true';
                    const isDkimVerified = String(domain.Dkim || domain.dkim).toLowerCase() === 'true';
                    const isMxVerified = String(domain.MX || domain.mx).toLowerCase() === 'true';
                    const trackingStatus = domain.TrackingStatus || domain.trackingstatus;
                    const isTrackingVerified = String(trackingStatus).toLowerCase() === 'validated';
                    const isExpanded = expandedDomain === domainName;

                    return (
                        <div key={domainName} className="card domain-card">
                            <div className="domain-card-header">
                                <h3>{domainName}</h3>
                                <div className="action-buttons">
                                    <button className="btn-icon btn-icon-danger" onClick={() => handleDeleteDomain(domainName)} aria-label={t('deleteDomain', { domainName })}>
                                        <Icon path={ICONS.DELETE} />
                                    </button>
                                </div>
                            </div>
                            <div className="domain-card-body">
                                <div className="domain-card-statuses">
                                    <div><span>SPF</span> <Badge text={isSpfVerified ? t('verified') : t('missing')} type={isSpfVerified ? 'success' : 'warning'} /></div>
                                    <div><span>DKIM</span> <Badge text={isDkimVerified ? t('verified') : t('missing')} type={isDkimVerified ? 'success' : 'warning'} /></div>
                                    <div><span>Tracking</span> <Badge text={isTrackingVerified ? t('verified') : t('missing')} type={isTrackingVerified ? 'success' : 'warning'} /></div>
                                    <div><span>MX</span> <Badge text={isMxVerified ? t('verified') : t('missing')} type={isMxVerified ? 'success' : 'warning'} /></div>
                                </div>
                            </div>
                            <div className="domain-card-footer" onClick={() => setExpandedDomain(d => d === domainName ? null : domainName)} role="button" aria-expanded={isExpanded}>
                                <span>{t('showDnsAndVerify')}</span>
                                <Icon path={ICONS.CHEVRON_DOWN} className={isExpanded ? 'expanded' : ''} />
                            </div>
                            {isExpanded && <DomainVerificationChecker domainName={domainName} />}
                        </div>
                    )
                })}
            </div>}
        </div>
    );
};

const AddSmtpCredentialModal = ({ isOpen, onClose, apiKey, onSuccess }: { isOpen: boolean, onClose: () => void, apiKey: string, onSuccess: (data: any) => void }) => {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setName('');
            setError('');
            setIsSubmitting(false);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!name) {
            setError(t('credentialNameEmptyError'));
            return;
        }
        setIsSubmitting(true);
        try {
            const newCredential = await apiFetchV4('/security/smtp', apiKey, {
                method: 'POST',
                body: { Name: name }
            });
            onSuccess(newCredential);
        } catch (err: any) {
            setError(err.message || t('credentialCreateError'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('addSmtpCredentialTitle')}>
            <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-group">
                    <label htmlFor="credential-name">{t('credentialName')}</label>
                    <input
                        id="credential-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t('credentialNamePlaceholder')}
                        required
                        disabled={isSubmitting}
                    />
                     <small style={{ marginTop: '0.5rem', display: 'block' }}>
                        {t('credentialNameSubtitle')}
                    </small>
                </div>
                {error && <ActionStatus status={{ type: 'error', message: error }} onDismiss={() => setError('')} />}
                <div className="form-actions" style={{ marginTop: '1rem' }}>
                    <button type="button" className="btn" onClick={onClose} disabled={isSubmitting}>{t('cancel')}</button>
                    <button type="submit" className="btn btn-primary" disabled={isSubmitting || !name}>
                        {isSubmitting ? <Loader /> : t('createCredential')}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

const ShowNewSmtpKeyModal = ({ isOpen, onClose, credential }: { isOpen: boolean, onClose: () => void, credential: any }) => {
    const { t } = useTranslation();
    const [copied, setCopied] = useState(false);
    
    useEffect(() => {
        if (!isOpen) setCopied(false);
    }, [isOpen]);

    if (!credential) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(credential.ApiKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('credentialCreatedSuccessTitle')}>
            <div className="info-message warning">
                <Icon path={ICONS.COMPLAINT} style={{flexShrink: 0}} />
                <span>{t('copyApiKeyNotice')}</span>
            </div>
            <div className="new-api-key-display">
                <div className="form-group">
                    <label>{t('credentialName')}</label>
                    <input type="text" value={credential.Name} readOnly disabled />
                </div>
                 <div className="form-group">
                    <label>{t('apiKeyPassword')}</label>
                    <div className="secret-value-wrapper">
                        <input type="text" value={credential.ApiKey} readOnly />
                        <button className="btn" onClick={handleCopy}>
                            {copied ? t('copied') : t('copy')}
                        </button>
                    </div>
                </div>
            </div>
            <div className="form-actions" style={{justifyContent: 'flex-end', marginTop: '1.5rem'}}>
                <button className="btn btn-primary" onClick={onClose}>{t('done')}</button>
            </div>
        </Modal>
    );
};


const SmtpView = ({ apiKey, user }: { apiKey: string, user: any }) => {
    const { t, i18n } = useTranslation();
    const [refetchIndex, setRefetchIndex] = useState(1);
    const [actionStatus, setActionStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newlyCreatedCredential, setNewlyCreatedCredential] = useState<any>(null);
    const [isFeatureUnavailable, setIsFeatureUnavailable] = useState(false);

    const { data: credentials, loading, error } = useApiV4('/security/smtp', apiKey, {}, refetchIndex);
    const refetch = () => setRefetchIndex(i => i + 1);

    useEffect(() => {
        if (error && error.message.toLowerCase().includes('account not found')) {
            setIsFeatureUnavailable(true);
        } else if (!error) {
            setIsFeatureUnavailable(false);
        }
    }, [error]);

    const smtpDetails = {
        server: 'smtp.elasticemail.com',
        ports: '25, 2525, 587, 465 (SSL)'
    };
    
    if (!user) return <CenteredMessage><Loader /></CenteredMessage>;

    const handleAddSuccess = (newCredential: any) => {
        setIsAddModalOpen(false);
        setActionStatus({ type: 'success', message: t('credentialCreatedSuccess', { name: newCredential.Name }) });
        setNewlyCreatedCredential(newCredential);
        setIsFeatureUnavailable(false);
    };

    const handleCloseNewKeyModal = () => {
        setNewlyCreatedCredential(null);
        refetch();
    };

    const handleDelete = async (name: string) => {
        if (!window.confirm(t('confirmDeleteCredential', { name }))) return;
        try {
            await apiFetchV4(`/security/smtp/${encodeURIComponent(name)}`, apiKey, { method: 'DELETE' });
            setActionStatus({ type: 'success', message: t('credentialDeletedSuccess', { name }) });
            refetch();
        } catch (err: any) {
            setActionStatus({ type: 'error', message: t('credentialDeletedError', { error: err.message }) });
        }
    };
    
    const additionalCredentials = useMemo(() => {
        if (!Array.isArray(credentials)) return [];
        return credentials.filter((c: any) => c.AccessLevel !== 'AllAccess');
    }, [credentials]);

    return (
        <div>
            <ActionStatus status={actionStatus} onDismiss={() => setActionStatus(null)} />
            
            <AddSmtpCredentialModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                apiKey={apiKey}
                onSuccess={handleAddSuccess}
            />
            
            <ShowNewSmtpKeyModal 
                isOpen={!!newlyCreatedCredential}
                onClose={handleCloseNewKeyModal}
                credential={newlyCreatedCredential}
            />

            <div className="card smtp-card main-credential-card">
                <div className="smtp-card-header">
                    <h3>{t('mainAccountCredentials')}</h3>
                </div>
                <div className="smtp-card-body">
                    <div className="smtp-detail-item"><label>{t('server')}</label> <strong>{smtpDetails.server}</strong></div>
                    <div className="smtp-detail-item"><label>{t('ports')}</label> <strong>{smtpDetails.ports}</strong></div>
                    <div className="smtp-detail-item full-span"><label>{t('username')}</label> <strong className="monospace">{user.email}</strong></div>
                    <div className="smtp-detail-item full-span">
                        <label>{t('passwordMainApiKey')}</label>
                        <div className="secret-value-wrapper">
                            <input type="password" value={apiKey} readOnly />
                            <button className="btn" onClick={() => navigator.clipboard.writeText(apiKey)}>{t('copy')}</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="view-header" style={{borderTop: '1px solid var(--border-color)', marginTop: '2.5rem', paddingTop: '2.5rem'}}>
                <h3>{t('additionalCredentials')}</h3>
                <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)} disabled={isFeatureUnavailable}>
                    <Icon path={ICONS.PLUS} /> {t('addCredential')}
                </button>
            </div>
            {loading && <CenteredMessage><Loader /></CenteredMessage>}
            {isFeatureUnavailable ? (
                <div className="info-message warning">
                    <Icon path={ICONS.COMPLAINT} style={{ flexShrink: 0, marginTop: '0.2rem' }} />
                    <div>
                        <strong>{t('featureNotAvailableTitle')}</strong>
                        <p style={{ color: 'var(--subtle-text-color)', margin: '0.25rem 0 0', padding: 0 }}>
                            {t('smtpFeatureNotAvailable')}
                        </p>
                    </div>
                </div>
            ) : error ? (
                <ErrorMessage error={error} />
            ) : additionalCredentials.length === 0 ? (
                <CenteredMessage>{t('noAdditionalCredentials')}</CenteredMessage>
            ) : (
                <div className="card-grid smtp-additional-grid">
                    {additionalCredentials.map((cred: any) => (
                        <div key={cred.Name} className="card smtp-additional-card">
                            <div className="card-header">
                                <h4>{cred.Name}</h4>
                                <div className="action-buttons">
                                    <button className="btn-icon btn-icon-danger" onClick={() => handleDelete(cred.Name)} aria-label={t('delete')}>
                                        <Icon path={ICONS.DELETE} />
                                    </button>
                                </div>
                            </div>
                            <div className="card-body">
                                <div className="smtp-additional-detail">
                                    <label>{t('accessLevel')}</label>
                                    <span>{cred.AccessLevel}</span>
                                </div>
                                <div className="smtp-additional-detail">
                                    <label>{t('dateAdded')}</label>
                                    <span>{formatDateForDisplay(cred.DateCreated, i18n.language)}</span>
                                </div>
                                <div className="smtp-additional-detail">
                                    <label>{t('lastUsed')}</label>
                                    <span>{formatDateForDisplay(cred.LastUse, i18n.language)}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- AUTH / ONBOARDING ---

const AuthView = () => {
    const { login, loginWithApiKey, register } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isApiKeyLogin, setIsApiKeyLogin] = useState(false);
    const { t } = useTranslation();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        try {
            if (isApiKeyLogin) {
                await loginWithApiKey(data.apikey as string);
            } else if (isLogin) {
                await login({ email: data.email, password: data.password });
            } else {
                if (data.password !== data.confirm_password) {
                    throw new Error(t('passwordsDoNotMatch'));
                }
                await register({ email: data.email, password: data.password, first_name: data.first_name });
            }
        } catch (err: any) {
            setError(err.message || t('unknownError'));
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="auth-container">
            <div className="auth-box">
                <h1><span className="logo-font">Mailzila</span></h1>
                <p>
                    {isApiKeyLogin ? t('signInWithApiKeySubtitle') : (isLogin ? t('signInSubtitle') : t('createAccountSubtitle'))}
                </p>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {error && <ActionStatus status={{ type: 'error', message: error }} onDismiss={() => setError('')} />}

                    {isApiKeyLogin ? (
                        <div className="input-group">
                            <input name="apikey" type={showPassword ? "text" : "password"} placeholder={t('enterYourApiKey')} required />
                            <button type="button" className="input-icon-btn" onClick={() => setShowPassword(!showPassword)}>
                                <Icon path={showPassword ? ICONS.EYE_OFF : ICONS.EYE} />
                            </button>
                        </div>
                    ) : (
                        <div className="form-grid" style={{gridTemplateColumns: '1fr', gap: '1rem'}}>
                            {!isLogin && (
                                <input name="first_name" type="text" placeholder={t('firstName')} required />
                            )}
                            <input name="email" type="email" placeholder={t('emailAddress')} required />
                            <div className="input-group">
                                <input name="password" type={showPassword ? "text" : "password"} placeholder={t('password')} required />
                                <button type="button" className="input-icon-btn" onClick={() => setShowPassword(!showPassword)}>
                                    <Icon path={showPassword ? ICONS.EYE_OFF : ICONS.EYE} />
                                </button>
                            </div>
                            {!isLogin && (
                                 <input name="confirm_password" type="password" placeholder={t('confirmPassword')} required />
                            )}
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? <Loader /> : (isLogin ? t('signIn') : t('createAccount'))}
                    </button>
                </form>

                <div className="auth-separator">{t('or')}</div>

                <button className="btn btn-secondary" onClick={() => setIsApiKeyLogin(!isApiKeyLogin)}>
                    {isApiKeyLogin ? t('signInWithEmail') : t('signInWithApiKey')}
                </button>

                <div className="auth-switch">
                    {isLogin ? t('noAccount') : t('alreadyHaveAccount')}
                    <button onClick={() => setIsLogin(!isLogin)}>{isLogin ? t('signUp') : t('signIn')}</button>
                </div>
            </div>
        </div>
    );
};

const OnboardingView = () => {
    const { updateUser, user, logout } = useAuth();
    const [apiKey, setApiKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { t } = useTranslation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await apiFetch('/account/load', apiKey); // Validate key
            await updateUser({ elastic_email_api_key: apiKey });
        } catch (err: any) {
            setError(err.message || t('invalidApiKey'));
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="auth-container">
            <div className="auth-box">
                 <h1>{t('welcomeOnboard', {name: user.first_name})}</h1>
                 <p>{t('onboardingSubtitle')}</p>
                 <form onSubmit={handleSubmit}>
                    {error && <ActionStatus status={{ type: 'error', message: error }} onDismiss={() => setError('')} />}
                    <input name="apikey" type="password" placeholder={t('enterYourApiKey')} value={apiKey} onChange={e => setApiKey(e.target.value)} required />
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? <Loader /> : t('saveAndContinue')}
                    </button>
                 </form>
                 <div className="auth-switch">
                    <button className="link-button" onClick={logout}>{t('logOut')}</button>
                 </div>
            </div>
        </div>
    );
};


// --- Main App Component ---
const App = () => {
    const { isAuthenticated, loading, user, logout } = useAuth();
    const { t, i18n } = useTranslation();
    const [view, setView] = useState('Dashboard');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        document.documentElement.lang = i18n.language;
        document.documentElement.dir = i18n.dir();
    }, [i18n.language, i18n.dir]);

    if (loading) {
        return <CenteredMessage style={{height: '100vh'}}><Loader /></CenteredMessage>;
    }

    if (!isAuthenticated) {
        return <AuthView />;
    }
    
    const apiKey = user?.elastic_email_api_key;
    if (!apiKey) {
        return <OnboardingView />;
    }

    const handleLogout = () => {
        logout();
        setView('Dashboard');
    };

    const handleSetView = (newView: string) => {
        setView(newView);
        setIsMobileMenuOpen(false);
    }
    
    const views: Record<string, { component: ReactNode, title: string, icon: string }> = {
        'Dashboard': { component: <DashboardView setView={handleSetView} apiKey={apiKey} user={user} />, title: t('dashboard'), icon: ICONS.DASHBOARD },
        'Statistics': { component: <StatisticsView apiKey={apiKey} />, title: t('statistics'), icon: ICONS.STATISTICS },
        'Account': { component: <AccountView apiKey={apiKey} user={user} />, title: t('account'), icon: ICONS.ACCOUNT },
        'Buy Credits': { component: <BuyCreditsView apiKey={apiKey} user={user} />, title: t('buyCredits'), icon: ICONS.BUY_CREDITS },
        'Contacts': { component: <ContactsView apiKey={apiKey} />, title: t('contacts'), icon: ICONS.CONTACTS },
        'Email Lists': { component: <EmailListView apiKey={apiKey} />, title: t('emailLists'), icon: ICONS.EMAIL_LISTS },
        'Segments': { component: <SegmentsView apiKey={apiKey} />, title: t('segments'), icon: ICONS.SEGMENTS },
        'Send Email': { component: <SendEmailView apiKey={apiKey} user={user} />, title: t('sendEmail'), icon: ICONS.SEND_EMAIL },
        'Campaigns': { component: <CampaignsView apiKey={apiKey} />, title: t('campaigns'), icon: ICONS.CAMPAIGNS },
        'Domains': { component: <DomainsView apiKey={apiKey} />, title: t('domains'), icon: ICONS.DOMAINS },
        'SMTP': { component: <SmtpView apiKey={apiKey} user={user}/>, title: t('smtp'), icon: ICONS.SMTP }
    };

    const navItems = [
        { name: t('dashboard'), view: 'Dashboard', icon: ICONS.DASHBOARD },
        { name: t('statistics'), view: 'Statistics', icon: ICONS.STATISTICS },
        { name: t('contacts'), view: 'Contacts', icon: ICONS.CONTACTS },
        { name: t('emailLists'), view: 'Email Lists', icon: ICONS.EMAIL_LISTS },
        { name: t('segments'), view: 'Segments', icon: ICONS.SEGMENTS },
        { name: t('campaigns'), view: 'Campaigns', icon: ICONS.CAMPAIGNS },
        { name: t('sendEmail'), view: 'Send Email', icon: ICONS.SEND_EMAIL },
        { name: t('domains'), view: 'Domains', icon: ICONS.DOMAINS },
        { name: t('smtp'), view: 'SMTP', icon: ICONS.SMTP },
    ];
    
    const SidebarContent = () => (
      <>
        <div className="sidebar-header">
            <span className="logo-font">Mailzila</span>
        </div>
        <nav className="nav">
            {navItems.map(item => (
                <button key={item.view} onClick={() => handleSetView(item.view)} className={`nav-btn ${view === item.view ? 'active' : ''}`}>
                    <Icon path={item.icon} />
                    <span>{item.name}</span>
                </button>
            ))}
        </nav>
        <div className="sidebar-footer-nav">
             <button onClick={() => handleSetView('Buy Credits')} className={`nav-btn ${view === 'Buy Credits' ? 'active' : ''}`}>
                <Icon path={ICONS.BUY_CREDITS} />
                <span>{t('buyCredits')}</span>
             </button>
             <button onClick={() => handleSetView('Account')} className={`nav-btn ${view === 'Account' ? 'active' : ''}`}>
                 <Icon path={ICONS.ACCOUNT} />
                 <span>{t('account')}</span>
             </button>
            <button onClick={handleLogout} className="nav-btn logout-btn">
                <Icon path={ICONS.LOGOUT} />
                <span>{t('logout')}</span>
            </button>
        </div>
      </>
    );

    return (
        <div className={`app-container ${isMobileMenuOpen ? 'mobile-menu-open' : ''}`}>
            <div className="mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>
            <aside className="sidebar">
                <SidebarContent />
            </aside>
            <div className="main-wrapper">
                <header className="mobile-header">
                     <button className="mobile-menu-toggle" onClick={() => setIsMobileMenuOpen(true)} aria-label={t('openMenu')}>
                        <Icon path={ICONS.MENU} />
                    </button>
                    <h1 className="mobile-header-title">{views[view]?.title || 'Mailzila'}</h1>
                    <div className="mobile-header-placeholder"></div>
                </header>
                <main className="content">
                    <header className="content-header">
                        <h2>{views[view]?.title}</h2>
                    </header>
                    {views[view]?.component}
                </main>
            </div>
        </div>
    );
};

const root = createRoot(document.getElementById('root')!);
root.render(
    <React.StrictMode>
        <Suspense fallback={<CenteredMessage style={{height: '100vh'}}><Loader /></CenteredMessage>}>
            <I18nextProvider i18n={i18n}>
                <ThemeProvider>
                    <AuthProvider>
                        <App />
                    </AuthProvider>
                </ThemeProvider>
            </I18nextProvider>
        </Suspense>
    </React.StrictMode>
);