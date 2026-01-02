import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserResponseDto } from '../auth/dto/user-response.dto';
import * as bcrypt from 'bcrypt';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AdminService {
    constructor(private prisma: PrismaService) {}

    async getAllUsers(): Promise<UserResponseDto[]> {
        const users = await this.prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
        });

        return users.map((user) => new UserResponseDto(user));
    }

    async getUserById(id: string): Promise<UserResponseDto | null> {
        const user = await this.prisma.user.findUnique({
            where: { id },
        });

        if (!user) {
            return null;
        }

        return new UserResponseDto(user);
    }

    async updateUserRole(id: string, role: 'USER' | 'ADMIN'): Promise<UserResponseDto> {
        const user = await this.prisma.user.findUnique({
            where: { id },
        });

        if (!user) {
            throw new NotFoundException('Utilisateur non trouvé');
        }

        const updatedUser = await this.prisma.user.update({
            where: { id },
            data: { role },
        });

        return new UserResponseDto(updatedUser);
    }

    async deleteUser(id: string): Promise<void> {
        const user = await this.prisma.user.findUnique({
            where: { id },
        });

        if (!user) {
            throw new NotFoundException('Utilisateur non trouvé');
        }

        await this.prisma.user.delete({
            where: { id },
        });
    }

    async resetUserPassword(id: string, resetPasswordDto: ResetPasswordDto): Promise<void> {
        const user = await this.prisma.user.findUnique({
            where: { id },
        });

        if (!user) {
            throw new NotFoundException('Utilisateur non trouvé');
        }

        // Hasher le nouveau mot de passe
        const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);

        // Mettre à jour le mot de passe
        await this.prisma.user.update({
            where: { id },
            data: { password: hashedPassword },
        });
    }
}

