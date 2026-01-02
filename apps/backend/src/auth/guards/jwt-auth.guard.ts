import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(private authService: AuthService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const token = request.cookies?.sessionToken;

        if (!token) {
            throw new UnauthorizedException('Session invalide');
        }

        const user = await this.authService.validateSession(token);
        if (!user) {
            throw new UnauthorizedException('Session expirée ou invalide');
        }

        // Ajouter l'utilisateur à la requête
        request.user = user;
        return true;
    }
}

