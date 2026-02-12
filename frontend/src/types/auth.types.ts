export interface LoginRequest {
    email?: string;
    password?: string;
    username?: string; // Pour le register éventuellement
}

export interface User {
    id: string;
    email: string;
    username: string;
    elo: number;
    avatar?: string;
    roles: string[];
}

export interface LoginResponse {
    token: string;
    user?: User; // Si l'API retourne l'user directement
}

export interface RegisterRequest {
    email: string;
    username: string;
    password: string;
}
