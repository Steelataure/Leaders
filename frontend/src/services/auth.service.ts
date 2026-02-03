import { apiClient } from '../api/client';
import type { LoginRequest, LoginResponse, User } from '../types/auth.types';

export const authService = {
    async login(credentials: LoginRequest): Promise<LoginResponse> {
        const response = await apiClient.post<LoginResponse>('/auth/login', credentials);

        if (response.token) {
            localStorage.setItem('token', response.token);
        }

        if (response.user) {
            localStorage.setItem('user', JSON.stringify(response.user));
        }

        return response;
    },

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    getToken(): string | null {
        return localStorage.getItem('token');
    },

    getUser(): User | null {
        const userStr = localStorage.getItem('user');
        if (!userStr) return null;
        try {
            return JSON.parse(userStr);
        } catch {
            return null;
        }
    }
};
