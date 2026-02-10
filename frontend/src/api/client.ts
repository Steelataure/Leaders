declare global {
    interface Window {
        config?: {
            API_URL?: string;
        };
    }
}

const getBaseUrl = () => {
    // FORCE /api proxy on localhost to use local backend (via Vite proxy)
    // This overrides any VITE_API_URL that might point to production
    if (window.location.hostname === 'localhost') {
        return '/api';
    }

    // If we're NOT on localhost, we MUST use the Nginx proxy (/api)
    // to avoid CORS and port issues in production.
    if (window.location.hostname !== 'localhost') {
        return '/api';
    }

    // Fallback for other environments? (Likely unreachable given above logic, but kept for safety)
    const url = window.config?.API_URL || import.meta.env.VITE_API_URL || '';
    if (!url) return '/api';

    // Normalize: remove trailing slash
    let normalized = url.replace(/\/$/, '');

    // Ensure /api suffix if missing from absolute URL
    if (!normalized.startsWith('/') && !normalized.endsWith('/api') && !normalized.includes('/api/')) {
        normalized += '/api';
    }

    return normalized;
};

const BASE_URL = getBaseUrl();

export const apiClient = {
    async post<T>(endpoint: string, data: unknown): Promise<T> {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        return response.json();
    },

    async get<T>(endpoint: string, token?: string): Promise<T> {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'GET',
            headers,
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        return response.json();
    }
};
