// En production Docker (ou local), le backend est sur le port 8080
// On utilise une variable d'environnement ou une valeur par défaut absolue
const BASE_URL = import.meta.env.VITE_API_URL || 'https://zefallk-api.on.esiea.cloud/api';

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
