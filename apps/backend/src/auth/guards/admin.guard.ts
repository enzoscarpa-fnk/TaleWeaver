import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import type { Request } from 'express';

interface User {
    id: string;
    email: string;
    role: 'USER' | 'ADMIN';
}

@Injectable()
export class AdminGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest<Request & { user?: User }>();
        const user = request.user;

        if (!user) {
            throw new ForbiddenException('Accès refusé');
        }

        if (user.role !== 'ADMIN') {
            throw new ForbiddenException('Accès réservé aux administrateurs');
        }

        return true;
    }
}

