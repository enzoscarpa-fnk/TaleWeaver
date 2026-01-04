import axios from 'axios';
import { User } from './auth.service';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class AdminService {
    async getAllUsers(): Promise<User[]> {
        const response = await axios.get<User[]>(
            `${API_URL}/api/admin/users`,
            { withCredentials: true }
        );
        return response.data;
    }

    async getUserById(id: string): Promise<User | null> {
        const response = await axios.get<User>(
            `${API_URL}/api/admin/users/${id}`,
            { withCredentials: true }
        );
        return response.data;
    }

    async updateUserRole(id: string, role: 'USER' | 'ADMIN'): Promise<User> {
        const response = await axios.patch<User>(
            `${API_URL}/api/admin/users/${id}/role`,
            { role },
            { withCredentials: true }
        );
        return response.data;
    }

    async deleteUser(id: string): Promise<void> {
        await axios.delete(
            `${API_URL}/api/admin/users/${id}`,
            { withCredentials: true }
        );
    }

    async resetUserPassword(id: string, newPassword: string): Promise<void> {
        await axios.post(
            `${API_URL}/api/admin/users/${id}/reset-password`,
            { newPassword },
            { withCredentials: true }
        );
    }
}

export const adminService = new AdminService();


