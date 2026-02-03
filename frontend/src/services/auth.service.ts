import { apiClient } from '../api/client';
import type { LoginRequest, LoginResponse } from '../types/auth.types';

export const authService = {
    async login(credentials: LoginRequest): Promise<LoginResponse> {
        const response = await apiClient.post<LoginResponse>('/auth/login', credentials);

        if (response.token) {
            localStorage.setItem('token', response.token);
        }

        return response;
    },

    logout() {
        localStorage.removeItem('token');
    },

    getToken(): string | null {
        return localStorage.getItem('token');
    }
};
