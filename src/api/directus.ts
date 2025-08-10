import { DIRECTUS_URL } from './config';

export const directusFetch = async (endpoint: string, options: RequestInit = {}) => {
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
