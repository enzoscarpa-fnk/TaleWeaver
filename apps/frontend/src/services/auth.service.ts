import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface User {
    id: string;
    email: string;
    role: 'USER' | 'ADMIN';
    createdAt: string;
    updatedAt: string;
}

export interface AuthResponse {
    user: User;
}

class AuthService {
    async signup(email: string, password: string): Promise<AuthResponse> {
        const response = await axios.post<AuthResponse>(
            `${API_URL}/auth/signup`,
            { email, password },
            { withCredentials: true }
        );
        return response.data;
    }

    async login(email: string, password: string): Promise<AuthResponse> {
        const response = await axios.post<AuthResponse>(
            `${API_URL}/auth/login`,
            { email, password },
            { withCredentials: true }
        );
        return response.data;
    }

    async getMe(): Promise<AuthResponse> {
        const response = await axios.get<AuthResponse>(
            `${API_URL}/auth/me`,
            { withCredentials: true }
        );
        return response.data;
    }

    async logout(): Promise<void> {
        await axios.post(
            `${API_URL}/auth/logout`,
            {},
            { withCredentials: true }
        );
    }

    async changePassword(currentPassword: string, newPassword: string): Promise<void> {
        await axios.post(
            `${API_URL}/auth/change-password`,
            { currentPassword, newPassword },
            { withCredentials: true }
        );
    }
}

export const authService = new AuthService();

