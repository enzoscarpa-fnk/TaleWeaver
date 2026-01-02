import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService) {}

    async signup(signupDto: SignupDto): Promise<UserResponseDto> {
        const { email, password } = signupDto;

        // Vérifier si l'utilisateur existe déjà
        const existingUser = await this.prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            throw new ConflictException('Cet email est déjà utilisé');
        }

        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Créer l'utilisateur
        const user = await this.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
            },
        });

        return new UserResponseDto(user);
    }

    async validateUser(email: string, password: string): Promise<any> {
        const user = await this.prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return null;
        }

        // Retourner l'utilisateur sans le mot de passe
        const { password: _, ...result } = user;
        return result;
    }

    async createSession(userId: string): Promise<string> {
        // Générer un token unique
        const token = randomBytes(32).toString('hex');
        
        // Date d'expiration : 7 jours pour les utilisateurs connectés
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await this.prisma.session.create({
            data: {
                userId,
                token,
                expiresAt,
            },
        });

        return token;
    }

    async validateSession(token: string): Promise<any> {
        const session = await this.prisma.session.findUnique({
            where: { token },
            include: { user: true },
        });

        if (!session) {
            return null;
        }

        // Vérifier si la session a expiré
        if (new Date() > session.expiresAt) {
            await this.prisma.session.delete({
                where: { id: session.id },
            });
            return null;
        }

        const { password: _, ...userWithoutPassword } = session.user;
        return userWithoutPassword;
    }

    async deleteSession(token: string): Promise<void> {
        await this.prisma.session.deleteMany({
            where: { token },
        });
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

    async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
        const { currentPassword, newPassword } = changePasswordDto;

        // Récupérer l'utilisateur
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new UnauthorizedException('Utilisateur non trouvé');
        }

        // Vérifier le mot de passe actuel
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Mot de passe actuel incorrect');
        }

        // Vérifier que le nouveau mot de passe est différent
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            throw new BadRequestException('Le nouveau mot de passe doit être différent de l\'ancien');
        }

        // Hasher le nouveau mot de passe
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Mettre à jour le mot de passe
        await this.prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });
    }
}

