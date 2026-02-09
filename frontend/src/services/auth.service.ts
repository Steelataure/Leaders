import { apiClient } from '../api/client';
import type { LoginRequest, LoginResponse, User, RegisterRequest } from '../types/auth.types';

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

    async register(data: RegisterRequest): Promise<LoginResponse> {
        const response = await apiClient.post<LoginResponse>('/auth/register', data);
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
        if (userStr) {
            try {
                return JSON.parse(userStr);
            } catch {
                return null;
            }
        }

        // Fallback for Guest Users (sessionStorage)
        const guestId = sessionStorage.getItem('guest_id');
        if (guestId) {
            return {
                id: guestId,
                username: "Joueur", // Default guest name
                email: "",
                elo: 1000,
                roles: []
            };
        }

        return null;
    },

    async getProfile(userId: string): Promise<User> {
        const user = await apiClient.get<User>(`/auth/me?userId=${userId}`);

        if (user) {
            localStorage.setItem('user', JSON.stringify(user));
        }


        return user;
    },

    async getLeaderboard(): Promise<User[]> {
        return await apiClient.get<User[]>('/auth/leaderboard');
    }
};
